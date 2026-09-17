# Cockpit Bin

Scripts the commander or the harness runs. POSIX sh, no dependencies.

- `pilot.sh` — invoke the pilot. `pilot.sh` starts, `pilot.sh resume` resumes the session named `pilot`, `pilot.sh --check` prints the command without running it. Refuses to start a second pilot while one is running.
- `cockpit-guard.py` — PreToolUse hook. Exit 2 blocks a write outside the cockpit and tells the pilot why. Unit-check it by piping a hook JSON payload to it with `CLAUDE_PROJECT_DIR` set.
- `session-start.sh` — SessionStart hook. Prints cockpit status lines into the pilot's opening context. Invoked by `../settings/pilot.settings.json`, not by hand.
