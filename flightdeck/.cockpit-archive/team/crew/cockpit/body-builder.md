---
type: "Crew Dossier"
unit: "body-builder"
room: "cockpit"
agent_type: "general-purpose"
model: "opus"
status: "active"
stamp: ["2026-09-21", "Pilot: Ace", "241bff25"]
context: ["T015"]
---
# body-builder

Write an agent definition for a cockpit seat and wire the launcher, settings and `CLAUDE.md` to it.

## How to dispatch

Opus. Give it the approved request as the spec and the write boundary as a file list. Pair it with a docs verifier for harness claims.

## Record

T015: built the pilot's agent body, the launcher's `--agents` JSON, the `CLAUDE.md` cut and the references in five passes, two of them the pilot's reversals. Every check rerun each pass; tested the no-effort branch under `set -e` rather than assuming it; corrected its own wrong explanation of the lint fault; flagged a rewording that a blanket reversal swept up instead of deciding it.

## Next time

Same seat. Freeze its build before critics read it. Give it measured harness facts, not the pilot's guesses; it applies rulings exactly, including wrong ones.
