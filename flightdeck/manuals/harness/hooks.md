# Hooks

The six hook scripts under `flightdeck/flightcrew/hooks/` make the run's prohibitions deterministic: they record events, refuse edits to locked and out-of-boundary paths, run structural checks after every edit, hold the turn at the stop gate, and assemble the report at session end. They run in place through `$CLAUDE_PROJECT_DIR` and are never copied. Read by the human when installing the harness and when a run-log entry lands on the tooling axis.

## Each hook

| hook | event (matcher) | does | stdout or exit |
|---|---|---|---|
| `event-log.mjs` | `SessionStart`, `SessionEnd`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PostToolUseFailure`, `PermissionDenied`, `PreCompact`, `PostCompact`, `Stop`, `WorktreeRemove` | appends one event line to `launch/<L>/events.jsonl` with `source: hook`, `session_id`, and a `detail` limited to the allowed keys; ignores any other event name | exit 0; on `SessionStart` prints a `systemMessage` naming the launch and phase and saying how to opt a session out |
| `lock-guard.mjs` | `PreToolUse` (`Edit\|Write\|NotebookEdit`) | in any phase other than targets, a target matching `paths.locked` is denied with the reason "report a wrong or unsatisfiable check instead of editing it"; appends `lock_denied` | `permissionDecision: deny`; `ask` when the launch is ambiguous; nothing when the target is not locked |
| `boundary-guard.mjs` | `PreToolUse` (`Edit\|Write\|NotebookEdit`) | with `enforce_boundary` true, denies a target outside allowed ∪ `flightdeck/launch/<L>/**` in phases contracts, implement, verify and review, and outside locked ∪ the launch folder ∪ `flightdeck/launch/specs/<S>/**` in phase targets; appends `boundary_denied` | as lock-guard |
| `structural-check.mjs` | `PostToolUse` (`Edit\|Write`) | runs `launch.json.structural[<ext>]` with `{file}` replaced by the shell-quoted absolute path, via `/bin/sh -c`, cwd the git toplevel of the envelope cwd, every phase | exit 2 with the last 20 combined output lines on stderr when the command fails; exit 0 silently on success or when the extension has no command |
| `stop-gate.mjs` | `Stop` (`timeout: 600`) | phase verify: runs `T1`; phase contracts: runs the W0 unit's checks (or `T1` under `no_contracts`) plus `fc boundary`; other phases: nothing | red: exit 2 with `<T> exit <code>` and the last 20 lines, appends `stop_block`; green: appends `check_run`, exit 0; `escalation.json` present: appends `stop_release`, exit 0; at the cap appends `stall` and `trigger`, prints `stall: …`, exit 0 |
| `session-end.mjs` | `SessionEnd` | best-effort `fc evidence` and `fc report` | exit 0 always |

- Both guards deny every edit with a reason naming the trigger while the newest `trigger` event is later than the newest `gate`, `escalation` or `launch_end` event.
- The stop gate's cap is `min(ceilings.stop_blocks, 8)`: Claude Code overrides a Stop hook after eight consecutive blocks, so the harness stalls first and records it.
- Consecutive stop blocks are counted since the newest passing `check_run`, `escalation`, `gate` or `phase` event; the same count feeds `fc budget` against `gate_iterations`.
- The stop gate never runs in phase implement: a gate on the acceptance check there would block every escalation.

## Exit semantics

- Exit 0 with no stdout: nothing happens.
- Exit 0 with a JSON object on stdout: `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny" | "ask", "permissionDecisionReason": "…"}}` decides the tool call; `{"systemMessage": "…"}` shows a message to the agent.
- Exit 2: blocks the event (the edit, or the end of the turn) and shows stderr to the agent.
- Any other non-zero exit: non-blocking; stderr's first line is shown as a notice; the hooks never exit this way on purpose.
- Silent no-op (exit 0, no stdout) when: no launch is active; `FLIGHTCREW_LAUNCH=none`; `$CLAUDE_PROJECT_DIR` is unset; `<root>/flightdeck/launch` is absent; `FLIGHTCREW_LAUNCH` names a folder that does not exist; stdin is not a JSON object (one `hooks.log` line when a launch is active); the gate cannot run because no map is pinned or the launch is unreadable (one `hooks.log` line).
- Two active launches with `FLIGHTCREW_LAUNCH` unset, or a launch.json that fails to parse: the guards print an `ask` decision naming the cause, and the recording hooks exit 0 silently.
- Errors inside a hook are caught and logged to `launch/<L>/hooks.log` as `<iso ts> <hook name> <message>`, never thrown.
- Each hook exits within 2000 ms with a minimal envelope; the stop gate's check runs are the exception and carry the 600 s timeout.

## Install

1. Print the fragment with the absolute `node` path substituted: `flightdeck/flightcrew/bin/fc distribute` (dry run) or `fc distribute --apply --target .claude`, which also copies the crew and the workflow scripts and prints the gitignore line and the constitution fragment.
2. Merge `flightdeck/flightcrew/hooks/settings.fragment.json` into `.claude/settings.json` by key: append each `hooks.<Event>` entry to any list already there; append `permissions.allow` and `permissions.deny` entries; drop the `_comment` and `_sandbox_example` keys.
3. Set `"worktree": {"baseRef": "head"}` so an implementer's worktree branches from the run branch, not from the remote default branch.
4. Add the line `.claude/worktrees/` to the repository `.gitignore`.
5. Merge `flightdeck/flightcrew/templates/constitution-fragment.md` into the project constitution (CLAUDE.md).
6. Run `fc doctor --target .claude`: agents byte-equal to `crew/`, every fragment hook command present in `settings.json`, `worktree.baseRef` is `head`, `.claude/worktrees/` gitignored, no crew name collision under `.claude/agents/**`, hook `node` resolvable.
7. Start a session in the repository and confirm the `SessionStart` message names the active launch; hooks in project settings require workspace trust.

## Troubleshooting

- `node: command not found` in a hook error: the PATH a hook runs under is not the shell's; replace the leading `node` of every hook command in `settings.json` with the absolute interpreter path (`fc distribute` prints the fragment with `process.execPath` already substituted); check first, because every other symptom below can follow from it.
- Hooks silent in every session: `$CLAUDE_PROJECT_DIR` points at a directory without `flightdeck/launch`, or no launch has status active; run `fc launch status`.
- The `SessionStart` message names a launch that is not the current work: run `FLIGHTCREW_LAUNCH=none claude` for that session, or end the launch.
- An edit is denied as locked while working outside any run: a launch is still active; `fc launch end` or `FLIGHTCREW_LAUNCH=none`.
- The guards answer `ask` on every edit: two launches are active, or a `launch.json` does not parse; `fc launch status` names them.
- The turn will not end in phase verify: the stop gate is red; read the `<T> exit <code>` line and the tail it printed; `fc launch escalate <kind> --detail "…"` releases the gate when the check, not the code, is wrong.
- `stall:` printed and every edit denied: the cap fired and a trigger is recorded; end or exit the launch (`fc launch end abandoned --at verify`), diagnose in the run log.
- A worker's edits land on the wrong base: `worktree.baseRef` is not `head`.
- Structural checks fail on every edit of one extension: the `structural[ext]` command in `launch.json` is wrong for the project; fix the command, not the hook.
- A hook takes longer than its timeout: only the stop gate runs checks; every other hook does file appends and exits; a slow hook usually means a slow `git rev-parse` on a large worktree.
- `hooks.log` in the launch folder carries every caught error with its hook name.

## The shell-write hole and its backstops

- The guards intercept `Edit`, `Write` and `NotebookEdit` only; a shell command (`sed -i`, `cp`, a heredoc redirect) that writes a locked path is not intercepted.
- Backstop 1: `fc locked` lists every changed file matching a locked path since `lock_commit`, whatever wrote it, and exits 2; `fc verify` runs it; `fc launch phase review` refuses while it is non-clean; the critic receives the list.
- Backstop 2: the `_sandbox_example` in the fragment shows a `sandbox.filesystem.deny` rule for the locked paths; sandboxing applies to Bash and its children and cannot be talked past.
- Backstop 3: `permissions.deny` `Edit(flightdeck/launch/*/specs/**)` and `Edit(flightdeck/launch/specs/**)` give the pinned copies and the canonical specs a hard lock independent of any launch.
- Backstop 4: the implementer definition stages only its unit's paths, and `fc worker merge` re-runs the unit's checks before landing.
- `WorktreeCreate` is never hooked: a command hook there replaces Claude Code's own worktree creation and its stdout is read as the directory path; `WorktreeRemove` is recorded.
