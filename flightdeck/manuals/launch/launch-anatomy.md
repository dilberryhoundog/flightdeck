# Launch anatomy

Optional, per shell, not an install: `alias fc="$PWD/flightdeck/flightcrew/bin/fc"` from the repository root; every command below is otherwise `flightdeck/flightcrew/bin/fc …`.

A launch is one orchestrated run of one spec: a self-contained folder `flightdeck/launch/<L>/` holding pinned copies of what the run was given and everything it produced. `launch.json` holds its status, phase, pins, gates, ceilings and outcome; two files beside it carry the rest of the state — `escalation.json` marks an open escalation, and the ordering of `events.jsonl` marks a fired abandon trigger.

Placeholders, used throughout: `<L>` is the launch name, `<S>` a spec name, `<T>` a check id, `<G>` a gate id, `<n>` an integer. Every path is written from the repository root. Where `$REPO` appears in a command, run it from the repository root.

The plan cuts the work into units, grouped into waves that are dispatched in order; `W0` is the serial first wave, holding the single `kind: contracts` unit that every later unit depends on. `flightdeck/manuals/orchestration/planning.md` carries the decomposition rules. The hook layer enforces the launch: the two guards (lock and boundary) deny edits to locked and out-of-boundary paths, the recording hooks append to `events.jsonl`, and the stop gate blocks the end of a turn while the phase's checks are red. `flightdeck/manuals/harness/hooks.md` defines all of them.

## launch.json

Schema `flightdeck/flightcrew/schemas/launch.schema.json`; `fc validate launch [path]` checks it.

| field | value | set by |
|---|---|---|
| `schema_version` | `1` | `fc launch new` |
| `name` | the folder name; default `<spec.name>-<n>` | `fc launch new [--name N]` |
| `status` | `draft`, `active`, `accepted`, `accepted-with-reservations`, `abandoned`, `partial` | new, activate, end |
| `phase` | `targets`, `plan`, `contracts`, `implement`, `verify`, `review`, `report`, `ended`, in that order | `fc launch phase`, `fc launch gate`, `fc launch end` |
| `created` | date | new |
| `spec` | `{name, version, commit, file_commit, path}`; `commit` is the spec file's own commit header (null while draft); `file_commit` from `git log -1` (null when untracked); `path` is the pinned copy | new |
| `tests_map` | `{version, commit, path}` or null | `fc launch pin tests-map` |
| `kickoff` | `{path, version}`; the rendered version record, like `base@1+shape-session@1+task-feature@1` | new, kickoff, pin |
| `base_commit` | HEAD at `fc launch new` | new |
| `lock_commit` | HEAD at `fc launch pin tests-map`; the base for boundary, locked, critic render and "Changed since lock" | pin |
| `branch` | default `run/<L>`; created and checked out by the human at the targets phase (`git switch -c <branch>`), before any dispatch; `fc worker merge` requires the checkout to be on it | new (`--branch <branch>`) |
| `previous_launch` | the newest other launch with the same `spec.name`, or null | new |
| `allow_draft` | true when activation or pinning accepted a draft spec or map; printed in the report header | activate, pin (`--allow-draft`) |
| `paths` | `{allowed: [glob], locked: [glob], enforce_boundary}`; from the map's `allowed_paths` and `locked_paths` ∪ the pinned copies ∪ the canonical spec folder; `fc launch new --allow <glob>` may seed `allowed` earlier. Glob dialect: a leading `/` anchors at the repository root, a trailing `/` matches the whole subtree, a pattern with no `/` matches a basename at any depth, and there is no negation | pin |
| `acceptance` | the id of the tests map's acceptance check, always `T1`; check ids are `T<n>` and come from the pinned map | new |
| `structural` | `{<ext>: <command containing {file}>}`; the structural-check hook runs the matching command after every Edit or Write, substituting the file's path for `{file}`, and holds the turn when it exits non-zero | new (template), human |
| `ceilings` | `agents`, `implementers_concurrent`, `turns_per_agent`, `gate_iterations`, `stop_blocks` (at most 8), `critic_passes`, `minutes`, `tokens` (nullable), `expected_tokens` (nullable) | new (template), human |
| `gates` | `G1`, `G2`, `G3`: `{status: pending|approved|exited, at, note?}` | `fc launch gate` |
| `outcome`, `ended` | the outcome given to `fc launch end` and its timestamp | end |
| `accepted_units`, `abandoned_units` | unit id lists for a partial ending | `fc launch end partial --units` |
| `landed` | `{commit, pr, integration_check}` | `fc launch land` |

- Hashes are 7 to 40 hex characters and compare by prefix; validators check shape only unless `--resolve-commits` is passed.
- `escalation.json` beside it marks an open escalation (the stop gate releases while it exists); it is removed by `fc launch gate`, `fc launch phase` and `fc launch end`.
- A `trigger` event newer than the newest `gate`, `escalation` or `launch_end` event marks a fired abandon trigger: the guards deny every edit, and `fc worker render`, `fc worker merge` and `fc launch phase` (except to ended) exit 2.

## Folder layout

```
flightdeck/launch/<L>/
  launch.json              state (above)
  kickoff.md               rendered by fc launch kickoff; never hand-edited
  specs/<S>/spec.vN.json   pinned copy of the spec (interview/ is never copied)
  specs/<S>/tests-map.vN.json   pinned copy of the map, after fc launch pin
  plan.json  plan.md       fc plan write; plan.md is rendered, never hand-edited
  events.jsonl             one JSON object per line, appended by hooks and fc
  hooks.log                <iso ts> <hook name> <message>, hook errors and no-op reasons
  evidence/                <T>.json per check, summary.json, boundary.json, locked.json, budget.json
  evidence.html            the evidence page, rewritten by fc evidence and best-effort by most commands
  returns/                 <unit>.json, explore-X<n>.json, verify-<n>.json, <unit>.prompt.md dispatches
  review/                  pass-<n>.prompt.md (sealed dispatch), pass-<n>.json, resolutions.json
  notes.md                 fc launch note
  escalation.json          present only while an escalation is open
  report.md                fc report; final at fc launch end
```

- The stop gate holds the turn while the phase's checks are red; in phase verify those are the acceptance check `T1`, in phase contracts the contracts unit's checks plus the boundary.
- Everything under the folder is committed with the code; a worker's worktree branches from HEAD, so an uncommitted launch folder is invisible to workers.
- The canonical spec home is `flightdeck/launch/specs/<S>/` (`spec.v*.json`, `tests-map.v*.json`, `checks/`, `interview/`); a launch holds copies, never the originals.

## Lifecycle

| status | meaning |
|---|---|
| `draft` | created by `fc launch new`; not yet the run hooks act on |
| `active` | `fc launch activate`; exactly one launch may be active; hooks enforce its locks and boundary |
| `accepted`, `accepted-with-reservations`, `partial`, `abandoned` | the outcome recorded by `fc launch end`; afterwards only `fc launch land` and the run-log stub still write, and no phase, gate or evidence write is accepted |

| phase | entered by | what happens |
|---|---|---|
| `targets` | `fc launch new` | the human dispatches the `test-builder` subagent, which writes the map and checks; `fc check all --baseline <map>` records each check's observed result; the human freezes the map — sets its `status` to `frozen` and its `commit` header, as the spec was frozen at stage 1 — and commits it; `fc launch pin tests-map`. "The baseline agrees" below means each check's recorded observed result matches the expectation the map states for it |
| `plan` | `fc launch phase plan` (refused until pins are frozen or `allow_draft`, the baseline agrees, and launch and kickoff validate) | orchestrator started; explorers; `fc plan write` |
| `contracts` | `fc launch gate G1 approve` | the W0 unit; the stop gate runs its checks and the boundary |
| `implement` | `fc launch gate G2 approve` (refused while a W0 check is in error or has not run since `lock_commit`) | waves; `fc worker render`, `fc return worker`, `fc worker merge` |
| `verify` | `fc launch phase verify` | `fc verify`; the stop gate holds the turn on `T1`; optional verifier |
| `review` | `fc launch phase review` (refused while evidence is absent, stale, red, or boundary or locked is non-clean) | critic passes; fixes re-run `fc verify` in place |
| `report` | `fc launch phase report` | G3; `fc launch end <outcome>` |
| `ended` | `fc launch end` | report, evidence page, run-log stub, cleanup lines |

- `fc launch phase <p>` accepts only the next phase; `--force` records `forced: true` in the phase event; every accepted change appends a `phase` event.
- `fc launch gate <G>` refuses a gate already decided unless `--force`; a gate decision never depends on another gate's state.

## Commands by phase

| phase | human | orchestrator or agents |
|---|---|---|
| before | once per repository, `fc distribute --apply --target .claude` installs the crew definitions `claude --agent orchestrator` needs, as `flightdeck/manuals/harness/hooks.md` describes; then `fc lint spec <path> --repo $REPO`; `fc validate spec <path> --for-freeze`; freeze and commit | spec crew |
| targets | `fc launch new <spec> [--name <L>] [--kickoff base+shape-<s>+task-<t>] [--branch <branch>]` (the `--kickoff` value names parts, not versions; the `kickoff.version` string above is the rendered record); `git switch -c <branch>`; `fc launch activate <L> [--allow-draft]`; `fc check all --baseline <map>`; `fc launch pin tests-map <map>`; `fc launch phase plan`; commit | test-builder writes the map and checks |
| plan | `cd $REPO && claude --agent orchestrator --permission-mode acceptEdits`; read `plan.md`; `fc plan render` after editing `plan.json`; `fc launch gate G1 approve|exit` | `fc return explorer <file> --id X<n>`; `fc plan write <json>` |
| contracts | read "Changed since lock" and the W0 results; `fc launch gate G2 approve|exit` | `fc worker render <contracts unit>`; `fc return worker <file> --unit <contracts unit>`; `fc worker merge <contracts unit>` |
| implement | watch `evidence.html`; `fc launch status` | `fc worker render <unit>`; `fc return worker`; `fc worker merge` in wave order; `fc launch escalate <kind> --detail "…"` on a halt |
| verify | — | `fc launch phase verify`; `fc verify`; `fc verifier render`; `fc return verifier <file> --pass n` |
| review | adjudicate disputes | `fc launch phase review`; `fc critic render --pass n`; `fc return critic <file> --pass n`; `fc return critic --resolve F --commit <sha>`; `fc verify` |
| report | read ledger, findings, unverified lines, cost; `fc launch end <accepted|accepted-with-reservations|abandoned|partial> [--at <gate or phase the run stopped at>] [--units <ids>]` | `fc launch phase report`; `fc launch note <text>` |
| after | run the worktree and branch cleanup lines `fc launch end` printed; fill the `<fill>` fields of the entry `fc launch end` inserted into `flightdeck/launch/RUNLOG.md` (which sits beside the launch folders, not inside one); `fc launch land --commit <sha> --pr <url>`; `fc runlog show --spec S` | — |
| any | `fc launch status`; `fc events summary`; `fc report`; `fc evidence`; `fc budget`; `fc validate all`; `fc doctor` | `fc launch note`; `fc events append <json> [--stated]`; `fc events usage <json>` |

## Side sessions and FLIGHTCREW_LAUNCH

- Resolution: `FLIGHTCREW_LAUNCH=<name>` selects that launch whatever its status; `FLIGHTCREW_LAUNCH=none` means no launch; otherwise the unique launch with status active.
- A session in the same repository that is not the run: `FLIGHTCREW_LAUNCH=none claude`, so the hooks stay silent and no edit is denied as locked; the `SessionStart` message says when a launch is active.
- A session inspecting an ended launch: `FLIGHTCREW_LAUNCH=<name> fc launch status`, `fc report`, `fc events summary` read it without activating it.
- Two launches active, or a `launch.json` that does not parse: `fc` exits 1 naming both, the guards answer `ask`, the recording hooks stay silent; fix by ending one or setting `FLIGHTCREW_LAUNCH`.
- `FLIGHTCREW_LAUNCH` naming a folder that does not exist: `fc` exits 1 naming it; hooks exit 0 silently.
- The launch root is the first of `$FLIGHTCREW_ROOT`, `$CLAUDE_PROJECT_DIR`, the git toplevel of cwd and the repository containing `fc` that names a directory at all; a source naming no directory is skipped, and the first that names one settles it, so a named directory without `flightdeck/launch/` under it is an environment error rather than a reason to try the next. hooks read `$CLAUDE_PROJECT_DIR` first; launches live at `<root>/flightdeck/launch/`.

## Staleness

- `fc launch status` warns when the newest event is older than 24 hours; an active launch nobody is running still enforces its locks on every session.
- `fc launch phase review` and `fc critic render` refuse while `evidence/summary.json` is older than HEAD; re-run `fc verify` after every commit that precedes review.
- `fc launch end` (accepted family) refuses while `summary.json.commit` differs from HEAD or the tree is not clean under the allowed paths.
- `fc launch land` refuses while no evidence at the landing commit (or `--evidence-commit`) has zero fail and error counts.
- A launch still carrying status `active` that nobody is running blocks the next `fc launch activate`; end it first. (`abandoned` is an ended outcome and cannot be active.)
