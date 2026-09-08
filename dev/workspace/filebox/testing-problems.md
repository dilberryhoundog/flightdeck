# Testing problems

This document describes the testing problems of the flightcrew orchestration system: what a check is, what it returns, where it lives, who writes it and what protects it. It is one of a set of problem documents, each covering one domain, written to inform the plan of a later launch that will address them. It diagnoses. It proposes no remediation. The run folder model it measures against is defined in the structure problems document beside it and is not restated here.

Every observation was verified on branch `flightcrew-buildout` at commit `75b2b42`. Paths and line numbers refer to that revision. The working tree may be on another branch, so read evidence with `git show flightcrew-buildout:<path>`. One rule governs what counts as evidence: no run recorded in this repository was conducted by flightcrew. Both were driven by Claude Code workflows and recorded by hand afterwards. What those runs produced therefore says nothing about the system, and this document cites only what was built: the schemas, the runner, the hooks, the role files and the manuals.

## Agent Invariants

- A check is a wrapper. It runs something, reads the result and returns a verdict flightcrew can gate on. It does not hold the assertion itself.
- A project's own tests belong to the project. A run invokes them and never writes into them.
- Checks are a run asset. They are written into the run folder after a spec freeze, so the run folder exists before the test-builder is dispatched.
- The reader has none of the conversation that produced this document. Every claim stands on the cited evidence alone.

## The target rail

Every problem below is measured against four positions a testing artefact can occupy:

| Position                             | Holds                                                                                         | Owned by    | Written by                                                          |
|--------------------------------------|-----------------------------------------------------------------------------------------------|-------------|---------------------------------------------------------------------|
| The project's tests folder           | Assertive tests: unit, contract, edge, end to end                                             | The project | The project, or the test-builder when the spec calls for a new test |
| `flightdeck/testbench/`              | Testing artefacts a launch needs that do not fit a tests folder: fixtures, benches, harnesses | The deck    | The test-builder or the human                                       |
| `launch/<name>/runs/run-<n>/checks/` | The wrappers the tests map names, one per check                                               | The run     | The test-builder, after the spec freeze, before implementation      |
| `flightdeck/flightcrew/checks/`      | Global wrappers and libraries every launch shares                                             | Flightcrew  | Flightcrew's own builds                                             |

A **check** is a wrapper the tests map names. It runs something, whether a project test, a script or a scenario, reads the result, and returns a verdict a gate can read. A **test** is a project's own assertion. It is owned by the project, may predate any spec and outlive every run, and is invoked by a check but never written by a run. A **verdict** is what a check returns to a gate. The testing manuals name three kinds; the built system carries one. The **rail** is the set of four positions above. A **target** is the status a check holds once it exists before the work and is locked against it; it is not a separate kind of artefact.

Because verification is one of the three failure axes, checks change between runs: a run may find a check wrong or missing, the log records it, and the next run's test-builder writes the corrected set. That is why checks belong to the run and not to the spec. It is also why the run folder must exist before the test-builder is dispatched.

## Problems

### 1. The vocabulary has no rail

**What.** The words the system uses for testing are defined in five places and do not agree. `library/terms.md:2` defines a check as any executable verification, test or otherwise, that returns pass or fail. `flightdeck/manuals/testing/testing-conventions.md:3` says the same. `flightdeck/manuals/testing/testing-description.md:9` says every check returns one of three verdicts. `terms.md:5` defines `class` as one of the many kinds of check, distinguished by what it proves, and `terms.md:10` defines `check class` as the declared method by which a behaviour will be falsified, two different axes under near-identical names. `flightdeck/flightcrew/schemas/tests-map.schema.json:76-80` carries both axes as fields on every check: `kind`, required, with the seven values of the description manual, and `class`, optional, with four values from the spec verification addendum. The two lists overlap on `statistical` and `judged`. Neither field has a description. No term anywhere names a project's own
test as distinct from a check, or names the wrapper that adapts one to a run. `testing-conventions.md:40` binds rules to a role called the test-writer; the crew file is `test-builder.md`.

**Why it matters.** The rail above has four positions and the vocabulary can name one of them. Without a word for a project's own test, nothing can say that a run must not write into it. Without a word for a wrapper, nothing can say what the test-builder produces. With two class axes and no rule about which governs, a check can be `kind: statistical` and `class: deterministic` and nothing objects. An agent given the terms file and the conventions has grounds to reject a ratio as malformed; an agent given the description has grounds to expect one.

**Effect on the system.** Every role that reads these documents inherits the ambiguity. The test-builder reads all three manuals and is bound by a conventions file that names a role that does not exist. The map schema freezes both class axes into every map. The terms file, which is meant to be the single definition the deck's documents draw on, is one of the three that disagree.

### 2. The built system carries one verdict where the manuals define three

**What.** The testing manuals were in the repository before the build began, and `testing-description.md:86-94` defines three things a check may return. The first is an exit code: the number a command hands back when it finishes, zero for pass and anything else for fail. The second is a ratio: the same scenario run many times, the passes counted, and the count compared against a threshold written down before the first run, because an agent's output varies and one run proves nothing. The third is a verdict sheet: a fresh model reads the output against a written rubric and answers a fixed set of questions, each with a quotation, for qualities no script can measure.

The system built against those manuals carries the first. The tests map schema at `flightdeck/flightcrew/schemas/tests-map.schema.json` has no field for a threshold, a sample size, a trial count, a rubric or a sheet. The check result schema at `flightdeck/flightcrew/schemas/check-result.schema.json:13` allows exactly four words: pass, fail, error, skipped. The runner at `flightdeck/flightcrew/bin/cmd/check.mjs:156` derives the word from the exit code alone and reads nothing the command printed. The gates in `flightdeck/flightcrew/checks/gates/` compare that word against pass. The test-builder at `flightdeck/flightcrew/crew/test-builder.md:22` is taught one shape of check, a suite that prints one line per case and exits 0 or 2, and its return example at `:35-39` shows only that shape.

The knowledge of the other two kinds exists in the repository, in two places the builder never reads. `flightdeck/flightcrew/templates/kickoff/task-agent.md:4` states what each class owes: a statistical check needs its sample, threshold and tolerance stated before the run and the observed rate recorded in the evidence; a judged check needs a rubric a human applies at gate three, with the verdict appended by hand as a stated event. That file is read by the orchestrator at plan time, after the map is frozen. `flightdeck/flightcrew/crew/spec-builder.md:53` requires an agent-shaped spec to say so and to open every behaviour with a class tag. `flightdeck/flightcrew/templates/tests-map.template.json:39` requires `class` only when the spec is agent-shaped. No validator enforces either rule.

**Why it matters.** The product flightcrew builds is often agent-shaped: crew definitions, skills, prompts, workflows. The manuals say so directly, that the statistical class is what makes agent-shaped artefacts checkable at all. A system that can only record pass or fail can verify the structure of such an artefact and nothing about its behaviour. The gap has three faces that appeared together. The tooling cannot record a ratio or a sheet. The builder was never taught to produce one. The gate cannot read one, and the judged kind by design needs a human at gate three that the gate does not provide. Underneath all three, the manuals describe what the two kinds are and their laws, and say almost nothing about what they look like on disk, what command produces them, or what file the result lands in. The one document that comes close is the kickoff part, read by the wrong role at the wrong time.

**Effect on the system.** Any launch whose spec tags a behaviour as statistical or judged will meet the same wall in the same order: the spec-builder tags it, the test-builder has no procedure, the map has no field, the runner reduces it to an exit code, the gate reads pass or fail. The kickoff part's own escape is to escalate the behaviour as a spec gap so a human enters it in the map's unverified list, which means the system's answer to an agent-shaped behaviour is to declare it unverified. The shape of the two missing verdicts on disk has to be decided before any role can be taught to build them.

### 3. The test-builder knows one shape and no address

**What.** `flightdeck/flightcrew/crew/test-builder.md:15` names the builder's four inputs: the frozen spec, a fixture, the codebase and the three testing manuals. No launch or run folder is among them. `:22` tells it where to write checks: the directory its dispatch names, else the project's existing test directory, else a `checks/` folder under the canonical spec folder. `:23` hardcodes the map path to that same spec folder, as do the baseline and validate commands at `:25-26` and the return example at `:35`. `flightdeck/flightcrew/crew/README.md:5` lists render commands for the worker, the critic and the verifier and none for the test-builder. Nothing under `flightdeck/flightcrew/workflows/` mentions the role. `flightdeck/manuals/launch/launch-anatomy.md:77` says the human dispatches it.

The one example of a check invoking a project's own test is `flightdeck/testbench/fixtures/sample-spec/tests-map.v1.json:40`, where the command is `node --test tests/export/behaviours.test.mjs`. It is a bare invocation. Nothing between the map and the test translates anything; the runner reads the exit code as it does for every other command. The builder is not told this pattern exists.

`testing-conventions.md:42` tells the builder to report an entry as untestable where no check can be derived. The word appears nowhere in the map schema. The nearest field, `unverified` at `tests-map.schema.json:116-129`, is described as spec nodes a human accepted as unproven and its `decided_by` allows only `human`, while `test-builder.md:39` shows the builder emitting that field with that value itself.

**Why it matters.** Under the rail the test-builder is the role that populates the run's checks folder, and it is the one run-chain role that receives no run. It cannot be given the folder because no field carries it, no command renders its dispatch, and its role file hardcodes a different destination. It has one shape of check to write, and its precedence rule sends new checks into the project's own test directory first, which under the rail is the one place a run must never write. The wrapping pattern the rail depends on is demonstrated in a fixture and taught nowhere.

**Effect on the system.** Every check the builder writes today lands either in the project's tests folder or in a spec folder that no command creates. The map it writes cannot say which rail position a command points at. The human who dispatches it supplies the paths by hand, so two dispatches of the same role can produce two layouts. And the vocabulary it is told to use for an unprovable behaviour does not exist in the file it writes, while the field that does exist is one it is forbidden by its own description to fill.

### 4. Checks have no home of their own

**What.** Four documents place checks in four places, and none is the run. `test-builder.md:22` sends them to the project's test directory, then to a `checks/` folder under the spec. `flightdeck/launch/README.md:7`, `flightdeck/manuals/launch/launch-anatomy.md:65` and `flightdeck/manuals/orchestration/journey.md:94` name that spec-folder `checks/` as the home for check scripts with no natural project home. On this branch it exists only as a one-paragraph note in a fixture, `flightdeck/testbench/fixtures/sample-spec/checks/boundary-note.md`. Neither committed run folder holds a check script. `flightdeck/flightcrew/checks/` holds eight validators, three gates and seven libraries; its keep file calls it universal check harnesses; nothing in it is named by any tests map as a check.

The testing manuals themselves never say where a check's files live. `testing-description.md:5` announces that the placements answer where a check lives, and the placements section at `:107-113` then defines four ways a check is caused to run: standalone, embedded, chained, enforced. None is a directory. The one sentence that states a filesystem rule is `testing-conventions.md:7`, that a check's files live in a directory named for its spec, and it is not repeated anywhere.

**Why it matters.** The rail gives checks a home: the run folder. Every current document points somewhere else, and the documents that promise to say where checks live say something else instead. A reader following the description manual's own map arrives at a section about invocation and leaves with no answer. A reader following the conventions arrives at a spec folder that no command creates. A reader following the builder's precedence arrives at the project's own tests.

**Effect on the system.** The placement rule that decides whether a check is a run artefact or a project artefact, the most consequential structural fact about a check, is one line in one document and is contradicted by three others. The folder named checks under flightcrew holds no checks and will confuse any reader who takes the name literally. Under the rail, all four documents and the folder name need to change together or the rail is not readable from the repository.

### 5. The lock defends paths the model will move

**What.** `flightdeck/flightcrew/hooks/lock-guard.mjs:6-13` denies edits to paths under the launch's locked list. It intercepts three tools, Edit, Write and NotebookEdit, per `hooks/lib.mjs:15`; a shell command that rewrites a file is not intercepted. It returns without checking anything during the targets phase. The locked list is empty and boundary enforcement is off from `fc launch new` until `fc launch pin tests-map`, per `bin/cmd/launch.mjs:291` and `hooks/boundary-guard.mjs:23`. At pin, `launch.mjs:441-445` adds the map's own locked paths plus two globs: the run's `specs/` subfolder and the canonical spec folder. `bin/cmd/boundary.mjs:42-46` treats everything under the run folder as inside the boundary unconditionally.

Every one of the thirty suites under `flightdeck/testbench/suites/` imports `../../lib/suite-lib.mjs`, outside its own directory. That library is locked because the map lists `flightdeck/testbench/lib/**`. No field in the map declares that a check depends on it. The map's only statement of what a check touches is its `command` string.

**Why it matters.** Under the rail, checks move into the run folder. The lock as built covers the run's `specs/` subfolder and nothing else inside the run, and the boundary check counts the whole run folder as inside bounds. A run-local `checks/` folder would therefore be protected by neither guard. The lock also guarantees only what it can see: an implementer that edits a check through the shell, or edits a helper the check imports that the map does not list, is not stopped. The guides' principle is that a check the agent can edit is a suggestion and a check it cannot edit is a target. Today the target is held by the accident that every assertion sits inside a listed path.

**Effect on the system.** The two guards, the pin command and six locked suites that assert the current glob composition all encode the old layout. Moving checks into the run changes what the lock must cover and what the boundary must exclude, and the map needs a way to declare a check's dependencies so that locking the check locks what decides its verdict.

### 6. The map series and the run disagree about where the map lives

**What.** The tests map is versioned like the spec. `flightdeck/manuals/versioning/tests-map-versioning.md:7-13` places the series beside the spec, one folder holding `tests-map.v1.json`, `tests-map.v2.json` and so on, and `:135` revises by copying the latest file to the next number in the same folder. `tests-map.schema.json:34-49` requires each `previous_versions` entry to name the earlier file, and `flightdeck/flightcrew/checks/validators/validate-tests-map.mjs:97-98` resolves the pinned spec by looking for `spec.v<n>.json` beside the map.

**Why it matters.** The rail puts checks in the run folder because they change between runs. The map is the document that names the checks, and it is also a versioned series whose versions absorb the log's decisions. Those two facts pull in different directions. If the map lives with the checks in the run, the series is split across run folders and every sibling reference above breaks. If the map lives with the spec series in the launch's `specs/` folder, it describes checks that sit in a different folder, and a map version and the run whose checks it names have to be tied together some other way.

**Effect on the system.** Nothing in the current system can hold either arrangement, since it knows only the canonical spec folder. The decision is open and is listed below. Until it is made, the test-builder's destination, the pin command's copy target, the lock's globs and the validator's resolution rule cannot be specified.

### 7. Rules live where the builder does not read

**What.** `flightdeck/testbench/tests.keep` states the harness rule in four lines: harnesses are reusable across branches, the folder is merge-protected, launch results never go there, and `runs/` holds local output. No file under `flightdeck/flightcrew/crew/` mentions `testbench` or the keep file. The conventions tell the builder to report untestable entries; the schema has no such field, and the field it does have is marked as a human's decision. The description of what a statistical or judged check owes sits in a kickoff part read by the orchestrator after the map is frozen, not in the builder's role file or in the manuals the role file names.

**Why it matters.** The guides' principle is that each role reads its own tailored context and nothing else, and that a rule an agent should follow is one it will eventually break unless it is in front of it or enforced. Three rules that govern what the test-builder writes are in places the test-builder is never sent. The role file's own instruction that auto-loaded project instructions do not apply to it closes the last route by which it might have found them.

**Effect on the system.** A test-builder following its role file to the letter produces checks that ignore the harness rule, uses a word the map cannot hold, and never learns what a varying-class check needs. The rules exist. They are not addressed to the role that needs them.

## Decisions the rail forces

- Where the tests map lives: with the spec series in the launch's `specs/` folder, or with the checks it names in the run folder. The version series as built assumes one folder.
- What a statistical check and a judged check look like on disk: what command produces each, what file the ratio or the sheet lands in, and how a gate reads it. Nothing can be built for the two missing verdicts until this is fixed.
- Whether a run-local check wrapper is a script of its own or only a command string in the map, given that the runner already turns any command's exit code into a verdict.
- Whether `flightdeck/flightcrew/checks/` keeps its name, given that it holds no checks in the map's sense.
