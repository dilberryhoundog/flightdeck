# Cockpit Settings

`pilot.settings.json` is passed by path with `claude --settings`. It carries env, permissions, cross-session messaging policy and hooks. It carries neither the model nor the effort nor the pilot's prompt: all three are in `../../team/officers/pilot/pilot.md`, and how they reach the session is in `../bin/README.md`.

Keys in use:
- `env.FLIGHTDECK_ROLE`, `env.FLIGHTDECK_COCKPIT` — let hooks and crew scripts know a pilot session is running.
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — agent teams on. The commander's order: the pilot's link to the outside world. Overrides the user settings value `0`.
- `permissions.defaultMode: auto` — the commander's chosen mode for the pilot.
- `crossSessionInbound: accept` — other sessions on this machine may message the pilot directly.
- `isolatePeerMachines: true` — nothing leaves the machine without the commander's approval.
- `hooks.PreToolUse` — runs `../bin/cockpit-guard.py` on Write, Edit, MultiEdit, NotebookEdit and Bash, for the pilot and its teammates. Blocks writes outside the cockpit and `dev/workspace`. Rule 1, write permissions, enforced mechanically on the commander's order.
- `hooks.SessionStart` — runs `../bin/session-start.sh`, which prints CLI version, session id, log name, branch, current mission, latest log and requests awaiting into the pilot's opening context.

Changing this file changes how the pilot session behaves. Record every change in the log.
