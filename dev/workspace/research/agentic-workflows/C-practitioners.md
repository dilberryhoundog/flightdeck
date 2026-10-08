# Explorer C: what practitioners layer on top of coding agents

Revised 2026-10-07 after adversary review. Star, download and push figures were read on that date from the GitHub API, npm and PyPI Stats. Stars and downloads measure attention, not outcomes.

## 1. What "agentic workflow" means from this angle

No single definition dominates. Practitioners use three framings.

- **Pattern-based**: Andrew Ng's four patterns (reflection, tool use, planning, multi-agent collaboration), still the frame in his 2026 course ([aibuilderclub.com, n.d.](https://www.aibuilderclub.com/blog/andrew-ng-loop-to-graph-engineering)). Reflection has the oldest evidence: Reflexion (arXiv 2303.11366, 2023) reports 91% pass@1 on HumanEval against 80% for a GPT-4 baseline. That is 2023 GPT-4 evidence on function-level tasks. It supports the pattern, not 2026 coding-agent practice.
- **Engineering discipline**: HumanLayer's 12-Factor Agents (Dexter Horthy; the repo links his talk at the AI Engineer World's Fair, [github.com/humanlayer/12-factor-agents](https://github.com/humanlayer/12-factor-agents)) argues for mostly deterministic code with LLM calls at chosen points: own your prompts, context window and control flow.
- **Context curation**: Anthropic's engineering post (29 Sep 2025, [anthropic.com](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)) defines context engineering as "the set of strategies for curating and maintaining the optimal set of tokens (information) during LLM inference", with compaction, note-taking and sub-agent isolation. It is vocabulary, not a tool. The repeated "94-99% accuracy with governed context vs. 10-31% without" ([atlan.com, 2026](https://atlan.com/know/ai-agent/context-engineering/context-engineering-techniques-ai-agents/)) has no methodology behind it.

Shared claim: a bare coding agent given one instruction is not yet a workflow. A workflow adds structure (spec, plan, memory, roles, loops) around the model call.

## 2. Recurring customisations layered onto a coding agent

**Instruction files (CLAUDE.md, AGENTS.md)**: tiered memory, falsifiable rules paired with hook or CI enforcement ([agentlint.app, 2026](https://www.agentlint.app/blog/claude-md-best-practices-2026/)). AGENTS.md was one of three founding projects of the Linux Foundation's Agentic AI Foundation (AAIF; [press release, 9 Dec 2025](https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation)). Strength: thin (practitioner advice, no controlled study).

**Spec-driven development**: spec, then plan, tasks, code. GitHub Spec Kit (140,455 stars; [repo](https://github.com/github/spec-kit)), OpenSpec (71,203; created Aug 2025; [repo](https://github.com/Fission-AI/OpenSpec)), BMAD-METHOD (53,877; [repo](https://github.com/bmad-code-org/BMAD-METHOD)), AWS Kiro (GA 17 Nov 2025; [siliconangle.com](https://siliconangle.com/2025/11/17/aws-launches-kiro-general-availability-team-features-cli-support)), get-shit-done (64,363; meta-prompting plus spec-driven; archived with a notice dated 26 Jun 2026, development moved to open-gsd/gsd-core, 10,257 stars, [repo](https://github.com/gsd-build/get-shit-done)), and claude-task-master (28,176; "AI-powered task-management system"; last push 28 Apr 2026; [repo](https://github.com/eyaltoledano/claude-task-master)). Evidence: one OrangeLoops case study (2026) generated 195 tasks in about 2 hours, then needed four more days of debugging and senior review ([orangeloops.com](https://orangeloops.com/2026/05/spec-driven-development-with-ai-a-spec-kit-claude-code-case-study/)). Strength: moderate for adoption, thin for productivity (vendor reports and single cases).

**Skill and plugin collections, including command libraries**: markdown skills, slash commands, subagents and hooks packaged and installed as plugins. Claude Code's docs say "Custom commands have been merged into skills" ([code.claude.com](https://code.claude.com/docs/en/skills)). Examples: Superpowers (Jesse Vincent; repo created 9 Oct 2025; 296,139 stars; listed in Anthropic's claude-plugins-official marketplace; about 14 skills for clarify, design, plan, code, verify, [marcnuri.com](https://blog.marcnuri.com/superpowers-claude-code-skills-framework)); the Compound Engineering plugin (EveryInc; 25,414 stars; 36 skills in a brainstorm, plan, work, review, compound loop; [repo](https://github.com/EveryInc/compound-engineering-plugin)); Everything Claude Code (274,471 stars; created 18 Jan 2026; [repo](https://github.com/affaan-m/everything-claude-code)); wshobson/agents, which replaced the archived wshobson/commands (2,645 stars; [repo](https://github.com/wshobson/commands)). Evidence on effect is weak. One test reports 9% cheaper runs and 14% fewer tokens with Superpowers, from 12 sessions (six with, six without), in a post that promotes MindStudio products and calls its sample "small" ([mindstudio.ai, 2026](https://www.mindstudio.ai/blog/5-claude-code-skills-cut-token-costs-70-percent-benchmarked)). Other posts claim "10x" or 30-40%. Strength: adoption strong, effect unreplicated.

**Loops (Ralph)**: Geoffrey Huntley's technique feeds one prompt to the agent in a bash loop ([ghuntley.com/ralph, 14 Jul 2025](https://ghuntley.com/ralph/)). Anthropic ships it as the `ralph-loop` plugin in claude-plugins-official: a Stop hook blocks exit and re-feeds the prompt, with `--max-iterations` and `--completion-promise` options ([plugin](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/ralph-loop)). Strength: thin; Huntley's "$50k contract for $297" is an anecdote.

**Orchestration add-ons and parallel-session managers**: claude-flow (renamed Ruflo in early 2026; Reuven Cohen) adds swarm coordination, cross-session memory and a SPARC TDD method ([fast.io, 2026](https://fast.io/resources/claude-flow-multi-agent-orchestration-guide/)); 74,024 stars. npm downloads, 8 Apr 2025 to 6 Oct 2026: claude-flow 1,205,279, ruflo 1,448,372. These include CI installs, so they are weak evidence of use. Secondary sources attribute the rename to trademark avoidance with Anthropic; I found no primary statement. Session managers run several agents in separate worktrees: vibe-kanban (28,275; README says "Vibe Kanban is sunsetting", Apache-2.0 source remains; [repo](https://github.com/BloopAI/vibe-kanban)) and claude-squad (8,571; last push 20 Aug 2026; [repo](https://github.com/smtg-ai/claude-squad)). Strength: adoption strong; performance claims, see section 5.

**MCP add-ons**: servers that give the agent documentation, code intelligence or a browser. context7 (62,755 stars), serena (30,069), playwright-mcp (37,888; [repo](https://github.com/microsoft/playwright-mcp)). context7 and serena are in the official marketplace ([marketplace.json](https://github.com/anthropics/claude-plugins-official/blob/main/.claude-plugin/marketplace.json)). Strength: adoption strong; no outcome measurement found.

**Hooks**: deterministic shell commands at lifecycle events ([Claude Code hooks guide](https://code.claude.com/docs/en/hooks-guide)), used as gates (Ralph's Stop hook, agent-team events such as TaskCompleted). Community collections are small: disler/claude-code-hooks-mastery has 3,930 stars, last push 4 Mar 2026 ([repo](https://github.com/disler/claude-code-hooks-mastery)). Strength: thin.

## 3. Adjacent frameworks (not layered onto a coding agent)

These build agent applications and are kept for context. LangGraph had 44.8M PyPI downloads in the last month and CrewAI 2.4M ([pypistats.org](https://pypistats.org/packages/langgraph), 7 Oct 2026); both counts include CI. OpenHands' Agent SDK paper reports 72% (Table 2: 72.8%) on SWE-bench Verified with Claude Sonnet 4.5 and extended thinking ([arxiv.org/html/2511.03690v1](https://arxiv.org/html/2511.03690v1), Nov 2025; in the body, not the abstract). Verified is contaminated: OpenAI's 23 Feb 2026 audit found frontier models had seen problems and solutions in training ([epoch.ai review](https://epoch.ai/benchmarks/swe-bench-verified/review)). For scale, Claude Opus 4.5 scores 80.9% on Verified and 45.9% on Scale's SWE-bench Pro, a 35-point gap ([morphllm.com](https://www.morphllm.com/claude-benchmarks); I could not open OpenAI's post). That gap belongs to Opus 4.5, not to OpenHands' model.

## 4. Absorbed or churned

- **Agent Skills**: Anthropic's own feature, launched 16 Oct 2025 ([claude.com](https://claude.com/blog/skills)), opened as a standard at agentskills.io on 18 Dec 2025 ([simonwillison.net](https://simonwillison.net/2025/Dec/19/agent-skills/)). agentskills.io now lists more than 40 clients, including Gemini CLI, Codex, Cursor, Copilot, Kiro and goose. AAIF's founding projects were MCP, goose and AGENTS.md; I found no primary source placing Agent Skills under AAIF.
- **Command libraries**: folded into skills and plugins (section 2).
- **Ralph loop**: community bash loop (Jul 2025), then an official plugin.
- **Parallel subagents**: native subagents exist; "agent teams" exist but are experimental and off by default, and manual parallel sessions have worktree docs ([code.claude.com](https://code.claude.com/docs/en/agent-teams), read 7 Oct 2026). Session managers stay external, and one is sunsetting.
- **get-shit-done**: archived; a successor fork continues it.
- **AutoGPT, BabyAGI**: the unattended-loop pattern faded; BabyAGI became an educational sandbox (Sep 2024). The loop survives inside bounded harnesses ([vibeagentmaking.com, n.d.](https://vibeagentmaking.com/blog/autogpt-got-100k-stars-and-then-what/)).
- **AutoGen**: folded into Microsoft Agent Framework (Feb 2026); legacy AutoGen is maintenance-only (not re-checked).

## 5. Hype I could not confirm

**claude-flow/Ruflo**, in three dated layers.

- **Aug 2025, issue #653** ([ruvnet/ruflo](https://github.com/ruvnet/ruflo/issues/653)): opened 14 Aug, closed as completed 16 Aug 2025, against alpha.88. It claimed about 85% of MCP tools were mock or stub. A "Hive Mind" agent swarm ran the analysis. The maintainer disputed the figure (his test: 25% functional, 35% partial, 40% mock) and later claimed under 5% in alpha 90. A third-party comment of 4 Apr 2026 alleges about 97% non-functional on v3.5.51; I did not verify it. None of this measures the current release.
- **29 May 2026, the project's own audit** of `@claude-flow/cli@3.10.6` ([audit](https://github.com/ruvnet/ruflo/blob/main/docs/reviews/intelligence-system-audit-2026-05-29.md)). Wrong: headline multipliers "largely hardcoded doc strings with no benchmark behind them"; the Flash Attention speedup was `2.49 + Math.random()*4.98`; HNSW "150x-12,500x" measured a peak of 1.48x; `route feedback -r -1.0` recorded +1.00; a silent mock-embedding fallback was labelled as the real ONNX model. Real: "the learning loop is real", with task outcomes updating persisted pattern confidence and routing Q-values across processes.
- **Fixed in v3.10.7** (same day, [release](https://github.com/ruvnet/ruflo/releases/tag/v3.10.7)): sign bug fixed, randomized telemetry removed (now "unmeasured"), embedding backend made visible, performance docs rewritten to measured values (HNSW 3.2-4.7x at N=5000, Int8 3.84x). v3.10.8 and v3.10.9 followed. I did not test whether the current README's claims hold.

Other claims: the Superpowers "10x" headline conflicts with the 9%/14% test, which is itself weak. BMAD and Spec Kit "3-10x first-pass success", "5x more productive" and "12 hours to 15 minutes" are single-source vendor or blog figures with no disclosed method (sources not re-checked). SWE-bench Verified scores are undercut by contamination (section 3).

## 6. Coverage

Searched (web only, Oct 2026): Spec Kit, OpenSpec, BMAD, Kiro, get-shit-done, task-master, Superpowers, Compound Engineering, wshobson libraries, Ralph, claude-flow/Ruflo, vibe-kanban, claude-squad, MCP add-ons, hooks, CLAUDE.md guides, Agent Skills history, 12-Factor Agents, context engineering, Ng's patterns, Reflexion, LangGraph, CrewAI, AutoGen, OpenHands, AutoGPT. Opened primary sources for the Ruflo issue, audit and release, the Claude Code docs, the AAIF release, agentskills.io and the GitHub, npm and PyPI figures. Not reached: any independent test of Ruflo's current MCP tools; OpenAI's SWE-bench post (403); the vibe-kanban shutdown announcement; hook collections beyond one; non-Claude harnesses (OpenCode, goose) in depth; AGENTS.md adoption counts.

## Response to the adversary

**Fixed (11):**
- **H1**: 85% restated as an Aug 2025 claim on alpha builds, agent-generated and disputed by the maintainer. I added an April 2026 comment the adversary did not list, marked unverified.
- **M1**: audit now reported with its findings, the real learning loop and the v3.10.7 fixes, in past tense.
- **M2**: Kiro GA is 17 Nov 2025.
- **M3**: unsupported citation removed; downloads use the npm figures with the CI caveat. The trademark reason survives only as a secondary-source claim.
- **M4**: the MindStudio post is flagged as promotional with its 12-session sample; stars updated.
- **M5**: all listed omissions added with dated sources.
- **M6**: regrouped; reflection and context engineering moved to section 1, frameworks to section 3, commands merged into skills.
- **L1**: Reflexion's scope stated.
- **L2**: the 35-point gap reassigned to Opus 4.5. I could not open OpenAI's post; a secondary source gives the same figures.
- **L3**: origin corrected; the AAIF governance claim cut.
- **L4**: venue changed to the one the repo names.

**Rebutted (0).** Of the unchecked items, the OpenHands 72% is in the paper's body (72.8%, Table 2), so it stays. LangGraph and CrewAI figures were stale and are replaced. The Gartner quote is cut.
