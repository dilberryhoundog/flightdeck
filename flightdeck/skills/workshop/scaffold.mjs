#!/usr/bin/env node
// FlightDeck workshop script: every file and git operation the capture, workshop, retry and
// promote skills need, in one tested place. Dependency-free; the reader is PR 1's lib/workshops.mjs.
//
// Usage (run from the project; every command also takes --root <dir> and --date <YYYY-MM-DD>):
//   scaffold.mjs name <goal words...>
//       prints a short unused name made from the first four meaningful words of the goal
//   scaffold.mjs capture <name> <ask words...> | capture <name> --ask <path|-> [--json]
//       adds one line to .flightdeck/workshops.md; makes no folder
//   scaffold.mjs check-bundle <file>
//       checks an activation bundle (.flightdeck/<name>.activate.md); one pass/FAIL line per case, then <n>/<m> passed
//   scaffold.mjs answer <name> --from <path|->
//       files a pasted reply block into .flightdeck/<name>.activate.md; prints "answered <a>, open <o>"
//   scaffold.mjs activate <name> --spec <path|-> [--questions-from <path>] [--json]
//       writes the workshop folder (workshop.md, context.md, verify.md and, with --questions-from, questions.md)
//   scaffold.mjs retry <name> [--group <g>] --change <text> [--change <text> ...] [--json]
//       opens the next attempt folder with its brief.md; prints the new folder
//   scaffold.mjs propose <name> [--json]
//       lists the lines of a settled workshop that could be promoted, each with a target file and heading
//   scaffold.mjs promote-commit <name> --edits <path|-> [--dry-run] [--keep] [--base <ref>] [--branch <name>]
//       builds one commit on a new branch with git plumbing; never touches HEAD, the index or the working tree
// Exit code: 0 done; 1 refused (stderr "refused: <reason>", nothing changed on disk); 2 usage or bad input
// (stderr "usage:" or "error:"). A stack trace is never printed.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  parseManifest, parseQuestions, parseVerify, parseDecisions, latestAttempts,
  listWorkshops, findRoot, stripNoise,
} from '../../lib/workshops.mjs';

export const NAME_RE = /^[a-z0-9](?:[a-z0-9-]{0,46}[a-z0-9])?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const GROUP_RE = /^[a-z0-9][a-z0-9-]*(\/[a-z0-9][a-z0-9-]*)*$/;
const STOP_WORDS = new Set('a an the of to and or for in on at with is are be it this that we should make please'.split(' '));
const TEMPLATES = new URL('../../templates/workshop/', import.meta.url);
const MANIFEST_HEADER = '# Workshops\n\nEvery piece of work FlightDeck knows about, one line each: a line alone means captured and waiting to start; a folder of the same name means active; a settled: line in its card means settled.\n\n';
const NO_APPROVAL = /\b(approve|approval|sign[ -]?off|looks? (right|good|ok|okay)|is (this|that|it) (ok|okay|right|correct|fine)|confirm (the|this|these|my|our) (draft|card|text|wording|summary))\b/i;
const SETTLED_RE = /^settled:\s*(\d{4}-\d{2}-\d{2})\s*$/m;

// A refusal: exit 1, nothing changed on disk. Any other error exits 2.
class Refuse extends Error {}
class Bad extends Error {}

// ---------- small helpers ----------

export const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

const readText = (file) => { try { return fs.readFileSync(file, 'utf8'); } catch { return null; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const toLines = (text) => { const l = String(text).replace(/\r\n?/g, '\n').split('\n'); if (l.length && l[l.length - 1] === '') l.pop(); return l; };
const fromLines = (lines) => (lines.length ? `${lines.join('\n')}\n` : '');

function todayLocal() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function checkName(name) {
  if (!name || !NAME_RE.test(name)) {
    throw new Refuse(`"${name ?? ''}" is not a valid workshop name (lowercase letters, digits and hyphens, at most 48 characters, starting and ending with a letter or digit)`);
  }
}

// Turns a goal into a short name: the first four words that are not stop words.
export function slugName(goal) {
  const words = String(goal ?? '').toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/)
    .map((w) => w.replace(/^-+|-+$/g, '')).filter((w) => w && !STOP_WORDS.has(w));
  let s = words.slice(0, 4).join('-');
  if (s.length > 40) {
    const cut = s.slice(0, 41).lastIndexOf('-');
    s = cut > 0 ? s.slice(0, cut) : s.slice(0, 40);
  }
  s = s.replace(/^-+|-+$/g, '');
  return s || 'workshop';
}

function getRoot(o, fallback) {
  if (o.root) return path.resolve(o.root);
  const start = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const r = findRoot(start);
  if (r) return r;
  if (fallback) return path.resolve(start);
  throw new Refuse(`no .flightdeck/ folder found from ${start}; capture something first with /flight:capture`);
}

function resolveIn(p, root) {
  if (path.isAbsolute(p)) return p;
  const here = path.resolve(p);
  if (fs.existsSync(here)) return here;
  const there = path.resolve(root, p);
  return fs.existsSync(there) ? there : here;
}

function readInput(p, root, what) {
  if (p === '-') {
    try { return fs.readFileSync(0, 'utf8'); } catch { throw new Bad(`cannot read ${what} from standard input`); }
  }
  const file = resolveIn(p, root);
  const text = readText(file);
  if (text === null) throw new Bad(`cannot read ${what} ${p}`);
  return text;
}

// Deletes a hand-off file, but only when it is exactly the expected path.
function deleteHandoff(p, root, expected) {
  if (p === undefined || p === '-') return;
  try {
    const file = resolveIn(p, root);
    if (fs.realpathSync(file) === fs.realpathSync(expected)) fs.unlinkSync(file);
  } catch { /* nothing to delete */ }
}

function nameTaken(root, name) {
  const fd = path.join(root, '.flightdeck');
  const inManifest = parseManifest(readText(path.join(fd, 'workshops.md')) ?? '').entries.some((e) => e.name === name);
  return inManifest || fs.existsSync(path.join(fd, name)) || fs.existsSync(path.join(fd, `${name}.activate.md`));
}

function template(file, name) {
  const text = fs.readFileSync(fileURLToPath(new URL(file, TEMPLATES)), 'utf8').replace(/\r\n?/g, '\n');
  return name === undefined ? text : text.split('<name>').join(name);
}

function demoteHeadings(text) {
  let fence = null;
  return toLines(text).map((line) => {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) { if (m && m[1][0] === fence[0] && m[1].length >= fence.length) fence = null; return line; }
    if (m) { fence = m[1]; return line; }
    return line.startsWith('#') ? `#${line}` : line;
  }).join('\n');
}

function git(root, args, opts = {}) {
  const r = spawnSync('git', args, { cwd: root, input: opts.input, encoding: 'utf8', env: opts.env ?? process.env, maxBuffer: 64 * 1024 * 1024 });
  if (r.error) return { ok: false, out: '', err: r.error.message };
  return { ok: r.status === 0, out: r.stdout || '', err: (r.stderr || '').trim() };
}

// ---------- command line parsing ----------

const VALUE_FLAGS = new Set(['root', 'date', 'ask', 'from', 'spec', 'questions-from', 'group', 'change', 'edits', 'base', 'branch']);
const BOOL_FLAGS = new Set(['json', 'dry-run', 'keep', 'help']);

export function parseArgs(argv) {
  const o = { pos: [], change: [] };
  let rest = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (rest) { o.pos.push(a); continue; }
    if (a === '--') { rest = true; continue; }
    if (!a.startsWith('--')) { o.pos.push(a); continue; }
    const eq = a.indexOf('=');
    const k = eq < 0 ? a.slice(2) : a.slice(2, eq);
    let v = eq < 0 ? undefined : a.slice(eq + 1);
    if (VALUE_FLAGS.has(k)) {
      if (v === undefined) {
        if (i + 1 >= argv.length) throw new Bad(`usage: --${k} needs a value`);
        v = argv[++i];
      }
      if (k === 'change') o.change.push(v); else o[k] = v;
    } else if (BOOL_FLAGS.has(k)) {
      o[k === 'dry-run' ? 'dryRun' : k] = true;
    } else {
      throw new Bad(`usage: unknown flag --${k}`);
    }
  }
  if (o.date !== undefined) {
    const ok = DATE_RE.test(o.date) && !Number.isNaN(Date.parse(`${o.date}T00:00:00Z`)) && new Date(`${o.date}T00:00:00Z`).toISOString().startsWith(o.date);
    if (!ok) throw new Bad('usage: --date must be a real date written YYYY-MM-DD');
  }
  return o;
}

const USAGE = 'usage: scaffold.mjs name <goal> | capture <name> <ask> | check-bundle <file> | answer <name> --from <path|-> | activate <name> --spec <path|-> | retry <name> --change <text> | propose <name> | promote-commit <name> --edits <path|->';

const out = (s) => process.stdout.write(`${s}\n`);
const err = (s) => process.stderr.write(`${s}\n`);

// ---------- name ----------

function cmdName(o) {
  const root = getRoot(o, true);
  const base = slugName(o.pos.slice(1).join(' '));
  let name = base;
  for (let n = 2; nameTaken(root, name); n++) name = `${base}-${n}`;
  out(name);
}

// ---------- capture ----------

function cmdCapture(o) {
  const root = getRoot(o, true);
  const name = o.pos[1];
  if (name === undefined) throw new Bad('usage: capture <name> <ask words...> | capture <name> --ask <path|->');
  checkName(name);
  const words = o.pos.slice(2);
  if (o.ask !== undefined && words.length) throw new Bad('usage: give the ask as words or with --ask, not both');
  const ask = collapse(o.ask !== undefined ? readInput(o.ask, root, 'the ask') : words.join(' '));
  if (!ask) throw new Bad('the ask is empty; say what the work is in your own words');
  const date = o.date ?? todayLocal();
  const fd = path.join(root, '.flightdeck');
  const mf = path.join(fd, 'workshops.md');
  if (parseManifest(readText(mf) ?? '').entries.some((e) => e.name === name)) throw new Refuse(`${name} is already in workshops.md; pick another name, or activate it with /flight:workshop ${name}`);
  if (fs.existsSync(path.join(fd, name))) throw new Refuse(`the folder .flightdeck/${name}/ already exists`);
  if (fs.existsSync(path.join(fd, `${name}.activate.md`))) throw new Refuse(`.flightdeck/${name}.activate.md already exists`);
  const line = `- ${name}: ${ask} (${date})`;
  const dirExisted = isDir(fd);
  const old = readText(mf);
  let text = old ?? MANIFEST_HEADER;
  if (text.length && !text.endsWith('\n')) text += '\n';
  text += `${line}\n`;
  fs.mkdirSync(fd, { recursive: true });
  fs.writeFileSync(mf, text);
  const back = parseManifest(readText(mf) ?? '').entries.find((e) => e.name === name);
  if (!back || back.ask !== ask || back.date !== date) {
    if (old === null) { fs.rmSync(mf, { force: true }); if (!dirExisted) { try { fs.rmdirSync(fd); } catch { /* not empty */ } } } else fs.writeFileSync(mf, old);
    throw new Bad('the line could not be read back as written (the ask may contain comment marks); nothing was changed');
  }
  if (o.json) out(JSON.stringify({ name, ask, date, line })); else out(line);
}

// ---------- check-bundle ----------

// Question blocks: a block starts at `## q<n>: <text>` and runs to the next line starting `## `.
export function parseQBlocks(lines) {
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = /^##\s+q(\d+)\b\s*:?\s*(.*)$/i.exec(lines[i]);
    if (!m) continue;
    let end = i + 1;
    while (end < lines.length && !/^##\s/.test(lines[end])) end++;
    blocks.push({ n: Number(m[1]), id: `q${m[1]}`, text: m[2].trim(), start: i, end });
  }
  return blocks;
}

export function checkBundle(text) {
  const lines = toLines(text);
  const blocks = parseQBlocks(lines);
  const results = [];
  const add = (name, reason) => results.push({ name, ok: !reason, reason: reason || '' });
  add('count', blocks.length >= 1 && blocks.length <= 5 ? '' : `${blocks.length} questions; a bundle has 1 to 5`);
  const wrong = blocks.filter((b, i) => b.n !== i + 1).map((b) => b.id);
  add('numbering', wrong.length ? `questions must run q1 to q${blocks.length} in order; out of place: ${wrong.join(', ')}` : '');
  const missing = [];
  for (const b of blocks) {
    const body = lines.slice(b.start + 1, b.end);
    for (const f of ['why', 'options', 'recommended', 'asked']) {
      if (!body.some((l) => new RegExp(`^\\s*${f}:\\s*\\S`, 'i').test(l))) missing.push(`${b.id} has no ${f}:`);
    }
    if (!body.some((l) => /^\s*answer:/i.test(l))) missing.push(`${b.id} has no answer: line`);
  }
  add('fields', missing.join('; '));
  const weak = blocks.filter((b) => /weakest part/i.test(b.text)).length;
  add('weakest-part', weak === 1 ? '' : `${weak} questions say "weakest part"; exactly one must`);
  const bad = blocks.filter((b) => NO_APPROVAL.test(b.text)).map((b) => b.id);
  add('no-approval', bad.length ? `${bad.join(', ')} asks the owner to approve or confirm agent-written text` : '');
  return results;
}

function cmdCheckBundle(o) {
  const file = o.pos[1];
  if (!file) throw new Bad('usage: check-bundle <file>');
  const text = readText(path.resolve(file));
  if (text === null) throw new Bad(`cannot read ${file}`);
  const results = checkBundle(text);
  for (const r of results) out(r.ok ? `pass ${r.name}` : `FAIL ${r.name}: ${r.reason}`);
  const passed = results.filter((r) => r.ok).length;
  out(`${passed}/${results.length} passed`);
  return passed === results.length ? 0 : 1;
}

// ---------- answer ----------

function cmdAnswer(o) {
  const root = getRoot(o, false);
  const name = o.pos[1];
  if (!name || o.from === undefined) throw new Bad('usage: answer <name> --from <path|->');
  checkName(name);
  const file = path.join(root, '.flightdeck', `${name}.activate.md`);
  const old = readText(file);
  if (old === null) throw new Refuse(`.flightdeck/${name}.activate.md is missing; run /flight:workshop ${name} first`);
  const reply = toLines(readInput(o.from, root, 'the reply'));
  const at = reply.findIndex((l) => l.startsWith('FlightDeck answers for workshop '));
  if (at < 0) throw new Refuse('the reply has no line starting "FlightDeck answers for workshop "');
  const named = reply[at].slice('FlightDeck answers for workshop '.length).split(':')[0].trim();
  if (named !== name) throw new Refuse(`the reply is for workshop ${named || '(none)'}, not ${name}`);
  const date = o.date ?? todayLocal();
  const lines = toLines(old);
  let notes = null;
  let seen = 0;
  const warnings = [];
  for (const l of reply.slice(at + 1)) {
    const q = /^\s*q(\d+)\s*:\s*(.*)$/i.exec(l);
    if (q) {
      seen++;
      const value = q[2].trim();
      if (value === '' || /^\(unanswered\)$/i.test(value)) continue;
      const block = parseQBlocks(lines).find((b) => b.n === Number(q[1]));
      if (!block) { warnings.push(`q${q[1]} has no question in the file, ignored`); continue; }
      let idx = -1;
      for (let i = block.start + 1; i < block.end; i++) if (/^\s*answer:/i.test(lines[i])) { idx = i; break; }
      if (idx >= 0) lines[idx] = `answer: ${value}`;
      else {
        let last = block.end - 1;
        while (last > block.start && lines[last].trim() === '') last--;
        lines.splice(last + 1, 0, `answer: ${value}`);
      }
      continue;
    }
    const n = /^\s*Other notes\s*:\s*(.*)$/i.exec(l);
    if (n) { seen++; notes = n[1].trim(); }
  }
  if (!seen) throw new Bad('the reply has no q<n>: lines and no Other notes: line');
  if (notes && !/^none$/i.test(notes)) {
    const text = `Other notes (${date}): ${notes}`;
    const old2 = lines.findIndex((l) => l.startsWith('Other notes ('));
    if (old2 >= 0) lines[old2] = text;
    else {
      const first = parseQBlocks(lines)[0];
      lines.splice(first ? first.start : lines.length, 0, text, '');
    }
  }
  fs.writeFileSync(file, fromLines(lines));
  for (const w of warnings) err(`warning: ${w}`);
  const q = parseQuestions(fromLines(lines));
  out(`answered ${q.questions.length - q.open}, open ${q.open}`);
  deleteHandoff(o.from, root, path.join(root, '.flightdeck', `${name}.answers.txt`));
}

// ---------- activate ----------

function textField(v, label, { required = false } = {}) {
  if (typeof v !== 'string') throw new Bad(`the spec field ${label} must be text`);
  const s = collapse(v);
  if (required && !s) throw new Bad(`the spec field ${label} must not be empty`);
  if (s.includes('<!--')) throw new Bad(`the spec field ${label} must not contain "<!--"`);
  if (/^(`{3,}|~{3,})/.test(s)) throw new Bad(`the spec field ${label} must not start with a code fence`);
  return s;
}

function readSpec(text) {
  let spec;
  try { spec = JSON.parse(text); } catch { throw new Bad('the spec is not valid JSON'); }
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) throw new Bad('the spec must be a JSON object');
  const list = (v, label) => { if (v === undefined) return []; if (!Array.isArray(v)) throw new Bad(`the spec field ${label} must be a list`); return v; };
  const res = {
    title: spec.title === undefined ? '' : textField(spec.title, 'title'),
    work: textField(spec.work, 'work', { required: true }),
    done: textField(spec.done, 'done', { required: true }),
    context: list(spec.context, 'context').map((s, i) => textField(s, `context[${i}]`)).filter(Boolean),
    checks: list(spec.checks, 'checks').map((c, i) => {
      if (!c || typeof c !== 'object' || Array.isArray(c)) throw new Bad(`the spec field checks[${i}] must be an object with command and passing`);
      if (typeof c.command === 'string' && c.command.includes('`')) throw new Bad(`the spec field checks[${i}].command must not contain a backtick`);
      return { command: textField(c.command, `checks[${i}].command`, { required: true }), passing: textField(c.passing, `checks[${i}].passing`, { required: true }) };
    }),
    questions: list(spec.questions, 'questions').map((s, i) => textField(s, `questions[${i}]`)).filter(Boolean),
  };
  return res;
}

// Inserts items after the comment under a `## <section>` heading of a verify.md template.
function insertUnder(lines, section, items) {
  if (!items.length) return;
  const h = lines.findIndex((l) => l.trim().toLowerCase() === `## ${section}`);
  if (h < 0) throw new Error(`the verify template has no ## ${section} heading`);
  let end = lines.length;
  for (let i = h + 1; i < lines.length; i++) if (/^##\s/.test(lines[i])) { end = i; break; }
  let at = h + 1;
  for (let i = h + 1; i < end; i++) if (lines[i].includes('-->')) at = i + 1;
  lines.splice(at, 0, '', ...items);
}

function cmdActivate(o) {
  const root = getRoot(o, false);
  const name = o.pos[1];
  if (!name || o.spec === undefined) throw new Bad('usage: activate <name> --spec <path|-> [--questions-from <path>]');
  checkName(name);
  const fd = path.join(root, '.flightdeck');
  if (!parseManifest(readText(path.join(fd, 'workshops.md')) ?? '').entries.some((e) => e.name === name)) {
    throw new Refuse(`${name} is not in workshops.md; capture it first with /flight:capture`);
  }
  const final = path.join(fd, name);
  if (fs.existsSync(final)) {
    const state = listWorkshops(root).workshops.find((w) => w.name === name)?.state;
    throw new Refuse(`workshop ${name} is already ${state === 'settled' ? 'settled' : 'active'}; its folder .flightdeck/${name}/ exists`);
  }
  const spec = readSpec(readInput(o.spec, root, 'the spec'));
  const title = spec.title || name;

  let questions = null;
  if (o['questions-from'] !== undefined) {
    const lines = toLines(readInput(o['questions-from'], root, 'the questions file'));
    const blocks = parseQBlocks(lines);
    if (!blocks.length) throw new Bad('the questions file has no ## q<n>: blocks');
    const chunks = blocks.map((b) => {
      const body = lines.slice(b.start, b.end).filter((l) => !l.startsWith('Other notes ('));
      while (body.length && body[body.length - 1].trim() === '') body.pop();
      return body.join('\n');
    });
    questions = { chunks, notes: lines.find((l) => l.startsWith('Other notes (')) ?? null };
  }

  const card = template('workshop.md').split('\n').map((l) => {
    if (l.startsWith('work:')) return `work: ${spec.work}`;
    if (l.startsWith('done:')) return `done: ${spec.done}`;
    return l.replace('<title>', () => title);
  }).join('\n');
  let context = template('context.md', name);
  if (spec.context.length) context += `\n${spec.context.join('\n\n')}\n`;
  const vl = toLines(template('verify.md', name));
  insertUnder(vl, 'questions', spec.questions.map((q) => `- ${q}`));
  insertUnder(vl, 'checks', spec.checks.map((c) => `- \`${c.command}\`: ${c.passing}`));
  const files = { 'workshop.md': card, 'context.md': context, 'verify.md': fromLines(vl) };
  if (questions) {
    let q = template('questions.md', name);
    q += '\n';
    if (questions.notes) q += `${questions.notes}\n\n`;
    q += `${questions.chunks.join('\n\n')}\n`;
    files['questions.md'] = q;
  }

  const tmp = path.join(fd, `.${name}.activating`);
  try {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(tmp, f), text);
    fs.renameSync(tmp, final);
  } catch (e) {
    fs.rmSync(tmp, { recursive: true, force: true });
    throw new Bad(`could not write the folder: ${e.message}`);
  }
  deleteHandoff(o.spec, root, path.join(fd, `${name}.spec.json`));
  if (questions) deleteHandoff(o['questions-from'], root, path.join(fd, `${name}.activate.md`));
  const written = Object.keys(files).map((f) => `.flightdeck/${name}/${f}`);
  if (o.json) out(JSON.stringify({ name, files: written })); else for (const f of written) out(f);
}

// ---------- retry ----------

function cmdRetry(o) {
  const root = getRoot(o, false);
  const name = o.pos[1];
  if (!name) throw new Bad('usage: retry <name> [--group <g>] --change <text> [--change <text> ...]');
  checkName(name);
  const changes = o.change.map(collapse).filter(Boolean);
  if (!changes.length) throw new Bad('usage: retry needs at least one --change <text> naming what changed');
  if (o.group !== undefined && !GROUP_RE.test(o.group)) throw new Bad('usage: --group must be lowercase words joined by hyphens, with / between levels (for example pr-3)');
  const dir = path.join(root, '.flightdeck', name);
  if (!isDir(dir)) throw new Refuse(`workshop ${name} is not active; activate it with /flight:workshop ${name}`);
  if (SETTLED_RE.test(stripNoise(readText(path.join(dir, 'workshop.md')) ?? ''))) err(`warning: ${name} is settled; retrying anyway`);
  let group;
  if (o.group !== undefined) group = o.group;
  else {
    const latest = latestAttempts(dir);
    if (!latest.length || latest.some((g) => g.group === '')) group = '';
    else if (latest.length === 1) group = latest[0].group;
    else throw new Refuse(`workshop ${name} has attempts in several groups (${latest.map((g) => g.group).join(', ')}); name one: /flight:retry ${name} <group>`);
  }
  const gdir = path.join(dir, 'attempts', ...(group ? group.split('/') : []));
  let high = 0;
  try {
    for (const e of fs.readdirSync(gdir, { withFileTypes: true })) {
      const m = e.isDirectory() ? /^a([1-9]\d*)$/.exec(e.name) : null;
      if (m) high = Math.max(high, Number(m[1]));
    }
  } catch { /* no attempts yet */ }
  const k = high + 1;
  const attempt = path.join(gdir, `a${k}`);
  if (fs.existsSync(attempt)) throw new Refuse(`${path.relative(root, attempt)} already exists`);
  const date = o.date ?? todayLocal();
  const branch = `${name}-${group ? `${group.replace(/\//g, '-')}-` : ''}a${k}`;
  const rel = ['.flightdeck', name, 'attempts', ...(group ? group.split('/') : []), `a${k}`].join('/');
  const prev = k > 1 ? path.join(gdir, `a${k - 1}`) : null;
  const prevBrief = prev ? (readText(path.join(prev, 'brief.md')) ?? '').trim() : '';
  const prevFindings = prev ? (readText(path.join(prev, 'findings.md')) ?? '').trim() : '';
  const lines = [`# Attempt a${k} of workshop ${name}`, '', ...changes.map((c) => `The change: ${c}`), '',
    `Opened ${date} by /flight:retry. Branch for this attempt: ${branch}.`, '',
    '## Carried over', '',
    "Setup comes from the workshop's constraints.md, context.md and verify.md, read fresh when the attempt runs. Run output (code, report, log) is not carried over.", '',
    prev ? `Previous attempt: attempts/${group ? `${group}/` : ''}a${k - 1}/` :'Previous attempt: none; this is the first attempt.', '',
    '## Previous brief', '', prevBrief ? demoteHeadings(prevBrief) : 'none', '',
    prev ? `## Findings from a${k - 1}` : '## Findings from the previous attempt', '', prevFindings ? demoteHeadings(prevFindings) : 'none written'];
  fs.mkdirSync(attempt, { recursive: true });
  try { fs.writeFileSync(path.join(attempt, 'brief.md'), fromLines(lines)); } catch (e) { fs.rmSync(attempt, { recursive: true, force: true }); throw new Bad(`could not write the brief: ${e.message}`); }
  if (o.json) out(JSON.stringify({ name, group, attempt: `a${k}`, path: rel, branch })); else out(rel);
}

// ---------- propose ----------

function nextPromoteK(root, name) {
  const r = git(root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes']);
  if (!r.ok) return 1;
  const re = new RegExp(`(?:^|/)${name.replace(/[^a-z0-9-]/g, '\\$&')}-promote-a(\\d+)$`);
  let high = 0;
  for (const ref of r.out.split('\n')) { const m = re.exec(ref.trim()); if (m) high = Math.max(high, Number(m[1])); }
  return high + 1;
}

function cmdPropose(o) {
  const root = getRoot(o, false);
  const name = o.pos[1];
  if (!name) throw new Bad('usage: propose <name> [--json]');
  checkName(name);
  const dir = path.join(root, '.flightdeck', name);
  if (!isDir(dir)) throw new Refuse(`workshop ${name} is not active, so there is nothing to promote`);
  const m = SETTLED_RE.exec(stripNoise(readText(path.join(dir, 'workshop.md')) ?? ''));
  if (!m) throw new Refuse(`workshop ${name} is not settled; write settled: <YYYY-MM-DD> as the last line of its workshop.md, or tell the pilot 'settle ${name}'`);
  const settled = m[1];
  const own = fs.existsSync(path.join(root, 'flightdeck', '.claude-plugin', 'plugin.json'));
  const warnings = [];
  const candidates = [];
  const add = (source, kind, line, target, heading) => candidates.push({ source, kind, line, target, heading });
  const dec = parseDecisions(readText(path.join(dir, 'decisions.md')) ?? '');
  warnings.push(...dec.warnings);
  for (const d of dec.decisions) add('decisions.md', 'decision', `- ${d.date}: ${d.text}`, 'CLAUDE.md', '## Decisions');
  for (const l of toLines(stripNoise(readText(path.join(dir, 'context.md')) ?? ''))) {
    if (l.trim() && !l.trim().startsWith('#')) add('context.md', 'context', l.trim(), 'CLAUDE.md', '');
  }
  const ver = parseVerify(readText(path.join(dir, 'verify.md')) ?? '');
  warnings.push(...ver.warnings);
  for (const c of ver.checks) add('verify.md', 'check', `- \`${c}\``, 'CLAUDE.md', '## Checks');
  for (const q of ver.questions) add('verify.md', 'question', `- ${q}`, own ? 'flightdeck/rubric.md' : 'CLAUDE.md', own ? '## Owner fit' : '## Checks');
  const branch = `${name}-promote-a${nextPromoteK(root, name)}`;
  const b = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const base = b.ok && b.out.trim() ? b.out.trim() : null;
  if (o.json) { out(JSON.stringify({ name, settled, branch, base, flightdeckRepo: own, candidates, warnings })); return; }
  out(`workshop ${name} (settled ${settled})`);
  out(`branch: ${branch}`);
  out(`base: ${base}`);
  for (const c of candidates) out(`- [${c.source}] ${c.line} -> ${c.target} (${c.heading})`);
  for (const w of warnings) err(`warning: ${w}`);
}

// ---------- promote-commit ----------

// Puts `line` under `heading` (after the last non-blank line of that section) in an array of lines.
// Appends the heading and the line when the heading is absent, or just the line without a heading.
// Returns false, changing nothing, when the line is already there.
export function insertLine(lines, heading, line) {
  if (lines.some((l) => l.trimEnd() === line)) return false;
  const append = (...items) => { lines.push(...items); return true; };
  if (!heading) return append(line);
  let fence = null;
  const heads = [];
  lines.forEach((l, i) => {
    const f = /^\s*(`{3,}|~{3,})/.exec(l);
    if (fence) { if (f && f[1][0] === fence[0] && f[1].length >= fence.length) fence = null; return; }
    if (f) { fence = f[1]; return; }
    const m = /^(#{1,6})\s/.exec(l);
    if (m) heads.push({ i, level: m[1].length, text: l.trimEnd() });
  });
  const h = heads.find((x) => x.text === heading);
  if (!h) {
    if (lines.length && lines[lines.length - 1].trim() !== '') lines.push('');
    return append(heading, '', line);
  }
  const next = heads.find((x) => x.i > h.i && x.level <= h.level);
  const end = next ? next.i : lines.length;
  let last = -1;
  for (let i = h.i + 1; i < end; i++) if (lines[i].trim() !== '') last = i;
  if (last >= 0) { lines.splice(last + 1, 0, line); return true; }
  const items = ['', line];
  if (end < lines.length && lines[h.i + 1] !== '') items.push('');
  lines.splice(h.i + 1, 0, ...items);
  return true;
}

function badTarget(t) {
  const n = t.replace(/\\/g, '/').replace(/^(\.\/)+/, '');
  const low = n.toLowerCase();
  if (!n || n.startsWith('/') || /^[a-zA-Z]:/.test(n)) return 'is an absolute path';
  if (n.includes('..')) return 'contains ".."';
  if (['.claude/', 'dev/', '.git/', 'library/source/'].some((p) => low.startsWith(p))) return 'is under .claude/, dev/, .git/ or library/source/';
  if (low.split('/').includes('.claude-plugin')) return 'is under a .claude-plugin/ folder';
  if (!low.endsWith('.md')) return 'is not a .md file; a promotion only adds lines to markdown files';
  const base = low.slice(low.lastIndexOf('/') + 1);
  if (base === 'intent.md' || base === 'history.md') return 'is an INTENT.md or HISTORY.md, which only the owner writes';
  if (low.endsWith('constraints.md')) return 'is a constraints.md, which only the owner writes';
  if (low === '.flightdeck/vision.md') return 'is a file that only the owner writes';
  return '';
}

function cmdPromoteCommit(o) {
  const root = getRoot(o, false);
  const name = o.pos[1];
  if (!name || o.edits === undefined) throw new Bad('usage: promote-commit <name> --edits <path|-> [--dry-run] [--keep] [--base <ref>] [--branch <name>]');
  checkName(name);
  let edits;
  try { edits = JSON.parse(readInput(o.edits, root, 'the edits')); } catch (e) { if (e instanceof Bad) throw e; throw new Bad('the edits are not valid JSON'); }
  if (!Array.isArray(edits) || !edits.length) throw new Bad('the edits must be a non-empty JSON list of {target, heading?, line}');
  const suffix = ` (from workshop ${name})`;
  const clean = edits.map((e, i) => {
    if (!e || typeof e !== 'object' || typeof e.target !== 'string' || typeof e.line !== 'string' || (e.heading !== undefined && typeof e.heading !== 'string')) {
      throw new Bad(`edit ${i + 1} must be an object with a text target and line (and optionally a heading)`);
    }
    const target = e.target.replace(/\\/g, '/').replace(/^(\.\/)+/, '');
    const why = badTarget(e.target);
    if (why) throw new Refuse(`target "${e.target}" ${why}`);
    const line = e.line.trim();
    if (!line || /[\r\n]/.test(e.line.trim())) throw new Refuse(`edit ${i + 1} must be one non-empty line`);
    const heading = (e.heading ?? '').trim();
    if (heading && (/[\r\n]/.test(heading) || !/^#{1,6}\s/.test(heading))) throw new Bad(`edit ${i + 1} heading must be one markdown heading line such as "## Decisions"`);
    return { target, heading, raw: line, line: line.endsWith(suffix) ? line : `${line}${suffix}` };
  });
  const dry = !!o.dryRun;
  let branch = o.branch;
  if (!dry) {
    if (!branch) throw new Refuse('a real run needs --branch <name>-promote-a<k>');
    if (!new RegExp(`^${name.replace(/[^a-z0-9-]/g, '\\$&')}-promote-a[1-9]\\d*$`).test(branch)) throw new Refuse(`branch "${branch}" must look like ${name}-promote-a<k>`);
    if (!git(root, ['rev-parse', '--git-dir']).ok) throw new Refuse('this folder is not inside a git repository');
    if (git(root, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]).ok) throw new Refuse(`branch ${branch} already exists`);
  }
  const baseRef = o.base || 'HEAD';
  const resolved = git(root, ['rev-parse', '--verify', '--quiet', `${baseRef}^{commit}`]);
  const baseCommit = resolved.ok ? resolved.out.trim() : null;
  if (!baseCommit && !dry) throw new Refuse(`base ${baseRef} was not found in this repository`);
  if (!baseCommit) err(`warning: base ${baseRef} was not found; every target is treated as a new file`);

  const targets = [];
  for (const e of clean) if (!targets.find((t) => t.target === e.target)) targets.push({ target: e.target, mode: '100644', lines: [], inserted: [] });
  for (const t of targets) {
    if (!baseCommit) continue;
    const ls = git(root, ['ls-tree', '--full-tree', baseCommit, '--', t.target]);
    const row = /^(\d+) (\w+) [0-9a-f]+\t/.exec(ls.out.split('\n')[0] || '');
    if (!row) continue;
    if (row[2] !== 'blob' || row[1] === '120000') throw new Refuse(`target "${t.target}" is not a plain file in ${baseRef}`);
    t.mode = row[1];
    const shown = git(root, ['show', `${baseCommit}:${t.target}`]);
    if (!shown.ok) throw new Bad(`cannot read ${t.target} from ${baseRef}: ${shown.err}`);
    const text = shown.out.replace(/\r\n?/g, '\n');
    const fm = /^---\n([\s\S]*?)\n---(\n|$)/.exec(text);
    if (fm && /^write:\s*["']?human["']?\s*$/m.test(fm[1])) throw new Refuse(`target "${t.target}" is marked write: human, so only the owner edits it`);
    t.lines = toLines(text);
  }
  for (const e of clean) {
    const t = targets.find((x) => x.target === e.target);
    if (t.lines.some((l) => l.trimEnd() === e.raw)) { err(`warning: skipped, already in ${e.target}: ${e.raw}`); continue; }
    if (insertLine(t.lines, e.heading, e.line)) t.inserted.push(e); else err(`warning: skipped, already in ${e.target}: ${e.line}`);
  }
  const changed = targets.filter((t) => t.inserted.length);

  if (dry) {
    for (const t of changed) {
      out(`--- ${t.target}`);
      for (const e of t.inserted) {
        if (e.heading) out(`  under ${e.heading}`);
        out(`+ ${e.line}`);
      }
    }
    if (!changed.length) out('nothing to add: every line is already there');
  } else {
    if (!changed.length) throw new Refuse('nothing to promote: every line is already in its target');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fd-index-'));
    try {
      const env = { ...process.env, GIT_INDEX_FILE: path.join(tmp, 'index') };
      const run = (args, input) => {
        const r = git(root, args, { env, input });
        if (!r.ok) throw new Bad(`git ${args[0]} failed: ${r.err}`);
        return r.out.trim();
      };
      run(['read-tree', baseCommit]);
      for (const t of changed) {
        const sha = run(['hash-object', '-w', '--stdin'], fromLines(t.lines));
        run(['update-index', '--add', '--cacheinfo', `${t.mode},${sha},${t.target}`]);
      }
      const tree = run(['write-tree']);
      const commit = run(['commit-tree', tree, '-p', baseCommit, '-m', `Promote from workshop ${name}`, '-m', 'Lines proposed for global relevance by /flight:promote. The owner merges, edits or closes the pull request.']);
      run(['update-ref', `refs/heads/${branch}`, commit, '']);
      out(`branch ${branch} commit ${commit} files ${changed.length}`);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
  if (!o.keep) deleteHandoff(o.edits, root, path.join(root, '.flightdeck', `${name}.promote.json`));
}

// ---------- main ----------

function main(argv) {
  const o = parseArgs(argv);
  if (o.help) { out(USAGE); return 0; }
  const sub = o.pos[0];
  if (!sub) throw new Bad(USAGE);
  switch (sub) {
    case 'name': cmdName(o); return 0;
    case 'capture': cmdCapture(o); return 0;
    case 'check-bundle': return cmdCheckBundle(o);
    case 'answer': cmdAnswer(o); return 0;
    case 'activate': cmdActivate(o); return 0;
    case 'retry': cmdRetry(o); return 0;
    case 'propose': cmdPropose(o); return 0;
    case 'promote-commit': cmdPromoteCommit(o); return 0;
    default: throw new Bad(`usage: unknown subcommand "${sub}". ${USAGE}`);
  }
}

export function run(argv) {
  try {
    return main(argv);
  } catch (e) {
    if (e instanceof Refuse) { err(`refused: ${e.message}`); return 1; }
    const msg = String(e && e.message ? e.message : e);
    err(/^(usage|error):/.test(msg) ? msg : `error: ${msg}`);
    return 2;
  }
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) process.exitCode = run(process.argv.slice(2));
