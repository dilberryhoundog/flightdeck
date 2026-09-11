#!/usr/bin/env node
// T1 — the end-to-end proof, read from what the run left behind. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('acceptance');
