# Cockpit Settings

`pilot.settings.json` is passed by path with `claude --settings`. It carries what a settings file can carry: model, effort, env, permissions, cross-session messaging policy and hooks. It never carries the persona; that is `../../team/officers/pilot/identity.md`, `job.md` and the commander's dossier, appended by `../bin/pilot.sh`.

Keys in use:

- `model: fable`, `effortLevel: medium` — the pilot's seat. The settings effort beats the user's `effortLevel`. On resume the transcript's model beats this file, so `pilot.sh resume` also passes `--model fable`.
- `env.FLIGHTDECK_ROLE`, `env.FLIGHTDECK_COCKPIT` — let hooks and crew scripts know a pilot session is running.
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — agent teams on. The commander's order: the pilot's link to the outside world. Overrides the user settings value `0`.
- `permissions.defaultMode: auto` — the commander's chosen mode for the pilot.
- `crossSessionInbound: accept` — other sessions on this machine may message the pilot directly.
- `isolatePeerMachines: true` — nothing leaves the machine without the commander's approval.
- `hooks.PreToolUse` — runs `../bin/cockpit-guard.py` on Write, Edit, MultiEdit, NotebookEdit and Bash, for the pilot and its teammates. Blocks writes outside the cockpit and `dev/workspace`. Mandate one enforced mechanically, on the commander's order.
- `hooks.SessionStart` — runs `../bin/session-start.sh`, which prints CLI version, session id, log name, branch, current mission, latest log and requests awaiting into the pilot's opening context.

Changing this file changes how the pilot session behaves. Record every change in the log.
