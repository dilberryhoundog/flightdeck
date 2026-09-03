// flightcrew/checks/lib/output.mjs — the one place every fc command, validator, gate and hook writes a line: success lines, warning lines, error lines, JSON mode and the three exit codes.
// Usage: import { ok, fail, warn, json, setJson, isJson, errorLine, exitOk, exitUsage, exitBlocked, EXIT } from '<relative>/checks/lib/output.mjs';
//
// Exports: EXIT (the three codes); setJson/isJson (the global --json mode); print (a raw stdout line, always);
// ok (one success line, silent in JSON mode); warn ('warn:  <message>', silent in JSON mode); errorLine/errorLines
// ('error: <message> — [<rule>]' per design 5.12); fail (lines to stderr, always); json (a document to stdout);
// exitOk/exitUsage/exitBlocked/exitWith (print then exit 0, 1, 2).
//
// Every write goes through a synchronous writer: a pipe on macOS can be asynchronous, and a process that calls
// process.exit straight after console.log can lose the line. Importing this module has no side effect.

import fs from 'node:fs';

/** 0 success, 1 usage or environment error, 2 failed check or blocking decision. */
export const EXIT = { ok: 0, usage: 1, blocked: 2 };

const state = { json: false };

/** Turns JSON mode on or off. In JSON mode ok() and warn() print nothing and the command prints one document with json(). */
export function setJson(on = true) {
  state.json = Boolean(on);
  return state.json;
}

/** True while JSON mode is on. */
export function isJson() {
  return state.json;
}

function writeAll(fd, text) {
  const buf = Buffer.from(text);
  let off = 0;
  while (off < buf.length) {
    try {
      off += fs.writeSync(fd, buf, off, buf.length - off);
    } catch (error) {
      if (error.code === 'EAGAIN') {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2);
        continue;
      }
      if (error.code === 'EPIPE') return;
      throw error;
    }
  }
}

function lines(value) {
  if (value === undefined || value === null) return [];
  const list = Array.isArray(value) ? value : [value];
  return list.flatMap((item) => String(item).split('\n'));
}

/** A raw line on stdout, in every mode. For commands whose purpose is a document or a listing. */
export function print(text = '') {
  writeAll(1, `${text}\n`);
}

/** The one line a command prints on success. Silent in JSON mode. */
export function ok(line) {
  if (state.json) return;
  print(line);
}

/** 'warn:  <message>' (two spaces) on stdout, per design 5.12. Silent in JSON mode. */
export function warn(message) {
  if (state.json) return;
  for (const l of lines(message)) print(`warn:  ${l}`);
}

/** 'error: <message> — [<rule>]', the validator error line of design 5.12. */
export function errorLine(message, rule) {
  return rule ? `error: ${message} — [${rule}]` : `error: ${message}`;
}

/** errorLine for each { message, rule } of a validator result. */
export function errorLines(list) {
  return (list ?? []).map((e) => errorLine(e.message, e.rule));
}

/** Failure lines on stderr, in every mode. Accepts a string, a multi-line string or an array. */
export function fail(text) {
  for (const l of lines(text)) writeAll(2, `${l}\n`);
}

/** One JSON document on stdout, pretty-printed, newline-terminated. */
export function json(value) {
  writeAll(1, `${JSON.stringify(value, null, 2)}\n`);
}

/** Prints the line (when given) and exits with the code. */
export function exitWith(code, line) {
  if (line !== undefined && line !== null) {
    if (code === EXIT.ok) ok(line);
    else fail(line);
  }
  process.exit(code);
}

/** One success line, exit 0. */
export function exitOk(line) {
  exitWith(EXIT.ok, line);
}

/** Failure lines on stderr, exit 1: a usage or environment error. */
export function exitUsage(text) {
  exitWith(EXIT.usage, text);
}

/** Failure lines on stderr, exit 2: a failed check or a blocking decision. */
export function exitBlocked(text) {
  exitWith(EXIT.blocked, text);
}
