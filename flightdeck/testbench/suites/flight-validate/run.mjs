#!/usr/bin/env node
// suites/flight-validate — flight validate: the schema each filename selects, the error line form, the refusals, and the tests-map rails. Covers B8, E11, E17.
import path from 'node:path';
import { assert, assertEq, assertExit, assertMatch, flight, mkCoreLaunch, readJson, suite, writeJson, writeText } from '../../lib/core-lib.mjs';

const ERROR_LINE = /^error: .+ — \[[^\]]+\]$/m;

function launched() {
  const made = mkCoreLaunch();
  return { ...made, at: (...parts) => path.posix.join('flightdeck', 'launch', made.launch, ...parts) };
}

const validate = (made, target) => flight(['validate', target], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

const DOCUMENTS = [
  'launch.json',
  'specs/spec.v1.json',
  'specs/tests-map.v1.json',
  'runs/run-1/plan.json',
  'runs/run-1/liftoff/sample.json',
  'runs/run-1/report.json',
  'runs/run-1/events.jsonl',
  'runs/run-1/returns/implementer-U1.json',
  'runs/run-1/returns/judge-T5.json',
  'runs/run-1/returns/explorer-X1.json',
];

/** The fixture map with one check replaced, written back, and validated. */
function mapWith(made, mutate) {
  const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
  const map = readJson(file);
  mutate(map);
  writeJson(file, map);
  return validate(made, made.at('specs/tests-map.v1.json'));
}

await suite('flight-validate', [
  {
    id: 'B8 every fixture document validates, silently, exit 0',
    covers: ['B8'],
    fn: () => {
      const made = launched();
      for (const document of DOCUMENTS) {
        const result = validate(made, made.at(document));
        assertExit(result, 0, `flight validate ${document}: ${result.stdout}${result.stderr}`);
        assertEq(result.stdout.trim(), '', `flight validate ${document} prints nothing on success`);
      }
    },
  },
  {
    id: 'B8 a launch folder validates as a whole',
    covers: ['B8', 'E11'],
    fn: () => {
      const made = launched();
      const result = validate(made, made.at());
      assertExit(result, 0, `flight validate on the launch folder: ${result.stdout}${result.stderr}`);
    },
  },
  {
    id: 'B8 a mutated document fails with one error line per violation',
    covers: ['B8'],
    fn: () => {
      const made = launched();
      const file = path.join(made.launchDir, 'launch.json');
      const record = readJson(file);
      delete record.test_dir;
      record.current_run = 'one';
      writeJson(file, record);
      const result = validate(made, made.at('launch.json'));
      assertExit(result, 2, 'flight validate on a mutated launch record');
      assertMatch(result.stdout, ERROR_LINE, "the error line reads 'error: <message> — [<rule>]'");
      const lines = result.stdout.split('\n').filter((line) => line.trim() !== '');
      assert(lines.length >= 2, `one line per violation, got ${lines.length}`);
      for (const line of lines) assertMatch(line, /^error: /, 'every line on stdout is an error line');
    },
  },
  {
    id: 'B8 the filename selects the schema: a plan under a plan name is held to the plan schema',
    covers: ['B8'],
    fn: () => {
      const made = launched();
      const file = path.join(made.runDir, 'plan.json');
      const plan = readJson(file);
      plan.units[0].kind = 'refactor';
      writeJson(file, plan);
      const result = validate(made, made.at('runs/run-1/plan.json'));
      assertExit(result, 2, 'flight validate on a plan with an unknown unit kind');
      assertMatch(result.stdout, ERROR_LINE, 'the error line form');
    },
  },
  {
    id: 'B8 a broken events line is caught',
    covers: ['B8'],
    fn: () => {
      const made = launched();
      writeText(path.join(made.runDir, 'events.jsonl'), '{"ts":"2026-09-10T00:00:00Z","event":"SessionStart"}\n');
      const result = validate(made, made.at('runs/run-1/events.jsonl'));
      assertExit(result, 2, 'flight validate on an events line missing its fields');
      assertMatch(result.stdout, ERROR_LINE, 'the error line form');
    },
  },
  {
    id: 'E11 a path that is neither a schema-d document nor a launch folder exits 1 and names the path',
    covers: ['E11'],
    fn: () => {
      const made = launched();
      writeText(path.join(made.root, 'notes', 'stray.json'), '{"a":1}\n');
      const result = validate(made, 'notes/stray.json');
      assertExit(result, 1, 'flight validate on a stray path');
      assertMatch(`${result.stdout}${result.stderr}`, /notes\/stray\.json/, 'the message names the path');
    },
  },
  {
    id: 'E11 an absent path exits 1 and names it',
    covers: ['E11'],
    fn: () => {
      const made = launched();
      const result = validate(made, made.at('runs/run-1/nothing-here.json'));
      assertExit(result, 1, 'flight validate on an absent path');
      assertMatch(`${result.stdout}${result.stderr}`, /nothing-here\.json/, 'the message names the path');
    },
  },
  {
    id: 'E17 a check command naming a path outside the rails exits 2 and names the check',
    covers: ['E17'],
    fn: () => {
      const made = launched();
      const result = mapWith(made, (map) => {
        map.checks[1].command = 'node scripts/private/secret-check.mjs';
      });
      assertExit(result, 2, 'flight validate on an out-of-rail command');
      assertMatch(result.stdout, /T2/, 'the message names the check');
      assertMatch(result.stdout, ERROR_LINE, 'the error line form');
    },
  },
  {
    id: 'E17 the three rails are accepted: the run checks folder, the testbench and the launch test_dir',
    covers: ['E17'],
    fn: () => {
      const made = launched();
      const result = mapWith(made, (map) => {
        map.checks[1].command = 'node flightdeck/testbench/suites/flight-validate/run.mjs';
        map.checks[5].command = 'node --test tests/export/behaviours.test.mjs';
      });
      assertExit(result, 0, `the three rails: ${result.stdout}${result.stderr}`);
    },
  },
  {
    id: 'E17 a ratio check without trials or threshold exits 2 and names the check',
    covers: ['E17'],
    fn: () => {
      const made = launched();
      const missingTrials = mapWith(made, (map) => {
        delete map.checks[3].trials;
      });
      assertExit(missingTrials, 2, 'a ratio check with no trials');
      assertMatch(missingTrials.stdout, /T4/, 'the message names the check');
      const madeTwo = launched();
      const missingThreshold = mapWith(madeTwo, (map) => {
        delete map.checks[3].threshold;
      });
      assertExit(missingThreshold, 2, 'a ratio check with no threshold');
      assertMatch(missingThreshold.stdout, /T4/, 'the message names the check');
    },
  },
  {
    id: 'E17 a sheet check without a rubric exits 2 and names the check',
    covers: ['E17'],
    fn: () => {
      const made = launched();
      const result = mapWith(made, (map) => {
        delete map.checks[4].rubric;
      });
      assertExit(result, 2, 'a sheet check with no rubric');
      assertMatch(result.stdout, /T5/, 'the message names the check');
    },
  },
]);
