# adversary: agent-expectations (revision) — T006

Re-attacked against the revised rule 2. Both findings from my first pass are resolved. The title now names the topic rather than asserting a claim, which the revised rule asks for and which the exemplar models. 34 lines. Two small findings, no High, nothing that blocks.

**F1** — **The header lists a source no claim in the record now uses**
**S-L** · **C-H**
**FINDING**: The source header names `quarters/commander/commander.md` among the written advice. After the fix to the crew-sizing bullet, no sentence in the record draws on that file; the bullet now points the reader to the cockpit's crew protocol instead. Rule 2 requires the header to name sources for claims the record makes, and a reader auditing this record will go looking for what that file supports and find nothing.
**EVIDENCE**: The only place the file was used was the old no-arbitrary-limits claim, which now reads "Crew sizing and the adversary's model are the commander's rules, and the cockpit's crew protocol holds them. Read them there rather than here." That sentence cites nothing and needs nothing. Drop the file from the header.

**F2** — **A pointer that will rot, in the one place the record cannot control**
**S-L** · **C-M**
**FINDING**: The "Do not run ahead" bullet defers to `launches-and-runs.md` by filename. That is the right call and I am not arguing the deferral, which is exactly how the duplication problem should be solved. But this record now depends on a filename in a sibling record that was itself renamed once during this run, from two files to one. If it is renamed again the pointer breaks silently, and the rule it points at is one the commander corrected the pilot over.
**EVIDENCE**: The file this bullet names did not exist under that name when I attacked the first drafts; the same rule then lived in `run.md`. Nothing is wrong today. Consider naming the topic rather than the filename, or accept the coupling knowingly.

## Resolved from my first pass

The unwatched-run material is cited to `bab64608:1832`, which is where it is, and the record now also uses the sentence I flagged as available and unused: "So this is the long way of saying, decide your self, but align that with what I have described". That sentence states the record's title claim in the commander's own words and is the strongest line in the file. The crew-sizing duplication is gone, replaced by a pointer to the cockpit rule that holds it, which resolves the DS002 maintenance-burden objection without losing the reader.

## Checked and passing

`bab64608:1830` is exact including "I cannot be asked like this is HITL". `bab64608:1832` is exact including "12hours", the single quotes around "glimpse", and the commander's spelling "reigns", which the record preserves rather than correcting to "reins". `9b679556:2133`, `9b679556:3965`, `0fb7c77a:2759` and `0fb7c77a:1049` are all exact, including "As long as i takes" and "send explorers when ever you want". `9b679556:5985` is exact and the framing of it as fixing the instrument is fair to a turn that is explicitly about a rubric flagging on nearly every run. The DS002 paragraph represents that document accurately, including the supersession question.

## Completeness

The topic is working with the commander, and I can find no part of it missing from what the cited turns support. Steering, how closely they watch, the division of labour, what they expect back, and the judgement they want exercised cover it. Nothing here fails the two-year test, because every claim is about how the commander works rather than about what the system currently does, which is the class of claim that ages best. No padding: I looked for sentences that could come out and found none that are not carrying a distinct idea.

## Unaudited

Two claims rest on `DS001`, which has never been in my read scope: the extract-do-not-replicate bullet and the preside-do-not-build quotation, the latter now quoted at greater length than in the first draft. I cannot confirm either wording.
