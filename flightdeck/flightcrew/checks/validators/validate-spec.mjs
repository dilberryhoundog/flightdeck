// flightcrew/checks/validators/validate-spec.mjs — validates one spec file against spec.schema.json and the thirteen coded invariants, printing the error and warning lines of the validator output contract.
// Usage: node flightdeck/flightcrew/checks/validators/validate-spec.mjs <spec.vN.json> [--schema <file>] [--for-freeze] [--strict]
//
// Exports: checkSpec(file, { schema, forFreeze }) → { spec, errors: [{ rule, message }], warnings: [string] };
// main(argv) → the exit code, printing the lines. Errors go to stderr as 'error: <message> — [<rule>]' with the rule
// a schema keyword or invariant-N; warnings go to stdout as 'warn:  <message>'. Exit 0, or 2 on any error and on any
// warning under --strict. --for-freeze rehearses the freeze gate against a draft; --schema overrides the schema file
// the validator would otherwise load from flightcrew/schemas/ beside itself. Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { loadSchema, validate } from '../lib/schema-lib.mjs';
import { checkInvariants, loadSpec } from '../lib/spec-lib.mjs';

const USAGE = 'usage: validate-spec.mjs <spec.vN.json> [--schema <file>] [--for-freeze] [--strict]';

/** The command line this validator accepts. Throws an Error naming the problem for an unknown flag or a missing file. */
export function parseArgs(argv = []) {
  const opts = { file: null, schema: null, forFreeze: false, strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg === '--for-freeze') opts.forFreeze = true;
    else if (arg === '--strict') opts.strict = true;
    else if (arg === '--schema') {
      i += 1;
      opts.schema = argv[i] === undefined ? null : String(argv[i]);
      if (opts.schema === null) throw new Error('--schema needs a file');
    } else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no spec file given');
  return opts;
}

/** The schema document: the file named by --schema, or spec.schema.json from the schemas directory beside this validator. */
function schemaFor(file) {
  if (!file) return loadSchema('spec');
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

/**
 * Every violation of one spec file: the schema keywords first, then the coded invariants, then the judgement
 * warnings. The filename and the containing folder name are read from the path, so a file written to a temporary
 * directory is judged by the name it was written under.
 */
export function checkSpec(file, { schema = null, forFreeze = false } = {}) {
  const spec = loadSpec(file);
  const { errors } = validate(schemaFor(schema), spec);
  const invariants = checkInvariants(spec, {
    filename: path.basename(file),
    folder: path.basename(path.dirname(path.resolve(file))),
    forFreeze,
  });
  return {
    spec,
    errors: [...errors.map((e) => ({ rule: e.rule, message: e.message })), ...invariants.errors],
    warnings: invariants.warnings,
  };
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
    result = checkSpec(opts.file, { schema: opts.schema, forFreeze: opts.forFreeze });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid spec` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
