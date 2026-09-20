---
type: "Crew Dossier"
unit: "harness-guide"
room: "general"
agent_type: "claude-code-guide"
model: "sonnet"
status: "active"
stamp: ["2026-09-17", "Pilot: Ace", "a61606de"]
context: []
---
# Harness Guide

- **Tools:** Bash, Read, WebFetch, WebSearch.
- **Purpose:** research Claude Code features from official docs. Used to fill `records/manuals/claude-code/`.

## How to dispatch

Name the features, demand sources per fact, demand "not documented" over guesses, set a length cap. Continue the same agent via SendMessage for follow-ups rather than spawning a fresh one.

## Observed

- 2026-09-17 — Mission M001. Dispatched to research agent teams, session messaging, fork agents and worktree isolation. Returned with sourced facts and version numbers. Filed into `records/manuals/claude-code/`.

## Improvements

- Second dispatch (settings research) returned two wrong claims: a flat hook shape that does not fire (caught by test). Its claim that `--agent` replaces the system prompt was doubted by test T3 but confirmed by token measurement T7 on 2026-09-18. Rule: any harness-guide claim the pilot will build on gets a throwaway `claude -p --model haiku` test first.
