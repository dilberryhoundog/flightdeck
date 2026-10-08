# Adversary findings: C-practitioners.md

The audit the lead asked about exists (`docs/reviews/intelligence-system-audit-2026-05-29.md` in ruvnet/ruflo) and C's quotes match it. The 85% figure does not hold as a current claim (H1), and the audit is reported one-sidedly (M1).

## High

**H1. "~85% of its MCP tools are mock/stub" stated as current fact.** Issue #653 in ruvnet/ruflo has that title, but it was opened 2025-08-14 against claude-flow alpha.88 and closed as completed 2025-08-16. Its author says "The analysis above was done by a ruv-swarm", so the analysis was agent-generated. It is 14 months old and predates v3.

## Medium

**M1. Audit reported one-sidedly and stale.** It is the project's own audit of `@claude-flow/cli@3.10.6`. It says "largely hardcoded doc strings with no benchmark behind them" and "fabricated with `Math.random()` at runtime", as C reports. The same document says "the core self-learning loop is genuinely real and was measured end-to-end". Its remediation section says v3.10.7 shipped "randomized telemetry removed" and "Perf docs rewritten to measured values". C's present tense ("is generated at runtime") is out of date.

**M2. Kiro "GA 7 May 2026" is wrong.** Kiro went GA on 2025-11-17 (siliconangle.com/2025/11/17/aws-launches-kiro-general-availability-team-features-cli-support).

**M3. The claude-flow citation does not support two claims.** The dev.to/stevengonsalvez article says only "Claude Flow eventually became Ruflo in early 2026". It has no trademark conversation with Anthropic and no 710,000 figure. The npm API shows 1,205,279 (claude-flow) and 1,448,372 (ruflo) downloads from 2025-04-08 to 2026-10-06. Download counts include CI installs, so "adoption is strong (real download counts)" is weak evidence.

**M4. The Superpowers "controlled test" is vendor marketing.** The mindstudio.ai post promotes MindStudio's products. The test was "Twelve automated sessions. Six with Superpowers, six without", and the post says "The 12-session benchmark is small". C uses it as the sober counterweight to marketing. Star counts are stale: Superpowers "174,000+" is 296,133 today and BMAD "39.4k" is 53,877 (GitHub API).

**M5. Omissions within C's angle** (stars from the GitHub API, 2026-10-07):
- Fission-AI/OpenSpec (71,202), larger than BMAD, is missing from spec-driven.
- gsd-build/get-shit-done (64,363, archived, last push 2026-05-31) is missing from churn.
- The Ralph loop is missing from "Absorbed"; it is now the `ralph-loop` plugin in anthropics/claude-plugins-official ("implementing the Ralph Wiggum technique").
- Parallel-session managers (BloopAI/vibe-kanban 28,275; claude-squad 8,571), claude-task-master (28,176), the Compound Engineering plugin (25,414), MCP add-ons (context7, serena, playwright) and hook collections are absent.

**M6. Shape.** "Reflection pattern", "Context engineering" (C: "not a tool but a vocabulary") and "General frameworks" sit under "Recurring customisations" but are not things layered on a coding agent. "Prompt/command libraries" and "Skill/plugin collections" are one feature: C's own section 3 says commands were absorbed into plugins, and Claude Code's skills doc says "Custom commands have been merged into skills".

## Low

**L1.** Reflexion is rated "strong", but it is 2023 GPT-4 evidence on function-level benchmarks, not evidence about 2026 coding-agent practice.

**L2.** "the same model's score drops ~35 points" on SWE-bench Pro: the OpenAI post (Feb 23 2026) gives 80.9% to 45.9% for Claude Opus 4.5, not for OpenHands' Sonnet 4.5.

**L3.** Agent Skills as "Community invention → cross-vendor standard" misstates the origin. SKILL.md was Anthropic's own feature (Oct 2025), opened as a standard on Dec 18 2025. AAIF's founding projects were MCP, goose and AGENTS.md (linuxfoundation.org press release, Dec 9 2025). "governed under" AAIF appears only in secondary sources; not confirmed.

**L4.** 12-Factor Agents "talk at Agents in Production 2025": venue not verified.

Not checked: the OpenHands 72% figure (the arXiv abstract does not state it), the LangGraph and CrewAI download numbers, the Gartner quote.

## Revision check (2026-10-07, revised C)

**Closed:** all 11. H1 is fixed in the text: the 85% is now an August 2025 claim against alpha.88, agent-run, with the maintainer's reply. Spot checks held (issue comments, v3.10.7 release date, star counts, the GSD and vibe-kanban notices, ralph-loop options).

**Still standing:** none.

**New:**
- **N1 (medium).** The three "layers" are two subjects. Issue #653 and the April comment concern MCP tool stubs. The May audit is titled "Intelligence / Self-Learning System", and v3.10.7 fixed that subsystem only. The stub question is open, and its latest word is the worse one.
- **N2 (low).** The 97% comment is fairly marked unverified. It comes from an unaffiliated account (roman-rr), tests v3.5.51 and links a gist: "~290 tools are stubs".

Not checked: the PyPI figures (rate-limited) and OpenHands Table 2.
