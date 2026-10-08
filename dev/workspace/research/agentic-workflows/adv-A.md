# Adversary findings: A-anthropic.md

## High

**H1. Multi-agent research post misquoted; cost cause invented.** Claim: multi-agent "poorly suited for... most coding tasks", "partly because of the ~15x token multiplier"; "90.2%... on breadth-first tasks". Evidence (anthropic.com/engineering/multi-agent-research-system): "poorly suited" does not appear. The text says "not a good fit for multi-agent systems today. For instance, most coding tasks involve fewer truly parallelizable tasks than research", and the cause is shared context and dependencies, not tokens. "about 15× more tokens than chats" is against chat; agents use 4× chat. 90.2% is "on our internal research eval". Stale: newer guidance exists (claude.com "Building multi-agent systems", Jan 23 2026); workflows.md ships coding uses ("a 500-file migration").

## Medium

**M1. Plugins omitted.** Plugins appear only in passing. llms.txt (read, per Coverage) has a full Plugins section: manifest, dependencies, marketplaces, org management, `claude plugin eval`. Packaging and distribution is a recurring feature; flightdeck is a plugin.

**M2. MCP and tool design omitted.** MCP gets zero mentions. Glossary: hooks, skills, MCP "plug into specific phases of this loop". docs/en/agents: "To involve a different tool, expose it to Claude as an MCP server." "Seeing like an agent" is about tool design but is cited only for skills.

**M3. Planning omitted.** best-practices.md: "Explore first, then plan, then code"; "Let Claude interview you". The Harness design post (Mar 24 2026) uses a planner agent. A has no planning feature.

**M4. Multi-agent shape.** A gives "four escalating mechanisms" (with the SDK). code.claude.com/docs/en/agents lists "five ways": subagents, agent view, agent teams, dynamic workflows, projects. A files agent view and projects elsewhere. "Named workflow patterns" and "Multi-agent orchestration" both rest on orchestrator-workers and dynamic workflows. One is a vocabulary, the other a mechanism: count them as one feature.

**M5. "Unattended" bundles three features and understates preview status.** It mixes a completion loop (/goal), triggers (routines) and supervising many sessions (Projects, agent view, messaging). /goal docs: it "is a wrapper around a session-scoped prompt-based Stop hook", so Verification already counts it. Triggers missing: /loop, desktop scheduled tasks, GitHub Actions, channels. "two of the four... beta/research-preview" is wrong: agent-view.md says "Agent view is in research preview". Projects: Pro/Max only, gradual rollout, waitlist.

**M6. Verification is two features.** Offline evals (measuring the system, overlapping D) differ from in-run checks (/goal, review). A also misses the best evidence, from the Harness design post: when agents evaluate their own work they "tend to respond by confidently praising the work"; a separate evaluator was a "strong lever".

**M7. Mods misread.** Claim: "overlaps conceptually with hooks and plugins... role... unconfirmed". The mods post: "Under the hood, mods are hooks, and they ship inside plugins." Mods are built on hooks and plugins, not a rival to them.

**M8. Hosted and CI surfaces omitted.** Managed Agents (beta, `managed-agents-2026-04-01`) has multi-agent orchestration with persistent threads (platform.claude.com/docs/en/managed-agents/multiagent-orchestration). GitHub Actions, Code Review and ultrareview are listed in llms.txt and also missing.

## Low

**L1.** Context engineering leaves out context resets with handoff artifacts, which the Harness design post weighs against compaction. It also leaves out "Effective harnesses for long-running agents" (Nov 26 2025: initializer, progress file).

**L2.** "three real incidents": the phish was "a controlled internal red-team exercise", and EDR is a "Risk we missed". A quotes the 83% figure but drops the same post's caveat: "~17% of overeager actions get through".

**L3.** hooks.md: "Agent hooks are experimental"; A omits this.

**L4.** The workflows.md table compares who holds the plan, not "the cheapest mechanism".

**L5.** "a direct descendant of the 2024 taxonomy" is A's inference; tournament, generate-and-filter, adversarial verification have no 2024 counterpart.

**L6.** Skipped: eval hillclimbing post (Sep 28 2026), Anthropic's newest eval guidance.

## Revision check (2026-10-07, revised A)

**Closed:** all 15 (H1, M1 to M8, L1 to L6). H1 is fixed in the text: the invented quote is gone, 4× and 15× are both against chat, and 90.2% is "on our internal research eval". New quotes checked held ("compaction isn't sufficient", "a simple 1-4 sentence prompt", 24 of 25 retries, "3-10x more tokens").

**Still standing:** none.

**New:**
- **N1 (medium).** "266 vulnerabilities over 27M tokens against 21... over 6.5M" drops the source's next sentences: "roughly half of these vulnerabilities were found outside of the core directories", and limited to those, "the two methods seem comparable in terms of tokens per vulnerability found."
- **N2 (low).** "newer models barely shared code" omits Sonnet 5, which "worked on shared resources... while also maintaining a high PR throughput".
- **N3 (low).** `/ultrareview`: the docs say "The command is `/code-review ultra`"; `/ultrareview` is an alias.
