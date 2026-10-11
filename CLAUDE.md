# FlightDeck

This repository is FlightDeck, a Claude Code plugin called `flight`. The plugin lives in `flightdeck/`. The owner's work and truth live in `.flightdeck/`. Testing lives in `lab/`. Downloaded sources live in `library/source/`.

## Whose words bind

Only three kinds of file bind: `.flightdeck/VISION.md`, `.flightdeck/build.txt` and each workshop's `constraints.md`. The newest dated line wins.

Everything else is agent-written material: `INTENT.md`, `HISTORY.md`, other branches, earlier attempts, research and plans. Use it, change it or ignore it. Nothing earlier is finished; never call earlier work finished.

## Hard rules

- Never push to main or master.
- Never force-push.
- Never delete a branch.
- The owner merges pull requests; no agent does.
- Nothing above Opus at high effort. Sonnet for building, Haiku for cheap reading.
- Never write the owner's files: `VISION.md`, `build.txt`, any `constraints.md`, any file whose frontmatter says `write: "human"`.

## Writing

One paragraph per line in markdown, no hard wrapping. No tables in chat. Plain words, literal and direct.

## Ranks

The Commander is the owner. The Captain is the lead session. An Officer leads a team inside one piece of work or runs as a long-lived background session. A Worker does one job in a team.

Rank is given when work is handed out, in the first line of the agent's opening text, and not by the agent's name. The full rules are in `flightdeck/policies.md`.

## Workshops

A workshop is a piece of work with its own folder in `.flightdeck/`. The list of all workshops is `.flightdeck/workshops.md`.

Work you are not asked to do is captured as one line in `.flightdeck/workshops.md`, never done: `- <name>: <the ask> (<date>)`.

Only the owner activates, settles or promotes a workshop. Agents may capture.

The detailed workshop rules are in `.flightdeck/CLAUDE.md`, which loads when you touch a file under `.flightdeck/`.

## dev-workspace

dev-workspace may be present in this repository. FlightDeck does not need it. Use `dw` where it is installed, and plain `git` and `gh` otherwise.

Leave `dev/` and `.claude/rules/` alone; dev-workspace owns them. The file `.claude/rules/context.md` imports `dev/workspace/context/tree.md`, which does not exist. That broken import is left alone.

## Where things live

- `flightdeck/`: the plugin (agents, skills, hooks, templates, policies, rubric).
- `.flightdeck/`: the owner's documents, the workshop list and one folder per active workshop.
- `lab/`: checks and tests for FlightDeck itself.
- `library/source/`: downloaded sources, read-only material.

## Checks

- `node lab/checks/hard-rules.mjs`
- `claude plugin validate flightdeck`
- `node --test 'flightdeck/tests/*.test.mjs'`

On Node 22 always quote the glob. `node --test flightdeck/tests/` without the glob fails.
