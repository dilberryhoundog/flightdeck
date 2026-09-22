# Commander

The commander's interface to the pilot. Everything that passes between them in writing.

- `desk/in/dossiers/` — recon distilled into a dossier for the commander to read, `Ds###.md`.
- `desk/in/requests/` — what the pilot asks for, `Rq###.md`, with `done/` for the executed and withdrawn.
- `desk/out/advice/` — the commander's written rulings, `CA###.md`. These are the commander's own words and no agent edits them.
- `ideas` — the commander's raw idea files, his own words, never edited.
- `orders/` — every dated statement from the commander, one unit per order under `MANIFEST-orders.json`. The `text` of an order is verbatim and is never edited.
- `decisions/` — what was settled and by whom, one unit per decision under `MANIFEST-decisions.json`.

The flow: recon stays raw in `../records/notepad/`; the pilot distils it into a dossier; the dossier raises requests; the commander approves, denies or amends; the decision is recorded here and crew execute.
