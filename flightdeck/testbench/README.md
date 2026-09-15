# Testbench

Test harnesses, reusable across the whole repository: the suite runner, the suites that characterise flightcrew as it stands for the spec at `flightdeck/launch/specs/flightcrew-characterization/spec.v1.json` (beginning with the thirty regression suites written for `flightdeck/launch/specs/flightcrew-v1/spec.v1.json`), the fixtures the suites build temporary repositories from, and the rubric bench. Never launch results: those belong to each launch under `flightdeck/launch/<L>/evidence/`, where `<L>` is the launch directory's name.

Paths in this file are repository-relative and every command is run from the repository root. `fc` means `flightdeck/flightcrew/bin/fc`, invoked by path.

## The suite protocol

- A suite is `suites/<name>/run.mjs`; it takes no arguments and writes nothing inside the checked-out repository.
- It prints, in order: one line per case, `pass  <case>` or `FAIL  <case>: <reason>`, where a case that pins a defect is named `<case> [defect]` and is preceded by `defect: <what the behaviour should be> (<manual path>:<line> | <part path>:<header line>)`; one `covers: <ids>` line naming the ids of the spec at `flightdeck/launch/specs/flightcrew-characterization/spec.v1.json` it proves, separated by single spaces; for a statistical suite one `ratio: <scenario> <passes>/<N> inconclusive <n> threshold <k>/<N> tier <model>` line per scenario, where `N` is the declared trials and an inconclusive trial counts as not passing; for a judged suite one `sheet: <path> judge <model>` line; and a final `<n>/<m> passed`.
- A ratio below its threshold and a refused sheet are `FAIL` cases, so the exit code carries all three verdicts. `lib/suite-lib.mjs` prints these lines from the case fields `defect: { should, ref }`, `ratio: { scenario, passes, trials, inconclusive, threshold, tier }` and `sheet: { path, judge }`.
- The thirty suites written for `flightdeck/launch/specs/flightcrew-v1/` cover `SC2 C2` of this spec until they are absorbed or replaced; their case names are held by `flightdeck/testbench/suites/_checks/continuity/`, and a renamed case is recorded in `case-map.json`.
- It exits `0` when every case passes and `2` otherwise — only run-all uses exit `1`, for a usage or environment error. An uncaught error becomes a `FAIL` line and exit `2`.
- Every command under test runs against a temporary repository under `os.tmpdir()`, built by `lib/suite-lib.mjs` (`tmp`, `initRepo`, `mkLaunchRepo`, `mkActiveLaunch`) and removed at exit; child processes run with `CLAUDE_PROJECT_DIR`, `FLIGHTCREW_ROOT` and `FLIGHTCREW_LAUNCH` scrubbed, so a suite says explicitly which launch root the thing under test sees.
- Run one suite: `node flightdeck/testbench/suites/<name>/run.mjs`.

## run-all

- `node flightdeck/testbench/run-all.mjs [--only <substring>]` runs every `suites/*/run.mjs` in name order, prints one line per suite, keeps each suite's full output at `runs/<suite>.log` and the summary at `runs/last.json`, and exits `0` when every suite passes, `1` on a usage or environment error (including no suites at all), `2` otherwise.
- Hygiene: each suite runs with `TMPDIR` set to a private directory created for the run, and the directory is removed at the end so the real temp directory's entry set is unchanged. Before and after each suite run-all snapshots that directory's entries, `git status --porcelain` and the content hash of `.claude/settings.json`. A new temp entry, a new status line outside `flightdeck/testbench/runs/` or a changed settings file is charged to the suite that just ran, printed as `hygiene: FAIL <suite>: <what it left>`, and fails the run; a clean run prints `hygiene: ok`.
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
