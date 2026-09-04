// flightcrew/bin/cmd/check.mjs — runs the checks of the pinned tests map, writes one evidence file per check, rebuilds the evidence summary, and records a draft map's baseline.
// Usage: fc check [all | T1 T2 …] [--cwd <dir>] [--baseline <map-path>]; exit 0 when nothing failed, 1 on a usage or pin error, 2 when a check failed or errored.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { head } from '../../checks/lib/git-lib.mjs';
import { loadSpec, liveIds } from '../../checks/lib/spec-lib.mjs';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { EXIT, ok, fail, isJson, json } from '../../checks/lib/output.mjs';

/** The wall-clock limit one check command is given (design 5.2). */
export const TIMEOUT_MS = 300_000;
/** How many lines of each stream an evidence file keeps. */
export const TAIL_LINES = 40;
/** The commit an evidence file records when git cannot answer for the tree. */
const NO_COMMIT = '0000000';
const MAX_BUFFER = 16 * 1024 * 1024;
const COVERED_PREFIXES = ['B', 'E', 'C', 'I'];

export const help = [
  'fc check all                       run every check of the pinned tests map',
  'fc check T1 T3                     run the named checks and rebuild the summary',
  'fc check all --cwd <dir>           run the commands in <dir> instead of the launch root',
  'fc check all --baseline <map>      record observed baselines into a draft map, writing no evidence',
].join('\n');

/** --baseline records a draft map's observed baselines before any launch pins it, so it resolves no launch. */
export const needsLaunch = (args) => !args.includes('--baseline');

// ── reading the pinned map ───────────────────────────────────────────────────

/** A usage or environment failure a caller turns into an exit 1 line. */
export class CheckError extends Error {
  constructor(message, code = EXIT.usage) {
    super(message);
    this.exitCode = code;
  }
}

function readJson(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new CheckError(`${what} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new CheckError(`${what} is not valid JSON: ${error.message}`);
  }
}

/** True when two hashes name the same commit: 7 to 40 hex compared by prefix (design section 4). */
function sameCommit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return a === b || (!a && !b);
  if (a === '' || b === '') return a === b;
  return a.startsWith(b) || b.startsWith(a);
}

/**
 * The pinned tests map of a launch, with the pin checked against launch.json.spec. Throws CheckError with
 * 'no tests map pinned' (E11) or 'pin mismatch' (E8).
 */
export function pinnedMap(launchDir, launchJson) {
  const pin = launchJson?.tests_map;
  if (!pin || typeof pin.path !== 'string' || pin.path === '') throw new CheckError('no tests map pinned');
  const file = path.resolve(launchDir, pin.path);
  if (!fs.existsSync(file)) throw new CheckError(`no tests map pinned: ${pin.path} is not in the launch folder`);
  const map = readJson(file, 'the pinned tests map');
  const spec = launchJson?.spec ?? {};
  const mapSpec = map?.spec ?? {};
  const differs = [];
  if (mapSpec.name !== spec.name) differs.push(`name ${mapSpec.name} vs ${spec.name}`);
  if (Number(mapSpec.version) !== Number(spec.version)) differs.push(`version ${mapSpec.version} vs ${spec.version}`);
  if (!sameCommit(mapSpec.commit ?? null, spec.commit ?? null)) differs.push(`commit ${mapSpec.commit} vs ${spec.commit}`);
  if (differs.length > 0) {
    throw new CheckError(`pin mismatch: the pinned tests map names a different spec (${differs.join('; ')})`);
  }
  return { map, file };
}

/** The ids the map quarantines. */
function quarantinedIds(map) {
  return (Array.isArray(map?.quarantined) ? map.quarantined : [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.id))
    .filter((id) => typeof id === 'string');
}

/** The ids the map records as unverified. */
function unverifiedIds(map) {
  return (Array.isArray(map?.unverified) ? map.unverified : [])
    .map((entry) => (typeof entry === 'string' ? entry : entry?.id))
    .filter((id) => typeof id === 'string');
}

// ── running one command ──────────────────────────────────────────────────────

/** The last TAIL_LINES lines of a stream, with the trailing newline's empty line dropped. */
function tailOf(text) {
  const lines = String(text ?? '').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.slice(-TAIL_LINES);
}

/** The first non-empty line of the command's output, stdout before stderr. */
function firstLine(stdout, stderr) {
  for (const text of [stdout, stderr]) {
    for (const line of String(text ?? '').split('\n')) {
      if (line.trim() !== '') return line.trim();
    }
  }
  return '';
}

/**
 * Runs one check command as /bin/sh -c with cwd and the parent environment plus FLIGHTCREW_LAUNCH, under the 300 s
 * limit. Returns { verdict, exit, stdout, stderr, duration_ms, cause }: a command that could not be run — no such
 * binary, not executable, killed, or over the limit — is verdict error with a cause naming the command, and every
 * other non-zero exit is a fail.
 */
export function runCommand(command, { cwd, launchName = null, env = process.env } = {}) {
  const childEnv = { ...env };
  if (launchName) childEnv.FLIGHTCREW_LAUNCH = launchName;
  const started = Date.now();
  let result;
  try {
    result = spawnSync('/bin/sh', ['-c', String(command)], {
      cwd,
      env: childEnv,
      encoding: 'utf8',
      timeout: TIMEOUT_MS,
      maxBuffer: MAX_BUFFER,
      killSignal: 'SIGKILL',
    });
  } catch (error) {
    return { verdict: 'error', exit: null, stdout: '', stderr: '', duration_ms: Date.now() - started, cause: `${command} could not be run: ${error.message}` };
  }
  const duration = Date.now() - started;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const code = typeof result.status === 'number' ? result.status : null;
  let cause = null;
  if (result.error) {
    cause = result.error.code === 'ETIMEDOUT'
      ? `${command} was stopped after ${TIMEOUT_MS / 1000} seconds`
      : `${command} could not be run: ${result.error.message}`;
  } else if (result.signal) {
    cause = `${command} was killed by ${result.signal}`;
  } else if (code === 127) {
    cause = `${command} could not be run: no such command`;
  } else if (code === 126) {
    cause = `${command} could not be run: not executable`;
  }
  const verdict = cause !== null ? 'error' : code === 0 ? 'pass' : 'fail';
  return { verdict, exit: cause !== null && result.signal ? null : code, stdout, stderr, duration_ms: duration, cause };
}

// ── evidence ─────────────────────────────────────────────────────────────────

function writeJsonFile(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** The evidence document for one check run, in the shape of check-result.schema.json (spec I6). */
function evidenceOf(check, outcome, { cwd, commit, phase }) {
  const stderr = tailOf(outcome.stderr);
  if (outcome.cause) stderr.push(`error: ${outcome.cause}`);
  return {
    id: check.id,
    command: String(check.command),
    cwd,
    exit: outcome.exit,
    verdict: outcome.verdict,
    stdout_tail: tailOf(outcome.stdout),
    stderr_tail: stderr.slice(-TAIL_LINES),
    duration_ms: Math.max(0, Math.round(outcome.duration_ms)),
    ran_at: new Date().toISOString(),
    commit,
    covers: Array.isArray(check.covers) ? check.covers.slice() : [],
    phase,
  };
}

/** The evidence document of a check that was not run because its id is quarantined. */
function skippedEvidence(check, { cwd, commit, phase }) {
  return {
    id: check.id,
    command: String(check.command),
    cwd,
    exit: null,
    verdict: 'skipped',
    stdout_tail: [],
    stderr_tail: [],
    duration_ms: 0,
    ran_at: new Date().toISOString(),
    commit,
    covers: Array.isArray(check.covers) ? check.covers.slice() : [],
    phase,
  };
}

/** Every spec id a frozen map is expected to cover that no live check covers and no entry marks unverified. */
function uncoveredIds(launchDir, launchJson, map) {
  const specPath = launchJson?.spec?.path;
  if (typeof specPath !== 'string' || specPath === '') return [];
  let spec;
  try {
    spec = loadSpec(path.resolve(launchDir, specPath));
  } catch {
    return [];
  }
  const covered = new Set();
  for (const check of Array.isArray(map?.checks) ? map.checks : []) {
    for (const id of Array.isArray(check.covers) ? check.covers : []) covered.add(id);
  }
  for (const id of unverifiedIds(map)) covered.add(id);
  const grouped = liveIds(spec);
  const missing = [];
  for (const prefix of COVERED_PREFIXES) {
    for (const id of grouped[prefix] ?? []) if (!covered.has(id)) missing.push(id);
  }
  return missing;
}

/**
 * Rebuilds evidence/summary.json from every evidence/<T>.json present, in the map's order, so a run of a subset of the
 * checks leaves the earlier results standing (spec B12). Returns the summary document.
 */
export function rebuildSummary(launchDir, launchJson, map, { commit }) {
  const evidenceDir = path.join(launchDir, 'evidence');
  let names = [];
  try {
    names = fs.readdirSync(evidenceDir).filter((name) => /^T\d+\.json$/.test(name));
  } catch {
    names = [];
  }
  const order = (Array.isArray(map?.checks) ? map.checks : []).map((check) => check.id);
  const found = [];
  for (const name of names) {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(evidenceDir, name), 'utf8'));
      if (doc && typeof doc === 'object' && typeof doc.id === 'string') found.push(doc);
    } catch {
      // an unreadable evidence file is not a result; the check simply has none
    }
  }
  const rank = (id) => {
    const at = order.indexOf(id);
    return at === -1 ? order.length + Number(String(id).replace(/\D/g, '') || 0) : at;
  };
  found.sort((a, b) => rank(a.id) - rank(b.id));
  const counts = { pass: 0, fail: 0, error: 0, skipped: 0 };
  for (const doc of found) if (doc.verdict in counts) counts[doc.verdict] += 1;
  const summary = {
    ran_at: new Date().toISOString(),
    commit,
    counts,
    checks: found.map((doc) => ({ id: doc.id, verdict: doc.verdict, covers: Array.isArray(doc.covers) ? doc.covers : [] })),
    unverified: unverifiedIds(map),
    quarantined: quarantinedIds(map),
    uncovered: uncoveredIds(launchDir, launchJson, map),
  };
  writeJsonFile(path.join(evidenceDir, 'summary.json'), summary);
  return summary;
}

// ── the two modes ────────────────────────────────────────────────────────────

/** The checks the arguments name, in map order. Throws CheckError naming an id the map does not carry (E17). */
export function selectChecks(map, ids) {
  const checks = Array.isArray(map?.checks) ? map.checks : [];
  if (!ids || ids.length === 0 || (ids.length === 1 && ids[0] === 'all')) return checks;
  const known = new Set(checks.map((check) => check.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length > 0) throw new CheckError(`unknown check ${unknown.join(', ')}: the pinned tests map has no such id`);
  return checks.filter((check) => ids.includes(check.id));
}

/**
 * Runs the selected checks of a pinned map serially in map order, writes one evidence file each (verdict skipped for a
 * quarantined id, which never affects the exit code), and rebuilds the summary. Returns { code, results, summary }.
 */
export function runChecks({ root, launchDir, launchJson, map, ids = null, cwd = null }) {
  const selected = selectChecks(map, ids);
  const where = cwd ? path.resolve(cwd) : root;
  const commit = head(root) ?? NO_COMMIT;
  const phase = typeof launchJson?.phase === 'string' ? launchJson.phase : 'unknown';
  const launchName = typeof launchJson?.name === 'string' ? launchJson.name : null;
  const quarantined = new Set(quarantinedIds(map));
  const evidenceDir = path.join(launchDir, 'evidence');
  fs.mkdirSync(evidenceDir, { recursive: true });
  const results = [];
  for (const check of selected) {
    const doc = quarantined.has(check.id)
      ? skippedEvidence(check, { cwd: where, commit, phase })
      : evidenceOf(check, runCommand(check.command, { cwd: where, launchName }), { cwd: where, commit, phase });
    writeJsonFile(path.join(evidenceDir, `${check.id}.json`), doc);
    results.push(doc);
  }
  const summary = rebuildSummary(launchDir, launchJson, map, { commit });
  const red = results.filter((doc) => doc.verdict === 'fail' || doc.verdict === 'error');
  return { code: red.length > 0 ? EXIT.blocked : EXIT.ok, results, summary, red };
}

/**
 * Runs a draft map's checks without a pin, records each observed line and the file-level baseline commit and date, and
 * writes no evidence (spec B36). Returns { code, map, observed }.
 */
export function runBaseline({ root, mapFile, ids = null, cwd = null, launchName = null }) {
  const map = readJson(mapFile, `the tests map ${mapFile}`);
  const selected = selectChecks(map, ids);
  const where = cwd ? path.resolve(cwd) : root;
  const observed = [];
  let spawnFailures = 0;
  for (const check of selected) {
    const outcome = runCommand(check.command, { cwd: where, launchName });
    const line = `${outcome.verdict}: ${firstLine(outcome.stdout, outcome.stderr) || (outcome.cause ?? '')}`.trim();
    if (!check.baseline || typeof check.baseline !== 'object') check.baseline = { expect: '', observed: '' };
    check.baseline.observed = line;
    if (outcome.verdict === 'error') spawnFailures += 1;
    observed.push({ id: check.id, observed: line });
  }
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  if (!map.baseline || typeof map.baseline !== 'object') map.baseline = {};
  map.baseline.commit = head(root) ?? NO_COMMIT;
  map.baseline.date = date;
  writeJsonFile(mapFile, map);
  return { code: spawnFailures > 0 ? EXIT.blocked : EXIT.ok, map, observed, spawnFailures };
}

// ── the command ──────────────────────────────────────────────────────────────

function parse(args) {
  const ids = [];
  const flags = { baseline: null, cwd: null };
  for (let i = 0; i < args.length; i += 1) {
    const arg = String(args[i]);
    if (arg === '--baseline') flags.baseline = args[i + 1] === undefined ? null : String(args[i += 1]);
    else if (arg === '--cwd') flags.cwd = args[i + 1] === undefined ? null : String(args[i += 1]);
    else if (arg.startsWith('--')) throw new CheckError(`fc check: unknown flag ${arg}`);
    else ids.push(arg);
  }
  return { ids, flags };
}

/** Resolves a path given on the command line against the working directory first and the launch root second. */
function resolveGiven(given, root) {
  if (path.isAbsolute(given)) return given;
  const fromCwd = path.resolve(process.cwd(), given);
  if (fs.existsSync(fromCwd)) return fromCwd;
  return path.resolve(root, given);
}

export async function run(args, ctx) {
  let parsed;
  try {
    parsed = parse(args);
  } catch (error) {
    fail(error.message);
    return process.exit(EXIT.usage);
  }
  const { ids, flags } = parsed;
  const root = ctx?.root;
  if (!root) {
    fail('no flightdeck root');
    return process.exit(EXIT.usage);
  }
  try {
    if (flags.baseline !== null) {
      if (!flags.baseline) throw new CheckError('fc check --baseline needs a tests map path');
      const mapFile = resolveGiven(flags.baseline, root);
      const outcome = runBaseline({
        root,
        mapFile,
        ids: ids.length > 0 ? ids : null,
        cwd: flags.cwd,
        launchName: ctx?.launch?.name ?? null,
      });
      if (isJson()) json({ baseline: path.relative(root, mapFile), observed: outcome.observed });
      else ok(`baseline recorded for ${outcome.observed.length} checks in ${path.relative(root, mapFile)}`);
      if (outcome.code !== EXIT.ok) fail(`${outcome.spawnFailures} command(s) could not be run`);
      return process.exit(outcome.code);
    }
    const launch = ctx?.launch;
    if (!launch?.dir) throw new CheckError('no active launch');
    const { map } = pinnedMap(launch.dir, launch.json);
    const outcome = runChecks({
      root,
      launchDir: launch.dir,
      launchJson: launch.json,
      map,
      ids: ids.length > 0 ? ids : null,
      cwd: flags.cwd,
    });
    await bestEffortRender(launch.dir);
    const counts = outcome.summary.counts;
    if (isJson()) json(outcome.summary);
    else ok(`checks: ${counts.pass} pass, ${counts.fail} fail, ${counts.error} error, ${counts.skipped} skipped`);
    if (outcome.code !== EXIT.ok) fail(`red: ${outcome.red.map((doc) => `${doc.id} ${doc.verdict}`).join(', ')}`);
    return process.exit(outcome.code);
  } catch (error) {
    fail(error.message);
    return process.exit(error.exitCode ?? EXIT.usage);
  }
}
