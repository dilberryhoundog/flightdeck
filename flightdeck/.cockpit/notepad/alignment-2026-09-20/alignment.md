# Alignment — what the commander advised against what was built

T013, mission M001, 2026-09-20, by `alignment-judge`. Inputs: `advised.md` (advice-reader), `built.md` (build-reader), checked against `quarters/commander/orders.json` O044–O056, `commanders-desk/out-ideas/`, `base/decisions.json` D026–D027, `base/store/`, `base/bin/`, `notepad/stage-a-2026-09-20/spec.md` and `plan.md`, DS006 and P013.

## 1. The mapping

A1 (schema store specifying document shapes, in base, callable by a linter) — **not delivered.** Nothing built defines a document's shape. `base/store/` holds four files about identifiers, paths, zones and reference fields; build-reader's own closing line confirms "No other store file, tool, or test declares a document's fields or sections."
A2 ("This is just schemas and linters, right?") — **contradicted.** What exists is a reference-integrity checker (B7), a migration tool (B8), a 740-line shared library (B6) and 800 lines of table tests over a 32-file fixture tree (B9–B11).
A3 (documents have a defined shape so a new session writes a document the way you write one) — **not delivered.** A new session writing a dossier today still has no shape to write to; `cockpit-check` would not notice a dossier with no frontmatter, no sections and no header.
A4 (set up a schema store) — **not delivered.** The directory `base/store/` exists and carries the name; its contents are an identifier and path map, not schemas.
A5 (stored in base, callable by a linter) — **partly delivered.** The location and the data-driven shape are right (B1–B4 are data, B6–B8 are logic); the data is the wrong subject.
A6 (flightcrew's schema-checking assets already built; the spec builder's linter and rubric checkers) — **not delivered, and explicitly excluded.** `spec.md` line 23 puts "the Node engine (stage B)" out of scope; nothing in the build reuses `checks/lib/schema-lib.mjs` or the ten schemas beside it.
A7 (a linter so pilots have their paperwork in order) — **partly delivered.** A linter exists and runs in ~1s, but it lints references, not paperwork shape.
A8, A9 (non-blocking; small output on success; on error enough guidance to fix by a small edit without a tool call) — **partly delivered.** The finding format is exactly right (`file:line kind what -> exact replacement`) and a clean run is 57 bytes. Today's actual run against the real cockpit is 12,915 bytes, 79 findings across 25 files: not a small edit, and not non-blocking in effect.
A10–A14 (consistent frontmatter, fields consistent across document types, searchability, `stamp`, `context` as chain position) — **not delivered.** `spec.md` line 11: "Parses no YAML and no frontmatter." This is the core of A1 and none of it was built.
A12 (a line in CLAUDE.md on searchability and metadata conventions) — **not delivered;** `spec.md` line 23 bars editing `CLAUDE.md`.
A15–A17 (id shape, 1–3 letters, three digits, each ID named in CLAUDE.md) — **partly delivered.** `prefixes.json` (B1) encodes the shape and the regex derives from it (B28); the CLAUDE.md listing was not written.
A18–A22 (P→Rq, DS→Ds, De, Sp, Or, WS, C retired) — **partly delivered.** Every rename is encoded as a `succession` row with a `state` (B1, B26), and the tool to execute it exists (B8), but the pass has not been run: the prefixes are still `planned` and the cockpit still carries the old set.
A23 (accumulating items get an ID only; permanent things get a name) — **partly delivered.** `addressed: id|name|both` is a column in B1 and a name is treated as a link target; nothing renames files to ID-only.
A24–A31 (MANIFEST-<collection> naming, manifest→unit flow, one global dispatch register, teams vs dispatch) — **not delivered.** `MANIFEST-*.json` appears once, as a `planned` path in `paths.json` (B4) so that citing it is not a finding. A31 is honoured nowhere.
A32–A40 (the room structure: `records/manuals/`, `work/`, `team/`, `records/notepad/`, `extracts/`, keep files as placeholders) — **not delivered, by design.** The ruled-but-absent rooms sit in `paths.json.planned` (B4) so citations of them are notes; `zones.json` (B2) pre-declares `records/notepad/**` as scratch. The move itself is scheduled after the identifier pass.
A41 (idea team with the commander in the room, then a dossier, then a refactor team) — **delivered.** T010 ran, DS006 was written, P013 raised.
A42 (send a quick team to check alignment) — **delivered.** This team.
A43 (run the mini adversaries for fit and trim) — delivered; deliberately not read here.
A44, A45 (the pace of the room; the commander's question lost in the transcript) — **partly delivered.** Rule 12 was written into CLAUDE.md; A44 says it did not hold on this occasion.
A46 (M, WS, P for work; procedures as key references) — **partly delivered** as a prefix convention in B1; the `work/` room is not built.
A47 ("a much larger test system we have to maintain each time something changes") — this is the commander's own reading, and section 4 tests it.

## 2. The reverse: what was built that answers nothing advised

B7 `cockpit-check`, the reference checker (470 lines) — **the pilot's ruling.** DS006 introduces it as evidence-led, not as an answer to A1; the commander never asked for a reference checker.
B8 `cockpit-rename`, the migration tool (513 lines) — **the pilot's ruling**, DS006 "Three tiers for any repair" under the heading "By the pilot, yours to overturn", carried into P013's Proposal.
B6 `cockpit_store.py` (740 lines, the largest single file) — **the builder's addition.** `spec.md` line 27's write boundary enumerates the store, `cockpit-check`, `cockpit-rename`, the two test files, the fixtures and two READMEs. `cockpit_store.py` is not among them; it was created to hold logic shared by two tools that the commander did not ask for.
B9, B10, B11 the two table tests and the 32-file fixture tree (800 lines of test, 1,382 fixture lines) — **the pilot's specification**, `spec.md` item 4, which lists eleven mandatory cases. DS006 line 63 states the choice plainly: "A checker, two tables and a field map is real code with tests."
B2 `zones.json` — **a team finding turned into a ruling.** DS006: both the option-maker and the adversary made a zone error while counting, so zones became a stored table.
B4 `paths.json` `planned`/`external` — **the builder's addition** from the plan's false-positive measurement (plan lines 8, 42); it exists to stop the checker reporting things the commander has ruled but not yet built.
B17 store-rot detection, B18 quoted-span tier pinning, B24 the ordering gate, B25 the two-step case rename, B27 `--from FILE` — **the builder's and the adversary's additions** across plan passes 1–3; none traces to any advised item.
B16 second-register detection — **traces to advice** (O051, "every prefix has exactly one minting register"), one of the few capabilities that does.

## 3. Where the drift happened

The turn is one sentence, DS006 line 11: "what the cockpit lacks is anything that checks its own paperwork ... So one thing comes before everything else: a reference checker with a small table of prefixes and zones, written in shell and Python, needing no engine and no further answers from you except who may build it."

"Paperwork" is the commander's word from O045, where it means document shape ("so we can specify document shapes ... so pilots have their paperwork in order"). In that sentence it is redefined to mean reference integrity, and the redefinition is never surfaced as a change.

The second step seals it, DS006 line 33: "Stage A (prefix table, zone and field map, reference checker) ... Stage B (document shapes)". What the commander advised is now stage B, behind a stage A he did not advise.

The third step removes the question. DS006's "Decisions that are yours" opens: "**Who builds it. This one blocks the start, and P013 is where you answer it: approve, deny or change.**" The *what* is presented as settled by pilot ruling and only the *who* is put to the commander, which is the question he answered in D026. He amended the route and never ruled on the substance.

The fourth step makes it explicit, `spec.md` line 23: "Not in scope. ... Any schema validation, frontmatter, or the Node engine (stage B)." The thing advised is named as the thing excluded.

## 4. The maintenance question

**When a room moves** (the very next refactor step, per DS006's closing): edit `zones.json`'s nine path rules (B2), all seventeen `match` globs in `fields.json` (B3), the ten register `file` paths in `prefixes.json` (B1), and `paths.json`'s `planned`/`external` lists (B4). Then the fixture tree, which is a miniature cockpit mirroring today's rooms, must be moved to match (B11, 32 files), and both test files re-checked: they carry roughly 34 hard-coded path literals plus `line_of(...)` needles that must still find their line (B9, B10, stated in build-reader's own "to keep working" lines). The tools themselves are data-driven and need no edit — that part of the design is sound.

**When a prefix changes:** one row in `prefixes.json` (B1), and after the pass a `live`→`superseded`, `planned`→`live` flip. The regex derives from the table (B28) and `add_prefix` needs editing only for a new succession type (B26). This is genuinely cheap and is the build's best work. The cost is in the tests: the prefix-specific cases (reassignment, retired/superseded refusal, digit anchoring) carry fixture ids that move with it.

**When a new document type appears:** one entry in `fields.json` (B3), one row in `prefixes.json` if it is ID-bearing (B1), plus a fixture file and a test case for coverage (B11, B9). And after all of that the new type still has no defined shape — the thing A1 and A3 asked for — because nothing in the build can express one.

**What the commander's own idea would have required for the same three changes.** A room move: nothing, or one path field per schema, because a document's shape is keyed on its type, not on where it lives. A prefix change: one field naming the prefix, in the schemas that cite it. A new document type: one new schema file, and the linter picks it up. No fixture tree, because the cockpit's own documents are the fixtures — a schema that a real dossier fails is a finding, not a test to maintain.

So the commander's instinct in A47 is correct, and the reason is structural: what was built is keyed on the cockpit's paths, registers and fields, so every structural change ripples through the store, the fixtures and the cases. What he advised is keyed on document type, which is the one thing a room move does not touch.

## 5. Verdict

No — what was built does not deliver what the commander advised; it delivers a prerequisite the pilot ruled in its place, and A1, A3, A4, A6 and A10–A14 are not delivered at all.

The parts that do align are the location and data-driven shape of the store (A5), the identifier table as data (A15–A23), the finding format (A8), and the build team writing inside the cockpit (D026).

The drift was not concealed — it is written plainly in DS006 and in `spec.md` line 23 — but it was never put to the commander as a choice; only "who builds it" was, and that is what he answered.

The smallest thing that delivers what he actually advised: `base/store/shapes/<type>.json`, one file per document type naming its required frontmatter keys and required sections, plus a `cockpit-lint <file>` that reads it and prints one line on success and one actionable line per miss — reusing flightcrew's `schema-lib.mjs` behind a wrapper that finds node or fails clearly (A6), or roughly 120 lines of Python if not.

That needs no fixture tree and no table test: the cockpit's own documents are the corpus, a document that fails is a finding, and a new document type costs one file. Stage A can stand as built, be deferred, or be reduced to `cockpit-check` alone — but it is a separate question from the one the commander asked.
