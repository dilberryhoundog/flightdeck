# Branch manifest — 2026-09-18 (temporary, for the merge cleanup)

Commander's rule (2026-09-18): branch cleanup is a merge cleanup. No branch is deleted until its changes are merged higher. Merging the characterization branch should help; the exact merge state is not finalised. "Replicated upstream" below means every commit is reachable from some origin ref, measured by the pilot with `git merge-base --is-ancestor` against every `origin/*`. Nothing here has been deleted.

## Working lines (keep)

- `cockpit` — the pilot's branch, pushed after each session.
- `main` — 2 local commits ahead of origin/main (both contained in origin/cockpit). Push.
- `flightcrew-buildout` — the original all-in-one build; 7 local commits ahead of origin (includes 1c81888 doctrine). Not merged higher. Push, then merge decisions belong to the core mission.
- `flightcrew-core` — the held launch-1 spec plus the void run's 47 suites. No upstream. Not merged higher. Push.
- `flightcrew-characterization` — the suite's base plus one workspace commit; 1 ahead of origin. Receives run 2 at merge.
- `run/flightcrew-characterization-2` — the finished suite, replicated upstream, not merged higher (16 past its base). The merge that starts the cleanup.

## Pending a decision (do not touch)

- `flightcrew-characterization-1/contracts` — 31 files of protocol fixes from abandoned run 1, no upstream, held to salvage or delete (RUNLOG). Decision inside the suite-landing work.

## Early lines, not merged higher (keep until decided)

- `engage-crew` — role-by-role build, 1 local commit ahead of origin, forked before the lineage. Its last refinement (716fe4b) never reached main. Not merged higher.
- `constitution-research` — the orchestration principles, replicated upstream, never merged anywhere. Genesis doctrine the commander wants maintained. Not merged higher.
- `rubric-testing` — judge calibration experiments, no upstream, never merged. Not merged higher.

## Contained in a successor and replicated upstream (candidates once the successor merges higher)

- `flightcrew-buildout-v1` — ancestor of flightcrew-buildout (PR #1). Replicated at origin/flightcrew-buildout. Goes when buildout's fate is settled.
- `run/flightcrew-core-1` — ancestor of flightcrew-core. Replicated via origin/flightcrew-characterization. Goes with core's merge.
- `run/flightcrew-characterization-1` — ancestor of flightcrew-characterization. Replicated. Goes with the suite merge.
- `flightcrew-characterization-2/contracts`, `flightcrew-characterization-2/roles-workflows-distributed` — unit branches folded into run 2 by the wave merges. Replicated at origin/run/flightcrew-characterization-2. Go with the suite merge.
- `worktree-wf_2fdadce5-244-{1,2,3,4}`, `worktree-wf_835932ae-12f-1`, `worktree-wf_9641b63f-a15-1` — workflow worktree branches from run 2, all contained in run 2 (the last two contained in the characterization base). Replicated. Go with the suite merge.
