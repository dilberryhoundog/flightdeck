# Raw explorer report a94cbb285d752509d

Recovered 2026-09-18 by the pilot from the subagent transcript on disk; the hand-back reached the lead only. Unverified raw material; the parent teammate's filed report supersedes it.


Brief (first 200 chars): Read-only research. A snapshot of a git branch has been extracted to /private/tmp/claude-501/run2tree/. Everything is under /private/tmp/claude-501/run2tree/flightdeck/ and /private/tmp/claude-501/run


# fc / flightcrew — how a RUN executes, mechanically

All paths below are relative to `flightdeck/`.

## 1. The `fc` CLI

### Entry points
- `flightcrew/bin/fc` — a `sh` shim: `exec node "$(dirname "$0")/fc.mjs" "$@"`.
- `flightcrew/bin/fc.mjs` — parses `--launch <name>` / `--json` globals anywhere in argv, resolves the repo root and the active launch via `checks/lib/launch-lib.mjs` (`resolveRoot`, `resolveLaunch`), dynamically imports `bin/cmd/<command>.mjs`, and calls its exported `run(args, ctx)`. Exit codes: `EXIT.ok=0` success, usage/env error `1`, blocked/failed check `2` (from `checks/lib/output.mjs`'s `EXIT`).

### Top-level `COMMANDS` array in `fc.mjs` (verbatim, 19 entries):
```
launch, check, verify, boundary, locked, budget, events, evidence, report, runlog,
plan, validate, lint, worker, critic, verifier, return, distribute, doctor
```

### Verbatim `USAGE` block printed by `fc.mjs`:
```
usage: fc <command> [sub] [args] [--launch <name>] [--json]

commands:
  launch new|activate|status|phase|gate|end|pin|kickoff|escalate|note|land
  check [all|T...]        run the pinned checks and write evidence
  verify                  check all, boundary, locked and budget
  boundary | locked       the changed set since the lock commit
  budget                  counts beside the ceilings
  events append|usage|summary
  evidence | report       render the evidence page or the run report
  runlog stub|show        the run-log entry and the run log
  plan write|render       store and render the plan
  validate <kind> [path]  run a validator
  lint spec <path>        run the spec readiness linter
  worker render|merge|return
  critic render | verifier render
  return <kind> <file>    store an agent return
  distribute | doctor
```

### Full enumeration of leaf subcommands (from each `cmd/*.mjs`'s own `help`)
- `launch` — `new, activate, status, phase, gate, pin, kickoff, escalate, note, end, land` (11) — `bin/cmd/launch.mjs`
- `check` — `all`, `T<n>...`
- `verify`, `boundary`, `locked`, `budget` — no sub
- `events` — `append, usage, summary` (3)
- `evidence`, `report` — no sub
- `runlog` — `stub, show` (2)
- `plan` — `write, render` (2)
- `validate` — `spec, tests-map, plan, launch, kickoff, return, all` (7)
- `lint` — `spec` (1)
- `worker` — `render, merge, return` (3)
- `critic` — `render` (1)
- `verifier` — `render` (1)
- `return` — `worker, explorer, verifier, critic` (4)
- `distribute`, `doctor` — no sub

That's 19 top-level commands plus 36 named subcommand verbs (11+1+3+2+2+7+1+3+1+1+4=36). I could not find any single place in the source that literally enumerates "35" subcommands — I'm reporting the exhaustive itemized breakdown rather than forcing a match; the "35" in the run report likely comes from a different counting convention I couldn't independently reproduce with certainty.

### One-line semantics
- **`launch new`** (`bin/cmd/launch.mjs`) — creates a launch folder from a spec path, seeding `launch.json` from `templates/launch.template.json` + `BUILT_IN_DEFAULTS`, status `draft`, phase `targets`.
- **`launch activate`** — marks a launch `active` (exactly one may be active); `--allow-draft` accepts a draft spec/map.
- **`launch gate`** — `<G1|G2|G3> <approve|exit>`: records the decision in `launch.json.gates[G]`; `G1 approve` moves `plan→contracts`, `G2 approve` moves `contracts→implement` (after `gate2Blockers` checks); `exit` heads toward abandonment.
- **`launch note`** — appends text to `notes.md` (feeds the report's "Orchestrator notes").
- **`launch end`** — `<accepted|accepted-with-reservations|abandoned|partial>`: freezes outcome/status/ended/phase=ended, requires fresh clean evidence for accepted outcomes, renders evidence.html + report.md, inserts run-log stub.
- **`launch land`** — `--commit <sha> [--pr <url>]`: records `launch.json.landed` once `evidence/summary.json` at that commit is clean.
- **`plan`** — `write` validates+stores `plan.json`; `render` regenerates `plan.md` (6 fixed headings) purely from `plan.json`.
- **`worker`** — `render <unit>` writes the sealed implementer dispatch prompt; `merge <unit>` merges the unit branch, re-runs its checks on the merged tree, commits, cleans up worktree/branch; `return <unit> <file>` = `fc return worker <file> --unit <unit>`.
- **`return`** — stores an agent's JSON return at its schema-fixed path (`worker`→`returns/<unit>.json`, `explorer`→`returns/explore-<id>.json`, `verifier`→`returns/verify-<n>.json`, `critic`→`review/pass-<n>.json`, or `--resolve` to change a finding's state).
- **`check`** — runs the pinned tests-map's checks as `/bin/sh -c <command>`, writes `evidence/<T>.json` + rebuilds `evidence/summary.json`.
- **`verify`** — runs `check all`, `boundary`, `locked`, `budget` in order.
- **`verifier`** — `render`: writes the sealed verification-pass prompt, valid only in phase `verify`.
- **`critic`** — `render`: writes the sealed review-pass prompt, valid only in phase `review`.
- **`evidence`** — renders `launch/<L>/evidence.html`.
- **`report`** — renders `launch/<L>/report.md` (see §6).
- **`runlog`** — `stub` inserts/updates the run-log entry; `show` prints the log.
- **`validate`** — runs a schema/rule validator over a document.
- **`distribute`** — copies crew + workflow scripts and prints the merged settings fragment into a target `.claude` (install-time, not part of a run).
- **`doctor`** — checks node/git/launches/crew/scripts/schemas/manifest health.
- **`boundary`** — lists changes since `lock_commit` outside `paths.allowed`.
- **`budget`** — counts vs `ceilings`, exit 2 + `trigger` event if exceeded.
- **`locked`** — changes touching a `paths.locked` glob; writes `evidence/locked.json`.
- **`events`** — `append` hand-writes an events.jsonl line; `usage` records token usage; `summary` prints rollups.

## 2. Launch lifecycle (`schemas/launch.schema.json`, `templates/launch.template.json`)

**Phases** (strict order; `fc launch phase` accepts only the immediately-next, or `--force`):
```
targets, plan, contracts, implement, verify, review, report, ended
```
**status enum**: `draft, active, accepted, accepted-with-reservations, abandoned, partial` — exactly one launch may be `active`.
**outcome values**: `accepted, accepted-with-reservations, abandoned, partial`.
**gate status enum**: `pending, approved, exited`.

**Gates**:
- **G1** gates `plan → contracts`; approve only valid from phase `plan`.
- **G2** gates `contracts → implement`; approving first runs `gate2Blockers()` (every check named by the plan's `contracts`-kind unit, or the launch's `acceptance` check, must be non-error and have run since `lock_commit`).
- **G3** — recorded in `launch.json.gates.G3` but no code path ties it to a phase transition, `fc launch end`, or `fc launch land`; it's a human sign-off record only, not enforced like G1/G2.

**Ceilings** (`launch.json.ceilings`, all required):
```
agents, implementers_concurrent, turns_per_agent, gate_iterations,
stop_blocks (0..8, Claude Code hard-caps Stop-hook blocks at 8),
critic_passes, minutes, tokens (int|null), expected_tokens (int|null)
```
Built-in defaults (`launch.mjs`): `agents:12, implementers_concurrent:4, gate_iterations:3, stop_blocks:8, critic_passes:2, minutes:240, tokens:null, expected_tokens:null`.

Other key fields: `spec{name,version,commit,file_commit,path}`, `tests_map{version,commit,path}`, `kickoff{path,version}`, `base_commit`, `lock_commit` (base for boundary/locked/critic diff), `branch`, `paths{allowed[],locked[],enforce_boundary}`, `acceptance` (T-id), `structural` (per-extension parse command map), `landed{commit,pr,integration_check}`.

## 3. Hooks (`flightcrew/hooks/`)

`settings.fragment.json` wires: `SessionStart`→`event-log.mjs`; `SessionEnd`→`event-log.mjs`,`session-end.mjs`; `SubagentStart/Stop, TaskCreated/Completed, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, WorktreeRemove`→`event-log.mjs`; `PreToolUse` (matcher `Edit|Write|NotebookEdit`)→`lock-guard.mjs`+`boundary-guard.mjs` in parallel; `PostToolUse` (matcher `Edit|Write`)→`structural-check.mjs`; `Stop`→`event-log.mjs`+`stop-gate.mjs` (`timeout:600`). Plus `worktree.baseRef:"head"`, `permissions.allow` (fc invocation forms, read-only/staging git, named agents, the 3 workflows), `permissions.deny` (`Edit(flightdeck/launch/*/specs/**)`, `Edit(flightdeck/launch/specs/**)`).

| hook | event | matcher | action | exit/output |
|---|---|---|---|---|
| `event-log.mjs` | SessionStart/End, SubagentStart/Stop, TaskCreated/Completed, PostToolUseFailure, PermissionDenied, PreCompact/PostCompact, Stop, WorktreeRemove | — | appends `events.jsonl` line; SessionStart also emits `systemMessage` naming launch+phase | always exit 0 |
| `lock-guard.mjs` | PreToolUse | `Edit\|Write\|NotebookEdit` | denies edits to `paths.locked` (outside phase `targets`); records `lock_denied` | exit 0; `{hookSpecificOutput:{permissionDecision:"deny",...}}` |
| `boundary-guard.mjs` | PreToolUse | same | denies edits outside `paths.allowed`/launch folder (or outside locked+spec-home in `targets`) while `enforce_boundary`; records `boundary_denied` | exit 0; same `deny` JSON shape |
| `structural-check.mjs` | PostToolUse | `Edit\|Write` | runs `structural[ext]` command via `/bin/sh -c` | exit 0 clean; exit 2 + last 20 lines on failure |
| `stop-gate.mjs` | Stop | — (timeout 600) | runs `acceptance-gate` (phase verify) or `contracts-gate` (phase contracts); stalls into a `trigger` at `min(ceilings.stop_blocks,8)` | exit 0 green/released/stalled; exit 2 blocking with `<id> exit <code>` + tail |
| `session-end.mjs` | SessionEnd | — | best-effort `fc evidence`+`fc report`, 1500ms budget | always exit 0 |

No-op rule: silent (exit 0, no output, no event) when `$CLAUDE_PROJECT_DIR` unset/no `flightdeck/launch/`, no launch `active` (or `FLIGHTCREW_LAUNCH=none`), stdin not JSON, or two launches ambiguously active (guards then emit `ask`).

## 4. Workflows

`fc-explore.js` — meta `{name:'fc-explore', phases:[Explore]}`; args `{questions, timestamp?, model?}`; dispatches one `agentType:'explorer'` per question in `parallel()`; model only set if passed; returns `{workflow,timestamp,asked,answers,rejected}` — writes nothing, orchestrator stores via `fc return explorer`.

`fc-implement.js` — args `{launch, units, implementers_concurrent, timestamp, agent_type?, model?}`; derives waves from `depends_on`, dispatches pilots then chunks of `implementers_concurrent`, `agentType` defaults to `'implementer'`, `isolation:'worktree'`; returns `{workflow,launch,timestamp,dispatched,returns,halt,stopped_on}` — orchestrator stores via `fc return worker` and merges via `fc worker merge`.

`fc-review.js` — args `{launch, spec_path, critic_prompt_path, units, critic_passes, timestamp, model?}`; loop of critic (`agentType:'critic'`) → fix (`agentType:'implementer', isolation:'worktree'`) → re-verify (`agentType:'verifier'`), up to `critic_passes`; returns `{workflow,launch,timestamp,passes,fixes,verifications,unrouted,observations,escalation,trigger}`.

`.claude/workflows/flightcrew-build.js` and `flightcrew-targets.js` (confirmed present via `ls -a`) are meta-workflows for building flightcrew itself (hardcoded `REPO='/Users/dylangraham/Projects/flightdeck'`), not part of the run mechanism — noted for completeness only.

## 5. Check vs. gate

A **check** is one row of the pinned tests map (`schemas/tests-map.schema.json`): `{id(T<n>), status, kind, covers[], command, baseline{expect,observed}, ...}`, producing a **check result** (`schemas/check-result.schema.json`, `evidence/<T>.json`): `{id,command,cwd,exit,verdict(pass|fail|error|skipped),stdout_tail,stderr_tail,duration_ms,ran_at,commit,covers,phase}` — a fact about one command's outcome.

A **gate** is a phase barrier: a module in `checks/gates/*.mjs` exporting `run(context) → {ran, reason?, checks:[{id,verdict,blocking,code,output}], extra:[...]}`, aggregating one or more checks plus non-check blockers (`extra`, e.g. `fc boundary`'s result) into a blocking verdict. Three gates: `acceptance-gate.mjs` (runs just `acceptance`, used by `stop-gate` in phase `verify`), `contracts-gate.mjs` (runs the contracts unit's checks + boundary, used by `stop-gate` in phase `contracts` and by `fc launch gate G2`), `structural-gate.mjs` (single-file parse check, the command-line form of what `structural-check.mjs` does inline).

## 6. `fc report`

`bin/cmd/report.mjs` renders `launch/<L>/report.md` from `loadLaunchData()` (launch.json, plan.json, evidence/summary.json, review/pass-*.json+resolutions.json, events.jsonl, notes.md, git worktree list). Fixed section order: `## Ledger [checked · reviewed · stated]`, `## Verification [checked]`, `## Review [reviewed]`, `## Phases [recorded · stated]`, `## Agents [recorded · stated]`, `## Failures and interventions [recorded]`, `## Orchestrator notes [stated]` — each prints a placeholder rather than vanishing when its input is absent. The report deliberately never states an acceptance verdict. Called automatically by `fc launch end` and by `session-end.mjs`.

## End-to-end sequence
1. `fc launch new/activate/pin/kickoff` → phase `targets`.
2. `fc launch phase plan` (gated by `planBlockers`) → `fc plan write` → `fc launch gate G1 approve` → `contracts`.
3. contracts unit worked; every Stop runs `contracts-gate`; `fc launch gate G2 approve` (via `gate2Blockers`) → `implement`.
4. `fc worker render`/dispatch/`fc worker merge` per unit, guarded live by lock/boundary hooks and structural-check.
5. `fc launch phase verify`; `fc verify`; Stop runs `acceptance-gate`.
6. `fc launch phase review` (`reviewBlockers`); `fc critic render` + `fc-review` loop; `fc launch gate G3 approve` (human sign-off, unenforced).
7. `fc launch phase report`; `fc report`.
8. `fc launch end <outcome>` freezes state, re-renders evidence/report, writes run-log stub.
9. `fc launch land --commit <sha>`.

