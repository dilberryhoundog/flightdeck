Crew report, T003 fit-critic (Opus), 2026-09-18. Pilot's note: F13 (renamed team files) was caught mid-change and is already reverted; ids never renumber. F4, F5 and the stale pointers are accepted and fixed in this session.

# fit-critic — T003

Criterion: fit. Does each file, room, structure or plan item serve the cockpit's stated purpose and sit consistently with the corpus. Findings sorted by severity, then confidence. The commander's `commanders-desk/` move is treated as corpus.

**F1** — **The plan's research team writes inside the cockpit, which rule 1 and the guard forbid**
**S-H** · **C-H**
**FINDING**: Plan item 3 dispatches "a strengthened research team: transcript miner, topic extractor, record writer, discovery, comparer, validator ... to produce the first topics and from them the first three records". Topics land in `logs/flightdeck-topics/` and records in `records/`, both inside the cockpit. CLAUDE.md rule 1: "**Only the pilot writes here, and the pilot writes nowhere else.** ... A PreToolUse guard (`base/bin/cockpit-guard.py`) ... enforces this". CLAUDE.md line 15: crew "are admitted here only when the commander authorises it for a task, and then to read, never to write." The plan names no filing path, so on execution either the crew are blocked by the guard, or the pilot does the writing and the transcript reading itself, which offends `quarters/pilot/identity.md` ("Dispatch and verify; do not gather. Cheap crew do the reading") and the commander's DS001 ruling "You actually don't do any work". The research team (indexed T002, being renumbered T004 as I write) solved this by having crew write to the scratchpad and the pilot file; the plan drops that convention instead of naming it.
**EVIDENCE**: plan item 3 quoted above; CLAUDE.md:23 and :15; `commanders-desk/out-advice/DS001.md` P005 section.

**F2** — **The record docspec becomes a second, contradicting statement of a rule CLAUDE.md already states**
**S-H** · **C-H**
**FINDING**: Plan item 1 rewrites `records/README.md` into a docspec carrying "one thing", "current form only", "timeless (a two-years-time test)", a supersession rule, a rejection list and two approved styles. CLAUDE.md rule 2 states the qualifying test itself: "Only two things qualify: official documentation findings that name their `Source:` URLs and research date, and codebase findings researched by a specialist ... Rules in full: `records/README.md`." None of the DS002 criteria (timeless, one claim, register style) appear in rule 2, and the plan does not touch CLAUDE.md. After execution the arrival document and the room index give different tests for the same gate, which is a rule stated in two places that has already diverged. `notepad/README.md` states a third fragment of the same pathway.
**EVIDENCE**: plan item 1; CLAUDE.md:24; `records/README.md` lines 5-12; `notepad/README.md`:3.

**F3** — **The topic store is a third home for the commander's verbatim statements**
**S-H** · **C-M**
**FINDING**: Plan item 2 opens `logs/flightdeck-topics/` holding "the verbatim statement" with "reference (session:line or advice file)" and lead-up context. Two rooms already hold this. `quarters/commander/commander.md` opens "Recorded verbatim or near-verbatim from the commander. Newest at the bottom" and carries roughly forty dated orders. `base/decisions.json` carries D001-D019, the commander's rulings with quotations. The plan states no precedence and no rule for which store a new statement enters, so the same order will be filed two or three times and drift. This is the duplication between rooms that CLAUDE.md rule 9 guards against: "Refine structures rather than pile onto them."
**EVIDENCE**: plan item 2; `quarters/commander/commander.md`:9; `base/decisions.json` D016-D019; CLAUDE.md:31.

**F4** — **Five index entries point at files that no longer exist**
**S-M** · **C-H**
**FINDING**: `base/proposals.json` P004, P005, P006 and P007 each carry `"note": "see decisions.json and notepad/commanders-advice/DS001.md"`. That directory was removed in the desk move; the file is `commanders-desk/out-advice/DS001.md`. `base/decisions.json`:129 (D016) reads "Manifest of every branch and its state in notepad/branch-manifest-2026-09-18.md", which the pilot deleted this session in favour of `logs/branch-manifest.json`. The log claims "fourteen stale paths repointed"; these five survived. CLAUDE.md rule 10: "the mission manifest, logs, crew manifest and dossiers are updated as work happens, not afterwards."
**EVIDENCE**: `base/proposals.json`:44,55,66,77; `base/decisions.json`:129; `ls notepad/commanders-advice` and `ls notepad/branch-manifest-2026-09-18.md` both return no such file.

**F5** — **CLAUDE.md maps a room that was deleted and never names the room that replaced it**
**S-M** · **C-H**
**FINDING**: CLAUDE.md:68 still reads "`base/` — dossiers (`dossiers/`, recon distilled for the commander's desk), proposals awaiting the commander (`proposals.json`) ...". `base/` now contains only `base.keep`, `bin`, `decisions.json`, `proposals.json`, `README.md`, `settings`. "How to find things" has no entry for `commanders-desk/` at all, though it is the room the pilot and commander exchange through and rule 3 of Session start already points into it. A pilot arriving next session is sent to a directory that does not exist and is never told the desk exists.
**EVIDENCE**: CLAUDE.md:68 against `ls base`; CLAUDE.md:60-71 contains no `commanders-desk` entry; CLAUDE.md:51 does reference `commanders-desk/out-advice/`.

**F6** — **Rule 9's index in every directory is not held in the rooms opened today**
**S-M** · **C-H**
**FINDING**: CLAUDE.md rule 9: "an index in every directory" and line 72 "Each directory has a README that indexes it. Start there." Opened or filled today without one: `dispatch/cockpit/`, `notepad/research-2026-09-18/`, `notepad/research-2026-09-18/source/`, `notepad/recon-2026-09-18/raw/`. `notepad/README.md` lists seven entries and names neither `recon-2026-09-18/` nor `research-2026-09-18/`, the two largest folders in the room. `logs/README.md` describes `index.json` and `crew-manifest.json` and never mentions `branch-manifest.json`, which the pilot added to that room today.
**EVIDENCE**: CLAUDE.md:31 and :72; `notepad/README.md`:5-11; `logs/README.md`:3-11 against `ls logs`.

**F7** — **`quarters/crew/todo.txt` fits no rule of the place**
**S-M** · **C-H**
**FINDING**: The whole file: "This file should be called the `team` to separate it from the `crew` that runs flightcrew runs. the json file also needs to be renamed." It is a `.txt` in a room whose keep says "Keep a dossier on each crew member", against rule 9 "JSON for manifests and state, markdown for prose". It names no author, no date and no id, so a later pilot cannot tell whether this is the commander's order or the pilot's note. By the workshop's own definition it is a workshop item: "little fixes, problems to fix, maintenance work" indexed as `W###`. `quarters/crew/README.md` indexes `crew.json` and `spec-builder.md` and not this file.
**EVIDENCE**: `quarters/crew/todo.txt` quoted in full; `quarters/crew/crew.keep`; CLAUDE.md:31; `workshop/README.md`:3.

**F8** — **`dispatch/` and `crew-manifest.json` record the same dispatch twice**
**S-M** · **C-M**
**FINDING**: The commander's order was "Rather than recording teammate by teammate, we should record our teams, with agents inside." `dispatch/README.md` keeps both: "`logs/crew-manifest.json` still records every individual dispatch; a team record points at its manifest ids." So each seat's type, model and purpose is written in `dispatch/cockpit/T00X-*.md` under Seats and again in `crew-manifest.json` under C0XX, with `dispatch.json` carrying a third copy of the manifest ids. Two of the three must be kept current by hand under rule 10, and rule 9 says refine rather than pile on.
**EVIDENCE**: `quarters/commander/commander.md`, dispatch entry, 2026-09-18; `dispatch/README.md`:5; `dispatch/cockpit/T005-mini-adversary.md` Seats section against `dispatch.json` T003.

**F9** — **The incubator's `heat` field is being used as a status field, and the index disagrees with the file**
**S-L** · **C-H**
**FINDING**: `missions/incubator/README.md` fixes the domain: "Header: id, title, raised by, raised on, heat (cold, warm, hot)." `incubator.json` carries `"heat": "ran"` for S003 and `"heat": "folded into S009"` for S006 and S007. S006's own file header reads "**Heat:** hot", so the index and the file contradict each other after today's fold. The pilot's own `W001` already records this defect for the value "cool" and it has since spread to three more entries.
**EVIDENCE**: `missions/incubator/incubator.json` S003, S006, S007; `missions/incubator/S006-teams-from-dispatch-records.md`:4; `missions/incubator/README.md` spark shape; `workshop/workshop.json` W001.

**F10** — **`logs/maintenance.json` puts recurring upkeep in a second room**
**S-L** · **C-H**
**FINDING**: Plan item 2 adds "`logs/maintenance.json` listing recurring upkeep the pilot's teammates owe: library genesis documents, terms page, topics, records." `workshop/README.md` already claims that ground: "Little fixes, problems to fix, maintenance work: what gets done when not out completing epic missions." The two workshop items raised today for exactly this upkeep, W013 and W014, each end "add it to `logs/maintenance.json`", so a single maintenance duty is tracked in two indexes at once, in a room whose README defines it as one file per session.
**EVIDENCE**: plan item 2; `workshop/README.md`:3; `workshop/workshop.json` W013 and W014; `logs/README.md`:3.

**F11** — **Session and tooling context in durable mission and room files**
**S-L** · **C-M**
**FINDING**: `missions/M001-cockpit-setup.md` closes its battle scars with "`dev-workspace new` refuses a dirty tree. To carry uncommitted files onto a new branch: `git stash push`, `dev-workspace new <name>`, `git stash pop --index`." That is a repo tooling recipe, not a loss or mistake of M001, and `missions/README.md` defines the section as "the losses and mistakes". It will outlive the mission in `completed/` where nobody looks for git procedure. Related: `missions/incubator/README.md` says a matured spark "moves to `matured/`", and no `matured/` directory exists.
**EVIDENCE**: `missions/M001-cockpit-setup.md`, last line; `missions/README.md` mission file shape, item 7; `missions/incubator/README.md`:3 against `ls missions/incubator`.

**F12** — **A refiled draft carries a relative path from the room it was never in**
**S-L** · **C-M**
**FINDING**: `notepad/research-2026-09-18/source/harness-facts.md` reads "They are held in `../../notepad/recon-2026-09-18/`". From that file's directory `../../` is `notepad/`, so the path resolves to `notepad/notepad/recon-2026-09-18/`. The path was written for the records room and not re-based when the drafts moved to the notepad today.
**EVIDENCE**: `notepad/research-2026-09-18/source/harness-facts.md`, observations paragraph; the file's own location.

**F13** — **The team ids are being renumbered under a live index, and nothing in the corpus permits it**
**S-M** · **C-H**
**FINDING**: While this review ran, `dispatch/cockpit/` changed from `T001-recon.md`, `T002-research.md`, `T003-mini-adversary.md` to `T003-recon.md`, `T004-research.md`, `T005-mini-adversary.md`, and `missions/M001-cockpit-setup.md` now reads "recon team T003 (phase 3)" and "research team T004". `dispatch/dispatch.json` still indexes `cockpit/T001-recon.md`, `cockpit/T002-research.md` and `cockpit/T003-mini-adversary.md`, so all three index entries currently point at files that do not exist. Every other reference in the cockpit still carries the old ids: `workshop.json` W016 says "T002 doctrine source", `notepad/research-2026-09-18/source/*.md` headers say "Researched by: T002" and "the T001 recon report", and this session's log names T001 and T002 throughout. The corpus states the opposite convention for the only id series it rules on: `missions/README.md`, "Mission ids are sequential and never reused." A renumbering that has to chase ids already written into a log, a workshop item and five source documents is a structure that will not survive a second session.
**EVIDENCE**: `ls dispatch/cockpit` against `dispatch/dispatch.json` teams[].file; `missions/M001-cockpit-setup.md`:71-72; `workshop/workshop.json`:169; `notepad/research-2026-09-18/source/launch-and-run.md`:7; `missions/README.md`, last line of the work-split section.

## The three to fix first

1. **F1.** The plan cannot execute as written. Name the filing path before the team is dispatched: crew write to the scratchpad, the pilot files into the cockpit, as T002 did.
2. **F2.** Decide where the record rule lives. One statement, one room, with the other two pointing at it.
3. **F5 with F4 and F13.** The arrival map sends the next pilot to a deleted directory and hides the commander's desk; the dispatch index now points at three renamed files. These are the pointers a fresh session follows first.

## Verdict on the plan

The plan fits the cockpit's purpose in substance and does not fit it in mechanism. Every item answers something the commander asked for in DS002, and items 1 and 3 are the direct route to the records the cockpit exists to hold. What it does not do is say who writes, where the new rules live relative to the rules already written, and which of the three stores of the commander's words is now authoritative. Executed as written it produces a sixth room of commander statements, a second record rule, and a team whose output the guard will refuse. Item 4 is not a plan item at all: "Rewrite `dispatch/` team records and `logs/crew-manifest.json` entries as each team runs" restates rule 10, which is already binding, and pairs it with keeping the workshop current, which is a separate duty. Fix the three above and the plan is ready; the rest of the findings are repairs to today's work that the plan will otherwise build on top of.
