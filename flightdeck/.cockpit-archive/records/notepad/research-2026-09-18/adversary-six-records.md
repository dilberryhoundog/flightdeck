# adversary: six records — T006

DS001 is now in scope and I have checked all seven claims that rest on it. Six verify verbatim. The seventh is F6 below. The coverage gap I flagged is otherwise closed.

**F1** — **The gates supersession is over-read, and the same Q&A block undercuts it**
**S-H** · **C-H**
**FINDING**: Three records now assert flatly that there are no gates, and the whole restructure rests on it. Read in place, "there is no gates, only workflows" rejects gate switches as machinery the human flips, not the concept of a gate. The commander goes on using the word affirmatively in the same block, and endorses an answer that puts gate-clearing back in `launch.json`.
**EVIDENCE**: At `9b679556:3259` the commander explains the complaint: "the original agent built launch.json to manage state, because he was a dumbo... never needed to flip gate switches. it was his idea not mine." Twelve lines later, `9b679556:3271`: "final gate is to start again or merge. the other two you have correct plan and interfaces." Sixteen lines later, `9b679556:3273`, the answer the commander selects reads "An orchestrator session invokes the workflows in order, stops at each gate, and reports; the human clears the gate in launch.json", and their comment is "this i haven't found an answer for. worthy question though. imma go with the orch session." A pilot reading "There are no gates" will contradict the commander's own selected answer. Narrow the supersession to gate state as a flippable switch, keep the human decision points as gates, and record `3273` as unsettled rather than superseded.

**F2** — **`launch.json` has disappeared from the entire set**
**S-H** · **C-H**
**FINDING**: The string `launch.json` appears in none of the six records. The pilot can no longer learn from these records that the file exists, that it indexes the launch, or that it names the current run. The turn that was superseded carried three other claims that were not superseded, and they went with it.
**EVIDENCE**: `8fdc3b29:5436` reads "The other state is phase state. user gates etc. no problems with a a single json page handling this. also it removes the need for isolation gymnastics from fc (flight) trying to ensure only one run folder is active. launch.json names the current run, that is now the active run for the launch, if a run fails, then launch can get a new run attempt as the only runnable branch." Only the first sentence is touched by `9b679556:3257`. The rest is current form. Separately, `9b679556:3913`, "pretty sure launch.json is settled as an index", is cited by no record in the set. Restore the index role, the current-run pointer and the failed-run branch rule.

**F3** — **Gates are answered in three records at once**
**S-M** · **C-H**
**FINDING**: Revised rule 2 says a record is the settled understanding of one topic "so an agent reads one file for one question". Gates fail that test three ways. Two quotations appear verbatim in two records with identical citations, and the record whose title promises gates immediately sends the reader elsewhere.
**EVIDENCE**: "human does not gate the waves" (`9b679556:3269`) and "basically all human after that. final gate is to start again or merge. the other two you have correct plan and interfaces" (`9b679556:3271`) appear in full in both `launches-and-runs.md` and `endings.md`. `state-and-freezing.md` is titled "State, Freezing and Gates", opens "There are no gates", then says "What a gate gates and where the human decides are in `launches-and-runs.md`." Pick one home. Given the titles, gates belong in `state-and-freezing.md` and the other two should defer to it, which reverses the current direction of the pointers.

**F4** — **Four sources cited in the body are missing from the header**
**S-M** · **C-H**
**FINDING**: Rule 2 requires the header to name the record's sources, and yours is offered as the thing a reader works from instead of hunting. Four turns quoted in `launches-and-runs.md` are absent from its header list.
**EVIDENCE**: The body cites `8fdc3b29:3567` twice, and `8fdc3b29:5436`, `8fdc3b29:7217` and `bab64608:1767` once each. None appears in the header, which lists fourteen other turns.

**F5** — **A question is recorded as a statement, and it carries weight in F1**
**S-M** · **C-M**
**FINDING**: `launches-and-runs.md` states that running workflows dynamically "would abolish most of the 'phasing' state, and command scripting". The commander asked this; they did not assert it. The sentence is part of what the gates section leans on.
**EVIDENCE**: `8fdc3b29:7217`: "the reason i ask is instead of all this scripting gymnastics, could we just say. here is run folder, spec and plan. use workflow x with these few modifiers as our kickoff. then we have omakase dynamic workflows instead? this would abolish most of the 'phasing' state, and command scripting yeah?" It opens "the reason i ask" and closes "yeah?".

**F6** — **DS001 does not confirm the three rules**
**S-M** · **C-M**
**FINDING**: `tests-and-checks.md` closes "What does confirm the analogy is the commander's own later advice, naming the Rails test folder as the gold standard for flightdeck's own suite (`DS001`)." Having now read DS001, it does not reach the three rules. It settles the shape of the test folder, not what a characterization test should restate or rely on. The pilot has ruled otherwise and this is their call; I record the disagreement once and leave it.
**EVIDENCE**: DS001's sentence sits in a paragraph about suite weight: "we want to avoid having to tune the suite everytime a build run is attempted because our testing is too heavy handed. The gold standard here is a standard ol rails test folder. that can travel with flightdeck even when it becomes distributable (future mission)." Nothing there addresses restating a behaviour model, relying on existing tests, or defining observable difference. Suggested wording: DS001 confirms the Rails test folder as the gold standard for the suite; the three rules themselves remain the commander's proposal and their question unanswered.

**F7** — **The commander's own conflation of run and launch is cut from the quote that defines a run**
**S-M** · **C-M**
**FINDING**: `launches-and-runs.md` defines a run using the back half of a sentence whose front half has the commander using the two words as one. Since the pilot has taken exactly this conflation to the commander as an open question, the evidence should be surfaced rather than trimmed away.
**EVIDENCE**: `a9389f8c:3618` in full: "The convention is for a `run` (launch) to happen under the same directory but a second pass of the same run requires the same directory used. a v2+ spec. and v1 failing." The record quotes from "a second pass" onward. The parenthesis is the second instance of this conflation I have found, after "the next launch creates new run PR's" at `9b679556:6718`, and it strengthens the case for asking.

**F8** — **A hedge dropped on stalls**
**S-L** · **C-M**
**FINDING**: The stall rule is stated flatly. The commander disclaimed expertise in the same breath.
**EVIDENCE**: `9b679556:3966`: "a stall should engage a second stronger agent. if that stalls the run is stopped. if its a workflow it can be handled but im not the expert."

**F9** — **The testbench intention is asserted where the commander was recalling**
**S-L** · **C-M**
**FINDING**: `tests-and-checks.md` says "the commander gives it as that folder's intention". They were reaching for what the intention had been and said so.
**EVIDENCE**: `a9389f8c:3305`: "I think the intention was... when using flight deck in a folder with no test/ this becomes a known place..." Your wording honours the intention half and loses the uncertainty half. "recalls the intention as" carries both.

## Your structural calls

I support the split and am not arguing any pair back together. `endings.md` and `state-and-freezing.md` answer different questions, and merging either into `launches-and-runs.md` would take it past the tripwire while making the one-file-one-question rule harder, not easier. My only structural objection is F3, which is about where gates live, not about how many records exist.

## Your reconciliation coverage

Both declared exclusions are right. `8fdc3b29:202` is genuinely superseded by DS001's fuller definition, and `8fdc3b29:8574` is correctly kept as an open question rather than a fact; `endings.md` handles it better than a fact would have. The material you dropped without declaring it is the `launch.json` cluster in F2.

## Checked and passing

Every new citation I spot-checked is exact at its line: `bfb87cff:141` and `:168`, `4f6285bb:475`, `0fb7c77a:2013` and `:2991`, `9b679556:25`, `:7302`, `:3966`, `a9389f8c:3618`, `8fdc3b29:204`. Spelling is preserved throughout, including "improvment" in the Hangon quotation, which fixes the regression I raised last pass. The three-rules section is correct on modality and now cites `7642`, `7643` and `7644` separately. DS001's six other claims are verbatim.
