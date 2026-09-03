// flightcrew/checks/lib/git-lib.mjs — the read-only git the boundary, the locked-path report, the evidence page and the launch commands need, as a handful of functions that never throw.
// Usage: import { head, changedSince, isClean, toplevel } from '<relative>/checks/lib/git-lib.mjs'; changedSince(root, lockCommit).
//
// Exports: run(args, cwd) (spawnSync, never throws, returns { ok, code, stdout, stderr }); head(root, { short });
// lastCommitOf(root, file, { short }); resolveCommit(root, rev); toplevel(dir, { projectDir });
// repoRelative(file, { cwd, projectDir }); changedSince(root, base, { exclude }); workingChanges(root);
// isClean(root, globs); dirtyPaths(root, globs); worktreeList(root); EXCLUDED (the two prefixes every changed set
// leaves out).
//
// toplevel's directory need not exist yet: the nearest existing ancestor answers for it, so a file about to be
// created in a folder that does not exist yet still resolves to its repository. Git answers with the real path, so a
// caller computing path.relative must realpath the target's nearest existing ancestor first — on macOS /tmp and /var
// are symlinks. repoRelative does the whole rule (absolutise, nearest existing ancestor, realpath, toplevel,
// path.relative plus the remaining segments) and is what a caller turning an edit target into a repository-relative
// path should use.
//
// The changed set of design section 6: the commits after base, plus staged, unstaged and untracked-not-ignored
// files, with .claude/worktrees/** and flightdeck/testbench/runs/** left out. Paths are repository-relative with
// '/' separators, each entry carrying added and removed line counts and the sources it came from. Plumbing is read
// with -z, so a path holding a space or a quote survives. Importing this module has no side effect.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { matchAny } from './glob-lib.mjs';

/** Never part of a changed set: another agent's worktree, and the testbench's own run output. */
export const EXCLUDED = ['.claude/worktrees/**', 'flightdeck/testbench/runs/**'];

const MAX_BUFFER = 32 * 1024 * 1024;

/** Runs git with the given arguments in cwd. Accepts an array or a whitespace-separated string. Never throws. */
export function run(args, cwd) {
  const list = Array.isArray(args) ? args.map(String) : String(args).trim().split(/\s+/);
  let result;
  try {
    result = spawnSync('git', list, { cwd, encoding: 'utf8', maxBuffer: MAX_BUFFER });
  } catch (error) {
    return { ok: false, code: null, stdout: '', stderr: `git could not be spawned: ${error.message}` };
  }
  if (result.error) {
    return { ok: false, code: null, stdout: result.stdout ?? '', stderr: result.error.message };
  }
  return {
    ok: result.status === 0,
    code: typeof result.status === 'number' ? result.status : null,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function out(args, cwd) {
  const result = run(args, cwd);
  return result.ok ? result.stdout : null;
}

/** The current commit of the repository at root, or null. */
export function head(root, { short = false } = {}) {
  const text = out(short ? ['rev-parse', '--short', 'HEAD'] : ['rev-parse', 'HEAD'], root);
  return text === null ? null : text.trim() || null;
}

/** The newest commit that touched one path, or null when the path is untracked or the repository has no history for it. */
export function lastCommitOf(root, file, { short = false } = {}) {
  const format = short ? '%h' : '%H';
  const text = out(['log', '-1', `--format=${format}`, '--', String(file)], root);
  return text === null ? null : text.trim() || null;
}

/** The full hash a revision names, or null when it does not resolve in this repository. */
export function resolveCommit(root, rev) {
  if (!rev) return null;
  const text = out(['rev-parse', '--verify', '--quiet', `${rev}^{commit}`], root);
  return text === null ? null : text.trim() || null;
}

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** The nearest ancestor of p that exists as a directory — p itself when it already is one. Always returns a path. */
function nearestExistingDirectory(p) {
  let probe = path.resolve(p);
  while (!isDirectory(probe) && path.dirname(probe) !== probe) probe = path.dirname(probe);
  return probe;
}

/** The real path of p, or p unchanged when it cannot be resolved. */
function real(p) {
  try {
    return fs.realpathSync(p);
  } catch {
    return p;
  }
}

/**
 * The root a path belongs to: the git toplevel of the directory, or — for a directory inside
 * <projectDir>/.claude/worktrees/<name>/ that git cannot answer for — that worktree directory (design 5.13).
 * The directory need not exist: the nearest existing ancestor is asked in its place, so a file about to be written
 * into a folder that does not exist yet still resolves to its repository. Git answers with the real path, which may
 * differ from the path given when a parent is a symlink; repoRelative below accounts for that.
 */
export function toplevel(dir, { projectDir = null } = {}) {
  if (!dir) return null;
  const text = out(['rev-parse', '--show-toplevel'], nearestExistingDirectory(dir));
  if (text !== null && text.trim() !== '') return text.trim();
  if (projectDir) {
    const marker = `${path.join(projectDir, '.claude', 'worktrees')}${path.sep}`;
    const absolute = path.resolve(dir);
    if (absolute.startsWith(marker)) {
      const name = absolute.slice(marker.length).split(path.sep)[0];
      if (name) return path.join(projectDir, '.claude', 'worktrees', name);
    }
  }
  return null;
}

function posix(p) {
  return String(p).split(path.sep).join('/');
}

/**
 * One edit target as a repository-relative path with '/' separators (design 5.13, I7): the file is absolutised
 * against cwd, its nearest existing ancestor directory is resolved through any symlink, that directory's toplevel
 * becomes the root, and the answer is the root-relative path of the ancestor plus the segments still to be created.
 * The file need not exist, nor need its directory. Returns null when nothing names the file and null when no
 * repository answers for it; a file outside the root that answered comes back with leading '../' segments.
 */
export function repoRelative(file, { cwd = null, projectDir = null } = {}) {
  if (!file) return null;
  const absolute = path.resolve(cwd || process.cwd(), String(file));
  const anchor = nearestExistingDirectory(path.dirname(absolute));
  const remainder = path.relative(anchor, absolute);
  const root = toplevel(anchor, { projectDir });
  if (!root) return null;
  const inside = path.relative(real(root), real(anchor));
  return posix(path.join(inside, remainder));
}

function splitZ(text) {
  return String(text ?? '').split('\0').filter((entry) => entry !== '');
}

/** Parses 'added\tremoved\tpath' records of git diff --numstat -z into [{ path, added, removed }]. */
function parseNumstat(text) {
  const rows = [];
  for (const record of splitZ(text)) {
    const first = record.indexOf('\t');
    const second = record.indexOf('\t', first + 1);
    if (first === -1 || second === -1) continue;
    const added = Number(record.slice(0, first));
    const removed = Number(record.slice(first + 1, second));
    const file = record.slice(second + 1);
    if (file === '') continue;
    rows.push({ path: posix(file), added: Number.isFinite(added) ? added : 0, removed: Number.isFinite(removed) ? removed : 0 });
  }
  return rows;
}

/** The line count of a file, used as the added count of an untracked file. Unreadable or binary counts as 0. */
function lineCount(root, rel) {
  try {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    if (text === '') return 0;
    return text.endsWith('\n') ? text.split('\n').length - 1 : text.split('\n').length;
  } catch {
    return 0;
  }
}

function collect(into, rows, source) {
  for (const row of rows) {
    const entry = into.get(row.path) ?? { path: row.path, added: 0, removed: 0, sources: new Set() };
    entry.added += row.added;
    entry.removed += row.removed;
    entry.sources.add(source);
    into.set(row.path, entry);
  }
}

/**
 * Every path changed since base: the commits after it, the staged and unstaged edits, and the untracked files git
 * does not ignore, minus EXCLUDED and any extra globs. Returns [{ path, added, removed, status }] sorted by path,
 * where status joins the sources the path came from ('committed', 'staged', 'unstaged', 'untracked').
 * A base that does not resolve is skipped rather than fatal: the working-tree sources still report.
 */
export function changedSince(root, base, { exclude = [] } = {}) {
  const found = new Map();
  if (base) {
    const committed = out(['diff', '--numstat', '-z', '--no-renames', String(base), 'HEAD'], root);
    if (committed !== null) collect(found, parseNumstat(committed), 'committed');
  }
  const staged = out(['diff', '--numstat', '-z', '--no-renames', '--cached'], root);
  if (staged !== null) collect(found, parseNumstat(staged), 'staged');
  const unstaged = out(['diff', '--numstat', '-z', '--no-renames'], root);
  if (unstaged !== null) collect(found, parseNumstat(unstaged), 'unstaged');
  const untracked = out(['ls-files', '--others', '--exclude-standard', '-z'], root);
  if (untracked !== null) {
    collect(found, splitZ(untracked).map((rel) => ({ path: posix(rel), added: lineCount(root, rel), removed: 0 })), 'untracked');
  }
  const skip = [...EXCLUDED, ...exclude];
  const order = ['committed', 'staged', 'unstaged', 'untracked'];
  return [...found.values()]
    .filter((entry) => !matchAny(skip, entry.path))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((entry) => ({
      path: entry.path,
      added: entry.added,
      removed: entry.removed,
      status: order.filter((s) => entry.sources.has(s)).join('+'),
    }));
}

/** Staged, unstaged and untracked paths only — the working tree, with no commit history. Same shape as changedSince. */
export function workingChanges(root, { exclude = [] } = {}) {
  return changedSince(root, null, { exclude });
}

/** The working-tree paths matching one of the globs. An empty glob list matches nothing. */
export function dirtyPaths(root, globs) {
  return workingChanges(root).filter((entry) => matchAny(globs, entry.path)).map((entry) => entry.path);
}

/** True when nothing in the working tree matches the globs. */
export function isClean(root, globs) {
  return dirtyPaths(root, globs).length === 0;
}

/** Every worktree of the repository: [{ path, head, branch, detached, bare, locked }]. */
export function worktreeList(root) {
  const text = out(['worktree', 'list', '--porcelain'], root);
  if (text === null) return [];
  const trees = [];
  let current = null;
  for (const line of text.split('\n')) {
    if (line === '') {
      if (current) trees.push(current);
      current = null;
      continue;
    }
    const space = line.indexOf(' ');
    const key = space === -1 ? line : line.slice(0, space);
    const value = space === -1 ? '' : line.slice(space + 1);
    if (key === 'worktree') current = { path: value, head: null, branch: null, detached: false, bare: false, locked: false };
    else if (!current) continue;
    else if (key === 'HEAD') current.head = value;
    else if (key === 'branch') current.branch = value.replace(/^refs\/heads\//, '');
    else if (key === 'detached') current.detached = true;
    else if (key === 'bare') current.bare = true;
    else if (key === 'locked') current.locked = true;
  }
  if (current) trees.push(current);
  return trees;
}
