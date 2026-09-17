# S003 — First agent team, run from the pilot's seat

- **Raised by:** commander, 2026-09-17
- **Heat:** hot

## The spark

"The env flag is your link to the outside world. Be bold pilot, learn it from the beginning." The teams flag is now in the pilot's settings. Teams only exist in an interactive session with the flag set. The pilot's settings set it, so any session launched with them can run a team.

## What it would take

A small research or review task with clear file boundaries, three teammates at most, Sonnet models, and a spawn prompt that forbids writing into the cockpit. Observe: naming, mailbox arrival, task list tools (may need `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` on this model), idle notifications, shutdown. File what was observed in `notepad/claude-code/`; records are not annotated with test results.

## Momentum

- 2026-09-17 — Docs researched in depth (two harness-guide passes). Flag set. Not yet run.
- 2026-09-18 — Confirmed the flag is live in pilot sessions; a teammate is an Agent call with a `name`, no TeamCreate tool. Crew protocol written into CLAUDE.md; rule 7 (three at most) awaits this run's evidence.

## Matures when

The commander launches the pilot via `pilot.sh` and names a task worth a team. Candidate: the S002 survey, split three ways by area.
