# Agentic workflows: feature map and prediction test

Written 2026-10-07: a synthesis of five research reports and their adversarial reviews, for the developer of flightdeck, an accelerator layered over Claude Code. The developer's earlier attempts were an orchestrated test-driven build runner, then a locked lead agent that dispatches teams. Their prediction: "a few core features will settle, showing us that these things need building out individually over time, and are able to improve in isolation."

Citations: A to E are the five reports in this folder, X is `adv-cross.md`, adv-A to adv-E are the adversary's files. No fact comes from elsewhere. "Inference" marks this document's own reasoning.

## Lead's rulings after the adversary's review

The adversary attacked this synthesis in `adv-SYNTHESIS.md` (1 high, 6 medium, 5 low). The text below is left as written; read it with these rulings.

- **Section 3, "improve in isolation", is overturned.** The reports show that no public study measures one feature's effect alone. That is a gap in the evidence, not a finding that features cannot be improved one at a time, and the reports show them being revised one at a time. What holds: knowing whether a change helped needs a measurement, so evals grow beside the features, from real failures, rather than before them.
- **The build order in section 3 is the synthesiser's design.** Treat it as one option, not a result.
- **"There are ten" is a choice of granularity** inherited from the adversary's merge groups, not a count the field agrees on.
- **Settling is understated.** Cross-vendor standards exist for instruction files (AGENTS.md), skills (Agent Skills) and tool connection (MCP) (B, C).
- **Feature 8 merges two things the sources keep apart:** deterministic limits (permission rules, sandbox, isolation, hooks) and supervised or probabilistic gates (approval prompts, the auto-mode classifier).
- **Feature 1 drops a caveat:** B reports Kiro and Jules moving away from human approval of plans.
- **Section 4's retrieval-memory line is under-supported:** the cited replacement by Grep concerns codebase search, not memory across sessions.
- **Section 7a misses** that `.cockpit/base/` holds a settings file and a write guard carried from the first cockpit, which reaches for containment.

## 1. What "agentic workflows" means

The sources converge: an agent or team of agents is given a goal and a scope of permitted action, chooses its steps at run time using tools and a feedback loop, and produces a reviewable artifact without a human driving each step (B, E). Practitioners add that the workflow is the structure around the model call: spec, plan, memory, roles, loops (C).

Four senses to keep apart:

- **Anthropic's 2024 sense.** A workflow is a predefined code path, an agent directs itself, and "agentic workflow" is the spectrum between (A).
- **The introductory sense.** Any multistep, goal-directed run with steps chosen at run time (E).
- **The product sense.** A vendor's unit of work: a repository event (gh-aw), a spec (Kiro), a multi-day goal (Devin, Factory) (B).
- **The Claude Code feature.** "Dynamic workflows", one native mechanism in which a script holds the plan (A).

The widest agreement is guidance: start with the simplest design and add agents only when it fails (A, C, E).

## 2. Core features

Nine capabilities appear in at least three reports; a tenth, evals, is borderline. Merges follow X. Ratings use D's scale, the only one defined: strong = several independent sources; moderate = first-party data; thin = a vendor claim or single post. A and D rate the same telemetry differently (X5). Convergence and effect (evidence that it improves outcomes) are rated separately: no report has independent evidence of effect (X). A native feature shown without a status has none in the reports. Approval gates also recur, but the reports disagree on whether they work (section 6).

### 1. Plan, then approve

A written plan or spec a human approves before edits begin.

**Evidence.** A, B, C, D; E's "Planning" means run-time decomposition (X). Convergence strong; effect thin, one case study and vendor reports (C).

**Native.** Plan mode (A).

**Added.** Spec artifact sets and task breakdowns (Kiro, Spec Kit, BMAD); plan critics (Jules) (B, C).

**Dependence.** Stands alone; supplies the criterion features 2 and 3 judge against (inference).

### 2. Review by a separate agent

A fresh-context agent judges the work, not its author.

**Evidence.** A, B, D: convergence strong; effect vendor-only (A rates it strong, D thin). Self-judging agents "tend to respond by confidently praising the work" (A; Anthropic, 24 Mar 2026).

**Native.** `/code-review`, review subagents; Code Review for PRs, `/code-review ultra` (research preview) (A, adv-A N3, adv-D).

**Added.** PR-triggered review bots, CI fixers, per-milestone validation (B).

**Dependence.** Entangled: runs on subagents (5) and needs a criterion (1 or 3).

### 3. Loop to a completion condition

The agent re-runs until a stated condition is judged met or a cap is hit.

**Evidence.** A, C, D: convergence moderate; effect thin, one practitioner anecdote (C).

**Native.** `/goal`, `/loop`, Stop hooks; the official `ralph-loop` plugin (A, C).

**Added.** Little; the community Ralph loop was absorbed (C). Open: a judge that runs commands, which D infers `/goal` cannot.

**Dependence.** A composition: `/goal` is "a wrapper around a session-scoped prompt-based Stop hook" (A), so a hook (7) plus a judge (2).

### 4. Triggers

Work starts from a schedule or external event, not a typed prompt.

**Evidence.** A, B, D: convergence strong, by a different mechanism at each vendor (B); no effect measured.

**Native.** Routines and channels (research preview); desktop scheduled tasks, cron tools, GitHub Actions (A).

**Added.** More event sources (Slack, Jira, webhooks); gh-aw, which can run Claude Code as its engine (B).

**Dependence.** Stands alone; unattended starts need feature 8 first (inference).

### 5. Multi-agent orchestration

Several agent sessions on one task, coordinated by a lead agent, a script or peers.

**Evidence.** A, B, C, E: convergence strong; effect mixed and vendor-only. A lead with subagents beat a single agent by 90.2% "on our internal research eval" at about 15 times the tokens of chat; swarms on interdependent code mostly did poorly (A; Anthropic, 13 Jun 2025 and 13 Aug 2026).

**Native.** Subagents, dynamic workflows; agent teams (experimental); Projects (public beta) (A).

**Added.** Swarm coordinators and parallel-session managers (C); a fresh worker per unit (B; Factory).

**Dependence.** The most entangled: needs handoff artifacts (6) and isolation (8); feature 2 runs on it.

### 6. Context and memory

What the model reads in a run and what persists between runs: instruction files, compaction, fresh context per work unit, session persistence. B calls the last three distinct mechanisms, "not one feature."

**Evidence.** A, B, C, E: convergence strong; effect thin, "practitioner advice, no controlled study" (C).

**Native.** CLAUDE.md, auto memory, `/compact`, automatic compaction (A).

**Added.** AGENTS.md (B); rules paired with hook or CI enforcement (C); handoff files (A).

**Dependence.** Instruction files stand alone; resets and handoffs are tied to feature 5.

### 7. Extension surface

The units everything else ships in: skills, hooks, MCP servers and subagent definitions, bundled as plugins.

**Evidence.** A, B, C, E: convergence and adoption strong; effect "unreplicated" (C).

**Native.** Skills, plugins, MCP, command hooks; agent hooks (experimental); mods (shipped 1 Oct 2026) (A).

**Added.** Skill and plugin collections and MCP servers (C).

**Dependence.** Stands alone; every other feature is built from it.

### 8. Guardrails and containment

Deterministic limits on what an agent can reach, set in the environment: permissions, sandbox, isolation, hooks as gates.

**Evidence.** A, B, D, E: convergence strong; effect moderate, self-reported. Users approved "roughly 93% of permission prompts"; auto mode lets about 17% of overeager actions through (A, D; Anthropic, 25 May 2026).

**Native.** Permission modes, sandboxed Bash, auto mode, command hooks (A).

**Added.** A staged write path (gh-aw), a VM per task, autonomy levels (B).

**Dependence.** Stands alone; a precondition for features 3, 4 and 5 when unattended (inference).

### 9. Evals (borderline)

Fixed, scored cases run against the agent system itself, to tell whether a change helped.

**Evidence.** A and D as a feature; E as an unmet need, "cross-run outcome tracking"; X counts two reports. Effect moderate: "convergent guidance, anecdotes, no controlled study" (D).

**Native.** `claude plugin eval` with a no-plugin baseline (shipped Sep 2026); the claude-api skill's `hillclimb` (A, D).

**Added.** Third-party eval platforms (D); OpenAI's hosted Evals shuts down 30 Nov 2026 (B, D).

**Dependence.** Needs transcripts (10) and a packaged unit to test (7).

### 10. Observability

A record of what agents did, and a view of which sessions need a human.

**Evidence.** B, D, E; A has no entry (X). Convergence moderate, effect thin (D).

**Native.** OpenTelemetry and audit logging (E); agent view (research preview) (A, D).

**Added.** Tracing platforms and Factory's "Mission Control" (B, D).

**Dependence.** Stands alone; feature 9 depends on it.

## 3. The prediction, tested

**"A few core features will settle": half supported.** The categories recur, but there are ten, and the mechanisms have not settled: many native features are preview, beta or experimental (A), OpenAI's Agent Builder was deprecated eight months after launch (B; OpenAI deprecations page), and community add-ons keep being absorbed into the native harness (C).

**"Built out individually": supported for six, not four.** Features 1, 4, 7, 8, 10 and the instruction files in 6 can each be built without the others. Four are compositions: a loop is a hook plus a judge; review is a subagent plus a criterion; multi-agent needs handoff artifacts and isolation, and pays only for independent, parallel work (A); evals need transcripts and a packaged unit.

**"Improve in isolation": not supported by evidence.** Improving one feature alone requires measuring its effect alone, and no report has that: "Stars and downloads measure attention, not outcomes" (C); "no controlled study" (D). A method exists: change one thing at a time against a held-out set (A) and compare with a no-plugin baseline (A, D). So isolation is available only through evals, which makes feature 9 a dependency of the other nine. The native layer is a second coupling: Anthropic removed over 80% of Claude Code's system prompt for newer models (A; claude.dev, 24 Jul 2026), so a release can invalidate a tuned add-on.

**Order of building this implies (inference):**

1. Extension surface and instruction files; everything ships through them.
2. Evals and transcripts, before the features they measure; start with 20 to 50 cases from real failures (D; Anthropic, 9 Jan 2026).
3. Guardrails, before anything runs unattended.
4. Plan approval and separate-agent review.
5. Loops and triggers.
6. Multi-agent last: it costs the most tokens, has the most dependencies and rests on experimental and preview mechanisms. The earlier attempts started here (section 7a).

## 4. Not core

- **Swarm coordinators and headline multipliers.** Ruflo's own audit found performance claims "largely hardcoded doc strings"; "10x" productivity figures are single-source (C). Whether Ruflo's tools are stubs is open (adv-C N1).
- **Vendor bets** (B): gh-aw's compile step, Kiro's EARS specs, Amp's modes, Factory Missions, OpenAI's Agents API.
- **Retrieval memory.** Promoted by database vendors (E); Anthropic replaced it with a Grep tool (adv-E N1).
- **Self-reflection.** Evidence from 2023 (C); A finds self-review unreliable.
- **Mods.** Days old; "The API can change between releases" (A).

## 5. Gaps

No report covers:

- Cost and budget controls in Claude Code; only iteration and turn caps appear (X). B's budget findings cover other vendors (X6).
- Supply-chain trust for plugins, skills and MCP servers; checkpoints and rewind; independent evidence of effect (X).
- A tested escalation policy; where human time goes in orchestrated runs (D).
- Which native features are generally available.

The native harness lacks, per the reports:

- Human approval inside a scripted workflow: "No mid-run user input" (E); Kiro and Factory ship it (X4).
- A per-step retry ceiling with escalation (E); overstated, says adv-E N2, since workflow scripts are plain JavaScript.
- Scored outcomes tracked across runs (E); partly covered by `claude plugin eval` (adv-E N3).

## 6. Unsettled

- **Is the pull request a working review gate (X1)?** B: "Strong for agents that publish work." D: a study found most AI-generated PRs get no review (arXiv 2605.02273).
- **Self-review or a separate judge (X2)?** E's sources list reflection, the agent judging its own output, as a building block. A says self-evaluation praises its own work, and D that the native separate judge can accept unverified claims.
- **Do approval gates work (X3)?** E lists human approval as a building block. A and D report about 93% of prompts approved, with attention falling. D also cites, unreconciled, a 2025 field study finding no evidence that decision quality falls with decision count (WorkOS, 5 Aug 2026).
- **Does coordination beat independent agents?** A reports coordinating agents found 266 vulnerabilities against 21 for independent ones (Anthropic, 13 Aug 2026). adv-A N1: about half were outside the core directories and, limited to those, "the two methods seem comparable in terms of tokens per vulnerability found."
- **Elsewhere.** X4 and X6: section 5. X5: section 2. Also open: adv-A N2, adv-B N2 and adv-D's new findings, all minor.

## 7. Flightdeck

Everything in flightdeck is an experiment, so no room name below, old or new, is a requirement. This section is inference.

### 7a. What the old structure shows

A reading of `flightdeck/STRUCTURE.md`, an outdated directory map, with the `.cockpit/` rooms beside `flightdeck/.cockpit/constitution.md` as the latest step.

- **Reached for most.** Multi-agent (5): `flightcrew/` (crew, schemas, templates), `launch/`, twelve agent-type specifications on a branch. Plan (1): `missions/`, `launch/<run>/specs/`, `manuals/spec/`, `manuals/rubrics/`.
- **In part.** Review (2) and loop (3): `flightcrew/bin/` runners against check harnesses in `flightcrew/checks/`; no room for agent review. Context (6): `manuals/`, `hangar/`, `blackbox/`. Evals (9): `testbench/` benches for rubrics and validators, none for agents or skills. Observability (10): `radar/` views; no room for logs.
- **Not at all.** Triggers (4); extension surface (7), a custom scaffold naming no skill, hook or plugin; containment (8).
- **Latest step.** The cockpit adds `lab/` and `logs/` (9, 10); `comms/` and `team/` continue 6 and 5. Still nothing for triggers, packaging or containment.

### 7b. What kind of home each feature needs

What each home would hold, who reads it, and the nearest existing experiment plainly reaching for the same thing.

1. Plan: a work item's plan and the standard it must meet, for the approving human and building agents. Nearest: old `missions/`.
2. Review: reviewer definitions and criteria, for whoever dispatches them. Nearest: the archived first cockpit's adversary manuals (constitution notes).
3. Loop: a run's completion condition and cap, for the judging model. Nearest: old `flightcrew/bin/`.
4. Triggers: saved prompts with a schedule or event, for an unattended starter. Nearest: none.
5. Multi-agent: agent definitions and handoff formats, for the lead agent. Nearest: `.cockpit/team/`, old `flightcrew/crew/`.
6. Context: short instruction files, for every agent in every session. Nearest: `.cockpit/comms/`.
7. Extension surface: installable units and their manifest, for Claude Code at load. Nearest: `.cockpit/lab/generators/`; none for packaging.
8. Guardrails: permission, sandbox and hook settings, for the harness to enforce and the human to audit. Nearest: none.
9. Evals: fixed cases, graders and scores, apart from work, for whoever changes a prompt or skill. Nearest: `.cockpit/lab/evals/`, old `testbench/`.
10. Observability: transcripts and a needs-attention view, for the human and evals. Nearest: `.cockpit/logs/`, old `radar/`.

Homes 1, 4, 6, 7 and 8 are read outside a cockpit session, so they look bigger than the cockpit.
