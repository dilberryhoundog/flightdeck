#!/usr/bin/env node
// T42 — the C13 static scan. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('workflow-static-scan');
