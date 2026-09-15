// testbench/suites/_checks/sweep-distributed-1/run.mjs — T51 (B2): breaking any of chunk 1 of 3 of the distributed files turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-distributed-1/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind.startsWith('distributed'), 'distributed files', 1, 3);
