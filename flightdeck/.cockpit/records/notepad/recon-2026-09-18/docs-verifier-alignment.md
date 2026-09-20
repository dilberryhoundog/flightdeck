# docs-verifier: alignment practices — M001

Crew report, C015 (claude-code-guide, Sonnet), received 2026-09-18 by SendMessage. Pilot's spot check the same day: source 1 (effective harnesses, 2025-11-26) and source 4 (agent teams, v2.1.178+) fetched; all quoted phrases present. Sources 2, 3, 5, 6 not fetched by the pilot. Also delivered to mission-cutter.

## Source 1: Effective harnesses for long-running agents
URL: https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents — dated 2025-11-26
- Each session starts with no memory of prior work: "each new session begins with no memory of what came before."
- Use a specialized initializer session before ordinary work sessions begin.
- Every session should leave things ready for the next: make it "leave the environment in a clean state."
- Keep a durable progress file plus git history as the state-recovery mechanism: "the claude-progress.txt file alongside the git history."
- Track goals as a checkable feature list, initially marked failing, so "done" is machine-verifiable.
- Standard session startup sequence: read progress notes, review git log, check feature list, verify functionality by testing, then advance one feature.

## Source 2: How we built our multi-agent research system
URL: https://www.anthropic.com/engineering/multi-agent-research-system — dated 2025-06-13
- Orchestrator (lead) analyzes the query, plans, then delegates: "the lead agent analyzes it, develops a strategy, and spawns subagents."
- Vague task descriptions cause failure: short instructions "often were vague enough that subagents misinterpreted the task."
- Every subagent needs an explicit goal and done-definition: "an objective, an output format, guidance on the tools and sources to use, and clear task boundaries."
- Scale effort to task complexity (1 agent/3-10 calls for simple facts, more agents for comparisons).
- Use rubric-based LLM-as-judge for evaluation: "factual accuracy, citation accuracy, completeness, source quality, and tool efficiency."
- Human review catches gaps evals miss, including systematic bias (e.g. agents favoring SEO content farms over authoritative sources).

## Source 3: Effective context engineering for AI agents
URL: https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents — dated 2025-09-29
- Anthropic's memory tool stores state "outside the context window through a file-based system."
- Maintain a running progress artifact: agent "maintaining a NOTES.md file... allows the agent to track progress across complex tasks."
- Compaction summarizes context near limits with minimal loss: "enabling the agent to continue with minimal performance degradation."
- Clean-context handoffs to subagents: each "returns only a condensed, distilled summary of its work."
- Guiding heuristic for all context decisions: "find the smallest set of high-signal tokens that maximize the likelihood of your desired outcome."

## Source 4: Orchestrate teams of Claude Code sessions (docs)
URL: https://code.claude.com/docs/en/agent-teams — version noted as of Claude Code v2.1.178+ (no separate publish date shown)
- Teams best fit independent, parallelizable work: "Agent teams are most effective for tasks where parallel exploration adds real value."
- Size tasks so they produce "a clear deliverable" — not too small (coordination overhead) nor too large (drift before check-in).
- Recommends monitoring, not unattended runs: "Letting a team run unattended for too long increases the risk of wasted effort."
- Adversarial/competing-hypothesis framing improves correctness over sequential investigation (avoids anchoring bias).
- Teammates don't inherit lead's conversation history — goals must be stated explicitly in the spawn prompt: "Include task-specific details in the spawn prompt."
- Quality gates can be enforced via hooks (TeammateIdle, TaskCreated, TaskCompleted) to block premature "done" states.

## Source 5: Create custom subagents (docs)
URL: https://code.claude.com/docs/en/sub-agents (also mirrored at docs.claude.com/en/docs/claude-code/sub-agents)
- Subagent's description is its dispatch contract: "Claude uses each subagent's description to decide when to delegate tasks."
- Best for self-contained, verbose-output work returning only a summary, keeping the caller's context clean.
- Project-scoped agents (`.claude/agents/`) should be version-controlled for team reuse.
- Restrict scope explicitly via `tools` allowlist / `disallowedTools`, and `permissionMode`, rather than relying on prose alone.

## Source 6: Building Effective AI Agents
URL: https://www.anthropic.com/research/building-effective-agents — dated 2024-12-19
- Success/done should be objectively verifiable where possible: "Code solutions are verifiable through automated tests"; "Success can be clearly measured through user-defined resolutions."
- Add complexity only when justified by evidence: "consider adding complexity only when it demonstrably improves outcomes."
- Iterate against real usage: "Run many example inputs...to see what mistakes the model makes, and iterate."
- Sandbox and guardrail agentic systems during development and testing.

## Pilot's incidental findings from the spot check of source 4 (2026-09-18)
- "Start with 3-5 teammates for most workflows... Three focused teammates often outperform five scattered ones." So the old rule-of-three had a source; the commander's rule (small, reasoned, no cap) stands and is consistent with it.
- "When Claude messages an in-process teammate that is no longer running, Claude Code brings it back in the same session, restores any conversation saved for it, and gives it the message as its next prompt. After you resume a session, teammates aren't brought back this way." Bears on W007 (resume by name): within a session yes, across `pilot.sh resume` no.
- Teammates' cache TTL is five minutes by default; `subagentPromptCacheTtl: "1h"` extends it at a higher write rate. Candidate for `pilot.settings.json` once cost is measured.
- Agent definitions from an `--add-dir` directory are re-applied to a revived teammate only if that folder is trusted. Bears on W003.
