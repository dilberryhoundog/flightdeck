#!/usr/bin/env node
// suites/hook-resolution — how every hook answers when it cannot resolve a run, cannot read what it needs, or is handed something it does not know: no hook permits by failing. Covers E6, E7, E8, C8.
import fs from 'node:fs';
import path from 'node:path';
import {
  CORE_HOOKS, assert, assertEq, coreHook, denied, exists, fenced, flight, listFiles, mkCoreLaunch,
  mkCoreLaunchNoControlCentre, preToolUse, readLines, sessionStart, subagentStop, suite, writeJson, writeText, readJson, tmp,
} from '../../lib/core-lib.mjs';

/** Every hook script that ships, by file name without the extension. */
const hookNames = () =>
  listFiles(CORE_HOOKS)
    .filter((name) => name.endsWith('.mjs') && !name.includes('/'))
    .map((name) => name.replace(/\.mjs$/, ''));

const GUARDS = ['frozen-guard', 'locked-guard', 'boundary-guard', 'log-guard'];
const RECORDERS = ['event-log'];

const envelopeFor = (name, made) => {
  if (GUARDS.includes(name)) return preToolUse('Edit', path.join(made.root, 'tests', 'export', 'behaviours.test.mjs'), { tool_input: { old_string: 'a', new_string: 'b' } });
  if (name === 'return-capture') return subagentStop('implementer', fenced({ unit: 'U1', status: 'green', branch: 'b', worktree: 'w', spec_refs: [], checks: [], artefacts: [], commits: [], iterations: 1, halt: null, notes: '' }));
  if (name === 'check-after-edit') return { session_id: 's', transcript_path: '/dev/null', hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: 'src/export/index.mjs' }, agent_id: 'a1', agent_type: 'implementer' };
  if (name.includes('gate')) return subagentStop('implementer', fenced({ unit: 'U1', status: 'green', branch: 'b', worktree: 'w', spec_refs: [], checks: [], artefacts: [], commits: [], iterations: 1, halt: null, notes: '' }));
  return sessionStart();
};

const spawn = (name, envelope, options) => coreHook(name, envelope, options);
const runFiles = (made) => (exists(made.runDir) ? listFiles(made.runDir) : []);

await suite('hook-resolution', [
  {
    id: 'E7 with the control centre absent no hook writes a file or an event, and only frozen-guard speaks',
    covers: ['E7', 'C8'],
    fn: () => {
      for (const name of hookNames()) {
        const made = mkCoreLaunchNoControlCentre();
        const before = runFiles(made);
        const events = readLines(path.join(made.runDir, 'events.jsonl')).length;
        const result = spawn(name, envelopeFor(name, made), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
        assertEq(runFiles(made), before, `${name} wrote a file with no launch resolved`);
        assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, events, `${name} appended an event with no launch resolved`);
        if (name !== 'frozen-guard') assertEq(result.stdout.trim(), '', `${name} printed something with no launch resolved`);
      }
    },
  },
  {
    id: 'E7 frozen-guard still denies a frozen target with no launch resolved',
    covers: ['E7'],
    fn: () => {
      const made = mkCoreLaunchNoControlCentre();
      const result = spawn('frozen-guard', preToolUse('Edit', path.join(made.launchDir, 'specs', 'spec.v1.json')), {
        cwd: made.root,
        env: { CLAUDE_PROJECT_DIR: made.root },
      });
      assert(denied(result), 'frozen-guard is the one hook that answers without a launch');
    },
  },
  {
    id: 'E7 a control centre naming a folder with no launch.json, and one whose current_run is null, are the same case',
    covers: ['E7'],
    fn: () => {
      for (const line of ['LAUNCH_DIRECTORY=flightdeck/launch/not-a-launch\n', 'LAUNCH_DIRECTORY=flightdeck/launch/sample-core\n']) {
        const made = mkCoreLaunch();
        if (line.includes('not-a-launch')) fs.mkdirSync(path.join(made.root, 'flightdeck', 'launch', 'not-a-launch'), { recursive: true });
        else writeJson(path.join(made.launchDir, 'launch.json'), { ...readJson(path.join(made.launchDir, 'launch.json')), current_run: null });
        writeText(path.join(made.root, 'flightdeck', '.controlcenter'), line);
        const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
        for (const name of hookNames()) {
          const result = spawn(name, envelopeFor(name, made), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
          if (name !== 'frozen-guard') assertEq(result.stdout.trim(), '', `${name} printed something with no run in progress`);
        }
        assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, 'no event is written with no run in progress');
      }
    },
  },
  {
    id: 'E7 a leaf that needs a run exits 1 naming the control centre',
    covers: ['E7'],
    fn: () => {
      const made = mkCoreLaunchNoControlCentre();
      const result = flight(['check', 'T1'], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      assertEq(result.code, 1, 'exit 1');
      assert(/controlcenter/.test(`${result.stdout}${result.stderr}`), 'the message names the file');
    },
  },
  {
    id: 'E6 a guard that resolves a run and cannot parse what it needs denies with the file named',
    covers: ['E6', 'C8'],
    fn: () => {
      const cases = [
        ['launch.json', (made) => writeText(path.join(made.launchDir, 'launch.json'), '{ not json\n')],
        ['tests-map.v1.json', (made) => writeText(path.join(made.launchDir, 'specs', 'tests-map.v1.json'), '{ not json\n')],
        ['plan.json', (made) => writeText(path.join(made.runDir, 'plan.json'), '{ not json\n')],
      ];
      for (const [label, breakIt] of cases) {
        for (const guard of ['locked-guard', 'boundary-guard']) {
          const made = mkCoreLaunch();
          breakIt(made);
          const result = spawn(guard, preToolUse('Edit', path.join(made.root, 'src', 'export', 'index.mjs')), {
            cwd: made.root,
            env: { CLAUDE_PROJECT_DIR: made.root },
          });
          assert(denied(result), `${guard} denies when ${label} cannot be read`);
        }
      }
    },
  },
  {
    id: 'E6 event-log in the same case exits 0 and appends one line to hooks.log',
    covers: ['E6', 'C8'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.launchDir, 'launch.json'), '{ not json\n');
      const before = readLines(path.join(made.runDir, 'hooks.log')).length;
      const result = spawn('event-log', sessionStart(), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      assertEq(result.code, 0, 'a recording hook does not block on an unreadable record');
      assertEq(readLines(path.join(made.runDir, 'hooks.log')).length, before + 1, 'exactly one line is appended to hooks.log');
    },
  },
  {
    id: 'C8 the hooks.log line reads "<iso ts> <hook name> <message>"',
    covers: ['C8'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.launchDir, 'launch.json'), '{ not json\n');
      spawn('event-log', sessionStart(), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
      const line = readLines(path.join(made.runDir, 'hooks.log')).at(-1);
      assert(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}\S* event-log \S/.test(line), `the line reads '<iso ts> <hook name> <message>': ${line}`);
    },
  },
  {
    id: 'E8 stdin that is not a JSON object exits 0, prints nothing, and writes no event',
    covers: ['E8'],
    fn: () => {
      for (const stdin of ['not json at all', '[]', '"a string"', '']) {
        for (const name of hookNames()) {
          const made = mkCoreLaunch();
          const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
          const result = spawn(name, stdin, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
          assertEq(result.code, 0, `${name} on stdin ${JSON.stringify(stdin)} exits 0`);
          assertEq(result.stdout.trim(), '', `${name} on stdin ${JSON.stringify(stdin)} prints nothing`);
          assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, `${name} wrote an event on bad stdin`);
        }
      }
    },
  },
  {
    id: 'E8 CLAUDE_PROJECT_DIR unset, or naming a directory with no flightdeck/launch, exits 0 and writes nothing',
    covers: ['E8'],
    fn: () => {
      const elsewhere = tmp('fc-elsewhere');
      for (const env of [{ CLAUDE_PROJECT_DIR: null }, { CLAUDE_PROJECT_DIR: elsewhere }]) {
        for (const name of hookNames()) {
          const made = mkCoreLaunch();
          const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
          const result = spawn(name, envelopeFor(name, made), { cwd: elsewhere, env });
          assertEq(result.code, 0, `${name} with no project dir exits 0`);
          assertEq(result.stdout.trim(), '', `${name} with no project dir prints nothing`);
          assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, `${name} wrote an event with no project dir`);
        }
      }
    },
  },
  {
    id: 'E8 an unlisted hook_event_name exits 0, prints nothing, and writes no event',
    covers: ['E8'],
    fn: () => {
      for (const name of hookNames()) {
        const made = mkCoreLaunch();
        const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
        const result = spawn(name, { session_id: 's', transcript_path: '/dev/null', hook_event_name: 'Invented' }, {
          cwd: made.root,
          env: { CLAUDE_PROJECT_DIR: made.root },
        });
        assertEq(result.code, 0, `${name} on an unlisted event exits 0`);
        assertEq(result.stdout.trim(), '', `${name} on an unlisted event prints nothing`);
        assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, `${name} wrote an event for an unlisted event name`);
      }
    },
  },
]);
