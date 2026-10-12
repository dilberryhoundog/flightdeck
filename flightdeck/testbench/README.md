# Testbench

The characterization suite over flightcrew for the spec `flightcrew-characterization` version 1, frozen at `flightdeck/launch/specs/flightcrew-characterization/spec.v1.json`, with its tests map beside it at `tests-map.v1.json`. The suite describes every part of flightcrew exactly as it stands today: the runner's subcommands, the hooks, the role files, the schemas, the templates, the validators and gates, the workflow scripts and the files `fc distribute` writes into `.claude/`. It absorbs the thirty earlier suites, which were written per check id of the flightcrew-v1 spec; they stay under `suites/` and keep every case name they printed.

The testbench also holds the suite runner, the shared library, the fixtures the suites build temporary repositories from, the locked checks on the suite, and the rubric bench. Launch results never live here: they belong to each launch under `flightdeck/launch/<L>/evidence/`, where `<L>` is the launch directory's name.

Paths in this file are repository-relative and every command is run from the repository root. `fc` means `flightdeck/flightcrew/bin/fc`, invoked by path, and it runs only inside suites, against temporary repositories.

This file is the contract every suite author follows. Where it and the frozen spec disagree, the spec wins.

## Layout

- `run-all.mjs`: runs every suite, see run-all below.
- `lib/suite-lib.mjs`: locations, process runners (`fc`, `hook`, `sh`), temporary directories (`tmp`), fixture builders (`initRepo`, `mkLaunchRepo`, `mkActiveLaunch`), assertions, the case reporter `suite` and the defect-case helper `defect`.
- `suites/<name>/run.mjs`: one suite per directory. Helper modules and fixtures a suite owns sit in its directory.
- `suites/_checks/`: the checks on the suite, locked. See The checks on the suite below.
- `case-map.json`: the mapping file for earlier case names, see Continuity below.
- `fixtures/sample-project/`, `fixtures/sample-spec/`, `fixtures/sample-launch/`: the material every temporary repository is built from, locked.
- `benches/rubrics/spec/`: calibration data for the spec-readiness rubric. A bench is not a suite: run-all does not run it, and paths quoted inside the bench documents predate the current layout and are never resolved against the current tree.
- `runs/`: run-all's logs, gitignored except its `.gitignore`.

## The suite output protocol (spec I2, C2)

A suite is `suites/<name>/run.mjs`, a Node 22 ES module that takes no arguments, imports only Node built-ins and relative paths, and writes nothing inside the checked-out repository. Its stdout is exactly these lines, in this order, and nothing else:

1. One line per case: `pass  <case>` or `FAIL  <case>: <reason>`, two spaces after the verdict. A case that pins a defect is named `<case> [defect]`, and its case line is immediately preceded by `defect: <what the behaviour should be> (<path>:<line>)`.
2. One `covers: <ids>` line naming ids of this spec, separated by single spaces.
3. For a statistical suite only, one `ratio: <scenario> <passes>/<N> inconclusive <n> threshold <k>/<N> tier <model>` line per scenario, where N is the declared trials and an inconclusive trial counts as not passing. A ratio below its threshold is also a FAIL case naming the scenario.
4. For a judged suite only, one `sheet: <path> judge <model>` line. A refused sheet is a FAIL case.
5. A final `<n>/<m> passed`, where n counts the pass lines and m counts all case lines.

The suite exits `0` when every case passes and `2` otherwise; only run-all uses exit `1`. Case names must be the same on every run: no durations, dates, process ids or temporary paths in a name. The checks read case names from parallel runs and verdicts from serial runs.

`suite` in `lib/suite-lib.mjs` prints all of this. Every suite under `suites/` reports through it today:

```js
import { suite, defect, fc, tmp, assert, assertExit } from '../../lib/suite-lib.mjs';

await suite({ name: 'bin-example', covers: ['B1', 'B2'] }, [
  { id: 'fc evidence exits 0 on the sample launch', fn: () => { /* … */ } },
  defect({
    id: 'fc report omits the quarantined ids',
    should: 'the report lists every quarantined check id',
    ref: 'flightdeck/manuals/orchestration/run-report.md:30',
    fn: () => { /* asserts today's behaviour */ },
  }),
]);
```

Cases run in order with a 120-second timeout each. An uncaught error becomes a FAIL line for the running case, followed by the covers and count lines, and exit 2. A suite that does not use `suite` must print the same lines itself, including the defect line directly above its marked case line.

## The covers convention

- A suite over flightcrew's parts declares `covers: ['B1', 'B2']`: its cases name parts (B1) and turn red when a named part breaks (B2). This is also the default when `suite` is given a bare name.
- `suite` adds `B10` to the covers line when any case is built with `defect`.
- A suite over the testbench itself declares the ids it proves: `suites/run-all` declares `C2 E5`, `suites/constraints` declares `C1 C2 C8`.
- Only ids of this spec may appear. The `covers` field some earlier cases still carry holds flightcrew-v1 ids and is not read.

## Naming a part (spec B1)

The inventory is built by `suites/_checks/lib/parts.mjs`:

- The runner's subcommands as its usage lists them, written `fc <command>` or `fc <command> <sub>`.
- From `flightdeck/flightcrew/MANIFEST.txt`: hooks (`flightcrew/hooks/*.mjs` except `lib.mjs`), role files (`flightcrew/crew/*.md` except `README.md`), schemas (`flightcrew/schemas/*.schema.json`), templates (`flightcrew/templates/**` except `README.md`), validators (`flightcrew/checks/validators/*.mjs`), gates (`flightcrew/checks/gates/*.mjs`) and workflow scripts (`flightcrew/workflows/*.js`).
- Every file `fc distribute` lists, as `.claude/<path>`: the distributed roles under `.claude/agents/` and the distributed workflows under `.claude/workflows/`.

A case names a path part when its name contains the part's repository-relative path, bounded on both sides by characters that cannot belong to a path (letters, digits, `.`, `_`, `/` and `-` all can). A case names a subcommand when its name contains the token exactly as the usage prints it, space-separated, bounded by characters that cannot belong to a word. The `[defect]` mark is ignored when matching. For example, `flightdeck/flightcrew/hooks/lock-guard.mjs denies an edit to a locked path` names the hook, and `fc launch note appends a note to events.jsonl` names `fc launch note`.

## Breaking a part (spec B2)

A sweep check takes every part of one category, finds the cases that name it, runs those cases' suites in an unaltered snapshot copy of the working tree and in a copy with the part altered, and needs at least one naming case that passes unaltered and FAILs altered. The alteration per part kind:

- subcommand: `fc.mjs` exits with its exit code inverted (0 becomes 2, anything else 0) when it runs that subcommand. The case must run `fc` as a child process and assert its exit code.
- hook: the decision is flipped. A blocking answer (exit 2, `permissionDecision` deny or ask, `decision` block, `continue` false) becomes a silent allow with exit 0; anything else becomes exit 2. The case must run the hook and assert its decision.
- role file and distributed role: the frontmatter `name` line is dropped.
- schema: the top-level `required` is removed.
- template: the first slot is renamed: the first `{{x}}`, else the first key of a JSON template, else the kickoff `<!-- version: n -->` comment, else the first heading.
- validator and gate: the process exit code is inverted, so the case must run it as a child process and assert its exit.
- workflow script and distributed workflow: `export const meta` is removed.

A naming case asserts real, observable behaviour of the part, or a property the part's manual, header comment or usage states. It never asserts a hash, byte snapshot or file size of the part, and never detects the alteration itself, for example by searching the part for the word `altered`. A part with no meaningful alteration is listed with a reason in `suites/_checks/fixtures/sweep-exempt.json`, which is locked; today it lists none.

## Defects (spec B10, B11, C9, SC4)

A defect is a part disagreeing with its manual, header comment or usage line. It is pinned, never fixed: the case asserts today's behaviour and passes, is named `<case> [defect]`, and sits directly beneath its defect line. Build it with `defect({ id, should, ref, fn })`: `id` is the case name without the mark, `should` is one line saying what the behaviour should be, `ref` is `<path>:<line>` of the stated behaviour. `suite` prints the defect line immediately before the case line. A `should` that is not one line, a `ref` not of the form `<path>:<line>`, or a `ref` naming a missing file or line makes the case FAIL unmarked, naming the fault.

A marked case that fails, a defect line with no marked case beneath it, and a marked case with no defect line above it all fail the checks.

The reference must resolve by the rule in `suites/_checks/defect-references/run.mjs`:

- A manual C9 lists, at any line that exists: `flightdeck/manuals/harness/hooks.md`, `workflows.md`, `permissions.md`, `claude-code-facts.md`; `flightdeck/manuals/launch/launch-anatomy.md`; `flightdeck/manuals/orchestration/crew.md`, `kickoff.md`, `planning.md`, `review.md`, `endings.md`, `run-log.md`, `run-report.md`; `flightdeck/flightcrew/hooks/README.md`, `flightdeck/flightcrew/crew/README.md`, `flightdeck/flightcrew/workflows/README.md`; `library/flightcrew/creating-harness-documents.md`.
- For a part with no manual, the part's own file, which must be a schema (`flightdeck/flightcrew/schemas/*.json`), a template (`flightdeck/flightcrew/templates/**`), a validator (`checks/validators/*.mjs`), a gate (`checks/gates/*.mjs`) or a command script (`bin/fc`, `bin/fc.mjs`, `bin/cmd/*.mjs`, `bin/worker/*.mjs`). The rule for the line goes by the file's form, not its category: a `.mjs` or `.js` file, and `bin/fc`, at a line inside its leading block of `//` or `#` comment lines; a `.json` file, a JSON template included, at or above its top-level `"description"` line (indented two spaces), so a JSON file without one takes no reference; any other file, a markdown template for example, at or above its first blank line, or at any line when it has none. The line must exist in every case.
- Hooks, role files and workflow scripts have manuals, so their defects reference a manual.

The defects file (spec I4) is `flightdeck/launch/<L>/evidence/defects.md` for the launch whose `launch.json` names this spec, one line per defect: `<suite> · <case> · <defect text> · <reference>`. It carries exactly the defect lines the suites print.

## Continuity (spec B12)

Every case name the thirty earlier suites printed is listed in `suites/_checks/fixtures/earlier-cases.txt`, and every one of them keeps being printed verbatim by some suite. Add new cases beside the earlier ones and never rename an earlier case. `case-map.json` is the committed mapping file: a JSON object from `<earlier suite> · <earlier case>` to `<new suite> · <new case>`, where the new suite must print the new case. It holds no mappings (`{}`); a mapping is added only when an earlier case is absorbed under a new name, and the file is committed as it stands.

## Temporary repositories and hygiene (spec C2, C8, E5)

- Every command under test runs against a temporary repository under `os.tmpdir()`, built by `lib/suite-lib.mjs` (`tmp`, `initRepo`, `mkLaunchRepo`, `mkActiveLaunch`) and removed at exit. Child processes run with `CLAUDE_PROJECT_DIR`, `FLIGHTCREW_ROOT` and `FLIGHTCREW_LAUNCH` scrubbed, so a suite says explicitly which launch root the thing under test sees.
- A fixture is a locked target: a suite that needs a variation copies the fixture into its temporary repository and changes the copy.
- Nothing a suite runs reaches a remote or starts a model: no git push, fetch, pull or ls-remote, no `gh`, no `claude`. The checks run every suite with shims on `PATH` that refuse and record these.

## run-all

- `node flightdeck/testbench/run-all.mjs [--only <substring>]` runs every `suites/*/run.mjs` in name order, prints one line per suite (`ok <suite> (<n>/<m>, <ms> ms)` or `FAIL …`), keeps each suite's full output at `runs/<suite>.log` and the summary at `runs/last.json`, and exits `0` when every suite passes and hygiene holds, `1` on a usage or environment error (including no suites at all), `2` otherwise.
- Directories starting with `_` or without a `run.mjs` are skipped.
- Hygiene: each suite runs with `TMPDIR` set to a private directory created for the run. After each suite run-all compares, with their state before that suite, the entries of that directory, the `git status --porcelain` lines outside `flightdeck/testbench/runs/`, and the bytes of `.claude/settings.json`. A new entry, a new status line or a settings change is charged to that suite, and the closing line reads `hygiene: FAIL <suite>: <fault>; …`, naming every offending suite; otherwise it reads `hygiene: ok`. Leaked entries are removed after each suite, and the private directory at the end.

## The checks on the suite

`suites/_checks/` holds the checks the tests map runs, written and locked before any suite was built. They are run only by the tests map's commands, one at a time from the repository root (`node flightdeck/testbench/suites/_checks/<check>/run.mjs`); run-all skips them. The tests map's locked paths are `suites/_checks/`, the three sample fixtures and the map file; nothing there is edited. A check that looks wrong is reported, not worked around.

Each check stops at 240 seconds. The checks cache suite outputs under `os.tmpdir()/flightcrew-characterization-checks/`, keyed by a fingerprint of every non-ignored file of the tree, so any edit reruns the suites.

Time guidance:

- A sweep check runs each part's naming suites once per part, four copies at a time, plus one unaltered run of every naming suite. Name parts from fast suites, or from a small fast suite made for the purpose. Never make a slow suite the only naming suite of many parts. Slow suites today: `bin-launch` about 29 s, `hooks-stopgate` about 12 s, `hooks-noop` about 11 s, `bin-doctor` about 11 s, `bin-check` about 11 s.
- The eight suite-group checks deal every suite run-all runs, sorted by name, round-robin into eight groups and run each group serially inside 240 seconds, requiring every suite to exit 0, leave no temporary entry and leave the checkout's git status unchanged. Keep each suite fast and the total suite time low; a new suite changes which group every later suite falls in.

## Scenario sets (spec I3, D3)

A statistical or judged check would read a scenario set under `fixtures/scenarios/<set>/`. No scenario set exists: no part of flightcrew has needed a live scenario, so no suite prints a ratio or sheet line, and the checks over scenarios, trials, rubrics and sheets pass empty as D3 allows.
