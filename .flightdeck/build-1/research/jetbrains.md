# JetBrains AI Agents for Developers: reading notes for an agentic accelerator

This report covers the seven PDFs in library/source/jetbrains-developer-ai/ on branch build-1, all read in full. The series is vendor material: its product mentions (JetBrains Air, Junie, Central) are JetBrains claims, and its statistics are labelled "Preliminary findings" in the source, so treat them as unverified. Recurring ideas across the set: the model reasons but does not drive the workflow, an orchestration layer owns control flow, state and memory must survive steps, and every loop needs explicit stop, retry, and escalation rules.

## Per-document key concepts

1. AI Agent Architecture Explained (library/source/jetbrains-developer-ai/AI Agent Architecture Explained.pdf)
- An agent combines a model, tools, memory, orchestration, and runtime controls. The runtime, not the model, decides whether a proposed tool call is allowed.
- Memory is split into runtime state (discarded when the run ends) and persistent memory (history, repo context, retrieved documents).
- Patterns compared: ReAct, planner-executor, multi-agent, stateless versus stateful.
- Reliability comes from bounding blast radius: schema validation, scoped permissions, stop conditions, approval gates, structured logs, rollback.

2. How AI Agent Orchestration Works (library/source/jetbrains-developer-ai/AI Agent Orchestration Explained_ How It Works.pdf)
- One control loop underlies orchestration: plan, route, execute, observe, adapt. Objectives become a task queue with explicit dependencies.
- Routing depends on task type, capability, permissions, and load. MCP is named for tool and data access; A2A for peer agent coordination.
- Output handling: on failure, retry (same or different parameters), fall back, or escalate. Max retries, confidence thresholds, and timeouts bound autonomy.
- Three shapes: centralized (simple to debug, single point of failure), distributed (queues, scales, harder to debug), hierarchical (layers of coordinators, latency at each boundary).
- Failure modes include state consistency, synchronization, latency, debugging difficulty, handoff failures, and permission drift. Mitigations: atomic state writes, dependency graphs, handoff schemas, correlation IDs.

3. A Complete Guide to Agentic Workflows (library/source/jetbrains-developer-ai/Agentic Workflows Explained_ A Complete Guide.pdf)
- Four parts make a run: the LLM, tools, memory, and the loop that ties them together. Planning is a starting point that is refined as information arrives.
- Ambiguous or flaky results should escalate to a human rather than loop.
- Patterns: sequential, planner-executor, reflection with retry (test-fix loops), and multi-agent shapes (planner-reviewer, researcher-executor, coordinator-worker).
- Agentic versus traditional automation is compared on determinism, adaptability, oversight, operational complexity, and debuggability. Most production systems are hybrid.
- Risks: latency, state consistency (checkpoints, idempotent calls), context truncation on long runs, runaway retries, over-broad permissions. Read-only by default; human approval for high-impact actions.

4. Memory in AI Agents: Types and Implementation (library/source/jetbrains-developer-ai/Memory in AI Agents_ Types and Implementation.pdf)
- Memory sits beside orchestration, not inside the model: retrieve, inject into the prompt, run, write back, every step.
- By location: context window, external store used through RAG, model weights, KV or prompt cache. By horizon: short-term, long-term, episodic and semantic, shared. Only external storage persists across sessions.
- Retrieval pipeline: query to vector, nearest entries, metadata filter, re-rank, then a fixed token budget for injected memory.
- Entries should carry source, timestamp, expiry, and version.
- Long-term memory can be a plain guidelines file in the repo; the source cites JetBrains Junie reading one on every run.
- Failure modes: stale memory, incorrect retrieval, context corruption, memory drift, multi-writer sync failures, ranking degradation, retrieval latency.

5. Multi-Agent Systems for Developers (library/source/jetbrains-developer-ai/Multi-Agent Systems for Developers.pdf)
- Each agent gets its own scope, tools, permissions, and context; a coordination layer handles handoffs.
- Four mechanisms: task distribution (agents declare inputs and outputs so a dependency graph can be resolved), communication and shared context, workflow execution, and feedback loops with runtime adaptation.
- Coordination patterns: planner-executor (cheap, rigid), supervisor-worker (adaptive, costly per hop), specialized collaborative (no central visibility), hierarchical (most complex).
- Software examples: issue investigation, code review preparation, testing coordination, DevOps remediation proposed for approval.
- Mitigations: retries with failure context attached, schema validation at each handoff, escalation triggers, timeouts, shared-state audit logs.

6. Single Agent vs Multi-Agent Systems (library/source/jetbrains-developer-ai/Single Agent vs Multi-Agent Systems_ When to Use Each.pdf)
- A single agent runs one flat loop with one trace and one permission set. It is the default for well-scoped tasks.
- Single-agent limits: context length on large multi-file work and no specialization.
- Multi-agent gains: specialization, parallel subtasks, scoped permissions. Costs: orchestration logic, cascading failures, distributed tracing, governance of many permission sets.
- Choose single agent when the workflow is well-scoped, the team is small, traceability matters, or the task is sequential. Choose multi-agent when parallel work exists, specialization clearly helps, or the work spans the full SDLC.
- Confirm the bottleneck is not the prompt, tool access, or decomposition before adding agents.

7. What Is an AI Agent Loop? (library/source/jetbrains-developer-ai/What Is an AI Agent Loop_.pdf)
- A loop is: evaluate state, choose an action, execute, observe, update the plan, repeat.
- Failure modes: repeating the same action, retrying without new information, losing track of completed work, and missing stop conditions.
- Detection: the same tool call with the same inputs more than twice in one run; no change in state across passes; cost rising while completion stays flat.
- Prevention: an iteration cap and wall-clock limit as circuit breakers; termination conditions in the orchestration layer; separate retry budgets per tool call, model call, and workflow restart; structured tool errors; state snapshots each pass; escalation rules.
- Fail-safe default: when state is unclear, stop, preserve state, log the reason, and surface the failure.
- Log per iteration: iteration count, action, exact tool inputs and outputs, state changes, retry count, stop reason, escalation reason.

## Ideas relevant to an agentic accelerator for Claude Code

Agent loop: enforce an iteration cap and a wall-clock cap. Track a progress metric per task (failing-test count, files changed, subtasks done). If it does not move across passes, change strategy once, then stop or escalate.

Memory types, mapped to Claude Code: short-term is the context window and run state; long-term is a repository guidelines file read on every run; episodic is a log of past runs, decisions, and errors; semantic is codebase and API documentation. Give entries a source, timestamp, and expiry. Start with plain files before any vector store.

Orchestration patterns: planner-executor fits when a person should approve an inspectable plan before any action runs. Supervisor-worker fits work where each result decides the next step. Reflection with retry fits test-fix loops with a hard ceiling. Sequential pipelines fit generate, lint, test, review, commit.

Single versus multi-agent: default to one agent with good tools and full traces. Add parallel workers only for independent subtasks, each in its own git worktree with scoped permissions. Escalate from one agent to several only when a concrete requirement (parallelism, specialization, permission separation) forces it.

Workflow shapes worth supporting: sequential pipeline, reflection loop, planner-reviewer, researcher-executor, and coordinator-worker. Each should end at a human approval gate before commit, merge, or push.

Guardrails from the start: read-only permissions by default, per-agent tool scopes, schema validation at handoffs, correlation IDs across agents, per-iteration logs, and explicit escalation triggers.

Open items: the series gives concepts and checklists but no implementation detail for Claude Code and only preliminary survey figures, so design decisions that depend on those numbers need checking against other sources.
