# adversary pass four — T009 decision paper, revision 3 (99 lines)

Seat: `adversary`, team T009, mission M001.

## Closed this round

Residual 1 closed at line 61, heading and opening sentence both, and at line 65 where the README line is rewritten rather than removed. The correction that a claim having a source does not mean naming it inline is now the paper's own framing.
Residual 2 closed at line 67, and closed better than I asked: no exception to rule 3 is carved, the notes are an aid and not an authority, they are not cleared while the record stands, git history is the backstop, and re-validation rebuilds the map if they are gone. My P2 falls with it.
Residual 3 closed at line 61. The team id is one token resolving to one dispatch entry, with the fallback named. My N9 falls. See C1.
Residual 4 closed at line 63, and the two-axis shape is better than the three states I proposed: maturity stands alone and is replaced on promotion, sourcing carries one line or two.
N1 closed at line 77. "At the close of a launch and at the close of a mission phase" fires without a launch — M001 is at phase 3 and phases turn over — so F4's periodic leg, F17's currency and the review's own cadence no longer wait on an event this project has not had.

## New, against the paragraph you flagged and one edit that collided

**C1 — Lines 61 and 63 now contradict each other about the stamp. S-MEDIUM · C-HIGH**
Line 61 puts the team id in the stamp: `T011 validator, 2026-09-19`, and defends it as "one token, not the reference block the commander objected to". Line 63 still ends "the stamp names kinds of source, a seat and a date, and carries no identifiers at all." A team id is an identifier. These two paragraphs define the same line, and both become rule 2 and `records/README.md` text, where a later reader follows one and not the other. This is the failure mode the memory page names for contradicting instructions: the model picks one arbitrarily.
What must change: line 63 says team, seat and date, and no file names, line numbers or topic ids — which is the real distinction the commander drew.

**C2 — The currency mechanism is mechanical for the rare class and absent for the class that gets used. S-MEDIUM-HIGH · C-HIGH**
Line 77 opens "A web record's currency is mechanical: its `Source:` line names a URL and a date, and it is re-researched when the page moves." Nothing detects that a page moved. The review's mechanism covers the library, the manuals, the source guides and the commander's directives — all git or JSON — and web pages appear nowhere in it. `records/README.md:3` makes the same promise with the same gap. The class with no detector is the only class ever cited in this cockpit: all four records in `records/claude-code/` are web-sourced, and the harness register joins them. So the paper has built a cheap, real mechanism for local records, which it expects to be rare, and left the used class on a promise.
What must change: say what checks a web page, or say plainly that web-record currency is unsolved and rides on the drift trigger. The second is honest and costs nothing; a fetch-and-compare in the same review is the first.

**C3 — "Cost when nothing has moved: nothing" is contradicted two clauses later. S-LOW · C-HIGH**
Line 77 claims zero cost when nothing moved, then "The same pass reads the topic store for fine-tuning where a document has drifted and retires stale entries" — unconditional, and the topic store is 27 files. The detection step is genuinely near-free; the pass is not.
What must change: make the topic-store read conditional on something having moved, or drop the zero-cost claim to "the detection costs nothing".

**C4 — One assumption in the mechanism I cannot verify from inside my boundary. S-LOW · C-MEDIUM**
Line 77 detects commander directives by "new entries in `orders.json` and `decisions.json` since that date". That requires per-entry dates in both files. `base/` is outside my read boundary so I cannot confirm it, and the paper should not rest a mechanism on it unchecked. Someone with the boundary should look before this lands in a procedure.

**P3, reduced but alive. S-LOW-MEDIUM · C-MEDIUM**
Detection is now cheap, which answers half of my last pass. The response is not: a record whose stamp names "the commander's directives" goes to a validator whenever any directive is new, and directives arrive most sessions, so that class re-validates at nearly every review at one Opus seat each. The coarseness of a kind is doing the over-firing, not the detection.
What must change: let the review's own reading decide whether the new directive touches the record, and say that this is a judgement, in line 89's list.

## Still open, unchanged

P1, and it is now the largest thing left: line 63 still says a procedure's authority is "the commander's approval of their manifest line, which is the same authority by a cheaper route", while line 73 makes that line a condition and never a summary, and line 83 makes approving it the commander's whole involvement. Approving when to open a file is not approving what is in it.
P4: line 67 still reads "never the writer's extracts" four sentences before the writer hands over working notes of exactly that kind. Five words.
N2: option F still adopted against `CLAUDE.md:9` with the clause unnamed in the change list. Line 81 is the pattern for handling it.
N5: three jobs still on one approval act — the only growth limit at line 73, the only visible check at line 69 and 89, the only classification measure at line 98.
N6: the delivery hypothesis still measured by the pilot's log and the pilot's judgement.
N7: the branch rule will sit in the guard, `commander.md:17` and auto memory, with no de-duplication line.
N8: "structural" at line 69 still gates the only review a procedure gets and is still the author's call.

## Verdict

The periodic review is not where this method is weakest. You built it the right way round — detect cheaply, escalate rarely — and its only real hole is that it does not cover web records, which is C2 and is the one new finding worth the commander's time.
The weakest point is still P1, and it has survived three revisions: the dominant output's content is reviewed by nobody, and one clause claims otherwise.
Closing list, in order: C2, P1, C1, then P4 as a five-word fix. N2 is a consistency debt, not a defect.
I would send it after those four. Everything else is tightening and the paper is better than the evidence base it rests on deserved when this started.
