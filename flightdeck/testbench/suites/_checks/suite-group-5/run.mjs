// testbench/suites/_checks/suite-group-5/run.mjs — T58 (B4, C2): the suites of group 5 of 8 pass, run serially as run-all runs them, and leave the temporary directory and the checkout unchanged.
// Usage: node flightdeck/testbench/suites/_checks/suite-group-5/run.mjs; exit 0 when every suite of the group passes cleanly, 2 otherwise.

import { runGroup } from '../lib/group-run.mjs';

await runGroup(5);
