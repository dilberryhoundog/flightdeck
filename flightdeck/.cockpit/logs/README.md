# Pilot's Log

One file per session, `YYYY-MM-DD_<session>.md`, where `<session>` is the first eight characters of the Claude Code session id. A pilot may fly more than once a day; the session id keeps each flight's log separate and lets the log be matched to its transcript. Entries appended in order with a time and a mission id. `index.json` lists every log with its date, session id and a one-line summary so a future pilot can find a flight without opening it.

Entry shape: `## HH:MM — M### — short title`, then what happened, what changed, what is next. Facts, not narrative.

Finding the session id: the SessionStart hook payload carries `session_id`, and `claude agents --json` lists it for running sessions. The hook prints it into the opening context as `[cockpit] session=...`.
