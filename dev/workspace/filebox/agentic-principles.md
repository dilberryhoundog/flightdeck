<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + eight universal principles: context engineering, verification, observability, review, decomposition, isolation & recoverability, budgets & stop conditions, permissions & blast radius
  + principles are the elements, factors and functions that matter when sitting at an agentic coding terminal, building or investigating turn by turn
  + context engineering: don't overwhelm the agent; include more than the task, including what is not the task
  + verification: always check what the agent produces, that it works and fits the surrounding code; never accept "done"
  + observability: be present at the terminal, ask for intention, watch, steer the conversation by observing its direction
  + review: isolated judgement of the agent's work; don't let it tell you "done"
  + decomposition: break asks into smaller chunks, or extract the different types of work and do them one by one
  + isolation & recoverability: never work on the same files as another session; use isolation tools; save regularly before an errant `git reset --hard`
  + budgets & stop conditions: cheaper agents for easier tasks; restart an errant session fresh rather than trying to get it back on track
  + permissions & blast radius: don't let agents do dangerous things to the machine or access areas they shouldn't
  + HITL conditions: controlled, cheap, time consuming, productivity limited, session size limited
  - nearly all of these have been done manually by the human for the last two years
  - the split between universal and orchestration-only concepts; only the universal half lives here
agent points
  + context: the smallest set of high-signal tokens that still produces the outcome; minimal is not short
  + context: instructions at the right altitude — heuristics, not brittle rules and not vague intent
  + context: just-in-time retrieval — hold references (paths, queries) and load on demand rather than everything up front
  + context: two corrections on the same issue means the context is polluted; clear and restate with a better input
  + verification: any check that returns a pass or fail the agent can read — tests, build exit code, linter, diff against fixture, screenshot against design
  + verification: without a check, "looks done" is the only signal available
  + verification: evidence not narrative — the command run and what it returned
  + review: a fresh context sees the diff and the criteria, never the reasoning that produced the change
  + review: a reviewer asked for gaps always finds some; limit findings to correctness and stated requirements
  + decomposition: explore, plan, implement, commit — research never shares a window with implementation
  + decomposition: if the diff fits in one sentence, skip the plan
  + decomposition: subagents keep investigation out of the main context and return a distilled summary
  + isolation: session rewind only tracks editor-tool changes; git is the durable record
  + isolation: worktrees for parallel sessions so edits don't collide
  + budgets: match the model to the task; clear between unrelated tasks; compact with instructions on what to keep
  + permissions: allowlist the tools you trust, sandbox filesystem and network, deny rules for the irreversible; a classifier is a backstop not a substitute
  + do the simplest thing that works — one agent before a fan-out, a prompt before a script
  - "simplest shape" as its own principle; folded into decomposition
  - "pre-decided judgement" as its own principle; excluded
  - "refutation" as a name; universal name is review

## agent context
recommended
  + each principle names the human behaviour, the failure it prevents, and the practice that embodies it
  + close with the sources the principles draw on
possible
  - a worked example per principle
  - a mapping from each principle to the Claude Code feature that supports it
edge cases
  - reasonable disagreement with the agent is not misdirection; only correct when the direction is wrong

## meta
user steering
  - keep the original terse plus/dash style (superseded by headings)
  - research only from Anthropic, Claude or Bun sources
decisions
  + these are principles applicable to any agentic task and are defined as exactly that
  + "review" is the universal name; the adversarial carve-out belongs to orchestration, not here
  + each principle is a markdown heading; lists live under headings only where needed
  - the previous constitution document is retired
  - single user on a Claude Max subscription; enterprise patterns out of scope
constraints
  + sources limited to Anthropic, Claude or Bun

## language
vocabulary
  + :agentic engineer: — the human directing an agent at the terminal
  + :HITL: — human in the loop; the human present and steering turn by turn
  + :evidence: — a command and its returned output, as opposed to an assertion
  - :independent review: — renamed; say review
  - :constitution: — retired document; do not reference
style
  - neutral register, no first person, no references to the conversation

## audience
agent/human
  + non-specific: any reader, human or agent, in any future session
purpose
  + a foundation document: the principles that other documents restate under different conditions
=== END CHAT SUMMARY ===
-->

# Agentic principles

<!-- ===META=== two short paragraphs: what a principle is, and that these apply to any agentic task regardless of who or what is directing it -->
<!-- + principles are the elements, factors and functions that matter when sitting at an agentic coding terminal, building or investigating turn by turn -->
<!-- + these are principles applicable to any agentic task and are defined as exactly that -->
<!-- + a foundation document: the principles that other documents restate under different conditions -->

## Agent Invariants

<!-- ===META=== a terse bulleted list of rules that hold under every principle below; restated, not new -->
<!-- + verification: always check what the agent produces, that it works and fits the surrounding code; never accept "done" -->
<!-- + verification: evidence not narrative — the command run and what it returned -->
<!-- + isolation & recoverability: never work on the same files as another session; use isolation tools; save regularly before an errant `git reset --hard` -->
<!-- + permissions & blast radius: don't let agents do dangerous things to the machine or access areas they shouldn't -->
<!-- + do the simplest thing that works — one agent before a fan-out, a prompt before a script -->

## Operating conditions

<!-- ===META=== one short paragraph then a five-item list; define :HITL: here -->
<!-- + HITL conditions: controlled, cheap, time consuming, productivity limited, session size limited -->
<!-- + :HITL: — human in the loop; the human present and steering turn by turn -->
<!-- + :agentic engineer: — the human directing an agent at the terminal -->

## Context engineering

<!-- ===META=== a paragraph naming the behaviour and failure, then a short list of practices -->
<!-- + context engineering: don't overwhelm the agent; include more than the task, including what is not the task -->
<!-- + context: the smallest set of high-signal tokens that still produces the outcome; minimal is not short -->
<!-- + context: instructions at the right altitude — heuristics, not brittle rules and not vague intent -->
<!-- + context: just-in-time retrieval — hold references (paths, queries) and load on demand rather than everything up front -->
<!-- + context: two corrections on the same issue means the context is polluted; clear and restate with a better input -->

## Verification

<!-- ===META=== a paragraph naming the behaviour and failure, then a list of check shapes; define :evidence: -->
<!-- + verification: always check what the agent produces, that it works and fits the surrounding code; never accept "done" -->
<!-- + verification: any check that returns a pass or fail the agent can read — tests, build exit code, linter, diff against fixture, screenshot against design -->
<!-- + verification: without a check, "looks done" is the only signal available -->
<!-- + verification: evidence not narrative — the command run and what it returned -->
<!-- + :evidence: — a command and its returned output, as opposed to an assertion -->

## Observability

<!-- ===META=== one paragraph, no list -->
<!-- + observability: be present at the terminal, ask for intention, watch, steer the conversation by observing its direction -->

## Review

<!-- ===META=== a paragraph on isolated judgement, then a short list of practices -->
<!-- + review: isolated judgement of the agent's work; don't let it tell you "done" -->
<!-- + review: a fresh context sees the diff and the criteria, never the reasoning that produced the change -->
<!-- + review: a reviewer asked for gaps always finds some; limit findings to correctness and stated requirements -->
<!-- + "review" is the universal name; the adversarial carve-out belongs to orchestration, not here -->

## Decomposition

<!-- ===META=== a paragraph, then a list of practices -->
<!-- + decomposition: break asks into smaller chunks, or extract the different types of work and do them one by one -->
<!-- + decomposition: explore, plan, implement, commit — research never shares a window with implementation -->
<!-- + decomposition: if the diff fits in one sentence, skip the plan -->
<!-- + decomposition: subagents keep investigation out of the main context and return a distilled summary -->
<!-- + do the simplest thing that works — one agent before a fan-out, a prompt before a script -->

## Isolation and recoverability

<!-- ===META=== a paragraph, then a short list of practices -->
<!-- + isolation & recoverability: never work on the same files as another session; use isolation tools; save regularly before an errant `git reset --hard` -->
<!-- + isolation: worktrees for parallel sessions so edits don't collide -->
<!-- + isolation: session rewind only tracks editor-tool changes; git is the durable record -->

## Budgets and stop conditions

<!-- ===META=== a paragraph, then a short list of practices -->
<!-- + budgets & stop conditions: cheaper agents for easier tasks; restart an errant session fresh rather than trying to get it back on track -->
<!-- + budgets: match the model to the task; clear between unrelated tasks; compact with instructions on what to keep -->

## Permissions and blast radius

<!-- ===META=== a paragraph, then a short list of practices -->
<!-- + permissions & blast radius: don't let agents do dangerous things to the machine or access areas they shouldn't -->
<!-- + permissions: allowlist the tools you trust, sandbox filesystem and network, deny rules for the irreversible; a classifier is a backstop not a substitute -->

## Sources

<!-- ===META=== a short list of the source documents by title and URL; no commentary -->
<!-- + close with the sources the principles draw on -->
<!-- + sources limited to Anthropic, Claude or Bun -->
