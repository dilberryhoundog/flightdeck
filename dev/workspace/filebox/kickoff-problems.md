<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + the kickoff sets up two of the three failure axes: it is itself context and it fixes most of the tooling the run relies on, so a fix on either axis passes through it
  + the built kickoff is command based and exists only as rendered markdown with no structured form for later layers such as a web page
  + a YAML liftoff of about eighty settings was designed by the human before the build and withheld from it; the builder produced a different system just as unwieldy
  + the direction is a base with sensible defaults and only the overrides stated per run
  + the kickoff is where a vanilla flightcrew would do most of its deterministic output; the builder moved that into the runner and left the kickoff saying run that
  + questions the document must answer: what the source says against what was built, how much lifting a workflow can do at liftoff, whether workflows can be versioned and iteratively improved, and whether a JSON basis compatible with web pages exists
  - the constitution documents and the YAML were both withheld from the build deliberately
agent points
  + the sources define the kickoff as the fourth document, read only by the orchestrator, written by the human, versioned like code, owning conduct and pointing at everything else; its routing test is who needs to obey this
  + the sources give it eight parts: mission and pointers, conduct sequence with a halt at each gate, escalation rules, roles and dispatch, communication and display, budgets and stops, outputs, prohibitions with enforcement twins
  + the sources give it a markdown form: a library of parts, base plus one shape plus one task, assembled and rendered by a script, with a key-value header of pointers; no source gives it a JSON or YAML form
  + the sources record the assembled version in the plan header, the report header and the run log entry, and change it one reviewed diff per retry
  + the sources say a healthy library shrinks in prose as enforcement grows; the pre-send checklist ends with it is shorter than the last version or you can say why not
  + the sources place the liftoff prompt and the dynamic workflow as adjacent entries: a saved prompt or command invoked with the spec as argument, and a saved script that runs the same shape every time; the seam between prose the orchestrator follows and steps the runtime executes is never drawn
  + the built library follows the sources' shape: base plus shape plus task, rendered, a pointer header, orchestrator only, a version string in three places, a Never list with twins
  + the built base spends eight of twelve content lines and thirty of thirty-two runner mentions telling the orchestrator which command to type
  + the built kickoff names ceilings and points at launch.json for their values; model tiers appear nowhere in the library; abandon triggers live in the plan; gate definitions live in both the base and the plan template
  + both runs record every part at version one; the library carries base at three and every other part at two; nothing compares the recorded string to the library; a re-render would rewrite the kickoff and leave the plan and the log at one
  + ten schemas exist and none is for the kickoff; its only machine-readable projection is a version string and two pointer fields; the header's evidence path is synthesised and stored nowhere
  + the render never opens the run log; the two rendered kickoffs differ only in header paths; the knowledge of run one's failure never reaches the document the orchestrator wakes up to
  + the built kickoff dispatches in the contracts phase and the render command refuses that phase; six escalation kinds for five conditions; reached versus exceeded a ceiling across three sources; the sixth Never has no enforcer; the manual says orchestrator only and the planner receives the header block
  + the shape-workflow part is the only text naming the three workflow scripts; both runs selected it; neither invoked a script; the base does not know the shape exists and gives its own dispatch for the same steps
  + the YAML on main: sixteen sections, about 121 active settings, 57 commented alternatives, nearly every key holding a working default; no mission, the conduct sequence exists only as section order, no version field, no schema, nothing on main parses it, pointers name a layout since moved past
  + about 25 of the YAML's settings are pointers; the verification block duplicates the tests map, the diff boundary duplicates the spec scope, the plan-must-include list restates the plan template field by field, the permissions block is what the constitution puts in role frontmatter and settings
  + the YAML and the plan template on main already argue about who owns the iteration ceiling, the model tier and the diff boundary; the built kickoff and launch.json argue about the ceilings
  + a workflow script owns the conduct sequence entirely: order, fan-out, stop on red, budgets, isolation, typed handoffs; it is invoked by name with arguments; it cannot pause for a human or write a file
  + a workflow is a file under the project's workflows directory, so git versions it and a log can pin it at a commit; the runtime records each run's script under the session directory; an edited call reruns only itself and what follows
  + the runtime provides no version field on a workflow and no compatibility check between a saved script and the arguments a run passes it
  + a workflow's arguments are JSON; the system already uses JSON Schema for spec, plan and tests map; the built scripts inline a schema validator for returns; a kickoff as an arguments object with a schema would be the eleventh schema
  - the two explainer pages on workflows are published in the workspace reviews folder

## agent context
recommended
  + state the target shape once at the top: what the sources say the kickoff owns, and the two-sided seam with the workflow script
  + a comparison of the three kickoffs against the eight parts, so a reader sees what each attempt carried and lacked
  + reference the runner and system problems documents rather than restating them
possible
  - a per-problem severity flag
edge cases
  + the built task-agent module has no counterpart in the sources; it is an addition worth keeping in view

## meta
user steering
  - problem hunting, not implementation choices; what the source says against what is written
  - what, why it matters, effect on the wider system; diagnosis only
decisions
  + a run's conduct is deterministic; the sources place its executable form in a saved script, not in prose the orchestrator follows
constraints
  + observed on branch flightcrew-buildout at commit 75b2b42, and main for the YAML; the working tree may be on another branch
  + agent-agnostic: a reader has none of this conversation

## language
vocabulary
  + :kickoff: — the human's standing instructions for how one run is conducted; the sources also call it the liftoff prompt
  + :part: — one file of the kickoff library: the base, a shape module or a task module
  + :routing test: — who needs to obey this line; everyone, the constitution; the judges of correctness, the spec; only the conductor, the kickoff; this run only, the plan
  + :conduct: — the sequence of stages and gates a run passes through and what happens at each
  - :liftoff: — the constitution's word; use kickoff except when quoting
  - :fc: — use runner unless quoting

## audience
agent/human
  - the planner of the fix launch and the spec-builder, any model, any session
purpose
  - describe the kickoff problems so the next version can place conduct, budgets and pointers where they belong
=== END CHAT SUMMARY ===
-->

# Kickoff problems

<!-- ===META=== two short paragraphs: what this document is, the domain, diagnosis not remediation, branches and commits observed, and the evidence rule -->
<!-- + observed on branch flightcrew-buildout at commit 75b2b42, and main for the YAML; the working tree may be on another branch -->
<!-- + reference the runner and system problems documents rather than restating them -->
<!-- + the kickoff sets up two of the three failure axes: it is itself context and it fixes most of the tooling the run relies on, so a fix on either axis passes through it -->
This document describes the problems of the flightcrew kickoff: the document the orchestrator wakes up to, which says how one run is conducted. It is one of a set of problem documents, each covering one domain, written to inform the plan of a later launch and the next version of the spec. It diagnoses. It proposes no remediation. The runner problems document covers the program the built kickoff drives, and the system problems document covers the workflow scripts' defects and the hooks; neither is restated here. The kickoff earns its own document because it sits on two of the three failure axes at once: it is itself the run's context, and it fixes most of the tooling the run relies on, so a fix on either axis passes through it.

Three kickoffs are compared. The method's sources, in the constitution and the orchestration guides in the library. The built library on branch `flightcrew-buildout` at commit `75b2b42`. And a YAML liftoff template on branch `main`, designed by the human before the build and withheld from it. Paths and line numbers refer to those revisions; the working tree may be on another branch, so read evidence with `git show <branch>:<path>`. Statements about the workflow runtime come from its authoring reference and from the facts manual the build verified against Claude Code 2.1.259.

## Agent Invariants

<!-- ===META=== a terse bulleted list of the rules a reader must hold; restated from the sections below -->
<!-- + the sources define the kickoff as the fourth document, read only by the orchestrator, written by the human, versioned like code, owning conduct and pointing at everything else; its routing test is who needs to obey this -->
<!-- + a run's conduct is deterministic; the sources place its executable form in a saved script, not in prose the orchestrator follows -->
<!-- + agent-agnostic: a reader has none of this conversation -->
- The kickoff owns the conduct of one run and nothing else. Correctness lives in the spec, decomposition in the plan, and what every session must know in the constitution. The test for any line is who needs to obey it.
- A run's conduct is deterministic. The sources place its executable form in a saved script the runtime runs, not in prose an orchestrator follows or commands a human types.
- The reader has none of the conversation that produced this document. Every claim stands on the cited evidence alone.

## What the sources say

<!-- ===META=== three short paragraphs: the kickoff's definition and routing test; its eight parts and markdown form; the two-sided seam with the workflow script; define kickoff, part, routing test and conduct at first use -->
<!-- + state the target shape once at the top: what the sources say the kickoff owns, and the two-sided seam with the workflow script -->
<!-- + the sources define the kickoff as the fourth document, read only by the orchestrator, written by the human, versioned like code, owning conduct and pointing at everything else; its routing test is who needs to obey this -->
<!-- + the sources give it eight parts: mission and pointers, conduct sequence with a halt at each gate, escalation rules, roles and dispatch, communication and display, budgets and stops, outputs, prohibitions with enforcement twins -->
<!-- + the sources give it a markdown form: a library of parts, base plus one shape plus one task, assembled and rendered by a script, with a key-value header of pointers; no source gives it a JSON or YAML form -->
<!-- + the sources record the assembled version in the plan header, the report header and the run log entry, and change it one reviewed diff per retry -->
<!-- + the sources say a healthy library shrinks in prose as enforcement grows; the pre-send checklist ends with it is shorter than the last version or you can say why not -->
<!-- + the sources place the liftoff prompt and the dynamic workflow as adjacent entries: a saved prompt or command invoked with the spec as argument, and a saved script that runs the same shape every time; the seam between prose the orchestrator follows and steps the runtime executes is never drawn -->
<!-- + :kickoff: — the human's standing instructions for how one run is conducted; the sources also call it the liftoff prompt -->
<!-- + :part: — one file of the kickoff library: the base, a shape module or a task module -->
<!-- + :routing test: — who needs to obey this line; everyone, the constitution; the judges of correctness, the spec; only the conductor, the kickoff; this run only, the plan -->
<!-- + :conduct: — the sequence of stages and gates a run passes through and what happens at each -->
The **kickoff**, which the constitution calls the liftoff prompt, is the fourth governing document of a run. The spec says what must be true. The plan says how, in what pieces, for this run. The constitution says how the project always works. The kickoff says how this run is conducted: which roles, in what order, on what budgets, with what gates. It is written by the human, maintained across runs, versioned like code, and read by the orchestrator only; the workers, the test-builder and the critic never see it. Every line in it passes one **routing test**: who needs to obey this? Everyone, the constitution. The judges of correctness, the spec. Only the conductor, the kickoff. This run only, the plan.

The sources give it eight parts, in a deliberate order: mission and pointers, the **conduct** sequence of stages with an explicit halt at each gate, escalation rules, roles and dispatch, communication and the evidence display, default budgets and the stall rule, the enumerated outputs, and a short absolute Never list each of whose lines has a hook or permission as its enforcement twin. Its form is markdown, assembled from a library of **parts**: a base carrying what every run shares, one shape module for the dispatch mechanism, one task module for the kind of work. A script renders the assembly with a key-value header of pointers, the spec at its frozen commit, the run log as required reading, the plan and evidence paths. It points and never pastes. No source gives it a JSON or YAML form. The assembled version is recorded in the plan header, the report header and the run log entry, so that when the log says version seven failed, seven is a diffable thing and eight is one reviewed change away. A healthy library shrinks as enforcement grows: correctness lines migrate to the spec template, universal lines to the constitution, enforceable lines to hooks. The pre-send checklist ends with the question of whether it is shorter than the last version.

The constitution's tooling document places two entries side by side. The liftoff prompt is implemented as a saved prompt or command, invoked with the spec as its argument. The dynamic workflow is a saved script that runs the same shape every time, invoked by name. These are one thing seen from two sides: the kickoff is the readable statement of a run's conduct and the workflow script is its executable form. The sources never draw the seam between them, never saying which lines of the conduct sequence are prose the orchestrator follows and which are steps the runtime executes. That undrawn seam is where the built system went.

## Three kickoffs against the eight parts

<!-- ===META=== one short paragraph then a table: rows are the eight parts plus form, versioning and reader; columns are the sources, the YAML on main, the built library; each cell one short phrase -->
<!-- + a comparison of the three kickoffs against the eight parts, so a reader sees what each attempt carried and lacked -->
<!-- + a YAML liftoff of about eighty settings was designed by the human before the build and withheld from it; the builder produced a different system just as unwieldy -->
<!-- + the built library follows the sources' shape: base plus shape plus task, rendered, a pointer header, orchestrator only, a version string in three places, a Never list with twins -->
<!-- + the YAML on main: sixteen sections, about 121 active settings, 57 commented alternatives, nearly every key holding a working default; no mission, the conduct sequence exists only as section order, no version field, no schema, nothing on main parses it, pointers name a layout since moved past -->
<!-- + the built task-agent module has no counterpart in the sources; it is an addition worth keeping in view -->
Two kickoffs were built without sight of each other or of the sources. The human's YAML on `main`, at `flightdeck/flightcrew/templates/liftoff.template.yaml`, has sixteen sections and about 121 active settings with 57 commented alternatives, nearly every key holding a working default. The builder's library on `flightcrew-buildout`, under `flightdeck/flightcrew/templates/kickoff/`, has a 27-line base and seven six-line modules. Each carried something the others lack.

| | The sources | The YAML on main | The built library |
|---|---|---|---|
| Mission and pointers | One line and a pointer header | Pointers exhaustive; mission an empty title and a three-value purpose | Pointer header rendered from the launch record; no mission line |
| Conduct sequence | Phases with a halt at each gate, as a checklist | Absent; inferable only from section order | Present as seven steps, each a runner command |
| Escalation | Named findings that halt the run | Present as policy enums | Present; six kinds for five conditions |
| Roles and dispatch | Roster by name, what each receives and must not | Delegated to the crew file by id; no per-role instruction | Present, with receives and never-receives per role |
| Communication and display | Summaries up; the evidence display's path and contents | Display contents and notify list | Present |
| Budgets and stops | Defaults here; the plan tightens them | The most complete section; ceilings, stall rule, on-ceiling | Ceilings named, values in the launch record; no model tiers |
| Outputs | Branch conventions, display finalised, log stub | Report sections, pull request body, footer flags | Present, as runner commands |
| Prohibitions | Short, each with an enforcement twin | Permissions block; network, shell, path denies | Six entries; five with a real twin |
| Form | Markdown parts, rendered, pointer header | One YAML file, toggled by commenting | Markdown parts, rendered, pointer header |
| Versioning | Assembled version recorded in three places | No version field | Version string in three places, never verified |
| Reader | The orchestrator only | Nothing on the branch parses it | The orchestrator; the header block also reaches the planner |
| Structured form | None | The whole file, with no schema | None; a version string and two pointer fields |

The built library also carries a task module for agent-shaped work that the sources never name, stating what each of four check classes owes. It has no counterpart in the sources and is worth keeping in view.

## Problems

<!-- ===META=== one subsection per problem; each has three short paragraphs led by the bold words **What**, **Why it matters**, **Effect on the system**; evidence cited by path and line; no remediation -->

### 1. Conduct became commands

<!-- + the kickoff is where a vanilla flightcrew would do most of its deterministic output; the builder moved that into the runner and left the kickoff saying run that -->
<!-- + the built base spends eight of twelve content lines and thirty of thirty-two runner mentions telling the orchestrator which command to type -->
<!-- + the sources place the liftoff prompt and the dynamic workflow as adjacent entries: a saved prompt or command invoked with the spec as argument, and a saved script that runs the same shape every time; the seam between prose the orchestrator follows and steps the runtime executes is never drawn -->
<!-- + a workflow script owns the conduct sequence entirely: order, fan-out, stop on red, budgets, isolation, typed handoffs; it is invoked by name with arguments; it cannot pause for a human or write a file -->
<!-- + the shape-workflow part is the only text naming the three workflow scripts; both runs selected it; neither invoked a script; the base does not know the shape exists and gives its own dispatch for the same steps -->
**What.** The base part at `flightdeck/flightcrew/templates/kickoff/base.md` has twelve content lines. Eight of them, the seven conduct steps and the escalation line, tell the orchestrator which runner command to type and when; thirty of the file's thirty-two runner mentions are there. The routing of information between roles, where returns are written, and where the ceilings live take the other three. The sources' base carries the gate protocol, the escalation rules and the evidence requirements; its worked example's conduct section names phases, what is presented at each gate, and that the run halts, with no command in it. The shape-workflow module at `templates/kickoff/shape-workflow.md` is the only text in the system that names the three workflow scripts, and it overlays a different dispatch on conduct steps one, four and six without the base saying those steps are replaceable. Both recorded runs selected that module; neither invoked a script.

**Why it matters.** The conduct of a run is deterministic by the method's own principle, and the runtime offers a form for it: a saved script that owns the order of stages, the fan-out, the stop on a red return, the budgets and the isolation, invoked by name with arguments. The sources describe the liftoff prompt in those same words, a saved command invoked with the spec as its argument. The builder had the two descriptions and the undrawn seam between them, and resolved it by placing every deterministic step behind a runner command and leaving the kickoff holding the instruction to invoke it. The kickoff kept its title and lost its content.

**Effect on the system.** The kickoff is where a system without a runner would do most of its deterministic work, and the built kickoff does none. Its conduct section cannot be read for what a run does without reading it for how the runner is driven. Its one module that reaches for the executable form describes scripts that have never run and contradicts the base it is assembled with. The runner problems document describes the program this left behind.

### 2. The numbers have no single owner

<!-- + the built kickoff names ceilings and points at launch.json for their values; model tiers appear nowhere in the library; abandon triggers live in the plan; gate definitions live in both the base and the plan template -->
<!-- + the YAML and the plan template on main already argue about who owns the iteration ceiling, the model tier and the diff boundary; the built kickoff and launch.json argue about the ceilings -->
<!-- + about 25 of the YAML's settings are pointers; the verification block duplicates the tests map, the diff boundary duplicates the spec scope, the plan-must-include list restates the plan template field by field, the permissions block is what the constitution puts in role frontmatter and settings -->
<!-- + the direction is a base with sensible defaults and only the overrides stated per run -->
**What.** The sources put default budgets, model tiers and the stall rule in the kickoff, with the plan carrying this run's numbers and tightening them. In the built system, `base.md:21` names eight ceiling dimensions and says their values live in `launch.json`; model tiers appear nowhere in the library and are owned by the plan and the crew README; abandon triggers are owned by the plan; and what the human reads at each gate is stated in both `base.md:4-9` and `flightdeck/flightcrew/templates/plan.template.json:51-55`, against the one-home rule the kickoff manual states at `flightdeck/manuals/orchestration/kickoff.md:17`. The YAML on `main` has the opposite problem. Of its 121 settings, about 25 are pointers. Its verification block duplicates the tests map, its diff boundary duplicates the spec's scope, its plan-must-include list restates the plan template field by field, and its permissions block is what the constitution puts in role frontmatter and the settings fragment. The YAML and the plan template on `main` already argue about who owns the iteration ceiling, the model tier and the diff boundary, with a precedence comment on the plan's side. The built kickoff and `launch.json` argue about the ceilings.

**Why it matters.** Both attempts answered "everything the run needs" by enumerating, and neither settled the seam with the plan. Eighty settings and a command sequence with its values elsewhere are two shapes of the same weight. The routing test exists to decide ownership line by line, and applied to either attempt it moves most of the content out: to the spec, the tests map, the plan, the role files and the settings. What survives the test as conduct is small: the gates, the dispatch rules, the default budgets, the model tiers, the review policy and the ending policy. A base of defaults that a run overrides only where it differs is the sources' shrinking rule made structural.

**Effect on the system.** A value that lives in two documents drifts, and a reader cannot tell which governs. A value that lives in the wrong document is invisible to the role that needs it: a model tier in the plan is unknown to the kickoff that should default it, and a ceiling in the launch record is unknown to a page reading the kickoff. Neither attempt can be made smaller without first deciding, for each value, who needs to obey it.

### 3. The version is recorded and never verified

<!-- + both runs record every part at version one; the library carries base at three and every other part at two; nothing compares the recorded string to the library; a re-render would rewrite the kickoff and leave the plan and the log at one -->
<!-- + the sources record the assembled version in the plan header, the report header and the run log entry, and change it one reviewed diff per retry -->
<!-- + a workflow is a file under the project's workflows directory, so git versions it and a log can pin it at a commit; the runtime records each run's script under the session directory; an edited call reruns only itself and what follows -->
<!-- + the runtime provides no version field on a workflow and no compatibility check between a saved script and the arguments a run passes it -->
**What.** Both recorded runs carry the version string `base@1+shape-workflow@1+task-feature@1` in `launch.json`, in the plan and in the run log. The library at the branch tip carries `base.md` at version three and every other part at version two, after commit `acafec4` applied the review fixes. No validator, render path or check compares a recorded version to the library: `flightdeck/flightcrew/checks/validators/validate-kickoff.mjs` checks that the version field exists and nothing about its content. A re-render of either launch would rewrite `kickoff.md` and `launch.json` to the new versions and leave the plan's version field and both log entries at the old ones. The YAML on `main` has no version field at all, though the plan schema on that branch requires one.

The runtime offers what neither attempt built. A workflow is a file under the project's workflows directory, so git versions it exactly as it versions the spec, and a log can pin it at a commit. The runtime records the script of every run under the session directory, so what ran is recoverable even if the file later changes. An edit to one agent call reruns only that call and what follows, with the unchanged prefix replayed from cache, which is the sources' one-change-per-retry rule with the runtime doing the attribution. What the runtime does not provide is a version field on a workflow or a compatibility check between a saved script and the arguments a run passes it.

**Why it matters.** The sources' whole mechanism for improving a kickoff between runs rests on the version being a diffable thing: the log says seven failed on escalation, and eight is one reviewed change away. A version string that nothing verifies against the library is a label, and a library that moved while the string stayed makes every comparison between runs a comparison of the wrong documents.

**Effect on the system.** Both recorded runs are attributed to a kickoff that no longer exists in the form recorded. The next run of the same spec would be conducted under a different base with the same version string in its log entry unless someone re-renders, and re-rendering breaks the plan's agreement instead. Versioning by git commit, which the spec already uses and which a workflow file gets for free, is the mechanism the string was standing in for.

### 4. No structured form exists

<!-- + the built kickoff is command based and exists only as rendered markdown with no structured form for later layers such as a web page -->
<!-- + ten schemas exist and none is for the kickoff; its only machine-readable projection is a version string and two pointer fields; the header's evidence path is synthesised and stored nowhere -->
<!-- + the sources give it a markdown form: a library of parts, base plus one shape plus one task, assembled and rendered by a script, with a key-value header of pointers; no source gives it a JSON or YAML form -->
<!-- + a workflow's arguments are JSON; the system already uses JSON Schema for spec, plan and tests map; the built scripts inline a schema validator for returns; a kickoff as an arguments object with a schema would be the eleventh schema -->
**What.** The built system carries ten JSON schemas under `flightdeck/flightcrew/schemas/`, for the spec, the plan, the tests map, the launch record, the check result, the event and four agent returns. None is for the kickoff. The kickoff's only machine-readable projection is the version string and the two fields `path` and `version` in `launch.json`; the header's evidence path is synthesised by the render at `bin/cmd/launch.mjs:179` and stored nowhere. The document itself exists only as rendered markdown assembled from markdown parts. The sources give it no structured form either, though their header block of key-value pointers is the seed of one. The YAML on `main` is entirely structured and has no schema, no version field and no reader.

The runtime's arguments object is JSON, and the system already validates the spec, the plan and the tests map against JSON Schema. The three built workflow scripts each inline a schema validator to check the returns they receive. A kickoff expressed as the arguments a workflow takes, with a schema of its own, would be validated by the same mechanism pointed the other way, and would be the eleventh schema.

**Why it matters.** A page that renders, edits and hands back a kickoff needs a shape it can read. A script that refuses to run against arguments it does not understand needs the same shape. A version field a check can compare needs somewhere to live. Markdown parts give the orchestrator prose to follow and give everything else nothing. The absence is exact: every other document a run consumes has a schema, and the one that says how the run is conducted does not.

**Effect on the system.** The kickoff cannot be validated beyond its header labels, cannot be rendered by anything but the runner, cannot be edited by a page, and cannot be compared across runs except as text. The direction the human describes, a base of defaults with per-run overrides that later layers can read, has no home in the built system and none in the sources' form.

### 5. The run log never reaches the kickoff

<!-- + the render never opens the run log; the two rendered kickoffs differ only in header paths; the knowledge of run one's failure never reaches the document the orchestrator wakes up to -->
<!-- + the sources say a healthy library shrinks in prose as enforcement grows; the pre-send checklist ends with it is shorter than the last version or you can say why not -->
**What.** The render at `bin/cmd/launch.mjs:161-183` never opens the run log; its header names the log's path as required reading, and that is the whole of the connection. The two rendered kickoffs, `flightdeck/launch/flightcrew-buildout/kickoff.md` and `flightcrew-buildout-2/kickoff.md`, differ only in their header paths: the launch folder, the map version, the prior report. Their bodies are byte-identical. The knowledge that the first run abandoned at verify on a wrong check lives in the log, in the second run's plan risks and in a gate note, and never in the document the orchestrator wakes up to. The sources have the kickoff carry the log's known failure modes forward as pre-planning reading so that they shape the plan before a worker is dispatched, and have the library shrink as rules migrate out of it.

**Why it matters.** The kickoff is the fix for the context axis where the cause was run conduct, and the run log is where that cause is recorded. A kickoff that changes between runs only in its pointers has not absorbed anything the previous run taught. The version string's three recording sites exist so that a conduct change can be attributed; a kickoff that never changes has nothing to attribute.

**Effect on the system.** Two runs of the same spec were conducted under the same conduct, and the second inherited the first's failure through the plan rather than through the document meant to carry it. The library grew from version one to three by the review's fixes, not by anything a run taught, and the runs that used it never saw the growth.

### 6. The built kickoff contradicts its own system

<!-- + the built kickoff dispatches in the contracts phase and the render command refuses that phase; six escalation kinds for five conditions; reached versus exceeded a ceiling across three sources; the sixth Never has no enforcer; the manual says orchestrator only and the planner receives the header block -->
**What.** Five contradictions are on the record. `base.md:5` dispatches the contracts unit in the contracts phase, and the runner's render command refuses every phase but implement, an open reservation in `flightdeck/launch/RUNLOG.md:9`. `base.md:12` enumerates five conditions that stop the run and then defines six escalation kinds, the sixth having no condition. The library says a ceiling exceeded, the rendered kickoffs say a ceiling reached, and the kickoff manual says reached. The sixth Never at `base.md:27` gives as its enforcement twin the fact that the file is re-rendered from its sources, which is a recovery property and not an enforcer, against the manual's rule that every Never names one. The manual at `flightdeck/manuals/orchestration/kickoff.md:3` says the orchestrator alone reads the kickoff, and `flightdeck/flightcrew/crew/planner.md:14` hands the planner the kickoff's header block.

**Why it matters.** These are small, and each is the kind of thing a single execution or a single cross-check would have found. They matter because the kickoff is the one document the orchestrator is told wins over its own judgement, at `crew/orchestrator.md:10`. A contradiction between the kickoff and the tool it names, or inside the kickoff itself, is one the orchestrator has been told not to resolve.

**Effect on the system.** An orchestrator following the base to the letter reaches a step the runner refuses, an escalation kind with no trigger, and a threshold that two other documents state differently. The recorded runs did not meet these because no orchestrator followed the kickoff; the first run that does will.

## Decisions the shape forces

<!-- ===META=== a bulleted list of open decisions for the human, each one line, no recommendation -->
<!-- + questions the document must answer: what the source says against what was built, how much lifting a workflow can do at liftoff, whether workflows can be versioned and iteratively improved, and whether a JSON basis compatible with web pages exists -->
<!-- + the runtime provides no version field on a workflow and no compatibility check between a saved script and the arguments a run passes it -->
<!-- + the built task-agent module has no counterpart in the sources; it is an addition worth keeping in view -->

- Where the seam falls between the kickoff as prose the orchestrator reads and the workflow script as the conduct the runtime executes, since the sources describe both and never divide them.
- Whether the kickoff's structured form is the arguments a workflow takes, with a schema as its version and compatibility check, given that the runtime provides neither on a workflow itself.
- Which of the values in the three kickoffs survive the routing test as conduct, and which move to the spec, the plan, the role files and the settings.
- Whether the built task module for agent-shaped work, which the sources never name, is carried forward.
