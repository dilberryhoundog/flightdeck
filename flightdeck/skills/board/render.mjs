#!/usr/bin/env node
// FlightDeck flight board renderer. Reads the workshops through the shared reader, builds the board
// data and writes one self-contained HTML page. Dependency-free; collectBoard never throws.
//
// Command line:
//   node render.mjs [--root <dir>] [--out <file>] [--no-gh] [--json]
// Prints where the page was written and a summary. Exit code 1 only on an internal error.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { listWorkshops, parseQuestions, stripNoise, findRoot } from '../../lib/workshops.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const TEAM_PLANS = [
  { slug: 'recon', title: 'Recon' },
  { slug: 'build-and-check', title: 'Build and check' },
  { slug: 'decide', title: 'Decide' },
  { slug: 'spec-first', title: 'Spec first' },
  { slug: 'many-hands', title: 'Many hands' },
  { slug: 'root-cause', title: 'Root cause' },
];

const PLACEHOLDERS = ['THEME_CSS', 'HEADER', 'WORKSHOPS', 'WAITING', 'QUESTIONS', 'WARNINGS', 'DATA_JSON', 'FUNCTIONS'];
const GH_NOTE = 'the GitHub tool (gh) is missing, not signed in, or could not reach GitHub';

// The two functions below are run in the page, from their toString() source: each uses only its own body.
export function answerBlock(name, items, otherNotes) {
  var clean = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  var lines = ['FlightDeck answers for workshop ' + name + ': file these into .flightdeck/' + name + '/questions.md'];
  (items || []).forEach(function (item) {
    var option = clean(item.option);
    var note = clean(item.note);
    if (option && note) lines.push(item.id + ': ' + option + ' | note: ' + note);
    else if (option) lines.push(item.id + ': ' + option);
    else if (note) lines.push(item.id + ': ' + note);
    else lines.push(item.id + ': (unanswered)');
  });
  var other = clean(otherNotes);
  lines.push('Other notes: ' + (other || '(none)'));
  return lines.join('\n');
}

export function buildPrompt(input) {
  var clean = function (s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim(); };
  var state = input.state;
  var ask = clean(input.ask);
  var done = clean(input.done);
  var verify = clean(input.verify);
  var plan = clean(input.plan);
  var today = clean(input.today);
  var name = clean(input.name);
  if (state === 'new' && !/^[a-z0-9-]+$/.test(name)) {
    var slug = ask.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    slug = slug.split('-').slice(0, 5).join('-').slice(0, 40).replace(/-+$/, '');
    name = slug || 'new-work';
  }
  var second;
  if (state === 'active') second = 'It is active: read its constraints.md, context.md and verify.md first.';
  else if (state === 'captured') second = 'It is captured and waiting to start: activate ' + name + ' first.';
  else second = 'It is new: capture it as "- ' + name + ': ' + ask + ' (' + today + ')" in .flightdeck/workshops.md, then activate ' + name + '.';
  return [
    'Captain, here is work for workshop ' + name + '.',
    second,
    'Ask: ' + (ask || '(none written)'),
    'Done when: ' + (done || '(propose it)'),
    'Check it by: ' + (verify || '(propose it)'),
    'Team plan: ' + (plan || 'pick the smallest that fits and say why in one line'),
    'Before anything starts, show me the plan in five lines and wait for my go.',
  ].join('\n');
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

// Display details of each question, in file order (the same blocks parseQuestions counts).
function parseDetails(text) {
  const blocks = [];
  let cur = null;
  const value = (line, name) => {
    const m = new RegExp(`^\\s*(?:[-*]\\s+)?${name}:(.*)$`, 'i').exec(line);
    return m ? m[1].trim() : null;
  };
  for (const line of stripNoise(text).split('\n')) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      cur = /^q(\d+)\b/i.test(h[1].trim()) ? { why: null, options: null, recommended: null, asked: null, askLater: null, answer: null } : null;
      if (cur) blocks.push(cur);
      continue;
    }
    if (!cur) continue;
    for (const [field, key] of [['why', 'why'], ['options', 'options'], ['recommended', 'recommended'], ['asked', 'asked'], ['askLater', 'ask-later'], ['answer', 'answer']]) {
      if (cur[field] !== null) continue;
      const v = value(line, key);
      if (v !== null) { cur[field] = v; break; }
    }
  }
  return blocks;
}

function splitOptions(optionsText, recommendedText) {
  const rec = /(?:^|\s)([a-z])\)/i.exec(recommendedText || '');
  const recLetter = rec ? rec[1].toLowerCase() : null;
  const found = [...String(optionsText || '').matchAll(/(?:^|;\s*)([a-z])\)\s*/gi)];
  return found.map((m, i) => {
    const start = m.index + m[0].length;
    const end = i + 1 < found.length ? found[i + 1].index : String(optionsText).length;
    const letter = m[1].toLowerCase();
    return { letter, text: String(optionsText).slice(start, end).trim(), recommended: letter === recLetter };
  });
}

function firstHeading(file) {
  const text = readText(file);
  if (text === null) return null;
  for (const line of text.replace(/\r\n?/g, '\n').split('\n')) {
    if (line.startsWith('# ')) return line.slice(2).trim();
  }
  return null;
}

function currentBranch(root) {
  try {
    const r = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: root, encoding: 'utf8', timeout: 5000 });
    const b = r.status === 0 ? String(r.stdout).trim() : '';
    return b || null;
  } catch { return null; }
}

function loadPulls(root, gh, prs) {
  const pick = (p) => ({ number: p.number, title: String(p.title ?? ''), url: String(p.url ?? ''), isDraft: Boolean(p.isDraft), headRefName: String(p.headRefName ?? '') });
  if (Array.isArray(prs)) return { shown: true, note: '', list: prs.map(pick) };
  if (!gh) return { shown: false, note: 'not asked for', list: [] };
  try {
    const r = spawnSync('gh', ['pr', 'list', '--state', 'open', '--json', 'number,title,url,headRefName,isDraft', '--limit', '50'], { cwd: root, encoding: 'utf8', timeout: 10000 });
    if (r.error || r.status !== 0) return { shown: false, note: GH_NOTE, list: [] };
    const parsed = JSON.parse(r.stdout);
    if (!Array.isArray(parsed)) return { shown: false, note: GH_NOTE, list: [] };
    return { shown: true, note: '', list: parsed.map(pick) };
  } catch { return { shown: false, note: GH_NOTE, list: [] }; }
}

export function collectBoard(root, { gh = true, prs = null, now = new Date().toISOString() } = {}) {
  const data = {
    version: 1,
    generated: now,
    root: root ? path.resolve(String(root)) : '',
    branch: null,
    workshops: [],
    waiting: [],
    questions: [],
    prs: { shown: false, note: 'not asked for', other: [] },
    teamPlans: TEAM_PLANS.map(({ slug, title }) => ({ slug, title })),
    warnings: [],
  };
  try {
    if (!root || !isDir(path.join(data.root, '.flightdeck'))) {
      data.warnings.push(`No .flightdeck/ folder found in ${data.root || '(no folder)'}; there is nothing to show.`);
      return data;
    }
    data.branch = currentBranch(data.root);
    const pulls = loadPulls(data.root, gh, prs);
    data.prs.shown = pulls.shown;
    data.prs.note = pulls.note;
    const used = new Set();
    const list = listWorkshops(data.root);
    data.warnings.push(...list.warnings);
    for (const w of list.workshops) {
      try {
        if (w.state === 'captured') {
          data.waiting.push({ name: w.name, ask: w.ask, date: w.date, activateFile: w.pendingActivation ? `.flightdeck/${w.name}.activate.md` : null });
          continue;
        }
        const attempts = w.attempts.map((a) => {
          const rel = `.flightdeck/${w.name}/attempts/${a.label}/report.md`;
          const title = firstHeading(path.join(data.root, rel));
          return title === null ? { label: a.label, report: null, title: null } : { label: a.label, report: rel, title };
        });
        const mine = pulls.list.filter((p) => p.headRefName === w.name || p.headRefName.startsWith(`${w.name}-`));
        mine.forEach((p) => used.add(p));
        data.workshops.push({
          name: w.name, ask: w.ask, date: w.date, state: w.state, settled: w.settled,
          attempts, openQuestions: w.openQuestions, heldForLater: w.heldForLater, prs: mine,
        });
        const text = readText(path.join(data.root, '.flightdeck', w.name, 'questions.md'));
        if (text === null) continue;
        const parsed = parseQuestions(text).questions;
        const details = parseDetails(text);
        parsed.forEach((q, i) => {
          const d = details[i] || { why: null, options: null, recommended: null, asked: null, askLater: null, answer: null };
          const unanswered = d.answer === null || d.answer === '';
          const held = !q.open && q.askLater && unanswered;
          if (!q.open && !held) return;
          data.questions.push({
            workshop: w.name, id: q.id, text: q.text, why: d.why || '',
            options: splitOptions(d.options, d.recommended), recommended: d.recommended || '',
            asked: d.asked || '', askLater: d.askLater || '', held,
          });
        });
      } catch (e) {
        data.warnings.push(`${w.name}: its details could not be read (${e.message})`);
      }
    }
    data.prs.other = pulls.list.filter((p) => !used.has(p));
  } catch (e) {
    data.warnings.push(`the board could not be fully collected (${e.message})`);
  }
  return data;
}

export function loadAssets() {
  const template = fs.readFileSync(path.join(HERE, 'board.template.html'), 'utf8');
  let themeCss = '';
  let warning = null;
  try { themeCss = fs.readFileSync(path.join(HERE, '..', 'page', 'theme.css'), 'utf8'); }
  catch { warning = 'The page theme (skills/page/theme.css) could not be read, so this page is shown without its colours and fonts.'; }
  return { template, themeCss, warning };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function jsonSlot(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function prLink(p) {
  const label = `#${esc(p.number)} ${esc(p.title)}`;
  const link = /^https?:\/\//i.test(p.url) ? `<a href="${esc(p.url)}">${label}</a>` : label;
  return p.isDraft ? `${link} (draft)` : link;
}

function madeAt(generated) {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(String(generated ?? ''));
  if (m) return `${m[1]} ${m[2]} UTC`;
  const d = new Date(generated);
  if (!Number.isNaN(d.getTime())) { const iso = d.toISOString(); return `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`; }
  return String(generated ?? '');
}

function renderHeader(data) {
  return [
    '<header class="fd-header">',
    '<h1>FlightDeck flight board</h1>',
    data.branch ? `<p class="fd-sub">Branch: ${esc(data.branch)}</p>` : '',
    `<p class="fd-sub">Made ${esc(madeAt(data.generated))}</p>`,
    '<p class="fd-sub">To refresh: type /flight:board again, then reload this page.</p>',
    '</header>',
  ].filter(Boolean).join('\n');
}

function renderWorkshops(data) {
  const out = ['<section class="fd-section" id="workshops">', '<h2>Workshops</h2>',
    '<p class="fd-sub">A workshop is a piece of work with its own folder of notes, checks and attempts. An attempt is one try at part of the work; a label like pr-1/a2 means the second try at PR 1.</p>'];
  if (!data.workshops.length) out.push('<p class="fd-empty">No active workshops yet.</p>');
  for (const w of data.workshops) {
    const badge = w.state === 'settled' ? `<span class="fd-badge is-go">Settled ${esc(w.settled)}</span>` : '<span class="fd-badge is-info">In progress</span>';
    out.push(`<article class="fd-row" data-workshop="${esc(w.name)}" data-state="${esc(w.state)}">`);
    out.push(`<h3>${esc(w.name)}</h3>`, `<p>${badge}</p>`);
    if (w.ask) out.push(`<p>${esc(w.ask)}</p>`);
    if (!w.attempts.length) out.push('<p class="fd-muted">No attempts yet.</p>');
    for (const a of w.attempts) out.push(`<p class="fd-muted">Latest attempt ${esc(a.label)}: ${a.title === null ? 'no report yet' : esc(a.title)}</p>`);
    out.push(`<p>Questions waiting: ${esc(w.openQuestions)}${w.heldForLater > 0 ? ` (asked to ask later: ${esc(w.heldForLater)})` : ''}</p>`);
    if (w.prs.length) out.push(`<p>Open pull requests: ${w.prs.map(prLink).join(', ')}</p>`);
    out.push('</article>');
  }
  if (!data.prs.shown) out.push(`<p class="fd-muted">Pull requests are not shown: ${esc(data.prs.note)}.</p>`);
  if (data.prs.other.length) {
    out.push('<h3>Other open pull requests</h3>', '<ul>');
    for (const p of data.prs.other) out.push(`<li>${prLink(p)}</li>`);
    out.push('</ul>');
  }
  out.push('</section>');
  return out.join('\n');
}

function renderWaiting(data) {
  const out = ['<section class="fd-section" id="waiting">', '<h2>Waiting to start</h2>',
    '<p class="fd-sub">Work that was written down and is waiting for you to start it. To start one, copy its line and paste it to the pilot (the Claude session that leads your work).</p>'];
  if (!data.waiting.length) out.push('<p class="fd-empty">Nothing is waiting to start.</p>');
  else {
    out.push('<ul class="fd-list">');
    for (const c of data.waiting) {
      out.push(`<li class="fd-row" data-workshop="${esc(c.name)}">`, `<h3>${esc(c.name)}</h3>`);
      out.push(`<p>${esc(c.ask)}${c.date ? ` <span class="fd-muted">(${esc(c.date)})</span>` : ''}</p>`);
      out.push(`<p><code>activate ${esc(c.name)}</code> <button type="button" class="fd-btn" data-copy="activate ${esc(c.name)}">Copy</button></p>`);
      if (c.activateFile) out.push(`<p class="fd-muted">Questions to answer before it starts are waiting in <code>${esc(c.activateFile)}</code>.</p>`);
      out.push('</li>');
    }
    out.push('</ul>');
  }
  out.push('</section>');
  return out.join('\n');
}

function renderQuestion(q) {
  const name = `${q.workshop}/${q.id}`;
  const out = [`<fieldset class="fd-question" data-workshop="${esc(q.workshop)}" data-question="${esc(q.id)}" data-held="${q.held ? 'true' : 'false'}">`,
    `<legend>${esc(q.workshop)} ${esc(q.id)}: ${esc(q.text)}</legend>`];
  if (q.why) out.push(`<p>Why: ${esc(q.why)}</p>`);
  if (q.options.length) {
    out.push('<div class="fd-options">');
    for (const o of q.options) {
      out.push(`<label${o.recommended ? ' class="is-recommended"' : ''}><input type="radio" name="${esc(name)}" value="${esc(o.letter)}"> ${esc(o.letter)}) ${esc(o.text)}${o.recommended ? ' (recommended)' : ''}</label>`);
    }
    out.push('</div>');
  }
  if (q.asked) out.push(`<p class="fd-muted">Asked: ${esc(q.asked)}</p>`);
  if (q.held && q.askLater) out.push(`<p class="fd-muted">Ask later: ${esc(q.askLater)}</p>`);
  out.push(`<label class="fd-field">${q.options.length ? 'Note (optional)' : 'Your answer'}<textarea data-note></textarea></label>`, '</fieldset>');
  return out.join('\n');
}

function renderQuestions(data) {
  const open = data.questions.filter((q) => !q.held);
  const held = data.questions.filter((q) => q.held);
  const out = ['<section class="fd-section" id="questions">', '<h2>Questions waiting on you</h2>'];
  if (!data.questions.length) {
    out.push('<p class="fd-empty">No questions are waiting on you.</p>', '</section>');
    return out.join('\n');
  }
  out.push('<p class="fd-sub">Pick an answer or write a note, then press Copy my answers and paste the result into your Claude chat. Skipped questions stay open.</p>');
  if (!open.length) out.push(`<p class="fd-empty">No questions are waiting on you. You asked for ${held.length} to be asked later; they are in the folded list below.</p>`);
  for (const q of open) out.push(renderQuestion(q));
  if (held.length) {
    out.push(`<details id="held"><summary>Asked to ask later (${held.length})</summary>`,
      '<p class="fd-sub">You asked for these to be asked later. You can answer them now if you want.</p>');
    for (const q of held) out.push(renderQuestion(q));
    out.push('</details>');
  }
  out.push('<label class="fd-field">Other notes<textarea id="other-notes"></textarea></label>',
    '<div class="fd-copy-panel">',
    '<button type="button" id="copy-answers" class="fd-btn fd-btn-primary">Copy my answers</button>',
    '<span class="fd-status" id="answers-status" role="status"></span>',
    '<textarea id="answers-out" readonly aria-label="The text that is copied"></textarea>',
    '</div>', '</section>');
  return out.join('\n');
}

function renderWarnings(warnings) {
  if (!warnings.length) return '';
  return ['<section class="fd-section" id="warnings">', '<h2>Warnings</h2>',
    '<p class="fd-sub">Something in these files could not be read. The rest of the board is still right.</p>',
    ...warnings.map((w) => `<article class="fd-row fd-warning">${esc(w)}</article>`), '</section>'].join('\n');
}

export function renderBoard(data, assets = loadAssets()) {
  const warnings = assets.warning && !data.warnings.includes(assets.warning) ? [...data.warnings, assets.warning] : data.warnings;
  const shown = warnings === data.warnings ? data : { ...data, warnings };
  const values = {
    THEME_CSS: assets.themeCss,
    HEADER: renderHeader(shown),
    WORKSHOPS: renderWorkshops(shown),
    WAITING: renderWaiting(shown),
    QUESTIONS: renderQuestions(shown),
    WARNINGS: renderWarnings(warnings),
    DATA_JSON: jsonSlot(shown),
    FUNCTIONS: `${answerBlock.toString()}\n\n${buildPrompt.toString()}`,
  };
  const pieces = String(assets.template).split(/(\{\{[A-Z_]+\}\})/);
  const seen = new Map();
  const html = pieces.map((piece) => {
    const m = /^\{\{([A-Z_]+)\}\}$/.exec(piece);
    if (!m) return piece;
    if (!PLACEHOLDERS.includes(m[1])) throw new Error(`the page template has an unknown placeholder {{${m[1]}}}`);
    seen.set(m[1], (seen.get(m[1]) || 0) + 1);
    return values[m[1]];
  }).join('');
  for (const ph of PLACEHOLDERS) {
    if (seen.get(ph) !== 1) throw new Error(`the page template must hold {{${ph}}} exactly once (found ${seen.get(ph) || 0})`);
  }
  return html;
}

export function writeBoard(root, { out, gh, prs, now } = {}) {
  const data = collectBoard(root, { gh, prs, now });
  const assets = loadAssets();
  if (assets.warning && !data.warnings.includes(assets.warning)) data.warnings.push(assets.warning);
  const file = path.resolve(out || path.join(data.root, '.flightdeck', 'board.html'));
  const html = renderBoard(data, assets);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
  return { path: file, data };
}

function parseArgs(argv) {
  const opts = { root: null, out: null, gh: true, json: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-gh') opts.gh = false;
    else if (a === '--json') opts.json = true;
    else if (a === '--root' || a === '--out') {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      opts[a.slice(2)] = v;
    } else if (a.startsWith('--root=')) opts.root = a.slice(7);
    else if (a.startsWith('--out=')) opts.out = a.slice(6);
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function cli(argv) {
  const opts = parseArgs(argv);
  const start = opts.root ? path.resolve(opts.root) : path.resolve(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const root = findRoot(start) || findRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  if (!root) {
    process.stdout.write(`No .flightdeck/ folder found from ${start}; there is nothing to show.\n`);
    return;
  }
  const lines = [];
  let data;
  if (opts.json) {
    data = collectBoard(root, { gh: opts.gh });
    process.stdout.write(`${JSON.stringify(data)}\n`);
    return;
  }
  const result = writeBoard(root, { out: opts.out ? path.resolve(opts.out) : undefined, gh: opts.gh });
  data = result.data;
  const active = data.workshops.filter((w) => w.state === 'active').length;
  const settled = data.workshops.filter((w) => w.state === 'settled').length;
  const open = data.questions.filter((q) => !q.held).length;
  const held = data.questions.filter((q) => q.held).length;
  lines.push(`Board written: ${result.path}`);
  lines.push(`Open it: ${pathToFileURL(result.path).href}`);
  lines.push(`Workshops: ${active} active, ${settled} settled. Waiting to start: ${data.waiting.length}. Questions waiting on you: ${open} (asked to ask later: ${held}).`);
  lines.push(data.prs.shown ? `Pull requests: ${data.prs.other.length + data.workshops.reduce((n, w) => n + w.prs.length, 0)} open` : `Pull requests: not shown (${data.prs.note})`);
  for (const w of data.warnings) lines.push(`warning: ${w}`);
  process.stdout.write(`${lines.join('\n')}\n`);
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) {
  try { cli(process.argv); process.exitCode = 0; }
  catch (e) { process.stderr.write(`board error: ${e.message}\n`); process.exitCode = 1; }
}
