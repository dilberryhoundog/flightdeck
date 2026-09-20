# Launches and Runs

Stub: existing knowledge only, not validated, not to be cited as authority.

## Launch and run
A launch is the whole effort to complete one feature, holding the spec, its versions, and every run that attempts it. A run is one attempt; a retry reuses the same launch directory and moves to a new spec version rather than opening a fresh one.

## Why runs repeat
Runs accumulate retries instead of one-shotting. Cheap build agents retry; expensive agents are not spent on single attempts.

## Retrying a failed run
A retry must name which of the three failure axes (context, verification, tooling) it failed on, and how it will improve that axis. A retry that changes none of the three is a repeat, not an attempt.

## Stalls
A stalled plan unit escalates to a stronger agent. If that also stalls, the run fails.

## Carrying forward and branches
The run log carries findings into the next attempt. A run ends, the log is completed, and the next version absorbs it. One branch serves a whole feature; each launch's successful run opens a PR back to that branch, which merges to main once the feature is done.

## Not settled
- How run assets are retained across attempts (per-run retention may since have changed)
- How a launch reaching completion, as distinct from one run, is decided
- Who writes the run log
