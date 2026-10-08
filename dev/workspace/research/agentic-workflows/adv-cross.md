# Adversary findings: across the five revised reports

Read against A to E as revised on 2026-10-07. Closed conflicts are omitted.

## Conflicts still standing

**X1 (medium). The review gate versus evidence that review is often skipped.** B: "PR/diff as the review gate. Strong for agents that publish work." D: a study "found most AI-generated PRs get no review", and lists "Output review assumed to happen" as a failure.

**X2 (medium). Self-review versus a separate judge.** E's "Reflection" is the agent evaluating its own output ("an evaluation step after actions complete"). A: agents judging their own work "tend to respond by confidently praising the work"; a separate judge "proves to be a strong lever". D adds that `/goal`, a separate judge, "cannot run commands, so it can accept unverified claims". These are two mechanisms.

**X3 (medium). Approval gates.** E lists "Human approval" as a building block. A and D report users approved "roughly 93% of permission prompts", with attention falling.

**X4 (medium). E's four remaining gaps versus the other reports.**
- "Retrieval memory": C lists "MCP add-ons" that supply it; Anthropic dropped vector retrieval by choice.
- "Cross-run outcome tracking": A and D describe `claude plugin eval` with a no-plugin baseline.
- "Timeouts, bounded retries": C's Ralph plugin has `--max-iterations`.
- "Human approval inside a scripted workflow" holds; B shows Kiro and Factory ship it.

**X5 (medium). "Strength" is not comparable across reports.** Only D defines a scale ("strong = several independent sources"). The same Anthropic telemetry is "Strength: strong" in A and "Strength: moderate" in D.

**X6 (low). Scope.** B's "Devin is the only explicit budget dial I found" covers non-Anthropic vendors only.

## One feature under different names

- **Plan, then approve.** A "Planning before acting"; B "Plan, then approve"; C "Spec-driven development"; D "Plan approval up front". E's "Planning" differs: run-time goal decomposition.
- **Review by a separate agent.** A "Verification, in two forms" and "Hosted and CI surfaces"; B "Verification and review agents"; D "Practices that cut review load".
- **Loop to a completion condition.** A "Unattended operation" (a); C "Loops (Ralph)"; D "Model-judged completion".
- **Triggers.** A "Unattended operation" (b); B "Event and schedule triggers"; D "Async dispatch and visibility".
- **Multi-agent.** A "Multi-agent orchestration, with named patterns"; B "Parallelism / multi-agent"; C "Orchestration add-ons and parallel-session managers"; E "Orchestration" and "Multi-agent".
- **Context and memory.** A "Context engineering, including resets"; B "Context management"; C "Instruction files"; E "Memory/state"; the AGENTS.md half of B's "MCP and instruction files".
- **Extension surface.** A "Skills, plugins, MCP and mods"; C "Skill and plugin collections", "MCP add-ons", "Hooks"; the MCP half of B's entry; E "Tool use".
- **Guardrails and containment.** A "Deterministic guardrails under probabilistic judgement"; B "Isolated per-task execution" and "Default-deny permissions with a staged write path"; D "Containment instead of supervision"; E "Permissions and guardrails".
- **Evals.** A's offline half of "Verification"; D section 1.
- **Observability.** B, D and E; A has none.
- **Start simple.** A section 3, C's 12-Factor framing, E section 5: guidance, not a feature.

## Gaps no report covers

- **Cost and budget controls in Claude Code.** A omits the dynamic-workflows post's "explicit token usage budgets". Caps appear only as iteration limits (C `--max-iterations`, E `maxTurns`).
- **Supply-chain trust for plugins, skills and MCP servers.** The containment post has "Trusting what the agent reads"; llms.txt lists "Plugin security and trust".
- **Independent evidence of effect.** Outcome figures are vendor-reported or adoption counts. C: "Stars and downloads measure attention, not outcomes." D: "no controlled study".
- **Checkpoints and rewind.** best-practices.md has "Rewind with checkpoints"; no report has it.
