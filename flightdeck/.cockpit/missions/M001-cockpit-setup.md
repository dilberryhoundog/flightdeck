# M001 — Set up and structure the cockpit

- **Status:** in_progress
- **Branch:** cockpit
- **Assigned by:** commander
- **Opened:** 2026-09-17

## Orders

"Your first mission is to set up and structure your cockpit. Basics first. Set up CLAUDE.md with your mandates. Research a little about agent teams and session messaging. Build some of the first infrastructure. Then send off a crew to explore the work that has already begun on flightcrew."

## Objectives

- [x] Create the `cockpit` branch and carry the cockpit scaffold onto it.
- [x] Write `CLAUDE.md` with the pilot's mandates, layout, session start and session end.
- [x] Research agent teams and session messaging; file under `references/claude-code/`.
- [x] Decide the pilot's default instrument (`references/claude-code/pilot-choice.md`).
- [x] Pilot identity (`quarters/pilot/pilot.md`).
- [x] Commander dossier (`quarters/commander/commander.md`).
- [x] Crew roster and first dossiers (`quarters/crew/`).
- [x] Mission manifest and this file.
- [x] Logs structure with first entry.
- [x] Base of operations: proposals queue and decisions record.
- [x] Crew survey of flightcrew returned and filed under `references/flightcrew/`.
- [x] First proposals raised in `base/` from the survey (P001, P002, P003).
- [ ] Cockpit committed and branch pushed.
- [ ] Commander reviews the cockpit.

## Crew dispatched

- 2026-09-17 — harness-guide (`claude-code-guide`): research agent teams, session messaging, subagents. Returned. Filed.
- 2026-09-17 — explorer (`Explore`): survey flightcrew, launch, testbench, manuals, agents, archives, git history. Returned. Filed as `references/flightcrew/survey-2026-09-17.md` with digest `state-2026-09-17.md`.

## Outcome

Pending.

## Lessons

- `dev-workspace new` refuses a dirty tree. To carry uncommitted files onto a new branch: `git stash push`, `dev-workspace new <name>`, `git stash pop --index`.
