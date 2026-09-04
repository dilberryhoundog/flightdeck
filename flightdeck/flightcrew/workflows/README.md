# Workflow scripts

Dynamic workflow scripts. A launch's kickoff fixes its shape: `shape-session` dispatches subagents from the orchestrator session, `shape-workflow` hands a wave to a script here, and `shape-sessions` splits the run across sessions. `shape-workflow` is chosen when a wave holds more units than the `implementers_concurrent` ceiling; `flightdeck/manuals/harness/workflows.md` carries the rule and the invocation table, and only a launch in that shape runs these scripts.

The runner is `flightdeck/flightcrew/bin/fc`, invoked by path from the repository root and never installed; `fc` below is shorthand for that path. `fc distribute --apply` copies every `*.js` here to `<target>/workflows/`, where `<target>` defaults to `$REPO/.claude` and `--target <dir>` overrides it. Claude Code then runs each as `/<name>`, invoked with its `args` object as structured data — `/fc-explore` with `{ "questions": [ … ] }`, and the others with the objects below.

This README covers using the three scripts. The runtime's authoring contract — the injected `args` binding, `agent()` with its `label`, `phase`, `schema`, `agentType`, `isolation` and `model` options, `parallel()`, `pipeline()`, `phase()`, `log()`, `budget` and the default export — is in `flightdeck/manuals/harness/claude-code-facts.md` under Dynamic workflows.

A script here only dispatches agents and returns payloads. It reads no file, runs no command, touches no git state and stamps no time: `Date.now()`, `new Date()` and `Math.random()` are unavailable in the workflow runtime, so a timestamp arrives through `args`. **After a workflow completes, the orchestrator writes each returned payload to a file and stores it with the `fc return` command for its kind — `fc return worker <file> --unit <id>`, `fc return critic <file> --pass <n>`, `fc return verifier <file> --pass <n>`, `fc return explorer <file> --id X<n>` — then lands each green unit with `fc worker merge <unit>` in wave order** — nothing a script returns is stored until the orchestrator stores it, and nothing a script did counts as evidence until a check has run.

Each script opens with `export const meta` as its first statement, a pure literal carrying `name`, `description` and `phases`, where `name` is the filename with its `.js` extension removed. Every return shape it hands to `agent()` is inlined as a literal identical to the matching file under `flightdeck/flightcrew/schemas/`, so a shape can be read without leaving the script and a suite can prove the copy has not drifted.

## fc-implement

Dispatches the implementer agents of one launch, wave by wave.

`args`: `{ launch, units, implementers_concurrent, timestamp }`, plus optional `agent_type` and `model`. Each unit is `{ id, name, prompt_path, checks, depends_on, pilot }`: `id` is the plan unit id, `name` the segment used in the unit branch `<launch>/<name>`, `checks` the `T<n>` check ids the unit runs, `depends_on` the ids it follows, and `pilot` a boolean matched strictly against `true`. `prompt_path` is `flightdeck/launch/<L>/returns/<unit id>.prompt.md`, where `<L>` is the launch name passed in `args.launch`; `fc worker render <unit>` writes that file beside printing. Commit it before the dispatch, because a subagent worktree branches from HEAD and an uncommitted launch-folder file is invisible to the worker. Waves are derived from `depends_on`: a unit runs one wave after the deepest unit it depends on.

Within a wave the pilot units run first and the rest follow only if the pilots came back green; the rest are dispatched in chunks of `implementers_concurrent`, the next chunk starting only when the current one has returned. Every return is validated against the inlined worker-return shape; a return that is absent or does not match becomes `status: halt` with `halt.kind: budget` naming what was wrong. Dispatch stops on either of two conditions: a halt from any unit, which fills both `halt` and `stopped_on`; or a red pilot return, which fills `stopped_on` alone and leaves `halt` null. Test `stopped_on`, not `halt`, to tell a stopped run from a completed one.

`agent_type` defaults to `implementer` and is the subagent type to dispatch: `implementer` where the crew has been distributed to the target directory, `general-purpose` where it has not — pass it explicitly in that case — in both cases the agent is handed the rendered prompt and nothing else.

Returns `{ workflow, launch, timestamp, dispatched, returns, halt, stopped_on }`.

## fc-review

Runs the review loop of one launch.

`args`: `{ launch, spec_path, critic_prompt_path, units, critic_passes, timestamp }`, plus optional `model`. `critic_prompt_path` is the sealed file `fc critic render` wrote. Each unit here is `{ id, name, paths, checks }` — a different shape from fc-implement's: `paths` is the glob list a finding's file is matched against to decide ownership, and without it every finding lands in `unrouted`. This script's agent types are fixed, so it needs a target the crew has been distributed to.

Each pass dispatches a fresh critic, then routes its open findings by kind: a correctness gap or a scope violation goes back to the implementer of the unit whose `paths` hold the file, with the finding, the spec and that unit's checks; a spec conflict stops the loop with an escalation payload and no fix, as do a critic return that does not match its shape, a fix agent that halts instead of fixing, and a re-verification that refutes the recorded evidence; the payload is `{ kind, detail }`, and the kind says which of the four it was; an observation is carried in the result and never dispatched. After the fixes the checks are re-run by a verifier agent, and the loop takes a fresh pass. A finding whose file no unit owns is returned under `unrouted` for the orchestrator to place. At `critic_passes` with blocking findings still open, the loop returns a trigger payload instead of another pass.

Returns `{ workflow, launch, timestamp, passes, fixes, verifications, unrouted, observations, escalation, trigger }`.

## fc-explore

Fans one read-only explorer per open question.

`args`: `{ questions, timestamp }`, plus optional `model`. `timestamp` is required of every script in the sense that the runtime cannot stamp one; where it is absent the returned payload records `null` for it. Each question is `{ id, question, stage, scope_paths }`, where `id` matches `X<n>` and `stage` is one of `intent`, `scope`, `constraints`, `interfaces`, `behaviours`, `verification` and `planning`; a question failing either lands under `rejected` unanswered. the explorer answers that one question within those paths and cites what it read.

Returns `{ workflow, timestamp, asked, answers, rejected }`. Each answer matches the explorer-return shape and is stored with `fc return explorer <file> --id X<n>`; a return that did not match is listed under `rejected` with the reason rather than being stored.
