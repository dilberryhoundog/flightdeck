# Manuals

Agent-facing manuals for flightdeck: the orchestration manuals (the run journey and each stage's discipline), the harness manuals (hooks, permissions, workflow scripts), the launch anatomy, and the frozen spec, testing, versioning and rubric manuals listed under "Frozen manuals" below. Each manual is written for a stranger who may be any model and names flightdeck paths and `fc` commands (`flightdeck/flightcrew/bin/fc`).

- The orchestration, harness and launch manuals are written to the conventions at the end of this file and each fits in 150 lines. The frozen manuals predate those conventions and are exempt from both.
- `flightdeck/manuals/orchestration/journey.md` places the stage-by-stage manuals on the stage where each is read. The install-time and reference manuals (`flightdeck/manuals/orchestration/crew.md`, `flightdeck/manuals/harness/hooks.md`, `flightdeck/manuals/harness/claude-code-facts.md`) are placed by this index only.

## Who reads what, and when

At most two manuals per role per stage; the stage numbers are those of `flightdeck/manuals/orchestration/journey.md`.

| role                              | manual                                                                                                   | read at                                                                                                                                                                                                                                      |
|-----------------------------------|----------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| human                             | `flightdeck/manuals/orchestration/journey.md`                                                            | before the first run, and at every gate as the map                                                                                                                                                                                           |
| human                             | `flightdeck/manuals/orchestration/endings.md`                                                            | G3 and stage 10                                                                                                                                                                                                                              |
| human (installing)                | `flightdeck/manuals/harness/hooks.md`                                                                    | once per repository, and whenever a run-log entry records `fixed on: tooling` (the axis for hooks, permissions, isolation, schemas and workflow scripts)                                                                                     |
| human (starting the orchestrator) | `flightdeck/manuals/harness/permissions.md`                                                              | stage 3                                                                                                                                                                                                                                      |
| human (opening a launch)          | `flightdeck/manuals/launch/launch-anatomy.md`                                                            | stage 2a, and from any session other than the orchestrator's on a repository where `fc launch status` reports an active launch                                                                                                               |
| human (assembling the kickoff)    | `flightdeck/manuals/orchestration/kickoff.md`                                                            | stage 3, and whenever a kickoff part changes                                                                                                                                                                                                 |
| human (diagnosing)                | `flightdeck/manuals/orchestration/run-log.md`, `flightdeck/manuals/orchestration/run-report.md`          | stage 10                                                                                                                                                                                                                                     |
| human (changing a role)           | `flightdeck/manuals/orchestration/crew.md`                                                               | stage 10, and when a run-log entry's `promote:` line moves a repeated rule into a role definition                                                                                                                                            |
| `test-builder`                    | `flightdeck/manuals/testing/testing-description.md`, `flightdeck/manuals/testing/testing-conventions.md` | stage 2b, named in its dispatch                                                                                                                                                                                                              |
| `planner`                         | `flightdeck/manuals/orchestration/planning.md`, `flightdeck/manuals/orchestration/run-log.md`            | stage 4                                                                                                                                                                                                                                      |
| `orchestrator`                    | `flightdeck/manuals/orchestration/planning.md`, `flightdeck/manuals/orchestration/review.md`             | stage 4 (with the planner) and stage 8; its conduct is `flightdeck/launch/<L>/kickoff.md`, not a manual                                                                                                                                      |
| `orchestrator` (workflow shape)   | `flightdeck/manuals/harness/workflows.md`                                                                | stages 4, 6 and 8                                                                                                                                                                                                                            |
| `implementer`, `verifier`         | none                                                                                                     | their inputs are only those named in the dispatch; `fc worker render` and `fc verifier render` carry everything they may act on                                                                                                              |
| `explorer`                        | none                                                                                                     | its inputs are only those named in the dispatch; the dispatch is rendered from `flightdeck/flightcrew/templates/explorer-dispatch.template.md` by the orchestrator or by `fc-explore.js`, and its answer is stored with `fc return explorer` |

## Roles whose manual content is baked into their definition

Their conventions are encoded in their definitions under `flightdeck/flightcrew/crew/`, so nothing is loaded into their context beyond the dispatch. The roles in the table above marked "none" read no manual at session time either.

| role            | manuals encoded in its definition                                                                                                                                                                    | dispatched with                                                                                                                                |
|-----------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `spec-builder`  | `flightdeck/manuals/spec/spec-description.md`, `flightdeck/manuals/spec/spec-conventions.md`, `flightdeck/manuals/spec/verification-addendum.md`, `flightdeck/manuals/versioning/spec-versioning.md` | the fixed paths listed in `flightdeck/flightcrew/crew/README.md` (template, schema, rubric, validator, linter, run log, canonical spec folder) |
| `spec-judge`    | `flightdeck/manuals/rubrics/spec/spec-readiness-rubric.md`                                                                                                                                           | the rubric and the draft, nothing else                                                                                                         |
| `spec-attacker` | `flightdeck/manuals/spec/spec-description.md`, `flightdeck/manuals/spec/spec-conventions.md`                                                                                                         | the draft and the project, nothing else                                                                                                        |
| `critic`        | `flightdeck/manuals/orchestration/review.md` (the mandate, the checklist, the four finding kinds, the `no gaps` exit)                                                                                | the sealed file `fc critic render` writes                                                                                                      |

## The manuals

Orchestration (`flightdeck/manuals/orchestration/`):

- `journey.md`: the stages with their commands, the three gates, the exits and re-entry table, the sessions-and-agents visibility table, the folder.
- `planning.md`: whether to run, inputs, the seven phases, decomposition rules, `plan.json` and the rules `fc validate plan` enforces, budgets, the gate-1 checklist.
- `kickoff.md`: the routing test, the library under `flightdeck/flightcrew/templates/kickoff/`, anatomy, assembly and validation, the before-sending checklist.
- `review.md`: the sealed room `fc critic render` builds, the mandate, the four finding kinds and their routing, the loop and its cap, kinds of pass, the human's review.
- `endings.md`: the three endings and their `fc launch end` outcomes, the abandon sequence, the salvage table, retry rules, partial acceptance, merge discipline, the three checklists.
- `run-log.md`: the three axes, the entry `fc launch end` inserts into `flightdeck/launch/RUNLOG.md`, practice, promotion.
- `run-report.md`: provenance marks, the eight sections of `report.md`, how claims are judged, what `fc report` reads.
- `crew.md`: roles and the separations they serve, from role to definition, design rules, team shapes, anti-patterns; the roster is `flightdeck/flightcrew/crew/README.md`.

Harness (`flightdeck/manuals/harness/`):

- `hooks.md`: each hook, its event and exit semantics, install steps, troubleshooting, the shell-write hole and its backstops.
- `permissions.md`: the orchestrator start line, the headless form, allow and deny recommendations per role, the sandbox, isolation.
- `workflows.md`: the three scripts, when to choose the workflow shape, persisting payloads with `fc return`, the `/workflows` controls.
- `claude-code-facts.md`: the Claude Code behaviour the harness relies on, with the documentation date it was verified against.

Launch (`flightdeck/manuals/launch/`):

- `launch-anatomy.md`: `launch.json` fields, folder layout, statuses and phases, the command-by-phase table, `FLIGHTCREW_LAUNCH` in side sessions, staleness.

## Frozen manuals

These files must not be edited. Calibration evidence — bench chains and human grades produced against their exact text — cites them, and that evidence cannot be reproduced, so an edit invalidates it.

- `flightdeck/manuals/spec/spec-description.md`: the nine domains of a spec.
- `flightdeck/manuals/spec/spec-conventions.md`: the conventions a spec file follows.
- `flightdeck/manuals/spec/verification-addendum.md`: verification for agent-shaped work and the class tags.
- `flightdeck/manuals/testing/testing-description.md`: the seven classes of check.
- `flightdeck/manuals/testing/testing-conventions.md`: the conventions a tests map and its checks follow.
- `flightdeck/manuals/versioning/spec-versioning.md`: spec versioning, node status and the retired registry.
- `flightdeck/manuals/versioning/tests-map-versioning.md`: tests-map versioning, check status and the retired registry.
- `flightdeck/manuals/rubrics/spec/spec-readiness-rubric.md`: the readiness rubric the spec-judge applies; earlier versions under `flightdeck/manuals/rubrics/spec/deprecated/`.

## Historical paths

- The `dev/...` paths quoted inside `flightdeck/manuals/rubrics/spec/`, `flightdeck/testbench/benches/rubrics/spec/` and `flightdeck/testbench/suites/validate-spec/` are historical: nothing in this system reads them, and they are never resolved against the current tree.
- The live homes are `flightdeck/testbench/benches/rubrics/spec/experiments/` for new bench chains and `flightdeck/launch/specs/<S>/` for specs.

## Conventions every manual follows

This index is governed by these conventions too.

- Every path in every manual, and in this file, is written in full from the repository root, beginning `flightdeck/`. `$REPO` is the repository root; `<S>` is a spec name, `<L>` a launch name, `<T>` a check id, `<G>` a gate.
- One rule per line where the source is a rule; a table where the source is a table; no narrative.
- Durable: no references to any one working session, written for any model.
- A manual is a setup file, like a crew definition, a kickoff part, a hook or a settings fragment. Changing one follows the same procedure as changing any other setup file: make the edit in a reviewed diff, and record it as the `change` field of a run-log entry, as `flightdeck/manuals/orchestration/run-log.md` describes.
