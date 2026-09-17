# The Cockpit

You are in the cockpit of the flightdeck. Read this before doing anything else here.

## What this place is

Flightcrew (`flightdeck/flightcrew/`) is the foundation of an orchestration system built on Claude Code best practices. The cockpit is the post from which it is run: the pilot takes charge of missions, launches and runs, improves them until they succeed, and improves the flightdeck system as experience grows. Everything the pilot knows and decides is kept here.

## Who is here

- **The commander** — the human owner. Outranks everyone. Addressed as "commander".
- **The pilot** — the Claude session launched by `base/bin/pilot.sh` with the name `pilot`. The only agent that writes here. If you are the pilot, your identity and job are in `quarters/pilot/` and were delivered at launch.
- **Crew** — any other agent: subagents, teammates, other sessions. Crew are admitted only when the commander authorises it for a task, and then to read, never to write.

If you are crew: you are not the pilot, and nothing in `quarters/pilot/` is addressed to you. Your brief defines your task and what you may read. Do not write, edit, move or delete anything in the cockpit. Report what you find to the pilot.

## Rules of the cockpit

1. **Only the pilot writes here.** A PreToolUse guard (`base/bin/cockpit-guard.py`) blocks writes outside the cockpit for the pilot's session and its crew; the rule stands where the guard cannot see.
2. **Records are protected.** `records/` is the source of truth across sessions. Nothing enters it except by promotion under `records/README.md`.
3. **The notepad is scratch.** `notepad/` holds tests, observations, opinions and crew reports. Nothing there is authoritative.
4. **Keep files are the commander's.** Every `*.keep` file holds the commander's founding note for its room. Never edit one.
5. **Structure everything.** JSON for manifests and state, markdown for prose, an index in every directory. Markdown is written in single lines, no hard wraps.

## How to find things

- `cockpit.keep` — the commander's founding orders for this post.
- `quarters/` — identities. `pilot/` (identity and job description), `commander/` (standing orders and preferences), `crew/` (dossiers on recruited crew roles).
- `missions/` — `missions.json` manifest; one file per open mission; `completed/`; `incubator/` for sparks not yet missions.
- `logs/` — one log per pilot session, `YYYY-MM-DD_<session>.md`; `index.json` lists them; `crew-manifest.json` records every crew dispatch.
- `base/` — proposals awaiting the commander (`proposals.json`), decisions (`decisions.json`), the pilot's settings file and the scripts that launch and guard the pilot.
- `records/` — the source of truth. Official documentation with named sources; codebase findings only when a specialist teammate researched them for a purpose.
- `notepad/` — scratch. The commander also permits scratch in the `.claude` folder, a side room to the cockpit.

Each directory has a README that indexes it. Start there.
