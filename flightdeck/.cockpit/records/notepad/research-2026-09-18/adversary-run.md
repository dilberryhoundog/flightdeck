# adversary: run — T006

The strongest of the four. The ending quote is exact, the gap declaration is the right call, and I am not arguing the scope cut. Four findings, none high.

**F1** — **A past fault is recorded, which is the thing DS002 struck out**
**S-M** · **C-M**
**FINDING**: Line 25 quotes the fault the correction was aimed at: "you seem to be versioning new runs before the source run is over." That is a thing a particular agent did wrong on a particular day. Rule 2 wants the current form only, and the commander's ruling on the earlier dossier was explicit that ancient history disables a record. The rule survives without it: a run ends, the commander writes the log, the next version absorbs it, the pilot hands over considerations.
**EVIDENCE**: Rule 2, second test: "it states the current form only, no history, no divergence, no process." DS002: "we are trying to store timeless records here, not ancient history." The quote is accurate, at `bab64608:1767`, so this is a scope finding and not a fidelity one. Keep the correction, drop the diagnosis.

**F2** — **A repair option is added that the commander never raised**
**S-L** · **C-H**
**FINDING**: Line 7 says "a failed run is abandoned, not patched". The commander said to abandon failed runs. They did not contrast abandonment with patching, and the contrast implies patching was on the table as the rejected alternative.
**EVIDENCE**: `8fdc3b29:181`: "abandon failed runs. runs should accumulate many retries until they succeed, rather than one shotting." The contrast the commander actually drew is with one-shotting, which you state correctly in the same sentence of `launch.md:23`. The same addition appears in both drafts.

**F3** — **A quote about the toolkit is listed among turns bearing on a launch**
**S-L** · **C-L**
**FINDING**: Line 29 offers "If a users idea of a piece of work can be handed over and agents build it for them, this work has been completed" as the completion test bearing on when a launch is done. In context that sentence closes a paragraph defining what the whole orchestration toolkit is for, not what finishes one launch.
**EVIDENCE**: `9b679556:7261` runs from "HITL ai engineering, falls short for any large or complex task..." through "This orchestration toolkit is built for a single Claude Code max subscription user..." and ends with your sentence. The subject throughout is the toolkit. I am raising this at low confidence because your line already refuses to assemble an answer and tells the pilot to ask, which contains the risk. If anything it strengthens your case: the third turn is further from the question than the other two.

**F4** — **A causal link rests on a line that does not carry it**
**S-L** · **C-M**
**FINDING**: Line 13 says verification being a retry axis is "why checks sit in the run and not in the launch (`8fdc3b29:3569`)". Line 3569 places checks in `run-1/checks` but draws no connection to the retry axes. The reason the commander gave for checks living in the run is growth, not the axes.
**EVIDENCE**: `8fdc3b29:3452`: "checks/ should live in each run instance as they may have to change/grow as the iterations discover check improvements". That is the stated reason, and you quote it correctly two lines earlier. The axes line, `8fdc3b29:206`, is consistent with the placement but does not explain it. Cite `3452` for the "why".

## Checked and passing

Line 17 is the centrepiece and it is exact. `9b679556:3683` reads "the build workflow runs, if green and review passes it ends a PR is opened. I am informed and I read the reports check stuff out (I don't just look at the PR). if happy I merge, if not a fill in runlog and try again. reject PR delete branch." Your transcription preserves every oddity including "a fill in runlog". Line 19's reading of it is fair: the machine's part, the commander's decision, the rejection path. Line 23 and the correction quote in line 25 both match `bab64608:1767`. Line 7's throwaway-branch claim matches `9b679556:6718`, and unlike `launch.md` this file does not substitute "run" for "launch", because it does not reach that clause. Line 9's liftoff and checks placements match `9b679556:4424` and `8fdc3b29:3452`.

## On your axis 2

Cutting every comparison with the v1 runner was right and I am not arguing it. DS002 ruled the measurement of divergence out in terms that leave no room: the commander said they raised departure only so the day-one resources would not be treated as canon, and that they do not want divergence measured. Nothing the pilot needs to run a launch was lost, because what the runner currently does is discoverable from the runner.

One thing that ruling does not cover, and that none of the five files does. DS002 also asked you to "look for relevance in the cannon, has a claim superseded another." That is supersession, not divergence, and it survives the cut. I looked for an unflagged supersession across the turns you cite and did not find one: `9b679556:3844`, which moves the spec and maps from the run space to the launch space, refines `8fdc3b29:3039` rather than overturning it, and the two sit together without contradiction. So the answer is that nothing was lost, but the check is worth stating in the file so a later reader knows it was run.

## Docspec

29 lines, eleven of headroom, the most of the four. Header carries the notepad pointer. Line 29's declared gap is the right shape for a record: it states the current form, which is that the commander has not ruled, and tells the pilot what to do about it instead of inventing an answer.
