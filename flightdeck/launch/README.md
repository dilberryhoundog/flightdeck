# Launch

Orchestrated build runs, self-contained. Every entry under `flightdeck/launch/` is one of three kinds.

## Three kinds of entry

- `specs/<name>/`: the canonical, cross-run home of one spec: `spec.v*.json`, `tests-map.v*.json`, `checks/` for check scripts with no natural project home, and `interview/`, which is never copied anywhere. A spec is frozen and committed here before a launch pins it; a launch holds copies, never the originals.
- `<launch-name>/`: one run of one spec, created by `fc launch new` and named `<spec.name>-<n>` unless `--name` says otherwise. Active-launch resolution scans only subdirectories holding a `launch.json`.
- `README.md` and `RUNLOG.md`: this file, and the run log.

## A launch folder in brief

```
<L>/
  launch.json      state: status, phase, pins, paths, ceilings, gates, outcome
  kickoff.md       the orchestrator's conduct, rendered by fc launch kickoff
  specs/<S>/       pinned copies of the spec and the tests map
  plan.json plan.md   the plan (fc plan write); plan.md is rendered
  events.jsonl hooks.log   what the hooks and fc recorded
  evidence/ evidence.html  check results, boundary, locked, budget; the evidence page
  returns/ review/ notes.md   stored returns, critic passes, orchestrator notes
  report.md        the run report, final at fc launch end
```

`flightdeck/manuals/launch/launch-anatomy.md` describes every field, phase and command. Exactly one launch may be active; `FLIGHTCREW_LAUNCH=<name>` selects one for a command or a session, and `FLIGHTCREW_LAUNCH=none` opts a session out.

## The run log

`RUNLOG.md` holds one entry per ended run, newest first, inserted by `fc launch end`: the spec and kickoff versions, the outcome and cost, and for an abandoned or partial run the diagnosis fields a human fills (symptom, seen on, cause, fixed on, change, watch). It is read before every plan (`fc runlog show --spec <S>`) and is the document the spec template, the kickoff library, the crew and the hooks are iterated against. `flightdeck/manuals/orchestration/run-log.md` carries the practice.
