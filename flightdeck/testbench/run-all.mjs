// testbench/run-all.mjs — runs every flightdeck/testbench/suites/*/run.mjs in name order, prints one line per suite, checks hygiene, and records testbench/runs/last.json.
// Usage: node flightdeck/testbench/run-all.mjs [--only <substring>]; exit 0 when every suite passes and hygiene holds, 1 on a usage or environment error (including a missing or empty suites directory: a run with no suites is an environment error, never a vacuous pass), 2 otherwise.
//
// Suite protocol (spec I9): a suite takes no arguments, prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed' last, and exits 0 or 2.
// Hygiene (spec C7): every child suite runs with TMPDIR set to a private directory created under os.tmpdir() for this run, so each suite's os.tmpdir() is that directory; any entry left in it after the last suite is a leak and fails the run, and the directory is removed so the set of entry names under the real os.tmpdir() is unchanged. The output of 'git status --porcelain' at the repository root is snapshotted before the first suite and after the last; any new status line outside flightdeck/testbench/runs/ fails the run. Scoping the temp check to a private directory keeps it deterministic when other processes use the machine's temp directory at the same time.
// Directories starting with '_' or without a run.mjs are skipped. Each suite's full output is kept at testbench/runs/<suite>.log.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FD = path.resolve(HERE, '..');
const REPO = path.resolve(FD, '..');
const SUITES = path.join(HERE, 'suites');
const RUNS = path.join(HERE, 'runs');
const RUNS_REL = 'flightdeck/testbench/runs/';
const SUITE_TIMEOUT_MS = 30 * 60 * 1000;
const SCRUBBED = ['CLAUDE_PROJECT_DIR', 'FLIGHTCREW_ROOT', 'FLIGHTCREW_LAUNCH'];

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

function usage(message) {
  process.stderr.write(`run-all: ${message}\nusage: node flightdeck/testbench/run-all.mjs [--only <substring>]\n`);
  process.exit(1);
}

function parseArgs(argv) {
  let only = null;
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--only') {
      if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) usage('--only needs a substring');
      only = argv[i + 1];
      i += 1;
    } else {
      usage(`unknown argument ${argv[i]}`);
    }
  }
  return { only };
}

let privateTmp = null;

function childEnv() {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!SCRUBBED.includes(key) && value !== undefined) env[key] = value;
  }
  if (privateTmp) {
    env.TMPDIR = privateTmp;
    env.TMP = privateTmp;
    env.TEMP = privateTmp;
  }
  return env;
}

function snapshot() {
  const status = spawnSync('git', ['status', '--porcelain'], { cwd: REPO, encoding: 'utf8', env: childEnv(), maxBuffer: 64 * 1024 * 1024 });
  const lines = status.status === 0 ? status.stdout.split('\n').filter((line) => line !== '') : [];
  return { git: new Set(lines) };
}

function leakedEntries() {
  try {
    return fs.readdirSync(privateTmp).sort();
  } catch {
    return [];
  }
}

function removePrivateTmp() {
  try {
    fs.rmSync(privateTmp, { recursive: true, force: true });
  } catch {
    // best effort; a leftover private directory is reported below
  }
}

function statusPath(line) {
  let p = line.slice(3);
  const arrow = p.indexOf(' -> ');
  if (arrow >= 0) p = p.slice(arrow + 4);
  if (p.startsWith('"') && p.endsWith('"')) p = p.slice(1, -1);
  return p;
}

function listSuites(only) {
  if (!fs.existsSync(SUITES)) return [];
  return fs
    .readdirSync(SUITES, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
    .map((entry) => entry.name)
    .filter((name) => fs.existsSync(path.join(SUITES, name, 'run.mjs')))
    .filter((name) => only === null || name.includes(only))
    .sort();
}

function runSuite(name) {
  const runPath = path.join(SUITES, name, 'run.mjs');
  const started = Date.now();
  const result = spawnSync(process.execPath, [runPath], {
    cwd: REPO,
    env: childEnv(),
    encoding: 'utf8',
    timeout: SUITE_TIMEOUT_MS,
    maxBuffer: 64 * 1024 * 1024,
    killSignal: 'SIGKILL',
  });
  const ms = Date.now() - started;
  const stdout = result.stdout ?? '';
  const stderr = `${result.stderr ?? ''}${result.error ? `[run-all] ${result.error.code === 'ETIMEDOUT' ? `timeout after ${SUITE_TIMEOUT_MS} ms` : result.error.message}\n` : ''}`;
  const lines = stdout.split('\n').filter((line) => line !== '');
  const count = /^(\d+)\/(\d+) passed$/.exec(lines[lines.length - 1] ?? '');
  const passed = count ? Number(count[1]) : 0;
  const total = count ? Number(count[2]) : 0;
  const code = typeof result.status === 'number' ? result.status : null;
  const ok = code === 0 && count !== null;
  const log = path.join(RUNS, `${name}.log`);
  try {
    fs.writeFileSync(log, `# suite ${name}\n# exit ${code}${result.signal ? ` signal ${result.signal}` : ''} · ${ms} ms\n# --- stdout ---\n${stdout}\n# --- stderr ---\n${stderr}`);
  } catch {
    // the log is a convenience; the verdict does not depend on it
  }
  return { name, ok, code, signal: result.signal ?? null, passed, total, ms, log: path.relative(REPO, log), count_line: count !== null };
}

function main() {
  const { only } = parseArgs(process.argv.slice(2));
  fs.mkdirSync(RUNS, { recursive: true });
  const suites = listSuites(only);
  if (only !== null && suites.length === 0) usage(`no suite matches '${only}'`);
  if (suites.length === 0) usage('no suites found under flightdeck/testbench/suites');

  privateTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-runall-'));
  const before = snapshot();
  const results = [];
  for (const name of suites) {
    const r = runSuite(name);
    results.push(r);
    out(`${r.ok ? 'ok' : 'FAIL'} ${r.name} (${r.passed}/${r.total}, ${r.ms} ms)`);
  }
  const after = snapshot();

  const newTmp = leakedEntries();
  removePrivateTmp();
  if (fs.existsSync(privateTmp)) newTmp.push(path.basename(privateTmp));
  const newGit = [...after.git]
    .filter((line) => !before.git.has(line))
    .filter((line) => {
      const p = statusPath(line);
      return !(p === RUNS_REL || p === RUNS_REL.slice(0, -1) || p.startsWith(RUNS_REL));
    })
    .sort();
  const hygieneOk = newTmp.length === 0 && newGit.length === 0;
  if (hygieneOk) {
    out('hygiene: ok');
  } else {
    const parts = [];
    if (newTmp.length) parts.push(`new tmpdir entries: ${newTmp.join(', ')}`);
    if (newGit.length) parts.push(`new git status lines: ${newGit.join(', ')}`);
    out(`hygiene: FAIL ${parts.join('; ')}`);
  }

  const failed = results.some((r) => !r.ok);
  const exit = failed || !hygieneOk ? 2 : 0;
  const record = {
    ran_at: new Date().toISOString(),
    repo: REPO,
    only,
    suites: results,
    hygiene: { ok: hygieneOk, new_tmpdir_entries: newTmp, new_status_lines: newGit },
    exit,
  };
  try {
    fs.writeFileSync(path.join(RUNS, 'last.json'), `${JSON.stringify(record, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`run-all: could not write last.json: ${error.message}\n`);
  }
  process.exit(exit);
}

try {
  main();
} catch (error) {
  process.stderr.write(`run-all: error ${error && error.stack ? error.stack : error}\n`);
  process.exit(2);
}
