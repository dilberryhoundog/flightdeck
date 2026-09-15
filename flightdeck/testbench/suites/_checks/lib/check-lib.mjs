// testbench/suites/_checks/lib/check-lib.mjs — the shared half of the checks on the characterization suite: locations, the case reporter, git helpers, suite runs with a C8 guard, a per-tree output cache, and snapshot copies of the repository.
// Usage: import { REPO, report, suiteOutputs, snapshotCopy, git } from '../lib/check-lib.mjs'.
//
// These checks belong to the tests map of flightdeck/launch/specs/flightcrew-characterization/spec.v1.json. They live under
// an underscore-prefixed folder so run-all never runs them; the map's commands run them one at a time from the repository root.
// A check prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers: <ids>' line, and '<n>/<m> passed', and
// exits 0 when every case passed, 2 otherwise.
//
// Suite runs mirror run-all: cwd is the repository root, CLAUDE_PROJECT_DIR, FLIGHTCREW_ROOT and FLIGHTCREW_LAUNCH are scrubbed,
// and TMPDIR is a private directory removed afterwards. PATH is prefixed with shims for git, gh and claude that record and refuse
// any push, fetch, pull, ls-remote, remote gh command or model session (C8). Outputs are cached under
// os.tmpdir()/flightcrew-characterization-checks/<mode>-<fingerprint>/, where the fingerprint covers every non-ignored file of the
// tree, its HEAD and the node version, so a cached output is only reused for byte-identical input.

import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const CHECKS = path.resolve(HERE, '..');
export const FIXTURES = path.join(CHECKS, 'fixtures');
export const REPO = path.resolve(CHECKS, '..', '..', '..', '..');
export const SPEC_NAME = 'flightcrew-characterization';
export const SPEC_REL = 'flightdeck/launch/specs/flightcrew-characterization/spec.v1.json';
/** The commit the spec records as its own (spec.commit). */
export const SPEC_COMMIT = 'ee8c08847e73b20250447836b24333e9e6ca79fb';
/** The commit that froze the spec (git log: 'Freeze flightcrew-characterization spec v1'); a re-freeze is a map revision. */
export const FREEZE_COMMIT = 'eca2bba2518ab536e30ed1890955448a5399d4fa';
export const SUITES_REL = 'flightdeck/testbench/suites';
export const SCENARIOS_REL = 'flightdeck/testbench/fixtures/scenarios';
export const SCRUBBED = ['CLAUDE_PROJECT_DIR', 'FLIGHTCREW_ROOT', 'FLIGHTCREW_LAUNCH'];
export const SUITE_TIMEOUT_MS = 30 * 60 * 1000;
const CACHE_ROOT = path.join(os.tmpdir(), 'flightcrew-characterization-checks');
/**
 * The time one check may spend. fc check stops a command after 300 seconds and records an error; a check that has used its budget
 * stops starting work, kills what is still running, and fails naming the work left undone, so the verdict is a result, not an error.
 */
export const BUDGET_MS = 240_000;
export const STARTED_AT = Date.now();
export const DEADLINE = STARTED_AT + BUDGET_MS;

/** The error a check throws when its budget is spent before its work is done. */
export class BudgetError extends Error {
  constructor(what) {
    super(`the check's ${BUDGET_MS / 1000}-second budget was spent before ${what}; the check must be split in a map revision`);
  }
}
const MAX_BUFFER = 256 * 1024 * 1024;

// ── output ───────────────────────────────────────────────────────────────────
function out(line) {
  const buf = Buffer.from(`${line}\n`);
  let off = 0;
  while (off < buf.length) {
    try {
      off += fs.writeSync(1, buf, off, buf.length - off);
    } catch (error) {
      if (error.code === 'EAGAIN') {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2);
        continue;
      }
      throw error;
    }
  }
}

/** One line, at most `limit` characters, from an error or a string. */
export function oneLine(value, limit = 1500) {
  const text = value instanceof Error ? (value.message || String(value)) : String(value);
  const flat = text.replace(/\s*\n\s*/g, ' | ').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit)} …` : flat;
}

const cleanups = [];
/** Registers a function run once at exit, whatever happens. */
export function atExit(fn) {
  cleanups.push(fn);
}
function runCleanups() {
  while (cleanups.length > 0) {
    const fn = cleanups.pop();
    try {
      fn();
    } catch {
      // best effort
    }
  }
}

/**
 * Runs the cases in order and prints the protocol. A case is { name, fn }; fn passes by returning and fails by throwing.
 * `covers` is the list of spec ids the check proves.
 */
export async function report(covers, cases) {
  let passed = 0;
  for (const c of cases) {
    try {
      await c.fn();
      passed += 1;
      out(`pass  ${c.name}`);
    } catch (error) {
      out(`FAIL  ${c.name}: ${oneLine(error)}`);
    }
  }
  out(`covers: ${covers.join(' ')}`);
  out(`${passed}/${cases.length} passed`);
  runCleanups();
  process.exit(passed === cases.length ? 0 : 2);
}

process.on('exit', runCleanups);

/** Throws with `message` when `condition` is false. */
export function ensure(condition, message) {
  if (!condition) throw new Error(message);
}

/** Throws listing the problems, at most `limit` of them, when the list is not empty. */
export function none(problems, what, limit = 25) {
  if (problems.length === 0) return;
  const shown = problems.slice(0, limit).join('; ');
  const more = problems.length > limit ? `; … and ${problems.length - limit} more` : '';
  throw new Error(`${problems.length} ${what}: ${shown}${more}`);
}

// ── files and git ────────────────────────────────────────────────────────────
export function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

export function readJson(file) {
  const text = readText(file);
  if (text === null) return { ok: false, error: `${file} could not be read` };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    return { ok: false, error: `${file} is not valid JSON: ${error.message}` };
  }
}

export function isFile(file) {
  try {
    return fs.statSync(file).isFile();
  } catch {
    return false;
  }
}

export function isDir(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch {
    return false;
  }
}

export function scrubbedEnv(extra = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!SCRUBBED.includes(key) && value !== undefined) env[key] = value;
  }
  return { ...env, ...extra };
}

/** Runs git in `cwd`; returns { status, stdout, stderr }. */
export function gitRun(cwd, args, options = {}) {
  const result = spawnSync('git', args, { cwd, encoding: options.encoding ?? 'utf8', env: scrubbedEnv(), maxBuffer: MAX_BUFFER, input: options.input });
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
}

/** git's stdout trimmed, or null when git failed. */
export function git(cwd, args) {
  const result = gitRun(cwd, args);
  return result.status === 0 ? result.stdout.replace(/\n$/, '') : null;
}

/** The repository-relative paths git sees in the working tree: tracked and untracked, minus ignored files. */
export function worktreeFiles(root) {
  const result = gitRun(root, ['ls-files', '-z', '-c', '-o', '--exclude-standard']);
  if (result.status !== 0) throw new Error(`git ls-files failed in ${root}: ${oneLine(result.stderr)}`);
  return [...new Set(result.stdout.split('\0').filter((p) => p !== ''))].sort();
}

/** The content of `rel` at `commit`, as a Buffer, or null when it did not exist there. */
export function showAt(root, commit, rel) {
  const result = spawnSync('git', ['show', `${commit}:${rel}`], { cwd: root, env: scrubbedEnv(), maxBuffer: MAX_BUFFER });
  return result.status === 0 ? result.stdout : null;
}

/** Paths that differ between `commit` and the working tree, including untracked files. */
export function changedSince(root, commit) {
  const diff = gitRun(root, ['diff', '--name-only', '-z', '--no-renames', commit]);
  if (diff.status !== 0) throw new Error(`git diff ${commit} failed: ${oneLine(diff.stderr)}`);
  const untracked = gitRun(root, ['ls-files', '-z', '-o', '--exclude-standard']);
  return [...new Set([...diff.stdout.split('\0'), ...untracked.stdout.split('\0')].filter((p) => p !== ''))].sort();
}

// ── the spec ─────────────────────────────────────────────────────────────────
/** Every node id the spec carries (INT, SC, C, I, B, E, D, VER, ACC). */
export function specIds(root = REPO) {
  const parsed = readJson(path.join(root, SPEC_REL));
  if (!parsed.ok) throw new Error(parsed.error);
  const spec = parsed.value;
  const ids = new Set();
  for (const key of ['intent', 'verification', 'acceptance']) if (spec[key]?.id) ids.add(spec[key].id);
  for (const key of ['scope', 'constraints', 'interfaces', 'behaviours', 'edges', 'decisions']) {
    for (const node of Array.isArray(spec[key]) ? spec[key] : []) if (node?.id) ids.add(node.id);
  }
  return ids;
}

// ── suites ───────────────────────────────────────────────────────────────────
/** The suites run-all runs: suites/<name>/run.mjs, skipping directories that start with '_', in name order. */
export function suiteNames(root) {
  const dir = path.join(root, SUITES_REL);
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith('_') && isFile(path.join(dir, e.name, 'run.mjs')))
    .map((e) => e.name)
    .sort();
}

function findOnPath(name, skipDir) {
  for (const dir of String(process.env.PATH ?? '').split(path.delimiter)) {
    if (!dir || path.resolve(dir) === skipDir) continue;
    const candidate = path.join(dir, name);
    try {
      fs.accessSync(candidate, fs.constants.X_OK);
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // not here
    }
  }
  return null;
}

const SQ = String.fromCharCode(39);
function shellQuote(value) {
  return SQ + String(value).split(SQ).join(SQ + String.fromCharCode(92) + SQ + SQ) + SQ;
}

/** Writes the C8 guard shims into `dir`; every refused invocation is appended to `logFile`. */
function writeShims(dir, logFile) {
  const realGit = findOnPath('git', dir);
  const realGh = findOnPath('gh', dir);
  const realClaude = findOnPath('claude', dir);
  const log = shellQuote(logFile);
  const gitShim = [
    '#!/bin/sh',
    'sub=""',
    'skip=0',
    'for a in "$@"; do',
    '  if [ "$skip" = 1 ]; then skip=0; continue; fi',
    '  case "$a" in',
    '    -C|-c|--git-dir|--work-tree|--namespace|--exec-path) skip=1 ;;',
    '    -*) ;;',
    '    *) sub="$a"; break ;;',
    '  esac',
    'done',
    'case "$sub" in',
    `  push|fetch|pull|ls-remote) printf 'git %s\\n' "$*" >> ${log}; echo "refused by the C8 guard: git $sub" >&2; exit 1 ;;`,
    'esac',
    realGit ? `exec ${shellQuote(realGit)} "$@"` : 'echo "git: not found" >&2; exit 127',
    '',
  ].join('\n');
  const ghShim = [
    '#!/bin/sh',
    'case "$1" in',
    `  --version|version|help|--help|"") ${realGh ? `exec ${shellQuote(realGh)} "$@"` : 'echo "gh: not found" >&2; exit 127'} ;;`,
    'esac',
    `printf 'gh %s\\n' "$*" >> ${log}; echo "refused by the C8 guard: gh $1" >&2; exit 1`,
    '',
  ].join('\n');
  const claudeShim = [
    '#!/bin/sh',
    'case "$1" in',
    `  --version|-v) ${realClaude ? `exec ${shellQuote(realClaude)} "$@"` : 'echo "claude: not found" >&2; exit 127'} ;;`,
    'esac',
    `printf 'claude %s\\n' "$*" >> ${log}; echo "refused by the C8 guard: a model session" >&2; exit 1`,
    '',
  ].join('\n');
  for (const [name, text] of [['git', gitShim], ['gh', ghShim], ['claude', claudeShim]]) {
    const file = path.join(dir, name);
    fs.writeFileSync(file, text);
    fs.chmodSync(file, 0o755);
  }
}

/**
 * Runs one suite of the tree at `root` the way run-all does, with the C8 guard on PATH. Resolves to
 * { suite, exit, signal, stdout, stderr, ms, refused: [lines], tmp_left: [names] }.
 */
export function runSuite(root, name, { deadline = DEADLINE, trackStatus = false } = {}) {
  const timeoutMs = Math.max(1, Math.min(SUITE_TIMEOUT_MS, deadline - Date.now()));
  const statusBefore = trackStatus ? statusLines(root) : null;
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-chk-run-'));
  const privateTmp = path.join(work, 'tmp');
  const shimDir = path.join(work, 'bin');
  const logFile = path.join(work, 'refused.log');
  fs.mkdirSync(privateTmp);
  fs.mkdirSync(shimDir);
  fs.writeFileSync(logFile, '');
  writeShims(shimDir, logFile);
  const env = scrubbedEnv({ TMPDIR: privateTmp, TMP: privateTmp, TEMP: privateTmp, PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}` });
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(root, SUITES_REL, name, 'run.mjs')], { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    const stdout = [];
    const stderr = [];
    child.stdout.on('data', (b) => stdout.push(b));
    child.stderr.on('data', (b) => stderr.push(b));
    let overBudget = false;
    const timer = setTimeout(() => {
      overBudget = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    const finish = (code, signal, extraErr = '') => {
      clearTimeout(timer);
      let tmpLeft = [];
      try {
        tmpLeft = fs.readdirSync(privateTmp).sort();
      } catch {
        tmpLeft = [];
      }
      const refused = (readText(logFile) ?? '').split('\n').filter((l) => l !== '');
      try {
        fs.rmSync(work, { recursive: true, force: true });
      } catch {
        // best effort
      }
      resolve({
        suite: name,
        exit: typeof code === 'number' ? code : null,
        signal: signal ?? null,
        stdout: Buffer.concat(stdout).toString('utf8'),
        stderr: Buffer.concat(stderr).toString('utf8') + extraErr,
        ms: Date.now() - started,
        refused,
        tmp_left: tmpLeft,
        over_budget: overBudget,
        status_added: statusBefore === null ? null : [...statusLines(root)].filter((l) => !statusBefore.has(l)),
      });
    };
    child.on('error', (error) => finish(null, null, `\n[check-lib] ${error.message}`));
    child.on('close', (code, signal) => finish(code, signal));
  });
}

/** The checkout's 'git status --porcelain' lines outside flightdeck/testbench/runs/, as a Set. */
export function statusLines(root) {
  const r = gitRun(root, ['status', '--porcelain']);
  return new Set(r.stdout.split('\n').filter((l) => l !== '' && !l.slice(3).startsWith('flightdeck/testbench/runs/')));
}

/** A digest of every non-ignored file of the tree, its HEAD, the node version and `mode`. */
export function fingerprint(root, mode) {
  const hash = crypto.createHash('sha256');
  hash.update(`mode ${mode}\0node ${process.version}\0head ${git(root, ['rev-parse', 'HEAD']) ?? 'none'}\0`);
  for (const rel of worktreeFiles(root)) {
    const file = path.join(root, rel);
    let stat;
    try {
      stat = fs.lstatSync(file);
    } catch {
      hash.update(`${rel}\0<absent>\0`);
      continue;
    }
    if (stat.isSymbolicLink()) hash.update(`${rel}\0<link>${fs.readlinkSync(file)}\0`);
    else if (stat.isFile()) {
      hash.update(`${rel}\0${stat.mode & 0o111 ? 'x' : '-'}\0`);
      hash.update(fs.readFileSync(file));
      hash.update('\0');
    }
  }
  return hash.digest('hex').slice(0, 32);
}

async function pool(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const at = next;
      next += 1;
      results[at] = await worker(items[at], at);
    }
  });
  await Promise.all(runners);
  return results;
}
export { pool };

/** How many snapshot copies a sweep runs at once. */
export const SWEEP_CONCURRENCY = Math.max(1, Math.min(4, Math.floor(os.cpus().length / 2)));

/**
 * The output of every named suite (default: every suite run-all runs) of the tree at `root`, cached per suite under the tree's
 * fingerprint and `mode`. Suites not in the cache run `concurrency` at a time; `trackStatus` records the checkout's git status lines
 * each serial run added. Throws BudgetError naming the suites left unrun or killed when the budget runs out; a killed run is never
 * cached. Returns a Map of suite name → run result.
 */
export async function suiteOutputs(root, { mode = 'checkout', only = null, concurrency = 1, trackStatus = false, deadline = DEADLINE } = {}) {
  const names = only ?? suiteNames(root);
  const key = `${mode}-${fingerprint(root, mode)}`;
  const dir = path.join(CACHE_ROOT, key);
  fs.mkdirSync(dir, { recursive: true });
  const results = new Map();
  const missing = [];
  for (const name of names) {
    const cached = readJson(path.join(dir, `${name}.json`));
    if (cached.ok && cached.value?.suite === name) results.set(name, cached.value);
    else missing.push(name);
  }
  const undone = [];
  await pool(missing, concurrency, async (name) => {
    if (Date.now() >= deadline) {
      undone.push(name);
      return;
    }
    const result = await runSuite(root, name, { deadline, trackStatus });
    if (result.over_budget) {
      undone.push(name);
      return;
    }
    const file = path.join(dir, `${name}.json`);
    const tmpFile = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(result));
    fs.renameSync(tmpFile, file);
    results.set(name, result);
  });
  if (undone.length > 0) throw new BudgetError(`suites ${undone.sort().join(', ')} ran to completion`);
  return new Map(names.map((n) => [n, results.get(n)]));
}

/** How many suites the name index runs at once. */
export const INDEX_CONCURRENCY = Math.max(1, Math.min(6, os.cpus().length - 1));

/**
 * Every suite's output, run in parallel for the case names, output lines and records they print. Checks that judge a suite's
 * pass or fail verdict read the serial suite-group runs instead, because parallel load can change a verdict but not a name.
 */
export function indexOutputs(root = REPO, options = {}) {
  return suiteOutputs(root, { mode: 'index', concurrency: INDEX_CONCURRENCY, ...options });
}

/** The number of suite-group checks, and the suites of group k (1-based): the sorted suites dealt round-robin. */
export const GROUPS = 8;
export function groupSuites(root, k) {
  return suiteNames(root).filter((_, i) => i % GROUPS === k - 1);
}

// ── snapshot copies ──────────────────────────────────────────────────────────
/**
 * A copy of the repository at `root` as its working tree stands: a local clone at the same HEAD and branch with no remote, with
 * every non-ignored working-tree file copied over it and every deleted tracked file removed. Returns { dir, remove }.
 */
export function snapshotCopy(root) {
  const holder = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-chk-copy-'));
  const dir = path.join(holder, 'repo');
  const remove = () => {
    try {
      fs.rmSync(holder, { recursive: true, force: true });
    } catch {
      // best effort
    }
  };
  atExit(remove);
  const head = git(root, ['rev-parse', 'HEAD']);
  const branch = git(root, ['symbolic-ref', '-q', '--short', 'HEAD']);
  const clone = gitRun(holder, ['clone', '--quiet', '--local', '--no-checkout', root, dir]);
  if (clone.status !== 0) throw new Error(`git clone of ${root} failed: ${oneLine(clone.stderr)}`);
  const checkout = branch
    ? gitRun(dir, ['checkout', '--quiet', '-B', branch, head])
    : gitRun(dir, ['checkout', '--quiet', '--detach', head]);
  if (checkout.status !== 0) throw new Error(`git checkout in the copy failed: ${oneLine(checkout.stderr)}`);
  gitRun(dir, ['remote', 'remove', 'origin']);
  for (const rel of worktreeFiles(root)) {
    const from = path.join(root, rel);
    const to = path.join(dir, rel);
    let stat;
    try {
      stat = fs.lstatSync(from);
    } catch {
      fs.rmSync(to, { force: true });
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    if (stat.isSymbolicLink()) {
      fs.rmSync(to, { force: true });
      fs.symlinkSync(fs.readlinkSync(from), to);
    } else if (stat.isFile()) {
      fs.copyFileSync(from, to);
      fs.chmodSync(to, stat.mode & 0o777);
    }
  }
  return { dir, remove };
}

/** Runs a node script in `cwd` with the scrubbed environment and a private TMPDIR; returns { exit, stdout, stderr }. */
export function runNode(cwd, args, { env = {}, timeoutMs = SUITE_TIMEOUT_MS } = {}) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-chk-node-'));
  try {
    const result = spawnSync(process.execPath, args, {
      cwd,
      env: scrubbedEnv({ TMPDIR: work, TMP: work, TEMP: work, ...env }),
      encoding: 'utf8',
      maxBuffer: MAX_BUFFER,
      timeout: timeoutMs,
      killSignal: 'SIGKILL',
    });
    return { exit: result.status, signal: result.signal, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

/** A temporary directory removed at exit. */
export function tempDir(prefix = 'fc-chk-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  atExit(() => fs.rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Writes `files` ({ rel: content }) under `root`, creating directories. */
export function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, content);
  }
}
