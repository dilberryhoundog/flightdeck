// testbench/suites/_checks/output-protocol-selftest/run.mjs — T13 (E8): the protocol check fails a suite whose output departs from the protocol, naming the suite and the line, for lines out of order, malformed or missing.
// Usage: node flightdeck/testbench/suites/_checks/output-protocol-selftest/run.mjs; exit 0 when every fixture is judged as expected, 2 otherwise.
//
// The fixtures are fixtures/protocol/*.txt with their expected verdicts in fixtures/protocol/cases.json. One further case runs a
// suite process in a scratch repository through the same runner the protocol check uses.

import fs from 'node:fs';
import path from 'node:path';
import { ensure, FIXTURES, gitRun, report, specIds, suiteOutputs, tempDir, writeTree } from '../lib/check-lib.mjs';
import { readOutput } from '../lib/protocol.mjs';

const ids = specIds();
const dir = path.join(FIXTURES, 'protocol');
const table = JSON.parse(fs.readFileSync(path.join(dir, 'cases.json'), 'utf8'));

const cases = table.map((entry) => ({
  name: entry.expect === null ? `${entry.what} reads clean` : `${entry.what} is reported with the suite and line ${entry.expect.line}`,
  fn: () => {
    const suite = `fixture-${entry.file.replace(/\.txt$/, '')}`;
    const read = readOutput({ suite, stdout: fs.readFileSync(path.join(dir, entry.file), 'utf8'), exit: entry.exit }, ids);
    if (entry.expect === null) {
      ensure(read.errors.length === 0, `expected no departures, got: ${read.errors.join('; ')}`);
      return;
    }
    const prefix = `${suite}: line ${entry.expect.line}: `;
    ensure(
      read.errors.some((e) => e.startsWith(prefix) && e.includes(entry.expect.contains)),
      `expected a departure starting '${prefix}' containing '${entry.expect.contains}', got: ${read.errors.join('; ') || 'none'}`,
    );
  },
}));

cases.push({
  name: 'a running suite that prints a malformed line is reported with its name and line',
  fn: async () => {
    const root = tempDir('fc-chk-proto-');
    writeTree(root, {
      'flightdeck/testbench/suites/prints-badly/run.mjs': "import fs from 'node:fs';\nfs.writeSync(1, 'pass  first case\\nPASS  second case\\ncovers: B3\\n1/2 passed\\n');\nprocess.exit(0);\n",
    });
    gitRun(root, ['init', '--quiet']);
    const outputs = await suiteOutputs(root);
    const run = outputs.get('prints-badly');
    ensure(run, 'the scratch suite was not discovered');
    const read = readOutput(run, ids);
    ensure(read.errors.some((e) => e.startsWith('prints-badly: line 2: ')), `expected a departure at prints-badly line 2, got: ${read.errors.join('; ') || 'none'}`);
  },
});

await report(['E8'], cases);
