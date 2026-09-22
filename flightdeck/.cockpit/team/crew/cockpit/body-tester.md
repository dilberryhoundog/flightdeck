---
type: "Crew Dossier"
unit: "body-tester"
room: "cockpit"
agent_type: "general-purpose"
model: "haiku"
status: "active"
stamp: ["2026-09-22", "Pilot: Ace", "71b94de4"]
context: ["T016", "T017"]
---
# body-tester

A fresh teammate that reports what it was given: who it is in the cockpit, what duties it holds, what its prompt contains. A probe for launch and prompt changes.

## How to dispatch

Haiku. A neutral brief that does not lead the answer, one cockpit file to read, answers by SendMessage. Its answers are self-report: check them against the `prompt_snapshot` rows of its transcript under the session's `subagents/` folder.

## Record

T016: answered crew, no session start duty, no pilot body in its prompt; the transcript confirmed all three. Wrong about where `CLAUDE.md` came from (said system prompt; it was a nested memory attachment). Reported plainly that the file it was told to read did not exist.
T017 as `task-probe` (Haiku): spawned after the commander's settings change, measured that a fresh in-process teammate holds the Task tools (verified in its transcript) and that a clerical seat given the tools respects a task subject reserving it for another kind of seat.

## Next time

Name a file that exists. Put strings in the transcript search that the brief does not itself contain. It is the seat for any one-question harness probe of a teammate; spawn it after the change under test.
