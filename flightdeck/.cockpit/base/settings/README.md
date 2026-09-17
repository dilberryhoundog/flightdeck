# Cockpit Settings

`pilot.settings.json` is passed by path with `claude --settings`. It carries what a settings file can carry: env, cross-session messaging policy and hooks. It never carries the persona; that is `../../CLAUDE.md`, appended by the launcher.

Keys in use:

- `env.FLIGHTDECK_ROLE`, `env.FLIGHTDECK_COCKPIT` — let hooks and crew scripts know a pilot session is running.
- `env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` — agent teams on. The commander's order: the pilot's link to the outside world.
- `permissions.defaultMode: auto` — the commander's chosen mode for the pilot.
- `crossSessionInbound: accept` — other sessions on this machine may message the pilot directly.
- `isolatePeerMachines: true` — nothing leaves the machine without the commander's approval.
- `hooks.PreToolUse` — runs `../bin/cockpit-guard.py` on Write, Edit, MultiEdit, NotebookEdit and Bash. Blocks writes outside the cockpit and `dev/workspace`. This is mandate one enforced mechanically, on the commander's order.
- `hooks.SessionStart` — runs `../bin/session-start.sh`, which prints branch, current mission, latest log and proposals awaiting, into the pilot's opening context.

Changing this file changes how the pilot session behaves. Record every change in the log.
