---
type: "Dossier"
unit: "Ds-010"
name: "session concepts"
stamp: ["2026-10-07", "Pilot: Ace", "f6216b95"]
work: "M002"
context: ["T018", "T019", "CO-114"]
generates: []
---
# Ds-010 — What this session found: the concepts and decisions worth carrying into the next build

- **From:** session f6216b95, 2026-09-22 to 2026-10-07: T018 (the session-start audit), the constitution and its corpus migration (T019), the decision audit, the truth suite and the seven workshops. The log is `records/logs/2026-09-22_f6216b95.md`; the raw material is under `records/notepad/start-procedure-2026-09-22/` and `records/notepad/corpus-migration/`.
- **For:** the commander's next build, which starts from `flightdeck/.cockpit/constitution.md` on Claude Code native. This dossier is written to be mined, not loaded: each section is one idea, what it was for, what it cost, and whether it earned its place.
- **Verified:** every count and outcome below is from the dispatch records and the notepad files, not from memory of the conversation.

## The answer in one paragraph

Three things from this session are worth keeping and the rest is learning. First, the truth suite: a source of truth written by the human in quoted natural-language statements, by topic and by level (file, concept, principle), with advice as truth on trial that agents may add to but never edit, and agent-written checks that connect each statement to the files it governs. It is the one structure that answers the commander's real complaint, that his own records were unfindable and uneditable, and it is independent of any orchestration pattern. Second, the adversary seated before the first landing: in three teams the fit-critic and the advocate filed on the pilot's own prior work before the writer wrote a line, and those findings shaped the work that followed; this is the single practice with measured value here. Third, the commander denies, he does not decide: every approval gate placed on every decision was the slowness he felt, and his own advice (CA-053) names the fix. Everything else, the record corpus with its prefixes and manifests and schemas, the ranks and the vocatives, the constitution's enacted-approval loop, cost more than it returned and should not be rebuilt as it was.

## The concepts, in the order they arose

- **A session-start audit by a tracer with live adversaries (T018).** The commander reported a refit had broken the pilot's start procedure. One Opus tracer walked the procedure against disk, hook and git; two adversaries attacked each round. Result: 27 standing defects, five breaking, in `records/notepad/start-procedure-2026-09-22/trace.md`. What earned its place: the owner test (who fixes what: a stale line is the pilot's, a shape or rule is the commander's, machinery is a crew build) and the measurement that the start loaded about 13,000 tokens and re-ran itself on every compact. What did not: thirteen items on the commander's desk at once; he said so and replaced the keep with a constitution the next day.
- **The constitution and the enacted-approval loop.** The commander's second founding document: the commander writes records (orders, advice, responses, questions, ideas), the pilot decides everything and answers with records (decisions, requests, dossiers, disputes, plans, procedures), and approval is enacted as full, part or held, where part means the commander amends his own record and the pilot redrafts. What earned its place: the idea that the commander steers by changing his own words rather than by answering questions; the dispute as the escalation shape (two sides verbatim, one paragraph); off-the-record talk that generates no record. What did not: an XD for every CO (CO-090), which multiplied pages; twelve record prefixes with dashes and names, which multiplied files; and the extraction of his conversation into records, which made his own words unfindable (56 advice files in twelve directories by the end).
- **The corpus migration (T019) and what it measured.** Every sentence of the constitution classified as order, advice, idea, question or definition and filed as a record with the statement verbatim, a plain summary, a brief and a `lines` field. Four rules survived attack and are reusable wherever a human document is turned into records: a clause whose subject is the agent and whose predicate is a duty is an order; a reason-sentence is not a record but stays inside the statement it explains; headings are not counted; a statement is the whole contiguous span, never spliced, with the source lines named so any record can be checked against the document in one step. The advocate's mechanical check (0 non-contiguous spans, 0 statements outside their lines) is the model for a checkable result.
- **The decision audit (CO-113).** The advocate audited the pilot's drafts against every commander record and found the one the commander had added (CA-015: each unit is one action with its reasoning, every action stated) applied nowhere; the lint had passed all twelve. Lesson: a schema catches shape, not intent; an agent reading the human's records against the agent's output is the check that catches intent, and it should run before anything goes up for approval.
- **The truth suite.** Eight `.truth` records by the commander at `records/truth/` (moved to `concepts/` and `principles/` by XD-013): truth records, truth statements, truth advice, the suite's three levels, decisions, disputes, workshops, off the record. The rules that matter: agents never write a truth statement; an advice statement is written new and never edited; a topic holds one thing; statements are plain, standalone and unambiguous; a file record is checked red-green against its file, a concept across every file it permeates, a principle by an agent in the build team and never by a read; truth is locked during a build. The pilot's eleven advice statements at `records/advice/truth-suite.txt` (seven current, four superseded) propose the three rooms, the check file per record, the workshop directory, and when advice is imported and truth locked. Two disputes stand in the truth shape (`advice-is-statement`, `build-lock`) and four defects in the commander's own records are listed in the CO-114 workshop index. This is the idea to carry forward; it is half-settled.
- **Workshops.** An order and everything it spawns in one directory: `work/workshop/<CO-id>-<name>/` with the order, the decision and an index naming every other record by path. Seven were opened. The commander's instinct here (one place to see an order and its residue) is sound and cheap; the index is what made the records findable again.
- **The decision as a framing and a path.** The commander's `decision.truth`: a framing (what the order asks, what governs, what satisfied looks like, then context, tooling and verification declared), and a body that is the path from the order to its satisfaction in units of step, action or intention, with reasoning welcome but never in place of intention. The pilot's XD-013 got the framing right and the body wrong (every unit argued "because"); the commander pointed it out off the record. The next decision format should start from `decision.truth`, not from the pilot's drafts.

## The decisions that stand, and the ones that do not

- **Stand:** the owner test from T018; the four extraction rules from T019; the advocate as a standalone Opus seat with mechanical checks at the close; the fit-critic live from before the first landing; return subagents for every clerk job (fourteen ran this session, none needed to be a teammate); the clerk as a Sonnet reader, searcher and mover; one number block claimed by message before any seat writes; a record's sibling named both ways when one sentence sits in two records; the truth suite's rules above; the workshop directory; off-the-record talk.
- **Do not stand:** the constitution's record corpus as built (prefixes, dashes, names, manifests per unit, schemas per kind); an approval on every decision; the pilot's bash ban enforced by conduct (it was broken once, and the hook that enforced it blocked the whole session when its file moved); `binds`, `lines`, `statements`, `sides`, `sections` and `approval` as schema fields (each was a ruling beyond the commander's words, listed in Ds-009); the vocatives and ranks as a cost worth paying; runs 2 and 3 of the migration (XD-002, XD-003, XD-005, frozen full, now superseded by the truth suite and not to be executed as written).

## What the harness taught, measured

- A teammate's system prompt is on disk in its transcript's `prompt_snapshot` rows; read it rather than asking (T016).
- The SessionStart hook fires on startup, resume, clear and compact; a procedure that does not read `source` re-runs on every compact (T018, S22).
- A hook writes past the PreToolUse guard; the guard covers tool calls only (T018, S28).
- A PreToolUse hook whose script is missing blocks every tool call it matches, for the session and for its subagents alike; a guard must fail open or be removed when its file moves. When the script is present, the guard binds subagents exactly as it binds the pilot (this session's close).
- Teammates do not survive a resume and cannot spawn teams; a loop that must persist is a session or a workflow (T017, carried through this session).
- Messages between the lead and seats cross; a ruling sent after a seat has started writing costs a round of rework (T019: the SO reversal, the CO-092 collision).
- A seat that cannot lint or delete must say so in its first message, or its work goes unverified until someone asks (T019: 79 files).
- An idle notice that arrives after a later message was sent is stale; the seat already has the message (T018, T019).

## Pilot's errors, for the next body's brief

- Read the founding document once and acted on a stale copy while it changed (the constitution grew a Roleplay section and a locations list between my read and my draft). Re-read the governing document before every draft against it.
- Backfilled a record field before the commander ruled on the shape, against the owner test I had written the same hour. The owner test binds the pilot first.
- Kept "because" on every decision unit two days after the commander's truth said a unit is a step. Knowing a rule and applying it to your own writing are different things; the constitution-reader said the same of itself.
- Put thirteen items on the commander's desk in one request and sixteen headings in his answer file. The commander denies; he does not decide.
- Took a Haiku clerk's status report as fact when its commands had been blocked and it had written a summary from reads; a report that names no command output is not a measurement.

## Where the files are

- Logs: `records/logs/2026-09-22_f6216b95.md`, entries from the start audit to this close.
- Dispatches: `records/dispatch/cockpit/T018.json`, `T019.json`, each with outcome and lessons.
- Notepad: `records/notepad/start-procedure-2026-09-22/` (trace, fit, footprint), `records/notepad/corpus-migration/` (classification, advocate, fit, decision audit, truth-advice check).
- Records: `records/commander/` (CO-085 to CO-114, CA-001 to CA-056, CQ-001, CI-001), `records/pilot/` (XD-001 to XD-006, XX-001 to XX-009, the two truth-shape disputes, Ds-009), `work/workshop/CO-*/` (seven workshops with XD-007 to XD-013).
- Truth: `records/truth/concepts/`, `records/truth/principles/`, `records/truth/checks/`, `records/truth/MANIFEST-truth.json`; advice at `records/advice/truth-suite.txt`.
- Crew: `team/crew/cockpit/` dossiers for start-tracer, constitution-reader, schema-builder, commanders-advocate, fit-critic, trim-critic.
