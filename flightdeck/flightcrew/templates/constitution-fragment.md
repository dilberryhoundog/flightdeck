## Flightcrew

- Orchestrated runs live under `flightdeck/launch/`. One launch may be active at a time; `FLIGHTCREW_LAUNCH=none` opts a session out.
- The runner is `flightdeck/flightcrew/bin/fc`, invoked by path and never installed. `fc launch status` says what is active and in which phase.
- Read `flightdeck/manuals/README.md` for which manual a role reads at which stage, and `flightdeck/launch/RUNLOG.md` before planning any run.
- While a launch is active, paths listed as locked in its `launch.json` are refused by a hook: report a wrong or unsatisfiable check instead of editing it, and write outside the allowed paths not at all.
- Plans, kickoffs, reports and the evidence page are rendered by `fc`, never hand-edited.
