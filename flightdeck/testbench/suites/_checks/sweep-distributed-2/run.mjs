// testbench/suites/_checks/sweep-distributed-2/run.mjs — T52 (B2): breaking any of chunk 2 of 3 of the distributed files turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-distributed-2/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind.startsWith('distributed'), 'distributed files', 2, 3);
