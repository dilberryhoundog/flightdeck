// Run with: node --test .flightdeck/build-1/workflows/build.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkCommand } from './push-check.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const DENY = [
  'git push origin main',
  'git push origin HEAD:main',
  'git push origin x:refs/heads/main',
  'git push origin +build-1-pr1-basic-a1',
  'git push origin :build-1-pr1-basic-a1',
  'git push --force origin build-1-pr1-basic-a1',
  'git push -f origin build-1-pr1-basic-a1',
  'git push --force-with-lease origin build-1',
  'git push --mirror origin',
  'git push --all origin',
  'git push --delete origin build-1-pr2-board-a1',
  'git push -d origin build-1-pr2-board-a1',
  'git -C /tmp/x push origin main',
  'git -c core.x=y push origin master',
  'git push --dry-run origin HEAD:main',
  'cd repo && git push origin main',
  'git push "origin" "main"',
];
const ALLOW = [
  'git push -u origin build-1-pr1-basic-a1',
  'git push origin HEAD:build-1-pr1-basic-a1',
  'git push origin build-1',
  'git status && git log -1',
  'echo git push origin main is refused',
];

test('push-check refuses main, force and delete pushes', () => {
  for (const cmd of DENY) assert.ok(checkCommand(cmd, 'build-1-pr1-basic-a1'), `should deny: ${cmd}`);
});

test('push-check allows the build pushes', () => {
  for (const cmd of ALLOW) assert.equal(checkCommand(cmd, 'build-1-pr1-basic-a1'), null, `should allow: ${cmd}`);
});

test('a bare push is refused only on main', () => {
  assert.ok(checkCommand('git push', 'main'));
  assert.ok(checkCommand('git push origin HEAD', 'main'));
  assert.equal(checkCommand('git push', 'build-1-pr1-basic-a1'), null);
});

async function runScript(args, agentImpl) {
  const src = readFileSync(join(here, 'build.js'), 'utf8').replace(/^export const meta/m, 'const meta');
  assert.ok(!/Date\.now|Math\.random|export default/.test(src), 'no clock, randomness or default export');
  const prompts = [];
  const agent = async (prompt, opts) => { prompts.push({ prompt, opts }); return agentImpl(prompt, opts); };
  const parallel = async thunks => Promise.all(thunks.map(t => t().catch(() => null)));
  const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => { let r = it; for (const s of stages) r = await s(r, it, i); return r; }));
  const fn = new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', `return (async () => {${src}\n})()`);
  const result = await fn(agent, parallel, pipeline, () => {}, () => {}, args);
  return { result, prompts };
}

function stubAgent(prompt, opts) {
  const label = opts.label;
  if (label.startsWith('gather')) return { sources: [], block: 'SENTINEL-BLOCK', checks: ['node --test'], questions: [], rank_lines: {}, notes: '' };
  if (label.startsWith('brief')) return { brief_path: '/x/brief.md', title: 't', owned_files: ['a'], units: [{ id: 'u1', files: ['a'], spec: 's' }], checks: ['node --test'], live_checks: [], try_steps: ['step'], done: ['d'] };
  if (label.startsWith('build')) return { branch: 'b-u1', commit: 'c', files: ['a'], status: 'complete', notes: '', captures: [] };
  if (label.startsWith('integrate')) return { branch: 'b', commit: 'c', pushed: true, diff_path: 'd', changed_path: 'c', checks: [{ command: 'node --test', exit: 0, tail: '' }], notes: '' };
  if (label.startsWith('triage')) return { decisions: [], fixes: [], questions: [], captures: [], high_accepted: ['h'] };
  if (label.startsWith('fix')) return { commit: 'c', pushed: true, checks_green: true, rounds: 1, notes: '' };
  if (label.startsWith('recheck')) return { items: [] };
  if (label.startsWith('land')) return { branch: 'b', title: 't', body_path: 'p', draft: false, draft_reasons: [], pushed: true, summary: '' };
  return { findings: [], verdict: 'ok' };
}

test('build.js compiles, gives every prompt a rank line, and stays within the model ceiling', async () => {
  const { result, prompts } = await runScript({ prs: [1], run: 'A', today: '2026-10-11', scratch: '/tmp/s' }, stubAgent);
  assert.equal(result.prs[0].status, 'landed');
  for (const { prompt, opts } of prompts) {
    assert.match(prompt, /Rank: /, `rank line missing in ${opts.label}`);
    assert.ok(['haiku', 'sonnet', 'opus'].includes(opts.model), `model named in ${opts.label}`);
    assert.ok(['low', 'medium', 'high'].includes(opts.effort), `effort within ceiling in ${opts.label}`);
  }
});

test('run B puts build-1\'s scoped block into every prompt after gather', async () => {
  const { prompts } = await runScript({ prs: [2], run: 'B', base: 'build-1-pr1-basic-a1', today: '2026-10-11', scratch: '/tmp/s' }, stubAgent);
  const withBlock = ['brief', 'build', 'review', 'adversary', 'triage', 'fix'];
  for (const { prompt, opts } of prompts) {
    if (withBlock.some(p => opts.label.startsWith(p))) assert.match(prompt, /SENTINEL-BLOCK/, `scoped block missing in ${opts.label}`);
  }
});

test('a halted stage reaches the result instead of throwing', async () => {
  const { result } = await runScript({ prs: [3], run: 'B', today: '2026-10-11', scratch: '/tmp/s' }, (p, o) => (o.label.startsWith('brief') ? null : stubAgent(p, o)));
  assert.equal(result.prs[0].status, 'not built');
  assert.match(result.prs[0].halt, /brief/);
});

test('PR 5 is refused', async () => {
  await assert.rejects(runScript({ prs: [5], today: '2026-10-11' }, stubAgent), /PR 5/);
});

test('unit branches stay local: builders do not push, integrate merges local branches', async () => {
  const { prompts } = await runScript({ prs: [2], run: 'B', base: 'build-1-pr1-basic-a1', today: '2026-10-11', scratch: '/tmp/s' }, stubAgent);
  for (const { prompt, opts } of prompts) {
    if (opts.label.startsWith('build:')) {
      assert.match(prompt, /Do not push/, 'builder told not to push');
      assert.doesNotMatch(prompt, /git push -u origin build-1-pr2-board-a1-u/, 'builder never pushes a unit branch');
    }
    if (opts.label.startsWith('integrate')) assert.doesNotMatch(prompt, /origin\/b-u1/, 'integrate merges the local unit branch');
  }
});
