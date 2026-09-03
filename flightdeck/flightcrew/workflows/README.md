# Workflow scripts

Dynamic workflow scripts for the launches that run in the workflow shape. `fc distribute --apply` copies every `*.js` here to `<target>/workflows/`, where Claude Code runs it as `/<name>` with `args` passed as structured data.

A script here only dispatches agents and returns payloads. It reads no file, runs no command, touches no git state and stamps no time: `Date.now()`, `new Date()` and `Math.random()` are unavailable in the workflow runtime, so a timestamp arrives through `args`. **After a workflow completes, the orchestrator persists every payload with `fc return` and lands units with `fc worker merge`** — nothing a script returns is stored until the orchestrator stores it, and nothing a script did counts as evidence until a check has run.

Each script opens with `export const meta` as its first statement, a pure literal whose `name` equals the filename. Every return shape it hands to `agent()` is inlined as a literal identical to the matching file under `flightcrew/schemas/`, so a shape can be read without leaving the script and a suite can prove the copy has not drifted.

## fc-implement

Dispatches the implementer agents of one launch, wave by wave.

`args`: `{ launch, units, implementers_concurrent, timestamp }`, plus optional `agent_type` and `model`. Each unit is `{ id, name, prompt_path, checks, depends_on, pilot }`, where `prompt_path` is the file the orchestrator wrote with `fc worker render <unit>`. Waves are derived from `depends_on`: a unit runs one wave after the deepest unit it depends on.

Within a wave the pilot units run first and the rest follow only if the pilots came back green; the rest are dispatched in chunks of `implementers_concurrent`, the next chunk starting only when the current one has returned. Every return is validated against the inlined worker-return shape; a return that is absent or does not match becomes `status: halt` with `halt.kind: budget` naming what was wrong. The first halt stops dispatch, and the halt is returned.

`agent_type` is the subagent type to dispatch: `implementer` where the crew has been distributed to the target directory, `general-purpose` where it has not — in both cases the agent is handed the rendered prompt and nothing else.

Returns `{ workflow, launch, timestamp, dispatched, returns, halt, stopped_on }`.

## fc-review

Runs the review loop of one launch.

`args`: `{ launch, spec_path, critic_prompt_path, units, critic_passes, timestamp }`, plus optional `model`. `critic_prompt_path` is the sealed file `fc critic render` wrote.

Each pass dispatches a fresh critic, then routes its open findings by kind: a correctness gap or a scope violation goes back to the implementer of the unit whose `paths` hold the file, with the finding, the spec and that unit's checks; a spec conflict stops the loop with an escalation payload and no fix; an observation is carried in the result and never dispatched. After the fixes the checks are re-run by a verifier agent, and the loop takes a fresh pass. A finding whose file no unit owns is returned under `unrouted` for the orchestrator to place. At `critic_passes` with blocking findings still open, the loop returns a trigger payload instead of another pass.

Returns `{ workflow, launch, timestamp, passes, fixes, verifications, unrouted, observations, escalation, trigger }`.

## fc-explore

Fans one read-only explorer per open question.

`args`: `{ questions }`, plus optional `timestamp` and `model`. Each question is `{ id, question, stage, scope_paths }`; the explorer answers that one question within those paths and cites what it read.

Returns `{ workflow, timestamp, asked, answers, rejected }`. Each answer matches the explorer-return shape and is stored with `fc return explorer --id X<n>`; a return that did not match is listed under `rejected` with the reason rather than being stored.
