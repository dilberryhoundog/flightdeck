# Store

The cockpit's reference store: what the paperwork tools in `../bin/` read to know what an identifier means, which files may be touched, and which references are real. Four JSON files, each carrying a `kind` field naming what it is. Data only — no logic lives here.

Stage A of the paperwork check (T011, mission M001, DS006, request P013). Read by `../bin/cockpit-check` and `../bin/cockpit-rename`.

## The files

- **`prefixes.json`** (`cockpit-prefix-table`) — one row per identifier prefix, and a row is the whole truth about that prefix including its future. Each row carries the prefix, the kind's name in full, whether it is addressed by ID, by name or by both (O053), its one minting register, its number range, its state and its succession. Beside the rows: `known_gaps` (ids never minted and never to be backfilled) and `planned_ids` (ids a live document proposes that nothing has minted yet, each sourced to the document proposing them).
- **`zones.json`** (`cockpit-zone-map`) — which files are read, and how far what is found in them may be written. An ordered rule list, first match wins, most specific first. Every pattern is keyed on a path below room level, never on a top-level room name, and rooms are listed from the filesystem at run time rather than from any typed list.
- **`fields.json`** (`cockpit-field-map`) — per JSON document kind, the fields expected to hold a whole-value reference and the fields never scanned at all. Also the quoted-span rule, which is a tier rule rather than a read rule.
- **`paths.json`** (`cockpit-path-map`) — path renames awaiting repair, ruled-but-absent paths that are not findings, and roots that live outside this branch.

## The rules the store encodes

**Zones decide what is read; tiers decide what may be written.** Keeping them apart is the point: an id the checker does not read is an id the rename tool does not rewrite, so suppressing a read hides a stale reference from both tools at once. The standing rule that follows: **a false finding is cured at its source, or by a declared row here, never by not reading.**

**A prefix has exactly one minting register per range segment.** `P` is the only prefix with two segments, because the commander reassigned it: below 101 is a request, from 101 a procedure. The checker reports a second register it finds on disk.

**Today's set and the ruled set live in one table**, separated by `state`, so nothing has to be rewritten when the identifier pass runs:

- `live` — ids are minted and a citation must resolve against the register.
- `planned` — ruled but nothing minted yet; `register` is null and a citation is a note, never a finding.
- `retired` — no successor, ever (`C`). Resolves against its frozen register only; the rename tool refuses it outright, so a pass can never acquire a `C` rule and rewrite frozen history.
- `superseded` — the rename has already run; the prefix resolves only in frozen and scratch, every live hit is a finding, and the rename tool refuses it. This is what stops a finished pass being run twice, which `retired` cannot express because `C` never had a successor and `DS` has used one.

After the identifier pass the pilot flips `live` to `superseded` and `planned` to `live`. Nothing else in the table changes.

**Three declarations, one table.** `renamed`, `retired` and `reassigned` are a derived view of the `succession` column, not a second file. `cockpit-rename` consumes only the derived subset — the rows with a real successor, range-qualified — so it cannot pick up the retired `C` row or turn `P101` into `Rq101`.

**The zones.** `live` is checked and repairable. `scratch` and `excluded` are never opened. `frozen` and `commander-verbatim` are read and reported but never proposed, because a renamed id inside the commander's own words falsifies them. `commander-reviewed` is read, reported, and every occurrence in it is proposed as a diff and never applied, whatever its shape: the commander sees the diff of their own files before it lands, and the pilot applies it by hand.

`excluded` covers two things. `base/bin/fixtures/` holds broken references, stale ids and a second register planted on purpose; `base/` is otherwise live, so without the rule the fixtures would bury the real findings, fake a two-register fault and be silently repaired by an `--apply` run. The rule is root-relative, so it hides the suite when the tools run against the real cockpit and does not blind the suite to its own tree when they run against a fixture root. `base/store/` is excluded because the store is the map and not the territory: it records stale paths in `renames` and absent paths in `planned`, so scanning it for those absences is circular. The store is validated instead by the checker's store checks, which read it directly.

**Declarations are checked for rot.** A `planned_id` that has since been minted, a `planned_id` whose `source` no longer resolves, a `planned` path that now exists, and a field declared `whole_value` that holds references without being one — each is reported, so the store cannot quietly go stale.

## Changing the store

A row here is data the tools obey, so a wrong row is a wrong tool. Add or change one only with the measurement that justifies it, and run `python3 ../bin/test_cockpit_check.py` and `python3 ../bin/test_cockpit_rename.py` afterwards. `cockpit-check` reports a broken store as exit 2 and attempts no scan.
