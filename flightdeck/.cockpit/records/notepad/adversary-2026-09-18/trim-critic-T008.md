# trim-critic — T008

**Measured baseline.** `dispatch/cockpit.json` 416 lines / 2269 words; `dispatch/rosters.json` 149 / 402; `quarters/crew/crew.json` 292 / 571; the two READMEs 18 / 341; 25 dossiers (not 26) 494 / 3705. Integration total: 1369 lines, 7288 words.

**Context weight.** CLAUDE.md always, and it spends about 5 lines on this integration (rules 7 and 10, the map lines for `quarters/` and `dispatch/`) — cheap and correct, no finding against it. The two READMEs load on visit. A dossier loads when its seat is dispatched, so dossier words are the recurring per-dispatch cost and I weight them heaviest. The three JSONs load when the pilot opens the room, roughly once a session.

---

**F1** — **The identity quad is stored four times and three copies are already stale**
**S-H** · **C-H**
**FINDING**: `name`, `agent_type`, `model`, `dossier` appear in a `cockpit.json` seat, a `rosters.json` seat, a `crew.json` row and a dossier header. Make `crew.json` the sole source; a `cockpit.json` seat becomes `{name, reason, returns}` and a `rosters.json` seat becomes a bare name string.
**EVIDENCE**: I diffed the four copies by script. T008 is recorded in `cockpit.json` with seats `fit-critic` and `trim-critic`, but `crew.json` still carries `"teams": ["T003"]` for both, `rosters.json` still carries `"flown": ["T003"]` for `mini-adversary`, and both dossier headers still say `**Teams:** T003`. Four writes were required and one was made, inside the same working day the room was built. Saving: cockpit.json 416 → 338 lines, rosters.json 149 → 52 lines.
**LOST**: reading one team entry no longer tells you which model a seat ran on. A pilot who needs it does one lookup in `crew.json`, which is the file that is right by construction.

**F2** — **`crew.json.dossier` is fully derivable from `room` and `name`**
**S-H** · **C-H**
**FINDING**: Delete the field; state the convention `<room>/<name>.md` once in the `fields` block.
**EVIDENCE**: I tested all 25 rows against `f"{room}/{name}.md"`. Zero exceptions. 25 lines that can only ever go wrong.
**LOST**: nothing.

**F3** — **`crew.json.teams` and `rosters.json.flown` are derived indexes kept by hand**
**S-H** · **C-H**
**FINDING**: Both are reverse lookups over `cockpit.json`. Delete both; derive with one `jq` pass when needed.
**EVIDENCE**: Derivation from `cockpit.json` reproduces every entry except four, and all four are the stale ones from F1. With F2 this takes `crew.json` from 292 to 182 lines.
**LOST**: one real thing — `harness-guide` carries `["C001","C003","C004"]`, which are ids in the frozen `logs/crew-manifest.json`, not in `cockpit.json`, so they are not derivable. Keep a single `legacy` string on that one row.

**F4** — **The dossier header line is the fourth copy and the one spread over 25 files**
**S-M** · **C-H**
**FINDING**: Cut the header to the seat name and its purpose. Agent type and model live in `crew.json`; crew room is the directory the file sits in; teams flown is F3.
**EVIDENCE**: Every `team/` dossier opens with the same four-fact line, e.g. `team/trim-critic.md`: `**Agent type:** general-purpose · **Model:** Opus · **Crew room:** team · **Teams:** T003`. 900 of the 3608 dossier words are header. Room is 100% redundant with the path in all 25.
**LOST**: nothing that `crew.json` does not hold, and `crew.json` is one file to update instead of 25.

**F5** — **Dossiers spend a third of their words on retrospective narrative a future pilot cannot act on**
**S-M** · **C-H**
**FINDING**: Merge `## How it performed` and `## Corrections it needed` into one `## Record` capped at 40 words, keeping only the evidence behind a line that survives in `## Next time`. Leave `## Brief essentials` and `## Next time` intact; those are the reusable parts.
**EVIDENCE**: Section totals across 25 dossiers: How it performed 823 words, Corrections 401, Brief essentials 534, Next time 421. So 1224 words of history against 955 words of instruction, on the file class that loads on every dispatch. `team/adversary.md` spends 96 words on performance and corrections to reach four instructions.
**LOST**: the anecdote that justifies each instruction. A dispatching pilot acts on the instruction, not the anecdote, and the full account survives in the team's `outcome` and `lessons` in `cockpit.json`.

**F6** — **Five retired seats hold a full dossier each to say they were superseded**
**S-M** · **C-M**
**FINDING**: Delete `team/red-team.md`, `team/auditor.md`, `team/docs-scout.md`, `team/cockpit-comber.md`, `team/records-writer.md`. Carry the one operative sentence in the `crew.json` `status` string, which already says `retired into fit-critic`, `retired into docs-verifier`, `retired into adversary`, `superseded by record-writer`.
**EVIDENCE**: 100 lines / 481 words across the five. `team/red-team.md` runs four headed sections to deliver `Superseded by the adversary seat on Opus`; its one substantive point, that Sonnet is wrong on an adversary seat, is already CLAUDE.md crew rule 2.
**LOST**: `records-writer.md` is the substantial one at 172 words, but its lessons are already in T002's `lessons` array in `cockpit.json`. Net loss across the five is nothing not held elsewhere.

**F7** — **`cockpit.json` seat `reads` restates the dossier's brief essentials**
**S-M** · **C-M**
**FINDING**: Drop `reads` from the seat entry. Keep `reason` and `returns`, which are the team-specific facts nothing else records.
**EVIDENCE**: 149 words over 26 seats. T001's `docs-verifier` reads `official Anthropic docs`; `team/docs-verifier.md` states the same scope durably. Saving: 26 lines.
**LOST**: the exact per-team scope, where a seat's scope differed from its standing one. `reason` usually implies it, and `returns` shows what the scope produced.

**F8** — **The in-file `fields` and `purpose` blocks restate the sibling README**
**S-M** · **C-M**
**FINDING**: Delete the `fields` block from `cockpit.json` (10 lines) and from `crew.json` (9 lines), and cut the paragraph-length `purpose` strings in `crew.json` and `rosters.json` to one clause each. Keep the READMEs as the description of record; keep the `fields` line for any convention a reader cannot infer, such as F2's filename rule.
**EVIDENCE**: `cockpit.json` `fields` says the seat carries `name, agent_type, model, dossier (quarters/crew/<room>/<file>), reason, reads, returns`; `dispatch/README.md` bullet one says `one entry per team with its seats inside (name, agent type, model, dossier, reason, reads, returns)`. `crew.json` `purpose` restates the whole of `quarters/crew/README.md` in 62 words. The files sit in the same directory as their README.
**LOST**: the JSON stops being self-describing when read alone. It is never read alone; the README is one directory listing away.

**F9** — **`dispatch/README.md` documents a file that does not exist**
**S-L** · **C-H**
**FINDING**: Cut the `flightcrew.json` bullet to a half-line, or to nothing until launches start.
**EVIDENCE**: `ls dispatch/` returns `cockpit.json`, `rosters.json`, `README.md`. The bullet spends a line and a parenthetical on departments that are not built.
**LOST**: the signal that the room is designed to take a second file. The README's opening sentence already frames the room by room.

**F10** — **Accounting for what I am not cutting**
**S-L** · **C-H**
**FINDING**: `cockpit.json` `outcome` and `lessons` total 798 words and are the largest prose in the three JSONs. I attack nothing in them.
**EVIDENCE**: They are the only record of what a team actually did, they load once a session rather than per dispatch, and F5 and F6 both spend them as the place the deleted history survives. Cutting them would break the other cuts.
**LOST**: would be the integration's reason to exist.

---

**The three cuts that save most at zero functional cost.**

1. **F1, one source for seat identity.** `crew.json` owns name, agent type, model and dossier; `cockpit.json` and `rosters.json` hold names and pointers. Removes 175 lines and the drift that has already happened three times.
2. **F2 with F3, delete the derived fields.** `dossier`, `teams` and `flown` are all computable. Removes 110 lines from `crew.json` and 16 from `rosters.json`, and leaves nothing that can be wrong except the one legacy string.
3. **F4 with F5, put the dossiers on a diet.** Header cut to name and purpose, history merged into one 40-word record. Takes dossiers from 3705 to about 2400 words on the file class that loads every time a seat is dispatched.

Together: the three JSONs go 857 → 536 lines, a 37% cut; the dossiers go 3705 → about 2400 words, a 35% cut; five files disappear. No fact leaves the room.

**Verdict.** The integration is sound in shape and overweight in storage, and the overweight is one mistake repeated: the same four facts written into four files by hand, with no derivation and no check. That is not a style complaint, it is a defect that has already fired — T008 was filed correctly in `cockpit.json` and is wrong in three other places as I write this, hours after the room was built. Every cut above follows from naming one owner per fact: `crew.json` owns who a seat is, `cockpit.json` owns what a team did, the dossier owns how to brief the seat next time, the README owns the explanation. The dossiers are the second problem and the more expensive one per session, because they load on dispatch and spend a third of their words telling a future pilot a story instead of an instruction. Do F1 through F5 and the room holds the same knowledge in about two thirds of the bytes, with one place to write each fact.
