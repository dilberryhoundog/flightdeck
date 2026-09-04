# The run log

`flightdeck/launch/RUNLOG.md` is the structured memory of what went wrong with a run's setup and what changed as a result: the document `flightdeck/flightcrew/templates/spec.template.json`, the kickoff library under `flightdeck/flightcrew/templates/kickoff/`, the crew under `flightdeck/flightcrew/crew/` and the hooks under `flightdeck/flightcrew/hooks/` are iterated against. The planner and the orchestrator read it at the start of planning; the human writes the entry after `fc launch end`.

`fc` is `flightdeck/flightcrew/bin/fc`, invoked from the repository root (`node flightdeck/flightcrew/bin/fc.mjs <command>` where the wrapper is unavailable); the short `fc` form below means that binary. The gates are G1 (plan), G2 (contracts) and G3 (report); the stop gate is the hook that holds the turn on failing checks.

## What it is

- Not the transcript: session logs are complete and unreadable; the log is what a person concluded from them.
- Not the evidence page or the report: those show what a run proved and what happened; the log records what the run taught about the setup.
- Not git history: commits record what changed in the code; the log records why the template, kickoff or hooks changed.
- Not a diary: one entry per run, one diagnosis, one change.
- The loop it closes: a red check, an out-of-boundary edit or a gate refusal appears on the evidence page `flightdeck/launch/<L>/evidence.html` or at a gate; the run is abandoned, not patched; one entry names the axis; the setup is changed; the next run starts clean with the log read first.
- Blameless: the question is never who failed but what about the setup allowed it and what changes so it cannot recur the same way.

## The three axes

| axis | symptom | points at |
|---|---|---|
| context | the orchestrator or a worker did not know something a person would have known: a convention, a constraint, a file, what done meant, what was out of scope | the spec (a missing behaviour, scope line or decision), a kickoff library part under `flightdeck/flightcrew/templates/kickoff/`, the project constitution built from `flightdeck/flightcrew/templates/constitution-fragment.md`, a skill, a crew definition under `flightdeck/flightcrew/crew/` |
| verification | the run went green and the result was wrong; an agent iterated on a failing check without converging; a check was weakened to pass | a missing or unmapped check, an unlocked path, a false green with no end-to-end proof, a flaky or noisy check, a gate that was not deterministic |
| tooling | an agent could not do or see something: ambiguous tool output, a permission block, workers colliding on files, a handoff that lost structure | a hook under `flightdeck/flightcrew/hooks/`, an allow or deny rule, worktree isolation, a return schema under `flightdeck/flightcrew/schemas/`, `fc` availability, the stage boundaries of a workflow script (`flightdeck/flightcrew/workflows/*.js`, installed to `.claude/workflows/`) |

- Most failures present on one axis and are caused on another; record both (`seen on`, `fixed on`); over several entries the `fixed on` column says where to invest.
- "The model was not good enough" is not an axis; it produces no change to the setup; force the entry onto one of the three, and if it will not go, the run was under-observed and that is the finding.
- A permission prompt after G2 is a tooling-axis entry; a stall at the stop gate is a verification-axis entry until the diagnosis says otherwise.

## An entry

`fc launch end` inserts the stub through `fc runlog stub`: after the first heading (`# Run log`, created when absent), newest first, headed `## <ended date> · <spec name> · <launch name>`, one `<field>: <value>` line per field. Mechanical fields are filled from `launch.json` and the evidence; judgement fields read `<fill>` until the human writes them.

| family | fields |
|---|---|
| accepted, accepted-with-reservations | `spec` (name, version @ commit), `kickoff` (version), `outcome`, `cost`, `kept: <fill>`, `reservation: <fill>` |
| abandoned, partial | `spec`, `kickoff`, `outcome`; the `--at` stage is recorded in the ending event and surfaces in the pre-filled `symptom`, not in `outcome`; `cost`, `symptom` (pre-filled from the ending event), `seen on: <fill>`, `cause: <fill>`, `fixed on: <fill>`, `change: <fill>`, `watch: <fill>`; optional `kept:`, `promote:` |
| partial only | plus `landed:` and `abandoned:` listing the units |
| any | `observations:` follow the fields, copied by `fc runlog stub` from the newest critic pass file in `flightdeck/launch/<L>/review/`; they arrive pre-filled |

```
## 2026-08-26 · export-html · export-html-3
spec:      export-html v1 @ a1b2c3d
kickoff:   base@1+shape-session@1+task-feature@1
outcome:   abandoned
cost:      6 agents · 4 stop blocks · 40 minutes · not recorded
symptom:   contracts check T4 failed 4 times; two units defined incompatible Warning shapes
seen on:   verification
cause:     the spec named Warning but did not say reuse the existing type; nothing stopped a redefinition
fixed on:  context
change:    spec template interfaces guidance: every referenced type says reuse by name
watch:     T4 passes first time on the next run
```

- `seen on` and `fixed on` take one of `context`, `verification`, `tooling`.
- `change` names one artefact and one edit; `watch` names what the next run would show if the change worked.
- An accepted run gets the short entry; recording what carried the run (`kept`) is what stops a later "improvement" from removing it.
- `fc runlog show [--spec S]` prints entries newest first; `fc runlog stub` re-inserts a stub by hand when needed.

## Practice

The orchestrator reads the log and carries its risks into the plan. The human writes `seen on`, `cause`, `fixed on`, `change` and `watch`, and commits the entry. An agent never writes a `<fill>` field.

- Write it at the moment of ending, while the evidence page is open; an entry written the next day is a reconstruction.
- One entry names one change; when several fixes ship together, `watch` names the one the next run tests.
- Attribute to the setup, not to the agent; the agent is not a variable the log can change.
- Read the log as the first action of planning, before `fc plan write`: `fc runlog show --spec <spec name>`, where the value is the spec name as it appears in the entry heading, not the spec path; and every logged failure for the area becomes a `source: runlog` risk in the plan (validate-plan warns when a risk names a heading that does not exist).
- Every fifth entry, the human runs a pattern pass: list the entries with `fc runlog show` and count the `fixed on` values. The axis that keeps appearing is the pillar to invest in next; three context fixes in a row means the spec template or the interview needs work, not the next spec.
- Let `fc` draft and the human diagnose: the stub fills spec, kickoff, outcome, cost and symptom; the axis, the cause and the change are judgements the run could not make.
- Commit the entry together with the setup change it describes, so the history of the log and the history of the library line up.

## Promotion

- A rule logged in two entries is promoted into a more permanent home: the constitution for a universal convention, a hook or `fc` refusal for a rule that must fire every time, the spec template or the kickoff library for a structural gap, a crew definition for a role's conduct.
- Once promoted, it stops being logged; the `promote:` line marks the candidate, and the promoting entry records `promote: <rule> → <artefact>`.
- The log stays short because its findings keep leaving it.
- Retire the same way: a promoted rule that a hook now enforces is pruned from the kickoff part that carried it.

## Anti-patterns

- No entry carries pasted agent output; the diagnosis is written in the fields.
- The blame log: what the agent did wrong rather than what the setup allowed; produces no change.
- Every entry names a setup change, and the plan that follows carries its risk line.
- Every field is one line; a log that cannot be scanned cannot reveal a pattern.
- No successes recorded: only failures logged, so the next change removes something that was quietly essential.
