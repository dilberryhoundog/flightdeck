#!/usr/bin/env node
// suites/flight-check-run — flight check: which checks run, how each is spawned, the evidence and summary it rebuilds, and the exits. Covers B9, B10, E9, E10, I13.
import fs from 'node:fs';
import path from 'node:path';
import {
  assert, assertEq, assertExit, assertIncludes, assertMatch, exists, flight, git, mkCoreLaunch,
  readJson, readText, suite, validateWithRunSchema, writeJson, writeText,
} from '../../lib/core-lib.mjs';

const check = (made, args = []) => flight(['check', ...args], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const evidenceOf = (made, id) => readJson(path.join(made.runDir, 'evidence', `${id}.json`));
const evidenceIds = (made) =>
  fs.readdirSync(path.join(made.runDir, 'evidence'))
    .filter((name) => /^T\d+\.json$/.test(name))
    .map((name) => name.replace('.json', ''))
    .sort();

/** The fixture launch with a probe check that records where and how it was spawned, in place of T2. */
function probed() {
  const made = mkCoreLaunch();
  writeText(
    path.join(made.runDir, 'checks', 'probe.sh'),
    '#!/bin/sh\n# Records the working directory it was spawned in and the run folder its argument expanded to.\nprintf "cwd=%s\\n" "$PWD" > "$1/checks/probe.out"\nprintf "run=%s\\n" "$1" >> "$1/checks/probe.out"\nprintf "shell=%s\\n" "$(ps -o comm= -p $PPID 2>/dev/null || echo unknown)" >> "$1/checks/probe.out"\necho "probe recorded"\nexit 0\n',
  );
  fs.chmodSync(path.join(made.runDir, 'checks', 'probe.sh'), 0o755);
  const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
  const map = readJson(file);
  map.checks[1].command = 'sh {run}/checks/probe.sh {run} && pwd > {run}/checks/probe-pwd.txt';
  writeJson(file, map);
  return made;
}

await suite('flight-check-run', [
  {
    id: 'B9 with no ids, every check of the pinned map runs and the quarantined one is skipped',
    covers: ['B9'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made);
      assertEq(evidenceIds(made), ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], 'one evidence file per check of the map');
      assertEq(evidenceOf(made, 'T6').verdict, 'skipped', 'the quarantined check runs with verdict skipped');
      assertEq(evidenceOf(made, 'T1').verdict, 'pass', 'T1 passes');
    },
  },
  {
    id: 'B9 named ids run and nothing else does',
    covers: ['B9'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T1', 'T2']);
      assertEq(evidenceIds(made), ['T1', 'T2'], 'only the named ids leave evidence');
    },
  },
  {
    id: 'B9 --unit runs the checks that plan unit names',
    covers: ['B9'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['--unit', 'U2']);
      assertEq(evidenceIds(made), ['T2', 'T7'], "U2's checks and no others");
    },
  },
  {
    id: 'B9 each command is spawned through a shell with cwd the repository root and {run} expanded',
    covers: ['B9'],
    fn: () => {
      const made = probed();
      check(made, ['T2']);
      const out = readText(path.join(made.runDir, 'checks', 'probe.out'));
      assertMatch(out, new RegExp(`^cwd=${made.root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'm'), 'cwd is the repository root');
      assertMatch(out, new RegExp(`^run=flightdeck/launch/${made.launch}/runs/run-${made.run}$`, 'm'), '{run} expands to the repository-relative run folder');
      assert(exists(path.join(made.runDir, 'checks', 'probe-pwd.txt')), 'shell redirection in the command took effect, so a shell interpreted it');
    },
  },
  {
    id: 'B9 the checks run one after another, never overlapping',
    covers: ['B9'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(
        path.join(made.runDir, 'checks', 'serial.sh'),
        '#!/bin/sh\nlog="$(dirname "$0")/serial.log"\necho "start $1" >> "$log"\nsleep 1\necho "end $1" >> "$log"\nexit 0\n',
      );
      fs.chmodSync(path.join(made.runDir, 'checks', 'serial.sh'), 0o755);
      const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
      const map = readJson(file);
      map.checks[0].command = 'sh {run}/checks/serial.sh A';
      map.checks[1].command = 'sh {run}/checks/serial.sh B';
      writeJson(file, map);
      check(made, ['T1', 'T2']);
      const log = readText(path.join(made.runDir, 'checks', 'serial.log')).trim().split('\n');
      assertEq(log, ['start A', 'end A', 'start B', 'end B'], 'the second check starts only after the first ends');
    },
  },
  {
    id: 'I13 every evidence file validates against check-result.schema.json and carries its ids and command',
    covers: ['I13'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T1']);
      const result = evidenceOf(made, 'T1');
      assertEq(validateWithRunSchema('check-result.schema.json', result), [], 'T1 evidence against its schema');
      assertEq(result.id, 'T1', 'id');
      assertEq(result.covers, ['B1', 'B2'], 'covers comes from the map');
      assertEq(result.exit, 0, 'exit');
      assertMatch(result.command, /ok\.sh/, 'the command as run');
      assertIncludes(result.stdout_tail.join('\n'), 'ok: every case passed', 'the output tail');
    },
  },
  {
    id: 'B10 the summary is rebuilt from every evidence file present',
    covers: ['B10', 'I13'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made);
      const summary = readJson(path.join(made.runDir, 'evidence', 'summary.json'));
      assertEq(validateWithRunSchema('evidence-summary.schema.json', summary), [], 'the summary against its schema');
      assertEq(summary.counts, { pass: 3, fail: 2, error: 1, skipped: 1 }, 'T1, T4 and T5 pass, T2 and T7 fail, T3 errors, T6 is skipped');
      assertEq(summary.checks.map((c) => c.id).sort(), ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'], 'one entry per evidence file');
    },
  },
  {
    id: 'B10 a change outside the plan paths since the lock commit shows in boundary.outside',
    covers: ['B10'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.root, 'README.md'), '# changed outside the plan\n');
      writeText(path.join(made.root, 'src', 'export', 'index.mjs'), '// changed inside the plan\n');
      git(made.root, ['add', '-A']);
      git(made.root, ['commit', '-q', '--no-verify', '-m', 'work']);
      check(made, ['T1']);
      const summary = readJson(path.join(made.runDir, 'evidence', 'summary.json'));
      assertIncludes(summary.boundary.outside, 'README.md', 'the file outside the plan paths');
      assert(!summary.boundary.outside.includes('src/export/index.mjs'), 'a file inside the plan paths is not outside');
      assertMatch(summary.boundary.base, /^[0-9a-f]{7,40}$/, 'the boundary base is the lock commit');
    },
  },
  {
    id: 'B10 a change to the run checks folder or a locked path shows in locked.changed',
    covers: ['B10'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.root, 'tests', 'export', 'behaviours.test.mjs'), '// edited a locked check\n');
      writeText(path.join(made.runDir, 'checks', 'ok.sh'), '#!/bin/sh\nexit 0\n');
      git(made.root, ['add', '-A']);
      git(made.root, ['commit', '-q', '--no-verify', '-m', 'touch the locked set']);
      check(made, ['T1']);
      const summary = readJson(path.join(made.runDir, 'evidence', 'summary.json'));
      assertIncludes(summary.locked.changed, 'tests/export/behaviours.test.mjs', 'a locked_paths file');
      assertIncludes(summary.locked.changed, `flightdeck/launch/${made.launch}/runs/run-${made.run}/checks/ok.sh`, 'a file under the run checks folder');
    },
  },
  {
    id: 'B10 an untouched tree leaves boundary and locked empty',
    covers: ['B10'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T1']);
      const summary = readJson(path.join(made.runDir, 'evidence', 'summary.json'));
      assertEq(summary.boundary.outside, [], 'nothing outside');
      assertEq(summary.locked.changed, [], 'nothing locked changed');
    },
  },
  {
    id: 'E9 a command naming a binary that is not there errors, names the cause, and the rest still run',
    covers: ['E9'],
    fn: () => {
      const made = mkCoreLaunch();
      check(made, ['T3', 'T1']);
      const errored = evidenceOf(made, 'T3');
      assertEq(errored.verdict, 'error', 'the verdict of an unspawnable command');
      assertMatch(errored.stderr_tail.join('\n'), /no-such-binary-fc-core/, 'the stderr tail names the command');
      assert(errored.stderr_tail.join('\n').trim() !== '', 'the stderr tail names the cause');
      assertEq(evidenceOf(made, 'T1').verdict, 'pass', 'the check after the error still ran');
    },
  },
  {
    id: 'E10 a failing or erroring verdict exits 2 and a clean run exits 0',
    covers: ['E10'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(check(made, ['T1']), 0, 'a passing check');
      assertExit(check(made, ['T2']), 2, 'a failing check');
      assertExit(check(made, ['T3']), 2, 'an erroring check');
    },
  },
  {
    id: 'E10 a non-empty boundary or locked list exits 2 even when every verdict passes',
    covers: ['E10'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.root, 'README.md'), '# outside the plan\n');
      git(made.root, ['add', '-A']);
      git(made.root, ['commit', '-q', '--no-verify', '-m', 'outside']);
      const result = check(made, ['T1']);
      assertEq(evidenceOf(made, 'T1').verdict, 'pass', 'the check itself passed');
      assertExit(result, 2, 'a non-empty boundary outside list still exits 2');
    },
  },
]);
