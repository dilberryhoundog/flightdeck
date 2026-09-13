#!/usr/bin/env node
// suites/flight-check-baseline — flight check --baseline: the observed line it writes into a draft map, and the evidence it does not write. Covers B95, B96.
import fs from 'node:fs';
import path from 'node:path';
import { assert, assertEq, assertExit, assertMatch, exists, flight, mkCoreLaunch, readJson, suite, writeJson } from '../../lib/core-lib.mjs';

/** The fixture launch with its map set back to draft and its observed lines blanked. */
function drafted() {
  const made = mkCoreLaunch();
  const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
  const map = readJson(file);
  delete map.commit;
  map.status = 'draft';
  for (const check of map.checks) check.baseline = { expect: check.baseline.expect, observed: '' };
  writeJson(file, map);
  return { ...made, mapFile: file, mapArg: `flightdeck/launch/${made.launch}/specs/tests-map.v1.json` };
}

const baseline = (made) => flight(['check', '--baseline', made.mapArg], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('flight-check-baseline', [
  {
    id: 'B95 every check of the draft map gets an observed line',
    covers: ['B95'],
    fn: () => {
      const made = drafted();
      baseline(made);
      const map = readJson(made.mapFile);
      for (const check of map.checks) {
        assertMatch(check.baseline.observed, /^(pass|fail|error): \S/, `${check.id} observed reads '<pass|fail|error>: <line>'`);
      }
    },
  },
  {
    id: 'B95 the observed word is the verdict the command earned',
    covers: ['B95'],
    fn: () => {
      const made = drafted();
      baseline(made);
      const map = readJson(made.mapFile);
      const observed = Object.fromEntries(map.checks.map((c) => [c.id, c.baseline.observed]));
      assertMatch(observed.T1, /^pass: /, 'a command that exits 0 is pass');
      assertMatch(observed.T2, /^fail: /, 'a command that exits 2 is fail');
      assertMatch(observed.T3, /^error: /, 'a command that cannot be spawned is error');
    },
  },
  {
    id: 'B95 the observed text is the first non-empty output line of the command',
    covers: ['B95'],
    fn: () => {
      const made = drafted();
      baseline(made);
      const map = readJson(made.mapFile);
      const t1 = map.checks.find((c) => c.id === 'T1');
      assertEq(t1.baseline.observed, 'pass: ok: every case passed', 'T1 carries the first line ok.sh printed');
      const t2 = map.checks.find((c) => c.id === 'T2');
      assertEq(t2.baseline.observed, 'fail: FAIL  b3-case: exportProject is not defined', 'T2 carries the first line fail.sh printed');
    },
  },
  {
    id: 'B95 expect is left exactly as the test-builder wrote it',
    covers: ['B95'],
    fn: () => {
      const made = drafted();
      const before = readJson(made.mapFile).checks.map((c) => c.baseline.expect);
      baseline(made);
      assertEq(readJson(made.mapFile).checks.map((c) => c.baseline.expect), before, 'no expect line is rewritten');
    },
  },
  {
    id: 'B96 no evidence file is written',
    covers: ['B96'],
    fn: () => {
      const made = drafted();
      const before = fs.readdirSync(path.join(made.runDir, 'evidence')).sort();
      assert(!exists(path.join(made.runDir, 'evidence', 'summary.json')), 'no summary before');
      baseline(made);
      assertEq(fs.readdirSync(path.join(made.runDir, 'evidence')).sort(), before, 'the evidence folder is untouched');
    },
  },
  {
    id: 'B96 --baseline reports what it recorded and exits 0 whatever the verdicts were',
    covers: ['B96', 'B95'],
    fn: () => {
      const made = drafted();
      const result = baseline(made);
      assertExit(result, 0, 'recording a baseline is not a verdict');
      assertEq(result.stdout.trim().split('\n').length, 1, 'at most one line on success');
    },
  },
]);
