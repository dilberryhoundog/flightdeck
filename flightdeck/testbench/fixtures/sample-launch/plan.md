# Plan: export-html · export-html-1
spec: specs/export-html/spec.v1.json @ a1b2c3d · shape: session · kickoff: base@1+shape-session@1+task-feature@1
expected cost: 7 agents · 150 minutes · models: haiku (explore) / opus (unit) / fable (critic)

## Approach
Fix the exporter's signature and the project and warning shapes first (wave 0, contract check T3), then build the document and its edge handling as two parallel feature units against the reference project, and close with one proof unit that lands the acceptance smoke; nothing outside src/export/ changes, and the pre-written checks under tests/export/ are locked for the whole run.

## Waves and units
| wave | mode | unit | name | kind | spec refs | checks | owner | budget | paths | depends on | pilot |
|---|---|---|---|---|---|---|---|---|---|---|---|
| W0 | serial | U0 | contracts | contracts | I1, I2 | T3 | implementer | 15 | src/export/** | — | — |
| W1 | parallel | U1 | exporter-core | feature | B1, B2, B3, B4, B5 | T2 | implementer | 25 | src/export/** | U0 | yes |
| W1 | parallel | U2 | edges-and-invariants | feature | E1, E2, E3 | T4, T5 | implementer | 20 | src/export/** | U0 | — |
| W2 | serial | U3 | proof | proof | B1 | T1 | implementer | 10 | src/export/** | U1, U2 | — |

## Risks
- U1 and U2 both edit src/export/index.mjs; U2 lands after U1 in wave order, and a conflict aborts fc worker merge and stops dispatch — reaction: watch (source: explorer X1)

## Gates
- G1: plan.md read against the spec: units verifiable by named checks, waves respect coupling, budgets and abandon triggers present
- G2: contract check T3 green since lock_commit and the changed-since-lock list confined to src/export/
- G3: evidence page: five checks with raw output, critic findings and their state, boundary and locked results, the cost line

## Abandon triggers
- T1 red after 3 consecutive stop blocks in phase verify — observable by: stall and trigger events in events.jsonl; fc budget consecutive stop blocks
- any edit outside src/export/ and tests/export/, or any change under a locked path — observable by: boundary_denied or lock_denied events; fc boundary or fc locked exit 2
