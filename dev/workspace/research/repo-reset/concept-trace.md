# Concept trace

Source: background session concept-tracer (b96ed21c), 2026-10-09. Read-only comparison of the successive concept documents in the flightdeck repo. Lines labelled Interpretation or Reading are the session's own reading, not quotes. Text is the session report as sent, unedited.

CONCEPT-TRACE 1/7 — SUMMARY (the full report follows in 6 more messages; nothing was written to the repo; working copies of the six reader extractions are in /Users/dylangraham/.claude/jobs/b96ed21c/tmp/parts/ A..F, outside the repo). Note: flightdeck-33 did not resolve in ListAgents, so I sent this to you as the only local non-excluded session.

SUMMARY. In 40 days (2026-08-31 to 2026-10-09) the repo holds about eight successive statements of what flightdeck is: (G0) 08-31..09-02 README/STRUCTURE/flight-assistant/library constitution; (G1) 09-03..04 flightcrew v1 design and spec; (G2) 09-10/09-11 flightcrew-core spec; (G3) 09-13..17 characterization spec; (G4) 09-17..22 first cockpit (keep, CLAUDE.md, M001/M002); (G5) 09-29 cockpit.constitution (147 lines); (G6) 10-08 constitution.md, agentic-systems.md, session summary, Ds-010, plus six web-chat proposals; (G7) CONCEPT.md, uncommitted, written 2026-10-09 20:25. Each generation starts by shelving the one before it (missions folder removed 09-17; whole cockpit moved to .cockpit-archive 10-04; CONCEPT.md says "all previous work can be archived, treat work as no longer relevant"). That is the pattern the owner reports as cycling.

What persisted in nearly every version (probably central): (1) use Claude Code's own harness instead of custom replacements, 8 of 8; (2) take the human out of per-turn decisions, 8 of 8, but the stated human role changes each time (gates at plan/interfaces/final review, then 'commander gives orders as records', then 'present mainly to activate', then 'HITL tool with an acceleration layer'); (3) a lead/orchestrator/pilot that dispatches teams and does not do the work itself, 7 of 8 (absent only from constitution.md, which says a plain session is enough); (4) a library of agent definitions and team shapes; (5) manuals; (6) 'fix the setup, not the output' as a principle, in 7 of 8 though the exact phrase first appears 10-08; (7) independent adversarial checking, 7 of 8 but absent from CONCEPT.md.

Dropped: the spec chain (interviewer, judge, attacker, test-builder, frozen spec, liftoff/kickoff) and the whole flightcrew runner, strong in G0..G3, gone from 10-08 and CONCEPT.md; ranks, vocatives and callsigns (G4/G5, demoted to 'nice to have' 10-08, reduced to 'officers' in CONCEPT); typed records for every human input with approval flags (G4/G5, explicitly rejected 10-08); missions/sparks and 'commander closes missions'.

Returned: workshops (absent G0..G3, where 'launch' did the same job; present G4/G5; unnamed system in G6; named with promotion in CONCEPT); dev-workspace (to be replaced in G0, barred in G1, used in G4, silent in G6, 'retain git and branch isolation' in G7); a flight CLI (added as fc in G1, 'flight' dispatcher then deferred G2, removed G3, replaced by pilot procedures G4, 'nice to have' G6, stub in G7); a HUD/web page (always deferred, never built); plugin packaging (G5, G6 nice-to-have, G7).

New 10-08 and absent from CONCEPT.md: the human can always fall back to plain chat; 'nothing starts on its own'; the sixteen-systems decomposition; 'build one system at a time'; 'fix the machinery, not the code'. New in CONCEPT.md: a lab that is 'non distributed', manuals as operator/technical/maintenance per workshop, the 'flight' CLI and HUD as explicit stubs, plugin = one 'flightdeck' directory.

Biggest open tension for the interview: CONCEPT.md wants 'a purpose built lead' while the 10-08 constitution's principle 1 says a decent prompt in a standard session is the core; and CONCEPT.md never mentions flightcrew, the thing most of the repo (and three abandoned runs) is built around.

READ COVERAGE. Six sonnet readers (A early 08-31..09-02; B library/constitution-research; C flightcrew v1+core; D characterization; E cockpit v1 early; F cockpit v1 late + newest). I read in full myself: CONCEPT.md, flightdeck/.cockpit/constitution.md, and reader reports A, F; I read the IDEAS/NAMES/ODDITIES sections of reader reports B, C, D, E. I spot-checked 25 load-bearing quotes against git (all matched; one apparent miss was a version difference: 'discovered not built' is in flightcrew-core spec 7c5913e of 09-10 and gone from ef44303 of 09-11). Read in full by readers: README(s), STRUCTURE.md, flight-assistant.md, prompts/constitution.md, three library/constitution docs (with diffs between revisions), both filebox review files, cockpit.keep, CLAUDE.md at ed132bd and tip (plus a revision trace), cockpit.constitution, constitution.md, agentic-systems.md, session summary, Ds-010, log-append, flightcrew/README, launch/README, manuals/README, GLOSSARY, M002, XD-001..006. SAMPLED ONLY: flightcrew design.md (about 110 of 315 lines), the flightcrew manuals (mostly openings), crew role files, the six web-chat proposals (1678 lines, headings and openings only), commander ideas files (about first 1500 bytes), cockpit manuals (headings), XD-007..013, the 61-check tests map, characterization run reports, history summaries (SUMMARY block only). NOT READ: the 90 or so conversation extracts in dev/workspace/research/repo-reset/extracts (another session's material), .cockpit comms/lab/logs/manuals/team working-tree folders, schemas, validators, run data. Everything labelled 'Interpretation' is a reader's or my own reading, not a quote.

Date caveat: CONCEPT.md has no commit. The index holds an EMPTY blob staged (git diff --cached shows 0 insertions); the 2742-byte, 59-line text is the working-tree file, modified 2026-10-09 20:25.

---

CONCEPT-TRACE 2/7 — DOCUMENTS IN DATE ORDER (introducing commit/date; last change; size; three statements of what it says the project is, quoted). Branch in brackets. G = generation label used in the ledger.

G0 (08-31 to 09-02)
1. README.md [main, cockpit; variant on flightcrew-buildout] — 63adee0 2026-08-31, last 3817b55 2026-09-03 (variant only) — 3 lines. (a) "A toolkit for agentic software building." (b) "Human in the loop (controltower), and orchestrated runs (flightcrew)"; variant: "(hangar)" and "(flightcrew, launch)". (c) nothing else.
2. flightdeck/STRUCTURE.md [cockpit, main] — 1c8b3fa 2026-09-01, unchanged — 70 lines. (a) "an orchestration workflow tool for agentic software building, early in its life and intended to eventually replace the dev-workspace system." (b) a scaffold "FlightDeck installs into a project, the way dev-workspace installs `dev/`". (c) fixed top level: blackbox archive, flightcrew orchestration, hangar workspace, launch runs, manuals, missions ideas, radar visuals, testbench tests.
3. flightdeck/missions/*.md, 4 files [main only; removed from cockpit at ed132bd 09-17] — 2269973 2026-09-02 — 4 to 13 lines each. (a) "Create a library of all the key concepts and tools of flightcrew" (b) "Create a flightcrew (orchestration) adviser" so "User can have a conversation about any section to change the shape of the launch." (c) "build a shape, record it forever, reuse when ever."; also a list of possible extra agents including flightdeck-manager.
4. .claude/agents/flight-assistant.md [cockpit, main] — 8ec2d11 2026-09-02, blob unchanged — about 85 lines. (a) "FlightDeck is an end-to-end, high-quality orchestration system for Claude Code: a frontier model acts as orchestrator and manages a team of agents". (b) design question for every part: "what did the human do here? and what now replaces it?" (c) "Claude Code is the harness, operated by a solo developer"; "Claude Max 20x".
5. dev/workspace/prompts/constitution.md [constitution-research] — 7fd963b 2026-09-02 — 170 lines. The owner's terse outline. (a) Scope: "Human in the loop quality decisions replacement." (b) "Single user, Claude Max x20 subscription."; out of scope "Enterprise patterns". (c) nine spec sections and 13 agent roles.
6. library/constitution/agentic-principles.md (99 lines), orchestration-principles.md (172 lines at tip), orchestration-tooling.md (218 lines) [constitution-research only] — 8aaccd2 2026-09-02; orchestration-principles revised 09aa18c 09-02 and 64dc36c 2026-09-03 (adds "Outcomes are discovered, not built", template-every-input, fan-out expensive first; removes owner-coined "Expressive freedom"). (a) "A run is one unattended execution of a piece of work ... directed throughout by an orchestrator: an agent that plans, holds the gates, dispatches workers and merges their results, and never does the work itself." (b) tooling "enumerates everything that has to exist before a run ... can replace the person who used to sit at the terminal." (c) never names flightdeck.
7. library/terms.md, library/spec/interview-session-conventions.md, library/rubrics/rubric-guide.md, library/review/adversarial-mandate.md [cockpit, main] — 9f938e9 2026-09-01 (mandate 81b8008 09-02) — vocabulary and method documents: checking terms (check, target, gate, verdict, freeze), spec-interview rules, rubric method, a reviewer prompt. Not statements of purpose.
8. dev/workspace/plans/prd.md, architectural.md, WORKSPACE.md (main), dev/workspace/README.md — c9533e0 2026-09-01 — unfilled dev-workspace templates with no flightdeck content. (cockpit WORKSPACE.md was filled 2026-09-17 43538c9: "the pilot agent's exclusive post inside `flightdeck/.cockpit/`".)

G0-adjacent filebox 09-03: dev/workspace/filebox/orchestration-principles.backup.md and orchestration-principles-review.md [cockpit] — 025fa75 2026-09-03 — an adversary review of the library constitution (seven findings). Also filebox scaffolds of the three constitution documents [constitution-research, 7fd963b 09-02] which say "the previous constitution document is retired".

G1 flightcrew v1 (09-03 to 09-04)
9. flightdeck/launch/specs/flightcrew-v1/design.md (315 lines, 5f69a94 2026-09-03) and spec.v1.json (frozen 88290d0 2026-09-03) [flightcrew-buildout, -core]. (a) "hand a frozen spec to an orchestrated run and leave the room" (b) "large builds no longer depend on the developer being present for every turn" (c) one `fc` runner, nothing installed.
10. flightdeck/flightcrew/README.md (37 lines), launch/README.md (29), manuals/README.md (88), crew/README.md — 5cad9b9 2026-09-04, last acafec4 09-04 (manuals/README and MANIFEST.txt reworked 93e18c5 2026-09-10 to move the rubric). (a) "the global assets every launch under `flightdeck/launch/` uses" (b) "Nothing here is installed; `fc` is invoked by path, hooks run in place" (c) four directories: flightcrew, launch, testbench, manuals.

G2 flightcrew-core (09-10, 09-11)
11. flightdeck/launch/flightcrew-core/specs/spec.v1.json — introduced 852b77c 2026-09-10, frozen 7c5913e 09-10, reopened as draft and rewritten ef44303 2026-09-11 — 35 KB. 09-10 text: "An AI engineer who has outgrown one-shot chat turns needs a crew of agents"; "The outcome is discovered not built". 09-11 text: "HITL AI engineering falls short for any large or complex task requiring a human's direct time and attention"; no phase field; `fc` replaced by plain scripts, a "flight" command deferred. Commit 27f6969 calls the first core run "the void flightcrew-core run".

G3 characterization (09-13 to 09-17)
12. flightdeck/launch/specs/flightcrew-characterization/spec.v1.json (frozen, last 56ca431 2026-09-16); testbench/README.md rewrite (09-16); run 2 kickoff/report; dev/workspace/filebox/spec.md [flightcrew-characterization, 68681c0 2026-09-17]. (a) a test suite over "every part" before a refactor; defects "pinned" never fixed. (b) spec.md: "'fc' command surface removed", "Returning back to core source description.", keep agents, hooks and "kickoffs with 3 workflows", add a setup skill and operator and maintenance manuals. (c) Run 1 abandoned; run 2: 58 of 61 checks green.

G4 first cockpit (09-17 to 09-22) [cockpit]
13. flightdeck/.cockpit/cockpit.keep — ed132bd 2026-09-17, never edited, deleted 44701db 2026-09-29 — 9 lines (line 7 cut off mid-sentence). (a) "Exclusive to a "pilot" agent and the Human "Commander". No other crew is permitted into the cockpit." (b) the pilot is "constrained to the cockpit" and leads "a team of crew members, whom do all of the writing and bulk reading of the repo" (c) "Use JSON and markdown."
14. flightdeck/.cockpit/CLAUDE.md (now .cockpit-archive/CLAUDE.md) — ed132bd 2026-09-17, 24 revisions to d5c154d 09-22; 44 lines at founding, peak 96, tip 79. (a) "Flightcrew ... is the foundation of an orchestration system built on Claude Code best practices. The cockpit is the post from which it is run" (b) "Durable knowledge lives in the cockpit, not in a session ... A conversation is not a record." (c) 8 mandates became 12 rules, five rooms, ID table, linter.
15. missions M001 (ed132bd), M002 self-sustaining cockpit (2026-09-20), commander decisions D001..D006 (4409136 09-17) later De001..De028, XD-001..013 — records of one owner; M002 aims to replace "the brittle fc CLI" with procedures run by a pilot.

G5 (09-29)
16. flightdeck/.cockpit-archive/cockpit.constitution — 44701db 2026-09-29, moved bea5798 10-04 — 147 lines, no numbered principles, sections Roleplay, Commander, Pilot, Work, Key Infrastructure, Testing, Crew, Package. (a) "This is the cockpit, part of the flightdeck project control system." (b) "Get this roleplay correct and the system works at a far greater capacity than "human in the loop" can ever achieve." (c) "Cockpit will be an optional plugin realease under the parent flightcrew plugin."

G6 (10-08)
17. flightdeck/.cockpit/constitution.md — bf58a05 2026-10-08, unchanged — 32 lines; principles 1 to 10, number 11 empty, then "Claude's notes" written by an agent. (a) "the cockpit's purpose can be fulfilled with a decent prompt in a session with a standard claude code model with teams settings on." (b) "Looking to replace these tools with custom implementations is "fighting the machine"" (c) "the human present mainly to activate the agent."
18. flightdeck/agentic-systems.md — a82769f 2026-10-08 — 104 lines. (a) "Flightdeck is agentic workflows inside project folders, layered over Claude Code." (b) "one integrated system that builds trust over time and removes the need for human steering, with the human sitting a level higher than the work." (c) sixteen systems in three loops; "Everything in flightdeck is an experiment."
19. dev/workspace/context/agentic-systems-session-summary.md (97 lines), filebox/session-close/Ds-010-session-concepts.md (61), log-append.md — 015f8e7 2026-10-08. Agent-written. (a) "Everything under `flightdeck/` is an experiment, including its folder layouts" (b) first cockpit "never did project work. Of its 19 team dispatches, 16 worked on the cockpit itself" (c) "Each correction became a rule, and the rules did not change behaviour."
20. library/source/agent-teams/*.md, six files, 1678 lines — e986031 2026-10-08. PROPOSALS from a web chat, not owner statements. "Running agent teams, part one of six": persisted truth, locked lead, handoffs, routing, the lineup, failure modes.

G7
21. CONCEPT.md [cockpit working tree, uncommitted] — 59 lines, 2742 bytes, modified 2026-10-09 20:25. (a) "Build an acceleration layer on top of claude code ... Using a purpose built "lead" talking to agent teams and other background sessions." (b) "cockpit: head and hands philosophy, A pilot dispatching teams of agents." (c) "Plugin: distributed as a claude code plugin. imports a single "flightdeck" directory".

---

CONCEPT-TRACE 3/7 — IDEA LEDGER (part 1 of 2). Status is judged against G6 (10-08 constitution/agentic-systems) and G7 (CONCEPT.md, newest). Statuses: persistent / dropped / returned / new / renamed. Interpretation is marked.

1. USE THE CLAUDE CODE HARNESS, DO NOT REPLACE IT — PERSISTENT (G0 to G7).
 G0 09-02: "Claude Code is the harness" (flight-assistant); tooling doc: each entry names "which feature of the current agentic harness implements it". G1 09-03: spec built on agent files, hooks, workflows. G2 09-10: "Claude Code's native harness carries the conduct — agent files for roles, hooks for enforcement and recording, dynamic workflows". G3 09-16: "Claude Code as it is". G4 09-17: "The Agent tool, SendMessage and ListAgents are the pilot's hands." G5 09-29: pilot uses "Claude Code based agents teams (crews), cross session messaging (other sessions) and subagents". G6 10-08: "Looking to replace these tools with custom implementations is "fighting the machine""; "Never replace what Claude Code ships. Accelerate it." G7: "prefer claude code harness content over bespoke solutions".
 Interpretation: the most stable idea. Yet G1, G4 and G5 each built large custom apparatus (fc runner, 13 schemas and a linter, 147-line record scheme), and G6 says so (Ds-010: should not be rebuilt as it was).

2. HUMAN OUT OF THE PER-TURN LOOP (HITL independence) — PERSISTENT, but the human's remaining role is restated every time.
 G0: "what did the human do here? and what now replaces it?"; "Human in the loop quality decisions replacement."; human moves to "a small number of gates: the plan, the interfaces, and a final review". G1: "hand a frozen spec to an orchestrated run and leave the room". G2 09-11: "The human front-loads their attention and time into a carefully crafted definition of the work". G3: human "gives the final word by merging or rejecting the run's pull request". G4/G5: "The primary purpose is to prompt the human to not become bogged down making every decision."; commander gives orders as written records. G6: "the human present mainly to activate the agent" (principle 9); "Nothing starts on its own. The human keeps control of what their agents do." (agentic-systems); "the human sitting a level higher than the work." G7: "Claude code is a HITL developer tool, with a moderate amount of agentic functionality."
 Interpretation: G7 describes a HITL tool being accelerated, G6 describes removing steering. Q-linked: question 5.

3. FIX THE SETUP, NOT THE OUTPUT ("fix the machinery") — PERSISTENT as an idea; the phrase is NEW at G6.
 G0: "when it drifts, the drift is evidence about the setup, not a result to be rescued"; "The run is disposable; the inputs are the investment." G1 09-04: "A run that drifts is abandoned, not patched" with three axes "context", "verification", "tooling". G2: "Every guard fails closed"; "a mechanism the harness enforces cannot be forgotten by an agent". G3: defects are "pinned", never fixed. G4: M002 "the commander steers rather than repairs". G6: constitution 4 "fix the machinery, not the code"; agentic-systems "fix the machinery, not the output" (different last word). G7: not stated; "components ... able to be evaluated and hillclimbed" is the nearest.

4. A LEAD THAT DISPATCHES TEAMS AND DOES NOT DO THE WORK — PERSISTENT G0..G5 and G7; ABSENT in constitution.md (G6), RENAMED repeatedly.
 Names: orchestrator (G0..G3: "never does the work itself"; holds no Write or Edit) → pilot (G4 "Dispatch and verify; do not gather"; G5 "The Pilot makes decisions and directs teams") → captain (G5 ranks.txt) → "lead" (agentic-systems, G7). G6 constitution.md never says lead, pilot or dispatch; principle 1 says spawning "can all be spawned from here by just mentioning in the chat." G7: "Using a purpose built "lead" talking to agent teams and other background sessions."; "cockpit: head and hands philosophy, A pilot dispatching teams of agents."
 The web-chat proposals (G6, labelled proposal) restate it: "the lead may look in order to decide, but must dispatch in order to do."

5. ROLEPLAY, RANKS, CALLSIGNS, VOCATIVES — G4 and G5 only; shrinking since: DROPPED then partly returned.
 Absent G0..G3 (roles were functional). G4 09-17 keep: pilot says "yes commander"; callsign Ace added 09-18. G5: "Every subordinate role acknowledges every instruction with an affirmative interjection followed by the superiors rank as a vocative". G6: agentic-systems "Nice to have: A roleplay system."; Ds-010: "the ranks and the vocatives ... should not be rebuilt as it was". G7: "officers are direct session agents". Status: dropped from G6 core, partly back as 'officers' in G7.

6a. STATE OF A PIECE OF WORK KEPT AS FILES (JSON/markdown, schemas, run logs) — PERSISTENT.
 G0 spec IDs, run log; G1 "JSON documents with schemas", "plan.json is the source of truth"; G4 "JSON for manifests and state, markdown for prose"; G6 "The layer is mostly JSON and Markdown files", "Logging: what happened, as a permanent record"; G7 "state recorded", "mutating and viewing JSON files".
6b. A TYPED RECORD FOR EVERY HUMAN INPUT, WITH APPROVAL FLAGS — G4 and G5 only; DROPPED explicitly at G6.
 G4: orders verbatim, IDs with prefixes, 13 schemas, `cockpit-lint`; G5: CO/CA/CR/CQ/CI and XD/XR/Ds/XX/XP/PP, "full/part/held" approval; "Commanders records are the source of truth." G6: "Nothing makes you file records. The conversation, memory, and transcripts already hold what you say." and "prefixes, approval states, and flags to flip are what v1 showed to cost more than they returned." But the G6 web-chat proposals say the opposite: "chat is not a record" and v1 CLAUDE.md says "A conversation is not a record." Not in G7 apart from "state recorded".

7. INDEPENDENT ADVERSARIAL CHECK — PERSISTENT G0..G6; ABSENT FROM G7.
 G0: "a critic whose job is to find what is wrong"; "Every passing result is presumed wrong until a fresh context has tried to break it and failed." G1/G2: critic; adversary per unit. G3: judge with calibrated instrument. G4: "always Opus for an adversary". G5: commanders-advocate (opus). G6: Ds-010 "the adversary seated before the first landing ... the single practice with measured value here"; "two blind readers and a judge". G7: nothing named; "agent definitions across common patterns" at most.

8. SPEC → TESTS → BUILD → REVIEW CHAIN (spec-interviewer, judge, attacker, test-builder, frozen spec, liftoff or kickoff) — DROPPED.
 Strong G0..G3 (nine-section spec, thirteen roles, "No code is written before the tests exist"). G4/G5 echo only as a "mini-spec" idea file ("Build a mini-spec team"). G6: agentic-systems keeps only "Verification: The rubrics and schemas that say whether a piece of work is right." G7: absent. The flightcrew product that held this chain is not named in G6 or G7.

9. WORKSHOPS (discrete, state recorded, retryable, promotion when done) — RETURNED, with a rename.
 G0..G3 absent by name; the 'launch' (G1: "one run of one spec"; G2: "The launch is the unit of work and the run the unit of attempt") and 'restart the agent, not the run' did the job. G4 09-18/G5: "Workshop is where fixes, bugs, problems, maintence are persisted imidiately upon identification." Ds-010: "An order and everything it spawns in one directory: `work/workshop/<CO-id>-<name>/`". G6: agentic-systems "State and retry: One isolated location per piece of work, holding its progress, decisions and verification. It belongs to the work and goes when the work finishes." (no name, no promotion); proposals (not owner): "only promoted material crosses from a workshop up into the global tiers." G7: "discrete work contained, state recorded, retryable ... promotion when build completes". Not in constitution.md.

10. LAB / DRILLS / EVALS / HILLCLIMB, IMPROVEMENT KEPT APART FROM WORK — PERSISTENT, RENAMED testbench → lab.
 G0 'testbench: Test harnesses'; G1..G3 testbench is the centre of G3; G4 weak (measure rather than ask); G5 "test harness and fixtures with an evaluation suite" and `claude plugin eval`; G6 "centered around a laboratory where testing and improvement can happen isolated from work. It is important to not mix machinery improvements with work."; agentic-systems "Testbenches: Trials, or drills"; G7 "lab (non distributed) for improving the accelerator. drills ... evals". 

11. MANUALS — PERSISTENT; the set of kinds changes.
 G0 "manuals/ is what the crew reads to do its job; library/ is ... written for humans". G1 manuals folder (orchestration, launch, harness). G3 09-17: operator and maintenance manuals. G4 09-20: 'records' renamed 'manuals'. G5: "Operators Manuals (conduct) ... Technical manuals (infrastructure)". G6: "Manuals and a library that improve what an agent can draw on". G7: operator, technical and maintenance manual produced by every workshop.

12. DEV-WORKSPACE RELATION — RETURNED, flipping.
 G0 STRUCTURE: "intended to eventually replace the dev-workspace system". G1: dev-workspace and .claude "never read, never written". G4: "Use dev-workspace commands for branches ... Never raw git for those." G5: orphan-branch idea only. G6: silent in both 10-08 documents. G7: "workspace folders redundant with workshops taking over. git management and branch isolation, retained. commands repurposed."

---

CONCEPT-TRACE 4/7 — IDEA LEDGER (part 2 of 2)

13. A `flight`/`fc` COMMAND-LINE TOOL — RETURNED three times; never settled.
 G0 09-01: blackbox.keep "Placeholder for later CLI 'archive' command." G1 09-04: built, "One fc entry point with a module per command". G2 09-10: "The runner is named flight and is a thin dispatcher over leaves"; 09-11: "a flight command wrapping them is deferred to a later launch, because the first attempt's runner became the system and its tests tested the runner". G3 09-17: "'fc' command surface removed". G4 09-20 M002: a pilot with procedures does "most of what the brittle fc CLI was intended for". G6: "Nice to have: A command-line tool."; session summary: "A custom command-line tool risks repeating the build runner's `fc` CLI ... Skills invoked as slash commands already do that job." G7: '"flight" CLI command stubbed for further investigation'.

14. HUD / WEB VIEW — PERSISTENT AS ALWAYS-DEFERRED.
 G0 radar "visualisation tools ... `panels` and `decks` built later"; G1/G2 out of scope, "a view layer over the files is a later launch"; G4 D006 "End game: a launcher inside a HUD page"; G6 "A local web page for visualisation and for the human's responses." (nice to have); G7 "HUD html page system stubbed implementation for later fitout."

15. PLUGIN PACKAGING — NEW at G5, then PERSISTENT.
 Not stated G0..G4 (G1 only says "only the crew and the workflow scripts are ever copied out"). G5: "Cockpit will be an optional plugin realease under the parent flightcrew plugin." G6: agentic-systems "Packaging as a Claude Code plugin" (nice to have); constitution.md silent. G7: "distributed as a claude code plugin. imports a single "flightdeck" directory".

16. A FIXED STARTER SCAFFOLD — PERSISTENT, but the layout itself changed at every generation.
 G0 STRUCTURE (directories only, `.keep` files, "Individual files are deliberately absent"); G1 four directories; G4 'quarters/missions/logs/base/references' on 09-17, refitted into 'five rooms' on 09-20; G6 principle 8: "nor is the structure open for large-scale rearranging." while the same-day summary says "Everything under `flightdeck/` is an experiment, including its folder layouts; read any existing structure as a record of how the thinking developed, never as a requirement." G7: sections workshops, cockpit, manuals, lab, plus stubs.

17. BUILD INCREMENTALLY, NOT ALL AT ONCE — PERSISTENT (stated every generation, contradicted by what was built).
 G0 "It is acceptable to write something wrong and correct it; it is not acceptable to be incomplete" and "one agent before several, a prompt before a script"; G4/G5 "Always be eager to work and have a go without knowing everything"; G6 principle 5 "Trying to build the perfect implementation first time and all at once" is the first core mistake; agentic-systems "Build one system at a time. Never attempt the whole thing at once." and "Earlier attempts in this repository tried to build the whole thing at once ... and failed."; G7 "stub this component for later development, investigate but don't fully transfer yet".

18. BEST PRACTICES / CITED ANTHROPIC SOURCES AS THE CONTENT — PERSISTENT.
 G0 "Sources – Anthropic, Claude or Bun."; reference-library idea: "shaped by cited practice rather than by whatever a model recalls at the time"; G4 manuals "measured on CLI 2.1.278"; G6 principle 3 "Best practices must always be followed to ensure good results" and library/source/claude-dev-blog and claude-code; G7 "based upon modern agentic engineering and agentic workflow practices". Interpretation: the G6 session summary records a research finding "No report found independent evidence that any agentic feature improves outcomes" next to principle 3, uncommented.

19. TEMPLATED PROMPTS AS THE SYSTEM — PERSISTENT.
 G0 "regular steering inputs need transforming into reusable templates"; G0 library 09-03 "Template every recurring input ... Iterate the templates, not the run."; G1 templates directory; G6 principle 1 "Create some templated prompts with learnings so far and the "system" is born." G7 absent.

20. AGENT DEFINITIONS LIBRARY, TEAM SHAPES AND DISPATCH — PERSISTENT.
 G0 thirteen roles; shape-library "build a shape, record it forever, reuse when ever."; G1 eleven crew files; G3 moved under .claude/agents/flightcrew; G4 crew roster C001..C008; G5 "Rosters are prebuilt purposeful teams, callable repeatedly" and "Dispatches are the residue of an agent team invocation"; G6 agentic-systems "Co-ordination: Team makeup, patterns, and when to do what."; proposals: eight "bodies" (Explorer, Builder, Adversary, Verifier, Judge, Generator, Synthesiser, Lead); G7 "agent definitions across common patterns; team patterns and shapes; dispatch strategies". Role count varies 13, 11, 8.

21. RUN LOG AND FAILURE DIAGNOSIS (three axes: context, verification, tooling) — PERSISTENT G0..G6; absent G7. G0/G1 RUNLOG "Blameless: the question is never who failed but what about the setup allowed it"; G2 FLIGHTLOG; G6 "Audits: Finds machinery upgrades in the record of decisions, retries and signals."

22. A SINGLE USER ON A CLAUDE MAX SUBSCRIPTION — stated G0, G2 ("built for a single Claude Code Max subscription user"), G6 ("run on a Claude Code subscription with existing tooling"); ABSENT from G7. Persistent constraint not in the newest.

23. MISSIONS AND SPARKS, COMMANDER CLOSES MISSIONS, ENACTED APPROVAL, PILOT WRITE CONFINEMENT — G4/G5 only; DROPPED at G6 (Ds-010: "an approval on every decision"; "the pilot's bash ban enforced by conduct"). The name 'missions' meant idea notes in G0 (STRUCTURE "ideas") and epics in G4; renamed meaning.

24. CHECK THE SYSTEM'S OWN FAILURE — "first cockpit never did project work; 16 of 19 dispatches worked on the cockpit itself" — NEW at G6 (analysis, not a design idea). Related G3: "Run 1 ... the first work flightcrew runs on itself" and G2 "beginning with itself". Interpretation: self-building recurs in G2, G3, G4 and is named as the failure in G6.

25. ARCHIVE THE PREVIOUS ATTEMPT AND MINE IT — RETURNED each generation.
 G0 'blackbox: archive'; G3 "a tidied record is not evidence", run record kept whole; G4 founding removed the missions folder; G6 "v1 is a source to mine, not to load." (archive at flightdeck/.cockpit-archive/); G7 "all previous work can be archived, treat work as no longer relevant. minable for fast tracking and possible restoration given good reason."

26. NEW AT G6 ONLY (not in G7): human can always fall back to plain conversation (principle 6, agentic-systems invariant, history summary cedaf5ae "direct conversation always available"); "Nothing starts on its own"; sixteen systems in three loops (work 8, persistence 4, improvement 4); "Authority is not a system"; six properties of independent work ("It knows what done looks like through something it can call itself." "It escalates well." etc.); "return subagents over teammates" (Ds-010: "none needed to be a teammate"); "truth suite" (human statements by topic; Ds-010 calls it "half-settled"). NEW AT G7 ONLY: 'lab (non distributed)', manuals as three kinds per workshop, 'officers are direct session agents', 'harbor evals for inspiration'.

LEDGER TOTALS (Interpretation): present in 7 or 8 of 8 generations — harness-first, HITL independence, lead dispatching, agent library, manuals, lab/testbench, best practices, state as files, fix-the-setup. Appear once — sixteen systems, truth suite, enacted approval, vocatives, sparks, liftoff vs kickoff, nine-section spec, the 'hangar/controltower' naming.

---

CONCEPT-TRACE 5/7 — RENAMES AND METAPHOR SHIFTS (lookup list; first appearance in brackets)

THE HUMAN
- provider (G0 interview conventions, 09-01) = the human answering a spec interview
- user / human (G0 flight-assistant 09-02)
- controltower (README 08-31) = the human-in-the-loop half → hangar (STRUCTURE 09-01 and README variant 09-03) "workspace — main agent loop working directory"
- developer (G1 spec 09-03) = "hand a frozen spec ... and leave the room"
- commander (cockpit.keep 09-17) = the human owner, outranks pilot; address "yes commander"
- owner / "the human" (constitution.md 10-08, agentic-systems 10-08) — no rank
- "HITL developer tool" (CONCEPT.md 10-09)

THE LEAD AGENT
- orchestrator / main orchestrator (G0 09-02 to G3) → pilot, callsign Ace from 09-18 (G4) → captain (G5 ranks.txt and cockpit.constitution) → lead (agentic-systems and CONCEPT.md "lead"; constitution.md uses none; CONCEPT also says "pilot" under cockpit)
- officers (CONCEPT.md) = "direct session agents"; no earlier use of that word

THE UNIT OF WORK
- launch (README variant 09-03; G1 "one run of one spec") → launch plus numbered run (G2 09-10: unit of work vs unit of attempt) → mission (epic) and workshop (small fixes) (G4 09-18) → workshop = "An order and everything it spawns in one directory" (Ds-010) → workshop "discrete work contained" with promotion (CONCEPT)
- spark / incubator = possible missions (G4 and G5); missions in G0 = idea notes ("missions — ideas")
- run: "one unattended execution" (G0 library) = launch folder (G1) = one attempt (G2)

THE RUN-STARTING DOCUMENT
- liftoff prompt (G0 prompts/constitution.md, library tooling) and kickoff (G0 flight-assistant "the kickoff says how to run") — both words in the same period; kickoff.md in G1; liftoff JSON recipe replaces kickoff in G2 (09-10); "kickoffs with 3 workflows" in G3; absent after

THE FOUNDING DOCUMENT
- library constitution (three files, 09-02) → "constitution" as CLAUDE.md fragment (G1 manuals) → cockpit.keep (09-17, "the commander's founding orders for this post") → cockpit.constitution (09-29, 147 lines; commit "the constitution replaces the keep") → constitution.md (10-08, "new founding note") → CONCEPT.md (10-09)

THE IMPROVEMENT PLACE
- testbench (STRUCTURE 09-01, G1..G3) = test harnesses → lab / laboratory (constitution.md principle 7) = drills and evals; "Testbenches: Trials, or drills" (agentic-systems) is a system inside the lab idea

THE AGENT LIBRARY
- crew (flightcrew/crew/crew.json 08-31) = set of roles → crew (G4) = "any other agent: subagents, teammates, other sessions" → roster / dispatch (G5) = prebuilt team / residue of a team run → "bodies" and "stances" (web-chat proposals) → "officers" and "agent definitions across common patterns" (CONCEPT)
- seat = one role in a roster (G4 GLOSSARY)
- dossier has three meanings: a crew role file (G4 quarters), the commander-facing presentation file Ds### (G4/G5), the file that "controls" an agent definition (G5)

DOCUMENTATION
- manuals (G0 "what the crew reads") ≠ library (G0 "written for humans") → G4 'records' renamed 'manuals' on 09-20 (commit 0a69055); 'records' then meant the commander and pilot corpus → G5 operators and technical manuals → CONCEPT operator, technical, maintenance manual; library/source holds captured outside docs (G6)
- stub = a manual without a source (G4 frontmatter `stub: true`)

APPROVAL CHAIN (G4 only, renamed repeatedly): proposal P### → request Rq### → XR; decision D### → De### → XD-###; orders Or### → CO-###; advice CA###.

THE COMMAND LINE: `fc` (G1) → `flight` dispatcher (G2 09-10) → "fc command surface removed" (G3) → "the brittle fc CLI" (G4) → "A command-line tool" (G6) → '"flight" CLI command' (CONCEPT).

THE SAME PRINCIPLE: "The run is disposable; the inputs are the investment" (G0) = "A run that drifts is abandoned, not patched" (G1) = "the commander steers rather than repairs" (G4) = "fix the machinery, not the code" (constitution.md) = "fix the machinery, not the output" (agentic-systems).

METAPHOR SHIFTS (Interpretation): G0..G3 is a factory/industrial vocabulary (run, spec, gate, check, verdict, harness) with a space-port skin (flightcrew, launch, liftoff, hangar, radar, blackbox); G4/G5 changes to a military chain of command (commander, captain, orders, advice, vocatives, dispute); G6 drops both for a systems-engineering vocabulary ('systems', 'loops', 'residue', 'container', 'machinery'); CONCEPT.md returns to aviation words (cockpit, pilot, officers, lab, HUD) with plain-engineering sections (components, plugin, manuals).

---

CONCEPT-TRACE 6/7 — CONTRADICTIONS AND OMISSIONS (CONCEPT.md = newest, 2026-10-09). Quotes verbatim; the 'Reading' lines are interpretation.

CONTRADICTIONS BETWEEN CONCEPT.md AND EARLIER DOCUMENTS
C1. Lead: CONCEPT "Build an acceleration layer on top of claude code ... Using a purpose built "lead" talking to agent teams and other background sessions." vs constitution.md (10-08) principle 1 "the cockpit's purpose can be fulfilled with a decent prompt in a session with a standard claude code model with teams settings on." and principle 6 "Every part of the machinery must be callable in direct natural language". Reading: a built lead is the thing principle 1 says is unnecessary; CONCEPT does not say what the built lead has that a prompt lacks.
C2. Officers and pilot: CONCEPT "cockpit: head and hands philosophy, A pilot dispatching teams of agents. officers are direct session agents" vs Ds-010 (10-07/08) "the ranks and the vocatives ... should not be rebuilt as it was" and agentic-systems "Nice to have: A roleplay system." Reading: the roleplay the 10-08 documents demoted comes back as the cockpit's section.
C3. Manuals on every workshop: CONCEPT "every workshop produces an (or integrates into another): operator manual ... technical manual ... maintenance manual" vs constitution.md principle 8 "doesn't attempt to guess what will be needed in the future" and its note "Nothing makes you file records." Also v1 CLAUDE.md capped manuals with six admission tests and 150 lines because manuals grew.
C4. Recording state: CONCEPT "discrete work contained, state recorded, retryable, team output store" vs constitution.md notes "Nothing makes you file records. The conversation, memory, and transcripts already hold what you say." Reading: agentic-systems.md (same day) keeps "a permanent record" for what happened but not for human input; CONCEPT does not say which.
C5. dev-workspace: CONCEPT "git management and branch isolation, retained. commands repurposed." and "workspace folders redundant with workshops taking over" vs STRUCTURE.md 09-01 "intended to eventually replace the dev-workspace system" and the flightcrew v1 spec "dev/, .claude/ and the dev-workspace skill: never read, never written". The two 10-08 documents say nothing.
C6. flight CLI: CONCEPT '"flight" CLI command stubbed for further investigation and improvement.' vs session summary 10-08 "A custom command-line tool risks repeating the build runner's `fc` CLI, which the first cockpit's records call brittle. Skills invoked as slash commands already do that job." and constitution.md principle 10 "prefers accelerating existing harness toolsets rather than creating toolsets that compete with the harness."
C7. Plugin hierarchy: CONCEPT "imports a single "flightdeck" directory, with accelerator functions inside" vs cockpit.constitution 09-29 "Cockpit will be an optional plugin realease under the parent flightcrew plugin." Reading: the cockpit was a child of flightcrew; flightcrew is not mentioned in CONCEPT.
C8. Scope of archiving: CONCEPT "all previous work can be archived, treat work as no longer relevant." vs constitution.md notes "v1 is a source to mine, not to load" (consistent) and agentic-systems "read any existing structure as a record of how the thinking developed". Minor: CONCEPT dismisses relevance, the 10-08 documents keep it as evidence.
C9. Structure: CONCEPT lists its own section set (workshops, cockpit, manuals, lab, dev-workspace, CLI, HUD, plugin) vs constitution.md principle 8 "nor is the structure open for large-scale rearranging" and agentic-systems' sixteen systems in three loops. Reading: CONCEPT's cut (components) and the 16-system cut are two different decompositions; neither refers to the other.
C10. Within CONCEPT: "Using a purpose built "lead"" and "agent definitions across common patterns" against "prefer claude code harness content over bespoke solutions" (same document).

WHAT CONCEPT.md LEAVES UNSTATED THAT EARLIER DOCUMENTS SPECIFIED
- flightcrew entirely: spec chain, frozen spec, rubrics, kickoff/liftoff, launch and run folders, red/green checks, stop gates (G0..G3; STRUCTURE, design.md, 61-check characterization). Not archived, not kept: unmentioned.
- Falling back to plain chat (constitution.md 1 and 6; agentic-systems invariant "The human can always fall back to direct conversation with a standard model.").
- "Nothing starts on its own. The human keeps control of what their agents do." (agentic-systems invariant).
- The aim of removing human steering (agentic-systems "removes the need for human steering, with the human sitting a level higher"; constitution.md 9). CONCEPT calls Claude Code "a HITL developer tool".
- Fix the machinery, not the code (constitution.md 4, agentic-systems).
- The rule that lab work stays out of work (constitution.md 7 "It is important to not mix machinery improvements with work.").
- The three core mistakes (constitution.md 5): perfect first time, replacement infrastructure, advanced systems no better than basic.
- Independent adversarial checking (G0..G6) and the spec/test chain.
- Failure diagnosis and the run log (three axes), 'audits', promotion of decisions into memory/context, trust that widens over time, escalation (agentic-systems six properties).
- The single-user Claude Max constraint (G0, G2, G6).
- Write confinement, guards and permissions for the lead (cockpit.keep, G2 'guards fail closed').
- The lead's boundary: what it may do itself versus dispatch (G0..G5 never; proposals "look in order to decide, but must dispatch in order to do").
- Where sources live (library/source/claude-dev-blog, claude-code) and who curates best practices (constitution.md 3: "trusted sources like anthropic or curated through experience").
- Who runs a workshop and what 'promotion' promotes into.

WHAT THE 10-08 DOCUMENTS LEAVE UNSTATED THAT CONCEPT.md STATES: workshops by name (agentic-systems has the function, unnamed); manuals per workshop; dev-workspace; the flight CLI as a component; the HUD as a component; a plugin containing a 'flightdeck' directory.

---

CONCEPT-TRACE 7/7 — QUESTIONS FOR THE OWNER (15, ordered by how much of the design turns on the answer; each tied to a ledger entry from message 3/7 or 4/7 and to the quotes in 6/7). Only the owner can answer these.

1. [L4, C1] Is the lead a purpose-built agent (CONCEPT.md "purpose built "lead"") or a plain Claude Code session with good prompts (constitution.md 1 "a decent prompt in a session with a standard claude code model")? If built, what does it have that a prompt does not?
2. [L4] What may the lead do itself? Four generations said it never does the work (orchestrator, pilot with write confinement and a bash ban); constitution.md is silent. What replaced the confinement?
3. [L8, L20, ledger C-omissions] Is flightcrew (spec chain, runner, launch/run) in or out? CONCEPT.md never mentions it, three runs of it (v1, core, characterization) were abandoned or left unmerged, and the branches still hold it. Should it be archived, kept as a component, or rebuilt as workshops?
4. [L26, L2] Is 'the human can always fall back to plain chat' a requirement of the design? It is in both 10-08 documents and absent from CONCEPT.md.
5. [L2] What exactly does the human still decide? Candidate answers in the record: plan, interfaces and final review (09-02); only denies, never decides (Ds-010); only activates the agent (constitution.md 9); keeps control of what starts (agentic-systems). Which one is current?
6. [L6b, C3, C4] Are human inputs and decisions filed as records (G4/G5, proposals) or left in conversation, memory and transcripts (constitution.md notes)? What does 'state recorded' in a workshop contain?
7. [L9] Is a workshop the same thing as a flightcrew 'launch' (the unit of work, runs as attempts), or a different thing? What does 'promotion' move, and into what?
8. [L5, C2] Are ranks, callsigns and vocatives in or out? CONCEPT.md says 'officers' and 'pilot'; Ds-010 says they cost more than they returned.
9. [L16, C9] Which structure is fixed? constitution.md 8 says the scaffold is not open to rearranging; the same-day summary says all layouts are experiments; CONCEPT.md gives a third cut. Which list of parts is the one to build against: CONCEPT sections, the sixteen systems, or the five v1 rooms?
10. [L12, C5] Does dev-workspace get replaced (STRUCTURE.md 09-01), kept for git and branch isolation (CONCEPT.md), or ignored (10-08)? What does 'commands repurposed' mean in practice?
11. [L13, C6] The command-line tool has been built, deferred, removed, replaced and stubbed in turn. What job does it do that a skill or slash command does not? Is it needed at all?
12. [L11, C3] Which manuals, written by whom and read by whom? Eight kinds appear across versions (crew-read, operator, technical, maintenance, and v1 cockpit manuals). Does every workshop have to produce all three?
13. [L7] Independent adversarial review is in seven of eight versions, measured as the one practice with value (Ds-010), and absent from CONCEPT.md. Is that deliberate?
14. [L10] Where does an experiment live and who decides it has worked (lab, drills, evals, hillclimb)? 'Non distributed' lab in CONCEPT.md: what stays in the repo and what ships?
15. [L14, L15, L22] Plugin, HUD and the single-user Max constraint: what is the plugin unit (one 'flightdeck' directory, or cockpit under a flightcrew plugin as in 09-29)? Is the HUD worth building given it has been deferred in every version since 09-01? Is the single-subscription constraint still binding?

End of report (7 messages). Source extractions with full quotes per document: /Users/dylangraham/.claude/jobs/b96ed21c/tmp/parts/ (A-early, B-constitution-research, C-flightcrew-buildout, D-characterization, E-cockpit-v1-early, F-cockpit-late-newest). Per your instruction I did not write concept-trace.md or anything else into the repo. I stay available for follow-ups.
