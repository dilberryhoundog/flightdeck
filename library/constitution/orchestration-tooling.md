# Orchestration tools, architecture and infrastructure

This document enumerates everything that has to exist before a run, an unattended orchestrated execution of a piece of work, can replace the person who used to sit at the terminal. Liftoff is the moment that replacement begins: from that point until a report exists, nothing that the human would have supplied by hand is available unless something below supplies it instead. The entries are tools, architecture and infrastructure alike. A spec is architecture in the same sense that a hook is tooling; both are things a person builds once so that the run does not need them present.

Each entry states which human function it replaces, what it must do to be an adequate replacement, what it takes in and hands out, and which feature of the current agentic harness implements it. The requirements are written to outlast any particular version of that harness; the implementing feature is named alongside because everything required is already available and has been for some time. Entries are ordered by when they first matter in a run: what is built before liftoff, what operates during, and what is produced after.

## Agent Invariants

- The orchestrator directs; it never writes code, never edits a test, never grades its own work.
- No code is written before the tests exist, and no test is trusted before it has been seen to fail for the right reason.
- Agents communicate through files. There is no shared memory and no reading of another agent's transcript.
- A contradiction between the spec and the codebase halts the run for a human. No agent adapts around it.
- The report is assembled the same way whether the run was accepted or abandoned.
- Every role's reach is declared in its own file, and nothing a role can do exceeds what is declared there.

## Spec

The spec replaces the human's memory of what they were trying to build and every clarification they would have given when asked. It is the single standalone statement of the outcome: anything a run needs to know about what to build is in it, and anything not in it is not a requirement. It is extracted from the human by questioning, attacked for defects, and then judged ready; from that point it is frozen, and no agent edits it. A change to a frozen spec is a new freeze, and a new run. The spec has nine sections, each with one job:

- Intention: the outcome pursued and why it is worth having. Short enough to hold in mind whole, because it is the tiebreaker whenever the other sections are silent.
- Scope: the perimeter. What the work changes and what it must leave untouched, with both sides of the line stated, because an exclusion left unstated reads as an invitation.
- Constraints: conditions the result must satisfy however it is reached. They are imported from the surrounding world, such as platform, policy or compatibility, and are not negotiable inside the work.
- Interfaces and contracts: the exact seams where the work meets everything around it. Fixing these is what makes parallel work possible, since two workers can only build toward a seam that already exists.
- Behaviours: numbered, testable statements of what the result observably does. One decision per entry, so that each can pass or fail alone; the count of entries is the size of the work.
- Edges and failure modes: decided outcomes at the boundaries and when the world does not cooperate. Authored adversarially, by asking how the result breaks rather than what it does.
- Decisions: judgements already made and improvements deliberately not pursued, written down so that settled ground cannot be re-argued by accident mid-run.
- Verification: how each numbered claim will be proven, as an unarguable pass or fail. The only executable section, consisting of commands and artefacts rather than statements.
- Acceptance: the short final gate, stating the conditions under which the result is accepted. Assembled purely from the sections above and forbidden from introducing anything new.

Implemented as a markdown file at the repository root, produced by the spec interviewer and read by every other role.

## Agent roles

The roles replace the human's several hats: questioner, sceptic, planner, implementer, tester, reviewer, and clerk. Under attended work one person wore all of them in turn, carrying the same context between them; here each is a separate agent with a context of its own, so that the assumptions of one hat cannot leak into another. Each role is one markdown file whose body is the role's instructions and whose frontmatter is its permissions. A unit, referred to throughout, is one build unit cut from the plan, mapped to its checks and implemented by exactly one worker. In the order they act:

- Spec interviewer: extracts the spec from the human by asking and never by drafting, one question at a time. Any answer the human defers is written into an Open Questions section verbatim, not paraphrased.
- Spec attacker: reads the draft in a fresh context with the mandate to assume it is defective. Every finding is filed as an Open Question for the human to resolve; the attacker surfaces and never decides.
- Spec judge: reads the attacked spec and rules on whether it is ready to freeze. A ruling of not ready returns it to the human with the reasons.
- Test builder: derives the executable targets from the frozen spec, one check per behaviour and per edge. Before any work starts it runs the baseline and proves that every check fails, and fails for the right reason rather than from a missing import or a typo.
- Main orchestrator: plans the run, holds each gate, dispatches workers and merges their results. It never writes code, never edits a test, and never grades its own work.
- Explorer: answers one codebase question with a short, cited return. Its purpose is to keep the raw investigation, the files read and searches run, out of the orchestrator's context.
- Interface builder: writes the seams exactly as the spec states them, before any parallel work begins. Signatures and stubs only, no behaviour; a contradiction between the spec and the codebase halts the run rather than being adapted around.
- Worker (general): implements one unit to its mapped checks in an isolated worktree. It fixes causes and never symptoms, and stops the run for a human if it meets a contradiction.
- Worker (strong): makes one escalation retry on a unit the general worker failed, on a stronger model, from a clean state, with the failure evidence in hand. It inherits the evidence and not the approach; a second failure ends attempts on that unit.
- Adversary (build unit): attacks a completed unit before merge, asking what the checks missed. It looks where units cheat: scope quietly narrowed, edges weakened, behaviour added that nobody asked for.
- Run verifier: refutes the final green. It assumes done is wrong and goes looking for the proof; its failure to find any is what makes the green credible.
- Reviewer: judges the full diff against the spec's intent from a fresh context. It exists to catch the work that passes every check and is still the wrong work.
- Report assembler: joins the recorded artefacts into the report with the provenance of each marked and no verdict of its own. An abandoned run's report is assembled exactly as an accepted run's would be.

Implemented as one subagent definition per role under the project's agents directory.

## Frontmatter permissions

The frontmatter replaces the human answering permission prompts. Each role file opens with a block that declares everything the role is allowed to reach, and that declaration is the role's blast radius: whatever is not granted there cannot be done, however the role is prompted. The role and its permissions are one concern held in one file, so that reading the file is enough to know both what the role does and what it can touch. The block must declare:

- Tools: the allowlist of tools and commands the role may call. A reviewer has read tools only; a worker has edit and its build and test commands; an explorer cannot write.
- Model and effort: which model tier the role runs on and how much reasoning it is given, so that budgets are fixed per role rather than inherited from whoever started the run.
- Isolation: whether the role runs in a temporary worktree of its own. Workers always do.
- Memory scope: whether the role persists anything between runs, and where. Most roles persist nothing.
- Permission mode: how the harness treats the role's actions when no human is present to approve them.
- Role-scoped hooks: checks that run around this role's actions and no other's, such as a test run after every edit a worker makes.

Implemented as the YAML frontmatter of each subagent definition, together with the project's permission settings and sandbox configuration.

## claude.md

The project instruction file replaces the working knowledge the human carried into every session without thinking about it: how to build, how to test, which conventions are unusual here, what tends to go wrong. It is loaded into every context at the start, so it must be short and stable; every line costs attention in every agent, and an overlong file causes its important lines to be ignored. It belongs to the repository, not to any run.

What belongs in it:

- The build and test commands, exactly as they are to be run.
- Conventions that differ from what a competent engineer would assume.
- Repository etiquette: branch naming, commit shape, what may not be committed.
- Project-specific gotchas: non-obvious behaviours, required environment, known traps.
- Compaction instructions naming what must survive a summary: the files changed, the verifying commands, the decisions made.

The tests for cutting a line:

- Would removing it cause an agent to make a mistake? If not, it goes.
- Could an agent learn it by reading the code? If so, it goes.
- Is it something that must happen every time without exception? Then it is not an instruction at all; it moves to a hook.

Implemented as the CLAUDE.md file at the repository root.

## Skills

Skills replace the specialist knowledge and the practised routines the human reached for only when a task called for them. Unlike the project instruction file they load on demand, so they can hold as much as the domain needs without taxing every context. A skill is either knowledge, such as the conventions of a particular API, or a workflow, a sequence of steps that is followed the same way each time it is invoked.

- Knowledge skills are loaded when their subject comes up and otherwise cost nothing.
- Workflow skills take arguments, so the same routine runs against a different target each time.
- Any workflow with side effects outside the repository disables invocation by the model. Only a human can trigger it, by name.

Implemented as SKILL.md files under the project's skills directory, each with a name, a description that governs when it loads, and the flag that withholds it from model invocation where required.

## Hooks and check runners

Hooks replace the human asking "did you run it?". They are scripts the harness executes at fixed points in an agent's loop, regardless of what the agent intended, so that a check that must happen does happen and an action that must not happen cannot. An instruction to run the tests is a request; a hook that runs them is a guarantee. Every check a run depends on is wired to a hook rather than left to an agent's diligence.

- Before an action: a hook that inspects the intended tool call and blocks it. This is how a forbidden path, a destructive command or an out-of-scope edit is prevented rather than discouraged.
- After an action: a hook that runs a linter, a type check or the relevant tests whenever a file changes, so that evidence accumulates continuously.
- At the end of a turn: a hook that runs the definition of done and refuses to let the agent stop until it passes. The harness imposes its own ceiling here and ends the turn after eight consecutive refusals, so this hook is a gate, not a loop that runs forever.

Implemented as PreToolUse, PostToolUse and Stop hooks in the project settings, invoking scripts kept in the repository.

## Test harness

The test harness replaces the human's judgement that the work is done. It is the executable definition of done together with the machinery that runs it. A check is one executable pass-or-fail derived from one numbered behaviour or one edge in the spec; the harness is the full set of checks and the single command that runs them. The checks are written before any code, and the harness is run once against the untouched codebase to prove that every check fails, and fails for the right reason, before a worker is dispatched. A check that passes on the baseline tests nothing; a check that fails on the baseline for the wrong reason will pass for the wrong reason too.

- One check per behaviour and per edge, each traceable to its spec entry by number.
- One command runs the whole harness and returns one exit code. A subset runs the checks mapped to one unit.
- Output is terse enough to be read in an agent's context and unambiguous about which check failed and why.
- The same command works identically whether an agent, a hook or a human invokes it.
- The harness itself is not editable by workers. Only the test builder writes checks; a worker that cannot pass a check fixes the code.

Implemented with the project's test runner, invoked by the single command recorded in the project instruction file.

## Goal evaluator

The goal evaluator replaces the human deciding, at the end of each turn, whether to say "keep going" or "that's done". It is a separate, small and fast model that reads a stated condition and the transcript so far after every turn, and returns met, not yet met, or impossible. The agent doing the work no longer decides when it is finished. Its blind spot is the one that shapes how conditions are written: it runs no tools and reads no files, so it can only judge what the working agent has surfaced in the transcript. A condition that depends on something never printed can never be met. A usable condition contains:

- One observable end state, not a compound of several.
- The check that proves it, named as a command whose output will appear in the transcript.
- The constraints that must not be violated on the way, such as files that stay untouched.
- A cap on turns, so that an unreachable condition stalls the attempt rather than running indefinitely.

Implemented as the goal command, which is a session-scoped stop hook evaluated by the configured small model; a custom stop hook is the same mechanism with hand-written logic.

## Liftoff prompt

The liftoff prompt replaces the human's opening message and every steering message they would have sent after it. It is the rich starting prompt handed to the orchestrator at liftoff, and it defines the shape of the run, never the outcome; the outcome lives in the spec and the liftoff prompt points to it. Where the spec says what is to be built, the liftoff prompt says how this run is to go about it: which roles are in play, in what order, on what budgets, and with what gates. It must name:

- The spec, and the frozen state it is in.
- The files and interfaces involved, so that no agent has to discover the perimeter for itself.
- What is out of scope for this run, restated from the spec's scope so that it is in front of the orchestrator from the first turn.
- The end-to-end check that proves the run, the single command whose green is the run's acceptance.
- The budgets: retry caps, model tiers per stage, and the stalled condition.
- The gates, in order, and what evidence each requires.

Implemented as a saved prompt or command in the repository, invoked with the spec as its argument.

## Plan

The plan replaces the human's mental decomposition of the work, which under attended sessions was never written down and never checked. In a run it is a file the orchestrator produces before dispatching anything, and it is the first gate: a checkpoint the run must pass on evidence or be abandoned at. The plan decomposes the spec's behaviours into units, each small enough to be implemented by one worker and verified by its own subset of checks, and maps every check to exactly one unit so that nothing is left unowned. It is written as an artefact a human can read and edit before execution, and the run does not proceed past it until it has been approved. A plan whose units cannot be verified alone, or whose check map has gaps, fails the gate and the run stops there, having cost only a plan.

Implemented as a markdown file in the run's output directory, produced by the orchestrator in plan mode and approved before the orchestrator leaves it.

## Dynamic workflows

Dynamic workflows replace the human sequencing the work by hand: deciding what runs next, waiting for it, reading the result, and starting the next thing. They are the harness's prebuilt orchestration tooling, and their defining property is that the plan moves out of a model's context and into a script. The script holds the loop, the branching and every intermediate result; the agents it spawns do the work; and the orchestrator's context receives only the final answer. This is what makes the orchestrator's context gapped from the workers' by construction rather than by discipline. The design of a run must respect what the runtime does and does not allow:

- A run's script is saved and runs as a named command. The same orchestration runs the same way every time it is invoked.
- A run is resumable within its session: completed agents return their saved results, and only the failed agent and everything that started after it run again.
- The script cannot take human input mid-run. Each gate that needs a human's approval is therefore the end of one workflow and the start of another.
- The script cannot read the clock or draw randomness; both raise errors, so that a relaunch makes identical calls. Anything time-dependent is passed in as an argument.
- The script itself has no filesystem or shell access. Everything that touches the repository is done by an agent it spawns.
- The model is named per stage, so judgement stages and iteration stages run on different tiers.
- A size guideline bounds how many agents a run aims for, and the runtime caps concurrency and the total agent count, so a runaway script is bounded in cost.

Implemented as the harness's dynamic workflows, saved under the project's workflows directory and invoked by name.

## Worktrees, atomic commits and run branches

The git structure replaces the human keeping parallel work apart and saving before anything risky. Three pieces do the work together: worktrees isolate agents from one another, atomic commits make every unit a save point, and run branches keep each run's history separate from the mainline and from other runs.

- Each worker declares worktree isolation in its frontmatter and receives a temporary checkout of its own. The checkout is removed automatically if the worker changes nothing.
- Each unit lands as one commit, so that resuming after a failure is a checkout of the last good commit rather than an unpicking of half-finished edits.
- Each run works on its own branch, cut from the mainline at liftoff. An abandoned run's branch is kept for its evidence and never merged; an accepted run's branch is merged once, after final review.

Implemented with git worktrees, the worktree isolation setting on subagent definitions, and a branch naming convention recorded in the project instruction file.

## Handoffs

Handoffs replace the human carrying a result from one step to the next. A handoff is a file written by one agent and read by the next, and it is the only channel between them: there is no shared memory, no reading of another agent's transcript, and no agent whose context contains another's working. What passes through a handoff is a result, not a process. A worker hands off the commit it made, the checks it ran and their output, and nothing about how it got there; an explorer hands off an answer with citations, not the search that found it. Where the harness can validate an agent's return against a declared schema, handoffs are structured data rather than prose, so that the receiving agent parses fields instead of interpreting sentences.

Implemented as files in the run's output directory, and as schema-validated returns from agents spawned inside a workflow.

## Run outputs

Run outputs replace everything the human would have seen and remembered while watching. They are the artefacts a run writes as it goes, so that what happened can be read afterwards without the run's context, and so that two runs can be compared. A run that leaves no outputs has taught nothing whether it succeeded or failed. Every run must leave behind:

- Events: what each agent started, finished or failed, with timestamps.
- Test results: the output of every harness run, including the baseline.
- The test map: which check belongs to which unit, and the state of each at the end.
- Handoffs: every file passed between agents.
- The run's script: the orchestration exactly as it executed, so that shape can be diffed between runs.
- Token totals per agent and per stage, so that cost can be diffed between runs.
- The report, assembled from all of the above.

Implemented as a per-run directory in the repository, written to by hooks, agents and the workflow runtime.

## Final review

The final review replaces the human's last look before shipping. It is the last gate and its artefact combines two things that must both hold: the harness is green, as proven by the run verifier's failure to refute it, and the reviewer has judged the full diff against the spec's intent and found it to be the right work. Either alone is insufficient; a green with the wrong work is caught by the second, and the right work with a failing check is caught by the first. The result is recorded in the report, which the report assembler builds from the recorded artefacts with provenance marked and without a verdict of its own. The report is built the same way whether the run passed this gate or was abandoned at an earlier one, so that a failed run's evidence is as legible as a successful one's.

Implemented as the last stage of the run's workflow, producing the report file in the run's output directory.

## Run log

The run log replaces what the human learned from a session and carried, unwritten, into the next. It is the record kept across runs, and its single most important field is the axis on which each failed run failed. Every failure belongs to one of three, and naming it is what turns a discarded run into an improved input for the next:

- Context: the run had the wrong material. The spec, the liftoff prompt or a role's tailored context was missing, wrong or ambiguous.
- Verification: the checks did not catch what they should have. A behaviour was untested, a check passed for the wrong reason, or an edge was not decided.
- Tooling: the machinery misbehaved. A hook did not fire, a handoff was malformed, a permission was too wide or too narrow.

The log also records what succeeded, so that a working configuration is not changed by accident while a failing one is being fixed.

Implemented as an append-only markdown file in the repository, one entry per run.

## Sources

- Best practices for Claude Code — https://code.claude.com/docs/en/best-practices
- Orchestrate subagents at scale with dynamic workflows — https://code.claude.com/docs/en/workflows
- Keep Claude working toward a goal — https://code.claude.com/docs/en/goal
- Create custom subagents — https://code.claude.com/docs/en/sub-agents
- Hooks — https://code.claude.com/docs/en/hooks
- Worktrees — https://code.claude.com/docs/en/worktrees
- Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Writing effective tools for AI agents — https://www.anthropic.com/engineering/writing-tools-for-agents
