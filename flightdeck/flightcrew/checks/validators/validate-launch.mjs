// flightcrew/checks/validators/validate-launch.mjs — validates one launch.json against launch.schema.json and the launch rules the schema cannot express: the pointers it records, its spec pin, and the locks a phase past targets relies on.
// Usage: node flightdeck/flightcrew/checks/validators/validate-launch.mjs <launch.json> [--resolve-commits] [--strict]
//
// Exports: checkLaunch(file, { resolveCommits, env, cwd }) → { launch, errors: [{ rule, message }], warnings };
// main(argv) → the exit code, printing the lines. Rule ids are the schema keywords and launch-rule-1 … launch-rule-5:
// 1 every path the launch records resolves to a file; 2 spec.commit equals the pinned spec file's own commit header;
// 3 a phase past targets with enforce_boundary true carries a lock_commit and a non-empty allowed list; 4 the pinned
// tests map's spec pin agrees with the launch's; 5 every recorded hash resolves in the repository, checked only under
// --resolve-commits (hash shape alone is checked otherwise). Exit 0, or 2 on any error and on any warning under
// --strict. Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { loadSchema, validate } from '../lib/schema-lib.mjs';
import { PHASES } from '../lib/launch-lib.mjs';
import { resolveCommit, toplevel } from '../lib/git-lib.mjs';

const USAGE = 'usage: validate-launch.mjs <launch.json> [--resolve-commits] [--strict]';

/** The command line this validator accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, resolveCommits: false, strict: false };
  for (const raw of argv) {
    const arg = String(raw);
    if (arg === '--resolve-commits') opts.resolveCommits = true;
    else if (arg === '--strict') opts.strict = true;
    else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no launch.json given');
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

/** True when two hashes name the same commit: 7 to 40 hex compared by prefix (design section 4). */
function sameCommit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a === '' || b === '') return false;
  return a.startsWith(b) || b.startsWith(a);
}

/** Every { field, hash } the launch records, for the shape and the resolution checks. */
function recordedHashes(launch) {
  const pairs = [
    ['base_commit', launch?.base_commit],
    ['lock_commit', launch?.lock_commit],
    ['spec.commit', launch?.spec?.commit],
    ['spec.file_commit', launch?.spec?.file_commit],
    ['tests_map.commit', launch?.tests_map?.commit],
    ['landed.commit', launch?.landed?.commit],
  ];
  return pairs.filter(([, hash]) => typeof hash === 'string' && hash !== '').map(([field, hash]) => ({ field, hash }));
}

/**
 * Every violation of one launch.json: the schema keywords first, then the launch rules. Paths are resolved against
 * the launch folder the file sits in, and hashes are resolved in the repository holding it, so the validator judges
 * a launch by the tree it is stored in rather than by the caller's working directory.
 */
export function checkLaunch(file, { resolveCommits = false } = {}) {
  const launch = readJson(file);
  const dir = path.dirname(path.resolve(file));
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });

  for (const e of validate(loadSchema('launch'), launch).errors) error(e.rule, e.message);

  // 1: every pointer the launch records resolves to a file inside the launch folder.
  const pointers = [
    ['spec.path', launch?.spec?.path],
    ['tests_map.path', launch?.tests_map?.path],
    ['kickoff.path', launch?.kickoff?.path],
  ];
  for (const [field, value] of pointers) {
    if (typeof value !== 'string' || value === '') continue;
    if (!isFile(path.resolve(dir, value))) {
      error('launch-rule-1', `${field} names ${value}, which is not a file in the launch folder`);
    }
  }

  // 2: spec.commit is the pinned spec file's own commit header.
  const specPath = typeof launch?.spec?.path === 'string' ? path.resolve(dir, launch.spec.path) : null;
  const pinned = launch?.spec?.commit ?? null;
  if (specPath && isFile(specPath)) {
    let spec = null;
    try {
      spec = readJson(specPath);
    } catch (error_) {
      error('launch-rule-2', error_.message);
    }
    if (spec) {
      const header = typeof spec.commit === 'string' ? spec.commit : null;
      if (pinned === null && header !== null) {
        error('launch-rule-2', `spec.commit is null but ${launch.spec.path} carries the commit header ${header}`);
      } else if (typeof pinned === 'string' && header === null) {
        error('launch-rule-2', `spec.commit is ${pinned} but ${launch.spec.path} carries no commit header`);
      } else if (typeof pinned === 'string' && header !== null && !sameCommit(pinned, header)) {
        error('launch-rule-2', `spec.commit is ${pinned} but ${launch.spec.path} carries the commit header ${header}`);
      }
    }
  }

  // 3: a phase past targets that enforces the boundary carries a lock and an allowed list.
  const phaseAt = PHASES.indexOf(launch?.phase);
  const pastTargets = phaseAt > PHASES.indexOf('targets');
  if (pastTargets && launch?.paths?.enforce_boundary === true) {
    if (typeof launch?.lock_commit !== 'string' || launch.lock_commit === '') {
      error('launch-rule-3', `phase ${launch.phase} enforces the boundary but lock_commit is not recorded`);
    }
    if (!Array.isArray(launch?.paths?.allowed) || launch.paths.allowed.length === 0) {
      error('launch-rule-3', `phase ${launch.phase} enforces the boundary but paths.allowed is empty`);
    }
  }

  // 4: the pinned tests map names the spec the launch pins.
  const mapPath = typeof launch?.tests_map?.path === 'string' ? path.resolve(dir, launch.tests_map.path) : null;
  if (mapPath && isFile(mapPath)) {
    let map = null;
    try {
      map = readJson(mapPath);
    } catch (error_) {
      error('launch-rule-4', error_.message);
    }
    if (map) {
      const pin = map.spec ?? {};
      if (pin.name !== undefined && launch?.spec?.name !== undefined && pin.name !== launch.spec.name) {
        error('launch-rule-4', `the pinned tests map names spec ${pin.name} but the launch pins ${launch.spec.name}`);
      }
      if (pin.version !== undefined && launch?.spec?.version !== undefined && Number(pin.version) !== Number(launch.spec.version)) {
        error('launch-rule-4', `the pinned tests map names spec version ${pin.version} but the launch pins v${launch.spec.version}`);
      }
    }
  }

  // 5: every recorded hash resolves in the repository, on request. Shape alone is the schema's business.
  if (resolveCommits) {
    const root = toplevel(dir);
    if (!root) {
      error('launch-rule-5', `--resolve-commits was passed but ${dir} is not inside a git repository`);
    } else {
      for (const { field, hash } of recordedHashes(launch)) {
        if (!resolveCommit(root, hash)) {
          error('launch-rule-5', `${field} is ${hash}, which does not resolve to a commit in ${path.basename(root)}`);
        }
      }
    }
  }

  return { launch, errors, warnings };
}

/** Prints the violations and returns the exit code: 2 on any error, 2 on a warning under --strict, 0 otherwise. */
export function report({ errors = [], warnings = [] }, { strict = false, okLine = null } = {}) {
  for (const e of errors) fail(`error: ${e.message} — [${e.rule}]`);
  for (const w of warnings) warn(w);
  if (errors.length > 0) return EXIT.blocked;
  if (strict && warnings.length > 0) return EXIT.blocked;
  if (okLine && warnings.length === 0) print(okLine);
  return EXIT.ok;
}

/** Runs the validator over one file. Returns the exit code rather than exiting, so fc can call it in process. */
export function main(argv = []) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  let result;
  try {
    result = checkLaunch(opts.file, { resolveCommits: opts.resolveCommits });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid launch` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
