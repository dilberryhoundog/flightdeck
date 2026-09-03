// flightcrew/checks/validators/validate-kickoff.mjs — validates a rendered kickoff.md: the header block's fields, the pointers it hands the orchestrator, and the crew names under its Roles heading.
// Usage: node flightdeck/flightcrew/checks/validators/validate-kickoff.mjs <kickoff.md> [--strict]
//
// Exports: parseHeader(text) → { fields, title, lines }; rolesNames(text); checkKickoff(file, { env, cwd }) →
// { header, errors: [{ rule, message }], warnings }; main(argv). Rule ids are kickoff-rule-1 … kickoff-rule-5:
// 1 the header carries the title line and every field of the kickoff header block; 2 the spec and tests-map paths
// resolve, '(none)' standing for an unpinned map; 3 a recorded commit is a 7 to 40 character hex hash, or 'draft'
// when the launch recorded allow_draft; 4 every prior-reports path resolves, 'none' standing for an empty list;
// 5 every backticked name under Roles has a flightcrew/crew/<name>.md. Paths in the header are repository-relative,
// so they are resolved against the root the kickoff's own launch folder sits in. Exit 0, or 2 on any error and on
// any warning under --strict. Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { launchFile, readLaunch, resolveLaunch, resolveRoot } from '../lib/launch-lib.mjs';

const USAGE = 'usage: validate-kickoff.mjs <kickoff.md> [--strict]';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CREW_DIR = path.resolve(HERE, '..', '..', 'crew');
const HASH = /^[0-9a-f]{7,40}$/;
const FIELDS = ['launch', 'spec', 'tests-map', 'kickoff version', 'read first', 'prior reports', 'write plan with', 'evidence'];
const NAME = /^[a-z][a-z0-9-]*$/;

/** The command line this validator accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, strict: false };
  for (const raw of argv) {
    const arg = String(raw);
    if (arg === '--strict') opts.strict = true;
    else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no kickoff.md given');
  return opts;
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`${file} could not be read: ${error.message}`);
  }
}

/**
 * The header block of a rendered kickoff: the title line, then one or more lines carrying '<label>: <value>' fields
 * separated by runs of two or more spaces. The block ends at the first blank line, library part marker or heading.
 * Returns { title, fields: Map label → value, lines }.
 */
export function parseHeader(text) {
  const fields = new Map();
  const lines = [];
  let title = null;
  for (const line of String(text ?? '').split('\n')) {
    if (line.trim() === '' || line.startsWith('<!--') || line.startsWith('## ')) break;
    if (title === null && line.startsWith('# ')) {
      title = line.slice(2).trim();
      continue;
    }
    lines.push(line);
    for (const segment of line.split(/ {2,}/)) {
      const at = segment.indexOf(': ');
      if (at === -1) continue;
      const label = segment.slice(0, at).trim();
      if (label !== '' && !fields.has(label)) fields.set(label, segment.slice(at + 2).trim());
    }
  }
  return { title, fields, lines };
}

/** The backticked single-word names under the Roles heading, in document order and without repeats. */
export function rolesNames(text) {
  const lines = String(text ?? '').split('\n');
  const start = lines.findIndex((line) => /^##\s+Roles\b/.test(line));
  if (start === -1) return [];
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  const section = (end === -1 ? rest : rest.slice(0, end)).join('\n');
  const names = [];
  for (const match of section.matchAll(/`([^`\n]+)`/g)) {
    const name = match[1].trim();
    if (NAME.test(name) && !names.includes(name)) names.push(name);
  }
  return names;
}

/** The launch folder the kickoff sits in, else the launch the environment resolves. Returns { dir, json } or null. */
function findLaunchFor(file, { env = process.env, cwd = process.cwd() } = {}) {
  let dir = path.dirname(path.resolve(file));
  for (let depth = 0; depth < 8; depth += 1) {
    if (isFile(launchFile(dir))) {
      try {
        return { dir, json: readLaunch(dir) };
      } catch {
        return { dir, json: null };
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const { launchDir } = resolveRoot({ env, cwd, scriptDir: HERE });
    const found = resolveLaunch({ env, launchDir });
    return { dir: found.dir, json: found.json };
  } catch {
    return null;
  }
}

/** The repository roots a header path may be relative to: the tree the kickoff sits in, then the resolved root. */
function rootsFor(file, { env = process.env, cwd = process.cwd() } = {}) {
  const roots = [];
  let dir = path.dirname(path.resolve(file));
  for (let depth = 0; depth < 8; depth += 1) {
    if (fs.existsSync(path.join(dir, 'flightdeck', 'launch'))) {
      roots.push(dir);
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  try {
    const { root } = resolveRoot({ env, cwd, scriptDir: HERE });
    if (!roots.includes(root)) roots.push(root);
  } catch {
    // no second root to try; the tree the kickoff sits in is the only candidate
  }
  return roots;
}

/** A '<path> @ <commit>' field split into its two halves; the commit is null when the field carries no '@' part. */
function splitPointer(value) {
  const text = String(value ?? '').trim();
  const at = text.lastIndexOf(' @ ');
  if (at === -1) return { path: text, commit: null };
  return { path: text.slice(0, at).trim(), commit: text.slice(at + 3).trim() };
}

/**
 * Every violation of one rendered kickoff. The launch the kickoff belongs to supplies allow_draft and the pin state
 * the '(none)' tests-map field is judged against; when no launch can be read, the header is judged on its own.
 */
export function checkKickoff(file, { env = process.env, cwd = process.cwd() } = {}) {
  const text = readText(file);
  const header = parseHeader(text);
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });

  const launch = findLaunchFor(file, { env, cwd });
  const allowDraft = launch?.json?.allow_draft === true;
  const roots = rootsFor(file, { env, cwd });
  const resolves = (relative) => roots.some((root) => isFile(path.resolve(root, relative)));

  // 1: the header carries the title line and every field.
  if (!header.title || !/^Kickoff:\s*\S/.test(header.title)) {
    error('kickoff-rule-1', "the first line is not '# Kickoff: <task part> · <shape part>'");
  }
  for (const label of FIELDS) {
    if (!header.fields.has(label)) error('kickoff-rule-1', `the header block carries no '${label}:' field`);
  }

  // 2 and 3: the two pinned pointers resolve and their commits are hashes.
  const pinned = [['spec', header.fields.get('spec')], ['tests-map', header.fields.get('tests-map')]];
  for (const [label, value] of pinned) {
    if (value === undefined) continue;
    if (label === 'tests-map' && value === '(none)') {
      if (launch?.json && launch.json.tests_map) {
        error('kickoff-rule-2', "tests-map reads (none) but the launch has a tests map pinned; re-render the kickoff");
      }
      continue;
    }
    const pointer = splitPointer(value);
    if (pointer.path === '') {
      error('kickoff-rule-2', `the ${label} field names no path`);
    } else if (!resolves(pointer.path)) {
      error('kickoff-rule-2', `the ${label} field names ${pointer.path}, which does not exist`);
    }
    if (pointer.commit === null || pointer.commit === '') continue;
    if (pointer.commit === 'draft') {
      if (!allowDraft) {
        error('kickoff-rule-3', `the ${label} field reads '@ draft' but the launch has not recorded allow_draft`);
      }
    } else if (!HASH.test(pointer.commit)) {
      error('kickoff-rule-3', `the ${label} commit ${pointer.commit} is neither a 7 to 40 character hex hash nor 'draft'`);
    }
  }

  // 4: every prior report resolves.
  const priors = header.fields.get('prior reports');
  if (priors !== undefined && priors !== 'none') {
    for (const entry of priors.split(/[,\s]+/).filter((token) => token !== '')) {
      if (!resolves(entry)) error('kickoff-rule-4', `prior reports names ${entry}, which does not exist`);
    }
  }

  // 5: every backticked name under Roles is a crew member.
  const names = rolesNames(text);
  if (names.length === 0) {
    error('kickoff-rule-5', 'no backticked agent name appears under the Roles heading');
  }
  for (const name of names) {
    if (!isFile(path.join(CREW_DIR, `${name}.md`))) {
      error('kickoff-rule-5', `Roles names \`${name}\`, which has no flightcrew/crew/${name}.md`);
    }
  }

  return { header, errors, warnings };
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
export function main(argv = [], { env = process.env, cwd = process.cwd() } = {}) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  let result;
  try {
    result = checkKickoff(opts.file, { env, cwd });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is a valid kickoff` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
