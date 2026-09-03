# The run log

`launch/RUNLOG.md` is the structured memory of what went wrong with a run's setup and what changed as a result: the document the spec template, the kickoff library, the crew and the hooks are iterated against. Abandoning a run only pays off if something remembers why. Read by the planner and the orchestrator before planning (stage 4) and written by the human at the ending (stage 10).

## What it is

- Not the transcript: session logs are complete and unreadable; the log is what a person concluded from them.
- Not the evidence page or the report: those show what a run proved and what happened; the log records what the run taught about the setup.
- Not git history: commits record what changed in the code; the log records why the template, kickoff or hooks changed.
- Not a diary: one entry per run, one diagnosis, one change.
- The loop it closes: drift appears on the evidence page or at a gate; the run is abandoned, not patched; one entry names the axis; the setup is changed; the next run starts clean with the log read first.
- Blameless: the question is never who failed but what about the setup allowed it and what changes so it cannot recur the same way.

## The three axes

| axis | symptom | points at |
|---|---|---|
| context | the orchestrator or a worker did not know something a person would have known: a convention, a constraint, a file, what done meant, what was out of scope | the spec (a missing behaviour, scope line or decision), a kickoff part, the constitution, a skill, a crew definition |
| verification | the run went green and the result was wrong; an agent iterated on a failing check without converging; a check was weakened to pass | a missing or unmapped check, an unlocked path, a false green with no end-to-end proof, a flaky or noisy check, a gate that was not deterministic |
| tooling | an agent could not do or see something: ambiguous tool output, a permission block, workers colliding on files, a handoff that lost structure | a hook, an allow or deny rule, worktree isolation, a return schema, `fc` availability, a workflow script's stage boundaries |

- Most failures present on one axis and are caused on another; record both (`seen on`, `fixed on`); over several entries the `fixed on` column says where to invest.
- "The model was not good enough" is not an axis; it produces no change to the setup; force the entry onto one of the three, and if it will not go, the run was under-observed and that is the finding.
- A permission prompt after G2 is a tooling-axis entry; a stall at the stop gate is a verification-axis entry until the diagnosis says otherwise.

## An entry

`fc launch end` inserts the stub through `fc runlog stub`: after the first heading (`# Run log`, created when absent), newest first, headed `## <ended date> · <spec name> · <launch name>`, one `<field>: <value>` line per field. Mechanical fields are filled from `launch.json` and the evidence; judgement fields read `<fill>` until the human writes them.

| family | fields |
|---|---|
| accepted, accepted-with-reservations | `spec` (path @ commit), `kickoff` (version), `outcome`, `cost`, `kept: <fill>`, `reservation: <fill>` |
| abandoned, partial | `spec`, `kickoff`, `outcome` (with `--at`), `cost`, `symptom` (pre-filled from the ending event), `seen on: <fill>`, `cause: <fill>`, `fixed on: <fill>`, `change: <fill>`, `watch: <fill>`; optional `kept:`, `promote:` |
| partial only | plus `landed:` and `abandoned:` listing the units |
| any | `observations:` from the last critic pass follow the fields |

```
## 2026-08-26 · export-html · export-html-3
spec:      flightdeck/launch/specs/export-html/spec.v1.json @ a1b2c3d
kickoff:   base@1+shape-session@1+task-feature@1
outcome:   abandoned at G2
cost:      6 agents · 4 stop blocks · 40 min · tokens not recorded
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

- Write it at the moment of ending, while the evidence page is open; an entry written the next day is a reconstruction.
- One change per run where possible; when a failure demands several fixes, make them and mark in `watch` which one the next run is testing.
- Attribute to the setup, not to the agent; the agent is not a variable the log can change.
- Read the log before every kickoff: `fc runlog show --spec <S>` is step one of planning, and every logged failure for the area becomes a `source: runlog` risk in the plan (validate-plan warns when a risk names a heading that does not exist).
- Run a pattern pass every few entries: the axis that keeps appearing under `fixed on` is the pillar to invest in next; three context fixes in a row means the spec template or the interview needs work, not the next spec.
- Let `fc` draft and the human diagnose: the stub fills spec, kickoff, outcome, cost and symptom; the axis, the cause and the change are judgements the run could not make.
- Commit the entry together with the setup change it describes, so the history of the log and the history of the library line up.

## Promotion

- A rule that appears in two or three entries graduates into a more permanent home: the constitution for a universal convention, a hook or `fc` refusal for a rule that must fire every time, the spec template or the kickoff library for a structural gap, a crew definition for a role's conduct.
- Once promoted, it stops being logged; the `promote:` line marks the candidate and the entry that promoted it says so.
- The log stays short because its findings keep leaving it; a rule logged five times and still living only in the log should have become a hook after the second.
- Retire the same way: a promoted rule that a hook now enforces is pruned from the kickoff part that carried it.

## Anti-patterns

- The transcript dump: agent output pasted into the entry; the diagnosis never gets written because the dump feels like one.
- The blame log: what the agent did wrong rather than what the setup allowed; produces no change.
- The write-only log: entries accumulate and the kickoff never reads them; the tell is a fix that was already logged.
- The unbounded entry: paragraphs where fields belong; a log that cannot be scanned cannot reveal a pattern.
- No successes recorded: only failures logged, so the next change removes something that was quietly essential.
- Never promoting: the same rule logged repeatedly and still living only in the log.
