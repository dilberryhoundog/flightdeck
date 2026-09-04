// testbench/suites/run-all/run.mjs — T23 (spec B33, I9): a copy of testbench/run-all.mjs in a temporary testbench runs every suites/*/run.mjs in name order, prints one line per suite, and exits 0 when all pass and 2 when any exits non-zero; one real suite is checked against the suite protocol.
// Usage: node flightdeck/testbench/suites/run-all/run.mjs; exit 0 when every case passes, 2 otherwise.
//
// Scope note: the run-all hygiene rule (a suite that leaves an entry under os.tmpdir() or a git status line outside runs/ fails the run) is constraint C7, proved by suites/constraints; B33 fixes only the exit codes and the per-suite lines, so no case here asserts hygiene.

import fs from 'node:fs';
import path from 'node:path';
import { suite, sh, tmp, initRepo, FD, SUITES, writeText, exists, assert, assertEq, assertMatch, assertExit } from '../../lib/suite-lib.mjs';

const RUN_ALL = path.join(FD, 'testbench', 'run-all.mjs');

const PASS = "for (const l of ['pass  one', 'pass  two', '2/2 passed']) console.log(l);\nprocess.exit(0);\n";
const FAIL = "for (const l of ['pass  one', 'FAIL  two: expected failure', '1/2 passed']) console.log(l);\nprocess.exit(2);\n";
const CRASH = "throw new Error('this suite crashes before printing anything');\n";

/** A temporary repository holding flightdeck/testbench/run-all.mjs (copied) and the given fake suites, committed. */
function mkTestbench(suites) {
  assert(exists(RUN_ALL), 'flightdeck/testbench/run-all.mjs exists');
  const root = tmp('fc-runall');
  const tb = path.join(root, 'flightdeck', 'testbench');
  fs.mkdirSync(path.join(tb, 'suites'), { recursive: true });
  fs.copyFileSync(RUN_ALL, path.join(tb, 'run-all.mjs'));
  for (const [name, body] of Object.entries(suites)) writeText(path.join(tb, 'suites', name, 'run.mjs'), body);
  initRepo(root);
  return { root, tb, run: () => sh(`"${process.execPath}" "${path.join(tb, 'run-all.mjs')}"`, { cwd: root }) };
}

function suiteLines(stdout, names) {
  const lines = stdout.split('\n').filter((l) => l.trim() !== '');
  const perSuite = {};
  for (const name of names) perSuite[name] = lines.filter((l) => l.includes(name));
  return { lines, perSuite };
}

await suite('run-all', [
  {
    id: 'runs-every-suite-in-name-order-one-line-each-exit-0',
    covers: ['B33', 'I9'],
    fn: () => {
      const names = ['suite-c', 'suite-a', 'suite-b'];
      const tb = mkTestbench(Object.fromEntries(names.map((n) => [n, PASS])));
      const r = tb.run();
      assertExit(r, 0, 'run-all with every suite passing');
      const { perSuite } = suiteLines(r.stdout, names);
      for (const name of names) assertEq(perSuite[name].length, 1, `exactly one line for ${name}`);
      const order = [...names].sort().map((n) => r.stdout.indexOf(perSuite[n][0]));
      assert(order[0] < order[1] && order[1] < order[2], 'suite lines appear in name order');
    },
  },
  {
    id: 'exits-2-when-a-suite-exits-2',
    covers: ['B33', 'I9'],
    fn: () => {
      const tb = mkTestbench({ 'suite-a': PASS, 'suite-b': FAIL });
      const r = tb.run();
      assertExit(r, 2, 'run-all with one failing suite');
      const { perSuite } = suiteLines(r.stdout, ['suite-a', 'suite-b']);
      assertEq(perSuite['suite-a'].length, 1, 'one line for the passing suite');
      assertEq(perSuite['suite-b'].length, 1, 'one line for the failing suite');
      assertMatch(perSuite['suite-b'][0], /fail/i, 'the failing suite line says so');
    },
  },
  {
    id: 'exits-2-when-a-suite-crashes',
    covers: ['B33'],
    fn: () => {
      const tb = mkTestbench({ 'suite-a': PASS, 'suite-b': CRASH });
      const r = tb.run();
      assertExit(r, 2, 'run-all with a crashing suite (exit 1, no count line)');
      assertEq(suiteLines(r.stdout, ['suite-b']).perSuite['suite-b'].length, 1, 'one line for the crashing suite');
    },
  },
  {
    id: 'a-real-suite-follows-the-protocol',
    covers: ['I9'],
    fn: () => {
      const file = path.join(SUITES, 'manifest', 'run.mjs');
      assert(exists(file), 'suites/manifest/run.mjs exists');
      const r = sh(`"${process.execPath}" "${file}"`, { cwd: FD });
      const lines = r.stdout.split('\n').filter((l) => l !== '');
      assert(lines.length >= 2, 'the suite prints case lines and a count');
      const count = /^(\d+)\/(\d+) passed$/.exec(lines[lines.length - 1]);
      assert(count, `the last line is '<n>/<m> passed' (got ${lines[lines.length - 1]})`);
      const caseLines = lines.slice(0, -1).filter((l) => !l.startsWith('covers: '));
      assertEq(caseLines.length, Number(count[2]), 'one line per case');
      for (const line of caseLines) assertMatch(line, /^(pass  \S|FAIL  \S)/, 'case line format');
      const passed = caseLines.filter((l) => l.startsWith('pass  ')).length;
      assertEq(passed, Number(count[1]), 'the count agrees with the pass lines');
      assertEq(r.code, passed === Number(count[2]) ? 0 : 2, 'exit 0 when all pass, else 2');
    },
  },
]);
