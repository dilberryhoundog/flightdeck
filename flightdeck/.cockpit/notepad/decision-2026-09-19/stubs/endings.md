# Endings

Stub: existing knowledge only, not validated, not to be cited as authority.

## How a run ends
The build workflow runs; green checks and a passed review open a pull request. The commander reads the reports, not just the PR, then decides.

## Outcomes
Merging accepts the run. Rejecting closes the PR and deletes the branch; the run log is filled in before the next attempt.

## The final gate
The ending offers exactly two choices: start again or merge.

## Cleanup
Cleanup, such as removing worktrees, is the workflow's job, not a manual step.

## Not settled
- Who writes the run log
- When a launch, as distinct from one run, counts as done
- cleanup, pilot or workflows job?
