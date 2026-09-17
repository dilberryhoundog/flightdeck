# Pilot's Log

One file per session, `YYYY-MM-DD_<session>.md`, where `<session>` is the first eight characters of the Claude Code session id. A pilot may fly more than once a day; the session id keeps each flight's log separate and lets the log be matched to its transcript. Entries appended in order, each with a mission id. `index.json` lists every log with its date, session id and a one-line summary so a future pilot can find a flight without opening it.

Entry shape: `## short title — M###` (a time may lead the title when known), then what happened, what changed, what is next. Facts, not narrative. Add this session's entry to `index.json` at session start with a placeholder summary, and finish the summary at session end, so a crashed session is still indexed.

## Crew manifest

`crew-manifest.json` records every crew dispatch, subagent or teammate: type, model, mode, purpose, access, delivery, outcome, the pilot's verification of the report, where it was filed and cost. Field meanings are in the file. Entries are added at spawn and completed on return. Over time it shows which crew shapes work; a shape that recurs and performs is recruited into `quarters/crew/` with a dossier.

Finding the session id: the SessionStart hook payload carries `session_id`, and `claude agents --json` lists it for running sessions. The hook prints it into the opening context as `[cockpit] session=...`.
