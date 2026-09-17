# Cockpit Bin

Scripts the commander or the harness runs. POSIX sh, no dependencies.

- `pilot.sh` — invoke the pilot. `pilot.sh` starts, `pilot.sh resume` resumes the session named `pilot`, `pilot.sh --check` prints the command without running it. Refuses to start a second pilot while one is running.
- `session-start.sh` — SessionStart hook. Prints cockpit status lines into the pilot's opening context. Invoked by `../settings/pilot.settings.json`, not by hand.
