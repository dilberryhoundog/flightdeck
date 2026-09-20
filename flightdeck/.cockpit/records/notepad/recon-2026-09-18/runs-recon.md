# runs-recon report — M001

Crew report, C012 (general-purpose, Opus), received 2026-09-18 via the session scratchpad after the idle notice truncated it. Pilot's verification the same day by git plumbing: run/flightcrew-characterization-2 is at 4fd81d8; flightcrew-characterization is at 68681c0 with parent 56ca431; case-map.json and the hooks-decisions suite exist on the run-2 branch and not on flightcrew-characterization; the run-2 launch folder holds only launch.json, evidence/defects.md, runs/run-2/{kickoff.md, plan.json, report.md} and specs/; the report says "58 of 61 checks exit 0 on 4046d1e"; the newest RUNLOG entry is the abandoned run 1 of 2026-09-16; the eleven crew role files match; the three-launch roadmap is in dev/workspace/plans/flightcrew-features.md on that branch. All checked claims hold. Consequence for the team: doctrine-recon read "the tip" from flightcrew-characterization, which is the run-2 base, so its drift table is one run behind; a re-diff against the run-2 branch was requested. Section 7 sent to docs-verifier. runs-recon reports its two explorers failed to hand back to it (they handed back to the lead; see notepad/claude-code/messaging-observed.md) and did both passes itself.


Headline correction before anything else: the tip of the finished test suite is **`run/flightcrew-characterization-2` at `4fd81d8`**, not `flightcrew-characterization`. The branch `flightcrew-characterization` sits at `68681c0` (2026-09-17), which is only a dev-workspace commit on top of `56ca431`, the run-2 *base*. None of run 2's suite work is on it: `flightcrew-characterization:flightdeck/testbench/` has no `case-map.json`, no `suites/hooks-decisions/`, no `suites/templates-slots/`, no `suites/sub-commands/`. The suite is finished, unmerged, and lives on one branch only.

## 1. Anatomy of a launch

The contract is `run/flightcrew-characterization-2:flightdeck/launch/README.md`. Three kinds of entry live under `flightdeck/launch/`: `specs/<S>/` is the cross-run home of one spec; `<L>/` is one run of one spec, created by `fc launch new` and named `<spec.name>-<n>`; and `README.md` plus `RUNLOG.md` beside them. Active-launch resolution scans only subdirectories holding a `launch.json`, and exactly one launch may be active.

A complete launch folder as it actually ran is `run/flightcrew-characterization-2:flightdeck/launch/flightcrew-buildout-2/`. In production order:

1. `launch.json` — created by `fc launch new <spec-path>`. State record. Schema at `flightdeck/flightcrew/schemas/launch.schema.json`, template at `flightdeck/flightcrew/templates/launch.template.json`.
2. `specs/<S>/spec.v1.json` and `tests-map.v1.json` — pinned copies written by `fc launch pin`. Pinning sets `lock_commit`, and `fc launch pin tests-map` replaces `paths.allowed` with the map's `allowed_paths`.
3. `kickoff.md` — rendered by `fc launch kickoff` from parts under `flightdeck/flightcrew/templates/kickoff/` (`base.md` plus a shape file plus a task file). `launch.json.kickoff.version` records the `'+'`-joined `part@version` list, e.g. `base@3+shape-workflow@2+task-feature@2`.
4. `plan.json` and `plan.md` — `fc plan write` stores, `fc plan render` renders.
5. `returns/` — `fc return worker|critic|verifier|explorer` stores agent returns. Also holds `<unit>.prompt.md`, the sealed dispatch written by `fc worker render <unit>`.
6. `events.jsonl` and `hooks.log` — appended by the hooks and by `fc events append`.
7. `evidence/` (per-check `T<n>.json`, plus `boundary.json`, `locked.json`, `budget.json`, `summary.json`) written by `fc check` / `fc verify`; `evidence.html` rendered by `fc evidence`.
8. `review/pass-<n>.json` and `review/resolutions.json` — critic passes, stored by `fc return critic`; resolutions by `fc return critic --resolve`.
9. `notes.md` — `fc launch note`.
10. `report.md` — `fc report`, final at `fc launch end`.
11. A `RUNLOG.md` entry, inserted by `fc launch end` through `fc runlog stub`.

**The run-2 launch folder is deliberately not that shape.** `run/flightcrew-characterization-2:flightdeck/launch/flightcrew-characterization/` holds only `launch.json`, `evidence/defects.md`, `runs/run-2/{kickoff.md, plan.json, report.md}` and the `specs/` interview material. No `events.jsonl`, no `hooks.log`, no `evidence/T*.json`, no `returns/`, no `plan.md`. Its `launch.json` has no `status` field, `"current_run": null` and `"runs": []`. It is a stub, not an active launch. Run 2 was conducted with no runner and no hooks, so none of the artefacts a launch normally produces exist.

## 2. Anatomy of a run

**The fc CLI.** `flightdeck/flightcrew/bin/fc` is a `/bin/sh` shim that execs `node bin/fc.mjs`; nothing installs it. `fc.mjs` parses two global flags (`--launch`, `--json`), resolves the launch root through `checks/lib/launch-lib.mjs`, and dispatches to `bin/cmd/<command>.mjs`. Exit codes are fixed: 0 success, 1 usage or environment error, 2 failed check or blocking decision. Nineteen commands, 35 subcommands as the usage block in `bin/fc.mjs` lists them, which matches the report's count:

- `launch new|activate|status|phase|gate|end|pin|kickoff|escalate|note|land` (11)
- `check`, `verify`, `boundary`, `locked`, `budget`, `evidence`, `report`, `validate`, `distribute`, `doctor`, `return` (11 single)
- `events append|usage|summary` (3), `runlog stub|show` (2), `plan write|render` (2), `worker render|merge|return` (3), `lint spec` (1), `critic render` (1), `verifier render` (1)

`validate`, `lint`, `distribute` and `doctor` are the only commands that act without resolving a launch.

**Phases and gates.** `launch.schema.json` fixes the phase enum in order: `targets, plan, contracts, implement, verify, review, report, ended`. `fc launch phase` accepts only the immediately next one. Status enum: `draft, active, accepted, accepted-with-reservations, abandoned, partial`. Three gates, each `{status: pending|approved|exited, at, note}`. From `bin/cmd/launch.mjs:628-630`: G1 approve moves `plan` to `contracts`, G2 approve moves `contracts` to `implement`, G3 has no phase move and is the ending gate. `ceilings` carries `agents, implementers_concurrent, turns_per_agent, gate_iterations, stop_blocks, critic_passes, minutes, tokens, expected_tokens`. `stop_blocks` is capped at 8 because Claude Code ends the turn after eight consecutive Stop-hook blocks.

**Hooks.** Six scripts under `flightdeck/flightcrew/hooks/`, wired by `hooks/settings.fragment.json`, merged into `.claude/settings.json` by hand or by `fc distribute --apply --target <dir>`. They run in place; nothing is copied. Bindings:

- `event-log.mjs` on SessionStart, SessionEnd, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, Stop, WorktreeRemove. Appends to `events.jsonl`. Always exit 0.
- `lock-guard.mjs` on PreToolUse matcher `Edit|Write|NotebookEdit`. Denies a target in `paths.locked` in every phase but `targets`. Prints a `deny` decision on stdout, exits 0.
- `boundary-guard.mjs` on the same event and matcher. Denies a target outside `paths.allowed` in phases `contracts, implement, verify, review`. Exits 0.
- `structural-check.mjs` on PostToolUse matcher `Edit|Write`. Runs the `structural` map's command for the file extension through `/bin/sh -c`. Exit 2 on failure, holding the turn.
- `stop-gate.mjs` on Stop, `timeout: 600`. In phase `verify` runs the acceptance gate, in phase `contracts` the contracts gate. Red means exit 2 and a `stop_block` event. At `min(ceilings.stop_blocks, 8)` consecutive blocks it appends `stall` and `trigger` and hands the decision to a human.
- `session-end.mjs` on SessionEnd. Best-effort `fc evidence` and `fc report`.

The no-op rule is the load-bearing safety property: a hook is silent whenever it cannot be sure it speaks for a run. `WorktreeCreate` is never hooked, because a command hook there replaces worktree creation rather than observing it.

**A check versus a gate.** A check is one row of the tests map, `flightdeck/flightcrew/schemas/tests-map.schema.json`, required fields `id, status, kind, covers, command, baseline`. `kind` is one of `structural, behavioural, artefact, invariant, project-rule, statistical, judged`; `class` is `deterministic, property, statistical, judged`. `command` is run as `/bin/sh -c` from the launch root. `gate_only: true` means it runs under `fc check all` and the stop gate only. `T1` is always the acceptance check. A gate is a phase barrier: three scripts under `flightdeck/flightcrew/checks/gates/`, each exporting `run(context)` returning `{ran, reason?, checks: [{id, verdict, blocking, code, output}], extra}`. `acceptance-gate.mjs` gates verify, `contracts-gate.mjs` gates contracts and also reports the boundary as a non-check blocker, `structural-gate.mjs` runs the per-file structural command. A gate never decides what to do about a red check. It reports, and the caller decides.

**The run report** comes from `fc report` (`bin/cmd/report.mjs`), rendering eight fixed sections from `evidence/summary.json`, `review/pass-*.json`, `plan.json`, `events.jsonl` and `notes.md`, to the shape in `templates/report.template.md`. A section whose input is absent prints its placeholder rather than disappearing, and the report never states an acceptance verdict.

**Workflows.** Three dynamic workflow scripts at `flightdeck/flightcrew/workflows/`, copied to `.claude/workflows/` by `fc distribute --apply`. A launch whose kickoff shape is `shape-workflow` hands a wave to one; `shape-workflow` is chosen when a wave holds more units than `implementers_concurrent`. Each opens with a literal `export const meta`.

- `fc-implement.js`, phases Pilots then Units. Dispatches implementers wave by wave, pilots first, the rest in chunks of `implementers_concurrent`. Returns `{workflow, launch, timestamp, dispatched, returns, halt, stopped_on}`.
- `fc-review.js`, phases Review, Fix, Re-verify. Fresh critic per pass, routes findings by kind, stops on a spec conflict. Returns `{workflow, launch, timestamp, passes, fixes, verifications, unrouted, observations, escalation, trigger}`.
- `fc-explore.js`, phase Explore. One read-only explorer per question. Returns `{workflow, timestamp, asked, answers, rejected}`.

A script only dispatches agents and returns payloads. It reads no file, runs no command, and `Date.now()`, `new Date()` and `Math.random()` are unavailable, so a timestamp arrives through `args`. Nothing a script returns is stored until the orchestrator stores it with `fc return`.

## 3. Run 2 result

Source `run/flightcrew-characterization-2:flightdeck/launch/flightcrew-characterization/runs/run-2/report.md`. Base `56ca431`, landing commit `4046d1e`. Built with custom workflows, implementer per unit in a worktree, verifier rerun per unit, up to two repair rounds. No flightcrew runner, no hooks, no launch. Every agent ran on opus.

58 of 61 checks exit 0 on `4046d1e`, rerun from a cleared cache. `node flightdeck/testbench/run-all.mjs` exits 0 with 33 suites ok and hygiene ok. The critic pass verdict was pass with no blocking finding. Six units: U0 contracts, U1 subcommands, U2 hooks and templates, U3 roles/workflows/distributed, U4 schemas/validators/gates, U5 proof. Only U2 was refuted, twice.

The three red checks, verbatim:

- **T44 sweep-templates-1**, check concern 1. `flightdeck/flightcrew/templates/constitution-fragment.md` has no `{{slot}}`, JSON key or version comment, so the alteration appends ` renamed` to its first heading and nothing reads that heading. Only a snapshot of the heading text could turn a case red, which the README forbids. `suites/_checks/fixtures/sweep-exempt.json` is locked and empty. Deciding between an exemption and a different alteration is the human's call. The attempt to fix it (`014e2ec`) was reverted at `3043f6c`.
- **T32 spec-copies**, check concern 2. Red at the run's base before any unit ran. The three `spec.v1.json` copies differ from the frozen spec at `eca2bba`, from the run-2 setup commits `cfc9b21` and `56ca431`. `check-lib.mjs` hard-codes `SPEC_COMMIT` `ee8c088` and `FREEZE_COMMIT` `eca2bba`.
- **T37 scope-untouched**, check concern 3. Red at the run's base before any unit ran. Since `ee8c088` the setup commits changed the four crew files `critic, explorer, implementer, verifier`, `templates/worker-dispatch.template.md`, the matching `.claude/agents/flightcrew/` copies and `.claude/settings.json`.

Both T32 and T37 are red because of the run's own setup, not because of anything a unit did.

The six pinned defects, verbatim from `flightdeck/launch/flightcrew-characterization/evidence/defects.md`:

1. `crew · max-turns-on-every-role-except-the-four-named [defect]` — every role except orchestrator, spec-builder, spec-judge and spec-attacker carries an integer maxTurns, but explorer, verifier and critic carry none. Ref `flightdeck/manuals/orchestration/crew.md:40`.
2. `crew · new-roles-match-the-roster [defect]` — explorer, implementer, verifier and critic carry the roster turns 12, 25, 15 and 20, but explorer, verifier and critic carry no maxTurns and implementer carries 200. Ref `flightdeck/flightcrew/crew/README.md:16`.
3. `crew · every crew body carries the inputs line [defect]` — spec-judge and spec-attacker carry none. Ref `flightdeck/manuals/orchestration/crew.md:11`.
4. `crew · every crew body is at most 60 lines [defect]` — the spec-builder body is longer. Ref `flightdeck/manuals/orchestration/crew.md:51`.
5. `e2e · fc launch gate G3 approve records a gate decision on a launch that has ended [defect]` — an ended launch should refuse a gate decision; today it exits 0 and records it. Ref `flightdeck/manuals/launch/launch-anatomy.md:73`.
6. `validate-tests-map · flightdeck/flightcrew/checks/validators/validate-tests-map.mjs judges coverage against the --spec file although the pinned spec sits beside the map [defect]` — the header says the spec beside the map is read first and `--spec` is the fallback; today `--spec` wins. Ref `flightdeck/flightcrew/checks/validators/validate-tests-map.mjs:8`.

Four non-blocking critic observations are left open: F1 on defect text form, F2 that run-all charges only new `git status --porcelain` lines so a write to an already-modified file is unseen, F3 that the session-end case accepts either the files or a `hooks.log` line explaining their absence, F4 that the worker-dispatch case claims a manual source it does not have.

## 4. What the tip believes the system is

Read from `run/flightcrew-characterization-2`, the real tip. Eleven roles under `flightdeck/flightcrew/crew/`, split into two chains by `crew/README.md`. The spec chain is `spec-builder, spec-judge, spec-attacker`, all fable. The run chain is `test-builder` (opus, 40 turns), `planner` (fable, 30), `orchestrator` (inherit, conducts and holds no Write or Edit), `implementer` (opus, 25, worktree isolation, acceptEdits), `verifier` (sonnet, 15), `critic` (fable, 20). `explorer` (haiku, 12) serves both chains. Ten schemas: `launch, plan, spec, tests-map, check-result, event, critic-findings, explorer-return, verifier-verdict, worker-return`. Three workflow scripts, six hooks, seven validators, one linter, three gates, and 33 suites plus the locked `_checks/` directory.

Against `main:flightdeck/flightcrew/` this is a different system. `main` has no `bin/`, no `hooks/`, no `workflows/`, no `launch/` and no `testbench/`. Its crew names roles that no longer exist: `isolated-worker.md`, `reviewer.md`, `spec-interviewer.md`, `worker.md`, plus a `crew.json`. It has three schemas where the tip has ten, and its templates are `liftoff.template.yaml`, `worker.template.md` and three `spec/*.spec.template.md` files, all gone at the tip. The diff is 115 files, 12,816 insertions against 3,296 deletions. `main` is the pre-buildout state. Treat nothing in `main:flightdeck/flightcrew/` as current.

## 5. What the worktree-wf_* commits reveal

The naming tells you the build method. `worktree-wf_<id>-<n>` is a Claude Code subagent worktree branch, one per implementer dispatch, and the shared `wf_` id groups a wave. Wave 1 was `wf_2fdadce5-244`, four concurrent unit branches `-1` through `-4`. `wf_835932ae-12f-1` was the U5 proof unit. `wf_9641b63f-a15-1` carries nothing beyond the base, so it is an abandoned or empty dispatch.

Every wave-1 branch forks from the same two U0 contracts commits, `3b6ef54` "Set the suite contracts: covers convention, defect helper, per-suite hygiene, case map" and `b148c10` "Rewrite the testbench README as the contract for the characterization suite". That is the method: contracts first, alone, then fan out. Each wave-1 branch then adds exactly one commit, and the titles are all of the same form, "name every X":

- `-1` `96610c7` "Name every runner subcommand by a case: e2e naming steps and a sub-commands suite"
- `-2` `ec7147a` "Add hooks-decisions and templates-slots suites naming every hook and template", then the repair pair `35c5fef` and `014e2ec`, then the revert `3043f6c`
- `-4` `142a746` "Name every schema, validator and gate from a case that runs it"
- `flightcrew-characterization-2/roles-workflows-distributed` `fc50711` "Name every role file, workflow script and distributed copy in the crew and workflows suites; pin the crew defects"
- `-3` holds nothing beyond `b148c10`, so U0's own worktree produced no further commit

Only U2's branch shows a repair cycle, which matches the report's "refuted twice". The orchestrator merged each branch by name (`5287889`, `7e74ace`, `26386fc`, `845e6f5`), then the proof unit `bd636d3`, then wrote the report at `4fd81d8`. Note also `flightcrew-characterization-1/contracts` at `95a8cae`, the salvaged partial from the abandoned run 1, held for the human and never merged.

## 6. Unfinished intent

- **The suite is not merged.** `run/flightcrew-characterization-2` is ahead of `flightcrew-characterization` by the entire run, and the report calls for a pull request the human merges. That PR does not exist in the branch state.
- **No scenario set exists.** `flightdeck/testbench/README.md` final section: statistical and judged checks would read `fixtures/scenarios/<set>/`, no set exists, and six checks (T16 to T21) pass empty under spec D3.
- **No judge runner is built.** `flightdeck/launch/specs/flightcrew-v1/spec.v1.json:661`: "Statistical and judged checks are representable in the tests map but no judge runner is built; their commands must emit the ratio or verdict-sheet path themselves. Deferred to a later version."
- **The run-2 RUNLOG entry is missing.** The newest entry in `flightdeck/launch/RUNLOG.md` is the abandoned run 1. No `fc launch end` ran, so no entry was stubbed.
- **The reviewer's acts are outstanding.** Report, Not done: "The reviewer's three acts on a fresh checkout and the transcript reading are the human's."
- **`case-map.json` is empty** (`{}`) by design, but by contract must be revisited whenever an earlier case is absorbed under a new name.
- **`sweep-exempt.json` is locked and empty**, which is exactly what makes T44 unresolvable inside the run.
- **Ten tooling faults from run 1 are promoted, not fixed.** `RUNLOG.md:10` lists them. The most severe is (1) "the orchestrator has no tool that invokes a workflow, so the workflow shape is unusable". Also (2) `fc worker render` refuses a contracts unit in phase contracts; (4) only frontmatter `maxTurns` limits an agent and it can stop a unit with no return; (5) a stopped agent cannot be resumed; (7) `fc budget` counts human waits as run minutes; (10) `fc return` has no `--stdin` while the orchestrator holds no Write.
- **Spec conflicts carried to the next version.** `RUNLOG.md:23`: B39 versus the workflow runtime, B27 worker render, the I14 deny rule that would block the test-builder, the stall message on exit 0 that Claude Code does not display, and C3 one-line output versus validator lines.
- **Six unresolved observations F6 to F11** in the `flightcrew-buildout-2` entry, each a named defect with a file and line.
- **`specs/flightcrew-v1/design.md:307`**: "These readings bind the implementation where the spec's letter left two possibilities. Each is a candidate amendment for spec v2."
- **The three-launch roadmap is unbuilt.** `dev/workspace/plans/flightcrew-features.md` names ten features F1 to F10 and splits them into `flightcrew-core` (F1, F2, F3, F6, F8), `flightcrew-conduct` (F4, F7, F9, F10) and `flightcrew-verdicts` (F5). It renames the runner from `fc` to `flight` and replaces `RUNLOG.md` with `FLIGHTLOG.md`. None of it exists on any branch I read.
- **`dev/workspace/plans/prd.md` and `architectural.md` are unfilled templates**, every section a bracketed prompt.
- **Empty scaffolds**: `flightdeck/launch/runs.keep`, `flightcrew/orchestration.keep`, `flightcrew/bin/runners.keep`, `flightcrew/checks/checks.keep`, `flightcrew/crew/agents.keep`, `testbench/tests.keep`, `testbench/benches/rubrics/spec/experiments/.keep`. The last is named in `specs/flightcrew-v1/design.md:21` as "the committed home for future rubric-bench chains".

## 7. Claims about the Claude Code harness I relied on

Each is a claim the system makes about the harness, not something I verified against Claude Code itself. A verifier should check these against current harness behaviour.

1. Twelve hook events are bound in `hooks/settings.fragment.json`: SessionStart, SessionEnd, SubagentStart, SubagentStop, TaskCreated, TaskCompleted, PostToolUseFailure, PermissionDenied, PreCompact, PostCompact, WorktreeRemove, PreToolUse, PostToolUse, Stop.
2. A PreToolUse hook blocks by printing a JSON decision (`permissionDecision` deny or ask, `decision` block, `continue` false) on stdout while exiting 0; a PostToolUse or Stop hook holds the turn by exiting 2. Source `hooks/README.md`.
3. Where two PreToolUse hooks answer on the same matcher, Claude Code takes the strictest. Source `hooks/README.md`.
4. Claude Code ends the turn after eight consecutive Stop-hook blocks. Source `schemas/launch.schema.json`, `ceilings.stop_blocks` maximum 8.
5. A `WorktreeCreate` command hook replaces worktree creation rather than observing it, must print the directory it created, and any non-zero exit aborts creation. Source `hooks/README.md`.
6. `$CLAUDE_PROJECT_DIR` resolves hook scripts from wherever a session starts, worktrees included. Source `hooks/settings.fragment.json`.
7. Claude Code gives hooks a minimal PATH that often excludes a version-manager shim, so `node` may not resolve. Source `hooks/README.md` Troubleshooting.
8. Hooks in `.claude/settings.json` need workspace trust before they run, and stay silent until it is granted. Source `hooks/README.md` Installing.
9. `worktree.baseRef` must be `head` or worker subagents branch from the remote default branch. Source `hooks/README.md`.
10. A workflow script is invoked as `/<name>` with its `args` object as structured data, and the runtime makes `Date.now()`, `new Date()` and `Math.random()` unavailable. Source `workflows/README.md`.
11. The workflow runtime rejects a script that ends with `export default`. Source `RUNLOG.md:23`, listed as spec conflict B39 and disputed against the spec.
12. A subagent worktree branches from HEAD, so an uncommitted launch-folder file is invisible to the worker. Source `workflows/README.md`.
13. A stopped agent cannot be resumed. Source `RUNLOG.md:10` fault 5.
14. Only the frontmatter `maxTurns` actually limits an agent, of three turn numbers that exist. Source `RUNLOG.md:10` fault 4.
15. A stall message on exit 0 is not displayed by Claude Code. Source `RUNLOG.md:23`.
16. The permissions allowlist names `Agent(<role>)` and `Workflow(<name>)` permission forms. Source `hooks/settings.fragment.json`.
17. A `sandbox.filesystem.deny` list applies to Bash and its children, where `permissions.deny` on file tools does not. Source `hooks/README.md`, "The hole the guards do not cover".

Scratchpad copy of the run-2 tree, if another crew member needs a path: `/private/tmp/claude-501/run2tree/`. I stayed read-only, checked out nothing, and wrote nothing into the repo. Two Explore subagents I dispatched for the CLI and the intent sweep failed to hand back, so I did both passes directly.

## Addendum after reading its explorers (runs-recon, 2026-09-18)

Pilot's verification: G3 appears in `bin/` only in the GATES array, the usage string and a plan display filter, confirmed by git grep; the two meta-workflows under `.claude/workflows/` hardcode `REPO = '/Users/dylangraham/Projects/flightdeck'`, confirmed; the report template has 13 `##` headings, so neither "eight" nor "seven" is the count of the template's headings and anyone quoting the report's shape should count from the template. Items 4 to 10 are the explorers' reads, unverified.

# runs-recon addendum — M001

The two reports corroborate my sections 1 to 6 with no contradictions on the run 2 result, the defects, the branch topology or the unfinished-intent list. What follows is only what they add or change. I re-verified items 1 and 3 against the source myself; the rest are the explorers' reads, marked as such.

## Correction

1. **The subcommand count of 35 is one convention among two, and I overstated the agreement.** I said my usage-block count "matches the report's 35". That is true only under the suite's own convention: `suites/_checks/lib/parts.mjs` derives the inventory by parsing the usage text with `subcommandsFromUsage`, and the usage writes `validate <kind> [path]` and `return <kind> <file>` as placeholders, so each counts as one part. Reading each command module's own `help` instead expands `validate` into seven (`spec, tests-map, plan, launch, kickoff, return, all`) and `return` into four (`worker, explorer, verifier, critic`), giving 36 named verbs. Neither number is wrong. The checks count parts, not verbs, so 35 is the number the suite enforces. Explorer a94cbb2 flagged that it could not reproduce 35 and reported 36; that disagreement is a naming convention, not a defect.

## Material addition

2. **G3 is recorded but not enforced, and this explains pinned defect 5.** I verified it: across `flightdeck/flightcrew/bin/`, `G3` appears only three times, in the `GATES` array (`cmd/launch.mjs:43`), in the usage string (`cmd/launch.mjs:31`), and in a display filter (`cmd/plan.mjs:69`). No phase move, no blocker function, and no reference in `launch end` or `launch land`. G1 and G2 each have a blocker check and a phase transition; G3 has neither. That is precisely why the e2e suite could pin "fc launch gate G3 approve records a gate decision on a launch that has ended" as a defect. The gate is a human sign-off record with no code behind it, so nothing refuses it. Worth treating as a mission seed rather than a curiosity, because the README describes three gates as though they were alike.

3. **Built-in defaults, verified at `cmd/launch.mjs:48-62`.** A launch created by `fc launch new` seeds `acceptance: 'T1'` and ceilings `agents 12, implementers_concurrent 4, turns_per_agent 25, gate_iterations 3, stop_blocks 8, critic_passes 2`, with the template's own values merged over them. The `structural` default map is also built in: `.mjs` runs `node --check`, `.js` runs `node --experimental-default-type=module --check`, `.json` parses through `JSON.parse`, `.sh` runs `sh -n`. Run 1 spending its 25-turn budget was the default, not a choice.

## Detail the explorers add to my section 2 (their reads, unverified by me)

4. `fc worker merge <unit>` does more than merge. It merges the unit branch, re-runs that unit's checks on the merged tree, commits, then removes the worktree and deletes the branch.
5. `fc launch end` requires fresh clean evidence before it will record an accepted outcome, and re-renders both `evidence.html` and `report.md` as it freezes.
6. `fc launch land --commit <sha> [--pr <url>]` records `launch.json.landed` only once `evidence/summary.json` at that commit is clean.
7. `fc budget` exits 2 and appends a `trigger` event when a ceiling is exceeded, so a budget breach is an abandon trigger rather than a warning.
8. `fc critic render` is valid only in phase `review`, and `fc verifier render` only in phase `verify`.
9. Return storage paths are fixed by kind: worker to `returns/<unit>.json`, explorer to `returns/explore-<id>.json`, verifier to `returns/verify-<n>.json`, critic to `review/pass-<n>.json`.
10. A check result (`schemas/check-result.schema.json`, written to `evidence/<T>.json`) carries `id, command, cwd, exit, verdict, stdout_tail, stderr_tail, duration_ms, ran_at, commit, covers, phase`, with `verdict` one of `pass, fail, error, skipped`. That is the fourth schema layer under a gate, which my section 2 did not name.

## Two things to check, not yet resolved

11. **Section count of the run report.** I wrote eight fixed sections, from the header comment of `cmd/report.mjs`. Explorer a94cbb2 enumerated seven headings: Ledger, Verification, Review, Phases, Agents, Failures and interventions, Orchestrator notes. Either the header counts a title block as a section or one of us miscounted. Low stakes, but someone quoting the report's shape should count them directly.
12. **The two meta-workflows are not portable.** `.claude/workflows/flightcrew-build.js` and `flightcrew-targets.js` hardcode `REPO='/Users/dylangraham/Projects/flightdeck'`. They build flightcrew itself and are not part of the run mechanism, so they sit outside the three workflow scripts I described. A hardcoded absolute path in a committed workflow is a portability defect nobody has pinned.

## One unfinished-intent item to add to my section 6

`flightdeck/launch/specs/flightcrew-v1/design.md:298` — "Statistical and judged checks are representable; no judge runner in v1. No verdict-sheet JSON schema for the spec judge." The missing verdict-sheet schema is a distinct gap from the missing judge runner, and my section 6 named only the runner.

Explorer aa5794d also confirms `RUNLOG.md` holds exactly three entries, all fully filled, with no literal `<fill>` present today. The placeholder mechanism is documented but currently unexercised.
