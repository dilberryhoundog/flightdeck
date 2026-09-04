// flightcrew/checks/validators/validate-return.mjs — validates one stored agent return against the schema of its kind: a worker return, an explorer return, a verifier verdict or a set of critic findings.
// Usage: node flightdeck/flightcrew/checks/validators/validate-return.mjs <return.json> [--kind worker|explorer|verifier|critic] [--schema <file>] [--strict]
//
// Exports: KIND_SCHEMA (the kind-to-schema table); kindOf(file) (the kind a stored path implies); checkReturn(file,
// { kind, schema }) → { document, kind, errors: [{ rule, message }], warnings }; main(argv). Rule ids are the schema
// keywords of design 5.12. The kind may be left out when the file sits at one of the stored return paths of design
// 5.5 — returns/explore-<id>.json, returns/verify-<n>.json, review/pass-<n>.json, returns/<unit>.json — whose shapes
// the paths themselves name. Exit 0, or 2 on any error and on any warning under --strict. Importing this module has
// no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { loadSchema, validate } from '../lib/schema-lib.mjs';

const USAGE = 'usage: validate-return.mjs <return.json> [--kind worker|explorer|verifier|critic] [--schema <file>] [--strict]';

/** The schema each return kind is validated against (design 5.5, spec I8). */
export const KIND_SCHEMA = {
  worker: 'worker-return',
  explorer: 'explorer-return',
  verifier: 'verifier-verdict',
  critic: 'critic-findings',
};

/** The command line this validator accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, kind: null, schema: null, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg === '--strict') opts.strict = true;
    else if (arg === '--kind') {
      i += 1;
      if (argv[i] === undefined) throw new Error('--kind needs a return kind');
      opts.kind = String(argv[i]);
    } else if (arg === '--schema') {
      i += 1;
      if (argv[i] === undefined) throw new Error('--schema needs a file');
      opts.schema = String(argv[i]);
    } else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no return file given');
  if (opts.kind !== null && !(opts.kind in KIND_SCHEMA)) {
    throw new Error(`unknown kind ${opts.kind}: expected one of ${Object.keys(KIND_SCHEMA).join(', ')}`);
  }
  return opts;
}

/** The kind the stored path of a return implies, or null when the path names no kind of its own. */
export function kindOf(file) {
  const resolved = path.resolve(file);
  const name = path.basename(resolved);
  const folder = path.basename(path.dirname(resolved));
  if (folder === 'review' && /^pass-\d+\.json$/.test(name)) return 'critic';
  if (folder === 'returns') {
    if (/^explore-.+\.json$/.test(name)) return 'explorer';
    if (/^verify-\d+\.json$/.test(name)) return 'verifier';
    return 'worker';
  }
  return null;
}

function readJson(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`${file} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

/** The schema document: the file named by --schema, or the kind's schema from the schemas directory. */
function schemaFor(kind, file) {
  if (!file) return loadSchema(KIND_SCHEMA[kind]);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`schema ${file} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`schema ${file} is not valid JSON: ${error.message}`);
  }
}

/** Every violation of one stored return, judged by the schema of its kind. */
export function checkReturn(file, { kind = null, schema = null } = {}) {
  const decided = kind ?? kindOf(file);
  if (!decided) {
    throw new Error(`${path.basename(file)} does not name its kind: pass --kind ${Object.keys(KIND_SCHEMA).join('|')}`);
  }
  const document = readJson(file);
  const { errors } = validate(schemaFor(decided, schema), document);
  return { document, kind: decided, errors: errors.map((e) => ({ rule: e.rule, message: e.message })), warnings: [] };
}

/** Prints the violations and returns the exit code: 2 on any error, 2 on a warning under --strict, 0 otherwise. */
export function report({ errors = [], warnings = [] }, { strict = false, okLine = null } = {}) {
  for (const e of errors) fail(`error: ${e.message} — [${e.rule}]`);
  for (const w of warnings) warn(w);
  if (errors.length > 0) return EXIT.blocked;
  if (strict && warnings.length > 0) return EXIT.blocked;
  if (okLine && warnings.length === 0) print(okLine);
  return EXIT.ok;
}

/** Runs the validator over one file. Returns the exit code rather than exiting, so fc can call it in process. */
export function main(argv = []) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  let result;
  try {
    result = checkReturn(opts.file, { kind: opts.kind, schema: opts.schema });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid ${result.kind} return` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
