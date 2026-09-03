// testbench/suites/constraints/scan-lib.mjs — static source scanning for the constraints suite: a directory walker confined to the paths it is given, a JavaScript tokenizer that blanks comments (and optionally strings) while leaving regex literals alone, and an import-specifier extractor.
// Usage: import { walk, stripComments, stripCommentsAndStrings, importSpecifiers } from './scan-lib.mjs'.

import fs from 'node:fs';
import path from 'node:path';

/** Every file under dir (recursive, .git and skipDirs skipped) as sorted absolute paths. */
export function walk(dir, { skipDirs = [] } = {}) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === '.git' || skipDirs.includes(entry.name)) continue;
        visit(path.join(current, entry.name));
      } else if (entry.isFile()) {
        files.push(path.join(current, entry.name));
      }
    }
  };
  visit(dir);
  return files.sort();
}

const REGEX_PRECEDERS = new Set(['(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>', '~', '^']);
const REGEX_KEYWORDS = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);

function regexAllowed(code, i) {
  let j = i - 1;
  while (j >= 0 && /\s/.test(code[j])) j -= 1;
  if (j < 0) return true;
  if (REGEX_PRECEDERS.has(code[j])) return true;
  let k = j;
  while (k >= 0 && /[A-Za-z_$]/.test(code[k])) k -= 1;
  const word = code.slice(k + 1, j + 1);
  return word.length > 0 && REGEX_KEYWORDS.has(word);
}

function blank(text) {
  return text.replace(/[^\n]/g, ' ');
}

/** Blanks comments (and, when strings is true, the contents of string and template literals) keeping every newline so line numbers survive. */
function tokenize(src, { strings }) {
  let out = '';
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    const next = src[i + 1];
    if (c === '/' && next === '/') {
      const end = src.indexOf('\n', i);
      const stop = end < 0 ? n : end;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === '/' && next === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end < 0 ? n : end + 2;
      out += blank(src.slice(i, stop));
      i = stop;
    } else if (c === '"' || c === "'" || c === '`') {
      let j = i + 1;
      let closed = false;
      while (j < n) {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === c) {
          closed = true;
          break;
        }
        if (c !== '`' && src[j] === '\n') break;
        j += 1;
      }
      const stop = closed ? Math.min(n, j + 1) : Math.min(n, j);
      const inner = src.slice(i + 1, closed ? stop - 1 : stop);
      out += strings ? `${c}${blank(inner)}${closed ? c : ''}` : src.slice(i, stop);
      i = stop;
    } else if (c === '/' && regexAllowed(out, out.length)) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') {
          j += 2;
          continue;
        }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) {
          closed = true;
          break;
        }
        j += 1;
      }
      const stop = closed ? Math.min(n, j + 1) : Math.min(n, j);
      out += `/${blank(src.slice(i + 1, closed ? stop - 1 : stop))}${closed ? '/' : ''}`;
      i = stop;
    } else {
      out += c;
      i += 1;
    }
  }
  return out;
}

export function stripComments(src) {
  return tokenize(String(src), { strings: false });
}

export function stripCommentsAndStrings(src) {
  return tokenize(String(src), { strings: true });
}

const PATTERNS = [
  /\bimport\s*\(\s*(['"])([^'"\n]+)\1/g,
  /\b(?:import|export)\b[^;'"`]*?\bfrom\s*(['"])([^'"\n]+)\1/g,
  /\bimport\s*(['"])([^'"\n]+)\1/g,
  /\brequire\s*\(\s*(['"])([^'"\n]+)\1/g,
];

/** Every module specifier a script imports, in source order, from comment-stripped code. */
export function importSpecifiers(src) {
  const code = stripComments(src);
  const found = [];
  for (const pattern of PATTERNS) {
    for (const m of code.matchAll(pattern)) found.push({ spec: m[2], at: m.index });
  }
  const seen = new Set();
  return found
    .sort((a, b) => a.at - b.at)
    .filter((f) => (seen.has(`${f.at}:${f.spec}`) ? false : seen.add(`${f.at}:${f.spec}`)))
    .map((f) => f.spec);
}
