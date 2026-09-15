// testbench/suites/_checks/sweep-schemas-2/run.mjs — T43 (B2): breaking any of chunk 2 of 2 of the schemas turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-schemas-2/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind === 'schema', 'schemas', 2, 2);
