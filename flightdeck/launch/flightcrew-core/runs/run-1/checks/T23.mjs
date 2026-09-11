#!/usr/bin/env node
// T23 — how every hook answers when it cannot resolve or cannot read. The check is this wrapper; the assertions are the suite it runs.
import { runSuite } from './run-suite.mjs';

runSuite('hook-resolution');
