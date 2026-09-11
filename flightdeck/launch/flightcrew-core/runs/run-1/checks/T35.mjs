#!/usr/bin/env node
// T35 — fc-plan-<kind>. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('workflows-plan');
