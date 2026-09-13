#!/usr/bin/env node
// suites/suite-protocol — I12: the lines a suite prints, the exits it takes, and the run-all that gathers them.
import path from 'node:path';
import { FD, SUITES, assert, assertEq, assertMatch, exists, listFiles, readText, sh, suite, tmp, writeText } from '../../lib/core-lib.mjs';

const RUN_ALL = path.join(FD, 'testbench', 'run-all.mjs');
const LIB = path.join(FD, 'testbench', 'lib', 'suite-lib.mjs');

/** A one-case suite run through the shared runner, in a scratch directory, with the case passing or failing. */
function probe(passing) {
  const dir = tmp('fc-protocol');
  const body = passing ? '() => {}' : "() => { throw new Error('the probe case failed'); }";
  const source = `import { suite } from ${JSON.stringify(LIB)};\nawait suite('probe', [{ id: 'probe-case', covers: ['B1', 'E2'], fn: ${body} }]);\n`;
  const file = path.join(dir, 'probe.mjs');
  writeText(file, source);
  return sh(`node ${JSON.stringify(file)}`, { cwd: dir });
}

await suite('suite-protocol', [
  {
    id: 'I12 a passing suite prints one line per case, a covers line and a count, and exits 0',
    covers: ['I12'],
    fn: () => {
      const result = probe(true);
      assertEq(result.code, 0, `a passing suite exits 0: ${result.stdout}${result.stderr}`);
      const lines = result.stdout.split('\n').filter((line) => line.trim() !== '');
      assertEq(lines[0], 'pass  probe-case', 'the case line');
      assertMatch(result.stdout, /^covers: B1 E2$/m, 'the covers line names the spec ids');
      assertEq(lines.at(-1), '1/1 passed', 'the count line closes the output');
    },
  },
  {
    id: 'I12 a failing suite says which case and why, and exits 2',
    covers: ['I12'],
    fn: () => {
      const result = probe(false);
      assertEq(result.code, 2, `a failing suite exits 2: ${result.stdout}${result.stderr}`);
      assertMatch(result.stdout, /^FAIL {2}probe-case: the probe case failed$/m, 'the failure names the case and the reason');
      assertMatch(result.stdout, /^0\/1 passed$/m, 'the count line');
    },
  },
  {
    id: 'I12 every suite is a run.mjs that needs no argument',
    covers: ['I12'],
    fn: () => {
      const directories = [...new Set(listFiles(SUITES).map((rel) => rel.split('/')[0]))].filter((name) => !name.startsWith('_'));
      assert(directories.length > 0, 'there are suites');
      for (const name of directories) {
        const file = path.join(SUITES, name, 'run.mjs');
        assert(exists(file), `suites/${name}/run.mjs exists`);
        const text = readText(file);
        assert(!/process\.argv\[2\]/.test(text), `suites/${name}/run.mjs takes no argument`);
        assertMatch(text.split('\n').slice(0, 3).join('\n'), /suites\//, `suites/${name}/run.mjs says what it is in its first lines`);
      }
    },
  },
  {
    id: 'I12 run-all is there and reports a usage error when it is asked for nothing',
    covers: ['I12'],
    fn: () => {
      assert(exists(RUN_ALL), 'testbench/run-all.mjs exists');
      const result = sh(`node ${JSON.stringify(RUN_ALL)} --only fc-no-such-suite-anywhere`, { cwd: path.join(FD, '..') });
      assertEq(result.code, 1, `run-all with nothing to run is a usage error: ${result.stdout}${result.stderr}`);
    },
  },
]);
