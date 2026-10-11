// Tests for the three launch workflows: build-and-check, recon and second-opinion.
// Node built-ins only. Each script runs with a recording stub agent and the real scope command
// on the fixtures next to this file. The launch skill and its report template (unit u3) are read
// by the last test. Run: node --test 'flightdeck/skills/launch/tests/*.test.mjs'
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { ceilingDecision } from '../../../hooks/guard.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(here, '..', '..', '..');
const repoRoot = path.resolve(pluginRoot, '..');
const fixtures = path.join(here, 'fixtures');
const WORKFLOWS = ['build-and-check', 'recon', 'second-opinion'];
const CAPTURE = 'Work outside your brief: report it as a capture line; do not do it.';

// ---------- helpers ----------

function scopeJson(name) {
  const r = spawnSync(process.execPath, [path.join(pluginRoot, 'lib', 'workshops.mjs'), 'scope', name, '--json', '--root', fixtures], { encoding: 'utf8' });
  return JSON.parse(r.stdout);
}

function ranks() {
  const text = fs.readFileSync(path.join(pluginRoot, 'policies.md'), 'utf8');
  const part = text.split(/^## Ranks\s*$/m)[1].split(/^## /m)[0];
  return [...part.matchAll(/^- (\w+):/gm)].map(m => m[1]);
}

function seatLine(title) {
  const text = fs.readFileSync(path.join(pluginRoot, 'skills', 'team-plans', 'entry-points.md'), 'utf8');
  const part = text.split(new RegExp('^## ' + title + '\\s*$', 'm'))[1].split(/^## /m)[0];
  return part.split('\n').find(l => l.startsWith('Rank: '));
}

function globalBlock() {
  const lines = fs.readFileSync(path.join(pluginRoot, 'skills', 'team-plans', 'SKILL.md'), 'utf8').split('\n');
  const at = lines.findIndex(l => l.includes('A global rules block you can paste:'));
  return lines.slice(at + 1).find(l => l.trim().startsWith('`')).trim().replace(/^`|`$/g, '');
}

function readScript(name) {
  return fs.readFileSync(path.join(pluginRoot, 'workflows', name + '.js'), 'utf8');
}

// The meta object text: from the first brace after "export const meta =" to its matching brace.
function metaText(src) {
  let i = src.indexOf('{', src.indexOf('export const meta'));
  const start = i;
  let depth = 0;
  let quote = null;
  for (; i < src.length; i++) {
    const c = src[i];
    if (quote) {
      if (c === '\\') i++;
      else if (c === quote) quote = null;
    } else if (c === "'" || c === '"' || c === '`') quote = c;
    else if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error('meta object not closed');
}

function metaOf(src) {
  return new Function('return (' + metaText(src) + ')')();
}

const FORBIDDEN = [/Date\.now/, /Math\.random/, /new Date\(/, /export default/, /^\s*import\b/m, /\bimport\s*\(/, /\brequire\s*\(/];

// Runs a script body. stub maps a label to a value (null means "the agent returned nothing") or to
// a function (prompt, opts) => value. Labels not in stub get the default shape.
async function runScript(file, args, stub = {}) {
  const raw = readScript(file);
  for (const re of FORBIDDEN) assert.ok(!re.test(raw), file + ' holds ' + re);
  const src = raw.replace(/^export const meta/m, 'const meta');
  const calls = [];
  const agent = async (prompt, opts = {}) => {
    calls.push({ prompt, opts, label: opts.label });
    const given = Object.prototype.hasOwnProperty.call(stub, opts.label) ? stub[opts.label] : defaultFor(opts.label, prompt);
    const v = typeof given === 'function' ? given(prompt, opts) : given;
    return v === undefined || v === null ? null : structuredClone(v);
  };
  const parallel = thunks => Promise.all(thunks.map(t => t().catch(() => null)));
  const pipeline = async (items, ...stages) => {
    const out = [];
    for (const item of items) {
      let v = item;
      for (const s of stages) v = await s(v);
      out.push(v);
    }
    return out;
  };
  const fn = new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', 'return (async () => {' + src + '\n})()');
  const result = await fn(agent, parallel, pipeline, () => {}, () => {}, args);
  return { result, calls };
}

const finding = { severity: 'low', where: 'a.txt:1', finding: 'a small thing', evidence: 'seen', suggested_fix: 'tidy' };
const checkResult = { worktree: '/w', diff_path: '/w/d.patch', changed_path: '/w/c.txt', results: [{ command: 'x', exit: 0, tail: '', skipped: false }], notes: '' };

function defaultFor(label) {
  if (label === 'scope') return { ...scopeJson('ws-a'), plugin_root: '/p', notes: '' };
  if (label === 'brief') return { title: 'A title', brief_md: '# Brief', files: ['a.txt'], try_steps: ['open a.txt'], done: 'a.txt exists', notes: '' };
  if (label === 'build') return { branch: 'ws-a-a1', commit: 'abc123', files: ['a.txt'], status: 'complete', notes: '', captures: [] };
  if (label === 'check') return checkResult;
  if (['review', 'adversary', 'imposter'].includes(label)) return { findings: [finding], verdict: 'fine', timings: [{ step: 'one', minutes: 1 }] };
  if (label === 'triage') return { decisions: [{ verifier: 'review', severity: 'low', finding: 'a small thing', decision: 'accept', reason: 'real' }], fixes: ['tidy a.txt'], questions: [], captures: [], proposals: [], high_accepted: 0 };
  if (label === 'fix') return { commit: 'def456', checks_green: true, notes: '' };
  if (label === 'recheck') return { results: checkResult.results };
  if (label === 'report') return { title: 'A title', report_md: 'REPORT', log_md: 'LOG', findings_md: 'FINDINGS', pr_md: 'PR', url: 'https://example.invalid/pr/1', pushed: false, draft_reasons: [] };
  if (/^scout-\d$/.test(label)) return { answer: 'an answer', pointers: [{ claim: 'a claim', where: 'a.txt:1', confidence: 'high' }], not_found: [] };
  if (label === 'summary') return { summary: 'SUMMARY-TEXT', claims: [{ claim: 'a claim', where: 'a.txt:1' }], not_found: ['NOTHING-ABOUT-X'], top_findings: [] };
  if (label === 'claims') return { marks: [{ claim: 'a claim', where: 'a.txt:1', mark: 'confirmed' }] };
  if (label === 'prepare') return { kind: 'file', paths: ['/abs/README.md'], worktree: '/w', notes: '' };
  throw new Error('no default stub for label ' + label);
}

const taskPart = prompt => {
  const at = prompt.indexOf('\nTask: ');
  assert.ok(at >= 0, 'prompt has a Task: line');
  return prompt.slice(at);
};
const call = (calls, label) => calls.find(c => c.label === label);
const BAC = { workshop: 'ws-a', attempt: 1, base: 'main', today: '2026-10-11' };

// ---------- tests ----------

for (const name of WORKFLOWS) {
  test(`${name}: meta is a plain literal with matching name and phases`, () => {
    const src = readScript(name);
    assert.ok(src.startsWith('export const meta = {\n'), 'first line is export const meta = {');
    const text = metaText(src);
    assert.ok(!text.includes('`'), 'no backtick in meta');
    assert.ok(!text.includes('...'), 'no spread in meta');
    const meta = new Function('return (' + text + ')')();
    assert.equal(meta.name, name);
    assert.equal(typeof meta.description, 'string');
    assert.ok(meta.description.length > 0);
    assert.ok(Array.isArray(meta.phases) && meta.phases.length > 0);
    const titles = meta.phases.map(p => p.title);
    for (const m of src.matchAll(/\bphase\(\s*(['"])(.*?)\1/g)) assert.ok(titles.includes(m[2]), `phase('${m[2]}') is in meta.phases`);
  });

  test(`${name}: ceiling guard allows it and every literal is within the ceiling`, () => {
    const src = readScript(name);
    const input = { hook_event_name: 'PreToolUse', tool_name: 'Workflow', tool_input: { script: src }, cwd: repoRoot };
    assert.equal(ceilingDecision(input, {}), null);
    for (const m of src.matchAll(/\bmodel:\s*(['"`])(.*?)\1/g)) assert.ok(['haiku', 'sonnet', 'opus'].includes(m[2]), 'model ' + m[2]);
    for (const m of src.matchAll(/\beffort:\s*(['"`])(.*?)\1/g)) assert.ok(['low', 'medium', 'high'].includes(m[2]), 'effort ' + m[2]);
    for (const m of src.matchAll(/['"]flight:([\w-]+)['"]/g)) assert.ok(fs.existsSync(path.join(pluginRoot, 'agents', m[1] + '.md')), 'agent file for flight:' + m[1]);
  });
}

test('build-and-check: labels, models, efforts, isolation and agent types', async () => {
  const { result, calls } = await runScript('build-and-check', BAC);
  assert.equal(result.status, 'delivered');
  assert.equal(result.branch, 'ws-a-a1');
  assert.equal(result.draft, true);
  const labels = calls.map(c => c.label);
  assert.deepEqual(labels.slice(0, 4), ['scope', 'brief', 'build', 'check']);
  assert.deepEqual(labels.slice(4, 7).sort(), ['adversary', 'imposter', 'review']);
  assert.deepEqual(labels.slice(7), ['triage', 'fix', 'recheck', 'report']);
  const table = {
    scope: ['haiku', 'low', false, null],
    brief: ['opus', 'high', false, null],
    build: ['sonnet', 'high', true, 'flight:builder'],
    check: ['haiku', 'low', true, null],
    review: ['sonnet', 'high', false, 'flight:reviewer'],
    adversary: ['opus', 'high', false, 'flight:adversary'],
    imposter: ['sonnet', 'high', true, 'flight:imposter'],
    triage: ['opus', 'high', false, null],
    fix: ['sonnet', 'high', true, 'flight:builder'],
    recheck: ['haiku', 'low', true, null],
    report: ['sonnet', 'medium', true, null],
  };
  const titles = metaOf(readScript('build-and-check')).phases.map(p => p.title);
  for (const [label, [model, effort, isolated, agentType]] of Object.entries(table)) {
    const o = call(calls, label).opts;
    assert.equal(o.model, model, label + ' model');
    assert.equal(o.effort, effort, label + ' effort');
    assert.equal(o.isolation, isolated ? 'worktree' : undefined, label + ' isolation');
    assert.equal(o.agentType, agentType ?? undefined, label + ' agentType');
    assert.ok(o.schema && typeof o.schema === 'object', label + ' schema');
    assert.ok(titles.includes(o.phase), label + ' phase ' + o.phase);
  }
});

test('build-and-check: prompts keep the opening order and never carry another workshop', async () => {
  const { calls } = await runScript('build-and-check', BAC);
  const allRanks = ranks();
  assert.deepEqual(allRanks, ['Commander', 'Captain', 'Officer', 'Worker']);
  calls.forEach((c, i) => {
    const p = c.prompt;
    const rankLines = p.split('\n').filter(l => l.startsWith('Rank: '));
    assert.equal(rankLines.length, 1, c.label + ' has one Rank: line');
    assert.ok(allRanks.includes(rankLines[0].match(/^Rank: (\w+)\./)[1]), c.label + ' rank is in policies.md');
    assert.equal(p.split('\n').filter(l => l.startsWith('Task: ')).length, 1, c.label + ' has one Task: line');
    const g = p.indexOf(globalBlock());
    const r = p.indexOf('\nRank: ');
    const cap = p.indexOf(CAPTURE);
    const t = p.indexOf('\nTask: ');
    assert.ok(g >= 0 && g < r, c.label + ': global rules before the rank line');
    assert.ok(r < cap && cap < t, c.label + ': rank, then capture line, then task');
    if (i === 0) assert.ok(!p.includes('ALPHA-CONTEXT-7301'), 'the scope prompt has no block');
    else {
      const ctx = p.indexOf('ALPHA-CONTEXT-7301');
      assert.ok(ctx > r && ctx < cap, c.label + ': workshop context after the rank line and before the capture line');
    }
    assert.ok(!p.includes('BRAVO-'), c.label + ' holds nothing from ws-b');
  });
});

test('build-and-check: seat lines are word for word entry-points.md and sit in the script', async () => {
  const { calls } = await runScript('build-and-check', BAC);
  const src = readScript('build-and-check');
  const want = { build: 'builder', fix: 'builder', review: 'reviewer', adversary: 'adversary cold', imposter: 'imposter' };
  for (const [label, seat] of Object.entries(want)) {
    const line = seatLine(seat);
    assert.ok(line && line.startsWith('Rank: '), seat + ' seat line found');
    assert.ok(call(calls, label).prompt.includes(line), label + ' prompt holds the ' + seat + ' line');
    assert.ok(src.includes(line), 'script source holds the ' + seat + ' line');
  }
});

test('build-and-check: the check task lists the global checks before the workshop checks', async () => {
  const { calls } = await runScript('build-and-check', BAC);
  const t = taskPart(call(calls, 'check').prompt);
  const g = t.indexOf('node lab/checks/hard-rules.mjs');
  const w = t.indexOf('ALPHA-CHECK-7302');
  assert.ok(g >= 0 && w >= 0 && g < w, 'global check first, then ALPHA-CHECK-7302');
});

test('build-and-check: verifiers get the questions and the rubric; the adversary gets the work and the criteria', async () => {
  const { calls } = await runScript('build-and-check', BAC);
  for (const label of ['review', 'adversary', 'imposter']) {
    const t = taskPart(call(calls, label).prompt);
    assert.ok(t.includes('ALPHA-QUESTION-7303'), label + ' gets the workshop question');
    assert.ok(t.includes('rubric.md'), label + ' gets the rubric path');
  }
  const adv = taskPart(call(calls, 'adversary').prompt);
  assert.ok(adv.includes('=== The Work ==='));
  assert.ok(adv.includes('=== The Criteria ==='));
  assert.ok(adv.includes('/w/d.patch'));
  assert.ok(adv.indexOf('=== The Work ===') < adv.indexOf('=== The Criteria ==='));
});

test('build-and-check: the builder makes its own attempt branch from the base', async () => {
  const { calls } = await runScript('build-and-check', BAC);
  assert.ok(taskPart(call(calls, 'build').prompt).includes('git switch -c ws-a-a1 main'));
});

test('build-and-check: a dry run never pushes or opens a pull request; a real run opens a draft', async () => {
  const dry = await runScript('build-and-check', { ...BAC, dryRun: true });
  const dt = taskPart(call(dry.calls, 'report').prompt);
  assert.ok(dt.includes('pr.md'));
  assert.ok(!dt.includes('git push'));
  assert.ok(!dt.includes('gh pr create'));
  assert.equal(dry.result.dryRun, true);
  const real = await runScript('build-and-check', { ...BAC, dryRun: false });
  const rt = taskPart(call(real.calls, 'report').prompt);
  assert.ok(rt.includes('gh pr create --draft --base main --head ws-a-a1'));
});

test('build-and-check: a stage that returns nothing halts the run with no later call', async () => {
  for (const label of ['scope', 'brief', 'build', 'check', 'triage', 'fix', 'recheck', 'report']) {
    const { result, calls } = await runScript('build-and-check', BAC, { [label]: null });
    assert.equal(result.status, 'halted', label);
    assert.ok(String(result.halt).includes(label), `halt names ${label}: ${result.halt}`);
    assert.equal(calls[calls.length - 1].label, label, 'no call after ' + label);
  }
  const empty = await runScript('build-and-check', BAC, { scope: { block: '', checks: [], questions: [], warnings: ['workshop ws-a has no folder'], plugin_root: '/p', notes: '' } });
  assert.equal(empty.result.status, 'halted');
  assert.ok(String(empty.result.halt).includes('no folder'));
  assert.equal(empty.calls.length, 1);
  const blocked = await runScript('build-and-check', BAC, { build: { branch: 'ws-a-a1', commit: '', files: [], status: 'blocked', notes: 'stuck', captures: ['- x: y (2026-10-11)'] } });
  assert.equal(blocked.result.status, 'halted');
  assert.ok(String(blocked.result.halt).includes('build: blocked'));
  assert.equal(blocked.calls[blocked.calls.length - 1].label, 'build');
  const noReview = await runScript('build-and-check', BAC, { review: null });
  assert.equal(noReview.result.status, 'delivered');
  assert.ok(call(noReview.calls, 'triage') && call(noReview.calls, 'report'));
});

test('launch: string args are the primary argument and missing args halt before any agent', async () => {
  const bac = await runScript('build-and-check', 'ws-a');
  assert.equal(bac.result.status, 'delivered');
  assert.equal(bac.result.workshop, 'ws-a');
  assert.equal(call(bac.calls, 'build').opts.label, 'build');
  const recon = await runScript('recon', 'what is x?', {});
  assert.equal(recon.result.status, 'done');
  assert.equal(recon.result.question, 'what is x?');
  assert.ok(recon.calls.length > 0);
  const second = await runScript('second-opinion', 'README.md');
  assert.equal(second.result.status, 'done');
  assert.equal(second.result.target, 'README.md');
  for (const [name, primary] of [['build-and-check', 'workshop'], ['recon', 'question'], ['second-opinion', 'target']]) {
    const none = await runScript(name, undefined);
    assert.equal(none.result.status, 'halted', name);
    assert.ok(String(none.result.halt).startsWith('no ' + primary + ' given'), none.result.halt);
    assert.equal(none.calls.length, 0, name + ' makes no call');
  }
});

test('recon: three scouts, a summary and a claim check, with the workshop block in every later prompt', async () => {
  const { result, calls } = await runScript('recon', { question: 'q', workshop: 'ws-a', today: '2026-10-11' });
  const labels = calls.map(c => c.label);
  assert.equal(labels[0], 'scope');
  assert.deepEqual(labels.slice(1, 4).sort(), ['scout-1', 'scout-2', 'scout-3']);
  assert.deepEqual(labels.slice(4), ['summary', 'claims']);
  const table = { scope: ['haiku', 'low'], 'scout-1': ['haiku', 'low'], 'scout-2': ['haiku', 'low'], 'scout-3': ['haiku', 'low'], summary: ['sonnet', 'medium'], claims: ['sonnet', 'high'] };
  for (const [label, [model, effort]] of Object.entries(table)) {
    const o = call(calls, label).opts;
    assert.equal(o.model, model, label);
    assert.equal(o.effort, effort, label);
    assert.ok(o.schema, label + ' schema');
  }
  for (const l of ['scout-1', 'scout-2', 'scout-3']) {
    assert.ok(call(calls, l).prompt.includes(seatLine('scout')), l + ' carries the scout line');
    assert.equal(call(calls, l).opts.agentType, 'flight:scout');
  }
  assert.ok(call(calls, 'claims').prompt.includes(seatLine('reviewer')));
  assert.equal(call(calls, 'claims').opts.agentType, 'flight:reviewer');
  const angles = ['what the documents say', 'what the code does', 'what earlier branches and history did'];
  angles.forEach((a, i) => {
    const t = taskPart(call(calls, 'scout-' + (i + 1)).prompt);
    assert.ok(t.includes(a), 'scout-' + (i + 1) + ' has its angle');
    angles.forEach((b, j) => { if (j !== i) assert.ok(!t.includes(b), 'scout-' + (i + 1) + ' is told only its own angle'); });
  });
  calls.slice(1).forEach(c => {
    assert.ok(c.prompt.includes('ALPHA-CONTEXT-7301'), c.label + ' holds the workshop context');
    assert.ok(!c.prompt.includes('BRAVO-'), c.label);
    assert.ok(c.prompt.indexOf(globalBlock()) < c.prompt.indexOf('\nRank: '));
  });
  assert.equal(result.status, 'done');
  assert.ok(result.report_text.includes('SUMMARY-TEXT'));
  assert.ok(result.report_text.includes('confirmed'));
  const plain = await runScript('recon', { question: 'q', today: '2026-10-11' });
  assert.ok(!plain.calls.some(c => c.label === 'scope'));
  assert.ok(plain.calls.length === 5);
  assert.ok(!plain.calls.some(c => c.prompt.includes('Workshop ')));
  const none = await runScript('recon', { question: 'q' }, { 'scout-1': null, 'scout-2': null, 'scout-3': null });
  assert.equal(none.result.status, 'halted');
  assert.ok(String(none.result.halt).includes('scouts returned nothing'));
});

test('second-opinion: prepare, three readers and a summary, with or without a workshop', async () => {
  const { result, calls } = await runScript('second-opinion', { target: 'README.md' });
  const labels = calls.map(c => c.label);
  assert.equal(labels[0], 'prepare');
  assert.ok(!labels.includes('scope'));
  assert.deepEqual(labels.slice(1, 4).sort(), ['adversary', 'imposter', 'review']);
  assert.equal(labels[4], 'summary');
  const table = { prepare: ['haiku', 'low'], review: ['sonnet', 'high'], adversary: ['opus', 'high'], imposter: ['sonnet', 'high'], summary: ['sonnet', 'medium'] };
  for (const [label, [model, effort]] of Object.entries(table)) {
    assert.equal(call(calls, label).opts.model, model, label);
    assert.equal(call(calls, label).opts.effort, effort, label);
  }
  assert.equal(call(calls, 'prepare').opts.isolation, 'worktree');
  assert.ok(call(calls, 'review').prompt.includes(seatLine('reviewer')));
  assert.ok(call(calls, 'adversary').prompt.includes(seatLine('adversary cold')));
  assert.ok(call(calls, 'imposter').prompt.includes(seatLine('imposter')));
  assert.ok(taskPart(call(calls, 'adversary').prompt).includes('/abs/README.md'));
  assert.equal(result.status, 'done');
  assert.equal(result.kind, 'file');
  const withWs = await runScript('second-opinion', { target: 'README.md', workshop: 'ws-a' });
  assert.equal(withWs.calls[0].label, 'scope');
  withWs.calls.slice(1).forEach(c => {
    assert.ok(c.prompt.includes('ALPHA-CONTEXT-7301'), c.label);
    assert.ok(!c.prompt.includes('BRAVO-'), c.label);
  });
  assert.ok(taskPart(call(withWs.calls, 'review').prompt).includes('ALPHA-QUESTION-7303'));
});

test('launch: the skill is owner-only with a short plain description, and the report template exists', () => {
  const dir = path.join(pluginRoot, 'skills', 'launch');
  const text = fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
  const fm = text.match(/^---\n([\s\S]*?)\n---/);
  assert.ok(fm, 'frontmatter');
  const field = k => {
    const m = fm[1].match(new RegExp('^' + k + ':\\s*(.*)$', 'm'));
    return m ? m[1].trim().replace(/^(["'])(.*)\1$/, '$2') : null;
  };
  assert.equal(field('name'), 'launch');
  assert.equal(field('disable-model-invocation'), 'true');
  const description = field('description');
  assert.ok(description && description.length < 400, 'description under 400 characters');
  assert.ok(!/commander|captain|officer|worker/i.test(description), 'no rank word in the description');
  assert.ok(fs.existsSync(path.join(dir, 'report-template.md')), 'report-template.md exists');
});
