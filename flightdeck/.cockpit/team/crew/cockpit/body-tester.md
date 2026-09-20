---
type: "Crew Dossier"
unit: "body-tester"
room: "cockpit"
agent_type: "general-purpose"
model: "haiku"
status: "active"
stamp: ["2026-09-21", "Pilot: Ace", "71b94de4"]
context: ["T016"]
---
# body-tester

A fresh teammate that reports what it was given: who it is in the cockpit, what duties it holds, what its prompt contains. A probe for launch and prompt changes.

## How to dispatch

Haiku. A neutral brief that does not lead the answer, one cockpit file to read, answers by SendMessage. Its answers are self-report: check them against the `prompt_snapshot` rows of its transcript under the session's `subagents/` folder.

## Record

T016: answered crew, no session start duty, no pilot body in its prompt; the transcript confirmed all three. Wrong about where `CLAUDE.md` came from (said system prompt; it was a nested memory attachment). Reported plainly that the file it was told to read did not exist.

## Next time

Name a file that exists. Put strings in the transcript search that the brief does not itself contain, or the brief's own text shows up as matches.
