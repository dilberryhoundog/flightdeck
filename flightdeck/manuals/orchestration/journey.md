# The run journey

One orchestrated run, from a frozen spec to one of three endings, on flightdeck paths and `fc` commands. `fc` is `flightdeck/flightcrew/bin/fc`, invoked by path from the repository root; `$REPO` is the repository root; `<S>` is a spec name, `<L>` a launch name. The stage numbers here are the ones the other manuals, the run log and the crew definitions refer to.

## Binding lines

- The starting state is written down: the spec says what must be true, the kickoff how the run is conducted, the plan how this run is cut, the constitution how the project always works. Anything not written is reconstructed by guesswork, and guesses compound across agents.
- The stop condition is a machine outcome: the acceptance check `T1` through the stop gate, never an agent's claim.
- The evidence page (`launch/<L>/evidence.html`) shows results, not intentions; the human reads evidence, and reads the orchestrator's summary last, if at all.
- Review is a fresh context holding the spec, the diff and the evidence, with a mandate to find fault; no context grades its own work.
- A run that drifts is abandoned, not patched; the diagnosis goes to `launch/RUNLOG.md` and the setup changes before the next run starts.
- Every prohibition has an enforcement twin: a hook, a permission rule or an `fc` refusal. A rule that exists only as prose is a preference.

## Stages

| # | Stage | Who | Commands and artefacts | Manual read here |
|---|---|---|---|---|
| 1 | Idea to spec | human with `spec-builder`; `spec-judge`; `spec-attacker` | `launch/specs/<S>/spec.vN.json` written, linted (`fc lint spec <path> --repo $REPO`), validated (`fc validate spec <path> --for-freeze`), frozen by the human (status `frozen`, `commit` set), committed | `manuals/spec/*` (encoded in the spec crew) |
| 2a | Open the launch | human | `fc launch new launch/specs/<S>/spec.vN.json` creates `launch/<L>/` (status draft, phase targets, spec copy pinned, `kickoff.md` with `tests-map: (none)`); `fc launch activate <L>`; commit | `manuals/launch/launch-anatomy.md` |
| 2b | Spec to targets | `test-builder` (fresh; sees the spec, the fixture, the codebase) | writes `launch/specs/<S>/tests-map.vN.json` (draft) and check scripts; `fc check all --baseline <map>` records observed; the human freezes and commits the map; `fc launch pin tests-map <map>` copies it into the launch, sets allowed and locked paths, records `lock_commit`, re-renders the kickoff; commit | `manuals/testing/*`, `manuals/versioning/tests-map-versioning.md` |
| 3 | Kickoff | human | `fc launch phase plan` (refused until pins are frozen or `allow_draft`, the baseline agrees, launch and kickoff validate); start the orchestrator: `cd $REPO && claude --agent orchestrator --permission-mode acceptEdits` | `kickoff.md`, `manuals/harness/permissions.md` |
| 4 | Plan | `orchestrator` via `planner` and `explorer`s | `fc return explorer <file> --id X<n>` per answer; `fc plan write <json>` validates, stores `plan.json`, renders `plan.md`; the evidence page updates | `planning.md`, `run-log.md` |
| G1 | Gate 1 | human | read `plan.md` against the spec; edit `plan.json` and `fc plan render` if needed; `fc launch gate G1 approve` (phase to contracts) or `fc launch gate G1 exit` then `fc launch end abandoned --at G1`; commit | `planning.md` (the gate-1 checklist) |
| 5 | Contracts (wave 0) | one `implementer` | interface files and contract checks on branch `<L>/<unit>`; the stop gate runs the W0 unit's checks and `fc boundary` in this phase; `fc return worker`, `fc worker merge`; commit | — |
| G2 | Gate 2 | human | read the evidence page's "Changed since lock" and the W0 check results; `fc launch gate G2 approve` (refused while a W0 check is in error or has not run since `lock_commit`; phase to implement) or `exit` | — |
| 6 | Implement (waves 1..n) | `implementer`s, worktree-isolated, one unit each | `fc worker render <unit>` is the dispatch; the worker builds on branch `<L>/<unit>`, runs `fc check <T...>` in its worktree, returns a worker return; `fc return worker <file> --unit <U>`; `fc worker merge <unit>` in wave order; pilots first; chunks of `implementers_concurrent`; commit per merge | `manuals/harness/workflows.md` when the shape is workflow |
| 7 | Verify | scripts; optional `verifier` | `fc launch phase verify`; `fc verify` (check all, boundary, locked, budget); the stop gate holds the turn on `T1`; `fc verifier render`, dispatch, `fc return verifier <file> --pass <n>` | — |
| 8 | Review | `critic` (fresh), one fix pass, fresh re-review | `fc launch phase review` (refused while evidence is red or stale); `fc critic render --pass <n>`, dispatch, `fc return critic <file> --pass <n>`; route findings by kind; fixes re-run `fc verify` in place; passes capped by `critic_passes` | `review.md` |
| 9 | Report | `fc launch end` | `fc launch phase report`; `fc launch end <outcome>` renders `report.md` and `evidence.html`, inserts the RUNLOG stub, prints the worktree and branch cleanup lines | `run-report.md` |
| G3 | Gate 3 | human | read the ledger, the open findings, the three unverified lines, the cost line; the outcome given to `fc launch end` is the decision | `run-report.md`, `endings.md` |
| 10 | Merge, log, promote | human | integration branch rebased on the parent, `fc verify` there, PR opened with `report.md` linked, CI, merge, `fc launch land --commit <sha> --pr <url>`; fill the RUNLOG diagnosis fields; prune worktrees; promote confirmed rules | `endings.md`, `run-log.md` |

- Commit points the run relies on: after 2a, after 2b (`fc launch pin`), after G1 (plan), after wave 0, after each `fc worker merge`, at 9.
- Subagent worktrees branch from HEAD, so anything uncommitted in the launch folder is invisible to workers.
- The kickoff and the plan are different documents: the kickoff is rendered before the run and says how it is conducted; the plan is written at stage 4 and approved at G1. Neither is the spec.
- The test-builder runs before the plan exists, in its own context; checks derived after seeing a plan describe the plan.
- The baseline at 2b, where every check fails for the absence of its target, is what proves the target is real.
- Budgets and the stall rule live in `launch.json` ceilings, the plan and the hooks; an unattended run without them has no ceiling.

## Gates

| gate | after | the human reads | the decision |
|---|---|---|---|
| G1 | stage 4 | `plan.md` against the spec: every behaviour has a unit; nothing planned the spec did not ask for; units small enough to pass or fail alone | `fc launch gate G1 approve` or `exit` |
| G2 | stage 5 | the interface diff ("Changed since lock") and the W0 check results: do the contracts match the spec's interfaces, and are they what the workers will build against | `fc launch gate G2 approve` or `exit` |
| G3 | stage 9 | the ledger first, then open findings, then the unverified lines (unverified behaviours, test-file changes, files outside the boundary), then the cost; orchestrator notes last | `fc launch end accepted`, `accepted-with-reservations`, `partial --units`, or `abandoned --at G3` |

- Every gate halts: the orchestrator dispatches nothing until the gate is recorded, and `fc launch gate` refuses a gate already decided unless `--force`.
- A gate that shows narrative rather than evidence is a checkpoint in name only; G2 and G3 read the evidence page, not a summary.
- Exits before stage 6 are cheap and taken freely; exits after stage 6 have spent parallel tokens, which is why G1 and G2 exist.
- `fc launch gate <G> exit` prints the ending command to run next: `fc launch end abandoned --at <G>`.

## Exits and re-entry

- Any abandon trigger, escalation (`fc launch escalate <kind> --detail "..."`) or halt return stops dispatch; a fired trigger makes the guards deny every edit and `fc worker render`, `fc worker merge` and `fc launch phase` (except to ended) exit 2.
- `fc launch end abandoned --at <gate|stage>` records the exit and still renders `report.md` and `evidence.html`; an abandoned run's report is the most useful kind.
- The branch is left as it is; the human reads the Failures section, writes the run-log diagnosis (symptom, seen on, cause, fixed on, change, watch), and makes the change to the artefact the axis points at.
- Nothing is patched in place; the run restarts clean at the stage the changed artefact feeds.
- An implementer reporting that a check contradicts the spec is an exit (`status: halt`, kind `test-contradicts-spec`), never a bug for the implementer to resolve; only a human says whether the check or the spec is wrong.

| fixed on | change made to | re-enter at |
|---|---|---|
| context, spec | the spec (a behaviour, boundary, interface or decision), re-frozen at a new commit; `flightcrew/templates/spec.template.json` if the gap is structural | stage 1, then 2b if behaviours changed, then 3 |
| context, run conduct | a kickoff part under `flightcrew/templates/kickoff/` with its version bumped | stage 3 |
| context, project | the project constitution, a skill, a crew definition under `flightcrew/crew/` | stage 3 (foundation changed; the run restarts) |
| verification | a missing or unmapped check, an unlocked path, the acceptance check, a flaky or noisy check, the gate | stage 2b |
| tooling | a hook, a permission rule, worktree isolation, a return schema, a workflow script's stage boundaries | foundation, then stage 3 |

## Sessions and agents

Every context that exists during one run. "Fresh" means started with no memory of the sessions before it; the "must not see" column is as binding as "sees".

| role | stage | sees | must not see | form |
|---|---|---|---|---|
| `spec-builder` | 1 | the intention or draft, the template, the schema, the run log, explorer returns, judge and attacker output | repository files, prior specs, reference pages | interactive session |
| `spec-judge` | 1 | the rubric, the draft | everything else | fresh subagent |
| `spec-attacker` | 1 | the draft, the project | everything else | fresh subagent |
| `test-builder` | 2b | the frozen spec, the fixture, the codebase, the testing manuals | any plan, implementation or interview | fresh session or subagent |
| `orchestrator` | 4 to 9 | kickoff, spec, map, plan, stored returns, prior reports | worker transcripts, the interview, the critic's reasoning | fresh session started as `claude --agent orchestrator` |
| `explorer` | 4 | the codebase, one question | — | subagent, read-only tools, small model |
| `planner` | 4 | spec, map, run log, roster, explorer returns | worker transcripts | subagent |
| `implementer` | 5 to 6 | one unit's rendered dispatch | other units, the whole plan, the kickoff | subagent, worktree-isolated, structured return |
| `verifier` | 7 | evidence, map, the merged branch | implementer reasoning, stored returns | optional subagent asked to refute |
| `critic` | 8 | spec at commit, diff since lock, evidence | plan, kickoff, reasoning, prior findings | subagent, fresh per pass, strong model |
| human | 1, 2a, 2b, 3, G1, G2, G3, 10 | the evidence page, then the report | transcripts, until something needs diagnosing | — |

- There is no scribe: `fc launch end`, `fc report`, `fc evidence` and the SessionEnd hook assemble the report and the evidence page.
- The roster with tools, models and turn budgets is `flightcrew/crew/README.md`; the definitions are `flightcrew/crew/<role>.md`.

## The folder

```
flightdeck/flightcrew/          global assets: bin/fc, checks/, crew/, hooks/, schemas/, templates/, workflows/
flightdeck/launch/specs/<S>/    the canonical spec home: spec.v*.json, tests-map.v*.json, checks/; interview/ is never copied
flightdeck/launch/<L>/          one run: launch.json, kickoff.md, plan.json, plan.md, events.jsonl, hooks.log,
                                specs/ (pinned copies), evidence/, returns/, review/, notes.md, report.md, evidence.html
flightdeck/launch/RUNLOG.md     diagnosis entries, newest first
flightdeck/testbench/           suites, fixtures and benches; never launch results
flightdeck/manuals/             this index and the manuals
```

- `launch/<L>/` is self-contained: pinned copies, every return, every evidence file and the report live there and are committed with the code.
- The harness is distributed once per repository (`fc distribute --apply`); `manuals/harness/hooks.md` and `manuals/harness/permissions.md` cover it.
