# Cockpit Bin

Scripts the commander or the harness runs. Needs `sh`, `python3` and the `claude` CLI.

- `pilot.sh` — invoke the pilot. `pilot.sh [start|resume] [--check] [claude flags...]`. Start refuses while a session named `pilot` is running; resume adds `--model fable` unless a `--model` is given; `--check` prints the command. Joins `quarters/pilot/identity.md`, `job.md` and the commander's dossier into one `--append-system-prompt` value.
- `cockpit-guard.py` — PreToolUse hook for the pilot and its teammates. Exit 2 blocks a write outside the cockpit and says why; fails closed on malformed input. Its docstring lists what the Bash parser does not cover.
- `test_cockpit_guard.py` — table test for the guard. Run `python3 base/bin/test_cockpit_guard.py` after any guard change; every case must pass.
- `session-start.sh` — SessionStart hook. Prints cockpit status lines into the pilot's opening context and reuses a resumed session's log name from `logs/index.json`. Invoked by `../settings/pilot.settings.json`, not by hand.
- `branch-terrain.sh` — prints tip, remote lag and containment for every local branch; the half of the git terrain `../../logs/branch-manifest.json` omits on purpose.
