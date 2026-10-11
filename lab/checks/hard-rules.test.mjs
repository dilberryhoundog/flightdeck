// Tests for lab/checks/hard-rules.mjs. Fixtures are temporary git repositories.
// Run: node --test 'lab/checks/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const check = path.join(here, 'hard-rules.mjs');
const realPlanJs = path.join(here, '..', '..', '.flightdeck', 'build-1', 'workflows', 'plan.js');

const HOOKS_OK = JSON.stringify({
  hooks: {
    PreToolUse: [
      { matcher: 'Bash', hooks: [{ type: 'command', if: 'Bash(git *)', command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs', 'git'] }] },
    ],
  },
}, null, 2);

const BASE_FILES = {
  'README.md': '# Fixture\n',
  'flightdeck/hooks/hooks.json': HOOKS_OK,
  'flightdeck/agents/pilot.md': '---\nname: pilot\nmodel: opus\neffort: high\n---\nBody.\n',
};

const dirs = [];
process.on('exit', () => { for (const d of dirs) rmSync(d, { recursive: true, force: true }); });

function git(dir, ...args) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function write(dir, files) {
  for (const [f, text] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, f)), { recursive: true });
    writeFileSync(path.join(dir, f), text);
  }
}

// A repo on branch `work`, cut from `main` which holds BASE_FILES. `files` are committed on `work`;
// `loose` files are left uncommitted.
function fixture(files = {}, loose = {}) {
  const dir = mkdtempSync(path.join(tmpdir(), 'hard-rules-'));
  dirs.push(dir);
  git(dir, 'init', '-q', '-b', 'main');
  write(dir, BASE_FILES);
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'switch', '-q', '-c', 'work');
  if (Object.keys(files).length) {
    write(dir, files);
    git(dir, 'add', '-A');
    git(dir, 'commit', '-q', '-m', 'work');
  }
  write(dir, loose);
  return dir;
}

function run(dir, ...args) {
  const r = spawnSync('node', [check, '--root', dir, ...args], { encoding: 'utf8' });
  const lines = r.stdout.trim().split('\n');
  return { status: r.status, out: r.stdout, stderr: r.stderr, lines, last: lines[lines.length - 1], line: (c) => lines.find((l) => new RegExp(`^(pass|FAIL) ${c}\\b`).test(l)) };
}

test('a clean fixture passes every case and exits 0', () => {
  const r = run(fixture(), '--base', 'main', '--owned', 'auto');
  assert.equal(r.status, 0, r.out);
  assert.equal(r.last, '9/9 passed');
  assert.ok(r.lines.slice(0, -1).every((l) => l.startsWith('pass ')), r.out);
});

test('without --base the check says only uncommitted files count', () => {
  const r = run(fixture(), '--owned', 'auto');
  assert.equal(r.status, 0, r.out);
  assert.match(r.line('dev-untouched'), /no --base/);
});

test('a base ref that does not exist fails the base case', () => {
  const r = run(fixture(), '--base', 'nope');
  assert.equal(r.status, 1);
  assert.match(r.line('base'), /^FAIL base: .*nope/);
});

test('a base with no merge base fails the base case with the git error', () => {
  const dir = fixture();
  git(dir, 'switch', '-q', '--orphan', 'orphan');
  write(dir, { 'o.txt': 'o\n' });
  git(dir, 'add', 'o.txt');
  git(dir, 'commit', '-q', '-m', 'orphan');
  const r = run(dir, '--base', 'main');
  assert.equal(r.status, 1, r.out);
  assert.match(r.line('base'), /^FAIL base: cannot diff main\.\.\.HEAD: .+/);
});

test('the real plan.js passes the ceiling case', () => {
  const dir = fixture();
  mkdirSync(path.join(dir, '.flightdeck/build-1/workflows'), { recursive: true });
  copyFileSync(realPlanJs, path.join(dir, '.flightdeck/build-1/workflows/plan.js'));
  const r = run(dir, '--base', 'main');
  assert.match(r.line('ceiling'), /^pass ceiling/, r.out);
});

test('an agent file with model: fable fails ceiling and names the file', () => {
  const dir = fixture({ 'flightdeck/agents/bad.md': '---\nname: bad\nmodel: fable\n---\nBody.\n' });
  const r = run(dir, '--base', 'main');
  assert.equal(r.status, 1);
  assert.match(r.line('ceiling'), /^FAIL ceiling: .*flightdeck\/agents\/bad\.md/);
});

test('a .claude/agents file with effort: max fails ceiling', () => {
  const r = run(fixture({ '.claude/agents/x.md': '---\nname: x\nmodel: opus\neffort: max\n---\n' }), '--base', 'main');
  assert.match(r.line('ceiling'), /^FAIL ceiling: .*\.claude\/agents\/x\.md/);
});

test('a lab .js file with effort: xhigh fails ceiling', () => {
  const r = run(fixture({ 'lab/x.js': "agent({ model: 'opus', effort: 'xhigh' });\n" }), '--base', 'main');
  assert.match(r.line('ceiling'), /^FAIL ceiling: .*lab\/x\.js/);
});

test('a workflow .mjs with model best fails ceiling', () => {
  const r = run(fixture({ '.flightdeck/b/workflows/w.mjs': 'agent({ model: "best" });\n' }), '--base', 'main');
  assert.match(r.line('ceiling'), /^FAIL ceiling: .*w\.mjs/);
});

test('ceiling ignores prose and the excluded paths', () => {
  const dir = fixture({
    'lab/prose.js': "const t = 'note that model: fable is above the ceiling';\n",
    'flightdeck/tests/x.test.mjs': "const bad = { model: 'fable', effort: 'max' };\n",
    'flightdeck/hooks/guard.mjs': "const bad = { model: 'fable' };\n",
  });
  assert.match(run(dir, '--base', 'main').line('ceiling'), /^pass ceiling/);
});

test('a changed file under dev/ fails dev-untouched', () => {
  const r = run(fixture({ 'dev/notes.md': 'x\n' }), '--base', 'main');
  assert.equal(r.status, 1);
  assert.match(r.line('dev-untouched'), /^FAIL dev-untouched: .*dev\/notes\.md/);
});

test('an uncommitted file under dev/ also fails dev-untouched', () => {
  const r = run(fixture({}, { 'dev/notes.md': 'x\n' }), '--base', 'main');
  assert.match(r.line('dev-untouched'), /^FAIL dev-untouched/);
});

test('a changed file under .claude/rules/ fails claude-rules-untouched', () => {
  const r = run(fixture({ '.claude/rules/a.md': 'x\n' }), '--base', 'main');
  assert.match(r.line('claude-rules-untouched'), /^FAIL claude-rules-untouched: .*\.claude\/rules\/a\.md/);
});

test('a file under dev/ that is the same as base is not a change', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hard-rules-'));
  dirs.push(dir);
  git(dir, 'init', '-q', '-b', 'main');
  write(dir, { ...BASE_FILES, 'dev/old.md': 'x\n' });
  git(dir, 'add', '-A');
  git(dir, 'commit', '-q', '-m', 'base');
  git(dir, 'switch', '-q', '-c', 'work');
  assert.match(run(dir, '--base', 'main').line('dev-untouched'), /^pass/);
});

test('execSync("dw sync") in lab/x.mjs fails no-dw-calls, a CLAUDE.md that mentions dev-workspace passes', () => {
  const bad = run(fixture({ 'lab/x.mjs': "import { execSync } from 'node:child_process';\nexecSync('dw sync');\n" }), '--base', 'main');
  assert.match(bad.line('no-dw-calls'), /^FAIL no-dw-calls: .*lab\/x\.mjs/);
  const ok = run(fixture({ 'CLAUDE.md': 'FlightDeck sits beside dev-workspace and never runs dw.\n' }), '--base', 'main');
  assert.match(ok.line('no-dw-calls'), /^pass/);
});

test('a path-qualified dw call in a .mjs file fails no-dw-calls', () => {
  const r = run(fixture({ 'lab/y.mjs': "import { execFileSync } from 'node:child_process';\nexecFileSync('/usr/local/bin/dw', ['sync']);\n" }), '--base', 'main');
  assert.match(r.line('no-dw-calls'), /^FAIL no-dw-calls: .*lab\/y\.mjs/);
});

test('a dw command in flightdeck/hooks/hooks.json fails no-dw-calls', () => {
  const hooks = JSON.parse(HOOKS_OK);
  hooks.hooks.SessionStart = [{ hooks: [JSON.parse('{"command":"dw sync"}')] }];
  const r = run(fixture({ 'flightdeck/hooks/hooks.json': JSON.stringify(hooks, null, 2) }), '--base', 'main');
  assert.match(r.line('no-dw-calls'), /^FAIL no-dw-calls: .*flightdeck\/hooks\/hooks\.json/);
});

test('a shell script calling dev-workspace fails no-dw-calls', () => {
  const r = run(fixture({ 'flightdeck/bin/x.sh': '#!/bin/sh\ndev-workspace sync\n' }), '--base', 'main');
  assert.match(r.line('no-dw-calls'), /^FAIL no-dw-calls: .*x\.sh/);
});

test('--owned with an unlisted changed file fails and names it', () => {
  const dir = fixture({ 'a.txt': 'a\n', 'b.txt': 'b\n', 'lab/owned/pr9.txt': '# header\na.txt\n\nlab/owned/pr9.txt\n' });
  const r = run(dir, '--base', 'main', '--owned', 'lab/owned/pr9.txt');
  assert.equal(r.status, 1);
  assert.match(r.line('owned'), /^FAIL owned: .*b\.txt/);
  assert.doesNotMatch(r.line('owned'), /a\.txt/);
});

test('--owned passes when every change is listed', () => {
  const dir = fixture({ 'a.txt': 'a\n', 'lab/owned/pr9.txt': '# header\n  a.txt  \nlab/owned/pr9.txt\n' });
  const r = run(dir, '--base', 'main', '--owned', 'lab/owned/pr9.txt');
  assert.equal(r.status, 0, r.out);
  assert.match(r.line('owned'), /^pass owned/);
});

test('--owned auto passes when the branch\'s own lab/owned/pr9.txt lists every change', () => {
  const dir = fixture({ 'a.txt': 'a\n', 'lab/owned/pr9.txt': '# header\na.txt\nlab/owned/pr9.txt\n' });
  const r = run(dir, '--base', 'main', '--owned', 'auto');
  assert.equal(r.status, 0, r.out);
});

test('--owned auto fails when the owned file does not list a change', () => {
  const dir = fixture({ 'a.txt': 'a\n', 'b.txt': 'b\n', 'lab/owned/pr9.txt': '# header\na.txt\nlab/owned/pr9.txt\n' });
  const r = run(dir, '--base', 'main', '--owned', 'auto');
  assert.equal(r.status, 1);
  assert.match(r.line('owned'), /^FAIL owned: .*b\.txt/);
});

test('--owned auto fails when changes exist and no owned file changed', () => {
  const r = run(fixture({ 'a.txt': 'a\n' }), '--base', 'main', '--owned', 'auto');
  assert.equal(r.status, 1);
  assert.match(r.line('owned'), /^FAIL owned: no lab\/owned\/pr<n>\.txt changed on this branch; pass --owned <file>/);
});

test('--owned auto uses the union of every changed owned file', () => {
  const dir = fixture({ 'a.txt': 'a\n', 'b.txt': 'b\n', 'lab/owned/pr8.txt': 'a.txt\nlab/owned/pr8.txt\n', 'lab/owned/pr9.txt': 'b.txt\nlab/owned/pr9.txt\n' });
  assert.equal(run(dir, '--base', 'main', '--owned', 'auto').status, 0);
});

test('a deleted file counts as a change for the owned case', () => {
  const dir = fixture({ 'lab/owned/pr9.txt': 'lab/owned/pr9.txt\n' });
  git(dir, 'rm', '-q', 'README.md');
  const r = run(dir, '--base', 'main', '--owned', 'auto');
  assert.match(r.line('owned'), /^FAIL owned: .*README\.md/);
});

test('flightdeck/settings.json fails no-plugin-settings', () => {
  const r = run(fixture({ 'flightdeck/settings.json': '{}\n' }), '--base', 'main');
  assert.match(r.line('no-plugin-settings'), /^FAIL no-plugin-settings/);
});

test('a capture skill without disable-model-invocation: true fails owner-only-skills', () => {
  const r = run(fixture({ 'flightdeck/skills/capture/SKILL.md': '---\nname: capture\ndescription: x\n---\nBody.\n' }), '--base', 'main');
  assert.equal(r.status, 1);
  assert.match(r.line('owner-only-skills'), /^FAIL owner-only-skills: .*skills\/capture\/SKILL\.md/);
});

test('owner-only skills with disable-model-invocation: true pass, other skills are free', () => {
  const dir = fixture({
    'flightdeck/skills/capture/SKILL.md': '---\nname: capture\ndescription: x\ndisable-model-invocation: true\n---\nBody.\n',
    'flightdeck/skills/preflight/SKILL.md': '---\nname: preflight\ndescription: x\n---\nBody.\n',
  });
  assert.match(run(dir, '--base', 'main').line('owner-only-skills'), /^pass/);
});

test('hooks.json that does not register the git guard fails git-guard-registered', () => {
  const hooks = JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write', hooks: [{ type: 'command', command: 'node', args: ['${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs', 'truth'] }] }] } });
  const r = run(fixture({ 'flightdeck/hooks/hooks.json': hooks }), '--base', 'main');
  assert.match(r.line('git-guard-registered'), /^FAIL git-guard-registered/);
});

test('the git guard may be registered as one command string', () => {
  const hooks = JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node ${CLAUDE_PLUGIN_ROOT}/hooks/guard.mjs git' }] }] } });
  assert.match(run(fixture({ 'flightdeck/hooks/hooks.json': hooks }), '--base', 'main').line('git-guard-registered'), /^pass/);
});

test('a missing hooks.json fails git-guard-registered', () => {
  const dir = fixture();
  git(dir, 'rm', '-q', 'flightdeck/hooks/hooks.json');
  assert.match(run(dir, '--base', 'main').line('git-guard-registered'), /^FAIL git-guard-registered/);
});

test('the output ends with <n>/<m> passed and the exit code is 0 only when all pass', () => {
  const bad = run(fixture({ 'dev/a.md': 'x\n', 'flightdeck/settings.json': '{}\n' }), '--base', 'main');
  assert.equal(bad.status, 1);
  assert.equal(bad.last, '7/9 passed');
  const good = run(fixture(), '--base', 'main');
  assert.equal(good.status, 0);
  assert.equal(good.last, '9/9 passed');
});

test('a bad argument exits 2 with usage', () => {
  const r = spawnSync('node', [check, '--wat'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage:/);
});
