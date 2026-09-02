<!--
=== CHAT SUMMARY (Phase 1 scaffold — stripped before final) ===
Toggle: + = write into the document (relevant to chat AND doc)
        - = relevant to the chat only, never reaches the final document
Agent sets the first pass; user adjusts. Sections are voluntary — include one
only when real context exists for it.

## conversation
user points
  + everything a human must create to adequately replace themselves when moving from attended sessions to orchestrated runs
  + this covers tools, architecture and infrastructure alike; the spec and the agents are architecture as much as the harness is tooling
  + each entry explains everything the tool needs to do to be an adequate part of the system
  + the spec is already built; agent roles are one markdown file each
  + the current Claude Code lineup is sufficient; every feature required has been available for some time
  + spec: the standalone statement of what the outcome is
  + spec/intention: the outcome pursued and why it's worth having; short enough to hold whole; the tiebreaker when other sections are silent
  + spec/scope: the perimeter — what the work changes and what it must leave untouched; both sides stated, an unstated exclusion looks like an invitation
  + spec/constraints: conditions the result must satisfy however it is achieved; imported from the surrounding world, non-negotiable within the work
  + spec/interfaces and contracts: the exact seams where the work meets everything around it; fixed seams make parallel work possible
  + spec/behaviours: numbered, testable statements of what the result observably does; one decision per entry; the count is the size of the work
  + spec/edges and failure modes: decided outcomes at the boundaries and when the world doesn't cooperate; authored adversarially
  + spec/decisions: judgements already made and improvements deliberately not pursued; written so settled ground cannot be re-argued
  + spec/verification: how each numbered claim is proven as an unarguable pass or fail; the only executable section — commands and artefacts
  + spec/acceptance: the short final gate; assembled purely from above, forbidden from introducing anything new
  + agents/spec interviewer: extracts the spec from the human by asking, never drafting; one question at a time; deferred answers land in Open Questions verbatim
  + agents/spec attacker: fresh context, adversarial mandate; assumes defects; files every finding as an Open Question for the human to resolve
  + agents/spec judge: reads the attacked spec and rules on freeze readiness
  + agents/test builder: derives executable targets from the frozen spec, one check per behaviour and edge; runs the baseline proving every check fails for the right reason before work starts
  + agents/main orchestrator: plans, holds gates, dispatches and merges workers; never writes code, never edits tests, never grades its own work
  + agents/explorer: answers one codebase question with a short cited return; keeps raw investigation out of the orchestrator's context
  + agents/interface builder: writes the seams exactly as the spec states them before parallel work; signatures and stubs only; contradictions halt, never adapt
  + agents/worker (general): implements one unit to its mapped checks in an isolated worktree; fixes causes never symptoms; contradictions stop the run for a human
  + agents/worker (strong): one escalation retry on a failed unit from clean state with the failure evidence; inherits the evidence not the approach; a second failure ends attempts
  + agents/adversary (build unit): attacks a completed unit before merge — what did the checks miss; looks where units cheat: narrowed scope, weakened edges, unasked-for behaviour
  + agents/run verifier: refutes the final green; assumes done is wrong and goes looking; failed refutations make the green credible
  + agents/reviewer: judges the full diff against spec intent from a fresh context; catches work that passes every check and is still the wrong work
  + agents/report assembler: joins recorded artefacts into the report with provenance marked and no verdict; an abandoned run's report assembled the same as an accepted one's
  + test harness: the executable definition of done and the machinery that runs it
  + tests are written before any code, one per numbered behaviour and edge; the baseline proves each fails for the right reason
  + claude.md: short and stable — build and test commands, unusual conventions, repository etiquette, project-specific gotchas
  + skills: domain knowledge and repeatable workflows that load on demand
  + liftoff prompt: a rich starting prompt that defines run shape, not outcome
  + run log: names the failure axis — context, verification or tooling
  + hooks and check runners: scripts that run checks automatically rather than relying on an agent remembering to
  + dynamic workflows: the prebuilt orchestration tooling that shapes how the orchestrator directs agents
  + worktrees, atomic commits and run branches: the git structure that isolates agents and makes runs recoverable
  + handoffs: file-based transfer of results between agents, never shared memory
  + plan: the first checkpoint artefact; decomposes the work into testable units
  + final review: the last checkpoint artefact, combining test results and reviewer findings
  + run outputs: events, reports, test results and the test map produced by a run
  + frontmatter permissions: allowlists and sandboxing declared per role
  - the earlier tooling list was a grab bag; this document replaces it comprehensively
  - the previous constitution document is retired once this exists
agent points
  + goal evaluator: a separate small model judges a stop condition after every turn from the transcript alone; it runs no tools
  + goal evaluator: a usable condition names one observable end state, the check that proves it, constraints not to violate, and a turn cap
  + test harness: one command, one exit code, output readable in-conversation; runnable by an agent, a hook, and a human identically
  + claude.md: the test per line is whether removing it would cause mistakes; enforced behaviour moves to hooks; compaction instructions name what must survive a summary
  + skills: parametrised workflows take arguments; side-effectful workflows disable model invocation so only a human triggers them
  + liftoff prompt: names the files and interfaces involved, what is out of scope, and the end-to-end check that proves the run
  + hooks: Stop hooks gate completion and the harness overrides after eight consecutive blocks; PreToolUse hooks block forbidden actions before they happen
  + dynamic workflows: a script holds the loop, branching and intermediate results; the orchestrator's context receives only the final answer
  + dynamic workflows: saved as a command, rerunnable and resumable; no mid-run human input, so each human gate is a separate workflow
  + dynamic workflows: timestamps and randomness throw inside the script so a relaunch replays the same agent calls; a failed agent reruns everything started after it
  + dynamic workflows: model named per stage; size guideline per run; concurrency and total agent caps bound a runaway script
  + worktrees: a subagent declares worktree isolation and gets a temporary checkout, auto-cleaned when unchanged
  + handoffs: schema-validated returns where the harness supports them, so a worker's output is structured data not prose
  + run outputs: include the run's script and per-agent token totals so cost and shape can be diffed between runs
  + frontmatter: tools, model, effort, isolation, memory scope, permission mode and role-scoped hooks live in one block per role
  + agent roles and frontmatter are one concern: the role is the file, the frontmatter is its blast radius
  - Bun as test runner: nothing beyond "one command, one exit code" needed

## agent context
recommended
  + each entry states which human function it replaces, what it must do, what it takes in and hands out, and the Claude Code feature that implements it
  + order the entries by when they appear in a run: before liftoff, during, after
  + close with the sources drawn on
possible
  - a directory layout for a project adopting the system
  - a sequence diagram of one run through its gates
  - a table mapping each principle to the tools that implement it
edge cases
  + the report is assembled identically whether the run was accepted or abandoned
  + a contradiction between spec and codebase halts the run for a human; no agent adapts around it

## meta
user steering
  - neutral style, headings per tool, lists under headings where needed
decisions
  + requirements stated independently of harness version, with the implementing feature named alongside
  + spec sections and agent roles carried in unchanged
  - previous constitution document retired
constraints
  + sources limited to Anthropic, Claude or Bun
  + single user, Claude Max subscription; enterprise patterns out of scope

## language
vocabulary
  + :run: — one unattended, orchestrated execution from liftoff to report
  + :unit: — one build unit from the plan, mapped to its checks, implemented by one worker
  + :check: — one executable pass-or-fail derived from one behaviour or edge
  + :gate: — a checkpoint a run must pass or be abandoned at
  + :handoff: — a file written by one agent and read by the next, the only channel between them
  + :liftoff: — the moment a run starts unattended
  + :frozen: — the spec state after the judge rules it ready; no edits without a new freeze
  - :grab bag: — do not use
  - :constitution: — retired; do not reference
style
  - neutral register, no first person, no reference to the conversation

## audience
agent/human
  + non-specific: any reader, human or agent, in any future session
purpose
  + a foundation document: the complete set of things to build before a run can replace the human
=== END CHAT SUMMARY ===
-->

# Orchestration tools, architecture and infrastructure

<!-- ===META=== two short paragraphs: what this document enumerates and how each entry is structured; define :run: and :liftoff: -->
<!-- + everything a human must create to adequately replace themselves when moving from attended sessions to orchestrated runs -->
<!-- + this covers tools, architecture and infrastructure alike; the spec and the agents are architecture as much as the harness is tooling -->
<!-- + each entry states which human function it replaces, what it must do, what it takes in and hands out, and the Claude Code feature that implements it -->
<!-- + order the entries by when they appear in a run: before liftoff, during, after -->
<!-- + requirements stated independently of harness version, with the implementing feature named alongside -->
<!-- + the current Claude Code lineup is sufficient; every feature required has been available for some time -->
<!-- + :run: — one unattended, orchestrated execution from liftoff to report -->
<!-- + :liftoff: — the moment a run starts unattended -->

## Agent Invariants

<!-- ===META=== a terse bulleted list of rules every component must uphold; restated from below -->
<!-- + agents/main orchestrator: plans, holds gates, dispatches and merges workers; never writes code, never edits tests, never grades its own work -->
<!-- + tests are written before any code, one per numbered behaviour and edge; the baseline proves each fails for the right reason -->
<!-- + handoffs: file-based transfer of results between agents, never shared memory -->
<!-- + a contradiction between spec and codebase halts the run for a human; no agent adapts around it -->
<!-- + the report is assembled identically whether the run was accepted or abandoned -->
<!-- + frontmatter permissions: allowlists and sandboxing declared per role -->

## Spec

<!-- ===META=== a paragraph on what the spec is and that it is the only statement of outcome; then one list item per section, each a sentence or two; define :frozen: -->
<!-- + spec: the standalone statement of what the outcome is -->
<!-- + spec/intention: the outcome pursued and why it's worth having; short enough to hold whole; the tiebreaker when other sections are silent -->
<!-- + spec/scope: the perimeter — what the work changes and what it must leave untouched; both sides stated, an unstated exclusion looks like an invitation -->
<!-- + spec/constraints: conditions the result must satisfy however it is achieved; imported from the surrounding world, non-negotiable within the work -->
<!-- + spec/interfaces and contracts: the exact seams where the work meets everything around it; fixed seams make parallel work possible -->
<!-- + spec/behaviours: numbered, testable statements of what the result observably does; one decision per entry; the count is the size of the work -->
<!-- + spec/edges and failure modes: decided outcomes at the boundaries and when the world doesn't cooperate; authored adversarially -->
<!-- + spec/decisions: judgements already made and improvements deliberately not pursued; written so settled ground cannot be re-argued -->
<!-- + spec/verification: how each numbered claim is proven as an unarguable pass or fail; the only executable section — commands and artefacts -->
<!-- + spec/acceptance: the short final gate; assembled purely from above, forbidden from introducing anything new -->
<!-- + :frozen: — the spec state after the judge rules it ready; no edits without a new freeze -->
<!-- + spec sections and agent roles carried in unchanged -->

## Agent roles

<!-- ===META=== a paragraph on roles as one markdown file each with their own context; then one list item per role, two sentences each, in run order -->
<!-- + the spec is already built; agent roles are one markdown file each -->
<!-- + agents/spec interviewer: extracts the spec from the human by asking, never drafting; one question at a time; deferred answers land in Open Questions verbatim -->
<!-- + agents/spec attacker: fresh context, adversarial mandate; assumes defects; files every finding as an Open Question for the human to resolve -->
<!-- + agents/spec judge: reads the attacked spec and rules on freeze readiness -->
<!-- + agents/test builder: derives executable targets from the frozen spec, one check per behaviour and edge; runs the baseline proving every check fails for the right reason before work starts -->
<!-- + agents/main orchestrator: plans, holds gates, dispatches and merges workers; never writes code, never edits tests, never grades its own work -->
<!-- + agents/explorer: answers one codebase question with a short cited return; keeps raw investigation out of the orchestrator's context -->
<!-- + agents/interface builder: writes the seams exactly as the spec states them before parallel work; signatures and stubs only; contradictions halt, never adapt -->
<!-- + agents/worker (general): implements one unit to its mapped checks in an isolated worktree; fixes causes never symptoms; contradictions stop the run for a human -->
<!-- + agents/worker (strong): one escalation retry on a failed unit from clean state with the failure evidence; inherits the evidence not the approach; a second failure ends attempts -->
<!-- + agents/adversary (build unit): attacks a completed unit before merge — what did the checks miss; looks where units cheat: narrowed scope, weakened edges, unasked-for behaviour -->
<!-- + agents/run verifier: refutes the final green; assumes done is wrong and goes looking; failed refutations make the green credible -->
<!-- + agents/reviewer: judges the full diff against spec intent from a fresh context; catches work that passes every check and is still the wrong work -->
<!-- + agents/report assembler: joins recorded artefacts into the report with provenance marked and no verdict; an abandoned run's report assembled the same as an accepted one's -->
<!-- + :unit: — one build unit from the plan, mapped to its checks, implemented by one worker -->

## Frontmatter permissions

<!-- ===META=== a paragraph on the role file's frontmatter as its blast radius; then a list of the fields and what each controls -->
<!-- + frontmatter permissions: allowlists and sandboxing declared per role -->
<!-- + frontmatter: tools, model, effort, isolation, memory scope, permission mode and role-scoped hooks live in one block per role -->
<!-- + agent roles and frontmatter are one concern: the role is the file, the frontmatter is its blast radius -->

## claude.md

<!-- ===META=== a paragraph, then two short lists: what belongs, and the tests for cutting -->
<!-- + claude.md: short and stable — build and test commands, unusual conventions, repository etiquette, project-specific gotchas -->
<!-- + claude.md: the test per line is whether removing it would cause mistakes; enforced behaviour moves to hooks; compaction instructions name what must survive a summary -->

## Skills

<!-- ===META=== a paragraph, then a short list -->
<!-- + skills: domain knowledge and repeatable workflows that load on demand -->
<!-- + skills: parametrised workflows take arguments; side-effectful workflows disable model invocation so only a human triggers them -->

## Hooks and check runners

<!-- ===META=== a paragraph on hooks as the replacement for the human's "did you run it?"; then a list of hook points and their job -->
<!-- + hooks and check runners: scripts that run checks automatically rather than relying on an agent remembering to -->
<!-- + hooks: Stop hooks gate completion and the harness overrides after eight consecutive blocks; PreToolUse hooks block forbidden actions before they happen -->

## Test harness

<!-- ===META=== a paragraph, then a list of requirements; define :check: -->
<!-- + test harness: the executable definition of done and the machinery that runs it -->
<!-- + tests are written before any code, one per numbered behaviour and edge; the baseline proves each fails for the right reason -->
<!-- + test harness: one command, one exit code, output readable in-conversation; runnable by an agent, a hook, and a human identically -->
<!-- + :check: — one executable pass-or-fail derived from one behaviour or edge -->

## Goal evaluator

<!-- ===META=== a paragraph on what it is and its blind spot, then a list of what a condition must contain -->
<!-- + goal evaluator: a separate small model judges a stop condition after every turn from the transcript alone; it runs no tools -->
<!-- + goal evaluator: a usable condition names one observable end state, the check that proves it, constraints not to violate, and a turn cap -->

## Liftoff prompt

<!-- ===META=== a paragraph, then a list of what it must name -->
<!-- + liftoff prompt: a rich starting prompt that defines run shape, not outcome -->
<!-- + liftoff prompt: names the files and interfaces involved, what is out of scope, and the end-to-end check that proves the run -->

## Plan

<!-- ===META=== a paragraph; define :gate: here as the plan is the first one -->
<!-- + plan: the first checkpoint artefact; decomposes the work into testable units -->
<!-- + :gate: — a checkpoint a run must pass or be abandoned at -->

## Dynamic workflows

<!-- ===META=== a paragraph on the script holding the plan; then a list of properties and limits the design must respect -->
<!-- + dynamic workflows: the prebuilt orchestration tooling that shapes how the orchestrator directs agents -->
<!-- + dynamic workflows: a script holds the loop, branching and intermediate results; the orchestrator's context receives only the final answer -->
<!-- + dynamic workflows: saved as a command, rerunnable and resumable; no mid-run human input, so each human gate is a separate workflow -->
<!-- + dynamic workflows: timestamps and randomness throw inside the script so a relaunch replays the same agent calls; a failed agent reruns everything started after it -->
<!-- + dynamic workflows: model named per stage; size guideline per run; concurrency and total agent caps bound a runaway script -->

## Worktrees, atomic commits and run branches

<!-- ===META=== a paragraph, then a short list -->
<!-- + worktrees, atomic commits and run branches: the git structure that isolates agents and makes runs recoverable -->
<!-- + worktrees: a subagent declares worktree isolation and gets a temporary checkout, auto-cleaned when unchanged -->

## Handoffs

<!-- ===META=== a paragraph; define :handoff: -->
<!-- + handoffs: file-based transfer of results between agents, never shared memory -->
<!-- + handoffs: schema-validated returns where the harness supports them, so a worker's output is structured data not prose -->
<!-- + :handoff: — a file written by one agent and read by the next, the only channel between them -->

## Run outputs

<!-- ===META=== a paragraph, then a list of the artefacts a run must leave behind -->
<!-- + run outputs: events, reports, test results and the test map produced by a run -->
<!-- + run outputs: include the run's script and per-agent token totals so cost and shape can be diffed between runs -->

## Final review

<!-- ===META=== a paragraph -->
<!-- + final review: the last checkpoint artefact, combining test results and reviewer findings -->
<!-- + the report is assembled identically whether the run was accepted or abandoned -->

## Run log

<!-- ===META=== a paragraph, then the three axes as a short list -->
<!-- + run log: names the failure axis — context, verification or tooling -->

## Sources

<!-- ===META=== a short list of the source documents by title and URL; no commentary -->
<!-- + close with the sources drawn on -->
<!-- + sources limited to Anthropic, Claude or Bun -->
<!-- + single user, Claude Max subscription; enterprise patterns out of scope -->
