// Tests for the FlightDeck core: the pre-flight card, the shared reader, the scope command,
// the three guard rules and the content rules. Node built-ins only; fixtures live in temporary
// folders; the plugin root comes from this file's own location.
// Run a subset by area: node --test --test-name-pattern='^(card|reader|scope|truth|git|ceiling):' 'flightdeck/tests/*.test.mjs'
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { truthDecision, gitDecision, ceilingDecision } from '../hooks/guard.mjs';
import { buildCard } from '../hooks/preflight.mjs';
import {
  parseManifest, parseQuestions, parseVerify, parseDecisions,
  latestAttempts, listWorkshops, scopeBlock, findRoot,
} from '../lib/workshops.mjs';

const pluginRoot = fileURLToPath(new URL('..', import.meta.url));
const repoRoot = path.resolve(pluginRoot, '..');
const PREFLIGHT = path.join(pluginRoot, 'hooks', 'preflight.mjs');
const GUARD = path.join(pluginRoot, 'hooks', 'guard.mjs');
const READER = path.join(pluginRoot, 'lib', 'workshops.mjs');

// ---------- fixtures and helpers ----------

const tmpDirs = [];
function tmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-'));
  tmpDirs.push(d);
  return d;
}
after(() => { for (const d of tmpDirs) fs.rmSync(d, { recursive: true, force: true }); });

function put(root, rel, text = '') {
  const file = path.join(root, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
  return file;
}
function mkd(root, rel) { fs.mkdirSync(path.join(root, rel), { recursive: true }); }
function manifest(lines) { return `# Workshops\n\nThe work FlightDeck knows about, one line each.\n\n${lines.join('\n')}\n`; }
function card(title) { return `# ${title}\n\nwork: some work\ndone: some done\n`; }

function runNode(script, args, { input, env, cwd } = {}) {
  const stdin = input === undefined ? '' : (typeof input === 'string' ? input : JSON.stringify(input));
  return spawnSync(process.execPath, [script, ...args], { input: stdin, env: { PATH: process.env.PATH, ...env }, cwd, encoding: 'utf8' });
}

const QUESTIONS = `# Questions for workshop alpha

## q1: First question?
why: because
options: a) yes; b) no
recommended: a) yes
asked: 2026-10-01 by lead
answer:

## q2: Second question?
why: because
asked: 2026-10-01 by lead
answer: a) yes | note: fine

## q3: Third question?
why: because
asked: 2026-10-01 by lead
ask-later: next sitting
answer:
`;

function cardProject() {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest([
    '- alpha: do the alpha work (2026-10-01)',
    '- beta: maybe later (2026-10-02)',
  ]));
  put(r, '.flightdeck/alpha/workshop.md', card('Alpha'));
  return r;
}
const pilotInput = r => ({ hook_event_name: 'SessionStart', source: 'startup', agent_type: 'flight:pilot', cwd: r });
function runCard(r, input) { return runNode(PREFLIGHT, [], { input, env: { CLAUDE_PROJECT_DIR: r } }); }

function gitIn(cwd, ...args) {
  return execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@t', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}
function repo(branch = 'main') {
  const r = tmp();
  gitIn(r, 'init', '-b', branch);
  gitIn(r, 'commit', '--allow-empty', '-m', 'init');
  return r;
}

// ---------- card ----------

test('card: prints systemMessage and additionalContext, equal, in a pilot session', () => {
  const r = cardProject();
  const res = runCard(r, pilotInput(r));
  assert.equal(res.status, 0);
  const out = JSON.parse(res.stdout);
  assert.equal(typeof out.systemMessage, 'string');
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.equal(out.systemMessage, out.hookSpecificOutput.additionalContext);
  const lines = out.systemMessage.split('\n');
  assert.match(lines[0], /^FlightDeck \d+\.\d+\.\d+ pre-flight: Captain on deck$/);
  assert.match(lines[1], /^Branch: .+/);
  assert.ok(lines.some(l => l.startsWith('Workshop alpha: latest attempts none; open questions: 0')));
  assert.ok(lines.includes('Captured, waiting to start: 1'));
  assert.equal(lines.at(-1), 'How to start: say what you want done, or say "activate <name>" for captured work.');
});

test('card: silent when agent_type is absent or another agent', () => {
  const r = cardProject();
  const base = pilotInput(r);
  delete base.agent_type;
  for (const input of [base, { ...base, agent_type: 'flight:builder' }, { ...base, agent_type: 'general-purpose' }]) {
    const res = runCard(r, input);
    assert.equal(res.status, 0);
    assert.equal(res.stdout, '');
  }
});

test('card: silent without a .flightdeck folder and on malformed input', () => {
  const r = tmp();
  const res = runCard(r, pilotInput(r));
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
  const bad = runCard(cardProject(), 'not json');
  assert.equal(bad.status, 0);
  assert.equal(bad.stdout, '');
});

test('card: open question count excludes ask-later questions and shows the held count', () => {
  const r = cardProject();
  put(r, '.flightdeck/alpha/questions.md', QUESTIONS);
  const out = JSON.parse(runCard(r, pilotInput(r)).stdout);
  assert.ok(out.systemMessage.includes('Workshop alpha: latest attempts none; open questions: 1 (1 held to ask later)'));
});

test('card: captured count comes from the manifest, activation-pending ones included, settled ones not listed', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest([
    '- one: first (2026-10-01)',
    '- two: second (2026-10-01)',
    '- three: third (2026-10-01)',
    '- live: running (2026-10-01)',
    '- done-one: finished (2026-10-01)',
  ]));
  put(r, '.flightdeck/three.activate.md', 'activate me');
  put(r, '.flightdeck/live/workshop.md', card('Live'));
  put(r, '.flightdeck/done-one/workshop.md', `${card('Done')}\nsettled: 2026-10-05\n`);
  const text = JSON.parse(runCard(r, pilotInput(r)).stdout).systemMessage;
  assert.ok(text.includes('Captured, waiting to start: 3'));
  assert.ok(text.includes('Workshop live:'));
  assert.ok(!text.includes('done-one'));
});

test('card: latest attempt is the highest per group, flat and nested', () => {
  const r = cardProject();
  for (const d of ['a1', 'a3', 'pr-1/a1', 'pr-1/a2', 'plan/a2']) mkd(r, `.flightdeck/alpha/attempts/${d}`);
  put(r, '.flightdeck/alpha/attempts/notes.md', 'not an attempt');
  const text = JSON.parse(runCard(r, pilotInput(r)).stdout).systemMessage;
  assert.ok(text.includes('latest attempts a3, plan/a2, pr-1/a2;'), text);
  assert.deepEqual(latestAttempts(path.join(r, '.flightdeck/alpha')).map(a => a.label), ['a3', 'plan/a2', 'pr-1/a2']);
});

test('card: at most three attempt labels, then +n more', () => {
  const r = cardProject();
  for (const d of ['a1', 'g1/a1', 'g2/a4', 'g3/a2', 'g4/a1']) mkd(r, `.flightdeck/alpha/attempts/${d}`);
  const text = buildCard(r, { branch: 'x', version: '1.2.3' });
  assert.ok(text.includes('latest attempts a1, g1/a1, g2/a4, +2 more;'), text);
});

test('card: at most 10 lines and 800 characters with twelve active workshops', () => {
  const r = tmp();
  const names = Array.from({ length: 12 }, (_, i) => `workshop-number-${String(i + 1).padStart(2, '0')}`);
  put(r, '.flightdeck/workshops.md', manifest(names.map(n => `- ${n}: a long enough ask for ${n} (2026-10-01)`)));
  for (const n of names) {
    put(r, `.flightdeck/${n}/workshop.md`, card(n));
    for (const d of ['a1', 'a2', 'g1/a3', 'g2/a1', 'g3/a1']) mkd(r, `.flightdeck/${n}/attempts/${d}`);
    put(r, `.flightdeck/${n}/questions.md`, QUESTIONS);
  }
  const out = JSON.parse(runCard(r, pilotInput(r)).stdout);
  const lines = out.systemMessage.split('\n');
  assert.ok(lines.length <= 10, `${lines.length} lines`);
  assert.ok(out.systemMessage.length <= 800, `${out.systemMessage.length} characters`);
  const shown = lines.filter(l => l.startsWith('Workshop ')).length;
  const more = lines.find(l => /^\.\.\.and \d+ more active workshops$/.test(l));
  assert.ok(more, 'has the "...and n more" line');
  assert.equal(shown + Number(/\d+/.exec(more)[0]), 12);
  assert.ok(lines.includes('Captured, waiting to start: 0'));
});

test('card: no active workshop gives one line, and the branch comes from git', () => {
  const r = repo('trunk');
  put(r, '.flightdeck/workshops.md', manifest(['- later: someday (2026-10-01)']));
  const out = JSON.parse(runCard(r, pilotInput(r)).stdout);
  const lines = out.systemMessage.split('\n');
  assert.equal(lines[1], 'Branch: trunk');
  assert.equal(lines[2], 'No active workshops.');
  assert.equal(lines[3], 'Captured, waiting to start: 1');
});

test('card: buildCard takes the version it is given', () => {
  const r = cardProject();
  assert.equal(buildCard(r, { branch: 'b', version: '9.9.9' }).split('\n')[0], 'FlightDeck 9.9.9 pre-flight: Captain on deck');
});

// ---------- reader ----------

test('reader: manifest asks may hold colons, bars, brackets and parentheses', () => {
  const { entries, warnings } = parseManifest('# Workshops\n\nA sentence.\n\n- odd-one: fix a|b: the [x] (y) part (2026-10-11)\n- plain: just this (2026-01-02)\n');
  assert.deepEqual(entries, [
    { name: 'odd-one', ask: 'fix a|b: the [x] (y) part', date: '2026-10-11' },
    { name: 'plain', ask: 'just this', date: '2026-01-02' },
  ]);
  assert.deepEqual(warnings, []);
});

test('reader: a manifest line without a date is kept with a warning, a bad name is skipped with a warning', () => {
  const { entries, warnings } = parseManifest('- no-date: something to do\n- Bad Name: skipped (2026-10-11)\n- no-colon-here (2026-10-11)\n- good: fine (2026-10-11)\n');
  assert.deepEqual(entries.map(e => e.name), ['no-date', 'good']);
  assert.equal(entries[0].date, null);
  assert.equal(entries[0].ask, 'something to do');
  assert.equal(warnings.length, 3);
});

test('reader: HTML comments and fenced code blocks are ignored', () => {
  const text = [
    '# Workshops', '', 'A sentence.', '',
    '<!-- - hidden: not counted (2026-01-01) -->',
    '<!--', '- multi: not counted (2026-01-01)', '-->',
    '```', '- fenced: not counted (2026-01-01)', '```',
    '- real: counted (2026-01-01)',
  ].join('\n');
  assert.deepEqual(parseManifest(text).entries.map(e => e.name), ['real']);
  const q = parseQuestions('<!--\n## q1: example\nanswer:\n-->\n## q2: real\nanswer:\n');
  assert.equal(q.questions.length, 1);
  assert.equal(q.questions[0].id, 'q2');
  assert.deepEqual(parseVerify('```\n## checks\n- `x`: y\n```\n## checks\n- `real`: ok\n').checks, ['real']);
});

test('reader: states are derived from folders, the activate file and the settled line', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest([
    '- cap: captured only (2026-10-01)',
    '- pend: waiting (2026-10-01)',
    '- act: running (2026-10-01)',
    '- fin: finished (2026-10-01)',
    '- fin-comment: only mentions it (2026-10-01)',
  ]));
  put(r, '.flightdeck/pend.activate.md', 'x');
  put(r, '.flightdeck/act/workshop.md', card('Act'));
  put(r, '.flightdeck/fin/workshop.md', `${card('Fin')}settled: 2026-10-09\n`);
  put(r, '.flightdeck/fin-comment/workshop.md', `${card('Fin')}<!-- add a line: settled: 2026-10-09 -->\n`);
  put(r, '.flightdeck/unlisted/workshop.md', card('Unlisted'));
  const res = listWorkshops(r);
  const by = Object.fromEntries(res.workshops.map(w => [w.name, w]));
  assert.equal(by.cap.state, 'captured');
  assert.equal(by.cap.pendingActivation, false);
  assert.equal(by.pend.state, 'captured');
  assert.equal(by.pend.pendingActivation, true);
  assert.equal(by.act.state, 'active');
  assert.equal(by.fin.state, 'settled');
  assert.equal(by['fin-comment'].state, 'active');
  assert.equal(by.unlisted.state, 'active');
  assert.ok(res.warnings.some(w => w.includes('unlisted') && w.includes('not in workshops.md')));
  assert.equal(res.captured, 2);
  assert.deepEqual(res.workshops.map(w => w.name), ['cap', 'pend', 'act', 'fin', 'fin-comment', 'unlisted']);
});

test('reader: questions count open and held ones, and a malformed file gives warnings, not exceptions', () => {
  const q = parseQuestions(QUESTIONS);
  assert.equal(q.questions.length, 3);
  assert.equal(q.open, 1);
  assert.equal(q.heldForLater, 1);
  assert.deepEqual(q.questions.map(x => [x.id, x.open, x.askLater]), [['q1', true, false], ['q2', false, false], ['q3', false, true]]);
  const bad = parseQuestions('## q1 no colon here\nwhy: x\n## Notes\nsome notes\n## q2: has no answer line\nwhy: y\n');
  assert.equal(bad.questions.length, 2);
  assert.equal(bad.open, 2);
  assert.ok(bad.warnings.length >= 3);
  for (const junk of [undefined, null, '', 42, '\u0000\u0001 ## ', '## q9:']) {
    assert.doesNotThrow(() => parseQuestions(junk));
    assert.doesNotThrow(() => parseManifest(junk));
    assert.doesNotThrow(() => parseVerify(junk));
    assert.doesNotThrow(() => parseDecisions(junk));
  }
});

test('reader: whitespace after answer: still counts as open; an answer with text does not', () => {
  assert.equal(parseQuestions('## q1: x\nanswer:    \n').open, 1);
  assert.equal(parseQuestions('## q1: x\nanswer: b\n').open, 0);
});

test('reader: verify and decisions parse their lines', () => {
  const v = parseVerify('# Verification for workshop x\n\n## Checks\n\n- `node a.mjs`: prints pass\n- no backticks here\n\n## QUESTIONS\n\n- Is it plain?\n');
  assert.deepEqual(v.checks, ['node a.mjs', 'no backticks here']);
  assert.deepEqual(v.questions, ['Is it plain?']);
  assert.equal(v.warnings.length, 1);
  const d = parseDecisions('# Decisions\n\n- 2026-10-11: Keep the layout. Reason: owner said so.\n- no date here\n');
  assert.deepEqual(d.decisions, [{ date: '2026-10-11', text: 'Keep the layout. Reason: owner said so.' }]);
  assert.equal(d.warnings.length, 1);
});

test('reader: findRoot walks up to the folder that holds .flightdeck and returns null when none', () => {
  const r = tmp();
  mkd(r, '.flightdeck');
  mkd(r, 'a/b/c');
  assert.equal(findRoot(path.join(r, 'a/b/c')), r);
  assert.equal(findRoot(r), r);
  assert.equal(findRoot(''), null);
  const none = tmp();
  const found = findRoot(none);
  assert.ok(found === null || !found.startsWith(none));
});

// ---------- scope ----------

function scopeProject() {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- ws-a: first (2026-10-01)', '- ws-b: second (2026-10-01)', '- ws-c: captured (2026-10-01)']));
  for (const w of ['a', 'b']) {
    put(r, `.flightdeck/ws-${w}/workshop.md`, card(`WS ${w}`));
    put(r, `.flightdeck/ws-${w}/constraints.md`, `---\nread: "agents"\nwrite: "human"\n---\nYour truth for this work: only you write here; agents read it first.\n\n- 2026-10-01: SENTINEL-${w.toUpperCase()}-CONSTRAINTS\n`);
    put(r, `.flightdeck/ws-${w}/context.md`, `# Context for workshop ws-${w}\n\nSENTINEL-${w.toUpperCase()}-CONTEXT\n`);
    put(r, `.flightdeck/ws-${w}/verify.md`, `# Verification for workshop ws-${w}\n\n## checks\n\n- \`node check-${w}.mjs\`: prints pass\n- \`node --test 'x/*.test.mjs'\`: exits 0\n\n## questions\n\n- Is SENTINEL-${w.toUpperCase()}-VERIFY true?\n- Is it plain?\n`);
  }
  return r;
}

test('scope: ws-a block holds its own sentinels in order under the exact headings and never ws-b', () => {
  const r = scopeProject();
  const { block, warnings } = scopeBlock(r, 'ws-a');
  assert.deepEqual(warnings, []);
  const parts = block.split('\n\n');
  assert.equal(parts[0], "Workshop ws-a: the following is this workshop's own context and verification, in addition to the global rules. VISION.md and build.txt win on any conflict.");
  const at = s => { const i = block.indexOf(s); assert.ok(i >= 0, `missing: ${s}`); return i; };
  const order = [
    at("The owner's constraints for workshop ws-a (`.flightdeck/ws-a/constraints.md`):"),
    at('SENTINEL-A-CONSTRAINTS'),
    at('Context for workshop ws-a (`context.md`):'),
    at('SENTINEL-A-CONTEXT'),
    at('Verification for workshop ws-a (`verify.md`):'),
    at('SENTINEL-A-VERIFY'),
    at('Original files: .flightdeck/ws-a/constraints.md, .flightdeck/ws-a/context.md, .flightdeck/ws-a/verify.md'),
  ];
  assert.deepEqual(order, [...order].sort((x, y) => x - y));
  assert.ok(block.endsWith('Original files: .flightdeck/ws-a/constraints.md, .flightdeck/ws-a/context.md, .flightdeck/ws-a/verify.md'));
  assert.ok(!block.includes('SENTINEL-B'));
  assert.ok(!block.includes('ws-b'));
  assert.ok(block.includes(fs.readFileSync(path.join(r, '.flightdeck/ws-a/constraints.md'), 'utf8').trimEnd()));
});

test('scope: command line prints the block for ws-b and not ws-a, exit 0', () => {
  const r = scopeProject();
  const res = runNode(READER, ['scope', 'ws-b', '--root', r]);
  assert.equal(res.status, 0);
  assert.ok(res.stdout.includes('SENTINEL-B-CONTEXT'));
  assert.ok(!res.stdout.includes('SENTINEL-A'));
  const viaEnv = runNode(READER, ['scope', 'ws-a'], { env: { CLAUDE_PROJECT_DIR: path.join(r, '.flightdeck') }, cwd: r });
  assert.equal(viaEnv.status, 0);
  assert.ok(viaEnv.stdout.includes('SENTINEL-A-CONTEXT'));
});

test('scope: missing files are skipped together with their headings', () => {
  const r = tmp();
  put(r, '.flightdeck/only/workshop.md', card('Only'));
  put(r, '.flightdeck/only/context.md', '# Context for workshop only\n\nSENTINEL-ONLY\n');
  const { block, checks, questions, warnings } = scopeBlock(r, 'only');
  assert.ok(block.includes('Context for workshop only (`context.md`):'));
  assert.ok(!block.includes("The owner's constraints"));
  assert.ok(!block.includes('Verification for workshop'));
  assert.ok(block.endsWith('Original files: .flightdeck/only/context.md'));
  assert.deepEqual([checks, questions, warnings], [[], [], []]);
});

test('scope: a captured workshop with no folder gives an empty block and a warning', () => {
  const r = scopeProject();
  const res = scopeBlock(r, 'ws-c');
  assert.equal(res.block, '');
  assert.deepEqual(res.warnings, ['workshop ws-c has no folder (captured or unknown)']);
  const cli = runNode(READER, ['scope', 'ws-c', '--root', r]);
  assert.equal(cli.status, 0);
  assert.equal(cli.stdout, '');
  assert.ok(cli.stderr.includes('workshop ws-c has no folder (captured or unknown)'));
});

test('scope: oversized files stay whole and the warning line comes first', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- big: large (2026-10-01)']));
  const body = tag => `${Array.from({ length: 60 }, (_, i) => `${tag} line ${i} ${'x'.repeat(30)}`).join('\n')}\n`;
  const files = { 'constraints.md': body('CON'), 'context.md': body('CTX'), 'verify.md': `## checks\n\n- \`node a.mjs\`: ok\n\n## questions\n\n- Q?\n${body('VER')}` };
  let total = 0;
  for (const [f, t] of Object.entries(files)) { put(r, `.flightdeck/big/${f}`, t); total += t.length; }
  assert.ok(total > 6000);
  const { block } = scopeBlock(r, 'big');
  assert.equal(block.split('\n\n')[0], `Warning: the scoped files for workshop big total ${total} characters, over the 6,000-character default; all three are given whole.`);
  for (const t of Object.values(files)) assert.ok(block.includes(t.trimEnd()), 'a file was cut');
  const small = scopeBlock(scopeProject(), 'ws-a');
  assert.ok(!small.block.startsWith('Warning:'));
});

test('scope: --json returns block, checks, questions and warnings', () => {
  const r = scopeProject();
  const res = runNode(READER, ['scope', 'ws-a', '--json', '--root', r]);
  assert.equal(res.status, 0);
  const out = JSON.parse(res.stdout);
  assert.deepEqual(Object.keys(out).sort(), ['block', 'checks', 'questions', 'warnings']);
  assert.deepEqual(out.checks, ['node check-a.mjs', "node --test 'x/*.test.mjs'"]);
  assert.deepEqual(out.questions, ['Is SENTINEL-A-VERIFY true?', 'Is it plain?']);
  assert.deepEqual(out.warnings, []);
  assert.ok(out.block.includes('SENTINEL-A-CONTEXT'));
});

test('scope: the command line exits 0 in every case', () => {
  const r = scopeProject();
  const empty = tmp();
  const cases = [
    [['scope', 'ws-a', '--root', r], {}],
    [['scope', 'nope', '--root', r], {}],
    [['scope', '../ws-b', '--root', path.join(r, '.flightdeck/ws-a')], {}],
    [['scope', 'Bad Name', '--json', '--root', r], {}],
    [['scope'], {}],
    [['scope', 'ws-a', '--json', '--root', empty], {}],
    [['list', '--root', r], {}],
    [['list', '--json', '--root', empty], {}],
    [['frobnicate'], {}],
    [[], {}],
  ];
  for (const [args, extra] of cases) {
    const res = runNode(READER, args, { cwd: empty, ...extra });
    assert.equal(res.status, 0, `exit for ${args.join(' ')}`);
  }
  assert.ok(runNode(READER, ['frobnicate'], { cwd: empty }).stdout.startsWith('usage:'));
  const traversal = scopeBlock(r, '../ws-b');
  assert.equal(traversal.block, '');
  assert.equal(traversal.warnings.length, 1);
});

test('scope: list prints one line per workshop and --json prints the list object', () => {
  const r = scopeProject();
  const res = runNode(READER, ['list', '--root', r]);
  assert.deepEqual(res.stdout.trim().split('\n'), ['ws-a  active  first', 'ws-b  active  second', 'ws-c  captured  captured']);
  const json = JSON.parse(runNode(READER, ['list', '--json', '--root', r]).stdout);
  assert.equal(json.captured, 1);
  assert.equal(json.workshops.length, 3);
});

// ---------- truth ----------

const TRUTH_REASON = "This file holds the owner's own words; write a question in questions.md instead.";
function truthProject() {
  const r = tmp();
  put(r, '.flightdeck/build-1/constraints.md', '---\nread: "agents"\nwrite: "human"\n---\nYour truth.\n');
  put(r, '.flightdeck/VISION.md', '# Vision\n');
  put(r, '.flightdeck/build.txt', 'build\n');
  put(r, 'notes/human.md', '---\nwrite: "human"\n---\nowner words\n');
  put(r, 'notes/plain.md', '---\nwrite: "agents"\n---\nnormal\n');
  put(r, 'flightdeck/templates/workshop/constraints.md', '---\nread: "agents"\nwrite: "human"\n---\ntemplate\n');
  return r;
}
const writeIn = (r, rel, extra = {}) => ({ hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_input: { file_path: path.join(r, rel) }, cwd: r, ...extra });

test('truth: denies a subagent write to constraints.md', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md', { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
});

test('truth: denies a subagent even when its agent_type is flight:pilot', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md', { agent_id: 'a1', agent_type: 'flight:pilot' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
});

test('truth: denies a runner session (agent_type flight:runner, no agent_id)', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md', { agent_type: 'flight:runner' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
});

test('truth: denies when FLIGHTDECK_UNATTENDED=1', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md'), { CLAUDE_PROJECT_DIR: r, FLIGHTDECK_UNATTENDED: '1' }), TRUTH_REASON);
});

test('truth: denies a subagent creating a new .flightdeck/x/constraints.md', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, '.flightdeck/x/constraints.md', { tool_name: 'Write', agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
});

test('truth: denies VISION.md and build.txt for an agent', () => {
  const r = truthProject();
  for (const rel of ['.flightdeck/VISION.md', '.flightdeck/build.txt']) {
    assert.equal(truthDecision(writeIn(r, rel, { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON, rel);
  }
});

test('truth: denies a subagent edit to an existing file with write: "human" frontmatter', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, 'notes/human.md', { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
  put(r, 'notes/unquoted.md', '---\nwrite: human\n---\nx\n');
  assert.equal(truthDecision(writeIn(r, 'notes/unquoted.md', { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
  assert.equal(truthDecision(writeIn(r, 'notes/plain.md', { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), null);
});

test('truth: denies the same files inside a worktree copy under .claude/worktrees', () => {
  const r = truthProject();
  const rel = '.claude/worktrees/wf-1/.flightdeck/build-1/constraints.md';
  assert.equal(truthDecision(writeIn(r, rel, { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), TRUTH_REASON);
});

test('truth: allows a subagent writing the workshop constraints template', () => {
  const r = truthProject();
  assert.equal(truthDecision(writeIn(r, 'flightdeck/templates/workshop/constraints.md', { agent_id: 'a1' }), { CLAUDE_PROJECT_DIR: r }), null);
});

test('truth: allows the main conversation and a pilot session', () => {
  const r = truthProject();
  const env = { CLAUDE_PROJECT_DIR: r };
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md'), env), null);
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/constraints.md', { agent_type: 'flight:pilot' }), env), null);
  assert.equal(truthDecision(writeIn(r, '.flightdeck/VISION.md', { agent_type: 'flight:pilot' }), env), null);
});

test('truth: ignores other files and files outside the project', () => {
  const r = truthProject();
  const other = tmp();
  put(other, '.flightdeck/build-1/constraints.md', 'elsewhere');
  const env = { CLAUDE_PROJECT_DIR: r };
  assert.equal(truthDecision(writeIn(r, 'src/app.js', { agent_id: 'a1' }), env), null);
  assert.equal(truthDecision(writeIn(r, '.flightdeck/build-1/context.md', { agent_id: 'a1' }), env), null);
  assert.equal(truthDecision(writeIn(r, '.flightdeck/workshops.md', { agent_id: 'a1' }), env), null);
  assert.equal(truthDecision({ ...writeIn(r, 'x', { agent_id: 'a1' }), tool_input: { file_path: path.join(other, '.flightdeck/build-1/constraints.md') } }, env), null);
  assert.equal(truthDecision({ tool_name: 'Edit', tool_input: {}, agent_id: 'a1', cwd: r }, env), null);
});

test('truth: the command prints a deny for a subagent and exits 0 with no output on malformed input', () => {
  const r = truthProject();
  const res = runNode(GUARD, ['truth'], { input: writeIn(r, '.flightdeck/build-1/constraints.md', { agent_id: 'a1' }), env: { CLAUDE_PROJECT_DIR: r } });
  assert.equal(res.status, 0);
  assert.deepEqual(JSON.parse(res.stdout), { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: TRUTH_REASON } });
  const own = runNode(GUARD, ['truth'], { input: writeIn(r, '.flightdeck/build-1/constraints.md'), env: { CLAUDE_PROJECT_DIR: r } });
  assert.equal(own.status, 0);
  assert.equal(own.stdout, '');
  for (const bad of ['not json', '', '{"tool_input":']) {
    const res2 = runNode(GUARD, ['truth'], { input: bad, env: { FLIGHTDECK_UNATTENDED: '1' } });
    assert.equal(res2.status, 0);
    assert.equal(res2.stdout, '');
  }
});

// ---------- git ----------

const bash = (command, extra = {}) => ({ hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command }, cwd: '/nowhere', agent_id: 'a1', ...extra });
const gd = (command, branch = 'feat', extra = {}, env = {}) => gitDecision(bash(command, extra), env, branch);

test('git: denies a push to main or master in every form, in an agent context', () => {
  const denied = [
    'git push origin main',
    'git push origin master',
    'git push origin HEAD:main',
    'git push origin HEAD:refs/heads/main',
    'git push origin feat:main',
    'git push origin feat:refs/heads/master',
    'git push origin refs/heads/main',
    'git push --dry-run origin HEAD:main',
    'git push -u origin main',
    'git -C x push origin main',
    'git -c core.editor=true push origin main',
    'git --git-dir=.git push origin main',
    'git --git-dir .git push origin main',
    'FOO=1 git push origin main',
    'command git push origin main',
    'cd sub && git push origin main',
    'echo hi; git push origin main',
    'git status | cat; git push origin main',
    'bash -c "git push origin main"',
    'echo $(git push origin main)',
    '/usr/bin/git push origin main',
    'git push --repo=origin main',
  ];
  for (const c of denied) assert.match(String(gd(c)), /never push to main/, c);
});

test('git: denies HEAD and a bare push while the current branch is main', () => {
  assert.match(gd('git push origin HEAD', 'main'), /never push to main/);
  assert.match(gd('git push', 'main'), /never push to main/);
  assert.match(gd('git push origin', 'master'), /never push to main/);
  assert.match(gd('git push -u', 'main'), /never push to main/);
  assert.equal(gd('git push', 'feat'), null);
  assert.equal(gd('git push origin HEAD', 'feat'), null);
});

test('git: denies every force, mirror, all, plus-refspec and delete form', () => {
  const force = ['git push --force origin x', 'git push -f origin x', 'git push -uf origin x', 'git push origin x --force', 'git push --force-with-lease origin x', 'git push --force-with-lease=x:abc origin x', 'git push --force-if-includes origin x', 'git push origin +x', 'git push origin +x:y'];
  for (const c of force) assert.match(String(gd(c)), /never force-push/, c);
  for (const c of ['git push --mirror origin', 'git push --all origin']) assert.ok(gd(c), c);
  const del = ['git push origin --delete x', 'git push --delete origin x', 'git push -d origin x', 'git push origin :x', 'git push origin :refs/heads/x'];
  for (const c of del) assert.match(String(gd(c)), /never delete a branch/, c);
});

test('git: denies abbreviated long options, --prune and glob refspecs', () => {
  assert.match(String(gd('git push --del origin old')), /never delete a branch/);
  assert.match(String(gd('git push --dele origin old')), /never delete a branch/);
  assert.match(String(gd('git push --force-w origin x')), /never force-push/);
  assert.match(String(gd('git push --mir origin')), /never push to main/);
  assert.match(String(gd('git push --al origin')), /never push to main/);
  assert.match(String(gd('git push --prune origin x')), /pruning deletes remote branches/);
  assert.match(String(gd('git push origin "refs/heads/*:refs/heads/*"')), /glob refspec/);
});

test('git: allows ordinary pushes of other branches and other git commands', () => {
  const allowed = [
    'git push -u origin build-1-pr1-basic-a1',
    'git push origin HEAD:build-1-x',
    'git push origin feat',
    'git push origin feat:refs/heads/feat2',
    'git status',
    'git commit -m "push to main later"',
    'echo "git push origin main"',
    'git log --oneline | head',
    'git push -o ci.skip origin feat',
    'git push origin tag v1',
    'git push --dry-run origin HEAD:feat',
    'git push --follow-tags origin feat',
    'git push --set-upstream origin feat',
  ];
  for (const c of allowed) assert.equal(gd(c), null, c);
});

test('git: the same agent contexts are recognised: agent_id, a flight: agent_type, FLIGHTDECK_UNATTENDED', () => {
  const plain = { agent_id: undefined };
  assert.ok(gitDecision(bash('git push origin main', plain), {}, 'feat') === null, 'plain session is never checked');
  assert.ok(gitDecision(bash('git push origin main', { agent_id: undefined, agent_type: 'flight:builder' }), {}, 'feat'));
  assert.ok(gitDecision(bash('git push origin main', { agent_id: undefined, agent_type: 'flight:pilot' }), {}, 'feat'));
  assert.ok(gitDecision(bash('git push origin main', { agent_id: undefined }), { FLIGHTDECK_UNATTENDED: '1' }, 'feat'));
  assert.equal(gitDecision(bash('git push origin main', { agent_id: undefined, agent_type: 'general-purpose' }), {}, 'feat'), null);
  assert.equal(gitDecision(bash('git push origin main', { agent_id: undefined }), { FLIGHTDECK_UNATTENDED: '0' }, 'feat'), null);
});

test('git: allows git push origin main in the owner\'s plain session (command line)', () => {
  const r = repo('main');
  const input = { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push origin main' }, cwd: r };
  const res = runNode(GUARD, ['git'], { input, env: {} });
  assert.equal(res.status, 0);
  assert.equal(res.stdout, '');
});

test('git: the command line reads the real current branch for a bare push', () => {
  const r = repo('main');
  const input = { hook_event_name: 'PreToolUse', tool_name: 'Bash', tool_input: { command: 'git push' }, cwd: r, agent_id: 'a1' };
  const denied = runNode(GUARD, ['git'], { input, env: {} });
  assert.equal(denied.status, 0);
  const out = JSON.parse(denied.stdout);
  assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
  assert.equal(out.hookSpecificOutput.permissionDecision, 'deny');
  assert.match(out.hookSpecificOutput.permissionDecisionReason, /bare git push from main/);
  gitIn(r, 'switch', '-c', 'feature');
  const allowed = runNode(GUARD, ['git'], { input, env: {} });
  assert.equal(allowed.status, 0);
  assert.equal(allowed.stdout, '');
  const viaEnv = runNode(GUARD, ['git'], { input: { ...input, agent_id: undefined, tool_input: { command: 'git push --dry-run origin HEAD:main' } }, env: { FLIGHTDECK_UNATTENDED: '1' } });
  assert.match(JSON.parse(viaEnv.stdout).hookSpecificOutput.permissionDecisionReason, /never push to main/);
});

test('git: fails closed, denying with "guard error" on malformed input', () => {
  for (const bad of ['not json', '', '{"tool_input":']) {
    const res = runNode(GUARD, ['git'], { input: bad, env: {} });
    assert.equal(res.status, 0);
    const reason = JSON.parse(res.stdout).hookSpecificOutput.permissionDecisionReason;
    assert.match(reason, /^guard error: /);
  }
  const noCommand = runNode(GUARD, ['git'], { input: { tool_name: 'Bash', tool_input: {}, agent_id: 'a1', cwd: '/' }, env: {} });
  assert.match(JSON.parse(noCommand.stdout).hookSpecificOutput.permissionDecisionReason, /^guard error: /);
});

// ---------- ceiling ----------

const CEILING = "Owner's ceiling: Opus at high effort";
const agentCall = (model, prompt = 'do it') => ({ hook_event_name: 'PreToolUse', tool_name: 'Agent', tool_input: { description: 'x', prompt, ...(model === undefined ? {} : { model }) }, cwd: '/nowhere' });
const wfCall = (tool_input, cwd = '/nowhere') => ({ hook_event_name: 'PreToolUse', tool_name: 'Workflow', tool_input, cwd });

test('ceiling: denies an Agent call with model fable, best or anything containing fable', () => {
  for (const m of ['fable', 'FABLE', 'best', 'claude-fable-5', 'fable[1m]']) assert.equal(ceilingDecision(agentCall(m), {}), CEILING, m);
});

test('ceiling: allows sonnet, opus, haiku and no model; allows a prompt that says never use fable', () => {
  for (const m of ['sonnet', 'opus', 'haiku', undefined]) assert.equal(ceilingDecision(agentCall(m), {}), null, String(m));
  assert.equal(ceilingDecision(agentCall('sonnet', 'never use fable, best or xhigh; model: fable is forbidden'), {}), null);
});

test('ceiling: denies an inline workflow script with model fable or effort xhigh or max', () => {
  assert.equal(ceilingDecision(wfCall({ script: "await agent('x', { model: 'fable', effort: 'high' })" }), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ script: 'await agent("x", { model: "best" })' }), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ script: "await agent('x', { model: 'opus', effort: 'xhigh' })" }), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ args: { nested: ["agent({ effort: `max` })"] } }), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ script: "agent('x', { model: 'claude-fable-x' })" }), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ script: "await agent('x', { model: 'sonnet', effort: 'high' })" }), {}), null);
  assert.equal(ceilingDecision(wfCall({ script: "// the owner said: never use fable, best, xhigh or max\nagent('x', { model: 'opus', effort: 'high' })" }), {}), null);
});

test('ceiling: reads a script file named in the tool input', () => {
  const r = tmp();
  put(r, 'bad.js', "agent('x', { model: 'fable' })\n");
  put(r, 'good.mjs', "agent('x', { model: 'sonnet', effort: 'high' })\n");
  assert.equal(ceilingDecision(wfCall({ script: 'bad.js' }, r), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ path: path.join(r, 'bad.js') }, '/'), {}), CEILING);
  assert.equal(ceilingDecision(wfCall({ script: 'good.mjs' }, r), {}), null);
  assert.equal(ceilingDecision(wfCall({ script: 'missing.js' }, r), {}), null);
  assert.equal(ceilingDecision(wfCall({ script: 'bad.js' }, r), {}, () => "agent('x', { effort: 'max' })"), CEILING);
});

for (const name of ['plan', 'build']) {
  const file = path.join(repoRoot, '.flightdeck', 'build-1', 'workflows', `${name}.js`);
  const present = fs.existsSync(file);
  test(`ceiling: the real ${name}.js is allowed`, { skip: present ? false : `${name}.js is not in this repository` }, () => {
    assert.equal(ceilingDecision(wfCall({ script: file }, repoRoot), {}), null);
    assert.equal(ceilingDecision(wfCall({ script: fs.readFileSync(file, 'utf8') }, repoRoot), {}), null);
  });
}

test('ceiling: denies a model switch to fable in a flight:pilot session and ignores it in a plain session', () => {
  const sw = extra => ({ hook_event_name: 'PreModelSwitch', from_model: 'opus', to_model: 'opus', requested_model: 'opus', cwd: '/', ...extra });
  assert.equal(ceilingDecision(sw({ agent_type: 'flight:pilot', to_model: 'claude-fable-5' }), {}), CEILING);
  assert.equal(ceilingDecision(sw({ agent_type: 'flight:runner', requested_model: 'best' }), {}), CEILING);
  assert.equal(ceilingDecision(sw({ agent_type: 'flight:pilot', requested_model: 'sonnet', to_model: 'sonnet' }), {}), null);
  assert.equal(ceilingDecision(sw({ to_model: 'claude-fable-5' }), {}), null);
  assert.equal(ceilingDecision(sw({ agent_type: 'general-purpose', to_model: 'fable' }), {}), null);
  const res = runNode(GUARD, ['ceiling'], { input: sw({ agent_type: 'flight:pilot', to_model: 'fable' }) });
  assert.equal(res.status, 0);
  assert.deepEqual(JSON.parse(res.stdout), { hookSpecificOutput: { hookEventName: 'PreModelSwitch', permissionDecision: 'deny', permissionDecisionReason: CEILING } });
  assert.equal(runNode(GUARD, ['ceiling'], { input: sw({ to_model: 'fable' }) }).stdout, '');
});

test('ceiling: the command denies an Agent launch and fails open on malformed input', () => {
  const res = runNode(GUARD, ['ceiling'], { input: agentCall('fable') });
  assert.equal(res.status, 0);
  assert.equal(JSON.parse(res.stdout).hookSpecificOutput.permissionDecisionReason, CEILING);
  assert.equal(runNode(GUARD, ['ceiling'], { input: agentCall('sonnet') }).stdout, '');
  for (const bad of ['not json', '', '{"tool_name":']) {
    const r2 = runNode(GUARD, ['ceiling'], { input: bad });
    assert.equal(r2.status, 0);
    assert.equal(r2.stdout, '');
  }
  assert.equal(runNode(GUARD, ['unknown-mode'], { input: agentCall('fable') }).stdout, '');
});

// ---------- content (reads the real plugin files; green after the units are integrated) ----------

function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const fm = {};
  if (!m) return fm;
  let list = null;
  for (const line of m[1].split(/\r?\n/)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && list) { fm[list].push(item[1].trim()); continue; }
    const kv = /^([A-Za-z][\w-]*):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2] === '') { fm[kv[1]] = []; list = kv[1]; } else { fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, ''); list = null; }
  }
  return fm;
}
const tools = fm => (Array.isArray(fm.tools) ? fm.tools : String(fm.tools ?? '').split(/[\s,[\]]+/)).filter(Boolean);
const read = rel => fs.readFileSync(path.join(pluginRoot, rel), 'utf8');
const AGENTS = ['pilot', 'runner', 'scout', 'builder', 'reviewer', 'adversary', 'imposter'];
const agentFiles = () => AGENTS.map(n => ({ n, text: read(`agents/${n}.md`) }));

function ranksFromPolicies() {
  const text = read('policies.md');
  const m = /^## Ranks[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m.exec(text);
  assert.ok(m, 'policies.md has a "## Ranks" section');
  return [...m[1].matchAll(/^- (\w+): /gm)].map(x => x[1]);
}
const sections = text => text.split(/^## /m).slice(1).map(s => ({ title: s.split('\n')[0].trim(), body: s.split('\n').slice(1).join('\n') }));

test('content: exactly seven agent files, named pilot, runner, scout, builder, reviewer, adversary, imposter', () => {
  const files = fs.readdirSync(path.join(pluginRoot, 'agents')).filter(f => f.endsWith('.md')).sort();
  assert.deepEqual(files, AGENTS.map(n => `${n}.md`).sort());
});

test('content: no agent file name, name: or description: holds commander, captain, officer or worker', () => {
  const rankWord = /commander|captain|officer|worker/i;
  for (const { n, text } of agentFiles()) {
    const fm = frontmatter(text);
    assert.ok(!rankWord.test(`${n}.md`), `${n} file name`);
    assert.equal(fm.name, n, `${n} name`);
    assert.ok(fm.description && fm.description.length < 300, `${n} description present and under 300 characters`);
    assert.ok(!rankWord.test(fm.description), `${n} description`);
  }
});

test('content: every agent body has exactly one line starting "Fallback rank: ", matching the plan', () => {
  const exact = {
    pilot: 'Fallback rank: Captain unless told otherwise; you report to the Commander (the owner).',
    runner: 'Fallback rank: Officer when run as a background session, reporting to the Captain.',
  };
  const other = 'Fallback rank: Worker in the team of whoever sent you, reporting to them; if you do not know who sent you, you report to the Captain.';
  for (const { n, text } of agentFiles()) {
    const lines = text.split('\n').filter(l => l.startsWith('Fallback rank: '));
    assert.equal(lines.length, 1, n);
    assert.equal(lines[0].trimEnd(), exact[n] ?? other, n);
  }
});

test('content: every opus agent sets effort high, and no model is fable or best and no effort is xhigh or max', () => {
  for (const { n, text } of agentFiles()) {
    const fm = frontmatter(text);
    if (fm.model === 'opus') assert.equal(fm.effort, 'high', n);
    assert.ok(!/^(fable|best)$/i.test(fm.model ?? ''), `${n} model`);
    assert.ok(!/fable/i.test(fm.model ?? ''), `${n} model`);
    assert.ok(!/^(xhigh|max)$/i.test(fm.effort ?? ''), `${n} effort`);
  }
});

test('content: models and efforts match the plan, by function', () => {
  const want = { pilot: ['opus', 'high'], runner: ['sonnet', 'high'], scout: ['haiku', undefined], builder: ['sonnet', 'high'], reviewer: ['sonnet', 'high'], adversary: ['opus', 'high'], imposter: ['sonnet', 'high'] };
  for (const { n, text } of agentFiles()) {
    const fm = frontmatter(text);
    assert.deepEqual([fm.model, fm.effort], want[n], n);
  }
  for (const n of ['scout', 'adversary', 'imposter']) assert.equal(frontmatter(read(`agents/${n}.md`)).omitClaudeMd, 'true', `${n} omitClaudeMd`);
});

test('content: the pilot tools include Agent, AskUserQuestion, Edit and Write', () => {
  const t = tools(frontmatter(read('agents/pilot.md')));
  for (const need of ['Agent', 'AskUserQuestion', 'Edit', 'Write']) assert.ok(t.includes(need), `pilot tools: ${need}`);
});

test('content: policies.md lists exactly the four ranks under ## Ranks', () => {
  assert.deepEqual(ranksFromPolicies(), ['Commander', 'Captain', 'Officer', 'Worker']);
});

test('content: entry-points.md has the eight seats and each opens with one Rank: line naming a rank from policies.md', () => {
  const ranks = ranksFromPolicies();
  const secs = sections(read('skills/team-plans/entry-points.md'));
  assert.deepEqual(secs.map(s => s.title).sort(), ['adversary cold', 'adversary live', 'builder', 'imposter', 'reviewer', 'runner', 'scout', 'team lead']);
  for (const s of secs) {
    const lines = s.body.split('\n').filter(l => l.trim() !== '');
    const m = /^Rank: (\w+)\. Reports to: .+\. You decide: .+\. You do not decide: .+\.$/.exec(lines[0] ?? '');
    assert.ok(m, `${s.title}: first line is a Rank: line`);
    assert.ok(ranks.includes(m[1]), `${s.title}: ${m[1]} is a rank`);
    assert.equal(s.body.split('\n').filter(l => l.startsWith('Rank: ')).length, 1, `${s.title}: one Rank: line`);
  }
});

test('content: the six team plan pages have the six headings and every Seats line names one rank', () => {
  const ranks = ranksFromPolicies();
  const headings = ['When to use', 'What will tell us the work is right', 'Phases', 'Seats', "Owner's touch points", 'Size and cost'];
  for (const page of ['recon', 'build-and-check', 'decide', 'spec-first', 'many-hands', 'root-cause']) {
    const secs = sections(read(`skills/team-plans/${page}.md`));
    assert.deepEqual(secs.map(s => s.title), headings, page);
    const seats = secs.find(s => s.title === 'Seats').body.split('\n').filter(l => l.startsWith('- '));
    assert.ok(seats.length > 0, `${page}: has seats`);
    for (const line of seats) {
      const m = /^- .+ \(flight:[a-z]+\): (\w+), /.exec(line);
      assert.ok(m, `${page}: seat line format: ${line}`);
      assert.ok(ranks.includes(m[1]), `${page}: ${m[1]} is a rank`);
    }
  }
});
