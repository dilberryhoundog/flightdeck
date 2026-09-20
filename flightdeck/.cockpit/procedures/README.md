# Procedures

The cockpit's logic engine: pre-recorded routines the pilot conducts, so that repeated work is not re-prompted and does not drift or vary between sessions. A procedure matches a roster with tasks, context files and steps. The commander's founding note is `procedures.keep`; their direction for the room is order Or042 in `../quarters/commander/MANIFEST-orders.json`.

- `triggers.md` — the manifest: one line per approved procedure, under its trigger kind. Imported into the cockpit `CLAUDE.md`, so it stays a routing table and explains nothing.
- `MANIFEST-procedures.json` — the index, and the dated events the periodicals are due against.
- `cockpit/` — the pilot's own conduct: `P001-record-keeping.md`, `P002-forming-a-team.md`, `P003-notepad-cleanup.md`, `P004-currency-review.md`, `P005-topics-update.md`.
- `flightcrew/` — conducting a launch. Scaffolded empty.

## Trigger kinds

- **On demand.** The pilot decides a condition has arrived. The manifest line states the condition, never a summary of the file.
- **Named.** No condition and no event; invoked by name by the commander or the pilot. Every procedure of any kind can also be called by its name.
- **Periodical.** Due on an event, never a date: the close of a mission phase or of a launch. The pilot appends the event to `MANIFEST-procedures.json`; a periodical is due when the latest event of a kind it names is later than its `last_run`. A missed run shows at the next look at the index, not by itself. A run on the commander's order is just a run.

## The file

Fifty lines at most: title; one header line; Trigger; Roster, or "pilot alone"; Tasks, one line per seat with what it does and returns, omitted when the pilot works alone; Context; numbered Steps; Leaves behind. A procedure points at the roster, file or record that owns a fact and restates none of them. Scripts stay in `../base/bin/`; a procedure may call one by path.

The header line is the procedure's standing and the index mirrors it: `Approved: commander, YYYY-MM-DD.` once the commander has approved or adjusted it, `Added: pilot, YYYY-MM-DD.` for one the pilot has extracted and the commander has not yet read, `Draft:` for one not to be followed, which has no manifest line.

## Adding one

The pilot extracts procedures from live work and keeps them updated; the commander may advise and adjust them along the way (Rq011, 2026-09-20). A procedure is written when a drift event routes to one (`cockpit/P001-record-keeping.md`), when the pilot finds itself repeating a routine, or when the commander names one. A routine the commander names is ordered, not forecast: the rule against writing ahead of need governs knowledge, not routines. When a procedure is added or its steps change, the pilot says so in the session log and tells the commander in session, so they can read and adjust it; the `Approved:` line carries the date the commander approved it or last adjusted it, and a new procedure is headed `Added: pilot, YYYY-MM-DD.` until they have.
