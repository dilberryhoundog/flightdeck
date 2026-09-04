# Planning a run

Between the frozen spec and the first dispatched implementer: whether the task earns a run at all, what planning consumes, the seven phases, the decomposition rules, the plan document `fc plan write` accepts, the budgets, and the checklist the human runs at gate 1. The plan is the cheapest place a run can fail. `fc` is `flightdeck/flightcrew/bin/fc`, invoked by path from the repository root; every `fc` command in this manual is that binary. `returns/`, `evidence/` and `review/` are relative to `flightdeck/launch/<L>/`; every other path is written from the repository root.

## Whether to run

| stay single-session when                                          | orchestrate when                                                                                                | not yet when                                                                                       |
|-------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------|
| the cut yields fewer than three units, or they all touch one area | the cut yields three or more units that run in parallel against fixed contracts, each with its own pass or fail | a pillar is missing: no frozen spec, no executable checks (no pinned tests map), or no review path |

- Multi-agent runs cost roughly an order of magnitude more tokens than a single session.
- A task that decomposes well but has no checks is not ready to orchestrate; it is ready to have its checks written: its checks written and the tests map pinned.

## Inputs

- The launch under plan is the active one: `fc launch status` prints its name and `FLIGHTCREW_LAUNCH=<name>` overrides it. That name is the `launch` field of `plan.json` and the `<L>` of every path below.
- The pinned tests map (`flightdeck/launch/<L>/specs/<S>/tests-map.vN.json`) supplies the `T` ids a unit may claim and the spec nodes each one `covers`.
- The kickoff header block of `flightdeck/launch/<L>/kickoff.md` (mirrored in `launch.json`) supplies the kickoff version, of the form `base@N+shape-<s>@N+task-<t>@N`.
- The frozen spec (pinned at `flightdeck/launch/<L>/specs/<S>/spec.vN.json`) supplies what must be true, the scope fence, the decided interfaces and the verification commands; the plan never re-litigates it.
- A planning session that finds a spec gap stops and runs `fc launch escalate spec-gap --detail "..."`; a plan built on an open question delegates it to whichever agent hits it first.
- Explorer returns supply what the codebase looks like: one question per `explorer`, summaries not files, stored with `fc return explorer <file> --id X<n>` at `returns/explore-X<n>.json`.
- The run log supplies the known failure modes: `fc runlog show --spec <S>` before planning; every logged failure for this spec's area becomes a risk line with `source: runlog`.
- The roster (`flightdeck/flightcrew/crew/README.md`) and the ceilings in `launch.json` supply the constraints: which roles exist, what each may touch, what the run may cost.
- Prior reports for the same spec are listed in the kickoff header; read their ledgers and failures sections.
- Plan in a context that will not implement: the `planner` holds no Write or Edit. The planner returns the plan JSON as its return content; the orchestrator passes it to `fc plan write --stdin`, which validates it, stores `flightdeck/launch/<L>/plan.json` and renders `plan.md`.

## The seven phases

1. Explore. Dispatch explorers on the open questions. Anything that surprises here would have surprised an implementer mid-run, at fan-out prices.
2. Decompose. Cut the work into units, each with its own pass or fail; name them, because the names thread through the plan, the branches (`<L>/<unit.name>`), the checks and the evidence.
3. Fix the contracts. Write down every seam between units (signatures, schemas, file formats) beyond what the spec already fixed; each seam gets a contract check and belongs to the `contracts` unit in wave 0.
4. Order the waves. Group units by dependency: serial where they share something, parallel where they share nothing; high-risk units early and serial.
5. Budget. Cap implementers, turns per agent and gate iterations inside the `launch.json` ceilings; tier models by stage; write the expected cost down so the run log can compare it to the actual.
6. Set gates and abandon triggers. What each gate shows, and the pre-mortem: which observable events mean stop.
7. Pilot. Mark one or two representative units `pilot: true` in the first parallel wave; they run first and the rest of the wave starts only on their green returns. The run reached the plan phase only because the baseline agreed with the map: `fc launch phase plan` refuses a baseline that disagrees.

## Decomposition rules

- Cut vertically: a unit crosses every layer it needs and delivers one testable behaviour end to end; a horizontal unit ("all the models") cannot pass a check alone, so its defects hide until integration.
- Size by verifiability: a unit is too big when its pass or fail would need interpretation and too small when dispatch overhead outweighs its work; between those bounds, prefer smaller, because abandoning a small unit is a discarded branch.
- The practical test: the unit's done-ness is one or a few check ids, and a competent implementer finishes it inside `budget_turns`.
- Anything two units share belongs in wave 0 as a contract; residual coupling means serial order or a promoted seam, never "coordinate as needed".
- Serialise the high-risk and the irreversible; parallelise the safe and the independent.
- More than four waves means the decomposition is wrong, or the task wanted a single session.
- One unit, one owner, one branch, one worktree; two agents on one unit is horizontal collaboration wearing a plan's clothing.
- Unit kinds: `contracts` (wave 0, serial, exactly one unless `no_contracts`), `feature` (the vertical slices), `integration` and `proof` (last, serial; the proof unit lands the acceptance check `T1`).
- Keep two units off the same file where wave order allows; a shared file is a shared seam.
- `depends_on` names only units in earlier waves; a unit that depends on a sibling belongs in the next wave.

## The plan document

`plan.json` is the source of truth (schema `flightdeck/flightcrew/schemas/plan.schema.json`, template `flightdeck/flightcrew/templates/plan.template.json`); `plan.md` is rendered from it and never hand-edited. `fc plan write <json-path|--stdin>` validates, stores `flightdeck/launch/<L>/plan.json` and renders `plan.md`; `fc plan render` re-renders after a human edits `plan.json`, which is permitted before G1 approval only — after approval the plan is frozen for the run; rendering the same plan twice gives byte-identical output, and an invalid plan writes nothing and exits 2.

| field                                                                                         | content                                                                                                                                                                                                                                                                                                                       |
|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `schema_version`                                                                              | integer; the version of `flightdeck/flightcrew/schemas/plan.schema.json` this plan is written against. `flightdeck/flightcrew/templates/plan.template.json` is the authoritative field list; the rows below explain only the fields needing judgement                                                                         |
| `launch`, `spec {name, version, commit}`, `kickoff_version`                                   | identity; the kickoff version is copied from the kickoff header                                                                                                                                                                                                                                                               |
| `shape`                                                                                       | `session`, `workflow` or `sessions`; must equal the `shape-<x>` part in the kickoff version                                                                                                                                                                                                                                   |
| `expected_cost {agents, minutes, tokens?}`                                                    | the line the run log compares with the actual                                                                                                                                                                                                                                                                                 |
| `models {explore, unit, critic}`                                                              | model tiering by stage; each value is a model id the harness accepts. Defaults: `explore: haiku`, `unit: opus`, `critic: fable`                                                                                                                                                                                               |
| `approach`                                                                                    | three sentences: what the run does, in what shape, and the one judgement call being made                                                                                                                                                                                                                                      |
| `waves [{id, mode, units}]`                                                                   | `W0` serial contracts first; `mode` is `serial` or `parallel`                                                                                                                                                                                                                                                                 |
| `units [{id, name, kind, spec_refs, checks, owner, budget_turns, paths, depends_on, pilot?}]` | one row per unit. `id` is `U<n>`; `name` is the branch suffix only; `owner` is a crew role name, `implementer` by default; `checks` are `T` ids from the pinned map; `paths` are the globs the unit may touch, each inside `paths.allowed` from `launch.json`; `depends_on` and `waves[].units` carry unit `id`s, never names |
| `risks [{text, reaction, source}]`                                                            | `reaction` is `mitigate`, `watch` or `abandon`; a `source: runlog` risk reproduces exactly a heading of `flightdeck/launch/RUNLOG.md`, of the form `## <ended date> · <spec name> · <launch name>`                                                                                                                            |
| `gates {G1, G2, G3}`                                                                          | what each gate presents: G1 the plan for approval, G2 the wave-0 contracts and their check results, G3 the report and the ending decision                                                                                                                                                                                     |
| `abandon_triggers [{trigger, observable_by}]`                                                 | non-empty; each observable by a hook, `fc budget` or the evidence page `flightdeck/launch/<L>/evidence.html`                                                                                                                                                                                                                  |
| `no_contracts {reason}`                                                                       | only when the spec fixes every seam already; the stop gate (the Stop hook that runs the pinned checks and blocks the turn) then runs `T1` in phase contracts                                                                                                                                                                  |

`plan.md` headings, in order: `# Plan: <spec> · <launch>`, `## Approach`, `## Waves and units` (one table row per unit), `## Risks`, `## Gates`, `## Abandon triggers`.

Rules `fc validate plan` enforces (`plan-rule-N` in its output):

- every `checks` id exists in the pinned tests map, and every unit has at least one check;
- every `spec_refs` id is a live node of the pinned spec;
- `depends_on` names units in earlier waves;
- exactly one `kind: contracts` unit sits in serial `W0`, unless `no_contracts` gives a reason;
- at least one `pilot: true` unit in the first parallel wave;
- `abandon_triggers` is non-empty;
- no parallel wave holds more units than `ceilings.implementers_concurrent`;
- every `budget_turns` is at most `ceilings.turns_per_agent`, which is at most the `maxTurns` in the frontmatter of `flightdeck/flightcrew/crew/implementer.md`;
- `expected_cost.agents` is at most `ceilings.agents`; tokens are compared only when both sides are present;
- `shape` equals the shape part of the kickoff version;
- a `source: runlog` risk that names no existing RUNLOG heading is a warning.

- Unit names are the branch names (`<L>/<unit.name>`), the evidence sections and the ledger rows; keep them stable.
- Two variant plans are acceptable when the approach is genuinely contested: the planner returns both as candidate JSON files, the human reads them side by side at G1, and only the chosen one is passed to `fc plan write`.
- The plan is disposable: regenerated for every run and abandoned with it; the lesson moves to the run log, never into a mid-flight edit.

## Budgets

- Cap the fan-out: `implementers_concurrent` is enforced by the dispatch chunking in the kickoff, by `flightdeck/flightcrew/workflows/fc-implement.js` and by `fc validate plan`; the plan may tighten a ceiling and may not loosen it.
- Budget per agent, per gate, per run: `budget_turns` per unit, `gate_iterations` and `stop_blocks` (cap `min(stop_blocks, 8)`) on the stop gate — the Stop hook that runs the pinned checks and blocks the turn — `minutes` and `tokens` on the run.
- Tier models by stage: `models.explore` for explorers (`haiku`), `models.unit` for implementers (`opus`), `models.critic` for the critic (`fable`). The plan carries no orchestrator model; that is set in the crew definition.
- Record the expected cost; `fc budget` and the report header carry the actual beside it.
- Make "stop" observable: every abandon trigger is something `fc budget` (a ceiling), the stop gate (a stall), a guard — the pre-tool hooks that deny edits outside `paths.allowed` and to locked paths — (an edit outside the boundary) or the evidence page `flightdeck/launch/<L>/evidence.html` can see; a trigger nobody can observe is a wish.
- Exceeding a ceiling is an escalation (`fc launch escalate budget`).

## Anti-patterns

- The plan that is a spec: behaviours re-argued in the plan, so the verifier follows one document and the critic another.
- The horizontal cut: units by layer, nothing provable until everything integrates.
- Big-bang fan-out: twelve implementers with no pilot, finding the same friction twelve times at once.
- The unbudgeted plan: no caps, no triggers, so failure has no price and cannot be cheap.
- Planning inside the doer: a plan produced by a context already implementing.
- The transcript plan: ten pages of reasoning where one page of decisions belongs; the gate becomes a rubber stamp.
- Dependency by conversation: units that "coordinate as needed" instead of through a wave-0 contract.
- The plan that survives its run: a failed run patched by editing the plan mid-flight.

## At gate 1

The orchestrator renders and presents the lines below and runs the two commands named in them (`fc validate plan`, then the gate command once the human has decided); the human decides.

- Nothing in the plan contradicts or re-decides the spec; spec gaps went back as escalations, not forward as improvisation.
- Every unit names its checks and its budget, and unit names match what branches, checks and evidence will use.
- Every seam between units is a wave-0 contract with a check.
- High-risk work runs early and serial; parallel units share nothing.
- Fan-out is capped, models are tiered, expected cost is written down.
- Abandon triggers are observable, and every run-log failure for this area has a risk line.
- A pilot unit is marked, and the baseline shows the checks failing in the expected way.
- `plan.md` is at most 120 lines; `fc validate plan` exits 0.
- Record the decision: `fc launch gate G1 approve` (phase moves to contracts) or `fc launch gate G1 exit` then `fc launch end abandoned --at G1`; the orchestrator then commits `flightdeck/launch/<L>/plan.json` and `plan.md` only.
