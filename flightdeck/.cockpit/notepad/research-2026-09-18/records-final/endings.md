<!-- DRAFT record, T006, 2026-09-18, contested by the adversary, validated, discovery-checked; awaiting the commander's review (DS003, P009). Removed at landing. -->

# Endings

Source: topic `endings` (`../logs/topics/endings.json`); commander turns at `8fdc3b29:3039`, `8fdc3b29:8574`, `9b679556:3271`, `9b679556:3683`, `9b679556:3684`, `9b679556:6718`, `9b679556:7261` in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`; second pointer `notepad/research-2026-09-18/source/launch-and-run.md`; researched 2026-09-18 by T006 record-writer. Companion records: `launches-and-runs.md`, `state-and-freezing.md`.

## How a run ends

The commander's own account (`9b679556:3683`):

> "the build workflow runs, if green and review passes it ends a PR is opened. I am informed and I read the reports check stuff out (I don't just look at the PR). if happy I merge, if not a fill in runlog and try again. reject PR delete branch."

The machine's part is green checks, a passed review and an open pull request. The decision is the commander's, and they take it after reading the reports, not the pull request alone. A rejected run has its request rejected and its branch deleted, and the run log is filled in before the next attempt.

## The final gate

The ending is the last of the three points where a human decides, and it offers exactly two choices: "final gate is to start again or merge" (`9b679556:3271`). The other two, and what a gate is, are in `state-and-freezing.md`.

## Cleanup

"workflow can clean up worktrees etc." (`9b679556:3684`). Cleanup is the workflow's job, not a command the commander runs.

## What is unsettled here

Two things, and neither should be invented.

Who writes the run log is not settled. The commander raised it as an open question about the size of the command surface at an ending: "I have another domain. Endings. I assume the command surface is big here and that is a problem. pretty sure the agent wrote the runlog, not sure if that is handled in the system?" (`8fdc3b29:8574`). Elsewhere they describe writing it themselves, in `launches-and-runs.md`.

When a launch, as against a run, is done has never been stated in one sentence. Do not assemble one. The nearest material is the retry rule at `8fdc3b29:3039`, the branch topology at `9b679556:6718`, and a sentence that closes a paragraph about what the whole orchestration toolkit is for rather than about one launch: "If a users idea of a piece of work can be handed over and agents build it for them, this work has been completed" (`9b679556:7261`). Ask the commander when a launch's completion is at stake.
