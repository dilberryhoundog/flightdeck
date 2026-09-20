---
type: "Crew Dossier"
unit: "trim-critic"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-18", "Pilot: Ace", "dcb75456"]
context: ["T003", "T008", "T012"]
---
# trim-critic

Attack for bulk: what can be trimmed or replaced without losing function, with what is lost stated per cut, in tokens per session.

## How to dispatch

Reads the whole cockpit, measures every changed file, reads the largest first. Concrete replacements, line counts before and after; 120 lines.

## Record

Seventeen findings; named the three recurring costs (standing orders injected at launch, the session log read at start, seats recorded twice) and the cuts were made.

## Next time

Same seat. Point it at the files that load every session.
