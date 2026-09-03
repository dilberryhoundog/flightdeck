// testbench/suites/hooks-noop/run.mjs — T3: every hook is a silent no-op (exit 0, empty stdout) without an active launch, without $CLAUDE_PROJECT_DIR, with a project dir lacking flightdeck/launch, with FLIGHTCREW_LAUNCH=none, or on stdin that is not a JSON object; stop-gate logs and stays silent when its gate cannot run; fc exits 1 with 'no flightdeck root' where the hooks stay silent. Covers B4, C8, I7, E5, E13, E14.
// Usage: node flightdeck/testbench/suites/hooks-noop/run.mjs; exit 0 when every case passes, 2 otherwise.

import path from 'node:path';
import {
  suite, hook, fc, sh, tmp, mkLaunchRepo, mkActiveLaunch, initRepo, copyDir,
  readJson, writeJson, readText, writeText, exists, listFiles, FD,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const HOOK_NAMES = ['event-log', 'lock-guard', 'boundary-guard', 'structural-check', 'stop-gate', 'session-end'];

function envelope(root, event, extra = {}) {
  return {
    session_id: 'sess-testbench',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: event,
    ...extra,
  };
}

// An envelope that would make the hook act (deny, block, log) if a launch were active, so silence proves the no-op.
function armedEnvelope(root, name) {
  switch (name) {
    case 'event-log':
      return envelope(root, 'SessionStart', { mode: 'startup' });
    case 'lock-guard':
      return envelope(root, 'PreToolUse', {
        tool_name: 'Edit',
        tool_use_id: 'toolu_lock',
        tool_input: { file_path: path.join(root, 'tests', 'export', 'contract.test.mjs'), old_string: 'a', new_string: 'b' },
      });
    case 'boundary-guard':
      return envelope(root, 'PreToolUse', {
        tool_name: 'Write',
        tool_use_id: 'toolu_boundary',
        tool_input: { file_path: path.join(root, 'outside', 'new-file.txt'), content: 'x' },
      });
    case 'structural-check':
      return envelope(root, 'PostToolUse', {
        tool_name: 'Edit',
        tool_use_id: 'toolu_structural',
        tool_input: { file_path: path.join(root, 'src', 'export', 'broken.mjs'), old_string: 'a', new_string: 'b' },
        tool_result: { filePath: path.join(root, 'src', 'export', 'broken.mjs'), success: true },
      });
    case 'stop-gate':
      return envelope(root, 'Stop', { stop_reason: 'end_turn', stop_hook_active: false, last_assistant_message: 'done' });
    case 'session-end':
      return envelope(root, 'SessionEnd', { reason: 'other' });
    default:
      throw new Error(`unknown hook ${name}`);
  }
}

function assertSilent(result, label) {
  assertExit(result, 0, `${label}: exit code`);
  assertEq(result.stdout, '', `${label}: stdout must be empty`);
}

function hooksLogLines(launchDir) {
  const p = path.join(launchDir, 'hooks.log');
  if (!exists(p)) return [];
  return readText(p).split('\n').filter((line) => line.trim() !== '');
}

function assertOneLogLine(before, after, hookName, label) {
  assertEq(after.length, before.length + 1, `${label}: hooks.log must gain exactly one line`);
  const line = after[after.length - 1];
  assertMatch(line, new RegExp(`^\\d{4}-\\d{2}-\\d{2}T[0-9:.]+(Z|[+-]\\d{2}:\\d{2}) ${hookName}(\\.mjs)? \\S`), `${label}: hooks.log line is '<iso ts> <hook name> <message>'`);
}

// Launch copy with a broken source file and a red acceptance command so a live hook would have something to say.
function armedActiveLaunch() {
  const active = mkActiveLaunch();
  writeText(path.join(active.root, 'src', 'export', 'broken.mjs'), 'export const broken = ;\n');
  const launchJson = path.join(active.launchDir, 'launch.json');
  const launch = readJson(launchJson);
  launch.phase = 'verify';
  writeJson(launchJson, launch);
  return active;
}

const cases = [];

// B4 / C8: no launch folder at all.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `no-launch-folder-${name}`,
    covers: ['B4', 'C8', 'I7'],
    fn: async () => {
      const repo = mkLaunchRepo();
      writeText(path.join(repo.root, 'src', 'export', 'broken.mjs'), 'export const broken = ;\n');
      const env = { CLAUDE_PROJECT_DIR: repo.root, FLIGHTCREW_ROOT: repo.root };
      const result = hook(name, armedEnvelope(repo.root, name), { cwd: repo.root, env });
      assertSilent(result, name);
    },
  });
}

// B4: a launch folder exists but none is active.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `no-active-launch-${name}`,
    covers: ['B4', 'C8'],
    fn: async () => {
      const active = armedActiveLaunch();
      const launchJson = path.join(active.launchDir, 'launch.json');
      const launch = readJson(launchJson);
      launch.status = 'accepted';
      writeJson(launchJson, launch);
      const eventsBefore = readText(path.join(active.launchDir, 'events.jsonl'));
      const result = hook(name, armedEnvelope(active.root, name), { cwd: active.root, env: active.env });
      assertSilent(result, name);
      assertEq(readText(path.join(active.launchDir, 'events.jsonl')), eventsBefore, `${name}: events.jsonl must be untouched`);
    },
  });
}

// C8: $CLAUDE_PROJECT_DIR unset, even though cwd is an active launch repository.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `project-dir-unset-${name}`,
    covers: ['C8', 'B4'],
    fn: async () => {
      const active = armedActiveLaunch();
      const result = hook(name, armedEnvelope(active.root, name), { cwd: active.root, env: { CLAUDE_PROJECT_DIR: null, FLIGHTCREW_ROOT: null } });
      assertSilent(result, name);
    },
  });
}

// C8 / E13: $CLAUDE_PROJECT_DIR points at a directory without flightdeck/launch.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `project-dir-without-launch-${name}`,
    covers: ['C8', 'E13'],
    fn: async () => {
      const empty = tmp('fc-empty');
      const result = hook(name, armedEnvelope(empty, name), { cwd: empty, env: { CLAUDE_PROJECT_DIR: empty, FLIGHTCREW_ROOT: empty } });
      assertSilent(result, name);
    },
  });
}

// E13: a git repository that has no flightdeck/launch directory.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `repo-without-flightdeck-launch-${name}`,
    covers: ['E13', 'C8'],
    fn: async () => {
      const root = initRepo(tmp('fc-bare-repo'));
      writeText(path.join(root, 'flightdeck', 'README.md'), '# no launch directory here\n');
      const result = hook(name, armedEnvelope(root, name), { cwd: root, env: { CLAUDE_PROJECT_DIR: root, FLIGHTCREW_ROOT: root } });
      assertSilent(result, name);
      assert(!exists(path.join(root, 'flightdeck', 'launch')), `${name}: the hook must not create flightdeck/launch`);
    },
  });
}

// E13, fc clause: a root resolves but carries no flightdeck/launch directory.
cases.push({
  id: 'fc-root-without-flightdeck-launch',
  covers: ['E13'],
  fn: async () => {
    const empty = tmp('fc-empty');
    const result = fc(['launch', 'status'], { cwd: empty, env: { CLAUDE_PROJECT_DIR: empty, FLIGHTCREW_ROOT: empty } });
    assertExit(result, 1, 'fc with no flightdeck/launch');
    assertIncludes(`${result.stdout}\n${result.stderr}`, 'no flightdeck root', 'fc names the missing flightdeck root');
  },
});

// E13, fc clause: no root resolves by any rule — flightcrew itself sits outside a repository and cwd is not in one either.
cases.push({
  id: 'fc-no-root-resolves',
  covers: ['E13'],
  fn: async () => {
    const island = tmp('fc-island');
    copyDir(path.join(FD, 'flightcrew'), path.join(island, 'flightcrew'));
    const elsewhere = tmp('fc-nowhere');
    const entry = path.join(island, 'flightcrew', 'bin', 'fc.mjs');
    const result = sh(`${JSON.stringify(process.execPath)} ${JSON.stringify(entry)} launch status`, {
      cwd: elsewhere,
      env: { CLAUDE_PROJECT_DIR: null, FLIGHTCREW_ROOT: null },
    });
    assertExit(result, 1, 'fc with no launch root at all');
    assertIncludes(`${result.stdout}\n${result.stderr}`, 'no flightdeck root', 'fc names the missing flightdeck root');
  },
});

// B4: FLIGHTCREW_LAUNCH=none disables an otherwise active launch.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `flightcrew-launch-none-${name}`,
    covers: ['B4'],
    fn: async () => {
      const active = armedActiveLaunch();
      const eventsBefore = readText(path.join(active.launchDir, 'events.jsonl'));
      const result = hook(name, armedEnvelope(active.root, name), { cwd: active.root, env: { ...active.env, FLIGHTCREW_LAUNCH: 'none' } });
      assertSilent(result, name);
      assertEq(readText(path.join(active.launchDir, 'events.jsonl')), eventsBefore, `${name}: events.jsonl must be untouched`);
    },
  });
}

// E5: stdin that is not a JSON object, launch active: silent, one hooks.log line.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `bad-stdin-active-launch-${name}`,
    covers: ['E5', 'I7'],
    fn: async () => {
      const active = armedActiveLaunch();
      const before = hooksLogLines(active.launchDir);
      const eventsBefore = readText(path.join(active.launchDir, 'events.jsonl'));
      const result = hook(name, 'this is not json {', { cwd: active.root, env: active.env });
      assertSilent(result, name);
      assertOneLogLine(before, hooksLogLines(active.launchDir), name, name);
      assertEq(readText(path.join(active.launchDir, 'events.jsonl')), eventsBefore, `${name}: events.jsonl must be untouched`);
    },
  });
}

cases.push({
  id: 'bad-stdin-json-array-event-log',
  covers: ['E5'],
  fn: async () => {
    const active = armedActiveLaunch();
    const before = hooksLogLines(active.launchDir);
    const result = hook('event-log', '[1, 2, 3]', { cwd: active.root, env: active.env });
    assertSilent(result, 'event-log');
    assertOneLogLine(before, hooksLogLines(active.launchDir), 'event-log', 'array stdin');
  },
});

cases.push({
  id: 'bad-stdin-empty-lock-guard',
  covers: ['E5'],
  fn: async () => {
    const active = armedActiveLaunch();
    const before = hooksLogLines(active.launchDir);
    const result = hook('lock-guard', '', { cwd: active.root, env: active.env });
    assertSilent(result, 'lock-guard');
    assertOneLogLine(before, hooksLogLines(active.launchDir), 'lock-guard', 'empty stdin');
  },
});

// E5: stdin that is not a JSON object and no launch: silent, nothing written anywhere.
for (const name of HOOK_NAMES) {
  cases.push({
    id: `bad-stdin-no-launch-${name}`,
    covers: ['E5', 'B4'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const result = hook(name, 'not json at all', { cwd: repo.root, env: { CLAUDE_PROJECT_DIR: repo.root, FLIGHTCREW_ROOT: repo.root } });
      assertSilent(result, name);
      assert(
        !listFiles(path.join(repo.root, 'flightdeck', 'launch')).some((file) => file.endsWith('hooks.log')),
        `${name}: no hooks.log anywhere under flightdeck/launch without an active launch`,
      );
    },
  });
}

// I7: the envelope may carry fields beyond the common ones (agent fields, tool_use_id, tool_result) and still be handled.
cases.push({
  id: 'envelope-with-agent-fields-no-launch',
  covers: ['I7', 'B4'],
  fn: async () => {
    const repo = mkLaunchRepo();
    const env = { CLAUDE_PROJECT_DIR: repo.root, FLIGHTCREW_ROOT: repo.root };
    for (const name of HOOK_NAMES) {
      const base = armedEnvelope(repo.root, name);
      const result = hook(name, { ...base, agent_id: 'agent-x1', agent_type: 'implementer', prompt_id: 'p1' }, { cwd: repo.root, env });
      assertSilent(result, name);
    }
  },
});

// E14: stop-gate cannot run its gate.
cases.push({
  id: 'stop-gate-no-map-pinned',
  covers: ['E14'],
  fn: async () => {
    const active = armedActiveLaunch();
    const launchJson = path.join(active.launchDir, 'launch.json');
    const launch = readJson(launchJson);
    launch.tests_map = null;
    writeJson(launchJson, launch);
    const before = hooksLogLines(active.launchDir);
    const eventsBefore = readText(path.join(active.launchDir, 'events.jsonl'));
    const result = hook('stop-gate', armedEnvelope(active.root, 'stop-gate'), { cwd: active.root, env: active.env });
    assertSilent(result, 'stop-gate');
    assertOneLogLine(before, hooksLogLines(active.launchDir), 'stop-gate', 'no map pinned');
    assertEq(readText(path.join(active.launchDir, 'events.jsonl')), eventsBefore, 'no event is appended when the gate cannot run');
  },
});

cases.push({
  id: 'stop-gate-map-file-missing',
  covers: ['E14'],
  fn: async () => {
    const active = armedActiveLaunch();
    const launchJson = path.join(active.launchDir, 'launch.json');
    const launch = readJson(launchJson);
    launch.tests_map = { version: 9, commit: 'b2c3d4e', path: 'specs/export-html/tests-map.v9.json' };
    writeJson(launchJson, launch);
    const before = hooksLogLines(active.launchDir);
    const result = hook('stop-gate', armedEnvelope(active.root, 'stop-gate'), { cwd: active.root, env: active.env });
    assertSilent(result, 'stop-gate');
    assertOneLogLine(before, hooksLogLines(active.launchDir), 'stop-gate', 'map file missing');
  },
});

cases.push({
  id: 'stop-gate-unreadable-launch',
  covers: ['E14'],
  fn: async () => {
    const active = armedActiveLaunch();
    writeText(path.join(active.launchDir, 'launch.json'), '{ "schema_version": 1, "name": "export-html-1", "status": "active", "phase": ');
    const before = hooksLogLines(active.launchDir);
    const result = hook('stop-gate', armedEnvelope(active.root, 'stop-gate'), { cwd: active.root, env: { ...active.env, FLIGHTCREW_LAUNCH: active.launch } });
    assertSilent(result, 'stop-gate');
    assertOneLogLine(before, hooksLogLines(active.launchDir), 'stop-gate', 'unreadable launch.json');
  },
});

await suite('hooks-noop', cases);
