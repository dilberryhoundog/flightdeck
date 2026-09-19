# Forming a team

Approved: commander, 2026-09-20.

**Trigger.** On demand: before forming a team.
**Roster.** The one being formed.
**Context.** `../../dispatch/rosters.json`; `../../dispatch/README.md`; `../../quarters/crew/crew.json` and the seat dossiers; the crew protocol in `../../CLAUDE.md`, which governs models, briefs and shutdown and is not repeated here.

## Steps

1. State the goal in one line and pick the roster that fits, or say why none does.
2. Brief each seat under the crew protocol.
3. Open the entry in `dispatch/cockpit.json` at spawn, naming the roster it came from.
4. Confirm every seat has a dossier; write one the first time a seat flies.
5. On finish, complete the entry with outcome and lessons, update `crew.json` and the dossiers, and save the setup as a roster if it is worth flying again.

**Leaves behind.** Log line: the team id, the roster, and what it was for. Files touched: `dispatch/cockpit.json`; `quarters/crew/crew.json`; the seat dossiers; `dispatch/rosters.json` if a roster was saved.
