// flightcrew/checks/validators/validate-tests-map.mjs — validates one tests map against tests-map.schema.json, the thirteen map invariants and the coverage rule, against the spec its own pin names.
// Usage: node flightdeck/flightcrew/checks/validators/validate-tests-map.mjs <tests-map.vN.json> [--spec <file>] [--strict]
//
// Exports: findSpecFor(file, { spec, env, cwd }) → the pinned spec's path or null; findLaunchFor(file, { env, cwd })
// → { dir, json } or null; checkTestsMap(file, options) → { map, errors: [{ rule, message }], warnings }; main(argv).
// Rule ids are the schema keywords and tm-invariant-1 … tm-invariant-13, plus tm-coverage for the coverage rule the
// schema's description states beside the invariants. The pinned spec is located by the map's own spec pin: the file
// spec.v<version>.json beside the map, else the spec path of the launch the map sits in, else --spec. allow_draft on
// that launch waives tm-invariant-12. Exit 0, or 2 on any error and on any warning under --strict.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { loadSchema, validate } from '../lib/schema-lib.mjs';
import { liveIds, loadSpec } from '../lib/spec-lib.mjs';
import { launchFile, readLaunch, resolveLaunch, resolveRoot } from '../lib/launch-lib.mjs';

const USAGE = 'usage: validate-tests-map.mjs <tests-map.vN.json> [--spec <file>] [--strict]';
const COVERED_PREFIXES = ['B', 'E', 'C', 'I'];
const ID_SHAPE = /^T([0-9]+)$/;

/** The command line this validator accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, spec: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg === '--strict') opts.strict = true;
    else if (arg === '--spec') {
      i += 1;
      if (argv[i] === undefined) throw new Error('--spec needs a file');
      opts.spec = String(argv[i]);
    } else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no tests map given');
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

/**
 * The launch folder a file sits in: the nearest ancestor carrying launch.json, else the launch the environment
 * resolves (FLIGHTCREW_LAUNCH, then the unique active launch under the root FLIGHTCREW_ROOT, CLAUDE_PROJECT_DIR, the
 * git toplevel of cwd or the repository holding this script name). Returns { dir, json } or null.
 */
export function findLaunchFor(file, { env = process.env, cwd = process.cwd() } = {}) {
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
    const { launchDir } = resolveRoot({ env, cwd, scriptDir: path.dirname(fileURLToPath(import.meta.url)) });
    const found = resolveLaunch({ env, launchDir });
    return { dir: found.dir, json: found.json };
  } catch {
    return null;
  }
}

/** The pinned spec file for a map: --spec, else spec.v<pin version>.json beside the map, else the launch's spec copy. */
export function findSpecFor(file, { map = null, spec = null, env = process.env, cwd = process.cwd(), launch = undefined } = {}) {
  if (spec) return path.resolve(spec);
  const doc = map ?? readJson(file);
  const version = doc?.spec?.version;
  const beside = path.join(path.dirname(path.resolve(file)), `spec.v${version}.json`);
  if (isFile(beside)) return beside;
  const found = launch === undefined ? findLaunchFor(file, { env, cwd }) : launch;
  const relative = found?.json?.spec?.path;
  if (found && typeof relative === 'string') {
    const inLaunch = path.resolve(found.dir, relative);
    if (isFile(inLaunch)) return inLaunch;
  }
  return null;
}

function firstWord(text) {
  const token = String(text ?? '').trim().split(/\s+/)[0] ?? '';
  return token.replace(/[:,.;]+$/, '');
}

/**
 * Every violation of one tests map: the schema keywords, then tm-invariant-1 … tm-invariant-13 in order, then the
 * coverage rule. The spec the map pins supplies the live node ids the coverage rule and tm-invariant-12 need; when it
 * cannot be found, both say so rather than passing silently.
 */
export function checkTestsMap(file, { spec = null, env = process.env, cwd = process.cwd() } = {}) {
  const map = readJson(file);
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });

  for (const e of validate(loadSchema('tests-map'), map).errors) error(e.rule, e.message);

  const checks = Array.isArray(map.checks) ? map.checks.filter((c) => c && typeof c === 'object') : [];
  const retired = Array.isArray(map.retired) ? map.retired.filter((r) => r && typeof r === 'object') : [];
  const unverified = new Set((Array.isArray(map.unverified) ? map.unverified : []).map((u) => u?.id).filter(Boolean));
  const version = typeof map.version === 'number' ? map.version : null;
  const frozen = map.status === 'frozen';

  // 1: every check id carries the T prefix.
  for (const check of checks) {
    if (!ID_SHAPE.test(String(check.id ?? ''))) {
      error('tm-invariant-1', `check id ${check.id ?? '(absent)'} does not carry the T prefix`);
    }
  }

  // 2: check ids are unique.
  const seen = new Set();
  const reported = new Set();
  for (const check of checks) {
    const id = String(check.id ?? '');
    if (seen.has(id)) {
      if (!reported.has(id)) {
        reported.add(id);
        error('tm-invariant-2', `check id ${id} is used more than once`);
      }
    } else seen.add(id);
  }

  // 3: live plus retired ids form an unbroken 1..N.
  const numbers = new Set();
  for (const id of [...checks.map((c) => c.id), ...retired.map((r) => r.id)]) {
    const parsed = ID_SHAPE.exec(String(id ?? ''));
    if (parsed) numbers.add(Number(parsed[1]));
  }
  if (numbers.size > 0) {
    const highest = Math.max(...numbers);
    const missing = [];
    for (let n = 1; n <= highest; n += 1) if (!numbers.has(n)) missing.push(`T${n}`);
    if (missing.length > 0) {
      error('tm-invariant-3', `the check ids run to T${highest} but ${missing.join(', ')} appear in neither checks nor retired`);
    }
  }

  // 4: a v1 map has every check ok and nothing retired.
  if (version === 1) {
    for (const check of checks) {
      if (check.status !== undefined && check.status !== 'ok') {
        error('tm-invariant-4', `v1 check ${check.id ?? '?'} has status ${check.status}; a v1 map has nothing to be new or changed against`);
      }
    }
    if (retired.length > 0) {
      error('tm-invariant-4', `v1 carries ${retired.length} retired entr${retired.length === 1 ? 'y' : 'ies'}; nothing can be retired from a first version`);
    }
  }

  // 5: a check whose status is not ok carries a note.
  for (const check of checks) {
    if (check.status !== undefined && check.status !== 'ok' && !check.note) {
      error('tm-invariant-5', `check ${check.id ?? '?'} has status ${check.status} and carries no note`);
    }
  }

  // 6: commit is present exactly when the map is frozen.
  if (frozen && map.commit === undefined) error('tm-invariant-6', 'status is frozen but commit is absent');
  if (map.status === 'draft' && map.commit !== undefined) error('tm-invariant-6', `status is draft but commit ${map.commit} is set`);

  // 7: a retired entry's at falls between 2 and the map version.
  for (const entry of retired) {
    const at = typeof entry.at === 'number' ? entry.at : null;
    if (at === null) continue;
    if (at < 2 || (version !== null && at > version)) {
      error('tm-invariant-7', `retired check ${entry.id ?? '?'} names version ${at}; a removal falls between 2 and ${version ?? 'the map version'}`);
    }
  }

  // 8: every retired entry's covers is remapped to a live check or listed in unverified.
  const liveCovers = new Set();
  for (const check of checks) for (const id of check.covers ?? []) liveCovers.add(String(id));
  for (const entry of retired) {
    for (const id of entry.covers ?? []) {
      const covered = liveCovers.has(String(id)) || unverified.has(String(id));
      if (!covered) {
        error('tm-invariant-8', `retired check ${entry.id ?? '?'} covered ${id}, which no live check covers and unverified does not list`);
      }
    }
  }

  // 9: previous_versions is newest first, strictly descending, and covers every earlier version.
  const lineage = Array.isArray(map.previous_versions) ? map.previous_versions.filter((e) => e && typeof e === 'object') : [];
  let previous = null;
  for (const entry of lineage) {
    const v = typeof entry.v === 'number' ? entry.v : null;
    if (v === null) continue;
    if (version !== null && v >= version) {
      error('tm-invariant-9', `previous_versions entry v${v} is not lower than version ${version}`);
    }
    if (previous !== null && v >= previous) {
      error('tm-invariant-9', `previous_versions is not newest first: v${v} follows v${previous}`);
    }
    previous = v;
  }
  if (version !== null && version > 1) {
    const listed = new Set(lineage.map((e) => e.v).filter((v) => typeof v === 'number'));
    const missing = [];
    for (let n = 1; n < version; n += 1) if (!listed.has(n)) missing.push(`v${n}`);
    if (missing.length > 0) error('tm-invariant-9', `previous_versions does not cover ${missing.join(', ')}`);
  }

  // 10: T1 exists and is the acceptance check.
  if (!seen.has('T1')) error('tm-invariant-10', 'no check T1; the acceptance check is always T1');
  if (map.acceptance !== undefined && map.acceptance !== 'T1') {
    error('tm-invariant-10', `acceptance is ${map.acceptance}; the acceptance check is always T1`);
  }

  // 11: a frozen map's observed word agrees with its expect word.
  if (frozen) {
    for (const check of checks) {
      const expect = firstWord(check.baseline?.expect);
      const observed = firstWord(check.baseline?.observed);
      if (expect !== observed) {
        error('tm-invariant-11', `check ${check.id ?? '?'} expects ${expect || '(nothing)'} but its baseline observed ${observed || '(nothing)'}`);
      }
    }
  }

  // 12: the spec pin names a frozen spec version, unless the launch recorded allow_draft.
  const launch = findLaunchFor(file, { env, cwd });
  const allowDraft = launch?.json?.allow_draft === true;
  const specPath = findSpecFor(file, { map, spec, env, cwd, launch });
  let specDoc = null;
  if (specPath) {
    try {
      specDoc = loadSpec(specPath);
    } catch (error_) {
      error('tm-invariant-12', error_.message);
    }
  } else if (!allowDraft) {
    error('tm-invariant-12', `the pinned spec ${map?.spec?.name ?? '?'} v${map?.spec?.version ?? '?'} was not found beside the map or in its launch`);
  }
  if (specDoc && specDoc.status !== 'frozen' && !allowDraft) {
    error('tm-invariant-12', `the pinned spec ${path.basename(specPath)} has status ${specDoc.status}; a map pins a frozen spec version unless the launch allows a draft`);
  }

  // 13: a frozen map carries allowed and locked paths.
  if (frozen) {
    if (!Array.isArray(map.allowed_paths) || map.allowed_paths.length === 0) {
      error('tm-invariant-13', 'a frozen map carries a non-empty allowed_paths');
    }
    if (!Array.isArray(map.locked_paths) || map.locked_paths.length === 0) {
      error('tm-invariant-13', 'a frozen map carries a non-empty locked_paths');
    }
  }

  // The coverage rule: a frozen map covers every live behaviour, edge, constraint and interface of the pinned spec.
  if (frozen && specDoc) {
    const grouped = liveIds(specDoc);
    for (const prefix of COVERED_PREFIXES) {
      for (const id of grouped[prefix] ?? []) {
        if (!liveCovers.has(id) && !unverified.has(id)) {
          error('tm-coverage', `${id} of the pinned spec appears in no check's covers and is not listed in unverified`);
        }
      }
    }
  }

  return { map, spec: specDoc, errors, warnings };
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
    result = checkTestsMap(opts.file, { spec: opts.spec, env, cwd });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid tests map` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
