// flightcrew/workflows/fc-implement.js — dispatches one launch's implementer agents wave by wave: pilot units first, then the rest in chunks of implementers_concurrent, validating every return and stopping on the first halt.
// Usage: /fc-implement with args { launch, units: [{id, name, prompt_path, checks, depends_on, pilot}], implementers_concurrent, timestamp, agent_type?, model? }; it dispatches and returns payloads only — the orchestrator stores each one with fc return and lands units with fc worker merge.

export const meta = {
  name: 'fc-implement',
  description: 'Dispatch the implementer agents of a launch wave by wave, pilots first and the rest in chunks, halting on the first halt return.',
  phases: [
    { title: 'Pilots', detail: 'the pilot units of each wave, before the rest of that wave' },
    { title: 'Units', detail: 'the remaining units of each wave, in chunks of implementers_concurrent' },
  ],
};

const WORKER_RETURN = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "flightcrew/schemas/worker-return.schema.json",
  "title": "Worker return",
  "description": "launch/<L>/returns/<unit>.json: what one implementer did with one unit. status green means every named check passed on the unit branch; red means it did not; halt means the unit stopped and says why. fc worker merge acts on a green return only.",
  "type": "object",
  "required": [
    "unit",
    "status",
    "branch",
    "worktree",
    "spec_refs",
    "checks",
    "artefacts",
    "commits",
    "iterations",
    "halt",
    "notes"
  ],
  "additionalProperties": false,
  "properties": {
    "unit": {
      "type": "string",
      "minLength": 1
    },
    "status": {
      "type": "string",
      "enum": [
        "green",
        "red",
        "halt"
      ]
    },
    "branch": {
      "type": "string",
      "description": "The unit branch, <launch>/<unit name>."
    },
    "worktree": {
      "type": "string",
      "description": "The worktree the unit was built in."
    },
    "spec_refs": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "checks": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "exit"
        ],
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^T[0-9]+$"
          },
          "exit": {
            "type": [
              "integer",
              "null"
            ]
          }
        }
      }
    },
    "artefacts": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "description": "Repository-relative paths the unit wrote."
    },
    "commits": {
      "type": "array",
      "items": {
        "type": "string",
        "pattern": "^[0-9a-f]{7,40}$"
      }
    },
    "iterations": {
      "type": "integer",
      "minimum": 0
    },
    "halt": {
      "type": [
        "object",
        "null"
      ],
      "required": [
        "kind",
        "detail"
      ],
      "additionalProperties": false,
      "properties": {
        "kind": {
          "type": "string",
          "enum": [
            "test-contradicts-spec",
            "unsatisfiable",
            "blocked",
            "budget",
            "boundary"
          ]
        },
        "detail": {
          "type": "string",
          "minLength": 1
        }
      }
    },
    "notes": {
      "type": "string"
    }
  }
};

/** Violations of the subset of JSON Schema these return shapes use, as one message per problem. */
function violations(value, node, at = 'value') {
  const out = [];
  if (!node || typeof node !== 'object') return out;
  const types = Array.isArray(node.type) ? node.type : node.type ? [node.type] : [];
  const actual = value === null ? 'null' : Array.isArray(value) ? 'array' : Number.isInteger(value) ? 'integer' : typeof value;
  if (types.length > 0 && !types.some((t) => t === actual || (t === 'number' && actual === 'integer'))) {
    out.push(`${at}: expected ${types.join(' or ')}, got ${actual}`);
    return out;
  }
  if (Array.isArray(node.enum) && !node.enum.some((option) => option === value)) out.push(`${at}: ${JSON.stringify(value)} is outside the enumeration`);
  if (typeof value === 'string') {
    if (node.pattern && !new RegExp(node.pattern).test(value)) out.push(`${at}: does not match ${node.pattern}`);
    if (typeof node.minLength === 'number' && value.length < node.minLength) out.push(`${at}: shorter than ${node.minLength}`);
  }
  if (typeof value === 'number' && typeof node.minimum === 'number' && value < node.minimum) out.push(`${at}: below ${node.minimum}`);
  if (Array.isArray(value) && node.items) value.forEach((item, i) => out.push(...violations(item, node.items, `${at}[${i}]`)));
  if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of node.required ?? []) if (!Object.prototype.hasOwnProperty.call(value, key)) out.push(`${at}.${key}: required`);
    const properties = node.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      if (properties[key]) out.push(...violations(child, properties[key], `${at}.${key}`));
      else if (node.additionalProperties === false) out.push(`${at}.${key}: not allowed`);
    }
  }
  return out;
}

/** The units grouped into waves: a unit runs one wave after the deepest unit it depends on. */
function waves(units) {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const depth = new Map();
  const of = (unit, seen) => {
    if (depth.has(unit.id)) return depth.get(unit.id);
    if (seen.has(unit.id)) return 0;
    seen.add(unit.id);
    let level = 0;
    for (const id of unit.depends_on ?? []) if (byId.has(id)) level = Math.max(level, of(byId.get(id), seen) + 1);
    depth.set(unit.id, level);
    return level;
  };
  for (const unit of units) of(unit, new Set());
  const levels = [...new Set(units.map((unit) => depth.get(unit.id)))].sort((a, b) => a - b);
  return levels.map((level) => units.filter((unit) => depth.get(unit.id) === level));
}

/** list split into runs of at most size, size below one meaning one at a time. */
function chunks(list, size) {
  const width = Number.isInteger(size) && size > 0 ? size : 1;
  const out = [];
  for (let i = 0; i < list.length; i += width) out.push(list.slice(i, i + width));
  return out;
}

function dispatch(unit, launch) {
  return [
    `unit: ${unit.id}`,
    `You are building one unit of launch ${launch}. Read ${unit.prompt_path} (committed on the run branch) and follow it exactly; it is your whole brief.`,
    `Work on branch ${launch}/${unit.name} in your own worktree, run the checks it names (${(unit.checks ?? []).join(' ') || 'none listed'}) with the launch-local fc, and change nothing outside the paths it lists.`,
    'Return the worker return shape. Use status halt, with the kind and a precise detail, rather than editing a check or working outside your paths.',
  ].join('\n\n');
}

function haltReturn(unit, launch, detail) {
  return {
    unit: unit.id,
    status: 'halt',
    branch: `${launch}/${unit.name}`,
    worktree: '',
    spec_refs: [],
    checks: [],
    artefacts: [],
    commits: [],
    iterations: 0,
    halt: { kind: 'budget', detail },
    notes: 'Synthesised by fc-implement: no valid return arrived from the dispatched agent.',
  };
}

const launch = args.launch;
const units = Array.isArray(args.units) ? args.units : [];
const width = args.implementers_concurrent;
const agentType = args.agent_type ?? 'implementer';
const model = args.model;
const returns = [];
let stopper = null;

async function build(unit, group) {
  const options = { label: `${unit.id} ${unit.name}`, phase: group, schema: WORKER_RETURN, agentType, isolation: 'worktree' };
  if (model) options.model = model;
  const value = await agent(dispatch(unit, launch), options);
  if (value === null || value === undefined) return haltReturn(unit, launch, `${unit.id}: the dispatched agent returned nothing`);
  const bad = violations(value, WORKER_RETURN);
  if (bad.length > 0) return haltReturn(unit, launch, `${unit.id}: the return did not match the worker return shape — ${bad.join('; ')}`);
  return value;
}

async function run(list, group) {
  for (const part of chunks(list, width)) {
    const batch = await parallel(part.map((unit) => () => build(unit, group)));
    part.forEach((unit, i) => returns.push(batch[i] ?? haltReturn(unit, launch, `${unit.id}: the dispatch did not complete`)));
    const stopped = returns.find((value) => value.status === 'halt');
    if (stopped) return stopped;
    const red = returns.find((value) => value.status === 'red');
    if (red && group === 'Pilots') return red;
  }
  return null;
}

for (const wave of waves(units)) {
  if (stopper) break;
  const pilots = wave.filter((unit) => unit.pilot === true);
  const rest = wave.filter((unit) => unit.pilot !== true);
  if (pilots.length > 0) {
    phase('Pilots');
    log(`pilot units: ${pilots.map((unit) => unit.id).join(' ')}`);
    const stopped = await run(pilots, 'Pilots');
    if (stopped) {
      stopper = stopped;
      break;
    }
  }
  if (rest.length > 0) {
    phase('Units');
    log(`units: ${rest.map((unit) => unit.id).join(' ')} in chunks of ${width}`);
    const stopped = await run(rest, 'Units');
    if (stopped) stopper = stopped;
  }
}

const result = {
  workflow: 'fc-implement',
  launch,
  timestamp: args.timestamp ?? null,
  dispatched: returns.length,
  returns,
  halt: stopper && stopper.status === 'halt' ? stopper : null,
  stopped_on: stopper ? stopper.unit : null,
};

log(stopper ? `stopped at ${stopper.unit} with status ${stopper.status}` : `${returns.length} units returned`);

export default result;
