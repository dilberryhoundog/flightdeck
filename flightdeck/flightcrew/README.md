# Flightcrew

Orchestrated agentic building: the global assets every launch under `flightdeck/launch/` uses. Nothing here is installed; `fc` is invoked by path, hooks run in place, and only the crew and the workflow scripts are ever copied out.

## The map

| directory | holds |
|---|---|
| `bin/` | `fc`, the bash shim, and `fc.mjs`, the entry point; `cmd/<command>.mjs`, one module per command |
| `checks/lib/` | the shared libraries: schema validation, spec and launch access, git, globs, output, rendering |
| `checks/validators/` | `validate-spec`, `validate-tests-map`, `validate-plan`, `validate-launch`, `validate-return`, `validate-kickoff`, `validate-all`, `spec-readiness-lint`; runnable as `node flightdeck/flightcrew/checks/validators/<name>.mjs <path>` or through `fc validate` and `fc lint` |
| `checks/gates/` | `acceptance-gate`, `contracts-gate`, `structural-gate`: what the stop gate and the structural hook run |
| `crew/` | one markdown definition per role, with a README carrying the roster and the fixed paths a spec session is dispatched with |
| `hooks/` | the six hook scripts, their shared `lib.mjs`, and `settings.fragment.json` to merge into `.claude/settings.json` |
| `schemas/` | JSON schemas for the spec, tests map, plan, launch, event line, check result and the four return kinds |
| `templates/` | the spec, tests-map, launch and plan templates; the dispatch templates; the report and run-log entry templates; `constitution-fragment.md`; `kickoff/`, the kickoff library |
| `workflows/` | `fc-implement.js`, `fc-review.js`, `fc-explore.js`, the dynamic workflow scripts for the workflow shape |
| `MANIFEST.txt` | one repository-relative path per line for every file the system ships; `fc doctor` and the `manifest` suite check each exists |

## The entry point

`flightdeck/flightcrew/bin/fc <command> [sub] [args] [--launch <name>] [--json]`, exit `0` on success, `1` on a usage or environment error, `2` on a failed check or a blocking decision; one line on success unless the command's purpose is a document or a listing. `fc help` lists the commands; `fc launch status` says what is active. The launch root is `$FLIGHTCREW_ROOT`, else `$CLAUDE_PROJECT_DIR`, else the git toplevel of the working directory, else the repository containing `fc`; the active launch is the unique `launch/*/launch.json` with status active, or the one `FLIGHTCREW_LAUNCH` names.

## Distribution

`fc distribute` prints the planned copies; `fc distribute --apply --target <dir>` (default `$REPO/.claude`) copies every crew file with frontmatter to `<dir>/agents/flightcrew/` and every workflow script to `<dir>/workflows/`, copies no hook, and prints the settings fragment with the absolute `node` path substituted, the `.claude/worktrees/` gitignore line and the constitution fragment for the human to merge. A target file with different content is a conflict and nothing is copied unless `--force`. `fc doctor --target <dir>` checks the result.

## Where to start reading

- `flightdeck/manuals/README.md`: which manual each role reads at which stage.
- `flightdeck/manuals/orchestration/journey.md`: the run from spec to ending, with every command.
- `flightdeck/manuals/launch/launch-anatomy.md`: `launch.json`, the folder, the command-by-phase table.
- `flightdeck/manuals/harness/hooks.md`: installing the hooks and the settings fragment.
- `crew/README.md`: the roster; `templates/kickoff/README.md`: the kickoff library; `workflows/README.md`: the scripts.
- `flightdeck/testbench/README.md`: the suites that prove all of this.
