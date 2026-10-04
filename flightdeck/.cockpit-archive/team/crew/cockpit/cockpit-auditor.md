---
type: "Crew Dossier"
unit: "cockpit-auditor"
room: "cockpit"
agent_type: "general-purpose"
model: "sonnet"
status: "active"
stamp: ["2026-09-22", "Pilot: Ace", "71b94de4"]
context: ["T009", "T010", "T017"]
---
# cockpit-auditor

Gather evidence, not opinion, on how the cockpit actually behaves: which stores carry knowledge, which were used, where the pilot drifted and what that cost the commander.

## How to dispatch

Reads the cockpit (commander-authorised): `CLAUDE.md`, records, logs, advice, dossiers, the drafts in question. Numbered questions; every claim with file and line; 250 lines; report to a scratchpad file, summary by SendMessage.

## Record

T009: six-section audit in one pass; the drift list drove the decision. The adversary later found its eight drift "events" were eight bullets and that summary logs cannot show a file went unread.
T017: audit of rosters, dossiers and dispatches in one pass, three revisions under two adversaries; counted from the filesystem with the pattern stated; built flight counts from stale dossier frontmatter (F12) and then from the dispatch units; its axis table failed twice against undefined axes and was ruled unscored. Answered Or072 in six lines.

## Next time

Sonnet. Derive a seat's flights from the dispatch units, seats and subagents arrays, never from dossier context. Do not ask it to score against a definition the paper has not settled; ask for quoted observations by field. Tell it where sibling seats file their output, and tell the adversary reading its file when it appends a section.
