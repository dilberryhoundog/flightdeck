# Harness Guide

- **Agent type:** `claude-code-guide`
- **Tools:** Bash, Read, WebFetch, WebSearch.
- **Purpose:** research Claude Code features from official docs. Used to fill `records/claude-code/`.

## How to dispatch

Name the features, demand sources per fact, demand "not documented" over guesses, set a length cap. Continue the same agent via SendMessage for follow-ups rather than spawning a fresh one.

## Observed

- 2026-09-17 — Mission M001. Dispatched to research agent teams, session messaging, fork agents and worktree isolation. Returned with sourced facts and version numbers. Filed into `records/claude-code/`.

## Improvements

- Second dispatch (settings research) returned two wrong claims: a flat hook shape that does not fire, and that `--agent` replaces the system prompt. Both caught by test. Rule: any harness-guide claim the pilot will build on gets a throwaway `claude -p --model haiku` test first.
