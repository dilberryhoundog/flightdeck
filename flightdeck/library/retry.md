---
shelf: library
sources:
  - flightdeck/policies.md
  - flightdeck/skills/team-plans/SKILL.md
  - .flightdeck/build-1/README.md
  - .flightdeck/build-1/constraints.md
checked: 2026-10-11
from: origin/flightcrew-buildout:flightdeck/manuals/orchestration/endings.md (edited)
---

# Retrying and stopping

How a piece of work ends, and why a retry is a new experiment against a better setup, never a continuation.

## The rule

Setup carries over. Run output does not.

Setup is what you decided before the run: the owner's lines in `constraints.md`, the workshop's `context.md` and `verify.md`, and the checks. Run output is what the run produced: the code, the branch, the transcripts and the summaries.

A retry keeps the first and throws away the second. That is the only way a retry teaches you anything.

## Three endings

- Accept: the checks pass, the readers find nothing open, and the owner merges.
- Retry: the work is stopped at a finding, the setup is changed, and a fresh run starts.
- Accept some, retry the rest: each pull request is judged on its own, so one can be merged and another retried.

Going on past a reason to stop is not an ending. It is the expensive one.

## Stopping cleanly

1. Stop at the finding. When a check fails for a reason that matters, or a question cannot be settled, send out nothing new.
2. Write down why. Put the finding and the cause in the attempt's report, so the next run can read it.
3. Change the setup. Fix the brief, the context, the check or the rule that let the failure happen. The change is written down, with the reason.
4. Start fresh. A new run begins in a new session with the improved setup.

- Never resume the failed session. It carries every assumption that produced the failure, and "lessons learned" added on top do not remove them.
- An agent that returns `blocked` or `contradiction-found` is asking for a decision, not for a workaround. Give the decision.

## One change per retry

- Make one change and name it at the top of the new attempt's brief. Then the difference between the two runs is the change, and you can tell whether it helped.
- If several fixes were forced, say which one this retry tests. The others ride along, unattributed.
- A retry with no change asks no question. Do not run it.

## What carries over and what does not

- The owner's lines in `constraints.md`: carry over. They are the truth.
- The workshop's `context.md` and `verify.md` and the checks they name: carry over. They describe the work, not the run.
- The earlier attempt's findings and report: carry over, as input. "The reader looks in file X" survives; conclusions drawn for the failed approach are read with doubt.
- The failed attempt's code and branch: do not carry over as a base. Reading them to save time imports their assumptions.
- The transcripts: do not carry over. The report holds what they taught.

## Each pull request on its own

Keeping the good parts is done per pull request. A build with several pull requests can accept some, retry one and drop another. Each retry makes a new branch and a new attempt folder for that pull request alone.

Do not keep the good parts of one tangled change. Taking some of a failed diff and calling it accepted is salvage, not acceptance.

The steps for build-1 are in [workshops and launches](../manuals/operator/workshops-and-launches.md): add a dated line starting `PR <n>:` to the workshop's `constraints.md`, then ask the pilot to retry that pull request.

## Merging

- The owner merges. No agent merges a pull request, and no guard enforces it: it is stated in `flightdeck/policies.md`.
- Agents never delete branches. An earlier attempt's branch and pull request stay until the owner closes them. Clearing old ones is the owner's housekeeping.
- Merge on the evidence, not on the story. "All units done" is a report. The checks passing on the branch you are about to merge is evidence.

## Checklists

Stopped cleanly:

- Stopped at the finding, and nothing was sent out after it.
- The cause is in the report, and the setup change is written down with its reason.
- The failed session was not resumed.

Ready to retry:

- The report names the cause and the change is made, exactly one under test.
- The owner's lines are unchanged, or changed by the owner.
- Only setup was carried over; no code from the failed run.

## Mistakes to avoid

- Patching past the stop: carrying on after the reason to stop, then paying for the diagnosis later.
- Resume as retry: reopening the failed session "with lessons learned".
- Salvaging the diff: pasting the failed run's partial work into the retry.
- The changeless retry: running again with nothing altered.
- The quiet shift: editing the brief between runs without saying so, so the comparison between runs is fiction.
- Merging on a story: accepting "all done" without running the checks on the branch.
