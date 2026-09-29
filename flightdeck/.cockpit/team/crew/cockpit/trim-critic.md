---
type: "Crew Dossier"
unit: "trim-critic"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-22", "Pilot: Ace", "f6216b95"]
context: ["T003", "T008", "T012", "T018"]
---
# trim-critic

Attack for bulk: what can be trimmed or replaced without losing function, with what is lost stated per cut, in tokens per session.

## How to dispatch

Reads the whole cockpit, measures every changed file, reads the largest first. Concrete replacements, line counts before and after; 120 lines.

## Record

Seventeen findings; named the three recurring costs (standing orders injected at launch, the session log read at start, seats recorded twice) and the cuts were made.

T018, live: 41 findings, a baseline (13,054 tokens before the greeting), a per-round cost of every fix, and a closing total (8,616 with the cheapest fixes). Found the largest saving nobody else counted, the procedure re-run on compact (P34). Two withdrawals, superseded by better fixes.

## Next time

Same seat, live, as the footprint half of fit-and-footprint. Ask for the baseline before the first landing and the total at the close; its standing test, one scalar belongs in the hook not in a file read, held every round.
