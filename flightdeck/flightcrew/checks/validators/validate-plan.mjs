// flightcrew/checks/validators/validate-plan.mjs — validates one plan against plan.schema.json and the plan rules, resolving the pinned tests map, the pinned spec and the ceilings from the launch the plan belongs to.
// Usage: node flightdeck/flightcrew/checks/validators/validate-plan.mjs <plan.json> [--spec <file>] [--map <file>] [--strict]
//
// Exports: implementerMaxTurns() → the maxTurns of flightcrew/crew/implementer.md, or null when the file is absent;
// checkPlan(file, options) → { plan, errors: [{ rule, message }], warnings }; main(argv).
// Rule ids are the schema keywords and plan-rule-1 … plan-rule-12: 1 a check id absent from the pinned map; 2 a spec
// ref absent from the pinned spec; 3 depends_on naming a unit outside an earlier wave; 4 no single contracts unit in
// the serial wave W0 while no_contracts is unset; 5 no pilot in the first parallel wave; 6 an empty abandon_triggers;
// 7 a parallel wave above implementers_concurrent; 8 budget_turns above turns_per_agent, or turns_per_agent above the
// implementer's maxTurns; 9 expected_cost.agents above ceilings.agents; 10 expected_cost.tokens above the token
// ceiling, compared only when both are present; 11 a unit with no checks; 12 shape differing from the kickoff's
// shape part. A risk sourced from the run log names a heading that must exist, as a warning.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { loadSchema, validate } from '../lib/schema-lib.mjs';
import { liveIds, loadSpec } from '../lib/spec-lib.mjs';
import { launchFile, readLaunch, resolveLaunch, resolveRoot } from '../lib/launch-lib.mjs';

const USAGE = 'usage: validate-plan.mjs <plan.json> [--spec <file>] [--map <file>] [--strict]';
const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The command line this validator accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, spec: null, map: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg === '--strict') opts.strict = true;
    else if (arg === '--spec' || arg === '--map') {
      const key = arg.slice(2);
      i += 1;
      if (argv[i] === undefined) throw new Error(`${arg} needs a file`);
      opts[key] = String(argv[i]);
    } else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no plan given');
  return opts;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`${file} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

/** The launch folder a file sits in: the nearest ancestor carrying launch.json, else the launch the environment resolves. */
function findLaunchFor(file, { env = process.env, cwd = process.cwd() } = {}) {
  let dir = path.dirname(path.resolve(file));
  for (let depth = 0; depth < 8; depth += 1) {
    if (isFile(launchFile(dir))) {
      try {
        return { dir, json: readLaunch(dir) };
      } catch {
        return { dir, json: null };
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const { launchDir } = resolveRoot({ env, cwd, scriptDir: HERE });
    const found = resolveLaunch({ env, launchDir });
    return { dir: found.dir, json: found.json };
  } catch {
    return null;
  }
}

/** The maxTurns declared in the implementer's frontmatter, or null when the crew file is not there to read. */
export function implementerMaxTurns(file = path.resolve(HERE, '..', '..', 'crew', 'implementer.md')) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const body = frontmatter ? frontmatter[1] : text.split('\n').slice(0, 40).join('\n');
  const named = /^\s*maxTurns\s*:\s*(\d+)\s*$/m.exec(body);
  return named ? Number(named[1]) : null;
}

/** The '<x>' of the 'shape-<x>@<n>' part of a kickoff version string, or null when the string names no shape part. */
export function shapeOfKickoff(version) {
  for (const part of String(version ?? '').split('+')) {
    const named = /^shape-([A-Za-z0-9-]+)(?:@\d+)?$/.exec(part.trim());
    if (named) return named[1];
  }
  return null;
}

/** The headings of the run log, as the text after '## ' on each heading line. An absent file has none. */
function runlogHeadings(root) {
  if (!root) return null;
  const file = path.join(root, 'flightdeck', 'launch', 'RUNLOG.md');
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
  return text.split('\n').filter((line) => line.startsWith('## ')).map((line) => line.slice(3).trim());
}

/** Every violation of one plan: the schema keywords first, then plan-rule-1 … plan-rule-12 in order. */
export function checkPlan(file, { spec = null, map = null, env = process.env, cwd = process.cwd() } = {}) {
  const plan = readJson(file);
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });

  for (const e of validate(loadSchema('plan'), plan).errors) error(e.rule, e.message);

  const launch = findLaunchFor(file, { env, cwd });
  const launchJson = launch?.json ?? null;
  const ceilings = launchJson?.ceilings ?? null;

  const mapPath = map
    ? path.resolve(map)
    : (launch && typeof launchJson?.tests_map?.path === 'string' ? path.resolve(launch.dir, launchJson.tests_map.path) : null);
  const specPath = spec
    ? path.resolve(spec)
    : (launch && typeof launchJson?.spec?.path === 'string' ? path.resolve(launch.dir, launchJson.spec.path) : null);

  let mapDoc = null;
  if (mapPath && isFile(mapPath)) {
    try {
      mapDoc = readJson(mapPath);
    } catch {
      mapDoc = null;
    }
  }
  let specDoc = null;
  if (specPath && isFile(specPath)) {
    try {
      specDoc = loadSpec(specPath);
    } catch {
      specDoc = null;
    }
  }

  const units = Array.isArray(plan.units) ? plan.units.filter((u) => u && typeof u === 'object') : [];
  const waves = Array.isArray(plan.waves) ? plan.waves.filter((w) => w && typeof w === 'object') : [];
  const waveOf = new Map();
  waves.forEach((wave, index) => {
    for (const id of wave.units ?? []) if (!waveOf.has(String(id))) waveOf.set(String(id), index);
  });

  // 1: every check a unit names exists in the pinned map.
  if (mapDoc) {
    const known = new Set((Array.isArray(mapDoc.checks) ? mapDoc.checks : []).map((c) => String(c?.id)));
    for (const unit of units) {
      for (const id of unit.checks ?? []) {
        if (!known.has(String(id))) error('plan-rule-1', `unit ${unit.id ?? '?'} names check ${id}, which the pinned tests map does not carry`);
      }
    }
  }

  // 2: every spec ref a unit names is a live node of the pinned spec.
  if (specDoc) {
    const grouped = liveIds(specDoc);
    const live = new Set(Object.values(grouped).flat());
    for (const unit of units) {
      for (const id of unit.spec_refs ?? []) {
        if (!live.has(String(id))) error('plan-rule-2', `unit ${unit.id ?? '?'} names spec ref ${id}, which is not a live node of the pinned spec`);
      }
    }
  }

  // 3: depends_on names units in earlier waves.
  for (const unit of units) {
    const here = waveOf.get(String(unit.id));
    for (const id of unit.depends_on ?? []) {
      const there = waveOf.get(String(id));
      if (there === undefined) {
        error('plan-rule-3', `unit ${unit.id ?? '?'} depends_on ${id}, which no wave holds`);
      } else if (here !== undefined && there >= here) {
        error('plan-rule-3', `unit ${unit.id ?? '?'} depends_on ${id}, which is not in an earlier wave`);
      }
    }
  }

  // 4: exactly one contracts unit in the serial wave W0, unless no_contracts states why there is none.
  if (!plan.no_contracts) {
    const w0 = waves.find((wave) => String(wave.id) === 'W0');
    if (!w0) error('plan-rule-4', 'no wave W0; a run without a contracts wave carries no_contracts with its reason');
    else {
      if (w0.mode !== 'serial') error('plan-rule-4', `wave W0 has mode ${w0.mode}; the contracts wave runs serially`);
      const contracts = units.filter((u) => (w0.units ?? []).map(String).includes(String(u.id)) && u.kind === 'contracts');
      if (contracts.length !== 1) {
        error('plan-rule-4', `wave W0 holds ${contracts.length} units of kind contracts; it holds exactly one unless no_contracts is set`);
      }
    }
  }

  // 5: the first parallel wave carries at least one pilot unit.
  const firstParallel = waves.find((wave) => wave.mode === 'parallel');
  if (firstParallel) {
    const members = (firstParallel.units ?? []).map(String);
    const pilots = units.filter((u) => members.includes(String(u.id)) && u.pilot === true);
    if (pilots.length === 0) {
      error('plan-rule-5', `the first parallel wave ${firstParallel.id} holds no unit marked pilot; a pilot unit runs before the rest of its wave`);
    }
  }

  // 6: the plan states at least one abandon trigger.
  if (!Array.isArray(plan.abandon_triggers) || plan.abandon_triggers.length === 0) {
    error('plan-rule-6', 'abandon_triggers is empty; a run states at least one condition that stops it');
  }

  // 7: a parallel wave holds no more units than implementers_concurrent.
  const concurrent = typeof ceilings?.implementers_concurrent === 'number' ? ceilings.implementers_concurrent : null;
  if (concurrent !== null) {
    for (const wave of waves) {
      if (wave.mode !== 'parallel') continue;
      const size = (wave.units ?? []).length;
      if (size > concurrent) {
        error('plan-rule-7', `parallel wave ${wave.id} holds ${size} units, above implementers_concurrent ${concurrent}`);
      }
    }
  }

  // 8: budget_turns <= turns_per_agent <= the implementer's maxTurns.
  const perAgent = typeof ceilings?.turns_per_agent === 'number' ? ceilings.turns_per_agent : null;
  const maxTurns = implementerMaxTurns();
  for (const unit of units) {
    const turns = typeof unit.budget_turns === 'number' ? unit.budget_turns : null;
    if (turns === null) continue;
    if (perAgent !== null && turns > perAgent) {
      error('plan-rule-8', `unit ${unit.id ?? '?'} asks for budget_turns ${turns}, above turns_per_agent ${perAgent}`);
    }
    if (maxTurns !== null && turns > maxTurns) {
      error('plan-rule-8', `unit ${unit.id ?? '?'} asks for budget_turns ${turns}, above the implementer's maxTurns ${maxTurns}`);
    }
  }
  if (perAgent !== null && maxTurns !== null && perAgent > maxTurns) {
    error('plan-rule-8', `turns_per_agent ${perAgent} is above the implementer's maxTurns ${maxTurns}`);
  }

  // 9: the expected agent count fits inside the ceiling.
  const agents = plan.expected_cost?.agents;
  if (typeof agents === 'number' && typeof ceilings?.agents === 'number' && agents > ceilings.agents) {
    error('plan-rule-9', `expected_cost.agents ${agents} is above ceilings.agents ${ceilings.agents}`);
  }

  // 10: tokens are compared only when the plan and the ceiling both state one.
  const tokens = plan.expected_cost?.tokens;
  const tokenCeiling = ceilings?.tokens;
  if (typeof tokens === 'number' && typeof tokenCeiling === 'number' && tokens > tokenCeiling) {
    error('plan-rule-10', `expected_cost.tokens ${tokens} is above ceilings.tokens ${tokenCeiling}`);
  }

  // 11: every unit names at least one check.
  for (const unit of units) {
    if (!Array.isArray(unit.checks) || unit.checks.length === 0) {
      error('plan-rule-11', `unit ${unit.id ?? '?'} names no checks; a unit is proven by the checks it names`);
    }
  }

  // 12: the shape matches the kickoff's shape part.
  const kickoffVersion = launchJson?.kickoff?.version ?? plan.kickoff_version;
  const kickoffShape = shapeOfKickoff(kickoffVersion);
  if (kickoffShape !== null && plan.shape !== undefined && plan.shape !== kickoffShape) {
    error('plan-rule-12', `shape ${plan.shape} differs from the kickoff's shape part shape-${kickoffShape}`);
  }

  // A risk taken from the run log names a heading that is there to read. Judgement, so a warning.
  const headings = runlogHeadings(launch ? path.resolve(launch.dir, '..', '..', '..') : null);
  if (headings) {
    for (const risk of Array.isArray(plan.risks) ? plan.risks : []) {
      const source = String(risk?.source ?? '');
      if (!/runlog|run log/i.test(source)) continue;
      const named = source.replace(/^\s*run\s*log\s*[:·-]?\s*/i, '').trim();
      if (named && !headings.some((heading) => heading.includes(named))) {
        warnings.push(`risk sourced from the run log names ${named}, which is not a heading of flightdeck/launch/RUNLOG.md`);
      }
    }
  }

  return { plan, map: mapDoc, spec: specDoc, errors, warnings };
}

/** Prints the violations and returns the exit code. */
export function report({ errors = [], warnings = [] }, { strict = false, okLine = null } = {}) {
  for (const e of errors) fail(`error: ${e.message} — [${e.rule}]`);
  for (const w of warnings) warn(w);
  if (errors.length > 0) return EXIT.blocked;
  if (strict && warnings.length > 0) return EXIT.blocked;
  if (okLine && warnings.length === 0) print(okLine);
  return EXIT.ok;
}

/** Runs the validator over one file. Returns the exit code rather than exiting, so fc can call it in process. */
export function main(argv = [], { env = process.env, cwd = process.cwd() } = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  let result;
  try {
    result = checkPlan(opts.file, { spec: opts.spec, map: opts.map, env, cwd });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid plan` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
