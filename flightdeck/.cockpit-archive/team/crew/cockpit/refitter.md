---
type: "Crew Dossier"
unit: "refitter"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-20", "Pilot: Ace", "b27e6c01"]
context: ["T014"]
---
# refitter

Carry out a structural refit of the cockpit step by step from a mini-spec, stopping after each step for the pilot to verify and commit.

## How to dispatch

Opus. Give it the mini-spec, the never-edit list and the order of steps. It plans each step as a short change list first, uses git mv, never commits, and reports what it ran.

## Record

T014: carried the cockpit refit steps 2 to 6 and the commander's final fixes: 518 ids, 126 units, frontmatter on 82 documents, 433 renames into five rooms, all lint clean. Sent a change list before each step and stopped after each for verification. Overruled the pilot once with evidence (a commit three minutes past midnight belonged to the previous session) and was right. Broke the never-edit list twice in the room move (advice files, order text), caught both with its own scan, reverted and reported plainly. Refused to guess branch statuses or to stamp the commander as author of an empty file.

## Next time

Same seat for structural work. Tell it to protect by field name across every file carrying the field. Let it agree shapes directly with the schema seat.
