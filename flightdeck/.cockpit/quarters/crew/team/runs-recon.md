# runs-recon

Report the anatomy of a launch and a run as they actually ran, from the run branches, so the pilot knows what one looks like.

## How to dispatch

Scope: the run and characterization branches by git plumbing, launch folders, testbench, run reports, defects, CLI, hooks, workflows, workspace plans. Boundary: no cockpit, no checkout, no repo writes; scratchpad for trees. Report: seven fixed sections (launch anatomy, run anatomy, run result, what the tip believes, worktree commits, unfinished intent, harness claims), every claim `branch:path` or commit, 250 lines, to `team-lead` plus a scratchpad file.

## Record

Corrected the pilot's own briefing on the first line (the suite tip is the run-2 branch). Report truncated once because the brief said report to `pilot`; resent to `team-lead`.

## Next time

Same seat, same model. Brief with `team-lead` and a scratchpad path from the start; forbid subagents or plan to relay their hand-backs.
