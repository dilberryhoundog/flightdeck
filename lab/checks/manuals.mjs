#!/usr/bin/env node
// FlightDeck manuals check. No model calls, Node built-ins only.
// Usage: node lab/checks/manuals.mjs [--root <dir>]
// Pages checked: every .md under flightdeck/manuals/, flightdeck/library/ and (when it exists) .flightdeck/manuals/.
// Output: one line per case, "pass <case>" or "FAIL <case>: <reasons>", then warn lines, then "<n>/<m> passed".
// Exit code 0 only when every case passes, 1 when one fails, 2 on a bad argument.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const USAGE = 'usage: node lab/checks/manuals.mjs [--root <dir>]';
const SHELVES = ['operator', 'technical', 'maintenance', 'library', 'index'];
const LINE_LIMIT = 100;
const STALE_DAYS = 30;
const DAY = 86400000;

function parseArgs(argv) {
  const o = { root: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--root') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--root needs a value');
      o.root = v;
    } else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return o;
}

function unquote(s) { return s.trim().replace(/^(["'])(.*)\1$/, '$2'); }

// Frontmatter: text between a first line --- and the next line ---.
// key: value sets a string (quotes removed); an empty key: starts a list of "  - item" lines.
function parseFrontmatter(lines) {
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return null;
  const data = {};
  let listKey = null;
  for (const line of lines.slice(1, end)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) { data[listKey].push(unquote(item[1])); continue; }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2].trim() === '') { data[kv[1]] = []; listKey = kv[1]; } else { data[kv[1]] = unquote(kv[2]); listKey = null; }
  }
  return { data, end };
}

function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return t;
}

function localToday() {
  const n = new Date();
  return Date.UTC(n.getFullYear(), n.getMonth(), n.getDate());
}

function mdFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...mdFiles(p));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
}

const isDir = (p) => existsSync(p) && statSync(p).isDirectory();
const lineCount = (text) => { const n = text.split('\n').length; return text.endsWith('\n') ? n - 1 : n; };

// Which lines are prose: not frontmatter, not inside a fenced block, not inside an HTML comment.
function classify(lines, start) {
  const prose = new Array(lines.length).fill(false);
  let fence = false;
  let comment = false;
  for (let i = start; i < lines.length; i++) {
    const t = lines[i].trimStart();
    if (comment) { if (t.includes('-->')) comment = false; continue; }
    if (t.startsWith('```') || t.startsWith('~~~')) { fence = !fence; continue; }
    if (fence) continue;
    if (t.startsWith('<!--')) { if (!t.includes('-->')) comment = true; continue; }
    prose[i] = true;
  }
  return prose;
}

const STARTERS = /^(#|- |\* |\+ |\d+\. |\||>|<|\[)/;

function wrapProblems(lines, prose, start) {
  const bad = [];
  let prevText = false; // the line above is non-blank prose that is not a heading
  for (let i = start; i < lines.length; i++) {
    if (!prose[i]) { prevText = false; continue; }
    const raw = lines[i];
    const t = raw.trimStart();
    if (raw.trim() === '') { prevText = false; continue; }
    if (prevText && !STARTERS.test(t)) bad.push(`line ${i + 1} continues the line above (hard wrapping)`);
    prevText = !t.startsWith('#');
  }
  return bad;
}

function run(opts) {
  let root = opts.root;
  if (!root) {
    const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
    root = r.status === 0 ? r.stdout.trim() : process.cwd();
  }
  root = path.resolve(root);
  const rel = (f) => path.relative(root, f).split(path.sep).join('/');
  const today = localToday();

  const cases = []; // { name, bad: [] }
  const warns = [];

  const folders = [path.join(root, 'flightdeck/manuals'), path.join(root, 'flightdeck/library')];
  const missing = folders.filter((f) => !isDir(f)).map((f) => `${rel(f)}/ is missing`);
  if (missing.length) cases.push({ name: 'shelves', bad: missing });
  const extra = path.join(root, '.flightdeck/manuals');
  const roots = [...folders, extra].filter(isDir);
  const pageFiles = roots.flatMap(mdFiles);

  const expectedShelf = (f) => {
    const r = rel(f);
    if (path.basename(f) === 'README.md') return 'index';
    const m = /^(?:\.flightdeck|flightdeck)\/manuals\/(operator|technical|maintenance)\//.exec(r);
    if (m) return m[1];
    if (r.startsWith('flightdeck/library/')) return 'library';
    return null;
  };

  const linkTargets = new Map(); // README path -> Set of resolved link targets

  for (const file of pageFiles) {
    const name = rel(file);
    const text = readFileSync(file, 'utf8');
    const lines = text.split('\n').map((l) => l.replace(/\r$/, ''));
    const bad = [];
    const fm = parseFrontmatter(lines);
    const start = fm ? fm.end + 1 : 0;

    if (!fm) bad.push('no frontmatter');
    else {
      const d = fm.data;
      const shelf = typeof d.shelf === 'string' ? d.shelf : '';
      if (!shelf) bad.push('shelf is missing');
      else if (!SHELVES.includes(shelf)) bad.push(`shelf "${shelf}" is not one of ${SHELVES.join(', ')}`);
      else {
        const want = expectedShelf(file);
        if (want && shelf !== want) bad.push(`shelf "${shelf}" does not match its folder (expected "${want}")`);
      }
      const sources = Array.isArray(d.sources) ? d.sources : [];
      if (!sources.length) bad.push('sources is missing or empty');
      for (const s of sources) {
        if (/^https?:\/\//i.test(s)) continue;
        const lm = /^(.*?):(\d+)$/.exec(s);
        const p = lm ? lm[1] : s;
        const full = path.join(root, p);
        if (!existsSync(full)) { bad.push(`source ${s} not found`); continue; }
        if (lm && statSync(full).isFile()) {
          const n = lineCount(readFileSync(full, 'utf8'));
          if (+lm[2] < 1 || +lm[2] > n) bad.push(`source ${s} is beyond the file's ${n} lines`);
        }
      }
      const checkedT = parseDate(d.checked);
      if (!d.checked) bad.push('checked is missing');
      else if (checkedT === null) bad.push(`checked "${d.checked}" is not a valid YYYY-MM-DD date`);
      else {
        const age = Math.round((today - checkedT) / DAY);
        if (age > STALE_DAYS) warns.push(`warn ${name}: checked ${d.checked}, ${age} days ago`);
      }
    }

    const firstIdx = lines.findIndex((l, i) => i >= start && l.trim() !== '');
    if (firstIdx < 0 || !lines[firstIdx].startsWith('# ')) bad.push('the first line after the frontmatter is not a "# " title');

    const prose = classify(lines, start);
    bad.push(...wrapProblems(lines, prose, start));

    const targets = new Set();
    const brokenLinks = [];
    const brokenCites = [];
    lines.forEach((line, i) => {
      if (!prose[i]) return;
      for (const m of line.matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
        const target = m[1];
        if (/^(https?:|mailto:|#)/i.test(target)) continue;
        const clean = target.split('#')[0].split('?')[0];
        if (!clean) continue;
        let decoded = clean;
        try { decoded = decodeURIComponent(clean); } catch { /* keep as written */ }
        const full = path.resolve(path.dirname(file), decoded);
        targets.add(full);
        if (!existsSync(full)) brokenLinks.push(`line ${i + 1} link ${target} does not exist`);
      }
      for (const m of line.matchAll(/`([^`\n]+)`/g)) {
        const span = m[1];
        if (/[<>*{}]/.test(span)) continue;
        const cm = /^((?:flightdeck|\.flightdeck|lab|library)\/\S*?)(?::(\d+))?$/.exec(span);
        if (!cm) continue;
        const full = path.join(root, cm[1]);
        if (!existsSync(full)) { brokenCites.push(`line ${i + 1} cites ${span} which does not exist`); continue; }
        if (cm[2] && statSync(full).isFile()) {
          const n = lineCount(readFileSync(full, 'utf8'));
          if (+cm[2] < 1 || +cm[2] > n) brokenCites.push(`line ${i + 1} cites ${span} but the file has ${n} lines`);
        }
      }
    });
    bad.push(...brokenLinks, ...brokenCites);
    if (path.basename(file) === 'README.md') linkTargets.set(file, targets);

    const n = lineCount(text);
    if (n > LINE_LIMIT) warns.push(`warn ${name}: ${n} lines, over the ${LINE_LIMIT}-line default`);
    cases.push({ name, bad });
  }

  for (const [readme, targets] of linkTargets) {
    const dir = path.dirname(readme);
    const unlinked = pageFiles.filter((f) => f !== readme && f.startsWith(dir + path.sep) && !targets.has(f)).map((f) => `no link to ${path.relative(dir, f).split(path.sep).join('/')}`);
    cases.push({ name: `index ${rel(readme)}`, bad: unlinked });
  }

  const lines = cases.map((c) => (c.bad.length ? `FAIL ${c.name}: ${c.bad.join('; ')}` : `pass ${c.name}`));
  const passed = cases.filter((c) => !c.bad.length).length;
  return { lines: [...lines, ...warns, `${passed}/${cases.length} passed`], ok: passed === cases.length };
}

try {
  const { lines, ok } = run(parseArgs(process.argv.slice(2)));
  console.log(lines.join('\n'));
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error(`${e.message}\n${USAGE}`);
  process.exit(2);
}
