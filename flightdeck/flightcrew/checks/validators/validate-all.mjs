// flightcrew/checks/validators/validate-all.mjs — runs every validator over every document of a directory tree: the specs, the tests maps, the launch files, the plans, the kickoffs and the stored returns it finds.
// Usage: node flightdeck/flightcrew/checks/validators/validate-all.mjs <dir> [--quiet] [--strict] [--for-freeze]
//
// Exports: KINDS (how a file name names its validator); documentsIn(dir) → [{ file, kind }]; validateAll(dir,
// options) → { results: [{ file, kind, status, errors, warnings }], counts }; main(argv). One 'ok <file>',
// 'warn <file>' or 'FAIL <file>' line per document and a closing count line; --quiet prints the failures and the
// count alone. A document that cannot be read or parsed is a FAIL, never a crash. Exit 0 when nothing failed, 2 when
// a document failed or, under --strict, when one only warned, and 1 when the directory cannot be listed.
// Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print } from '../lib/output.mjs';
import { checkSpec } from './validate-spec.mjs';
import { checkTestsMap } from './validate-tests-map.mjs';
import { checkPlan } from './validate-plan.mjs';
import { checkLaunch } from './validate-launch.mjs';
import { checkKickoff } from './validate-kickoff.mjs';
import { checkReturn, kindOf } from './validate-return.mjs';

const USAGE = 'usage: validate-all.mjs <dir> [--quiet] [--strict] [--for-freeze]';

/** Directories a walk never enters: results, generated pages and another agent's worktree hold no document to validate. */
const SKIP_DIRS = new Set(['.git', 'node_modules', 'evidence', 'worktrees', 'interview']);

/** The kinds this command knows, in the order it reports them for one directory. */
export const KINDS = ['spec', 'tests-map', 'launch', 'plan', 'kickoff', 'return'];

/** The command line this command accepts. */
export function parseArgs(argv = []) {
  const opts = { dir: null, quiet: false, strict: false, forFreeze: false };
  for (const raw of argv) {
    const arg = String(raw);
    if (arg === '--quiet') opts.quiet = true;
    else if (arg === '--strict') opts.strict = true;
    else if (arg === '--for-freeze') opts.forFreeze = true;
    else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.dir === null) opts.dir = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.dir === null) throw new Error('no directory given');
  return opts;
}

/** The kind of document a file name and its folder name make it, or null when the file is neither. */
export function kindOfFile(file) {
  const name = path.basename(file);
  const folder = path.basename(path.dirname(path.resolve(file)));
  if (/^spec\.v\d+\.json$/.test(name)) return 'spec';
  if (/^tests-map\.v\d+\.json$/.test(name)) return 'tests-map';
  if (name === 'launch.json') return 'launch';
  if (name === 'plan.json') return 'plan';
  if (name === 'kickoff.md') return 'kickoff';
  if ((folder === 'returns' || folder === 'review') && name.endsWith('.json') && kindOf(file)) return 'return';
  return null;
}

/** Every document under a directory, deepest last, in walk order. Throws when the directory cannot be listed. */
export function documentsIn(dir) {
  const root = path.resolve(dir);
  let stat;
  try {
    stat = fs.statSync(root);
  } catch (error) {
    throw new Error(`${dir} could not be read: ${error.message}`);
  }
  if (!stat.isDirectory()) {
    const kind = kindOfFile(root);
    if (!kind) throw new Error(`${dir} is not a directory and not a document this command validates`);
    return [{ file: root, kind }];
  }
  const found = [];
  const walk = (current) => {
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
        continue;
      }
      const kind = kindOfFile(full);
      if (kind) found.push({ file: full, kind });
    }
  };
  walk(root);
  return found;
}

/** One document's verdict, with a read or parse failure reported as an error rather than thrown. */
function checkOne({ file, kind }, { forFreeze = false, env = process.env, cwd = process.cwd() } = {}) {
  try {
    if (kind === 'spec') return checkSpec(file, { forFreeze });
    if (kind === 'tests-map') return checkTestsMap(file, { env, cwd });
    if (kind === 'plan') return checkPlan(file, { env, cwd });
    if (kind === 'launch') return checkLaunch(file, {});
    if (kind === 'kickoff') return checkKickoff(file, { env, cwd });
    if (kind === 'return') return checkReturn(file, {});
    return { errors: [{ rule: 'kind', message: `no validator for ${file}` }], warnings: [] };
  } catch (error) {
    return { errors: [{ rule: 'unreadable', message: error.message }], warnings: [] };
  }
}

/**
 * Every document under a directory, each with its status: 'FAIL' when a validator reported an error, 'warn' when it
 * reported only warnings, 'ok' otherwise. Returns { results, counts } and prints nothing.
 */
export function validateAll(dir, { forFreeze = false, env = process.env, cwd = process.cwd() } = {}) {
  const documents = documentsIn(dir);
  const counts = { ok: 0, warn: 0, FAIL: 0, total: documents.length };
  const results = [];
  for (const document of documents) {
    const outcome = checkOne(document, { forFreeze, env, cwd });
    const errors = outcome.errors ?? [];
    const warnings = outcome.warnings ?? [];
    const status = errors.length > 0 ? 'FAIL' : warnings.length > 0 ? 'warn' : 'ok';
    counts[status] += 1;
    results.push({ ...document, status, errors, warnings });
  }
  return { results, counts };
}

/** Runs the command over one directory. Returns the exit code rather than exiting, so fc can call it in process. */
export function main(argv = [], { env = process.env, cwd = process.cwd() } = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  let outcome;
  try {
    outcome = validateAll(opts.dir, { forFreeze: opts.forFreeze, env, cwd });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  const root = path.resolve(opts.dir);
  const base = fs.statSync(root).isDirectory() ? root : path.dirname(root);
  for (const result of outcome.results) {
    const shown = path.relative(base, result.file).split(path.sep).join('/') || path.basename(result.file);
    if (!opts.quiet || result.status === 'FAIL') print(`${result.status} ${shown}`);
    if (result.status === 'FAIL') {
      for (const e of result.errors) fail(`error: ${e.message} — [${e.rule}]`);
    }
  }
  const { ok, warn: warned, FAIL, total } = outcome.counts;
  print(`${total} document${total === 1 ? '' : 's'}: ${ok} ok, ${warned} warn, ${FAIL} FAIL`);
  if (FAIL > 0) return EXIT.blocked;
  if (opts.strict && warned > 0) return EXIT.blocked;
  return EXIT.ok;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
