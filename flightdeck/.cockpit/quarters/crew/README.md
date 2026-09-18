# Crew Quarters

One dossier per crew role. A dossier records: the role, how it works (tools, inputs, outputs), how the pilot dispatches it, where it performs well, where it is stretched or under-performing, and ideas to improve it. Suggest new roles when a gap forms over time.

`crew.json` is the roster. Each entry points at its dossier and records the harness agent type used to dispatch it.

Crew are recruited here from the team records in `../../dispatch/`: when a seat shape (agent type, model, purpose) recurs across team files and performs, it earns a dossier. Dispatches before the dispatch room are in the frozen `../../logs/crew-manifest.json`. Individual dispatches live in the manifest, not here.

Dossiers are written by the pilot from observed dispatches. A dossier without a `## Observed` section has not yet been used on a mission.
- `spec-builder.md` — the spec-builder role, with a `## What to watch for` section (altitude, interfaces, constraints, invented mechanisms) so the pilot can judge a spec-builder's writing.
