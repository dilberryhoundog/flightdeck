# mission-cutter: epic missions — M001

Crew report, C016 (general-purpose, Opus), received 2026-09-18 via the session scratchpad. Pilot's review: the cut follows the commander's own three-launch roadmap, carries both commander-stated missions as first-class, and every done condition is checkable. One error survives two corrections: there is no local branch named `origin`; the ref at 1f20b49 is origin/main. The mission ids M002 to M009 are the cutter's placeholders; ids are assigned when the commander approves. Under the commander's work split (2026-09-18) these are candidate epic missions: the commander decides which earn a place in the mission store now and which wait in the incubator.


The campaign already has an organising frame and the commander wrote it: `dev/workspace/plans/flightcrew-features.md` states ten features and splits them into three launches in dependency order, flightcrew-core (the ground), flightcrew-conduct (a run under its own power) and flightcrew-verdicts (the check rail). Only launch 1 was ever opened as a spec, and it is held. So the spine is six missions: land the finished characterization suite so the system has a truthful description of itself (M002); make the harness the system runs on truthful, because both surviving runs were conducted by hand around broken tooling (M003); repair and re-freeze the core spec, which is nine contradictions and 71 lint errors rather than the two it looked like (M004); then fly the commander's three launches in their own order (M005, M006, M007). M002 gates M004 because the core spec's held state exists precisely to wait for a suite. M003 gates M005 because a refactor conducted by hand leaves no evidence trail, and because several planned fixes rest on claims about Claude Code that have never been tested. Beside the spine run the commander's two cockpit missions, which start immediately and never block: mine the dispatch record into reusable teams (M008), and mine the commander's decisions into standing doctrine (M009). M009 first among equals, because its product is the alignment input every later brief reads.

## M002 — Land the characterization suite and sequence the two testbench trees

**Goal.** The finished description of flightcrew as it stands exists on the branch anyone would look at, with its ledger entry written and its three red checks resolved by a human decision rather than left pending. The two testbench trees coexist by sequence rather than collide, since core's 47 suites test a system that does not exist yet and characterization's 33 test the one that does. After this mission the repo has one trustworthy answer to "what does flightcrew do today".

**What done looks like.**
- `run/flightcrew-characterization-2` is merged into `flightcrew-characterization` and pushed; `origin/flightcrew-characterization` no longer sits at `56ca431` missing the entire run.
- The run-2 entry exists in the ledger with no `<fill>` line, satisfying the rule that no run opens until the previous entry is complete.
- T32 spec-copies and T37 scope-untouched are green or carry a dated human decision accepting a base-state red with its reason; T44 sweep-templates-1 has an exemption or a different alteration, decided not deferred.
- A discovery rule exists so `run-all.mjs` does not run core's future-system suites against the present system; exit 0 from a cleared cache on whichever tree is in scope.
- The `flightcrew-characterization-1/contracts` salvage decision at `95a8cae` is made and recorded, merged or deleted.
- Commit `1c81888`'s doctrine, `spec-altitude.md` and the rewritten interfaces domain of `spec-description.md`, is on the characterization line, since characterization forked at `56bfb87` and never received it.

**Why epic.** Sixteen commits of finished work are invisible to every branch a reader would open, and the two suite trees share a directory namespace under a run-all that runs every suite it finds. Three human judgement calls sit inside it. Not a workshop fix: it unlocks M004 and M005 outright.

**Seams and evidence.** Seam 5 into seam 4. `run/flightcrew-characterization-2` at `4fd81d8`; `runs/run-2/report.md`; the ledger rule in `flightdeck/launch/FLIGHTLOG.md` and `RUNLOG.md`; the `27f6969` commit body stating core's suites "test the future system named by the core spec"; `check-lib.mjs` hard-coding `SPEC_COMMIT ee8c088` and `FREEZE_COMMIT eca2bba`; `suites/_checks/fixtures/sweep-exempt.json`, locked and empty, which is what makes T44 unresolvable inside a run.

**Sweeps in.** Critic observations F1 to F4, above all F2 (run-all charges only new `git status --porcelain` lines, so writes to already-modified, untracked or ignored paths go unseen) and F3 (a regression from writing to logging stays green). The reviewer's three acts on a fresh checkout and the transcript reading. The empty `case-map.json` contract review. Stale `origin/flightcrew-buildout` (7 behind local) and `origin/main` (2 behind). Deleting the migration-debris local branch named `origin` at `1f20b49` and pruning the confirmed pure-ancestor branches.

**First launch.** One crew, a merge analyst, producing the sequencing plan for the two trees and a decision sheet for the three reds, with each human call isolated as a question. No branch is touched and no implementer dispatched until those answers exist.

**Alignment practices applied.** Objectively verifiable done (Building Effective AI Agents) is the exit-0 condition. Leave the environment clean for the next session (effective harnesses) is why the ledger entry is a done condition, not a nicety. Human review catches what evals miss (multi-agent research system) routes the three reds to the commander, not to a crew.

**Risks and open questions.** T44 may require a manual to state a standard before the suite can check it, which is doctrine work hiding inside a merge. Merging both trees under one run-all fails by design, so the commander should say whether they stay separated by branch or by a discovery rule.

## M003 — Make the harness truthful

**Goal.** Every claim the system makes about Claude Code is verified, contradicted or tested directly, and the tooling faults that forced both surviving runs to be conducted by hand are either fixed or recorded as constraints the next design must obey. After this mission a run can be conducted by the system, and no mission is built on a belief about the harness that nobody checked.

**What done looks like.**
- Each of the seventeen harness claims carries a verdict with evidence. The four unsupported by documentation, stopped agents unresumable, stall message on exit 0 undisplayed, workflow runtime rejecting `export default`, and strictest-PreToolUse-wins, each has a direct test result.
- The contradicted claim is fixed in code and doctrine: a worktree's base is the remote default branch unless `worktree.baseRef` is `head`, which silently breaks any launch dispatching workers from an unpushed branch.
- A conducting role invokes a workflow inside a run, demonstrated end to end on a throwaway launch, not argued on paper.
- The turn model is single-sourced: one binding number per agent, a turn reserved for the return, and human and gate waits excluded from run minutes, where run 1 recorded 1306 of them as run time.
- Sealed roles carry `omitClaudeMd: true`, the enforced mechanism, rather than disowning project instructions in prose.
- The locked-path guarantee holds: no accepted run can edit a locked file and legitimise it afterwards by re-pinning.

**Why epic.** Ten faults killed run 1 and the fix was to stop using the tooling. A system that passes its own suite and cannot conduct a run is broken at the architecture, not at the edges. It unlocks M005, and its verification product is what keeps the three launches from encoding folklore.

**Seams and evidence.** Seam 5 into seam 3. `RUNLOG.md:10` faults 1 to 10 and `RUNLOG.md:23` spec conflicts; the buildout-2 reservation line and its F1 finding that locked suites and a locked spec-folder file were edited after `lock_commit`; `flightdeck/flightcrew/workflows/` three scripts ending `export default`; `hooks/README.md`; `schemas/launch.schema.json` `ceilings`.

**Sweeps in.** Gate G3 has no code behind it, no blocker, no phase move, no reference in launch end or land, which is pinned defect 5 exactly. B27 worker render refusing the contracts phase the kickoff dispatches in. The I14 deny rule that would block the test-builder. C3 one-line output versus validator lines. `escalation.json` holding only the newest escalation. Explorers counting against the agent ceiling, and `6dcc00e` raising the explorer from 12 turns to 48 against a roster that still says 12. `fc return` lacking `--stdin` while the orchestrator holds no Write. No command changing a ceiling. `fc check --baseline` rewriting a frozen map's baseline. The two meta-workflows hardcoding the repo path. The launch defaults (agents 12, concurrent 4, turns 25, gate iterations 3, stop blocks 8, critic passes 2) reviewed against what run 1 actually spent. Whether `model: fable` and run 2's all-opus dispatch still name valid tiers, given the fable choice at `5845bf1` was never recorded as a decision.

**First launch.** A verification crew that takes the claim list and returns a verdict sheet with evidence per claim, split into verified, contradicted and needs-a-direct-test. Build nothing until the sheet exists.

**Alignment practices applied.** Add complexity only when evidence justifies it (Building Effective AI Agents) is why verification precedes every fix. Explicit tool and permission restriction over prose (custom subagents) is the `omitClaudeMd` item. A frozen document must not be rewritten by a tool, the commander's own promote line, drives the baseline and re-pin items.

**Risks and open questions.** Some faults may be unfixable within current harness behaviour, in which case the product is a documented constraint, which is still the right outcome. Fixing tooling on the buildout line while M002 lands a suite over the same files risks collision: which branch carries this?

## M004 — Repair and re-freeze the core spec

**Goal.** The flightcrew-core spec is frozen again on purpose, with every contradiction resolved, every lint error cleared and both run diagnoses absorbed. After this mission launch 1 has a document that can be built against and a freeze that is not void.

**What done looks like.**
- All nine `spec_findings` the test-builder raised are resolved by the commander: I8, I13, I9, C13, I14, C2, B4, I1 and SC1.
- `fc lint spec` reports zero of the 71 lint-artefacts errors, which come from interfaces naming artefacts by bare filename and naming absolute paths that do not yet exist.
- Every `promote:` line from both ended runs is traceable to a spec node or explicitly rejected with a reason; no evidence currently exists that this promotion ever happened.
- B70 and E18 are accepted, rejected or scheduled against M007's probe harness, with the dependency stated, since both are unprovable until a check can dispatch a subagent.
- The spec's `status` reads frozen and the freeze is real, not the `852b77c` then `ef44303` sequence repeating; `launch.json` no longer points `current_run: 1` at the void base `7c5913e` with `tests_map: null` and `lock_commit: null`.
- Run 1's FLIGHTLOG entry exists, since by that file's own rule the ledger formally blocks the next run.

**Why epic.** This is the gate on the whole refactor and it is a reasoning mission, not an editing one. Forty-four findings were already absorbed over nine judge passes and the freeze still broke on an altitude rewrite. Seventy-one lint errors and nine contradictions is a repair, not a tidy-up.

**Seams and evidence.** Seam 4. `flightdeck/launch/flightcrew-core/specs/spec.v1.json`, status draft, 8 scope, 8 constraints, 12 interfaces, 35 behaviours, 14 edges, 9 decisions; `runs/run-1/returns/test-builder-map.json` `spec_findings`; the `ef44303` body, "the freeze at 852b77c is superseded, not erased"; RUNLOG on `flightcrew-characterization`; `spec-altitude.md` from `1c81888`.

**Sweeps in.** The interview method lessons from `9b679556`, never invent mechanisms, answer questions before acting, behaviours are outcomes with their reason, promoted from a transcript into doctrine. The live contradiction between a spec grown inside its run folder on `engage-crew` and `fc launch new` requiring a pre-existing frozen spec. Main's `liftoff.template.yaml`, a discarded answer to the question core reinvents as JSON liftoff recipes. The `64dc36c` stalled-state refinements that never reached the buildout, when stall handling is exactly what killed run 1. The rename of the runner from `fc` to `flight`.

**First launch.** A spec-attacker pass over the draft carrying both `promote:` lines as its brief, returning gaps and forks only. Then the commander answers the nine findings before any rewrite begins.

**Alignment practices applied.** Explicit objective, output format and boundaries per dispatch (multi-agent research system) is why the attacker gets the promote lines rather than the repo. Smallest set of high-signal tokens (context engineering) shapes an absorb-or-reject ledger instead of a rewrite. A goal so a young pilot does not finish early: the freeze is the condition, not the edits.

**Risks and open questions.** An altitude rewrite could void this freeze the way it voided the last one, so the commander may want the altitude manual applied before freezing. Does re-freezing wait on M002 landing, or only on the suite existing somewhere readable?

## M005 — Fly launch 1, flightcrew-core: the ground

**Goal.** Everything a conductor needs exists and holds, and nothing conducts a run yet. F1 launch and run layout, F2 JSON document foundation, F3 runner as leaf tooling, F6 roster and separations, F8 enforcement that fails closed. After this mission the invented central runner no longer owns run state, and the human's control surface is the one that was designed.

**What done looks like.**
- The superseded v1 runner, hooks, kickoff library, dispatch templates, schemas and MANIFEST.txt are deleted, per SC1.
- Freeze is enforced from the document's own status field; phase and gate state live in `launch.json` as an index, not in a runner.
- `flightdeck/.controlcenter/` exists as working configuration, per SC2.
- The roster is consistent: the added roles exist and the four pinned crew defects are gone, missing `maxTurns` on explorer, verifier and critic, roster turns not matching files with implementer at 200, missing inputs lines on spec-judge and spec-attacker, and the spec-builder body over 60 lines.
- Enforcement fails closed: a locked path cannot be edited by an accepted run, which the system's own proof run did.
- Core's 47 suites now test a system that exists, and every delta against the landed characterization suite is green or a recorded intended change with its case updated.

**Why epic.** It is launch 1 of the commander's own split and the layer every later launch reads and writes. Fifty-seven of the buildout spec's 78 behaviour nodes describe a runner nobody asked for; removing it changes what the system is.

**Seams and evidence.** Seams 3 and 4. `flightcrew-features.md` Part 2; core spec SC1 and SC2; `a9389f8c`'s verdict on the invented runner and its target model where a web page writes the index and a runner survives only as leaf commands behind pages and hooks; the `27f6969` suites written against the future system.

**Sweeps in.** The three roles that exist only on main, `isolated-worker.md`, `spec-interviewer.md` and `worker.md`, which the constitution names and the buildout lacks. The dispatch inconsistency of three sealed roles and four freehand. `STRUCTURE.md`, deleted on buildout with nothing replacing it. The empty scaffolds across flightcrew. The four library files, byte-identical across main, buildout and the tip, so carrying no conflict risk.

**First launch.** Not an implementer. A delta mapper producing, per core-spec delta, the characterization cases that will change and why, so the refactor knows in advance which reds are intended. That map is the contract the work is judged against.

**Alignment practices applied.** A feature list marked failing first, so done is machine-verifiable (effective harnesses), is exactly the delta map. Read progress, review git log, verify by testing, advance one feature, shapes the unit cadence. Sized tasks with a clear deliverable and no unattended drift (agent teams) argues for waves with check-ins, as run 2's six units did.

**Risks and open questions.** Deleting the runner removes the only working control surface before the designed web page exists. What does the human drive in between? The commander held this once deliberately; holding again is legitimate if M003 shows the harness cannot conduct a run.

## M006 — Fly launch 2, flightcrew-conduct: a run under its own power

**Goal.** A run conducts itself. F4 kickoff as workflow and arguments, F7 dispatch and return contracts, F9 endings performed, F10 diagnosis reaches the next run. After this mission nobody writes a custom workflow to get a run through, which is what both surviving runs required.

**What done looks like.**
- A kickoff is a workflow with arguments, and a full run completes with no hand-written per-run workflow.
- Dispatch and return contracts hold: every return carries what its schema requires, and a return can be stored by a role that holds no Write tool.
- An ending is performed by the system: the ledger entry is stubbed, the report written, and no run opens while the previous entry carries a `<fill>` line.
- Diagnosis reaches the next run: a `promote:` line has a mechanical path into the next spec, so the failure of both prior runs to propagate cannot recur silently.
- The durable fixes for the ten run-1 faults are in the design, not patched around: one binding turn limit with a turn reserved for the return, human waits excluded from run minutes, a ceiling changeable by command, an escalation record that keeps more than the newest entry.

**Why epic.** It is the intent's sentence and needs launch 1 underneath it, in the commander's own words. Every run to date was hand-conducted; this is the mission that ends that.

**Seams and evidence.** Seam 3 into seam 5. `flightcrew-features.md` Parts 1 and 2; the RUNLOG `promote:` line naming a conducting role invoking a workflow as the thing that matters most; B39 versus the workflow runtime; run 2's kickoff instructing "no flightcrew runner, no hooks, no launch".

**Sweeps in.** The verified constraints from M003 that bind a conductor: eight consecutive Stop-blocks end the turn, only frontmatter `maxTurns` binds, workflow scripts have no `Date.now` or `Math.random`, `Agent(<role>)` and `Workflow(<name>)` permission forms exist. Gate G3 gaining code or being removed as a concept. The six open observations F6 to F11 from buildout-2.

**First launch.** An explorer pass that maps every place a human had to intervene in runs 1 and 2, returning the intervention list as the feature backlog. The conductor is specified against real interventions, not against an imagined run.

**Alignment practices applied.** Teammates inherit no history, so every dispatch states its objective, output format, tools and boundaries (agent teams, multi-agent research system) is the dispatch contract itself. Quality gates enforced by hooks rather than prose keeps an ending from being skipped. Each session leaves the environment ready for the next (effective harnesses) is F9 and F10.

**Risks and open questions.** Launch 2 absorbs the two tooling missions the historian listed separately; the commander should confirm that is the right home rather than fixing them on the v1 line first. If M003 finds the workflow runtime genuinely cannot be conducted from, this launch changes shape.

## M007 — Fly launch 3, flightcrew-verdicts, and build instruments we can trust

**Goal.** The system can measure the thing it exists to measure. F5 gives one testing vocabulary and three verdict kinds, backed by a probe harness that can dispatch a subagent against a fixture, real scenario sets so judged and statistical checks stop passing empty, and a spec rubric calibrated against evidence that is not the judge's own output returned.

**What done looks like.**
- Three verdict kinds are implemented under one testing vocabulary, per F5.
- A probe harness dispatches one subagent against a fixture with a declared trials count and threshold, and it decides B70 and E18.
- At least one scenario set exists under `fixtures/scenarios/<set>/`, and T16 to T21 pass or fail on real content instead of on emptiness.
- A judge runner exists with a verdict-sheet JSON schema beside it; these are two distinct gaps and both are closed.
- The spec rubric has an agreement check run against live v2.4, with at least one verified true positive not sourced from the judge's own output, and the contaminated v1 to v2.3 record is marked as such and cited nowhere.

**Why epic.** It changes what a gate reads and is cheapest once gates are workflows, which is the commander's own reason for putting it third. Six of seven check classes currently prove nothing while staying green, and the instrument that gates every spec has never been calibrated.

**Seams and evidence.** Seams 2, 4 and 5. `flightcrew-features.md` F5; the test-builder's unverified reasons for B70 and E18, that no deterministic check can dispatch a subagent; `flightdeck/testbench/README.md` final section; `spec.v1.json:661` deferring the judge runner; the `4f6285bb` summary on contaminated grades; `rubric-testing`'s parallel judge chains across opus, sonnet and fable.

**Sweeps in.** The `93e18c5` QDOD.2 v2.4 repair and relocation. The `sample-transcript` fixture from `27f6969`, holding obedient, control and pull-request-failure orchestrator sessions, which is probe material already committed. `testbench/benches/rubrics/spec/experiments/.keep`, named as the committed home for future rubric-bench chains. `rubric-testing`'s `comparison.md` chains left at "run N ready" and never executed.

**First launch.** Two concurrent crews, adversarially framed on purpose: one designs the probe harness shape from the two unprovable nodes, one audits the rubric calibration record and states exactly which claims survive the contamination.

**Alignment practices applied.** Rubric-based LLM-as-judge with named dimensions (multi-agent research system) specifies the judge runner. Human review catches systematic bias evals miss, which is precisely the contamination story. Run many example inputs and iterate (Building Effective AI Agents) is the scenario set.

**Risks and open questions.** Calibration may show the rubric is wrong rather than merely unproven, reopening specs already judged by it. How much evidence does the commander want before a judged check may gate anything?

## M008 — Build teams from the dispatch record (commander-stated)

**Goal.** The cockpit dispatches a congruent, proven team for a named kind of task, assembled from what the dispatch record shows actually worked, instead of a pilot inventing a crew each run. A team becomes a thing the cockpit holds, with a composition, a rationale and a performance record.

**What done looks like.**
- Every dispatch across all team runs to date is in the crew manifest with type, model, mode, purpose, access, outcome and verification, with no gaps.
- At least two named team compositions exist, each justified by manifest evidence rather than preference, each stating the task kind it fits.
- Each team's record carries failures as well as successes, including the repeated non-handback failures, five in one run and two in another, that this mission's own inputs suffered.
- The cockpit has a defined place for a team, and the extension needed to accommodate teams is specified even if not yet built.
- A pilot dispatches a named team without rewriting the briefs from scratch.

**Why epic.** It changes how every future mission is flown, and the raw material compounds with every run. Not a workshop fix: it needs a mining pass over the whole record and a cockpit extension, and the failure data matters as much as the roster.

**Seams and evidence.** The cockpit: the crew manifest of every dispatch, the crew dossiers, the per-team-run notepad folders, three team runs including this one. Independently, run 2's six-unit wave structure and the `worktree-wf_<id>-<n>` branch naming are a second record of what a working team looked like, contracts first and alone, then fan out.

**Sweeps in.** The four orphaned mission notes on main, `extra-crew-members.md` and `flightcrew-adviser.md` especially, which are the commander's own earlier writing on this. The crew-defect pattern from run 2, a roster whose numbers do not match the role files, as a warning about rosters that drift. The observed subagent non-handback failure mode, which belongs in a team's design rather than in a postmortem. `flightdeck/missions/ideas.keep`, the missions layer doctrine references and nobody populated.

**First launch.** A manifest miner that reads every dispatch across the three team runs and returns the composition table and the failure table, with no recommendation attached. Compositions get proposed only after the commander sees the raw pattern.

**Alignment practices applied.** Teammates inherit no history, so goals must be explicit in the spawn prompt (agent teams): a team is a set of briefs, not a list of roles. Vague task descriptions cause subagent failure (multi-agent research system) is what the mined briefs exist to prevent. Project-scoped agents version-controlled for reuse (custom subagents) shapes the cockpit extension.

**Risks and open questions.** Three runs is thin evidence for a general claim. Should a team be a cockpit artefact, a `.claude/agents/` set, or both? Mined only from cockpit runs, or also from the flightcrew runs on the branches?

## M009 — Mine the commander's decisions into standing doctrine (commander-stated)

**Goal.** The cockpit and flightdeck align with the commander's vision over time by reading a durable, mined record of their decisions, so they shape the system by ruling on real cases rather than restating intent blind each session. A pilot opening a fresh session inherits accumulated judgement instead of asking for it again.

**What done looks like.**
- Every pilot session has a log, and every correction in it is recorded where it landed, with no session unlogged.
- Standing orders in the commander dossier are near-verbatim and dated, each tracing to the decision or session that produced it.
- `decisions.json` holds approvals and rejections with enough context that a later agent can tell what was decided and why, not merely that something was approved.
- A mining pass has run over the full log set and produced at least one standing order the commander did not write by hand, and the commander has ratified or rejected it.
- A pilot's session start reads the dossier, and a new decision that contradicts an existing standing order is surfaced rather than silently absorbed.
- The mining is done by a dispatched team, per the commander's stated intent, not by the pilot reading everything.

**Why epic.** It is the alignment mechanism for everything else, it compounds, and its product improves every other mission's briefs. Not a workshop fix: it needs a mining method, a promotion pathway from observation to standing order, and a contradiction rule.

**Seams and evidence.** The cockpit: the commander dossier, `decisions.json`, one log per pilot session, the logs index, the existing notepad-to-records promotion pathway. The commander's standing advice used to cut these very missions is itself an instance of the artefact this mission industrialises.

**Sweeps in.** The doctrine-drift findings, which are the same problem one level down. Orchestration principles written on `constitution-research` that never reached any later branch, and whose own adversarial review found the fan-out order inverted. The manuals layer that post-dates main entirely. `spec-altitude.md`, written after every run ended and never exercised. The choice of fable for every crew agent at `5845bf1`, an unwritten inference from an unfinished experiment. Each is a decision that failed to propagate, which is exactly what this mechanism is for.

**First launch.** A log miner over every pilot log to date, returning candidate standing orders with the near-verbatim source line for each and flagging any contradicting pair. The commander ratifies; the pilot promotes. Nothing enters the dossier unratified.

**Alignment practices applied.** A durable progress file plus git history as the state-recovery mechanism, and each session leaving things ready for the next (effective harnesses), is the log-per-session rule. File-based memory outside the context window and a running notes artefact (context engineering) is the dossier. Condensed, distilled subagent returns is why a miner returns candidate orders with sources, not transcripts.

**Risks and open questions.** Mined orders can ossify a decision made under conditions that have since changed, so the dossier needs a review or expiry rule. How near-verbatim is near-verbatim for a decision made in passing? Should a standing order ever bind a crew directly, or only reach them through the pilot's brief?

## Not missions

- The two meta-workflows that build flightcrew hardcode the repo path. Workshop.
- Local branch literally named `origin` at `1f20b49`, migration debris. Workshop, delete.
- Pure ancestor branches, `flightcrew-buildout-v1`, `run/flightcrew-core-1`, `run/flightcrew-characterization-1`, six `worktree-wf_*` and two `flightcrew-characterization-2/*`, all confirmed contained. Workshop, prune.
- `dev/workspace/WORKSPACE.md`, `prd.md` and `architectural.md` are unfilled templates on every branch. Treat as absent; fill or delete in workshop.
- Stale remotes for `origin/flightcrew-buildout` and `origin/main`. Workshop, sweeps into M002.
- The empty `.keep` scaffolds across flightcrew. Workshop, sweeps into M005.
- Critic observation F1 on defect text form. Workshop.
- `spec.v1.backup.json` left beside its live file on `engage-crew`, an uncleaned in-progress edit. Workshop, delete.
- The `library/source/orchestrator-pattern/` guides are present and intact; the earlier claim that they were deleted was wrong. No action.
- The interrupted reference-library launch on `constitution-research`, one conversation from completion. Tempting, but finishing a launch for a system about to be replaced is not a mission. Workshop or drop.
- Main's crew port at `5300f0d` being one day stale against `engage-crew`'s `716fe4b`. Historical only; the buildout rebuilt the roles from scratch. Drop.

## Questions for the commander

1. Which branch carries M003's harness work, given M002 lands a suite over the same files at the same time? Buildout, characterization after the merge, or a new line?
2. Do the two testbench trees stay separated by branch, or does run-all gain a discovery rule so both can live in one tree?
3. Does M004's re-freeze wait for M002 to land, or only for the suite to exist somewhere readable?
4. M005 deletes the runner, today's only working control surface, and the designed replacement is a web page that does not exist. What does the human drive in between?
5. T44 may need a manual to state a standard before the suite can check it. Is writing that standard inside M002, or does it belong to M004's doctrine work?
6. Launch 2 absorbs the conducting-role and budget fixes. Is that the right home, or do they get fixed on the v1 line first so runs work sooner?
7. Are M008's teams mined only from cockpit runs, or also from the flightcrew runs recorded on the branches?
8. Should a mined standing order from M009 ever bind a crew directly, or only reach a crew through the pilot's brief?
9. Eight missions is more than the commander asked to fly at once. How many fly concurrently, and do the two cockpit rails start now or after the suite lands?
