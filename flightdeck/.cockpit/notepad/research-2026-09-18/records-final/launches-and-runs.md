<!-- DRAFT record, T006, 2026-09-18, contested by the adversary, validated, discovery-checked; awaiting the commander's review (DS003, P009). Removed at landing. -->

# Launches and Runs

Source: topics `launch-and-run` (`../logs/topics/launch-and-run.json`) and `iteration-and-failure-axes` (`../logs/topics/iteration-and-failure-axes.json`); commander turns at `0fb7c77a:2780`, `0fb7c77a:3004`, `8fdc3b29:181`, `8fdc3b29:204`, `8fdc3b29:206`, `8fdc3b29:3029` to `8fdc3b29:3037`, `8fdc3b29:3039`, `8fdc3b29:3567`, `8fdc3b29:5436`, `9b679556:3913`, `9b679556:3966`, `9b679556:6718`, `a9389f8c:3618`, `bab64608:1767` in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`; written advice `commanders-desk/out-advice/DS001.md` and `quarters/commander/orders.json#O039`; second pointer `notepad/research-2026-09-18/source/launch-and-run.md`; researched 2026-09-18 by T006 record-writer. Companion records: `endings.md`, `state-and-freezing.md`.

## What a launch is

A launch is "an intent to complete a piece of work and includes all the infrastructure to do this", which takes in the runs that attempt the work, the spec and its versions as those runs converge on done, and the run-generated artefacts (`DS001`). One launch builds one feature, and it persists across attempts: "a new launch builds a new feature, a launch instance retries untill it succeeds, no duplicated specs single source of truth" (`8fdc3b29:3039`).

A launch is "definitely not 'one run of one spec'" (`DS001`).

## What a run is

A run is one attempt at the launch's feature. A second attempt reuses the launch's directory rather than opening a new one, and it is marked by a new spec version: "The convention is for a `run` (launch) to happen under the same directory but a second pass of the same run requires the same directory used. a v2+ spec. and v1 failing" (`a9389f8c:3618`).

## The layout

The commander typed it as a tree (`8fdc3b29:3029` to `8fdc3b29:3037`) and explained it in the sentence quoted above (`8fdc3b29:3039`):

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

## Why runs repeat rather than being perfected

"A HUUUUGE principle of orchestrated runs is iterated improvment. abandon failed runs. runs should accumulate many retries until they succeed, rather than one shotting" (`8fdc3b29:181`).

The economics are the point: "decomposing. uses cheap build agent retrying attempts, instead of expensive agents single shotting" (`0fb7c77a:3004`). And the same posture applies within an attempt: "Its a principle. you have a go at laying out the ground work, then decide if the groundwork produced what you want. If it didn't update it" (`0fb7c77a:2780`).

## What a retry changes

Three axes: "this lines up well with the three failure axis principle; look at context, verification or tooling for improving the run" (`8fdc3b29:206`). A retry that changes none of the three is a repeat, not an attempt.

Verification is one of them, which is why the checks belong to the attempt: "verification is one of the failure axis. checks are therefore a run instance asset. test-builder agent builds new checks and tests after new versioned spec freeze. builds them into new run attempt" (`8fdc3b29:3567`).

## What carries forward

The run log, and it is what licenses everything else to be thrown away: "then the importance of a runlog was highlighted to transfer all other 'findings' over to the new instance, this allows us to 'overwrite' alot of the run-assets per instance" (`8fdc3b29:204`).

The commander writes it, and the next version absorbs it: "the fundamental principle is for the user to complete a runlog and then that is presented in version 2 and the 'decisions' can be absorbed. the only advice i could give is instead of running infront of the user present them a list of considerations for their run log once the run ends" (`bab64608:1767`). A run ends, then the commander writes the log, then the next version absorbs it. Hand over considerations and do not run ahead.

## What belongs to the launch, and what to the run

- To the launch: the spec series and the tests-map series, and the interview folder that produced them, per the tree above.
- To the run: the checks (`8fdc3b29:3567`), and the run's own outputs.
- Outside every launch: `FLIGHTLOG.md`, per the tree above.

## Branches

"sure each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it. when the feature is finished it all merges back to main" (`9b679556:6718`).

One branch serves the whole feature, however many launches it takes: "more than one launch can happen for a feature. lets say you do three launches, the same branch will be the launch branch. the three successful run one each launch will progressively PR back to the feature / launch branch. then it is merged back to main" (`orders.json#O039`).

So each launch contributes one successful run, that run's pull request goes back to the feature branch, and the feature branch merges to main once the feature is done. The commander calls it both the feature branch and the launch branch; it is one branch.

## The launch record

"pretty sure launch.json is settled as an index" (`9b679556:3913`). It names the launch's current run and carries the consequence of a failure: "launch.json names the current run, that is now the active run for the launch, if a run fails, then launch can get a new run attempt as the only runnable branch" (`8fdc3b29:5436`).

The reason for a single file is mechanical: it "removes the need for isolation gymnastics from fc (flight) trying to ensure only one run folder is active" (`8fdc3b29:5436`).

This is the single json page the commander allows for phase state, and gates, phase state and freezing are in `state-and-freezing.md`.

## When a run stalls

"a stall should engage a second stronger agent. if that stalls the run is stopped. if its a workflow it can be handled but im not the expert" (`9b679556:3966`).

## How a launch proceeds

"a launch succeeds not from a bunch of commands run in sequence, but agent teams all converging on success, like a prebuild (spec and tests and plan), then the build (orch workflows), then review and cleanup (decide done, gather intel, setup next run, or merge and move on)" (`DS001`).

How a run reaches its end is in `endings.md`.
