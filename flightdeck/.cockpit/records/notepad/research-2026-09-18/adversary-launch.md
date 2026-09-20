# adversary: launch — T006

**F1** — **The commander's word "launch" is silently changed to "run", in the record that exists to separate them**
**S-H** · **C-M**
**FINDING**: Line 39 reads "the next run opens its pull requests against the mutated branch". The commander wrote "launch", not "run". Every other sentence in these two records works to keep the two words apart, and this one quietly merges them at the exact point where the topology decides which unit owns a pull request. If the commander meant what they typed, the record is wrong. If they misspoke, the record is silently correcting the only person whose usage defines these terms.
**EVIDENCE**: `9b679556:6718`: "sure each run needs to happen on a throw away branch that ends with a PR back to the feature branch. if accepted the feature branch is mutated and the next launch creates new run PR's against it. when the feature is finished it all merges back to main." Note "the next launch creates new run PR's". Your first and third sentences track the source exactly; only the middle one substitutes. Either quote it and leave the tension visible, or ask the commander which they meant. Do not resolve it in the record.

**F2** — **A tree presented as the commander's typing has been rewritten**
**S-M** · **C-H**
**FINDING**: Line 19 says "Source: `8fdc3b29:3039`, typed by the commander as a tree." Two problems. The tree is not at 3039, and the block you print is not what they typed.
**EVIDENCE**: The tree is at `8fdc3b29:3029`-`3037`; line 3039 is the prose you quote on line 7. What the commander typed runs: `launch/`, `<name>/`, `specs/`, `interview/`, `spec.v1.json`, `test-map.v1.json`, `runs/run-<n>`, `run outputs...`, `FLIGHTLOG.md`. Your block adds indentation, collapses three children into brace notation `specs/{interview/, spec.v1.json, test-map.v1.json}` which the commander never wrote, adds a trailing slash to `runs/run-<n>`, and drops `run outputs...` entirely. Print it as they typed it, or drop the claim that it is their typing. Your placement of `FLIGHTLOG.md` under `launch/` is an inference the commander's flat block does not settle, but `9b679556:1063` corroborates it, so the inference is safe and only the attribution is not.

**F3** — **The paragraph contradicts itself inside two sentences**
**S-M** · **C-H**
**FINDING**: Line 33 opens "`launch.json` is an index and nothing more" and then says it "carries the launch's phase and gate state". A file that carries phase and gate state is more than an index. "and nothing more" is also not the commander's; they said it was settled as an index, which is a weaker claim that does not exclude state.
**EVIDENCE**: `9b679556:3913`: "pretty sure launch.json is settled as an index. both those statements mean the same thing." The phase and gate content is real and comes from `8fdc3b29:5436`: "The other state is phase state. user gates etc. no problems with a a single json page handling this." Both are true; only "and nothing more" is yours, and it is what creates the contradiction. Cut those three words.

**F4** — **The retry-axes claim is cited to a line that does not contain it, and the set cites it two different ways**
**S-M** · **C-H**
**FINDING**: Line 28 says "verification is one of the axes a retry is allowed to change (`8fdc3b29:3569`)". Line 3569 is the placement pipeline and says nothing about retry axes. Your other two drafts cite the right line for the same fact, so the set is internally inconsistent about where this claim lives.
**EVIDENCE**: The axes are at `8fdc3b29:206`: "this lines up well with the three failure axis principle; look at context, verification or tooling for improving the run." `run.md:13` cites `206`, and `tests-and-checks.md:25` cites `206`. Only `launch.md:28` cites `3569`.

**F5** — **A quoted string is silently corrected**
**S-L** · **C-H**
**FINDING**: Line 7 quotes "a launch instance retries until it succeeds". The commander typed "untill". You asked me to check spelling inside quotes, and this is the one that moved.
**EVIDENCE**: `8fdc3b29:3039`: "a new launch builds a new feature, a launch instance retries untill it succeeds, no duplicated specs single source of truth". Everything else in the quoted string matches. Elsewhere you preserve "regresion", "assertations" and "should.ve", so the standard is already yours; this is a slip, not a policy.

**F6** — **Rhetorical questions are recorded as settled rules**
**S-L** · **C-M**
**FINDING**: Line 23 states that "a successor version sits adjacent to its predecessor, and the spec is never separated from the run assets it drives". The commander asked both of these rather than asserting them. The intent is plainly leading, so this is much milder than the same problem in `tests-and-checks.md`, but the record states as settled what the source only implies.
**EVIDENCE**: `8fdc3b29:181`: "if spec.v2.json is an iterated evolution of spec.v1.json don't we want it adjacent? ... do we want our spec sperated from the run assests it drives?" Both are questions. The surrounding assertions in the same turn, "abandon failed runs" and "runs should accumulate many retries until they succeed", are genuine statements and carry the section on their own.

## Checked and passing

Line 27 matches `9b679556:3844` exactly. Line 29's flight-log path matches `9b679556:1063`, and the run-log placement matches `9b679556:5650` ("RUNLOG stays where they are"). Line 28's liftoff path matches `9b679556:4424`. Line 33's isolation-gymnastics quote matches `8fdc3b29:5436` word for word, including "fc (flight)", and the sentences around it paraphrase the rest of that line faithfully. Line 23's opening principle matches `8fdc3b29:181`, though "rather than patched" is your addition to "abandon failed runs" and adds a repair option the commander never raised.

## Docspec

39 lines, one inside the cap, so any growth on revision has to be paid for elsewhere. Header carries the notepad pointer rule 2 permits. No history and no divergence. F1 and F2 are the two that would still be wrong in two years.
