# Adversarial review: orchestration-principles

## Adversarial resources

**Work**: `library/constitution/orchestration-principles.md`

**Criteria**:
- Sources use web based Anthropic best practices or official writing.
- If no official source is present for the principle, use best prior knowledge available.
- Each orchestration principle has its most important aspects highlighted.
- Each principle is scoped to orchestration relevance.

## Findings

**F1** — **Fan-out ordering rule is inverted relative to the replay semantics it cites**
**S-H** · **C-H**
**FINDING**:
The Isolation and recoverability bullet tells the orchestrator to dispatch expensive units last. Under the replay behaviour it reasons from, that maximises the expensive work exposed to rerun. Agents dispatched before a failure replay from cache; agents dispatched after it rerun. The cost-minimising order is expensive-first, cheap-last. The stated rationale is a non-sequitur and the rule is the opposite of what the source implies.
**EVIDENCE**:
Work line 80: "Order fan-outs so that cheap work finishes first. A failure part-way through a fan-out reruns everything dispatched after it, so expensive units are dispatched last."
Source (workflows, Resume after a pause): "Failed: runs again, and so does every agent that started after it, even ones that completed... If a script starts A, B, C, and D in that order and B fails, relaunching returns A from cache and runs B, C, and D again."
Case: dispatch cheap A, cheap B, expensive C, expensive D. A fails; relaunch reruns A, B, C, D and both expensive units are paid twice. Reverse order (C, D, A, B): A fails, C and D return from cache; only A and B rerun.

**F2** — **"Expressive freedom" states an empirical comparison as a finding with no source in the Sources list**
**S-M** · **C-M**
**FINDING**:
The section presents a comparative claim (cheap models iterating against a check beat a strongest-model single attempt under step-by-step instruction) as "a finding". None of the seven listed sources contains this comparison. An Anthropic source supporting the direction exists (alignment.anthropic.com, Automated Weak-to-Strong Researcher: "human-prescribed workflows often unnecessarily constrain agents' flexibility and degrade performance") but is not cited and does not state the cheaper-versus-strongest claim. Criterion 1 offended (not traceable); criterion 2 offended because the text labels it a finding rather than prior knowledge.
**EVIDENCE**:
Work line 142: "Expressive freedom is a coined term for a finding that runs against intuition... Cheaper models iterating against a red-and-green check, free to try approaches until one passes, outperform a single attempt from the strongest model instructed step by step."
Sources lines 155–163: no entry contains the comparison. Closest (multi-agent research): "Our prompting strategy focuses on instilling good heuristics rather than rigid rules."

**F3** — **Expressive freedom is the only principle without its important aspects pulled out**
**S-M** · **C-M**
**FINDING**:
Twelve of thirteen principles close with a bullet or numbered list isolating what the orchestrator must do. Expressive freedom is two prose paragraphs with no such extraction; its actionable content (supply objective, output format, boundaries; re-specify rather than instruct harder; freedom applies to path never destination; scope-widening is the adversary's target) is not highlighted. Criterion 3 offended for this principle.
**EVIDENCE**:
Work lines 140–144: prose only. Compare lines 30–32, 51–54, 60–62, 68–71, 77–80, 86–90, 96–100, 110–112, 118–120, 126–129, 135–138, 150–153, each ending its principle with a list.

**F4** — **Deterministic tools bullets are universal tool-design guidance under a heading claiming no attended-work counterpart**
**S-M** · **C-M**
**FINDING**:
The "Beyond the universal principles" preamble asserts the principles that follow "have no counterpart in attended work." Three of four Deterministic tools bullets (minimal non-overlapping toolset, terse/paginated output with actionable errors, CLI over raw API) are general guidance that applies identically to an attended session. Only the hooks-over-instructions bullet is run-specific. Criterion 4 offended; the section's framing sentence is false for it.
**EVIDENCE**:
Work line 104: "The principles that follow have no counterpart in attended work."
Work lines 127–129: toolset, output, CLI bullets.
Source (writing-tools-for-agents): "implementing some combination of pagination, range selection, filtering, and/or truncation"; "prompt-engineer your error responses to clearly communicate specific and actionable improvements."
Source (best-practices, Use CLI tools, an interactive-session tip): "CLI tools are the most context-efficient way to interact with external services."

**F5** — **Stall conditions mis-attribute harness behaviour as a run-author declaration**
**S-L** · **C-M**
**FINDING**:
The Budgets bullet frames "several consecutive turns with no tool use" as a stall state the author "defines in advance", then says the harness enforces its own ceiling (eight blocks). In the source, the no-tool-use stall is harness behaviour, not declared; "two rounds with no progress" appears only as an example prompt, not a harness rule. An orchestrator may write a redundant condition, omit a real one, or expect enforcement that does not exist.
**EVIDENCE**:
Work line 87: "A stalled state is defined in advance: several consecutive turns with no tool use, or two rounds that produce no new progress, ends the attempt. The harness enforces its own ceiling as well, ending a stop-hook loop after eight consecutive blocks."
Source (goal, How evaluation works): "If Claude keeps answering the evaluator without making progress (no tool use for several turns in a row), Claude Code stops the loop, prints a warning, and returns control to you with the goal still set."
Source (workflows, Example workflow prompts): "keep fixing the reported errors until the type check passes or two rounds in a row make no progress."

**F6** — **"Strongest model is reserved for judgement" is contradicted by the one official judgement mechanism cited**
**S-L** · **C-L**
**FINDING**:
The Budgets bullet fixes a model policy: strongest for judgement, cheap for iteration. The only official completion evaluator in the Sources (/goal) runs on the small fast model by design. No listed source recommends the strongest model for judgement. Defensible as prior knowledge; flagged because unsourced and an official counter-example exists in the cited set.
**EVIDENCE**:
Work line 89: "The strongest model is reserved for judgement; cheaper models do the iteration."
Source (goal): "Claude Code sends the condition and the conversation so far to your configured small fast model, which defaults to Haiku."
Source (workflows, Cost): "Ask Claude to use a smaller model for stages that don't need the strongest one."

**F7** — **Unresolved editing comment leaves Context engineering incomplete**
**S-L** · **C-H**
**FINDING**:
An HTML comment records a pending aspect ("template everything, iterate improvements") never written into the principle. By the author's own note the highlighted aspects are incomplete, offending criterion 3 for that section. Per global instructions such comments are edit instructions to action and remove.
**EVIDENCE**:
Work lines 34–36: `<!-- + template everything, iterate improvements -->`
User CLAUDE.md, Syntax Helpers: "Remove the comment and/or tags after editing."

## Cleared

Agent Invariants; Verification ladder and eight-block cap; Observability bullets; Review bullets; Decomposition; Permissions; Abandon failed runs; Repeatable; Checkpoints; Adversarial attack. Each traced to a listed source passage.

## Sources consulted

- https://code.claude.com/docs/en/goal
- https://code.claude.com/docs/en/workflows
- https://code.claude.com/docs/en/best-practices
- https://www.anthropic.com/engineering/multi-agent-research-system
- https://www.anthropic.com/engineering/writing-tools-for-agents
- https://code.claude.com/docs/en/sub-agents
- https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- https://alignment.anthropic.com/2026/automated-w2s-researcher/
