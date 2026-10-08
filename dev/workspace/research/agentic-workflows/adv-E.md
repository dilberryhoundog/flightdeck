# Adversary findings: E-intro-sources.md

All six pages fetched. Held: the five definition quotes, the dates, JetBrains product names and topologies, Orkes components, and Atlassian's "significant efficiency improvements".

## Medium

**M1. Neo4j's 80% claim is misdescribed.** Claim: "from its own whitepaper (self-referential, not independent...)". The linked page (neo4j.com/whitepapers/nicd-reducing-hallucinations-graphrag/) attributes the research to the National Innovation Centre for Data, "led by Newcastle University". Neo4j hosts and promotes it; funding is not disclosed. The page says "80% more truthful", not an 80% hallucination reduction.

**M2. Weaviate is misread twice.** E says Weaviate names "multi-agent collaboration" as a pattern; its headings are only "Planning Pattern", "Tool Use Pattern" and "Reflection Pattern". E says it "Frames memory... as requiring external vector storage"; the page says only that long-term memory "stores information and knowledge accumulated over time, throughout multiple sessions". That is E's inference, presented as page content.

**M3. The one non-pitch point all six pages share is missing.** Each says when not to use it:
- JetBrains-MAS: "Default to the simplest design that can do the job, and add agents only when you hit a concrete wall".
- Neo4j: "usually inappropriate... when: the workflow is simple, repeatable, and rule-driven".
- Orkes: "huge technical overhead".
- JetBrains-AW: "Cap retries and define what 'give up and escalate' means before you deploy".
- Weaviate and Atlassian have challenges sections.

Guardrails, permissions and observability are also absent. Atlassian's "Security controls" ("Access limits... audit trails") is filed under human-in-the-loop.

**M4. Section 4's gaps contradict Claude Code's docs, which E did not read.** Four of six exist in the captured docs:
- (a) memory: llms.txt, "accumulate learnings automatically with auto memory".
- (b) governance: llms.txt, managed settings and "policy enforcement".
- (c) handoff schema, resume: workflows.md, "If you pass a `schema` on an `agent()` call"; "Resumable in the same session".
- (f) topology choice: docs/en/agents, "Choose an approach".

**M5. The convergence is partly shared ancestry.** Orkes's four patterns are Andrew Ng's 2024 four; Weaviate's three are the same minus one; Neo4j quotes Ng. Six pages restating one source are not six confirmations.

## Low

**L1.** "search time saved" is quoted but not on the Atlassian page; the text is "eliminates countless hours spent searching".

**L2.** Neo4j "attributes the pattern to Andrew Ng": on my fetch the Ng quote concerns iterative prompting and tool calling, not reflection.

**L3.** Three pages date from March to May 2025; E does not weigh age.

## Revision check (2026-10-07, revised E)

**Closed:** all 8. I checked 17 of the new quotes on the pages; all held.

**Withdrawn:** "all six" in M3. The reviser is right: five pages say when not to use it; Atlassian lists costs only.

**New, on the four remaining gaps:**
- **N1 (medium).** Gap 4 is a design choice, not a gap. Captured seeing-like-an-agent.md: "we used RAG: a vector database would pre-index the codebase", later replaced by a Grep tool. E checked only `claude-code/`.
- **N2 (low).** Gap 2 is overstated. Workflow scripts are "plain JavaScript", so retry ceilings are code; `MAX_STRUCTURED_OUTPUT_RETRIES` caps validation at five attempts; hooks take a `timeout`.
- **N3 (low).** Gap 3 is partly covered: `claude plugin eval` scores runs against "a no-plugin baseline" and gates CI (llms.txt).

Gap 1 holds as quoted.
