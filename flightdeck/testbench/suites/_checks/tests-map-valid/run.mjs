// testbench/suites/_checks/tests-map-valid/run.mjs — T39 (I1): this spec's tests map validates against flightdeck/flightcrew/schemas/tests-map.schema.json and its invariants through fc validate tests-map.
// Usage: node flightdeck/testbench/suites/_checks/tests-map-valid/run.mjs; exit 0 when the validator exits 0, 2 otherwise.

import path from 'node:path';
import { ensure, REPO, report, runNode } from '../lib/check-lib.mjs';
import { mapFile } from '../lib/map-file.mjs';

await report(['I1'], [
  {
    name: 'fc validate tests-map exits 0 on the tests map',
    fn: () => {
      const rel = mapFile(REPO);
      const r = runNode(REPO, [path.join(REPO, 'flightdeck/flightcrew/bin/fc.mjs'), 'validate', 'tests-map', rel]);
      ensure(r.exit === 0, `the validator exited ${r.exit}: ${`${r.stdout}${r.stderr}`.trim().split('\n').slice(0, 5).join(' | ')}`);
    },
  },
]);
