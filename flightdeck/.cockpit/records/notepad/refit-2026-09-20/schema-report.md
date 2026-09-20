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
- Officer Dossier — `base/verify/schema/officer.json`

JSON, keyed on `kind`:

- every manifest (`kind` is the collection: dossiers, requests, commander-advice, dispatches, orders, decisions, workshop-items, rosters, missions, sparks, procedures, manuals, topics, crew) — `base/verify/schema/manifest.json`
- dispatch — `base/verify/schema/dispatch.json`
- order — `base/verify/schema/order.json`
- decision — `base/verify/schema/decision.json`
- workshop-item — `base/verify/schema/workshop-item.json`
- roster — `base/verify/schema/roster.json`
- topic — `base/verify/schema/topic.json`
- logs (the session log index) — `base/verify/schema/log-index.json`
- branches (the branch register) — `base/verify/schema/branch-register.json`

Eighteen schemas for eighteen document types. The linter is `base/verify/cockpit-lint`, 324 lines, one file, no `package.json` and no install; the engine is `base/verify/lib/schema-lib.mjs` and `output.mjs`, copied from flightcrew branch `flightcrew-core` at commit `27f6969`, each stating its origin and its one change in its header. `base/verify/README.md` says how to run it and how to add a type.

## Bytes printed

- A clean run: 18 bytes, one line — `ok: 4 files clean`.
- A failing run over the three desk documents as they stand, ten faults in three files: 1848 bytes on stderr. One of those files alone, five faults: 908 bytes.

A comma-list fault shows the writer's own field and own items with the brackets put round them, so the fix is copied straight off the line: `generates on line 7 is a comma list; expected brackets around the items, as generates: ["P004", "P005", "P006", "P007"]`.

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
3. **Closed vocabularies.** request `status` (open, approved, denied, amended, withdrawn); mission `status` (planned, in_progress, closed); procedure `status` (draft, active, retired) and `trigger` (on-demand, named, periodical); spark `heat` (cold, warm, hot); workshop `status` (open, swept, fixed, dropped); dispatch `status` (in_flight, finished, abandoned); decision `by` (commander, pilot); crew `room` (flightcrew, cockpit, general), `model` (haiku, sonnet, opus, fable) and `status` (active, superseded); branch `status` (live, merged, abandoned, frozen). Drawn from the words the files use today, but the closing of each list is my choice. Two dispatch rows in `cockpit.json` carry a qualified status, "finished; records await the commander's ruling on Rq009", which the enum refuses: the qualification belongs in `outcome`.
4. **`additionalProperties: false` on markdown frontmatter**, so a stray field is a fault, since a frontmatter block is small and fixed. Left open on JSON units and manifest rows, where a collection may carry its own extra columns.
5. **The type words.** Markdown `type` is the document's name in title case (`Dossier`, `Crew Dossier`); JSON `kind` is lowercase (`dispatch`, `workshop-item`), and a manifest's `kind` is its collection word, which is what the file name check compares against.
6. **Session logs get their own schema** rather than the manifest one: a log row has neither an identifier nor a name, only a date and a session. Its file is still `MANIFEST-logs.json` with `kind: "logs"`, so the naming check holds.
7. **A manual carries no `unit`.** It is filed by name and looked up by its topic, never referred to by number. The mini-spec's `unit` rule covers ID-based work and desk documents and crew and officer dossiers; manuals are neither.
8. **A mission carries no `work`.** It is the work; `work` on every other type points at it.
9. **`crew.json` and the rosters manifest use the one manifest schema**, their rows keyed by `name` instead of `id`.
10. **There is no markdown Workshop Item type.** The mini-spec makes WS a JSON unit, so notes go in that unit's `notes` field rather than a `WS###.md`. The `file` column in today's `workshop.json` belongs to the single-file design the refit is replacing.
11. **`logs/branch-manifest.json` got a schema** (`branches`) although no source named it: it is a JSON register that would otherwise have had no shape. It is a register of git branches rather than of documents, so its rows carry no `path` and the general manifest schema does not fit.
12. **The branch register's `status` is prose, not an enum.** I first closed it to live|merged|abandoned|frozen; the refitter showed that all 16 rows use prose about where a branch stands ("candidate with the suite merge", "ancient; ancestor of no flightcrew branch") and that mapping those onto four words is a judgement about the repository, not a clerical refit — a "candidate" row filed as "merged" would licence deleting a branch whose commits are contained nowhere above. The machine-readable fact is `merged_higher`, and absent means unknown, which is not safe to delete on.
13. **A manifest row may carry `superseded_by` in place of `path`.** A row satisfies one of id+path, name+path, id+superseded_by or name+superseded_by. The crew row `records-writer` has no dossier to point at, and pointing at `record-writer.md` would name a different seat.
14. **A unit filed by name carries `name`, one filed by identifier carries `id`,** and its manifest row uses the same word. Topics and rosters are the two on `name`. `topic.json` first required `id` for a slug its manifest row called `name`; the refitter caught the disagreement.
15. **`decision.json` carries `requests` as a list, always,** replacing a singular `request`: De012 answers three. `by` is restricted to commander or pilot, with `source` holding where it was said; `superseded_by` on orders and decisions holds the identifier and nothing else, with `superseded_note` for the prose.
16. **Request `status` is the cockpit's own lifecycle,** awaiting|approved|amended|denied|executed|withdrawn|superseded, not the open|approved|denied|amended|withdrawn I invented. `base/README.md` documents the lifecycle and the thirteen requests use awaiting, executed and superseded, which carry facts none of my five could.
17. **A spark's `heat` is heat only.** Two of the ten sparks held "ran" and "folded into Sp009" in the heat field, which are states, not temperature. `spark.json` gained an optional `status` (live|ran|folded|promoted, absent meaning live), with the target in `generates`. Separately, "cool" on two sparks is drift from the README's "cold" and is workshop item WS001.
18. **A manual carries either a `source` or `stub: true`.** Five of the ten manuals are stubs, whose header form is "existing knowledge only, not validated, not to be cited as authority" — a stub has no source by definition, and requiring one would have meant inventing five.
19. **Left without a schema, deliberately:** `base/settings/pilot.settings.json` and `base/store/*.json` (tools, not documents, and pinned for removal), `logs/crew-manifest.json` (frozen history), and everything that carries no frontmatter — READMEs, session logs, the notepad, `*.keep` files and the commander's idea files.

## Two faults found in the linter itself

Both surfaced by the refitter's stub case, both fixed and verified.

- The frontmatter reader had no booleans, so `stub: true` read as the string `"true"` and failed against a boolean schema. A bare `true`, `false` or number is now that value, as it would be in JSON; quote it to mean the word or the digits. `recurring: true` on a workshop item would have hit the same wall.
- A schema-wide `anyOf` reported the schema's entire description as the expected form, a paragraph on one fault line. A schema that rules the document as a whole now carries a one-clause `x-expect`, and that is what the fault line quotes.

## Exit codes, settled

The brief gave two conventions. The commander's order is that the linter mirrors flightcrew's, so flightcrew's codes stand: 0 clean, 2 a failed check, 1 a usage or environment error. `output.mjs` is now unchanged from the original but for its header, and `cockpit-lint` returns `EXIT.blocked` on faults and `EXIT.usage` on a bad invocation.

If `node` is not on the PATH the shebang fails with the one line `env: node: No such file or directory` and status 127, which is the shell's, not the linter's.
