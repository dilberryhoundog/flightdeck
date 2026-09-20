---
type: "Procedure"
unit: "P002"
status: "active"
trigger: "on-demand"
stamp: ["2026-09-20", "Pilot: Ace", "4450a586"]
approved: "2026-09-20"
context: ["Rq011"]
---
# P002 — Forming a team

Approved: commander, 2026-09-20.

**Trigger.** On demand: before forming a team.
**Roster.** The one being formed.
**Context.** `../../../team/rosters/MANIFEST-rosters.json`; `../../../records/dispatch/README.md`; `../../../team/crew/MANIFEST-crew.json` and the seat dossiers; the crew protocol in `../../../CLAUDE.md`, which governs models, briefs and shutdown and is not repeated here.

## Steps

1. State the goal in one line and pick the roster that fits, or say why none does.
2. When the team explores someone's idea, talk the idea through with its owner first: what it is for, what it left out, what the names mean. Seats then test the owner's position; they do not price it as one option among theirs.
3. Brief each seat under the crew protocol. Where one seat holds a paper and another attacks it, the attack names the pass by number and the paper is frozen until the findings are in; findings are relayed in one message per round, not as they arrive.
4. Open the entry in `records/dispatch/MANIFEST-dispatches.json` at spawn, naming the roster it came from.
5. Confirm every seat has a dossier; write one the first time a seat flies.
6. On finish, complete the entry with outcome and lessons, update `MANIFEST-crew.json` and the dossiers, and save the setup as a roster if it is worth flying again.

**Leaves behind.** Log line: the team id, the roster, and what it was for. Files touched: `records/dispatch/MANIFEST-dispatches.json`; `team/crew/MANIFEST-crew.json`; the seat dossiers; `team/rosters/MANIFEST-rosters.json` if a roster was saved.
