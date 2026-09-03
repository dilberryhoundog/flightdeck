# Kickoff: task-feature · shape-session
launch: flightdeck/launch/export-html-1    spec: flightdeck/launch/export-html-1/specs/export-html/spec.v1.json @ a1b2c3d    tests-map: flightdeck/launch/export-html-1/specs/export-html/tests-map.v1.json @ b2c3d4e
kickoff version: base@1+shape-session@1+task-feature@1
read first: flightdeck/launch/RUNLOG.md    prior reports: none
write plan with: fc plan write    evidence: flightdeck/launch/export-html-1/evidence.html

<!-- version: 1 -->
## Conduct
1. Run `fc launch status`; read the spec and the tests map at the paths in the header; read the run log named under read first.
2. Dispatch `explorer` agents on the planning questions, one question each; take summaries only.
3. Write the plan with `fc plan write`; it validates the plan and renders plan.md. HALT: Gate 1. A human runs `fc launch gate G1 approve` or `exit`.
4. Wave 0: `fc worker render` the contracts unit and dispatch one `implementer`; the stop gate runs that unit's checks and the boundary in this phase. HALT: Gate 2.
5. Waves 1..n: `fc worker render <unit>` for each unit; dispatch one `implementer` per unit, pilot units first, in chunks no larger than implementers_concurrent; store every return with `fc return`; land each unit with `fc worker merge` in wave order.
6. `fc launch phase verify`, then `fc verify`; dispatch the `verifier` when the plan asks for one and store its verdict with `fc return verifier`.
7. `fc launch phase review`, then `fc critic render`; dispatch the `critic`; store the findings with `fc return critic`; route findings by kind; one fix pass; a fresh critic pass.
8. `fc launch phase report`. HALT: Gate 3. The human ends the run with `fc launch end <outcome>`.

## Escalate
Stop and ask a human when the spec is silent or contradictory on something a unit needs, when an implementer reports a locked check is wrong or unsatisfiable, when an abandon trigger fires, when a permission or tool blocks a required action, or when a ceiling is reached. Run `fc launch escalate <kind> --detail "…"` naming the finding, then end the turn; propose nothing else in the same message.

## Roles
`explorer` (read-only, one question each) · `planner` (writes the plan content) · `implementer` (worktree-isolated, one unit each) · `verifier` (re-runs the checks, read-only) · `critic` (spec plus diff, read-only). Workers never message each other; every dispatch goes through fc worker render.

## Communication
Summaries up, never transcripts; returns in the declared shape through `fc return`; raw check output in evidence, never paraphrased. The evidence page at the path in the header updates at every phase end and gate.

## Budgets
Ceilings live in launch.json; the plan states its expected cost inside them. Exceeding a ceiling is an escalation, not a push-through.

## Outputs
One branch per unit named `<launch>/<unit name>`, landed by `fc worker merge`; report.md and evidence.html rendered by `fc launch end`; the RUNLOG stub inserted with its mechanical fields filled.

## Never
Edit a locked path · write outside the allowed paths and the launch folder · continue past a fired trigger · resolve a spec conflict silently · hand a worker anything beyond its dispatch. Each is enforced by a hook or by `fc`.

<!-- version: 1 -->
## Shape: session
The orchestrator runs in one Claude Code session and dispatches the crew as subagents. Parallel units run as concurrent subagents, at most implementers_concurrent at a time, and the next chunk starts only when every return of the current chunk is stored. Progress is the sequence of returns stored with `fc return`; budgets are the ceilings in launch.json, enforced by `fc budget` and the hooks.

<!-- version: 1 -->
## Task: feature
Cut the work vertically: each unit delivers one testable behaviour end to end and names the checks that prove it. Wave 0 fixes the interfaces the spec names and passes their contract checks before any feature unit starts. The proof unit integrates last and lands the acceptance check.
