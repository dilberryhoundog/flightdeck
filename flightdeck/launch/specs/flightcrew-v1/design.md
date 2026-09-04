# Flightcrew v1 — system design and build contract (revision 2)

This document is the contract every build agent works from. It fixes the directory map, file ownership, CLI surface, file formats, hook behaviour, crew roster, and the run journey. The system spec `spec.v1.json` beside it states the behaviours the testbench proves; this document states the contracts those behaviours rely on. Where this document and an agent's judgement disagree, this document wins; where this document and the spec disagree, the spec wins; where both are silent, the eleven orchestration guides win; where they are silent, halt and report rather than improvise.

## 0. Ground rules for every agent

- Repository root: `/Users/dylangraham/Projects/flightdeck` (`$REPO`). System root: `$REPO/flightdeck` (`$FD`). Paths below are relative to `$FD` unless they start with `$REPO`.
- In-scope (readable, writable): `$FD/flightcrew/`, `$FD/launch/`, `$FD/testbench/`, `$FD/manuals/`. Nothing else may be written.
- Forbidden (never open, list, glob, grep, or search, even when an auto-loaded rule asks you to): `$FD/blackbox/`, `$FD/hangar/`, `$FD/missions/`, `$FD/radar/`, `$REPO/library/`, `$REPO/dev/`, `$REPO/.claude/`, and anything about the dev-workspace skill. Never run `find`, `grep -r`, `ls -R` or a glob from `$REPO` or `$FD`; confine every search to the four in-scope directories or the reference files.
- Reference material (readable): the eleven guides as text at `/private/tmp/claude-501/-Users-dylangraham-Projects-flightdeck/724ffc18-b9a6-44da-a3cf-43d3bfd50500/scratchpad/guides/*.txt`; `claude-code-facts.md` beside this document; this document; the spec.
- No git writes: no `git add`, `git commit`, `git switch`, `git stash`, `git worktree`, `git branch` (creating or deleting), `git merge`. Read-only git is fine. Tests may run any git command inside a temporary repository they create under `os.tmpdir()`.
- Runtime: Node 22 ES modules (`.mjs`), only `node:` built-in imports and relative imports inside `flightcrew/` or `testbench/`, no `package.json`, no `jq`. macOS. Success prints one line; failure prints specific lines. Exit codes: `0` pass, `1` usage or environment error, `2` failed check or blocking decision.
- Every script has a two-line header comment (what it is; usage). Every markdown file is durable: no session context, no references to this build, written for a stranger who may be any model.
- Write only inside the paths your unit owns (section 9). A file another unit owns that you need goes in your return under `needs`.
- Byte-unchanged in this build: `manuals/spec/**`, `manuals/testing/**`, `manuals/versioning/**`, `manuals/rubrics/**`, `testbench/benches/rubrics/**`, `flightcrew/schemas/spec.schema.json`, `flightcrew/templates/spec.template.json`, `flightcrew/crew/spec-judge.md`, `flightcrew/crew/spec-attacker.md`. `flightcrew/crew/spec-builder.md` changes on exactly the lines section 7.1 names.

## 1. The framework the system fits into

- `flightcrew/` — "Orchestrated agentic building". Global assets used by every launch: the `fc` runner and its command modules (`bin/`), universal check harnesses (`checks/`), the crew (`crew/`), hook scripts (`hooks/`), schemas, templates, dynamic workflow scripts, and `MANIFEST.txt`. It is a distribution location: `crew/*.md` copies to `.claude/agents/flightcrew/`, `workflows/*.js` to `.claude/workflows/`. Hooks are never copied; they run in place from `flightcrew/hooks/` via `$CLAUDE_PROJECT_DIR`. Nothing in this build writes to `.claude/`.
- `launch/` — "Orchestrated build runs. self contained." Three kinds of entry: `launch/specs/<name>/` (the canonical, cross-run home of each spec: `spec.v*.json`, `tests-map.v*.json`, `checks/` for check scripts with no natural project home, `interview/` which is never copied), `launch/<L>/` (one folder per run, holding pinned copies and everything the run produces), and the files `launch/README.md` and `launch/RUNLOG.md`. Active-launch resolution scans only subdirectories containing `launch.json`.
- `testbench/` — "Test harnesses. reusable across the git branch." The suite runner, one regression suite per spec T id, fixtures, and the rubric bench. Never launch results. `testbench/benches/rubrics/spec/experiments/<spec>/` is the committed home for future rubric-bench chains.
- `manuals/` — agent-facing manuals. The existing spec, testing, versioning and rubric manuals stay byte-unchanged; this build adds `orchestration/`, `harness/`, `launch/` and an index.

## 2. Directory map (target state)

```
flightcrew/
  README.md  MANIFEST.txt  orchestration.keep
  bin/
    runners.keep
    fc                      bash shim: exec node "$(dirname "$0")/fc.mjs" "$@"
    fc.mjs                  entry; parses --launch/--json; imports cmd/<command>.mjs exporting run(args, ctx) and help
    cmd/  launch.mjs check.mjs verify.mjs boundary.mjs locked.mjs budget.mjs events.mjs evidence.mjs report.mjs
          runlog.mjs plan.mjs validate.mjs lint.mjs worker.mjs critic.mjs verifier.mjs return.mjs distribute.mjs doctor.mjs
  checks/
    checks.keep
    lib/   schema-lib.mjs spec-lib.mjs launch-lib.mjs git-lib.mjs glob-lib.mjs output.mjs render-lib.mjs
    validators/  validate-spec.mjs validate-tests-map.mjs validate-plan.mjs validate-launch.mjs validate-return.mjs
                 validate-kickoff.mjs validate-all.mjs spec-readiness-lint.mjs
    gates/  acceptance-gate.mjs structural-gate.mjs contracts-gate.mjs
  crew/
    agents.keep README.md
    spec-builder.md spec-judge.md spec-attacker.md          (existing)
    explorer.md test-builder.md planner.md orchestrator.md implementer.md verifier.md critic.md
  hooks/
    README.md settings.fragment.json lib.mjs
    event-log.mjs lock-guard.mjs boundary-guard.mjs structural-check.mjs stop-gate.mjs session-end.mjs
  schemas/
    spec.schema.json (existing) tests-map.schema.json plan.schema.json launch.schema.json event.schema.json
    check-result.schema.json explorer-return.schema.json worker-return.schema.json verifier-verdict.schema.json
    critic-findings.schema.json
  templates/
    spec.template.json (existing) tests-map.template.json launch.template.json plan.template.json
    constitution-fragment.md worker-dispatch.template.md critic-dispatch.template.md verifier-dispatch.template.md
    explorer-dispatch.template.md report.template.md runlog-entry.template.md
    kickoff/  README.md base.md shape-session.md shape-workflow.md shape-sessions.md
              task-feature.md task-migration.md task-audit.md task-agent.md
  workflows/
    README.md fc-implement.js fc-review.js fc-explore.js

launch/
  runs.keep README.md RUNLOG.md
  specs/flightcrew-v1/spec.v1.json  specs/flightcrew-v1/tests-map.v1.json
  flightcrew-buildout/   (section 10)

testbench/
  tests.keep README.md run-all.mjs
  runs/.gitignore
  suites/<name>/run.mjs   one per T id in the spec's verification mapping, plus unit-*/ suites implementers add
  fixtures/sample-project/  fixtures/sample-launch/  fixtures/sample-spec/
  benches/rubrics/spec/   (existing) + experiments/.keep

manuals/
  documentation.keep README.md
  orchestration/ journey.md planning.md kickoff.md review.md endings.md run-log.md run-report.md crew.md
  harness/ hooks.md permissions.md workflows.md
  launch/ launch-anatomy.md
  spec/ testing/ versioning/ rubrics/   (existing)
```

## 3. The run journey, mapped to flightdeck

| # | Stage | Who | Commands and artefacts |
|---|---|---|---|
| 1 | Idea → spec | human with spec-builder; spec-judge; spec-attacker | `launch/specs/<S>/spec.vN.json` written, linted (`fc lint spec`), validated (`fc validate spec --for-freeze`), frozen by the human (status frozen, `commit` field set), committed. |
| 2a | Open the launch | human | `fc launch new launch/specs/<S>/spec.vN.json` → `launch/<L>/` (status draft, phase targets, spec copy pinned, `kickoff.md` with `tests-map: (none)`), then `fc launch activate <L>`. Commit. |
| 2b | Spec → targets | test-builder (fresh; sees the spec, the fixture, the codebase) | Writes `launch/specs/<S>/tests-map.vN.json` (draft) and check scripts; `fc check all --baseline <map>` records observed; the human freezes and commits the map; `fc launch pin tests-map <map>` copies it into the launch, sets allowed and locked paths, records `lock_commit`, re-renders the kickoff. Commit. |
| 3 | Kickoff | human | `fc launch phase plan` (refuses until pins are frozen, baseline agrees, launch and kickoff validate). Start the orchestrator: `cd $REPO && claude --agent orchestrator --permission-mode acceptEdits`. |
| 4 | Plan | orchestrator via planner and explorers | `fc plan write <json>` (validates, stores `plan.json`, renders `plan.md`). Evidence page updates. |
| G1 | Gate 1 | human | Read `plan.md` against the spec; edit `plan.json` and `fc plan render` if needed; `fc launch gate G1 approve` (phase → contracts) or `fc launch gate G1 exit` then `fc launch end abandoned --at G1`. Commit. |
| 5 | Contracts (wave 0) | one implementer | Interface files and contract checks; stop-gate runs the W0 unit's checks and the boundary in this phase. Commit. |
| G2 | Gate 2 | human | Read the evidence page's "Changed since lock" and the W0 check results; `fc launch gate G2 approve` (refuses while a W0 check is in error or has not run since `lock_commit`; phase → implement) or `exit`. |
| 6 | Implement (waves 1..n) | implementers, worktree-isolated, one unit each | `fc worker render <unit>` → dispatch; worker builds on branch `<L>/<unit>`, runs `fc check <T…>` in its worktree, returns worker-return; `fc return worker <file> --unit U`; `fc worker merge <unit>` in wave order. Pilot units first; chunks of `implementers_concurrent`. Commit per merge. |
| 7 | Verify | scripts; optional verifier | `fc launch phase verify`; `fc verify` (check all + boundary + locked + budget); stop-gate holds the turn on T1 in this phase; `fc verifier render` → verifier → `fc return verifier`. |
| 8 | Review | critic (fresh), one fix pass, fresh re-review | `fc launch phase review` (refuses while evidence is red); `fc critic render` → critic → `fc return critic --pass 1`; route findings by kind; `fc launch phase verify` back for re-check is not needed: fixes re-run `fc verify` in place; second pass capped by `critic_passes`. |
| 9 | Report | `fc launch end` | `fc launch phase report`; `fc launch end <outcome>` renders `report.md`, `evidence.html`, inserts the RUNLOG stub, prints worktree cleanup lines. |
| G3 | Gate 3 | human | Read the ledger, open findings, the three unverified lines, the cost line. The outcome given to `fc launch end` is the decision. |
| 10 | Merge, log, promote | human | Integration branch rebased on the parent, `fc verify` there, PR opened with `report.md` linked, CI, merge, `fc launch land --commit <sha> --pr <url>`; write the RUNLOG diagnosis fields; prune worktrees; promote confirmed rules. |

Commit points the run relies on: after 2a, after 2b (`fc launch pin`), after G1 (plan), after wave 0, after each `fc worker merge`, at 9. Subagent worktrees branch from HEAD, so anything uncommitted in the launch folder is invisible to workers.

Exits: any abandon trigger, escalation, or halt return stops dispatch. `fc launch end abandoned --at <gate|stage>` records it and still renders the report. Re-entry follows the guide's table (context → spec, kickoff or foundation; verification → stage 2b; tooling → foundation then stage 3). `manuals/orchestration/journey.md` carries the table and `endings.md` the three ending checklists.

## 4. launch.json

Path `launch/<L>/launch.json`; schema `flightcrew/schemas/launch.schema.json`; shape in spec I2. Rules:

- `status` ∈ `draft | active | accepted | accepted-with-reservations | abandoned | partial`. Exactly one launch may be `active`. Resolution: `FLIGHTCREW_LAUNCH=<name>` selects that launch whatever its status; `FLIGHTCREW_LAUNCH=none` means no launch; otherwise the unique `launch/*/launch.json` with status active; two or more active is an error (`fc` exits 1 naming them; recording hooks stay silent; guard hooks emit an `ask` decision).
- `phase` ∈ `targets | plan | contracts | implement | verify | review | report | ended`, in that order. `fc launch phase <p>` accepts only the next phase; `G1 approve` moves plan→contracts, `G2 approve` moves contracts→implement; `--force` records a skip in the event detail.
- Root resolution (`fc` and hooks): assets from the script's own location; the launch root is `$FLIGHTCREW_ROOT`, else `$CLAUDE_PROJECT_DIR`, else the git toplevel of cwd, else the repository containing `fc`; launches live at `<root>/flightdeck/launch/`. Hooks read `$CLAUDE_PROJECT_DIR` first.
- `paths.allowed`, `paths.locked`: glob-lib dialect (section 5.13), repository-relative. Set by `fc launch pin tests-map` from the map's `allowed_paths` and `locked_paths ∪ [flightdeck/launch/<L>/specs/**, flightdeck/launch/specs/<S>/**]`; `enforce_boundary` true from then. `fc launch new --allow <glob>` may seed `paths.allowed` earlier (else `[]`, `enforce_boundary: false`).
- `lock_commit`: HEAD at `fc launch pin tests-map`; the base for `fc boundary`, `fc locked`, `fc critic render`, and the evidence page's "Changed since lock".
- `spec.commit` is the spec file's own `commit` header (null while draft); `spec.file_commit` from `git log -1 -- <path>` is informational. `allow_draft: true` records that activation or pinning accepted a draft. Hashes are 7–40 hex, compared by prefix.
- `previous_launch`: name of the newest other launch with the same `spec.name`, or null.
- `accepted_units`, `abandoned_units`: written by `fc launch end partial --units`. `landed: {commit, pr, integration_check}` by `fc launch land`.
- `escalation.json` in the launch folder marks an open escalation (stop-gate releases while it exists); a `trigger` event newer than the newest `gate`, `escalation` or `launch_end` event marks a fired abandon trigger (guards deny every edit; `fc worker render`, `fc worker merge`, `fc launch phase` except to ended exit 2).

Ceilings and their counters:

| ceiling | counted from | enforced by |
|---|---|---|
| `agents` | `SubagentStart` events | `fc budget` |
| `implementers_concurrent` | dispatch chunking (reported, not counted) | `fc-implement.js`, orchestrator body, validate-plan (parallel wave size) |
| `turns_per_agent` | crew `maxTurns` | validate-plan (`budget_turns` ≤ ceiling ≤ implementer frontmatter) |
| `gate_iterations` | consecutive `stop_block` events since the newest passing `check_run`, `escalation`, `gate` or `phase` event | `fc budget` |
| `stop_blocks` | the same count | stop-gate cap = `min(stop_blocks, 8)`; validate-launch errors above 8 |
| `critic_passes` | `review/pass-*.json` count | `fc-review.js`, orchestrator body, `fc budget` |
| `minutes` | wall clock first→last event | `fc budget` |
| `tokens` (nullable) | `usage` events only | `fc budget` (`unobserved` when none) |

`expected_tokens` is nullable; `plan.expected_cost` is `{agents, minutes, tokens?}`.

## 5. Formats

### 5.1 tests-map.vN.json
Schema `tests-map.schema.json`; shape in spec I3. Additions over the versioning manual: `allowed_paths` (required, non-empty when frozen), `quarantined: [{id, since, reason}]`, `previous_versions` newest first with each entry carrying its `spec` pin. The schema's `description` lists the map invariants as `tm-invariant-1 … tm-invariant-13`:
1 ids carry the `T` prefix; 2 ids unique; 3 live plus retired ids form an unbroken `1..N`; 4 v1 has every check `ok` and no retired entries; 5 a non-ok check carries a `note`; 6 `commit` present iff frozen; 7 `2 ≤ retired.at ≤ version`; 8 every retired entry's `covers` is remapped to a live check or listed in `unverified`; 9 `previous_versions` is newest first, strictly descending, covering every earlier version; 10 `T1` exists and equals `acceptance`; 11 frozen → every check's `baseline.observed` first word equals its `expect` first word; 12 the spec pin names a frozen spec version (waived under `allow_draft`); 13 frozen → `allowed_paths` and `locked_paths` non-empty. Plus the coverage rule: frozen → every live B/E/C/I of the pinned spec appears in some `covers` or in `unverified`.
`gate_only` checks run under `fc check all` and the stop gate, are marked "gate only" in dispatch prompts, and are skipped by nothing else. Quarantined ids get verdict `skipped`.

### 5.2 Check execution and results
Each check runs as `/bin/sh -c <command>` with cwd = the launch root (or `--cwd`), the parent environment plus `FLIGHTCREW_LAUNCH=<L>`, a 300 s limit, serially in map order. A command that cannot spawn or times out gets verdict `error` with `stderr_tail` naming the command and the cause. Result file shape in spec I6; tails are the last 40 lines. `evidence/summary.json` is rebuilt from every `evidence/<T>.json` present, so `fc check T1 T3` leaves earlier results in place; `skipped` never affects the exit code. `--baseline <map>` runs a draft map without a pin, writes `baseline.observed` as `<pass|fail|error>: <first non-empty output line>` and the file-level `baseline {commit, date}`, writes no evidence, exits 0 when every command spawned.

### 5.3 events.jsonl and hooks.log
Shape in spec I5. Recorded hook events: `SessionStart, SessionEnd, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, Stop, WorktreeRemove`; other `hook_event_name`s are ignored. Allowed `detail` keys: `tool_name, file_path, command (200 chars), error, tool_error_code, permission_denial_reason, stop_reason, trigger, task_id, task_title, reason, mode, prompt (200 chars), transcript_path, worktree_path`. `source` ∈ `hook | fc | stated`; `fc events append --stated` marks stated, rendered under `[stated]`. Synthetic events: `gate {gate, decision, note}`, `phase {from, to, forced}`, `stop_block {count, checks}`, `stop_release`, `stall {blocks}`, `trigger {name, detail}`, `escalation {kind, detail}`, `lock_denied {path}`, `boundary_denied {path}`, `check_run {id, verdict}`, `return {kind, status, unit?, id?, pass?}`, `worker_return` (alias of `return` with kind worker), `unit_merged {unit, branch, commit}`, `usage {agent_id?, input_tokens, output_tokens, cost_usd?, source}`, `launch_end {outcome}`. `hooks.log` lines: `<iso ts> <hook name> <message>`.

### 5.4 plan.json and plan.md
Shape in spec I4. `no_contracts: {reason}`. Rules validate-plan enforces: every `checks` id in the pinned map; every `spec_refs` id live in the pinned spec; `depends_on` names units in earlier waves; exactly one `kind: contracts` unit in serial `W0` unless `no_contracts`; at least one `pilot` in the first parallel wave; `abandon_triggers` non-empty; each parallel wave ≤ `implementers_concurrent`; `budget_turns` ≤ `turns_per_agent` ≤ implementer `maxTurns`; `expected_cost.agents` ≤ `ceilings.agents`; tokens compared only when both present; every unit's `checks` non-empty; `shape` equals the `shape-<x>` part in `kickoff.version`; a `source: runlog` risk names an existing RUNLOG heading (warning). `plan.md` headings in order: `# Plan: <spec> · <launch>`, `## Approach`, `## Waves and units` (one table row per unit), `## Risks`, `## Gates`, `## Abandon triggers`; rendering is deterministic and refuses an invalid plan.

### 5.5 Returns
Shapes in spec I8. `fc return <worker|explorer|verifier|critic> <json> [--unit U | --id X | --pass n] [--agent id]` validates by kind, stores at `returns/<unit>.json`, `returns/explore-<id>.json`, `returns/verify-<n>.json`, `review/pass-<n>.json`, appends a `return` event. `fc worker return <unit> <file>` is an alias. Finding state changes go to `review/resolutions.json` via `fc return critic --resolve F1 --commit <sha> [--dispute "…"]`; pass files are never edited. The explorer return is a declared superset of the shape spec-builder dispatches with; `id` echoes the dispatcher's `X<n>`.

### 5.6 report.md
Headings in spec I12. Placeholders: no `evidence/summary.json` → Verification reads `not run` under its counts line and the three lines show `—`; no `review/pass-*.json` → Review reads `not run`; no `plan.json` → ledger lists `—` and a line `plan: none`; no `events.jsonl` → Phases, Agents, Failures read `no events recorded`; a unit without a return file shows `not returned`. Header carries spec, kickoff, started, ended, outcome, cost (`agents · stop blocks · minutes · tokens or not recorded`), agents, phases, `allow_draft` when set, `landed` when set, accepted and abandoned unit lists for partial runs. Ledger's "attempted and discarded" comes from `WorktreeRemove` events whose worktree produced no green return or `unit_merged`, plus a `git worktree list` snapshot. The Failures section starts with `unparseable: <n>` when any event line failed to parse and lists escalations and triggers. Findings are printed as returned; state joins `resolutions.json`. Orchestrator notes come from `notes.md` (written by `fc launch note`) else `(none recorded)`. The report never states an acceptance verdict.

### 5.7 evidence.html
Self-contained (spec B19, B37). Regenerated best-effort (never changing exit codes) by `fc check`, `fc boundary`, `fc locked`, `fc budget`, `fc verify`, `fc return`, `fc launch gate`, `fc launch phase`, `fc launch escalate`, `fc launch end`, and the SessionEnd hook.

### 5.8 kickoff.md
Rendered by `fc launch kickoff`, called by `fc launch new` and `fc launch pin`; never hand-edited (a conduct change is an edit to a library part with its version bumped). Header block:
```
# Kickoff: <task part> · <shape part>
launch: flightdeck/launch/<L>    spec: <path> @ <commit|draft>    tests-map: <path> @ <commit> | (none)
kickoff version: base@1+shape-session@1+task-feature@1
read first: flightdeck/launch/RUNLOG.md    prior reports: <launch/*/report.md list | none>
write plan with: fc plan write    evidence: flightdeck/launch/<L>/evidence.html
```
Then `base.md` + the shape part + the task part. Each part's first line is `<!-- version: N -->`. Base sections in order: Conduct, Escalate, Roles, Communication, Budgets, Outputs, Never. Escalate says: run `fc launch escalate <kind> --detail "…"` naming the finding, then end the turn; propose nothing else in the same message. Roles names each crew agent in backticks.

### 5.9 RUNLOG entry
`## <ended date> · <spec name> · <launch name>` then one `<field>: <value>` line per field, inserted after the file's first heading (`# Run log`, created when absent), newest first. Accepted family: `spec, kickoff, outcome, cost, kept: <fill>, reservation: <fill>`. Abandoned or partial: `spec, kickoff, outcome, cost, symptom (pre-filled from the ending event), seen on: <fill>, cause: <fill>, fixed on: <fill>, change: <fill>, watch: <fill>`, optional `kept:`, `promote:`; partial adds `landed:` and `abandoned:`. Observations from the last critic pass follow under `observations:`. `fc runlog show [--spec S]` prints newest first.

### 5.10 settings.fragment.json
Shape in spec I14: `hooks` whose commands are `node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/<name>.mjs` (stop-gate `timeout: 600`), `worktree: {baseRef: "head"}`, `permissions.allow` (fc by its three invocation forms, read-only git, `git add/commit/switch`, `git worktree list`, `Agent(<each crew name>)`, `Workflow(fc-implement|fc-review|fc-explore)`), `permissions.deny` (`Edit(flightdeck/launch/*/specs/**)`, `Edit(flightdeck/launch/specs/**)`), and a commented `sandbox.filesystem.deny` example. `fc distribute` substitutes the absolute `node` path from `process.execPath` when printing, and prints the `.claude/worktrees/` gitignore line and `templates/constitution-fragment.md`.

### 5.11 MANIFEST.txt
One repository-relative path per line for every file this system ships (everything the spec's scope names). `fc doctor` and suite `manifest` check each exists and is non-empty.

### 5.12 Validator output contract
One `error: <message> — [<rule>]` line per violation, rule ∈ schema keyword (`required`, `additionalProperties`, `enum`, `type`, `minItems`, `pattern`, `minimum`, `maximum`, `minLength`) or `invariant-N` / `tm-invariant-N` / `plan-rule-N` / `launch-rule-N` / `kickoff-rule-N`; `warn:  <message>` (two spaces) per warning; exit 0, or 2 on any error or on a warning under `--strict`; flags `--schema <f>`, `--for-freeze`, `--strict`, `--resolve-commits`. validate-spec keeps the filename warning (`is not spec.v<n>.json`), the folder warning (`does not match folder`), and the invariant-7 heuristic (an edge whose text has no `: <outcome>` clause warns `concern rather than an outcome`). `validate-all <dir> [--quiet] [--strict] [--for-freeze]` prints `ok|warn|FAIL <file>` per file and a count. schema-lib supports: `type` (string or array), `required`, `properties`, `additionalProperties`, `enum`, `const`, `pattern`, `minimum`, `maximum`, `minLength`, `minItems`, `items`, `oneOf`, `anyOf`, `$defs` with same-document `$ref`; `format` ignored; `$schema` never resolved.

### 5.13 Glob dialect (glob-lib)
`**` any depth; `*` within a segment; `?`; leading `/` anchors at the repository root; trailing `/` matches the directory and everything under it; a pattern without `/` matches a basename at any depth; no negation. Paths are repository-relative; inside a worktree they are relative to the worktree root (`git -C <dir> rev-parse --show-toplevel`, falling back to stripping `<$CLAUDE_PROJECT_DIR>/.claude/worktrees/<name>/`).

### 5.14 Linter rules (spec-readiness-lint)
Rule ids: `lint-domains` (nine domains present; an empty one says "empty by decision" with a reason), `lint-open-questions`, `lint-sequential` (live ids plus retired form an unbroken 1..N per prefix), `lint-out-list`, `lint-artefacts` (a token in an I or VER text containing `/` or ending in `.mjs .js .json .md .sh`, quotes and trailing punctuation stripped, resolves under `--repo` or is listed by `--deliverable`), `lint-commands-run` (each command named in VER resolves: first token on PATH; for node, bash, sh the script argument exists under `--repo`), `lint-claimed` (every B and E id appears in VER on a word boundary), `lint-boundary` (ACC text contains a token ending in `/` or `/**`), `lint-class-tags` (when the spec's INT or SC text contains "agent-shaped", every behaviour text starts with `[deterministic]`, `[property]`, `[statistical]` or `[judged]`); warnings `warn-impression`, `warn-length`.

## 6. The `fc` CLI

Entry `flightcrew/bin/fc <command> [sub] [args] [--launch <name>] [--json]`. One line on success except commands whose purpose is a document or listing (`launch status`, `events summary`, `runlog show`, `worker render`, `critic render`, `verifier render`, `distribute` without `--apply`, `validate all`, `doctor`). Exit `0 | 1 | 2`.

| command | flags | behaviour |
|---|---|---|
| `launch new <spec-path>` | `--name N` (default `<spec.name>-<n>`), `--kickoff base+shape-<s>+task-<t>` (default `base+shape-session+task-feature`), `--branch B` (default `run/<N>`), `--allow <glob>` (repeatable) | creates `launch/<N>/` with `launch.json` (draft, targets), `specs/<S>/spec.vN.json` copy, `kickoff.md`, empty `events.jsonl`, dirs `evidence/ returns/ review/`; pins spec commit; fills `previous_launch`; prints `export FLIGHTCREW_LAUNCH=<N>`; exit 1 `launch exists` when the folder exists |
| `launch activate <N>` | `--allow-draft` | status → active; exit 1 when another is active, when status ≠ draft, when the spec (or a pinned map) is draft without the flag, or when a pinned map's spec pin ≠ launch.json.spec |
| `launch status` | | name, status, phase, gates, pins, ceilings vs counts, staleness warning when the newest event is older than 24 h |
| `launch phase <p>` | `--force` | next phase only; `plan` requires frozen pins (or allow_draft), baseline agreement, validate-launch and validate-kickoff exit 0, warns when the git branch ≠ `branch`; `review` requires `summary.json` at HEAD with zero fail/error and clean boundary and locked; blocked while a trigger is fired (except to ended); appends `phase` |
| `launch gate <G1|G2|G3> <approve|exit>` | `--note`, `--force` | records gate and timestamp; G1 approve → contracts; G2 approve → implement, refused while a W0 check is in error or has not run since `lock_commit`; exit 1 when already decided unless `--force`; `exit` prints `now run: fc launch end abandoned --at <G>` |
| `launch end <outcome>` | `--at <stage>`, `--units U,…` | the single ending: sets outcome, status, `ended`, phase ended; accepted family refuses unless `summary.json.commit` = HEAD and the tree is clean under allowed paths; partial requires `--units` and refuses units failing the partial rules (spec B44); renders report and evidence, inserts the RUNLOG stub, prints worktree/branch cleanup lines and the report path |
| `launch pin tests-map <path>` | `--allow-draft` | requires frozen map or flag; copies it to `specs/<S>/`, sets paths and `enforce_boundary`, records `lock_commit`, re-renders the kickoff, prints one `Bash(<command>)` allow line per check |
| `launch kickoff` | `--parts base+shape-<s>+task-<t>` | (re)renders `kickoff.md` |
| `launch escalate <spec-gap|wrong-check|blocked|trigger|budget|halt>` | `--detail` | writes `escalation.json`, appends `escalation`; cleared by gate, phase, end |
| `launch note <text>` | | appends to `notes.md` |
| `launch land` | `--commit <sha>`, `--pr <url>`, `--evidence-commit <sha>` | writes `landed`; refused unless evidence at that commit has zero fail/error |
| `check [all|T…]` | `--baseline <map>`, `--cwd <dir>` | section 5.2; exit 1 `no tests map pinned`, `pin mismatch`, unknown id |
| `verify` | | check all + boundary + locked + budget; exit 2 if any is 2 |
| `boundary` / `locked` | `--base <commit>` | since `lock_commit` (fallback `base_commit`); changed = commits after base ∪ staged ∪ unstaged ∪ untracked-not-ignored, excluding `.claude/worktrees/**` and `flightdeck/testbench/runs/**`; boundary's inside set = allowed ∪ locked ∪ `flightdeck/launch/<L>/**`; writes `evidence/boundary.json {base, changed:[{path, added, removed}], outside:[]}` / `evidence/locked.json` |
| `budget` | | counts beside ceilings (section 4); `unobserved`/`null` semantics; appends `trigger` on exit 2 |
| `events append <json>` / `events usage <json>` / `events summary` | `--stated` | append (fills ts, launch, phase, source); usage event; summary by event and per agent with `unparseable: <n>` |
| `evidence` / `report` | | render |
| `runlog stub` / `runlog show` | `--spec S` | section 5.9 |
| `plan write <json|--stdin>` / `plan render` | | validate then store and render / render (refuses invalid) |
| `validate <spec|tests-map|plan|launch|kickoff|return|all> [path]` | `--kind`, `--for-freeze`, `--strict`, `--resolve-commits` | section 5.12 |
| `lint spec <path>` | `--repo <root>`, `--deliverable <path>` (repeatable) | section 5.14 |
| `worker render <unit>` | | dispatch prompt (section 7: template rules); exit 1 when phase ≠ implement, unknown unit, or no plan; exit 2 while a trigger is fired |
| `worker merge <unit>` | | requires green return, current branch = `branch`, dependencies merged; `git merge --no-ff --no-commit <L>/<unit.name>`, runs the unit's checks, commits, appends `unit_merged`, removes the worktree and branch; aborts and exits 2 on red or conflict |
| `critic render` / `verifier render` | `--pass n` | sealed dispatch files `review/pass-<n>.prompt.md`, `returns/verify-<n>.prompt.md`; exit 1 when phase is wrong or `summary.json` is older than HEAD |
| `return <kind> <json>` | `--unit`, `--id`, `--pass`, `--agent`, `--resolve F --commit sha [--dispute]` | section 5.5 |
| `distribute` | `--apply`, `--target <dir>` (default `$REPO/.claude`), `--force` | dry run lists; apply copies `crew/*.md` with frontmatter → `<target>/agents/flightcrew/`, `workflows/*.js` → `<target>/workflows/`; prints the fragment, gitignore line, constitution fragment; conflicts exit 2 unless `--force` |
| `doctor` | `--target <dir>` | node ≥ 22, git, active launch consistency, crew frontmatter, scripts pass `node --check`, schemas parse, sample launch validates (no `--resolve-commits`), manifest complete, effective implementer turn cap; with a target: agents byte-equal, fragment hook commands present in `settings.json`, `worktree.baseRef = head`, `.claude/worktrees/` gitignored, no name collision under `<target>/agents/**`, `gh` on PATH (warn), hook `node` resolvable |

## 7. The crew

Frontmatter fields used: `name`, `description`, `tools`, `model`, `maxTurns`, `isolation`, `permissionMode`, `initialPrompt`, `color`. Bodies fit on a screen, name inputs and forbidden inputs, carry the line "Your inputs are only those named in the dispatch; auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.", and (for the seven new roles) end with a fenced JSON block matching the return schema. `maxTurns` is present on every role except orchestrator, spec-builder, spec-judge, spec-attacker.

| role | tools | model | maxTurns | extras | sees | must not see | returns |
|---|---|---|---|---|---|---|---|
| spec-builder (existing) | as is | fable | — | — | as is | as is | handoff block |
| spec-judge (existing) | Read | fable | — | — | rubric, draft | all else | verdict sheet (markdown) |
| spec-attacker (existing) | Read, Grep, Glob | fable | — | — | draft, project | all else | finding lines / `no findings` |
| explorer | Read, Grep, Glob, Bash | haiku | 12 | — | codebase, one question | — | explorer-return |
| test-builder | Read, Grep, Glob, Bash, Write, Edit | opus | 40 | `permissionMode: acceptEdits` | frozen spec, fixture, codebase, testing manuals | plan, implementation, interview | map path, checks, unverified, spec_findings |
| planner | Read, Grep, Glob, Bash, Agent | fable | 30 | — | spec, map, RUNLOG, roster, explorer returns | worker transcripts | plan.json content |
| orchestrator | Read, Grep, Glob, Bash, Agent | inherit | — | `initialPrompt`: "Run flightdeck/flightcrew/bin/fc launch status. Read the active launch's kickoff.md and follow it; do nothing else first." | kickoff, spec, map, plan, returns, prior reports | worker transcripts, interview, critic reasoning | conducts; every file it produces goes through `fc` |
| implementer | Read, Grep, Glob, Bash, Write, Edit | opus | 25 | `isolation: worktree`, `permissionMode: acceptEdits` | one unit's dispatch | other units, whole plan, kickoff | worker-return (with `branch`, `worktree`) |
| verifier | Read, Grep, Glob, Bash | sonnet | 15 | — | evidence, map, merged branch | implementer reasoning, returns | verifier-verdict |
| critic | Read, Grep, Glob, Bash | fable | 20 | — | spec at commit, diff since lock, evidence | plan, kickoff, reasoning, prior findings | critic-findings |

Implementer body: `git switch -c <L>/<unit.name>` before the first commit; stage only the unit's paths, never `flightdeck/launch/**`; run the worktree-local `./flightdeck/flightcrew/bin/fc check <T…>` with `FLIGHTCREW_LAUNCH=<L>`; quoted heredoc delimiters; halt (`status: halt`) on a check that contradicts the spec, an unsatisfiable check, a permission block, a boundary denial, or a spent budget; locked paths are hook-enforced for edits and detected by `fc locked` for everything. Critic body and dispatch template contain: the presumption ("assume the diff contains at least one gap and look for it"), the ordered checklist (behaviours implemented; scope held; tests untouched; errors handled, not suppressed), the bound ("correctness or stated requirements; not style, not hypothetical robustness"), the four finding kinds, and the exit `no gaps`. Orchestrator body carries the pilot-first, chunked dispatch, halt-stops-dispatch and findings-routing rules (section 12).

Dispatch prompt (`worker render`): first line `unit: <id>`; always INT, every SC, C, I and D node; the B and E nodes in `spec_refs` and no other B or E; each check as `T<n>` with `covers` and `run fc check <T…>` (gate-only marked); the unit's paths; never a check's command text.

### 7.1 Existing crew files
- `spec-builder.md`: replace `dev/workspace/runs/<spec-name>/` with `flightdeck/launch/specs/<spec-name>/`; in the "Session inputs" Required sentence add "the validator path; the linter path; the rubric path" (the dispatcher passes them). No other change.
- `spec-judge.md`, `spec-attacker.md`: byte-unchanged.

## 8. Hooks

All hooks: `node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/<name>.mjs`, run in place. `lib.mjs` reads the stdin envelope, resolves the launch (section 4), exposes `targetPath(input) = file_path ?? notebook_path` and `repoRelative(file)` (absolutise against envelope `cwd`, toplevel per section 5.13), appends events under `$CLAUDE_PROJECT_DIR/flightdeck/launch` only. Silent no-op (exit 0, no stdout) when no launch resolves, `$CLAUDE_PROJECT_DIR` is unset, `<root>/flightdeck/launch` is absent, or stdin is not a JSON object (one `hooks.log` line when a launch is active). Errors are caught and logged, never thrown.

| hook | events | behaviour |
|---|---|---|
| event-log | the recorded list (5.3) | append one event, `source: hook`. On `SessionStart` also print `{"systemMessage": "flightcrew: launch <L> is active in phase <p>; hooks are enforcing its locks and boundary. If this session is not that run, run fc launch end or set FLIGHTCREW_LAUNCH=none."}`. |
| lock-guard | PreToolUse `Edit\|Write\|NotebookEdit` | phase ≠ targets and target matches `paths.locked` → deny decision naming the path and "report a wrong or unsatisfiable check instead of editing it"; append `lock_denied`. Ambiguous launch (two active, unreadable launch.json) → `ask` decision. Trigger fired → deny every edit ("abandon trigger <name> fired; end or exit the launch"). |
| boundary-guard | same matcher | `enforce_boundary` and phase ∈ contracts/implement/verify/review: deny outside allowed ∪ `flightdeck/launch/<L>/**`; phase targets: deny outside locked ∪ `flightdeck/launch/<L>/**` ∪ `flightdeck/launch/specs/<S>/**`; append `boundary_denied`; same ambiguity and trigger rules. |
| structural-check | PostToolUse `Edit\|Write` | command from `structural[ext]` with `{file}` replaced by the shell-quoted absolute path, via `/bin/sh -c`, cwd = git toplevel of envelope cwd, every phase; non-zero → last 20 combined lines to stderr, exit 2; no command for the extension → exit 0 silently. `.js` uses `node --experimental-default-type=module --check`. |
| stop-gate | Stop | phase `verify`: run `acceptance-gate` (T1). Phase `contracts`: run `contracts-gate` (the W0 unit's checks, falling back to T1 under `no_contracts`, plus `fc boundary`; blocks on a check with verdict error, a check failing whose `baseline.expect` starts with pass, or boundary exit 2). Other phases: exit 0, nothing appended. `escalation.json` present → append `stop_release`, exit 0. Green → append `check_run`, exit 0. Red → count consecutive `stop_block` since the newest passing `check_run`, `escalation`, `gate` or `phase`; at `cap = min(ceilings.stop_blocks, 8)` append `stall` and `trigger`, print `stall: …` to stderr, exit 0; else append `stop_block`, exit 2 with `<T> exit <code>` and the last 20 lines. Gate cannot run (no map, unreadable launch) → exit 0, one `hooks.log` line. |
| session-end | SessionEnd | best-effort `fc evidence` and `fc report`, exit 0. |

`WorktreeCreate` is never hooked (its command hook replaces worktree creation). `WorktreeRemove` is recorded by event-log. Shell writes to locked paths are not intercepted by the guards; the fragment shows a `sandbox.filesystem.deny` example and `fc locked` detects them.

## 9. Build units and ownership

| unit | owns | depends on |
|---|---|---|
| UT targets (test-builder role; before every other unit) | `testbench/run-all.mjs`, `testbench/runs/.gitignore`, `testbench/fixtures/**`, every `testbench/suites/<name>/**` the spec's VER names (including moving `testbench/benches/validator-suite/` to `testbench/suites/validate-spec/` with cases and goldens kept and the runner's validator path fixed, plus an `inv13-id-hole` case), `testbench/benches/rubrics/spec/experiments/.keep`, `launch/specs/flightcrew-v1/tests-map.v1.json` (draft, baseline recorded) | the spec |
| U0 contracts | `flightcrew/schemas/*` (new files), `flightcrew/checks/lib/*` | UT |
| U1 validators | `flightcrew/checks/validators/*`, `flightcrew/checks/gates/*` | U0 |
| U2 runners | `flightcrew/bin/**` | U0 |
| U3 hooks | `flightcrew/hooks/**` | U0 |
| U4 crew | `flightcrew/crew/**` (spec-judge and spec-attacker untouched; spec-builder per 7.1) | U0 |
| U5 templates + workflows | `flightcrew/templates/**` (new files), `flightcrew/workflows/**` | U0 |
| U6 manuals | `manuals/README.md`, `manuals/orchestration/**`, `manuals/harness/**`, `manuals/launch/**`, `launch/README.md`, `launch/RUNLOG.md`, `flightcrew/README.md`, `testbench/README.md` | U0 |
| U7 integration (serial, last) | any in-scope path for cross-unit fixes; `flightcrew/MANIFEST.txt`; `launch/flightcrew-buildout/**`; `testbench/suites/unit-*/**` | U1–U6 |

Implementation units may create suites only under `testbench/suites/unit-*/`. Suite protocol: spec I9. Rules for U6: each orchestration manual ≤ 150 lines; `manuals/README.md` lists per role at most two manuals with the stage each is read, and lists spec-builder, spec-judge, spec-attacker and critic as reading no manual at session time (naming the manuals encoded in their definitions); `crew/README.md` lists the fixed paths a dispatcher passes to a spec session. `launch-anatomy.md` opens with the optional per-shell `alias fc="$PWD/flightdeck/flightcrew/bin/fc"` (not an install) and carries the command-by-phase table. `hooks.md` lists `node: command not found` as the first thing to check. `permissions.md` states the orchestrator start line, the headless form, and that a permission prompt after G2 is a tooling-axis run-log entry. `workflows.md` and the shape parts state: shape-session is the default; shape-workflow is chosen only when a wave holds more units than `implementers_concurrent`; in both shapes the orchestrator session, gates, `fc` commands and stored returns are identical.

## 10. This build's own launch folder

Before UT runs, the human freezes and commits `launch/specs/flightcrew-v1/spec.v1.json`. UT writes the draft map with baseline observed; the human freezes and commits it. U7 then runs the real commands so the folder is produced by the system, not written by hand: `fc launch new launch/specs/flightcrew-v1/spec.v1.json --name flightcrew-buildout --kickoff base+shape-workflow+task-feature` (the existing empty `launch/flightcrew-buildout/checks/` and `specs/` folders are removed first; a `checks/README.md` is not needed), `fc launch activate`, `fc launch pin tests-map`, `fc plan write` with the units of section 9, gates recorded, `fc events append --stated` for phases that ran outside hooks, one `fc return worker` per unit from the workflow returns, `fc verify`, `fc launch phase` through report, `fc launch end` with the outcome the human records. The buildout map's `locked_paths` are every T suite directory, `testbench/fixtures/**`, `testbench/run-all.mjs`, and the byte-unchanged files of section 0 (spec-builder.md once U4 has landed); `allowed_paths` are the four in-scope directories.

## 11. Decisions already made (do not reopen)

- Node ESM, zero dependencies, no package.json, no TypeScript; hooks in Node so one harness tests scripts and hooks.
- Single `fc` entry with per-command modules, invoked by path; no install.
- Active launch by status with `FLIGHTCREW_LAUNCH` override (`none` disables); root resolution per section 4.
- Canonical spec home `launch/specs/<name>/`; launches hold pinned copies; `interview/` never copied.
- The existing spec-stage agents, spec schema and template, rubric and bench, and existing manuals are kept byte-unchanged except the spec-builder lines in 7.1; their historical `dev/` paths are recorded as such in `manuals/README.md`.
- `plan.json` is the source of truth; `plan.md` and `kickoff.md` are rendered, never hand-edited.
- Worktree isolation on the implementer only; the fragment sets `worktree.baseRef` to `head`; workers merge through `fc worker merge`.
- Hooks run in place; only crew and workflow files are distributed.
- `WorktreeCreate` is not hooked; `WorktreeRemove` is.
- Stop gate placement: `verify` (T1) and `contracts` (W0 checks + boundary); never `implement`. Cap `min(stop_blocks, 8)`.
- Escalation is a command that releases the stop gate; a fired trigger is enforced by the guards and by `fc`.
- The orchestrator holds no Write or Edit; it writes through `fc plan write`, `fc launch note`, `fc return`.
- No scribe role; report assembly is a command and a hook.
- Reports never carry a verdict; `fc launch end` is the single ending and records the human's outcome.
- `allow_draft` is recorded and printed when a human runs against a draft spec or map.
- Statistical and judged checks are representable; no judge runner in v1. No verdict-sheet JSON schema for the spec judge.
- `$schema`/`$id` strings in the spec schema, template and specs stay as they are and are never resolved; the repository `.gitignore` is not edited by this build; the harness manual tells the human to add `.claude/worktrees/`.

## 12. Workflow scripts contract

Scripts only dispatch agents and return payloads. `export const meta` first, pure literal, name equal to the filename. Each `agent()` passes its return schema inlined as a literal identical to the matching `schemas/*.json` (a suite checks equality). Timestamps arrive via `args`; no `Date.now`, `new Date`, `Math.random`; no file or shell access. `fc-implement.js`: per wave, run `pilot: true` units first and continue only if their returns are green; dispatch remaining units in chunks of `args.implementers_concurrent`; validate each return; an absent or invalid return is `status: halt, halt.kind: budget`; on any halt stop dispatching and return the halt. `fc-review.js`: critic pass → route correctness-gap and scope-violation findings to the implementer owning the unit whose `paths` contain the file (with the finding, the spec, that unit's checks) → re-verify → fresh critic pass; a spec-conflict finding stops with an escalation payload and no fix; observations are never dispatched; at `critic_passes` with blocking findings open, return a trigger payload. `fc-explore.js`: fan explorers over `args.questions`, return cited answers. After a workflow completes, the orchestrator persists every payload with `fc return`.

## 13. Readings settled at the targets gate

These readings bind the implementation where the spec's letter left two possibilities. Each is a candidate amendment for spec v2.

- `fc boundary` and `fc locked` exclude a launch's own pinned copies, `flightdeck/launch/<L>/specs/**`, from the changed set, in addition to `.claude/worktrees/**` and `flightdeck/testbench/runs/**`. The pin's copies are written one commit after `lock_commit`, and the acceptance text requires `fc locked` to report no change after exactly that pin-then-commit. The launch folder's other files (launch.json, notes.md, evidence) stay in the changed set and are inside the boundary. The guards still deny edits to the pinned copies after phase targets.
- `fc doctor` exits 2 on any failed check, including two active launches; exit 1 for two active launches applies only to commands that must resolve a single launch before acting.
- Validators are runnable as programs, not only through `fc validate`: `node flightdeck/flightcrew/checks/validators/<name>.mjs <path> [flags]`. `validate-tests-map`, `validate-plan` and `validate-launch` locate the pinned spec and map from the file's own folder, then from the launch resolved through `FLIGHTCREW_LAUNCH`, `CLAUDE_PROJECT_DIR`, `FLIGHTCREW_ROOT` and cwd; `--spec <path>` overrides.
- Warning lines are `warn:  <message>` and may end with ` — [<rule>]` where the rule is `warn-impression`, `warn-length` or another named warning; the message itself names the rule's stem.
- `testbench/run-all.mjs` sets `TMPDIR` (and `TMP`, `TEMP`) for every child suite to a private directory under the real temp directory; a leftover entry there is a leak; the directory is removed after the run so the real temp directory's entry set is unchanged.
- T23 (`suites/run-all`) is a world-state check whose baseline passes before implementation, because the runner is a targets-stage deliverable; every other check fails at baseline for absence of its target.
- B51 is covered by T9 (`suites/bin-boundary`), as the spec's verification text states in its closing sentence.
