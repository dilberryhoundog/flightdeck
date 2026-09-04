# Claude Code facts the harness relies on

The harness is flightdeck's flightcrew: its hook scripts are `flightdeck/flightcrew/hooks/*.mjs`, its agent definitions `flightdeck/flightcrew/crew/*.md`, its workflow scripts `flightdeck/flightcrew/workflows/*.js`, and its settings fragment `flightdeck/flightcrew/hooks/settings.fragment.json`. Every "the harness" below means those files.

Verified against https://code.claude.com/docs (hooks, sub-agents, worktrees, headless, goal, permissions, workflows, best-practices) on 2026-09-03 for Claude Code 2.1.259. When a fact here disagrees with the live docs, the docs win and the harness file that relied on it is changed and the change is recorded as an entry in `flightdeck/launch/RUNLOG.md`, inserted with `fc runlog stub` and described in `flightdeck/manuals/orchestration/run-log.md`.

## Hooks

- Event names in use: `SessionStart`, `SessionEnd`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionDenied`, `Stop`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PreCompact`, `PostCompact`, `WorktreeRemove`. `WorktreeCreate` is documented below for reference and is never hooked. Others exist (`Setup`, `Notification`, `PostToolBatch`, `StopFailure`, `PreModelSwitch`, …) and are not used.
- Common stdin envelope (JSON, one object): `session_id`, `transcript_path`, `cwd`, `permission_mode`, `hook_event_name`, plus `agent_id` and `agent_type` when running inside a subagent, and `prompt_id` on the prompt-scoped events (`UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`), where it identifies the prompt the turn belongs to and may be absent.
- Event fields: PreToolUse `tool_name`, `tool_input`, `tool_use_id`. PostToolUse adds `tool_result`. PostToolUseFailure adds `error`, `tool_error_code`. UserPromptSubmit: `prompt` (the submitted text). PermissionDenied adds `permission_denial_reason`. Stop: `stop_reason`, `stop_hook_active` (true when a Stop hook already blocked this turn), `last_assistant_message`. SubagentStart: `agent_id`, `agent_type`, `agent_files`, `prompt`. SubagentStop: `agent_id`, `agent_type`, `stop_reason`, `last_assistant_message`. PreCompact/PostCompact: `trigger` (`manual|auto`). SessionStart: `mode` (`startup|resume|clear|compact|fork`). SessionEnd: `reason`. TaskCreated: `task_id`, `task_title`, `task_description`. TaskCompleted: `task_id`, `task_title`. WorktreeCreate: `worktree_path`, `branch`. WorktreeRemove: `worktree_path`, `reason`.
- File tool inputs: `Edit`/`Write`/`NotebookEdit` carry `tool_input.file_path` (NotebookEdit: `notebook_path`). `Bash` carries `tool_input.command`.
- Exit codes: `0` success (stdout parsed as JSON if it starts with `{`); `2` blocking error on the four events that support blocking — `PreToolUse`, `UserPromptSubmit`, `Stop`, `SubagentStop` — with stderr shown to Claude. On every other event exit 2 is treated as non-blocking, as is any other non-zero exit anywhere: stderr's first line is shown as a notice.
- JSON decision output (stdout, exit 0): `{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"allow|deny|ask","permissionDecisionReason":"…","additionalContext":"…","updatedInput":{…}}}`. For Stop the deterministic way to block is exit 2 with the reason on stderr. `systemMessage` at top level shows a message to Claude on every event except `SessionEnd` and `PostCompact`, where the session is no longer taking input.
- A `WorktreeCreate` command hook replaces Claude Code's own worktree creation and must print the created directory; any non-zero exit aborts. The standing rule is that the harness never hooks `WorktreeCreate`.
- Settings shape: `{"hooks": {"<Event>": [{"matcher": "Edit|Write", "hooks": [{"type": "command", "command": "node \"$CLAUDE_PROJECT_DIR\"/flightdeck/flightcrew/hooks/<name>.mjs", "timeout": 600, "async": false}]}]}}`. `matcher` is a regex on the tool name for tool events; omit it for events without a matcher. Hooks from user, project, and local settings all run; matching hooks run in parallel.
- Environment: `$CLAUDE_PROJECT_DIR` is the project root where the session started and stays there inside worktrees; `cwd` in the stdin envelope follows the worktree. `${CLAUDE_PROJECT_DIR}` may also be used as a placeholder in the command string.
- Stop hook cap: the best-practices page states Claude Code overrides the hook and ends the turn after 8 consecutive blocks. Treat that as the built-in stall detector; the harness stalls first, at `min(ceilings.stop_blocks, 8)`.
- Hooks in `.claude/settings.json` require workspace trust to run. `claude -p` runs them without a trust dialog unless `--bare`.

## Subagents

- Files: `.claude/agents/*.md` (project) or `~/.claude/agents/*.md` (user); nested folders are scanned; identity is the `name` field only.
- Frontmatter fields: `name` (required, lowercase and hyphens), `description` (required), `tools` (allowlist; omit = inherit everything), `disallowedTools`, `model` (`sonnet|opus|haiku|fable|<full id>|inherit`), `permissionMode`, `maxTurns` (integer; agent stops and returns partial output), `skills`, `memory`, `isolation: worktree`, `mcpServers`, `hooks` (PreToolUse/PostToolUse/Stop), `background`, `effort` (`low|medium|high|xhigh|max`), `color`, `initialPrompt` (used when the agent runs the main session via `claude --agent <name>`).
- A subagent receives its own system prompt (the markdown body), environment details, the delegation message, CLAUDE.md files (except Explore and Plan), and preloaded skills. It does not receive the parent's conversation, system prompt, or memory.
- Delegation is driven by `description`; keep it to one or two sentences stating when to use it and what it returns.
- Built-ins for the `agentType` field: `Explore` (Read, Grep, Glob; read-only), `Plan`, `general-purpose`; `claude` is its catch-all value, selecting the default agent type when no named subagent matches.
- Model precedence: per-invocation `model` → agent file `model` → `CLAUDE_CODE_SUBAGENT_MODEL` → parent model. `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` forces all subagents onto one model (a spend ceiling).
- `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` (default 20), `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (default 3).
- Transcripts: `~/.claude/projects/<project>/<session>/subagents/agent-<id>.jsonl`.
- `claude --agent <name>` runs a whole session as that agent; `--agents '<json>'` defines session-only agents; `--append-subagent-system-prompt` appends text to every subagent (non-interactive only).

## Worktrees

- `claude --worktree <name>` creates `.claude/worktrees/<name>/` on branch `worktree-<name>`. Subagents with `isolation: worktree` get a temporary worktree removed automatically when unchanged; changed ones stay until the periodic sweep (`cleanupPeriodDays`) or `git worktree remove [--force]` (unlock first if locked).
- Base branch: `worktree.baseRef` setting, `"fresh"` (default; branches from the remote default branch) or `"head"` (branches from the current local HEAD). For runs on a feature branch, set `"head"`, otherwise subagents with `isolation: worktree` start from the remote default branch and never see the branch the run is on.
- Isolation enforcement blocks edits, commands, and git redirects that resolve to the main checkout; heredocs with unquoted delimiters and brace expansion are refused inside isolated commands.
- `.worktreeinclude` (gitignore syntax) copies gitignored files such as `.env` into new worktrees.
- Add `.claude/worktrees/` to `.gitignore`.

## Non-interactive runs

- `claude -p "<prompt>"` with `--output-format text|json|stream-json` (`--verbose` and `--include-partial-messages` for streaming). `json` returns `result`, `session_id`, `total_cost_usd`, usage; add `--json-schema '<schema>'` to get `structured_output`.
- `--allowedTools "Read,Edit,Bash(git commit *)"` uses permission-rule syntax; `--disallowedTools` likewise. `--permission-mode auto|acceptEdits|dontAsk|plan|bypassPermissions`. `--max-turns N`. `--bare` skips hooks, skills, agents, CLAUDE.md, memory; the harness needs hooks, so it is for isolated one-shots only. `--continue`, `--resume <id>`, `--worktree <name>`, `--agent <name>`, `--append-system-prompt`, `--add-dir`, `--settings <file|json>`, `--no-session-persistence`.
- `/goal <condition>` works with `-p` too: `claude -p "/goal …"`. A small model evaluates the condition after every turn from what is in the transcript; it stops on met, impossible, or stall (no tool use for several turns; the documentation states no turn count, so do not assume one).
- SIGTERM ends a `-p` run with code 143 after running `SessionEnd` hooks.

## Permissions

- Rule syntax: `Bash(git commit *)` (trailing ` *` prefix match; `:*` equivalent), `Read(path)`, `Edit(path)` (also governs `Write` and `NotebookEdit`; a `Write(path)` rule is ignored), `WebFetch(domain:host)`, `Agent(name)`, `Agent(isolation:worktree)`, `Skill(name)`, `Workflow(name)`, `mcp__server__tool`.
- Path forms: `//abs/path` absolute; `~/path` home; `/path` relative to the settings file's project root; `path` or `./path` relative to cwd; gitignore glob semantics; bare filenames match at any depth.
- `permissions.deny` and `ask` apply immediately; `allow` and `additionalDirectories` apply after workspace trust. Deny rules on `Edit(tests/**)` are static and repository-wide, and the model cannot talk past them.
- Sandbox: `sandbox.enabled`, `sandbox.filesystem` allow/deny, `sandbox.network` allowedDomains/deniedDomains, `sandbox.excludedCommands`, `autoAllowBashIfSandboxed` (default true). Sandboxing applies to Bash and child processes only.
- Auto mode: a classifier reviews actions as a backstop; scope tools per agent regardless.

## Dynamic workflows

- Saved scripts live in `.claude/workflows/<name>.js` (project) or `~/.claude/workflows/`; run as `/<name>`, with `args` passed as structured data. `export const meta = {name, description, phases}` must be a pure literal and the first statement. Script API: `agent(prompt, {label, phase, schema, model, effort, isolation, agentType})`, `parallel([...thunks])`, `pipeline(items, ...stages)`, `phase(title)`, `log(msg)`, `args`, `budget`, `workflow(name, args)`. `Date.now()`, `Math.random()`, `new Date()` throw; pass timestamps through `args`.
- Limits: up to 16 concurrent agents (fewer with fewer CPUs), 4,096 items per call, 1,000 agents per run. Runs are resumable in-session; the runtime writes each run's script under the session directory in `~/.claude/projects/`.
- `workflowSizeGuideline` bounds how large a script a session will accept, from `small` through `medium` and `large` to `unrestricted`, which applies no bound; the harness does not rely on it. `Workflow` and `Workflow(<name>)` permission rules approve launches in `-p` runs.

## Skills and commands the flightdeck manuals name

- `/code-review`: a bug hunt in a fresh subagent, returning findings; the review pass table of `flightdeck/manuals/orchestration/review.md`, run before the critic.
- `/simplify`: rewrites the diff for simplicity; same table, run before the deterministic re-check.
- `/security-review`: reports defect classes on the diff; same table, for changes touching auth, input or the network.
- `/workflows`: lists the workflow runs of the current session with their phases and lets one be stopped; `flightdeck/manuals/harness/workflows.md`.
- `/goal <condition>`: sets a stop condition evaluated after each turn; the headless notes above.
- `/verify`, `/loop`, `/rewind`, `/clear`, `/compact <instructions>`, `/btw`, `/doctor`, `/batch <instruction>` (5–30 worktree subagents each opening a PR) and `claude plugin validate .claude/agents/` are Claude Code's own commands, named by no flightdeck manual as part of a run. The slash command `/verify` is Claude Code's; the run's verification command is `fc verify`, and they are unrelated.
