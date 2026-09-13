#!/usr/bin/env node
// suites/constraint-write-boundary — C2: what a leaf and a hook are allowed to write, measured by taking the repository's file tree before and after each one runs.
import fs from 'node:fs';
import path from 'node:path';
import {
  CORE_HOOKS, FLIGHT, assert, assertEq, changedPaths, coreHook, exists, fenced, flight, listFiles, mkCoreLaunch,
  preToolUse, readJson, sessionStart, snapshot, subagentStop, suite, tmp,
} from '../../lib/core-lib.mjs';

/** A boundary reading is only worth anything if the thing under test actually ran. */
function ran(result, what) {
  assert(exists(FLIGHT), 'flightdeck/flightcrew/bin/flight is there to run');
  assert(result.code !== null, `${what} ran to completion: ${result.stderr}`);
}

/** The paths C2 allows anything of this system to write, given a launch and its run. */
function allowed(made) {
  const launch = `flightdeck/launch/${made.launch}`;
  return [
    `${launch}/runs/run-${made.run}/`,
    `${launch}/launch.json`,
    `${launch}/specs/`,
    'flightdeck/launch/FLIGHTLOG.md',
    'flightdeck/.controlcenter',
    'src/export/',
  ];
}

const outside = (made, changed) => changed.filter((rel) => !allowed(made).some((prefix) => rel === prefix || rel.startsWith(prefix)));

const GREEN = { unit: 'U1', status: 'green', branch: 'sample-core/exporter-core', worktree: '.worktrees/U1', spec_refs: ['B1'], checks: [], artefacts: [], commits: [], iterations: 1, halt: null, notes: '' };

const hookNames = () => listFiles(CORE_HOOKS).filter((name) => name.endsWith('.mjs') && !name.includes('/')).map((name) => name.replace(/\.mjs$/, ''));

function envelopeFor(name, made) {
  if (['frozen-guard', 'locked-guard', 'boundary-guard', 'log-guard'].includes(name)) return preToolUse('Edit', path.join(made.root, 'src', 'export', 'index.mjs'), { tool_input: { old_string: 'a', new_string: 'b' } });
  if (name === 'return-capture' || name.includes('gate')) return subagentStop('implementer', fenced(GREEN));
  if (name === 'check-after-edit') return { session_id: 's', transcript_path: '/dev/null', hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: 'src/export/index.mjs' }, agent_id: 'a1', agent_type: 'implementer' };
  return sessionStart();
}

await suite('constraint-write-boundary', [
  {
    id: 'C2 no leaf writes outside the run folder, the record, the specs, the log and the control centre',
    covers: ['C2'],
    fn: () => {
      const invocations = [
        ['event', [JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-build' } })]],
        ['check', ['T1']],
        ['check', ['T2']],
        ['render', ['implementer', 'U1']],
        ['validate', ['flightdeck/launch/sample-core/launch.json']],
      ];
      for (const [name, args] of invocations) {
        const made = mkCoreLaunch();
        const before = snapshot(made.root);
        const result = flight([name, ...args], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
        ran(result, `flight ${name}`);
        const strays = outside(made, changedPaths(before, snapshot(made.root)));
        assertEq(strays, [], `flight ${name} wrote outside its boundary`);
      }
    },
  },
  {
    id: 'C2 no hook writes outside that same set',
    covers: ['C2'],
    fn: () => {
      for (const name of hookNames()) {
        const made = mkCoreLaunch();
        const before = snapshot(made.root);
        const result = coreHook(name, envelopeFor(name, made), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
        assert(result.code !== null, `${name} ran to completion: ${result.stderr}`);
        const strays = outside(made, changedPaths(before, snapshot(made.root)));
        assertEq(strays, [], `${name} wrote outside its boundary`);
      }
    },
  },
  {
    id: 'C2 flight install writes nothing without --apply',
    covers: ['C2'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = snapshot(made.root);
      const result = flight(['install', '--target', '.claude'], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      ran(result, 'flight install');
      assertEq(result.code, 0, `the dry run answers: ${result.stdout}${result.stderr}`);
      assertEq(changedPaths(before, snapshot(made.root)), [], 'a dry run writes nothing at all');
    },
  },
  {
    id: 'C2 flight install --apply writes under .claude, CLAUDE.md and the one .gitignore line, and nowhere else',
    covers: ['C2'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = snapshot(made.root);
      const result = flight(['install', '--apply', '--target', '.claude', '--force'], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      ran(result, 'flight install --apply');
      const changed = changedPaths(before, snapshot(made.root));
      const strays = changed.filter((rel) => !rel.startsWith('.claude/') && rel !== 'CLAUDE.md' && rel !== '.gitignore');
      assertEq(strays, [], 'install writes under .claude/, CLAUDE.md and .gitignore and nowhere else');
      assert(changed.some((rel) => rel.startsWith('.claude/')), 'it did write the install set');
    },
  },
  {
    id: 'C2 a leaf writes nothing into a second launch that is not the one in progress',
    covers: ['C2'],
    fn: () => {
      const made = mkCoreLaunch();
      const other = path.join(made.root, 'flightdeck', 'launch', 'other-launch');
      fs.mkdirSync(other, { recursive: true });
      fs.writeFileSync(path.join(other, 'launch.json'), `${JSON.stringify(readJson(path.join(made.launchDir, 'launch.json')), null, 2)}\n`);
      const before = snapshot(other);
      const result = flight(['event', JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-build' } })], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      ran(result, 'flight event');
      assertEq(result.code, 0, `the event was appended: ${result.stderr}`);
      assertEq(changedPaths(before, snapshot(other)), [], 'the other launch is untouched');
    },
  },
  {
    id: 'C2 nothing is left behind in the temporary directory',
    covers: ['C2'],
    fn: () => {
      const made = mkCoreLaunch();
      const scratch = tmp('fc-c2-watch');
      const before = fs.readdirSync(scratch).sort();
      const result = flight(['check', 'T1'], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root, TMPDIR: scratch } });
      ran(result, 'flight check');
      const after = fs.readdirSync(scratch).sort();
      assertEq(after.filter((name) => !before.includes(name)), [], 'a leaf that uses os.tmpdir() clears up after itself');
      assert(exists(scratch), 'the watched directory survives the run');
    },
  },
]);
