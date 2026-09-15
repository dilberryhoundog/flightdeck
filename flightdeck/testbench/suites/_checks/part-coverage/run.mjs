// testbench/suites/_checks/part-coverage/run.mjs — T2 (B1): every part of flightcrew in the inventory is named by at least one case of the suites run-all runs.
// Usage: node flightdeck/testbench/suites/_checks/part-coverage/run.mjs; exit 0 when the list of unnamed parts is empty, 2 otherwise.
//
// The inventory and the naming rule are defined in ../lib/parts.mjs. Case names are read from every suite's output, pass and FAIL
// lines alike, with a ' [defect]' mark ignored.

import { ensure, none, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { inventory, namingCases } from '../lib/parts.mjs';

const KINDS = ['subcommand', 'hook', 'role', 'schema', 'template', 'validator', 'gate', 'workflow', 'distributed-role', 'distributed-workflow'];
let parts = [];
let outputs = new Map();
let prep = null;
try {
  parts = inventory(REPO);
  outputs = await indexOutputs(REPO);
} catch (error) {
  prep = error;
}

await report(['B1'], [
  {
    name: 'the inventory holds parts of every category B1 names',
    fn: () => {
      if (prep) throw prep;
      const missing = KINDS.filter((k) => !parts.some((p) => p.kind === k));
      ensure(missing.length === 0, `no part of kind ${missing.join(', ')} in the inventory`);
    },
  },
  {
    name: 'every part in the inventory is named by at least one case',
    fn: () => {
      if (prep) throw prep;
      const naming = namingCases(parts, outputs, specIds());
      none(parts.filter((p) => naming.get(p.part).length === 0).map((p) => p.part), `of ${parts.length} parts are named by no case`, 120);
    },
  },
]);
