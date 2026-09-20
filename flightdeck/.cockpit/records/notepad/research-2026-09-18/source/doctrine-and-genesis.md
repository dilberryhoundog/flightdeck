<!-- SOURCE material, T002, 2026-09-18. Fully referenced and verified; not a record. The commander ruled on 2026-09-18 (commanders-desk/out-advice/DS002.md) that records are sharp, current-form and timeless, and these are the source they are extracted from. -->

# Doctrine and Genesis

Purpose: the pilot understands what the system is meant to be — the doctrine a pilot must know, where that doctrine came from, and where the system as built departs from it.

Researched by: T002 (certified research team, mission M001), records seat, from the `source-reader` seat's full read of the twelve genesis guides and the three constitution documents, the T001 recon reports T001 `doctrine-recon` and T001 `runs-recon`, and contested by the T002 adversary seat. Research date: 2026-09-18. Every quotation below was re-verified against its source blob by the records seat.

Source: `flightcrew-buildout:library/source/orchestrator-pattern/` at `1c81888` — twelve HTML guides, each stamped "Compiled August 2026". There is no README in that directory; `library/source/README.md` sits one level above it. The guides are present, not deleted: `8a56624` added the HTML and `5b2d6ba` removed three redundant text originals, named in its message as the agents, endings and kickoff guides.
Source: `constitution-research:library/constitution/{orchestration-principles,agentic-principles,orchestration-tooling}.md` at `64dc36c`.
Source: `run/flightcrew-characterization-2` at `4fd81d8` — `library/terms.md`, `library/review/adversarial-mandate.md`, `flightdeck/manuals/**`, `flightdeck/flightcrew/crew/*.md` and `flightdeck/flightcrew/bin/`. Every codebase claim in this record is checkable at that branch and commit.

## The terms

`library/terms.md` is byte-identical on `main`, `flightcrew-buildout` and the characterization tip, verified by blob hash `66ad370`. The adversarial mandate is likewise identical at blob `d035d8d`. This vocabulary is stable doctrine, not drift.

A **check** is any executable verification that returns pass or fail. A **target** is a check that exists before the work and is locked against it. A **gate** is the point where check results decide whether work stops or continues. A **verdict** is what a check returns: an exit code, a ratio, or a verdict sheet. A **class** is the kind of check, distinguished by what it proves. A **probe** is a fresh session whose only job is to be an ordinary user of the artefact, and a **record** in that vocabulary is the captured transcript of one probe run. A **fixture** is the known input a check runs against; a **scenario** is a fixed starting prompt and context under which an agent is exercised. A **judge** is an isolated evaluator grading against a **rubric**, producing a **verdict sheet** of per-question answers with quotations, in which a **critical question** is one whose failure fails the behaviour outright. An **ID** is the stable number a behaviour, edge or constraint carries for life; a **domain** is one of the nine named parts of a spec; a **freeze** is the moment a spec stops changing and work begins against it.

The three gates are human decision points, one per stage that cannot be undone cheaply. **G1** approves the plan and moves the run from plan to contracts. **G2** approves the interfaces and moves contracts to implement. **G3** is the final review at the report, and is the ending gate.

## The spec

Nine domains in a fixed order of completion: Intent alone first, then Scope with non-goals, Constraints, Interfaces and contracts, Behaviours with edge cases, and Verification with definition of done last. A spec freezes before work begins, changes only through a new version, never after work starts, and carries zero open questions at freeze.

A spec is not a plan, not a kickoff, not a PRD, not documentation, not a wish list, not a prompt.

The human decides readiness and performs the freeze. The spec-judge answers a fixed rubric yes or no with a quotation, never a score. The spec-attacker works from a fresh context holding the draft and the project root only. The spec-builder never freezes its own work.

Altitude: the right altitude is the largest statement that is still one falsifiable thing, in plain language, using none of the system's own vocabulary. Too high leaves the builder nothing checkable and it guesses; too low merely restates the implementation. A spec is the last document in flightcrew that speaks human language. This doctrine lives on `flightcrew-buildout` only, added by `1c81888` after the characterization branch had forked.

## Testing

Seven check classes: Structural, Behavioural, Artefact, Invariant, Project rules, Statistical, Judged. Three verdict types: exit code, ratio, verdict sheet. A four-rung gating ladder: in the prompt, then a goal condition, then a deterministic gate, then second-opinion refutation. Four placements a check migrates through: standalone, embedded, chained, enforced.

Checks belong to a spec and map bidirectionally to behaviour, edge and constraint IDs. One check proves one thing. Checks are locked and read-only to the agents implementing against them. Humans freeze targets and update goldens. "Tested thoroughly" is not evidence.

For agent-shaped work the classes rank in preference order Deterministic, Property, Statistical, Judged. Each behaviour is tagged with exactly one and is never reworded into a cheaper class. Trajectory checks are invariants over the path, never a comparison against a golden trajectory. One human-read transcript, chosen by the reviewer, is part of done.

## Rubric and adversarial doctrine

A rubric is not a scoring scale. Every question is binary, answerable from the material alone, quotable by construction, of uniform polarity, one fact per question. Calibration against three to five pre-graded examples is mandatory. A rubric the producing agent can edit is a target that moves.

The adversarial mandate governs every review in the system. A finding concerns correctness or a stated requirement only, never style, taste or restructuring. Every finding carries a severity and a confidence, each high, medium or low, with reproducible evidence quoting both the work and the criterion offended. Findings are sorted severity then confidence and numbered F1 onward. A verdict of no findings requires accounting part by part for why none exist.

## Genesis: the twelve guides

The system's inspiration is a set of local web pages kept at `library/source/orchestrator-pattern/`. They describe one pattern: a human writes a frozen spec and a kickoff, then an orchestrator that "holds the goal; touches nothing" plans, dispatches a small role-separated cast, and judges evidence at three human gates.

- `orchestrator-review.html` is the frame. Four pillars, two staying with the human and two moving into the system. Its organising question: "for each quality decision, whether it is routed through the human or through the system."
- `piecing-it-together.html` is the map: ten stages from idea to spec through to accept, merge, log and promote, naming every session and what it may and may not see.
- `agents-guide.html` gives the cast and the reason roles exist: "the definer of done is separated from the doer... the judge is separated from the judged... the coordinator is separated from the content."
- `spec-guide.html`, `verification-guide.html`, `planning-guide.html` and `core-stages-4-7.html` carry the spec's nine parts, the executable definition of done, the decision whether to orchestrate at all, and the mechanics of the middle stages.
- `review-guide.html` seals the critic in a room with the spec and the diff only, and types its findings four ways: correctness gap to the implementer, scope violation to revert, spec conflict escalated to the human, observation logged with no action.
- `endings-guide.html` allows three endings only, accept and merge, abandon and retry, or partial acceptance, and names "fix it up and keep going" as not a fourth ending.
- `run-log-guide.html` requires diagnosis on three failure axes, context, verification and tooling, and rules out "The model was not good enough" as an axis.
- `run-report-guide.html` and `kickoff-guide.html` fix the report's sections and make the kickoff a per-run assembly from a maintained library, never pasted whole.

Read as a sequence the filenames are nearly the stage order flightcrew built. The two that are not stages, `piecing-it-together` and `orchestrator-review`, say how the pattern holds together.

## Genesis: the three constitution documents

They state their own relationship rather than leaving it to be inferred. `agentic-principles.md` is the foundation: "Other documents restate the same principles under different operating conditions. This one is the foundation those restatements draw from, and the definitions here are the ones they refer back to." It gives eight principles for a human at the terminal, each naming the failure it prevents, as with verification: "An agent stops when the work looks done, and if nothing can contradict that impression, 'looks done' is the only signal anyone has." It also carries the model rule the built roster is measured against below: "Match the model to the task. Easy, well-specified work goes to a cheaper, faster model; reserve the strongest for judgement and ambiguity." And on recovery: "Restart rather than rescue. A clean session with a better opening prompt outperforms a long session carrying its own corrections."

`orchestration-principles.md` confirms the relationship from its own side: "The first half of this document takes the universal agentic principles in their original order and restates each for a run." It then adds six principles it frames as having no counterpart under attended work: abandon failed runs, because "The run is disposable; the spec, the tests, the liftoff and the tooling are the investment" (line 109; the summary bullet at line 15 gives the shorter form); repeatable, as a saved script rather than remembered decisions; deterministic tools, because "Every guarantee a run relies on must therefore be enforced by something deterministic, a script or a permission rule that does not consult the agent"; checkpoints, where failure is discovered where it is cheapest; outcome discovery, where the spec fixes the outcome and the route is discovered; and adversarial attack, because a green that nothing has tried to break is merely untested.

`orchestration-tooling.md` is a parallel companion rather than a restatement. It cross-references neither of the others and states no behavioural principles; it enumerates what must exist, from the spec and the roles through frontmatter, skills, hooks, the test harness, the goal evaluator, the liftoff prompt, plans, dynamic workflows, worktrees and handoffs to the run outputs, the final review and the run log. Each of the three has a working draft in the same branch's filebox and a clean twin under `library/constitution/`. None of the three reached `main`, `flightcrew-buildout` or the characterization tip; the only file named constitution on the built branches is an unrelated short fragment about the runner.

## Where the built system diverges

Two divergences are checkable disagreements between a written rule and the files, both at `4fd81d8`.

**The roster is uneven against the model rule.** The rule is doctrine, not opinion: three independent documents state it. `core-stages-4-7.html` says "Everything upstream of the workers stays on the strongest model: the orchestrator, the test-writer, the reviewer." `agentic-principles.md` line 80 says "Match the model to the task. Easy, well-specified work goes to a cheaper, faster model; reserve the strongest for judgement and ambiguity." And `orchestration-principles.md` says cheaper models do the iteration while the strongest is spent on the plan, the interfaces and the final review. Fable is the most capable tier, above opus, per https://code.claude.com/docs/en/model-config. The roster at `4fd81d8` reads five roles on `fable`, being critic, planner, spec-builder, spec-judge and spec-attacker; two on `opus`, being test-builder and implementer; the verifier on `sonnet`; and the orchestrator on `inherit`. So the reviewer is on the highest tier and obeys the rule. The disagreement is with the other two roles the same sentence names: the test-builder is on `opus`, a tier below the reviewer, and the orchestrator names no tier at all.

**The turn budget is a broken model, not a count to tidy.** `agents-guide.html`: "Give every agent a budget... A role without a budget is where a run's cost surprise comes from." The facts as they stand, at `4fd81d8` and in the run log on `flightcrew-characterization`. Characterization run 1 was abandoned when its contracts unit spent 25 turns and stopped without delivering a worker return. Three turn numbers exist in the system and only the frontmatter `maxTurns` binds, which the documentation confirms is the only enforced limit, and reaching it marks the output partial rather than ending the work. Seven of the ten role files declare no `maxTurns` at all: critic, explorer, orchestrator, spec-attacker, spec-builder, spec-judge and verifier. The crew manual exempts orchestrator, spec-builder, spec-judge and spec-attacker by design, so the defect against the manual's own rule is three, being explorer, verifier and critic, which is pinned defect 1. Only three roles declare a budget: implementer at 200, test-builder at 40, planner at 30. The implementer's 200 stands against a roster that says 25, which is pinned defect 2. No turn is reserved for an agent's return, and human and gate waits are counted as run minutes. The commander's assessment, spoken 2026-09-18: the turn budget was a major problem last run and needs surgery, not settling.

**Gate three is recorded but not enforced, as a matter of code.** `git grep -n G3 run/flightcrew-characterization-2 -- flightdeck/flightcrew/bin/` returns exactly three hits: the `GATES` array, the usage string and a plan display filter. G1 and G2 each have a phase transition; G3 has neither, and appears in neither `launch end` nor `launch land`. The doctrine treats all three gates as barriers the run must clear. What follows from that at runtime is an observation for the notepad, not a fact for this record.

Four further divergences are deliberate reshaping rather than disagreement. The cast was renamed and split, and the genesis for that is in the tooling document rather than the guides: `orchestration-tooling.md` lists thirteen roles including a spec interviewer, a spec attacker, a spec judge and a test builder, where the guides name eight and describe the spec work as two sessions with no separate judge. Two of the tooling document's roles did not survive, the interface builder and the strong worker with its per-unit adversary, which the build implements as escalation on failure rather than as distinct agent files. The optional scribe was dropped, its evidence-formatting job absorbed into hooks. The guides' Interfaces stage became the `contracts` phase. The spec moved from a nine-part markdown file to immutable versioned JSON under a schema. And the verification catalogue was reorganised onto two axes, seven kinds crossed with four classes, where the guides carry five kinds and no class axis.

Two things are simply absent. The three constitution documents never reached any built branch. And the spec-readiness rubric that gates every spec has no verified true positive across versions one to two point three, its calibration record was contaminated by the judge's own output returned as human grades, and no agreement check has yet run against the live version.

`flightdeck/STRUCTURE.md`, the scaffold's own contract, is not lost. It is present on `main`, on `cockpit` and on `constitution-research`, and absent only from the buildout and characterization lines. It describes a tree the tip no longer has, so it is superseded where those branches are concerned, but a pilot on `cockpit` has it under their feet.

## Fitment

That the principles were shaped rather than merely extracted is the commander's own account, in DS001: "The orchestration principles where derived from those sources with a bit of 'fitment'", and "The system is slighty changing to my tastes but is primarily based on this inspiration."

One gap between guide and principles is visible and checkable. `planning-guide.html` orders fan-outs by risk: "Serialise the high-risk and the irreversible; parallelise the safe and the independent." `orchestration-principles.md` orders them by replay cost instead, dispatching expensive work first so that a later failure cannot reach it, reasoned from resume semantics that none of the twelve guides discusses in terms of dispatch order. An adversarial review of an early draft found that ordering inverted against the semantics it cited; the corrected copy lives on `constitution-research` and never merged anywhere. What the commander changed beyond this, and why, is not recorded in a form this record can cite.

