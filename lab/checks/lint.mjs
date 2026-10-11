#!/usr/bin/env node
// FlightDeck lint: gentle warnings about lengths, description sizes, dropped agent fields,
// machine-specific paths and workshop scoped-file size. It only warns and never fails.
// Usage: node lab/checks/lint.mjs [--root <dir>] [--json]
// Output: per rule "pass <rule>" or "warn <rule>: <file>: <detail>", last line "<c>/<r> rules clean, <w> warnings".
// Exit code 0 always; 2 only on an unknown argument. No model calls, Node built-ins only.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const USAGE = 'usage: node lab/checks/lint.mjs [--root <dir>] [--json]';

export const RULES = [
  'claude-md-length',
  'context-length',
  'workshop-scope-size',
  'skill-description',
  'agent-dropped-fields',
  'machine-paths',
  'manual-length',
];

const SCOPE_FILES = ['constraints.md', 'context.md', 'verify.md'];
const SCOPE_LIMIT = 6000;
const DESC_LIMIT = 400;
const DESC_TOTAL_LIMIT = 4000;
const DROPPED = ['permissionMode', 'hooks', 'mcpServers', 'initialPrompt'];
const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.json', '.sh', '.yaml', '.txt']);

// Built from pieces so this file never matches its own patterns.
const SLASH = '/';
const MACHINE_PATTERNS = [
  new RegExp(SLASH + 'home' + SLASH + '[A-Za-z0-9._-]+' + SLASH),
  new RegExp(SLASH + 'Users' + SLASH + '[A-Za-z0-9._ -]+' + SLASH),
  new RegExp('[A-Za-z]:\\\\' + 'Users' + '\\\\'),
  new RegExp(SLASH + 'tmp' + SLASH + 'claude-'),
];
const MACHINE_SKIP_PREFIXES = ['lab/tests/', 'lab/results/', 'lab/evals/results/', 'flightdeck/evals/results/'];
const MACHINE_SKIP_FILES = new Set(['lab/checks/lint.mjs']);

function readText(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch { return null; }
}

function isDir(p) {
  try { return fs.statSync(p).isDirectory(); } catch { return false; }
}

function listDir(p) {
  try { return fs.readdirSync(p, { withFileTypes: true }); } catch { return []; }
}

const lineCount = (text) => (text === '' ? 0 : text.replace(/\r?\n$/, '').split(/\r?\n/).length);

// The text between a first line '---' and the next '---', or null when there is none.
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return m ? m[1] : null;
}

function topLevelKeys(fm) {
  const keys = [];
  for (const line of fm.split(/\r?\n/)) {
    const m = /^([A-Za-z_][\w-]*)\s*:/.exec(line);
    if (m) keys.push(m[1]);
  }
  return keys;
}

function descriptionOf(fm) {
  const lines = fm.split(/\r?\n/);
  const i = lines.findIndex((l) => /^description\s*:/.test(l));
  if (i < 0) return null;
  let value = lines[i].replace(/^description\s*:/, '').trim();
  if (/^[>|][+-]?$/.test(value)) {
    const parts = [];
    for (let j = i + 1; j < lines.length && (/^\s+/.test(lines[j]) || lines[j] === ''); j++) parts.push(lines[j].trim());
    value = parts.join(' ').trim();
  } else if (value === '') {
    const parts = [];
    for (let j = i + 1; j < lines.length && /^\s+/.test(lines[j]); j++) parts.push(lines[j].trim());
    value = parts.join(' ').trim();
  }
  return value.replace(/^(["'])([\s\S]*)\1$/, '$2');
}

function walk(root, rel, out) {
  for (const e of listDir(path.join(root, rel))) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(root, r, out);
    } else if (e.isFile()) out.push(r);
  }
}

export function lint(root) {
  const warnings = [];
  const warn = (rule, file, detail) => warnings.push({ rule, file, detail });
  const abs = (f) => path.join(root, f);

  // claude-md-length
  for (const [file, limit] of [['CLAUDE.md', 60], ['.flightdeck/CLAUDE.md', 40], ['lab/CLAUDE.md', 40]]) {
    const text = readText(abs(file));
    if (text === null) continue;
    const n = lineCount(text);
    if (n > limit) warn('claude-md-length', file, `${n} lines, over ${limit}`);
  }

  // context-length and workshop-scope-size
  for (const e of listDir(abs('.flightdeck'))) {
    if (!e.isDirectory()) continue;
    const dir = `.flightdeck/${e.name}`;
    const ctx = readText(abs(`${dir}/context.md`));
    if (ctx !== null) {
      const n = lineCount(ctx);
      if (n > 40) warn('context-length', `${dir}/context.md`, `${n} lines, over 40`);
    }
    let total = 0;
    let any = false;
    for (const f of SCOPE_FILES) {
      const t = readText(abs(`${dir}/${f}`));
      if (t !== null) { any = true; total += t.length; }
    }
    if (any && total > SCOPE_LIMIT) {
      warn('workshop-scope-size', dir, `constraints, context and verify total ${total} characters, over ${SCOPE_LIMIT}`);
    }
  }

  // skill-description
  {
    let total = 0;
    for (const e of listDir(abs('flightdeck/skills'))) {
      if (!e.isDirectory()) continue;
      const file = `flightdeck/skills/${e.name}/SKILL.md`;
      const text = readText(abs(file));
      if (text === null) continue;
      const fm = frontmatter(text);
      if (fm === null) { warn('skill-description', file, 'no frontmatter found'); continue; }
      const d = descriptionOf(fm);
      if (d === null) { warn('skill-description', file, 'no description in the frontmatter'); continue; }
      total += d.length;
      if (d.length > DESC_LIMIT) warn('skill-description', file, `description is ${d.length} characters, over ${DESC_LIMIT}`);
    }
    if (total > DESC_TOTAL_LIMIT) warn('skill-description', 'flightdeck/skills', `all descriptions total ${total} characters, over ${DESC_TOTAL_LIMIT}`);
  }

  // agent-dropped-fields
  for (const e of listDir(abs('flightdeck/agents'))) {
    if (!e.isFile() || !e.name.endsWith('.md')) continue;
    const file = `flightdeck/agents/${e.name}`;
    const text = readText(abs(file));
    if (text === null) continue;
    const fm = frontmatter(text);
    if (fm === null) { warn('agent-dropped-fields', file, 'no frontmatter found'); continue; }
    for (const key of topLevelKeys(fm)) {
      if (DROPPED.includes(key)) warn('agent-dropped-fields', file, `frontmatter key ${key} is silently dropped for plugin agents`);
    }
  }

  // machine-paths
  {
    const files = [];
    walk(root, 'flightdeck', files);
    walk(root, 'lab', files);
    for (const f of files.sort()) {
      if (MACHINE_SKIP_FILES.has(f) || MACHINE_SKIP_PREFIXES.some((p) => f.startsWith(p))) continue;
      if (!TEXT_EXT.has(path.extname(f))) continue;
      const text = readText(abs(f));
      if (text === null) continue;
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const hit = MACHINE_PATTERNS.find((re) => re.test(lines[i]));
        if (hit) { warn('machine-paths', f, `line ${i + 1} holds a path that only works on one machine`); break; }
      }
    }
  }

  // manual-length
  if (isDir(abs('flightdeck/manuals'))) {
    const files = [];
    walk(root, 'flightdeck/manuals', files);
    for (const f of files.sort()) {
      if (!f.endsWith('.md')) continue;
      const text = readText(abs(f));
      if (text === null) continue;
      const n = lineCount(text);
      if (n > 100) warn('manual-length', f, `${n} lines, over 100`);
    }
  }

  return { rules: [...RULES], warnings };
}

export function formatLint(result) {
  const lines = [];
  let clean = 0;
  for (const rule of result.rules) {
    const w = result.warnings.filter((x) => x.rule === rule);
    if (!w.length) { lines.push(`pass ${rule}`); clean++; }
    else for (const x of w) lines.push(`warn ${rule}: ${x.file}: ${x.detail}`);
  }
  lines.push(`${clean}/${result.rules.length} rules clean, ${result.warnings.length} warnings`);
  return lines;
}

function parseArgs(argv) {
  const opts = { root: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--root needs a value');
      opts.root = v;
    } else if (a === '--json') opts.json = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function gitRoot() {
  const r = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('not inside a git repository (use --root <dir>)');
  return r.stdout.trim();
}

export function main(argv) {
  let opts;
  try { opts = parseArgs(argv); } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  let root;
  try { root = path.resolve(opts.root || gitRoot()); } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  const result = lint(root);
  process.stdout.write(opts.json ? `${JSON.stringify(result, null, 2)}\n` : `${formatLint(result).join('\n')}\n`);
  return 0;
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) process.exitCode = main(process.argv.slice(2));
