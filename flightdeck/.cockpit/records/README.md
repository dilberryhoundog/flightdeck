# Records

The pilot's source of truth across sessions. The docspec is cockpit rule 2: six tests, two styles, and the exemplar. A record is one topic, whole. Where the docspec and an existing record disagree, the docspec wins. The four harness records predate the docspec (2026-09-18) and lack the topic pointer (workshop W020). The header's topic or notepad pointer is one of the six tests, and per-claim sources are another; both are required. When in doubt it goes in `../notepad/`. Re-research a record when the commit or page it cites moves.

Source line forms. Documentation: `Source: <URL> (researched YYYY-MM-DD).` Codebase: `Source: <branch>:<path> at <commit>, researched YYYY-MM-DD by <team id> <seat>.` Commander's statements: `Source: topic <id> (../logs/topics/<id>.json); commander turns at <session>:<line>, ...; written advice <path>; researched YYYY-MM-DD by <team id> <seat>.` A claim inside the body cites `<session>:<line>` or `<branch>:<path>` inline where it is not obvious from the header.

- `claude-code/` — the harness: `agent-teams.md`, `subagents.md`, `session-messaging.md`, `settings-and-launch.md`. Register to come: `harness-register.md`.
- `flightcrew/` — the system: empty until the topics team's first records land after the commander's review.
