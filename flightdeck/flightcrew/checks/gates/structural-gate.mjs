// flightcrew/checks/gates/structural-gate.mjs — runs the active launch's structural command for one file's extension: the parse-level check that keeps a broken file from travelling any further than the edit that made it.
// Usage: node flightdeck/flightcrew/checks/gates/structural-gate.mjs <file>; exit 0 when the file is sound or its extension has no command, 2 when the command fails, 1 when no launch resolves or no file is named.
//
// Exports: commandFor(structural, file) → the command string with {file} replaced by the shell-quoted absolute path,
// or null when the extension has no command; check(file, { structural, cwd }) → { ran, code, output, blocking };
// run(context) → { ran, reason?, checks: [...] }, the gate shape; main(argv).
// The command runs through /bin/sh -c with the working directory of the repository the file belongs to, in every
// phase; only the last 20 combined output lines are reported, which is what a session can act on.
// Importing this module has no side effect.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, ok } from '../lib/output.mjs';
import { toplevel } from '../lib/git-lib.mjs';
import { gateContext } from './acceptance-gate.mjs';

const MAX_BUFFER = 16 * 1024 * 1024;
const TIMEOUT_MS = 300_000;
const TAIL = 20;

/** One path as a single-quoted shell word, safe for any character a filename may hold. */
function quote(value) {
  return `'${String(value).split("'").join("'\\''")}'`;
}

/** The last n non-empty lines of a command's combined output. */
function tailLines(text, n = TAIL) {
  return String(text ?? '').split('\n').filter((line) => line.trim() !== '').slice(-n);
}

/** The structural command for a file's extension, with {file} replaced by its shell-quoted absolute path, or null. */
export function commandFor(structural, file) {
  const table = structural && typeof structural === 'object' ? structural : {};
  const template = table[path.extname(String(file))];
  if (typeof template !== 'string' || template.trim() === '') return null;
  return template.split('{file}').join(quote(path.resolve(file)));
}

/**
 * Runs the structural command for one file. Returns { ran, code, output, blocking }: ran is false when the extension
 * has no command, which is not a failure — a launch names commands only for the file kinds it wants parsed.
 */
export function check(file, { structural = null, cwd = null } = {}) {
  const command = commandFor(structural, file);
  if (command === null) return { ran: false, code: 0, output: '', blocking: false };
  const absolute = path.resolve(file);
  const where = cwd ?? toplevel(path.dirname(absolute)) ?? path.dirname(absolute);
  const result = spawnSync('/bin/sh', ['-c', command], {
    cwd: where,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    killSignal: 'SIGKILL',
  });
  if (result.error) {
    return { ran: true, code: null, output: `structural check could not run: ${result.error.message}`, blocking: true };
  }
  const code = typeof result.status === 'number' ? result.status : null;
  const output = tailLines(`${result.stdout ?? ''}${result.stderr ?? ''}`).join('\n');
  return { ran: true, code, output, blocking: code !== 0 };
}

/** The gate form: one file, judged against the launch's structural table. context.file names the file to check. */
export async function run(context = {}) {
  const file = context.file;
  if (!file) return { ran: false, reason: 'no file was named', checks: [] };
  const outcome = check(file, { structural: context.launchJson?.structural, cwd: context.cwd ?? null });
  if (!outcome.ran) {
    return { ran: false, reason: `no structural command for ${path.extname(String(file)) || 'a file with no extension'}`, checks: [] };
  }
  return {
    ran: true,
    checks: [{ id: path.basename(String(file)), verdict: outcome.blocking ? 'fail' : 'pass', code: outcome.code, output: outcome.output, blocking: outcome.blocking }],
    extra: [],
  };
}

/** Runs the gate from the command line. Returns the exit code rather than exiting. */
export function main(argv = []) {
  const file = argv.find((arg) => !String(arg).startsWith('--'));
  if (!file) {
    fail('usage: structural-gate.mjs <file>');
    return EXIT.usage;
  }
  let context;
  try {
    context = gateContext({ requireMap: false });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  const outcome = check(file, { structural: context.launchJson?.structural });
  if (!outcome.ran) return EXIT.ok;
  if (!outcome.blocking) {
    ok(`structural gate: ${path.basename(file)} parses`);
    return EXIT.ok;
  }
  fail(outcome.output || `structural check exited ${outcome.code ?? 'non-zero'} with no output`);
  return EXIT.blocked;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
