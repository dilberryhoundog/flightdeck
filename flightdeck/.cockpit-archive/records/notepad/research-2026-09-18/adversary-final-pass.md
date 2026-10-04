# adversary: register and the gates change (final pass) — T006

Both High findings are fully applied and I am closing them. The launch.json cluster is back with all four claims and `9b679556:3913` cited for the index. Gates have one home in the record titled for them, the supersession is narrowed to the switch, `9b679556:3273` is recorded as unsettled with the orchestrator session as the working choice, and `8fdc3b29:7217` is marked as the question it was. The duplicated quotations are resolved. Eight findings below, none High, two of which I would fix before this set goes up.

## The six records

**F1** — **A pointer to a section that does not exist, and phases are still undefined**
**S-M** · **C-H**
**FINDING**: The launch record closes "Phases, gates and what freezing means are in `state-and-freezing.md`." That record has sections for gates, for where state lives and for what freezing means. It has nothing on phases, and the word does not appear in it. Across all six records the word "phase" occurs exactly once, in this pointer. So the gates half of my original completeness finding is closed and the phases half is now not merely open but advertised: a pilot is told where to look and finds nothing there.
**EVIDENCE**: `grep -i phase` returns one hit across the six files, the pointer itself. The commander's phase sentence, "The other state is phase state. user gates etc. no problems with a a single json page handling this" (`8fdc3b29:5436`), is cited by no record now; the launch record restored the other three claims from that turn and left this one behind. Either define a phase from that sentence and the workflow material, or drop "Phases" from the pointer and say plainly that the commander has not defined one.

**F2** — **The citation collapse has come back, in the file that replaced the one where we closed it**
**S-M** · **C-H**
**FINDING**: The gates section cites three distinct transcript lines as `9b679556:3257`. Only the first quotation is at that line. This is the same defect we diagnosed as yours rather than the source's and spent a cycle closing, and the previous version of this material had one of the two right.
**EVIDENCE**: `3257` is "comment: oogwhey (from kungfu panda)... there is no gates, only workflows." The gate-switches quotation, "the original agent built launch.json to manage state, because he was a dumbo (not his fault)... never needed to flip gate switches. it was his idea not mine", is at `3259`. The workflow-agents quotation, "workflow agents write things. when they finish I check em. then if im happy I say to the orchestrator, yep do the next workflow", is at `3260`. The header lists `3257`, `3269`, `3271` and `3273`, and neither `3259` nor `3260`. Your earlier draft cited `3260` correctly for the second of these.

**F3** — **A header source the body no longer uses**
**S-L** · **C-H**
**FINDING**: `state-and-freezing.md` lists `8fdc3b29:5436` among its commander turns. No sentence in that record cites it any more; the material moved to the launch record when you restored the cluster.
**EVIDENCE**: The body cites `3257`, `3269`, `3271`, `3273`, `7217`, `5320`, `5435`, `7325` and `0fb7c77a:2991`. `5436` appears in the header alone.

One thing I am flagging rather than filing, because it is your call and I can argue it either way. "final gate is to start again or merge" now appears in `endings.md` on its own and inside the fuller `3271` quotation in `state-and-freezing.md`. Strictly that is one statement in two homes. In practice `endings.md` needs it to state its own topic's fact and defers everything else in the next clause, so I would leave it.

## The register

**F4** — **A codebase claim with no branch, path or commit**
**S-M** · **C-H**
**FINDING**: Two entries now name "Flightcrew's workflows README" as the thing being contradicted. That is the right fix for the straw-man risk and it makes both lines fairer. But the claim half is now a codebase claim carrying no source, while every verdict half carries a URL and a date. Rule 2 asks a codebase claim to name branch, commit and researcher, and the house form is `<branch>:<path> at <commit>`.
**EVIDENCE**: The two entries beginning "Flightcrew's workflows README asserts that a subagent worktree branches from HEAD" and "Flightcrew's workflows README gives the base ref as the reason". A reader in a dispute cannot find the README, cannot tell which branch it is on, and cannot tell whether it still says this. Worth a clarifying word too: the header excludes claims about flightcrew's code as terrain, and a reader may take these two as breaking that rule when in fact the verdict is about harness behaviour.

**F5** — **A claim about what a documentation page omits, standing since my first pass**
**S-M** · **C-M**
**FINDING**: The entry on permission forms still ends "the permissions page does not mention the workflow form". That is a fact about a page's current contents, not about the harness, and a doc edit falsifies it silently. No dispute is settled by knowing which page failed to mention something.
**EVIDENCE**: Rule 2's third test. The first half of the entry, that both forms are real and documented on different pages, stands on its own and is what a dispute would actually turn on.

**F6** — **A second claim about page structure rather than behaviour**
**S-L** · **C-M**
**FINDING**: The hook-events entry asserts the events are "documented events, each with its own section on the page". The section layout is not harness behaviour and will not survive a reorganisation of the docs.
**EVIDENCE**: Same test as F5. The durable half is that the event names bound in settings are documented and that exit 0 against exit 2 carries the documented meaning.

**F7** — **An exhaustive negative that cannot be established from one page**
**S-L** · **C-M**
**FINDING**: The turn-limit entry still asserts `maxTurns` "is the only documented turn limit". Standing since my first pass. The verdict does not need it.
**EVIDENCE**: The correction stands on partial marking and resumption alone, both of which are on the cited page with their version gate.

**F8** — **The operational half of the concurrency-slot finding is dropped**
**S-L** · **C-L**
**FINDING**: The entry says forks and resumed subagents "occupy concurrency slots without being blocked by the limit", which is accurate but stops before the consequence that matters when someone consults this line in a dispute.
**EVIDENCE**: The documented consequence is that resumes can push the running count past the limit. Without it a reader learns the slots are taken but not that the ceiling can be exceeded.

## Closed

My F1 and F2 splits are correctly applied: uncommitted work and the base ref are now two entries, one confirmed and one contradicted, each sourced. The hooks citation is restored with the doubled-sentence note and best practices beside it, which is the right outcome after my bad negative. All four conditional envelope fields are named. The nested-subagent clause is gone on the validator's verdict and the fork and resume slots are in. The managed-settings exception is worded correctly against the page.

## Still outside my scope

`quarters/commander/orders.json` has never been in my read scope and two entries there, `#O039` and `#O040`, now carry the resolution of two findings I filed. I have raised this twice. If the set goes to the commander described as attacked, that description does not cover those two claims.
