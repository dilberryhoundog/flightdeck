// testbench/suites/_checks/output-protocol/run.mjs — T12 (B3, I2, C2): every suite run-all runs prints its output in the suite output protocol, line by line, and exits as its cases call for.
// Usage: node flightdeck/testbench/suites/_checks/output-protocol/run.mjs; exit 0 when every suite's output reads clean, 2 otherwise.
//
// One case per suite; a failing case names the suite and every departing line by number (the reader is ../lib/protocol.mjs).

import { none, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { readOutput } from '../lib/protocol.mjs';

let outputs = new Map();
let prep = null;
try {
  outputs = await indexOutputs(REPO);
  if (outputs.size === 0) throw new Error('no suite under flightdeck/testbench/suites/ to read');
} catch (error) {
  prep = error;
}
const ids = prep ? new Set() : specIds();

await report(
  ['B3', 'I2', 'C2'],
  prep
    ? [{ name: 'the suites run', fn: () => { throw prep; } }]
    : [...outputs.values()].map((run) => ({
        name: `suite ${run.suite} follows the suite output protocol`,
        fn: () => none(readOutput(run, ids).errors, 'departures from the protocol', 10),
      })),
);
