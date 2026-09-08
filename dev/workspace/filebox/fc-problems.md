<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + the expected tooling was what the constitution's orchestration tooling document names: hooks, skills, agent definitions, workflow scripts, templates, schemas, flat files, and a few scripts in bin such as a worker prompt injector
  + the constitution documents were deliberately withheld from the builder so as not to spoil its context and to see what it would produce
  + roles chain by handing documents forward: the spec-builder receives an idea, the test-builder receives a spec, the orchestrator receives the spec, the tests and the kickoff
  + the system has two kinds of state: freeze state and phase state
  + freeze state lives in the document: a file whose status field reads frozen is immutable, and a hook enforces that by reading the file it is about to edit; this applies to spec, tests map and plan alike and needs no knowledge of any run
  + phase state lives in launch.json at the launch level: gates, current phase, and the name of the current run; a local web page reads and writes it live
  + launch.json naming the current run makes that run the only runnable one; a failed run is closed by pointing the launch at a new run folder
  + a runner is intended, as deterministic tooling: scaffolding a launch or a run, rendering, counting budgets, wrapping checks; it reads launch.json or takes paths and arguments, and may grow as far as the built one eventually
  + the runner is not the human's control surface; local web pages are, writing to launch.json or to a document
  + a control-center file under flightdeck will hold active configuration such as the launch directory, and later other configuration
  + the deterministic-tools principle pushed the builder toward a runner, and the builder went too far rather than in the wrong direction
  + 57 of the spec's 78 behaviour and edge nodes name the runner and 40 describe a runner command; the spec may have been light on flightcrew behaviours
  + the seam for the next spec version: a node about an artefact's state, a hook's enforcement, a role's inputs and outputs, or a rendering's content stays; a node about the runner's arguments, resolution order, output format, exit codes or subcommands is implementation
  - the user objected to the name during the build and was told a rename was 900 occurrences; the rename never happened
  - the later interface is called flight and will absorb the dev-workspace command surface
agent points
  + across the three constitution documents and twelve guides, no central runner, bin directory, command suite or named executable appears; the word CLI appears six times, all about existing tools or Claude Code's own commands
  + the sources say run state is distributed: events written by hooks, the plan by the orchestrator with references and no status, checks by a wrapper, returns by workers, the report a late join; status is not on the plan, that is the report's job
  + the sources have the human advance a run by leaving plan mode, by a gate page writing an approval block into the plan, by replying in a halted session, or by editing the plan file; never by typing a command
  + the pre-build scaffold held a bin folder whose keep file read runnable scripts needed for every launch, and one loose script
  + the runner was never proposed or weighed against alternatives in the build transcript; it appears in the design contract's preamble as settled and is filed under decisions not to reopen with one bullet; the spec's only justification is decision D2, one surface to remember and nothing to install
  + interface I1 is the runner itself; the orchestrator was given no write tools and writes only through fc; the scribe role was removed because report assembly is a command
  + both critic passes fault the runner's fidelity to its spec and never question its existence, name or size
  + the runner and its libraries are two thirds of the flightcrew folder by lines; the crew is four percent; the hooks five percent; the launch command module alone is longer than the crew and hooks together
  + 19 commands, 44 invocable forms; the orchestrator role file is told to run fc 29 times; eleven of the 29 locked suites test fc subcommands directly and 22 spawn it
  + eight commands write launch.json and nothing else does; every phase, gate, pin, end and land is a runner write
  + freeze is enforced through the launch's locked-paths list, populated at pin from the map: the lock guard is off during targets, empty until pin, reads launch.json to decide, and a hand edit to a pinned copy is never reported
  + the guards must resolve an active launch before deciding anything: an environment variable, else the single launch whose status is active; two active launches make every command fail
  + the human types fifteen commands across a run, eight of which advance state; seven of the eight are launch subcommands
  + the runner renders every artefact: kickoff, plan, dispatch prompts, evidence page, report, run log stub; none can be produced without it
  + the two guards read launch.json directly and work with the runner deleted; the validators are programs in their own right; the workflow scripts call fc zero times because the runtime forbids shell, so a workflow-shaped wave writes no state and the orchestrator catches up afterwards
  + eight commands break the one-line success rule; the spec's constraint on it was carried into the log as a conflict; the evidence render swallows every error; the shim depends on node on PATH
  + the run log credits the runner with the record produced by commands not by hand; the sources get that property from hooks, a wrapper and an assembler
  + leaf candidates among the built commands: check, boundary and locked, the three renders, evidence and report and the run log stub, plan render, return, validate and lint, budget, worker merge; not leaves: the eleven launch subcommands, distribute, doctor
  - the token fc appears on 1,660 lines across 164 files

## agent context
recommended
  + state the target shape once at the top as the standard every problem is measured against
  + list the decisions the shape forces on the human, without proposing answers
  + reference the structure and testing problems documents rather than restating their models
possible
  - a per-problem severity flag; triage is the fixer's concern
edge cases
  + the control-center file is mutable state outside git; nothing gated may depend on it, and parallel worktrees either inherit it or need their own
  + if launch.json were deleted, the next role must still be able to tell from the artefact it holds whether it may proceed; launch.json is an index of phase state, not the freeze

## meta
user steering
  - describe each problem in isolation: what, why it matters, effect on the wider system
  - one document per domain; this one is the runner
  - diagnosis only, no remediation
  - evidence is what was built; the two runs were Claude Code workflows, not flightcrew runs
  - origin stated once: the orchestrator built with its own system because flightcrew did not exist
decisions
  + freeze state is enforced from the document; phase state is held in launch.json at the launch level
  + the runner is tooling behind pages and hooks, not the control surface
  + the foundation runs without an interface layered over it
constraints
  + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch
  + agent-agnostic: a reader has none of this conversation

## language
vocabulary
  + :runner: — a program of leaf commands that scaffolds, renders, counts and wraps; it reads launch.json or takes paths, and holds nothing between calls
  + :control surface: — what a human uses to read and advance a run; here a local web page writing to launch.json or to a document
  + :freeze state: — whether a document is immutable; written in the document's own status field and enforced by a hook that reads the file it is about to edit
  + :phase state: — where a launch is: current run, phase, gates; written in launch.json by a page or the runner
  + :leaf command: — a command that takes paths and arguments, writes one artefact, and works when called alone
  - :fc: — the built runner's name; use runner unless quoting
  - :launch: in the flightcrew v1 sense; the structure document defines the current sense

## audience
agent/human
  - the planner of the fix launch and the author of the next spec version, any model, any session, reading from the file alone
purpose
  - describe the runner problems so a plan can address them and a spec can be versioned with the runner in its place
=== END CHAT SUMMARY ===
-->

# Runner problems

<!-- ===META=== two short paragraphs: what this document is, the domain, diagnosis not remediation, branch and commit, the evidence rule, and the origin stated once including the withheld constitution -->
<!-- + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch -->
<!-- + the constitution documents were deliberately withheld from the builder so as not to spoil its context and to see what it would produce -->
<!-- + the deterministic-tools principle pushed the builder toward a runner, and the builder went too far rather than in the wrong direction -->
<!-- + reference the structure and testing problems documents rather than restating their models -->
This document describes the problems of the flightcrew v1 runner, the command-line program at `flightdeck/flightcrew/bin/fc` that the built system drives every run through. It is one of a set of problem documents, each covering one domain, written to inform the plan of a later launch and the next version of the spec. It diagnoses. It proposes no remediation. The run folder model is defined in the structure problems document and the check placement model in the testing problems document; neither is restated here.

Every observation was verified on branch `flightcrew-buildout` at commit `75b2b42`. Paths and line numbers refer to that revision. The working tree may be on another branch, so read evidence with `git show flightcrew-buildout:<path>`. Only what was built counts as evidence: the two recorded runs were driven by Claude Code workflows, not by flightcrew, so their results say nothing about the system. One fact about origin is stated once here and applies throughout. The constitution documents that describe the method's tooling were deliberately withheld from the build so as not to spoil its context and to see what it would produce on its own. What it produced followed the deterministic-tools principle further than the principle asks, not in a different direction.

## Agent Invariants

<!-- ===META=== a terse bulleted list of the rules a reader must hold; restated from the sections below -->
<!-- + freeze state is enforced from the document; phase state is held in launch.json at the launch level -->
<!-- + the runner is tooling behind pages and hooks, not the control surface -->
<!-- + the foundation runs without an interface layered over it -->
<!-- + if launch.json were deleted, the next role must still be able to tell from the artefact it holds whether it may proceed; launch.json is an index of phase state, not the freeze -->
<!-- + agent-agnostic: a reader has none of this conversation -->
- A document's freeze is written in the document and enforced by a hook that reads the file it is about to edit. Phase state is held in `launch.json` at the launch level. The two are never fused.
- The runner is tooling behind pages and hooks. It is not what a human uses to advance a run.
- The foundation runs without any interface layered over it.
- If `launch.json` were deleted, the next role must still be able to tell from the artefact it holds whether it may proceed. `launch.json` indexes phase state; it is not the freeze.
- The reader has none of the conversation that produced this document. Every claim stands on the cited evidence alone.

## The target shape

<!-- ===META=== four short paragraphs: the tooling the sources prescribe and what bin may hold; the two kinds of state and where each lives; the runner as leaf commands behind pages and hooks; the control-center file; define each term at first use -->
<!-- + state the target shape once at the top as the standard every problem is measured against -->
<!-- + the expected tooling was what the constitution's orchestration tooling document names: hooks, skills, agent definitions, workflow scripts, templates, schemas, flat files, and a few scripts in bin such as a worker prompt injector -->
<!-- + roles chain by handing documents forward: the spec-builder receives an idea, the test-builder receives a spec, the orchestrator receives the spec, the tests and the kickoff -->
<!-- + the system has two kinds of state: freeze state and phase state -->
<!-- + freeze state lives in the document: a file whose status field reads frozen is immutable, and a hook enforces that by reading the file it is about to edit; this applies to spec, tests map and plan alike and needs no knowledge of any run -->
<!-- + phase state lives in launch.json at the launch level: gates, current phase, and the name of the current run; a local web page reads and writes it live -->
<!-- + launch.json naming the current run makes that run the only runnable one; a failed run is closed by pointing the launch at a new run folder -->
<!-- + a runner is intended, as deterministic tooling: scaffolding a launch or a run, rendering, counting budgets, wrapping checks; it reads launch.json or takes paths and arguments, and may grow as far as the built one eventually -->
<!-- + the runner is not the human's control surface; local web pages are, writing to launch.json or to a document -->
<!-- + a control-center file under flightdeck will hold active configuration such as the launch directory, and later other configuration -->
<!-- + the control-center file is mutable state outside git; nothing gated may depend on it, and parallel worktrees either inherit it or need their own -->
<!-- + :runner: — a program of leaf commands that scaffolds, renders, counts and wraps; it reads launch.json or takes paths, and holds nothing between calls -->
<!-- + :control surface: — what a human uses to read and advance a run; here a local web page writing to launch.json or to a document -->
<!-- + :freeze state: — whether a document is immutable; written in the document's own status field and enforced by a hook that reads the file it is about to edit -->
<!-- + :phase state: — where a launch is: current run, phase, gates; written in launch.json by a page or the runner -->
<!-- + :leaf command: — a command that takes paths and arguments, writes one artefact, and works when called alone -->
The tooling the method's sources prescribe is made of the harness's own primitives and flat files: hooks wired in the project settings, skills, one agent definition per role, dynamic workflow scripts, templates, schemas, and a per-run directory of artefacts each written by the thing that produced it. Roles chain by handing documents forward. The spec-builder receives an idea and produces a spec. The test-builder receives the spec and produces the tests map and the checks. The orchestrator receives the spec, the tests and the kickoff. Nothing sits above the roles holding state on their behalf. A `bin/` folder holds a few scripts a launch needs, such as the worker prompt renderer that was an idea before the build.

The system has two kinds of state and they have different homes. **Freeze state** is whether a document is immutable. It is written in the document's own status field, and a hook enforces it by reading the file an agent is about to edit: if the file says frozen, the edit is refused. This applies to the spec, the tests map and the plan alike, and needs no knowledge of which run is active. **Phase state** is where a launch is: which run is current, which phase it is in, which gates have been passed. It is written in `launch.json` at the launch level, one file per launch, and a local web page reads and writes it live. Because `launch.json` names the current run, that run is the only runnable one, and a failed run is closed by pointing the launch at a new run folder.

A **runner** is intended, as deterministic tooling: a program of **leaf commands** that scaffold a launch or a run, render a dispatch or a report, count a budget, or wrap a check. A leaf command takes paths and arguments or reads `launch.json`, writes one artefact, and works when called alone. The runner may grow as far as the built one eventually. What it is not is the **control surface**: the thing a human uses to read and advance a run. That is a local web page writing to `launch.json` or to a document.

A control-center file under `flightdeck/` holds active configuration such as the launch directory, and later other configuration. It is mutable state outside git, so nothing gated may depend on it, and parallel worktrees either inherit it or need their own.

## Problems

<!-- ===META=== one subsection per problem; each has three short paragraphs led by the bold words **What**, **Why it matters**, **Effect on the system**; evidence cited by path and line; no remediation -->

### 1. The runner became the control surface

<!-- + across the three constitution documents and twelve guides, no central runner, bin directory, command suite or named executable appears; the word CLI appears six times, all about existing tools or Claude Code's own commands -->
<!-- + the pre-build scaffold held a bin folder whose keep file read runnable scripts needed for every launch, and one loose script -->
<!-- + the runner was never proposed or weighed against alternatives in the build transcript; it appears in the design contract's preamble as settled and is filed under decisions not to reopen with one bullet; the spec's only justification is decision D2, one surface to remember and nothing to install -->
<!-- + the human types fifteen commands across a run, eight of which advance state; seven of the eight are launch subcommands -->
<!-- + the sources have the human advance a run by leaving plan mode, by a gate page writing an approval block into the plan, by replying in a halted session, or by editing the plan file; never by typing a command -->
<!-- + both critic passes fault the runner's fidelity to its spec and never question its existence, name or size -->
**What.** Across the three constitution documents and the twelve source guides, no central runner, `bin/` directory, command suite or named executable appears. The word CLI appears six times, every one about tools the project already has or Claude Code's own commands. The pre-build scaffold on `main` held `flightdeck/flightcrew/bin/runners.keep`, reading "Runnable scripts needed for every launch", and one loose script. The build collapsed everything behind one entry. The build transcript contains no message proposing a runner or weighing it against hooks or skills; the runner appears in the design contract's preamble, `flightdeck/launch/specs/flightcrew-v1/design.md:3`, as a settled part of the deal, and is filed at `design.md:284` under decisions not to reopen with one bullet. The spec's only justification is decision `D2`: one entry point with a module per command, because a single user needs one surface to remember and nothing to install. Under `flightdeck/manuals/launch/launch-anatomy.md:93-102` the human types fifteen commands across a run, eight of which advance state, and seven of those eight are `fc launch` subcommands. The sources have the human advance a run by leaving plan mode, by a gate page writing an approval block into the plan, by replying in a halted session, or by editing the plan file, and never by typing a command. Both critic passes in `flightdeck/launch/flightcrew-buildout-2/review/` fault the runner's fidelity to its own spec and never question its existence, name or size.

**Why it matters.** The runner as tooling is what the deterministic-tools principle asks for. The runner as the surface a human remembers and types into is the opposite of what the method describes, where the human reads a display and approves at gates. A single surface to remember is a convenience for a person at a terminal. The method is built so that the person is not at the terminal.

**Effect on the system.** Every manual, every kickoff part and the orchestrator's own role file are written as sequences of runner commands. The human's fifteen-command spine is the run's user interface, and a page that later layers over the top has to reproduce that spine rather than replace it. The decision was never examined by the critics because it sat inside the spec they were judging against.

### 2. One file holds two kinds of state

<!-- + eight commands write launch.json and nothing else does; every phase, gate, pin, end and land is a runner write -->
<!-- + freeze is enforced through the launch's locked-paths list, populated at pin from the map: the lock guard is off during targets, empty until pin, reads launch.json to decide, and a hand edit to a pinned copy is never reported -->
<!-- + the guards must resolve an active launch before deciding anything: an environment variable, else the single launch whose status is active; two active launches make every command fail -->
<!-- + the sources say run state is distributed: events written by hooks, the plan by the orchestrator with references and no status, checks by a wrapper, returns by workers, the report a late join; status is not on the plan, that is the report's job -->
<!-- + freeze state lives in the document: a file whose status field reads frozen is immutable, and a hook enforces that by reading the file it is about to edit; this applies to spec, tests map and plan alike and needs no knowledge of any run -->
**What.** `launch.json` holds both the freeze and the phase. Eight subcommands write it and nothing else does, `flightdeck/flightcrew/bin/cmd/launch.mjs:309, 352, 451, 465, 576, 640, 702, 831`: every phase, gate, pin, end and land is a runner write. Freeze is not enforced from the documents. It is enforced through the launch's locked-paths list, which `fc launch pin tests-map` populates from the map at `launch.mjs:439-447`. `flightdeck/flightcrew/hooks/lock-guard.mjs:6-13` therefore reads `launch.json` to decide, is off during the targets phase, and matches nothing until a map is pinned. A hand edit to a pinned spec copy is never reported, as the second run's critic recorded in pass 1 finding F6. To read `launch.json` at all, the guards and every command must first resolve an active launch: an environment variable, else the single launch whose status is active, per `flightdeck/flightcrew/checks/lib/launch-lib.mjs:158-183`. Two active launches make every command fail.

The sources distribute state by producer: events written by hooks, the plan written by the orchestrator with references and no status, checks written by a wrapper, returns written by workers, and the report assembled from all of them. The core-stages guide says it directly: status is not on the plan, that is the report's job.

**Why it matters.** Freeze and phase are different kinds of fact. A frozen spec is frozen whether or not any run exists, and a hook can know that by reading the spec. A gate result belongs to one launch and changes as the launch proceeds. Fusing them means the immutability of a document depends on a run's state file being present, populated and resolvable, so the strongest guarantee the system offers rests on its most fragile mechanism. Separating them removes the pin as the moment locking begins, removes the active-launch resolution from the guards, and removes the two-active refusal entirely.

**Effect on the system.** The lock has a window at the start of every run in which nothing is locked. The guards cannot decide without a state file and an environment. Every command carries the resolution logic and its error cases. The pin command exists largely to carry freeze into phase state, and the locked-paths glob it adds for the run's own spec copies is what the critic found unenforced. Under the target shape each of these disappears without a fix of its own.

### 3. The spec describes the runner, not the orchestration

<!-- + 57 of the spec's 78 behaviour and edge nodes name the runner and 40 describe a runner command; the spec may have been light on flightcrew behaviours -->
<!-- + interface I1 is the runner itself; the orchestrator was given no write tools and writes only through fc; the scribe role was removed because report assembly is a command -->
<!-- + eleven of the 29 locked suites test fc subcommands directly and 22 spawn it -->
<!-- + the seam for the next spec version: a node about an artefact's state, a hook's enforcement, a role's inputs and outputs, or a rendering's content stays; a node about the runner's arguments, resolution order, output format, exit codes or subcommands is implementation -->
**What.** The frozen spec `flightdeck/launch/specs/flightcrew-v1/spec.v1.json` has 54 behaviours and 24 edges. Fifty-seven of the 78 name the runner, and 40 open with a runner command as their subject. Interface `I1` is the runner itself, its full command surface and its root resolution order. Decision `D15` gives the orchestrator no write tools and has it write only through three runner commands. Decision `D16` removes the scribe role because report assembly is a command. Eleven of the 29 locked suites test runner subcommands directly and 22 spawn it. What remains once the runner nodes are set aside is 21 behaviours and edges about hooks, validators, suites and orchestration.

**Why it matters.** A spec fixes what must be true of the result. The method's sources say it describes outcomes, not steps, and that two teams could build from it and both results would satisfy it. A spec whose behaviours are the argument lists, exit codes and output shapes of one program's subcommands fixes an implementation and leaves the outcome it serves largely unstated. The orchestration behaviours the system exists for, what the orchestrator does at each gate, what a worker receives and returns, how a run ends, are where the first spec is thin.

**Effect on the system.** The tests derived from the spec test the runner, so the system's own verification is mostly verification of the CLI. The critics judged against the spec, so they judged the runner's fidelity to itself. For the next version the seam is this: a node about an artefact's state, a hook's enforcement, a role's inputs and outputs, or what a rendering must contain is a behaviour of the system and stays. A node about the runner's arguments, resolution order, output format, exit codes or which subcommand does what is a statement about an implementation, and either moves into a small spec of the runner's own or becomes a constraint on scripts in general.

### 4. Every role and every artefact goes through the runner

<!-- + the runner renders every artefact: kickoff, plan, dispatch prompts, evidence page, report, run log stub; none can be produced without it -->
<!-- + 19 commands, 44 invocable forms; the orchestrator role file is told to run fc 29 times; eleven of the 29 locked suites test fc subcommands directly and 22 spawn it -->
<!-- + the runner and its libraries are two thirds of the flightcrew folder by lines; the crew is four percent; the hooks five percent; the launch command module alone is longer than the crew and hooks together -->
<!-- + the two guards read launch.json directly and work with the runner deleted; the validators are programs in their own right; the workflow scripts call fc zero times because the runtime forbids shell, so a workflow-shaped wave writes no state and the orchestrator catches up afterwards -->
<!-- + the run log credits the runner with the record produced by commands not by hand; the sources get that property from hooks, a wrapper and an assembler -->
<!-- + leaf candidates among the built commands: check, boundary and locked, the three renders, evidence and report and the run log stub, plan render, return, validate and lint, budget, worker merge; not leaves: the eleven launch subcommands, distribute, doctor -->
**What.** The runner renders every artefact a run produces: the kickoff, the plan markdown, the sealed dispatch prompts for worker, critic and verifier, the evidence page, the report and the run log stub. None can be produced without it. It offers 19 commands in 44 invocable forms. `flightdeck/flightcrew/crew/orchestrator.md` tells the orchestrator to run it 29 times. The runner and its libraries are two thirds of `flightdeck/flightcrew/` by line count; the crew it dispatches is four percent and the hooks are five. The launch command module alone, at 887 lines, is longer than the entire crew roster and the entire hook set together. The run log's entry for the second run credits the runner with the run's record being produced by commands and not by hand.

Three parts of the system do not go through it. The two guards read `launch.json` directly and would work with the runner deleted. The validators are programs in their own right, and the runner's own comment at `bin/cmd/validate.mjs:5-7` says it adds nothing to their output. The three workflow scripts under `flightdeck/flightcrew/workflows/` call the runner zero times, because the workflow runtime forbids shell, so during a workflow-shaped wave no state is written and the orchestrator catches up afterwards by hand.

**Why it matters.** The property the runner is credited with, a record produced by commands rather than recollection, is one the sources obtain from hooks writing events, a wrapper writing check output and an assembler joining them, each a leaf. Routing every artefact through one program buys nothing those leaves do not, and costs the ability to call any of them alone. The three things that bypass the runner are the three that most resemble what the sources prescribe, and they are the three that still work.

**Effect on the system.** The runner is the largest thing in the system and the hardest to replace, because every role file, template and manual addresses it. Of the built commands, most are already leaf-shaped and worth keeping in that form: `check`, `boundary` and `locked` folded together, the three `render` commands, `evidence`, `report` and the run log stub, `plan render`, `return`, `validate` and `lint`, `budget` once its ceilings come from the plan or kickoff, and `worker merge`. The eleven `launch` subcommands are the state owner and are not leaves. `distribute` and `doctor` are installation, not run.

### 5. The runner breaks its own output rule

<!-- + eight commands break the one-line success rule; the spec's constraint on it was carried into the log as a conflict; the evidence render swallows every error; the shim depends on node on PATH -->
**What.** `design.md:12` and constraint `C3` require one line of output on success. Eight commands print more: `distribute`, `launch status`, `launch pin`, `launch gate exit`, `launch end`, `doctor`, `events summary` and `worker render`. The second run's critic found the pin and phase commands exceeding the rule in pass 1 finding F8 and again in pass 2 finding F2, noting that the constraints suite samples nine other commands so neither is caught. The conflict was carried into the run log as a spec conflict for the next version. The evidence page is promised never to fall behind the state at `bin/cmd/launch.mjs:6-7`, and the render that keeps that promise, `launch-lib.mjs:352-372`, swallows every error and never changes an exit code. The shim at `bin/fc:4` invokes a bare `node`, the exact hole the hooks README warns about for hook scripts.

**Why it matters.** Terse, unambiguous output with errors that say what to do next is the deterministic-tools principle's own definition of a good tool, and the reason a runner is worth having. A rule the runner's own commands break, a promise kept by a function that hides its failures, and an interpreter dependency the system elsewhere calls a trap are small in themselves and carry into every leaf command that survives.

**Effect on the system.** Any leaf kept from the built runner inherits its output library and its shim. The one-line rule needs restating as a rule about leaf commands with its exceptions named, and the best-effort render needs to either report or not promise.

## Decisions the shape forces

<!-- ===META=== a bulleted list of open decisions for the human, each one line, no recommendation -->
<!-- + list the decisions the shape forces on the human, without proposing answers -->
<!-- + the control-center file is mutable state outside git; nothing gated may depend on it, and parallel worktrees either inherit it or need their own -->
<!-- + leaf candidates among the built commands: check, boundary and locked, the three renders, evidence and report and the run log stub, plan render, return, validate and lint, budget, worker merge; not leaves: the eleven launch subcommands, distribute, doctor -->
<!-- + the seam for the next spec version: a node about an artefact's state, a hook's enforcement, a role's inputs and outputs, or a rendering's content stays; a node about the runner's arguments, resolution order, output format, exit codes or subcommands is implementation -->

- How the control-center file relates to git and to parallel worktrees: ignored by git with nothing gated depending on it, and whether a worktree inherits the repository's file or carries its own.
- Which of the built commands survive as leaf commands, from the candidate list in problem 4, and whether `boundary` and `locked` become one.
- Whether the spec seam in problem 3 is the whole rule for the next version, and whether a node that is half artefact and half command is reworded around the artefact or split.
