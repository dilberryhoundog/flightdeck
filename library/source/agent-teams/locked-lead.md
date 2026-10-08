The locked lead

1. [Why lock the lead](#why)
2. [The human improves the machinery](#machinery)
3. [Teams as a roster over time](#roster)
4. [Body and entry point](#body)
5. [Entry points as the lead's output](#entry)
6. [The lock](#lock)
7. [Operating manual and drills](#manual)
8. [Platform constraints](#platform)
9. [The lead's levers](#levers)
10. [Stopping and message volume](#stop)
11. [Left to later sections](#later)
12. [Sources](#sources)

# The locked lead

Running agent teams, part two of six. Part one covered persisted truth; the others cover handoffs, routing, the lineup and failure modes.

The lead is a frontier model whose whole job is to make other agents productive. Left alone, it will do the work itself, because it can and because that is what a capable model does by default. Locking the lead is not about distrust. It is about making the team the easiest way to get anything done.

A team is not a fixed group; it is who is present at each moment. Hollow circles mark retirements. The adversary and verifier are invoked fresh at verify, so they never carry the builders' reasoning. Staging this well is the lead's core skill.

## Why lock the lead

The agent teams documentation names the lead's two characteristic failures plainly. It sometimes starts implementing tasks itself instead of waiting for teammates, and it can decide the team is finished before all tasks are actually complete. Neither is a prompt problem. A frontier model with write tools and a clear task will reach for the tools, and a model that has been working a long time will find reasons to stop.

So the aim is not restriction for its own sake. **The aim is to encourage team usage, and restriction is one of three tools for it.** Restriction alone produces a lead that stalls or works around the lock. Encouragement alone produces a lead that drifts back into doing the work. Together with making dispatch cheap, they make the team the path of least resistance.

**The rule for the whole section:** the lead may look in order to decide, but must dispatch in order to do.

## The human improves the machinery

A bare session waits for a human to say what to do. Every session, the human re-supplies the same things: what's outstanding, where things stand, what matters next. That is prompting as a job, and it is the HITL habit this system exists to retire.

The principle that replaces it: **the human does not prompt; the human improves the machinery.** A primed session reads the state of the work, decides what's next itself, and gets underway. Your effort goes into the state it reads and the body it runs in, not into the words you type to start it.

### What a primed lead needs to choose "what's next"

- **Outstanding work:** what exists to be done, with enough metadata to judge priority and staleness.
- **Current progress:** where each live piece of work stands, and its next action.
- **Resolved escalations:** answers you gave since the last session, which unblock work.
- **Global truth and doctrine:** the part one tiers, read as part one describes.

How you store that state is yours. The point here is that the lead's first act in every session is **orienting and choosing**, not asking. Anthropic's multi-agent research system works the same way: its lead plans its own approach and saves the plan to external memory, because context can be truncated and the plan must survive it.

### The native mechanism

Agent definitions support an `initialPrompt` field, which is automatically submitted as the first user turn when the agent runs as the main thread. That is exactly the slot for "orient and choose": the lead's body carries its own kickoff, so a session opened with the lead agent starts working with no typing at all.

```
---
name: lead
description: Team lead. Orients from recorded state, chooses the next piece of
  work, and runs it through teams.
model: opus
initialPrompt: Orient from the recorded state of the work. Report in three lines
  what is outstanding, what is in progress, and what you will do next and why.
  Then begin.
---
(body: see "Body and entry point")
```

The three-line report gives you a moment to redirect if the choice is wrong, without requiring you to start anything.

**Every prompt you type is a bug report.** If you find yourself typing context into a session, something in the machinery should have supplied it. Treat it as a defect: record it, and fix the state or the body so it never needs typing again.

## Teams as a roster over time

An agent team is a session with persistent agents, as opposed to subagents that do one job and return once. Within that session, the roster is fluid. The lead can invoke agents and retire them at any point, from zero to twenty at a time. So one session can host several team configurations in sequence, each suited to a phase of the work.

That makes **staging** the lead's core skill: deciding who is present at each phase, and who must not be.

### Why staging matters: contamination control

An agent's context shapes its judgment. A verifier that watched the build absorbs the builders' reasoning and tends to agree with it. The dynamic workflows post names this self-preferential bias, and its remedy is checking work in a fresh context. A fresh context is exactly what a late invocation gives you. Bring the adversary in at verify, never having seen the build, and it attacks the output rather than defending the reasoning.

Staging rules worth holding as defaults:

- **Retire before you introduce** when a phase's context would mislead the next one. Explorers' dead ends shouldn't be in a builder's head.
- **Overlap deliberately** when cross-talk is the point. A planner and a critic arguing in the same phase is the value, not a leak.
- **Verifiers and adversaries join fresh,** after the thing they judge exists.
- **Use a single-return subagent instead of a teammate** when nothing needs to persist or talk: a lookup, a one-shot check, a summary.

## Body and entry point

This is the pattern that makes everything else work. Every agent the lead invokes has two parts:

- **The body,** its agent definition. It is generic and stable, and it carries the advanced mechanics every agent needs to operate in a team and in this system.
- **The entry point,** written by the lead at invocation. It varies the agent: which lens, which target, which team it is joining, and what done looks like.

One adversary body can be invoked as a security adversary, a spec adversary and a scale adversary, in the same team, through three different entry points. Each behaves differently where it should, and identically where it must.

### The two anti-patterns

| Pattern                          | What goes wrong                                                                                                                                                                                                                     |
|----------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Ten adversary definitions        | The mechanics are copied ten times and drift apart. Fixing reporting means ten edits. The roster bloats and the lead has to choose among near-duplicates. None of them is used often enough to improve.                             |
| Entry point only                 | The lead cooks up a generic agent from scratch every time. Mechanics like reporting, signalling and stopping are reinvented on each invocation and come out differently every time. Nothing is stable enough to measure or improve. |
| Generic body, varied entry point | Mechanics are defined once and behave the same everywhere. Variation is cheap and lives where it belongs. The body is a fixed surface you can evaluate and hillclimb.                                                               |

The last row is the eval connection from part one. The hillclimbing guidance says good improvement targets are cheap to change and attributable: the score must move because of the surface you changed. A body used across every variant gets exercised constantly and is a single attributable surface. Ten bodies, or none, give you nothing to climb.

### What the body carries

The body holds whatever must happen every time, regardless of variant. For an agent operating in a team and in this system, that is:

| Mechanic                | What it specifies                                                                                                                                                                                                             |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Role class              | What kind of agent this is (adversary, explorer, builder) and the stance that comes with it, without naming any particular target or lens.                                                                                    |
| Reading its entry point | How to parse the variant, the target, the roster and the done criteria, and what to do if any of them is missing: ask the lead, don't guess.                                                                                  |
| Team protocol           | Who to message and when, how to claim and update tasks, how to respond to the lead, and when to stay quiet.                                                                                                                   |
| Reporting contract      | The report template, where it goes, and that the final message to the lead is a short summary plus the report's location, never the full output.                                                                              |
| Signals                 | A fixed section in every report for problems and improvement ideas about the system itself: unclear entry points, missing tools, doctrine that got in the way. Without this, what an agent experienced in a run is invisible. |
| Decision flagging       | Decisions and assumptions it made are listed for the lead to record in the ledger, using part one's kinds.                                                                                                                    |
| Escalation              | When to stop and raise something to the lead instead of deciding, tied to the doctrine digest it loads.                                                                                                                       |
| Done and idle           | What finished means for this class, and that it doesn't go idle without a report.                                                                                                                                             |

The frontmatter carries the parts Claude Code reads directly: name, description, tool allowlist and model. One stable tool list per class is another reason to avoid per-variant definitions.

### Worked example

```
---
name: adversary
description: Attacks a target from the lens given in its entry point. Invoked
  fresh, after the target exists.
tools: Read, Grep, Glob, Bash
model: sonnet
---
You are an adversary on a team. Your entry point names your lens, your target,
who else is on the team, and what done looks like. Your job is to find real
ways the target fails under that lens, not to fix it.

Entry point: if the lens, target or done criteria are missing or ambiguous,
message the lead before starting.

Team: message only the lead and agents your entry point names. Claim your task
before starting and mark it complete only after your report exists.

Report: write the report using the adversary template to the location in your
entry point. Every finding has a severity, evidence and a reproduction.
End with a Signals section and a Decisions section.

Final message to the lead: three lines at most, with the report's location.
```

Three entry points from the lead, for the same body in the same team:

```
Lens: security. Target: the new session-handling module.
Team: two builders (finished), verifier (running).
Done: every auth path tried with forged, expired and replayed sessions.

Lens: spec. Target: the same module against spec section 4.
Done: every spec clause either demonstrated or shown violated.

Lens: scale. Target: the session store under 100x current load.
Done: the first failure point found, or 100x reached cleanly.
```

## Entry points as the lead's output

If bodies hold the mechanics, entry points are where the lead's intelligence goes. There is no shared team brief; each agent gets an entry point written for it, at its moment, knowing who else is present. Good entry points are what make independently invoked agents work in unison: each knows its lens, its target, who it may talk to, which part of the ledger and truth bears on it, and what done looks like.

That makes entry-point writing the lead's main output, and its quality the strongest lever on team performance. Their full anatomy belongs to part three, handoffs.

## The lock

Three measures, each with its own enforcement.

### Lock doing

The lead does not write to work product, and does not run broad searches. Removing those is what makes the team necessary. Enforce it in layers, strongest first:

- **The lead's tool allowlist,** in its body's frontmatter. Community guides report that a session started with `--agent` takes on the agent's tools and model as well as its prompt. Verify this on your version before relying on it alone.
- **Permission rules** in the session's settings, denying writes outside the records the lead owns.
- **A `PreToolUse` hook** as the backstop, which catches anything the other two miss and returns a reason the lead can act on: "dispatch a builder".

### Budget looking

A lead blind to raw material writes vague entry points. So the lead may read records, reports, the ledger and small raw artifacts when that sharpens a decision or an entry point. What it may not do is sift: open-ended searching, reading whole directories, following a trail file to file. That is explorer work. Anything beyond a small, targeted look should become a dispatch.

The dynamic workflows post's quarantine pattern is the model: readers touch the raw material, and the acting agent only sees their summaries. There it is a security measure. Here it protects the lead's context.

### Make dispatch cheap

The lock only works if the alternative is easy. Dispatch is cheap when:

- **The roster is ready.** A small set of generic bodies exists, covering the classes the work needs. That is part five.
- **Entry points have a shape.** The lead fills a structure rather than composing from nothing. That is part three.
- **Staging is habitual.** Invoking and retiring is routine, so bringing in a fresh agent feels normal, not expensive.

## The operating manual and drills

A frontier model knows agent teams in general. It doesn't reliably know the current mechanics of an experimental feature that changes from version to version. The lead needs an operating manual, loaded as a skill, covering:

- How to invoke, name, message and retire teammates, and use the shared task list.
- When to use a teammate, a single-return subagent, or a dynamic workflow.
- Staging rules and contamination control.
- The platform constraints below.
- How to write an entry point that engages a body correctly.

Under native-first doctrine, the manual must track the platform. An explorer should check it against the documentation periodically, and changes go through the usual promotion path.

**Drills** turn the manual into earned knowledge. A drill is a deliberately small run of a team shape, done once to confirm the mechanics behave as the manual says, with the result recorded as a ledger entry. Run a drill whenever a mechanic is new or the platform version changes. A failed drill is a cheap discovery; a failed real run is an expensive one.

## Platform constraints the lead must know

These come from the current agent teams documentation. They are exactly the details a lead will get wrong from general knowledge, so they belong in the operating manual.

| Constraint                                                                              | Consequence for the lead                                                                                                          |
|-----------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| One team container per session, with a fixed lead                                       | The lead can't hand over leadership. Rosters change within the session; the container doesn't.                                    |
| Teammates can't spawn teammates                                                         | All staging decisions belong to the lead. No sub-teams.                                                                           |
| In-process teammates aren't restored by `/resume` or `/rewind`                          | After a resume, the lead must not message teammates that no longer exist. Anything a teammate knew must already be in its report. |
| Plan approvals are granted in the lead's session as soon as they arrive, without review | Plan approval is not a quality gate. A real plan review needs a separate reviewer.                                                |
| The lead may implement tasks itself, or stop early                                      | Hence the lock and the stop condition.                                                                                            |
| Subagents can now spawn their own subagents, up to five levels                          | Single-return delegation can nest even though teams can't. A teammate can still fan out one-shot work.                            |

The subagent nesting limit comes from the Agent SDK documentation (v2.1.172). Check the current docs for each constraint when the manual is reviewed; experimental features move.

## The lead's levers

Once doing is locked, the lead's job reduces to five levers. If the lead isn't pulling one of these, it's probably drifting.

| Lever           | When to use it                                                                                                                                                                                               |
|-----------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Dispatch        | Invoke an agent from a body, with an entry point. The default answer to "this needs doing".                                                                                                                  |
| Stage           | Retire agents whose context would mislead the next phase; bring in fresh ones. Decide who must not see what.                                                                                                 |
| Hand off a loop | For bulk or repetitive work, give the loop to a dynamic workflow and read only the synthesis. In the post's tournament example, the deterministic loop holds the bracket so the coordinator doesn't have to. |
| Escalate        | When doctrine doesn't grant the decision and it is irreversible, out of scope or a matter of taste with no rubric. Part one's decision path decides.                                                         |
| Record          | Write the ledger, as its single writer, including decisions teammates flag in reports.                                                                                                                       |

## Stopping and message volume

### The stop condition

Since early stopping is documented, the lead's session needs a check that blocks it from finishing while tasks remain open, agents remain unreported, or flagged decisions remain unrecorded. A `Stop` hook is the natural place: it reads the task list and the reports, and refuses with a reason the lead can act on. Teammates get the same treatment through `TaskCompleted` and `TeammateIdle`, which can block completion and idling with feedback.

### Message volume

When a teammate finishes, the lead is notified automatically, and the notification includes the teammate's final answer. If final answers are long, the lead's context fills with raw output, which is the very sifting the lock prevents. The body's reporting contract handles this: the full output goes into a report, and the final message is a short summary plus the report's location. Because it lives in the body, it holds for every variant, every time.

## Left to later sections

- **Handoffs:** the full anatomy of entry points, reports and their signals section, the lead's dossier for the human, and what the human sends the lead.
- **Routing:** how the lead classifies incoming work and picks a team shape and staging plan.
- **The lineup:** which generic bodies the roster needs, and what each one carries.
- **Failure modes:** including how a lead fails when the lock, the manual or the entry points are weak.

## Sources

- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams), Claude Code docs. Lead failure modes, team lifecycle and limits, plan approval behaviour, idle notifications, and team hook events.
- [Subagents in the SDK](https://code.claude.com/docs/en/agent-sdk/subagents), Claude Code docs. The `initialPrompt` field and subagent nesting depth.
- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic. Self-preferential bias and fresh-context checking, the quarantine pattern, and deterministic loops holding state.
- [Automating eval design and hillclimbing with Claude](https://claude.dev/blog/automating-eval-design-and-hillclimbing/), Anthropic. Cheap, attributable surfaces as hillclimbing targets.
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), Anthropic Engineering. The lead planning its own approach and saving the plan to memory.
- Community guides on `--agent` (claudelog.com, computingforgeeks.com) for the claim that a session started with an agent takes on its tools and model. Unverified against official docs.

The body and entry point pattern is your discovery, written up here. The staging rules, the lock's three measures, the levers and the stop check are synthesis to trial.

Running agent teams, part two: the locked lead. Drafted 1 October 2026.
