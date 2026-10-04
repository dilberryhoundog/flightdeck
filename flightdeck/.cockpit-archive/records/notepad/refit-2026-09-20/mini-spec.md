# Cockpit refit: mini-spec

Mission M001, dispatch T014, session `pilot` (Ace), 2026-09-20. Ordered by the commander in O057. The commander's own words are the standard: `notepad/alignment-2026-09-20/advised.md` lists them with sources (A1 to A47), and its Part 2 lists rulings that are the pilot's and must not be read as his. Restore point: commit 4ecfaf6.

## Mini-spec

### Goal
- The cockpit takes the shape the commander sketched and confirmed: documents have a defined shape a new session can write to, checked by a basic linter; identifiers, manifests, frontmatter and rooms follow his conventions. He will judge the result as decent or rebuild.

### Scope in
- `base/verify/schema/<type>.json`, one JSON Schema per document type, one for every document type that exists today, fields drawn from what those documents carry, expressed in the commander's conventions. A schema describes the intended shape: new files pass; old files fail and are refitted until green (O058). `base/verify/cockpit-lint`, a basic linter that mirrors flightcrew's: Node, built on flightcrew's own dependency-free engine (`checks/lib/schema-lib.mjs` and `output.mjs`, copied from branch `flightcrew-core` with their origin stated in the header; O046, O058), plus a small strict reader for frontmatter. It finds a file's schema by `type` (markdown) or `kind` (JSON), and also checks ID prefix form and manifest naming. Non-blocking: one short line when clean; on error the field, the fault and the expected form, so the fix is a small edit without another tool call.
- Identifiers: DS to Ds, proposals P to Rq (numbers kept), O to Or, D to De, S to Sp, W to WS; M, T, CA unchanged; C retired. P is solely for procedures, numbered from P001. The word "proposal" leaves live documents (requests). Accumulating items are filed by ID alone (`Ds006.md`, `Rq013.md`, `CA001.md`); missions and procedures by ID and name (`M001-cockpit-setup.md`, `P001-forming-a-team.md`); rosters and crew seats by name only.
- JSON data: every manifest is `MANIFEST-<collection>.json`, the collection being the ID's name in full (`MANIFEST-commander-advice.json`, `MANIFEST-dossiers.json`, `MANIFEST-requests.json`, `MANIFEST-dispatches.json`, `MANIFEST-orders.json`), with a `kind` field holding the same word. The single files that hold every unit whole become manifest plus JSON units: dispatches (`T001.json`), orders (`Or001.json`), decisions (`De001.json`), workshop items (`WS001.json`). One dispatch register for the whole team space, team numbers counted across it; units filed in rooms (`records/dispatch/cockpit/T010.json`, `records/dispatch/flightcrew/`), the manifest holding each unit's path. Rosters likewise: `team/rosters/MANIFEST-rosters.json` and one unit per roster, by name. A manifest row carries enough to choose a unit; the unit carries the rest.
- Frontmatter, strict flat YAML (bare value, quoted string, bracketed list): `type`, `unit` on every ID-based work and desk document and every crew and officer dossier (unit is the seat name); `stamp: [date, author, session]`; `work`, `context: [...]`, `generates: [...]` as ids forming the chain (a dossier's context is its dispatch); `status` on requests. A commander's advice file carries four: `type`, `unit`, `context` (the dossier and requests it answers), `stamp`. Bolded metadata blocks under titles are removed once their facts are in frontmatter. Manuals keep their one header line as keys.
- Rooms: `base/` (bin, settings, verify); `commander/` (desk/in/dossiers, desk/in/requests, desk/out/advice, desk/out/ideas, orders, decisions); `records/` (logs, extracts with topics, manuals with claude-code, flightcrew and cockpit, dispatch, notepad); `work/` (missions with incubator, workshop, procedures); `team/` (rosters; crew with flightcrew, general and cockpit; officers with commander and pilot). Every reference, README, the `CLAUDE.md` map, `base/bin/pilot.sh`, `base/bin/session-start.sh` and `base/settings/pilot.settings.json` follow. `CLAUDE.md` gains a two-column table of every ID kind and one line on searchability and metadata conventions.
- A procedure, `P###-writing-a-request`: when a request is written, its advice file is created beside it with the metadata filled (D027).
- Last: `commander/desk/out/ideas/ace_<idea>.md`, one per idea file of the commander's, each his original text followed by his later confirmations quoted with their order ids; the pilot's rulings fenced off at the foot. Written by the pilot.

### Scope out
- Flightcrew and everything outside the cockpit. The guard's logic. The pilot's agent body. Extraction work (`records/extracts/` is scaffolded, topics move in, nothing more). Any permanent test suite or fixture tree. Validating or rewriting the contents of the notepad.

### Constraints
- Never edited, only moved: session logs' text, the `text` of every order, `*.keep` files, the commander's idea files. Old ids and the word "proposal" stay wherever they are history.
- The commander's advice files (CA001 to CA003) are repaired by the pilot, not by crew.
- Git moves (`git mv`), so history follows; a case-only rename goes through a temporary name. No commits by crew: the pilot commits each step after verifying it.
- Small, plain code: the linter is one Node file of a few hundred lines at most beside the two copied engine files, no `package.json`, no install; it finds `node` on the PATH and fails with one clear line if it cannot. Schemas key on document type, never on a path, so a room move costs them nothing.
- The stage A tools in `base/bin/` and `base/store/` are temporary help. They are left in place and pinned for removal as a workshop item (O058).
- The commander's size orders hold throughout: minimal changes; non-blocking; whatever saves the most tokens and reduces churn. No permanent test suite, no fixture tree.

### Decisions already made (the commander's)
- Everything under Scope in. Order of steps is the pilot's: 1 schemas and linter; 2 identifier pass and file renames; 3 JSON manifests and units; 4 frontmatter; 5 room move; 6 cleanup and `CLAUDE.md`. Each step is one commit and revertible alone.

## Verification
- Each step: `git status` shows only intended paths; nothing under Constraints changed (diff of order `text` fields and session logs is empty).
- After step 1: `cockpit-lint` fails the commander's DS001 example on its comma lists with a message naming the line and the fix, and passes a corrected copy; a clean run prints one short line.
- After step 2: a case-sensitive search finds no old-form id and no "proposal" in live documents; every request keeps its number; procedures carry P001 onward.
- After steps 3 and 4: `cockpit-lint` passes on every manifest, unit and typed document; every `context` and `generates` id resolves; no fact is held in both a bolded block and frontmatter.
- After step 5: `base/bin/pilot.sh --check` prints a valid command; `base/bin/session-start.sh` run by hand prints the right mission, log and awaiting lines; `python3 base/bin/test_cockpit_guard.py` passes; every path cited in `CLAUDE.md` and the READMEs exists; a throwaway reference scan (the stage A checker or a short script) shows no unresolved live path.
- Proof that the right thing was built: the number of schemas equals the number of document types in use, listed side by side; a fresh low-cost agent given only a schema and `CLAUDE.md` writes a new dossier and a new request that pass the lint first time; bytes printed by a clean run and by a failing run are reported; the search for old ids excludes order `text`, session logs, the notepad and the commander's idea files.
- At the end: a commander-advocate seat reads only the commander's words and the finished cockpit and lists what he asked for that is missing or different.
