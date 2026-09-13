#!/usr/bin/env node
// suites/flight-run-new — flight run new: the branch, the run folder, the record entry, the control centre line, and the four refusals. Covers B3, B4, B5, B6, E1, I1.
import fs from 'node:fs';
import path from 'node:path';
import {
  SAMPLE_LAUNCH, assert, assertEq, assertExit, assertMatch, exists, flight, git, head, mkCoreLaunch,
  readJson, readText, suite, writeJson, writeText,
} from '../../lib/core-lib.mjs';

const FILLED = readText(path.join(SAMPLE_LAUNCH, 'FLIGHTLOG.entry.md')).replace(/<fill>/g, 'accepted');
const UNFILLED = readText(path.join(SAMPLE_LAUNCH, 'FLIGHTLOG.entry.md'));

function flightlog(root, entry) {
  writeText(path.join(root, 'flightdeck', 'launch', 'FLIGHTLOG.md'), `# Flight log\n\nEntries newest first.\n\n${entry}`);
}

/** The fixture launch with run-1 removed, so the next run is run-1: what a launch looks like the moment its map freezes. */
function noRunYet() {
  const made = mkCoreLaunch();
  git(made.root, ['switch', '-q', 'main']);
  fs.rmSync(path.join(made.launchDir, 'runs'), { recursive: true, force: true });
  const record = readJson(path.join(made.launchDir, 'launch.json'));
  writeJson(path.join(made.launchDir, 'launch.json'), { ...record, current_run: null, runs: [] });
  git(made.root, ['add', '-A']);
  git(made.root, ['commit', '-q', '--no-verify', '-m', 'launch with no run']);
  return made;
}

const run = (made, ...args) => flight(['run', 'new', made.launch, ...args], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('flight-run-new', [
  {
    id: 'B3 the run branch is cut from the HEAD the command was run on',
    covers: ['B3'],
    fn: () => {
      const made = noRunYet();
      const before = head(made.root);
      assertExit(run(made), 0, 'flight run new');
      const branch = git(made.root, ['rev-parse', `run/${made.launch}-1`]).trim();
      assertEq(branch, before, 'run/<name>-1 points at the HEAD the command saw');
    },
  },
  {
    id: 'B4 the run folder holds the I1 containers with events.jsonl and hooks.log empty',
    covers: ['B4', 'I1'],
    fn: () => {
      const made = noRunYet();
      assertExit(run(made), 0, 'flight run new');
      const dir = path.join(made.launchDir, 'runs', 'run-1');
      for (const folder of ['liftoff', 'checks', 'checks/rubrics', 'evidence', 'dispatches', 'returns']) {
        assert(exists(path.join(dir, folder)) && fs.statSync(path.join(dir, folder)).isDirectory(), `runs/run-1/${folder}/ is a directory`);
      }
      for (const file of ['events.jsonl', 'hooks.log']) {
        assert(exists(path.join(dir, file)), `runs/run-1/${file} exists`);
        assertEq(readText(path.join(dir, file)).trim(), '', `runs/run-1/${file} is empty`);
      }
    },
  },
  {
    id: 'B4 a second run gets its own folder beside the first',
    covers: ['B4', 'I1'],
    fn: () => {
      const made = mkCoreLaunch();
      flightlog(made.root, FILLED);
      git(made.root, ['add', '-A']);
      git(made.root, ['commit', '-q', '--no-verify', '-m', 'log entry filled']);
      assertExit(run(made), 0, 'flight run new for run-2');
      assert(exists(path.join(made.launchDir, 'runs', 'run-1')), 'run-1 survives');
      assert(exists(path.join(made.launchDir, 'runs', 'run-2', 'events.jsonl')), 'run-2 is created');
      assertEq(git(made.root, ['rev-parse', '--verify', `run/${made.launch}-2`]).trim().length, 40, 'run/<name>-2 exists');
    },
  },
  {
    id: 'B5 the record gains the run entry and current_run',
    covers: ['B5', 'I1'],
    fn: () => {
      const made = noRunYet();
      const before = head(made.root);
      assertExit(run(made), 0, 'flight run new');
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      assertEq(record.current_run, 1, 'current_run');
      assertEq(record.runs.length, 1, 'one runs entry');
      const entry = record.runs[0];
      assertEq(entry.n, 1, 'n');
      assertEq(entry.branch, `run/${made.launch}-1`, 'branch');
      assertEq(entry.base_commit, before, 'base_commit is the HEAD the command saw');
      assertEq(entry.lock_commit, null, 'lock_commit is null until the map is frozen');
      assertMatch(entry.started, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'started is an iso timestamp');
    },
  },
  {
    id: 'B6 the control centre names the launch folder after run new',
    covers: ['B6'],
    fn: () => {
      const made = noRunYet();
      fs.rmSync(path.join(made.root, 'flightdeck', '.controlcenter'), { force: true });
      assertExit(run(made), 0, 'flight run new');
      assertMatch(
        readText(path.join(made.root, 'flightdeck', '.controlcenter')),
        new RegExp(`^LAUNCH_DIRECTORY=flightdeck/launch/${made.launch}$`, 'm'),
        'the LAUNCH_DIRECTORY line',
      );
    },
  },
  {
    id: 'E1 a draft spec refuses the run, names the file, and writes nothing',
    covers: ['E1'],
    fn: () => {
      const made = noRunYet();
      const specPath = path.join(made.launchDir, 'specs', 'spec.v1.json');
      const spec = readJson(specPath);
      delete spec.commit;
      writeJson(specPath, { ...spec, status: 'draft' });
      const result = run(made);
      assertExit(result, 2, 'flight run new against a draft spec');
      assertMatch(`${result.stdout}${result.stderr}`, /spec\.v1\.json/, 'the message names the draft file');
      assert(!exists(path.join(made.launchDir, 'runs')), 'no run folder is written');
      assertEq(readJson(path.join(made.launchDir, 'launch.json')).current_run, null, 'the record is untouched');
    },
  },
  {
    id: 'E1 a draft tests map refuses the run and names the file',
    covers: ['E1'],
    fn: () => {
      const made = noRunYet();
      const mapPath = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
      const map = readJson(mapPath);
      delete map.commit;
      writeJson(mapPath, { ...map, status: 'draft' });
      const result = run(made);
      assertExit(result, 2, 'flight run new against a draft map');
      assertMatch(`${result.stdout}${result.stderr}`, /tests-map\.v1\.json/, 'the message names the draft map');
      assert(!exists(path.join(made.launchDir, 'runs')), 'no run folder is written');
    },
  },
  {
    id: 'E1 an unfilled previous log entry refuses run-2 and names the field',
    covers: ['E1'],
    fn: () => {
      const made = mkCoreLaunch();
      flightlog(made.root, UNFILLED);
      const result = run(made);
      assertExit(result, 2, 'flight run new for run-2 with <fill> lines standing');
      assertMatch(`${result.stdout}${result.stderr}`, /outcome|<fill>/, 'the message names the unfilled field');
      assert(!exists(path.join(made.launchDir, 'runs', 'run-2')), 'no run-2 folder is written');
      assertEq(readJson(path.join(made.launchDir, 'launch.json')).current_run, 1, 'the record still names run-1');
    },
  },
  {
    id: 'E1 an absent previous log entry refuses run-2',
    covers: ['E1'],
    fn: () => {
      const made = mkCoreLaunch();
      flightlog(made.root, '');
      const result = run(made);
      assertExit(result, 2, 'flight run new for run-2 with no entry');
      assert(!exists(path.join(made.launchDir, 'runs', 'run-2')), 'no run-2 folder is written');
    },
  },
]);
