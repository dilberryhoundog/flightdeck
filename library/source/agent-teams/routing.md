Routing

1. [The oracle question](#oracle)
2. [The refining axes](#axes)
3. [Shapes as compositions](#composition)
4. [The catalogue](#catalogue)
5. [Routing as a ledger decision](#decision)
6. [Right-sizing and re-routing](#sizing)
7. [Model choice per seat](#models)
8. [Storing shapes](#storage)
9. [How shapes learn](#learning)
10. [The lineup link](#lineup)
11. [Left to later sections](#later)
12. [Sources](#sources)

# Routing

Running agent teams, part four of six. Parts one to three covered persisted truth, the locked lead and handoffs; the lineup and failure modes follow.

Routing is the lead's first real decision on any piece of work: what shape should this take? Get it right and every later part does its job. Get it wrong and a well-staged team with excellent entry points still solves the wrong problem, or solves the right one at five times the cost.

The oracle decides how a dispatch can end: proven correct, graded, measured once the oracle exists, or handed to a human with stated confidence. The other axes refine the shape within each branch.

## The oracle question

Orchestrated test-driven runs work because tests are an oracle: something deterministic says pass or fail, so the system can retry and verify without a human. Where there is no oracle, those runs fall apart. So the first question routing asks is not "is this research or a build?" but **"what will tell us the work is right?"**

| Oracle                                            | Route to                                          | How the dispatch ends                                                                    |
|---------------------------------------------------|---------------------------------------------------|------------------------------------------------------------------------------------------|
| Deterministic: tests, schemas, assertions         | Flightcrew, focused build, migration              | Proven: the tests pass                                                                   |
| A certified rubric exists                         | A judged loop: verifiers grade against the rubric | Graded: the certified judge passes it                                                    |
| An oracle could exist but doesn't yet             | Eval-driven: the first dispatch builds the oracle | Measured, once the oracle exists                                                         |
| No oracle is possible: taste, or an open question | Research, root-cause, exploration, critique       | A human choice, or a recommendation with stated confidence; never a claim of correctness |

The third row matters more than it looks. Much work routed as "judgement" could have an oracle with one dispatch's effort. When the same kind of judgement work recurs, the right move is often to build the oracle once, which moves that work up the table for good.

## The refining axes

Within each oracle branch, five axes refine the shape:

| Axis            | Question                                        | Effect on the shape                                                   |
|-----------------|-------------------------------------------------|-----------------------------------------------------------------------|
| Decomposability | Can the work split into independent pieces?     | Yes: fan out. No: a single seat or a small team.                      |
| Cross-talk      | Must agents argue or coordinate?                | Yes: a team phase. No: a workflow phase (part three).                 |
| Size            | Is the amount of work known?                    | Unknown: loop until done, with a stop condition.                      |
| Convergence     | Does it narrow to one answer, or widen to many? | Narrowing: hypotheses and refuters. Widening: fan out and synthesise. |
| Stakes          | Is it irreversible or high impact?              | Yes: add an adversarial phase with fresh agents.                      |

## Shapes as compositions

The dynamic workflows post names six patterns Claude composes workflows from. Treat them as **phases**, and treat team shapes as named compositions of them:

| Pattern                  | What it does                                                                      |
|--------------------------|-----------------------------------------------------------------------------------|
| Classify-and-act         | A classifier decides the type of task and routes to different agents or behaviour |
| Fan-out-and-synthesize   | Split into many pieces, one clean-context agent each, then merge at a barrier     |
| Adversarial verification | A separate agent checks each output against a rubric or criteria                  |
| Generate-and-filter      | Generate many candidates, then filter, dedupe and keep the best                   |
| Tournament               | Agents compete on the same task; a judge compares pairwise until one wins         |
| Loop until done          | Keep spawning until a stop condition holds, for work of unknown size              |

### What a shape specifies

| Element           | What it holds                                                           |
|-------------------|-------------------------------------------------------------------------|
| Phases            | In order; each a workflow pattern or a team configuration               |
| Staging plan      | Who is present in each phase, who retires, who joins fresh (part two)   |
| Seats             | Each seat a body plus a variant, never a bespoke agent (part two)       |
| Partner ratios    | Starting ratios for phases where consumers can't keep up with producers |
| Oracle            | What ends the dispatch, from the table above                            |
| Budget and models | Rough cost, and a default model per seat                                |
| Taste points      | Where, if anywhere, the shape deliberately hands a choice to the human  |

## The catalogue

Shapes group into four families. Phases are written as they run, with "fresh" marking agents that join without having seen earlier phases.

### Build

| Shape         | Phases                                                                                                                    | Oracle                   | Use when                                                     |
|---------------|---------------------------------------------------------------------------------------------------------------------------|--------------------------|--------------------------------------------------------------|
| Flightcrew    | A standalone dispatch option; its internals are out of scope here                                                         | Tests                    | Substantial, test-driven builds                              |
| Focused build | Builder, then reviewer (fresh)                                                                                            | Tests, plus the reviewer | Small, well-understood changes that don't justify flightcrew |
| Migration     | Classify the call sites; fan out one builder per fix, each in its own worktree; adversarial review per fix (fresh); merge | Tests                    | Large mechanical changes with many independent sites         |

The migration shape is the one the dynamic workflows post describes for code migrations: a subagent per fix in a worktree, adversarial review, then merge. Where the tests are good enough, a migration may simply go to flightcrew.

### Understand

| Shape                      | Phases                                                                                                       | Oracle                                                        | Use when                               |
|----------------------------|--------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|----------------------------------------|
| Investigation and research | Fan out on disjoint angles; synthesise; adversarially verify the claims (fresh)                              | Claim verification; confidence stated                         | Open questions that widen              |
| Root-cause                 | Hypotheses from disjoint evidence; a panel of verifiers and refuters per hypothesis; loop until one survives | The surviving hypothesis, ideally confirmed by a reproduction | A failure with an unknown cause        |
| Deep verification          | Extract claims; one checker per claim; optional source auditor behind each                                   | Per-claim verdicts                                            | Checking a document, report or dossier |

Root-cause gets its own shape because it converges where research widens. The post's version builds hypotheses from separate evidence (logs, files, data) precisely to avoid self-preferential bias in a single context, then puts each before verifiers and refuters.

### Decide

| Shape                 | Phases                                                                                                  | Oracle                                                | Use when                                     |
|-----------------------|---------------------------------------------------------------------------------------------------------|-------------------------------------------------------|----------------------------------------------|
| Exploration and taste | Generate many candidates; filter by rubric; tournament; the human picks from the finalists              | A taste rubric, then a scheduled human choice         | Design, naming, choosing between approaches  |
| Critique              | Several adversaries in parallel, each from a different perspective (fresh); synthesis of the objections | None; ends in a list of objections ranked by severity | Plans, specs and proposals before commitment |

Exploration's final human pick is a **scheduled taste point**: part of the shape from the start, not an escalation. It still appears in the escalations register so you have one inbox, but nobody needs calling cards to get your attention for it.

### Maintain

If the human improves the machinery, the machinery work needs routing too, or it falls back on you. These shapes run the system itself.

| Shape                | Phases                                                                                                                            | Oracle                              | Use when                                                                               |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------|-------------------------------------|----------------------------------------------------------------------------------------|
| Eval-driven          | `/claude-api build-eval` with human approval of inputs and grader; then `/claude-api hillclimb` with a train and test split       | The eval, once certified            | Harnesses, bodies, entry-point templates, skills: any text surface you want to improve |
| Audit                | One verifier per doctrine entry or rule (fresh); a skeptic filters false positives                                                | Confirmed violations                | Periodic doctrine and ledger checks (part one)                                         |
| Mining and promotion | Fan out over residue for candidates; adversarially test each ("would a fresh session decide worse without this?"); conflict check | The promotion test                  | Workshop close, or periodic sweeps                                                     |
| Triage               | Quarantined readers classify, dedupe and summarise; an actor fixes or escalates                                                   | Each item handled or escalated      | The machinery queue of signals, the register, outstanding work                         |
| Drill                | A deliberately small run of another shape, done once                                                                              | Mechanics behave as the manual says | New mechanics or a platform version change (part two)                                  |

## Routing as a ledger decision

The lead classifies the work itself rather than handing it to a classifier agent. Routing is exactly the kind of choice the ledger exists for: options considered, a reason, and a condition that would change it.

```
### L-W07-014  decision  active
statement: Route the dependency audit as a workflow fan-out, not a team.
options: investigation (team) | deep verification (workflow) | focused build
why: The oracle is per-package verdicts; findings don't need cross-talk; size
  is known (43 packages).
doctrine: D-007 (native first), D-003 (cheapest shape that satisfies the oracle)
truth: R-audit-report v2
reversibility: high
reopen: synthesis finds more than two findings that depend on each other;
  re-route as an investigation team
evidence: reports/audit-plan.md
author: lead, 2026-10-01
```

The `reopen` field is what makes mid-flight re-routing principled rather than improvised: the lead committed in advance to the evidence that would change its mind.

## Right-sizing and re-routing

### The cheapest shape that satisfies the oracle

The dynamic workflows post is direct about this: workflows can use significantly more tokens, most ordinary coding tasks don't need a panel of five reviewers, and parallelism and specialisation have to earn their coordination cost. Anthropic's research system found multi-agent runs consume many times the tokens of a single chat: worth it for broad, parallel work, wasteful for tightly interdependent work. Make it doctrine, so the lead picks small shapes without hesitation:

```
## D-003 Cheapest shape that satisfies the oracle
kind: principle
statement: Route to the smallest shape whose oracle can establish the work is
  right. Add phases only for stakes, size or cross-talk the work actually has.
intent: Multi-agent runs cost many times a single session; the extra cost must
  buy something the oracle needs.
grants: The lead may route to a single seat or focused build without
  justification beyond this entry.
bounds: An adversarial phase is required for irreversible or high-impact work.
reopen: Dispatch records show small shapes repeatedly missing what larger
  ones would have caught.
```

### When unsure, investigate first

If the work's shape is genuinely unclear, the first dispatch is a small investigation whose deliverable is a routing recommendation. That is cheaper than starting in the wrong shape.

### Split mixed work

"Find out why checkout is slow and fix it" is a root-cause dispatch followed by a build dispatch: two shapes in sequence, each with its own oracle. Hybrid shapes that try to do both blur the oracle and the staging.

### Re-route mid-flight

When the routing decision's reopen trigger fires, the lead re-stages: retire seats that no longer fit, bring in fresh ones, and write a superseding ledger entry. Agents can raise the issue from inside the run with a new signal kind:

| Kind             | Example                                                     | Routes to                                                                             |
|------------------|-------------------------------------------------------------|---------------------------------------------------------------------------------------|
| Routing friction | "This shape doesn't fit: the findings depend on each other" | The lead immediately, as a possible reopen; across dispatches, the shape's definition |

This extends the signal kinds in part three.

## Model choice per seat

Each seat in a shape carries a default model. The dynamic workflows post describes classifiers that route to Sonnet or Opus by expected complexity, and workflow `agent()` calls take a model option directly. Sensible defaults:

- **The lead** is always the frontier model; routing and staging are where intelligence pays most.
- **Fan-out seats** (explorers, per-item checkers, generators) default to cheaper models; there are many of them and each task is small.
- **Synthesis and judging seats** default higher; they carry the whole run's quality. A judge never runs on the model whose output it judges (part one).

The entry point may override a seat's default when the lead has a reason, and records that reason in the ledger. Seat-level model choice is also a hillclimbing target: the eval post's cost example stepped down model tiers while quality held.

## Storing shapes

The native home for a shape is a skill. The dynamic workflows post describes saving workflows and distributing them inside a skill folder, referenced from its `SKILL.md`, and recommends prompting Claude to treat them as templates rather than scripts to run verbatim. That fits shapes exactly:

```
skills/shape-root-cause/
  SKILL.md                    when to use, phases, staging plan, seats, oracle,
                              budget, models, taste points
  hypotheses.workflow.js      template for the fan-out over disjoint evidence
  refute.workflow.js          template for the verifier and refuter panel
  team-phase.md               spec for any team phase: seats, partners, ratios
```

Workflow phases live as templates; team phases, which workflows can't express because workflows coordinate single-return subagents, live as specs the lead stages by hand. The lead adapts the template to the work rather than executing it blindly. A routing skill that indexes the catalogue (one line per shape, with its oracle and when to use it) sits in the lead's operating manual.

## How shapes learn

### Partner ratios from evidence

No fixed numbers here, deliberately. Every dispatch record holds a roster timeline (part three), so idle consumers and backed-up queues are visible after the fact. Each shape starts with a ratio; observed ratios flow back through the ledger; a ratio that holds across several dispatches is promoted into the shape's skill.

### Improvised shapes become named shapes

When no shape fits, the lead composes one from the six patterns and records the composition in the ledger. If the same improvisation recurs across workshops, the mining shape surfaces it, and it is promoted into the catalogue as a new skill. The catalogue grows from evidence, the same way doctrine does.

### Shapes are hillclimbable

A shape's skill is text, and its outcomes are recorded in dispatch records. With a certified eval for the kind of work it handles, the eval-driven shape can improve a shape's staging, ratios and model choices the same way it improves a body.

## The lineup link

Shapes name seats, and every seat is a generic body plus a variant. So the lineup must cover every seat across the catalogue:

- A shape needing a body that doesn't exist is a **lineup gap**, resolved by adding or extending a generic body, never by inventing a bespoke agent for one shape.
- A body that no shape uses is a candidate for retirement.
- The same body serves many shapes through different variants: the adversary body appears in focused build, migration, research, critique and audit.

## Left to later sections

- **The lineup:** the generic bodies that fill every seat in this catalogue, each with its purpose, setup and report template.
- **Failure modes:** including misrouting, over-sized shapes, and shapes that never end because the oracle was unclear.

## Sources

- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic, June 2026. The six patterns, the use cases behind migration, research, root-cause, deep verification, critique, audit and triage, model routing, when not to use workflows, and saving workflows in skills as templates.
- [Automating eval design and hillclimbing with Claude](https://claude.dev/blog/automating-eval-design-and-hillclimbing/), Anthropic, September 2026. The `build-eval` and `hillclimb` commands behind the eval-driven shape, and cost hillclimbing across model tiers.
- [How we built our multi-agent research system](https://www.anthropic.com/engineering/multi-agent-research-system), Anthropic Engineering. Token cost of multi-agent runs and where they pay off.

The oracle-first routing question grows out of your orchestrator work. The four families, shape specification, routing as a ledger decision, D-003, storing team phases as specs beside workflow templates, and the learning loops are synthesis to trial. Flightcrew is treated as an opaque dispatch option.

Running agent teams, part four: routing. Drafted 1 October 2026.
