## Scope
### In
+ Orchestration agent system and best practices.
+ Human in the loop quality decisions replacement.
+ Single user, Claude Max x20 subscription.
### Out
+ Enterprise patterns
+ Famous or custom workflows

## Constraints
+ Sources – Anthropic, Claude or Bun.

## Concepts:
+ Context engineering
    - good starting state
    - templates replace regular steering inputs
    - produces quality scope and boundaries
+ Observability
    - catch compounding misdirection
    - Transparency into the system
    - Prevents wasted time and resources.
+ Verification
    - executable definition of done
    - varied shapes (list them)
    - pre-written defined target - produces powerful outcomes
    - observable checkable results – evidence not narrative
+ Independent review
    - isolated context – does input (spec) = output (result)
    - adversary - implementors reasoning challenged
+ Abandon failed runs
    - improving inputs is far more valuable than patching results.
    - record iterative failures, note success.
+ Repeatable
    - there are always three axis failures - context, verification or tooling.
    - iterate over axis improvements, starting clean.
+ Deterministic tools
    - terse, unambiguous output
    - keeps agents focused and accountable
+ Decomposition
    - fixed interfaces and contract before starting
    - workers are accountable vertically, not collaborative horizontally
    - orchestrator's context is sacred - gapped from workers transcripts
    - planning – small testable build units
    - spec defines outcome, liftoff defines run mechanics
+ Checkpoints
    - early gates – Plan, interfaces 
    - abandon failures early
    - final review – test results and reviewer agent findings.
+ Isolation & Recoverability
    - preventing collision of work, give each their own files
    - disallow viewing other agents' work.
    - agents access only tailored context.
    - atomic commits – easy resumption instead of unpicking.
    - harness tools restart a single agent, not the whole run.
+ Budgets and stop conditions
    - explicit ceiling on retry attempts, agent tier and spend
    - defined stalled state
    - model tiering per workflow
+ Permissions and blast radius
    - unattended means high risk, carefully allow permissions.
    - leverage agent harness tooling

## Tooling and architecture:

+ Spec 
    - the standalone statement of what the outcome is.
+ Test harness 
    - the executable definition of done and the machinery that runs it.
+ Varied agent roles 
    - orchestrator, workers, reviewer and any further supporting roles, 
    - each with its own scope of context.
+ claude.md 
    - short and stable; 
    - build & test commands, 
    - unusual conventions, 
    - repository etiquette and 
    - project-specific gotchas.
+ skills 
    - domain knowledge and repeatable workflows that load on demand.
+ Liftoff prompt 
    - A rich starting prompt. defines run shape, not outcome.
+ Run log 
    - Name the failure axis, context, verification or tooling.
+ Hooks and check runners 
    - scripts that run checks automatically rather than relying on an agent remembering to.
+ Dynamic workflows 
    - the prebuilt orchestration tooling that shapes how the orchestrator directs agents.
+ Worktrees, atomic commits and run branches 
    - the git structure that isolates agents and makes runs recoverable.
+ Handoffs 
    - file-based transfer of results between agents, never shared memory.
+ Plan 
    - first checkpoint artifact
    - decompose into testable units
+ Final review 
    - final checkpoint artifact
    - combining test results and reviewer findings.
+ Run outputs 
    - events, reports, test results and the test map produced by a run.
+ Frontmatter permissions 
    - allowlists and sandboxing declared per role.

## Spec:
+ intention
  - the outcome pursued and why it's worth having.
  - short enough to hold whole; the tiebreaker when other sections are silent.
+ scope
  - the perimeter: what the work changes and what it must leave untouched.
  - both sides of the line stated – an unstated exclusion looks like an invitation.
+ constraints
  - conditions the result must satisfy no matter how it is achieved.
  - imported from the surrounding world, non-negotiable within the work.
+ interfaces and contracts
  - the exact seams where the work meets everything around it.
  - fixed seams are what make parallel work possible.
+ behaviours
  - numbered, testable statements of what the result observably does.
  - one decision per entry; the count is the size of the work.
+ edges and failure modes
  - decided outcomes at the boundaries and when the world doesn't cooperate.
  - authored adversarially – asking how it breaks, not what it is.
+ decisions
  - judgements already made and improvements deliberately not pursued.
  - written down so settled ground cannot be re-argued by accident.
+ verification
  - how each numbered claim will be proven, as an unarguable pass or fail.
  - the only executable section – commands and artefacts, not statements.
+ acceptance
  - the short final gate: conditions under which the result is accepted.
  - purely assembled from above; forbidden from introducing anything new.

## Agents:
+ spec interviewer
  - extracts the spec from the human's head by asking, never drafting.
  - one question at a time; deferred answers land in Open Questions verbatim.
+ spec attacker
  - fresh context, adversarial mandate: assume the draft has defects.
  - files every finding as an Open Question; the human resolves, it only surfaces.
+ spec judge
  - reads the attacked spec and rules on freeze readiness.
+ test builder
  - derives the executable targets from the frozen spec: one check per behaviour and edge.
  - runs the baseline proving every check fails for the right reason before work starts.
+ main orchestrator
  - conducts the run: plans, holds gates, dispatches and merges workers.
  - never writes code, never edits tests, never grades its own work.
+ explorer
  - answers one codebase question with a short, cited return.
  - keeps raw investigation out of the orchestrator's context.
+ interface builder
  - writes the seams exactly as the spec states them, before parallel work.
  - signatures and stubs only – no behaviour; contradictions halt, never adapt.
+ worker (general)
  - implements one unit to its mapped checks, in an isolated worktree.
  - fixes causes never symptoms; contradictions stop the run for a human.
+ worker (strong)
  - one escalation retry on a failed unit, from clean state with the failure evidence.
  - inherits the evidence, not the approach; a second failure ends attempts.
+ adversary (build unit)
  - attacks a completed unit before merge: what did the checks miss?
  - looks where units cheat – narrowed scope, weakened edges, unasked-for behaviour.
+ run verifier
  - refutes the final green: assumes done is wrong and goes looking.
  - failed refutations are what make the green credible.
+ reviewer (diff vs spec intent)
  - judges the full diff against intent from a fresh context.
  - catches work that passes every check and is still the wrong work.
+ report assembler
  - joins recorded artefacts into the report, provenance marked, no verdict.
  - an abandoned run's report assembled the same as an accepted one's.
