# Kickoff library

The parts under this directory assemble into one launch's `kickoff.md`, the standing instructions the orchestrator of that launch conducts the run from. Nothing else reads them: the spec says what must be true, the plan says how this run is cut, the project constitution — the repository's `CLAUDE.md`, into which `flightdeck/flightcrew/templates/constitution-fragment.md` is merged — says how the project always works, and the kickoff says only how to conduct a run of this shape.

## Assembling

`fc` is `flightdeck/flightcrew/bin/fc`, invoked by path from the repository root; the short `fc <sub>` form below means that binary. `fc launch new` and `fc launch kickoff` render `flightdeck/launch/<L>/kickoff.md`, where `<L>` is the launch name, as a header block followed by `base.md`, one `shape-*.md` and one `task-*.md`, in that order. The parts are named on the command line as `--kickoff base+shape-<s>+task-<t>` (or `--parts` for a re-render); the default is `base+shape-session+task-feature`. The header block carries the launch path, the spec and tests-map paths with their commits, the assembled version, the run log, the prior reports for the same spec, where the plan is written and where the evidence page lives.

`kickoff.md` is rendered, never hand-edited. A conduct change is an edit to a part here, with that part's version bumped; the next render picks it up.

## Parts

- `base.md` — what every orchestrated run shares: the conduct sequence with its three halting gates, the escalation rule, the roles and what each receives, the communication protocol, the budget defaults, the outputs, and the never list.
- `shape-session.md`, `shape-workflow.md`, `shape-sessions.md` — what differs by mechanism: how units are dispatched, what counts as progress, and how the run stops. Exactly one is chosen: `shape-session` by default, dispatching subagents from the one orchestrator session; `shape-workflow` when a wave holds more units than the `implementers_concurrent` ceiling, so a workflow script holds the fan-out; `shape-sessions` when a set of units needs its own context window across hours rather than turns.
- `task-feature.md`, `task-migration.md`, `task-audit.md`, `task-agent.md` — what differs by kind of work: how the units are cut, what wave 0 (the serial first wave, the one the contracts phase runs) owes, and the risks worth naming. Exactly one is chosen: `task-feature` for new behaviour, `task-migration` for converting an existing form to a new one, `task-audit` for answering questions about a codebase without changing it, `task-agent` for work whose behaviour varies between runs.

## Rules for a part

- The first line is `<!-- version: N -->` and nothing else. The assembled kickoff version is the `+`-joined list of `part@version`, and it is recorded in the launch's `launch.json`, in the `kickoff_version` field of the launch's `plan.json`, and in the run-log entry.
- Agent names appear in backticks under the `## Roles` heading and only there; `fc validate kickoff` refuses a backticked name with no `flightdeck/flightcrew/crew/<name>.md`.
- Point, never paste: name paths and commands, and let the orchestrator read the file. A pasted copy of the spec or the roster goes stale the moment its source moves.
- Conduct only. A rule the verifier or the critic must obey belongs in the spec, because neither ever sees the kickoff. A rule every session must obey belongs in the project constitution. A rule for one run belongs in the plan.
- Short and absolute in the never list, positive everywhere else, and every never has its enforcement named beside it.
- Prune on the same pass as you add. A line earns its place only where removing it would cause a mistake and no hook enforces it better than prose can; that is why the version rule above exists, not an approval anyone records.
