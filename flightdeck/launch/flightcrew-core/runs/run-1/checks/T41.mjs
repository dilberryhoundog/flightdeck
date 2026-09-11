#!/usr/bin/env node
// T41 — the contract every workflow keeps. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('workflows-contract');
