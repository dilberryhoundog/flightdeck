# Schemas and the linter: what was built

Seat `schema-builder`, team T014, mission M001, 2026-09-20. Everything built sits under `base/verify/` and nowhere else. No commits, no git command that changed state.

## Document types beside their schema files

Markdown, keyed on frontmatter `type`:

- Dossier — `base/verify/schema/dossier.json`
- Request — `base/verify/schema/request.json`
- Commanders Advice — `base/verify/schema/commanders-advice.json`
- Mission — `base/verify/schema/mission.json`
- Spark — `base/verify/schema/spark.json`
- Procedure — `base/verify/schema/procedure.json`
- Manual — `base/verify/schema/manual.json`
- Crew Dossier — `base/verify/schema/crew-dossier.json`
- Officer — `base/verify/schema/officer.json`

JSON, keyed on `kind`:

- every manifest (`kind` is the collection: dossiers, requests, commander-advice, dispatches, orders, decisions, workshop, rosters, missions, sparks, procedures, manuals, topics, crew) — `base/verify/schema/manifest.json`
- dispatch — `base/verify/schema/dispatch.json`
- order — `base/verify/schema/order.json`
- decision — `base/verify/schema/decision.json`
- workshop-item — `base/verify/schema/workshop-item.json`
- roster — `base/verify/schema/roster.json`
- topic — `base/verify/schema/topic.json`
- logs (the session log index) — `base/verify/schema/log-index.json`

Seventeen schemas for seventeen document types. The linter is `base/verify/cockpit-lint`, 324 lines, one file, no `package.json` and no install; the engine is `base/verify/lib/schema-lib.mjs` and `output.mjs`, copied from flightcrew branch `flightcrew-core` at commit `27f6969`, each stating its origin and its one change in its header. `base/verify/README.md` says how to run it and how to add a type.

## Bytes printed

- A clean run: 18 bytes, one line — `ok: 4 files clean`.
- A failing run over the three desk documents as they stand, ten faults in three files: 1822 bytes on stderr. One of those files alone, five faults: 882 bytes.

## What today's documents fail on

These are the refit's to-do list, taken from the files as they stood at the restore point `4ecfaf6`.

DS001, five faults: `stamp` on line 4 is a comma list; `generates` on line 7 is a comma list; `stamp` is therefore missing; `unit` is `DS001`, which is not `^Ds[0-9]{3}$`; `context` is a string holding a path, where the schema wants a bracketed list of identifiers, a dossier's being its dispatch.

P004, three faults: `status` on line 4 has no value; `recorded` on line 5 has no value and is the retired name for `stamp`; `type` is `Proposal`, which no schema answers to. Once its `type` becomes `Request` the remaining faults surface: `status` and `stamp` missing, `context` a string rather than a list.

CA001, two faults: `context` missing, `stamp` missing. Its `type` and `unit` already pass.

## What the mini-spec rules that a schema cannot express

- That a `context` or `generates` identifier resolves to a document that exists. A schema checks the form of an identifier, never that the thing is there. That is a reference check, which the brief puts out of scope.
- That no fact is held in both a bolded block under the title and the frontmatter. The frontmatter is all the linter reads of a markdown file; the body is not its business.
- That dispatch numbers are counted across the whole team space without a gap or a repeat. Sequence and uniqueness live across files, not inside one.
- That a manifest and its units agree — that every unit has a row and every row a unit. Cross-file again.
- That a manifest row "carries enough to choose a unit". Approximated by requiring a `path` and either an `id` or a `name`; the judgement itself is not checkable.
- Room and file placement. Deliberately so: the schemas key on the document's own `type` or `kind`, never on a path, so a room move costs them nothing.

## Where the sources were silent and I chose

Stated as mine, not the commander's.

1. **How a schema declares what it answers to.** Each schema carries an `x-select` list of the `type` or `kind` values it covers. The engine ignores the keyword; the linter reads it. This is what makes adding a type one file and nothing else, and it keeps manifests on one schema although each carries a different `kind`.
2. **The session id is eight lowercase hex characters**, in `stamp` and in every `session` field. Taken from the log file names.
3. **Closed vocabularies.** request `status` (open, approved, denied, amended, withdrawn); mission `status` (planned, in_progress, closed); procedure `status` (draft, active, retired) and `trigger` (on-demand, named, periodical); spark `heat` (cold, warm, hot); workshop `status` (open, swept, fixed, dropped); dispatch `status` (dispatched, finished, abandoned); decision `by` (commander, pilot); crew `room` and `model`. Drawn from the words the files use today, but the closing of each list is my choice.
4. **`additionalProperties: false` on markdown frontmatter**, so a stray field is a fault, since a frontmatter block is small and fixed. Left open on JSON units and manifest rows, where a collection may carry its own extra columns.
5. **The type words.** Markdown `type` is the document's name in title case (`Dossier`, `Crew Dossier`); JSON `kind` is lowercase (`dispatch`, `workshop-item`), and a manifest's `kind` is its collection word, which is what the file name check compares against.
6. **Session logs get their own schema** rather than the manifest one: a log row has neither an identifier nor a name, only a date and a session. Its file is still `MANIFEST-logs.json` with `kind: "logs"`, so the naming check holds.
7. **A manual carries no `unit`.** It is filed by name and looked up by its topic, never referred to by number. The mini-spec's `unit` rule covers ID-based work and desk documents and crew and officer dossiers; manuals are neither.
8. **A mission carries no `work`.** It is the work; `work` on every other type points at it.
9. **`crew.json` and the rosters manifest use the one manifest schema**, their rows keyed by `name` instead of `id`.

## One thing for the pilot to rule on

The brief gave two different exit conventions: "mirror flightcrew's exit codes", and "exit 0 clean, 1 faults, 2 tool error". Flightcrew's are 0 ok, 1 usage or environment error, 2 failed check. I followed the explicit line — 0 clean, 1 faults, 2 tool error — and renamed the copied `EXIT` members to `faults` and `toolError`, saying so in `output.mjs`'s header. If the house convention is to win instead, it is a three-line change in that file and two call sites.

If `node` is not on the PATH the shebang fails with the one line `env: node: No such file or directory` and status 127, which is the shell's, not the linter's.
