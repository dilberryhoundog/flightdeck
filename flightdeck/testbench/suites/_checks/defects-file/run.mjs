// testbench/suites/_checks/defects-file/run.mjs — T26 (B11, I4): the defects file in the run's evidence folder lists every defect the suites mark, one line each in the interface's form, and nothing else.
// Usage: node flightdeck/testbench/suites/_checks/defects-file/run.mjs; exit 0 when the file equals the set of printed defect lines, 2 otherwise.

import path from 'node:path';
import { none, readText, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { defectsFileProblems, locateDefectsFile, printedDefects } from '../lib/rules.mjs';

let outputs = null;
let prep = null;
try {
  outputs = await indexOutputs(REPO);
} catch (error) {
  prep = error;
}
let rel = null;

await report(['B11', 'I4'], [
  {
    name: "the defects file exists in the evidence folder of this spec's launch",
    fn: () => {
      rel = locateDefectsFile(REPO);
    },
  },
  {
    name: 'the defects file carries every defect line the suites print, and only those',
    fn: () => {
      if (prep) throw prep;
      if (rel === null) rel = locateDefectsFile(REPO);
      none(defectsFileProblems(printedDefects(outputs, specIds()), readText(path.join(REPO, rel)), rel), 'defects file problems');
    },
  },
]);
