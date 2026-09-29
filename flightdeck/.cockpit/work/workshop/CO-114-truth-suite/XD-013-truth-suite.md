---
type: "Pilot Decision"
unit: "XD-013"
name: "truth suite"
status: "frozen"
draft: 1
stamp: ["2026-09-29", "Pilot: Ace", "f6216b95"]
answers: ["CO-114"]
approval: "full"
---
# XD-013 — Settling the truth suite's shape

## Framing

CO-114 asks for the semi-settled details of the truth suite to be thrashed out in this workshop until they hold, by rigour or by retrying. Four details are semi-settled: how truth records are separated by level into directories; how truth checks connect a record to its files as agent-written JSON; what a workshop directory holds; and when advice is imported and truth locked. The commander's truth records at `records/truth/` govern; where they are silent this decision proposes advice, which is the only truth an agent may touch, and the commander settles it or adjusts it. This decision is satisfied when the four details are written as advice statements the commander has left standing, the eight truth records sit in the proposed directories, a check file exists for each, and the seven workshops are open and readable.

Context: the eight truth records; `cockpit.constitution` as the quarry for principles and concepts; the CA corpus at `records/commander/advice/` as the quarry for file and concept records; the off-the-record exchange of 2026-09-28 and 2026-09-29 as the record of what was proposed. Tooling: grep for discovery; a clerk return subagent for moves, listings and lint; the commanders-advocate as a return subagent to check the advice against the truth records; the fit-critic live if a round runs long. Verification: the advocate's check of every advice statement against the truth records; a clerk's listing of the directories after the move against the proposal; the commander leaving the advice standing.

## Body

+ I write the four proposals as advice statements in `records/advice/truth-suite.txt`, one statement each in the truth format, because truth-advice says an agent may write a new advice statement and never a truth statement, and advice is where a detail sits while it is on trial.
+ I propose the directory shape as three rooms under `records/truth/`: `principles/` flat, `concepts/` flat, `files/` nested to mirror the project so a record sits where its file sits and a group record sits at the group's directory; because the commander does not want thirty agent records flat when they can nest under crew, and mirroring the project means a record is found from its file without a lookup.
+ I have a clerk move the eight records into `concepts/` (all eight are concept level by the suite's test: they name things the project has) once the commander leaves the shape standing, because moving a record is not changing a statement, and a clerk does bulk file work.
+ I propose the check file as `records/truth/checks/` mirroring the truth tree, one `<topic>.check.json` per record, keyed per statement by its index and opening words, holding the level, the governed files, the check kind (red-green read for file level, a sweep across the listed files for concept level, none for principle level), the last result, and the test that has replaced the statement if any; because the commander wants an agent-friendly link from record to files that he never has to read, and keying by opening words makes a moved statement detectable.
+ I have a clerk write the first eight check files from the records as they stand, with the governed files left empty where a concept has not been built yet, because a check file with no files is still the place the sweep will fill in and it proves the shape.
+ I propose the workshop directory as `work/workshop/<CO-id>-<name>/` holding the order record, the decision, and an `index.json` naming every record the workshop spawned or touches (dossiers, disputes, advice) by id and path, with those records staying in their own rooms; because the commander wants one place to see an order and what it spawned, and a record with an id keeps one home so its manifest does not lie.
+ I propose that advice is imported while a workshop shapes the work and truth is locked when a build team is dispatched, because the workshop truth says the workshop does not build, and the lock is against agents mutating truth during a build.
+ I have the commanders-advocate check the four advice statements and the moved records against every truth record and report contradictions as disputes, because a dispute is how an agent tells the commander his statements clash, and the advice must not contradict truth before he is asked to settle it.
+ I put the advocate's report and the clerk's listings in this workshop's index and tell the commander the workshop is ready for his read, because the commander settles advice into truth and only he can.
+ I retry any detail the commander adjusts by writing a new advice statement beside the old one and never editing his adjustment, because an agent writes new advice statements only.
