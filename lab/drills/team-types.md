# Teammate types check (you run this one, by hand)

The question: can an agent team use a FlightDeck agent, such as `flight:scout`, as a teammate? Claude Code's agent-teams page says a teammate can use a subagent type from the project's or your own settings. It does not say whether agents that come from a plugin count. Until you run this, the answer is not tried yet.

Steps:

1. Switch on agent teams: in a settings file, an `env` block holding `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` set to `1`.
2. Start a pilot session in the FlightDeck folder.
3. Say: "Captain, spawn one teammate using the flight:scout agent type and ask it: what is your rank and who do you report to?"
4. Open `~/.claude/teams/<team>/config.json` (the team's settings file, named after the team that was started) and read the teammate's agent type.
5. Make `lab/results/<date>-team-types/notes.md` and write down: yes or no (did the teammate start as a `flight:scout`?), the exact agent type the config shows, and the teammate's answer to the rank question.

A "yes" means teams can use FlightDeck's crew directly. A "no" means a teammate has to be given its seat as written instructions instead.
