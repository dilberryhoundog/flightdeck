<!-- DRAFT record, T006, 2026-09-18, contested by the adversary, validated, discovery-checked, 83 transcript citations resolved by script; awaiting the commander's review (DS003, P009). Removed at landing. -->

# Tests and Checks

Source: topic `tests-and-checks` (`../logs/topics/tests-and-checks.json`); commander turns at `8fdc3b29:3567`, `8fdc3b29:3568`, `8fdc3b29:3569`, `9b679556:25`, `9b679556:7302`, `9b679556:7638`, `9b679556:7640` to `9b679556:7647`, `a9389f8c:3227`, `a9389f8c:3305`, `a9389f8c:3403`, `a9389f8c:3405` in `flightcrew-characterization:dev/workspace/history/<session>_<slug>.txt`; written advice `commanders-desk/out-advice/DS001.md` and `quarters/commander/orders.json#O040`; second pointer `notepad/research-2026-09-18/source/commanders-guidance.md`; researched 2026-09-18 by T006 record-writer.

## The distinction

"in my intial conversations checks and tests are different things. tests are pass/fail assertations. checks are definition of done, they overlay a test with a orchestration run compatible output" (`a9389f8c:3403`).

A check is a wrapper, and the project keeps ownership of correctness: "checks are wrappers, they return flightcrew compatible output from a green/red test. single source of truth stays with the project and its own test suite" (`8fdc3b29:3568`).

Flattening the two is the mistake this record exists to prevent.

## Where each lives

The chain (`8fdc3b29:3569`): "Project test/ for appropriate assertive tests -> testbench for any other tests not compatible with a tests folder -> run-1/checks to wrap the tests -> flightcrew/checks (probably should rename to 'verify') for global test wrappers etc."

Testbench is the home for what a project test folder cannot hold, and the commander recalls the intention as this: "when using flight deck in a folder with no test/ this becomes a known place for the tests flightcrew needs to work properly" (`a9389f8c:3305`).

The gold standard is a plain project test folder with check wrappers over it: "if this was rails the checks would be 'wrapping' rails natural test/ folder... the 29 regresion tests should be in ./test/ then there should.ve been check wrappers" (`a9389f8c:3227`). `DS001` restates it as "a standard ol rails test folder".

Who builds which: "the test builder should know to build 'tests' into project native or testbench. then place checks into run folder. these present existing tests as 'checks' for the run" (`a9389f8c:3405`).

One term in this vocabulary is unsettled, and the commander says so in the same breath: "also the term 'targets' is mentioned which im unsure of how it fits into the verification domain" (`a9389f8c:3405`). Where targets sit against tests and checks has not been ruled on. Ask rather than assume.

## Checks belong to the attempt

"verification is one of the failure axis. checks are therefore a run instance asset. test-builder agent builds new checks and tests after new versioned spec freeze.  builds them into new run attempt" (`8fdc3b29:3567`).

So checks are rebuilt against each frozen spec version. An agent that treats them as a fixed layer locks the one the commander designed to move.

## What a check may return

"Check scripts; For returning verification verdicts from prebuilt tests, one per case. Three verdict options; an exit code, a ratio against a threshold, or a verdict sheet against a rubric" (`9b679556:7302`).

A check is therefore not confined to pass and fail, which is what lets it cover things a test cannot.

## Never let checkability shape the build

"also build behaviours and edges first then try to find ways to check and verify them. do not do this in reverse (only place behaviours that can be checked) the last build run built an overly complex command surface because it was 'checkable'" (`9b679556:25`).

## What the suite is for

A testable core: "I should go through and inventory the system. Any document or part i want to keep I should build 'agent shaped' tests for. Once finished this will provide a foundation that should always exist but doesn't currently, a testable core" (`9b679556:7638`).

The constraint on it: the suite "protects and defines the underlying infrastructure that can be built upon over time", and must not be so heavy-handed that it needs tuning every time a build run is attempted (`DS001`).

## Replacing one component with another

Three rules, the commander's. When one component replaces another: "I would not restate the whole exisiting behaviour model" (`9b679556:7642`); "I would rely on existing test for unchanged behaviour" (`9b679556:7643`); "I would define where behaviour differs observably from original" (`9b679556:7644`).

They proposed them in interview, reasoning inside a Rails analogy about replacing Devise with Rails native auth (`9b679556:7640`), and asked in the same turn whether they carry across to a system of harness tools (`9b679556:7647`). They do: the commander confirmed it on 2026-09-18 (`orders.json#O040`). The affirmative sitting in the transcript between the question and that confirmation is a pasted reply from web Claude and is cited nowhere.
