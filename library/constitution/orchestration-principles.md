# Orchestration principles

A run is one unattended execution of a piece of work, from the moment it is started to the moment a report exists, directed throughout by an orchestrator: an agent that plans, holds the gates, dispatches workers and merges their results, and never does the work itself. Under a run, every principle of agentic work still holds. What changes is that the person who used to apply them by reflex is not there. Each principle has to be given a shape that survives their absence.

The first half of this document takes the universal agentic principles in their original order and restates each for a run: what the human did, what now does it instead, and what goes wrong if nothing does. The second half defines the principles that have no counterpart under attended work, because they exist to cover conditions that only an unattended run creates.

## Agent Invariants

- What is built is fixed; how it is built is not.
- A rule an agent should follow is a rule it will eventually break. Only a rule it cannot break holds.
- Every passing result is presumed wrong until a fresh context has tried to break it and failed.
- No agent grades its own work. The judge sees the result and the criteria, never the reasoning.
- The orchestrator never reads a worker's transcript. It receives handoffs, nothing else.
- A failed run is discarded, its failure recorded, and its inputs improved. The run is disposable; the inputs are the investment.

## Universal principles with an orchestration lens

A run inverts the conditions of attended work. Each property that made the human-in-the-loop session safe has an opposite here, and each opposite is the reason one of the principles below needs machinery where it used to need only a habit.

- Autonomous, where attended work was controlled: nobody sees an action before it happens, so the wrong turn is caught by the next gate, not the next prompt.
- Expensive, where attended work was cheap: many agents, several models and repeated attempts all bill at once, and spend is bounded by ceilings rather than by attention.
- Dangerous, where attended work was safe by observation: an agent with a capability will eventually use it, and nothing stands between the capability and the machine except what was configured.
- Highly productive, where attended work was limited by reading speed: work proceeds in parallel and continues without anyone present.
- An unlimited work budget, where attended work was bounded by one session: a run can spawn as many contexts as the task needs, so no single window has to hold everything.

### Context engineering

Under attended work the human supplied context one turn at a time: a file here, a clarification there, a decision whenever the agent hit a fork. A run has no next turn to wait for, so the context must carry, from the start, everything the whole run will need, including every judgement the human would otherwise have made mid-run: which fork to take at each known boundary, what to leave untouched, when to stop and ask. Without this, an agent facing a fork picks one, and the run proceeds confidently on the wrong branch until something breaks it.

- Author the context for the entire run, not the first step. Boundaries, exclusions and decided questions are written down before anything starts.
- Keep the orchestrator's window clean. Workers and explorers return distilled summaries through handoffs; their raw investigation never enters the context that directs the run.
- Load material where it is needed. Each role reads its own tailored context and nothing belonging to another role.

<!--
+ template everything, iterate improvements
-->

### Verification

Under attended work the human ran the check, or asked for it, and read the result. In a run the checks must run themselves, and their results must land somewhere an evaluator can see them: in the transcript or on disk. Anything an agent verified but did not surface is, for every purpose that matters, unverified. A green is a check that passed; a green run is one where every check has. How strongly a green gates progress is a design choice with four settings, each trading more setup for less reliance on the agent's own diligence:

1. In the prompt: the agent is asked to run the check and iterate until it passes. The weakest gate; it relies on the agent remembering.
2. A goal condition: a separate evaluator re-reads the transcript after every turn and decides whether the stated condition is met. The agent doing the work no longer decides when it is finished.
3. A deterministic stop hook: a script runs the check and refuses to let the turn end until it passes. No judgement is involved.
4. Fresh-context refutation: a separate agent that did not do the work tries to prove the green wrong. The strongest gate, and the only one that catches a check that was itself inadequate.

### Observability

Under attended work observability was a person watching the terminal. In a run there is no terminal to watch, so the run has to emit what the person would have seen, as it happens, in a form that can be read without the run's own context. The risk being managed is the same as before, compounding misdirection, but the multiplier is larger: a misreading in one worker propagates into every unit that depends on it, and into every retry. The run must make drift visible early enough to abandon it cheaply.

- Events: what each agent started, finished, or failed, with timestamps.
- Progress per agent: which unit, which checks are green, which attempt.
- Spend per agent and per stage: tokens and model, so cost is visible before it is surprising.
- Evidence as it lands: check output and handoffs written to disk as they occur, not assembled at the end.

### Review

Under attended work review was the human reading the result. In a run it is an agent in a fresh context, and the discipline of isolation becomes structural rather than habitual: the reviewer receives the diff and the criteria it is judged against, and never the transcript of the agent that produced it. The implementing agent does not grade its own work under any circumstances. A run goes further than review, subjecting every artefact to deliberate attempts to break it; that posture is defined below as adversarial attack, and review remains the name for the final judgement of whether the work is the right work.

- The reviewer's inputs are the diff, the spec's intent, and nothing produced during implementation.
- Findings are limited to correctness and stated requirements. An unconstrained reviewer reports gaps whether or not they matter, and a run has no human to discount them.
- Review runs once, at the end, on the whole. Attacks run at every stage, on the parts.

### Decomposition

Under attended work decomposition was the human splitting an ask into chunks and feeding them in sequence. In a run the chunks are worked in parallel by workers, each an agent that implements one unit in isolation, and parallelism changes what decomposition has to guarantee. Two workers can only proceed at once if the seam between them is fixed before either starts; otherwise each invents the interface it needs and the pieces do not meet. So interfaces and contracts are written first, as signatures without behaviour, and the units are cut along them.

- Fix the seams before dispatch. Every interface a unit depends on exists, in stub form, before the unit is assigned.
- Workers answer upward, never sideways. Each is accountable to the orchestrator for its unit and its checks, and never coordinates with another worker.
- The orchestrator's context is gapped from the workers'. It sees handoffs and check results; it does not see how a worker got there.
- Units are sized to be verified alone. A unit whose checks cannot pass without another unit's behaviour is cut wrong.

### Isolation and recoverability

Under attended work isolation meant not running two sessions on the same files, and recoverability meant committing regularly or before doing anything risky. In a run many agents work at once, so isolation is per agent and recoverability is per agent too: the aim is that any single failure can be retried without touching what already succeeded.

- One worktree per worker. No two agents share a checkout.
- One atomic commit per unit. Resumption is a checkout, never an unpicking of half-finished work.
- Restart the agent, not the run. Completed agents replay from their saved results; only the failed one, and whatever started after it, runs again.
- Order fan-outs so that cheap work finishes first. A failure part-way through a fan-out reruns everything dispatched after it, so expensive units are dispatched last.

### Budgets and stop conditions

Under attended work the budget was the human's patience: when a session had gone on too long or cost too much, they stopped it. A run has no patience to run out of, so every limit that was implicit has to be declared. Spend, retries, attempts per unit and the model tier at each stage are all ceilings written before the run starts, and the condition under which the run is stalled is defined as precisely as the condition under which it is done.

- Completion is decided by a separate evaluator reading observable output, never by the working agent's own judgement. The condition names one end state, the check that proves it, the constraints that must hold, and a cap on turns.
- A stalled state is defined in advance: several consecutive turns with no tool use, or two rounds that produce no new progress, ends the attempt. The harness enforces its own ceiling as well, ending a stop-hook loop after eight consecutive blocks.
- Retries are capped per unit, with the escalation path fixed: one stronger attempt from a clean state, then the run stops for a human.
- Models are named per stage and the run's size is guided per run. The strongest model is reserved for judgement; cheaper models do the iteration.
- The shape is proven on a small slice before the full run is paid for.

### Permissions and blast radius

Under attended work permissions were negotiated at the prompt: the agent asked, the human approved or declined, and a bad request was refused on sight. In a run nobody is there to decline, so any action an agent is allowed to take is one it will take, unattended, at some point. Permissions are therefore declared per role, in advance, and set to the minimum each role's job requires.

- Each role has its own allowlist. A reviewer cannot edit; a worker cannot merge; an explorer cannot write.
- Filesystem and network are sandboxed so that a role's reach ends at its worktree and the services it needs.
- Irreversible actions are denied outright, not left to judgement.
- Workflows with side effects outside the repository are invoked by a human only; no agent may trigger them.
- An automatic action classifier is a backstop behind these rules, not a substitute for them.

## Beyond the universal principles

The principles that follow have no counterpart in attended work. The machinery behind most of them existed while a human was present, but it went unused for a sound reason: with someone at the terminal it was always faster to do the thing by hand, or push through, than to build the apparatus. A run removes that option. These six principles are what covers the ground the human used to cover without noticing.

### Abandon failed runs

A run is not attempted in the expectation that it will succeed first time. It is one iteration toward success, and the value of a failed one is entirely in what it teaches about the inputs. Investing in the outcome of a particular run, by patching its results or coaxing it back on course, spends effort on something that will be thrown away and leaves the inputs no better for the next attempt. The run is disposable; the spec, the tests, the liftoff and the tooling are the investment.

- Stop the run at the first gate it fails. Do not carry it forward in the hope that later stages compensate.
- Record each failure against the axis it belongs to, and record what succeeded, so the next run starts from the improved input rather than the same one.
- Improve the input, then run again from clean. Never resume a failed run with corrections.

### Repeatable

Abandoning runs is only affordable if running again is cheap, and running again is only informative if the second run differs from the first in exactly the way intended. Repeatability makes both true. Each stage of a run is a discrete, restartable step, so a failure at one stage does not mean redoing every stage before it; and the orchestration itself is a saved artefact that runs the same shape every time, so a relaunch is a controlled experiment rather than a fresh roll of the dice.

- The orchestration is a script, saved and rerun, not a sequence of decisions remembered from last time.
- Nothing inside the run depends on the clock or on chance. A relaunch makes the same calls in the same order.
- Every failure is placed on one of three axes: context, meaning the run had the wrong material; verification, meaning the checks did not set the behaviour they should have; or tooling, meaning the machinery misbehaved. Improvement is made on that axis only, and the run starts clean.

### Deterministic tools

An unsupervised agent is only guaranteed to behave when it cannot do otherwise. An instruction that it should not do something is advisory; over enough turns and enough agents, it will be ignored at least once, and once is enough. Every guarantee a run relies on must therefore be enforced by something deterministic, a script or a permission rule that does not consult the agent, and every tool an agent uses must return output terse and unambiguous enough that there is no room for interpretation.

- Enforce with hooks, not instructions. A check that must run, runs from a hook; a file that must not change is blocked by a rule.
- Keep the toolset minimal and non-overlapping. If it is not obvious which tool applies, the agent will choose wrongly some of the time.
- Return terse, unambiguous output, paginated or truncated where large, with errors that say what to do next rather than what went wrong internally.
- Reach external services through command-line tools rather than raw API calls; they are the most context-efficient seam and their behaviour is already well understood.

### Checkpoints

Continuous steering is replaced by discrete gates: points at which the run either passes on evidence or is abandoned. A gate is a checkpoint the run must clear, and the value of gating is that failure is discovered where it is cheapest, before the expensive stages have been paid for. A run that fails at the plan costs a plan; a run that fails at final review with no earlier gates has cost everything.

1. The plan. Produced first, as an artefact that can be read and edited before anything is dispatched.
2. The interfaces. Written as stubs before parallel work begins; a contradiction with the spec halts here.
3. Each unit before merge. Its checks green and its adversary's findings answered.
4. Final review. Test results and the reviewer's judgement of the whole, combined into the last gate.

### Expressive freedom

Expressive freedom is a coined term for a finding that runs against intuition: many agents, adequately managed, produce better work when given freedom of approach than when instructed directly. Direct instruction of many agents is not only too much overhead to write; it also fixes the one thing the agents are better placed to decide than the author, which is how to reach the target from where the code actually is. The working form is a bucket: the orchestrator supplies the objective, the output format and the boundaries, and the worker fills the bucket however it can. Cheaper models iterating against a red-and-green check, free to try approaches until one passes, outperform a single attempt from the strongest model instructed step by step. When they cannot fill the bucket, the response is to re-specify the bucket and go again, not to instruct harder.

The freedom is bounded on one side only. How the work is built is unconstrained; what is built is heavily controlled. The outcome, the interfaces, the constraints and the decided questions are fixed by the spec and are not the worker's to reinterpret. Freedom applies to the path and never to the destination, and a worker that widens its freedom into scope, edges or contracts is the case the adversary exists to catch.

### Adversarial attack

An adversarial attack is a fresh-context attempt to break an artefact rather than to confirm it. Under attended work, review was a posture of reading and judging; in a run that posture is not enough, because there is no human intuition to notice that a green feels wrong. The attack replaces intuition with mandate. An agent that had no part in producing the artefact is told to assume it is defective and to go looking, and its failure to find anything is what makes acceptance credible. A green that nothing has tried to break is merely untested.

- The spec draft, before it is frozen: attacked for gaps, contradictions and unstated assumptions.
- Each completed unit, before merge: attacked for what its checks missed, and for where it cheated by narrowing scope, weakening edges or adding behaviour nobody asked for.
- The final green, before review: attacked on the assumption that done is wrong.
- The full diff, at review: judged against intent, catching work that passes every check and is still the wrong work.

## Sources

- Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- How we built our multi-agent research system — https://www.anthropic.com/engineering/multi-agent-research-system
- Writing effective tools for AI agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- Best practices for Claude Code — https://code.claude.com/docs/en/best-practices
- Orchestrate subagents at scale with dynamic workflows — https://code.claude.com/docs/en/workflows
- Keep Claude working toward a goal — https://code.claude.com/docs/en/goal
- Create custom subagents — https://code.claude.com/docs/en/sub-agents
