# cockpit-comber report — phase 1 only

Crew C010, teammate `cockpit-comber` (general-purpose, Sonnet), 2026-09-18, session 49f87e44. Went idle before docs-scout's findings reached it; phase 2 reassigned to an Opus teammate (C011). Filed as returned.

## Candidates to move or copy into CLAUDE.md
- M1: `job.md` crew rule 3, crew see only the brief and the CLAUDE.md files of directories they read. Judgement: CLAUDE.md. Explains why the file matters to any arriving agent.
- M2: `job.md` crew rule 4, crew never write in the cockpit. Judgement: neither; CLAUDE.md already says it under "If you are crew".
- M3: `quarters/pilot/README.md` note that a repeated `--append-system-prompt-file` keeps only the last file and `@` imports do not expand in appended files. Judgement: CLAUDE.md footnote near the records import.
- M4: `commander.md` preferences (single-line markdown, no tables in chat, dev-workspace commands, explicit `git add`). Judgement: quarters, possible one-line pointer from CLAUDE.md.
- M5: `job.md` mandate 2, look do not dig. Judgement: quarters; constrains the pilot, not the place.
- M6: `records/README.md` what qualifies / what does not. Judgement: contingent on the import check; if the import is unreliable, a one-line inline summary in "How to find things".

## Candidates to remove from CLAUDE.md
- R1: rule 2 sentence "Promotions or Official sources as mentioned here `@records/README.md`" is grammatically broken; rewrite. No other removals; A11 (session start stated twice) is resolved by the split.

## Import check
Unresolved pending docs. Noted that the README fact about appended files concerns the system prompt path, not CLAUDE.md.

## Proposed outline
What this place is; Who is here; Rules (rule 2 rewritten, optional rule from M1); How to find things (optional records note, M6); footnote on import mechanics (M3).

## Pilot verification
The comber judged the persona split sound and found little to move back. Its search did not weigh identity.md's working style, memory rule or job.md's mandates 4, 5 and 8 as cockpit conventions, which the commander's concern points at. Reassigned.

## Phase 2 addendum (arrived after the shutdown request)
Docs findings applied. Changes from phase 1: M3 reversed to quarters only (the appended-file note is about the launcher, not CLAUDE.md; F7, F8, F12, F14). M4 neither: repo-wide preferences belong in the repo-root CLAUDE.md, since a subdirectory CLAUDE.md loads only when an agent reads there (F12). M6 upgraded to a firm recommendation: a one-line summary of what qualifies for records, in prose. M1 stands. M2, M5 unchanged.

Import check: rule 2's `@records/README.md` is wrapped in backticks. F8 says import parsing skips code spans, so the line is inert text and imports nothing. Recommended fix (b): keep the backticked path as a plain reference, matching how every other path in the file is written, and add the one-line records summary in prose. Option (a), removing the backticks, would load the whole README into every reader's context (F8, F5).

Pilot verification: the backtick observation matches the file on disk and docs-scout F8. Sound. Filed for the judge (C011) to weigh.
