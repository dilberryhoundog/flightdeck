# Dispatch

The pilot's teams: the pilot's first feature (commander, 2026-09-18). Teams are the pilot's; crews are flightcrew's, and flightcrew does not know about teams.

- `cockpit.json` — every team dispatched for cockpit work, one entry per team with its seats inside (name, reason, returns; identity in the crew manifest), its subagents, shape, outcome, lessons and status. Ids are assigned once and never renumbered; a team recorded late says so in its outcome. A one-shot subagent outside a team is a one-seat entry.
- `flightcrew.json` — for teams that fly launches, once there are any.
- `rosters.json` — named setups the pilot has flown and would fly again, each a list of seat names and a line of shape. Dispatching a roster means spawning its seats with their dossier briefs adapted to the task; the team entry records which roster it came from.

Every seat has a dossier under `../quarters/crew/` so it can be repeated, replicated or improved; `../quarters/crew/crew.json` is the manifest of every teammate across every crew. `../logs/crew-manifest.json` is the frozen archive of dispatches before this room existed.
