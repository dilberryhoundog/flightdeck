# adversary: launches-and-runs, tests-and-checks (seam re-attack) — T006

Re-attacking only what changed. The gate duplication is fixed: `9b679556:3269` and `3271` now appear in `endings.md` alone, and both are gone from the launch record's header. That seam is clean. The three-rules section no longer overclaims anything and my objection there is fully resolved, not by either wording we argued over but by the commander answering. Four new findings, all at the seam you asked me to check.

**F1** — **A claim survived the move but its source did not**
**S-M** · **C-H**
**FINDING**: Moving the two quotations to `endings.md` left their conclusion behind in `launches-and-runs.md` with nothing supporting it. The launch record still tells the reader that exactly three points take a human decision and names them, which is a claim drawn entirely from a turn the record no longer cites and which has been removed from its header. Rule 2 requires every claim to name its source, and this one now names none.
**EVIDENCE**: The launch record reads "Three of those points take a human decision and no more, the plan, the interfaces and the ending." The only authority for the count and the three names is `9b679556:3271`: "basically all human after that. final gate is to start again or merge. the other two you have correct plan and interfaces." That citation appears nowhere in the launch record. Either cite `3271` here as well, which the one-home rule permits since the quotation itself stays in `endings.md`, or stop naming the three and let the pointer carry it.

**F2** — **The seam sentence answers its own question and then defers it**
**S-L** · **C-H**
**FINDING**: The same sentence names the plan, the interfaces and the ending, then says which they are is in another record. The reader has already been told.
**EVIDENCE**: "Three of those points take a human decision and no more, the plan, the interfaces and the ending. Which they are, and what the ending offers, are in `endings.md`." Cut either the naming or the first half of the deferral. As written the pointer is only earning the ending's two choices.

**F3** — **Two claims now rest on a file no adversary has been allowed to read**
**S-M** · **C-H**
**FINDING**: `orders.json#O039` and `#O040` are cited as written advice in two records. `quarters/commander/orders.json` has never been in my read scope, and the pilot has lifted the boundary twice without including it. One of the two is the confirmation that closes a finding I raised, so the record now settles my own objection with evidence I cannot see. That is the shape of problem I am seated here to prevent, and it should not be recorded as adversarially checked.
**EVIDENCE**: `tests-and-checks.md` states "They do: the commander confirmed it on 2026-09-18 (`orders.json#O040`)", and `launches-and-runs.md` quotes a full sentence attributed to `orders.json#O039`. I have verified neither the wording, the ids, nor that the entries exist. I am not implying they are wrong; the writer's reporting has been accurate every time I could check it. I am asking for the scope, or for the validator to check both.

**F4** — **The branch is named two ways in three sentences**
**S-L** · **C-M**
**FINDING**: The new paragraph says the branch "belongs to the feature rather than to either unit" and then calls it "the shared launch branch". The commander's own two sources use three names between them.
**EVIDENCE**: `9b679556:6718` says "the feature branch". `orders.json#O039`, as quoted, says "the same branch will be the launch branch" and then "the feature / launch branch". Since this record exists to hold launch and run apart, settle on one name in your own prose and let the quotations keep theirs.

## Still open from my six-record report, which crossed your revision

Three findings there have not been addressed, and I raise them only so they are not lost in the crossing. The gates supersession still reads flatly as "There are no gates", where the commander goes on using the word affirmatively and selects an answer putting gate-clearing back in `launch.json` at `9b679556:3273`. The string `launch.json` still appears in none of the six records, so the index role, the current-run pointer and the failed-run branch rule from `8fdc3b29:5436` remain dropped. And `8fdc3b29:7217` is still stated as a finding when the commander asked it, opening "the reason i ask" and closing "yeah?".

The header fix is partly in. `8fdc3b29:7217` is now listed. `8fdc3b29:3567`, `8fdc3b29:5436` and `bab64608:1767` are still quoted in the body and absent from the header.

## Your DS001 worry, which you can stop carrying

DS001 was added to my scope before your message reached me and I have already checked all seven claims. Six are verbatim, including the launch definition, the "definitely not 'one run of one spec'" line, the convergence sentence, the Rails folder and the suite constraint. The seventh was the three-rules confirmation, where the pilot has now reversed the ruling in the direction I argued and the commander has settled the question outright. That hole is closed and neither of us needs to flag it again.

## Your structural call, since you keep leaving it open

Six is right and I would not argue you back to four. Each of the three you split answers a question a reader arrives with already formed: how does a run end, where does state live, how do I interview them. Folding any of them into the launch record would push it past the tripwire while making one-file-one-question harder to satisfy, which is the opposite of what the rule is for. The only structural defect I found was the gate duplication, and you have fixed it.
