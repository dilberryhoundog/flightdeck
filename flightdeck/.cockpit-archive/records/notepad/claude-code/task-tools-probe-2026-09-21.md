# Task tools probe — 2026-09-21, session 71b94de4

Question: how does a session on Fable 5.1 get the Task tools (TaskCreate, TaskGet, TaskList, TaskUpdate), which the shared task list of agent teams needs? The commander recalled seeing them granted by the agent body's `tools:` field (Or075). The scout's reading of tools-reference: model-gated by default; opt-ins are `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`, `--allowedTools`, `--tools`; a definition's `tools` field is not a listed opt-in.

Method: headless `claude -p "ok" --agents '<json>' --agent p --output-format stream-json --verbose`, run from the scratchpad, model `fable`, reading the `tools` array of the `system/init` event. CLI 2.1.278. A field read, not a question to the model.

| Probe | tools in init | Task-named tools |
|---|---|---|
| definition with no `tools` field | 104 | Task, TaskStop |
| definition with `tools: [Read, TaskCreate, TaskList, TaskUpdate, TaskGet]` | 1 | none (only Read resolved) |
| no `tools` field, env `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` | 109 | Task, TaskCreate, TaskGet, TaskList, TaskStop, TaskUpdate |
| no `tools` field, flag `--tools "default,TaskCreate,TaskList,TaskUpdate,TaskGet"` | 80 | TaskCreate, TaskGet, TaskList, TaskUpdate |

Reading: on this model and CLI, headless, the definition's `tools` field does not enable the Task tools; the names do not resolve and the agent is left with Read alone. The environment variable enables all four and keeps the rest. The `--tools` flag enables them but changed the tool count from 104 to 80, so it replaced part of the default set; not investigated. Not tested: an interactive session, which is how the pilot runs; a `tools` field combined with the environment variable; whether in-process teammates then receive the tools (the docs say they follow the lead's session).

## Later the same session: the tools appeared in the interactive lead

- At about 15:40 UTC the harness announced TaskCreate, TaskGet, TaskList and TaskUpdate to the lead (the pilot, Fable 5.1, interactive, launched by `pilot.sh`) as deferred tools, with its usual reminder to use them. The pilot had changed no setting; `base/settings/pilot.settings.json` and `team/officers/pilot/pilot.md` showed no diff. Cause unknown. The announcement followed the pilot's own `ToolSearch` for task tools (which had returned none about ten minutes earlier) and several headless child launches, one with `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` set for the child only; neither is shown to be the cause.
- Listed is not enabled, so the pilot called them: `TaskList` returned "No tasks found"; `TaskCreate` created task 1; on disk `~/.claude/tasks/session-cf73c72a/1.json` held the task (id, subject, description, status pending, blocks, blockedBy) beside a `.lock` file; `TaskUpdate` with status deleted removed it. The directory is named for the team (`session-cf73c72a`), not the session id (`71b94de4`). So the lead's task list is live in this session.
- A teammate spawned before the appearance (option-maker, Opus, in-process) measured its own roster at about 15:42: a `select:` for the four returns no match; TaskStop only. So the capability did not reach an existing seat. Not tested: a seat spawned after the appearance.
- Consequence for the docs' model gate: on this CLI an interactive Fable lead can come to hold the Task tools mid-session without an opt-in the pilot can identify. The gate as documented is not the whole story, or something at the commander's end changed.
- A seat spawned after the appearance (`task-probe`, Haiku, in-process teammate, permission mode auto, about 15:47): its transcript shows `ToolSearch select:TaskCreate,TaskGet,TaskList,TaskUpdate` returning four tool references and `TaskList` returning "No tasks found". So a new in-process teammate holds the Task tools once the lead does, and an older one does not: availability is fixed at spawn. It also had to load SendMessage by ToolSearch before it could report.
- Cause, from the commander (Or077): he set the todo tools environment variable in his global settings (`~/.claude/settings.json`) during the flight. So the appearance was the documented opt-in, applied by a settings change picked up by the running interactive session without a restart. What this adds to the docs: an `env` change in user settings reaches a live session and its later-spawned in-process teammates, not its existing ones. The model gate stands as documented. Being global, the variable applies to every session on this machine, not only the pilot's.
