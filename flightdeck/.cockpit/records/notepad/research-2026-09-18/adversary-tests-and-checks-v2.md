# adversary: tests-and-checks (revision) — T006

Re-attacked against the revised rule 2. All seven findings from my first pass are resolved, and the closing section is the best thing in the set: it states the question, names the paste as web Claude, says it carries no authority here, and tells the pilot how to treat the three rules until the commander confirms. That is the shape an unresolved thing should take in a record. 37 lines, well inside the tripwire.

Two new findings, both completeness under "covers one topic whole", and both from the same source turn the record already quotes.

**F1** — **The commander's own open question about "targets" is dropped from the turn the record quotes**
**S-M** · **C-M**
**FINDING**: The record quotes the division of labour from `a9389f8c:3405` and stops one clause early. The same sentence continues into an uncertainty the commander raises about the verification vocabulary and has never had answered. Revised rule 2 asks the record to cover its topic whole, and this record already carries the right pattern for an unanswered question in its closing section. A pilot who reads this file to settle what belongs in the verification domain will not learn that the commander is unsure whether one of its terms belongs at all.
**EVIDENCE**: `a9389f8c:3405` in full: "the test builder should know to build 'tests' into project native or testbench. then place checks into run folder. these present existing tests as 'checks' for the run. also the term 'targets' is mentioned which im unsure of how it fits into the verification domain." The record uses the first sentence and a half and drops the rest. The word "targets" appears nowhere in the record.

**F2** — **The clause that explains how a check relates to an existing test is dropped**
**S-L** · **C-M**
**FINDING**: From the same sentence, "these present existing tests as 'checks' for the run" is the commander's clearest statement of the relationship the record's opening section works hard to establish from other turns. The record defines a check as wrapping a test and returning consumable output, which is correct, but the commander's own gloss on what that wrapping does for the run is available and unused.
**EVIDENCE**: `a9389f8c:3405`, quoted in full above. This is a cheap addition: one clause, already inside a quotation the record makes.

## Resolved from my first pass, with nothing standing

The three rules are recast as the commander's proposed approach inside a Rails analogy rather than a ruling, and the paste is identified. Citations now point at the quoted lines: the rules at `9b679556:7642` to `7644`, the question at `7647`, the test-builder quote at `a9389f8c:3405`. The Rails hedge is restored verbatim as "Im pretty sure a rails project tests aren't fully compatible with orchestration runs", keeping both the hedge and the word "fully". The testbench recollection is marked as a recollected intention with an instruction to confirm. The green-or-red gloss is gone, replaced by output "an orchestration run can consume", correctly cited. The unsupported claim that tests are the single source of truth no longer rests on the placement pipeline.

## Checked and passing

Every transcript quotation matches its line. `a9389f8c:3403` is exact including "intial", "assertations" and "eg a skill.md can't have a pass/fail assertion". `8fdc3b29:3569` is exact including "probably should rename to 'verify'". `a9389f8c:3227` is exact including "regresion" and "should.ve", and its ellipsis still hides only the aside about the workflow writer. `a9389f8c:3305` is exact and now carries its "I think the intention was" frame. `9b679556:7638` is exact with lowercase "i" preserved. The retry-axes claim cites `8fdc3b29:206`, which is the line that carries it.

## Unaudited

Two claims rest on `DS001`, which has never been in my read scope: the Rails-folder restatement and the constraint on the suite under "Which layer is meant to move". The second now carries the stability claim that I previously found unsupported, so it has moved from a citation I could check and fault to one I cannot check at all. That is an improvement in accuracy and a reduction in coverage at the same time, and somebody who can read `DS001` should confirm it says what the record says it asks.
