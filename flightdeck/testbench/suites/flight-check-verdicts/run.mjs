#!/usr/bin/env node
// suites/flight-check-verdicts — the ratio and sheet verdict kinds: the trials, the threshold, the sheet the command points at, and the three ways they go wrong. Covers B64, B65, E16, I15.
import fs from 'node:fs';
import path from 'node:path';
import { assert, assertEq, assertExit, assertMatch, flight, mkCoreLaunch, readJson, suite, validateWithRunSchema, writeJson, writeText } from '../../lib/core-lib.mjs';

const check = (made, args = []) => flight(['check', ...args], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const evidenceOf = (made, id) => readJson(path.join(made.runDir, 'evidence', `${id}.json`));

/** The fixture launch with the map's check of id mutated. */
function mapWith(id, mutate) {
  const made = mkCoreLaunch();
  const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
  const map = readJson(file);
  mutate(map.checks.find((c) => c.id === id), map);
  writeJson(file, map);
  return made;
}

await suite('flight-check-verdicts', [
  {
    id: 'B64 a ratio check runs its command trials times and counts the exit-0 runs',
    covers: ['B64'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T4']);
      const result = evidenceOf(made, 'T4');
      assertEq(result.observed, { passes: 3, trials: 4 }, 'three of the four trials exited 0');
      assertEq(Number(fs.readFileSync(path.join(made.runDir, 'checks', '.ratio-count'), 'utf8').trim()), 4, 'the command ran exactly trials times');
    },
  },
  {
    id: 'B64 a ratio at or above the threshold passes',
    covers: ['B64'],
    fn: () => {
      const made = mapWith('T4', (c) => {
        c.threshold = 0.75;
      });
      check(made, ['T4']);
      const result = evidenceOf(made, 'T4');
      assertEq(result.observed, { passes: 3, trials: 4 }, 'the observed rate');
      assertEq(result.verdict, 'pass', 'a rate equal to the threshold passes');
    },
  },
  {
    id: 'E16 a ratio below the threshold fails',
    covers: ['E16', 'B64'],
    fn: () => {
      const made = mapWith('T4', (c) => {
        c.threshold = 0.9;
      });
      assertExit(check(made, ['T4']), 2, 'a below-threshold ratio check exits 2');
      const result = evidenceOf(made, 'T4');
      assertEq(result.observed, { passes: 3, trials: 4 }, 'the observed rate is recorded whatever the verdict');
      assertEq(result.verdict, 'fail', 'below the threshold is fail, not error');
    },
  },
  {
    id: 'I15 a ratio evidence file validates against check-result.schema.json',
    covers: ['I15'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T4']);
      assertEq(validateWithRunSchema('check-result.schema.json', evidenceOf(made, 'T4')), [], 'ratio evidence against its schema');
    },
  },
  {
    id: 'B65 a sheet check reads the path its command prints and takes that sheet-s verdict',
    covers: ['B65'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T5']);
      const result = evidenceOf(made, 'T5');
      assertEq(result.verdict, 'pass', "the sheet's own verdict");
      assertMatch(result.sheet, /returns\/judge-T5\.json$/, 'the sheet path is recorded');
      assert(fs.existsSync(path.join(made.root, result.sheet)) || fs.existsSync(result.sheet), 'the recorded sheet path resolves');
    },
  },
  {
    id: 'B65 a sheet whose verdict is fail fails the check',
    covers: ['B65'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'returns', 'judge-T5.json');
      const sheet = readJson(file);
      writeJson(file, { ...sheet, verdict: 'fail' });
      assertExit(check(made, ['T5']), 2, 'a failing sheet exits 2');
      assertEq(evidenceOf(made, 'T5').verdict, 'fail', "the check takes the sheet's verdict");
    },
  },
  {
    id: 'E16 a sheet check whose command prints no path errors',
    covers: ['E16'],
    fn: () => {
      const made = mapWith('T5', (c) => {
        c.command = 'sh {run}/checks/sheet-silent.sh';
      });
      assertExit(check(made, ['T5']), 2, 'a pathless sheet check exits 2');
      assertEq(evidenceOf(made, 'T5').verdict, 'error', 'no path printed is error');
    },
  },
  {
    id: 'E16 a sheet whose file fails the judge return schema errors',
    covers: ['E16', 'B65'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'returns', 'judge-T5.json');
      const sheet = readJson(file);
      delete sheet.answers;
      writeJson(file, sheet);
      assertExit(check(made, ['T5']), 2, 'an invalid sheet exits 2');
      assertEq(evidenceOf(made, 'T5').verdict, 'error', 'a sheet that fails its schema is error, not fail');
    },
  },
  {
    id: 'E16 a sheet carrying an empty quote errors',
    covers: ['E16', 'I15'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'returns', 'judge-T5.json');
      const sheet = readJson(file);
      sheet.answers[1].quote = '';
      writeJson(file, sheet);
      assertExit(check(made, ['T5']), 2, 'a quoteless answer exits 2');
      assertEq(evidenceOf(made, 'T5').verdict, 'error', 'an empty quote invalidates the sheet');
    },
  },
  {
    id: 'E16 a sheet check whose printed path is not there errors',
    covers: ['E16'],
    fn: () => {
      const made = mkCoreLaunch();
      fs.rmSync(path.join(made.runDir, 'returns', 'judge-T5.json'));
      assertExit(check(made, ['T5']), 2, 'an absent sheet exits 2');
      assertEq(evidenceOf(made, 'T5').verdict, 'error', 'an absent sheet is error');
    },
  },
  {
    id: 'I15 an exit check records no observed and no sheet',
    covers: ['I15'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T1']);
      const result = evidenceOf(made, 'T1');
      assert(result.observed === undefined, 'an exit check carries no observed');
      assert(result.sheet === undefined, 'an exit check carries no sheet');
    },
  },
]);
