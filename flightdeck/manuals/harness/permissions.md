# Permissions

Unattended runs need boundaries they cannot talk past: the fragment's allow and deny lists, the per-role tool allowlists in the crew, worktree isolation, the sandbox, and `--allowedTools` on headless runs. `fc` throughout this document is shorthand for `flightdeck/flightcrew/bin/fc` (or `node flightdeck/flightcrew/bin/fc`) run from the repository root; nothing puts `fc` on PATH, and only those three path-prefixed forms are covered by the allow rules. `$REPO` is the repository root: run every command below from there, or export `REPO=<repository root>` first.

## Starting the orchestrator

The fragment `flightdeck/flightcrew/hooks/settings.fragment.json` must first be merged into the project's `.claude/settings.json` — by hand, appending to any existing `hooks`, `permissions.allow` and `permissions.deny` rather than replacing them, or with `fc distribute --apply --target .claude`. `fc doctor --target .claude` confirms the merge. No allow, deny or hook rule below applies until it is done.

- Interactive: `cd $REPO && claude --agent orchestrator --permission-mode acceptEdits`
- The agent's `initialPrompt` runs `fc launch status`, reads the active launch's `kickoff.md` and follows it; nothing else happens first.
- `acceptEdits` covers Edit, Write and NotebookEdit only. The orchestrator holds none of them: its `fc` writes run as Bash and are covered by the three `Bash(… fc *)` allow rules, as read-only git is by its own rules, so the run does not stop for either.
- Never `--bare`: it skips hooks, and the harness is the hooks.
- Headless, with the fragment's `permissions.allow` list passed verbatim as `--allowedTools`. Generate the string from `flightdeck/flightcrew/hooks/settings.fragment.json` rather than retyping it, so the two cannot drift:

```
cd $REPO && claude -p "Run flightdeck/flightcrew/bin/fc launch status. Read the active launch's kickoff.md and follow it; do nothing else first." \
  --agent orchestrator --permission-mode acceptEdits --output-format json \
  --allowedTools "Bash(node flightdeck/flightcrew/bin/fc *),Bash(flightdeck/flightcrew/bin/fc *),Bash(./flightdeck/flightcrew/bin/fc *),Bash(git status *),Bash(git diff *),Bash(git log *),Bash(git rev-parse *),Bash(git add *),Bash(git commit *),Bash(git switch *),Bash(git worktree list *),Agent(spec-builder),Agent(spec-judge),Agent(spec-attacker),Agent(explorer),Agent(test-builder),Agent(planner),Agent(orchestrator),Agent(implementer),Agent(verifier),Agent(critic),Workflow(fc-implement),Workflow(fc-review),Workflow(fc-explore)"
```

- The headless form's `json` output carries `total_cost_usd` and usage; record it with `fc events usage <json>`, where `<json>` is the full JSON result object as a single quoted argument (for example `fc events usage "$(cat result.json)"`), so the cost line is observed rather than `not recorded`.
- A headless run still halts at every gate: the session ends at the gate, the human records `fc launch gate <G1|G2|G3> approve`, and the next `claude -p --continue` (or a fresh `--agent orchestrator` session) resumes from `fc launch status`.
- A permission prompt after G2 (the gate that opens the implement phase) is a run-log entry on the tooling axis, the axis `flightdeck/manuals/orchestration/run-log.md` defines for hooks, permissions, isolation and schemas: the allow list, a role's tools or the sandbox missed something a wave needed, and the run was not unattended.

## The fragment's lists

| list | entries | why |
|---|---|---|
| `permissions.allow` | `Bash(node flightdeck/flightcrew/bin/fc *)`, `Bash(flightdeck/flightcrew/bin/fc *)`, `Bash(./flightdeck/flightcrew/bin/fc *)` | the three ways `fc` is invoked by path |
| | `Bash(git status *)`, `Bash(git diff *)`, `Bash(git log *)`, `Bash(git rev-parse *)`, `Bash(git worktree list *)` | read-only git every role uses |
| | `Bash(git add *)`, `Bash(git commit *)`, `Bash(git switch *)` | what an implementer needs on its own branch; `fc worker merge` does the merging |
| | one `Agent(<name>)` per file in `flightdeck/flightcrew/crew/*.md`, which the list must match exactly: `spec-builder`, `spec-judge`, `spec-attacker`, `explorer`, `test-builder`, `planner`, `orchestrator`, `implementer`, `verifier`, `critic` | dispatch of every crew role without a prompt |
| | `Workflow(fc-implement)`, `Workflow(fc-review)`, `Workflow(fc-explore)` | launching the three scripts, needed in `-p` runs |
| `permissions.deny` | `Edit(flightdeck/launch/*/specs/**)`, `Edit(flightdeck/launch/specs/**)` | a hard lock on pinned copies and canonical specs that no launch state can lift; `Edit(path)` also governs Write and NotebookEdit |
| printed by `fc launch pin tests-map` | one `Bash(<command>)` line per check | add these when checks are run by hand outside `fc check`; `fc check` itself is covered by the `fc` rules |

- `deny` and `ask` apply immediately; `allow` applies after workspace trust, the confirmation Claude Code asks for the first time a session opens a directory. Until it is granted, an interactive run prompts despite the allow list; this is why headless runs pass `--allowedTools`.
- Rule syntax: a trailing ` *` is a prefix match; `Edit(path)` uses gitignore glob semantics; `/path` is relative to the settings file's project root.

## The configured allowlist per role

The tools column is the frontmatter of `flightdeck/flightcrew/crew/<role>.md`, which `fc distribute --apply` copies to `.claude/agents/flightcrew/`; edit the source and redistribute. Only the "why" column is rationale.

| role | tools (frontmatter allowlist) | deny or scope | why |
|---|---|---|---|
| `orchestrator` | Read, Grep, Glob, Bash, Agent | no Write, no Edit | every file it produces goes through an `fc` command |
| `explorer` | Read, Grep, Glob, Bash | no Write, no Edit | read widely so nobody else has to |
| `planner` | Read, Grep, Glob, Bash, Agent | no Write, no Edit | it returns plan content; the orchestrator writes it with `fc plan write` |
| `test-builder` | Read, Grep, Glob, Bash, Write, Edit; `permissionMode: acceptEdits` | writes the map and check scripts only, before any implementer | it writes the map and the check scripts, which are locked before any implementer starts |
| `implementer` | Read, Grep, Glob, Bash, Write, Edit; `isolation: worktree`; `permissionMode: acceptEdits` | the guards deny locked paths and paths outside its unit's boundary | the only role with general write access, one unit each |
| `verifier` | Read, Grep, Glob, Bash | no Write, no Edit | running is not writing |
| `critic` | Read, Grep, Glob, Bash | no Write, no Edit | it reports findings; every change is made by an implementer |

- Tools follow the role, never convenience; widen only on a recorded tooling-axis entry in `flightdeck/launch/RUNLOG.md` whose diagnosis names the missing tool.
- `permissionMode: acceptEdits` on the implementer means a worktree edit inside its paths never prompts; a prompt during implement is therefore always a boundary, a lock or a missing allow rule.
- Auto mode (`--permission-mode auto`) has a classifier review each action; it is a backstop only, so scope tools per role whether or not it is in use.

## Sandbox

Sandboxing applies to Bash and its child processes and closes the shell-write hole the guards cannot see (`sed -i`, `cp`, redirects). The block below goes at the top level of `.claude/settings.json`, the same file the fragment merges into. It is an expanded example: the fragment's `_sandbox_example` carries only `filesystem.deny` with two entries, and the `enabled`, `network` and `excludedCommands` keys and the third deny path are added here. Derive the deny list from `paths.locked` in the launch's `launch.json`, as printed by `fc launch status`:

```json
"sandbox": {
  "enabled": true,
  "filesystem": { "deny": ["tests/**", "flightdeck/launch/specs/**", "flightdeck/testbench/suites/**"] },
  "network": { "allowedDomains": [] },
  "excludedCommands": []
}
```

- `autoAllowBashIfSandboxed` (default true) is a top-level settings key, a sibling of `sandbox` and not a member of it; it lets sandboxed Bash run without prompts, which is what an unattended run wants once the deny list is right.
- `fc locked` remains the detector whatever the sandbox setting: it lists every changed file under a locked path since `lock_commit`.
- The harness runs with no network: `allowedDomains` stays empty, and any command that comes to need the network is a change on the tooling axis.

## Isolation

- The implementer's `isolation: worktree` gives each unit its own checkout under `.claude/worktrees/`; isolation enforcement blocks edits and commands that resolve to the main checkout and refuses heredocs with unquoted delimiters.
- `worktree.baseRef: head` in the fragment makes the worktree branch from the run branch; with the default `fresh` a worker starts from the remote default branch and never sees the run.
- `.claude/worktrees/` belongs in `.gitignore`; `fc boundary` and `fc locked` exclude it from the changed set.
- Exporting `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` and `CLAUDE_CODE_SUBAGENT_MODEL=haiku` before the `claude` invocation caps every subagent on that one model, overriding the per-role `model` fields the roster sets; use it only when a recorded budget ceiling has been hit.

## Checks

- `fc doctor --target .claude` confirms the fragment's hook commands are present, `worktree.baseRef` is `head`, the worktrees directory is gitignored, and no other agent under `.claude/agents/**` carries a crew name.
- `PermissionDenied` events are recorded by event-log and counted by `fc budget`; they appear in the report's Failures section, which is where the tooling diagnosis starts.
