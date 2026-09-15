// testbench/suites/_checks/map-kind-class/run.mjs — T14 (B5, C3): every check in this spec's tests map declares one of the seven kinds of testing-description.md and one of the four classes of verification-addendum.md.
// Usage: node flightdeck/testbench/suites/_checks/map-kind-class/run.mjs; exit 0 when every check carries both, 2 otherwise.

import path from 'node:path';
import { none, readJson, REPO, report } from '../lib/check-lib.mjs';
import { mapClassProblems } from '../lib/rules.mjs';
import { mapFile } from '../lib/map-file.mjs';

await report(['B5', 'C3'], [
  {
    name: 'every check in the tests map carries a kind and a class',
    fn: () => {
      const rel = mapFile(REPO);
      const parsed = readJson(path.join(REPO, rel));
      if (!parsed.ok) throw new Error(parsed.error);
      none(mapClassProblems(parsed.value, rel), 'checks without a kind or a class');
    },
  },
]);
