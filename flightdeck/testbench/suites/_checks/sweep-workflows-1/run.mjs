// testbench/suites/_checks/sweep-workflows-1/run.mjs — T50 (B2): breaking any of chunk 1 of 1 of the workflow scripts turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-workflows-1/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind === 'workflow', 'workflow scripts', 1, 1);
