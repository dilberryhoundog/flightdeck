# Agentic principles

A principle here is a recurring element of agentic work: a factor that decides whether a session at an agentic coding terminal ends in something useful or in wasted turns. Each one names a behaviour, the failure that behaviour prevents, and the practice that embodies it. They emerged from building and investigating turn by turn, where the person at the keyboard supplies most of them by habit.

They are stated as universal principles because they hold for any agentic task, however small, whoever or whatever is directing it. Other documents restate the same principles under different operating conditions. This one is the foundation those restatements draw from, and the definitions here are the ones they refer back to.

## Agent Invariants

- An agent's claim of completion is never accepted; only a check the agent did not grade counts.
- Proof is a command and its output. A description of what happened is not proof.
- No two sessions touch the same files. Work is committed often enough that any single destructive command loses minutes, not hours.
- An agent never has more reach into the machine than the task in front of it requires.
- The simplest arrangement that could work is tried first: one agent before several, a prompt before a script.

## Operating conditions

The conditions these principles were formed under are those of the human in the loop (HITL): an agentic engineer present at the terminal, reading each turn, and steering the next. Every principle below can be applied by that person without any supporting machinery, which is why they are so often applied by reflex and never written down.

- Controlled: every action is seen, and a wrong turn is caught at the next prompt.
- Cheap: one session, one model, one line of work at a time; spend is bounded by attention.
- Time consuming: the human's reading speed is the throughput ceiling.
- Productivity limited: work happens serially, and only while someone is watching.
- Session size limited: a single context window, and the human's own memory of it, bound how much can be held at once.

## Context engineering

Context engineering is deciding what an agent is looking at when it acts. The failure it prevents is the overloaded window: an agent given everything that might be relevant loses track of what is, and an agent given only the task fills the gaps with guesses about what is off limits. The behaviour is to supply the smallest set of high-signal material that still produces the outcome, and to state the perimeter as well as the target, because an unstated exclusion reads as permission.

- Minimal is not short. The agent needs enough to act correctly without asking; it does not need anything it could read for itself.
- Pitch instructions at the right altitude: concrete enough to steer, general enough to survive situations the author did not foresee. Neither hard-coded branching nor vague intent works.
- Prefer references to contents. A file path, a query, or a link that the agent resolves when needed costs less than the material itself loaded up front.
- Treat repeated correction as a signal about the context, not the agent. After the second correction on one issue, the window holds too many failed approaches; clear it and restate the task with what was learned.

## Verification

Verification is confirming that what the agent produced works and fits the code around it, before the work is treated as finished. The failure it prevents is the plausible result: an implementation that reads correctly, is described confidently, and does not handle the case that matters. An agent stops when the work looks done, and if nothing can contradict that impression, "looks done" is the only signal anyone has. The behaviour is to put a check in front of the agent that returns a pass or a fail it can read, and to require evidence, meaning the command that was run and what it returned, rather than an account of what was done.

A check can take many shapes; what they share is an unarguable result:

- a test suite;
- a build or type-check exit code;
- a linter or formatter;
- a script that diffs output against a stored fixture;
- a screenshot compared against a design;
- a search for a pattern that must, or must not, be present.

## Observability

Observability is knowing what the agent is about to do and why, early enough to change it. The failure it prevents is compounding misdirection: a small misreading in one turn that every later turn builds on, invisible until the result is wrong in a way that is expensive to unpick. The behaviour is presence. Ask the agent for its intention before it acts, watch the direction of its work rather than only its output, and steer at the first sign of drift rather than the tenth. A correction made on the turn the drift began costs one message; the same correction ten turns later costs the ten turns.

## Review

Review is judgement of the agent's work by something that did not produce it. Verification asks whether the result passes its checks; review asks whether it is the right work at all, and whether the checks themselves were adequate. The failure it prevents is self-grading: an agent that reasons its way to an implementation will reason its way to approving it, because it carries the same assumptions into both. The behaviour is isolated judgement, and it is the oldest habit in working with AI: the human reads what was made and decides for themselves whether it is done.

- Give the reviewer the diff and the criteria, and nothing else. The reasoning that produced the change is the thing most likely to bias the reviewer, so it stays out.
- Limit findings to correctness and the stated requirements. A reviewer asked to find gaps will always find some; unconstrained, this produces defensive code and abstractions for cases that cannot occur.
- Keep review distinct from verification. A green check is an input to review, not a substitute for it.

## Decomposition

Decomposition is breaking an ask into pieces the agent can finish and be checked on one at a time. The failure it prevents is the single large task that is half done everywhere and finished nowhere, with a context full of the wrong kind of detail for whatever step comes next. The behaviour is to split either by size, into chunks small enough to verify individually, or by kind, separating the different sorts of work an ask contains and doing each in its own pass.

- Separate exploring from planning from implementing from committing. Research fills a window with material that implementation does not need; each phase is cleaner in a window of its own.
- Do not plan what does not need planning. If the whole change can be described in one sentence, planning it costs more than it saves.
- Push investigation into a subagent that reads widely and returns only a distilled summary, so the main window keeps what it needs for the work.
- Choose the simplest arrangement first. One agent before several; a plain prompt before a scripted workflow. Add structure only when the simpler shape has failed.

## Isolation and recoverability

Isolation keeps one line of work from colliding with another; recoverability keeps any single mistake from costing more than the turns since the last save. The failures they prevent are the two that end sessions badly: two agents editing the same file in different directions, and one destructive command, such as a hard reset, erasing an afternoon of unsaved work. The behaviour is to give each session its own files, and to commit often enough that the blast radius of any one command is small.

- Run parallel sessions in separate git worktrees so their edits cannot touch.
- Commit small and often. A commit is the only save point that survives everything.
- Do not mistake the session's own rewind for a backup. It records only the changes made through the agent's editing tools; anything done through a shell command or an external process is outside it. Git is the durable record.

## Budgets and stop conditions

Budgets match the resources spent to the difficulty of the task; stop conditions decide when to stop spending on an approach that is not working. The failure they prevent is escalation by inertia: the strongest model on a trivial change, or a session steered back toward the goal for the fifth time when a fresh start would have arrived already. The behaviour is to choose the cheapest model that can do the work, and to treat a drifting session as finished rather than salvageable.

- Match the model to the task. Easy, well-specified work goes to a cheaper, faster model; reserve the strongest for judgement and ambiguity.
- Clear the window between unrelated tasks so one does not pay for the other's residue.
- When the window must be compacted, say what has to survive: the files changed, the commands that verify, the decisions made.
- Restart rather than rescue. A clean session with a better opening prompt outperforms a long session carrying its own corrections.

## Permissions and blast radius

Permissions bound what an agent is allowed to do; blast radius is how much damage a wrong action can cause within those bounds. The failure they prevent is an agent doing something dangerous to the machine, or reaching into areas it had no reason to touch, because nothing stopped it. The behaviour is to grant the minimum the task needs and to make the irreversible impossible rather than merely discouraged.

- Allowlist the specific tools and commands the task needs, rather than approving broadly to stop the prompts.
- Sandbox filesystem and network access so that the agent's reach ends where the task does.
- Write deny rules for actions that cannot be undone.
- Treat any automatic action classifier as a backstop behind these, not as a replacement for a small allowlist.

## Sources

- Effective context engineering for AI agents — https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Building effective agents — https://www.anthropic.com/research/building-effective-agents
- Writing effective tools for AI agents — https://www.anthropic.com/engineering/writing-tools-for-agents
- Best practices for Claude Code — https://code.claude.com/docs/en/best-practices
