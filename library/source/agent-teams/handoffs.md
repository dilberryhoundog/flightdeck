Handoffs

1. [The handoff map](#map)
2. [Entry points](#entry)
3. [Reports](#reports)
4. [Signals](#signals)
5. [The dispatch record](#dispatch)
6. [The dossier](#dossier)
7. [Escalations](#escalations)
8. [Human to lead](#human)
9. [Phase to phase](#phases)
10. [Agent to agent](#peers)
11. [Enforcement](#enforce)
12. [Left to later sections](#later)
13. [Sources](#sources)

# Handoffs

Running agent teams, part three of six. Part one covered persisted truth, part two the locked lead; routing, the lineup and failure modes follow.

Every handoff is a place where context either survives or leaks. Agents don't share memory, teammates don't survive a resume, and the lead can't afford to read everything. So each handoff has a fixed shape, a fixed destination, and a rule about what must outlive it.

Six handoffs, five durable records. Peer messages (dashed) coordinate but are not records; anything that matters from them must reach a report.

## The handoff map

| Handoff        | Carried by                                      | What must survive                                             |
|----------------|-------------------------------------------------|---------------------------------------------------------------|
| Lead to agent  | Entry point                                     | The entry point itself, kept beside the report it produced    |
| Agent to lead  | Report, plus a short final message              | The report, complete enough for a fresh successor             |
| Agent to agent | Peer messages                                   | Nothing directly; decisions and discoveries move into reports |
| Phase to phase | Earlier reports by path, or a workflow pipeline | Reports, or the workflow's own resumable state                |
| Lead to human  | Dossier per run; the escalations register       | Dossier, dispatch record, register entries                    |
| Human to lead  | Typed inputs                                    | Every input lands in persisted state; chat is not a record    |

## Entry points: lead to agent

There is no shared team brief. Every agent gets its own entry point, written by the lead at the moment of invocation, knowing who else is present. The body (part two) tells the agent how to read it; the entry point tells it what this invocation is for. Entry points are where most of the lead's intelligence goes.

The strongest prior comes from Anthropic's research system. Early versions gave subagents short, vague tasks, and they duplicated each other's work or misread the job. The fix was giving every subagent an objective, an output format, guidance on tools and sources, and clear task boundaries. A team needs all of that plus awareness of the team.

### The eight fields

| Field                              | What it holds                                                                                                                   | Why                                                                                                                                                         |
|------------------------------------|---------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1. Variant                         | The lens or stance: security, spec, scale                                                                                       | Engages the body's role class in a specific direction. One body, many variants.                                                                             |
| 2. Objective and intent            | The outcome wanted, and why it matters                                                                                          | The why lets an agent make sensible calls the lead didn't foresee.                                                                                          |
| 3. Boundaries                      | In scope, out of scope, and who covers what                                                                                     | Naming neighbours' territory is the duplication fix. Boundaries divide *different* jobs.                                                                    |
| 4. Stage, roster and partners      | Who is present, who has finished (and where their output is), who comes next, who it may message; partners and their split rule | Lets independently invoked agents work in unison. Partners share *one* job (below).                                                                         |
| 5. Inputs by reference             | Paths to reports and artifacts to read                                                                                          | Never pasted content. The research system had subagents store work externally and pass references, avoiding a game of telephone; the same applies downward. |
| 6. Persisted truth                 | Relevant ledger entries, doctrine beyond the digest, the rubric that will judge the output                                      | Agents don't read the ledger (part one). This field is how it reaches them.                                                                                 |
| 7. Done and effort                 | What finished looks like; roughly how much effort it deserves                                                                   | Agents scale effort poorly unless told the size of the job.                                                                                                 |
| 8. Report destination and consumer | Where the report goes, and who reads it next                                                                                    | An agent writing for a named consumer writes a more usable report.                                                                                          |

### Partners

Sometimes one agent can't keep up: a single adversary consuming the output of three builders. Partners are agents sharing the same job, and their entry points name each other and a **split rule**. The default split rule is the native one: partners pick up work from the team's shared task list as it appears, so the load balances itself and the lead doesn't divide anything in advance. Use an explicit split only where the work has a natural seam: by producer, by component, by severity.

How many partners a phase needs is a staging decision for the lead. Routing and the lineup (parts four and five) supply starting ratios.

### The ask-when-missing contract

The body requires the entry point's fields. If a required field is missing or ambiguous, the agent asks the lead before starting rather than guessing. That makes entry-point quality visible: a weak entry point produces a question, not a quietly wrong result. Each question is also a signal (below).

### Entry points are residue

Keep every entry point beside the report it produced. When a run goes wrong, this is the only way to tell whether the body failed or the entry point did. And a collection of entry point and report pairs turns the entry-point template into an evaluable, hillclimbable surface, exactly like a body.

### A template keeps dispatch cheap

The lead fills a structure rather than composing from nothing. That serves part two's aim of making dispatch the path of least resistance, and it makes entry points consistent enough to compare.

```
variant: security
objective: Find ways the session-handling module can be abused.
intent: It ships to all users next week; auth bugs are the costliest kind.
boundaries:
  in: session creation, renewal, revocation
  out: password storage (covered by the spec adversary)
stage:
  present: verifier (running), adversary/scale (partner)
  finished: builder x2, reports at dispatch/D-031/reports/builder-*.md
  next: lead synthesis
  may_message: lead, adversary/scale
partners:
  - adversary/scale
  split: claim from the task list
inputs: dispatch/D-031/reports/builder-1.md, builder-2.md, spec section 4
truth:
  ledger: L-W07-014, L-W07-019
  rubric: R-adversary-report v2
done: every auth path tried with forged, expired and replayed sessions
effort: medium; roughly an hour of agent time
report: dispatch/D-031/reports/adversary-security.md, read by the lead
```

## Reports: agent to lead

A report is the only thing that survives an agent. Teammates aren't restored on resume, and the lead retires agents deliberately when staging. So every report meets one standard: **a fresh successor could continue from it alone**, with no access to the agent that wrote it.

### The six parts

1. **Summary.** Three lines at most. This doubles as the final message to the lead, with the report's location, so the lead's context never fills with raw output.
2. **Output and findings,** each with its evidence.
3. **Decisions and assumptions,** flagged in part one's two kinds, for the lead to record in the ledger.
4. **Coverage.** What it checked, and what it didn't. Agents naturally present partial work as complete, and a lead reading summaries will believe them. The dynamic workflows post calls this agentic laziness: stopping after partial progress and declaring the job done. An explicit "not covered" list is the cheapest defence there is.
5. **Escalations and open questions.** Proposed escalations go to the lead, who checks the register (part one) before raising anything.
6. **Signals.** Problems and improvement ideas about the system itself.

### Format and checking

A template plus a schema check is the foundation layer from part one at work: a malformed report is rejected mechanically before the lead spends any context on it. Reports that matter enough get a rubric too, as in the entry point example above.

```
# Report: adversary (security), dispatch D-031
## Summary
3 findings, 1 high: replayed sessions accepted within 30s window.
Renewal and revocation clean. Rate limiting not checked (out of time budget).
## Findings
### F1 high: replay window   evidence: tests/adv/replay_test.py, log excerpt
## Decisions and assumptions
- assumption: clock skew under 5s in production (not verified)
## Coverage
checked: creation, renewal, revocation, forged and expired tokens
not checked: rate limiting, concurrent sessions per user
## Escalations
- proposed: reject or re-authenticate replays? (recommend re-authenticate)
## Signals
- entry-point defect: "effort: medium" too vague for an adversary; cost a
  re-plan. Suggest a coverage list instead of a time estimate.
```

## Signals

What an agent experienced in a run is invisible unless it reports it. Signals are that window, and they are the main input for the human's real job: improving the machinery. Untyped, they become vague complaints, so every signal has a kind, what happened, what it cost, and a suggestion if the agent has one.

| Kind                        | Example                                              | Routes to                                                               |
|-----------------------------|------------------------------------------------------|-------------------------------------------------------------------------|
| Entry-point defect          | A field missing, vague or wrong                      | The entry-point template; repeated defects become a hillclimbing target |
| Body defect                 | A mechanic that didn't fit the work                  | The body; a hillclimbing target against its eval                        |
| Tool or permission friction | A needed tool missing or blocked                     | The body's tool list, settings or hooks                                 |
| Doctrine friction           | A rule got in the way, or should have covered a case | A doctrine reopen or a new grant, through promotion                     |
| Truth friction              | A rubric unclear or apparently wrong                 | A new gold case and possible recertification                            |
| Environment                 | Flaky tests, broken setup, missing data              | Outstanding work                                                        |

**Aggregation:** the lead collects a run's signals into its dispatch record, grouped by kind. A signal seen once is noted. A signal repeated across dispatches becomes a machinery item for the human, with the instances attached. You read aggregates, never transcripts.

## The dispatch record

A dispatch is one team run. Its record is the complete account of that run, written for the machinery, not for you: it is what you mine, audit and hillclimb against. A workshop accumulates many, and they make up most of its residue.

| Contents                 | What it holds                                                                      |
|--------------------------|------------------------------------------------------------------------------------|
| Header                   | Id, workshop, objective, team shape, outcome, duration and cost                    |
| Roster timeline          | Who was invoked and retired, when, from which body                                 |
| Entry points and reports | Every one, paired                                                                  |
| Decisions                | Ledger ids for every decision and assumption recorded from the run                 |
| Escalations              | Register ids raised or visited during the run                                      |
| Signals                  | Grouped by kind, with repeats across earlier dispatches marked                     |
| Coverage                 | The union of every report's "not checked" list: what the run as a whole did not do |
| Digests                  | Any summaries the lead or a synthesiser produced                                   |

The dispatch record is checked for **completeness, not quality**. A script can confirm that every invoked agent has an entry point and a report, every flagged decision has a ledger id, and every proposed escalation has a register id.

## The dossier: lead to human

The dossier is a presentation of one dispatch's result, derived from its record and written for you. It gives the full picture of what the team discovered or built, so you can understand the run without opening anything else, and drill down when you want to.

1. **The result** in a few lines: what was built or discovered, and whether the objective was met.
2. **Findings,** each linked to its evidence in the dispatch record.
3. **Confidence and coverage:** how sure the team is, and what the run as a whole did not check.
4. **What the lead decided on its own,** as ledger ids with one line each, so you can sample.
5. **Awaiting you:** pointers to register entries raised or visited by this run. The register is the inbox; the dossier only points to it.
6. **Recommended next,** and any promotion candidates from the run.

The dossier is judged by the dossier rubric from part one: traceable findings, items awaiting you pointed to the register, confidence stated and earned.

## Escalations

Escalations live in the global escalations register defined in part one, not in reports, dossiers or ledgers. In the handoff chain:

1. **An agent proposes** an escalation in its report, with options and a recommendation.
2. **The lead filters.** If doctrine grants the lead the decision, it decides and logs it instead. The threshold is doctrine entry D-001.
3. **The lead checks the register.** A match gets a calling card; otherwise a new entry is raised.
4. **You close it** with a ruling or "no decision"; the ruling flows back to the ledger as a decision.

Part one covers the register's anatomy, calling cards, and the policy that keeps it small.

## Human to lead

Once you stop prompting, what you send the lead becomes a small set of typed inputs, each landing somewhere durable:

| Input                      | Lands in                                                  |
|----------------------------|-----------------------------------------------------------|
| Ruling on an escalation    | Register (closed) and the workshop ledger (as a decision) |
| Doctrine edit              | Doctrine                                                  |
| Gold labels, certification | Truth                                                     |
| Promotion verdicts         | Global tiers                                              |
| New work                   | Outstanding work                                          |
| Machinery change           | Bodies, templates, hooks, settings                        |
| Redirect at orientation    | The current workshop's ledger, as a decision              |

**Chat is not a record.** Anything you say in a session that should outlive it must land in persisted state, or it vanishes and you end up saying it again: re-deciding through the back door. The lead, as single writer, transcribes your inputs at the moment you give them.

## Phase to phase

Between phases, the outgoing agents' reports are the handoff: the next phase's entry points reference them by path. For many phases, though, the native tool already does this better.

### Dynamic workflows

A dynamic workflow is a JavaScript file whose `agent()` call spawns a subagent, with options for a schema returning validated JSON, model choice, worktree or remote isolation, and an `agentType` selecting a subagent definition. `parallel()` fans out and waits for all; `pipeline()` streams each item through every stage. And they are restartable: if a workflow is interrupted, resuming the session lets it pick up where it left off.

The body and entry point pattern carries over unchanged: **the body is the `agentType`, and the entry point is the prompt.**

### Workflows or teams

| Use a workflow phase when                                       | Use a team phase when                                         |
|-----------------------------------------------------------------|---------------------------------------------------------------|
| Agents don't need to talk to each other                         | Agents must talk, argue or coordinate                         |
| Work fans out, pipelines, or is judged in a panel or tournament | Agents must persist across a phase, or share load as partners |
| You want resumability and schema-checked output for free        | The work's shape emerges as it goes                           |

A single dispatch can use both: a workflow phase feeding a team phase, or the reverse. Workflows coordinate subagents that run once and return; they have no persistent teammates or peer messaging. That is the dividing line.

Two further native pieces from the same post are relevant later: `/goal` sets a hard completion requirement (part six), and saved workflows can be distributed inside a skill as templates (part four).

## Agent to agent

Teammates can message each other directly; that is much of the point of persistent agents. But peer messages are invisible to the lead and vanish with the agents. The rule:

**Peers coordinate; reports record.** Anything decided or discovered in a peer exchange must reach a report, or it never reaches the ledger. The body's team protocol carries this rule.

## Enforcement

| Check                          | Where                                   | Guarantees                                                                                 |
|--------------------------------|-----------------------------------------|--------------------------------------------------------------------------------------------|
| Report schema validation       | Script, or a workflow's `schema` option | Malformed reports never reach the lead's context                                           |
| No completion without a report | `TaskCompleted` hook                    | Every finished task leaves a report                                                        |
| No idling without a report     | `TeammateIdle` hook                     | Nothing a teammate learned vanishes with it                                                |
| Dispatch completeness          | Script at the end of a dispatch         | Every agent has an entry point and report; every flagged decision and escalation has an id |
| Entry point fields present     | The body's ask-when-missing contract    | Weak entry points surface as questions, not wrong results                                  |

Hook events and workflow options are documented Claude Code features; the specific checks are synthesis to script against your own layout.

## Left to later sections

- **Routing:** how the lead picks a team shape and staging plan, including workflow or team phases, and starting ratios for partners.
- **The lineup:** which generic bodies the roster needs, each with its report template.
- **Failure modes:** including what goes wrong when handoffs are weak.

## Sources

- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), Anthropic Engineering. Delegation needing objective, output format, tool guidance and boundaries; duplicated work from vague tasks; storing output externally and passing references; effort scaling.
- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic, June 2026. Workflow building blocks and options, resumability, agentic laziness, `/goal`, saving workflows in skills.
- [Orchestrate teams of Claude Code sessions](https://code.claude.com/docs/en/agent-teams), Claude Code docs. Shared task list, peer messaging, idle notifications, resume limits, team hooks.
- [Automating eval design and hillclimbing with Claude](https://claude.dev/blog/automating-eval-design-and-hillclimbing/), Anthropic. Entry-point templates and bodies as hillclimbable surfaces.

The dispatch and dossier split, calling cards and the body and entry point pattern are your discoveries. The eight fields, report parts, signal kinds and enforcement checks are synthesis to trial.

Running agent teams, part three: handoffs. Drafted 1 October 2026.
