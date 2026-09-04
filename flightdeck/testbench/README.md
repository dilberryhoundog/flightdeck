# Testbench

Test harnesses, reusable across the whole repository: the suite runner, one regression suite per check id of the flightcrew spec at `flightdeck/launch/specs/flightcrew-v1/spec.v1.json`, the fixtures the suites build temporary repositories from, and the rubric bench. Never launch results: those belong to each launch under `flightdeck/launch/<L>/evidence/`, where `<L>` is the launch directory's name.

Paths in this file are repository-relative and every command is run from the repository root. `fc` means `flightdeck/flightcrew/bin/fc`, invoked by path.

## The suite protocol

- A suite is `suites/<name>/run.mjs`; it takes no arguments and writes nothing inside the checked-out repository.
- It prints one line per case, `pass  <case>` or `FAIL  <case>: <reason>`, one `covers: <ids>` line, after the case lines and before the final count, naming the spec node ids it proves (`B`, `C`, `I`, `E` and `SC` ids of the spec above) separated by single spaces, and a final `<n>/<m> passed`.
- It exits `0` when every case passes and `2` otherwise — only run-all uses exit `1`, for a usage or environment error. An uncaught error becomes a `FAIL` line and exit `2`.
- Every command under test runs against a temporary repository under `os.tmpdir()`, built by `lib/suite-lib.mjs` (`tmp`, `initRepo`, `mkLaunchRepo`, `mkActiveLaunch`) and removed at exit; child processes run with `CLAUDE_PROJECT_DIR`, `FLIGHTCREW_ROOT` and `FLIGHTCREW_LAUNCH` scrubbed, so a suite says explicitly which launch root the thing under test sees.
- Run one suite: `node flightdeck/testbench/suites/<name>/run.mjs`.

## run-all

- `node flightdeck/testbench/run-all.mjs [--only <substring>]` runs every `suites/*/run.mjs` in name order, prints one line per suite, keeps each suite's full output at `runs/<suite>.log` and the summary at `runs/last.json`, and exits `0` when every suite passes, `1` on a usage or environment error (including no suites at all), `2` otherwise.
- Hygiene: each suite runs with `TMPDIR` set to a private directory created for the run; an entry left there afterwards is a leak and fails the run; the directory is removed so the real temp directory's entry set is unchanged. `git status --porcelain` is snapshotted before and after; a new line outside `flightdeck/testbench/runs/` fails the run.
- `runs/` is gitignored except its `.gitignore`.
- Directories starting with `_` or without a `run.mjs` are skipped.

## Fixtures

- `fixtures/sample-project/`: a small project (`src/export/`, `tests/export/`, `scripts/`) whose checks the sample-spec tests map at `fixtures/sample-spec/tests-map.v1.json` runs; the material every temporary repository is built from.
- `fixtures/sample-spec/`: `spec.v1.json`, `tests-map.v1.json`, `plan.sample.json` and a `checks/` note; the golden inputs for the validators, the runner and the end-to-end suite.
- `fixtures/sample-launch/`: a complete launch folder, and the reference for launch-folder shape, that `fc doctor`, the report and evidence suites, and the hook suites copy and activate; read the directory itself for its contents.
- A fixture is a locked target: a suite that needs a variation copies the fixture into its temporary repository and mutates the copy.

## Suites

One directory per check id of `flightdeck/launch/specs/flightcrew-v1/spec.v1.json` (`T1` `e2e` through `T29` `workflows`; the mapping is the spec's verification text), plus `unit-*/` directories that implementation units — the plan entries an implementer builds one at a time, as `flightdeck/manuals/orchestration/planning.md` defines them — may add. `suites/validate-spec/` carries the validator case table and goldens (`cases.mjs`, `fixtures/`) as the spec validator's regression test.

## Benches

`benches/rubrics/spec/` is calibration data for the spec-readiness rubric: the bench harness (`HARNESS.md`), the collector and renderer (`collect.mjs`, `render.mjs`, `absorb.mjs`), the bench notes `rubric-v2-proposal.md` and `two-spec-bench.md`, and `experiments/`, the committed home for future rubric-bench chains (one directory per chain, each with its `chain.json`, verdict sheets and the chain's draft). A bench is not a suite: `run-all` does not run it. Paths quoted inside the bench documents predate the current layout and are never resolved against the current tree.

## The lock rule

- A launch is one orchestrated run, its state in `flightdeck/launch/<L>/launch.json`; `fc launch status` says whether one is active and prints the locked path globs it enforces, and `lock_commit` is the commit that launch recorded when its tests map was pinned. `flightdeck/manuals/launch/launch-anatomy.md` defines all three.
- While a launch is active, the suites its tests map names, `fixtures/`, `lib/` and `run-all.mjs` are locked paths: the lock-guard hook refuses edits, `fc locked` reports any change since `lock_commit`, and the critic receives the list.
- An implementer that finds a suite wrong or unsatisfiable returns `status: halt` with `halt.kind` set to `test-contradicts-spec` or `unsatisfiable` and `halt.detail` saying why; the orchestrator files it with `fc launch escalate wrong-check --detail "…"`. A human decides whether the suite or the spec changes, and re-pins the map with `fc launch pin tests-map <map>`.
- Implementation units add suites only under `suites/unit-*/`; they never edit a locked suite to go green.
- A suite change outside a launch is an ordinary reviewed diff, versioned with the tests map it serves.
