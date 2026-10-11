// Tests for the lab: the lint, the sweep, remove-part, the climb and the interview drill.
// Run with: node --test 'lab/tests/*.test.mjs'
// No model calls and no claude calls: fixtures are temporary folders and the workflow scripts run against a stub harness.
import { after, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const GIT = ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false'];

const { lint } = await import(path.join(REPO, 'lab/checks/lint.mjs'));
const { CASES, runSweep } = await import(path.join(REPO, 'lab/drills/sweep.mjs'));
const { removeParts } = await import(path.join(REPO, 'lab/drills/remove-part.mjs'));

const made = [];
function tmpDir(prefix) {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), `lab-test-${prefix}-`));
  made.push(d);
  return d;
}
after(() => { for (const d of made) fs.rmSync(d, { recursive: true, force: true }); });

function put(root, rel, text, mode) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, text);
  if (mode) fs.chmodSync(f, mode);
}

function git(cwd, args) {
  const r = spawnSync('git', [...GIT, ...args], { cwd, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

function gitRepo(prefix, files) {
  const root = tmpDir(prefix);
  for (const [rel, text] of Object.entries(files)) put(root, rel, text);
  git(root, ['init', '-q']);
  git(root, ['add', '--all']);
  git(root, ['commit', '-q', '-m', 'fixture']);
  return root;
}

function cleanEnv() {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  return env;
}

function node(args, cwd = REPO) {
  return spawnSync(process.execPath, args, { cwd, encoding: 'utf8', env: cleanEnv() });
}

// ------------------------------------------------------------------ lint

describe('lint', () => {
  function dirtyFixture() {
    const root = tmpDir('lint-dirty');
    put(root, 'flightdeck/skills/long/SKILL.md', `---\nname: long\ndescription: "${'x'.repeat(450)}"\n---\n\nBody.\n`);
    put(root, 'flightdeck/agents/loose.md', '---\nname: loose\ndescription: "An agent."\npermissionMode: acceptEdits\n---\n\nBody.\n');
    put(root, 'flightdeck/notes.md', `See ${'/' + 'Users' + '/someone/project'} for the files.\n`);
    put(root, '.flightdeck/big/context.md', `${'a'.repeat(3000)}\n`);
    put(root, '.flightdeck/big/verify.md', `${'b'.repeat(3200)}\n`);
    return root;
  }
  function cleanFixture() {
    const root = tmpDir('lint-clean');
    put(root, 'CLAUDE.md', 'Short.\n');
    put(root, 'flightdeck/skills/short/SKILL.md', '---\nname: short\ndescription: "A short one."\n---\n\nBody.\n');
    put(root, 'flightdeck/agents/tidy.md', '---\nname: tidy\ndescription: "An agent."\nmodel: sonnet\n---\n\nBody.\n');
    put(root, '.flightdeck/small/context.md', 'A fact.\n');
    return root;
  }

  test('four rules fire on a dirty fixture, one warning each', () => {
    const r = lint(dirtyFixture());
    assert.deepEqual(r.rules, ['claude-md-length', 'context-length', 'workshop-scope-size', 'skill-description', 'agent-dropped-fields', 'machine-paths', 'manual-length']);
    const count = (rule) => r.warnings.filter((w) => w.rule === rule).length;
    assert.equal(count('skill-description'), 1);
    assert.equal(count('agent-dropped-fields'), 1);
    assert.equal(count('machine-paths'), 1);
    assert.equal(count('workshop-scope-size'), 1);
    assert.equal(r.warnings.length, 4);
    assert.ok(r.warnings.every((w) => w.rule && w.file && w.detail));
  });

  test('length rules fire on long files', () => {
    const root = tmpDir('lint-long');
    put(root, 'CLAUDE.md', `${'line\n'.repeat(61)}`);
    put(root, '.flightdeck/CLAUDE.md', `${'line\n'.repeat(41)}`);
    put(root, 'lab/CLAUDE.md', `${'line\n'.repeat(40)}`);
    put(root, '.flightdeck/ws/context.md', `${'fact\n'.repeat(41)}`);
    put(root, 'flightdeck/manuals/a/long.md', `${'line\n'.repeat(101)}`);
    const r = lint(root);
    const files = (rule) => r.warnings.filter((w) => w.rule === rule).map((w) => w.file).sort();
    assert.deepEqual(files('claude-md-length'), ['.flightdeck/CLAUDE.md', 'CLAUDE.md']);
    assert.deepEqual(files('context-length'), ['.flightdeck/ws/context.md']);
    assert.deepEqual(files('manual-length'), ['flightdeck/manuals/a/long.md']);
  });

  test('a clean fixture has no warnings and a malformed file is a warning, not an exception', () => {
    assert.deepEqual(lint(cleanFixture()).warnings, []);
    const root = tmpDir('lint-odd');
    put(root, 'flightdeck/skills/odd/SKILL.md', 'no frontmatter here\n');
    put(root, 'flightdeck/agents/odd.md', 'no frontmatter here\n');
    const r = lint(root);
    assert.equal(r.warnings.length, 2);
  });

  test('the machine-paths rule skips results folders and the tests folder', () => {
    const root = tmpDir('lint-skip');
    const p = '/' + 'tmp' + '/claude-x';
    put(root, 'lab/results/run/notes.md', `${p}\n`);
    put(root, 'lab/tests/a.mjs', `${p}\n`);
    put(root, 'lab/evals/results/r.json', `${p}\n`);
    assert.deepEqual(lint(root).warnings, []);
  });

  test('the CLI exits 0 and ends with the count line, dirty or clean', () => {
    for (const root of [dirtyFixture(), cleanFixture()]) {
      const r = node(['lab/checks/lint.mjs', '--root', root]);
      assert.equal(r.status, 0, r.stderr);
      const lines = r.stdout.trim().split('\n');
      assert.match(lines[lines.length - 1], /^\d+\/\d+ rules clean, \d+ warnings$/);
      assert.ok(lines.slice(0, -1).every((l) => /^(pass|warn) /.test(l)), r.stdout);
      assert.ok(!/FAIL/.test(r.stdout));
    }
  });

  test('--json prints the object and a bad argument exits 2', () => {
    const r = node(['lab/checks/lint.mjs', '--root', cleanFixture(), '--json']);
    assert.equal(r.status, 0);
    const obj = JSON.parse(r.stdout);
    assert.equal(obj.rules.length, 7);
    assert.deepEqual(obj.warnings, []);
    assert.equal(node(['lab/checks/lint.mjs', '--nope']).status, 2);
  });

  test('the CLI on the real repository exits 0', () => {
    const r = node(['lab/checks/lint.mjs']);
    assert.equal(r.status, 0, r.stderr);
    assert.match(r.stdout.trim().split('\n').pop(), /^\d+\/\d+ rules clean, \d+ warnings$/);
  });
});

// ------------------------------------------------------------------ sweep

describe('sweep engine', () => {
  const CHECK = "import fs from 'node:fs';\nprocess.exit(fs.readFileSync('flag.txt', 'utf8').trim() === 'bad' ? 1 : 0);\n";
  const fixture = (flag = 'good\n') => gitRepo('sweep', { 'check.mjs': CHECK, 'flag.txt': flag });
  const checks = { fx: ['node', 'check.mjs'] };

  test('noticed, not noticed and not applicable are told apart', () => {
    const root = fixture();
    const cases = [
      { name: 'flip', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
      { name: 'unrelated', file: 'other.txt', write: 'x\n', checks: ['fx'] },
      { name: 'absent', file: 'flag.txt', find: 'nope', replace: 'x', checks: ['fx'] },
    ];
    const r = runSweep({ root, cases, checks, noClaude: true });
    assert.deepEqual(r.lines, [
      'pass baseline',
      'pass flip',
      'FAIL unrelated: no check noticed (ran fx)',
      'FAIL absent: break could not be applied (text not found once in flag.txt)',
      '2/4 passed',
    ]);
    assert.equal(r.ok, false);
    assert.equal(fs.readFileSync(path.join(root, 'flag.txt'), 'utf8'), 'good\n');
    assert.ok(!fs.existsSync(path.join(root, 'other.txt')));
  });

  test('a find text that occurs twice is not applied', () => {
    const root = gitRepo('sweep-twice', { 'check.mjs': CHECK, 'flag.txt': 'good good\n' });
    const r = runSweep({ root, cases: [{ name: 'twice', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] }], checks, noClaude: true });
    assert.equal(r.lines[1], 'FAIL twice: break could not be applied (text not found once in flag.txt)');
  });

  test('a replace text with a dollar sign is written as it is', () => {
    const root = gitRepo('sweep-dollar', { 'check.mjs': "import fs from 'node:fs';\nprocess.exit(fs.readFileSync('flag.txt', 'utf8').includes('$&') ? 1 : 0);\n", 'flag.txt': 'good\n' });
    const r = runSweep({ root, cases: [{ name: 'dollar', file: 'flag.txt', find: 'good', replace: '$&', checks: ['fx'] }], checks, noClaude: true });
    assert.deepEqual(r.lines, ['pass baseline', 'pass dollar', '2/2 passed']);
  });

  test('a case that is broken in one copy does not leak into the next case', () => {
    const root = fixture();
    const cases = [
      { name: 'flip', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
      { name: 'quiet', file: 'other.txt', write: 'x\n', checks: ['fx'] },
    ];
    const r = runSweep({ root, cases, checks, noClaude: true });
    assert.equal(r.lines[2], 'FAIL quiet: no check noticed (ran fx)');
  });

  test('a failing baseline is reported and stops the sweep', () => {
    const root = fixture('bad\n');
    const r = runSweep({ root, cases: [{ name: 'flip', file: 'flag.txt', find: 'bad', replace: 'worse', checks: ['fx'] }], checks, noClaude: true });
    assert.equal(r.ok, false);
    assert.match(r.lines[0], /^FAIL baseline: fx exited 1/);
    assert.ok(!r.lines.some((l) => l.includes('flip')));
  });

  test('only runs one case, and an unknown case is a bad argument', () => {
    const root = fixture();
    const cases = [
      { name: 'a', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
      { name: 'b', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
    ];
    assert.deepEqual(runSweep({ root, cases, checks, noClaude: true, only: 'b' }).lines, ['pass baseline', 'pass b', '2/2 passed']);
    assert.equal(runSweep({ root, cases, checks, noClaude: true, only: 'zzz' }).badArg, true);
    assert.equal(node(['lab/drills/sweep.mjs', '--case', 'zzz']).status, 2);
    assert.equal(node(['lab/drills/sweep.mjs', '--nope']).status, 2);
  });

  test('the real working tree is not touched', () => {
    const before = git(REPO, ['status', '--porcelain']);
    const r = runSweep({ root: REPO, cases: [{ name: 'writes', file: 'zz-test-sweep-outside.txt', write: 'x\n', checks: ['fx'] }], checks: { fx: ['node', '-e', 'process.exit(0)'] }, noClaude: true });
    assert.equal(r.lines[1], 'FAIL writes: no check noticed (ran fx)');
    assert.equal(git(REPO, ['status', '--porcelain']), before);
    assert.ok(!fs.existsSync(path.join(REPO, 'zz-test-sweep-outside.txt')));
  });

  test('the scope-leak case is noticed by the core tests on the real tree', () => {
    const r = runSweep({ root: REPO, noClaude: true, only: 'scope-leak' });
    assert.deepEqual(r.lines, ['pass baseline', "pass scope-leak (one workshop's notes were let into another workshop)", '2/2 passed']);
    assert.equal(r.ok, true);
  });

  test('a case with a say sentence prints it in brackets, and a case without prints the bare name', () => {
    const root = fixture();
    const cases = [
      { name: 'flip', say: 'a flag was turned bad', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
      { name: 'quiet', say: 'a stray file was added', file: 'other.txt', write: 'x\n', checks: ['fx'] },
      { name: 'bare', file: 'flag.txt', find: 'good', replace: 'bad', checks: ['fx'] },
    ];
    assert.deepEqual(runSweep({ root, cases, checks, noClaude: true }).lines, [
      'pass baseline',
      'pass flip (a flag was turned bad)',
      'FAIL quiet (a stray file was added): no check noticed (ran fx)',
      'pass bare',
      '3/4 passed',
    ]);
  });

  test('a selected case that was left out is a bad argument: no pass baseline, exit 2', () => {
    const r = runSweep({ root: REPO, noClaude: true, only: 'plugin-manifest-broken' });
    assert.equal(r.badArg, true);
    assert.equal(r.ok, false);
    assert.deepEqual(r.lines, []);
    assert.ok(r.notes.some((n) => /^case plugin-manifest-broken not run: --no-claude was given$/.test(n)), r.notes.join('|'));
    const cli = node(['lab/drills/sweep.mjs', '--no-claude', '--case', 'plugin-manifest-broken']);
    assert.equal(cli.status, 2);
    assert.ok(!/pass baseline|passed/.test(cli.stdout), cli.stdout);
  });
});

describe('sweep table', () => {
  test('names are unique and shapes are valid', () => {
    const names = CASES.map((c) => c.name);
    assert.equal(new Set(names).size, names.length);
    for (const c of CASES) {
      assert.ok(c.name && c.file, `name and file on ${c.name}`);
      const isEdit = typeof c.find === 'string' && typeof c.replace === 'string';
      const isWrite = typeof c.write === 'string';
      assert.ok(isEdit !== isWrite, `${c.name} is either find and replace or write`);
      assert.ok(Array.isArray(c.checks) && c.checks.length > 0, `${c.name} lists checks`);
      for (const id of c.checks) assert.ok(['core', 'hard', 'hard-owned', 'validate'].includes(id), `${c.name} uses check ${id}`);
    }
  });

  test('every case has a non-empty say sentence', () => {
    assert.equal(CASES.length, 20);
    for (const c of CASES) assert.ok(typeof c.say === 'string' && c.say.trim().length > 0, `${c.name} has a say`);
  });

  test('the table holds the 19 cases plus the manifest case, with the scope leak in it', () => {
    assert.ok(CASES.some((c) => c.name === 'scope-leak'));
    assert.equal(CASES.filter((c) => !c.checks.includes('validate')).length, 19);
    assert.deepEqual(CASES.filter((c) => c.checks.includes('validate')).map((c) => c.name), ['plugin-manifest-broken']);
  });

  test('every find text occurs exactly once in its file', () => {
    for (const c of CASES) {
      if (typeof c.find !== 'string') continue;
      const text = fs.readFileSync(path.join(REPO, c.file), 'utf8');
      assert.equal(text.split(c.find).length - 1, 1, `${c.name}: find text in ${c.file}`);
    }
  });
});

// ------------------------------------------------------------------ remove-part

describe('remove-part engine', () => {
  const CHECK = "import fs from 'node:fs';\nif (!fs.existsSync('core.txt')) { console.error('core.txt missing'); process.exit(1); }\n";
  const base = () => ({ 'check.mjs': CHECK, 'core.txt': 'core\n', 'extra/a.txt': 'a\n', 'lab/owned/pr1.txt': '# part one\ncore.txt\n' });
  const commands = [['node', 'check.mjs']];

  test('a good part passes and a part the check needs fails', () => {
    const root = gitRepo('parts', { ...base(), 'lab/owned/pr9.txt': '# nine\nextra/a.txt\n', 'lab/owned/pr8.txt': 'core.txt\n' });
    const r = removeParts({ root, noClaude: true, commands });
    assert.deepEqual(r.lines, [
      'pass baseline',
      'FAIL remove pr8: node check.mjs exited 1: core.txt missing',
      'pass remove pr9',
      '2/3 passed',
    ]);
    assert.equal(r.ok, false);
    assert.ok(fs.existsSync(path.join(root, 'core.txt')) && fs.existsSync(path.join(root, 'extra/a.txt')));
  });

  test('a path listed by two parts is reported', () => {
    const root = gitRepo('parts-twice', { ...base(), 'lab/owned/pr7.txt': 'extra/a.txt\n', 'lab/owned/pr9.txt': 'extra/a.txt\n' });
    const r = removeParts({ root, noClaude: true, commands });
    assert.equal(r.lines[0], 'FAIL lists: extra/a.txt is listed by pr7 and pr9');
    assert.equal(r.ok, false);
  });

  test('a listed path that does not exist is skipped without failing', () => {
    const root = gitRepo('parts-ghost', { ...base(), 'lab/owned/pr9.txt': 'ghost/none.txt\nextra/a.txt\n' });
    const r = removeParts({ root, noClaude: true, commands });
    assert.deepEqual(r.lines, ['pass baseline', 'pass remove pr9', '2/2 passed']);
    assert.equal(r.ok, true);
  });

  test('pr1 is never a part, and no parts means only the baseline', () => {
    const root = gitRepo('parts-none', base());
    assert.deepEqual(removeParts({ root, noClaude: true, commands }).lines, ['pass baseline', '1/1 passed']);
  });

  test('a failing baseline is reported and stops', () => {
    const root = gitRepo('parts-bad', { 'check.mjs': CHECK, 'lab/owned/pr9.txt': 'x.txt\n' });
    const r = removeParts({ root, noClaude: true, commands });
    assert.match(r.lines[0], /^FAIL baseline: node check\.mjs exited 1: core\.txt missing$/);
    assert.ok(!r.lines.some((l) => l.startsWith('pass remove')));
    assert.equal(r.ok, false);
  });

  test('the CLI rejects an unknown argument', () => {
    assert.equal(node(['lab/drills/remove-part.mjs', '--nope']).status, 2);
  });
});

// ------------------------------------------------------------------ workflow scripts (stub harness)

async function runScript(file, args, agentImpl) {
  const raw = fs.readFileSync(path.join(REPO, file), 'utf8');
  assert.ok(raw.startsWith('export const meta'), `${file} starts with export const meta`);
  const src = raw.replace(/^export const meta/m, 'const meta');
  const prompts = [];
  const agent = async (prompt, opts) => { prompts.push({ prompt, opts }); return agentImpl(prompt, opts); };
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t().catch(() => null)));
  const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => { let r = it; for (const s of stages) r = await s(r, it, i); return r; }));
  const fn = new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', `return (async () => {${src}\n})()`);
  const result = await fn(agent, parallel, pipeline, () => {}, () => {}, args);
  return { result, prompts };
}

function assertShape(file, prompts) {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  assert.ok(src.startsWith('export const meta'));
  assert.ok(!/Date\.now|Math\.random|export default/.test(src), 'no clock, randomness or default export');
  assert.ok(prompts.length > 0);
  for (const { opts } of prompts) {
    assert.ok(opts.label, 'every agent call has a label');
    assert.ok(['haiku', 'sonnet', 'opus'].includes(opts.model), `model named in ${opts.label}`);
    assert.ok(['low', 'medium', 'high'].includes(opts.effort), `effort within the ceiling in ${opts.label}`);
  }
}

describe('climb', () => {
  const FILE = 'lab/workflows/climb.js';
  const ARGS = {
    target: 'flightdeck/skills/team-plans/SKILL.md',
    train: 'climb-team-plans-train-*',
    test: 'climb-team-plans-test-*',
    repo: '/r',
    scratch: '/s',
    today: '2026-10-11',
    rounds: 1,
    dryRun: true,
  };

  // scores: [base1, base2, r1, r2, ...] as {train, test}
  function stub(scores, extra = {}) {
    return (prompt, opts) => {
      const l = opts.label;
      if (extra[l]) return typeof extra[l] === 'function' ? extra[l]() : extra[l];
      if (l === 'climb:setup') return { ok: true, eval_available: true, notes: '' };
      let m = /^climb:measure:(base-1|base-2|r(\d+))$/.exec(l);
      if (m) {
        const idx = m[1] === 'base-1' ? 0 : m[1] === 'base-2' ? 1 : 1 + Number(m[2]);
        return { ...scores[idx], cost_usd: 0.1, ok: true, notes: '' };
      }
      m = /^climb:propose:r(\d+)$/.exec(l);
      if (m) return { commit: `c${m[1]}`, summary: `change ${m[1]}`, ok: true };
      if (/^climb:revert:r\d+$/.test(l)) return { ok: true, commit: 'rv' };
      if (l === 'climb:report') return { report_path: '/s/report.md', report_text: 'report', pr_url: '' };
      throw new Error(`unexpected agent ${l}`);
    };
  }
  const labels = (prompts) => prompts.map((p) => p.opts.label);
  const BASES = [{ train: 0.5, test: 0.5 }, { train: 0.52, test: 0.5 }];

  test('shape: meta first, no clock, randomness or default export, models within the ceiling', async () => {
    const { prompts } = await runScript(FILE, { ...ARGS, rounds: 2 }, stub([...BASES, { train: 0.8, test: 0.8 }, { train: 0.81, test: 0.81 }]));
    assertShape(FILE, prompts);
    const src = fs.readFileSync(path.join(REPO, FILE), 'utf8');
    assert.match(src, /^export const meta = \{ name: 'flightdeck-lab-climb'/);
  });

  test('a change that only raises the training score is reverted: within noise, do not merge', async () => {
    const { result, prompts } = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.5 }]));
    assert.equal(result.rounds.length, 1);
    assert.equal(result.rounds[0].decision, 'reverted');
    assert.match(result.rounds[0].reason, /test did not rise beyond its noise/);
    assert.ok(labels(prompts).includes('climb:revert:r1'));
    assert.equal(result.verdict, 'within noise, do not merge');
    assert.deepEqual(result.noise, { train: 0.02, test: 0.02 });
    assert.equal(result.branch, 'climb-skills-team-plans-skill-a1');
    const revert = prompts.find((p) => p.opts.label === 'climb:revert:r1').prompt;
    assert.match(revert, /git revert --no-edit c1/);
  });

  test('a change that raises both scores is kept: improved, dry run pushes nothing', async () => {
    const { result, prompts } = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.8 }]));
    assert.equal(result.rounds[0].decision, 'kept');
    assert.ok(!labels(prompts).some((l) => l.startsWith('climb:revert')));
    assert.ok(result.verdict.startsWith('improved'));
    assert.equal(result.verdict, 'improved (dry run): nothing pushed');
    const report = prompts.find((p) => p.opts.label === 'climb:report').prompt;
    assert.match(report, /Push nothing/);
    assert.ok(!/gh pr create/.test(report));
  });

  test('without a dry run a kept change gets a draft pull request in the report step', async () => {
    const { result, prompts } = await runScript(FILE, { ...ARGS, dryRun: false }, stub([...BASES, { train: 0.8, test: 0.8 }]));
    assert.equal(result.verdict, 'improved: a draft pull request is open');
    const report = prompts.find((p) => p.opts.label === 'climb:report').prompt;
    assert.match(report, /gh pr create --draft --base build-1 --head climb-skills-team-plans-skill-a1/);
  });

  test('the baseline moves up after a kept round', async () => {
    const { result, prompts } = await runScript(FILE, { ...ARGS, rounds: 2 }, stub([...BASES, { train: 0.8, test: 0.8 }, { train: 0.81, test: 0.81 }]));
    assert.deepEqual(result.rounds.map((r) => r.decision), ['kept', 'reverted']);
    assert.deepEqual(result.final, { train: 0.8, test: 0.8 });
    assert.ok(labels(prompts).includes('climb:revert:r2'));
    assert.equal(result.verdict, 'improved (dry run): nothing pushed');
  });

  test('the proposer never sees the held-back test cases', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.5 }]));
    const propose = prompts.find((p) => p.opts.label === 'climb:propose:r1').prompt;
    assert.ok(!propose.includes(ARGS.test));
    assert.ok(propose.includes(ARGS.train));
  });

  test('eval commands carry the cap, no publish and no ablation arm', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.5 }]));
    const m = prompts.find((p) => p.opts.label === 'climb:measure:base-1').prompt;
    assert.match(m, /--no-publish --trust-plugin --ablation none --max-cost-usd 1\.66 --output-dir \/s\/climb-skills-team-plans-skill-a1\/base-1-train/);
    assert.match(m, /--runs 3/);
  });

  test('more than five rounds halts at once', async () => {
    const { result, prompts } = await runScript(FILE, { ...ARGS, rounds: 6 }, stub([]));
    assert.match(result.halt, /five rounds/);
    assert.equal(prompts.length, 0);
  });

  test('a missing argument halts', async () => {
    const { result } = await runScript(FILE, { ...ARGS, target: undefined }, stub([]));
    assert.match(result.halt, /missing required argument: target/);
  });

  test('eval not available gives the honest verdict', async () => {
    const { result, prompts } = await runScript(FILE, ARGS, stub([], { 'climb:setup': { ok: true, eval_available: false, notes: '' } }));
    assert.equal(result.verdict, 'plugin eval not available here');
    assert.match(result.halt, /plugin eval not available here/);
    assert.deepEqual(labels(prompts), ['climb:setup']);
  });

  test('a failed stage returns a halt instead of throwing', async () => {
    const boom = () => { throw new Error('boom'); };
    const a = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.8 }], { 'climb:propose:r1': boom }));
    assert.match(a.result.halt, /propose r1 failed: boom/);
    const b = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.8 }], { 'climb:measure:base-2': { train: 0, test: 0, cost_usd: 0, ok: false, notes: 'cap hit' } }));
    assert.match(b.result.halt, /measurement base-2 failed: cap hit/);
    const c = await runScript(FILE, ARGS, stub([...BASES, { train: 0.8, test: 0.5 }], { 'climb:revert:r1': { ok: false, commit: '' } }));
    assert.match(c.result.halt, /revert of round 1 failed/);
  });
});

describe('interview drill', () => {
  const FILE = 'lab/drills/interview.js';
  const ARGS = { repo: '/r', scratch: '/s', today: '2026-10-11' };
  const IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8'];

  function stub({ failing = [], skill = true, extra = {} } = {}) {
    return (prompt, opts) => {
      const l = opts.label;
      if (extra[l]) return extra[l];
      if (l === 'interview:setup') return { ok: true, workshop_skill: skill, listing: 'workshops.md', notes: '' };
      if (l === 'interview:ask') return { session_id: 'sess-1', bundle_path: '/s/clone/.flightdeck/x.activate.md', bundle_text: '## q1: where will you read it?\nwhy: x\nrecommended: a', ok: true };
      if (l === 'interview:owner') return { block: 'FlightDeck answers for workshop x: file these into .flightdeck/x/questions.md\nq1: a | note: phone\nOther notes: none', revealed_fact: true };
      if (l === 'interview:answer') return { ok: true, workshop: 'phone-page', files: ['workshop.md', 'context.md', 'verify.md'] };
      if (l === 'interview:score') return { checks: IDS.map((id) => ({ id, pass: !failing.includes(id), quote: 'q' })), score: 0 };
      if (l === 'interview:page') return { page: '/r/lab/results/2026-10-11-interview/index.html', transcripts: '/r/lab/results/2026-10-11-interview/transcripts.md', ok: true };
      throw new Error(`unexpected agent ${l}`);
    };
  }

  test('shape: meta first, no clock, randomness or default export, models within the ceiling', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub());
    assertShape(FILE, prompts);
    assert.match(fs.readFileSync(path.join(REPO, FILE), 'utf8'), /^export const meta = \{ name: 'flightdeck-lab-interview-drill'/);
  });

  test('a full stubbed run returns the score and whether the withheld fact was found', async () => {
    const { result } = await runScript(FILE, ARGS, stub({ failing: ['c3'] }));
    assert.equal(result.workshop, 'phone-page');
    assert.equal(result.score, 7 / 8);
    assert.equal(result.withheld_fact_found, true);
    assert.equal(result.checks.length, 8);
    assert.match(result.page, /index\.html$/);
    assert.match(result.transcripts, /transcripts\.md$/);
  });

  test('the fact is not found when the interviewer never asked, or never recorded it', async () => {
    assert.equal((await runScript(FILE, ARGS, stub({ failing: ['c5'] }))).result.withheld_fact_found, false);
    assert.equal((await runScript(FILE, ARGS, stub({ failing: ['c6'] }))).result.withheld_fact_found, false);
  });

  test('without the workshop skill it halts with the PR 3 message and runs nothing else', async () => {
    const { result, prompts } = await runScript(FILE, ARGS, stub({ skill: false }));
    assert.equal(result.halt, 'needs PR 3 (workshops) merged: flightdeck/skills/workshop/SKILL.md not found');
    assert.deepEqual(prompts.map((p) => p.opts.label), ['interview:setup']);
  });

  test('the ask prompt loads the plugin from the clone and never installs it', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub());
    const ask = prompts.find((p) => p.opts.label === 'interview:ask').prompt;
    assert.match(ask, /--plugin-dir "\/s\/interview-2026-10-11\/clone\/flightdeck"/);
    assert.match(ask, /FLIGHTDECK_UNATTENDED/);
    assert.match(ask, /--permission-mode acceptEdits/);
    assert.ok(ask.includes("--allowedTools 'Bash(node *)' --output-format json"), 'the tool list sits right before --output-format json');
    assert.match(ask, /\/flight:workshop a short page that lists every open question across all my workshops, oldest first \(file mode:/);
    for (const { prompt } of prompts) assert.ok(!/plugin install/.test(prompt));
    const answer = prompts.find((p) => p.opts.label === 'interview:answer').prompt;
    assert.match(answer, /--resume sess-1/);
    assert.ok(answer.includes("--allowedTools 'Bash(node *)' --output-format json < /s/interview-2026-10-11/block.txt"), 'the block goes in on standard input');
    assert.ok(!/command substitution/.test(answer));
  });

  test('a missing question bundle halts with the nested session reply', async () => {
    const lost = { 'interview:ask': { session_id: '', bundle_path: '', bundle_text: '', ok: false, nested_reply: 'refused: Bash(ls)' } };
    const { result } = await runScript(FILE, ARGS, stub({ extra: lost }));
    assert.equal(result.halt, 'the interviewer did not write a question bundle');
    assert.equal(result.ask.nested_reply, 'refused: Bash(ls)');
  });

  test('the setup prompt creates the folders by cloning and reads the skill file without a shell command', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub());
    const setup = prompts.find((p) => p.opts.label === 'interview:setup').prompt;
    assert.match(setup, /git clone creates the folders; run no mkdir and no other command before it/);
    assert.match(setup, /file-read tool, not with a shell command/);
  });

  test('the page prompt names the expected transcript folder and searches nothing', async () => {
    const { prompts } = await runScript(FILE, ARGS, stub());
    const page = prompts.find((p) => p.opts.label === 'interview:page').prompt;
    assert.ok(page.includes('$HOME/.claude/projects/-s-interview-2026-10-11-clone/'));
    assert.match(page, /not checked/);
    assert.ok(!/ls ~\/\.claude\/projects/.test(page));
  });

  test('a score with fewer than eight checks halts', async () => {
    const short = { 'interview:score': { checks: [{ id: 'c1', pass: true, quote: '' }], score: 1 } };
    const { result } = await runScript(FILE, ARGS, stub({ extra: short }));
    assert.match(result.halt, /fewer than the 8 checks/);
  });

  test('a missing argument halts', async () => {
    const { result } = await runScript(FILE, { repo: '/r' }, stub());
    assert.match(result.halt, /missing required argument: scratch, today/);
  });
});

// ------------------------------------------------------------------ traps and hard rules

describe('lab scripts and the hard-rule check', () => {
  const ceiling = new RegExp(['\\b(mo', 'del|eff', 'ort)\\s*:\\s*([\'"`])([^\'"`\\n]*)\\2'].join(''), 'g');
  const badModel = new RegExp([['fa', 'ble'].join(''), '|^best\\b'].join(''), 'i');
  const badEffort = new RegExp(`^(${['x', 'high'].join('')}|max)$`, 'i');
  const oldTool = new RegExp(`(^|[\\s'"\`(;&|/])(${['d', 'w'].join('')}|${['dev', 'workspace'].join('-')})(?=[\\s'"\`)]|$)`, 'm');

  function labScripts() {
    const out = [];
    const walk = (rel) => {
      for (const e of fs.readdirSync(path.join(REPO, rel), { withFileTypes: true })) {
        const r = `${rel}/${e.name}`;
        if (e.isDirectory()) { if (r !== 'lab/fixtures' && e.name !== 'node_modules') walk(r); }
        else if (/\.(mjs|js|sh)$/.test(e.name)) out.push(r);
      }
    };
    walk('lab');
    return out;
  }

  test('no lab script holds a forbidden model or effort literal, or the old tool name', () => {
    const scripts = labScripts();
    assert.ok(scripts.includes('lab/drills/sweep.mjs') && scripts.includes('lab/workflows/climb.js'));
    for (const f of scripts) {
      if (f === 'lab/checks/hard-rules.mjs' || f === 'lab/checks/hard-rules.test.mjs') continue;
      const text = fs.readFileSync(path.join(REPO, f), 'utf8');
      for (const m of text.matchAll(ceiling)) {
        if (m[1] === 'model') assert.ok(!badModel.test(m[3]), `${f} has a forbidden model value`);
        else assert.ok(!badEffort.test(m[3]), `${f} has a forbidden effort value`);
      }
      assert.ok(!oldTool.test(text), `${f} names the old workspace tool`);
    }
  });

  test('the hard-rule check passes on the repository', () => {
    const r = node(['lab/checks/hard-rules.mjs']);
    assert.equal(r.status, 0, r.stdout + r.stderr);
  });
});
