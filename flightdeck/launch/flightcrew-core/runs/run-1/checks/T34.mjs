#!/usr/bin/env node
// T34 — the verdict sheets this run wrote. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('judge-returns');
