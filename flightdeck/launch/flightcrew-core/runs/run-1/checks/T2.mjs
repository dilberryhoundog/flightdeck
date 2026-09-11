#!/usr/bin/env node
// T2 — node flightdeck/testbench/run-all.mjs, and the hygiene C7 asks of it. Covers B87, C7.
// run-all gathers every suite the project owns; this check adds the two hygiene readings C7 states, taken around it.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { REPO } from './run-suite.mjs';

const entries = () => fs.readdirSync(os.tmpdir()).sort();
const status = () => spawnSync('git', ['-C', REPO, 'status', '--porcelain'], { encoding: 'utf8' }).stdout ?? '';

const tmpBefore = entries();
const statusBefore = status().split('\n').filter((line) => line.trim() !== '');

const result = spawnSync(process.execPath, [path.join(REPO, 'flightdeck', 'testbench', 'run-all.mjs')], {
  cwd: REPO,
  stdio: ['ignore', 'inherit', 'inherit'],
});

const problems = [];
if (result.error) problems.push(`run-all could not be run: ${result.error.message}`);
else if (result.status !== 0) problems.push(`run-all exited ${result.status}`);

const leaked = entries().filter((name) => !tmpBefore.includes(name));
if (leaked.length > 0) problems.push(`run-all left ${leaked.length} entries under the temporary directory: ${leaked.join(', ')}`);

const statusAfter = status().split('\n').filter((line) => line.trim() !== '');
const added = statusAfter
  .filter((line) => !statusBefore.includes(line))
  .filter((line) => !line.includes('flightdeck/testbench/runs/'));
if (added.length > 0) problems.push(`run-all added git status lines outside the testbench runs folder: ${added.join(' | ')}`);

for (const problem of problems) process.stderr.write(`FAIL  T2: ${problem}\n`);
process.exit(problems.length === 0 ? 0 : 2);
