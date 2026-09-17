# S003 — First agent team, run from the pilot's seat

- **Raised by:** commander, 2026-09-17
- **Heat:** hot

## The spark

"The env flag is your link to the outside world. Be bold pilot, learn it from the beginning." The teams flag is now in the pilot's settings. Teams only exist in an interactive session, so the first team can only be run once the commander invokes the pilot through `base/bin/pilot.sh`.

## What it would take

A small research or review task with clear file boundaries, three teammates at most, Sonnet models, and a spawn prompt that forbids writing into the cockpit. Observe: naming, mailbox arrival, task list tools (may need `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` on this model), idle notifications, shutdown. Annotate `references/claude-code/agent-teams.md` with what was observed.

## Momentum

- 2026-09-17 — Docs researched in depth (two harness-guide passes). Flag set. Not yet run.

## Matures when

The commander launches the pilot via `pilot.sh` and names a task worth a team. Candidate: the S002 survey, split three ways by area.
