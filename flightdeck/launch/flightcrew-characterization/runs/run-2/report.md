# flightcrew-characterization run 2 report

Spec `flightdeck/launch/specs/flightcrew-characterization/spec.v1.json`, tests map `tests-map.v1.json` (61 checks). Branch `run/flightcrew-characterization-2`, base `56ca431`, landing commit `4046d1e`. Built with custom workflows (implementer per unit in a worktree, verifier rerun per unit, up to two repair rounds); no flightcrew runner, no hooks-driven launch. Every agent ran on opus.

## Result

- 58 of 61 checks exit 0 on `4046d1e`, rerun from a cleared check cache after the last merge.
- `node flightdeck/testbench/run-all.mjs` exits 0: 33 suites ok, hygiene ok.
- 3 checks are red, none of them fixable inside the allowed paths; each is a check concern for the human below.
- Critic pass (opus) over `git diff 56ca431..4046d1e`: verdict pass, no blocking finding, four non-blocking observations below.

## Units

- U0 contracts: covers lines on this spec's ids, `defect()` helper and per-suite hygiene in `lib/suite-lib.mjs` and `run-all.mjs`, `case-map.json` (`{}`), README rewritten as the suite contract, three MANIFEST lines. Verified first round.
- U1 subcommands: all 35 subcommands named in `e2e` and the new `sub-commands` suite. Verified first round.
- U2 hooks and templates: new `hooks-decisions` and `templates-slots` suites. Refuted twice on `constitution-fragment.md`; its second repair pinned the heading against a requirement no manual states, so that commit was reverted (`3043f6c`) and T44 left red as a check concern.
- U3 roles, workflows, distributed files: `crew` and `workflows` suites, four crew defects pinned (T57 green). Verified first round.
- U4 schemas, validators, gates: `schemas`, `validate-*` and `unit-integration` suites, one defect pinned. Verified first round.
- U5 proof: defects file generated from suite output, roster reference moved to the row carrying the turns, README reference rule matched to the check. Verified first round.

## Check verdicts

| id | check | verdict |
|---|---|---|
| T1 | acceptance | green |
| T2 | part-coverage | green |
| T3 | part-coverage-selftest | green |
| T4 | sweep-subcommands-1 | green |
| T5 | sweep-subcommands-2 | green |
| T6 | sweep-subcommands-3 | green |
| T7 | sweep-subcommands-4 | green |
| T8 | sweep-subcommands-5 | green |
| T9 | sweep-subcommands-6 | green |
| T10 | sweep-hooks-1 | green |
| T11 | sweep-hooks-2 | green |
| T12 | output-protocol | green |
| T13 | output-protocol-selftest | green |
| T14 | map-kind-class | green |
| T15 | map-kind-class-selftest | green |
| T16 | scenario-declarations | green (empty under D3) |
| T17 | trial-records | green (empty under D3) |
| T18 | rubric-form | green (empty under D3) |
| T19 | sheet-refusal | green (empty under D3) |
| T20 | all-inconclusive | green (empty under D3) |
| T21 | fable-refusal | green (empty under D3) |
| T22 | fable-cap-records | green |
| T23 | threshold-precommitment | green |
| T24 | defect-markers | green |
| T25 | defect-markers-selftest | green |
| T26 | defects-file | green |
| T27 | defects-file-selftest | green |
| T28 | continuity | green |
| T29 | continuity-selftest | green |
| T30 | runall-hygiene | green |
| T31 | imports-and-packages | green |
| T32 | spec-copies | red (check concern 2) |
| T33 | spec-chain-bytes | green |
| T34 | no-remote-no-model | green |
| T35 | defect-references | green |
| T36 | hooks-wired | green |
| T37 | scope-untouched | red (check concern 3) |
| T38 | manifest-reflects-testbench | green |
| T39 | tests-map-valid | green |
| T40 | sweep-roles-1 | green |
| T41 | sweep-roles-2 | green |
| T42 | sweep-schemas-1 | green |
| T43 | sweep-schemas-2 | green |
| T44 | sweep-templates-1 | red (check concern 1) |
| T45 | sweep-templates-2 | green |
| T46 | sweep-templates-3 | green |
| T47 | sweep-templates-4 | green |
| T48 | sweep-validators-gates-1 | green |
| T49 | sweep-validators-gates-2 | green |
| T50 | sweep-workflows-1 | green |
| T51 | sweep-distributed-1 | green |
| T52 | sweep-distributed-2 | green |
| T53 | sweep-distributed-3 | green |
| T54 | suite-group-1 | green |
| T55 | suite-group-2 | green |
| T56 | suite-group-3 | green |
| T57 | suite-group-4 | green |
| T58 | suite-group-5 | green |
| T59 | suite-group-6 | green |
| T60 | suite-group-7 | green |
| T61 | suite-group-8 | green |

## Check concerns (reported, not edited)

1. T44 sweep-templates-1: `flightdeck/flightcrew/templates/constitution-fragment.md` has no `{{slot}}`, JSON key or version comment, so the alteration appends ` renamed` to its first heading. `fc distribute` prints the file as it stands, nothing in flightcrew or its manuals reads that heading, and no `CLAUDE.md` exists, so only a snapshot of the heading text can turn a case red. `suites/_checks/fixtures/sweep-exempt.json` is locked and empty. The part is named (T2 green) and its case asserts `fc distribute --apply` prints the fragment. Deciding between an exemption and a different alteration is the human's call.
2. T32 spec-copies: red at the run's base before any unit ran. The three `spec.v1.json` copies differ from the frozen spec at `eca2bba`, and changes sit under two launch folders (`flightcrew-characterization`, `flightcrew-characterization-1`), both from the run-2 setup commits that re-pointed the spec and map (`cfc9b21`, `56ca431` and earlier). `check-lib.mjs` hard-codes `SPEC_COMMIT` `ee8c088` and `FREEZE_COMMIT` `eca2bba`.
3. T37 scope-untouched: red at the run's base before any unit ran. Since `ee8c088` the setup commits changed `flightdeck/flightcrew/crew/{critic,explorer,implementer,verifier}.md`, `flightdeck/flightcrew/templates/worker-dispatch.template.md`, the matching `.claude/agents/flightcrew/` copies and `.claude/settings.json`. This run changed none of them.

## Defects pinned

Also at `flightdeck/launch/flightcrew-characterization/evidence/defects.md`.

- crew · `max-turns-on-every-role-except-the-four-named [defect]`: every role except orchestrator, spec-builder, spec-judge and spec-attacker carries an integer maxTurns, but explorer, verifier and critic carry none (`flightdeck/manuals/orchestration/crew.md:40`).
- crew · `new-roles-match-the-roster [defect]`: explorer, implementer, verifier and critic carry the roster turns 12, 25, 15 and 20, but explorer, verifier and critic carry no maxTurns and implementer carries 200 (`flightdeck/flightcrew/crew/README.md:16`).
- crew · `every crew body carries the inputs line [defect]`: spec-judge and spec-attacker carry no inputs line (`flightdeck/manuals/orchestration/crew.md:11`).
- crew · `every crew body is at most 60 lines [defect]`: the spec-builder body is longer (`flightdeck/manuals/orchestration/crew.md:51`).
- e2e · `fc launch gate G3 approve records a gate decision on a launch that has ended [defect]`: an ended launch should refuse a gate decision; today it exits 0 and records it (`flightdeck/manuals/launch/launch-anatomy.md:73`).
- validate-tests-map · `flightdeck/flightcrew/checks/validators/validate-tests-map.mjs judges coverage against the --spec file although the pinned spec sits beside the map [defect]`: the header says the spec beside the map is read first and `--spec` is the fallback; today `--spec` wins (`flightdeck/flightcrew/checks/validators/validate-tests-map.mjs:8`).

## Critic observations (non-blocking, left open)

- F1 (I2): the crew defect texts state the expected behaviour and then today's behaviour after "but"; I2 asks for what the behaviour should be only. The texts are accurate.
- F2 (E5): run-all charges only new `git status --porcelain` lines, so a write to an already-modified tracked file, inside an already-untracked directory or to an ignored path is not seen. The earlier run-all had the same limit.
- F3 (B2): the session-end case in `hooks-decisions` accepts either the evidence and report files or a `hooks.log` line explaining their absence, so a regression from writing to logging a failure stays green.
- F4 (B2): the worker-dispatch case in `templates-slots` labels `unit: U1` as the manual first line of a dispatch; no manual line states it. The case goes red for real reasons; that one assertion claims a source it does not have.

## Not done

- No scenario set was built (D3): the statistical and judged checks pass empty.
- The run-log entry in `flightdeck/launch/RUNLOG.md` is not stubbed; no `fc launch end` ran in a runner-free run.
- The reviewer's three acts on a fresh checkout and the transcript reading are the human's.
