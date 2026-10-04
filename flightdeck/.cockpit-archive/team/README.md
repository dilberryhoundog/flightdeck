# Team

Who does the work. Any actor, role, or combination of them.

- `crew/` — a dossier for every seat the pilot dispatches, in three rooms: `flightcrew/` for seats that fly launches, `cockpit/` for seats that work inside this post, `general/` for seats that serve any room. `MANIFEST-crew.json` is the register across all three and owns each seat's identity: agent type, model and status.
- `officers/` — the controlling roles, human or agent. `commander/` holds the commander's standing orders, preferences and working relationship; `pilot/` holds the pilot's identity and job description, delivered at launch by `../base/bin/pilot.sh`.
- `rosters/` — favourite setups the pilot has flown and would fly again, one unit per roster by name under `MANIFEST-rosters.json`. A roster is a list of seat names and a line of shape; the team it flew as is recorded in `../records/dispatch/`.

Teams are role information. A dispatch is a team instance, and those live in `../records/dispatch/`.
