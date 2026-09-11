#!/usr/bin/env node
// T38 — fc-verify. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('workflows-verify');
