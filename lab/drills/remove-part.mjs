#!/usr/bin/env node
// Remove-part: takes out each later pull request's files, one part at a time, in a throwaway copy,
// and proves the rest of FlightDeck stays green (hard-rule check, every other test file, plugin validation).
// A part is any lab/owned/pr<n>.txt with n other than 1. It costs no tokens and never writes the real working tree.
// Usage: node lab/drills/remove-part.mjs [--root <dir>] [--no-claude]
// Output: "pass baseline", then "pass remove pr<n>" or "FAIL remove pr<n>: <command> exited <code>: <last line>"
// for each part, then "<n>/<m> passed". Exit code 0 only when every line passes; 2 on a bad argument.
// Notes that are not cases go to stderr.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { claudeOnPath, findFiles, gitRoot, makeCopy, parseOwned, removeCopy, restoreCopy, runCmd } from './sweep.mjs';

const USAGE = 'usage: node lab/drills/remove-part.mjs [--root <dir>] [--no-claude]';

// Every part (lab/owned/pr<n>.txt, n other than 1) in the root, in numeric order, with its listed paths.
export function readParts(root) {
  const dir = path.join(root, 'lab', 'owned');
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return []; }
  return names
    .map((f) => ({ f, m: /^pr(\d+)\.txt$/.exec(f) }))
    .filter((x) => x.m && Number(x.m[1]) !== 1)
    .map((x) => ({ n: Number(x.m[1]), paths: parseOwned(fs.readFileSync(path.join(dir, x.f), 'utf8')) }))
    .sort((a, b) => a.n - b.n);
}

function duplicateLines(parts) {
  const first = new Map();
  const lines = [];
  for (const p of parts) {
    for (const f of new Set(p.paths)) {
      if (first.has(f)) lines.push(`FAIL lists: ${f} is listed by pr${first.get(f)} and pr${p.n}`);
      else first.set(f, p.n);
    }
  }
  return lines;
}

function testFiles(tmp) {
  const skip = (r) => r.startsWith('lab/tests/') || r.startsWith('lab/results/') || r.split('/').includes('fixtures') || r.split('/').includes('node_modules');
  return [...findFiles(tmp, 'flightdeck', '.test.mjs', skip), ...findFiles(tmp, 'lab', '.test.mjs', skip)];
}

function greenCommands(tmp, noClaude, notes) {
  const cmds = [['node', 'lab/checks/hard-rules.mjs', '--root', tmp]];
  const tests = testFiles(tmp);
  if (tests.length) cmds.push(['node', '--test', ...tests]);
  if (noClaude) notes.push('--no-claude given: plugin validation left out');
  else if (!claudeOnPath()) notes.push('claude is not on PATH: plugin validation left out');
  else cmds.push(['claude', 'plugin', 'validate', 'flightdeck']);
  return cmds;
}

function label(argv, tmp) {
  const parts = argv.map((a) => (a === tmp ? '<copy>' : a));
  return parts.length > 3 ? `${parts.slice(0, 3).join(' ')} ...` : parts.join(' ');
}

function removePaths(tmp, paths) {
  for (const rel of paths) {
    const abs = path.join(tmp, rel);
    if (!abs.startsWith(tmp + path.sep)) continue;
    try { fs.rmSync(abs, { recursive: true, force: true }); } catch { continue; }
    for (let dir = path.dirname(abs); dir.startsWith(tmp + path.sep); dir = path.dirname(dir)) {
      try { if (fs.readdirSync(dir).length) break; fs.rmdirSync(dir); } catch { break; }
    }
  }
}

export function removeParts({ root, noClaude = false, commands = null } = {}) {
  const lines = [];
  const notes = [];
  const parts = readParts(root);
  let total = 0;
  let passed = 0;
  for (const l of duplicateLines(parts)) { lines.push(l); total++; }

  const tmp = makeCopy(path.resolve(root));
  try {
    const cmdsNow = () => commands || greenCommands(tmp, noClaude, notes);
    const runAll = () => {
      for (const argv of cmdsNow()) {
        const r = runCmd(argv, tmp);
        if (r.code !== 0) return { command: label(argv, tmp), code: r.code, last: r.last };
      }
      return null;
    };

    total++;
    const base = runAll();
    if (base) {
      lines.push(`FAIL baseline: ${base.command} exited ${base.code}: ${base.last}`);
      lines.push(`${passed}/${total} passed`);
      return { lines, ok: false, notes, baselineFailed: true };
    }
    lines.push('pass baseline');
    passed++;

    for (const p of parts) {
      total++;
      removePaths(tmp, p.paths);
      const bad = runAll();
      if (bad) lines.push(`FAIL remove pr${p.n}: ${bad.command} exited ${bad.code}: ${bad.last}`);
      else { lines.push(`pass remove pr${p.n}`); passed++; }
      restoreCopy(tmp);
    }
    lines.push(`${passed}/${total} passed`);
    return { lines, ok: passed === total, notes };
  } finally {
    removeCopy(tmp);
  }
}

function parseArgs(argv) {
  const opts = { root: null, noClaude: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--root') {
      const v = argv[++i];
      if (v === undefined) throw new Error('--root needs a value');
      opts.root = v;
    } else if (a === '--no-claude') opts.noClaude = true;
    else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

export function main(argv) {
  let result;
  try {
    const opts = parseArgs(argv);
    result = removeParts({ root: opts.root || gitRoot(), noClaude: opts.noClaude });
  } catch (e) {
    process.stderr.write(`${e.message}\n${USAGE}\n`);
    return 2;
  }
  for (const n of [...new Set(result.notes)]) process.stderr.write(`note: ${n}\n`);
  process.stdout.write(`${result.lines.join('\n')}\n`);
  if (result.baselineFailed) return 1;
  return result.ok ? 0 : 1;
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) process.exitCode = main(process.argv.slice(2));
