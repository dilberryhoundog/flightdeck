# DS006 — The cockpit's paperwork: identifiers, manifests, frontmatter, rooms and a schema store

- **Written:** 2026-09-20 by the pilot (Ace), session b27e6c01
- **From:** team T010 (`dispatch/cockpit.json` T010); question, three evidence reports, the paper and the adversary's rounds at `notepad/ideas-2026-09-20/`
- **Mission:** M001
- **Proposals arising:** P013 (build stage A by the outside-build route)
- **Numbering note:** this dossier and its proposal carry today's prefixes (DS, P). They are renamed with everything else in the identifier pass, not before it.

## The answer in one paragraph

Your four ideas and the schema store are sound and mostly describe a cockpit that already half exists; what the cockpit lacks is anything that checks its own paperwork. Your three-file rename of the advice left 24 broken references in live files and nothing noticed, the second time that room has done it. The identifier set you ruled touches about 518 live references. So one thing comes before everything else: a reference checker with a small table of prefixes and zones, written in shell and Python, needing no engine and no further answers from you except who may build it. After that the rename is one reviewed, reversible commit, and the shapes, the frontmatter convention, the unfinished manifests and the rooms follow in an order that does not force rework.

## What the evidence showed

- **Drift is the defect, not the grouping.** The map in `CLAUDE.md` places dossiers in `base/`; they are on your desk. `base/proposals.json` indexes files in another room. `logs/README.md` wrongly says the branch manifest is script-generated. The advice rename broke a `superseded_by` field in the topic store. No link check exists anywhere.
- **The migration, measured by zone.** 1,230 raw occurrences of the six changing prefixes: 518 live (509 repairable, 9 inside your verbatim `text` in `orders.json`), 545 notepad scratch, 167 frozen logs and the old crew manifest. By one count of the 518: 175 are whole-value references in live JSON and 56 in the topic index (231), 169 are in markdown and 109 in JSON prose (278), and 9 are your verbatim words. Both the option-maker and the adversary made a zone error while counting, from opposite directions, which is the case for the rule below: zones come from the store, rooms from the filesystem, never from a typed list.
- **A careless repair falsifies the record.** Applied blindly, the rename turns your O048 into "(Or001 is not very readable)". Three decisions (D018, D021, D024) quote you inside the pilot's own summary field. So what a script may touch cannot be decided by file, by field name or by author.
- **Manifest and unit is already the house pattern.** Nine of about seventeen JSON files follow it, though eight point at markdown units and only `logs/topics/` at JSON units. Four files hold everything whole and two grow without bound: `dispatch/cockpit.json` and `orders.json`, about 5.5k tokens each. Anthropic caps its own memory index at 200 lines, a sourced threshold. No manifest says what it is: none carries a `type`, `kind` or `$schema` field.
- **Frontmatter does nothing in the harness** for an ordinary markdown file; its whole value is search and convention. DS001's block does not parse (the comma lists on `stamp:` and `generates:` break the whole block); P004 and CA001 to CA003 do. DS001 holds the same facts three times: frontmatter, bolded block, manifest row.
- **Flightcrew's engine is real and reusable, for the second stage only.** `checks/lib/schema-lib.mjs` and `output.mjs`, 327 lines, bare Node, no dependencies, ten schemas beside them, and the spec-builder's proven routine: validate the shape as you write, lint the whole at the end, both clean before anyone judges. It sits on the buildout-family branches at 93e18c5, not on `cockpit`, and a draft flightcrew-core spec schedules that tree for deletion. It has no YAML parser. Node is a mise install and is absent from a bare system path; Ruby and Python are present, and Ruby's standard library has no JSON Schema validator.
- **Rooms are cheaper to move than they look.** The guard knows only the cockpit root; eleven paths are hardcoded (four in `pilot.sh`, four in `session-start.sh`, three in `pilot.settings.json`). Rooms decouple from identifiers, manifests and frontmatter once nothing is keyed on a path, but not from the lint: a per-room CLAUDE.md that cannot drift depends on stage B, so rooms cannot be scheduled in parallel with it. What cuts the path keys: a `kind` field in each live manifest, and stored paths made cockpit-relative (13 of 17 are structural and scriptable, 4 sit in prose).

## What is ruled

**By you.** The identifier rule: the count of capitals is the count of words, lowercase guides a single-word kind, three digits. The set: work M mission, WS work shop, P procedure; desk Ds dossier, Rq request, CA Commanders Advice; commander Or order, De decision; pilot T team, Sp spark. Proposals become requests. The ideas are ideas; keep files are placeholders; the settled ideas join M001.

**By the pilot, yours to overturn.**
- `C` (crew dispatch ids in the frozen crew manifest) is retired, reserved, never reissued.
- Procedures number from P101, so every P number is decidable by range for good: below 101 is a former proposal, from 101 a procedure.
- The prefix set is an explicit table in the store, one row per prefix (kind, minting register, number range, default zone), because one word or two is a judgement a lint cannot compute. Beside it three declarations: renamed, retired, reassigned.
- Three tiers for any repair. Applied by script: a field whose whole value is one id or one path, in live JSON, and file renames. Proposed by script and applied only after review: every other live occurrence, as a diff a reviewer accepts or strikes hunk by hunk. Never touched: your `text` in `orders.json`, frozen files, scratch.
- The rename lands as one reversible commit with the pre-pass search kept as the proof that no old live id remains; requests keep their numbers; two-step `git mv` for Ds; case-sensitive throughout.
- Stage A (prefix table, zone and field map, reference checker) is shell and Python, parses JSON, scans text, parses no frontmatter. Stage B (document shapes) holds the only frontmatter reader: a strict subset of YAML (bare scalar, quoted string, bracketed list, anything else fails), with DS001 kept as a permanent failing fixture.
- The lint reports. It never regenerates frontmatter; your five hand-edited examples are uncommitted and must not be rewritten.
- Three tiers measured: 231 applied by script, 278 proposed and reviewed, 9 never touched.
- Procedures join missions and workshop under `work/`. You ruled a prefix convention ("M, WS, P for work"), not a room layout, and the grouping comes from your sketch, which is an idea; the pilot reads the one as support for the other and rules it, for you to confirm or overturn.
- The stage B engine is the pilot's to rule when stage B is designed, not a question for you: both options sit inside the cockpit. The lean is flightcrew's Node engine copied into `base/` behind a wrapper that finds node or fails with a clear message, since Ruby's standard library has no JSON Schema validator and the alternative is writing 327 lines again. Nothing in stage A waits on it.
- Manifest filenames do not carry what a `kind` field inside can say; unit files keep id plus slug. The first half of this overlaps question 5 below and gives way to your answer.

## Decisions that are yours

1. **Who builds it. This one blocks the start, and P013 is where you answer it: approve, deny or change.** Rule 1 bars crew from writing in the cockpit and your orders bar the pilot from doing work. The pilot proposes: crew build and test outside the cockpit, adversaries review, the pilot lands the reviewed files into `base/`, the route a crew report already takes into the notepad. The alternatives are the pilot writing it or crew writing inside. The guard cannot be the safeguard in any of them: by its own header it does not see what an interpreter-run script writes. Containment is review, one reversible commit and a printed change list.
2. **Your own advice files.** CA001 to CA003 cite DS001, DS002 and P004 to P009, and CA001 opens on `## DS001`. Frozen, your advice cites names that no longer exist; repaired, the pilot has edited your words. The pilot proposes they are citations, repaired in the reviewed tier, with you seeing the diff of your files before it lands.
3. **What "settling differently than intended" meant.** Nothing on disk states the intended shape, and what you meant by the keep notes cannot be recovered from a file.
4. **The notepad.** Your sketch has no notepad, and it is the largest room: 113 files against 9 in records. Left out on purpose?
5. **Manifest naming.** `MANIFEST-<room>.json` as sketched, `orders/orders-manifest.json` from your idea file, or today's names with a `kind` field inside. The first renames every manifest whenever a room moves.
6. **Who owns a fact.** The pilot leans to what procedures and records already do: the file owns what a reader opening it alone needs (status, date, approval, lineage), the manifest owns the collection (existence, order, links, paths), neither restates the other, bolded blocks go.
7. **Named things.** Rosters, records and crew seats stay named, or get numbers under a prefix that is not C.
8. **How hard the lint bites.** Report only; run by procedure at session end and before a dossier reaches your desk; a commit gate; or a block on write. The pilot leans to the first three and against the fourth.
9. **The word "records".** Your sketch makes it mean anything recorded, with today's records becoming `manuals/`. Rule 2 and your own CA001 rest on the current meaning; 168 references in 47 files.
## Order of change

1. Stage A built by the route you choose; its first job is the 24 references your advice rename left.
2. The identifier pass, as one reviewed commit that stage A verifies.
3. Your answers to 5, 6 and 7, then stage B: shapes, the frontmatter convention on real documents, the `kind` field, the four unfinished manifests split at the 200-line threshold.
4. Rooms last: `work/` first as the cheapest corner, a small CLAUDE.md per room so the map lives where the room does, the rest by your answers to 3, 4 and 9.
5. Carried from your idea files as requirements: a line in `CLAUDE.md` on searchability and metadata conventions, and every ID kind named there.

## What the pilot does not claim

- That 518 is exact. It is a pattern count taken today, and the notepad grew while the team counted. The tiers matter more than the total.
- That the checker catches meaning. It proves a cited id or path exists; it cannot tell that a sentence now says something false, which is why prose goes to a reviewer.
- That stage A is small. A checker, two tables and a field map is real code with tests, and it is the first code the cockpit will depend on daily.
- That one blocker found for the orphan-branch idea is the only one: the guard hardcodes its allowlist while the settings file already exports the cockpit path. The one-line fix is proposed to ride P012's crew-built change to the same file.

## How the team ran

The four seats of the `decision` roster plus one: cockpit-auditor and practice-scout (Sonnet) in parallel, option-maker (Opus) holding the paper through eleven passes, adversary (Opus) held back until the option space was open, then five rounds on the paper, a verdict of fit to distil, and one round on this dossier (seven findings, all taken); assets-scout (Sonnet) was added on your lead that flightcrew already had the assets. You ruled the identifier set in the room as it formed. The option-maker reversed itself four times on evidence and found three of its own defects while idle. The pilot verified the lead claims by parser, git and grep, withdrew one ruling of its own (against Ds, a misreading of your rule), was caught overreaching on manifest naming, and corrected two figures it had given you. Messages between the two Opus seats crossed repeatedly because the pilot relayed findings as they arrived; the cure, naming the pass under attack and freezing it, goes into the forming-a-team procedure.

## After the dossier: the commander in the room (O050, 2026-09-20)

The commander pointed out that the team was settling ideas without consulting the idea maker. The pilot had run a process around the commander instead of a conversation, and the paper's leaning on rooms (keep today's names, add only `work/`) was reached by pricing churn, never by asking what the structure is for. The conversation that followed overturns that leaning and closes several decisions above.

- **Rooms: the commander's sketch is the position, not an option.** Five nouns, each answering one question: `base` the machinery, `commander` the commander's interface to the pilot, `records` what has happened and is known, `work` what is being done, `team` who does it. It removes the worst measured drift by construction (proposals indexed in `base/` while the files sit on the desk; orders and decisions split between `base/` and `quarters/`). Deeper folders cost nothing at launch, since a folder's CLAUDE.md loads only when something in it is read, so each room carries its own conventions and the top map shrinks to five lines.
- **Two team objections withdrawn by the pilot.** The commander appearing twice is not a contradiction: `commander/` is the working interface (desk, orders, decisions) and `team/officers/commander/` is the identity file beside the pilot's. `dispatch/` under `records/` stands: logs are live state too, and "records" means anything recorded.
- **Decision 4 answered.** The notepad was forgotten in the sketch. It is a messy record type, minable history and a dump location: `records/notepad/`, treated by the checker as scratch.
- **Decision 9 answered.** Today's `records/` becomes `records/manuals/`: the same concept at two levels, flightdeck manuals for everyone, cockpit manuals for the pilot. "Workbook" was considered by the commander and dropped because a name drives how an agent writes the document. Rule 2 rewords to manuals.
- **Extracts.** `records/extracts/` is a placeholder for extractions: bulk sources condensed into key findings and distributed into self-sustaining content, which relieves the pressure to keep bulk long term. The topic store is the starter. Future work; M001 scaffolds the room and a placeholder procedure only.
- **Decision 3** ("settling differently") is answered in substance by the above: the rooms grew flat in the order needs arose, and the sketch is the intended shape.
- **Timing, given to the pilot.** Stage A first; then one refactor flight with two commits, each verified by the checker and revertible alone: the identifier pass, then the room move; the pilot's agent body after both, so it hardcodes final paths.
- **Frontmatter, no contentions.** The commander's design stands with brackets added. `type` and `unit` on every file; `stamp` one key, a bracketed list in fixed order (date, author, session), validated by position (flightcrew's validator supports tuple items); `recorded` was the earlier name for `stamp` and goes. References in frontmatter (`work`, `context`, `generates`) are whole-value pointers the checker can verify and the rename can script, which is a stronger reason for the richer field set than search alone. Decision 6 ruled by the pilot: the file owns its own facts, the manifest owns the collection, the lint reports disagreement and never rewrites. Carried by: ID-based work and desk documents, crew and officer dossiers (their own field family), and manuals (the header line becomes keys); not READMEs, logs or the notepad.

- **Two items the option-maker returned on this section, both taken.** The claim that frontmatter references are whole-value pointers holds for `unit`, `work` and a bracketed `generates` but not for `context`, which is a bare id in P004 and a path followed by prose in DS001; what `context` is for is put to the commander (the pilot leans to an id or path only, the sentence moving to the body). And `records/notepad/` puts scratch inside the records room, so the zone map keys on paths below room level and lists `records/notepad/` as scratch explicitly; ruled by the pilot and written into P013.

- **Further answers from the commander (O051).** `context` is the document's position in a chain: `work` the umbrella, `context` the link behind, `generates` the link ahead, all ids (a dossier's context is its team dispatch); so `context` is a whole-value pointer after all, the descriptive sentence moves to the body, and the lint can check the chain from both ends. Team numbers are counted across the whole team space: one register and one manifest for T, the room a field on the team, and as a rule every prefix has exactly one minting register. Manuals inherit everything `records/` used to mean: rule 2 moves over whole, and `records/` as a parent carries no authority of its own. Decision 5 answered: `MANIFEST-<collection>.json`, because a filename in streamed output should say what the file is without its path, and it stands out beside its units; the name carries the collection, not the folder, so a room move renames nothing, and a `kind` field inside holds the same word for the lint to check. The pilot withdraws its ruling that filenames should not carry what a `kind` field can say.

- **Two chain details returned by the option-maker, ruled by the pilot.** `context` takes a bracketed list like `generates`, because one document can answer several (CA001 answers DS001 and four proposals). And the two fields are not inverses: `generates` is what a document caused, `context` what it attaches to. The lint checks reciprocity only in the causal direction (a parent's `generates` against the child's `context`); attachment is one-way and declared per document type, so advice attaches to a dossier and is never generated by it.

- **Manifest and dispatch naming settled (O052).** The collection word is the prefix's name in full: CA is Commanders Advice, so `MANIFEST-commander-advice.json`; `MANIFEST-dossiers`, `MANIFEST-requests`, `MANIFEST-dispatches`. Agent-oriented names may be long and descriptive. `team/` holds role information (rosters, crew, officers); a dispatch is a team instance, so T identifies a dispatch. One global `MANIFEST-dispatches.json`; units flat in one folder for now, split into per-room folders when the numbers grow, which costs nothing because the manifest holds each unit's path.

- **Decision 7 answered (O053): what gets an ID, a name, or both.** The test is how a thing is addressed in chat. Everything that accumulates and is cited gets an ID only: dossiers, requests, advice, decisions, orders, dispatches, sparks, workshop items. Everything known permanently by name gets a name only: rosters and crew seats ("document-critic" says who is flying; a crew number does not). Missions and procedures get both, an ID to learn and cite and a name that reads. The checker treats a declared name as a link target, unique in its manifest. The pilot withdraws its id-plus-slug ruling: accumulating units are filed by ID alone (`Ds006.md`, `T010.json`), as the commander already did with CA001; missions and procedures carry ID and name in the filename.

- **The last three decisions answered (O054, D026, D027).** Decision 1: write is a restriction of role, not of place; the build and refactor teams fit out the cockpit directly inside a scope the pilot gives, the pilot linking the team to the commander and recording its actions; rule 1 rewritten, P013 amended. Decision 2: the pilot repairs the advice files itself, and a procedure will create an advice file with metadata filled whenever a request is written. Decision 8: the lint is non-blocking, one short line on success, and on error enough guidance to fix by a small edit without a further tool call.

Nothing in this dossier remains open with the commander.

## Where the detail is

- The option space, costs and leanings per area: `notepad/ideas-2026-09-20/paper-final.md`.
- Rooms, path dependencies, ID counts, JSON sizes, document types, runtimes: `auditor.md`.
- Harness frontmatter, YAML validity, memory design, hooks as validators, JSON Schema practice: `scout.md`.
- Flightcrew's schemas, engine, linter and the spec-builder's routine, by branch: `assets.md`.
- Every finding, withdrawal and the closing verdict: `adversary.md`; its attack on this dossier: `adversary-dossier.md`.
