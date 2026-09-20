---
type: "Manual"
stub: true
style: "record"
stamp: ["2026-09-20", "stub-writer", "4450a586"]
---
# Tests and Checks

## Tests vs checks
Tests are pass/fail assertions owned by the project's own test suite. Checks wrap a test and return an orchestration-compatible verdict; a check can be an exit code, a ratio against a threshold, or a rubric verdict, not only pass/fail.

## Where each lives
Project tests live in the project's own test folder, or in testbench when no such folder exists. Checks wrap those tests inside the run folder.

## Checks are a run asset
Checks are rebuilt against each new frozen spec version, not treated as a fixed layer.

## Specs cover only changed behaviour
Existing tests already cover existing behaviour, so a spec need only state where behaviour differs from the original; it should not restate the whole existing behaviour model.

## Build before checkability
Behaviours and edges are built first, then checked; shaping the build around what is easy to check produces an overly complex surface.

## Not settled
- Where the term "targets" fits against tests and checks
