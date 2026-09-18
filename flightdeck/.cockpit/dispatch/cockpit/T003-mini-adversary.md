# T003 — Mini adversary team

- **Date:** 2026-09-18, session dcb75456, mission M001, room cockpit
- **Purpose:** critique the pilot's cockpit work of the day and the approved plan, from two angles, before the docspec is written. Commander's order.
- **Seats:** 2 teammates, no subagents

## Seats

- `fit-critic`, general-purpose, Opus. Angle: "it doesn't fit the existing corpus (cockpit purpose), show me where." Reads the whole cockpit and today's changes.
- `trim-critic`, general-purpose, Opus. Angle: "this is too long and bulky, show where it can be trimmed or changed to something more efficient without losing functionality."

## Shape

Both in parallel, both under the adversarial mandate, both reporting to the lead. No back-and-forth between them by design: independent angles.

## Outcome

fit-critic: 13 findings, three high, all three against the plan (crew cannot write where the plan sends them; the docspec would restate rule 2; a third home for the commander's words). trim-critic: 17 findings; the three biggest recurring costs are append-only narratives read every session: the standing-orders list injected at launch (about 2200 tokens), the session log read at start (about 3600 tokens today), and seats recorded twice. Both verdicts: the plan's diagnosis is right and its construction duplicates existing structures. Filed at `notepad/adversary-2026-09-18/`.

## Lessons

- Two independent angles on the same work found different things; neither found the other's. Keep them independent.
- Run the critique before building, as the commander ordered: every high finding was against the plan, not the files.
- The cockpit changed under the critics mid-review; tell critics at dispatch that the ground may move and to re-read before reporting.
