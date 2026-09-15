// testbench/suites/_checks/defect-markers/run.mjs — T24 (B10): every case marked [defect] passes on the current behaviour and sits beneath its defect line, and every defect line has a marked case beneath it.
// Usage: node flightdeck/testbench/suites/_checks/defect-markers/run.mjs; exit 0 when every marker is sound, 2 otherwise.
//
// Rule over whatever markers the suites print: it holds vacuously while no suite marks a defect.

import { none, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { defectProblems } from '../lib/rules.mjs';

let outputs = null;
let prep = null;
try {
  outputs = await indexOutputs(REPO);
} catch (error) {
  prep = error;
}

await report(['B10'], [
  {
    name: 'every defect marker pins current behaviour and pairs with its defect line',
    fn: () => {
      if (prep) throw prep;
      none(defectProblems(outputs, specIds()), 'defect marker problems');
    },
  },
]);
