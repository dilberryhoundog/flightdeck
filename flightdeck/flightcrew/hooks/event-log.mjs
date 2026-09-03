// flightcrew/hooks/event-log.mjs — records one events.jsonl line per recorded Claude Code hook event of the active launch, and announces the launch on SessionStart.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/event-log.mjs (stdin: the hook envelope); always exits 0.

import { runHook, record, systemMessage } from './lib.mjs';

/** The hook events a launch records; every other hook_event_name is ignored (design section 5.3). */
const RECORDED = [
  'SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop', 'TaskCreated', 'TaskCompleted',
  'PostToolUseFailure', 'PermissionDenied', 'PreCompact', 'PostCompact', 'Stop', 'WorktreeRemove',
];

const TEXT_LIMIT = 200;

function text(value, limit = null) {
  if (typeof value !== 'string') return undefined;
  return limit === null ? value : value.slice(0, limit);
}

/** The tool fields a failure or a denial carries, limited to the allowed detail keys. */
function toolDetail(input) {
  const toolInput = input.tool_input && typeof input.tool_input === 'object' ? input.tool_input : {};
  return {
    tool_name: text(input.tool_name),
    command: text(toolInput.command, TEXT_LIMIT),
    file_path: text(toolInput.file_path ?? toolInput.notebook_path),
  };
}

/** The detail object for one recorded event: only the keys spec I5 allows, only those the envelope carries. */
function detailFor(input) {
  switch (input.hook_event_name) {
    case 'SessionStart': return { mode: text(input.mode) };
    case 'SessionEnd': return { reason: text(input.reason) };
    case 'SubagentStart': return { prompt: text(input.prompt, TEXT_LIMIT) };
    case 'SubagentStop': return { stop_reason: text(input.stop_reason) };
    case 'TaskCreated':
    case 'TaskCompleted': return { task_id: text(input.task_id), task_title: text(input.task_title) };
    case 'PostToolUseFailure': return { ...toolDetail(input), error: text(input.error), tool_error_code: text(input.tool_error_code) };
    case 'PermissionDenied': return { ...toolDetail(input), permission_denial_reason: text(input.permission_denial_reason) };
    case 'PreCompact':
    case 'PostCompact': return { trigger: text(input.trigger) };
    case 'Stop': return { stop_reason: text(input.stop_reason) };
    case 'WorktreeRemove': return { worktree_path: text(input.worktree_path), reason: text(input.reason) };
    default: return {};
  }
}

/** Drops the keys the envelope did not carry, so a detail object never states a field as absent. */
function present(detail) {
  const kept = {};
  for (const [key, value] of Object.entries(detail)) {
    if (value !== undefined && value !== null) kept[key] = value;
  }
  return kept;
}

/** The sentence a session sees when it starts inside an active launch (design section 8). */
function announcement(name, phase) {
  return `flightcrew: launch ${name} is active in phase ${phase}; hooks are enforcing its locks and boundary. If this session is not that run, run fc launch end or set FLIGHTCREW_LAUNCH=none.`;
}

await runHook('event-log', async (ctx) => {
  if (!ctx.launch) return 0;
  const input = ctx.input;
  if (!RECORDED.includes(input.hook_event_name)) return 0;
  const agent = {};
  if (typeof input.agent_id === 'string' && input.agent_id !== '') agent.agent_id = input.agent_id;
  if (typeof input.agent_type === 'string' && input.agent_type !== '') agent.agent_type = input.agent_type;
  record(ctx, input.hook_event_name, present(detailFor(input)), agent);
  if (input.hook_event_name === 'SessionStart') {
    systemMessage(announcement(ctx.launch.name, ctx.launch.json?.phase ?? 'unknown'));
  }
  return 0;
});
