# P004 — Currency review

Approved: commander, 2026-09-20.

**Trigger.** Periodical: the close of a launch, or the close of a mission phase.
**Roster.** Pilot alone, plus the two seats below as the sweep finds work for them.
**Tasks.** re-fetch seat (Sonnet): re-fetch each web record's cited pages raw, not summarised, and return the statements the page no longer supports. validator (Opus): for a local record whose sources moved, re-run the stamp check and return its deletions and returns.
**Context.** `../../records/`; this room; `../../quarters/commander/orders.json`; `../../base/decisions.json`; `../../commanders-desk/in-dossiers/Ds004.md` item 7.

## Steps

1. For each locally sourced record, `git log` the library, manual and source-guide paths since its stamp date, and list new entries in `orders.json` and `decisions.json` since that date.
2. Send only a record whose sources moved to the validator. Where the mover is a new directive, judge yourself which records it touches, and record that judgement as your own.
3. For web-sourced records there is no detector: compare the CLI version the session-start hook prints against the version each `Source:` line names, and send the re-fetch seat.
4. Re-stamp what was checked; retire what can no longer be earned.
5. Check each procedure in this room against the conditions its trigger names, and append `last_run` in `procedures.json`.

**Leaves behind.** Log line: what moved, what was re-stamped, what was retired. Files touched: the records and procedures changed; `procedures.json`.
