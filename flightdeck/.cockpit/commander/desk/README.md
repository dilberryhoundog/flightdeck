# The Commander's Desk

The exchange between the pilot and the commander, in files. The commander opened this room on 2026-09-18.

- `in-dossiers/` — what the pilot puts on the desk: recon distilled into a human-readable dossier, `Ds###.md`, indexed in `MANIFEST-dossiers.json`. See `in/dossiers/README.md` for the dossier shape.
- `in-requests/` — the pilot's requests, `Rq###.md`, indexed in `in/requests/MANIFEST-requests.json`; `done/` holds the executed and withdrawn.
- `out-advice/` — the commander's written rulings, one file per round of advice, `CA###.md`, indexed in `MANIFEST-commander-advice.json`, whose rows say which dossier and requests each file answers. The pilot records each ruling in `../decisions/MANIFEST-decisions.json`, marks the requests, and acts. Advice here outranks anything the pilot inferred.

The pilot reads `out-advice/` at session start for anything not yet acted on.
