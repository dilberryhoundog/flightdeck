#!/usr/bin/env node
// T33 — where a test-builder’s work lands. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('test-builder-artefacts');
