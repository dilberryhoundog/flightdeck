# Endings

A run is over the moment trust in it stops. Every run ends one of three ways, each with its own `fc launch end` outcome and its own discipline; the undisciplined fourth, limping on past a fired trigger, is not an ending and is the expensive one. Read by the human at G3 and stage 10, and by the orchestrator when a trigger fires.

## Three endings

| ending | decided | recorded with | then |
|---|---|---|---|
| accept and merge | at G3, on green evidence, a converged critic and the human's review | `fc launch end accepted` or `fc launch end accepted-with-reservations` | the merge discipline below; the short run-log entry (`kept`, `reservation`) |
| abandon and retry | at a gate (`fc launch gate <G> exit`), on the evidence, or mid-run when a trigger fires or an escalation cannot be resolved | `fc launch end abandoned --at <gate|stage>` | the abandon sequence below; a fresh run against an improved setup |
| partial acceptance | at G3, unit by unit | `fc launch end partial --units U1,U3` | accepted units merge, abandoned units are discarded branches, the retry plan shrinks |

- The accepted family (`accepted`, `accepted-with-reservations`, `partial`) is refused while `evidence/summary.json.commit` differs from HEAD or the tree is not clean under the allowed paths; `abandoned` is always accepted.
- Every ending sets `outcome`, `status`, `ended` and phase `ended`, renders `report.md` and `evidence.html`, inserts the RUNLOG stub, appends `launch_end`, and prints the worktree and branch cleanup lines and the report path.
- Momentum never decides an ending; triggers written at planning time do.

## Abandoning

The tokens are spent whether or not the run continues; the run's product is the diagnosis, and the code was the packaging.

1. Stop at the finding: a halt return, a fired trigger or an escalation stops dispatch; the guards deny every edit while a trigger is fired, and `fc worker render`, `fc worker merge` and `fc launch phase` (except to ended) exit 2; let dispatched agents finish or stop them, dispatch nothing new.
2. Freeze the evidence: `fc launch end abandoned --at <gate|stage>` renders `report.md` and `evidence.html` as they stand; the Failures section and the stop-block count are the raw material of the diagnosis.
3. Write the run-log entry: the stub is already in `launch/RUNLOG.md` with `symptom` pre-filled from the ending event; fill `seen on`, `cause`, `fixed on`, `change`, `watch` now, not later.
4. Make the setup change: the spec node, the kickoff part, the hook, the mandate, the check; commit it together with the log entry so the fix and its reason travel together.
5. Clear the ground: run the printed cleanup lines (`git worktree remove`, `git branch -D <L>/<unit>`), `git worktree prune`; a failed unit is a discarded directory.

- Do not resume the abandoned session and do not carry its transcript forward; the next orchestrator meets the failure only through the run log, as a risk line in the new plan.
- An implementer's `halt` with kind `test-contradicts-spec` or `unsatisfiable` is an exit for a human decision, never a bug for the implementer to resolve.

## What a failed run may leave behind

| artefact | carries over | why |
|---|---|---|
| the spec | yes | setup; unless the spec was the failed axis, in which case the amended spec re-frozen at a new commit carries instead |
| the tests map and check scripts | yes | setup; they encode the spec, not the run; a wrong check was fixed by the human at escalation and re-pinned |
| wave-0 contracts | if proven | contract checks that went green describe seams, not implementations; inputs to the next plan, which may redraw them |
| explorer returns (`returns/explore-*.json`) | if factual | "the renderer lives in X" survives; conclusions drawn for the failed approach do not |
| `plan.json` | no | per-run by design; the next plan is generated fresh with the failure as a `source: runlog` risk |
| partial implementation on `<L>/<unit>` branches | no | output of a run that was stopped for a reason; reading it to save time imports its assumptions |
| the orchestrator transcript | no | the run log carries what it taught; the transcript carries how it felt |

## Retrying

- A retry is a new experiment against an improved setup, never the old run given another chance: `fc launch new` again, fresh session, frozen spec.
- One change per retry where possible; where several fixes were forced, the run-log `watch` line names which one the retry tests and the others ride along unattributed.
- Same spec commit, same kickoff parts except the bumped one, same crew except the changed file, so the difference between runs is the change.
- When the spec was the failed axis, it is amended and re-frozen at a new commit, and the new launch pins the new commit; the previous launch is named in `launch.json.previous_launch` automatically.
- Retry when the diagnosis names an axis and the change is made; demote to a single session when the failure pattern says the task never warranted the orchestra; shelve when the same axis has failed three runs straight.

## Partial acceptance

`fc launch end partial --units <list>` writes `accepted_units` and `abandoned_units` to `launch.json` and refuses, naming the unit and the reason, when a listed unit:
- depends on a unit outside the list other than the contracts unit;
- has no green return and no `unit_merged` event;
- has an open blocking finding under its paths.

- A unit clears the same bar it would in a successful run: checks green, individually reviewed, diff inside its boundary; nothing about the run's failure lowers it.
- The coupling condition does all the guarding: a unit stands entirely on wave-0 contracts, never on an abandoned unit; a unit whose checks pass only because they mock a seam a failed unit was to honour is waiting, not done.
- Partial acceptance is unit-level only: "keep the good parts" judged over a tangled diff is salvage of output wearing acceptance's clothes.
- The RUNLOG entry carries `landed:` and `abandoned:` lines listing the units; the retry's plan shrinks to the abandoned work.

## Merging

Acceptance judged the units; the merge proves the whole, because green branches can still make a red trunk.

- Units land in wave order through `fc worker merge <unit>` during the run (`--no-ff`, checks re-run, `unit_merged` appended); the merge to the parent branch extends the same order.
- Integrate before the trunk: rebase the run branch (`launch.json.branch`) or an integration branch built from it onto the current parent; run `fc verify` there; a unit's green from before the rebase says nothing about the rebased state.
- Open the PR from that branch with `launch/<L>/report.md` linked; let CI run the same gates.
- Merge, then `fc launch land --commit <sha> --pr <url> [--evidence-commit <sha>]`; it writes `landed {commit, pr, integration_check}` and refuses while no evidence at that commit has zero fail and error counts.
- Land it readable: one squashed commit per unit or one commit per merge, unit names matching branches matching evidence sections.
- Close the run: fill the run-log fields, prune worktrees, delete `<L>/*` branches, promote confirmed rules; the ground is clear for the next run.
- The merge gate is the shortest human read: integration proof green on the rebased state, CI green, cost line closed; a merge that needs discussion is a review that ended too soon.

## Three checklists

Abandoned cleanly:
- Stopped at the finding; nothing dispatched after the trigger or the halt.
- `fc launch end abandoned --at <where>` run; run-log diagnosis fields filled and the setup change committed together.
- Branches deleted, worktrees pruned, the session not resumed.

Ready to retry:
- The run-log entry names an axis and the change is made, exactly one under test (`watch` says which).
- Spec unchanged, or amended and re-frozen with the new launch pinning the new commit.
- Salvage passed the setup-versus-output test; the new plan carries the failure as a `source: runlog` risk.

Ready to merge:
- Every landing unit green, individually reviewed, standing only on wave-0 contracts (`fc launch end` enforced the partial rules where they apply).
- Integration branch rebased on the current parent; `fc verify` green there; CI green.
- Wave-ordered landing; `fc launch land` recorded; success entry filled; worktrees and branches cleared.

## Anti-patterns

- The zombie run: patched past its fired trigger; the spend is gone either way and the diagnosis is skipped.
- Resume-as-retry: the abandoned session reopened "with lessons learned"; the lessons live beside every assumption that produced the failure.
- Salvaging the diff: the failed run's partial implementation pasted into the retry.
- The changeless retry: running again with nothing altered asks no question.
- The quiet spec shift: the spec edited between runs without re-freezing, so the log's comparison is fiction.
- Merging on narrative: "all units done" accepted without `fc verify` on the rebased branch.
- The big-bang landing: every branch merged at once; a failure with eight parents.
- The haunted repository: worktrees and branches from abandoned runs still standing; abandonment ends with clear ground.
