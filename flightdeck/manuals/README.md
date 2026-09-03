# Manuals

Agent-facing manuals for flightdeck: the orchestration manuals (the run journey and each stage's discipline), the harness manuals (hooks, permissions, workflow scripts), the launch anatomy, and the existing spec, testing, versioning and rubric manuals. Each manual is written for a stranger who may be any model, names flightdeck paths and `fc` commands (`flightdeck/flightcrew/bin/fc`), and fits in 150 lines. Start with `orchestration/journey.md`; it places every other manual on the stage where it is read.

## Who reads what, and when

At most two manuals per role; the stage numbers are those of `orchestration/journey.md`.

| role | manual | read at |
|---|---|---|
| human | `orchestration/journey.md` | before the first run, and at every gate as the map |
| human | `orchestration/endings.md` | G3 and stage 10 |
| human (installing) | `harness/hooks.md` | once per repository, and on a tooling-axis run-log entry |
| human (starting the orchestrator) | `harness/permissions.md` | stage 3 |
| human (opening a launch) | `launch/launch-anatomy.md` | stage 2a, and from any side session on a repository with an active launch |
| human (assembling the kickoff) | `orchestration/kickoff.md` | stage 3, and whenever a kickoff part changes |
| human (diagnosing) | `orchestration/run-log.md`, `orchestration/run-report.md` | stage 10 |
| human (changing a role) | `orchestration/crew.md` | stage 10, promotion |
| `test-builder` | `testing/testing-description.md`, `testing/testing-conventions.md` | stage 2b, named in its dispatch |
| `planner` | `orchestration/planning.md`, `orchestration/run-log.md` | stage 4 |
| `orchestrator` | `orchestration/planning.md`, `orchestration/review.md` | stage 4 (with the planner) and stage 8; its conduct is `launch/<L>/kickoff.md`, not a manual |
| `orchestrator` (workflow shape) | `harness/workflows.md` | stages 4, 6 and 8 |
| `explorer`, `implementer`, `verifier` | none | their inputs are only those named in the dispatch; `fc worker render` and `fc verifier render` carry everything they may act on |

## Roles that read no manual at session time

Their conventions are encoded in their definitions under `flightdeck/flightcrew/crew/`, so nothing is loaded into their context beyond the dispatch.

| role | manuals encoded in its definition | dispatched with |
|---|---|---|
| `spec-builder` | `spec/spec-description.md`, `spec/spec-conventions.md`, `spec/verification-addendum.md`, `versioning/spec-versioning.md` | the fixed paths listed in `flightcrew/crew/README.md` (template, schema, rubric, validator, linter, run log, canonical spec folder) |
| `spec-judge` | `rubrics/spec/spec-readiness-rubric.md` | the rubric and the draft, nothing else |
| `spec-attacker` | `spec/spec-description.md`, `spec/spec-conventions.md` | the draft and the project, nothing else |
| `critic` | `orchestration/review.md` (the mandate, the checklist, the four finding kinds, the `no gaps` exit) | the sealed file `fc critic render` writes |

## The manuals

Orchestration (`orchestration/`):
- `journey.md`: the stages with their commands, the three gates, the exits and re-entry table, the sessions-and-agents visibility table, the folder.
- `planning.md`: whether to run, inputs, the seven phases, decomposition rules, `plan.json` and the rules `fc validate plan` enforces, budgets, the gate-1 checklist.
- `kickoff.md`: the routing test, the library under `flightcrew/templates/kickoff/`, anatomy, assembly and validation, the before-sending checklist.
- `review.md`: the sealed room `fc critic render` builds, the mandate, the four finding kinds and their routing, the loop and its cap, kinds of pass, the human's review.
- `endings.md`: the three endings and their `fc launch end` outcomes, the abandon sequence, the salvage table, retry rules, partial acceptance, merge discipline, the three checklists.
- `run-log.md`: the three axes, the entry `fc launch end` inserts into `launch/RUNLOG.md`, practice, promotion.
- `run-report.md`: provenance marks, the eight sections of `report.md`, how claims are judged, what `fc report` reads.
- `crew.md`: roles and the separations they serve, from role to definition, design rules, team shapes, anti-patterns; the roster is `flightcrew/crew/README.md`.

Harness (`harness/`):
- `hooks.md`: each hook, its event and exit semantics, install steps, troubleshooting, the shell-write hole and its backstops.
- `permissions.md`: the orchestrator start line, the headless form, allow and deny recommendations per role, the sandbox, isolation.
- `workflows.md`: the three scripts, when to choose the workflow shape, persisting payloads with `fc return`, the `/workflows` controls.
- `claude-code-facts.md`: the Claude Code behaviour the harness relies on, with the documentation date it was verified against.

Launch (`launch/`):
- `launch-anatomy.md`: `launch.json` fields, folder layout, statuses and phases, the command-by-phase table, `FLIGHTCREW_LAUNCH` in side sessions, staleness.

Existing manuals, kept byte-unchanged because they carry calibration evidence:
- `spec/spec-description.md`: the nine domains of a spec.
- `spec/spec-conventions.md`: the conventions a spec file follows.
- `spec/verification-addendum.md`: verification for agent-shaped work and the class tags.
- `testing/testing-description.md`: the seven classes of check.
- `testing/testing-conventions.md`: the conventions a tests map and its checks follow.
- `versioning/spec-versioning.md`: spec versioning, node status and the retired registry.
- `versioning/tests-map-versioning.md`: tests-map versioning, check status and the retired registry.
- `rubrics/spec/spec-readiness-rubric.md`: the readiness rubric the spec-judge applies; earlier versions under `rubrics/spec/deprecated/`.

## Historical paths

The rubric and its deprecated versions under `manuals/rubrics/spec/` cite bench chains and human grades at `dev/workspace/...` paths, and the rubric bench under `flightdeck/testbench/benches/rubrics/spec/` (its `absorb.mjs` mutations and bench notes) quotes spec text naming `dev/orchestration/...` and `dev/workspace/...` paths; the validator suite under `flightdeck/testbench/suites/validate-spec/` keeps the case table and goldens of the earlier validator suite. Those are historical references to where the calibration evidence was produced, recorded as such; they are not paths this system reads, and the documents stay byte-unchanged because the evidence they cite cannot be reproduced. The live homes are `flightdeck/testbench/benches/rubrics/spec/experiments/` for future bench chains and `flightdeck/launch/specs/<name>/` for specs.

## Conventions every manual follows

- Paths are repository-relative; `$REPO` is the repository root; `<S>` is a spec name, `<L>` a launch name, `<T>` a check id, `<G>` a gate.
- One rule per line where the source is a rule; a table where the source is a table; no narrative.
- Durable: no session references, written for any model, changed in reviewed diffs through the run log like every other setup file.
