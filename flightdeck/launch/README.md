# Launch

Orchestrated build runs, self-contained. `fc` below is `flightdeck/flightcrew/bin/fc`, invoked by path from the repository root (optionally aliased per shell with `alias fc="$PWD/flightdeck/flightcrew/bin/fc"`); nothing installs it. Entries under `flightdeck/launch/` fall into three kinds. `<L>` is a launch name, `<S>` a spec name.

## Three kinds of entry

- `specs/<S>/`: the canonical, cross-run home of one spec: `spec.v*.json`, `tests-map.v*.json`, `checks/` for check scripts with no natural project home, `interview/`, and any design or reference prose the spec carries. Only `spec.v*.json` and the pinned `tests-map.v*.json` are copied into a launch; `checks/` and `interview/` stay here. A spec is frozen — its `status` set to `frozen` and its `commit` header written, as `flightdeck/manuals/versioning/spec-versioning.md` describes — and committed here before a launch pins it.
- `<L>/`: one run of one spec, created by `fc launch new` and named `<spec.name>-<n>` unless `--name` says otherwise. Active-launch resolution scans only subdirectories holding a `launch.json`.
- `README.md`, `RUNLOG.md` and the directory-keeper file beside them: this file, the run log, and the placeholder that keeps the directory in git.

## A launch folder in brief

```
<L>/
  launch.json      state: status, phase, pins, paths, ceilings, gates, outcome
  kickoff.md       the conduct rules the agent orchestrating the run follows for its duration, rendered by fc launch kickoff; flightdeck/manuals/orchestration/kickoff.md carries the detail
  specs/<S>/       pinned copies of the spec and the tests map
  plan.json plan.md   the plan (fc plan write); plan.md is rendered
  events.jsonl hooks.log   what the hooks and fc recorded
  evidence/ evidence.html  check results, boundary, locked, budget; the evidence page
  returns/ review/ notes.md   stored returns, critic passes, orchestrator notes
  report.md        the run report, final at fc launch end
```

`flightdeck/manuals/launch/launch-anatomy.md` describes every field, phase and command. Exactly one launch may be active; `FLIGHTCREW_LAUNCH=<name>` selects one for a command or a session, and `FLIGHTCREW_LAUNCH=none` opts a session out.

## The run log

`RUNLOG.md` holds one entry per ended run, newest first, inserted by `fc launch end`: the spec and kickoff versions, the outcome and cost, and for an abandoned or partial run the fields that arrive as `<fill>` for a human to write: `seen on`, `cause`, `fixed on`, `change`, `watch`, `kept` and `promote`, plus `landed` and `abandoned` on a partial run. `symptom` is pre-filled from the recorded ending, not written by hand. The agent that writes the plan reads the log before running `fc plan write`, with `fc runlog show --spec <S>`. `flightdeck/manuals/orchestration/run-log.md` carries the practice.
