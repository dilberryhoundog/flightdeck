# Dispatch

The pilot's teams: the pilot's first feature (commander, 2026-09-18). Teams are the pilot's; crews are flightcrew's, and flightcrew does not know about teams.

- `MANIFEST-dispatches.json` — the one register of every team, whatever room it flew in. A row carries the team id, date, mission, a one-line summary, status and the path to its unit. Team numbers are counted across the whole register, assigned once and never renumbered; a team recorded late says so in its outcome.
- `cockpit/` — one unit per team dispatched for cockpit work, `T###.json`, holding its seats (name, reason, returns; identity in the crew manifest), its subagents, shape, outcome, lessons, status and its room. A one-shot subagent outside a team is a one-seat unit.
- `flightcrew/` — units for teams that fly launches, once there are any. The register is shared, so the room costs nothing until it has a team.
- `MANIFEST-rosters.json` and `rosters/` — named setups the pilot has flown and would fly again, one unit per roster by name, each a list of seat names and a line of shape. Dispatching a roster means spawning its seats with their dossier briefs adapted to the task; the team unit records which roster it came from.

Every seat has a dossier under `../../team/crew/` so it can be repeated, replicated or improved; `../../team/crew/MANIFEST-crew.json` is the manifest of every teammate across every crew. `../logs/crew-manifest.json` is the frozen archive of dispatches before this room existed.
