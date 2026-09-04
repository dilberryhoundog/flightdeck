// flightcrew/workflows/fc-review.js — runs the review loop of one launch: a fresh critic pass, the routable findings back to the implementer that owns each file, a re-verification, then a fresh pass, up to the critic_passes ceiling.
// Usage: /fc-review with args { launch, spec_path, critic_prompt_path, units, critic_passes, timestamp, model? }; it dispatches and returns payloads only — the orchestrator stores each pass with fc return critic and each fix with fc return worker.

export const meta = {
  name: 'fc-review',
  description: 'Run the critic, fix and re-verify loop of a launch up to its critic-passes ceiling, stopping on a spec conflict.',
  phases: [
    { title: 'Review', detail: 'a fresh critic over the diff since the lock' },
    { title: 'Fix', detail: 'one implementer per unit that owns a routable finding' },
    { title: 'Re-verify', detail: 'the checks re-run over the fixed tree' },
  ],
};

const CRITIC_FINDINGS = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "flightcrew/schemas/critic-findings.schema.json",
  "title": "Critic findings",
  "description": "launch/<L>/review/pass-<n>.json: one critic pass over the diff since lock_commit against the pinned spec. Pass files are never edited; a later state change to a finding is written to review/resolutions.json by fc return critic --resolve, and the report joins the two.",
  "type": "object",
  "required": [
    "verdict",
    "pass",
    "findings"
  ],
  "additionalProperties": false,
  "properties": {
    "verdict": {
      "type": "string",
      "enum": [
        "no gaps",
        "gaps"
      ]
    },
    "pass": {
      "type": "integer",
      "minimum": 1
    },
    "findings": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "kind",
          "severity",
          "spec_ref",
          "file",
          "line",
          "text",
          "state",
          "resolved_commit",
          "dispute"
        ],
        "additionalProperties": false,
        "properties": {
          "id": {
            "type": "string",
            "pattern": "^F[0-9]+$"
          },
          "kind": {
            "type": "string",
            "enum": [
              "correctness-gap",
              "scope-violation",
              "spec-conflict",
              "observation"
            ]
          },
          "severity": {
            "type": "string",
            "enum": [
              "blocking",
              "non-blocking"
            ]
          },
          "spec_ref": {
            "type": [
              "string",
              "null"
            ],
            "description": "The spec node the finding is measured against."
          },
          "file": {
            "type": [
              "string",
              "null"
            ]
          },
          "line": {
            "type": [
              "integer",
              "null"
            ],
            "minimum": 0
          },
          "text": {
            "type": "string",
            "minLength": 1
          },
          "state": {
            "type": "string",
            "enum": [
              "open",
              "resolved",
              "disputed"
            ]
          },
          "resolved_commit": {
            "type": [
              "string",
              "null"
            ],
            "pattern": "^[0-9a-f]{7,40}$"
          },
          "dispute": {
            "type": [
              "string",
              "null"
            ]
          }
        }
      }
    }
  }
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

const VERIFIER_VERDICT = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "flightcrew/schemas/verifier-verdict.schema.json",
  "title": "Verifier verdict",
  "description": "launch/<L>/returns/verify-<n>.json: one verifier's attempt to refute the recorded evidence by re-running the checks on the merged branch. refuted true means at least one recorded verdict did not reproduce, and reasons says which.",
  "type": "object",
  "required": [
    "refuted",
    "checks_rerun",
    "reasons",
    "unverified",
    "test_file_changes",
    "outside_boundary"
  ],
  "additionalProperties": false,
  "properties": {
    "refuted": {
      "type": "boolean"
    },
    "checks_rerun": {
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
    "reasons": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
    },
    "unverified": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "description": "Spec node ids no check proves."
    },
    "test_file_changes": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "description": "Changed paths under a locked path."
    },
    "outside_boundary": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      }
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

/** The glob dialect of the plan and the launch: ** at any depth, * within a segment, ? one character, a leading / anchoring at the repository root, a trailing / covering everything below. */
function covers(glob, file) {
  if (typeof glob !== 'string' || typeof file !== 'string') return false;
  const trailing = glob.endsWith('/') ? `${glob}**` : glob;
  const pattern = trailing.startsWith('/') ? trailing.slice(1) : trailing;
  let body = '';
  for (let i = 0; i < pattern.length; i += 1) {
    const c = pattern[i];
    if (c === '*' && pattern[i + 1] === '*') {
      body += '.*';
      i += 1;
    } else if (c === '*') body += '[^/]*';
    else if (c === '?') body += '[^/]';
    else body += /[.+^${}()|[\]\\]/.test(c) ? `\\${c}` : c;
  }
  const anchored = pattern.includes('/') ? `^${body}$` : `^(.*/)?${body}$`;
  return new RegExp(anchored).test(file.replace(/^\.?\//, ''));
}

/** The plan unit whose paths hold this finding's file, or null when no unit owns it. */
function owner(units, file) {
  if (!file) return null;
  return units.find((unit) => (unit.paths ?? []).some((glob) => covers(glob, file))) ?? null;
}

function criticPrompt(pass) {
  return [
    `Review pass ${pass} of launch ${args.launch}.`,
    `Read ${args.critic_prompt_path} and follow it exactly; it holds your mandate, the pinned spec at ${args.spec_path}, the diff since the lock, the evidence and the locked-path list.`,
    'Assume the diff contains at least one gap and look for it, within the mandate that prompt states. If there are none, return the verdict no gaps.',
  ].join('\n\n');
}

function fixPrompt(unit, findings) {
  const lines = findings.map((finding) => `${finding.id} [${finding.kind}, ${finding.severity}] ${finding.file ?? 'unknown file'}:${finding.line ?? '?'} — ${finding.text}${finding.spec_ref ? ` (spec ${finding.spec_ref})` : ''}`);
  return [
    `unit: ${unit.id}`,
    `A fresh critic found gaps in the work of unit ${unit.id} (${unit.name}) of launch ${args.launch}. Read ${unit.prompt_path} (committed on the run branch) for this unit's brief and ${args.spec_path} for the pinned spec.`,
    'Close these findings and nothing else:',
    lines.join('\n'),
    `Re-run the unit's checks (${(unit.checks ?? []).join(' ') || 'none listed'}) before returning. Return the worker return shape. A finding you believe is wrong is a halt with the kind test-contradicts-spec and your reasoning, not a silent skip.`,
  ].join('\n\n');
}

function verifyPrompt(pass) {
  return [
    `Re-verify launch ${args.launch} after the fixes of review pass ${pass}.`,
    'Re-run every check of the pinned tests map, compare each verdict with the recorded evidence, and look for changes under the locked paths or outside the allowed paths.',
    'Set refuted true when a recorded verdict does not reproduce, when a locked check changed, or when a change lies outside the boundary. Change nothing.',
  ].join('\n\n');
}

const units = Array.isArray(args.units) ? args.units : [];
const ceiling = Number.isInteger(args.critic_passes) && args.critic_passes > 0 ? args.critic_passes : 1;
const passes = [];
const fixes = [];
const verifications = [];
let escalation = null;
let trigger = null;
let unrouted = [];

for (let pass = 1; pass <= ceiling; pass += 1) {
  phase('Review');
  const criticOptions = { label: `critic pass ${pass}`, phase: 'Review', schema: CRITIC_FINDINGS, agentType: 'critic' };
  if (args.model) criticOptions.model = args.model;
  const found = await agent(criticPrompt(pass), criticOptions);
  const bad = found === null || found === undefined ? ['no return arrived'] : violations(found, CRITIC_FINDINGS);
  if (bad.length > 0) {
    escalation = { kind: 'halt', detail: `review pass ${pass}: the critic return did not match the critic findings shape — ${bad.join('; ')}` };
    break;
  }
  passes.push(found);
  const open = (found.findings ?? []).filter((finding) => finding.state === 'open');
  const conflicts = open.filter((finding) => finding.kind === 'spec-conflict');
  if (conflicts.length > 0) {
    escalation = { kind: 'spec-gap', detail: `review pass ${pass}: ${conflicts.map((finding) => `${finding.id} ${finding.text}`).join(' | ')}` };
    break;
  }
  const routable = open.filter((finding) => finding.kind === 'correctness-gap' || finding.kind === 'scope-violation');
  if (routable.length === 0) {
    log(`pass ${pass}: ${found.verdict}, nothing to route`);
    break;
  }
  const blocking = routable.filter((finding) => finding.severity === 'blocking');
  if (pass === ceiling && blocking.length > 0) {
    trigger = { name: 'critic passes spent with blocking findings open', detail: `${blocking.map((finding) => finding.id).join(' ')} still open after pass ${pass} of ${ceiling}` };
    break;
  }
  const groups = new Map();
  unrouted = [];
  for (const finding of routable) {
    const unit = owner(units, finding.file);
    if (!unit) {
      unrouted.push(finding);
      continue;
    }
    if (!groups.has(unit.id)) groups.set(unit.id, { unit, findings: [] });
    groups.get(unit.id).findings.push(finding);
  }
  if (unrouted.length > 0) log(`pass ${pass}: ${unrouted.length} finding(s) own no unit and go back to the orchestrator`);
  if (groups.size === 0) break;
  phase('Fix');
  const fixOptions = (unit) => {
    const options = { label: `fix ${unit.id}`, phase: 'Fix', schema: WORKER_RETURN, agentType: 'implementer', isolation: 'worktree' };
    if (args.model) options.model = args.model;
    return options;
  };
  const groupList = [...groups.values()];
  const batch = await parallel(groupList.map((group) => () => agent(fixPrompt(group.unit, group.findings), fixOptions(group.unit))));
  groupList.forEach((group, i) => {
    const value = batch[i];
    const problems = value === null || value === undefined ? ['no return arrived'] : violations(value, WORKER_RETURN);
    fixes.push({ pass, unit: group.unit.id, findings: group.findings.map((finding) => finding.id), value: problems.length === 0 ? value : null, problems });
  });
  const halted = fixes.filter((fix) => fix.pass === pass && (fix.value === null || fix.value.status === 'halt'));
  if (halted.length > 0) {
    escalation = { kind: 'halt', detail: `review pass ${pass}: ${halted.map((fix) => fix.unit).join(' ')} halted instead of fixing` };
    break;
  }
  phase('Re-verify');
  const verdict = await agent(verifyPrompt(pass), { label: `re-verify after pass ${pass}`, phase: 'Re-verify', schema: VERIFIER_VERDICT, agentType: 'verifier' });
  const verdictProblems = verdict === null || verdict === undefined ? ['no return arrived'] : violations(verdict, VERIFIER_VERDICT);
  verifications.push({ pass, value: verdictProblems.length === 0 ? verdict : null, problems: verdictProblems });
  if (verdictProblems.length === 0 && verdict.refuted === true) {
    escalation = { kind: 'blocked', detail: `review pass ${pass}: the re-verification refuted the evidence — ${(verdict.reasons ?? []).join('; ')}` };
    break;
  }
}

const result = {
  workflow: 'fc-review',
  launch: args.launch,
  timestamp: args.timestamp ?? null,
  passes,
  fixes,
  verifications,
  unrouted,
  observations: passes.flatMap((found) => (found.findings ?? []).filter((finding) => finding.kind === 'observation')),
  escalation,
  trigger,
};

log(escalation ? `escalation: ${escalation.kind}` : trigger ? `trigger: ${trigger.name}` : `${passes.length} critic pass(es) run`);

export default result;
