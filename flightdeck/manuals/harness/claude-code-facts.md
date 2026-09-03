# Claude Code facts the harness relies on

Verified against https://code.claude.com/docs (hooks, sub-agents, worktrees, headless, goal, permissions, workflows, best-practices) on 2026-09-03 for Claude Code 2.1.259. When a fact here disagrees with the live docs, the docs win and the harness file that relied on it gets a run-log entry.

## Hooks

- Event names in use: `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionDenied`, `Stop`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PreCompact`, `PostCompact`, `WorktreeCreate`, `WorktreeRemove`. Others exist (`Setup`, `Notification`, `PostToolBatch`, `StopFailure`, `PreModelSwitch`, …) and are not used.
- Common stdin envelope (JSON, one object): `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, plus `agent_id` and `agent_type` when running inside a subagent. `prompt_id` may be absent.
- Event fields: PreToolUse `tool_name`, `tool_input`, `tool_use_id`. PostToolUse adds `tool_result`. PostToolUseFailure adds `error`, `tool_error_code`. PermissionDenied adds `permission_denial_reason`. Stop: `stop_reason`, `stop_hook_active` (true when a Stop hook already blocked this turn), `last_assistant_message`. SubagentStart: `agent_id`, `agent_type`, `agent_files`, `prompt`. SubagentStop: `agent_id`, `agent_type`, `stop_reason`, `last_assistant_message`. PreCompact/PostCompact: `trigger` (`manual|auto`). SessionStart: `mode` (`startup|resume|clear|compact|fork`). SessionEnd: `reason`. TaskCreated: `task_id`, `task_title`, `task_description`. TaskCompleted: `task_id`, `task_title`. WorktreeCreate: `worktree_path`, `branch`. WorktreeRemove: `worktree_path`, `reason`.
- File tool inputs: `Edit`/`Write`/`NotebookEdit` carry `tool_input.file_path` (NotebookEdit: `notebook_path`). `Bash` carries `tool_input.command`.
- Exit codes: `0` success (stdout parsed as JSON if it starts with `{`); `2` blocking error on events that support blocking (`PreToolUse`, `Stop`, `SubagentStop`, `UserPromptSubmit`, …) with stderr shown to Claude; other non-zero = non-blocking, stderr's first line shown as a notice.
- JSON decision output (stdout, exit 0): `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|deny|ask","permissionDecisionReason":"…","additionalContext":"…","updatedInput":{…}}}`. For Stop the deterministic way to block is exit 2 with the reason on stderr. `systemMessage` at top level shows a message to Claude on most events.
- A `WorktreeCreate` command hook replaces Claude Code's own worktree creation and must print the created directory; any non-zero exit aborts. Therefore never attach a logging hook to `WorktreeCreate`.
- Settings shape: `{"hooks": {"<Event>": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/path.mjs", "timeout": 600, "async": false}]}]}}`. `matcher` is a regex on the tool name for tool events; omit it for events without a matcher. Hooks from user, project, and local settings all run; matching hooks run in parallel.
- Environment: `$CLAUDE_PROJECT_DIR` is the project root where the session started and stays there inside worktrees; `cwd` in the stdin envelope follows the worktree. `${CLAUDE_PROJECT_DIR}` may also be used as a placeholder in the command string.
- Stop hook cap: the best-practices page states Claude Code overrides the hook and ends the turn after 8 consecutive blocks. Treat that as the built-in stall detector; the harness counts its own blocks so the display shows them.
- Hooks in `.claude/settings.json` require workspace trust to run. `claude -p` runs them without a trust dialog unless `--bare`.

## Subagents

- Files: `.claude/agents/*.md` (project) or `~/.claude/agents/*.md` (user); nested folders are scanned; identity is the `name` field only.
- Frontmatter fields: `name` (required, lowercase and hyphens), `description` (required), `tools` (allowlist; omit = inherit everything), `disallowedTools`, `model` (`sonnet|opus|haiku|fable|<full id>|inherit`), `permissionMode`, `maxTurns` (integer; agent stops and returns partial output), `skills`, `memory`, `isolation: worktree`, `mcpServers`, `hooks` (PreToolUse/PostToolUse/Stop), `background`, `effort` (`low|medium|high|xhigh|max`), `color`, `initialPrompt` (used when the agent runs the main session via `claude --agent <name>`).
- A subagent receives its own system prompt (the markdown body), environment details, the delegation message, CLAUDE.md files (except Explore and Plan), and preloaded skills. It does not receive the parent's conversation, system prompt, or memory.
- Delegation is driven by `description`; keep it to one or two sentences stating when to use it and what it returns.
- Built-ins: `Explore` (Read, Grep, Glob; read-only), `Plan`, `general-purpose`. `claude` is the catch-all.
- Model precedence: per-invocation `model` → agent file `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → parent model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces all subagents onto one model (a spend ceiling).
- `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20), `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3).
- Transcripts: `~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`.
- `claude --agent <name>` runs a whole session as that agent; `--agents '<json>'` defines session-only agents; `--append-subagent-system-prompt` appends text to every subagent (non-interactive only).

## Worktrees

- `claude --worktree <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. Subagents with `isolation: worktree` get a temporary worktree removed automatically when unchanged; changed ones stay until the periodic sweep (`cleanupPeriodDays`) or `git worktree remove [--force]` (unlock first if locked).
- Base branch: `worktree.baseRef` setting, `"fresh"` (default; branches from the remote default branch) or `"head"` (branches from the current local HEAD). For runs on a feature branch, set `"head"`, otherwise workers start from `main` and never see the run branch.
- Isolation enforcement blocks edits, commands, and git redirects that resolve to the main checkout; heredocs with unquoted delimiters and brace expansion are refused inside isolated commands.
- `.worktreeinclude` (gitignore syntax) copies gitignored files such as `.env` into new worktrees.
- Add `.claude/worktrees/` to `.gitignore`.

## Non-interactive runs

- `claude -p "<prompt>"` with `--output-format text|json|stream-json` (`--verbose` and `--include-partial-messages` for streaming). `json` returns `result`, `session_id`, `total_cost_usd`, usage; add `--json-schema '<schema>'` to get `structured_output`.
- `--allowedTools "Read,Edit,Bash(git commit *)"` uses permission-rule syntax; `--disallowedTools` likewise. `--permission-mode auto|acceptEdits|dontAsk|plan|bypassPermissions`. `--max-turns N`. `--bare` skips hooks, skills, agents, CLAUDE.md, memory (use only for isolated one-shots; the harness needs hooks, so do not use `--bare` for orchestrated sessions). `--continue`, `--resume <id>`, `--worktree <name>`, `--agent <name>`, `--append-system-prompt`, `--add-dir`, `--settings <file|json>`, `--no-session-persistence`.
- `/goal <condition>` works with `-p` too: `claude -p "/goal …"`. A small model evaluates the condition after every turn from what is in the transcript; it stops on met, impossible, or stall (no tool use for several turns).
- SIGTERM ends a `-p` run with code 143 after running `SessionEnd` hooks.

## Permissions

- Rule syntax: `Bash(git commit *)` (trailing ` *` prefix match; `:*` equivalent), `Read(path)`, `Edit(path)` (also governs `Write` and `NotebookEdit`; a `Write(path)` rule is ignored), `WebFetch(domain:host)`, `Agent(name)`, `Agent(isolation:worktree)`, `Skill(name)`, `Workflow(name)`, `mcp__server__tool`.
- Path forms: `//abs/path` absolute; `~/path` home; `/path` relative to the settings file's project root; `path` or `./path` relative to cwd; gitignore glob semantics; bare filenames match at any depth.
- `permissions.deny` and `ask` apply immediately; `allow` and `additionalDirectories` apply after workspace trust. Deny rules on `Edit(tests/**)` give a hard lock that the model cannot talk past; the hook lock is the per-launch version.
- Sandbox: `sandbox.enabled`, `sandbox.filesystem` allow/deny, `sandbox.network` allowedDomains/deniedDomains, `sandbox.excludedCommands`, `autoAllowBashIfSandboxed` (default true). Sandboxing applies to Bash and child processes only.
- Auto mode: a classifier reviews actions; it is a backstop, not a substitute for per-agent tool scoping.

## Dynamic workflows

- Saved scripts live in `.claude/workflows/<name>.js` (project) or `~/.claude/workflows/`; run as `/<name>`, with `args` passed as structured data. `export const meta = {name, description, phases}` must be a pure literal and the first statement. Script API: `agent(prompt, {label, phase, schema, model, effort, isolation, agentType})`, `parallel([...thunks])`, `pipeline(items, ...stages)`, `phase(title)`, `log(msg)`, `args`, `budget`, `workflow(name, args)`. `Date.now()`, `Math.random()`, `new Date()` throw; pass timestamps through `args`.
- Limits: up to 16 concurrent agents (fewer with fewer CPUs), 4,096 items per call, 1,000 agents per run. Runs are resumable in-session; the runtime writes each run's script under the session directory in `~/.claude/projects/`.
- `workflowSizeGuideline` setting (`small|medium|large|unrestricted`); `Workflow` and `Workflow(<name>)` permission rules approve launches in `-p` runs.

## Skills and commands used by the manuals

- `/code-review` (bug hunt in a fresh subagent), `/simplify`, `/security-review`, `/verify`, `/batch <instruction>` (5–30 worktree subagents each opening a PR), `/goal`, `/loop`, `/workflows`, `/rewind`, `/clear`, `/compact <instructions>`, `/btw`, `/doctor`, `claude plugin validate .claude/agents/`.
