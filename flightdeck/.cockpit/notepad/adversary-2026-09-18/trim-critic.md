Crew report, T003 trim-critic (Opus), 2026-09-18. Pilot's note: the crew-manifest team-field inconsistency was caught mid-change and is resolved by freezing the manifest at C001 to C011.

# trim-critic — T003

Criterion: efficiency without loss of function. Measured `wc -l -w` on all 34 changed files plus the launch- and arrival-loaded set. Every finding names what is lost; "nothing" means nothing.

**F1** — **`quarters/commander/commander.md` standing orders is an append-only transcript injected into every pilot launch**
**S-H** · **C-H**
**FINDING**: Lines 9-67 are 2150 of the file's 2381 words (~2900 tokens), and `base/bin/pilot.sh:60` concatenates the whole file into `--append-system-prompt` at every launch. The section grows every session by design ("Newest at the bottom"), so launch cost rises monotonically forever. Most of it is not a live rule. Line 20 ("All sessions are mine. Be polite but authoritative") is restated at line 77 in the same file and again at `CLAUDE.md:19`. Line 21 (answers to five questions) is `base/decisions.json` D002 to D006. Line 26 (model and effort) is D007. Line 36 is the parenthetical inside crew rule 2. Line 37 is the parenthetical inside crew rule 6. Line 39 and line 55 both state the work split, which `missions/README.md:9-12` states a third time. Lines 43 and 44 both state that missions are epic, which `M001:10` restates near-verbatim. Line 47 (callsign) is `quarters/pilot/identity.md:7`. Line 61 is a 240-word summary of `commanders-desk/out-advice/DS001.md`, a file that exists. Line 63 is verbatim inside crew rule 2. Line 65 is `M001:61`. Line 67 is `S008:15`.
**CUT**: split the file. `commander.md` keeps Identity, Preferences, Working relationship and only the orders that are still live and stated nowhere else: 89 lines to about 30, 2381 words to about 700. The dated verbatim statements move to `quarters/commander/orders.json` (fields: date, subject, statement, superseded_by), read on demand and never injected. Saves roughly 2200 tokens per launch and stops the growth curve.
**LOST**: nothing at launch. The verbatim record survives in JSON and becomes machine-readable, which is what the plan's topic extractor needs anyway.

**F2** — **The session log is read at every session start and is larger than the records it describes**
**S-H** · **C-H**
**FINDING**: `CLAUDE.md:50` orders "Read the latest log listed in `logs/index.json`". `logs/2026-09-18_dcb75456.md` is 177 lines and 3788 words (~5100 tokens) across 44 entries averaging 84 words. The four prior logs average 983 words, so the cost roughly quadrupled in one session. The narrative duplicates records built to hold it: "## Adversary's first pass", "## Adversary second pass on lineage", "## Adversary's final passes", "## Adversary's fourth self-correction" are four entries covering what `dispatch/cockpit/T002-research.md:21` states in one sentence ("The adversary raised about fifty findings across two passes and withdrew four of its own"). `logs/README.md:5` already says entries are "Facts, not narrative".
**CUT**: cap an entry at what changed on disk plus its pointer, two lines. A team run gets one entry naming the team id, not one entry per teammate return. 177 lines to about 60, 3788 words to about 1100. Saves roughly 3600 tokens at every session start.
**LOST**: the blow-by-blow of a team run, which is the team record's job and is already there.

**F3** — **`logs/crew-manifest.json` and `dispatch/` record the same seats twice**
**S-H** · **C-M**
**FINDING**: 426 lines for 23 dispatches. `purpose` totals 2759 characters, `access` 1940, `verified` 3065. For C012 the manifest says purpose "Anatomy of a launch and a run as it ran on run/flightcrew-characterization-2..." and access "read branches via git plumbing, no checkout; no cockpit; no writes"; `dispatch/cockpit/T001-recon.md:9` says the same thing in its seat line. Every T002 seat carries the identical `access` string "read branches via git plumbing; read the recon folder, the topology file, DS001 advice and records/README.md in the cockpit (commander-authorised); write only to the session scratchpad", five times. Both T003 seats carry the same `access` string twice.
**CUT**: `access` and `delivery` are team-level, not seat-level. Move them to `dispatch.json` as one field per team and drop them from manifest rows that carry a `team` id. That removes about 2900 characters today and scales with every future team. Keep `purpose` in one place only: the team record, since `dispatch/README.md:12` already mandates "reason for the seat, what it reads, what it returns".
**LOST**: nothing for teamed dispatches. Solo subagent rows (C001 to C005) keep both fields, since they have no team record.

**F4** — **`CLAUDE.md` "How to find things" re-indexes every room that has its own README**
**S-M** · **C-H**
**FINDING**: Lines 60-72 are 245 words, and line 72 ends "Each directory has a README that indexes it. Start there." The section is therefore a second copy of nine READMEs, paid by every agent arriving in the cockpit. It is already stale: line 68 places "dossiers (`dossiers/`...)" and the proposal flow under `base/`, but the commander moved them to `commanders-desk/` today, and `base/README.md:7-11` now holds that flow.
**CUT**: replace lines 62-72 with a bare path-to-one-clause list, no flow prose: 13 lines and 245 words to 11 lines and about 80 words. Delete the `base/` flow sentence entirely; `base/README.md` owns it.
**LOST**: nothing. A stale second index is worse than no second index.

**F5** — **`CLAUDE.md` rule 2 restates `records/README.md` and then points at it**
**S-M** · **C-H**
**FINDING**: Rule 2 is 77 words defining both qualifying categories and the rejection list, then closes "Rules in full: `records/README.md`". `records/README.md:9-12` is the same content. The plan's item 1 will rewrite that README into a longer docspec, at which point the summary is a third divergence risk.
**CUT**: rule 2 becomes "**Records are protected.** `records/` is the source of truth across sessions. The way in is promotion from the notepad, never a copy. What qualifies and what does not: `records/README.md`." 77 words to 33.
**LOST**: nothing. Every agent that acts on rule 2 opens the README anyway.

**F6** — **`workshop/workshop.json` spends 72 of its 196 lines on fields that are null in every item**
**S-M** · **C-H**
**FINDING**: `swept_into` is null in 18 of 18 items, `resolved` null in 18 of 18, `file` null in 18 of 18, `status` "open" in 18 of 18. The `fields` block already documents them, so an absent key is unambiguous. Separately, `title` is specified as "one line" but W011 runs four sentences and 46 words, and W017 runs 57 words; both read as the note the `file` field exists to hold.
**CUT**: omit null-valued keys and let the schema block define the default. 196 lines to about 130. Trim the two oversized titles to one clause each with the detail in the cited source they already name.
**LOST**: nothing. JSON absence and explicit null are the same read.

**F7** — **Three crew dossiers and a todo file carry no information**
**S-M** · **C-H**
**FINDING**: `quarters/crew/worker.md`, `reviewer.md` and `adversary.md` are 12 lines each and identical in shape: agent type, "Purpose: see `crew.json`", "Not yet established. Fill in after first dispatch.", "None yet." Every fact in them is already in `crew.json`. `quarters/crew/README.md:9` states the convention that makes them unnecessary: "A dossier without a `## Observed` section has not yet been used on a mission." `quarters/crew/todo.txt` is a single sentence asking for a rename, which is a workshop item, not a room file.
**CUT**: delete the three stubs, set `"dossier": null` in `crew.json` for those roles, and move the todo line into `workshop.json` as W019. Four files and 37 lines removed.
**LOST**: nothing. The dossier is written at first dispatch, which is when there is something to write.

**F8** — **S006 and S007 are marked folded into S009 but still carry their full text**
**S-M** · **C-M**
**FINDING**: `incubator.json` gives both `"heat": "folded into S009"`, yet `S006-teams-from-dispatch-records.md` is 33 lines and `S007-commander-decision-mining.md` is 31, and `S009-self-sustaining-cockpit.md:12-13` restates both in two lines. S006's "What exists" and "What is unknown" sections describe `crew-manifest.json`, `quarters/crew/` and the dispatch room, all of which now exist and are documented in their own READMEs, so the spark describes the present as if it were unknown.
**CUT**: move the two commander quotes (S006:8, S007:8) into S009 under "What converges here", delete both files, leave the `incubator.json` rows pointing at S009. 64 lines to 2.
**LOST**: the pilot's guesses at what a team record might look like, written before `dispatch/` existed and answered by it.

**F9** — **`identity.md` and `job.md` overlap each other, `CLAUDE.md`, and `commander.md`, and all three are injected at launch**
**S-M** · **C-M**
**FINDING**: The two files total 428 words, joined into the launch prompt alongside `commander.md`. `job.md:5-7` "Chain of command" restates `CLAUDE.md:13-15` "Who is here". `job.md:12` "Start fresh when told" is `commander.md:14`, D001, and `commander.md:84`. `job.md:14-16` is three lines saying the rules are in CLAUDE.md, which the pilot reads on arrival regardless. `identity.md:15` "Why the seat exists" is `commander.md:51`. `identity.md:21` "Direct prose" is `commander.md:73`. `identity.md:25-28` "Open questions about the seat" is scratch by the cockpit's own rule 3 and belongs in the notepad or the workshop.
**CUT**: fold `job.md` into `identity.md` as a four-line "Chain of command and standing orders" section, drop the pointer section and the open questions. 44 lines across two files to about 20 in one. `pilot.sh` concatenates one fewer file.
**LOST**: nothing that the pilot does not read in `CLAUDE.md` within the same turn.

**F10** — **`logs/branch-manifest.json` stores git state that one command regenerates**
**S-M** · **C-M**
**FINDING**: 184 lines. Per branch it stores `tip`, `remote` with an ahead/behind count, and `contained_in`, all of which `git for-each-ref` and `git branch --contains` produce on demand and all of which are stale the moment anyone commits. The file admits it: `"measured": "2026-09-18 by git plumbing from cockpit; remote figures true at that time"`. The `cockpit` entry even carries `"tip": ""`.
**CUT**: keep only what git cannot answer, which is `role`, `status`, `note` and `merged_higher`, plus the `rule` line. Drop `tip`, `remote` and `contained_in`. About 184 lines to about 110, and the file stops being wrong between measurements.
**LOST**: an offline snapshot of counts that are already documented as time-limited. The topology narrative is in the lineage record.

**F11** — **Every log heading repeats the mission id**
**S-L** · **C-H**
**FINDING**: All 44 headings in `2026-09-18_dcb75456.md` end "— M001", and all entries in all four logs are M001. `logs/README.md:5` mandates the suffix.
**CUT**: put the mission id in the file header once and suffix a heading only when the entry's mission differs from it.
**LOST**: nothing while one mission is current; the exception rule covers the day two run at once.

**F12** — **Five READMEs each carry a near-identical "file shape" template**
**S-L** · **C-M**
**FINDING**: `base/README.md:19-26` proposal shape, `commanders-desk/in-dossiers/README.md:7-12` dossier shape, `missions/README.md:18-27` mission shape, `missions/incubator/README.md:7-13` spark shape, `dispatch/README.md:9-15` team record shape. Together 39 lines describing documents that exist on disk as worked examples.
**CUT**: keep the shape list only where the section names are not self-evident from the newest file in the room, which is the mission shape and the team record shape. Drop the other three and point at the newest file: "Shape: follow `DS002-research-records.md`." Saves about 20 lines of README read on every visit to those rooms.
**LOST**: guidance for the first file in an empty room, and those rooms are no longer empty.

**F13** — **`crew-manifest.json` carries a `team` field its own schema does not define, and it disagrees with `dispatch.json`**
**S-L** · **C-H**
**FINDING**: The `fields` block lists 15 keys and does not include `team`, yet C017 carries `"team": "T004"` and C012 carries `"team": "T005"`, while `dispatch.json` records the research team as T002 and the recon team as T001. C009's keys are also emitted in a different order from every other row.
**CUT**: add `team` to the `fields` block in one line and reconcile the two ids. One line added, a cross-file contradiction removed.
**LOST**: nothing. This is a cheap fix, not a trim, but it will cost a reader more than it costs to correct.

## The plan under review

**F14** — **`logs/maintenance.json` duplicates the workshop.**
**S-M** · **C-H** Plan item 2 opens a new JSON store for "recurring upkeep the pilot's teammates owe: library genesis documents, terms page, topics, records", four items. `missions/README.md:9` defines the workshop as "little fixes, problems to fix, maintenance. Work done when not out completing epic missions", and W013 and W014 are already sitting in `workshop.json` as exactly these maintenance items. Cut: add `"recurring": true` to workshop items and filter. One field instead of a file, a schema block and a README. Lost: nothing.

**F15** — **The topic store becomes the third store of the commander's statements.**
**S-M** · **C-M** Plan item 2 files statements with "reference, the verbatim statement, and a brief lead-up context line". `quarters/commander/commander.md` standing orders holds those verbatim statements now, and `base/decisions.json` holds subject, decision, date and by. Three stores of one thing is the bulk problem the plan exists to solve. Cut: the topic store replaces the standing-orders list (see F1) and absorbs `decisions.json` as a topic whose statements are rulings. `logs/` is also the wrong room for it, since `logs/README.md:3` defines the room as one file per session; a topic is the opposite of per-session. Lost: nothing, provided the migration happens in the same pass rather than beside the old stores.

**F16** — **Six seats where the team's own lesson names five.**
**S-M** · **C-M** Plan item 3 seats a transcript miner, topic extractor, record writer, discovery, comparer and validator, four of which verify. `dispatch/cockpit/T002-research.md:25` records the certified shape as "reader seats, a writer that re-verifies rather than carries, an Opus adversary under the library's own mandate, a docs verifier that reads raw pages, and the pilot ruling. Reuse it as-is." Comparing a draft against existing records for "inconsistencies and divergence from style and convention" is the adversarial mandate run with the docspec as its criteria, and `T001` measured the hidden cost of extra seats ("Explore subagents cost around 100k tokens each"). Cut: comparer merges into the adversary seat, discovery merges into the reader seats that are already reading the terrain. Six Opus seats to four plus a docs verifier. Lost: nothing the mandate does not already cover.

**F17** — **The record docspec risks becoming the thing it forbids.**
**S-M** · **C-M** Plan item 1 lists twelve properties plus a rejection list plus two named styles, written into `records/README.md`, which is read on every visit to the room and by every record-writing crew. The commander's own statement of the target is one sentence (`out-advice/DS002.md:28`): "sharp and to the point, because an agent needs to injest quickly and get maximum value from their read." Cut: state the criteria as six one-line tests a writer can fail, and show the two styles by naming `records/claude-code/agent-teams.md` as the exemplar instead of describing a style in prose. Then apply F5 so `CLAUDE.md` does not carry a third copy. Lost: nothing; a rule a writer cannot check is not enforcing anything.

## The three cuts that save the most per session, at zero functional cost

1. **F1**, split `commander.md`: about 2200 tokens off every pilot launch, and it stops a cost that otherwise grows every session forever.
2. **F2**, cap log entries at what changed: about 3600 tokens off every session start, with the narrative preserved where it belongs in the team record.
3. **F4 plus F5**, stop `CLAUDE.md` re-indexing the rooms and re-stating the records rule: about 230 words off every arrival, paid by the pilot and by every crew member admitted to the cockpit, and it removes a stale pointer to `base/dossiers/` at the same time.

## Verdict on the plan

The plan is sound in direction and duplicative in construction. Its diagnosis is right: the commander's statements are scattered and no rule defines a good record, and items 1 and 2 aim at both. But every structure it opens sits beside an existing one rather than replacing it. The topic store joins two stores of the commander's words instead of absorbing them, `maintenance.json` joins the workshop instead of using a field in it, and item 4's "rewrite `dispatch/` team records and `logs/crew-manifest.json` entries as each team runs" writes each team twice by design. The seat count in item 3 also ignores the lesson its own predecessor team wrote down one entry earlier. Execute it with three amendments and it costs nothing extra: the topic store subsumes the standing-orders list and `decisions.json` and lives outside `logs/`, maintenance is a boolean on a workshop item, and the manifest keeps only what a team record does not already hold. The docspec in item 1 should be tested against itself before it lands, since a twelve-clause specification for token efficiency read on every visit to the room is the defect it was written to prevent.
