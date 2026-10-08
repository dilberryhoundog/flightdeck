---
type: "Crew Report"
unit: "commanders-advocate"
stamp: ["2026-09-29", "Pilot: Ace", "f6216b95"]
work: ["CO-114", "XD-013"]
context: ["M002"]
---
# Advocate check of the truth suite, the four advice statements, the move, the checks and XD-013

Seventeen findings, two candidate disputes. The advice is close but four statements over-reach or pack too much; two of the eight records are filed at the wrong level; XD-013's body states proposals where the truth asks for steps.

## Findings

**A1 — a truth statement is truncated.** truth-advice.truth statement 4: "The pilot writes new advice to be built against as their response to a " — the sentence stops mid-word-group inside the closing quote. Bears on: the record itself, and on truth-statement statement 1, "Truth statements are universal standalone statements of truth ... They are not ambiguous in isolation". Wrong: the statement cannot be read and understood alone, so nothing can be checked against it. Fix: ask the commander to finish the sentence.

**A2 — truth-suite.truth has no colon on its topic line.** truth-record statement 2: "A topic title lives on the first line with a colon." truth-suite.truth line 1 reads `truth-suite`. The other seven records comply. Wrong: contradicts the commander's own format rule, so a deterministic reader cannot find the topic. Fix: ask the commander to add the colon.

**A3 — off-the-record.truth nests quotes inside a statement.** truth-record statement 2: "Statements are placed internally inside quotes, with a line space apart." The single statement contains `"Off the record"` inside itself. Wrong: a quote-delimited parse splits it into two statements; I confirmed this mechanically. Fix: ask the commander to use single quotes for the inner phrase.

**A4 — advice 2 lets a test replace a statement.** truth-record statement 5: "Truth records can be replicated or backed up with deterministic tests within the project." And statement 1: "Every statement in a truth record is a fact that must exist in the project." Advice statement 2 ends "the path of a test once one has replaced the statement". Wrong: drifts. Truth says a test replicates or backs up a record, never that it replaces a statement; a replaced statement stops being a fact in the record. Fix: write "the path of a test that checks the statement, once one exists".

**A5 — advice 4 freezes all advice during a build.** truth-advice statement 9: "An advice file can be locked, to be built against. A check is written, whereby the advice replaces the original truth record during a build run. If the build fails the advice is opened again for mutation." Advice statement 4 says "no agent mutates a truth record or an advice file in that time". Wrong: drifts past the truth. The truth locks only the one advice file locked for that build, and reopens it on failure; the advice freezes every advice file in the project. Fix: limit the freeze to truth records and to the advice locked for that build.

**A6 — advice 4 carries two subjects.** truth-record statement 4 (the level rule for topics): "Each topic should contain truth about a single thing or concept only." With truth-statement statement 1 on standalone statements. Advice statement 4 states when advice is imported and when truth is locked in one breath. Wrong: two facts in one statement, so the commander cannot settle one and adjust the other. Fix: split into two advice statements.

**A7 — advice 2 is long and uses jargon.** truth-statement statement 1: "they are in plain, simple and clear language, with no jargon". Advice statement 2 runs about ninety words, carries path, authorship and a six-field list, and uses "red-green read" and "sweep". Wrong: drifts from the stated register. Fix: split into three statements (where the check file sits, who writes it, what it holds) and say the check kinds in plain words.

**A8 — truth-suite.truth is filed as a concept but is a principle.** truth-suite statement 10: "Principles are found where truth statements repeatedly across many truth files or concepts, try to convey meaning that has no direct existence in a file. They do not guide layout, location, field types, data, but instead provide a purpose for the file or concept exisiting in the first place." And statement 11: "do not try to determine a principle is followed as a red/green check". The record defines what truth is for and how abstraction is layered; none of it lands in a file. Wrong: the move put it in `concepts/`, and its check file marks all eleven statements "sweep". Fix: move it to `principles/` and set its checks to none.

**A9 — off-the-record.truth is filed as a concept but is a principle.** Same two statements. Its one statement says the format "generates no records" — it governs nothing on disk, which the clerk recorded honestly as `"governs": []`. Wrong: a concept "can be detected in the project" (truth-suite statement 5); this one is defined by absence. Fix: move to `principles/`, check none.

**A10 — truth-statement.truth mixes two levels.** truth-record statement 4: one thing per topic. Statements 1, 2, 3 and 5 describe the form of records on disk (concept). Statement 4 ("Agents are forbidden to write truth statements, they stay sacred to the human") and statement 6 (altitude) have no file existence and give purpose (principle). Wrong: the record spans levels, so one level label on the file is false for part of it. Fix: put it to the commander as a possible split; leave the file where it is until he rules.

**A11 — `governs` is a placeholder, not the governed files.** Advice statement 2 requires "the files the statement governs". Thirty-three of forty-one statement rows carry the identical pair `["records/truth/", "records/advice/"]`, which are directories, not files, and are the same for every statement. Wrong: drifts — a sweep keyed to the same two directories for every statement distinguishes nothing. Fix: leave `governs` empty where the files are not yet known, as XD-013 unit 5 said it would.

**A12 — a sweep over nothing.** off-the-record.check.json has `"governs": []` with `"check": "sweep"`. Wrong: the check kind asserts a sweep that has no files to sweep. Fix: set `"check": "none"` (and see A9).

**A13 — the last-result shape is undeclared.** Advice statement 2 requires "the last result with its date and agent". Every row holds `"last": null`. Wrong: cosmetic — null is a reasonable "never run", but the shape it will take is written nowhere. Fix: write `{"date": null, "agent": null, "result": null}`, or state in the advice that null means never run.

**A14 — the manifest is unauthorised.** No truth statement and no advice statement provides for `records/truth/MANIFEST-truth.json`. It copies each record's topic line and statement count. Wrong: drifts — it is a second index of the commander's records that can fall out of step with them, and nothing says it should exist. It holds no statements, so it does not breach truth-statement statement 4. Fix: add an advice statement for the manifest, or drop it and let the check files be the index.

**A15 — XD-013's body states proposals, not steps.** decision.truth statement 2: "The decision body contains the path from the order itself to it's satisfaction. Broken down into individual units of every step, action or intention the pilot will make." Units 2, 4, 6 and 7 each open "I propose ..." and then carry the substance of the proposal; unit 1 already holds the step that writes them. Wrong: drifts — those units are content, not path. Fix: make each unit the step the pilot takes, and let the advice file hold the proposal's content.

**A16 — approval is recorded before the commander gave it.** decision.truth statement 4: "The commander then enacts their approval (full, part, held)." XD-013's frontmatter reads `status: "frozen"` and `approval: "full"`, while its own unit 9 says the pilot will tell the commander the workshop is ready for his read, and index.json says `"status": "open"`. Wrong: contradicts — the pilot has written the commander's act. Fix: set approval to held until the commander enacts it.

**A17 — two unindexed files in the workshop.** Advice statement 3: the workshop holds the order, the decision and an index naming every record, and "Dossiers, disputes and advice keep their own rooms and are named in the index, so each record has one home." The workshop also holds `decision.txt` (an older variant of decision.truth: it reads "Inside each unit" where the truth reads "Separately to, or within a unit") and an empty `advice.txt`. Neither is in index.json. Wrong: a truth-format .txt is an advice file by truth-advice statement 2, so this is a stale second copy of a truth record with no home. Fix: delete both, or move `decision.txt` to `records/advice/` and name it in the index.

## Candidate disputes

Not filed. For the pilot to file if he agrees.

### advice-is-statement

- type: dispute, status: open, stamp: 2026-09-29, statement: `records/truth/concepts/truth-statement.truth`, disputed: [`records/truth/concepts/truth-advice.truth`]

**The statement.** truth-statement.truth, statement 4: "Agents are forbidden to write truth statements, they stay sacred to the human."

**The contradiction.** truth-advice.truth, statement 5: "An advice is a statement similar to a truth statement, this difference is if the statement is in a .truth or .txt file." With statement 6: "An agent can only write a new advice statement inside the record."

**The reasoning.** If the only difference between an advice statement and a truth statement is which file it sits in, then an agent writing an advice statement is writing a truth statement into a .txt file, which the first statement forbids outright. Either an advice statement is a different kind of thing from a truth statement, or the prohibition needs to name the file rather than the statement. As written the two records cannot both hold.

### build-lock

- type: dispute, status: open, stamp: 2026-09-29, statement: `records/truth/concepts/truth-record.truth`, disputed: [`records/truth/concepts/truth-advice.truth`]

**The statement.** truth-record.truth, statement 7: "Truth records are locked during any build phase to prevent any agent from mutating them."

**The contradiction.** truth-advice.truth, statement 9: "An advice file can be locked, to be built against. A check is written, whereby the advice replaces the original truth record during a build run. If the build fails the advice is opened again for mutation."

**The reasoning.** Replacing a truth record during a build run is a mutation of a truth record during a build phase, which the first statement forbids. The second statement also does not say who performs the replacement; if an agent does it, the lock is broken by the very mechanism the lock protects. The commander may mean the swap is made before the build starts and reverted after, which would settle it, but the records do not say so.

## What I checked and found sound

- The move is clean. Git records all eight as pure renames with zero lines changed; no agent has touched a statement.
- The check files are mechanically correct. I parsed each record and compared: every statement index and every `opening` string matches the record's statement text exactly, and every count matches — decision 6, dispute 5, off-the-record 1, truth-advice 9, truth-record 7, truth-statement 6, truth-suite 11, workshop 2.
- The manifest's counts, topics, paths and check paths all match the files on disk (its existence is A14; its contents are accurate).
- Check paths mirror record paths as advice statement 2 requires: `concepts/x.truth` to `checks/concepts/x.check.json`.
- Every path named in index.json, in the check `governs` fields and in XD-013 resolves on disk, including `records/pilot/disputes/`, `base/verify/schema/pilot-decision.json` and `base/verify/schema/pilot-dispute.json`.
- Advice statement 1 (three rooms) contradicts no truth statement; `principles/` and `files/` exist and are empty as it describes, and nesting stays inside `records/truth` as truth-record statement 3 requires.
- Advice statement 3 (workshop directory) agrees with decision.truth statement 6 and with workshop.truth; it restates rather than extends.
- XD-013 has both a framing and a body (decision.truth statement 1), declares context, tooling and verification separately to the units as statement 3 permits, flags every unit `+` with none negated as statement 4 describes, and sits in the workshop directory holding CO-114 as statement 6 requires.
- decision.truth, dispute.truth, workshop.truth, truth-record.truth and truth-advice.truth are concept level by truth-suite's own tests: each names a thing the project has, spread across many files, not a single implementation.
