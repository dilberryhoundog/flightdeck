#!/usr/bin/env node
// T19 — the worker gate. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('hook-worker-gate');
