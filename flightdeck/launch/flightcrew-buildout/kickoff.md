# Kickoff: task-feature · shape-workflow
launch: flightdeck/launch/flightcrew-buildout    spec: flightdeck/launch/flightcrew-buildout/specs/flightcrew-v1/spec.v1.json @ 5f69a94    tests-map: flightdeck/launch/flightcrew-buildout/specs/flightcrew-v1/tests-map.v1.json @ 44aff6b
kickoff version: base@1+shape-workflow@1+task-feature@1
read first: flightdeck/launch/RUNLOG.md    prior reports: none
write plan with: fc plan write    evidence: flightdeck/launch/flightcrew-buildout/evidence.html

<!-- version: 1 -->
## Conduct
1. Run `fc launch status`. Read the spec and the tests map at the paths in the header, and the run log named under read first. Dispatch `explorer` agents for what the plan needs and cannot be read in a few minutes, one question each, and store every answer with `fc return explorer --id X<n>`.
2. Write the plan with `fc plan write <json>`: it validates the plan, stores plan.json and renders plan.md. HALT: Gate 1. A human reads plan.md against the spec and records `fc launch gate G1 approve` or `fc launch gate G1 exit`. Dispatch nothing until the gate is recorded.
3. Wave 0, contracts: `fc worker render <unit>` for the contracts unit and dispatch one `implementer` with that prompt; store its return with `fc return worker <file> --unit <id>` and land it with `fc worker merge <unit>`. The stop gate runs that unit's checks and the boundary in this phase. HALT: Gate 2. A human reads the changed-since-lock list and the wave 0 check results and records `fc launch gate G2 approve` or `fc launch gate G2 exit`.
4. Waves 1..n: `fc worker render <unit>` per unit and dispatch one `implementer` per unit — pilot units first, then the rest in chunks no larger than the implementers_concurrent ceiling, the next chunk starting only when every return of the current one is stored. Store each return with `fc return worker`, land each unit with `fc worker merge <unit>` in wave order, and stop dispatching on any halt return.
5. Verify: `fc launch phase verify`, then `fc verify` (checks, boundary, locked paths, budget). When the plan asks for one, `fc verifier render` and dispatch the `verifier`, then store the verdict with `fc return verifier --pass <n>`.
6. Review: `fc launch phase review`, then `fc critic render --pass <n>` and dispatch the `critic` with the sealed prompt. Store the findings with `fc return critic --pass <n>`. Route a correctness gap or a scope violation back to the implementer that owns the unit whose paths hold the file, re-run `fc verify`, then take a fresh critic pass; a spec conflict is an escalation, not a fix; an observation is recorded and never dispatched. Record a resolution with `fc return critic --resolve F<n> --commit <sha>`.
7. Report: `fc launch phase report`. HALT: Gate 3. A human reads the ledger, the open findings, the unverified lines and the cost, and ends the run with `fc launch end <outcome>`, which renders report.md and the evidence page and inserts the run-log stub.

## Escalate
Stop and ask a human when the spec is silent or contradictory on something a unit needs, when an implementer reports that a locked check is wrong or unsatisfiable, when an abandon trigger in the plan fires, when a permission or a tool blocks a required action, or when a ceiling is reached. Run `fc launch escalate <kind> --detail "…"` naming the finding, then end the turn; propose nothing else in the same message.

## Roles
`explorer` receives one question, its stage and the paths it may read, and returns a cited answer; it never receives the plan or a unit's work. `planner` receives the spec, the tests map, the run log, the roster and the explorer answers, and returns plan content; it never receives worker transcripts. `implementer` receives one unit's rendered dispatch — that unit's spec nodes, its checks by id, its paths and its branch — and returns a worker return; it never receives the plan, the kickoff or another unit's dispatch. `verifier` receives the evidence, the tests map and the merged branch, and returns a verdict; it never receives implementer reasoning. `critic` receives the pinned spec, the diff since the lock and the evidence, and returns findings; it never receives the plan, the kickoff, the returns or earlier findings. Dispatch caps are defaults the plan may tighten and may not loosen: one question per explorer, one unit per implementer, and at most implementers_concurrent implementers at a time. Workers never message each other, and every dispatch is a rendered prompt, never a paraphrase.

## Communication
Summaries travel up, transcripts never do. Every return arrives in its declared shape and is stored through fc return; raw check output lives in the evidence, never paraphrased into prose. State what is checked, what is reviewed and what is merely stated, and keep the three apart. The evidence page at the path in the header is rewritten at every check, gate, phase change, return and ending.

## Budgets
The ceilings live in launch.json and the plan states its expected cost inside them: agents, concurrent implementers, turns per agent, gate iterations, stop blocks, critic passes, minutes, and tokens when they are observed. Defaults hold unless the plan tightens them. Exceeding a ceiling is an escalation, not a push-through.

## Outputs
One branch per unit named `<launch>/<unit name>`, built in its own worktree and landed by `fc worker merge`. Every agent return stored through `fc return` at its fixed path. The evidence page current at the end of every phase. report.md rendered by `fc launch end`, with the run-log stub inserted and its mechanical fields filled, and the worktree and branch cleanup lines printed for the human to run.

## Never
Edit a locked path (denied by the lock-guard hook and detected by `fc locked`) · write outside the allowed paths and this launch's folder (denied by the boundary-guard hook and detected by `fc boundary`) · continue after an abandon trigger has fired (the guards deny every edit and `fc` refuses to dispatch) · resolve a spec conflict without a human (`fc launch escalate` is the only route) · hand a worker anything beyond its rendered dispatch (rendered by `fc worker render` and by nothing else) · hand-edit kickoff.md or plan.md (both are re-rendered from their sources).

<!-- version: 1 -->
## Shape: workflow
The orchestrator hands a wave to a dynamic workflow script under flightcrew/workflows/ and keeps the session for the gates and the fc commands. Choose this shape only when a wave holds more units than the implementers_concurrent ceiling, so the fan-out needs a script to hold it; the orchestrator session, the gates, the fc commands and the stored returns are identical to the session shape.
Dispatch: `/fc-implement` fans the wave's implementers, pilots first and the rest in chunks, and returns every payload; `/fc-review` runs the critic, fix and re-verify loop; `/fc-explore` fans the planning questions. The scripts only dispatch and return payloads: after a workflow completes, the orchestrator persists every payload with `fc return` and lands units with `fc worker merge`, exactly as in the session shape.
Progress: the workflow's own phase lines while it runs, then the stored returns and the evidence page once it completes; nothing counts as progress until it is stored through fc.
Stopping: a workflow stops dispatching on the first halt payload and returns it; the orchestrator escalates it. Gates are never inside a script — the script ends and the session halts at the gate.

<!-- version: 1 -->
## Task: feature
Cut the work vertically: each unit delivers one testable behaviour end to end and names the checks that prove it. Wave 0 fixes the interfaces the spec names and passes their contract checks before any feature unit starts. The proof unit integrates last and lands the acceptance check.
A unit that cannot name a check is not a unit; fold it into one that can, or ask for a check before the plan is written. Prefer more small units over fewer wide ones, and keep two units off the same file where wave order allows it.
Risks worth naming: two units editing one file, an interface that wave 0 guessed, and a behaviour whose check is slower than the inner loop.
