#!/usr/bin/env node
// suites/hook-event-log — event-log: one line per recorded hook event, held to the event schema, and the session message it prints at SessionStart. Covers B81, B82.
import path from 'node:path';
import { assert, assertEq, assertIncludes, assertMatch, coreHook, mkCoreLaunch, readEvents, suite, validateWithRunSchema } from '../../lib/core-lib.mjs';

const RECORDED = {
  SessionStart: { source: 'startup' },
  SessionEnd: { reason: 'clear' },
  SubagentStart: { agent_id: 'a1', agent_type: 'implementer' },
  SubagentStop: { agent_id: 'a1', agent_type: 'implementer' },
  TaskCreated: { task_id: 't1', task_title: 'build U1' },
  TaskCompleted: { task_id: 't1', task_title: 'build U1' },
  PostToolUseFailure: { tool_name: 'Edit', tool_error_code: 'ENOENT', error: 'no such file' },
  PermissionDenied: { tool_name: 'Bash', permission_denial_reason: 'not in allow list' },
  PreCompact: { trigger: 'auto' },
  PostCompact: { trigger: 'auto' },
  Stop: { stop_reason: 'end_turn' },
  WorktreeRemove: { worktree_path: '.worktrees/U1' },
};

const log = (made, event, extra = {}) =>
  coreHook('event-log', { session_id: 'sess-1', transcript_path: '/dev/null', hook_event_name: event, ...extra }, {
    cwd: made.root,
    env: { CLAUDE_PROJECT_DIR: made.root },
  });

const events = (made) => readEvents(path.join(made.runDir, 'events.jsonl'));

await suite('hook-event-log', [
  {
    id: 'B81 every recorded event appends exactly one line',
    covers: ['B81'],
    fn: () => {
      const made = mkCoreLaunch();
      let count = events(made).length;
      for (const [event, extra] of Object.entries(RECORDED)) {
        const result = log(made, event, extra);
        assertEq(result.code, 0, `event-log on ${event} exits 0: ${result.stderr}`);
        const now = events(made);
        assertEq(now.length, count + 1, `${event} appended exactly one line`);
        assertEq(now.at(-1).event, event, `the line names ${event}`);
        count = now.length;
      }
    },
  },
  {
    id: 'B81 every appended line validates against the event schema and carries source hook',
    covers: ['B81'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const [event, extra] of Object.entries(RECORDED)) log(made, event, extra);
      for (const line of events(made).slice(-Object.keys(RECORDED).length)) {
        assertEq(validateWithRunSchema('event.schema.json', line), [], `${line.event} against event.schema.json`);
        assertEq(line.source, 'hook', `${line.event} carries source hook`);
        assertEq(line.launch, made.launch, `${line.event} names the launch`);
        assertEq(line.run, made.run, `${line.event} names the run`);
      }
    },
  },
  {
    id: 'B81 no detail key outside the allowed set is written',
    covers: ['B81'],
    fn: () => {
      const ALLOWED = new Set([
        'tool_name', 'file_path', 'command', 'error', 'tool_error_code', 'permission_denial_reason', 'stop_reason',
        'trigger', 'task_id', 'task_title', 'reason', 'mode', 'prompt', 'transcript_path', 'worktree_path',
        'agent_id', 'agent_type', 'unit', 'workflow',
      ]);
      const made = mkCoreLaunch();
      log(made, 'PostToolUseFailure', { ...RECORDED.PostToolUseFailure, secret_field: 'must not travel', tool_input: { file_path: 'x' } });
      const detail = events(made).at(-1).detail;
      for (const key of Object.keys(detail)) assert(ALLOWED.has(key), `detail key ${key} is outside the allowed set`);
      assert(!Object.keys(detail).includes('secret_field'), 'an unlisted key from the envelope is dropped');
    },
  },
  {
    id: 'B81 the detail keys the envelope offers are carried through',
    covers: ['B81'],
    fn: () => {
      const made = mkCoreLaunch();
      log(made, 'PostToolUseFailure', RECORDED.PostToolUseFailure);
      const detail = events(made).at(-1).detail;
      assertEq(detail.tool_name, 'Edit', 'tool_name');
      assertEq(detail.tool_error_code, 'ENOENT', 'tool_error_code');
      assertIncludes(detail.error, 'no such file', 'error');
    },
  },
  {
    id: 'B82 SessionStart prints a systemMessage naming the launch and the run number',
    covers: ['B82'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = log(made, 'SessionStart', RECORDED.SessionStart);
      assertEq(result.code, 0, 'exit 0');
      const message = result.decision?.systemMessage ?? result.decision?.hookSpecificOutput?.additionalContext ?? result.stdout;
      assertMatch(message, new RegExp(made.launch), 'the message names the launch');
      assertMatch(message, /run[ -]?1\b/i, 'the message names the run number');
    },
  },
  {
    id: 'B82 an event other than SessionStart prints no session message',
    covers: ['B82'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = log(made, 'Stop', RECORDED.Stop);
      assertEq(result.decision?.systemMessage ?? '', '', 'no systemMessage on an ordinary event');
    },
  },
]);
