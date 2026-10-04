# fit-critic — T008

Crew report, T008 fit-critic (Opus), 2026-09-18, mission M001. Angle: fit with the cockpit's purpose and corpus, against O041.

**F1** — **The same seat facts are written in four places, and rule 9 forbids exactly that**
**S-H** · **C-H**
**FINDING**: `agent_type` and `model` for a single seat appear in `dispatch/cockpit.json` seats, in `dispatch/rosters.json` seats, in `quarters/crew/crew.json` rows and in the dossier header. `dossier` path appears in three of them. Teams flown appears in `crew.json` `teams`, in the dossier header line, in `rosters.json` `flown` and implicitly in every `cockpit.json` entry. CLAUDE.md rule 9: "Refine structures rather than pile onto them." Rule 10 puts `dispatch/cockpit.json` and dossiers under a currency duty, so every future dispatch requires four hand edits of one fact. T003's trim-critic already named "seats recorded twice" as one of the three recurring costs of the room, and the cure was to stop recording a seat twice; the rebuild raised it to four.
**EVIDENCE**: `runs-recon` carries `"agent_type": "general-purpose", "model": "opus", "dossier": "team/runs-recon.md"` in `dispatch/cockpit.json` T001 seats, the identical three fields in `dispatch/rosters.json` roster `recon`, again in `quarters/crew/crew.json`, and again as "**Agent type:** `general-purpose` · **Model:** Opus · **Crew room:** team · **Teams:** T001" in `quarters/crew/team/runs-recon.md`. Concrete case: a model change for one seat needs four edits, and any one missed leaves the room self-contradicting under rule 10.

**F2** — **The two structures O041 ordered are the two the rules do not require to be kept current**
**S-H** · **C-M**
**FINDING**: O041 asks for "crew.json is the manifest for any teammate across any crew" and "team rosters prebuilt and named... stored in dispatch, so they can be dispatched repeatedly". CLAUDE.md rule 10 names "The mission manifest, logs, `dispatch/cockpit.json`, and dossiers" and names neither `crew.json` nor `rosters.json`. Rule 7 mandates the `dispatch/<room>.json` entry and a dossier per seat and mentions neither file. A future pilot reading only the rules dispatches a team, writes the entry and the dossier, and leaves the manifest and the rosters stale, which is the one failure that makes both structures worthless.
**EVIDENCE**: `CLAUDE.md`:32 and :45 against `quarters/commander/orders.json` O041. Concrete case: the next team flies a new seat; `crew.json` has 25 rows and no 26th, and nothing in the rules was broken.

**F3** — **The spec-builder dossier cites two turn-opener lines, not the commander's sentences, and the corpus proves it**
**S-H** · **C-H**
**FINDING**: `quarters/crew/flightcrew/spec-builder.md` sources the altitude test to `9b679556:7003` and the interface definition to `9b679556:7043`. Both lines are the `[USER]    💭: none` turn header. The sentences sit on 7004 and 7044, which is where the verified topic store cites them. This is the same defect T006 recorded and fixed ("two turn-opener line numbers in a ruling" in the T006 outcome); it survives uncorrected in the file the commander ordered the material into, so the only copy a pilot will read is the wrong one.
**EVIDENCE**: `git show flightcrew-core:dev/workspace/history/9b679556_flightcrew-core-spec-v1-rewrite-interview.txt` line 7003 is `[USER]    💭: none` and 7004 is "I went searching because I couldn't SEE my project in the spec..."; line 7043 is `[USER]    💭: none` and 7044 is "An interface is a common language or location, a town square." `logs/topics/altitude.json` cites `9b679556:7004`; `logs/topics/interfaces.json` cites `9b679556:7044`.

**F4** — **Both manifests declare a status enum and both break it**
**S-M** · **C-H**
**FINDING**: `crew.json` `fields.status` declares "active | superseded | retired". Five of 25 rows carry free prose instead. `cockpit.json` `fields.status` declares "running | reported | finished" and T006 carries a sixth value. Rule 9 orders "JSON for manifests and state"; a declared enum that the file itself violates cannot be filtered or counted, which is the only reason to declare one.
**EVIDENCE**: `crew.json`: `"active (not yet dispatched from the cockpit)"`, `"superseded by record-writer"`, `"retired into fit-critic"`, `"retired into docs-verifier"`, `"retired into adversary"`. `cockpit.json` T006: `"status": "reported, alive for the commander's review"`.

**F5** — **`crew.json` `teams` holds dispatch ids, not team ids, and omits a flight it records elsewhere**
**S-M** · **C-H**
**FINDING**: The field is defined as "team ids flown". `harness-guide` carries `["C001","C003","C004"]`, which are rows in the frozen `logs/crew-manifest.json` recording single crew dispatches, not teams. `explorer` carries `[]` while its own dossier records a dispatch on 2026-09-17, filed as C002 in the same frozen manifest. So the manifest mixes two id series in one field and under-records one seat by the rule it applies to another.
**EVIDENCE**: `crew.json` `harness-guide.teams` against `logs/crew-manifest.json` C001 "Research agent teams, session messaging, fork agents...", C003 "Research the --settings flag...", C004 "Second, in-depth pass on agent teams docs."; C002 "Survey flightcrew, launch, testbench..." against `quarters/crew/flightcrew/explorer.md` Observed.

**F6** — **The map points at `dispatch/flightcrew.json`, which does not exist**
**S-M** · **C-H**
**FINDING**: CLAUDE.md's "How to find things" is what an arriving pilot reads to locate the room. It names two files in dispatch as if both are there. `ls dispatch/` returns `cockpit.json`, `rosters.json`, `README.md`. The README states the file is "reserved"; the map does not.
**EVIDENCE**: `CLAUDE.md`:66 "the pilot's teams as JSON per room (`cockpit.json`, `flightcrew.json`)" against the directory listing.

**F7** — **The crew README declares a dossier shape that three of its own files do not use**
**S-M** · **C-H**
**FINDING**: `quarters/crew/README.md` states the shape as "header (agent type, model, room, teams flown); purpose; brief essentials (scope, boundary, report); how it performed; corrections it needed; next time" and states that flightcrew dossiers "carry a `## What to watch for` section". `flightcrew/explorer.md`, `flightcrew/spec-builder.md` and `general/harness-guide.md` use an older shape with no model, no room, no teams line, and sections "How to dispatch / Observed / Improvements". `explorer.md` has no "What to watch for" at all. Rule 9 wants one structure refined, not two running side by side in one room.
**EVIDENCE**: the three files against `quarters/crew/README.md` paragraph "Dossier shape:"; `explorer.md` section list.

**F8** — **The dossiers record how a seat performed; they do not say how to dispatch it**
**S-M** · **C-M**
**FINDING**: O041's stated want is a dossier "so it can be repeated, replicated or improved", and `rosters.json` `purpose` promises "the brief for each seat lives in its dossier". What the 20 team dossiers hold under "Brief essentials" is a past-tense compression of one brief, not a brief a pilot can dispatch from. The two files that do carry dispatchable instructions are the two the rebuild left on the old shape. A pilot flying the `recon` roster tomorrow gets seat names and models from the roster and, from the dossier, a paragraph about what happened last time.
**EVIDENCE**: `team/lineage-historian.md` Brief essentials: "Scope: all branches' commits, plans, history summaries, launch reviews and returns. Boundary as runs-recon." against `flightcrew/explorer.md` How to dispatch: "Give an ordered list of areas to cover, a breadth setting..., a do-not-read list..., the report format, and a length cap." The second can be executed; the first refers to another file for its boundary and to a run that is over for its scope.

**F9** — **The spec-builder dossier is a second home for the commander's verbatim words**
**S-M** · **C-M**
**FINDING**: `logs/topics/README.md` states "This is the one home for the commander's words in the cockpit" and names the only two exceptions, `orders.json` and `decisions.json`, both of which point back. The dossier now carries three verbatim commander quotes with refs on topics that already hold them. T003's fit-critic raised "a third home for the commander's words" as a high finding and the plan was reshaped on it. DS002 ordered the altitude material into this file, so the section belongs; carrying the quotes and their refs rather than the instruction plus a pointer is what breaks the corpus.
**EVIDENCE**: `flightcrew/spec-builder.md` "What to watch for" against `logs/topics/altitude.json`, `interfaces.json`, `constraints.json`, which hold the same statements; `logs/topics/README.md`:3.

**F10** — **`base/decisions.json` still records the old dispatch layout as live with no supersession**
**S-M** · **C-M**
**FINDING**: The decision text states "dispatch records teams under dispatch/cockpit/, dispatch/flightcrew/ and so on". That layout is gone, replaced by O041. The neighbouring D-entry at :76 shows the file's own convention for this: a `superseded_by` line naming the commander and date. `decisions.json` is a live cockpit file, not logs and not notepad, and the map sends the pilot to it for decisions.
**EVIDENCE**: `base/decisions.json`:114 against `orders.json` O041 and `base/decisions.json`:76.

**F11** — **Every team flown became a roster, which empties the word the order used**
**S-M** · **C-M**
**FINDING**: O041 asks for rosters "prebuilt and named from favourite setups... so they can be dispatched repeatedly". Four team shapes have flown and four rosters exist, each with `flown` naming exactly one team. A roster selected by "we ran it once" is a copy of a team entry under a new name, and `certified-research` is marked superseded in its own shape line, so one of the four is a favourite the pilot has already decided not to fly. Each roster's `purpose` and `shape` restate the source team entry's `purpose` and `shape` in different words, giving rule 10 a second text to keep true.
**EVIDENCE**: `rosters.json` roster `mini-adversary` shape "independent, parallel, no cross-talk; warn that the ground may move" against `cockpit.json` T003 shape "two independent angles in parallel, no cross-talk by design; each re-read after the room changed under it"; roster `certified-research` shape ends "Superseded for records work by topics-and-records".

**F12** — **Session context in a durable entry**
**S-L** · **C-H**
**FINDING**: T008's `purpose` ends "before the pilot logs off". The entry is read by a future pilot who has no session to log off from, and the field is the team's purpose, which the phrase does not describe.
**EVIDENCE**: `dispatch/cockpit.json` T008 `"purpose": "Mini-adversary pass on the teams integration: dispatch as JSON per room, rosters, crew rooms and 26 dossiers, before the pilot logs off"`.

**F13** — **Three new directories, no index in any of them**
**S-L** · **C-M**
**FINDING**: Rule 9 orders "an index in every directory" and CLAUDE.md:72 repeats it as "Each directory has a README that indexes it. Start there." `quarters/crew/flightcrew/`, `team/` and `general/` were opened with 25 files between them and none holds a README. The parent README names the three rooms but indexes no file in them. `crew.json` arguably serves, but it sits a directory above and the rule is stated per directory.
**EVIDENCE**: `ls quarters/crew/*/` against `CLAUDE.md`:31 and :72.

**F14** — **The founding note asks for something the rebuilt room has nowhere to put**
**S-L** · **C-M**
**FINDING**: `quarters/crew/crew.keep` ends "Suggest new roles if overtime a gap begins to form." Rule 8 makes the keep file the commander's founding note for the room. Neither `crew.json` nor the README has a field, section or file for a proposed role, so a gap the pilot notices has no home in the room that was ordered to hold it and falls back to the workshop or a proposal.
**EVIDENCE**: `crew.keep` line 2 against the `crew.json` `fields` block and `quarters/crew/README.md`.

Parts checked that drew no finding: every agent flown in session dcb75456 has a row and a dossier, so O041's "fill a dossier for every agent used this session" is met; ids are assigned once and the two retrospective entries say so in their outcome, matching the README's rule; the retired and superseded seats carry consistent reasons in both stores; `logs/crew-manifest.json` is described as frozen in all three places that mention it; no live file outside `logs/` and `notepad/` points at `dispatch/cockpit/` or `dispatch.json` as current; the room split flightcrew/team/general matches DS001's "converge on various crew departments" and leaves room for more.

Three fixes first: correct `9b679556:7003` to `:7004` and `:7043` to `:7044` in the spec-builder dossier, then cut the quotes to a pointer at the topic (F3, F9). Make `cockpit.json` the only place a seat's `agent_type` and `model` are written, leave `rosters.json` and `crew.json` holding the seat name and its dossier path, and drop the teams line from the dossier headers (F1). Add `crew.json` and `rosters.json` to rule 10's currency list and to rule 7's sentence, so the two structures the order asked for are the two a dispatch must touch (F2).

Verdict: the room the commander asked for is here and it is the right shape, but it is not yet a corpus-fit room, because the rebuild answered "record the team, dossier the seat, name the roster" by writing the same seat four times and then leaving two of the four outside the rules that keep anything true. Every one of O041's four wants is visibly served, and the dossiers are richer than anything the cockpit held this morning, so the direction is not in question. What is in question is the second session: nothing in the rules forces `crew.json` or `rosters.json` to be updated, three of four copies of a seat fact will drift the first time a model changes, and the one file the commander personally ordered content into carries two citations that point at a turn header rather than at their own words. Fix the citations, collapse the seat facts to one authoritative store with the others referencing it, and bind both manifests into rule 10, and the room fits. Separately, the dossiers will not let a pilot dispatch a seat until "Brief essentials" is written as a brief rather than as a memory of one.
