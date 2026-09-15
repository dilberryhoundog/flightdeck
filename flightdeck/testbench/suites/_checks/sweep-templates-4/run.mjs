// testbench/suites/_checks/sweep-templates-4/run.mjs — T47 (B2): breaking any of chunk 4 of 4 of the templates turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-templates-4/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind === 'template', 'templates', 4, 4);
