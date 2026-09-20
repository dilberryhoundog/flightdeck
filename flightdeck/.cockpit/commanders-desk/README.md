# The Commander's Desk

The exchange between the pilot and the commander, in files. The commander opened this room on 2026-09-18.

- `in-dossiers/` — what the pilot puts on the desk: recon distilled into a human-readable dossier, `Ds###.md`, indexed in `dossiers.json`. See `in-dossiers/README.md` for the dossier shape.
- `in-requests/` — the pilot's requests, `Rq###.md`, indexed in `../base/proposals.json`; `done/` holds the executed and withdrawn.
- `out-advice/` — the commander's written rulings, one file per dossier, `CA###.md`. The pilot records each ruling in `../base/decisions.json`, marks the requests, and acts. Advice here outranks anything the pilot inferred.

The pilot reads `out-advice/` at session start for anything not yet acted on.
