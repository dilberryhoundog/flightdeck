# source-reader report — T002

Crew report, C017 (general-purpose, Sonnet), team T002, received 2026-09-18 via the scratchpad. Pilot's spot check: the eight roles including scribe all appear in agents-guide.html; no scribe role exists in the built crew on run 2; the constitution-research principles say "expensive work is dispatched first" at line 79, so the review's F1 fix is applied there; the exact phrase "strongest model" was not found in agents-guide.html by grep, so maintenance flag 5 is unverified and the writer should quote the actual sentence or drop it. Raw input for the records-writer; not a record.


## 1. The genesis in one paragraph
The twelve guides describe a method for running unattended, orchestrated agent work in Claude Code: a human writes a frozen spec and a kickoff (how to conduct the run), an orchestrator plans and dispatches a small cast of role-separated agents against pre-written, locked checks, parallel workers build fixed interfaces in isolated worktrees, a deterministic Stop-hook gate and a fresh-context critic judge the result, a system-assembled report records what happened with provenance on every line, and a run that drifts is abandoned rather than patched, with the diagnosis fed into a run log that improves the spec template, kickoff library and hooks for the next run. `flightcrew-buildout:library/source/README.md`

## 2. Stages, in order
- Idea → spec (interview session, then a fresh attack session against the reviewer's mandate; freeze and commit). `flightcrew-buildout:library/source/orchestrator-pattern/piecing-it-together.html`
- Spec → targets (fresh test-writer derives checks per B/E number, baseline run, tests locked). `piecing-it-together.html`
- Targets → kickoff (human assembles kickoff from the library; run branch/directory created). `piecing-it-together.html`
- Stage 4 · Plan (orchestrator, plan mode; produces `plan.json`; Gate 1). `core-stages-4-7.html`
- Stage 5 · Interfaces (seams built/stubbed/locked; contract checks green or expectedly red; Gate 2). `core-stages-4-7.html`
- Stage 6 · Workers (one worker per unit, worktree-isolated, dispatched in waves). `core-stages-4-7.html`
- Stage 7 · Verify (Stop hook runs the full check set on the merged branch; acceptance script is the stop condition). `core-stages-4-7.html`
- Review phase (fresh-context critic against spec + diff; one fix-and-reverify loop). `piecing-it-together.html`
- Run ends: report assembled (session-end hook/final step); Gate 3 — final review. `piecing-it-together.html`
- Accepted: merge, log, promote (merge discipline, run-log entry, promotion pass into constitution/hooks/templates). `piecing-it-together.html`, `endings-guide.html`

## 3. Roles, in order of the cast
- Orchestrator — reads spec/kickoff, decomposes, dispatches, never implements; returns nothing, holds the goal. `agents-guide.html`
- Explorer — reads codebase/history/docs widely, returns a sized summary; read-only. `agents-guide.html`
- Planner — reads spec+codebase, returns the approved plan; read-only by construction. `agents-guide.html`
- Test-writer — reads the spec only, writes locked checks before implementation; reports spec gaps rather than guessing. `agents-guide.html`
- Implementer — reads its unit's contract, checks and spec slice; writes only inside its unit; returns evidence not narrative. `agents-guide.html`
- Verifier — mostly hooks/gates/scripts; the agent form re-runs evidence in a fresh context and tries to refute "done". `agents-guide.html`
- Critic — reads spec + diff only, in a sealed fresh context with an adversarial, bounded mandate; returns typed findings or "no gaps". `review-guide.html`, `agents-guide.html`
- Scribe (optional) — reads check/critic output, writes the evidence display and drafts the run-log's mechanical fields. `agents-guide.html`

## 4. Artefacts a run produces
- `specs/<name>/spec.md` frozen at a commit — the shared definition of done. `spec-guide.html`, `piecing-it-together.html`
- `tests-map.md` (B/E number → check name) plus the locked test files and the end-to-end acceptance script. `piecing-it-together.html`, `verification-guide.html`
- `runs/<id>/kickoff.md` at a recorded version — the orchestrator's standing conduct instructions. `kickoff-guide.html`
- `runs/<id>/plan.json`/`plan.md` — units, waves, interfaces, budgets, abandon triggers, approved at Gate 1. `core-stages-4-7.html`, `planning-guide.html`
- Interfaces commit + the protected path set — seams built/stubbed and locked before parallel work. `core-stages-4-7.html`
- `events.jsonl` — hook-recorded agent/tool/gate events. `piecing-it-together.html`, `run-report-guide.html`
- `runs/<id>/checks/` — verbatim command/exit/output per check, plus the evidence display/page. `core-stages-4-7.html`, `verification-guide.html`
- `review.md` / findings with severity and state — the critic's typed output. `review-guide.html`
- `runs/<id>/report.md` — eight sections (header, ledger, verification, review, phases, agents, failures and interventions, orchestrator notes), each provenance-marked recorded/checked/reviewed/stated. `run-report-guide.html`
- `RUNLOG.md` — ten-line diagnosis entries (symptom, axis seen on, cause, axis fixed on, change, watch), newest first. `run-log-guide.html`

## 5. Orchestration-principles: principles and sources
Universal principles, each restated for a run, with its cited Anthropic source:
- Context engineering — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Verification — https://code.claude.com/docs/en/best-practices ; https://code.claude.com/docs/en/goal
- Observability — https://www.anthropic.com/engineering/multi-agent-research-system
- Review — https://code.claude.com/docs/en/best-practices
- Decomposition — https://www.anthropic.com/engineering/multi-agent-research-system
- Isolation and recoverability — https://code.claude.com/docs/en/sub-agents
- Budgets and stop conditions — https://code.claude.com/docs/en/goal ; https://code.claude.com/docs/en/workflows
- Permissions and blast radius — https://code.claude.com/docs/en/hooks-guide
(The document lists sources collectively at the end rather than per-bullet; the seven above are the clearest per-section attributions. `constitution-research:library/constitution/orchestration-principles.md`)

Six run-only principles, no attended-work counterpart: abandon failed runs, repeatable, deterministic tools, checkpoints, outcome discovery (cites https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents and https://alignment.anthropic.com/2026/automated-w2s-researcher/), adversarial attack. `constitution-research:library/constitution/orchestration-principles.md`

What the review's F1 finding changed: F1 found the fan-out-ordering bullet told the orchestrator to dispatch **cheap work first, expensive last**, which is the opposite of the cost-minimising order implied by the workflow-resume semantics it cites (a failed agent and everything dispatched after it reruns, so expensive units should go first, where a later failure can't reach them). `main:dev/workspace/filebox/orchestration-principles-review.md` F1. The copy on `constitution-research` I read already states the corrected rule — "Order fan-outs so that expensive work is dispatched first" — so F1's fix has been applied there, though doctrine-recon notes this corrected copy never merged into `flightdeck/` doctrine at all (see §6). `constitution-research:library/constitution/orchestration-principles.md` line 79; `flightdeck/.cockpit/notepad/recon-2026-09-18/doctrine-recon.md` §6.

## 6. Divergence: built system vs. genesis
- **Never merged at all.** `orchestration-principles.md` and its adversarial review never reached `main`, `flightcrew-buildout`, or `flightcrew-characterization` — confirmed absent by `git ls-tree` grep for "constitution" on all three. Only an unrelated `constitution-fragment.md` template exists in the built tree. `doctrine-recon.md` §6.
- **Roster: renamed and split, not a 1:1 map.** Genesis names orchestrator, explorer, planner, test-writer, implementer, verifier, critic, scribe (agents-guide.html §2). The built tip's eleven roles (`crew/README.md`) are orchestrator, explorer, implementer, verifier, critic, planner, test-builder (test-writer renamed) plus three new spec-chain roles absent from agents-guide — spec-builder, spec-judge, spec-attacker. Scribe is dropped; its job (evidence display formatting) is absorbed by hooks. `runs-recon.md` §4.
- **Stage "Interfaces" renamed "contracts", "targets" formalised as its own launch phase.** Genesis's Stage 5 "Interfaces" (core-stages-4-7.html) is the built system's `contracts` phase in the fixed enum `targets, plan, contracts, implement, verify, review, report, ended`. `runs-recon.md` §2.
- **Gates: G1/G2 enforced, G3 is not.** Genesis's three human gates (plan, interfaces, final review) each halt the run and require approval (core-stages-4-7.html, piecing-it-together.html). The built tip enforces G1 (plan→contracts) and G2 (contracts→implement) with phase moves and blocker functions, but G3 has no phase move and no blocker — `fc launch gate G3 approve` on an already-ended launch exits 0 and records it, a pinned defect. `runs-recon.md` §3, addendum item 2.
- **Verification catalogue reorganised into a two-axis kind/class schema.** Genesis groups checks into five kinds (Structural, Behavioural, Artefact, Invariant, Project rules) with ~13 named shapes inside them (verification-guide.html). The built system keeps seven `kind` values (adding `statistical` and `judged` as first-class kinds not named as top-level genesis groups) crossed with a separate `class` axis (`deterministic, property, statistical, judged`) that the genesis catalogue does not carry. `doctrine-recon.md` §3–4.
- **Spec: JSON-versioned and schema-governed, where genesis is a markdown template.** Genesis's spec is a nine-part markdown file frozen at a git commit (spec-guide.html). The built system versions it as immutable `spec.v1.json` files with `status` fields and an append-only `retired` registry (`spec-versioning.md`), a formalisation genesis does not describe. `doctrine-recon.md` §4.
- **A whole doctrine document — spec-altitude — was added after the buildout fork and never reached the tip.** Not part of the twelve guides' scope, but relevant lineage: `spec-altitude.md` (84 lines, added 2026-09-15 in commit `1c81888`) exists only on `flightcrew-buildout` and was never on `flightcrew-characterization`. `doctrine-recon.md` §3, §7, follow-up section.
- **Run-report section count is disputed against the guide's own anatomy.** `run-report-guide.html` §"Anatomy" names eight sections; the built `report.mjs` template header also claims eight, but a direct heading count on the rendered template found seven, and neither number is confirmed as authoritative. `runs-recon.md` addendum item 11.

## 7. Maintenance: dated, contradicted, or imprecise
- The principles document's F5/F6 findings (mis-stating the eight-block Stop-hook override as an author-declared condition, and claiming the strongest model is "reserved for judgement" when `/goal`'s own evaluator runs on the small fast model) are findings against `orchestration-principles.md`, not against the guides — `core-stages-4-7.html` and `verification-guide.html` describe the eight-block override correctly as a harness behaviour/stall detector, not something the author declares. `main:dev/workspace/filebox/orchestration-principles-review.md` F5, F6; `core-stages-4-7.html`.
- `agents-guide.html`'s "everything upstream of the workers stays on the strongest model: the orchestrator, the test-writer, the reviewer" is the same unsourced strongest-model-for-judgement claim the review flagged (F6) when it appears in the principles document — the guide states it as design opinion, not sourced to an Anthropic page, so it carries the same unsupported-claim risk if promoted into doctrine. `core-stages-4-7.html`; review F6.
- `orchestrator-review.html` cites "Automated Weak-to-Strong Researcher" only implicitly via the outcome-discovery framing ("prompt with heuristics rather than rigid rules"); the principles document's stronger claim that cheaper models iterating against a check *outperform* a single strongest-model attempt (F2 in the review) is not stated this strongly in any of the twelve guides I read — the guides' framing is closer to "cheap iteration is viable," not "cheap beats strong." Worth checking before the principles document is promoted, since F2 already flagged it as an unsourced empirical comparison. `main:dev/workspace/filebox/orchestration-principles-review.md` F2.
- The guides are internally dated only by their compile stamp ("Compiled August 2026") and I found no content in the twelve guides contradicted by the built system's confirmed harness facts in doctrine-recon §9 / runs-recon §7 — those sections flag the *built system's* harness claims as unverified against Claude Code itself, not the guides.

Every claim above is cited `branch:path` at first use in each section. Guides not directly examined for this finding beyond what's cited: nothing further found — the twelve-guide set (agents, core-stages-4-7, endings, kickoff, orchestrator-review, piecing-it-together, planning, review, run-log, run-report, spec, verification) was read in full via `git show flightcrew-buildout:library/source/orchestrator-pattern/<name>.html`.

## Addendum: the three constitution documents (source-reader, 2026-09-18)

Pilot's check: the two line-5 quotes stating the derivation hold verbatim. agentic-principles.md is the foundation (eight universal principles, four collective Anthropic sources); orchestration-principles.md restates them for a run and adds six run-only principles; orchestration-tooling.md is a companion inventory of what a run needs before liftoff (spec, roles including spec interviewer, attacker, judge and test builder, permissions, CLAUDE.md, skills, hooks, harness, goal evaluator, liftoff prompt, plan, workflows, worktrees, handoffs, outputs, review, run log), eight Anthropic sources. None of the three reached main, buildout or the run-2 branch. The built spec chain has its genesis in orchestration-tooling.md.
