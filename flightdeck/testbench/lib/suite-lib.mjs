// testbench/lib/suite-lib.mjs — shared helpers for every suite under flightdeck/testbench/suites/: locations, process runners, temp directories, fixture builders and assertions.
// Usage: import { suite, fc, hook, sh, tmp, mkLaunchRepo, mkActiveLaunch, assert, assertEq, assertMatch, assertIncludes, assertExit } from '../../lib/suite-lib.mjs'; then await suite('<name>', [{ id, covers: ['B1'], fn: async () => {} }]).
//
// Contract (spec I9): a suite prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers: <ids>' line, then '<n>/<m> passed', and exits 0 when every case passed, else 2. It never exits 1 and never crashes: uncaught errors become a FAIL line and exit 2.
// Every temporary directory comes from tmp() and lives directly under os.tmpdir(); it is removed at exit whatever happens, so run-all's hygiene check sees no new entries.
// Child processes run with the parent environment minus CLAUDE_PROJECT_DIR, FLIGHTCREW_ROOT and FLIGHTCREW_LAUNCH, so a suite decides explicitly which launch root the thing under test sees; pass env to set them.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

// ── locations ────────────────────────────────────────────────────────────────
const HERE = path.dirname(fileURLToPath(import.meta.url));
export const FD = path.resolve(HERE, '..', '..');
export const REPO = path.resolve(FD, '..');
export const FC = path.join(FD, 'flightcrew', 'bin', 'fc');
export const FC_MJS = path.join(FD, 'flightcrew', 'bin', 'fc.mjs');
export const HOOKS = path.join(FD, 'flightcrew', 'hooks');
export const SUITES = path.join(FD, 'testbench', 'suites');
export const FIXTURES = path.join(FD, 'testbench', 'fixtures');
export const SCHEMAS = path.join(FD, 'flightcrew', 'schemas');
export const CREW = path.join(FD, 'flightcrew', 'crew');
export const TEMPLATES = path.join(FD, 'flightcrew', 'templates');
export const WORKFLOWS = path.join(FD, 'flightcrew', 'workflows');
export const MANUALS = path.join(FD, 'manuals');

const TIMEOUT_MS = 120_000;
const MAX_BUFFER = 16 * 1024 * 1024;
const SCRUBBED = ['CLAUDE_PROJECT_DIR', 'FLIGHTCREW_ROOT', 'FLIGHTCREW_LAUNCH'];

// ── synchronous output (a pipe on macOS is asynchronous; process.exit must not lose lines) ──
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

function oneLine(error, limit = 800) {
  const text = error instanceof Error ? (error.message || String(error)) : String(error);
  const flat = text.replace(/\s*\n\s*/g, ' | ').replace(/\s+/g, ' ').trim();
  return flat.length > limit ? `${flat.slice(0, limit)} …` : flat;
}

// ── temp directories and cleanup ─────────────────────────────────────────────
const tmpDirs = new Set();
const current = { name: null, total: 0, passed: 0, running: false };
let armed = false;

function cleanupTmp() {
  for (const dir of tmpDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
    } catch {
      // best effort: nothing else can be done at exit
    }
    tmpDirs.delete(dir);
  }
}

function failHard(label, error) {
  try {
    out(`FAIL  ${label}: ${oneLine(error)}`);
    if (current.running) out(`${current.passed}/${current.total} passed`);
  } catch {
    // stdout gone; exit code still carries the verdict
  }
  cleanupTmp();
  process.exit(2);
}

function arm() {
  if (armed) return;
  armed = true;
  process.on('exit', cleanupTmp);
  process.on('uncaughtException', (error) => failHard('<uncaught exception>', error));
  process.on('unhandledRejection', (error) => failHard('<unhandled rejection>', error));
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      cleanupTmp();
      process.exit(2);
    });
  }
}

/** New directory directly under os.tmpdir(), removed at process exit whatever happens. Returns the real path. */
export function tmp(prefix = 'fc-suite') {
  arm();
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `${String(prefix).replace(/[^\w.-]+/g, '-')}-`)));
  tmpDirs.add(dir);
  return dir;
}

// ── process runners: never throw, capture both streams ───────────────────────
function childEnv(overrides = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!SCRUBBED.includes(key) && value !== undefined) env[key] = value;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) delete env[key];
    else env[key] = String(value);
  }
  return env;
}

function run(file, args, opts = {}) {
  const timeout = opts.timeout ?? TIMEOUT_MS;
  let result;
  try {
    result = spawnSync(file, args, {
      cwd: opts.cwd,
      env: childEnv(opts.env),
      input: opts.input === undefined ? '' : String(opts.input),
      encoding: 'utf8',
      timeout,
      maxBuffer: MAX_BUFFER,
      killSignal: 'SIGKILL',
    });
  } catch (error) {
    return { code: null, signal: null, stdout: '', stderr: `[suite-lib] could not spawn ${file}: ${error.message}\n` };
  }
  let stderr = result.stderr ?? '';
  if (result.error) {
    const why = result.error.code === 'ETIMEDOUT' ? `timeout after ${timeout} ms` : result.error.message;
    stderr += `${stderr && !stderr.endsWith('\n') ? '\n' : ''}[suite-lib] ${file}: ${why}\n`;
  }
  return {
    code: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    stdout: result.stdout ?? '',
    stderr,
  };
}

/** Runs a shell command through /bin/sh -c. Returns { code, stdout, stderr }; code is null when the process did not exit normally. */
export function sh(command, opts = {}) {
  return run('/bin/sh', ['-c', command], opts);
}

function gitTopLevel(dir) {
  const result = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8', env: childEnv() });
  return result.status === 0 ? result.stdout.trim() : null;
}

/** Runs node <fc.mjs> with args. FLIGHTCREW_ROOT is set to the git toplevel of cwd unless opts.env carries the key (a null value leaves it unset). */
export function fc(args, opts = {}) {
  const env = { ...(opts.env ?? {}) };
  if (!Object.prototype.hasOwnProperty.call(env, 'FLIGHTCREW_ROOT')) {
    const top = gitTopLevel(opts.cwd ?? process.cwd());
    if (top) env.FLIGHTCREW_ROOT = top;
  }
  return run(process.execPath, [FC_MJS, ...args.map(String)], { ...opts, env });
}

/** Runs node <hooks>/<name>.mjs with the envelope (object or raw string) on stdin. Adds decision: the parsed stdout JSON or null. */
export function hook(name, envelope, opts = {}) {
  const file = path.join(HOOKS, name.endsWith('.mjs') ? name : `${name}.mjs`);
  const input = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
  const cwd = opts.cwd ?? opts.env?.CLAUDE_PROJECT_DIR ?? os.tmpdir();
  const result = run(process.execPath, [file], { ...opts, cwd, input });
  let decision = null;
  const text = result.stdout.trim();
  if (text.startsWith('{')) {
    try {
      decision = JSON.parse(text);
    } catch {
      try {
        decision = JSON.parse(text.split('\n')[0]);
      } catch {
        decision = null;
      }
    }
  }
  return { ...result, decision };
}

// ── git and files ─────────────────────────────────────────────────────────────
function git(dir, args) {
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', env: childEnv(), maxBuffer: MAX_BUFFER });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${dir}: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result.stdout;
}

/** git init -q -b main with a local identity, no signing, no inherited hooks, and an initial commit of whatever the directory holds. */
export function initRepo(dir) {
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '-q', '-b', 'main']);
  git(dir, ['config', 'user.name', 'Flightcrew Testbench']);
  git(dir, ['config', 'user.email', 'testbench@flightdeck.invalid']);
  git(dir, ['config', 'commit.gpgsign', 'false']);
  git(dir, ['config', 'core.hooksPath', path.join(dir, '.git', 'hooks')]);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '--allow-empty', '--no-verify', '-m', 'initial']);
  return dir;
}

export function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else if (entry.isSymbolicLink()) {
      fs.rmSync(to, { force: true });
      fs.symlinkSync(fs.readlinkSync(from), to);
    } else {
      fs.copyFileSync(from, to);
      fs.chmodSync(to, fs.statSync(from).mode & 0o777);
    }
  }
  return dst;
}

export function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJson(p, obj) {
  writeText(p, `${JSON.stringify(obj, null, 2)}\n`);
}

export function readText(p) {
  return fs.readFileSync(p, 'utf8');
}

export function writeText(p, s) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, s);
}

export function exists(p) {
  return fs.existsSync(p);
}

/** Every file under dir (recursive, .git skipped) as sorted posix paths relative to dir. */
export function listFiles(dir) {
  const files = [];
  const walk = (current, rel) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name === '.git' && entry.isDirectory()) continue;
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(current, entry.name), childRel);
      else files.push(childRel);
    }
  };
  walk(dir, '');
  return files.sort();
}

// ── fixture builders ─────────────────────────────────────────────────────────
const SPEC_DIR = 'flightdeck/launch/specs/export-html';

/** The sample project at tmpRoot with the sample spec at its canonical home, committed on main. Paths returned are repository-relative. */
export function mkLaunchRepo(tmpRoot) {
  const root = tmpRoot ?? tmp('fc-repo');
  copyDir(path.join(FIXTURES, 'sample-project'), root);
  copyDir(path.join(FIXTURES, 'sample-spec'), path.join(root, ...SPEC_DIR.split('/')));
  initRepo(root);
  return {
    root,
    specPath: `${SPEC_DIR}/spec.v1.json`,
    mapPath: `${SPEC_DIR}/tests-map.v1.json`,
    planPath: `${SPEC_DIR}/plan.sample.json`,
  };
}

/**
 * mkLaunchRepo plus the sample launch folder, active as shipped, committed. env carries the two root variables the thing under test reads.
 * The shipped sample launch sits in phase review: gates G1 and G2 approved, every unit merged (HEAD label 18293a4), evidence recorded at that
 * commit, a verifier pass stored, and critic pass 1 stored with F1 resolved at a later commit. A suite that needs phase verify (stop-gate
 * behaviours, hook timing) or any earlier phase writes launch.json.phase itself after calling this helper.
 */
export function mkActiveLaunch(tmpRoot) {
  const repo = mkLaunchRepo(tmpRoot);
  const launch = 'export-html-1';
  const launchDir = path.join(repo.root, 'flightdeck', 'launch', launch);
  copyDir(path.join(FIXTURES, 'sample-launch'), launchDir);
  git(repo.root, ['add', '-A']);
  git(repo.root, ['commit', '-q', '--no-verify', '-m', `launch ${launch}`]);
  return {
    ...repo,
    launch,
    launchDir,
    env: { CLAUDE_PROJECT_DIR: repo.root, FLIGHTCREW_ROOT: repo.root },
  };
}

// ── assertions ───────────────────────────────────────────────────────────────
function show(value, limit = 240) {
  let text;
  try {
    text = typeof value === 'string' ? JSON.stringify(value) : JSON.stringify(value) ?? String(value);
  } catch {
    text = String(value);
  }
  return text.length > limit ? `${text.slice(0, limit)}…` : text;
}

function tailOf(text, lines = 6, limit = 400) {
  const kept = String(text ?? '').split('\n').filter((line) => line.trim() !== '').slice(-lines).join(' / ');
  return kept.length > limit ? `…${kept.slice(-limit)}` : kept || '(empty)';
}

export function assert(cond, msg = 'assertion failed') {
  if (!cond) throw new Error(msg);
}

export function assertEq(actual, expected, msg = 'values differ') {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${msg}: expected ${show(expected)}, got ${show(actual)}`);
  }
}

export function assertMatch(str, regex, msg = 'pattern not matched') {
  const re = regex instanceof RegExp ? regex : new RegExp(String(regex));
  if (!re.test(String(str ?? ''))) {
    throw new Error(`${msg}: ${re} did not match ${show(tailOf(str))}`);
  }
}

export function assertIncludes(hay, needle, msg = 'needle not found') {
  const found = Array.isArray(hay)
    ? hay.some((item) => isDeepStrictEqual(item, needle))
    : String(hay ?? '').includes(String(needle));
  if (!found) {
    throw new Error(`${msg}: ${show(needle)} not in ${Array.isArray(hay) ? show(hay) : show(tailOf(hay))}`);
  }
}

export function assertExit(result, code, msg = 'exit code') {
  if (!result || result.code !== code) {
    const got = result ? `${result.code}${result.signal ? ` (signal ${result.signal})` : ''}` : String(result);
    throw new Error(`${msg}: expected exit ${code}, got ${got} | stdout: ${tailOf(result?.stdout)} | stderr: ${tailOf(result?.stderr)}`);
  }
}

// ── the suite runner ─────────────────────────────────────────────────────────
function idCompare(a, b) {
  const pa = /^([A-Za-z]+)(\d*)$/.exec(a) ?? [a, a, ''];
  const pb = /^([A-Za-z]+)(\d*)$/.exec(b) ?? [b, b, ''];
  if (pa[1] !== pb[1]) return pa[1] < pb[1] ? -1 : 1;
  return (Number(pa[2]) || 0) - (Number(pb[2]) || 0) || (a < b ? -1 : a > b ? 1 : 0);
}

/** Runs cases sequentially with a 120 s timeout each, prints the protocol lines, cleans up, and exits 0 or 2. */
export async function suite(name, cases) {
  arm();
  const list = Array.isArray(cases) ? cases : [];
  current.name = name;
  current.total = list.length;
  current.passed = 0;
  current.running = true;
  const covers = new Set();
  for (const [index, c] of list.entries()) {
    const id = c && typeof c.id === 'string' && c.id ? c.id : `case-${index + 1}`;
    for (const ref of c?.covers ?? []) covers.add(String(ref));
    let timer = null;
    try {
      if (!c || typeof c.fn !== 'function') throw new Error('case has no fn');
      await Promise.race([
        Promise.resolve().then(() => c.fn()),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error(`timeout after ${TIMEOUT_MS} ms`)), TIMEOUT_MS);
        }),
      ]);
      current.passed += 1;
      out(`pass  ${id}`);
    } catch (error) {
      out(`FAIL  ${id}: ${oneLine(error)}`);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  out(`covers: ${[...covers].sort(idCompare).join(' ')}`);
  out(`${current.passed}/${current.total} passed`);
  current.running = false;
  cleanupTmp();
  process.exit(current.passed === current.total ? 0 : 2);
}
