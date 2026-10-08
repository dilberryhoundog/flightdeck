The lineup

1. [Seats become stances](#derive)
2. [The eight bodies](#bodies)
3. [Coverage matrix](#matrix)
4. [The shared core](#core)
5. [Lens cards](#lenses)
6. [One body, two modes](#modes)
7. [Per-body enforcement](#enforce)
8. [Who writes the dossier](#dossier)
9. [Governance](#governance)
10. [Left to later sections](#later)
11. [Sources](#sources)

# The lineup

Running agent teams, part five of six. Parts one to four covered persisted truth, the locked lead, handoffs and routing; failure modes follow.

The lineup is not invented; it is derived. Part four's catalogue lists every seat any shape needs. The lineup is the smallest set of generic bodies that fills all of them, with lens cards supplying the variety and one shared core supplying the mechanics.

Every invoked agent is four layers. The lower the layer, the more agents share it and the more valuable it is to improve.

## Seats become stances

Across the catalogue there are roughly eighteen seats: builder, reviewer, migration classifier, adversary, refuter, critique perspectives, explorer, hypothesis generator, residue miner, triage reader, triage actor, claim checker, rule verifier, source auditor, skeptic, synthesiser, generator and judge. Most differ only in lens, and lens belongs in a lens card and the entry point.

What separates bodies is **stance**: what the agent is trying to do to the material in front of it. Stance decides tools, model, report shape, and whether the agent must join fresh. Grouping seats by stance gives seven bodies, plus the lead.

## The eight bodies

### Explorer

| Stance     | Find and map; never change anything.                                                                |
|------------|-----------------------------------------------------------------------------------------------------|
| Seats      | Explorer, hypothesis generator, residue miner, triage reader, migration classifier, claim extractor |
| Tools      | Read, Grep, Glob, WebSearch, WebFetch. Read-only makes it the natural quarantine reader (part two). |
| Model      | Cheap by default; explorers fan out widely.                                                         |
| Joins      | Early; retired before builders arrive so dead ends don't travel.                                    |
| Report     | Coverage first: what was searched, what wasn't. Findings as pointers with evidence.                 |
| Lens cards | Codebase, docs and web, residue mining, logs, data, hypothesis-from-evidence                        |

The hypothesis lens matters most: in the root-cause shape, each explorer gets one body of evidence and must form its hypothesis from that alone. Disjoint evidence is what defeats self-preferential bias.

### Builder

| Stance     | Make the change, and prove it against the oracle.                                                           |
|------------|-------------------------------------------------------------------------------------------------------------|
| Seats      | Builder, migration-site fixer, triage actor, test writer, machinery tuner                                   |
| Tools      | Read, Grep, Glob, Edit, Write, Bash. The only body that writes to work product.                             |
| Model      | Mid-tier by default; the lead raises it for hard changes.                                                   |
| Joins      | After exploration and planning; in a worktree whenever builders fan out.                                    |
| Report     | Oracle evidence: which tests ran, with what result. "Done" means the oracle passes, not "I think it works". |
| Lens cards | Feature, fix, migration site, test-first, machinery (bodies, templates, skills under hillclimbing)          |

The machinery lens is the builder working on the system itself: running `/claude-api hillclimb` against a body, an entry-point template or a shape skill.

### Adversary

| Stance     | Find ways the target fails, open-ended.                                                                                               |
|------------|---------------------------------------------------------------------------------------------------------------------------------------|
| Seats      | Adversary, refuter, critique perspectives                                                                                             |
| Tools      | Read, Grep, Glob, Bash for reproductions. It may write only to a scratch area (enforced by a scoped hook); it never edits the target. |
| Model      | Mid-tier; raised for security or high-stakes targets.                                                                                 |
| Joins      | Always fresh, after the target exists.                                                                                                |
| Report     | Every finding has severity, evidence and a reproduction.                                                                              |
| Lens cards | Security, spec, scale, refute-a-hypothesis, investor, customer, competitor                                                            |

### Verifier

| Stance     | Answer a bounded question with a verdict.                             |
|------------|-----------------------------------------------------------------------|
| Seats      | Claim checker, rule verifier, source auditor, code reviewer, skeptic  |
| Tools      | Read, Grep, Glob, Bash to run checks, WebFetch for source audits.     |
| Model      | Cheap for per-item checks; higher for review.                         |
| Joins      | Fresh.                                                                |
| Report     | One verdict per question: pass or fail, with the reason and evidence. |
| Lens cards | Claim, rule, source, code review, skeptic                             |

Verifier and adversary differ in a way that matters: the adversary hunts for failure; the verifier checks stated criteria. The skeptic is a verifier whose target is other agents' findings: is each flag a real violation?

### Judge

| Stance     | Grade against a certified rubric, or compare two outputs.                     |
|------------|-------------------------------------------------------------------------------|
| Seats      | Tournament judge, judged-loop grader, exploration filter, eval grader         |
| Tools      | Read only.                                                                    |
| Model      | Never the model whose output it judges (part one).                            |
| Joins      | Fresh; blind to which output is the baseline in pairwise comparisons.         |
| Report     | A verdict per rubric claim with reasoning, or a pairwise pick with reasoning. |
| Lens cards | One per certified rubric                                                      |

The judge is separate from the verifier because certification attaches to a rubric and judge pair. Change the judge body and every rubric it grades must re-earn certification, so it should change rarely.

### Generator

| Stance     | Produce many distinct candidates: breadth, not correctness.                   |
|------------|-------------------------------------------------------------------------------|
| Seats      | Exploration, generate-and-filter, tournament entrant                          |
| Tools      | Read, plus Write to a candidates area.                                        |
| Model      | Varied deliberately; different models produce different candidates.           |
| Joins      | Early in decide shapes.                                                       |
| Report     | A candidate list, one line of rationale each, with near-duplicates collapsed. |
| Lens cards | Naming, design direction, approach, wildcard                                  |

The body pushes against early convergence: a generator that returns five versions of one idea has failed its stance.

### Synthesiser

| Stance     | Merge many reports into one without losing dissent.                                     |
|------------|-----------------------------------------------------------------------------------------|
| Seats      | Research synthesis, objection ranking, dispatch digest, optionally the dossier          |
| Tools      | Read, plus Write to its output path only.                                               |
| Model      | High; it carries the whole run's quality.                                               |
| Joins      | At the barrier, after every input report exists.                                        |
| Report     | The synthesis, with conflicts between sources preserved and named, never averaged away. |
| Lens cards | Research, objections, digest, dossier                                                   |

### Lead

Covered in part two: the frontier model that routes, stages, writes entry points, records the ledger and escalates, locked out of doing.

## Coverage matrix

Every seat in part four's catalogue, filled by a body and lens. Flightcrew is an opaque dispatch option and is not mapped.

| Shape                | Explorer           | Builder           | Adversary               | Verifier               | Judge           | Generator | Synthesiser      |
|----------------------|--------------------|-------------------|-------------------------|------------------------|-----------------|-----------|------------------|
| Focused build        |                    | builds            |                         | reviews                |                 |           |                  |
| Migration            | classifies sites   | fixes per site    | reviews per fix         |                        |                 |           |                  |
| Research             | fans out           |                   |                         | checks claims          |                 |           | synthesises      |
| Root-cause           | hypothesises       | reproduces        | refutes                 | verifies               |                 |           |                  |
| Deep verification    | extracts claims    |                   |                         | checks, audits sources |                 |           |                  |
| Exploration          |                    |                   |                         |                        | filters, judges | generates |                  |
| Critique             |                    |                   | attacks per perspective |                        |                 |           | ranks objections |
| Eval-driven          | gathers cases      | tunes the surface |                         |                        | grades          |           |                  |
| Audit                |                    |                   |                         | per rule, skeptic      |                 |           |                  |
| Mining and promotion | mines residue      |                   | tests candidates        | conflict check         |                 |           |                  |
| Triage               | reads, quarantined | acts              |                         |                        |                 |           |                  |

## The shared core

Part two listed what every body must carry: entry-point parsing, team protocol, the reporting contract, signals, decision flagging, escalation, and done and idle behaviour. Copy that into eight bodies and you rebuild the "ten adversaries" drift one level up. So the mechanics live in **one source**, injected into every agent at start, and each body holds only its stance.

### Injection by hooks

Hooks inject the core, because they run deterministically on every invocation path, outside the agent's judgement:

- **`SessionStart`** can return `additionalContext`, and its input includes `agent_type` (Claude Code 2.1.2 and later). One agent-aware script reads which body is starting and injects the core plus that body's report template. This covers the lead started with `--agent`.
- **`SubagentStart`** can also inject `additionalContext`, covering bodies invoked as subagents and workflow `agentType`s.

Both events call the same script reading the same source, so every agent gets identical mechanics whichever way it was invoked.

**Why not the `skills` frontmatter field?** It preloads full skill content into a subagent at startup, but a reported bug (v2.1.144) shows the preload is skipped when the same agent runs as the main session through `--agent`. That is exactly how the lead runs. Hooks avoid the split.

### What the core contains

| Section                   | Content                                                                                                                 | Defined in           |
|---------------------------|-------------------------------------------------------------------------------------------------------------------------|----------------------|
| Entry point contract      | The eight fields; ask the lead if any is missing or ambiguous                                                           | Part three           |
| Mode                      | Team or workflow behaviour, read from the entry point's stage field                                                     | Below                |
| Team protocol             | Claiming tasks, whom to message, peers coordinate and reports record                                                    | Parts two and three  |
| Reporting contract        | The six report parts; final message is three lines plus the report's location                                           | Part three           |
| Signals                   | The seven kinds and their format                                                                                        | Parts three and four |
| Decisions and escalations | Flag decisions and assumptions; propose escalations with options and a recommendation; leave calling cards on open ones | Part one             |
| Doctrine digest           | Statements and grants, so agents know what they may decide                                                              | Part one             |
| Done and idle             | No completion or idling without a report                                                                                | Part two             |

### Things to verify with a drill

- Whether `SessionStart` fires for teammates spawned in a team, and with which `agent_type`.
- Whether the core survives compaction. One practitioner notes that agents can dismiss session-start context as pressure builds; if it fades, re-inject after compaction.
- That a body's tool allowlist doesn't strip the native team coordination tools a teammate needs.

## Lens cards

A lead that writes "security lens" from scratch on every dispatch produces a slightly different adversary every time, even with a stable body. That is the "entry point only" anti-pattern from part two, one layer up. Lens cards fix it: short, reusable entry-point fragments, one library per body.

```
## lens: adversary/security  v3
covers: authentication, session handling, injection, authorisation bypass,
  secrets exposure, replay
method: for each class, attempt at least one concrete attack with a
  reproduction; record classes not applicable and why
severity: high = exploitable without credentials; medium = needs a valid
  session; low = needs privileged access
done_hint: every class attempted or ruled out
model_hint: raise to frontier for auth-critical targets
```

The lead picks a card and adds the target-specific fields: objective, boundaries, roster, inputs, truth, done, report. Cards are stable enough to compare across runs, versioned, and hillclimbable. New lenses start improvised in entry points; a lens that recurs is promoted to a card, the same loop as shapes and doctrine.

## One body, two modes

The same definition serves both team phases and workflow phases: in a team it is the definition a teammate is spawned from; in a workflow it is the `agentType`. Behaviour differs:

|           | Team mode                                 | Workflow mode                                              |
|-----------|-------------------------------------------|------------------------------------------------------------|
| Peers     | May message named agents                  | None                                                       |
| Task list | Claims and completes tasks                | None                                                       |
| Output    | Report file plus three-line final message | Often schema-checked JSON, plus a report file where useful |
| Lifetime  | Persists until retired                    | Runs once and returns                                      |

The entry point's stage field states the mode, and the shared core covers both, so bodies stay mode-agnostic.

## Per-body enforcement

Agent frontmatter supports hooks scoped to that agent and a maximum turn count. That lets each stance carry its own enforcement:

| Body      | Scoped enforcement                                                        |
|-----------|---------------------------------------------------------------------------|
| Builder   | Cannot finish without oracle evidence in its report                       |
| Adversary | Writes allowed only in its scratch area; every finding has a reproduction |
| Verifier  | Every question in the entry point has a verdict                           |
| Judge     | Refuses to run if its model matches the model under judgement             |
| Explorer  | Report includes a coverage section                                        |
| All       | A turn cap backs up the entry point's effort field with a hard budget     |

Scoped hooks and turn caps are frontmatter features listed in community references to the subagent docs; confirm field names against the current docs before relying on them.

## Who writes the dossier

Part three assigned the dossier to the lead. The synthesiser is a reasonable alternative, and the choice can be left per dispatch rather than hard-coded:

| Option                                    | Strength                                                                                         | Cost                                                                             |
|-------------------------------------------|--------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| Lead writes it                            | The agent with the whole picture presents it; no extra handoff                                   | The lead reads more of the dispatch record, against part two's budget on looking |
| Synthesiser drafts, lead reviews and owns | Heavy reading moves out of the lead's context; dossier quality becomes a hillclimbable lens card | One more agent; the lead must still check the draft against what it knows        |

A sensible default: the lead writes dossiers for small dispatches, and hands larger ones to a synthesiser with the dossier lens. Either way, the dossier rubric from part one judges the result.

## Governance

- **Adding a body** requires a seat that no existing body plus a lens card can fill. Otherwise, write a lens card.
- **Retiring a body:** one that no shape uses is a candidate for retirement.
- **Every body has an eval,** so it can be hillclimbed. The shared core is the most valuable surface of all, since every agent runs it.
- **Versioning:** every dispatch record notes the version of each body, lens card and the shared core that ran, so outcomes are attributable.
- **Changing the judge body is rare** by design, because it triggers recertification of every rubric it grades.

## Left to later sections

- **Failure modes:** including body drift, lens sprawl, core fade after compaction, and a lineup that grows bespoke agents.

## Sources

- [Create custom subagents](https://code.claude.com/docs/en/sub-agents), Claude Code docs. Agent definitions, frontmatter fields and preloading skills.
- [Issue 60477](https://claudeissues.com/issue/60477-subagent-skills-frontmatter-preload-is-skipped-when-the-agent-runs-as-the-main-s): `skills` preload skipped when an agent runs as the main session through `--agent` (reported on v2.1.144).
- Community hook references (smithery.ai hooks-configuration, mcp.directory hook-developer, skillselion hook-authoring): `SessionStart` and `SubagentStart` returning `additionalContext`, and `agent_type` in `SessionStart` input. Verify against the official hooks docs.
- [dreamcontext, The Hook Mechanism](https://github.com/meanllbrl/dreamcontext/wiki/The-Hook-Mechanism): practitioner notes on session-start context fading under pressure.
- [A harness for every task: dynamic workflows in Claude Code](https://claude.dev/blog/a-harness-for-every-task-dynamic-workflows-in-claude-code/), Anthropic. Workflow `agentType`, root-cause from disjoint evidence, skeptic verifiers.

The body and entry point pattern and hook-injected mechanics are your design. The stance grouping, the coverage matrix, lens cards and per-body enforcement are synthesis to trial.

Running agent teams, part five: the lineup. Drafted 1 October 2026.
