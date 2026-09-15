// testbench/suites/_checks/sweep-roles-2/run.mjs — T41 (B2): breaking any of chunk 2 of 2 of the role files turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-roles-2/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind === 'role', 'role files', 2, 2);
