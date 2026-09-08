<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + a launch builds one feature; it holds the spec series and every run made against it
  + a run is one attempt at the launch; runs retry until one succeeds
  + target layout: launch/<name>/specs/{interview/, spec.v1.json, test-map.v1.json}, launch/<name>/runs/run-<n>/, launch/FLIGHTLOG.md
  + one spec, single source of truth; no duplicated spec files
  - the run log carries findings forward between runs, so run outputs can be overwritten or discarded
  - the preserved residue of a run is the versioned inputs and the log entry
  - the genesis: initial requirements handed to an agent to build the whole system in one pass
  - no fixing in this conversation; the documents feed the plan for a fix launch
  - the user stood corrected: the guides' layout (specs outside runs, runs numbered) is the way, adapted to a single folder
  - the two problem files were afterthoughts of a larger discovery session
agent points
  - the guides' run folder holds six outputs: kickoff version used, plan, events, check outputs, review findings, report
  - the guides' salvage rule: setup survives runs, output does not; spec and tests are setup, plan and partial implementation and transcript are output
  + the guides point at the spec by commit and never copy it into a run
  + flightcrew copies the spec and map into every launch and locks the copies; three byte-identical spec files exist
  - launch.json has no field for the feature or the attempt number; identity is the folder name; previous_launch is computed once at creation and ordered by file modification time
  + the runner refuses an existing launch directory with no override; the default name is spec-name dash n
  + fc launch new accepts a draft spec; frozen is enforced at activate and at map pin
  + no command creates the spec folder, the interview folder or an idea file; the interview directory appears in code only in a validator skip list
  + the crew README names a spec-stage dispatcher that does not exist; no interviewer role exists on any branch; the empty interviewer file is untracked
  + every spec in the repository was grown by hand in a run folder: idea, interview, judge, attacker, spec
  + run 1 records a branch that never existed; run 2 records the trunk it was later merged into; units ran in the shared working tree
  + the run log template has axis fields (seen on, fixed on) for abandoned runs and none for accepted runs; the manual says the human writes them; the orchestrator filled them and marked them drafts
  + the run log headings name spec and launch folder, not feature and run number, so lineage between entries is invisible
  + the launch README describes checks/ and interview/ under the spec folder and a hooks.log in the launch; none exist
  + STRUCTURE.md shows an example launch with checks/ and specs/; it exists only on main and constitution-research and no such path ever existed in history
  + the design contract instructed removal of the run's checks/ folder as a build step
  + both launches ended with their final gate pending
  + run 1 holds returns and notes and no review; run 2 holds review and no returns; hooks were not installed so agent starts are stated and run 2 records zero agents
  + the guides disagree on the abandoned branch: the map leaves it as it is, the endings guide deletes it
  + three run-folder shapes exist across branches: specs outside runs, specs grouped under a named folder, spec inside the run beside interview and judge folders
  + the two completed launches cannot be moved post hoc without editing frozen maps, launch.json paths, a hardcoded runner path and a locked suite asserting the log filename
  - run-problems 1, 2, 4, 5 are dissolved: two launches for two attempts is the guides' model
  - run-problem 3, the refusal to reuse, is correct behaviour at the attempt level
  - run-problem 10, two log entries for two attempts, is correct
  - the mission name collided with the existing missions folder; the user dropped it

## agent context
recommended
  + state the target model once at the top as the standard every problem is measured against
  + list which former run defects the model dissolves, so a planner does not re-open them
  + list the decisions the model forces on the human, without proposing answers
  - name the principle each problem violates, from the constitution or the guides
possible
  - a per-problem severity or blocking flag; the user said triage is the fixer's concern
  - a residue table of preserved versus overwritten outputs; the user has not settled it
edge cases
  + the other branches hold spec folders in the third shape; the layout decision does not migrate them
  + the report of an abandoned run is output the guides commit because the log entry is written from it; the overwrite model has to decide its fate

## meta
user steering
  - describe each problem in isolation: what it is, why it matters, how it affects the wider system
  - one document per domain holding a set of problems; this one is structure
  - diagnosis only, no remediation
  - explorers verified evidence on flightcrew-buildout at 75b2b42; quote facts not recollection
  - origin is universal and stated once: the orchestrator had no flightcrew to use and built with its own system
decisions
  + the launch folder is the unit of work; the run folder is the unit of attempt
  + the spec series lives inside the launch, adjacent to the runs it drives
  + the log lives beside the launches as FLIGHTLOG.md
  - the two completed launches stay as they are; the model applies from the next launch
constraints
  + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch
  + agent-agnostic: a reader has none of this conversation

## language
vocabulary
  + :launch: — the folder for one feature: its spec series and every run made against it
  + :run: — one attempt at a launch, numbered, disposable
  + :run outputs: — what a run writes: kickoff version, plan, events, check outputs, review, report
  + :setup: — what survives runs: spec, tests map, interview, kickoff library, agent files, the log
  + :output: — what a run produces and a later run does not inherit
  - :mission: — dropped; collides with flightdeck/missions
  - :attempt:, :instance: — say run
  - :launch: in the flightcrew v1 sense of one attempt — the document must say which sense it means when quoting the old system
style
  - single lines, no wrapped paragraphs; no markdown tables in chat, tables allowed in the file

## audience
agent/human
  - the planner of the fix launch, any model, any session, reading from the file alone
purpose
  - describe the structure problems so a plan can address them without re-deriving them
=== END CHAT SUMMARY ===
-->

# Structure problems

<!-- ===META=== two short paragraphs: what this document is, the domain it covers, and that it diagnoses and does not remediate; name the branch and commit observed -->
<!-- + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch -->
This document describes the structure problems of the flightcrew orchestration system: how a piece of work, its spec, its attempts and its record are named and laid out on disk. It is one of a set of problem documents, each covering one domain, written to inform the plan of a later launch that will address them. It diagnoses. It proposes no remediation.

Every observation was verified on branch `flightcrew-buildout` at commit `75b2b42`. Paths and line numbers refer to that revision. The working tree may be checked out on another branch, so read evidence with `git show flightcrew-buildout:<path>` rather than from disk. Where a claim concerns another branch, the branch is named.

## Agent Invariants

<!-- ===META=== a terse bulleted list of the rules a reader of this document must hold; restated from the sections below -->
<!-- + the launch folder is the unit of work; the run folder is the unit of attempt -->
<!-- + one spec, single source of truth; no duplicated spec files -->
<!-- + agent-agnostic: a reader has none of this conversation -->
- The launch is the unit of work. The run is the unit of attempt. Neither stands in for the other.
- A spec exists once, in one place, and is referenced from everywhere else by version and commit. No launch, run or tool holds a copy.
- The reader has none of the conversation that produced this document. Every claim here stands on the cited evidence alone.

## The target model

<!-- ===META=== a fenced tree of the layout, then one paragraph per term defined at first use; this is the standard every problem below is measured against -->
<!-- + state the target model once at the top as the standard every problem is measured against -->
<!-- + target layout: launch/<name>/specs/{interview/, spec.v1.json, test-map.v1.json}, launch/<name>/runs/run-<n>/, launch/FLIGHTLOG.md -->
<!-- + a launch builds one feature; it holds the spec series and every run made against it -->
<!-- + a run is one attempt at the launch; runs retry until one succeeds -->
<!-- + :launch: — the folder for one feature: its spec series and every run made against it -->
<!-- + :run: — one attempt at a launch, numbered, disposable -->
<!-- + :run outputs: — what a run writes: kickoff version, plan, events, check outputs, review, report -->
<!-- + :setup: — what survives runs: spec, tests map, interview, kickoff library, agent files, the log -->
<!-- + :output: — what a run produces and a later run does not inherit -->
<!-- + the spec series lives inside the launch, adjacent to the runs it drives -->
<!-- + the log lives beside the launches as FLIGHTLOG.md -->
The layout every problem below is measured against:

```
flightdeck/launch/
  <name>/
    specs/
      interview/
      spec.v1.json
      test-map.v1.json
    runs/
      run-1/
      run-2/
  FLIGHTLOG.md
```

A **launch** is the folder for one piece of work. It is named for the feature it builds and holds two things: the spec series that defines the work, and every run made against that series. A launch is opened once and stays open until a run is accepted. Under the flightcrew v1 system the word launch meant a single attempt; where this document quotes that system, it says so.

A **run** is one attempt at a launch. Runs are numbered in the order they are made and are disposable: a run that fails is ended, diagnosed, and never reopened. The next run starts clean against the same or an amended spec version. A launch accumulates runs until one succeeds.

The **spec series** lives under the launch in `specs/`, beside the runs it drives. Each version is an immutable file. A revision is a new file with the version incremented, never an edit. The `interview/` folder holds the material the spec was grown from: the idea, the questions, the findings, the judge and attacker verdicts. It is never copied anywhere.

**Run outputs** are what a run writes into its own folder: the kickoff version it was given, the plan, the event log, the check outputs, the review findings and the report. Run outputs belong to the run that made them.

**Setup** is what survives runs: the spec series, the tests map, the interview, the kickoff library, the agent definitions and the log. **Output** is what a run produces and a later run does not inherit.

The log is `FLIGHTLOG.md`, one file beside all launches, with one entry per run.

## Problems

<!-- ===META=== one subsection per problem; each has three short paragraphs led by the bold words **What**, **Why it matters**, **Effect on the system**; evidence cited by path and line; no remediation -->

### 1. The system names an attempt where the work is a launch

<!-- + the runner refuses an existing launch directory with no override; the default name is spec-name dash n -->
<!-- + the run log headings name spec and launch folder, not feature and run number, so lineage between entries is invisible -->
<!-- + :launch: in the flightcrew v1 sense of one attempt — the document must say which sense it means when quoting the old system -->
**What.** The flightcrew v1 runner creates one folder per attempt and calls it a launch. `flightdeck/flightcrew/bin/cmd/launch.mjs:267` refuses to open a folder that already exists, `launch exists: <path>`, and the flags it accepts at `launch.mjs:257` offer no override. Its default name, `launch.mjs:231-237`, is the spec name followed by the first free integer. The two completed attempts at building flightcrew were given the names `flightcrew-buildout` and `flightcrew-buildout-2` with the `--name` flag. The log `flightdeck/launch/RUNLOG.md` heads each entry with the date, the spec name and the folder name, so the entry for the second attempt reads as a run of a different thing rather than the second run of the same thing.

**Why it matters.** Under the target model the folder the runner creates is a run, and the thing it refuses to reuse is correct at that level: a run is never reopened. What is missing is the level above it. Nothing in the system names the launch, so the attempts of one piece of work have no common parent, no shared address, and no count. The refusal that protects a run from being resumed also prevents the work from ever having a home.

**Effect on the system.** Every consumer that should operate on a launch operates on a folder instead. The planner reads the log for prior runs of the same spec by matching the spec name in headings. The next attempt is found by scanning sibling folders. Two attempts at the same feature look identical to two unrelated features that happen to share a spec. The single word the system uses for both concepts hides the distinction from every agent that reads its output.

### 2. The spec is copied where it should be pointed at

<!-- + flightcrew copies the spec and map into every launch and locks the copies; three byte-identical spec files exist -->
<!-- + the guides point at the spec by commit and never copy it into a run -->
<!-- + one spec, single source of truth; no duplicated spec files -->
**What.** `fc launch new` copies the spec file into the new folder at `launch.mjs:304-305`, and `fc launch pin tests-map` copies the map the same way. On this branch `flightdeck/launch/specs/flightcrew-v1/spec.v1.json`, `flightdeck/launch/flightcrew-buildout/specs/flightcrew-v1/spec.v1.json` and `flightdeck/launch/flightcrew-buildout-2/specs/flightcrew-v1/spec.v1.json` are the same git blob. Each copy is then added to the run's locked paths, `launch.mjs:443-444`, and the design contract at `flightdeck/launch/specs/flightcrew-v1/design.md:286` records the arrangement as intended: launches hold pinned copies.

The source guides this system was built from never copy the spec. The kickoff guide names the spec by path and frozen commit and says pointers, not copies, so there is exactly one version of the truth. The planning guide's plan header carries the spec as a path at a commit. The spec guide has the run log reference the commit the spec was frozen at.

**Why it matters.** `launch.json` already pins the spec by version and by the commit of the file, so the copy adds nothing the pin does not carry. What it adds is a second and third location where the bytes of the spec exist, each locked separately, each able to drift from the source without any check noticing. A single source of truth is the property the whole method rests on: the orchestrator, the test-builder and the critic must read the same definition of the work. Three files that happen to be identical today are not one file.

**Effect on the system.** Every launch folder is larger than its evidence by the size of the spec and map. The locked-path list of every map includes globs for the copies, so the lock guard and the changed-since-lock check spend effort defending files that should not exist. Under the target model, where the spec series lives inside the launch beside its runs, the copies become copies of a file in the parent folder. The design contract's statement that launches hold pinned copies is the line a planner has to reverse.

### 3. The spec-making stage has a home in the model and no owner in the system

<!-- + no command creates the spec folder, the interview folder or an idea file; the interview directory appears in code only in a validator skip list -->
<!-- + the crew README names a spec-stage dispatcher that does not exist; no interviewer role exists on any branch; the empty interviewer file is untracked -->
<!-- + every spec in the repository was grown by hand in a run folder: idea, interview, judge, attacker, spec -->
<!-- + fc launch new accepts a draft spec; frozen is enforced at activate and at map pin -->
**What.** The target model gives the interval before a spec is frozen an address: `specs/interview/` under the launch. Nothing in the flightcrew v1 system produces anything at that address. No command under `flightdeck/flightcrew/bin/` creates a spec folder, an interview folder or an idea file. The only mention of `interview` in code is `flightdeck/flightcrew/checks/validators/validate-all.mjs:26`, where the validator lists it among directories to skip. The crew README at `flightdeck/flightcrew/crew/README.md:5` and `:28-41` describes a spec-stage dispatcher that passes fixed paths to the spec-builder, including the interview subdirectory. No such dispatcher exists among the twenty command modules. No interviewer role exists on any branch. The file `flightdeck/flightcrew/crew/spec-interviewer.md` is a zero-byte untracked file in the working tree, and `flightdeck/STRUCTURE.md` on branches `main` and `constitution-research` describes it as deliberately empty and the thing the next launch builds.

Every spec in the repository was nonetheless grown by exactly this process, by hand. On branch `constitution-research`, `flightdeck/launch/reference-library/` holds `idea.txt`, `interview/problems.json`, `interview/findings.json`, `interview/bundles/P1.json` through `P5.json`, and `spec.v1.json`. On `engage-crew`, `flightdeck/launch/agent-spec-interviewer/` holds the same shape plus `judge/` and `attacker/` verdicts. The runner accepts the result of that process only once it is a file: `launch.mjs:258-264` requires the spec path to exist and carry a name, and tolerates a draft, deferring the frozen check to `fc launch activate` at `launch.mjs:334-341`.

**Why it matters.** The source guides make the spec-building session stage one of the method, the cheapest exit in the whole process, and the place the human is the main character. It has three roles: an interviewer that asks and never drafts, an attacker in a fresh context, and a judge that rules on readiness. Two of the three exist as crew files on this branch. The stage they belong to has no command, no folder the tooling knows, and no recorded starting point. The interval in which the spec is made is the only interval the system does not model.

**Effect on the system.** Both folders that carry an interview shape have it because the operator knew the shape. Nothing in the repository states it, creates it or would reproduce it. A new launch begins wherever the human puts the first file, and the tooling meets the work only when a frozen spec is handed to it. Under the target model the address exists and is empty, which is an improvement on having no address, and is not yet a stage.

### 4. A run branch is recorded and never made

<!-- + run 1 records a branch that never existed; run 2 records the trunk it was later merged into; units ran in the shared working tree -->
<!-- + the guides disagree on the abandoned branch: the map leaves it as it is, the endings guide deletes it -->
**What.** `launch.mjs:288` records a branch name in `launch.json`, defaulting to `run/<name>`, and never creates it. The only later use is at `launch.mjs:571-573`, where a mismatch between the checked-out branch and the recorded one produces a warning. `flightdeck/launch/flightcrew-buildout/launch.json` records `run/flightcrew-buildout`. No such ref exists locally or on the remote. `flightdeck/launch/flightcrew-buildout-2/launch.json` records `flightcrew-buildout-v1`, which is the trunk the buildout branch was later advanced from and which PR #1 merged into it. The first run's report, `flightdeck/launch/flightcrew-buildout/report.md`, states that units ran as parallel build sessions in the repository working tree rather than in per-unit worktrees, so no unit branches were created.

The source guides do not agree on what becomes of a run's branch. The map page says that on exit the branch is left as it is. The endings guide's final abandonment step says delete the run's branches, remove its worktrees, prune.

**Why it matters.** The guides' isolation principle is one branch per run, cut at liftoff, with one worktree per worker and one atomic commit per unit, so that a failed unit is a discarded branch and a resumed run is a checkout. A recorded branch that was never cut gives the record the appearance of that discipline without the substance. A reader of `launch.json` learns a branch name that resolves to nothing, and a planner who believes the record will plan a resume that cannot happen.

**Effect on the system.** Neither run had a branch of its own, so neither run's work can be found by branch, and both runs' evidence is interleaved with the trunk's history. The branch convention `run/<name>` was abandoned on the second run rather than extended, and under the target model the convention itself needs a second component for the run number. The unresolved question in the guides, whether an abandoned run's branch is kept for its evidence or deleted to clear the ground, was inherited by the system and answered by making no branch at all.

### 5. The log cannot show lineage or hold the human's diagnosis

<!-- + the run log template has axis fields (seen on, fixed on) for abandoned runs and none for accepted runs; the manual says the human writes them; the orchestrator filled them and marked them drafts -->
<!-- + the run log headings name spec and launch folder, not feature and run number, so lineage between entries is invisible -->
**What.** `flightdeck/flightcrew/templates/runlog-entry.template.md` defines two entry shapes. The abandoned and partial shape carries `seen on`, `cause`, `fixed on`, `change`, `watch`, `kept` and `promote`. The accepted shape carries `kept` and `reservation` and no axis field. `flightdeck/manuals/orchestration/run-log.md:60` states that the human writes the five diagnosis fields and commits the entry, and that an agent never writes a `<fill>` field. In `flightdeck/launch/RUNLOG.md:24-30` every diagnosis line of the first run's entry is prefixed `draft (orchestrator):`. The commit that added the entry, `733f79f`, describes the fields as filled by the human. A later commit, `19faef3`, relabelled them as orchestrator drafts. Both entries head with the date, the spec name and the folder name, `RUNLOG.md:3` and `:18`, so nothing in the heading says that the second entry is the second run of the first.

**Why it matters.** The log is the one document the target model preserves across runs by design, and the source guides call it the highest-leverage document in the project because the spec template, the kickoff library and the hook set are iterated against it. Its value depends on two properties. The diagnosis is the human's judgement about the setup, which the run could not see, and a machine's draft in its place turns the comparison between runs into fiction. The entries of one launch read as a sequence, so that a pattern pass can count axes per launch and the planner can read the prior runs of the work it is planning. The current log has neither property.

**Effect on the system.** The planner reads this file before writing a plan for the same spec, and finds the first run's failure and the second run's reservation presented as unrelated observations. The relationship survives only in a `previous_launch` field the log does not carry. Under the target model the log becomes `FLIGHTLOG.md` beside all launches, and its headings need the launch name and the run number so that lineage is visible without following pointers.

### 6. Documents describe shapes that were never built

<!-- + the launch README describes checks/ and interview/ under the spec folder and a hooks.log in the launch; none exist -->
<!-- + STRUCTURE.md shows an example launch with checks/ and specs/; it exists only on main and constitution-research and no such path ever existed in history -->
<!-- + the design contract instructed removal of the run's checks/ folder as a build step -->
<!-- + both launches ended with their final gate pending -->
**What.** `flightdeck/launch/README.md:7` describes the spec folder as holding `checks/` for check scripts with no natural project home and `interview/`, and `README.md:13-23` sketches a launch folder containing `hooks.log`. On this branch `flightdeck/launch/specs/flightcrew-v1/` holds `design.md`, `spec.v1.json`, `tests-map.v1.json` and `tests-map.v2.json`, no `checks/` and no `interview/`. Neither committed launch contains a `hooks.log`. `flightdeck/STRUCTURE.md`, which exists on `main` and `constitution-research` and not on this branch, shows `launch/example-launch/` containing `checks/` and `specs/`. An enumeration of every tree reachable from every ref finds no path containing `example-launch` and no `flightdeck/launch/<run>/checks/` anywhere in history. `flightdeck/launch/specs/flightcrew-v1/design.md:279` instructs that the existing empty `launch/flightcrew-buildout/checks/` and `specs/` folders are removed before the launch is created, which is why the directory appears in no commit. Both `launch.json` files record gate `G3` as pending while carrying a final outcome and the phase `ended`.

**Why it matters.** These documents are what an agent reads to learn the shape of the system. The source guides' context principle is that boundaries and decided questions are written down before the run starts, and that a role reads its own tailored context. A map that states intent as fact, a README that names files nothing produces, and a record that ends a run without its last gate each hand an agent a false premise that the agent has no way to test. The structure document states its own standard, that it records directories only so it stays true as files churn, and then shows directories that never existed.

**Effect on the system.** A planner working from the README plans for a checks folder that no command creates and a hooks log that no hook writes. The check-building path already inherits the error: `flightdeck/flightcrew/crew/test-builder.md:22` names the spec folder's `checks/` as its final fallback for placing a check. The design contract's one-off removal instruction outlived the run it was written for and became the reason the artefact and the map disagree. Under the target model all three documents need rewriting, and until they are the layout decision changes nothing an agent can read.

### 7. Run outputs are not a defined set

<!-- + run 1 holds returns and notes and no review; run 2 holds review and no returns; hooks were not installed so agent starts are stated and run 2 records zero agents -->
<!-- + the report of an abandoned run is output the guides commit because the log entry is written from it; the overwrite model has to decide its fate -->
**What.** The two completed launches hold different things. `flightdeck/launch/flightcrew-buildout/` holds `returns/` with seven unit returns and a `notes.md`, and no files under `review/`. `flightdeck/launch/flightcrew-buildout-2/` holds `review/` with two critic passes, no files under `returns/`, and no `notes.md`. `fc launch new` creates `evidence/`, `returns/` and `review/` as empty directories and an empty `events.jsonl`, `launch.mjs:304-309`, and git does not track the empty ones. The first run's `events.jsonl` carries nine `SubagentStart` events marked `source: stated`, each with the reason that the hooks were not installed and the start is recorded by hand. The second run's report records zero agents. Neither run's report header carries a token count; both read `not recorded`.

**Why it matters.** The target model treats run outputs as belonging to the run and as the material the log entry is written from. That only works if the set is known. The source guides make the report's provenance its most important property and judge a harness by the ratio of recorded lines to stated lines. A run whose agent starts are stated by hand, whose cost is not recorded, and whose folder holds whichever outputs the operator happened to produce is a run whose report cannot be compared with the next one.

**Effect on the system.** The report assembler renders what it finds, so the two reports differ in shape as well as content. The endings guide expects an abandoned run's report to be assembled anyway and kept, because the log entry is written from it, and the target model has not yet said whether an abandoned run's outputs are kept, archived or overwritten. Until the set of run outputs is fixed and each item's fate is decided, the run folder is a directory of leftovers rather than a record.

### 8. Three shapes exist across branches

<!-- + three run-folder shapes exist across branches: specs outside runs, specs grouped under a named folder, spec inside the run beside interview and judge folders -->
<!-- + the other branches hold spec folders in the third shape; the layout decision does not migrate them -->
**What.** Three incompatible layouts for a spec and its runs exist in this repository at once. On `flightcrew-buildout`, the spec series sits in `flightdeck/launch/specs/<name>/` outside every run folder. On `engage-crew`, twelve agent-type specs sit grouped under `flightdeck/launch/agent-types/specs/`. On `constitution-research` and `engage-crew`, the spec sits inside the run folder beside `interview/`, `judge/` and `attacker/`, as in `flightdeck/launch/reference-library/` and `flightdeck/launch/agent-spec-interviewer/`. The third shape is the one every spec in the repository was produced under. The first is the one the tooling enforces.

**Why it matters.** The target model is a fourth shape. It is closest to the third, in that the spec and its interview sit with the work, and it adds the runs as numbered children. Adopting it settles the question for new launches and settles nothing for the folders that exist. The branches that hold the third shape are discovery work the owner has asked to keep.

**Effect on the system.** A tool written to the target model will find folders on other branches that it cannot read, and a validator that walks `flightdeck/launch/` will meet three layouts. The migration of the existing folders to the new shape is a separate piece of work from the layout decision, and this document records it as one of the decisions the model forces rather than as part of the model.

## Dissolved by the model

<!-- ===META=== one short paragraph then a bulleted list of the former run defects that are not defects under the target model, each with the one-line reason -->
<!-- + list which former run defects the model dissolves, so a planner does not re-open them -->
An earlier diagnosis of these problems, written before the source guides were read, treated the second attempt at building flightcrew as a defect of identity: one piece of work occupying two folders, a run with no concept of an attempt, a pointer standing in for containment, and a version series hoisted out of the run because the run could not hold it. Under the target model, and under the guides it comes from, none of those is a defect.

- **Two folders for two attempts.** A run is disposable and is never resumed with corrections. Two attempts are two runs, and the guides' own layout numbers them as siblings under one parent. The defect is the missing parent, recorded as problem 1, not the sibling folders.
- **No attempt field in the run record.** A run is one attempt by definition. The field that is missing is the launch it belongs to, not an attempt counter inside it.
- **The refusal to reuse a run folder.** Correct at the level of a run. The guides forbid reopening an abandoned session and forbid the changeless retry.
- **The version series outside the run.** The spec series is setup and survives every run, so it belongs outside every run folder. The guides place it in a per-spec folder; the target model places it in the launch folder beside the runs. Both keep it out of the run.
- **Two log entries for one spec.** One entry per run is the guides' rule. The defect is that the entries do not show they belong to one launch, recorded as problem 5.

## Decisions the model forces

<!-- ===META=== a bulleted list of open decisions for the human, each one line, no recommendation -->
<!-- + list the decisions the model forces on the human, without proposing answers -->
<!-- + the guides disagree on the abandoned branch: the map leaves it as it is, the endings guide deletes it -->
<!-- + the report of an abandoned run is output the guides commit because the log entry is written from it; the overwrite model has to decide its fate -->
<!-- + the two completed launches cannot be moved post hoc without editing frozen maps, launch.json paths, a hardcoded runner path and a locked suite asserting the log filename -->
<!-- + the other branches hold spec folders in the third shape; the layout decision does not migrate them -->

- Whether an abandoned run's branch is kept for its evidence or deleted to clear the ground. The two source guides disagree and the system inherited the disagreement.
- Whether an abandoned run's outputs, and its report in particular, are kept in place, archived, or overwritten once its log entry is written.
- Whether the two completed launches on `flightcrew-buildout` are left as they are or moved. Moving them requires editing two frozen tests maps whose locked paths name the old spec folder, both `launch.json` files whose paths point inside their own folders, a runner that hardcodes the old spec path when it locks, and a locked suite that asserts the log's filename.
- Whether the spec folders on `constitution-research` and `engage-crew`, which hold the third shape, are migrated to the target model, left in place, or both.
