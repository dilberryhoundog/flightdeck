#!/usr/bin/env node
// FlightDeck shared reader: the workshop manifest, questions, verify and decisions parsers,
// the latest-attempt rule, the workshop list and the scoped block that agents working in one
// workshop receive. Dependency-free; every function returns warnings instead of throwing.
//
// Command line:
//   node workshops.mjs scope <name> [--json] [--root <dir>]
//   node workshops.mjs list [--json] [--root <dir>]
// The root defaults to findRoot(CLAUDE_PROJECT_DIR || cwd). Exit code is 0 in every case.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const NAME_RE = /^[a-z0-9-]+$/;
const SCOPE_LIMIT = 6000;
const SCOPE_FILES = ['constraints.md', 'context.md', 'verify.md'];

// Removes HTML comments and fenced code blocks, so format examples are never counted.
export function stripNoise(text) {
  let s = String(text ?? '').replace(/\r\n?/g, '\n');
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<!--[\s\S]*$/, '');
  const out = [];
  let fence = null;
  for (const line of s.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && /^\s*(`+|~+)\s*$/.test(line)) fence = null;
      continue;
    }
    if (m) { fence = m[1]; continue; }
    out.push(line);
  }
  return out.join('\n');
}

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

// Manifest: `- <name>: <ask> (<YYYY-MM-DD>)`. Name is the text before the first ': ',
// the date is the last (YYYY-MM-DD) at the end of the line, the ask is everything between.
export function parseManifest(text) {
  const entries = [];
  const warnings = [];
  const seen = new Set();
  for (const raw of stripNoise(text).split('\n')) {
    if (!raw.startsWith('- ')) continue;
    const rest = raw.slice(2).trimEnd();
    const i = rest.indexOf(': ');
    if (i < 0) { warnings.push(`manifest line has no ": " after the name, skipped: ${raw.trim()}`); continue; }
    const name = rest.slice(0, i).trim();
    if (!NAME_RE.test(name)) { warnings.push(`manifest name "${name}" is not lowercase letters, digits and hyphens, skipped`); continue; }
    if (seen.has(name)) { warnings.push(`manifest lists ${name} more than once, the first line is used`); continue; }
    seen.add(name);
    let ask = rest.slice(i + 2).trim();
    let date = null;
    const m = /\((\d{4}-\d{2}-\d{2})\)\s*$/.exec(ask);
    if (m) { date = m[1]; ask = ask.slice(0, m.index).trim(); }
    else warnings.push(`manifest line for ${name} has no (YYYY-MM-DD) date at the end`);
    entries.push({ name, ask, date });
  }
  return { entries, warnings };
}

// Questions: blocks `## q<n>: <question>` with an `answer:` line (empty while open) and an
// optional `ask-later:` line. A question held with a non-empty ask-later is not counted as open.
export function parseQuestions(text) {
  const warnings = [];
  const blocks = [];
  let cur = null;
  const key = (line, name) => new RegExp(`^\\s*(?:[-*]\\s+)?${name}:(.*)$`, 'i').exec(line);
  for (const line of stripNoise(text).split('\n')) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      const q = /^q(\d+)\b(\s*:)?\s*(.*)$/i.exec(h[1].trim());
      if (q) {
        cur = { id: `q${q[1]}`, text: q[3].trim(), answer: null, askLater: '' };
        if (!q[2]) warnings.push(`${cur.id}: heading has no ":" after the number`);
        blocks.push(cur);
      } else {
        cur = null;
        warnings.push(`heading "${line.trim()}" is not a question (## q<n>: ...), ignored`);
      }
      continue;
    }
    if (!cur) continue;
    let m = key(line, 'answer');
    if (m) { if (cur.answer === null) cur.answer = m[1].trim(); continue; }
    m = key(line, 'ask-later');
    if (m) cur.askLater = m[1].trim();
  }
  let open = 0;
  let heldForLater = 0;
  const questions = blocks.map(b => {
    if (b.answer === null) warnings.push(`${b.id}: no "answer:" line, counted as open`);
    const unanswered = b.answer === null || b.answer === '';
    const held = unanswered && b.askLater !== '';
    const isOpen = unanswered && !held;
    if (isOpen) open++;
    if (held) heldForLater++;
    return { id: b.id, text: b.text, open: isOpen, askLater: b.askLater !== '' };
  });
  return { questions, open, heldForLater, warnings };
}

// Verify: `## checks` lines `- \`<command>\`: <what passing looks like>` and `## questions` lines.
export function parseVerify(text) {
  const warnings = [];
  const checks = [];
  const questions = [];
  let section = null;
  for (const line of stripNoise(text).split('\n')) {
    const h = /^##\s+(.*?)\s*$/.exec(line);
    if (h) { section = h[1].toLowerCase(); continue; }
    if (!line.startsWith('- ')) continue;
    const item = line.slice(2).trim();
    if (!item) continue;
    if (section === 'checks') {
      const m = /`([^`]+)`/.exec(item);
      if (m) checks.push(m[1]);
      else { checks.push(item); warnings.push(`check line has no backticked command, taken whole: ${item}`); }
    } else if (section === 'questions') {
      questions.push(item);
    }
  }
  return { checks, questions, warnings };
}

// Decisions: `- <YYYY-MM-DD>: <decision>. Reason: <one line>.`
export function parseDecisions(text) {
  const warnings = [];
  const decisions = [];
  for (const line of stripNoise(text).split('\n')) {
    if (!line.startsWith('- ')) continue;
    const m = /^-\s+(\d{4}-\d{2}-\d{2}):\s*(.*)$/.exec(line);
    if (m) decisions.push({ date: m[1], text: m[2].trim() });
    else warnings.push(`decision line does not start with "- <YYYY-MM-DD>: ": ${line.trim()}`);
  }
  return { decisions, warnings };
}

// Latest attempt per parent-folder group: folders named a<k> at any depth under attempts/.
export function latestAttempts(workshopDir) {
  const groups = new Map();
  const walk = (dir, rel, depth) => {
    let ents;
    try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of ents) {
      if (!e.isDirectory()) continue;
      const m = /^a([1-9]\d*)$/.exec(e.name);
      if (m) {
        const k = Number(m[1]);
        const cur = groups.get(rel);
        if (!cur || k > cur.k) groups.set(rel, { group: rel, name: e.name, k, label: rel ? `${rel}/${e.name}` : e.name });
      }
      if (depth < 6) walk(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name, depth + 1);
    }
  };
  walk(path.join(workshopDir, 'attempts'), '', 0);
  return [...groups.values()].sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
}

// Lists workshops: manifest order first, then folders with a workshop.md that the manifest lacks.
// `captured` is the number of workshops in the captured state (pending activation included).
// State is derived: no folder = captured; folder = active; settled line in workshop.md = settled.
export function listWorkshops(root) {
  const warnings = [];
  const fd = path.join(root, '.flightdeck');
  const manifest = parseManifest(readText(path.join(fd, 'workshops.md')) ?? '');
  warnings.push(...manifest.warnings);
  const describe = (name, ask, date) => {
    const dir = path.join(fd, name);
    const w = { name, ask, date, state: 'captured', pendingActivation: false, settled: null, attempts: [], openQuestions: 0, heldForLater: 0 };
    if (!isDir(dir)) {
      w.pendingActivation = fs.existsSync(path.join(fd, `${name}.activate.md`));
      return w;
    }
    w.state = 'active';
    const card = stripNoise(readText(path.join(dir, 'workshop.md')) ?? '');
    const s = /^settled:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(card);
    if (s) { w.state = 'settled'; w.settled = s[1]; }
    w.attempts = latestAttempts(dir);
    const q = parseQuestions(readText(path.join(dir, 'questions.md')) ?? '');
    w.openQuestions = q.open;
    w.heldForLater = q.heldForLater;
    warnings.push(...q.warnings.map(x => `${name}: ${x}`));
    return w;
  };
  const workshops = manifest.entries.map(e => describe(e.name, e.ask, e.date));
  const listed = new Set(manifest.entries.map(e => e.name));
  let names = [];
  try { names = fs.readdirSync(fd, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name).sort(); } catch { /* none */ }
  for (const name of names) {
    if (listed.has(name) || !NAME_RE.test(name)) continue;
    if (!fs.existsSync(path.join(fd, name, 'workshop.md'))) continue;
    warnings.push(`workshop ${name} is not in workshops.md`);
    workshops.push(describe(name, '', null));
  }
  const captured = workshops.filter(w => w.state === 'captured').length;
  return { workshops, captured, warnings };
}

// The block handed to agents working in one workshop (plan 5.12). Files are never cut and
// no other workshop is read.
export function scopeBlock(root, name) {
  const empty = { block: '', checks: [], questions: [], warnings: [] };
  try {
    if (typeof name !== 'string' || !NAME_RE.test(name)) {
      return { ...empty, warnings: [`workshop name "${name}" is not valid (lowercase letters, digits and hyphens)`] };
    }
    const dir = path.join(root, '.flightdeck', name);
    if (!isDir(dir)) return { ...empty, warnings: [`workshop ${name} has no folder (captured or unknown)`] };
    const files = {};
    for (const f of SCOPE_FILES) files[f] = readText(path.join(dir, f));
    const warnings = [];
    const total = SCOPE_FILES.reduce((n, f) => n + (files[f] === null ? 0 : files[f].length), 0);
    const sections = [];
    if (total > SCOPE_LIMIT) {
      const w = `Warning: the scoped files for workshop ${name} total ${total} characters, over the 6,000-character default; all three are given whole.`;
      sections.push(w);
      warnings.push(w);
    }
    sections.push(`Workshop ${name}: the following is this workshop's own context and verification, in addition to the global rules. VISION.md and build.txt win on any conflict.`);
    const headings = {
      'constraints.md': `The owner's constraints for workshop ${name} (\`.flightdeck/${name}/constraints.md\`):`,
      'context.md': `Context for workshop ${name} (\`context.md\`):`,
      'verify.md': `Verification for workshop ${name} (\`verify.md\`):`,
    };
    const present = [];
    for (const f of SCOPE_FILES) {
      if (files[f] === null) continue;
      present.push(`.flightdeck/${name}/${f}`);
      sections.push(`${headings[f]}\n${files[f].replace(/\s+$/, '')}`);
    }
    if (present.length) sections.push(`Original files: ${present.join(', ')}`);
    let checks = [];
    let questions = [];
    if (files['verify.md'] !== null) {
      const v = parseVerify(files['verify.md']);
      checks = v.checks;
      questions = v.questions;
      warnings.push(...v.warnings);
    }
    return { block: sections.join('\n\n'), checks, questions, warnings };
  } catch (e) {
    return { ...empty, warnings: [`scope failed: ${e.message}`] };
  }
}

// Walks up from `start` to the first folder that holds `.flightdeck/`, or returns null.
export function findRoot(start) {
  if (!start) return null;
  let dir;
  try { dir = path.resolve(String(start)); } catch { return null; }
  for (;;) {
    if (isDir(path.join(dir, '.flightdeck'))) return dir;
    const up = path.dirname(dir);
    if (up === dir) return null;
    dir = up;
  }
}

function cli(argv) {
  const args = argv.slice(2);
  const flags = { json: false, root: null };
  const pos = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--json') flags.json = true;
    else if (args[i] === '--root') flags.root = args[++i] ?? null;
    else if (args[i].startsWith('--root=')) flags.root = args[i].slice(7);
    else pos.push(args[i]);
  }
  const root = flags.root ? path.resolve(flags.root) : findRoot(process.env.CLAUDE_PROJECT_DIR || process.cwd());
  const [sub, name] = pos;
  if (sub === 'scope' && name) {
    const r = root ? scopeBlock(root, name) : { ...scopeBlock('', ''), warnings: ['no .flightdeck/ folder found'] };
    if (flags.json) process.stdout.write(`${JSON.stringify(r)}\n`);
    else {
      if (r.block) process.stdout.write(`${r.block}\n`);
      for (const w of r.warnings) process.stderr.write(`warning: ${w}\n`);
    }
  } else if (sub === 'list') {
    const r = root ? listWorkshops(root) : { workshops: [], captured: 0, warnings: ['no .flightdeck/ folder found'] };
    if (flags.json) process.stdout.write(`${JSON.stringify(r)}\n`);
    else {
      for (const w of r.workshops) process.stdout.write(`${w.name}  ${w.state}  ${w.ask}\n`);
      for (const w of r.warnings) process.stderr.write(`warning: ${w}\n`);
    }
  } else {
    process.stdout.write('usage: workshops.mjs scope <name> [--json] [--root <dir>] | list [--json] [--root <dir>]\n');
  }
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) {
  try { cli(process.argv); } catch (e) { process.stderr.write(`warning: ${e.message}\n`); }
  process.exitCode = 0;
}
