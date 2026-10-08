# Agentic Workflows: Convergence Across Six Intro Pages

Sources: JetBrains-AW and JetBrains-MAS (jetbrains.com, no date shown), Orkes (updated Apr 1 2025), Weaviate (Mar 6 2025), Neo4j (pub. Mar 11 2026, modified Sep 10 2026), Atlassian (May 23 2025). On 2026-10-07, Orkes, Weaviate and Atlassian are 17 to 19 months old; weigh them accordingly. Section 4 was checked against `library/source/claude-code/`.

Main result: the strongest convergence is not a feature. Five pages say when not to use agentic workflows (section 5); Atlassian lists adoption costs.

## 1. Definitions

- JetBrains-AW: "the multistep, adaptive execution that an AI agent runs to reach a goal, rather than a single response to a single input."
- Orkes: "an AI-driven process where the sequence of tasks are dynamically executed with minimal human intervention to achieve a particular goal."
- Weaviate: "a series of connected steps dynamically executed by an agent, or series of agents, to achieve a specific task or goal."
- Neo4j: "decides the next step of action at runtime based on context and intermediate results, using tools and a feedback loop to reach a goal within defined guardrails."
- Atlassian: no labeled definition; "assistants that can make decisions and act independently", contrasted with rule-following automation.

Convergence: a goal-directed process, steps chosen at runtime, using tools, with a feedback loop. Only Neo4j puts guardrails in the definition.

## 2. Building blocks and controls

Shared ancestry: Orkes links Andrew Ng's March 2024 article for four patterns (reflection, tool use, planning, multi-agent collaboration). Weaviate lists the first three and links DeepLearning.AI's reflection piece. Neo4j quotes Ng and lists the same three plus orchestration. Those three restate one source; the JetBrains pages and Atlassian cite none.

- **Planning:** JetBrains-AW ("goal interpretation and task planning"), Orkes, Weaviate (task decomposition), Neo4j (order decided at runtime). Atlassian's nearest is "decision-making", "the brain of the system".
- **Tool use:** all six. Weaviate's tools table: internet search, vector search, code interpreter, API.
- **Memory/state:** JetBrains-AW ("Without state continuity, a multistep workflow loses context between actions"), JetBrains-MAS (shared memory stores), Orkes (long-term and short-term; "can be implemented as a vector store or as in-session environment or workflow variables"), Weaviate (long-term memory accumulated "throughout multiple sessions"; names no storage technology), Neo4j ("Most teams store agent memory in a vector database"). Atlassian has no memory block.
- **Reflection:** JetBrains-AW ("an evaluation step after actions complete"), Orkes, Weaviate, Neo4j (revises its output; "cap the number of iterations").
- **Orchestration:** JetBrains-AW (orchestration layer), JetBrains-MAS, Orkes (agent core), Neo4j (planner, retriever, executor, validator/judge, reporter roles), Atlassian ("a coordination layer"). Weaviate names none.
- **Multi-agent:** JetBrains-MAS gives four topologies with cost trade-offs (Planner-Executor, Supervisor-Worker, Specialized Collaborative, Hierarchical). JetBrains-AW names planner-reviewer, researcher-executor, coordinator-worker. Orkes names multi-agent collaboration as a pattern. Weaviate has none; "or series of agents" appears only in its definition.
- **Permissions and guardrails:** JetBrains-AW ("read-only by default"), JetBrains-MAS (scoped permissions), Weaviate ("Agents are granted permissions by their users"), Neo4j ("enforce least-privilege access"), Atlassian ("Access limits"), Orkes (RBAC).
- **Human approval:** JetBrains-AW (gates for "high-impact actions"), JetBrains-MAS (escalation triggers), Orkes ("review or approval at crucial workflow stages"), Neo4j ("human escalation paths"), Weaviate (approval-waiting assistants), Atlassian ("transparency and human oversight" as compliance).
- **Observability:** JetBrains-AW ("None of it is debuggable without observability"), JetBrains-MAS (shared state audits), Orkes (audit trails), Neo4j (decision traces), Atlassian ("audit trails"). Weaviate none.

## 3. Vendor slant

- JetBrains: sells Air (Gateway, Junie, Teams, Governance, Context) and JetBrains Central. Its team-scale needs (governing "which models and tools agents may use", "shared workflow templates", "shared organizational memory") map to its products.
- Orkes: sells Conductor, a workflow engine; lists observability, human-in-the-loop controls and RBAC as requirements.
- Weaviate: vector database vendor. Lists "Vector search" as a tool. Its memory section does not say long-term memory needs vector storage.
- Neo4j: graph database vendor. Its banner, "Independent research: GraphRAG makes AI agents 80% more truthful", links a whitepaper crediting the National Innovation Centre for Data, "led by Newcastle University". Neo4j hosts it; funding is not disclosed. The metric is truthfulness ("80%+ improvement in AI truthfulness"), not hallucination reduction.
- Atlassian: sells Rovo. "Rovo eliminates countless hours spent searching for documents or expertise" and "significant efficiency improvements" are unquantified.

## 4. Gaps a coding-agent harness (Claude Code) would not obviously cover

[Inference, checked against the captured docs; absence means not found there.] Dropped because the docs cover them:

- Cross-session memory: auto memory ("Claude saves notes as it works", claude-directory.md); subagent `memory` (subagents.md).
- Governance, RBAC, audit: managed-scope deny rules (permissions.md), `availableModels` allowlist (workflows.md), OpenTelemetry and audit logging (security.md), per-group model access (llms.txt).
- Handoff schema and resume: `schema` on `agent()` with five validation attempts; resumable runs (workflows.md).
- Topology choice: comparison tables in workflows.md and agent-teams.md.
- Turn caps: `maxTurns` (subagents.md).

Real gaps:

1. Human approval inside a scripted workflow. workflows.md: "No mid-run user input"; for sign-off, "run each stage as its own workflow". No confidence-triggered escalation found.
2. Timeouts, bounded retries and a defined give-up path. Neo4j: "timeouts, bounded retries... fallbacks, human escalation paths, and loop breakers". JetBrains-AW: "define what 'give up and escalate' means". The docs have `maxTurns`, model fallback chains and a 1,000-agent cap, but no per-step retry ceiling with escalation and no timeout reroute to a backup agent.
3. Cross-run outcome tracking. Neo4j ("outcome-based assessment"); Atlassian ("tracks its results and uses that information to improve future performance"). `/goal` and reviewer subagents judge one task; auto memory stores notes, not scored outcomes.
4. Retrieval memory (vector or graph). The docs describe file-based memory only. Need is unproven: Orkes accepts in-session variables, Weaviate names no store, the graph case is Neo4j's own.

## 5. When not to use agentic workflows

- JetBrains-AW: "Use traditional automation for well-understood, stable workflows where consistent output is the priority."
- JetBrains-MAS: "Default to the simplest design that can do the job, and add agents only when you hit a concrete wall." Multiple agents are "not automatically faster".
- Orkes: "For a straightforward process, an agentic workflow may add unnecessary technical overhead"; non-determinism risks "a wrong or unethical decision in high-stakes workflows".
- Weaviate: "Unnecessary complexity for simple tasks"; "Not all decisions should be delegated to AI systems."
- Neo4j: "usually inappropriate, or must be tightly constrained" when the workflow is "simple, repeatable, and rule-driven", latency is "extremely tight", actions are high-risk "without approval gates", or "tool reliability is low".
- Atlassian: lists integration, data quality, resistance, ethics, maintenance and compliance costs; it names no task type to avoid.

Common ground: keep simple, rule-driven, stable work deterministic; gate high-stakes actions; autonomy costs reliability and overhead.

## Response to the adversary

- M1 fixed: whitepaper credited to NICD, Newcastle-led; metric is truthfulness. Independence left open.
- M2 fixed: Weaviate multi-agent pattern and vector-storage claim removed; its tools table does list "Vector search", kept.
- M3 fixed: section 5 and the controls added; Atlassian security controls moved. Partly rebutted: Weaviate states when not to use directly ("Unnecessary complexity for simple tasks"); Atlassian does not, so "all six" became five.
- M4 fixed: section 4 redone. Four candidates dropped; (d) and (e) survive only narrowed, as gaps 4 and 3.
- M5 fixed: ancestry note, confirmed on Ng's article (Mar 20 2024).
- L1 fixed: quote corrected.
- L2 fixed: Neo4j's Ng quote concerns iterative workflows; its Reflection section cites no one.
- L3 fixed: ages noted.
