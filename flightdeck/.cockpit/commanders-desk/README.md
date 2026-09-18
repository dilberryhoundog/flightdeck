# The Commander's Desk

The exchange between the pilot and the commander, in files. The commander opened this room on 2026-09-18.

- `in-dossiers/` — what the pilot puts on the desk: recon distilled into a human-readable dossier, `DS###-slug.md`, indexed in `dossiers.json`. See `in-dossiers/README.md` for the dossier shape.
- `in-proposals/` — the pilot's proposals, `P###-slug.md`, indexed in `../base/proposals.json`; `done/` holds the executed and withdrawn.
- `out-advice/` — the commander's written rulings, one file per dossier, `DS###.md`. The pilot records each ruling in `../base/decisions.json`, marks the proposals, and acts. Advice here outranks anything the pilot inferred.

The pilot reads `out-advice/` at session start for anything not yet acted on.
