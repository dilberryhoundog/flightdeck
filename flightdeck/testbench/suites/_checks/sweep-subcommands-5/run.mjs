// testbench/suites/_checks/sweep-subcommands-5/run.mjs — T8 (B2): breaking any of chunk 5 of 6 of the subcommands turns at least one case naming it red.
// Usage: node flightdeck/testbench/suites/_checks/sweep-subcommands-5/run.mjs; exit 0 when every part of the chunk is held or exempt, 2 otherwise.

import { runSweep } from '../lib/sweep-run.mjs';

await runSweep(['B2'], (p) => p.kind === 'subcommand', 'subcommands', 5, 6);
