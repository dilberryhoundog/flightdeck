# Permissions

Unattended runs need boundaries they cannot talk past: the fragment's allow and deny lists, the per-role tool allowlists in the crew, worktree isolation, the sandbox, and `--allowedTools` on headless runs. Read by the human at stage 3 before starting the orchestrator, and when a run-log entry lands on the tooling axis.

## Starting the orchestrator

- Interactive: `cd $REPO && claude --agent orchestrator --permission-mode acceptEdits`
- The agent's `initialPrompt` runs `fc launch status`, reads the active launch's `kickoff.md` and follows it; nothing else happens first.
- `acceptEdits` covers the orchestrator's own (non-existent) edits and the `fc` writes inside the launch folder; every other action is decided by the allow list, so the run does not stop for `fc` or read-only git.
- Never `--bare`: it skips hooks, and the harness is the hooks.
- Headless, with the allow list from `flightcrew/hooks/settings.fragment.json` passed as `--allowedTools`:

```
cd $REPO && claude -p "Run flightdeck/flightcrew/bin/fc launch status. Read the active launch's kickoff.md and follow it; do nothing else first." \
  --agent orchestrator --permission-mode acceptEdits --output-format json \
  --allowedTools "Bash(node flightdeck/flightcrew/bin/fc *),Bash(flightdeck/flightcrew/bin/fc *),Bash(./flightdeck/flightcrew/bin/fc *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(git rev-parse *),Bash(git add *),Bash(git commit *),Bash(git switch *),Bash(git worktree list *),Agent(explorer),Agent(planner),Agent(implementer),Agent(verifier),Agent(critic),Workflow(fc-implement),Workflow(fc-review),Workflow(fc-explore)"
```

- The headless form's `json` output carries `total_cost_usd` and usage; record it with `fc events usage <json>` so the cost line is observed rather than `not recorded`.
- A headless run still halts at every gate: the session ends at the gate, the human records `fc launch gate <G> approve`, and the next `claude -p --continue` (or a fresh `--agent orchestrator` session) resumes from `fc launch status`.
- A permission prompt after G2 is a tooling-axis run-log entry: the allow list, a role's tools or the sandbox missed something a wave needed, and the run was not unattended.

## The fragment's lists

| list | entries | why |
|---|---|---|
| `permissions.allow` | `Bash(node flightdeck/flightcrew/bin/fc *)`, `Bash(flightdeck/flightcrew/bin/fc *)`, `Bash(./flightdeck/flightcrew/bin/fc *)` | the three ways `fc` is invoked by path |
| | `Bash(git status *)`, `Bash(git diff *)`, `Bash(git log *)`, `Bash(git rev-parse *)`, `Bash(git worktree list *)` | read-only git every role uses |
| | `Bash(git add *)`, `Bash(git commit *)`, `Bash(git switch *)` | what an implementer needs on its own branch; `fc worker merge` does the merging |
| | `Agent(<each crew name>)` | dispatch of every crew role without a prompt |
| | `Workflow(fc-implement)`, `Workflow(fc-review)`, `Workflow(fc-explore)` | launching the three scripts, needed in `-p` runs |
| `permissions.deny` | `Edit(flightdeck/launch/*/specs/**)`, `Edit(flightdeck/launch/specs/**)` | a hard lock on pinned copies and canonical specs that no launch state can lift; `Edit(path)` also governs Write and NotebookEdit |
| printed by `fc launch pin tests-map` | one `Bash(<command>)` line per check | add these when checks are run by hand outside `fc check`; `fc check` itself is covered by the `fc` rules |

- `deny` and `ask` apply immediately; `allow` applies after workspace trust.
- Rule syntax: a trailing ` *` is a prefix match; `Edit(path)` uses gitignore glob semantics; `/path` is relative to the settings file's project root.

## Recommendations per role

| role | tools (frontmatter allowlist) | deny or scope | why |
|---|---|---|---|
| `orchestrator` | Read, Grep, Glob, Bash, Agent | no Write, no Edit | it writes only through `fc plan write`, `fc launch note`, `fc return` |
| `explorer` | Read, Grep, Glob, Bash | no Write, no Edit | read widely so nobody else has to |
| `planner` | Read, Grep, Glob, Bash, Agent | no Write, no Edit | planning cannot leak into doing |
| `test-builder` | Read, Grep, Glob, Bash, Write, Edit; `permissionMode: acceptEdits` | writes the map and check scripts only, before any implementer | the target is written before anyone can aim past it |
| `implementer` | Read, Grep, Glob, Bash, Write, Edit; `isolation: worktree`; `permissionMode: acceptEdits` | the guards deny locked paths and paths outside its unit's boundary | the only role with general write access, one unit each |
| `verifier` | Read, Grep, Glob, Bash | no Write, no Edit | running is not writing |
| `critic` | Read, Grep, Glob, Bash | no Write, no Edit | a critic that can edit is an implementer with opinions |

- Tools follow the role, never convenience; widen only on run-log evidence.
- `permissionMode: acceptEdits` on the implementer means a worktree edit inside its paths never prompts; a prompt during implement is therefore always a boundary, a lock or a missing allow rule.
- Auto mode's classifier is a backstop, not a substitute for the per-role allowlists.

## Sandbox

Sandboxing applies to Bash and its child processes and closes the shell-write hole the guards cannot see (`sed -i`, `cp`, redirects). The fragment's `_sandbox_example` shows the shape; adapt the deny list to the launch's locked paths:

```json
"sandbox": {
  "enabled": true,
  "filesystem": { "deny": ["tests/**", "flightdeck/launch/specs/**", "flightdeck/testbench/suites/**"] },
  "network": { "allowedDomains": [] },
  "excludedCommands": []
}
```

- `autoAllowBashIfSandboxed` (default true) lets sandboxed Bash run without prompts, which is what an unattended run wants once the deny list is right.
- `fc locked` remains the detector whatever the sandbox setting: it lists every changed file under a locked path since `lock_commit`.
- Network access is not needed by any `fc` command or hook (none imports a network module or calls fetch); an empty `allowedDomains` costs nothing.

## Isolation

- The implementer's `isolation: worktree` gives each unit its own checkout under `.claude/worktrees/`; isolation enforcement blocks edits and commands that resolve to the main checkout and refuses heredocs with unquoted delimiters.
- `worktree.baseRef: head` in the fragment makes the worktree branch from the run branch; with the default `fresh` a worker starts from the remote default branch and never sees the run.
- `.claude/worktrees/` belongs in `.gitignore`; `fc boundary` and `fc locked` exclude it from the changed set.
- `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` with `CLAUDE_CODE_SUBAGENT_MODEL` caps every subagent on one model when spend matters more than tiering.

## Checks

- `fc doctor --target .claude` confirms the fragment's hook commands are present, `worktree.baseRef` is `head`, the worktrees directory is gitignored, and no other agent under `.claude/agents/**` carries a crew name.
- `PermissionDenied` events are recorded by event-log and counted by `fc budget`; they appear in the report's Failures section, which is where the tooling diagnosis starts.
