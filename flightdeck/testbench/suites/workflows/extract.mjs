// testbench/suites/workflows/extract.mjs — reads workflow scripts without executing them: finds the first statement, the meta literal, and every object literal passed as a schema to agent().
// Usage: import { firstStatement, metaLiteral, schemaLiterals, agentCallCount } from './extract.mjs'; literals are evaluated as pure expressions and returned as plain JSON values.

const OPENERS = { '{': '}', '[': ']', '(': ')' };

function skipString(src, i) {
  const quote = src[i];
  let j = i + 1;
  while (j < src.length && src[j] !== quote) {
    if (src[j] === '\\') j += 1;
    j += 1;
  }
  return j + 1;
}

function skipComment(src, i) {
  if (src[i + 1] === '/') {
    const end = src.indexOf('\n', i);
    return end < 0 ? src.length : end;
  }
  const end = src.indexOf('*/', i + 2);
  return end < 0 ? src.length : end + 2;
}

function isComment(src, i) {
  return src[i] === '/' && (src[i + 1] === '/' || src[i + 1] === '*');
}

/** Index of the first non-whitespace, non-comment character (a leading shebang counts as a comment). */
export function firstCodeIndex(src) {
  let i = 0;
  if (src.startsWith('#!')) i = src.indexOf('\n') < 0 ? src.length : src.indexOf('\n');
  while (i < src.length) {
    if (/\s/.test(src[i])) i += 1;
    else if (isComment(src, i)) i = skipComment(src, i);
    else break;
  }
  return i;
}

/** The source text of the balanced bracketed literal starting at index i (src[i] must be {, [ or (). */
export function literalAt(src, i) {
  const open = src[i];
  const close = OPENERS[open];
  if (!close) throw new Error(`no literal opens at index ${i} (found '${src[i]}')`);
  const stack = [close];
  let j = i + 1;
  while (j < src.length && stack.length > 0) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') {
      j = skipString(src, j);
      continue;
    }
    if (isComment(src, j)) {
      j = skipComment(src, j);
      continue;
    }
    if (OPENERS[c]) stack.push(OPENERS[c]);
    else if (c === stack[stack.length - 1]) stack.pop();
    j += 1;
  }
  if (stack.length > 0) throw new Error(`unbalanced literal starting at index ${i}`);
  return src.slice(i, j);
}

function evaluate(text, what) {
  let value;
  try {
    value = new Function(`"use strict"; return (${text});`)();
  } catch (error) {
    throw new Error(`${what} is not a pure literal: ${error.message}`);
  }
  return JSON.parse(JSON.stringify(value));
}

/** The first statement's leading text (up to the first '=' or ';'). */
export function firstStatement(src) {
  const start = firstCodeIndex(src);
  const end = src.slice(start).search(/[=;]/);
  return src.slice(start, end < 0 ? src.length : start + end).replace(/\s+/g, ' ').trim();
}

/** The meta object literal of a workflow script evaluated to JSON, or an error when the first statement is not `export const meta = {…}`. */
export function metaLiteral(src) {
  const start = firstCodeIndex(src);
  const head = /^export\s+const\s+meta\s*=\s*/.exec(src.slice(start));
  if (!head) throw new Error(`first statement is not 'export const meta = {…}' (found '${firstStatement(src)}')`);
  const at = start + head[0].length;
  return evaluate(literalAt(src, at), 'meta');
}

function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '"' || src[i] === "'" || src[i] === '`') {
      const j = skipString(src, i);
      out += src.slice(i, j);
      i = j;
    } else if (isComment(src, i)) {
      const j = skipComment(src, i);
      out += src.slice(i, j).replace(/[^\n]/g, ' ');
      i = j;
    } else {
      out += src[i];
      i += 1;
    }
  }
  return out;
}

/** Every object literal passed as `schema:` (inline, or through a top-level const) in call arguments, evaluated to JSON, in source order. */
export function schemaLiterals(src) {
  const code = stripComments(src);
  const found = [];
  const ranges = [];
  const inRange = (i) => ranges.some(([a, b]) => i >= a && i < b);
  for (const m of code.matchAll(/(?<![\w$.'"])schema\s*:\s*/g)) {
    if (inRange(m.index)) continue;
    const at = m.index + m[0].length;
    let text;
    if (code[at] === '{') {
      text = literalAt(code, at);
      ranges.push([at, at + text.length]);
    } else {
      const id = /^[A-Za-z_$][\w$]*/.exec(code.slice(at));
      if (!id) throw new Error(`schema value at index ${at} is neither an object literal nor an identifier`);
      const decl = new RegExp(`(?:const|let|var)\\s+${id[0].replace(/\$/g, '\\$')}\\s*=\\s*`).exec(code);
      if (!decl) throw new Error(`schema identifier ${id[0]} has no top-level literal declaration`);
      const start = decl.index + decl[0].length;
      text = literalAt(code, start);
    }
    found.push(evaluate(text, `schema literal at index ${at}`));
  }
  return found;
}

/** Number of agent( call sites outside comments and strings. */
export function agentCallCount(src) {
  const code = stripComments(src).replace(/(["'`])(?:\\.|(?!\1)[^\\\n])*\1/g, '""');
  return (code.match(/\bagent\s*\(/g) ?? []).length;
}
