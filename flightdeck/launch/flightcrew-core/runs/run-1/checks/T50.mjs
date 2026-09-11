#!/usr/bin/env node
// T50 — I12: the suite protocol and run-all. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('suite-protocol');
