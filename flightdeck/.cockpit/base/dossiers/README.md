# Dossiers

Recon distilled for the commander's desk. A crew's recon is raw and stays in `../../notepad/` for as long as it is worth mining. A dossier is the pilot's own distillation of the parts the pilot judges worthy: human-readable, short enough to read in one sitting, every claim traceable to the notepad report it came from. The commander reads the dossier instead of collating the recon, advises on the fly if they were looking for something different, and the dossier boils down into proposals in `../proposals/`, which the commander approves, denies or changes. Commander's advice, 2026-09-18: the pilot now holds the role the commander used to hold, deciding from an understanding of the flightcrew system; the commander sits one rung higher, dispensing orders and advice. So the pilot distils and proposes; the commander rules.

`dossiers.json` is the index. Each dossier is `DS###-slug.md`.

## Dossier shape

- Header: id, title, written on, from which recon (notepad folder), mission, proposals arising.
- The situation: what the recon found, in the order a commander needs it, not the order the crew reported it.
- What the pilot recommends: the proposals, each one line with its P id.
- Where the detail is: which notepad file answers which question.
