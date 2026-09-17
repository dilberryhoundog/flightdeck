# Cockpit Settings

`pilot.settings.json` is passed by path with `claude --settings`. It carries what a settings file can carry: env, cross-session messaging policy and hooks. It never carries the persona; that is `../../CLAUDE.md`, appended by the launcher.

Keys in use:

- `env.FLIGHTDECK_ROLE`, `env.FLIGHTDECK_COCKPIT` — let hooks and crew scripts know a pilot session is running.
- `crossSessionInbound: accept` — other sessions on this machine may message the pilot directly.
- `isolatePeerMachines: true` — nothing leaves the machine without the commander's approval.
- `hooks.SessionStart` — runs `../bin/session-start.sh`, which prints branch, current mission, latest log and proposals awaiting, into the pilot's opening context.

Changing this file changes how the pilot session behaves. Record every change in the log.
