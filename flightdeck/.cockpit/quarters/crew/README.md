# Crew Quarters

Dossiers on every agent the pilot has dispatched, so a seat can be repeated, replicated or improved. `crew.json` is the manifest across all crews. Three rooms:

- `flightcrew/` — flightcrew's own crew, the roles that fly launches (spec-builder, explorer, and the rest as they are dispatched). Each dossier carries a `## What to watch for` section so the pilot can judge the role's output.
- `team/` — the seats the pilot's teams use: readers, writers, critics, adversaries, verifiers.
- `general/` — harness-provided agents used as they come: the docs guide, the doc reviewer, Explore subagents.

Dossier shape: title (the seat name), one purpose line, `## How to dispatch` (scope, boundary, report form: enough to spawn the seat from), `## Record` (at most a sentence or two of evidence), `## Next time` (the instructions). Identity (agent type, model) lives in `crew.json` only; teams flown are derived from `../../dispatch/cockpit.json`. Flightcrew dossiers add `## What to watch for`. A proposed new role is a row in `crew.json`'s `proposed` list until it is dispatched. A seat earns a dossier the first time it is dispatched, and the dossier is updated after every team it flies in. Favourite combinations of seats are rosters in `../../dispatch/rosters.json`. `crew.keep` is the commander's note for this room.
