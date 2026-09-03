# flightcrew hooks

Six Claude Code hook scripts that make a launch's rules real inside a session: they record what happened, refuse edits the launch forbids, check the shape of what was just written, and hold the turn while a gated phase is red. They are the only part of flightcrew that runs without anyone asking for it, so every one of them is built to stay out of the way.

The scripts run in place from `flightdeck/flightcrew/hooks/`. Nothing is copied into `.claude/`; `$CLAUDE_PROJECT_DIR` locates them from wherever a session starts, worktrees included.

## The hooks

- `event-log.mjs` — SessionStart, SessionEnd, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, Stop, WorktreeRemove. Appends one line to `launch/<L>/events.jsonl` per invocation, with `source: hook` and a `detail` object holding only the keys the event schema allows. Any other `hook_event_name` is ignored. On SessionStart it also prints a `systemMessage` naming the launch and its phase, so a session that is not that run can be redirected before it edits anything. Always exits 0.
- `lock-guard.mjs` — PreToolUse, matcher `Edit|Write|NotebookEdit`. In every phase but `targets`, a target matching one of `paths.locked` gets a `deny` decision naming the path and telling the session to report a wrong or unsatisfiable check rather than edit it, plus a `lock_denied` event. Always exits 0; the decision is on stdout.
- `boundary-guard.mjs` — the same event and matcher. While `paths.enforce_boundary` is set: in phases `contracts`, `implement`, `verify` and `review` a target outside `paths.allowed` and the launch's own folder is denied; in phase `targets` a target outside `paths.locked`, the launch folder and the spec's canonical home is denied. Each denial appends `boundary_denied`. Always exits 0.
- `structural-check.mjs` — PostToolUse, matcher `Edit|Write`. Looks up the launch's `structural` command for the edited file's extension, substitutes the shell-quoted absolute path for `{file}`, and runs it through `/bin/sh -c` with the git toplevel of the envelope's cwd as the working directory. Zero exit: silence, exit 0. Non-zero: the last 20 combined output lines on stderr, exit 2. No command configured for the extension: exit 0, nothing printed. It runs in every phase.
- `stop-gate.mjs` — Stop, timeout 600. In phase `verify` it runs the acceptance gate; in phase `contracts` the contracts gate (the contracts unit's checks, or the acceptance check where the plan declares `no_contracts`, plus the boundary). Every other phase is a no-op with nothing appended. Green: one `check_run` event per check, exit 0. Red: a `stop_block` event carrying the running count, then `<id> exit <code>` and the check's last 20 output lines on stderr, exit 2. At `min(ceilings.stop_blocks, 8)` consecutive blocks it appends `stall` and `trigger` instead, reports the stall on stderr and exits 0, handing the decision back to a human. An open `escalation.json` releases it: `stop_release`, exit 0.
- `session-end.mjs` — SessionEnd. Best-effort `fc evidence` and `fc report` inside a small time budget, so the last state of a run outlives the session that produced it. Failures are logged, never raised. Always exits 0.

Both guards are wired to the same PreToolUse matcher and run in parallel; a target that is both locked and outside the boundary draws a decision from each, and Claude Code takes the strictest.

## The no-op rule

A hook is a silent no-op — exit 0, empty stdout, nothing written — whenever it cannot be sure it is speaking for a run:

- `$CLAUDE_PROJECT_DIR` is unset, or the directory it names has no `flightdeck/launch/`.
- No launch has status `active`, or `FLIGHTCREW_LAUNCH=none`.
- Stdin is not a JSON object. When a launch does resolve, this one adds a single line to `hooks.log` and still says nothing to the session.

Two launches are active at once, or the resolved `launch.json` will not parse: the guards print an `ask` decision naming the cause, and the recorders stay silent. `stop-gate` writes one `hooks.log` line and exits 0 whenever its gate cannot run at all — no map pinned, the map file missing, the gate script absent.

Every error inside a hook is caught, written to `hooks.log` if a launch is known, and turned into exit 0. A hook never crashes a session and never blocks except where blocking is its job: `structural-check` and `stop-gate`, both exit 2.

`hooks.log` lines are `<iso timestamp> <hook name> <message>`, in the launch folder beside `events.jsonl`. It is the place to look first when a hook seems not to have fired.

## Installing

1. Merge `settings.fragment.json` into the project's `.claude/settings.json`: copy each key across, appending to any `hooks` list, `permissions.allow` and `permissions.deny` already there rather than replacing them. `fc distribute` prints the fragment ready to paste; `fc distribute --apply` copies the crew and workflow files that go with it. Drop the `_comment` and `_sandbox_example` keys as you merge — they document, they do not configure.
2. Keep `worktree.baseRef` at `head`, or worker subagents branch from the remote default branch and never see the run's branch.
3. Add `.claude/worktrees/` to the repository's `.gitignore`.
4. Hooks in `.claude/settings.json` need workspace trust before they run. Confirm with `fc doctor`, which checks that the fragment's hook commands are present in the settings file and that the interpreter they name resolves.

The gates `stop-gate` runs live at `flightdeck/flightcrew/checks/gates/acceptance-gate.mjs` and `contracts-gate.mjs`. Each exports `run(context)` and returns `{ ran, reason?, checks: [{ id, verdict, blocking, code, output }], extra: [...] }`; `extra` carries non-check blockers such as the boundary. A gate that is missing or throws is logged and treated as "could not run", never as a failure.

## Troubleshooting

- **`node: command not found`.** Check this first; it is the usual cause of a hook that appears to do nothing. Claude Code gives hooks a minimal PATH, which often excludes a version-manager shim. Replace the leading `node` in each command with the absolute interpreter path (`fc distribute` prints the fragment with that substitution already made).
- **Nothing in `events.jsonl`.** Confirm one launch has status `active`, that `FLIGHTCREW_LAUNCH` is not `none`, and that `$CLAUDE_PROJECT_DIR` points at the repository holding `flightdeck/launch/`. Then read `hooks.log`.
- **An edit was denied that should have been allowed.** The decision reason names the repository-relative path it judged. Compare it with `paths.allowed` and `paths.locked` in `launch.json`; inside a worktree the path is relative to the worktree root, not the main checkout.
- **Every edit is denied.** An abandon trigger has fired: the newest `trigger` event is newer than the newest `gate`, `escalation` or `launch_end` event. End or exit the launch; do not work around the guards.
- **The turn will not end.** The stop gate is red. Its stderr names the check and its exit code. Fix the check's cause, or escalate with `fc launch escalate`, which releases the gate until a gate, phase or ending decision clears it.
- **A hook is slow.** Each is built to finish well inside two seconds against an active launch; `stop-gate` is the exception and declares `timeout: 600` because it runs real checks.

## The hole the guards do not cover

The guards see the `Edit`, `Write` and `NotebookEdit` tools. A shell command — `sed -i`, a redirect, `git checkout` of a locked file — writes without passing through any of them, and no PreToolUse hook can stop it. Three backstops cover that gap, and a run should have all three:

- `permissions.deny` rules on the locked paths, which apply to the file tools immediately and cannot be talked past.
- A `sandbox.filesystem.deny` list naming the locked paths, which does apply to Bash and its children. `_sandbox_example` in the fragment shows the shape.
- `fc locked`, which compares the working tree against `lock_commit` and reports any locked path that changed, however it changed. It runs inside `fc verify`, so a shell write is caught before a run can be accepted.

## Why `WorktreeCreate` is never hooked

A `WorktreeCreate` command hook does not observe worktree creation — it replaces it, and must print the directory it created. Any non-zero exit aborts the creation. A logging hook attached there would break every isolated subagent. `WorktreeRemove` has no such contract and is recorded normally; the report reconstructs discarded attempts from those events together with a `git worktree list` snapshot.
