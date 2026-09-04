// testbench/suites/hooks-eventlog/run.mjs — T4: event-log appends exactly one well-formed event line per recorded hook event, ignores unlisted events, announces the launch on SessionStart, and stays silent under FLIGHTCREW_LAUNCH=none. Covers B5, B52, I5.
// Usage: node flightdeck/testbench/suites/hooks-eventlog/run.mjs; exit 0 when every case passes, 2 otherwise.

import path from 'node:path';
import {
  suite, hook, fc, mkActiveLaunch,
  readJson, writeJson, readText,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const HOOK_NAMES = ['event-log', 'lock-guard', 'boundary-guard', 'structural-check', 'stop-gate', 'session-end'];
const ALLOWED_DETAIL_KEYS = [
  'tool_name', 'file_path', 'command', 'error', 'tool_error_code', 'permission_denial_reason', 'stop_reason', 'trigger',
  'task_id', 'task_title', 'reason', 'mode', 'prompt', 'transcript_path', 'worktree_path',
];
const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const LONG = 'x'.repeat(350);

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

// One envelope per recorded event, with the fields Claude Code sends for it.
function recordedEnvelope(root, event) {
  switch (event) {
    case 'SessionStart': return envelope(root, event, { mode: 'startup' });
    case 'SessionEnd': return envelope(root, event, { reason: 'other' });
    case 'SubagentStart': return envelope(root, event, { agent_id: 'agent-u1', agent_type: 'implementer', agent_files: [], prompt: `unit: U1 ${LONG}` });
    case 'SubagentStop': return envelope(root, event, { agent_id: 'agent-u1', agent_type: 'implementer', stop_reason: 'end_turn', last_assistant_message: 'returned' });
    case 'TaskCreated': return envelope(root, event, { task_id: 'task-1', task_title: 'build U1', task_description: 'implement the unit' });
    case 'TaskCompleted': return envelope(root, event, { task_id: 'task-1', task_title: 'build U1' });
    case 'PostToolUseFailure': return envelope(root, event, { tool_name: 'Bash', tool_use_id: 'toolu_1', tool_input: { command: `./flightdeck/flightcrew/bin/fc check T3 ${LONG}` }, error: 'exit 2: T3 fail', tool_error_code: 'ToolError' });
    case 'PermissionDenied': return envelope(root, event, { tool_name: 'Bash', tool_use_id: 'toolu_2', tool_input: { command: 'git push origin HEAD' }, permission_denial_reason: 'git push is outside the allow list' });
    case 'PreCompact': return envelope(root, event, { trigger: 'auto', custom_instructions: '' });
    case 'PostCompact': return envelope(root, event, { trigger: 'auto' });
    case 'Stop': return envelope(root, event, { stop_reason: 'end_turn', stop_hook_active: false, last_assistant_message: 'done' });
    case 'WorktreeRemove': return envelope(root, event, { worktree_path: path.join(root, '.claude', 'worktrees', 'w1'), reason: 'subagent finished' });
    default: throw new Error(`no envelope for ${event}`);
  }
}
const RECORDED = ['SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop', 'TaskCreated', 'TaskCompleted', 'PostToolUseFailure', 'PermissionDenied', 'PreCompact', 'PostCompact', 'Stop', 'WorktreeRemove'];

function unlistedEnvelope(root, event) {
  switch (event) {
    case 'PreToolUse': return envelope(root, event, { tool_name: 'Edit', tool_use_id: 'toolu_3', tool_input: { file_path: path.join(root, 'src', 'export', 'index.mjs'), old_string: 'a', new_string: 'b' } });
    case 'PostToolUse': return envelope(root, event, { tool_name: 'Edit', tool_use_id: 'toolu_3', tool_input: { file_path: path.join(root, 'src', 'export', 'index.mjs') }, tool_result: { success: true } });
    case 'UserPromptSubmit': return envelope(root, event, { prompt: 'continue' });
    case 'Notification': return envelope(root, event, { message: 'waiting', notification_type: 'idle' });
    case 'WorktreeCreate': return envelope(root, event, { worktree_path: path.join(root, '.claude', 'worktrees', 'w2'), branch: 'w2' });
    case 'Setup': return envelope(root, event, {});
    default: throw new Error(`no envelope for ${event}`);
  }
}
const UNLISTED = ['PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Notification', 'WorktreeCreate', 'Setup'];

// The detail keys each recorded event must carry, with the value the envelope fixes for them (spec I5; design section 5.3).
function requiredDetail(envelopeObj) {
  const e = envelopeObj;
  const cut = (value) => String(value).slice(0, 200);
  switch (e.hook_event_name) {
    case 'SessionStart': return { mode: e.mode };
    case 'SessionEnd': return { reason: e.reason };
    case 'SubagentStart': return { prompt: cut(e.prompt) };
    case 'SubagentStop': return { stop_reason: e.stop_reason };
    case 'TaskCreated':
    case 'TaskCompleted': return { task_id: e.task_id, task_title: e.task_title };
    case 'PostToolUseFailure': return { tool_name: e.tool_name, command: cut(e.tool_input?.command), error: e.error, tool_error_code: e.tool_error_code };
    case 'PermissionDenied': return { tool_name: e.tool_name, command: cut(e.tool_input?.command), permission_denial_reason: e.permission_denial_reason };
    case 'PreCompact':
    case 'PostCompact': return { trigger: e.trigger };
    case 'Stop': return { stop_reason: e.stop_reason };
    case 'WorktreeRemove': return { worktree_path: e.worktree_path, reason: e.reason };
    default: throw new Error(`no required detail for ${e.hook_event_name}`);
  }
}

function eventsPath(launchDir) {
  return path.join(launchDir, 'events.jsonl');
}

function parseEvents(text) {
  return text.split('\n').filter((line) => line.trim() !== '').map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`events.jsonl line ${index + 1} is not JSON: ${error.message}: ${line.slice(0, 120)}`);
    }
  });
}

function setPhase(launchDir, phase) {
  const p = path.join(launchDir, 'launch.json');
  const launch = readJson(p);
  launch.phase = phase;
  writeJson(p, launch);
}

// Runs event-log once with the envelope and returns the single appended event, asserting the file grew by exactly one line.
function appendOne(active, env, envelopeObj) {
  const before = readText(eventsPath(active.launchDir));
  const result = hook('event-log', envelopeObj, { cwd: active.root, env: env ?? active.env });
  assertExit(result, 0, `event-log on ${envelopeObj.hook_event_name}`);
  const after = readText(eventsPath(active.launchDir));
  assert(after.startsWith(before), 'existing event lines are preserved');
  assert(after.endsWith('\n'), 'the appended line is newline-terminated');
  const added = parseEvents(after.slice(before.length));
  assertEq(added.length, 1, `exactly one line appended for ${envelopeObj.hook_event_name}`);
  return { line: added[0], result };
}

function assertEventShape(line, envelopeObj, launch, phase) {
  assert(line && typeof line === 'object' && !Array.isArray(line), 'event line is a JSON object');
  assertMatch(line.ts, ISO_TS, 'ts is an ISO timestamp');
  assertEq(line.event, envelopeObj.hook_event_name, 'event equals hook_event_name');
  assertEq(line.launch, launch, 'launch is the active launch name');
  assertEq(line.phase, phase, 'phase is the launch phase');
  assertEq(line.source, 'hook', 'source is hook');
  assertEq(line.session_id, envelopeObj.session_id, 'session_id is carried');
  assert(line.detail && typeof line.detail === 'object' && !Array.isArray(line.detail), 'detail is an object');
  const extra = Object.keys(line.detail).filter((key) => !ALLOWED_DETAIL_KEYS.includes(key));
  assertEq(extra, [], 'detail keys are limited to the allowed list');
  // Lower bound: the keys this event's detail must actually carry, with the envelope's values.
  for (const [key, value] of Object.entries(requiredDetail(envelopeObj))) {
    assert(Object.prototype.hasOwnProperty.call(line.detail, key), `detail.${key} is present for ${envelopeObj.hook_event_name}`);
    assertEq(line.detail[key], value, `detail.${key} carries the envelope value`);
  }
  if (typeof envelopeObj.prompt === 'string' && envelopeObj.prompt.length > 200) {
    assertEq(line.detail.prompt.length, 200, 'a prompt longer than 200 characters is truncated to its first 200');
  }
  const command = envelopeObj.tool_input?.command;
  if (typeof command === 'string' && command.length > 200) {
    assertEq(line.detail.command.length, 200, 'a command longer than 200 characters is truncated to its first 200');
  }
  if (envelopeObj.agent_id !== undefined) assertEq(line.agent_id, envelopeObj.agent_id, 'agent_id is carried');
  if (envelopeObj.agent_type !== undefined) assertEq(line.agent_type, envelopeObj.agent_type, 'agent_type is carried');
  if (line.detail.prompt !== undefined) assertEq(line.detail.prompt, String(envelopeObj.prompt).slice(0, 200), 'prompt is its first 200 characters');
  if (line.detail.command !== undefined) assertEq(line.detail.command, String(envelopeObj.tool_input?.command).slice(0, 200), 'command is its first 200 characters');
  for (const key of ['tool_name', 'error', 'tool_error_code', 'permission_denial_reason', 'stop_reason', 'trigger', 'task_id', 'task_title', 'reason', 'mode', 'worktree_path']) {
    if (line.detail[key] !== undefined) assertEq(line.detail[key], envelopeObj[key], `detail.${key} echoes the envelope`);
  }
}

// The SessionStart announcement, fixed word for word by design section 8.
function announcement(launch, phase) {
  return `flightcrew: launch ${launch} is active in phase ${phase}; hooks are enforcing its locks and boundary. If this session is not that run, run fc launch end or set FLIGHTCREW_LAUNCH=none.`;
}

const cases = [];

for (const event of RECORDED) {
  cases.push({
    id: `records-${event}`,
    covers: ['B5', 'I5'],
    fn: async () => {
      const active = mkActiveLaunch();
      const envelopeObj = recordedEnvelope(active.root, event);
      const { line, result } = appendOne(active, active.env, envelopeObj);
      assertEventShape(line, envelopeObj, active.launch, 'review');
      if (event !== 'SessionStart') assertEq(result.stdout, '', `${event}: nothing on stdout`);
    },
  });
}

cases.push({
  id: 'one-line-per-invocation',
  covers: ['B5'],
  fn: async () => {
    const active = mkActiveLaunch();
    const before = parseEvents(readText(eventsPath(active.launchDir)));
    for (let i = 0; i < 3; i += 1) {
      const result = hook('event-log', recordedEnvelope(active.root, 'Stop'), { cwd: active.root, env: active.env });
      assertExit(result, 0, `invocation ${i + 1}`);
    }
    const after = parseEvents(readText(eventsPath(active.launchDir)));
    assertEq(after.length, before.length + 3, 'three invocations append three lines');
    assertEq(after.slice(-3).map((line) => line.event), ['Stop', 'Stop', 'Stop'], 'each appended line records the event');
  },
});

cases.push({
  id: 'phase-follows-launch-json',
  covers: ['B5', 'I5'],
  fn: async () => {
    const active = mkActiveLaunch();
    setPhase(active.launchDir, 'implement');
    const envelopeObj = recordedEnvelope(active.root, 'SubagentStart');
    const { line } = appendOne(active, active.env, envelopeObj);
    assertEventShape(line, envelopeObj, active.launch, 'implement');
  },
});

cases.push({
  id: 'detail-keys-hold-under-noisy-envelope',
  covers: ['B5', 'I5'],
  fn: async () => {
    const active = mkActiveLaunch();
    const envelopeObj = {
      ...recordedEnvelope(active.root, 'PostToolUseFailure'),
      tool_response: { stdout: 'noise' },
      tool_input: { command: 'ls', description: 'list', timeout: 5, extra_field: 'must not leak' },
      unknown_top_level: { nested: true },
    };
    const { line } = appendOne(active, active.env, envelopeObj);
    assertEventShape(line, envelopeObj, active.launch, 'review');
    assert(!('extra_field' in line.detail) && !('unknown_top_level' in line.detail) && !('tool_response' in line.detail), 'unknown envelope fields never reach detail');
  },
});

for (const event of UNLISTED) {
  cases.push({
    id: `ignores-${event}`,
    covers: ['B5'],
    fn: async () => {
      const active = mkActiveLaunch();
      const before = readText(eventsPath(active.launchDir));
      const result = hook('event-log', unlistedEnvelope(active.root, event), { cwd: active.root, env: active.env });
      assertExit(result, 0, `event-log on ${event}`);
      assertEq(result.stdout, '', `${event}: nothing on stdout`);
      assertEq(readText(eventsPath(active.launchDir)), before, `${event}: nothing appended`);
    },
  });
}

cases.push({
  id: 'session-start-system-message',
  covers: ['B52'],
  fn: async () => {
    const active = mkActiveLaunch();
    const envelopeObj = recordedEnvelope(active.root, 'SessionStart');
    const { line, result } = appendOne(active, active.env, envelopeObj);
    assertEq(line.event, 'SessionStart', 'SessionStart is recorded');
    assert(result.decision && typeof result.decision === 'object', `stdout must be a JSON object, got ${JSON.stringify(result.stdout.slice(0, 200))}`);
    assertEq(Object.keys(result.decision), ['systemMessage'], 'the only top-level key is systemMessage');
    assertEq(typeof result.decision.systemMessage, 'string', 'systemMessage is a string');
    assertEq(result.decision.systemMessage, announcement(active.launch, 'review'), 'systemMessage is the sentence design section 8 fixes');
  },
});

cases.push({
  id: 'session-start-system-message-names-current-phase',
  covers: ['B52'],
  fn: async () => {
    const active = mkActiveLaunch();
    setPhase(active.launchDir, 'implement');
    const result = hook('event-log', recordedEnvelope(active.root, 'SessionStart'), { cwd: active.root, env: active.env });
    assertExit(result, 0, 'event-log on SessionStart');
    assert(result.decision && typeof result.decision.systemMessage === 'string', 'systemMessage present');
    assertEq(result.decision.systemMessage, announcement(active.launch, 'implement'), 'systemMessage is the sentence design section 8 fixes, naming the current phase');
  },
});

cases.push({
  id: 'flightcrew-launch-none-silences-every-hook',
  covers: ['B52'],
  fn: async () => {
    const active = mkActiveLaunch();
    const env = { ...active.env, FLIGHTCREW_LAUNCH: 'none' };
    const before = readText(eventsPath(active.launchDir));
    const envelopes = {
      'event-log': recordedEnvelope(active.root, 'SessionStart'),
      'lock-guard': envelope(active.root, 'PreToolUse', { tool_name: 'Edit', tool_use_id: 'toolu_l', tool_input: { file_path: path.join(active.root, 'tests', 'export', 'contract.test.mjs'), old_string: 'a', new_string: 'b' } }),
      'boundary-guard': envelope(active.root, 'PreToolUse', { tool_name: 'Write', tool_use_id: 'toolu_b', tool_input: { file_path: path.join(active.root, 'outside.txt'), content: 'x' } }),
      'structural-check': envelope(active.root, 'PostToolUse', { tool_name: 'Edit', tool_use_id: 'toolu_s', tool_input: { file_path: path.join(active.root, 'src', 'export', 'index.mjs') }, tool_result: { success: true } }),
      'stop-gate': recordedEnvelope(active.root, 'Stop'),
      'session-end': recordedEnvelope(active.root, 'SessionEnd'),
    };
    for (const name of HOOK_NAMES) {
      const result = hook(name, envelopes[name], { cwd: active.root, env });
      assertExit(result, 0, `${name} under FLIGHTCREW_LAUNCH=none`);
      assertEq(result.stdout, '', `${name}: nothing on stdout under FLIGHTCREW_LAUNCH=none`);
    }
    assertEq(readText(eventsPath(active.launchDir)), before, 'events.jsonl untouched under FLIGHTCREW_LAUNCH=none');
  },
});

cases.push({
  id: 'flightcrew-launch-none-fc-needs-launch',
  covers: ['B52'],
  fn: async () => {
    const active = mkActiveLaunch();
    const env = { ...active.env, FLIGHTCREW_LAUNCH: 'none' };
    for (const args of [['launch', 'status'], ['check', 'all'], ['events', 'summary']]) {
      const result = fc(args, { cwd: active.root, env });
      assertExit(result, 1, `fc ${args.join(' ')} under FLIGHTCREW_LAUNCH=none`);
      assertIncludes(`${result.stdout}\n${result.stderr}`, 'no active launch', `fc ${args.join(' ')} says 'no active launch'`);
    }
  },
});

cases.push({
  id: 'event-line-is-single-line-json',
  covers: ['I5'],
  fn: async () => {
    const active = mkActiveLaunch();
    const before = readText(eventsPath(active.launchDir));
    const envelopeObj = recordedEnvelope(active.root, 'SubagentStart');
    envelopeObj.prompt = 'line one\nline two\n"quoted"\tand tab';
    const result = hook('event-log', envelopeObj, { cwd: active.root, env: active.env });
    assertExit(result, 0, 'event-log on SubagentStart');
    const tail = readText(eventsPath(active.launchDir)).slice(before.length);
    const lines = tail.split('\n').filter((line) => line !== '');
    assertEq(lines.length, 1, 'a prompt with newlines still yields one physical line');
    const parsed = JSON.parse(lines[0]);
    assertEq(parsed.event, 'SubagentStart', 'the one line parses as the event');
  },
});

await suite('hooks-eventlog', cases);
