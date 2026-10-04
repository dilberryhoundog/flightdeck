---
type: "Crew Dossier"
unit: "explorer"
room: "flightcrew"
agent_type: "Explore"
model: "haiku"
status: "active"
stamp: ["2026-09-17", "Pilot: Ace", "a61606de"]
context: []
---
# Explorer

- **Tools:** read-only search. No Agent, no writes.
- **Purpose:** sweep many files or directories and return a conclusion. Locates; does not audit.

## How to dispatch

Give an ordered list of areas to cover, a breadth setting ("medium" or "very thorough"), a do-not-read list (always includes the cockpit), the report format, and a length cap.

## Observed

- 2026-09-17 — Mission M001. Dispatched to survey flightcrew, launch, testbench, manuals, agents, archives and git history. Returned a 100-line structured report covering all eight areas, respected the do-not-read list, and flagged ten issues with evidence. Strong.

## Improvements

- Worth it: an ordered area list plus a length cap. The report came back structured exactly as asked.
- Next time ask for branch-level surveys with commit ranges named, since the interesting work sat on unmerged branches.

## What to watch for

- Returns conclusions, not file dumps; an explorer that pastes files has failed its brief.
- Each dispatch costs about 100k tokens; the brief names one seam or question.
- If spawned by a teammate, its hand-back goes to the lead, not the teammate.
