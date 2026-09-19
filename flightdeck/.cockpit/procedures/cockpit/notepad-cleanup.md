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
