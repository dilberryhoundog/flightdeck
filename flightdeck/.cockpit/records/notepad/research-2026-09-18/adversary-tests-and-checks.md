# adversary: tests-and-checks — T006

You asked me to check the three rules hard. They are the commander's own typing and do not need cutting on authorship grounds. The problem is modality, not provenance, and it is the worst finding in the set.

**F1** — **An open question is recorded as a settled ruling, and the thing that settles it is the pasted reply**
**S-H** · **C-H**
**FINDING**: Line 31 reads "The commander's three rules for writing such tests, same turn". The commander did not issue three rules. They drew a Rails analogy, said what they would do inside it, and then asked whether it transferred. The question is the last thing they type before the paste. The affirmation is the first thing inside the paste, which is web-Claude and not the commander. Your record deletes the question mark and promotes the answer, and the only authority for the promotion is a source the record does not cite and rule 2 would not accept.
**EVIDENCE**: `9b679556:7640` opens the analogy: "Then finally I want to look at this through the lens of a rails project. imagine i was using devise for auth and I wanted to replace it with rails new native auth..." The three bullets follow at `7642`, `7643`, `7644`, each beginning "I would". Then `7647`: "if this is correct then it applies to a system of harness tools also?" The seam is where you said it is: `7650` begins "Yes, and the three rules are right." That sentence is not the commander's. Either recast the line as a question the commander put and has not had answered by anyone whose word this file takes, or cite the confirmation for what it is. Do not cut it for authorship, which is sound.

**F2** — **The citation names the turn's first line, not the quoted line**
**S-M** · **C-H**
**FINDING**: The three rules are cited `9b679556:7638`. Line 7638 is a different paragraph, the inventory and testable-core statement you quote on line 29. The rules are four to six lines further down.
**EVIDENCE**: `7638` reads "This made me think though. I should go through and inventory the system..." The rules are at `7642`-`7644`. Your line 29 quote is correctly placed at `7638`; only the rules citation is wrong. This is one of three citations in the set that point at a turn's opening line rather than the quoted line, so it may be inherited from the notepad source I am barred from reading rather than introduced by you.

**F3** — **A second quote sits two lines below its citation**
**S-M** · **C-H**
**FINDING**: Line 19 quotes "the test builder should know to build 'tests' into project native or testbench. then place checks into run folder" and cites `a9389f8c:3403`. It is at `3405`.
**EVIDENCE**: `3403` ends "So this needs unravelling more." `3405` carries the quoted sentence. I grepped the whole transcript for the phrase and it occurs once. Same turn, wrong line.

**F4** — **A hedge and a qualifier are both dropped, and the verdict hardens**
**S-M** · **C-H**
**FINDING**: Line 9 states "A project's own suite is not assumed to be orchestration-compatible either; a Rails suite is not". The commander said neither of those things flatly.
**EVIDENCE**: `a9389f8c:3403`: "Im pretty sure a rails project tests aren't fully compatible with orchestration runs." Your sentence removes "Im pretty sure" and turns "aren't fully compatible" into "is not". A pilot reading your line concludes a Rails suite is unusable; the commander said it is partly usable and was not certain.

**F5** — **A citation covers less than its sentence claims**
**S-M** · **C-M**
**FINDING**: Line 23 asserts "The project's tests are the stable layer and the single source of truth, and that source stays with the project and its own suite (`8fdc3b29:3569`)." Line 3569 says none of that. It is the placement pipeline. Neither "stable layer" nor "single source of truth" appears in it, and stability is the load-bearing claim of the whole section heading.
**EVIDENCE**: `8fdc3b29:3569` in full begins "3. depends. building with flightcrew might need both rails compatible tests but also produce testing artifacts that only are needed for flightcrew launches. testbench is a home for these." followed by the pipeline you quote correctly on line 13. The phrase "single source of truth" does occur in the corpus, at `8fdc3b29:3039`, but there it governs specs, not tests. Cite something that carries the stability claim or drop it.

**F6** — **A green-or-red wrapper claim is attributed to the wrong turn**
**S-L** · **C-M**
**FINDING**: Line 7's "A check wraps a test and returns flightcrew-compatible output from a green or red result" is cited `8fdc3b29:3569`, which says only "run-1/checks to wrap the tests". The output half of the claim is from the turn you already quote in the preceding sentence.
**EVIDENCE**: `a9389f8c:3403`: "checks are definition of done, they overlay a test with a orchestration run compatible output." That is the source for the output clause. Nothing in the corpus I read says "green or red"; it is your gloss on "pass/fail assertations".

**F7** — **A recollection is recorded as a settled purpose**
**S-L** · **C-M**
**FINDING**: Line 15 presents the testbench definition flatly as "Testbench is the fallback home". The commander was recalling an intention and hedged it.
**EVIDENCE**: `a9389f8c:3305`: "I think the intention was... when using flight deck in a folder with no test/ this becomes a known place for the tests flightcrew needs to work properly." The quoted fragment is exact; the frame around it is not. Rule 2 wants the current form stated with authority, so if the pilot may rely on this, get it confirmed rather than promoting a recollection.

## Checked and passing

Line 7's primary quote matches `a9389f8c:3403` word for word including "assertations". Line 13's pipeline matches `8fdc3b29:3569` exactly. Line 17 matches `a9389f8c:3227` including "regresion" and "should.ve", and its ellipsis hides only the commander's aside about the workflow writer, which changes nothing. Line 25 cites `8fdc3b29:206` correctly for the three axes, and `8fdc3b29:3452` correctly for the growth clause. Line 29's testable-core quote is exact at `9b679556:7638`, lowercase "i" preserved.

## Docspec

31 lines, inside the cap. Header names the notepad file it was distilled from, which rule 2 permits in place of a topic id. No history, no divergence, no process narrative. The only two-year risk is F1, which will read as a commander ruling forever if it is not fixed now.
