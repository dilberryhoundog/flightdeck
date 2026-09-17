# Agent Teams

Source: https://code.claude.com/docs/en/agent-teams.md (researched 2026-09-17).

## What

Multiple Claude Code sessions coordinated by a lead session. Teammates have their own context windows, communicate through a shared mailbox, and claim work from a shared task list. Claude Code manages setup, cleanup and coordination.

## Enable

Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in the settings `env` block or the shell. Interactive sessions only. Non-interactive (`-p`) and bare mode do not spawn teammates.

## Spawning

Ask in natural language, or call the Agent tool with a `name` parameter. When teams are enabled, a named Agent call without `isolation` launches a teammate. A `subagent_type: "fork"` or `isolation: "worktree"` call stays a subagent. Teammates can be spawned from a subagent definition in `.claude/agents/` by naming the type.

## Display

In-process by default (arrow keys to select a teammate). Split panes via tmux or iTerm2. Set with `teammateMode` in settings (`auto`, `tmux`, `iterm2`) or `--teammate-mode`.

## Communication

- Mailbox: JSON files at `~/.claude/teams/{team}/inboxes/{agent}.json`. Plain text. Teammates message each other by name; lead can message any teammate.
- Teammates receive only their spawn prompt plus normal project context (CLAUDE.md, MCP, skills). They do not receive the lead's conversation history.

## Task list

File-backed at `~/.claude/tasks/{team}/`. States: pending, in progress, completed. Dependencies supported. Lead assigns; teammates self-claim unassigned unblocked tasks. File locking prevents races.

## Hooks

`TeammateIdle`, `TaskCreated`, `TaskCompleted`. Exit code 2 sends feedback and keeps the teammate working. Use for quality gates.

## Shutdown

Ask the lead to shut down a named teammate; the teammate approves or rejects. Team config is removed at session end. The task list persists per retention settings.

## Limitations

- No session resumption with in-process teammates.
- Task status can lag. Shutdown is slow.
- One team per session. No nested teams. The lead is fixed.
- In-process teammates' own subagents run foreground only.
- Permissions are set at spawn.
- Split panes need tmux or iTerm2.
- Token usage scales linearly with teammate count. Best for research, review and competing hypotheses. A single session is cheaper for sequential work.
