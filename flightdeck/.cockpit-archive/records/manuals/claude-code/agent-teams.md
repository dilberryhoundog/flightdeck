---
type: "Manual"
source: "https://code.claude.com/docs/en/agent-teams.md and linked pages (researched 2026-09-17 in two passes by harness-guide, CLI 2.1.274)."
style: "record"
stamp: ["2026-09-17", "harness-guide", "a61606de"]
---
# Agent Teams

## What

Multiple Claude Code sessions coordinated by a lead. Teammates have their own context windows, communicate through a shared mailbox, and claim work from a shared task list. Claude Code manages setup, cleanup and coordination.

## Enable

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in the settings `env` block or the shell. Interactive sessions only.

## Lifecycle from the lead's seat

- Team creation is implicit: the first Agent tool call with a `name` while the flag is set launches a teammate. No TeamCreate or TeamDelete tools since v2.1.178. Cleanup is automatic at session end.
- The lead names each teammate. Teammates can read the roster from `~/.claude/teams/{team}/config.json`.
- Each teammate receives: the spawn prompt, project context (CLAUDE.md, MCP, skills), and a model chosen in this order: named in the spawn, the subagent definition's `model`, `CLAUDE_CODE_SUBAGENT_MODEL`, the lead's model. Effort level is inherited.
- Teammates notify the lead when they go idle, including their final answer or an error. No polling.
- One team per session. No nested teams. The lead is fixed.

## Task list

- Tools: `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet`. On newer models they are opt-in via `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`.
- States: pending, in progress, completed. `blockedBy` dependencies unblock automatically on completion. File locking prevents double claims.
- Lead assigns, or teammates self-claim the next unassigned unblocked task. Agents without Task tools coordinate by message only.
- Stored at `~/.claude/tasks/{team}/`. The JSON shape is internal; use the tools, not the files.

## Mailbox

- SendMessage by name. Plain text. No broadcast; message each teammate.
- Delivery between tool calls; a running tool is never interrupted. An idle teammate starts a new turn on receipt.
- Inbox files at `~/.claude/teams/{team}/inboxes/{agent}.json`, validated on read.
- Teammates see the message flagged as from another session, not the human.

## Permissions

- Teammate permission prompts bubble up to the lead session for the human to answer there.
- Teammates start with the lead's permission mode, except `dontAsk`. Cannot be set per teammate at spawn; can be changed after.
- In `auto` mode the classifier treats relayed approval claims as untrusted. Teammates never approve prompts on the human's behalf.

## Plan approval

Lead in plan mode spawns a teammate; the teammate plans read-only; its plan approval request is granted automatically in the lead's session without the human reviewing it; the teammate then implements under normal permission prompts.

## Display

- In-process (default): agent panel under the prompt. Arrow keys select, Enter views a teammate and routes typed text to it, Escape returns, `x` stops a selected teammate, Ctrl+T toggles the task list. Idle teammates hide after 30 seconds; message them to bring them back.
- Split panes: tmux or iTerm2 (`teammateMode` setting). Not VS Code terminal, Windows Terminal or Ghostty. A teammate's model and fast mode are fixed at spawn.

## Shutdown and persistence

- "Ask the X teammate to shut down": the teammate approves or rejects. Teammates finish their current tool call first.
- `~/.claude/teams/{team}/config.json` is removed at session end. `~/.claude/tasks/{team}/` persists under `cleanupPeriodDays` (default 30).

## Hooks

`TeammateIdle` (exit 2 keeps the teammate working), `TaskCreated` (exit 2 prevents creation), `TaskCompleted` (exit 2 prevents completion). Payloads carry the common hook fields; `team_name` is deprecated. Exact task payload schema is not documented.

## Limitations (from the docs)

- No session resumption with in-process teammates; after resume the lead may message teammates that no longer exist.
- Task status can lag, which blocks dependents.
- Shutdown can be slow.
- One team per session. No nested teams. Lead is fixed.
- In-process teammates' subagents run foreground; `background: true` definitions error.
- Permissions set at spawn.
- Split panes need tmux or iTerm2.

## Size and cost

- Start with 3 to 5 teammates. Three focused beat five scattered.
- Token use scales with active teammates. Prefer Sonnet for teammates. Keep spawn prompts focused. Shut down teammates when done.
- Not for sequential work, same-file edits, or heavily dependent work; use a single session or subagents. Start with research and review teams before parallel implementation. Give each teammate its own files.
