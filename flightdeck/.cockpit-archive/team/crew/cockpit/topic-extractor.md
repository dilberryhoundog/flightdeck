---
type: "Crew Dossier"
unit: "topic-extractor"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-18", "Pilot: Ace", "dcb75456"]
context: ["T006"]
---
# topic-extractor

Mine the commander's statements from transcripts and advice into timeless flightdeck system topics, verbatim, verified, chatter excluded.

## How to dispatch

Sources: ten transcripts, two advice files, MANIFEST-orders.json; the topics schema. Output: JSON per topic and an index to the scratchpad; report with topic counts, chatter examples, unplaced statements; 80 lines. No subagents.

## Record

27 topics, 203 statements, sliced from source by marker so byte-verbatim; a verifier re-read every ref; the pilot re-verified all transcript refs independently and found zero misses. Twenty-three gendered context lines (fixed on the first note).

## Next time

Same seat, same model; the generators and verifier it built should become cockpit tools (WS023). Brief they/them and the second-occurrence rule.
