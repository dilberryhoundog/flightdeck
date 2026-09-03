# Workflows

The three dynamic workflow scripts under `flightdeck/flightcrew/workflows/` carry the fan-out of a wave, the review loop and the planning questions when a run takes the workflow shape. They only dispatch agents and return payloads; nothing they return exists until the orchestrator stores it with `fc return`. Read by the human when choosing a shape at stage 3 and by the orchestrator in a workflow-shaped run at stages 4, 6 and 8.

## Choosing the shape

- `shape-session` is the default: the orchestrator session dispatches subagents itself, at most `implementers_concurrent` at a time.
- `shape-workflow` is chosen only when a wave holds more units than `implementers_concurrent`, so the fan-out needs a script to hold the chunking and the stage results outside any context window.
- In both shapes the orchestrator session, the gates, the `fc` commands and the stored returns are identical; only the dispatch mechanism, the progress view and the stopping differ.
- Gates are never inside a script: a script ends, and the session halts at the gate.
- `plan.shape` must equal the shape part in the kickoff version; `fc validate plan` refuses a mismatch.

## The three scripts

| script | run as | `args` | does | returns |
|---|---|---|---|---|
| `fc-implement.js` | `/fc-implement` | `{launch, units: [{id, name, prompt_path, checks, depends_on, pilot}], implementers_concurrent, timestamp, agent_type?, model?}` | derives waves from `depends_on`; per wave runs `pilot: true` units first and continues only on green returns; dispatches the rest in chunks of `implementers_concurrent`; validates every return against the worker-return shape; an absent or invalid return becomes `status: halt, halt.kind: budget`; the first halt stops dispatch | `{workflow, launch, timestamp, dispatched, returns, halt, stopped_on}` |
| `fc-review.js` | `/fc-review` | `{launch, spec_path, critic_prompt_path, units, critic_passes, timestamp, model?}` | fresh critic pass; routes `correctness-gap` and `scope-violation` to the implementer of the unit whose `paths` hold the file, with the finding, the spec and that unit's checks; re-verifies; takes a fresh pass; a `spec-conflict` stops with an escalation payload and no fix; observations are carried and never dispatched; at `critic_passes` with blocking findings open returns a trigger payload | `{workflow, launch, timestamp, passes, fixes, verifications, unrouted, observations, escalation, trigger}` |
| `fc-explore.js` | `/fc-explore` | `{questions: [{id, question, stage, scope_paths}], timestamp?, model?}` | one read-only explorer per question, answering within `scope_paths` and citing what it read; a return that does not match the explorer-return shape is listed under `rejected` | `{workflow, timestamp, asked, answers, rejected}` |

- `prompt_path` is the file the orchestrator wrote from `fc worker render <unit>`; `critic_prompt_path` is the sealed file `fc critic render` wrote; a script hands an agent that file and nothing else.
- `agent_type` is `implementer` where the crew is distributed, `general-purpose` where it is not.
- Timestamps arrive through `args`: `Date.now()`, `new Date()` and `Math.random()` throw in the workflow runtime.
- Each script opens with `export const meta` as a pure literal whose `name` equals the filename, and inlines every return schema as a literal identical to `flightcrew/schemas/<kind>.schema.json`; the `workflows` suite proves both.

## Persisting payloads

After a workflow completes, the orchestrator stores every payload through `fc`; until then nothing a script did is evidence.

| payload | command | stored at |
|---|---|---|
| each worker return in `returns` | `fc return worker <file> --unit <id>` (alias `fc worker return <id> <file>`) | `launch/<L>/returns/<unit>.json` |
| each green unit | `fc worker merge <unit>` in wave order | the run branch; `unit_merged` event |
| each critic pass in `passes` | `fc return critic <file> --pass <n>` | `launch/<L>/review/pass-<n>.json` |
| each fix in `fixes` | `fc return critic --resolve F<n> --commit <sha>` | `launch/<L>/review/resolutions.json` |
| each verification in `verifications` | `fc return verifier <file> --pass <n>` | `launch/<L>/returns/verify-<n>.json` |
| each answer in `answers` | `fc return explorer <file> --id X<n>` | `launch/<L>/returns/explore-X<n>.json` |
| a `halt` or `trigger` payload | `fc launch escalate <halt|trigger> --detail "…"` | `escalation.json`; `escalation` event |
| an `escalation` payload (spec conflict) | `fc launch escalate spec-gap --detail "…"` | as above |
| `unrouted` findings | the orchestrator places them by unit, then routes as above | — |
| usage from the runtime | `fc events usage <json>` | `usage` event |

- `fc return` validates each file by kind and exits 2 on a file that does not match; an invalid payload is a halt, never a stored return.
- `fc worker render`, `fc worker merge` and `fc launch phase` exit 2 while a trigger is fired, so a trigger payload stops the run in `fc` as well as in the script.

## The /workflows controls

- `/workflows` lists the runs of the current session with their phases and progress; a running script reports its phase lines there and through `phase(title)` and `log(msg)` in the script.
- A run can be stopped from the progress view; a stopped run returns nothing, and the orchestrator escalates with what the last stored returns show.
- Runs are resumable in-session: a completed agent returns its cached result, so a re-run after a transient failure does not re-dispatch finished units.
- The runtime keeps each run's script under the session directory in `~/.claude/projects/`, which is how a run's exact script is found afterwards.
- Limits: up to 16 concurrent agents (fewer with fewer CPUs), 1,000 agents per run; the plan's `implementers_concurrent` is the binding cap, not the runtime's.
- `Workflow(fc-implement)`, `Workflow(fc-review)` and `Workflow(fc-explore)` in `permissions.allow` approve the launches in `-p` runs; the `workflowSizeGuideline` setting bounds the size a session will accept.

## Distribution

- `fc distribute --apply --target .claude` copies every `workflows/*.js` to `.claude/workflows/`, where Claude Code runs it as `/<name>`; without `--apply` it prints the planned copies and writes nothing.
- A target file with different content lists as a conflict and nothing is copied unless `--force`.
- The scripts are edited under `flightdeck/flightcrew/workflows/` and redistributed; a copy edited in place drifts and `fc doctor --target` does not compare workflow copies, so redistribute after every change.
- A change to a script's stage boundaries is a tooling-axis setup change and is committed with its run-log entry.
