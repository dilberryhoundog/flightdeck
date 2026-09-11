// checks/run-suite.mjs — the one thing every check of this map does: run the suite that holds its assertions and hand back what it said.
// A check is the wrapper the tests map names; the tests it invokes are the suites the project owns under flightdeck/testbench/suites/ (I16).
// Usage, from a T<n>.mjs beside this file: import { runSuite } from './run-suite.mjs'; await runSuite('<suite name>');

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** checks → run-1 → runs → flightcrew-core → launch → flightdeck → the repository root. */
export const REPO = path.resolve(HERE, '..', '..', '..', '..', '..', '..');
export const SUITES = path.join(REPO, 'flightdeck', 'testbench', 'suites');

/**
 * Runs one suite and exits with its verdict: 0 when every case passed, 2 otherwise. A suite that is not there,
 * or that cannot be spawned, is a failure of this check and says so on stderr rather than passing quietly.
 */
export function runSuite(name) {
  const file = path.join(SUITES, name, 'run.mjs');
  if (!fs.existsSync(file)) {
    process.stderr.write(`FAIL  ${name}: no suite at flightdeck/testbench/suites/${name}/run.mjs\n`);
    process.exit(2);
  }
  const result = spawnSync(process.execPath, [file], {
    cwd: REPO,
    encoding: 'utf8',
    stdio: ['ignore', 'inherit', 'inherit'],
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) {
    process.stderr.write(`FAIL  ${name}: could not run the suite: ${result.error.message}\n`);
    process.exit(2);
  }
  process.exit(result.status === 0 ? 0 : 2);
}

/** The path of a judge's sheet for a check id, as a sheet check's command prints it (I15). */
export function sheetPath(id) {
  return path.join(REPO, 'flightdeck', 'launch', 'flightcrew-core', 'runs', 'run-1', 'returns', `judge-${id}.json`);
}

/**
 * A sheet check: print the path of the judge's return for this id, then take that sheet's verdict.
 * An absent sheet, one that fails its shape, or one carrying an empty quote, is not a pass.
 */
export function runSheet(id) {
  const file = sheetPath(id);
  process.stdout.write(`${path.relative(REPO, file)}\n`);
  if (!fs.existsSync(file)) {
    process.stderr.write(`FAIL  ${id}: no judge sheet at ${path.relative(REPO, file)}\n`);
    process.exit(2);
  }
  let sheet;
  try {
    sheet = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    process.stderr.write(`FAIL  ${id}: the sheet is not JSON: ${error.message}\n`);
    process.exit(2);
  }
  const problems = [];
  if (typeof sheet.rubric !== 'string' || !sheet.rubric.includes(`${id}.md`)) problems.push('the sheet does not name this check\'s rubric');
  if (typeof sheet.subject !== 'string' || sheet.subject.trim() === '') problems.push('the sheet names no subject');
  if (!Array.isArray(sheet.answers) || sheet.answers.length === 0) problems.push('the sheet answers nothing');
  for (const [index, answer] of (sheet.answers ?? []).entries()) {
    if (!['yes', 'no'].includes(answer?.answer)) problems.push(`answer ${index + 1} is neither yes nor no`);
    if (typeof answer?.quote !== 'string' || answer.quote.trim() === '') problems.push(`answer ${index + 1} carries no quote`);
  }
  if (!['pass', 'fail'].includes(sheet.verdict)) problems.push('the sheet carries no verdict');
  if (problems.length > 0) {
    for (const problem of problems) process.stderr.write(`FAIL  ${id}: ${problem}\n`);
    process.exit(2);
  }
  if (sheet.verdict !== 'pass') {
    const no = sheet.answers.filter((answer) => answer.answer === 'no');
    process.stderr.write(`FAIL  ${id}: the judge returned fail on ${no.length} of ${sheet.answers.length} questions\n`);
    for (const answer of no) process.stderr.write(`  no: ${answer.question}\n`);
    process.exit(2);
  }
  process.exit(0);
}
