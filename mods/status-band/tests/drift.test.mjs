// Drift tests for the status band: its own copy of the reading rules (../lib/read.js) must behave exactly like
// PR 1's reader (flightdeck/lib/workshops.mjs). This is the only file in mods/status-band/ that names flightdeck/.
// Run: node --test 'mods/status-band/tests/*.test.mjs'
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as band from '../lib/read.js';
import * as pr1 from '../../../flightdeck/lib/workshops.mjs';

const READ_JS = fileURLToPath(new URL('../lib/read.js', import.meta.url));
const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

// ---------- fixtures and helpers ----------

const tmpDirs = [];
function tmp() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'band-'));
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

// Copied verbatim from flightdeck/tests/core.test.mjs.
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

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

// Folders (not files) under dir, down to ATTEMPT_DEPTH levels, descending into every folder.
// The first call is depth 0 and recurses while depth < 6, as PR 1's walk does.
function walkDirs(dir, rel, depth, out) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of ents) {
    if (!e.isDirectory()) continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    out.push(r);
    if (depth < band.ATTEMPT_DEPTH - 1) walkDirs(path.join(dir, e.name), r, depth + 1, out);
  }
  return out;
}

// Builds summarize's input from a real folder, the way register.js does through $.fs.
function gather(root) {
  const fd = path.join(root, '.flightdeck');
  const manifestText = readText(path.join(fd, 'workshops.md'));
  let names = [];
  try {
    names = fs.readdirSync(fd, { withFileTypes: true }).filter(e => e.isDirectory() && band.NAME_RE.test(e.name)).map(e => e.name);
  } catch { /* none */ }
  const folders = names.map(name => {
    const dir = path.join(fd, name);
    let changedMs = 0;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isFile()) changedMs = Math.max(changedMs, fs.statSync(path.join(dir, e.name)).mtimeMs);
    }
    const attemptDirs = walkDirs(path.join(dir, 'attempts'), '', 0, []);
    const attemptMs = {};
    for (const a of band.latestAttempts(attemptDirs)) {
      attemptMs[a.label] = fs.statSync(path.join(dir, 'attempts', ...a.label.split('/'))).mtimeMs;
    }
    return {
      name,
      cardText: readText(path.join(dir, 'workshop.md')),
      questionsText: readText(path.join(dir, 'questions.md')),
      attemptDirs,
      changedMs,
      attemptMs,
    };
  });
  return { manifestText, folders };
}

// Compares the band's summary of a project with PR 1's list of it.
function compare(root) {
  const pr = pr1.listWorkshops(root);
  const b = band.summarize(gather(root));
  const count = s => pr.workshops.filter(w => w.state === s).length;
  assert.equal(b.active, count('active'));
  assert.equal(b.settled, count('settled'));
  assert.equal(b.captured, pr.captured);
  assert.equal(b.captured, count('captured'));
  const live = pr.workshops.filter(w => w.state !== 'captured');
  assert.equal(b.openQuestions, live.reduce((n, w) => n + w.openQuestions, 0));
  assert.equal(b.heldForLater, live.reduce((n, w) => n + w.heldForLater, 0));
  if (b.latest) {
    const w = pr.workshops.find(x => x.name === b.latest.workshop);
    assert.ok(w && w.state === 'active', `latest workshop ${b.latest.workshop} is active in PR 1`);
    if (b.latest.label !== null) assert.ok(w.attempts.map(a => a.label).includes(b.latest.label), `${b.latest.label} is one of PR 1's labels`);
  } else {
    assert.equal(b.active, 0);
  }
  assert.deepEqual(b.warnings, pr.warnings);
  return { pr, b };
}

// ---------- manifest ----------

test('drift: manifest parsing equals PR 1 on every text PR 1 tests plus edge cases', () => {
  const texts = [
    '# Workshops\n\nA sentence.\n\n- odd-one: fix a|b: the [x] (y) part (2026-10-11)\n- plain: just this (2026-01-02)\n',
    '- no-date: something to do\n- Bad Name: skipped (2026-10-11)\n- no-colon-here (2026-10-11)\n- good: fine (2026-10-11)\n',
    [
      '# Workshops', '', 'A sentence.', '',
      '<!-- - hidden: not counted (2026-01-01) -->',
      '<!--', '- multi: not counted (2026-01-01)', '-->',
      '```', '- fenced: not counted (2026-01-01)', '```',
      '- real: counted (2026-01-01)',
    ].join('\n'),
    '- same: first (2026-01-01)\n- same: second (2026-01-02)\n- other: third (2026-01-03)\n',
    '- one: first (2026-01-01)\r\n- two: second (2026-01-02)\r\n',
    '- one: first (2026-01-01)\r- two: second (2026-01-02)\r',
    '- real: counted (2026-01-01)\n<!-- - hidden: never closed (2026-01-01)\n- also-hidden: x (2026-01-01)\n',
    '~~~\n- fenced: not counted (2026-01-01)\n~~~\n- real: counted (2026-01-01)\n',
    '~~~~\n- fenced: x (2026-01-01)\n~~~\n- still-fenced: x (2026-01-01)\n~~~~\n- real: y (2026-01-01)\n',
    '```\n- fenced: x (2026-01-01)\n~~~\n- still-fenced: x (2026-01-01)\n```\n- real: y (2026-01-01)\n',
    '- trailing: ask   (2026-01-01)   \n-  spaced : ask (2026-01-01)\n- dated-twice: a (2026-01-01) b (2026-02-02)\n',
    '',
    '# Workshops\n\nNo lines here.\n',
  ];
  for (const t of texts) assert.deepEqual(band.parseManifest(t), pr1.parseManifest(t), JSON.stringify(t));
  for (const junk of [undefined, null, 42]) assert.deepEqual(band.parseManifest(junk), pr1.parseManifest(junk));
  for (const t of texts) assert.equal(band.stripNoise(t), pr1.stripNoise(t), JSON.stringify(t));
});

// ---------- questions ----------

test('drift: question parsing equals PR 1 on its fixtures plus edge cases', () => {
  const texts = [
    QUESTIONS,
    '## q1 no colon here\nwhy: x\n## Notes\nsome notes\n## q2: has no answer line\nwhy: y\n',
    '<!--\n## q1: example\nanswer:\n-->\n## q2: real\nanswer:\n',
    '## q1: x\nanswer:    \n',
    '## q1: x\nanswer: b\n',
    '## q1: x\n- answer:\n',
    '## q1: x\n- answer: yes\n',
    '## q1: x\n* Answer:   \n- Ask-Later: next week\n',
    '## q1: x\nanswer:\nanswer: second one is ignored\n',
    '## q1: x\r\nanswer:\r\nask-later: later\r\n',
    '\u0000\u0001 ## ',
    '## q9:',
    '',
  ];
  for (const t of texts) assert.deepEqual(band.parseQuestions(t), pr1.parseQuestions(t), JSON.stringify(t));
  for (const junk of [undefined, null, 42]) assert.deepEqual(band.parseQuestions(junk), pr1.parseQuestions(junk));
});

// ---------- latest attempt ----------

test('drift: latest attempts equal PR 1 for flat, nested and odd folders', () => {
  const r = tmp();
  const dir = path.join(r, '.flightdeck/w');
  for (const d of ['a1', 'a3', 'pr-1/a1', 'pr-1/a2', 'plan/a2', 'g/h/a9', 'a0', 'a1/a2']) mkd(r, `.flightdeck/w/attempts/${d}`);
  put(r, '.flightdeck/w/attempts/notes.md', 'not an attempt');
  const dirs = walkDirs(path.join(dir, 'attempts'), '', 0, []);
  assert.ok(dirs.includes('g/h/a9') && dirs.includes('a1/a2') && !dirs.includes('notes.md'));
  assert.deepEqual(band.latestAttempts(dirs), pr1.latestAttempts(dir));
  assert.deepEqual(band.latestAttempts(dirs).map(a => a.label), ['a3', 'a1/a2', 'g/h/a9', 'plan/a2', 'pr-1/a2']);
});

test('drift: latest attempts equal PR 1 when there is no attempts folder', () => {
  const r = tmp();
  mkd(r, '.flightdeck/w');
  const dir = path.join(r, '.flightdeck/w');
  assert.deepEqual(band.latestAttempts(walkDirs(path.join(dir, 'attempts'), '', 0, [])), []);
  assert.deepEqual(pr1.latestAttempts(dir), []);
  assert.deepEqual(band.latestAttempts([]), []);
  assert.deepEqual(band.latestAttempts(undefined), []);
});

test('drift: the walk reaches the same depth as PR 1', () => {
  const r = tmp();
  const deep = 'd1/d2/d3/d4/d5/d6/a2';
  mkd(r, `.flightdeck/w/attempts/${deep}`);
  mkd(r, '.flightdeck/w/attempts/e1/e2/e3/e4/e5/e6/e7/a5');
  const dir = path.join(r, '.flightdeck/w');
  assert.deepEqual(band.latestAttempts(walkDirs(path.join(dir, 'attempts'), '', 0, [])), pr1.latestAttempts(dir));
});

// ---------- states and counts ----------

test('drift: states and counts equal PR 1 on the card fixture (captured, activation pending, active, settled)', () => {
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
  const { b } = compare(r);
  assert.equal(b.captured, 3);
  assert.equal(b.active, 1);
  assert.equal(b.settled, 1);
  assert.equal(b.latest.workshop, 'live');
  assert.equal(b.latest.label, null);
});

test('drift: states equal PR 1 on the reader fixture (unlisted folder, comment that mentions settled)', () => {
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
  const { pr, b } = compare(r);
  assert.equal(b.captured, 2);
  assert.equal(b.settled, 1);
  assert.equal(b.active, 3);
  assert.ok(b.warnings.some(w => w.includes('unlisted') && w.includes('not in workshops.md')));
  assert.equal(pr.workshops.length, 6);
});

test('drift: a folder the manifest lacks counts only when it holds workshop.md; a bad folder name never counts', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- listed: a (2026-10-01)']));
  put(r, '.flightdeck/listed/workshop.md', card('Listed'));
  put(r, '.flightdeck/with-card/workshop.md', card('With card'));
  put(r, '.flightdeck/zeta-card/workshop.md', card('Zeta'));
  put(r, '.flightdeck/no-card/notes.md', 'no card here');
  put(r, '.flightdeck/Bad_Name/workshop.md', card('Bad'));
  const { pr, b } = compare(r);
  assert.deepEqual(pr.workshops.map(w => w.name), ['listed', 'with-card', 'zeta-card']);
  assert.equal(b.active, 3);
});

test('drift: open and held questions equal PR 1 on the alpha fixture', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- alpha: do the alpha work (2026-10-01)', '- beta: maybe later (2026-10-02)']));
  put(r, '.flightdeck/alpha/workshop.md', card('Alpha'));
  put(r, '.flightdeck/alpha/questions.md', QUESTIONS);
  const { b } = compare(r);
  assert.equal(b.openQuestions, 1);
  assert.equal(b.heldForLater, 1);
  assert.equal(b.captured, 1);
});

test('drift: a settled workshop with an open question still counts the question; a captured one never does', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- fin: done (2026-10-01)', '- later: not started (2026-10-02)']));
  put(r, '.flightdeck/fin/workshop.md', `${card('Fin')}settled: 2026-10-09\n`);
  put(r, '.flightdeck/fin/questions.md', '## q1: Still open?\nanswer:\n');
  put(r, '.flightdeck/later.activate.md', 'x');
  const { b } = compare(r);
  assert.equal(b.settled, 1);
  assert.equal(b.active, 0);
  assert.equal(b.openQuestions, 1);
  assert.equal(b.latest, null);
});

test('drift: the latest workshop is the active one changed last, and its label is the newest attempt folder', () => {
  const r = tmp();
  put(r, '.flightdeck/workshops.md', manifest(['- older: a (2026-10-01)', '- newer: b (2026-10-02)']));
  put(r, '.flightdeck/older/workshop.md', card('Older'));
  put(r, '.flightdeck/newer/workshop.md', card('Newer'));
  for (const d of ['pr-1/a1', 'pr-2/a1', 'pr-3/a2']) mkd(r, `.flightdeck/newer/attempts/${d}`);
  const t = Date.now() / 1000;
  fs.utimesSync(path.join(r, '.flightdeck/older/workshop.md'), t - 500, t - 500);
  fs.utimesSync(path.join(r, '.flightdeck/newer/workshop.md'), t - 10, t - 10);
  fs.utimesSync(path.join(r, '.flightdeck/newer/attempts/pr-1/a1'), t - 300, t - 300);
  fs.utimesSync(path.join(r, '.flightdeck/newer/attempts/pr-2/a1'), t - 100, t - 100);
  fs.utimesSync(path.join(r, '.flightdeck/newer/attempts/pr-3/a2'), t - 200, t - 200);
  const { b } = compare(r);
  assert.deepEqual(b.latest, { workshop: 'newer', label: 'pr-2/a1' });
});

test('drift: summarize gives zeros and a warning instead of throwing', () => {
  const s = band.summarize({ manifestText: null, folders: [{ name: 'x', cardText: 'c', questionsText: null, get attemptDirs() { throw new Error('boom'); }, changedMs: 1, attemptMs: {} }] });
  assert.equal(s.active, 0);
  assert.equal(s.latest, null);
  assert.deepEqual(s.warnings, ['summary failed: boom']);
  const none = band.summarize({ manifestText: null, folders: [] });
  assert.deepEqual(none, { active: 0, settled: 0, captured: 0, openQuestions: 0, heldForLater: 0, latest: null, warnings: [] });
  assert.equal(band.summarize(null).active, 0);
});

test('drift: settledDate reads the settled line and ignores comments and fences', () => {
  assert.equal(band.settledDate(null), null);
  assert.equal(band.settledDate(undefined), null);
  assert.equal(band.settledDate(card('X')), null);
  assert.equal(band.settledDate(`${card('X')}settled: 2026-10-09\n`), '2026-10-09');
  assert.equal(band.settledDate(`${card('X')}<!-- settled: 2026-10-09 -->\n`), null);
  assert.equal(band.settledDate(`${card('X')}\`\`\`\nsettled: 2026-10-09\n\`\`\`\n`), null);
});

// ---------- real data ----------

test("drift: the band equals PR 1's reader on this repository's own .flightdeck folder", () => {
  assert.ok(fs.existsSync(path.join(REPO_ROOT, '.flightdeck')), 'the repository has a .flightdeck folder');
  compare(REPO_ROOT);
});

// ---------- band text ----------

test('drift: band text matches the pinned examples exactly', () => {
  assert.equal(
    band.bandText({ active: 1, openQuestions: 0, captured: 3, latest: { workshop: 'build-1', label: 'pr-8/a1' } }, 200),
    'FlightDeck: 1 active workshop (build-1, latest pr-8/a1) | 0 questions waiting on you | 3 captured, waiting to start',
  );
  assert.equal(
    band.bandText({ active: 1, openQuestions: 0, captured: 3, latest: { workshop: 'build-1', label: 'pr-8/a1' } }, 60),
    'FlightDeck: 1 active | 0 waiting on you | 3 captured',
  );
  assert.equal(
    band.bandText({ active: 2, openQuestions: 1, captured: 0, latest: { workshop: 'alpha', label: null } }),
    'FlightDeck: 2 active workshops (alpha) | 1 question waiting on you | 0 captured, waiting to start',
  );
  assert.equal(
    band.bandText({ active: 0, openQuestions: 0, captured: 1, latest: null }, 200),
    'FlightDeck: no active workshop | 0 questions waiting on you | 1 captured, waiting to start',
  );
  assert.equal(band.bandText(null, 80), '');
  assert.equal(band.bandText(undefined), '');
});

test('drift: band constants', () => {
  assert.equal(band.NAME_RE.source, '^[a-z0-9-]+$');
  assert.equal(band.ATTEMPT_DEPTH, 7);
  assert.equal(band.REFRESH_MS, 30000);
  assert.deepEqual(Object.keys(band).sort(), ['ATTEMPT_DEPTH', 'NAME_RE', 'REFRESH_MS', 'bandText', 'latestAttempts', 'parseManifest', 'parseQuestions', 'settledDate', 'stripNoise', 'summarize']);
});

// ---------- the copy stays sandbox-safe ----------

test('drift: read.js has no imports, no process, no require and no dynamic import', () => {
  const text = fs.readFileSync(READ_JS, 'utf8');
  for (const bad of ['import ', 'process.', 'require(', 'import(']) assert.ok(!text.includes(bad), `read.js contains "${bad}"`);
});
