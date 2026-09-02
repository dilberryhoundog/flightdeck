<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + orchestrated conditions: autonomous, expensive, dangerous, highly productive, unlimited work budget
  + the universal principles still apply but there is no human to apply them; each takes a different shape when a run is unattended
  + first half restates each universal principle under an orchestration lens, same names, same order
  + second half defines the concepts that only exist because of orchestration, picking up where the universal principles cannot cope
  + abandon failed runs: do not try to one-shot success, iterate towards it; don't invest heavily in any single outcome
  + repeatable: make stages of the work repeatable so a failure doesn't mean redoing the whole thing
  + deterministic tools: unsupervised agents are only guaranteed when they can't; if they "should not", eventually they will
  + checkpoints: gated progression allows early abandonment, saving resources
  + expressive freedom: many agents, adequately managed, perform better with freedom than with direct instruction; give the bucket and let them fill it
  + expressive freedom: instructing many agents directly is too much overhead
  + expressive freedom: how they build is unlimited; what they build is heavily controlled
  + expressive freedom: cheaper models iterating against red and green outperform a one-shot from the strongest model; if they fail, re-spec and go again
  + adversarial attack: the orchestration carve-out of review; every green is assumed wrong until a fresh context fails to break it, at every stage
  + orchestration-only concepts stay orchestration-only even though the harness features existed under HITL: with a human present it was faster to do it yourself or push through
  + context engineering under orchestration gives the context the whole run needs, not just the next turn; all judgement the human would supply mid-run is supplied up front
  + budgets are far more involved under orchestration: spend ceilings, retry caps, a defined stalled state
  - the user coined "expressive freedom"; use a conventional term if one exists (none established in the sources)
  - HITL conditions live in the universal document
agent points
  + context: workers return distilled summaries; raw investigation never enters the orchestrator's context
  + verification: gate strength scales — in-prompt, goal condition, deterministic stop hook, fresh-context refutation
  + verification: evidence lands in the transcript or on disk; an evaluator can only judge what was surfaced
  + observability: events, per-agent progress and token spend visible while the run is live; catch compounding misdirection before it multiplies
  + review: a fresh subagent sees only the diff and the criteria; the implementing agent never grades its own work
  + review: a reviewer asked for gaps always reports some; findings limited to correctness and stated requirements
  + decomposition: fixed interfaces and contracts before parallel work; workers accountable vertically, never collaborating horizontally
  + decomposition: the orchestrator's context is gapped from worker transcripts
  + isolation: one worktree per worker; atomic commits; restart a single agent, not the run; completed agents replay from saved results
  + isolation: a failure mid fan-out reruns everything after it — order fan-outs so cheap work finishes first
  + budgets: completion decided by a separate evaluator from observable output, with a turn cap in the condition
  + budgets: stalled state — no tool use for several turns, or two rounds with no new progress; the harness ends a stop-hook loop after eight consecutive blocks
  + budgets: model named per stage, size guideline per run; prove the shape on a small slice before the full run
  + permissions: allowlist per role, sandbox filesystem and network, deny rules for the irreversible; side-effectful workflows human-invoked only; classifier is a backstop
  + repeatable: orchestration itself is a saved script; no timestamps or randomness so a relaunch replays identically
  + repeatable: every failure is one of three axes — context, verification or tooling; iterate on the axis, starting clean
  + deterministic tools: hooks over instructions — instructions are advisory, hooks guarantee
  + deterministic tools: minimal non-overlapping toolset; terse unambiguous output; actionable errors not tracebacks; CLI over raw API
  + abandon: record each failure by axis and note what succeeded; runs are disposable, inputs are the investment
  + checkpoints: plan and interfaces are the early gates; final review is the last; the plan is an editable artefact before execution
  + expressive freedom: the lead supplies objective, output format and boundaries, and lets the worker find the path
  + adversarial attack: assume the draft, the unit, the green and the diff each have defects; a failed refutation is what makes acceptance credible
  - "pre-decided judgement" as its own concept — excluded, absorbed by the context lens
  - "refutation" as a name — replaced by adversarial attack
  - "simplest shape" — lives in the universal document

## agent context
recommended
  + each lensed principle states what the human did under HITL, what replaces it, and what breaks without the replacement
  + open with the operating conditions contrasted against HITL so the shift is explicit
  + close with the sources the principles draw on
possible
  - a table mapping each principle to the tool that implements it
  - a diagram of a run's stages and gates
edge cases
  + expressive freedom applies to approach only; outcome, interfaces and constraints stay fixed by the spec

## meta
user steering
  - mirrored structure to the universal document
  - neutral style, non-specific readers, headings per concept with lists where needed
decisions
  + the orchestration-only concepts form a distinct second half
  + names: review is universal, adversarial attack is orchestration
  + expressive freedom is a coined term and is defined as such
  - previous constitution document retired
constraints
  + sources limited to Anthropic, Claude or Bun
  + single user, Claude Max subscription; enterprise patterns out of scope

## language
vocabulary
  + :run: — one unattended, orchestrated execution from liftoff to report
  + :orchestrator: — the agent that plans, gates, dispatches and merges, and never does the work
  + :worker: — an agent that implements one unit in isolation
  + :green: — a passing check; a green run is one where every check passes
  + :gate: — a checkpoint that a run must pass or be abandoned at
  + :expressive freedom: — coined; freedom of approach inside fixed outcome and contract
  + :adversarial attack: — a fresh-context attempt to break an artefact rather than confirm it
  - :HITL: — defined in the universal document; use without redefining
  - :independent review: — say review or adversarial attack as appropriate
style
  - neutral register, no first person, no reference to the conversation

## audience
agent/human
  + non-specific: any reader, human or agent, in any future session
purpose
  + a foundation document: the universal principles restated for unattended runs, plus the principles unique to them
=== END CHAT SUMMARY ===
-->

# Orchestration principles

<!-- ===META=== two short paragraphs: the document restates the universal principles for unattended runs, then adds the principles that only exist there; define :run: and :orchestrator: -->
<!-- + the universal principles still apply but there is no human to apply them; each takes a different shape when a run is unattended -->
<!-- + first half restates each universal principle under an orchestration lens, same names, same order -->
<!-- + second half defines the concepts that only exist because of orchestration, picking up where the universal principles cannot cope -->
<!-- + :run: — one unattended, orchestrated execution from liftoff to report -->
<!-- + :orchestrator: — the agent that plans, gates, dispatches and merges, and never does the work -->

## Agent Invariants

<!-- ===META=== a terse bulleted list of rules that hold across every run; restated from below, not new -->
<!-- + expressive freedom: how they build is unlimited; what they build is heavily controlled -->
<!-- + deterministic tools: unsupervised agents are only guaranteed when they can't; if they "should not", eventually they will -->
<!-- + adversarial attack: the orchestration carve-out of review; every green is assumed wrong until a fresh context fails to break it, at every stage -->
<!-- + review: a fresh subagent sees only the diff and the criteria; the implementing agent never grades its own work -->
<!-- + decomposition: the orchestrator's context is gapped from worker transcripts -->
<!-- + abandon: record each failure by axis and note what succeeded; runs are disposable, inputs are the investment -->

## Operating conditions

<!-- ===META=== one short paragraph then a five-item list, each item contrasted with its HITL counterpart -->
<!-- + orchestrated conditions: autonomous, expensive, dangerous, highly productive, unlimited work budget -->
<!-- + open with the operating conditions contrasted against HITL so the shift is explicit -->

## Context engineering

<!-- ===META=== a paragraph: what the human supplied turn by turn, what supplies it now; then a short list -->
<!-- + context engineering under orchestration gives the context the whole run needs, not just the next turn; all judgement the human would supply mid-run is supplied up front -->
<!-- + context: workers return distilled summaries; raw investigation never enters the orchestrator's context -->
<!-- + each lensed principle states what the human did under HITL, what replaces it, and what breaks without the replacement -->

## Verification

<!-- ===META=== a paragraph, then an ordered list of gate strengths; define :green: -->
<!-- + verification: gate strength scales — in-prompt, goal condition, deterministic stop hook, fresh-context refutation -->
<!-- + verification: evidence lands in the transcript or on disk; an evaluator can only judge what was surfaced -->
<!-- + :green: — a passing check; a green run is one where every check passes -->

## Observability

<!-- ===META=== a paragraph: watching becomes run outputs; then a short list of what must be visible -->
<!-- + observability: events, per-agent progress and token spend visible while the run is live; catch compounding misdirection before it multiplies -->

## Review

<!-- ===META=== a paragraph, then a short list; point forward to adversarial attack without restating it -->
<!-- + review: a fresh subagent sees only the diff and the criteria; the implementing agent never grades its own work -->
<!-- + review: a reviewer asked for gaps always reports some; findings limited to correctness and stated requirements -->
<!-- + names: review is universal, adversarial attack is orchestration -->

## Decomposition

<!-- ===META=== a paragraph, then a short list; define :worker: -->
<!-- + decomposition: fixed interfaces and contracts before parallel work; workers accountable vertically, never collaborating horizontally -->
<!-- + decomposition: the orchestrator's context is gapped from worker transcripts -->
<!-- + :worker: — an agent that implements one unit in isolation -->

## Isolation and recoverability

<!-- ===META=== a paragraph, then a short list -->
<!-- + isolation: one worktree per worker; atomic commits; restart a single agent, not the run; completed agents replay from saved results -->
<!-- + isolation: a failure mid fan-out reruns everything after it — order fan-outs so cheap work finishes first -->

## Budgets and stop conditions

<!-- ===META=== a paragraph on why budgets become explicit, then a list of the ceilings and the stalled state -->
<!-- + budgets are far more involved under orchestration: spend ceilings, retry caps, a defined stalled state -->
<!-- + budgets: completion decided by a separate evaluator from observable output, with a turn cap in the condition -->
<!-- + budgets: stalled state — no tool use for several turns, or two rounds with no new progress; the harness ends a stop-hook loop after eight consecutive blocks -->
<!-- + budgets: model named per stage, size guideline per run; prove the shape on a small slice before the full run -->

## Permissions and blast radius

<!-- ===META=== a paragraph, then a short list -->
<!-- + permissions: allowlist per role, sandbox filesystem and network, deny rules for the irreversible; side-effectful workflows human-invoked only; classifier is a backstop -->

## Beyond the universal principles

<!-- ===META=== one short paragraph introducing the second half: why these did not exist under HITL even though the machinery did -->
<!-- + orchestration-only concepts stay orchestration-only even though the harness features existed under HITL: with a human present it was faster to do it yourself or push through -->
<!-- + the orchestration-only concepts form a distinct second half -->

## Abandon failed runs

<!-- ===META=== a paragraph, then a short list of practices -->
<!-- + abandon failed runs: do not try to one-shot success, iterate towards it; don't invest heavily in any single outcome -->
<!-- + abandon: record each failure by axis and note what succeeded; runs are disposable, inputs are the investment -->

## Repeatable

<!-- ===META=== a paragraph, then a short list; name the three failure axes -->
<!-- + repeatable: make stages of the work repeatable so a failure doesn't mean redoing the whole thing -->
<!-- + repeatable: orchestration itself is a saved script; no timestamps or randomness so a relaunch replays identically -->
<!-- + repeatable: every failure is one of three axes — context, verification or tooling; iterate on the axis, starting clean -->

## Deterministic tools

<!-- ===META=== a paragraph, then a short list of practices -->
<!-- + deterministic tools: unsupervised agents are only guaranteed when they can't; if they "should not", eventually they will -->
<!-- + deterministic tools: hooks over instructions — instructions are advisory, hooks guarantee -->
<!-- + deterministic tools: minimal non-overlapping toolset; terse unambiguous output; actionable errors not tracebacks; CLI over raw API -->

## Checkpoints

<!-- ===META=== a paragraph, then a short ordered list of the gates; define :gate: -->
<!-- + checkpoints: gated progression allows early abandonment, saving resources -->
<!-- + checkpoints: plan and interfaces are the early gates; final review is the last; the plan is an editable artefact before execution -->
<!-- + :gate: — a checkpoint that a run must pass or be abandoned at -->

## Expressive freedom

<!-- ===META=== two paragraphs: the counter-intuitive claim and why it holds, then the boundary; define :expressive freedom: as coined -->
<!-- + expressive freedom: many agents, adequately managed, perform better with freedom than with direct instruction; give the bucket and let them fill it -->
<!-- + expressive freedom: instructing many agents directly is too much overhead -->
<!-- + expressive freedom: how they build is unlimited; what they build is heavily controlled -->
<!-- + expressive freedom: cheaper models iterating against red and green outperform a one-shot from the strongest model; if they fail, re-spec and go again -->
<!-- + expressive freedom: the lead supplies objective, output format and boundaries, and lets the worker find the path -->
<!-- + expressive freedom applies to approach only; outcome, interfaces and constraints stay fixed by the spec -->
<!-- + :expressive freedom: — coined; freedom of approach inside fixed outcome and contract -->
<!-- + expressive freedom is a coined term and is defined as such -->

## Adversarial attack

<!-- ===META=== a paragraph on the posture, then a list of where it is applied; define :adversarial attack: -->
<!-- + adversarial attack: the orchestration carve-out of review; every green is assumed wrong until a fresh context fails to break it, at every stage -->
<!-- + adversarial attack: assume the draft, the unit, the green and the diff each have defects; a failed refutation is what makes acceptance credible -->
<!-- + :adversarial attack: — a fresh-context attempt to break an artefact rather than confirm it -->

## Sources

<!-- ===META=== a short list of the source documents by title and URL; no commentary -->
<!-- + close with the sources the principles draw on -->
<!-- + sources limited to Anthropic, Claude or Bun -->
<!-- + single user, Claude Max subscription; enterprise patterns out of scope -->
