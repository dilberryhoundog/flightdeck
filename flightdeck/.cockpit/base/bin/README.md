# Cockpit Bin

Scripts the commander or the harness runs. Needs `sh`, `python3` and the `claude` CLI.

- `pilot.sh` — invoke the pilot. `pilot.sh [start|resume] [--check] [claude flags...]`. Start refuses while a session named `pilot` is running; resume adds `--model fable` unless a `--model` is given; `--check` prints the command. Joins `team/officers/pilot/identity.md`, `job.md` and the commander's dossier into one `--append-system-prompt` value.
- `cockpit-guard.py` — PreToolUse hook for the pilot and its teammates. Exit 2 blocks a write outside the cockpit and says why; fails closed on malformed input. Its docstring lists what the Bash parser does not cover.
- `test_cockpit_guard.py` — table test for the guard. Run `python3 base/bin/test_cockpit_guard.py` after any guard change; every case must pass.
- `session-start.sh` — SessionStart hook. Prints cockpit status lines into the pilot's opening context and reuses a resumed session's log name from `records/logs/MANIFEST-logs.json`. Invoked by `../settings/pilot.settings.json`, not by hand.
- `branch-terrain.sh` — prints tip, remote lag and containment for every local branch; the half of the git terrain `../../records/logs/REGISTER-branches.json` omits on purpose.

## Temporary: stage A

Built under Rq013 to make the identifier pass safe, superseded by `../verify/`, and pinned for removal as workshop item WS024 once the commander has judged the refit. Their path and prefix maps went stale at the identifier pass and the room move; nothing reads them but themselves.

- `cockpit-check` — reference checker over the old store. Read-only.
- `cockpit-rename` — the rename tool. Dry run by default; never run `--apply` against the real cockpit.
- `cockpit_store.py` — the store reader both tools share.
- `test_cockpit_check.py`, `test_cockpit_rename.py` — their tests.
- `fixtures/` — fixture cockpits for those tests, depicting the pre-refit layout.
- `STAGE-A-TEMPORARY.md` — why they exist and what removes them.

`cockpit-guard.py` and `test_cockpit_guard.py` are not stage A. The guard is the live write hook and stays.
