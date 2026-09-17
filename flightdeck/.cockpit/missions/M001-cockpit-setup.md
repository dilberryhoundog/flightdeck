# M001 — Set up and structure the cockpit

- **Status:** in_progress
- **Branch:** cockpit
- **Assigned by:** commander
- **Opened:** 2026-09-17

## Orders

"Your first mission is to set up and structure your cockpit. Basics first. Set up CLAUDE.md with your mandates. Research a little about agent teams and session messaging. Build some of the first infrastructure. Then send off a crew to explore the work that has already begun on flightcrew."

## Objectives

- [x] Create the `cockpit` branch and carry the cockpit scaffold onto it.
- [x] Write `CLAUDE.md` with the pilot's mandates, layout, session start and session end. Restructured 2026-09-18: CLAUDE.md is folder instructions for any arrival; the pilot's persona lives in `quarters/pilot/`.
- [x] Research agent teams and session messaging; file under `records/claude-code/`.
- [x] Decide the pilot's default instrument (`notepad/claude-code/pilot-choice.md`).
- [x] Pilot identity (`quarters/pilot/identity.md`, `job.md`).
- [x] Commander dossier (`quarters/commander/commander.md`).
- [x] Crew roster and first dossiers (`quarters/crew/`).
- [x] Mission manifest and this file.
- [x] Logs structure with first entry.
- [x] Base of operations: proposals queue and decisions record.
- [x] Crew survey of flightcrew returned and filed under `notepad/flightcrew/`.
- [x] First proposals raised in `base/` from the survey (P001, P002, P003).
- [x] Cockpit committed and branch pushed (ed132bd, 43538c9 on origin/cockpit).
- [ ] Commander reviews the cockpit.

### Phase 2 — interactivity tools (ordered 2026-09-17)

- [x] Learn the `--settings` flag: what it accepts, file path delivery, precedence, what a settings file can carry. Filed in `records/claude-code/settings-and-launch.md`, tested in `launch-tests.md`.
- [x] Learn ListAgents and SendMessage in practice. Filed in `notepad/claude-code/messaging-observed.md`. Arrival shape still to observe from a real peer.
- [x] Build a first toolset: `base/settings/pilot.settings.json`, `base/bin/pilot.sh`, `base/bin/session-start.sh`. Draft until the commander has invoked it.
- [x] Questions put to the commander and answers recorded (D002 to D006).
- [x] Cross-session message exchanged with `flightdeck-3c` in both directions; wrapper shape recorded.
- [x] Write guard enforcing mandate one, permission mode auto, agent teams flag: all in `base/settings/pilot.settings.json`, tested.
- [x] Mission incubator opened with three sparks.
- [x] Agent teams learned by running one (spark S003). First team ran 2026-09-18; observations in `notepad/team-run-2026-09-18/`.
- [x] Team findings actioned on the commander's orders: launcher check (A1), guard rewrite with table test (A2), persona moved to quarters (A12), A3, A4, index and hook batch. Sandbox raised as spark S004.
- [ ] Toolset tested by the commander invoking the pilot.

## Crew dispatched

- 2026-09-17 — harness-guide (`claude-code-guide`): research agent teams, session messaging, subagents. Returned. Filed.
- 2026-09-17 — explorer (`Explore`): survey flightcrew, launch, testbench, manuals, agents, archives, git history. Returned. Filed as `notepad/flightcrew/survey-2026-09-17.md` with digest `state-2026-09-17.md`.
- 2026-09-18 — explorer (`general-purpose`, Sonnet, unnamed subagent): sort `references/` into official, scratch and mixed. Returned. Plan verified; it misclassed `cc.keep` and missed two embedded scratch passages.
- 2026-09-18 — first agent team (S003), commander's order: `auditor` (general-purpose, Opus) cockpit cleanup suggestions; `docs-scout` (claude-code-guide, Sonnet) official best practices; `red-team` (adversary, Sonnet) attacks both. Auditor and scout message red-team. Returned and shut down. Manifest C006 to C008; all dispatches backfilled in `logs/crew-manifest.json` as C001 to C008.

## Outcome

Pending.

## Lessons

- Declared the mission complete after one pass. The commander corrected this: the mission had only begun. Rudimentary structure is not a finished cockpit. Do not call a mission done; the commander does.

- `dev-workspace new` refuses a dirty tree. To carry uncommitted files onto a new branch: `git stash push`, `dev-workspace new <name>`, `git stash pop --index`.
