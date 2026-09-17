# Settings and Launching a Persona Session

Sources: https://code.claude.com/docs/en/settings.md, settings-reference.md, cli-reference, sub-agents.md, sessions.md, hooks.md (researched 2026-09-17 by harness-guide, CLI 2.1.274).

## `--settings <file-or-json>`

- Accepts a file path or an inline JSON string. Relative paths resolve from the working directory.
- Only the last `--settings` on the command line is read.
- Precedence, highest first: managed, command line (`--settings`), project local, project shared, user.
- Applies to that session only. Not persisted on `--resume`; pass it again.
- `--setting-sources user,project,local` limits which files load.

## Settings keys worth setting per session

`agent`, `model`, `env`, `permissions` (including `defaultMode`), `hooks`, `statusLine`, `sandbox`, `effortLevel`, `crossSessionInbound`, `isolatePeerMachines`, `enabledPlugins`, `outputStyle`, `teammateMode`. The full documented key list is in the settings reference; the pilot keeps only what it uses.

## `agent` setting and `--agent`

- Launches the session as an agent definition. The definition's body **replaces** the default system prompt; its `tools` list restricts tools; its `model` picks the model unless `--model` overrides. Header shows `@name`.
- Definition sources by precedence: managed, `--agents` JSON, `.claude/agents/`, `~/.claude/agents/`, plugin agents.
- Frontmatter fields: `name`, `description` (required); `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, `omitClaudeMd`, `effort`, `isolation`, `color`, `initialPrompt`, `experimental`. `disable-model-invocation` is not documented.
- `--system-prompt` is ignored when `--agent` is set. `--append-system-prompt[-file]` still appends.

## Session-shaping flags

- `--system-prompt-file` replaces the default prompt. `--append-system-prompt-file` appends to it. Only append survives a snapshotted resume.
- `--add-dir` grants tool access to extra directories. Not a settings key. Not persisted.
- `--name` sets the display name. Not persisted on resume unless `/rename` was used inside the session. `--resume <name>` finds a named session by exact match.
- `--mcp-config`, `--plugin-dir`: session only, not settings keys, not persisted.
- `--permission-mode` or `permissions.defaultMode` in settings.
- `--brief` enables the SendUserMessage tool so Claude can message the human mid-turn. Flag only.

## Cross-session keys

- `crossSessionInbound`: `accept`, `hold`, `refuse`. Settable via `--settings`.
- `isolatePeerMachines: true`: approval before any message leaves the machine.
- Session name is not a settings key.

## Hooks in a settings file

Any settings file, including one passed by `--settings`, may define hooks. Shape:

```json
{ "hooks": { "SessionStart": [ { "type": "command", "command": "/path/to/script.sh", "timeout": 30 } ] } }
```

- `SessionStart` receives `startup_mode` (startup, resume, clear, compact, fork). Plain stdout is added as context. Cannot block.
- `SessionEnd` receives `end_reason`. Cannot block. 1.5 second shared budget.
- `UserPromptSubmit` can block (exit 2), rewrite input, or add context.
- `Stop` receives the last assistant message and can add context for the next turn.
- Hook stdin JSON carries `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `permission_mode` and event fields.

## Resume

- `--resume [name-or-id]`, `--continue` (most recent in this directory), `--fork-session` (new id, copied transcript), `--session-id <uuid>`.
- Settings files on disk are re-read at resume. Command-line flags are not: `--settings`, `--agent`, `--system-prompt`, `--append-system-prompt`, `--mcp-config`, `--add-dir`, `--plugin-dir`, `--name` must all be passed again. Permission mode, model and agent are restored from the transcript unless overridden.
