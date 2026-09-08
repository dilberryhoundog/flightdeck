<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + the ending is a domain of its own; the command surface there was assumed large
  + the agent wrote the run log during the build; whether the system handles that is the question
  + overlap with other problem documents is welcome because it shows a problem has several faces
agent points
  + the endings guide names three endings, accept and merge, abandon and retry, partial acceptance, and a forbidden fourth, fix it up and keep going
  + the guide's abandonment sequence: stop at the finding, freeze the evidence, write the run log entry now, make the setup change and commit it with the entry, clear the ground by deleting branches, removing worktrees and pruning
  + the guide's salvage rule: setup survives and output does not; spec, tests, proven contracts and factual explorer findings carry; plan, partial implementation and transcript do not
  + the guide's merge sequence: wave order, an integration branch rebased on current main with the end-to-end proof rerun, re-verify after skew, one PR or one squashed commit per unit, CI, close the run with evidence archived, entry written, worktrees removed, branches deleted, spec status pointed at the landing commit
  + the guide says the report is assembled the same way whether accepted or abandoned and never carries a verdict; the human writes the diagnosis from it
  + the guide's retry: one change per retry, same spec and kickoff except the edit; demote when the task never warranted the orchestra; shelve after three failures on one axis
  + the guide's merge gate is the shortest: integration proof green on the rebased state, CI green, cost line closed
  + the end command writes the outcome, appends an event, renders the report, the evidence page and the log stub, and prints two cleanup lines; it deletes nothing, removes nothing, prunes nothing, merges nothing
  + the branches the end command tells the human to delete are synthesised from the plan without asking git; run one was told to delete branches that never existed
  + the end command checks no gate; the gate command records a G3 status no command reads; both runs ended with G3 pending and an outcome set
  + the stub fills the mechanical fields and leaves five diagnosis fields as fill markers; nothing anywhere refuses while a fill marker remains or checks who wrote a field; the only testbench assertion requires the markers to be present at stub time
  + both real entries carry orchestrator drafts on every judgement field and nothing refused
  + the kickoff render prints the log's path and never opens it; the previous-launch field is a name; a failure reaches the next plan only if an agent writes a risk sourced from the log, and the validator warns only about heading text; run two's one such risk names the bare word runlog
  + the land command checks the evidence summary at the named commit with zero failures and writes a landed object; it cannot tell a rebased branch from the pre-rebase state, requires neither an ended nor an accepted run, and appends no event
  + the integration branch, rebase, re-verify on the rebased state, PR, CI and squashed commit per unit exist only in the manuals' prose; no command creates or checks any of them
  + the accept path is four runner commands against at least five git commands, an unspecified PR step, a hand edit of the log and a promotion pass with no command, counter or template
  + nothing is archived, classified or blocked at an ending; the salvage table is stated in the manual and enforced by nothing; the archive folder has a keep file and no writer
  + partial belongs to the accepted family in the end command and the abandoned family in the stub; the at-stage flag is unvalidated text stored only in an event; optional log lines are emitted unconditionally; the log's explanatory sentence has been pushed beneath the entries
  + the cost line reads not recorded in every entry and report; the guide makes a closed cost line a merge-gate condition
  + the report is assembled identically for both outcomes and carries no verdict in its own voice; a note recorded by command can carry forbidden verdict strings into it
  - the process section of the system document covers the orchestrator running ahead; the structure document covers log lineage; the runner document covers the end command as a state write

## agent context
recommended
  + state the guide's ending once at the top as the standard
  + reference the structure, runner and system documents where a face of a problem is treated there, without restating
possible
  - a per-problem severity flag
edge cases
  + the guide and the map disagree on whether an abandoned run's branch is kept or deleted; the built system deletes nothing, so it has not chosen

## meta
user steering
  - problem hunting; what the source says against what is written; diagnosis only
  - what, why it matters, effect on the wider system
constraints
  + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch
  + agent-agnostic: a reader has none of this conversation

## language
vocabulary
  + :ending: — the moment a run stops being trusted and what follows it, through to clear ground
  + :landing: — the accepted work reaching the parent branch after integration and proof
  + :fill marker: — the literal placeholder the stub leaves in a diagnosis field for the human to replace
  + :clear ground: — no branch, worktree or leftover of the ended run remains
  - :fc: — use runner unless quoting

## audience
agent/human
  - the planner of the fix launch and the spec-builder, any model, any session
purpose
  - describe the endings problems so the next version can make a run end the way the method says a run ends
=== END CHAT SUMMARY ===
-->

# Endings problems

<!-- ===META=== two short paragraphs: what this document is, the domain, diagnosis not remediation, branch and commit, the evidence rule, and that overlap with sibling documents is deliberate -->
<!-- + observed on branch flightcrew-buildout at commit 75b2b42; the working tree may be on another branch -->
<!-- + overlap with other problem documents is welcome because it shows a problem has several faces -->
<!-- + reference the structure, runner and system documents where a face of a problem is treated there, without restating -->
This document describes the problems of how a flightcrew run ends: the moment trust in it stops, what the system does then, what it records, what it clears, and how the next run is meant to inherit what this one taught. It is one of a set of problem documents, each covering one domain, written to inform the plan of a later launch and the next version of the spec. It diagnoses. It proposes no remediation. Some of what it describes has another face in a sibling document: the run log's lineage in the structure problems, the end command as a state write in the runner problems, the orchestrator running ahead of the human in the system problems. The overlap is deliberate. A problem that appears in several documents is a problem with several faces, and each document describes the face it can see.

Every observation was verified on branch `flightcrew-buildout` at commit `75b2b42`. Paths and line numbers refer to that revision; the working tree may be on another branch, so read evidence with `git show flightcrew-buildout:<path>`. Only what was built counts as evidence for how the system ends a run. The two recorded runs are cited where they show a command's actual output or a record's actual state, not as proof of behaviour, since neither run was conducted by flightcrew.

## Agent Invariants

<!-- ===META=== a terse bulleted list of the rules a reader must hold; restated from the sections below -->
<!-- + the guide's salvage rule: setup survives and output does not; spec, tests, proven contracts and factual explorer findings carry; plan, partial implementation and transcript do not -->
<!-- + the guide says the report is assembled the same way whether accepted or abandoned and never carries a verdict; the human writes the diagnosis from it -->
<!-- + agent-agnostic: a reader has none of this conversation -->
- Setup survives a run and output does not. The spec, the tests, proven contracts and factual explorer findings carry forward. The plan, the partial implementation and the transcript do not.
- The report is assembled the same way whether the run was accepted or abandoned, and never states a verdict in its own voice. The human writes the diagnosis from it.
- The reader has none of the conversation that produced this document. Every claim stands on the cited evidence alone.

## What the sources say

<!-- ===META=== three short paragraphs: the three endings and the abandonment sequence; the salvage rule and the retry; the merge sequence and the gate; define ending, landing, fill marker and clear ground at first use -->
<!-- + state the guide's ending once at the top as the standard -->
<!-- + the endings guide names three endings, accept and merge, abandon and retry, partial acceptance, and a forbidden fourth, fix it up and keep going -->
<!-- + the guide's abandonment sequence: stop at the finding, freeze the evidence, write the run log entry now, make the setup change and commit it with the entry, clear the ground by deleting branches, removing worktrees and pruning -->
<!-- + the guide's salvage rule: setup survives and output does not; spec, tests, proven contracts and factual explorer findings carry; plan, partial implementation and transcript do not -->
<!-- + the guide's retry: one change per retry, same spec and kickoff except the edit; demote when the task never warranted the orchestra; shelve after three failures on one axis -->
<!-- + the guide's merge sequence: wave order, an integration branch rebased on current main with the end-to-end proof rerun, re-verify after skew, one PR or one squashed commit per unit, CI, close the run with evidence archived, entry written, worktrees removed, branches deleted, spec status pointed at the landing commit -->
<!-- + the guide's merge gate is the shortest: integration proof green on the rebased state, CI green, cost line closed -->
<!-- + the guide says the report is assembled the same way whether accepted or abandoned and never carries a verdict; the human writes the diagnosis from it -->
<!-- + :ending: — the moment a run stops being trusted and what follows it, through to clear ground -->
<!-- + :landing: — the accepted work reaching the parent branch after integration and proof -->
<!-- + :fill marker: — the literal placeholder the stub leaves in a diagnosis field for the human to replace -->
<!-- + :clear ground: — no branch, worktree or leftover of the ended run remains -->
An **ending** is the moment a run stops being trusted and everything that follows it, through to clear ground. The endings guide names three: accept and merge, abandon and retry, and partial acceptance unit by unit, on the hard condition that a landing unit stands only on wave-zero contracts and never on an abandoned one. It names a fourth that is forbidden, fix it up and keep going, which is not an ending but a refusal to choose one. Abandonment has five steps in order. Stop at the finding and dispatch nothing new. Freeze the evidence. Write the run log entry now, the ten lines, not tomorrow. Make the setup change and commit it alongside the entry so the fix and its reason travel together. Clear the ground: delete the run's branches, remove its worktrees, prune.

What survives an abandoned run is decided by one question: is this artefact setup or output. Setup survives by design; output from a drifted run carries the drift. The spec and the tests carry, the proven contracts and the factual explorer findings carry, and the plan, the partial implementation and the orchestrator's transcript do not. The next run's orchestrator meets the failure only through the run log, as a risk line in the new plan, never through inherited conversation. A retry is a new experiment against an improved setup, differing from the last run by exactly one change, with the log's watch field naming which. Retry when the diagnosis is specific. Demote to a single session when the task never warranted the orchestra. Shelve when the same axis has failed three runs straight.

A **landing** is the accepted work reaching the parent branch, and it has its own sequence. Merge in wave order. Integrate before the trunk: an integration branch rebased on current main with the full end-to-end proof rerun, because a unit's green from before the rebase says nothing about the rebased state. Land it readable, one PR per unit or one squashed commit per unit, with names threading from plan to branch to evidence. Let CI say it again. Close the run: evidence archived at the merge commit, the success entry written, worktrees removed, branches deleted, the spec's status pointed at the landing commit. The merge gate is the shortest gate in the method: integration proof green on the rebased state, CI green, cost line closed. Throughout, the report is assembled identically for every outcome and carries every fact the decision needs without making it, and the human writes the diagnosis from the report into the log, replacing each **fill marker**, the placeholder the stub leaves in a field only a human may write. The ending is finished when the ground is **clear**: no branch, worktree or leftover of the run remains.

## Problems

<!-- ===META=== one subsection per problem; each has three short paragraphs led by the bold words **What**, **Why it matters**, **Effect on the system**; evidence cited by path and line; no remediation -->

### 1. The end command records an ending and performs none of it

<!-- + the end command writes the outcome, appends an event, renders the report, the evidence page and the log stub, and prints two cleanup lines; it deletes nothing, removes nothing, prunes nothing, merges nothing -->
<!-- + the branches the end command tells the human to delete are synthesised from the plan without asking git; run one was told to delete branches that never existed -->
<!-- + the accept path is four runner commands against at least five git commands, an unspecified PR step, a hand edit of the log and a promotion pass with no command, counter or template -->
<!-- + the ending is a domain of its own; the command surface there was assumed large -->
**What.** `flightdeck/flightcrew/bin/cmd/launch.mjs:784-855` is the end command. It validates the outcome word, checks that the evidence is at HEAD and the tree is clean for the accepted family, writes `outcome`, `status`, `ended` and `phase` into the launch record, appends one event, renders the report, the evidence page and the run log stub, and prints two lines and a path. The two lines, built at `launch.mjs:770-785`, tell the human which worktrees to remove and which branches to delete. The command removes no worktree, deletes no branch and prunes nothing; the string `git worktree prune` appears in no script on the branch. The branches it names are synthesised as launch name plus unit name from the plan, without asking git whether they exist; run one's end printed delete lines for unit branches its own report says were never created. On the accept path the human then types at least five git commands, opens a pull request by a means no manual names, edits the log by hand and performs a promotion pass for which no command, counter or template exists. The runner's share of the ending is four commands.

**Why it matters.** The guide's abandonment ends with clear ground and its merge ends with a closed run, and it calls the alternative the haunted repository: worktrees and branches from three abandoned runs still standing. Every step that clears ground is a printed string the human copies. The command surface at the ending is not large. It is small, and the ending's work sits outside every tool the system has.

**Effect on the system.** A run's ending is complete when the human finishes a checklist the system does not hold and cannot check. Nothing afterwards verifies the ground is clear, and nothing on the next launch refuses if it is not. The record says ended; the repository may say otherwise.

### 2. Gate three is a gate nothing reads

<!-- + the end command checks no gate; the gate command records a G3 status no command reads; both runs ended with G3 pending and an outcome set -->
**What.** The gate command at `launch.mjs:628-629` gives the first two gates a source phase, a destination phase and a blocker check. Gate three has none of the three: the code names it only in the help string and in the list of gate identifiers. The end command's preconditions at `launch.mjs:786-815` never read the gates object. Both recorded launches ended with gate three pending and an outcome set, which the schema permits because it requires the three gate keys and not their statuses. The journey manual describes gate three as the human's reading of the evidence page, ledger first, then open findings, then the unverified lines, then the cost, followed by the outcome word given to the end command, with no gate command in the sequence.

**Why it matters.** Gate three is the final review, the last of the three points at which the method says a human looks at evidence and passes the run forward or stops it. In the built system it is a reading ritual whose only trace is the outcome word the human types afterwards. A gate the machinery cannot see cannot hold a run at it, cannot record what was read, and cannot distinguish an ending decided at the gate from one decided by momentum.

**Effect on the system.** The launch record of every run will show its final gate pending. The report cannot say the gate was passed because nothing recorded it. The end command will accept a run whose evidence nobody read.

### 3. The human's diagnosis has no enforcement twin

<!-- + the agent wrote the run log during the build; whether the system handles that is the question -->
<!-- + the stub fills the mechanical fields and leaves five diagnosis fields as fill markers; nothing anywhere refuses while a fill marker remains or checks who wrote a field; the only testbench assertion requires the markers to be present at stub time -->
<!-- + both real entries carry orchestrator drafts on every judgement field and nothing refused -->
<!-- + the report is assembled identically for both outcomes and carries no verdict in its own voice; a note recorded by command can carry forbidden verdict strings into it -->
**What.** The stub inserted by the end command through `flightdeck/flightcrew/bin/cmd/runlog.mjs:90-115` fills the mechanical fields from the launch record and writes the five diagnosis fields, seen on, cause, fixed on, change and watch, as fill markers. The run log manual at `flightdeck/manuals/orchestration/run-log.md:60` says the human writes those five and commits the entry, and an agent never writes a fill field. A search for the marker across `flightdeck/` finds no validator, hook, suite or precondition that reads the log for completeness or refuses while a marker remains. The next launch's creation never opens the log; activation refuses only on another active launch or an unfrozen pin. The one testbench assertion about the markers, at `flightdeck/testbench/suites/bin-runlog/run.mjs:81`, requires them to be present at stub time. Both real entries in `flightdeck/launch/RUNLOG.md` carry `draft (orchestrator):` on every judgement field and nothing refused. The report the diagnosis is written from is assembled identically for both outcomes and states no verdict, though a note recorded by the note command is printed into it verbatim and can carry the verdict strings the spec forbids.

**Why it matters.** The run log is the mechanism by which an abandoned run improves the next one, and it works only if the diagnosis is the human's judgement about the setup and the next version absorbs it. The journey manual's own binding line is that every prohibition has an enforcement twin, a hook, a permission rule or a refusal, and a rule that exists only as prose is a preference. The rule that an agent never writes a fill field is the one rule in the system whose breach was recorded by the system's own build, and it is prose.

**Effect on the system.** The system handles half of the human's diagnosis. It reserves the fields. It does not defend them. An orchestrator that fills them is not refused, a next launch that opens before they are filled is not refused, and the record cannot tell a human's judgement from an agent's guess except by a prefix an agent chose to add.

### 4. The retry carries a filename

<!-- + the kickoff render prints the log's path and never opens it; the previous-launch field is a name; a failure reaches the next plan only if an agent writes a risk sourced from the log, and the validator warns only about heading text; run two's one such risk names the bare word runlog -->
<!-- + the guide's retry: one change per retry, same spec and kickoff except the edit; demote when the task never warranted the orchestra; shelve after three failures on one axis -->
**What.** The next launch is opened with the same creation command. Its previous-launch field is computed as the newest other launch of the same spec, a name. Its kickoff header carries the log's path under read first and every prior report's path; the render at `launch.mjs:161-184` never opens the log, so nothing from the previous entry reaches the kickoff. The previous run's failure reaches the next plan only if an agent writes a risk whose source is the log; `flightdeck/flightcrew/crew/planner.md:22` asks for a risk sourced from the log to reproduce a heading exactly, and `flightdeck/flightcrew/checks/validators/validate-plan.mjs:289-301` warns, never errors, when the heading does not exist. Run two's one such risk names the bare word runlog, so the check had nothing to compare and stayed silent. The previous entry's watch field is checked against nothing. The manual's rules for the retry, one change with the watch field naming it, same spec and kickoff except the edit, demote when no parallel wave existed, shelve after three failures on one axis, are stated at `flightdeck/manuals/orchestration/endings.md:46-50` and enforced by nothing that compares two launches.

**Why it matters.** The guide's whole account of iteration rests on the retry differing from the last run by one attributable change and inheriting the failure through the log. In the built system the inheritance is a path the orchestrator is told to read and a name in a record field. Whether the failure shaped the plan depends on an agent choosing to write a risk, and whether that risk is real depends on a warning nobody is required to heed.

**Effect on the system.** Two runs of the same spec can be conducted with nothing carried between them but a filename, and the record will look complete. The one change per retry, the thing that makes a second run an experiment rather than a repeat, is a discipline with no instrument.

### 5. The landing proves evidence, not integration

<!-- + the land command checks the evidence summary at the named commit with zero failures and writes a landed object; it cannot tell a rebased branch from the pre-rebase state, requires neither an ended nor an accepted run, and appends no event -->
<!-- + the integration branch, rebase, re-verify on the rebased state, PR, CI and squashed commit per unit exist only in the manuals' prose; no command creates or checks any of them -->
<!-- + the cost line reads not recorded in every entry and report; the guide makes a closed cost line a merge-gate condition -->
**What.** The land command at `launch.mjs:681-706` requires a commit, checks that the evidence summary records that commit with zero failed and zero errored checks, and writes a landed object whose integration check is a restatement of that summary. It does not require the run to have ended or been accepted, appends no event, and cannot tell a rebased integration branch from the pre-rebase state. The integration branch, the rebase onto the current parent, the verification on the rebased state, the pull request with the report linked, CI running the same gates, and one squashed commit per unit are described at `endings.md:69-75` and `flightdeck/manuals/orchestration/journey.md:31` as the human's steps. No command creates, rebases, verifies or checks any of them; the verify command has no branch argument, and no CI configuration exists under `flightdeck/`. The cost line, which the guide makes a condition of the merge gate, reads not recorded in every entry and report on the branch, and the land command never looks at it.

**Why it matters.** The guide's reason for integrating before the trunk is merge skew: units that each pass in their own worktree against the base they branched from, combined onto a trunk that has since moved. A landing that proves the evidence at a commit the human names proves what the human chose to prove. The merge gate is meant to be the shortest gate because everything it needs is already recorded; here the things it needs are not recorded at all.

**Effect on the system.** Accepted work can land with no integration proof, no CI, no cost line and no record of a pull request beyond a string the human supplies. The failure mode the guide names, a green from before the rebase saying nothing about the rebased state, is exactly the one the landing cannot detect.

### 6. The ground is never cleared and nothing is salvaged

<!-- + nothing is archived, classified or blocked at an ending; the salvage table is stated in the manual and enforced by nothing; the archive folder has a keep file and no writer -->
<!-- + the guide and the map disagree on whether an abandoned run's branch is kept or deleted; the built system deletes nothing, so it has not chosen -->
**What.** After an abandoned run everything remains: the launch folder with its pinned copies, returns, review, evidence, report and events, the run branch, the unit branches if any, the worktrees. The end command deletes nothing and the manual assigns the deletions to the human by hand. No command archives, classifies or blocks any artefact. The salvage table at `endings.md:32-42` states what carries and what does not, and its checklist line asks whether salvage passed the setup-versus-output test; no code enforces any row. `flightdeck/blackbox/archive.keep` exists and nothing writes there. The guide and the map page disagree on the run branch, one saying it is left as it is for its evidence and the other saying it is deleted with the worktrees; the built system, deleting nothing, has not chosen.

**Why it matters.** The salvage rule is what makes abandoning a run affordable: setup carries so the next run starts improved, output does not so the next run starts clean. A system that keeps everything has neither property enforced. What carries is whatever the next human happens to read, and what stays behind is whatever nobody deleted.

**Effect on the system.** Each abandoned run leaves its full folder, its branches and its worktrees until a human clears them, and the structure document's finding that run outputs are not a defined set is the same fact seen from the folder. The retry's clean start is clean only by the human's discipline. The archive folder the deck reserved for this has never been used.

### 7. The ending's record contradicts itself in small ways

<!-- + partial belongs to the accepted family in the end command and the abandoned family in the stub; the at-stage flag is unvalidated text stored only in an event; optional log lines are emitted unconditionally; the log's explanatory sentence has been pushed beneath the entries -->
**What.** The word partial belongs to the accepted family at `launch.mjs:42`, so it faces the evidence and clean-tree gate, and to the abandoned family at `runlog.mjs:23`, so it receives the abandoned entry shape; both are deliberate and the same word names two sets. The at-stage flag on the end command is free text validated against nothing, stored only in an event, and recoverable only through the derived symptom line. The optional lines kept and promote are emitted unconditionally on the abandoned family at `runlog.mjs:110` while the template and manual call them optional. The log file's explanatory sentence sits beneath its entries at `RUNLOG.md:32`, because the insert rule places each new entry directly under the title.

**Why it matters.** Each is small. Together they are the shape of a record written by a program for a reader that is also a program, without the reader ever being built. The manuals describe three endings and the launch record holds four terminal statuses. A stage typed wrongly is lost. A field described as optional is always present.

**Effect on the system.** A page or a tool built later to read the ending will meet four outcome words for three endings, a stage it cannot validate, optional fields it cannot distinguish from required ones, and a log whose preamble is its postscript.

## Decisions the shape forces

<!-- ===META=== a bulleted list of open decisions for the human, each one line, no recommendation -->
<!-- + the guide and the map disagree on whether an abandoned run's branch is kept or deleted; the built system deletes nothing, so it has not chosen -->
<!-- + the guide's merge gate is the shortest: integration proof green on the rebased state, CI green, cost line closed -->

- Whether an abandoned run's branch is kept for its evidence or deleted to clear the ground, since the guide and the map disagree and the built system has not chosen.
- Which of the merge gate's three conditions, integration proof on the rebased state, CI, and a closed cost line, the system records, given that today it records none.
- Whether the human's diagnosis is defended by a refusal on the next launch, by a check on the log, or by neither, since the manual's rule currently has no twin.
