# Records

The pilot's source of truth, kept across many sessions. Protect it. A record holds solid understanding that will still matter many sessions from now, and every file names its `Source:` and date near the top.

- Harness facts: the source is official documentation (URLs), with the CLI version where relevant.
- Flightdeck and flightcrew facts: the source is the repo at a named branch and commit, surveyed by named crew.

Not records: the pilot's own tests, observations of live sessions, opinions, plans and anything likely to stop mattering within a few sessions. Those go in `../notepad/`. When a test contradicts a record, note it in the notepad and re-check the source; do not annotate the record with test results. Re-survey a record when its source moves (a version bump, a merge to main).

- `claude-code/` — Claude Code harness docs: agent teams, session messaging, settings and launch flags, subagents.
- `flightcrew/` — the flightcrew system as found in the repo: what exists, what is missing, open flags.
