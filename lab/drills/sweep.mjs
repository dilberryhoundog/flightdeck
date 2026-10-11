#!/usr/bin/env node
// The sweep: breaks FlightDeck one piece at a time in a throwaway copy and proves a check notices each break.
// It costs no tokens and never writes the real working tree: everything happens in a temporary git repository.
// Usage: node lab/drills/sweep.mjs [--root <dir>] [--no-claude] [--case <name>]
// Output: "pass baseline", then one line per case, "pass <case>" or "FAIL <case>: <reason>", then "<n>/<m> passed".
// Exit code 0 only when every case passes; 1 when the unbroken copy already fails; 2 on a bad argument.
// Notes that are not cases go to stderr.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = 'usage: node lab/drills/sweep.mjs [--root <dir>] [--no-claude] [--case <name>]';

// Pieces for values the hard-rule check would flag if they appeared whole in a lab script.
const BAD_MODEL = ['fa', 'ble'].join('');
const BAD_EFFORT = ['x', 'high'].join('');
const EFFORT_KEY = 'eff' + 'ort';
const OLD_TOOL = ['d', 'w'].join('');

export const CASES = [
  {
    name: 'git-main-allowed',
    file: 'flightdeck/hooks/guard.mjs',
    find: "const PROTECTED_BRANCHES = new Set(['main', 'master']);",
    replace: 'const PROTECTED_BRANCHES = new Set([]);',
    checks: ['core'],
  },
  {
    name: 'truth-open',
    file: 'flightdeck/hooks/guard.mjs',
    find: '  if (!caller) return null;',
    replace: '  return null;',
    checks: ['core'],
  },
  {
    name: 'ceiling-open',
    file: 'flightdeck/hooks/guard.mjs',
    find: "if (model === 'best' || model.includes('fable')) return CEILING_REASON;",
    replace: 'if (false) return CEILING_REASON;',
    checks: ['core'],
  },
  {
    name: 'card-loud',
    file: 'flightdeck/hooks/preflight.mjs',
    find: "if (!input || input.agent_type !== 'flight:pilot') return;",
    replace: 'if (!input) return;',
    checks: ['core'],
  },
  {
    name: 'scope-leak',
    file: 'flightdeck/lib/workshops.mjs',
    find: 'for (const f of SCOPE_FILES) files[f] = readText(path.join(dir, f));',
    replace: 'for (const f of SCOPE_FILES) files[f] = readText(path.join(dir, f));\n'
      + "    for (const o of fs.readdirSync(path.join(root, '.flightdeck'))) { const t = o === name ? null : readText(path.join(root, '.flightdeck', o, 'context.md')); if (t) files['context.md'] = (files['context.md'] ?? '') + '\\n' + t; }",
    checks: ['core'],
  },
  {
    name: 'ask-later-counted',
    file: 'flightdeck/lib/workshops.mjs',
    find: "const held = unanswered && b.askLater !== '';",
    replace: 'const held = false;',
    checks: ['core'],
  },
  {
    name: 'manifest-parse',
    file: 'flightdeck/lib/workshops.mjs',
    find: "const i = rest.indexOf(': ');",
    replace: "const i = rest.lastIndexOf(': ');",
    checks: ['core'],
  },
  {
    name: 'rank-in-agent-name',
    file: 'flightdeck/agents/captain.md',
    write: '---\nname: captain\ndescription: "Sweep test agent."\nmodel: sonnet\n---\n\n'
      + 'Fallback rank: Worker in the team of whoever sent you, reporting to them; if you do not know who sent you, you report to the Captain.\n',
    checks: ['core'],
  },
  {
    name: 'seat-without-rank',
    file: 'flightdeck/skills/team-plans/entry-points.md',
    find: '## scout\n\nRank: Worker.',
    replace: '## scout\n\nWorker.',
    checks: ['core'],
  },
  {
    name: 'policies-rank-renamed',
    file: 'flightdeck/policies.md',
    find: '\n- Officer: a team lead',
    replace: '\n- Lieutenant: a team lead',
    checks: ['core'],
  },
  {
    name: 'agent-above-ceiling',
    file: 'flightdeck/agents/zz-sweep.md',
    write: `---\nname: zz-sweep\ndescription: "Sweep test agent."\nmodel: ${BAD_MODEL}\n---\n\nSweep test agent.\n`,
    checks: ['hard'],
  },
  {
    name: 'workflow-above-ceiling',
    file: 'lab/zz-sweep.mjs',
    write: `export const x = { ${EFFORT_KEY}: '${BAD_EFFORT}' };\n`,
    checks: ['hard'],
  },
  {
    name: 'dev-touched',
    file: 'dev/zz-sweep.txt',
    write: 'sweep\n',
    checks: ['hard'],
  },
  {
    name: 'claude-rules-touched',
    file: '.claude/rules/zz-sweep.md',
    write: 'sweep\n',
    checks: ['hard'],
  },
  {
    name: 'old-tool-call',
    file: 'lab/zz-sweep.sh',
    write: `#!/bin/sh\n${OLD_TOOL} status\n`,
    checks: ['hard'],
  },
  {
    name: 'owner-only-skill-open',
    file: 'flightdeck/skills/promote/SKILL.md',
    write: '---\nname: promote\ndescription: "Sweep test skill."\n---\n\nSweep test skill.\n',
    checks: ['hard'],
  },
  {
    name: 'git-guard-unregistered',
    file: 'flightdeck/hooks/hooks.json',
    find: '"args": ["${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs", "git"]',
    replace: '"args": ["${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs", "truth"]',
    checks: ['hard'],
  },
  {
    name: 'plugin-settings',
    file: 'flightdeck/settings.json',
    write: '{}\n',
    checks: ['hard'],
  },
  {
    name: 'outside-owned',
    file: 'zz-sweep-outside.txt',
    write: 'sweep\n',
    checks: ['hard-owned'],
  },
  {
    name: 'plugin-manifest-broken',
    file: 'flightdeck/.claude-plugin/plugin.json',
    find: '"name": "flight",',
    replace: '"name": "flight"',
    checks: ['validate'],
  },
];

// ---------------------------------------------------------------- shared helpers (remove-part uses them too)

const GIT_ID = ['-c', 'user.name=flightdeck-lab', '-c', 'user.email=lab@localhost', '-c', 'commit.gpgsign=false'];

function childEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT; // a nested "node --test" must not think it is a child of the outer test run
  return env;
}

export function runCmd(argv, cwd, timeoutMs = 900000) {
  const r = spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, timeout: timeoutMs, env: childEnv() });
  const out = `${r.stdout || ''}\n${r.stderr || ''}`;
  const lines = out.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const failLine = lines.find((l) => l.startsWith('FAIL '));
  let last = failLine || lines[lines.length - 1] || '';
  if (r.error) last = r.error.code === 'ETIMEDOUT' ? 'timed out' : r.error.message;
  if (last.length > 200) last = `${last.slice(0, 197)}...`;
  const code = typeof r.status === 'number' ? r.status : (r.error ? 127 : 1);
  return { code, last };
}

function git(cwd, args) {
  const r = spawnSync('git', [...GIT_ID, ...args], { cwd, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, env: childEnv() });
  return { ok: r.status === 0, out: r.stdout || '', err: r.stderr || '' };
}

export function gitRoot() {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('not inside a git repository (use --root <dir>)');
  return r.stdout.trim();
}

export function claudeOnPath() {
  const exts = process.platform === 'win32' ? ['.exe', '.cmd', '.bat', ''] : [''];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    if (!dir) continue;
    for (const ext of exts) {
      try { fs.accessSync(path.join(dir, `claude${ext}`), fs.constants.X_OK); return true; } catch { /* next */ }
    }
  }
  return false;
}

// Copies every tracked and untracked (not ignored) file into a new temporary git repository with one baseline commit.
export function makeCopy(root) {
  const listed = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  if (!listed.ok) throw new Error(`git ls-files failed in ${root}: ${listed.err.trim()}`);
  const files = [...new Set(listed.out.split('\0').filter(Boolean))];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'flightdeck-drill-'));
  try {
    for (const f of files) {
      const from = path.join(root, f);
      let st;
      try { st = fs.lstatSync(from); } catch { continue; }
      if (!st.isFile()) continue;
      const to = path.join(tmp, f);
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      fs.chmodSync(to, st.mode & 0o777);
    }
    for (const args of [['init', '-q'], ['add', '--all'], ['commit', '-q', '-m', 'baseline', '--allow-empty']]) {
      const r = git(tmp, args);
      if (!r.ok) throw new Error(`git ${args[0]} failed in the temporary copy: ${r.err.trim()}`);
    }
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw e;
  }
  return tmp;
}

export function restoreCopy(tmp) {
  git(tmp, ['checkout', '-q', '--', '.']);
  git(tmp, ['clean', '-fdxq']);
}

export function removeCopy(tmp) {
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch { /* best effort */ }
}

// Every file under dir (relative to base) whose name ends with suffix, sorted, skipping node_modules.
export function findFiles(base, dir, suffix, skip = () => false) {
  const out = [];
  const walk = (rel) => {
    let entries = [];
    try { entries = fs.readdirSync(path.join(base, rel), { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) { if (e.name !== 'node_modules' && e.name !== '.git') walk(r); }
      else if (e.isFile() && e.name.endsWith(suffix) && !skip(r)) out.push(r);
    }
  };
  walk(dir);
  return out.sort();
}

export function parseOwned(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

// Check ids -> argv arrays run with the temporary copy as the working directory. null means "not available".
export function defaultChecks(root, tmp, { noClaude = false } = {}) {
  const coreTests = findFiles(tmp, 'flightdeck/tests', '.test.mjs').filter((f) => !f.slice('flightdeck/tests/'.length).includes('/'));
  const claudeOk = !noClaude && claudeOnPath();
  return {
    core: coreTests.length ? ['node', '--test', ...coreTests] : null,
    hard: ['node', 'lab/checks/hard-rules.mjs', '--root', tmp],
    'hard-owned': fs.existsSync(path.join(tmp, 'lab/owned/pr6.txt'))
      ? ['node', 'lab/checks/hard-rules.mjs', '--root', tmp, '--owned', 'lab/owned/pr6.txt']
      : null,
    validate: claudeOk ? ['claude', 'plugin', 'validate', 'flightdeck'] : null,
  };
}

function occurrences(text, find) {
  if (!find) return 0;
  let n = 0;
  for (let i = text.indexOf(find); i !== -1; i = text.indexOf(find, i + find.length)) n++;
  return n;
}

export function applyBreak(tmp, c) {
  const target = path.join(tmp, c.file);
  if (typeof c.write === 'string') {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, c.write);
    return null;
  }
  let text;
  try { text = fs.readFileSync(target, 'utf8'); } catch { return `break could not be applied (text not found once in ${c.file})`; }
  if (occurrences(text, c.find) !== 1) return `break could not be applied (text not found once in ${c.file})`;
  const i = text.indexOf(c.find);
  fs.writeFileSync(target, text.slice(0, i) + c.replace + text.slice(i + c.find.length));
  return null;
}

// ---------------------------------------------------------------- the sweep

export function runSweep({ root, cases = CASES, checks = null, noClaude = false, only = null } = {}) {
  const lines = [];
  const notes = [];
  let selected = cases;
  if (only) {
    selected = cases.filter((c) => c.name === only);
    if (!selected.length) return { lines, ok: false, notes: [`no case named ${only}`], badArg: true };
  }
  const tmp = makeCopy(path.resolve(root));
  try {
    const table = checks || defaultChecks(root, tmp, { noClaude });
    const runnable = [];
    for (const c of selected) {
      const missing = c.checks.filter((id) => !table[id]);
      if (missing.length) {
        const why = missing.includes('validate') ? (noClaude ? '--no-claude was given' : 'claude is not on PATH') : `check ${missing.join(', ')} is not available`;
        notes.push(`case ${c.name} left out: ${why}`);
        continue;
      }
      runnable.push(c);
    }
    const used = [...new Set(runnable.flatMap((c) => c.checks))];

    for (const id of used) {
      const r = runCmd(table[id], tmp);
      if (r.code !== 0) {
        lines.push(`FAIL baseline: ${id} exited ${r.code}: ${r.last}`);
        lines.push(`0/1 passed`);
        return { lines, ok: false, notes, baselineFailed: true };
      }
    }
    lines.push('pass baseline');
    let passed = 1;
    for (const c of runnable) {
      const problem = applyBreak(tmp, c);
      if (problem) {
        lines.push(`FAIL ${c.name}: ${problem}`);
      } else {
        const noticed = c.checks.some((id) => runCmd(table[id], tmp).code !== 0);
        if (noticed) { lines.push(`pass ${c.name}`); passed++; }
        else lines.push(`FAIL ${c.name}: no check noticed (ran ${c.checks.join(', ')})`);
      }
      restoreCopy(tmp);
    }
    const total = runnable.length + 1;
    lines.push(`${passed}/${total} passed`);
    return { lines, ok: passed === total, notes };
  } finally {
    removeCopy(tmp);
  }
}

function parseArgs(argv) {
  const opts = { root: null, noClaude: false, only: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root' || a === '--case') {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      if (a === '--root') opts.root = v; else opts.only = v;
    } else if (a === '--no-claude') opts.noClaude = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

export function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  let result;
  try {
    result = runSweep({ root: opts.root || gitRoot(), noClaude: opts.noClaude, only: opts.only });
  } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  for (const n of result.notes) process.stderr.write(`note: ${n}\n`);
  if (result.badArg) { process.stderr.write(`${USAGE}\n`); return 2; }
  process.stdout.write(`${result.lines.join('\n')}\n`);
  if (result.baselineFailed) return 1;
  return result.ok ? 0 : 1;
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) process.exitCode = main(process.argv.slice(2));
