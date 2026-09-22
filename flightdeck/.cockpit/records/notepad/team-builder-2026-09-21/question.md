# T017 question file — the team-builder idea

Mission M002. Dispatching session: `pilot`. All paths are relative to `flightdeck/.cockpit/` in the repository `/Users/dylangraham/Projects/flightdeck`.

## The idea and its owner

The commander (the human owner) wrote `commander/desk/out/ideas/team-builder.txt`. Read it first and whole. Its Setup and Maintenance lists are the commander's position. Seats test that position and fill it out; they do not price it as one option among their own. Its five "Exploration topics" are the questions this team answers.

## What the commander has said about it (orders Or065, Or066, 2026-09-21, verbatim in `commander/orders/`)

- The team-builder is a standing team whose product is other teams: rosters, seat dossiers, the pilot entry point, improvement criteria and tests; and their maintenance.
- "Pilot entry point requirements" means the statement of what the pilot hands the team at dispatch and what comes back: in practice the procedure (`work/procedures/`) that pairs with the roster.
- The axes are speed, coverage, quality, alignment, security, adversarial. Adversarial is an axis, not a seat kind: how well the team reviews itself.
- Team types: Autonomous (runs to a finish and reports), Pilot leader (the pilot relays and rules between rounds, the normal team today), Commander in the room (the commander answers through the pilot's seat, as in T010), and a fourth the commander added: with agent teams he can jump directly onto a teammate's session and answer its questions there. He asks for the best name: "direct interview", "commander at the seat", or better.
- The mini-spec idea (`commander/desk/out/ideas/mini-spec.txt`) is a later session. After this team's dossier, a custom mini-spec team writes the build request. Do not design the mini-spec team here beyond noting it as one roster the team-builder would own.
- Output of this team: an exploration paper the pilot distils into a dossier for the commander.

## Where the team-builder would sit

Mission `work/missions/M002-self-sustaining-cockpit.md`: objectives "rosters matched to procedures" and "teams from the dispatch record". Today the pilot forms teams by hand under `work/procedures/cockpit/P002-forming-a-team.md`, with rosters in `team/rosters/`, seat dossiers in `team/crew/`, team records in `records/dispatch/`, and the crew protocol in `CLAUDE.md`.

## Rules for every seat

- The cockpit `CLAUDE.md` loads when you read a cockpit file. You are crew. Nothing in `team/officers/pilot/` is addressed to you.
- Write only your own report file under `records/notepad/team-builder-2026-09-21/`. Never edit a `*.keep` file, an idea file, an order or any other cockpit file.
- Counts enumerate the filesystem and state their pattern; never count from a typed list.
- Send a summary to `pilot` by SendMessage when your file is written, then stay available for follow-up questions. State your seat name in every message.
- Markdown in single lines, no hard wraps.
