---
type: "Notepad"
unit: "advocate-findings"
stamp: ["2026-09-24", "commanders-advocate", "f6216b95"]
work: "M002"
context: ["XD-004", "T019"]
---
# Commander's advocate — findings

Seat: commanders-advocate. Team T019, mission M002. Findings numbered A1 onward across rounds. Severity: contradicts the commander / drifts from his words / cosmetic.

## Rounds 1 to 3 — ledger

Round 1, the records filed before this team. Closed: A1, A3, A4, A9, A10. To the dossier as corrections to frozen records: A6, A7. Accepted for later: A2, A5, A8, A11.

Round 2, CO-092 and XD-006 to XD-009. Closed: A13, A14, A18. Ruled and to the dossier: A12. To schema-builder: A15, A16, A17.

Round 3, the classification. Taken: A19 (Rule A splits on the clause), A21, A22 (`records` splits; the three added units to the dossier as a correction to XD-004), A23 (XX-003 reframed on the live instance), A24 (XX-005 narrowed), A25, A26, A27, A28. Ruled the other way: A20 — see below.

**A20, settled.** I held that `8.1`, `19.2`, `19.3` and `109.2` are advice, because `29.3` makes a sentence that shapes the project advice and `27.1` makes an order the pilot's session conduct, retirable under `27.3`. The pilot first ruled them SO, then on A29 reversed to CO with a `binds: all` line, listed as SO candidates beside CO-089 and CO-090 for the commander to promote in one act. That answers the retirability worry and, through `binds`, the scope worry at A31.

Round 4, the SO ruling. Taken: A29 (reversed to CO, SO candidates). A30 ruled to schema-builder: SO lives in `orders/` under the CO manifest, own sequence, `from` naming the CO, the CO retired on promotion. A31 met by the `binds` field. One residue of A30's ruling is raised as A36.


## Round 5 — ledger

CA-002, the glossary, and two residues. Taken: A32 (base root files exempt from paperwork, stated in lint.yaml), A34 (the four are residue, nothing dropped), A35 (settle list is prose), A36 (a promoted CO is superseded, never pruned), A44 from round 6 early (the glossary marks SD a status). Ruled: A37 — CA-003 is the commander's own advice naming the CA field `context`; his record governs, CO keeps `brief`, and the id-chain collision goes to the dossier as a note for him. A33: he flips at his pace; the dossier will say the first corpus was written before any term was flipped.

## Rounds 6 and 7 — ledger

Round 6, the schemas. Taken: A38 (XR carries `approval`; `denied` and `amended` gone), A39, A40, A41 (`sections` field), A42. Recorded for the dossier: A43. Closed: A44. Verified landed: A38, A41. Verified not yet landed at last check: A39 (`sides` has `minItems: 2` but is still not in `required`), A40, A42, A45.

Round 7. A45, the two order schemas disagreeing on what promotion does, still open at last check.

## Round 8

Scope: the landed corpus — CO-093 to CO-109, CA-004 to CA-046 in thirteen units, CI-001, XX-001 to XX-009 — against the constitution's words, and the diff.

**The CA-008 suspicion is withdrawn. Wrong.** I expected the summary to reconcile `32.1` and `32.4` quietly and hide the dispute. It does not: the summary carries both halves, and the context names XX-002 and XX-003 outright. The reader handled it better than I guessed.

Sound, and checked: both manifests are at version 2 and their rows carry the summary and bookkeeping only, never the statement or the context, as `41.2` requires. CO-093 and CO-094 carry `binds: all` and no SO file exists, so the A29 reversal is real on disk. All nine disputes carry a two-item `sides`, including the two weak tensions the reader first held back and my A23 and A24 reframings — XX-006 separates the settled tool question cleanly. Of 71 statements, 46 are exactly contiguous in the constitution, and the eleven that are not are the chat-sourced records, correctly so.

### A46 — Fourteen statements are spliced and presented as continuous prose
Claim: a statement built from non-adjacent sentences, with nothing marking the cut, is not verbatim.
Evidence: `41.1` — "All CA, CO records are extracted with the commanders record transfered verbatim". Fourteen constitution-sourced records fail a contiguity test against the source: CA-004, CA-008, CA-010, CA-013, CA-015, CA-018, CA-019, CA-021, CA-025, CA-027, CA-039, CA-041, CO-093, CO-102. Most drop an interior sentence the classification called a definition, which is the intent of XD-004 and defensible; what is not defensible is that no reader can see it happened. CA-025 reads "The "commander" is the highest ranked, they produce written records. The commander is responsible for the project's vision, growth and improvement." — two sentences with `25.2` and `25.3` silently removed between them.
Severity: contradicts the commander. Verbatim is his own word, and the corpus is meant to survive the constitution's retirement.
Fix: mark every omission with an ellipsis, and add a `lines` field naming the source lines so any statement can be checked against the document in one step. Fourteen records, mechanical.

### A47 — CA-041 cuts a sentence in half and loses what it said
Claim: one splice is not a dropped definition but a dropped clause, and the result is ungrammatical.
Evidence: CA-041 statement — "Logs preserve the cockpit's history. The pilot has a "shift" log A "notepad" is crew and pilot scratch, "extracts" are bulk sources condensed into key findings." Constitution `103.2` — "The pilot has a "shift" log that they record all their daily work in and reference upon the next session begining." The eleven words that say what the shift log is for, and the instruction to read it at the next session's start, are gone, and the remains run into the next sentence with no stop. The classification classed `103.2` advice, so nothing justified dropping it.
Severity: contradicts the commander. This is lost content, not compressed content, in the unit that governs the pilot's own log.
Fix: restore `103.2` whole. Then re-read the other thirteen for the same fault, since a contiguity test finds the splice but not which kind it is.

### A48 — CO-093 stitches two sentences a hundred lines apart and strands the word that joins them
Claim: the order's statement is unintelligible on its own because the connective was carried away from what it referred to.
Evidence: CO-093 statement — "The cockpit uses "plain, clear and simple language, with no jargon". Otherwise all documentation is written in plain, clear and simple language, with no jargon." The first is line 8, the second line 109. In the constitution, `109.2`'s "Otherwise" points back at `109.1`, "A glossary of agreed terms and ID's is kept and approved for use in the base" — the sense being that approved glossary terms are the exception and everything else is plain language. Detached from the glossary sentence, "Otherwise" has no referent, and the order now reads as one sentence repeating the other.
Severity: contradicts the commander. It also loses the rule's actual force: the no-jargon rule has an exception, and this record no longer says what it is.
Fix: either file line 8 and line 109 as two records, or keep one and carry `109.1` into the context so "Otherwise" has something to point at. The glossary's own advice, CA-039, holds `109.1`, so the context need only name it.

### Verification, schema items from rounds 6 and 7

All four confirmed on disk. A39: `sides` is required with exactly two items. A40: `approval` is on `pilot-plan.json` with the enum `full, part, held, ""`. A45: `standing-order.json` now reads "the CO it was promoted from becomes superseded and is never pruned" in the description and "becomes superseded on promotion and is never pruned" on `from`, matching the CO schema. A42: eleven of the fifteen schemas that accept `Or` now carry a sunset note.

### A49 — Approval is required on a decision and optional on a request and a plan
Claim: A40's field landed on all three, but only one of the three must carry it, so the question A40 was about still cannot be answered by query.
Evidence: `pilot-decision.json` required includes `approval`; `pilot-request.json` and `pilot-plan.json` do not, though both now declare the field with the same enum. The enum already holds `""` for a record awaiting the commander's word, so requiring it costs a writer nothing. `43.1`, `74.3` and `80.3` put all three under one process.
Severity: cosmetic, and the last step of A40.
Fix: add `approval` to the required list on the request and the plan.

Also noted, outside this team's scope: four older schemas — `mission.json`, `officer.json`, `procedure.json`, `request.json` — still accept `Or` and `De` with no sunset note. They predate this run and no decision covers them; worth a line in the dossier so the layout move picks them up.

### Re-check of A46 to A48, and CI-001

All three closed, verified mechanically rather than by eye.

A46 closed. Every span of every constitution-sourced record is now contiguous in the source: 0 failures across 61 JSON records plus CI-001. The `lines` field is on all 62, and — the test that matters — every statement is found within the text of the lines it declares, 0 failures, so a reader can check any record against the document in one step. CI-001 carries `lines: "120"` and its quoted words match line 120 exactly.

A47 closed. CA-041 now reads the whole of line 103, including "that they record all their daily work in and reference upon the next session begining", matching the source word for word.

A48 closed. CO-093 is line 8 alone. CO-110 is line 109, and its context names `109.1` and explains what "Otherwise" points back at, so the exception the rule depends on is legible from the record.

### A50 — Twelve lines of the constitution now sit in two records at once
Claim: the whole-span rule and the clause split from A19 interact, so a sentence holding both advice and an order is carried verbatim in both records, and nothing says which one governs.
Evidence: twelve lines are claimed by more than one record — line 34 by CA-009 and CO-096, line 40 by CA-011 and CO-098 and CO-099, line 103 by CA-041 and CO-107 and CO-108, and nine more. CA-009's statement now holds the whole of line 34 including "The pilot doesn't answer directly instead produces a decision resulting from the CQ.", which is also CO-096. Both are correct under the rules as ruled; neither is wrong.
Severity: cosmetic today, drifts later. The cost is on amendment and retirement: `27.3` retires an order and `29.4` retires advice separately, so retiring CO-096 leaves its words standing in CA-009 as though still in force, and a change to line 34 must be made in two places or the corpus disagrees with itself.
Fix: nothing to rewrite. Add the sibling's id to each record's context on those twelve lines, so anyone amending or retiring one sees the other. Worth a line in the dossier as a property of the corpus the commander should know about.

### Verification of A49 and A50

A49 closed. `approval` is required on `pilot-request.json`, `pilot-plan.json` and `pilot-decision.json` alike.

A50 half applied. Thirteen constitution lines are now shared (one more than the twelve I reported, so a correction added a pair). Of the sibling references the fix calls for, ten are still missing, and they fall in a pattern: the advice records name their order sibling, but the orders do not name the advice, and no order names another order.

Missing, each way round: line 3, CA-027 does not name CA-004. Line 19, CO-094 does not name CA-023. Line 25, CA-005 does not name CA-025. Line 38, CO-097 does not name CA-026. Line 40, CO-098 and CO-099 name neither each other nor CA-011. Line 103, CO-107 and CO-108 do not name each other.

This is the direction that matters most. A50's cost was retirement: retiring an order while its words stand in a piece of advice. A reader retiring CO-096 needs CO-096 to say that CA-009 repeats it — the pointer from the advice back to the order does not help them, because they are not reading the advice. The three CO-to-CO pairs on lines 40 and 103 have no pointer at all in either direction.

## Final verification

Run over the whole corpus after the reader's last edits. Every check passes.

- 62 constitution-sourced records, 61 JSON plus CI-001.
- Non-contiguous spans: 0. Every statement is a continuous run of the commander's words.
- Statements falling outside their own declared `lines`: 0. Every record can be checked against the constitution in one step.
- Shared lines: 12, down from 13 with the testing unit deleted. Missing sibling links: 0. A50 is closed both ways round, orders included.
- Twelve advice units: none on disk unlisted, none listed without a directory.
- No record missing from a manifest; no manifest row without a file.
- `binds: all` on CO-093, CO-094, CO-095, CO-108, CO-110. CA-045 carries every required field after the trim.
- `cockpit-lint`: 1 fault in 301 files, and it is not this team's — `records/manuals/README-FIXME.md` has no frontmatter. It was untracked before T019 began and no decision in this run touches it.

## Closing: what stands unresolved for the commander

Nothing in the corpus is wrong that I can find. What follows is held over, not broken.

**For him to settle.** The nine disputes XX-001 to XX-009 are his to resolve by amending or retiring records, or by answering with a CR (`78.4`). A27: the package lines are filed as advice, and whether they are really a forming idea is his call, not this team's. A33: the whole corpus is written in glossary terms not one of which he has flipped to `+` yet; `109.2` makes an approved term the exception to the no-jargon rule, so the corpus and the glossary should be read together when he does.

**For the dossier, as corrections to frozen records.** A6 (XD-002's `logs/notepad/`), A7 (XD-001's "final locations"), A12 (XD-006 on the prefix table), A22 (three advice units beyond XD-004's nine).

**Carried to later runs.** A5, the pre-dash files renamed in the layout move. A8, the response inside XD-001 taking CR-006 in run 2. A11, the codebase sweep added to this seat's dossier.

**Properties of the corpus he should know.** A43: `context` is prose in a CA and a list of ids everywhere else, so a `context:` grep means two things. A50: twelve lines of the constitution are held verbatim in two records at once, linked both ways now, but amendment and retirement must touch both.

**Loose, and covered by nothing.** Four schemas that predate this run — `mission.json`, `officer.json`, `procedure.json`, `request.json` — still accept `Or` and `De` with no sunset note, against CO-091. No decision names them, so neither XD-005's citation sweep nor the layout move will reach them.

Fifty findings raised across nine rounds. One withdrawn as wrong: the CA-008 suspicion. One ruled against and then reversed on further evidence: A20, through A29.
