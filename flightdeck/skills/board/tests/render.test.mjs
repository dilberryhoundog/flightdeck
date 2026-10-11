// Tests for the flight board renderer. Node built-ins only. Run with the quoted glob:
//   node --test 'flightdeck/skills/board/tests/*.test.mjs'
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TEAM_PLANS, collectBoard, renderBoard, answerBlock, buildPrompt } from '../render.mjs';

const FIXTURES = fileURLToPath(new URL('./fixtures/', import.meta.url));
const RENDER = fileURLToPath(new URL('../render.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('../../../../', import.meta.url));
const NOW = '2026-10-11T00:00:00.000Z';

const temps = [];
after(() => { for (const d of temps) fs.rmSync(d, { recursive: true, force: true }); });

function tmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'board-test-'));
  temps.push(d);
  return d;
}

function fixtureCopy() {
  const d = tmpDir();
  fs.cpSync(FIXTURES, d, { recursive: true });
  return d;
}

function fixturePage(extra = {}) {
  const data = collectBoard(FIXTURES, { gh: false, now: NOW, ...extra });
  return { data, html: renderBoard(data) };
}

function section(html, id) {
  const m = new RegExp(`<section[^>]*id="${id}"[\\s\\S]*?</section>`).exec(html);
  assert.ok(m, `section ${id} is on the page`);
  return m[0];
}

function runCli(args, env = {}, cwd = REPO) {
  return spawnSync(process.execPath, [RENDER, ...args], { encoding: 'utf8', cwd, env: { ...process.env, ...env } });
}

test('board: every fixture workshop appears as a row with its state', () => {
  const { html } = fixturePage();
  const ws = section(html, 'workshops');
  assert.match(ws, /<article class="fd-row" data-workshop="ws-nested" data-state="active">/);
  const settled = /<article class="fd-row" data-workshop="ws-settled" data-state="settled">[\s\S]*?<\/article>/.exec(ws);
  assert.ok(settled, 'ws-settled row');
  assert.ok(settled[0].includes('Settled 2026-10-06'));
});

test('board: each workshop shows only its latest attempt per group', () => {
  const { html } = fixturePage();
  assert.ok(html.includes('Latest attempt plan/a3: no report yet'));
  assert.ok(html.includes('Latest attempt pr-1/a2: Fixture report two'));
  assert.ok(!html.includes('pr-1/a1'));
});

test('board: captured entries appear under waiting with a copy button', () => {
  const { html } = fixturePage();
  const waiting = section(html, 'waiting');
  for (const name of ['cap-one', 'cap-two']) {
    assert.ok(waiting.includes(`data-workshop="${name}"`), `${name} row`);
    assert.ok(waiting.includes(`data-copy="activate ${name}"`), `${name} copy button`);
  }
  assert.ok(waiting.includes('&lt;b&gt;'));
  assert.ok(waiting.includes('&amp;'));
  assert.ok(waiting.includes('&quot;quotes&quot;'));
  assert.ok(!waiting.includes('<b>'));
  assert.ok(waiting.includes('Questions to answer before it starts are waiting in <code>.flightdeck/cap-two.activate.md</code>.'));
  assert.ok(!/Questions to answer before it starts are waiting in <code>\.flightdeck\/cap-one/.test(waiting));
  assert.ok(!waiting.includes('ws-nested'));
  assert.ok(!waiting.includes('ws-settled'));
});

test('board: open questions and held questions are told apart', () => {
  const { html } = fixturePage();
  const questions = section(html, 'questions');
  const held = /<details id="held">[\s\S]*?<\/details>/.exec(questions);
  assert.ok(held, 'held list is there');
  assert.ok(held[0].includes('<summary>Asked to ask later (1)</summary>'));
  const outside = questions.replace(held[0], '');
  const fieldset = (w, id, held) => `data-workshop="${w}" data-question="${id}" data-held="${held}"`;
  for (const [w, id] of [['ws-nested', 'q1'], ['ws-nested', 'q3'], ['ws-settled', 'q1']]) {
    assert.ok(outside.includes(fieldset(w, id, 'false')), `${w} ${id} is open`);
    assert.ok(!held[0].includes(`data-workshop="${w}" data-question="${id}"`), `${w} ${id} is not held`);
  }
  assert.ok(held[0].includes(fieldset('ws-nested', 'q2', 'true')));
  assert.ok(!outside.includes('data-question="q2"'));
  assert.ok(!html.includes('Already answered question'));
  assert.ok(!html.includes('data-question="q4"'));
  assert.match(outside, /<label class="is-recommended"><input type="radio" name="ws-nested\/q1" value="b"> b\) grey \(recommended\)<\/label>/);
  assert.ok(!outside.includes('a) green (recommended)'));
});

test('board: the answer block matches the paste-back format exactly', () => {
  const first = 'FlightDeck answers for workshop ws-nested: file these into .flightdeck/ws-nested/questions.md';
  const block = answerBlock('ws-nested', [
    { id: 'q1', option: 'b', note: '' },
    { id: 'q2', option: 'a', note: 'keep it calm' },
    { id: 'q3', option: '', note: 'write it by hand' },
    { id: 'q4', option: '', note: '' },
    { id: 'q5', option: '', note: '  two\nlines   here ' },
  ], '');
  assert.equal(block, [first, 'q1: b', 'q2: a | note: keep it calm', 'q3: write it by hand', 'q4: (unanswered)', 'q5: two lines here', 'Other notes: (none)'].join('\n'));
  assert.equal(block.split('\n')[0], first);
  assert.equal(answerBlock('ws-nested', [{ id: 'q1', option: 'b', note: 'keep it calm' }], ' thanks\nall '),
    [first, 'q1: b | note: keep it calm', 'Other notes: thanks all'].join('\n'));
  assert.equal(answerBlock('ws-nested', [{ id: 'q3', option: '', note: '' }], ''), [first, 'q3: (unanswered)', 'Other notes: (none)'].join('\n'));
  const { html } = fixturePage();
  assert.ok(html.includes(answerBlock.toString()));
  assert.ok(html.includes(buildPrompt.toString()));
});

test('board: the prompt builder writes the exact seven lines', () => {
  const last = 'Before anything starts, show me the plan in five lines and wait for my go.';
  assert.equal(buildPrompt({ name: 'ws-nested', state: 'active', ask: ' fix  the\ncard ', done: 'it shows', verify: 'run the tests', plan: 'Recon', today: '2026-10-11' }), [
    'Captain, here is work for workshop ws-nested.',
    'It is active: read its constraints.md, context.md and verify.md first.',
    'Ask: fix the card',
    'Done when: it shows',
    'Check it by: run the tests',
    'Team plan: Recon',
    last,
  ].join('\n'));
  assert.equal(buildPrompt({ name: 'cap-one', state: 'captured', ask: '', done: '', verify: '', plan: '', today: '2026-10-11' }), [
    'Captain, here is work for workshop cap-one.',
    'It is captured and waiting to start: activate cap-one first.',
    'Ask: (none written)',
    'Done when: (propose it)',
    'Check it by: (propose it)',
    'Team plan: pick the smallest that fits and say why in one line',
    last,
  ].join('\n'));
  assert.equal(buildPrompt({ name: 'my-name', state: 'new', ask: 'Make it faster', done: 'd', verify: 'v', plan: 'Decide', today: '2026-10-11' }), [
    'Captain, here is work for workshop my-name.',
    'It is new: capture it as "- my-name: Make it faster (2026-10-11)" in .flightdeck/workshops.md, then activate my-name.',
    'Ask: Make it faster',
    'Done when: d',
    'Check it by: v',
    'Team plan: Decide',
    last,
  ].join('\n'));
  const derived = buildPrompt({ name: '', state: 'new', ask: 'Make the card show how old attempts are!', done: '', verify: '', plan: '', today: '2026-10-11' }).split('\n');
  assert.equal(derived[0], 'Captain, here is work for workshop make-the-card-show-how.');
  assert.equal(derived[1], 'It is new: capture it as "- make-the-card-show-how: Make the card show how old attempts are! (2026-10-11)" in .flightdeck/workshops.md, then activate make-the-card-show-how.');
  assert.equal(buildPrompt({ name: 'Bad Name', state: 'new', ask: '', done: '', verify: '', plan: '', today: 'x' }).split('\n')[0], 'Captain, here is work for workshop new-work.');
});

test('board: a malformed questions file shows warning rows and does not crash', () => {
  const { html } = fixturePage();
  const warnings = section(html, 'warnings');
  assert.ok(warnings.includes('Not a question heading'));
  assert.ok(warnings.includes('q3'));
  assert.equal((warnings.match(/class="fd-row fd-warning"/g) || []).length, 2);

  const root = tmpDir();
  fs.mkdirSync(path.join(root, '.flightdeck', 'ws-x'), { recursive: true });
  fs.writeFileSync(path.join(root, '.flightdeck', 'workshops.md'), '# Workshops\n\n- ws-x: no date on this line\n');
  fs.writeFileSync(path.join(root, '.flightdeck', 'ws-x', 'workshop.md'), '# X\n');
  fs.writeFileSync(path.join(root, '.flightdeck', 'ws-x', 'questions.md'), Buffer.from(Array.from({ length: 400 }, (_, i) => (i * 37 + 11) % 256)));
  const data = collectBoard(root, { gh: false, now: NOW });
  assert.ok(data.warnings.length > 0);
  const page = renderBoard(data);
  assert.ok(section(page, 'warnings').includes('fd-warning'));
  assert.ok(page.includes('data-workshop="ws-x"'));
});

test('board: a root with no flightdeck folder gives an empty board and the command says so', () => {
  const root = tmpDir();
  const data = collectBoard(root, { gh: false, now: NOW });
  assert.deepEqual([data.workshops, data.waiting, data.questions], [[], [], []]);
  assert.ok(data.warnings.length >= 1);
  const page = renderBoard(data);
  assert.ok(page.includes('No active workshops yet.'));
  assert.ok(page.includes('Nothing is waiting to start.'));
  const r = runCli(['--root', root, '--no-gh'], { CLAUDE_PROJECT_DIR: root }, root);
  assert.equal(r.status, 0);
  assert.equal(r.stdout, `No .flightdeck/ folder found from ${root}; there is nothing to show.\n`);
});

test('board: the page loads nothing but Google Fonts', () => {
  const { html } = fixturePage();
  const urls = html.match(/https?:\/\/[^\s"'<>)]+/g) || [];
  assert.ok(urls.length > 0, 'the fonts import is there');
  for (const u of urls) assert.ok(['fonts.googleapis.com', 'fonts.gstatic.com'].includes(new URL(u).host), `unexpected host in ${u}`);
  for (const bad of ['<script src', '<iframe', '<img', '<link rel="stylesheet"', '<link rel=stylesheet']) assert.ok(!html.includes(bad), bad);
});

test('board: the theme is inlined with a dark set', () => {
  const { html } = fixturePage();
  assert.match(html, /:root ?\{[^}]*--bg:/);
  assert.ok(html.includes('@media (prefers-color-scheme: dark)'));
  assert.ok(html.includes(':root[data-theme="dark"]'));
  assert.match(html, /body ?\{[^}]*background: var\(--bg\)/);
});

test('board: the data slot parses to the collected data and cannot end the script', () => {
  const { data, html } = fixturePage();
  const m = /<script type="application\/json" id="board-data">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m, 'data slot');
  assert.ok(!m[1].includes('<'));
  assert.deepEqual(JSON.parse(m[1]), JSON.parse(JSON.stringify(data)));
  assert.ok(JSON.parse(m[1]).waiting.find((w) => w.name === 'cap-two').ask.includes('</script>'));
  assert.equal((html.match(/<script/g) || []).length, 2);
});

test('board: the command line writes the page, honours --out and --json', () => {
  const root = fixtureCopy();
  const r = runCli(['--root', root, '--no-gh'], {}, os.tmpdir());
  assert.equal(r.status, 0, r.stderr);
  const board = path.join(root, '.flightdeck', 'board.html');
  const lines = r.stdout.split('\n');
  assert.equal(lines[0], `Board written: ${board}`);
  assert.equal(lines[1], `Open it: ${pathToFileURL(board).href}`);
  assert.equal(lines[2], 'Workshops: 1 active, 1 settled. Waiting to start: 2. Questions waiting on you: 3 (asked to ask later: 1).');
  assert.equal(lines[3], 'Pull requests: not shown (not asked for)');
  assert.ok(lines.slice(4).filter(Boolean).every((l) => l.startsWith('warning: ')));
  assert.ok(fs.existsSync(board));

  const out = path.join(root, 'x', 'b.html');
  const r2 = runCli(['--root', root, '--no-gh', '--out', out], {}, os.tmpdir());
  assert.equal(r2.status, 0, r2.stderr);
  assert.equal(r2.stdout.split('\n')[0], `Board written: ${out}`);
  assert.ok(fs.existsSync(out));

  const fresh = fixtureCopy();
  const r3 = runCli(['--root', fresh, '--no-gh', '--json'], {}, os.tmpdir());
  assert.equal(r3.status, 0, r3.stderr);
  const lines3 = r3.stdout.split('\n').filter(Boolean);
  assert.equal(lines3.length, 1);
  assert.equal(JSON.parse(lines3[0]).version, 1);
  assert.ok(!fs.existsSync(path.join(fresh, '.flightdeck', 'board.html')));
});

test('board: open pull requests are matched to workshops and the rest are listed apart', () => {
  const prs = [
    { number: 7, title: 'Fixture PR', url: 'https://github.com/o/r/pull/7', headRefName: 'ws-nested-a2', isDraft: true },
    { number: 8, title: 'Stray', url: 'https://github.com/o/r/pull/8', headRefName: 'other', isDraft: false },
  ];
  const { data, html } = fixturePage({ prs });
  const row = new RegExp('<article class="fd-row" data-workshop="ws-nested"[\\s\\S]*?</article>').exec(html)[0];
  assert.ok(row.includes('#7 Fixture PR</a> (draft)'));
  assert.ok(!row.includes('#8'));
  assert.deepEqual(data.workshops[0].prs.map((p) => p.number), [7]);
  assert.deepEqual(data.prs.other.map((p) => p.number), [8]);
  const rest = html.slice(html.indexOf('Other open pull requests'));
  assert.ok(rest.includes('#8 Stray'));
  assert.ok(!html.includes('Pull requests are not shown'));
  const none = fixturePage().html;
  assert.ok(none.includes('Pull requests are not shown'));
  assert.ok(!none.includes('Other open pull requests'));
});

test('board: the six team plans match the team plan pages', () => {
  assert.equal(TEAM_PLANS.length, 6);
  for (const { slug, title } of TEAM_PLANS) {
    const file = path.join(REPO, 'flightdeck', 'skills', 'team-plans', `${slug}.md`);
    assert.ok(fs.existsSync(file), `${slug}.md exists`);
    assert.equal(fs.readFileSync(file, 'utf8').split('\n')[0], `# ${title}`);
  }
});

test('board: collecting the repository itself does not throw and lists build-1', () => {
  const data = collectBoard(REPO, { gh: false, now: NOW });
  const w = data.workshops.find((x) => x.name === 'build-1');
  assert.ok(w, 'build-1 is listed');
  assert.ok(['active', 'settled'].includes(w.state));
  assert.ok(renderBoard(data).includes('data-workshop="build-1"'));
});

test('board: importing the renderer prints nothing and writes nothing', () => {
  const root = fixtureCopy();
  const before = fs.readdirSync(root, { recursive: true }).sort();
  const code = `await import(${JSON.stringify(pathToFileURL(RENDER).href)});`;
  const r = spawnSync(process.execPath, ['--input-type=module', '-e', code], { encoding: 'utf8', cwd: root, env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stdout, '');
  assert.equal(r.stderr, '');
  assert.deepEqual(fs.readdirSync(root, { recursive: true }).sort(), before);
  assert.ok(!fs.existsSync(path.join(root, '.flightdeck', 'board.html')));
});

test('board: with no questions the page has no answer boxes but still has the prompt builder', () => {
  const root = tmpDir();
  fs.mkdirSync(path.join(root, '.flightdeck'), { recursive: true });
  fs.writeFileSync(path.join(root, '.flightdeck', 'workshops.md'), '# Workshops\n\n- cap-x: a captured idea (2026-10-11)\n');
  const data = collectBoard(root, { gh: false, now: NOW });
  assert.deepEqual(data.questions, []);
  const page = renderBoard(data);
  const questions = section(page, 'questions');
  assert.ok(questions.includes('No questions are waiting on you.'));
  assert.ok(!page.includes('id="other-notes"'));
  assert.ok(!page.includes('id="copy-answers"'));
  assert.ok(page.includes('id="copy-prompt"'));
});
