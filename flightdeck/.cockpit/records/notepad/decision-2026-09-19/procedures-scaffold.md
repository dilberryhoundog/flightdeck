# The procedures room — scaffold

Seat: option-maker, team T009, mission M001. Scratch. Designed against order O042 and DS004, revised once on the pilot's rulings over seven adversary findings. A basic scaffold with five starting cockpit procedures, written out as they would land; the flightcrew branch is scaffolded empty.

## 1. Layout

At the room's root: `procedures.keep`, the commander's founding note, never edited; `README.md`, what the room is, the three trigger kinds and how a procedure is added; `triggers.md`, the manifest, `@`-imported into the cockpit `CLAUDE.md`; `procedures.json`, the index and the dated events the periodicals are due against.
Then two branches. `cockpit/` holds `README.md` and the five starting procedures: `record-keeping.md`, `forming-a-team.md`, `notepad-cleanup.md`, `currency-review.md`, `topics-update.md`. `flightcrew/` holds a `README.md` only, saying what the branch is for and that nothing is built yet.
Two branches because the work splits at who performs it: a cockpit procedure is the pilot's own conduct, a flightcrew procedure conducts a launch. Scripts live where they already live (`base/bin/`); a procedure may call one by path and none lives here. Session start and end are not procedures and are not in this room.

One line belongs in the room's README so two rules do not collide later: a routine the commander names is ordered, not forecast — DS004's rule that nothing is written ahead of a drift event governs knowledge, while O042 makes a procedure a pre-recorded routine, so a cleanup the commander names is written before its first use by design.

## 2. The procedure file format

Fifty lines at most, and none of the starting set passes thirty. A procedure points at the roster, the file or the record that owns each fact and restates none of them. Seven parts in this order, all shown filled in section 5: `# Title`, then `Approved: commander, YYYY-MM-DD.` as the only header; `**Trigger.**` the kind and then its condition, name or events; `**Roster.**` a roster in `dispatch/rosters.json`, the team being formed, or "pilot alone"; `**Tasks.**` one line per seat saying what it is asked to do and what it returns, omitted entirely when the procedure is the pilot alone; `**Context.**` the files to open, as pointers; `## Steps`, numbered, each one action; `**Leaves behind.**` the log line and the files touched.

The `Approved:` line is the file's whole authority: the commander approves the file together with its manifest line. A procedure with no approval line is a draft and is not followed; the index mirrors that line, and the file is the authority where the two disagree. A procedure carries no `Source:` and no `Validated:`, because it states conduct the commander ordered rather than facts a validator could check. **Tasks** answers the commander's primary idea, that a procedure matches a roster to tasks, context and steps.

## 3. The manifest, `triggers.md`

One line per procedure under a heading per trigger kind, imported by `@procedures/triggers.md`. It is auto-loaded, so it stays a routing table and never explains anything. Its only limit on growth is that every line arrives with a procedure the commander approves.

```markdown
# Triggers

## On demand — you decide the condition has arrived
- When the commander corrects you on something a file could have told you, or the same question reaches you twice, open `procedures/cockpit/record-keeping.md`.
- Before forming a team, open `procedures/cockpit/forming-a-team.md`.

## Named — invoked by name, with no condition and no event
- None in the cockpit branch yet. "Launch ending" will be the first, when the flightcrew branch is built.

## Periodical — the event that makes it due
- At the close of a mission phase, open `procedures/cockpit/notepad-cleanup.md`.
- At the close of a mission phase, open `procedures/cockpit/topics-update.md`.
- At the close of a launch, or the close of a mission phase, open `procedures/cockpit/currency-review.md`.
```

An on-demand line states a condition and never a summary, so it reads as an instruction to act rather than a description of a file. Every procedure is callable by its name whatever its kind; the Named heading lists only those with no condition and no event, invoked by name alone.

**How a periodical shows it is due, without machinery.** It is due on an event, never on a date. `procedures.json` carries an `events` list the pilot appends to when a mission phase or a launch closes, and each periodical's `last_run` is a date plus the event that prompted it, or `order`. A periodical is due when the latest event of a kind it names is later than its `last_run` date. The limit, plainly: a missed run shows at the next look at the index, not by itself. An ordered run is just a run, so the commander's order never enters the events list.

## 4. `procedures.json`

```json
{"version": 1, "updated": "2026-09-20",
 "convention": "The index of the room, and the dated events the periodicals are due against. Ids are slugs, not numbers, so they never collide with proposal ids. The file's Approved line is authoritative; this index mirrors it.",
 "events": [{"kind": "mission-phase-close", "date": "2026-09-20", "note": "M001 phase 3"}],
 "items": [
  {"id": "currency-review", "title": "Currency review", "branch": "cockpit", "file": "cockpit/currency-review.md",
   "trigger": {"kind": "periodical", "events": ["launch-close", "mission-phase-close"]},
   "roster": null, "approved": "2026-09-20",
   "last_run": {"date": "2026-09-20", "event": "mission-phase-close"},
   "status": "active", "updated": "2026-09-20"}
 ]}
```

Fields: `id` slug; `title`; `branch`; `file`; `trigger` with `kind` and then `condition`, `name` or `events` by kind; `roster`, a roster in `dispatch/rosters.json` or null for pilot alone; `approved`, the commander's date, mirroring the file; `last_run` for periodicals, a date and the event or `order` that prompted it; `status` active, draft or retired; `updated`. An entry with no `approved` date is a draft, which is the same statement the file's missing header makes.

## 5. The five starting cockpit procedures

```markdown
# Record keeping

Approved: commander, 2026-09-20.

**Trigger.** On demand: a drift event — the commander corrects you on something a file could have told you, the same mistake or question recurs, a review catches what should have been known, or the commander marks a correction costly.
**Roster.** Pilot alone, until the vehicle is a record.
**Tasks.** writer (one seat): draft the record from the wide net — source guides, library, manuals, the commander's directives, the topic store last — and hand over its statement-to-source working notes. validator (Opus, did not write it): open the sources in full and return its deletions and returns.
**Context.** `../../CLAUDE.md` rule 2; `../../records/README.md`; `../../commanders-desk/in-dossiers/DS004-record-keeping.md`.

## Steps

1. Name the drift in today's log in one line: what was corrected, and what file could have prevented it.
2. Apply the vehicle test and write the answer in the same line.
3. Route it. A constant one-line rule goes to `CLAUDE.md`. A multi-step routine becomes a procedure here and goes to the commander with its manifest line. A damaging action that can be detected becomes a proposal against `base/` for the guard. Mission knowledge goes to the mission file, crew knowledge to the seat's dossier.
4. If the vehicle is a record, dispatch the two seats above and take their returns yourself before anything lands.
5. Mirror a conduct correction into auto memory; its authoritative home stays the cockpit file.

**Leaves behind.** Log line: the drift, and the vehicle it was routed to. Files touched: the file written; a seat dossier if crew flew.
```

```markdown
# Forming a team

Approved: commander, 2026-09-20.

**Trigger.** On demand: before forming a team.
**Roster.** The one being formed.
**Context.** `../../dispatch/rosters.json`; `../../dispatch/README.md`; `../../quarters/crew/crew.json` and the seat dossiers; the crew protocol in `../../CLAUDE.md`, which governs models, briefs and shutdown and is not repeated here.

## Steps

1. State the goal in one line and pick the roster that fits, or say why none does.
2. Brief each seat under the crew protocol.
3. Open the entry in `dispatch/cockpit.json` at spawn, naming the roster it came from.
4. Confirm every seat has a dossier; write one the first time a seat flies.
5. On finish, complete the entry with outcome and lessons, update `crew.json` and the dossiers, and save the setup as a roster if it is worth flying again.

**Leaves behind.** Log line: the team id, the roster, and what it was for. Files touched: `dispatch/cockpit.json`; `quarters/crew/crew.json`; the seat dossiers; `dispatch/rosters.json` if a roster was saved.
```

```markdown
# Notepad cleanup

Approved: commander, 2026-09-20.

**Trigger.** Periodical: the close of a mission phase.
**Roster.** Pilot alone; one cheap seat if a folder needs reading before it can be judged.
**Context.** `../../notepad/README.md`, which states the room's own four-way convention.

## Steps

1. List the folders in `notepad/` against the README index.
2. Decide each one: promote, which enters `record-keeping.md` and does not happen here; move to `logs/` or a mission file if it matters but will never be a record; keep, if the work is live; delete.
3. Keep the working notes of any record that still stands.
4. Rewrite the README index to match what is left.
5. Append `last_run` in `procedures.json`.

**Leaves behind.** Log line: what was promoted, moved, kept and deleted. Files touched: `notepad/`; `notepad/README.md`; `procedures.json`.
```

```markdown
# Currency review

Approved: commander, 2026-09-20.

**Trigger.** Periodical: the close of a launch, or the close of a mission phase.
**Roster.** Pilot alone, plus the two seats below as the sweep finds work for them.
**Tasks.** re-fetch seat (Sonnet): re-fetch each web record's cited pages raw, not summarised, and return the statements the page no longer supports. validator (Opus): for a local record whose sources moved, re-run the stamp check and return its deletions and returns.
**Context.** `../../records/`; this room; `../../quarters/commander/orders.json`; `../../base/decisions.json`; `DS004` item 7.

## Steps

1. For each locally sourced record, `git log` the library, manual and source-guide paths since its stamp date, and list new entries in `orders.json` and `decisions.json` since that date.
2. Send only a record whose sources moved to the validator. Where the mover is a new directive, judge yourself which records it touches, and record that judgement as your own.
3. For web-sourced records there is no detector: compare the CLI version the session-start hook prints against the version each `Source:` line names, and send the re-fetch seat.
4. Re-stamp what was checked; retire what can no longer be earned.
5. Check each procedure in this room against the conditions its trigger names, and append `last_run` in `procedures.json`.

**Leaves behind.** Log line: what moved, what was re-stamped, what was retired. Files touched: the records and procedures changed; `procedures.json`.
```

```markdown
# Topics update

Approved: commander, 2026-09-20.

**Trigger.** Periodical: the close of a mission phase.
**Roster.** Pilot alone.
**Context.** `../../logs/topics/README.md`, which states the schema and the timeless-topics rule.

## Steps

1. File the commander's statements since the last run against their topics, with ref, date, statement and one line of lead-up context.
2. Mark a superseded statement with `superseded_by` rather than deleting it.
3. Open a new topic only if it is timeless and system-level; mission and run chatter does not enter.
4. Update `topics.json` and each touched topic's `updated` date, and append `last_run` in `procedures.json`.

**Leaves behind.** Log line: topics touched, statements filed, supersessions marked. Files touched: `logs/topics/`; `procedures.json`.
```

## 6. Deliberately left for the self-sustaining mission

The flightcrew branch itself: launch and run folder setup, run iteration improvement, and the pre-run teams for spec and tests — the work the fc CLI was built to do, and the reason the branch is scaffolded now and empty.
Whether a procedure may call another, and what a nested or conditional procedure looks like; and procedure versioning and retirement, beyond the `status` field standing ready for it.
Any measurement of whether a manifest line actually fires, which DS004 already concedes is a hypothesis; and machinery for due-ness, if events in `procedures.json` prove too loose in practice.
The pilot's agent body, which takes session start and end on the commander's ruling.
