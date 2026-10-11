#!/usr/bin/env node
// Lists FlightDeck manual and library pages that are stale. No model calls, Node built-ins only.
// Usage: node stale.mjs [--days <n>] [--today <YYYY-MM-DD>] [--project <dir>] [--plugin-root <dir>] [--json]
// A page is stale when it has no valid checked: date, when it was checked more than <days> days ago,
// when a source it names is missing, or when a source changed in git after the checked: date.
// Stated limit: uncommitted changes are not seen.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const USAGE = 'usage: node stale.mjs [--days <n>] [--today <YYYY-MM-DD>] [--project <dir>] [--plugin-root <dir>] [--json]';
const scriptDir = path.dirname(fileURLToPath(import.meta.url));

function unquote(s) { return s.trim().replace(/^(["'])(.*)\1$/, '$2'); }

// Frontmatter: text between a first line --- and the next line ---.
// key: value sets a string (quotes removed); an empty key: starts a list of "  - item" lines.
function parseFrontmatter(text) {
  const lines = text.split(/\r?\n/);
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
  return data;
}

function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  if (d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) return null;
  return t;
}
const DAY = 86400000;

function parseArgs(argv) {
  const o = { days: 30, today: null, project: process.cwd(), pluginRoot: path.resolve(scriptDir, '../..'), json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') { o.json = true; continue; }
    if (!['--days', '--today', '--project', '--plugin-root'].includes(a)) throw new Error(`unknown argument: ${a}`);
    const v = argv[++i];
    if (v === undefined) throw new Error(`${a} needs a value`);
    if (a === '--days') {
      if (!/^\d+$/.test(v)) throw new Error('--days needs a whole number');
      o.days = Number(v);
    } else if (a === '--today') {
      if (parseDate(v) === null) throw new Error('--today needs a date like 2026-10-11');
      o.today = v;
    } else if (a === '--project') o.project = path.resolve(v);
    else o.pluginRoot = path.resolve(v);
  }
  if (!o.today) {
    const n = new Date();
    o.today = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
  }
  return o;
}

function mdFiles(dir) {
  const out = [];
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...mdFiles(p));
    else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out.sort();
}

function repoRootOf(dir) {
  if (!existsSync(dir)) return null;
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return realpathSync(r.stdout.trim());
}

function lastCommitDate(root, rel) {
  const r = spawnSync('git', ['log', '-1', '--format=%cs', '--', rel], { cwd: root, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

function run(o) {
  const pluginReal = existsSync(o.pluginRoot) ? realpathSync(o.pluginRoot) : o.pluginRoot;
  const pluginRepo = repoRootOf(o.pluginRoot);
  const projectRepo = repoRootOf(o.project);
  const notes = [];
  if (!pluginRepo) notes.push(`note: ${o.pluginRoot} is not in a git repository; only the date rule was applied`);

  const seen = new Set();
  const pages = [];
  const add = (file, repo) => {
    const real = realpathSync(file);
    if (seen.has(real)) return;
    seen.add(real);
    pages.push({ file: real, repo });
  };
  for (const sub of ['manuals', 'library']) for (const f of mdFiles(path.join(o.pluginRoot, sub))) add(f, pluginRepo);
  for (const f of mdFiles(path.join(o.project, '.flightdeck', 'manuals'))) {
    add(f, realpathSync(f).startsWith(pluginReal + path.sep) ? pluginRepo : projectRepo);
  }

  const today = parseDate(o.today);
  const dateCache = new Map();
  const stale = [];
  for (const { file, repo } of pages) {
    const fm = parseFrontmatter(readFileSync(file, 'utf8')) || {};
    const reasons = [];
    const checkedT = parseDate(fm.checked);
    if (checkedT === null) reasons.push('no checked: date');
    else {
      const age = Math.round((today - checkedT) / DAY);
      if (age > o.days) reasons.push(`checked ${fm.checked}, ${age} days ago`);
    }
    if (repo) {
      const sources = Array.isArray(fm.sources) ? fm.sources : [];
      for (const s of sources) {
        if (/^https?:\/\//i.test(s)) continue;
        const rel = s.replace(/:\d+$/, '');
        if (!existsSync(path.join(repo, rel))) { reasons.push(`source ${s} not found`); continue; }
        if (checkedT === null) continue;
        const key = `${repo}\0${rel}`;
        if (!dateCache.has(key)) dateCache.set(key, lastCommitDate(repo, rel));
        const changed = dateCache.get(key);
        const changedT = parseDate(changed);
        if (changedT !== null && changedT > checkedT) reasons.push(`source ${s} changed ${changed}, after checked ${fm.checked}`);
      }
    }
    if (reasons.length) {
      const rel = repo && file.startsWith(repo + path.sep) ? path.relative(repo, file) : file;
      stale.push({ page: rel.split(path.sep).join('/'), reasons });
    }
  }
  return { pages: pages.length, stale, notes };
}

let o;
try { o = parseArgs(process.argv.slice(2)); } catch (e) {
  console.error(`${e.message}\n${USAGE}`);
  process.exit(2);
}
const result = run(o);
if (o.json) console.log(JSON.stringify({ pages: result.pages, stale: result.stale, notes: result.notes }, null, 2));
else {
  const out = [...result.notes];
  for (const s of result.stale) for (const r of s.reasons) out.push(`stale ${s.page}: ${r}`);
  out.push(`${result.stale.length} stale of ${result.pages} pages`);
  console.log(out.join('\n'));
}
process.exit(0);
