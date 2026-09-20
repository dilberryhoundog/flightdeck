# P005 — Topics update

Approved: commander, 2026-09-20.

**Trigger.** Periodical: the close of a mission phase.
**Roster.** Pilot alone.
**Context.** `../../logs/topics/README.md`, which states the schema and the timeless-topics rule.

## Steps

1. File the commander's statements since the last run against their topics, with ref, date, statement and one line of lead-up context.
2. Mark a superseded statement with `superseded_by` rather than deleting it.
3. Open a new topic only if it is timeless and system-level; mission and run chatter does not enter.
4. Update `MANIFEST-topics.json` and each touched topic's `updated` date, and append `last_run` in `MANIFEST-procedures.json`.

**Leaves behind.** Log line: topics touched, statements filed, supersessions marked. Files touched: `logs/topics/`; `MANIFEST-procedures.json`.
