# Records

The pilot's source of truth, kept across many sessions. Every good pilot protects their records. When in doubt, it goes in `../notepad/`, not here.

The pathway in is promotion from the notepad. When notepad entries accumulate around a subject, they guide a research task; the researched result becomes the record. A notepad entry is never copied into records as it stands.

What qualifies:

- Official documentation findings. The file names its `Source:` URLs, research date and, where relevant, the CLI version.
- Codebase findings, only when well researched by a specialist teammate for a stated purpose. The file names the purpose, the researcher, and the branch and commit it was researched at. A general survey or first look does not qualify.

What does not: the pilot's own tests, observations of live sessions, opinions, plans, first looks, and anything likely to stop mattering within a few sessions. Those go in `../notepad/`. When a test contradicts a record, note it in the notepad and re-check the source; do not annotate the record with test results. Re-research a record when its source moves (a version bump, a merge to main).

- `claude-code/` — Claude Code harness docs: agent teams, session messaging, settings and launch flags, subagents.
- `flightcrew/` — reserved for purpose-led research on the flightcrew system. Empty for now.
