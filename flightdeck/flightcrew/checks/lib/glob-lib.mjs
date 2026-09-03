// flightcrew/checks/lib/glob-lib.mjs — the glob dialect the allowed, locked and excluded path lists are written in, matched against repository-relative paths.
// Usage: import { match, matchAny } from '<relative>/checks/lib/glob-lib.mjs'; match('src/**', 'src/a/b.mjs') === true.
//
// Exports: match(pattern, relPath); matchAny(patterns, relPath); firstMatch(patterns, relPath); compile(pattern) (the cached RegExp); normalise(relPath).
//
// Dialect (design section 5.13): '**' matches any depth; '*' matches within one segment; '?' matches one character
// within a segment; a leading '/' anchors at the repository root, so '/README.md' matches only the root file and never
// 'docs/README.md'; a trailing '/' matches the directory and everything under it; an unanchored pattern with no '/'
// matches a basename at any depth;
// there is no negation. A trailing '/**' also matches the directory itself, so 'src/export/**' covers 'src/export'.
// Paths are repository-relative; inside a worktree they are relative to the worktree root. Importing has no side effect.

const cache = new Map();

/** A repository-relative path in the one form the matcher compares: '/' separators, no leading './' or '/', no trailing '/'. */
export function normalise(relPath) {
  if (typeof relPath !== 'string') return '';
  let p = relPath.replace(/\\/g, '/');
  while (p.startsWith('./')) p = p.slice(2);
  while (p.startsWith('/')) p = p.slice(1);
  p = p.replace(/\/{2,}/g, '/');
  while (p.endsWith('/') && p.length > 1) p = p.slice(0, -1);
  return p;
}

function escapeSegment(segment) {
  return segment
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]');
}

/** The body of the expression for a pattern already stripped of its anchors. */
function translate(pattern) {
  const segments = pattern.split('/').filter((s) => s !== '');
  let out = '';
  let separatorPending = false;
  for (let i = 0; i < segments.length; i += 1) {
    const segment = segments[i];
    const last = i === segments.length - 1;
    if (segment === '**') {
      if (out === '') out += last ? '.*' : '(?:.*/)?';
      else out += last ? '(?:/.*)?' : '(?:/.*)?/';
      separatorPending = false;
    } else {
      if (separatorPending) out += '/';
      out += escapeSegment(segment);
      separatorPending = true;
    }
  }
  return out;
}

/** The compiled expression for one pattern, cached. Returns null for a pattern that can never match. */
export function compile(pattern) {
  if (typeof pattern !== 'string') return null;
  if (cache.has(pattern)) return cache.get(pattern);
  let p = pattern.trim().replace(/\\/g, '/');
  while (p.startsWith('./')) p = p.slice(2);
  const anchored = p.startsWith('/');
  while (p.startsWith('/')) p = p.slice(1);
  p = p.replace(/\/{2,}/g, '/');
  let directory = false;
  while (p.endsWith('/') && p.length > 1) {
    p = p.slice(0, -1);
    directory = true;
  }
  let regex = null;
  if (p !== '' && p !== '/') {
    const body = translate(p);
    const source = directory
      ? `^${body}(?:/.*)?$`
      : anchored || p.includes('/') ? `^${body}$` : `^(?:.*/)?${body}$`;
    regex = new RegExp(source);
  }
  cache.set(pattern, regex);
  return regex;
}

/** True when the repository-relative path matches the pattern. */
export function match(pattern, relPath) {
  const regex = compile(pattern);
  if (!regex) return false;
  return regex.test(normalise(relPath));
}

/** The first pattern of the list the path matches, or null. */
export function firstMatch(patterns, relPath) {
  if (!Array.isArray(patterns)) return null;
  const path = normalise(relPath);
  for (const pattern of patterns) {
    const regex = compile(pattern);
    if (regex && regex.test(path)) return pattern;
  }
  return null;
}

/** True when the path matches any pattern of the list. An empty or absent list matches nothing. */
export function matchAny(patterns, relPath) {
  return firstMatch(patterns, relPath) !== null;
}
