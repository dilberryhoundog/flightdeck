# Crew Quarters

One dossier per crew role. A dossier records: the role, how it works (tools, inputs, outputs), how the pilot dispatches it, where it performs well, where it is stretched or under-performing, and ideas to improve it. Suggest new roles when a gap forms over time.

`crew.json` is the roster. Each entry points at its dossier and records the harness agent type used to dispatch it.

Crew are recruited here from `logs/crew-manifest.json`: when a shape (type, model, purpose) recurs and performs, it earns a dossier. Individual dispatches live in the manifest, not here.

Dossiers are written by the pilot from observed dispatches. A dossier without a `## Observed` section has not yet been used on a mission.
