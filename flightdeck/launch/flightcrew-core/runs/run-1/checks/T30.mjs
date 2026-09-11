#!/usr/bin/env node
// T30 — a judge sheet over this run's orchestrator session. The command prints the path of the judge's return for this check, and the sheet's own verdict is the check's.
import { runSheet } from './run-suite.mjs';

runSheet('T30');
