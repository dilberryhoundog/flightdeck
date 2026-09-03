# The crew

Roles, the separations each one exists for, the rules that turn a role into a definition, and the team shapes a run can take. The roster with tools, models, turn budgets, inputs and returns is `flightcrew/crew/README.md`; each definition is `flightcrew/crew/<role>.md`. Read by the human when changing a role (stage 10, promotion) and by the planner when the plan assigns owners and models.

## Roles, not workers

- The mechanism under every role is context isolation: a subagent receives only its own definition and what its dispatch names, and returns only what it reports.
- The question when designing a team is not how many agents but which separations the run's quality depends on.
- Three separations do most of the work: the definer of done from the doer (`test-builder` from `implementer`); the judge from the judged (`critic` from `implementer`); the coordinator from the content (`orchestrator` from everyone).
- Accountability runs vertically: each agent answers to the orchestrator for one output in one declared shape; agents never negotiate with each other; handoffs travel through files and schemas.
- Every crew body carries the line "Your inputs are only those named in the dispatch; auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role."

## The cast

| role | separation it serves | may | must not | form |
|---|---|---|---|---|
| `orchestrator` | coordinator from content | read the kickoff, spec, map, plan, stored returns, prior reports; dispatch; run `fc` | write any file except through `fc plan write`, `fc launch note`, `fc return`; read worker transcripts, the interview, the critic's reasoning | the session agent (`claude --agent orchestrator`) |
| `explorer` | protects the orchestrator's context | read the codebase, answer one question, cite pointers | write; receive the plan or a unit's work | read-only subagent, small model, fanned in parallel |
| `planner` | plan from implementation | read spec, map, run log, roster, explorer returns; return plan content | write; read worker transcripts | subagent, read-only tools |
| `test-builder` | definer of done from doer | write the tests map and check scripts from the frozen spec and the fixture | see any plan, implementation or interview | fresh session or subagent before every implementer; its files locked afterwards |
| `implementer` | one unit, one owner | write inside its unit's paths in its own worktree and branch; run `fc check <T…>` | read other units, the whole plan, the kickoff; edit a locked path | worktree-isolated subagent, structured return |
| `verifier` | second opinion on done | re-run the evidence and try to refute the claim of done | write; read implementer reasoning or stored returns | optional subagent; the deterministic part is hooks, gates and `fc verify` |
| `critic` | judge from judged | read spec, diff and evidence; run checks | write; read plan, kickoff, reasoning, prior findings | fresh subagent per pass, strongest model |
| `spec-builder`, `spec-judge`, `spec-attacker` | intention from run | produce, grade and attack a spec at stage 1 | see the run, prior specs, the interview (judge and attacker) | spec-stage sessions and subagents; unchanged calibration assets |

- The minimum cast for a run that earns its cost: orchestrator, one explorer pass, test-builder, implementers, the deterministic gates, one critic pass; the planner may fold into the orchestrator on a small run.
- Never folded together: test-builder with implementer, and critic with anything.
- There is no scribe: `fc launch end`, `fc report`, `fc evidence` and the SessionEnd hook assemble the report and the evidence page; a second way to produce the same file is drift.

## From role to definition

A role is a markdown file: YAML frontmatter for configuration, body as the agent's entire system prompt; the body is all the agent knows about how to behave.

| field | use in role design |
|---|---|
| `name` | the identity the dispatcher and the permission rule `Agent(<name>)` use; lowercase and hyphens |
| `description` | written for the dispatcher: when to use it and what it returns, one or two sentences, non-overlapping with siblings |
| `tools` | an allowlist; omitting it inherits everything, which no role wants; the badge is the role: a critic gets Read, Grep, Glob, Bash; an implementer adds Write and Edit |
| `model` | tiering: `haiku` for wide reading, `opus` for units, `fable` for judging and planning, `inherit` for the orchestrator |
| `maxTurns` | the per-agent budget, present on every role except orchestrator, spec-builder, spec-judge and spec-attacker; validate-plan holds `budget_turns` at or under it |
| `isolation: worktree` | the implementer only; the fragment's `worktree.baseRef: head` makes the worktree branch from the run branch |
| `permissionMode: acceptEdits` | implementer and test-builder, so edits inside their paths need no prompt |
| `initialPrompt` | the orchestrator only: run `fc launch status`, read `kickoff.md`, follow it |
| the body's last block | a fenced JSON block showing the return shape, matching `flightcrew/schemas/<kind>.schema.json`; `fc return` validates it |

- Bash on the critic and the verifier is deliberate: running checks is not writing.
- The output shape is stated in the description and the body because the orchestrator consumes it programmatically.

## Design rules

- One job, one definition of done: a body fits on a screen and ends with what it returns; a prompt that needs sections is a role that needs splitting.
- Tools follow the role, never convenience: every tool an agent holds is a way its role can be corrupted; scope first, widen only on run-log evidence.
- State the output shape explicitly and validate it at the handoff (`fc return`).
- Write descriptions for the dispatcher; overlapping descriptions produce misrouting that looks like model failure.
- Tier models by role: wide reading and formatting to cheap models, judging and planning to the strongest, the deterministic part of verification to no model.
- Give every agent a budget: `maxTurns` per role, `implementers_concurrent` on fan-out, `agents` on the run.
- Summarise on the way up: conclusions sized for a coordinator, pointers to files for the detail.
- Version the roster with the project: crew files are setup, changed in reviewed diffs through the run log, never mid-run; `fc distribute --apply` copies them to `.claude/agents/flightcrew/` and `fc doctor --target` checks the copies are byte-equal.

## Team shapes

| shape | mechanism | choose when | kickoff part |
|---|---|---|---|
| session | one Claude Code session is the orchestrator; roles run as subagents and return summaries | the default; every wave fits within `implementers_concurrent` in one turn | `shape-session` |
| workflow | a dynamic workflow script (`fc-implement`, `fc-review`, `fc-explore`) holds the loop and the stage results; the session keeps the gates and the `fc` commands | a wave holds more units than `implementers_concurrent` | `shape-workflow` |
| sessions | one conducting session owning the gates plus one session per long-running stream, sharing only the launch folder | a stream needs its own context window for hours | `shape-sessions` |

- In every shape the orchestrator session, the gates, the `fc` commands and the stored returns are identical; only dispatch, progress and stopping differ.
- Shapes compose: a workflow's implementing stage dispatches worktree-isolated subagents; choose the smallest shape that fits and let the run log justify moving up.
- Experimental agent teams with shared messaging are not used: horizontal chatter dissolves the separations the roles exist for.

## Anti-patterns

- The generalist blob: one agent, all tools, exploring, implementing and reviewing in one context; the run self-confirms by construction.
- The critic who saw the plan: a reviewer given the reasoning; it reviews the intention and approves.
- The implementer who grades itself: done declared by the agent that did the work, with no gate and no refutation.
- Horizontal chatter: workers passing context to each other; accountability blurs and no unit can be said to have failed.
- Agent sprawl: many unmaintained specialists with overlapping descriptions; fewer, sharper roles, retired the way the run log retires findings.
- Inherit-everything tools: omitted tool lists, so every role can do everything.
- The unbounded specialist: no `maxTurns`, no fan-out cap, no stall rule; one stuck agent spends the run's budget unwatched.
- Prompt-only isolation: "do not modify tests" in the body of an agent holding Edit on the test directory; boundaries are enforced by tools, hooks and worktrees.
