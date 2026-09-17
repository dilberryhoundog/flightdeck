# Subagents and Isolation

Source: https://code.claude.com/docs/en/sub-agents.md (researched 2026-09-17).

## Fresh vs fork

- **Fresh** (default): isolated context. Receives the spawn prompt, CLAUDE.md and git status only. No history, no prior file reads.
- **Fork** (`subagent_type: "fork"`): inherits the full parent conversation, tool pool and output style. Uses the parent's system prompt, not a definition's. Always runs on the parent model.

## Worktree isolation

`isolation: "worktree"` runs the subagent in a temporary git worktree branched from the default branch, not the parent's HEAD. Working directory and git commands are confined to it. Auto-cleaned if unchanged. Bash is checked for escapes.

## Definitions

Files in `.claude/agents/` (project) or `~/.claude/agents/` (user). Frontmatter: `name`, `description`, `tools`, `model`, `isolation`, optional `skills` and `mcpServers`. Body is the system prompt. Definitions can be used as teammate types when agent teams are enabled.

## Continuing an agent

SendMessage to an agent's ID continues it with its context intact. A new Agent call starts fresh.
