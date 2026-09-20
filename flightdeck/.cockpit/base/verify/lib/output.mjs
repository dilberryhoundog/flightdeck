// base/verify/lib/output.mjs — the one place cockpit-lint writes a line: success lines, warning lines, error lines, JSON mode and the three exit codes.
// Origin: copied from flightcrew, branch `flightcrew-core`, commit 27f6969, file `flightdeck/flightcrew/checks/lib/output.mjs`.
// Changed from the original only here: the meaning of the exit codes, which the cockpit orders as 0 clean, 1 faults,
// 2 tool error, so `EXIT.faults` is 1 and `EXIT.toolError` is 2. The writers below are untouched.
// Usage: import { ok, fail, warn, json, setJson, isJson, errorLine, exitOk, exitFaults, exitToolError, EXIT } from './lib/output.mjs';
//
// Exports: EXIT (the three codes); setJson/isJson (the global --json mode); print (a raw stdout line, always);
// ok (one success line, silent in JSON mode); warn ('warn:  <message>', silent in JSON mode); errorLine/errorLines
// ('error: <message> — [<rule>]' per design 5.12); fail (lines to stderr, always); json (a document to stdout);
// exitOk/exitFaults/exitToolError/exitWith (print then exit 0, 1, 2).
//
// Every write goes through a synchronous writer: a pipe on macOS can be asynchronous, and a process that calls
// process.exit straight after console.log can lose the line. Importing this module has no side effect.

import fs from 'node:fs';

/** 0 clean, 1 faults found in the documents, 2 the tool itself could not run. */
export const EXIT = { ok: 0, faults: 1, toolError: 2 };

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

/** Failure lines on stderr, exit 1: the documents carry faults. */
export function exitFaults(text) {
  exitWith(EXIT.faults, text);
}

/** Failure lines on stderr, exit 2: the tool could not run at all. */
export function exitToolError(text) {
  exitWith(EXIT.toolError, text);
}
