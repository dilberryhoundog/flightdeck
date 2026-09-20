# Work

What is being done. The pilot's work, at every size.

- `missions/` — epic work. The current and horizon missions, `completed/` for closed ones, and `incubator/` for sparks that may become missions. The split between the two is in `missions/README.md`.
- `workshop/` — fixes, problems and recurring maintenance: back-at-base work, not missions. `MANIFEST-workshop-items.json` is the register.
- `procedures/` — the cockpit's logic engine: pre-recorded routines matching a roster with tasks, context and steps, so repeated work is not re-prompted each time. `triggers.md` is the manifest the pilot loads; `MANIFEST-procedures.json` is the index.

Missions, workshop items and procedures all carry an identifier: M, WS and P.
