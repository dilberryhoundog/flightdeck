<!-- SOURCE material, T002, 2026-09-18. Fully referenced and verified; not a record. The commander ruled on 2026-09-18 (commanders-desk/out-advice/DS002.md) that records are sharp, current-form and timeless, and these are the source they are extracted from. -->

# Launch and Run

Purpose: the pilot manages launches and runs, so the pilot must hold the commander's definition of both and know exactly where the built runner disagrees with it.

Researched by: T002 (certified research team, mission M001), records seat, from the `transcript-miner` seat's sweep of ten session transcripts and the T001 recon report T001 `runs-recon` (Opus). Research date: 2026-09-18. Codebase claims were researched at `run/flightcrew-characterization-2` `4fd81d8` and `flightcrew-core` `27f6969`. The two governing quotations below were re-read from the transcript by the records seat; the pilot independently opened five of the miner's cited lines and found all verbatim.

Source: commander turns in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`, cited as `<session>:<line>`. The line is the line the quoted sentence sits on, as `grep -n` returns it, so every citation can be checked with one command. The turn it belongs to is the nearest `[USER]` marker above it. Every quotation was confirmed to fall inside a genuine commander turn and not a task-notification wrapper.
Source: `advice`, the commander's written correction, 2026-09-18.

Two warnings on sources. `flightcrew-buildout:dev/workspace/plans/flightcrew-features.md` reads like the commander's roadmap and is not: it was commissioned from Claude at `9b679556:2160` and its crisp definitions are Claude's compression, several with no commander original. Cite it as that, never as the commander's words. And in the turn at `9b679556:7650` the long passage beginning "Yes, and the three rules are right" is a pasted reply from web Claude, not the commander; the seam falls immediately after the question mark that precedes it.

## What a launch is

The governing formulation is `8fdc3b29:3039`, dated 2026-09-08. The commander typed the layout as a literal tree:

```
launch/
  <name>/
    specs/
      interview/
      spec.v1.json
      test-map.v1.json
    runs/run-<n>
      run outputs...
  FLIGHTLOG.md
```

and explained it in one sentence: "This might be better all in a single folder, a new launch builds a new feature, a launch instance retries until it succeeds, no duplicated specs single source of truth."

So a launch is the piece of work. It builds a feature. It owns the spec series and the interview that produced it, it holds every attempt, and it persists until it succeeds. DS001 states the same thing in the commander's later words: a launch is "an intent to complete a piece of work and includes all the infrastructure to do this", including runs as attempts, the spec and its versions as runs converge on done, and the run-generated artefacts. A launch is explicitly not one run of one spec.

Two earlier formulations from the same session are superseded and a pilot will meet both in older documents. At `8fdc3b29:202` the commander first wrote "launch = run, run/awesome-run = run instance", making launch the piece of work but calling the attempt a run instance. At `8fdc3b29:2988` they briefly split the work from the attempt across two top-level folders, `mission/<name>` and `launch/<mission-name>-<n>`. That is where the word mission entered, and it survives afterwards only as a casual synonym for a large feature, as at `9b679556:6718`, "a large feature (mission)".

## The principle that forces the shape

From `8fdc3b29:181`, one turn before the tree: "Hangon A HUUUUGE principle of orchestrated runs is iterated improvement. Abandon failed runs. Runs should accumulate many retries until they succeed, rather than one shotting. Do we want awesome-run-1, awesome-run-2, awesome-run-3 sitting in launch? Do we want three byte identical spec.v1.json files. If spec.v2.json is an iterated evolution of spec.v1.json don't we want it adjacent? What if test-map changes only, do we want a whole new directory to add 2 new tests? Do we want our spec sperated from the run assests it drives?"

Those four questions are the argument. A run is disposable and is abandoned rather than patched; the spec, the map and the accumulated findings are the investment, and they must not be copied once per attempt.

## What belongs to the launch, and what to the run

To the launch: the spec series and the tests-map series, and the interview folder that produced them, per the tree above and confirmed at `9b679556:3844`, "launch.json already hold the latest spec and maps. just it now sits in the launch space not the run space". The launch record itself is an index, settled at `9b679556:3913`: "pretty sure launch.json is settled as an index."

To the run: the checks, and the reason is explicit at `8fdc3b29:3452`, "checks/ should live in each run instance as they may have to change/grow as the iterations discover check improvements", reinforced at `8fdc3b29:3569`, "verification is one of the failure axis. checks are therefore a run instance asset." Also the liftoff, after a one-turn correction at `9b679556:4424`: "actually write it to runs/run-<n>/liftoff/fullmonty.json".

Outside every launch: the log. `flightdeck/launch/FLIGHTLOG.md` (`9b679556:1063`), with the split from the older log settled at `9b679556:5650`, "FLIGHTLOG goes into the bootstrap, RUNLOG stays where they are".

## The boundary, stated mechanically

From `8fdc3b29:5436`: "launch.json names the current run, that is now the active run for the launch, if a run fails, then launch can get a new run attempt as the only runnable branch." The same turn puts phase and gate state in that one file, and gives the reason: "it removes the need for isolation gymnastics from fc (flight) trying to ensure only one run folder is active."

## Endings

A run ending, in the commander's account of what they actually do, `9b679556:3683`: "the build workflow runs, if green and review passes it ends a PR is opened. I am informed and I read the reports check stuff out (I don't just look at the PR). if happy I merge, if not a fill in runlog and try again. reject PR delete branch."

A launch being done is nowhere stated in a single sentence, and a pilot should not treat any assembly of the following as the commander's formulation. Three turns bear on it. The retry rule, "a launch instance retries untill it succeeds" (`8fdc3b29:3039`). The branch topology that makes the feature the finishing unit, `9b679556:6718`: "each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it. when the feature is finished it all merges back to main". And the completion test in the intent node, `9b679556:7261`: "If a users idea of a piece of work can be handed over and agents build it for them, this work has been completed."

The carry between runs is what makes them attempts rather than repeats, `bab64608:1767`: "the fundamental principle is for the user to complete a runlog and then that is presented in version 2 and the "decisions" can be absorbed. the only advice i could give is instead of running infront of the user present them a list of considerations for their run log once the run ends." The complaint that prompted it, in the same turn: "you seem to be versioning new runs before the source run is over."

## How the v1 runner sees it

The built runner encodes the definition the commander rejects. `launch.schema.json` describes `launch.json` as "the state of one orchestrated run". A launch folder is created by `fc launch new` and named `<spec.name>-<n>`, so the attempt number is in the folder name; active-launch resolution scans for subdirectories holding a `launch.json`. The schema states the rule and its override together: "Exactly one launch folder may carry status active; FLIGHTCREW_LAUNCH overrides that resolution." A pilot managing an active launch needs both halves.

A complete launch folder as the runner intends it produces, in order: `launch.json`; pinned `spec.v1.json` and `tests-map.v1.json` copies, where pinning sets `lock_commit` and replaces `paths.allowed` with the map's allowed paths; a rendered `kickoff.md`; `plan.json` and `plan.md`; `returns/`, holding agent returns and the sealed unit dispatches; `events.jsonl` and `hooks.log`; `evidence/`, per-check results plus boundary, locked, budget and summary files; `review/pass-<n>.json`; `notes.md`; `report.md`; and a `RUNLOG.md` entry inserted by `fc launch end`.

Phases run in a fixed order: targets, plan, contracts, implement, verify, review, report, ended, and `fc launch phase` accepts only the immediately next one. Three gates record pending, approved or exited. G1 approved moves plan to contracts and G2 approved moves contracts to implement. **G3 has no phase move and no blocker.** `git grep -n G3 run/flightcrew-characterization-2 -- flightdeck/flightcrew/bin/` returns exactly three hits: the gates array, the usage string and a plan display filter. It appears in neither `launch end` nor `launch land`. The suite's pinned defect 5, recorded in `evidence/defects.md` at `4fd81d8`, is that approving G3 on an already-ended launch records the decision instead of refusing it. Ceilings default to agents 12, implementers concurrent 4, turns per agent 25, gate iterations 3, stop blocks 8 and critic passes 2. Those are six of the nine; the rest are minutes at 240, with tokens and expected tokens unset.

A check is one row of the tests map, run through `/bin/sh -c` from the launch root, with T1 always the acceptance check. A gate is a phase barrier that runs checks and reports verdicts. A gate never decides what to do about a red check; it reports, and the caller decides.

## Where the two views meet, and what the last runs actually did

The schema was honoured once and then left behind. Three older launch folders on the same tree, `flightcrew-buildout`, `flightcrew-buildout-2` and `flightcrew-characterization-1`, each carry all twenty required fields and nothing forbidden, so they validate cleanly. The two live ones do not: both are written in the commander's shape, not the schema's. The characterization `launch.json` at `4fd81d8` and the core `launch.json` at `27f6969` each carry `test_dir`, a `current_run` pointer and a `runs` array, with artefacts under `runs/run-<n>/`. The core one records run 1 as an array entry with its own branch, base commit and start time. The v1 schema requires twenty fields, of which these files carry five, and forbids additional properties, of which they carry three. Neither validates against the runner's own schema.

Neither of the two surviving runs used the runner at all. Run 2's kickoff says so directly: custom workflows written for the occasion, no flightcrew runner, no hooks, no launch, checks invoked by path. Its launch folder holds only `launch.json`, a defects file, three run-2 documents and the interview material. None of the eleven artefacts the runner would produce exist, because nothing produced them. The reason is in the run-1 log, which names ten tooling faults and none in the spec or the map, the first being that no tool invokes a workflow, so the workflow shape is unusable. Run 2 was fixed, in its own words, by not using it.

A launch holding many runs is therefore not a proposal awaiting a build. It is what both real launches already did, by hand, outside the tooling that contradicts them. The core spec's `launch/<name>/{specs/, runs/run-<n>/}` layout is that practice written down, and it is specified and unbuilt.
