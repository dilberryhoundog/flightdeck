// Tests for flightdeck/skills/workshop/scaffold.mjs. Run: node --test 'flightdeck/skills/workshop/tests/*.test.mjs'
// Every test works in its own temporary root (and temporary git repository where git is needed).
// The last test reads the skill files of the other build units and passes once all units are merged.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseManifest, parseQuestions, parseVerify, listWorkshops, scopeBlock } from '../../../lib/workshops.mjs';
import { slugName, insertLine, checkBundle } from '../scaffold.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(HERE, '..', 'scaffold.mjs');
const FIX = path.join(HERE, 'fixtures');
const REPO = path.resolve(HERE, '..', '..', '..', '..');
const NAME = 'card-oldest-question';
const DATE = '2026-10-11';
const GITENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test Author', GIT_AUTHOR_EMAIL: 'author@example.invalid',
  GIT_COMMITTER_NAME: 'Test Author', GIT_COMMITTER_EMAIL: 'author@example.invalid',
  GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_NOSYSTEM: '1',
};

const read = (...p) => fs.readFileSync(path.join(...p), 'utf8');
const sha = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

function mkroot({ manifest = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-ws-'));
  if (manifest) {
    fs.mkdirSync(path.join(root, '.flightdeck'));
    fs.copyFileSync(path.join(FIX, 'workshops.md'), path.join(root, '.flightdeck', 'workshops.md'));
  }
  return root;
}

function run(root, args, { input, date = true } = {}) {
  const full = [SCRIPT, ...args, '--root', root, ...(date ? ['--date', DATE] : [])];
  const r = spawnSync(process.execPath, full, { input, encoding: 'utf8', env: GITENV, cwd: root });
  return { status: r.status, out: r.stdout, err: r.stderr };
}

function git(cwd, args) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env: GITENV });
  assert.equal(r.status, 0, `git ${args.join(' ')} failed: ${r.stderr}`);
  return r.stdout;
}

function gitState(cwd) {
  return JSON.stringify([git(cwd, ['for-each-ref']), git(cwd, ['status', '--porcelain', '--', '.', ':!.flightdeck']), git(cwd, ['rev-parse', 'HEAD']), git(cwd, ['diff', '--cached', '--name-only'])]);
}

const fd = (root, ...p) => path.join(root, '.flightdeck', ...p);
const SPEC = {
  title: 'Pre-flight card shows the oldest waiting question',
  work: 'Make the pre-flight card name the oldest waiting question.',
  done: 'The card shows the oldest waiting question text and age on one line.',
  context: ['The card is built in flightdeck/hooks/preflight.mjs:1', 'Open questions are counted by parseQuestions (flightdeck/lib/workshops.mjs:71)'],
  checks: [{ command: "node --test 'flightdeck/tests/*.test.mjs'", passing: 'exits 0' }],
  questions: ["Does the card show the oldest waiting question's text and age on one line?"],
};

function activateWith(root, spec = SPEC, extra = []) {
  fs.writeFileSync(fd(root, `${NAME}.spec.json`), JSON.stringify(spec));
  return run(root, ['activate', NAME, '--spec', `.flightdeck/${NAME}.spec.json`, ...extra]);
}

test('capture adds exactly one line in the manifest format and no folder', () => {
  const root = mkroot();
  const before = read(fd(root, 'workshops.md'));
  const r = run(root, ['capture', 'new-thing', 'a', 'new', 'thing', 'to', 'do']);
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), '- new-thing: a new thing to do (2026-10-11)');
  const after = read(fd(root, 'workshops.md'));
  assert.equal(after, `${before}- new-thing: a new thing to do (2026-10-11)\n`);
  assert.ok(after.startsWith(before), 'every earlier line is byte-identical');
  assert.deepEqual(fs.readdirSync(fd(root)), ['workshops.md']);
  const back = parseManifest(after).entries.find((e) => e.name === 'new-thing');
  assert.deepEqual(back, { name: 'new-thing', ask: 'a new thing to do', date: DATE });
  const j = JSON.parse(run(root, ['capture', 'second-one', 'plain words', '--json']).out);
  assert.deepEqual(j, { name: 'second-one', ask: 'plain words', date: DATE, line: '- second-one: plain words (2026-10-11)' });
});

test('capture keeps colons, bars and brackets exactly, and --ask - reads standard input', () => {
  const root = mkroot();
  const fixture = parseManifest(read(FIX, 'workshops.md')).entries.find((e) => e.name === 'colon-ask');
  assert.equal(fixture.ask, 'fix the card: it says "x | y" [sometimes] (and more)');
  const ask = 'fix the card: it says "x | y" [sometimes] (and more)';
  assert.equal(run(root, ['capture', 'odd-one', ask]).status, 0);
  const odd = parseManifest(read(fd(root, 'workshops.md'))).entries.find((e) => e.name === 'odd-one');
  assert.equal(odd.ask, ask);
  const r = run(root, ['capture', 'from-stdin', '--ask', '-'], { input: '  line one\n   line two\r\n\n\tthree  \n' });
  assert.equal(r.status, 0, r.err);
  const got = parseManifest(read(fd(root, 'workshops.md'))).entries.find((e) => e.name === 'from-stdin');
  assert.equal(got.ask, 'line one line two three');
  assert.equal(read(fd(root, 'workshops.md')).split('\n').filter((l) => l.startsWith('- from-stdin')).length, 1);
});

test('capture refuses a listed name, a name with a folder, a bad name and an empty ask, changing nothing', () => {
  const root = mkroot();
  fs.mkdirSync(fd(root, 'has-folder'));
  fs.writeFileSync(fd(root, 'waiting.activate.md'), 'x\n');
  const file = fd(root, 'workshops.md');
  const before = sha(file);
  const cases = [
    [['capture', 'alpha', 'again'], 1],
    [['capture', 'has-folder', 'some ask'], 1],
    [['capture', 'waiting', 'some ask'], 1],
    [['capture', 'Bad Name', 'some ask'], 1],
    [['capture', '-leading', 'some ask'], 1],
    [['capture', 'a'.repeat(49), 'some ask'], 1],
    [['capture', 'fine-name'], 2],
    [['capture', 'fine-name', '   '], 2],
    [['capture', 'fine-name', '--ask', '-'], 2],
  ];
  for (const [args, code] of cases) {
    const r = run(root, args, { input: '  \n' });
    assert.equal(r.status, code, `${args.join(' ')}: ${r.err}`);
    if (code === 1) assert.match(r.err, /^refused: /);
    assert.equal(sha(file), before, `${args.join(' ')} changed the manifest`);
  }
  assert.deepEqual(fs.readdirSync(fd(root)).sort(), ['has-folder', 'waiting.activate.md', 'workshops.md']);
});

test('capture into a root with no .flightdeck folder creates the manifest with its header', () => {
  const root = mkroot({ manifest: false });
  const r = run(root, ['capture', 'first-one', 'the very first ask']);
  assert.equal(r.status, 0, r.err);
  const header = read(FIX, 'workshops.md').split('\n').slice(0, 3).join('\n');
  assert.equal(read(fd(root, 'workshops.md')), `${header}\n\n- first-one: the very first ask (2026-10-11)\n`);
  assert.deepEqual(fs.readdirSync(fd(root)), ['workshops.md']);
});

test('name makes a short slug and keeps it unique', () => {
  const root = mkroot();
  const r = run(root, ['name', 'the pre-flight card lists the oldest waiting question first']);
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), 'pre-flight-card-lists-oldest');
  assert.equal(run(root, ['name', 'alpha']).out.trim(), 'alpha-2');
  fs.mkdirSync(fd(root, 'alpha-2'));
  assert.equal(run(root, ['name', 'alpha']).out.trim(), 'alpha-3');
  assert.equal(run(root, ['name', 'the of and']).out.trim(), 'workshop');
  assert.equal(slugName('Make the Board work offline, please!'), 'board-work-offline');
  const long = slugName('extraordinarily-long-compound-word another-extraordinarily-long-compound-word');
  assert.ok(long.length <= 40 && /^[a-z0-9-]+$/.test(long), long);
});

test('check-bundle passes the fixture and names the failing case for a bad bundle', () => {
  const root = mkroot();
  const good = path.join(FIX, 'bundle.activate.md');
  const r = run(root, ['check-bundle', good]);
  assert.equal(r.status, 0, r.out);
  assert.equal(r.out.trim().split('\n').at(-1), '5/5 passed');
  assert.ok(r.out.split('\n').every((l) => !l.startsWith('FAIL')));
  const text = read(good);
  const bad = (name, body, expectCase) => {
    const f = path.join(root, `${name}.md`);
    fs.writeFileSync(f, body);
    const x = run(root, ['check-bundle', f]);
    assert.equal(x.status, 1, `${name}: ${x.out}`);
    assert.match(x.out, new RegExp(`^FAIL ${expectCase}`, 'm'), `${name}: ${x.out}`);
    assert.match(x.out.trim().split('\n').at(-1), /^\d\/5 passed$/);
  };
  const block = (n) => `## q${n}: Another thing to decide number ${n}?\nwhy: it matters.\noptions: a) one; b) two\nrecommended: a) one, because it is simpler\nasked: 2026-10-11 by the workshop interview\nanswer:\n\n`;
  const six = text.replace('## What the scouts found', `${block(4)}${block(5)}${block(6)}## What the scouts found`);
  bad('six', six, 'count');
  bad('no-weakest', text.replace('The weakest part of this ask is', 'A hard part of this ask is'), 'weakest-part');
  bad('approval', text.replace('Should questions held to ask later count as waiting?', 'Does this draft card look right?'), 'no-approval');
  bad('no-why', text.replace(/^why: a held question.*\n/m, ''), 'fields');
  bad('gap', text.replace('## q2:', '## q4:'), 'numbering');
  assert.equal(run(root, ['check-bundle', path.join(root, 'missing.md')]).status, 2);
  assert.equal(checkBundle(text).every((c) => c.ok), true);
});

test('a pending activation file leaves the workshop captured', () => {
  const root = mkroot();
  fs.copyFileSync(path.join(FIX, 'bundle.activate.md'), fd(root, `${NAME}.activate.md`));
  const w = listWorkshops(root).workshops.find((x) => x.name === NAME);
  assert.equal(w.state, 'captured');
  assert.equal(w.pendingActivation, true);
  assert.equal(fs.existsSync(fd(root, NAME)), false);
  const other = listWorkshops(root).workshops.find((x) => x.name === 'alpha');
  assert.equal(other.pendingActivation, false);
});

test('answer fills the answers from a reply, adds the notes line and removes the hand-off file', () => {
  const root = mkroot();
  const file = fd(root, `${NAME}.activate.md`);
  fs.copyFileSync(path.join(FIX, 'bundle.activate.md'), file);
  const reply = path.join(FIX, 'bundle-answer.txt');
  const r = run(root, ['answer', NAME, '--from', reply]);
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), 'answered 2, open 1');
  assert.ok(fs.existsSync(reply), 'a file that is not the hand-off path is kept');
  const lines = read(file).split('\n');
  const q = (n) => lines.slice(lines.findIndex((l) => l.startsWith(`## q${n}:`)));
  assert.equal(q(1).find((l) => l.startsWith('answer:')), 'answer: c | note: one line is enough');
  assert.equal(q(2).find((l) => l.startsWith('answer:')), 'answer:');
  assert.equal(q(3).find((l) => l.startsWith('answer:')), 'answer: a');
  const at = lines.indexOf('Other notes (2026-10-11): keep the card short');
  assert.ok(at > 0 && lines[at + 1] === '' && lines[at + 2].startsWith('## q1:'), 'notes sit directly above the first question');
  assert.equal(parseQuestions(read(file)).open, 1);
  // the same reply again replaces the notes line instead of adding a second one
  assert.equal(run(root, ['answer', NAME, '--from', reply]).status, 0);
  assert.equal(read(file).split('\n').filter((l) => l.startsWith('Other notes (')).length, 1);
  // a reply for another workshop is refused and the file stays as it was
  const other = fs.readFileSync(reply, 'utf8').replace(`workshop ${NAME}:`, 'workshop alpha:');
  const before = sha(file);
  const x = run(root, ['answer', NAME, '--from', '-'], { input: other });
  assert.equal(x.status, 1);
  assert.match(x.err, /^refused: /);
  assert.equal(sha(file), before);
  // the exact hand-off path is deleted after success
  const hand = fd(root, `${NAME}.answers.txt`);
  fs.copyFileSync(reply, hand);
  const y = run(root, ['answer', NAME, '--from', `.flightdeck/${NAME}.answers.txt`]);
  assert.equal(y.status, 0, y.err);
  assert.equal(fs.existsSync(hand), false);
  // no pending file: refused
  fs.rmSync(file);
  assert.equal(run(root, ['answer', NAME, '--from', reply]).status, 1);
});

test('activate without a questions file writes exactly the card, context and verify files', () => {
  const root = mkroot();
  const r = activateWith(root);
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(fs.readdirSync(fd(root, NAME)).sort(), ['context.md', 'verify.md', 'workshop.md']);
  assert.equal(fs.existsSync(fd(root, `${NAME}.spec.json`)), false, 'the spec hand-off file is deleted');
  assert.deepEqual(r.out.trim().split('\n'), [`.flightdeck/${NAME}/workshop.md`, `.flightdeck/${NAME}/context.md`, `.flightdeck/${NAME}/verify.md`]);
  const w = listWorkshops(root).workshops.find((x) => x.name === NAME);
  assert.equal(w.state, 'active');
  const card = read(fd(root, NAME, 'workshop.md'));
  assert.ok(card.startsWith(`# ${SPEC.title}\n`));
  assert.ok(card.includes(`\nwork: ${SPEC.work}\n`) && card.includes(`\ndone: ${SPEC.done}\n`));
  assert.ok(card.includes('<!-- Only the owner settles a workshop.'), 'the template comment is kept');
  assert.equal(listWorkshops(root).workshops.find((x) => x.name === NAME).settled, null);
  const v = parseVerify(read(fd(root, NAME, 'verify.md')));
  assert.deepEqual(v.checks, ["node --test 'flightdeck/tests/*.test.mjs'"]);
  assert.deepEqual(v.questions, SPEC.questions);
  assert.ok(read(fd(root, NAME, 'verify.md')).includes("- `node --test 'flightdeck/tests/*.test.mjs'`: exits 0"));
  const ctx = read(fd(root, NAME, 'context.md'));
  assert.ok(ctx.startsWith(`# Context for workshop ${NAME}\n`));
  assert.ok(ctx.endsWith(`${SPEC.context[0]}\n\n${SPEC.context[1]}\n`));
  const scope = scopeBlock(root, NAME);
  assert.ok(scope.block.includes(SPEC.context[0]), 'the scoped block holds the context lines');
  assert.deepEqual(scope.checks, v.checks);
  assert.equal(fs.existsSync(fd(root, `.${NAME}.activating`)), false);
});

test('activate with the answered bundle writes questions.md and removes the hand-off files', () => {
  const root = mkroot();
  const bundle = fd(root, `${NAME}.activate.md`);
  fs.copyFileSync(path.join(FIX, 'bundle.activate.md'), bundle);
  assert.equal(run(root, ['answer', NAME, '--from', path.join(FIX, 'bundle-answer.txt')]).status, 0);
  const r = activateWith(root, SPEC, ['--questions-from', `.flightdeck/${NAME}.activate.md`]);
  assert.equal(r.status, 0, r.err);
  assert.deepEqual(fs.readdirSync(fd(root, NAME)).sort(), ['context.md', 'questions.md', 'verify.md', 'workshop.md']);
  assert.equal(fs.existsSync(bundle), false, 'the activation file is deleted');
  assert.equal(fs.existsSync(fd(root, `${NAME}.spec.json`)), false);
  const q = read(fd(root, NAME, 'questions.md'));
  assert.ok(q.startsWith(`# Questions for workshop ${NAME}\n`));
  assert.ok(q.includes('\nOther notes (2026-10-11): keep the card short\n'));
  for (const text of ['## q1: What should the card show', '## q2: Should questions held', '## q3: The weakest part of this ask']) assert.ok(q.includes(text), text);
  assert.ok(q.includes('answer: c | note: one line is enough') && q.includes('answer: a\n'));
  assert.ok(!q.includes('What the scouts found') && !q.includes('Draft card'));
  const parsed = parseQuestions(q);
  assert.equal(parsed.questions.length, 3);
  assert.equal(parsed.open, 1);
  assert.equal(listWorkshops(root).workshops.find((x) => x.name === NAME).openQuestions, 1);
  assert.equal(fs.existsSync(fd(root, NAME, 'constraints.md')), false);
  assert.equal(fs.existsSync(fd(root, NAME, 'decisions.md')), false);
  assert.equal(fs.existsSync(fd(root, NAME, 'attempts')), false);
  // the JSON form lists the files
  const root2 = mkroot();
  const j = JSON.parse(activateWith(root2, SPEC, ['--json']).out);
  assert.equal(j.name, NAME);
  assert.deepEqual(j.files.map((f) => path.basename(f)).sort(), ['context.md', 'verify.md', 'workshop.md']);
});

test('activate is refused for an unlisted name and an existing folder; a bad spec leaves no folder', () => {
  const root = mkroot();
  fs.writeFileSync(fd(root, 'ghost.spec.json'), JSON.stringify(SPEC));
  const a = run(root, ['activate', 'ghost', '--spec', '.flightdeck/ghost.spec.json']);
  assert.equal(a.status, 1);
  assert.match(a.err, /^refused: .*capture it first/);
  assert.equal(fs.existsSync(fd(root, 'ghost')), false);
  assert.equal(fs.existsSync(fd(root, 'ghost.spec.json')), true, 'a refused run keeps the spec file');
  fs.mkdirSync(fd(root, 'alpha'));
  fs.writeFileSync(fd(root, 'alpha', 'marker.txt'), 'keep');
  const b = run(root, ['activate', 'alpha', '--spec', '.flightdeck/ghost.spec.json']);
  assert.equal(b.status, 1);
  assert.match(b.err, /already active/);
  assert.deepEqual(fs.readdirSync(fd(root, 'alpha')), ['marker.txt']);
  fs.writeFileSync(fd(root, 'settled-one.spec.json'), '{}');
  fs.mkdirSync(fd(root, 'settled-one'));
  fs.writeFileSync(fd(root, 'settled-one', 'workshop.md'), '# x\n\nsettled: 2026-10-10\n');
  const c = run(root, ['activate', 'settled-one', '--spec', '.flightdeck/settled-one.spec.json']);
  assert.equal(c.status, 1);
  assert.match(c.err, /settled/);
  const before = fs.readdirSync(fd(root)).sort();
  fs.writeFileSync(fd(root, `${NAME}.spec.json`), 'this is not json');
  const d = run(root, ['activate', NAME, '--spec', `.flightdeck/${NAME}.spec.json`]);
  assert.equal(d.status, 2);
  assert.match(d.err, /^error: /);
  fs.rmSync(fd(root, `${NAME}.spec.json`));
  assert.deepEqual(fs.readdirSync(fd(root)).sort(), before.filter((x) => x !== `${NAME}.spec.json`));
  for (const bad of [{ ...SPEC, work: '' }, { ...SPEC, done: 7 }, { ...SPEC, checks: [{ command: 'echo `x`', passing: 'ok' }] }, { ...SPEC, context: 'one line' }]) {
    assert.equal(activateWith(root, bad).status, 2, JSON.stringify(bad).slice(0, 60));
    assert.equal(fs.existsSync(fd(root, NAME)), false);
    assert.equal(fs.existsSync(fd(root, `.${NAME}.activating`)), false);
  }
});

test('retry opens the next attempt, names the change on line 3, attaches findings and leaves earlier files alone', () => {
  const root = mkroot();
  const a1 = fd(root, 'alpha', 'attempts', 'a1');
  fs.mkdirSync(a1, { recursive: true });
  fs.writeFileSync(path.join(a1, 'brief.md'), '# Attempt a1 of workshop alpha\n\nThe change: first run\n\n## Carried over\n\nsetup\n');
  fs.writeFileSync(path.join(a1, 'findings.md'), '# Findings\n\n- review, low: the card wraps on narrow terminals.\n');
  fs.writeFileSync(path.join(a1, 'report.md'), 'a report\n');
  fs.writeFileSync(fd(root, 'alpha', 'workshop.md'), '# Alpha\n\nwork: x\ndone: y\n');
  const files = ['brief.md', 'findings.md', 'report.md'].map((f) => path.join(a1, f));
  const before = files.map(sha);
  const r = run(root, ['retry', 'alpha', '--change', 'Oldest means the earliest asked: date.']);
  assert.equal(r.status, 0, r.err);
  assert.equal(r.out.trim(), '.flightdeck/alpha/attempts/a2');
  const brief = read(fd(root, 'alpha', 'attempts', 'a2', 'brief.md')).split('\n');
  assert.equal(brief[0], '# Attempt a2 of workshop alpha');
  assert.equal(brief[1], '');
  assert.equal(brief[2], 'The change: Oldest means the earliest asked: date.');
  assert.ok(brief.includes('Opened 2026-10-11 by /flight:retry. Branch for this attempt: alpha-a2.'));
  assert.ok(brief.includes('Previous attempt: attempts/a1/'));
  assert.ok(brief.includes('## Findings from a1'));
  assert.ok(brief.includes('- review, low: the card wraps on narrow terminals.'));
  assert.ok(brief.includes('## Attempt a1 of workshop alpha'), 'the previous brief is included with its headings one level down');
  assert.ok(brief.includes('### Carried over'));
  assert.deepEqual(files.map(sha), before, 'every a1 file is unchanged');
  const j = JSON.parse(run(root, ['retry', 'alpha', '--change', 'one', '--change', 'two', '--json']).out);
  assert.deepEqual(j, { name: 'alpha', group: '', attempt: 'a3', path: '.flightdeck/alpha/attempts/a3', branch: 'alpha-a3' });
  const three = read(fd(root, 'alpha', 'attempts', 'a3', 'brief.md')).split('\n');
  assert.deepEqual(three.slice(2, 4), ['The change: one', 'The change: two']);
  assert.ok(three.includes('## Findings from a2') && three.includes('none written'));
  assert.deepEqual(files.map(sha), before);
  // gaps: a1 and a3 make a4
  const gap = path.join(root, '.flightdeck', 'colon-ask', 'attempts');
  fs.mkdirSync(path.join(gap, 'a1'), { recursive: true });
  fs.mkdirSync(path.join(gap, 'a3'));
  fs.writeFileSync(fd(root, 'colon-ask', 'workshop.md'), '# C\n');
  assert.equal(run(root, ['retry', 'colon-ask', '--change', 'x']).out.trim(), '.flightdeck/colon-ask/attempts/a4');
});

test('retry handles a first attempt, attempt groups, a missing folder and a missing change', () => {
  const root = mkroot();
  fs.mkdirSync(fd(root, 'alpha'));
  const r = run(root, ['retry', 'alpha', '--change', 'start here']);
  assert.equal(r.status, 0, r.err);
  const brief = read(fd(root, 'alpha', 'attempts', 'a1', 'brief.md'));
  assert.ok(brief.includes('Previous attempt: none; this is the first attempt.'));
  assert.ok(brief.includes('## Previous brief\n\nnone\n') && brief.includes('## Findings from the previous attempt\n\nnone written'));
  assert.equal(brief.split('\n')[2], 'The change: start here');
  // two groups and no flat attempt: refused, both listed
  fs.mkdirSync(fd(root, 'colon-ask', 'attempts', 'pr-1', 'a2'), { recursive: true });
  fs.mkdirSync(fd(root, 'colon-ask', 'attempts', 'plan', 'a1'), { recursive: true });
  const before = fs.readdirSync(fd(root, 'colon-ask', 'attempts', 'pr-1'));
  const x = run(root, ['retry', 'colon-ask', '--change', 'x']);
  assert.equal(x.status, 1);
  assert.match(x.err, /^refused: .*pr-1.*plan|^refused: .*plan.*pr-1/);
  assert.deepEqual(fs.readdirSync(fd(root, 'colon-ask', 'attempts', 'pr-1')), before);
  const g = JSON.parse(run(root, ['retry', 'colon-ask', '--group', 'pr-1', '--change', 'x', '--json']).out);
  assert.equal(g.attempt, 'a3');
  assert.equal(g.branch, 'colon-ask-pr-1-a3');
  assert.ok(fs.existsSync(fd(root, 'colon-ask', 'attempts', 'pr-1', 'a3', 'brief.md')));
  assert.equal(fs.existsSync(fd(root, 'colon-ask', 'attempts', 'plan', 'a2')), false);
  // exactly one group is used without naming it
  fs.mkdirSync(fd(root, 'settled-one', 'attempts', 'pr-9', 'a1'), { recursive: true });
  assert.equal(run(root, ['retry', 'settled-one', '--change', 'x']).out.trim(), '.flightdeck/settled-one/attempts/pr-9/a2');
  assert.equal(run(root, ['retry', 'alpha']).status, 2);
  assert.equal(run(root, ['retry', 'alpha', '--change', '   ']).status, 2);
  assert.equal(run(root, ['retry', 'alpha', '--group', '../x', '--change', 'x']).status, 2);
  const none = run(root, ['retry', 'card-oldest-question', '--change', 'x']);
  assert.equal(none.status, 1);
  assert.match(none.err, /not active/);
  assert.equal(fs.existsSync(fd(root, NAME)), false);
});

test('propose refuses an unsettled workshop and lists candidates from a settled one', () => {
  const root = mkroot();
  activateWith(root);
  const no = run(root, ['propose', NAME]);
  assert.equal(no.status, 1);
  assert.match(no.err, /^refused: .*settle/);
  assert.equal(run(root, ['propose', 'alpha']).status, 1);
  const dir = fd(root, NAME);
  fs.appendFileSync(path.join(dir, 'workshop.md'), 'settled: 2026-10-11\n');
  fs.writeFileSync(path.join(dir, 'decisions.md'), '# Decisions for workshop x\n\n<!-- Format of one decision: - <YYYY-MM-DD>: <decision>. Reason: <one line>. -->\n\n- 2026-10-10: Pages never load anything from the network. Reason: they must work offline.\n- 2026-10-11: Oldest means earliest asked. Reason: every question has that date.\n');
  const r = run(root, ['propose', NAME, '--json']);
  assert.equal(r.status, 0, r.err);
  const p = JSON.parse(r.out);
  assert.equal(p.name, NAME);
  assert.equal(p.settled, '2026-10-11');
  assert.equal(p.flightdeckRepo, false);
  assert.equal(p.branch, `${NAME}-promote-a1`);
  const kinds = p.candidates.map((c) => c.kind);
  assert.deepEqual(kinds, ['decision', 'decision', 'context', 'context', 'check', 'question']);
  for (const c of p.candidates) assert.ok(c.target && c.line && c.source && (c.kind === 'context' ? c.heading === '' : c.heading), JSON.stringify(c));
  assert.equal(p.candidates[0].line, '- 2026-10-10: Pages never load anything from the network. Reason: they must work offline.');
  assert.equal(p.candidates[0].target, 'CLAUDE.md');
  assert.equal(p.candidates[0].heading, '## Decisions');
  assert.equal(p.candidates[2].line, SPEC.context[0]);
  assert.equal(p.candidates[4].line, "- `node --test 'flightdeck/tests/*.test.mjs'`");
  assert.equal(p.candidates[5].heading, '## Checks', 'outside FlightDeck own repository questions go to CLAUDE.md');
  for (const c of p.candidates) {
    assert.ok(!/Format of one|<YYYY-MM-DD>|<name>|<one line/.test(c.line), `template text became a candidate: ${c.line}`);
    assert.ok(!c.line.startsWith('#'));
  }
  // inside FlightDeck's own repository a question goes to the rubric
  fs.mkdirSync(path.join(root, 'flightdeck', '.claude-plugin'), { recursive: true });
  fs.writeFileSync(path.join(root, 'flightdeck', '.claude-plugin', 'plugin.json'), '{}\n');
  const own = JSON.parse(run(root, ['propose', NAME, '--json']).out);
  assert.equal(own.flightdeckRepo, true);
  assert.equal(own.candidates.at(-1).target, 'flightdeck/rubric.md');
  assert.equal(own.candidates.at(-1).heading, '## Owner fit');
  const text = run(root, ['propose', NAME]).out.split('\n');
  assert.equal(text[0], `workshop ${NAME} (settled 2026-10-11)`);
  assert.equal(text[1], `branch: ${NAME}-promote-a1`);
  assert.ok(text.some((l) => l.startsWith('- [decisions.md] - 2026-10-10:') && l.endsWith('-> CLAUDE.md (## Decisions)')));
});

test('promote-commit dry run changes nothing; a real run builds one commit on a new branch with git plumbing', () => {
  const root = mkroot({ manifest: false });
  git(root, ['init', '-b', 'main']);
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), '# Project\n\n## Decisions\n\n- 2026-01-01: an old decision. Reason: x.\n\n## Other\n\nplain text\n');
  fs.mkdirSync(path.join(root, 'flightdeck'));
  fs.writeFileSync(path.join(root, 'flightdeck', 'rubric.md'), '# Rubric\n\n## Owner fit\n\n- Is it plain?\n');
  fs.mkdirSync(path.join(root, 'locked'));
  fs.writeFileSync(path.join(root, 'locked', 'rules.md'), '---\nread: "agents"\nwrite: "human"\n---\n\n## Rules\n');
  git(root, ['add', '-A']);
  git(root, ['commit', '-m', 'start']);
  const decision = '- 2026-10-11: Pages work offline. Reason: no network.';
  const edits = [
    { target: 'CLAUDE.md', heading: '## Decisions', line: decision },
    { target: 'CLAUDE.md', heading: '## Checks', line: '- `node --test x`' },
    { target: 'flightdeck/rubric.md', heading: '## Owner fit', line: '- Does the card stay short?' },
  ];
  const editsFile = fd(root, `${NAME}.promote.json`);
  fs.mkdirSync(fd(root), { recursive: true });
  fs.writeFileSync(editsFile, JSON.stringify(edits));
  const e = `.flightdeck/${NAME}.promote.json`;
  const state0 = gitState(root);
  const claude0 = read(root, 'CLAUDE.md');

  const dry = run(root, ['promote-commit', NAME, '--edits', e, '--dry-run', '--keep']);
  assert.equal(dry.status, 0, dry.err);
  assert.ok(dry.out.includes('--- CLAUDE.md') && dry.out.includes('--- flightdeck/rubric.md'));
  assert.ok(dry.out.split('\n').includes(`+ ${decision} (from workshop ${NAME})`));
  assert.ok(dry.out.split('\n').includes(`+ - Does the card stay short? (from workshop ${NAME})`));
  assert.ok(dry.out.includes('under ## Decisions'));
  assert.equal(gitState(root), state0, 'a dry run creates no ref and changes nothing');
  assert.ok(fs.existsSync(editsFile), '--keep leaves the edits file');
  assert.equal(run(root, ['promote-commit', NAME, '--edits', e, '--dry-run']).status, 0);
  assert.equal(fs.existsSync(editsFile), false, 'without --keep the edits file is removed');
  fs.writeFileSync(editsFile, JSON.stringify(edits));

  const branch = `${NAME}-promote-a1`;
  const real = run(root, ['promote-commit', NAME, '--edits', e, '--branch', branch]);
  assert.equal(real.status, 0, real.err);
  assert.match(real.out.trim(), new RegExp(`^branch ${branch} commit [0-9a-f]{40} files 2$`));
  assert.deepEqual(git(root, ['diff', '--name-only', 'main', branch]).trim().split('\n'), ['CLAUDE.md', 'flightdeck/rubric.md']);
  const after = git(root, ['show', `${branch}:CLAUDE.md`]).split('\n');
  const at = after.indexOf(`${decision} (from workshop ${NAME})`);
  assert.ok(at > after.indexOf('## Decisions') && at < after.indexOf('## Other'), 'the line sits under its heading');
  assert.equal(after[at - 1], '- 2026-01-01: an old decision. Reason: x.', 'right after the last line of the section');
  assert.ok(after.includes('## Checks') && after.includes(`- \`node --test x\` (from workshop ${NAME})`), 'a missing heading is added with the line');
  assert.equal(git(root, ['rev-parse', `${branch}~1`]).trim(), git(root, ['rev-parse', 'main']).trim());
  assert.equal(git(root, ['log', '-1', '--format=%s', branch]).trim(), `Promote from workshop ${NAME}`);
  assert.equal(git(root, ['rev-parse', 'HEAD']).trim(), JSON.parse(state0)[2].trim(), 'HEAD did not move');
  assert.equal(git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(), 'main');
  assert.equal(git(root, ['diff', '--cached', '--name-only']).trim(), '', 'the index is untouched');
  assert.equal(read(root, 'CLAUDE.md'), claude0, 'the working tree is untouched');
  assert.equal(fs.existsSync(editsFile), false);
  assert.equal(git(root, ['status', '--porcelain']).includes('CLAUDE.md'), false);
  assert.deepEqual(fs.readdirSync(os.tmpdir()).filter((f) => f.startsWith('fd-index-') && fs.existsSync(path.join(os.tmpdir(), f, 'index'))), [], 'no temporary index is left');

  // refusals leave the repository as it is
  const state1 = gitState(root);
  const refuse = (extra, edit = edits) => {
    fs.writeFileSync(editsFile, JSON.stringify(edit));
    const r = run(root, ['promote-commit', NAME, '--edits', e, ...extra]);
    assert.equal(r.status, 1, `${extra.join(' ')} ${JSON.stringify(edit).slice(0, 80)}: ${r.err}`);
    assert.match(r.err, /^refused: /m);
    assert.equal(gitState(root), state1);
  };
  refuse(['--branch', branch]);
  refuse(['--branch', 'main']);
  refuse(['--branch', 'other-name']);
  refuse([]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: '../x', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: '/etc/x', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: '.flightdeck/x/constraints.md', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: '.claude/rules/x.md', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: 'dev/x.md', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: '.flightdeck/VISION.md', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: 'locked/rules.md', heading: '## Rules', line: 'nope' }]);
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: 'CLAUDE.md', line: 'two\nlines' }]);
  // a line that is already there is skipped; nothing left to add is refused
  refuse(['--branch', `${NAME}-promote-a2`], [{ target: 'CLAUDE.md', heading: '## Decisions', line: '- 2026-01-01: an old decision. Reason: x.' }]);
  fs.writeFileSync(editsFile, '{"not":"a list"}');
  assert.equal(run(root, ['promote-commit', NAME, '--edits', e, '--dry-run']).status, 2);

  // the pure insertion helper
  const lines = ['# T', '', '## A', '', '- one', '', '### Sub', '', 'sub text', '', '## B', ''];
  assert.equal(insertLine(lines, '## A', '- two'), true);
  assert.deepEqual(lines.slice(2, 10), ['## A', '', '- one', '', '### Sub', '', 'sub text', '- two']);
  assert.ok(lines.indexOf('- two') > lines.indexOf('sub text'), 'a sub-heading belongs to its section');
  assert.equal(insertLine(lines, '## A', '- two'), false);
  const empty = [];
  insertLine(empty, '## New', '- first');
  assert.deepEqual(empty, ['## New', '', '- first']);
});

test('promote-commit dry run refuses targets that are not plain markdown notes, and a real run adds a missing heading to CLAUDE.md', () => {
  const root = mkroot({ manifest: false });
  git(root, ['init', '-b', 'main']);
  fs.writeFileSync(path.join(root, 'CLAUDE.md'), '# Project\n\n## Other\n\nplain text\n');
  git(root, ['add', 'CLAUDE.md']);
  git(root, ['commit', '-m', 'start']);
  fs.mkdirSync(fd(root), { recursive: true });
  const editsFile = fd(root, `${NAME}.promote.json`);
  const e = `.flightdeck/${NAME}.promote.json`;
  const targets = ['flightdeck/hooks/guard.mjs', '.Claude/rules/x.md', 'INTENT.md', 'library/source/foo.md', 'flightdeck/.claude-plugin/plugin.json', 'DEV/x.md', 'docs/history.md', 'flightdeck/.CLAUDE-PLUGIN/notes.md', '.flightdeck/Build-1/Constraints.md'];
  for (const target of targets) {
    fs.writeFileSync(editsFile, JSON.stringify([{ target, heading: '## Decisions', line: 'nope' }]));
    const r = run(root, ['promote-commit', NAME, '--edits', e, '--dry-run']);
    assert.equal(r.status, 1, `${target}: ${r.out} ${r.err}`);
    assert.match(r.err, /^refused: /m, target);
    assert.equal(r.out, '', `${target} printed a preview`);
  }
  const line = '- 2026-10-11: Pages work offline. Reason: no network.';
  fs.writeFileSync(editsFile, JSON.stringify([{ target: 'CLAUDE.md', heading: '## Decisions', line }]));
  const ok = run(root, ['promote-commit', NAME, '--edits', e, '--dry-run', '--keep']);
  assert.equal(ok.status, 0, ok.err);
  assert.ok(ok.out.includes('--- CLAUDE.md') && ok.out.includes('under ## Decisions'));
  const branch = `${NAME}-promote-a1`;
  assert.equal(run(root, ['promote-commit', NAME, '--edits', e, '--branch', branch]).status, 0);
  const after = git(root, ['show', `${branch}:CLAUDE.md`]).split('\n');
  assert.ok(after.includes('## Decisions'), 'the Decisions heading is added when it is missing');
  assert.ok(after.indexOf(`${line} (from workshop ${NAME})`) > after.indexOf('## Decisions'));
});

test('activate writes the notes line once when the bundle has an Other notes line after the last question', () => {
  const root = mkroot();
  const bundle = fd(root, `${NAME}.activate.md`);
  fs.copyFileSync(path.join(FIX, 'bundle.activate.md'), bundle);
  assert.equal(run(root, ['answer', NAME, '--from', path.join(FIX, 'bundle-answer.txt')]).status, 0);
  const lines = read(bundle).split('\n');
  const notes = lines.find((l) => l.startsWith('Other notes ('));
  assert.ok(notes, 'the answered bundle has a notes line');
  const moved = lines.filter((l) => l !== notes);
  moved.splice(moved.indexOf('## What the scouts found'), 0, notes, '');
  fs.writeFileSync(bundle, moved.join('\n'));
  const r = activateWith(root, SPEC, ['--questions-from', `.flightdeck/${NAME}.activate.md`]);
  assert.equal(r.status, 0, r.err);
  const q = read(fd(root, NAME, 'questions.md'));
  assert.equal(q.split('\n').filter((l) => l.startsWith('Other notes (')).length, 1);
  assert.ok(q.includes('\n## q3:') && !q.includes('What the scouts found'));
  assert.equal(parseQuestions(q).questions.length, 3);
});

test('every subcommand exits 0, 1 or 2 only and bad input never prints a stack trace', () => {
  const root = mkroot();
  fs.writeFileSync(fd(root, 'junk.json'), 'not json at all');
  fs.writeFileSync(fd(root, 'junk.md'), '## q1\n');
  const cases = [
    [[], 2], [['bogus'], 2], [['--bogus-flag'], 2], [['--help'], 0],
    [['name'], 0], [['capture'], 2], [['capture', 'x'], 2], [['capture', 'x', '--ask'], 2],
    [['check-bundle'], 2], [['check-bundle', path.join(root, 'nope.md')], 2], [['check-bundle', path.join(root, '.flightdeck', 'junk.md')], 1],
    [['answer'], 2], [['answer', 'alpha'], 2], [['answer', 'alpha', '--from', 'nope.txt'], 1],
    [['activate'], 2], [['activate', 'alpha'], 2], [['activate', 'alpha', '--spec', path.join(root, '.flightdeck', 'junk.json')], 2],
    [['activate', 'alpha', '--spec', '-'], 2],
    [['retry'], 2], [['retry', 'alpha'], 2], [['retry', 'alpha', '--change', 'x'], 1],
    [['propose'], 2], [['propose', 'alpha'], 1], [['propose', 'BAD NAME'], 1],
    [['promote-commit'], 2], [['promote-commit', 'alpha'], 2], [['promote-commit', 'alpha', '--edits', path.join(root, '.flightdeck', 'junk.json'), '--dry-run'], 2],
    [['capture', 'x', 'y', '--date', '2026-13-45'], 2],
  ];
  for (const [args, want] of cases) {
    const r = run(root, args, { input: 'not json', date: !args.includes('--date') });
    assert.ok([0, 1, 2].includes(r.status), `${args.join(' ')} exited ${r.status}`);
    assert.equal(r.status, want, `${args.join(' ')}: ${r.err}`);
    assert.ok(!/\n\s+at |node:internal|\bTypeError\b|\bReferenceError\b|SyntaxError/.test(r.err), `${args.join(' ')} printed a stack trace: ${r.err}`);
    if (r.status === 1 && !args[0].startsWith('check-bundle')) assert.match(r.err, /^refused: /);
    if (r.status === 2) assert.match(r.err, /^(usage|error): /);
  }
  assert.equal(fs.existsSync(fd(root, 'x')), false);
});

test('content of the skills, rules copy and owned list (passes once all build units are merged)', () => {
  const skillText = {};
  for (const s of ['capture', 'workshop', 'retry', 'promote']) {
    const file = path.join(REPO, 'flightdeck', 'skills', s, 'SKILL.md');
    assert.ok(fs.existsSync(file), `${file} is missing`);
    skillText[s] = fs.readFileSync(file, 'utf8');
  }
  let total = 0;
  for (const [s, text] of Object.entries(skillText)) {
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
    assert.ok(fm, `${s} has no frontmatter`);
    const get = (k) => {
      const m = new RegExp(`^${k}:[ \\t]*(.*)$`, 'm').exec(fm[1]);
      return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
    };
    assert.equal(get('name'), s);
    assert.equal(get('disable-model-invocation'), 'true', `${s} must be owner-only`);
    const description = get('description');
    assert.ok(description && description.length < 400, `${s} description is ${description?.length} characters`);
    total += description.length;
    assert.ok(text.includes('${CLAUDE_PLUGIN_ROOT}/skills/workshop/scaffold.mjs'), `${s} does not call the script`);
  }
  assert.ok(total < 1600, `the four descriptions total ${total} characters`);
  const rules = fs.readFileSync(path.join(REPO, 'flightdeck', 'skills', 'workshop', 'flightdeck-CLAUDE.md'), 'utf8');
  assert.ok(rules.includes('- <name>: <the ask in the words it was given> (<YYYY-MM-DD>)'));
  assert.ok(rules.includes('Only the owner activates'));
  for (const c of ['/flight:capture', '/flight:workshop', '/flight:retry', '/flight:promote']) assert.ok(rules.includes(c), c);
  assert.ok(fs.readFileSync(path.join(REPO, 'flightdeck', 'skills', 'workshop', 'interview.md'), 'utf8').includes('at most five'));
  const targets = fs.readFileSync(path.join(REPO, 'flightdeck', 'skills', 'promote', 'targets.md'), 'utf8');
  for (const t of ['CLAUDE.md', '.flightdeck/CLAUDE.md', 'flightdeck/rubric.md', 'lab/checks/', 'flightdeck/manuals/']) assert.ok(targets.includes(t), t);
  const owned = fs.readFileSync(path.join(REPO, 'lab', 'owned', 'pr3.txt'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const expected = [
    'flightdeck/skills/workshop/scaffold.mjs', 'flightdeck/skills/workshop/tests/scaffold.test.mjs',
    'flightdeck/skills/workshop/tests/fixtures/workshops.md', 'flightdeck/skills/workshop/tests/fixtures/bundle.activate.md',
    'flightdeck/skills/workshop/tests/fixtures/bundle-answer.txt',
    'flightdeck/skills/capture/SKILL.md', 'flightdeck/skills/workshop/SKILL.md', 'flightdeck/skills/workshop/interview.md',
    'flightdeck/skills/workshop/examples/card.md', 'flightdeck/skills/workshop/flightdeck-CLAUDE.md',
    'lab/evals/pr3-no-approval-questions/prompt.md', 'lab/evals/pr3-no-approval-questions/graders/bundle.md',
    'flightdeck/skills/retry/SKILL.md', 'flightdeck/skills/promote/SKILL.md', 'flightdeck/skills/promote/targets.md', 'lab/owned/pr3.txt',
    '.flightdeck/build-1/attempts/pr-3/a1/brief.md', '.flightdeck/build-1/attempts/pr-3/a1/findings.md',
    '.flightdeck/build-1/attempts/pr-3/a1/report.md', '.flightdeck/build-1/attempts/pr-3/a1/log.md',
  ];
  for (const f of expected) assert.ok(owned.includes(f), `lab/owned/pr3.txt does not list ${f}`);
});
