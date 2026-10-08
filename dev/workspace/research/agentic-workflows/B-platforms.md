# Agentic Workflows as a Product Category (Outside Anthropic)

Revised 2026-10-07 after adversary review. Primary means a vendor doc or changelog fetched directly. Secondary means trade press or a personal blog.

## 1. What "agentic workflow" means from this angle

No single definition dominates; each vendor frames it around its own unit of work.

**GitHub.** gh-aw docs (github.github.com/gh-aw/introduction/overview): automation that "understand[s] context, make[s] decisions, and take[s] meaningful actions" from Markdown instructions, replacing fixed YAML logic. The unit of work is a repo event handled by an LLM. gh-aw's engines are "GitHub Copilot, Claude Code, OpenAI Codex, Google Gemini, or Pi" (same page), so for a Claude Code user it layers over the agent rather than competing with it. Separately, the Copilot cloud agent starts from an issue, PR or agents panel, runs in an ephemeral cloud environment and produces a pull request; custom agents are Markdown profiles in `.github/agents/` (docs.github.com, Copilot cloud agent and custom agents pages, 2026).

**OpenAI.** Agents SDK docs (openai.github.io/openai-agents-python): an agent is "an LLM equipped with instructions and tools"; a workflow is code composing agents through handoffs and guardrails. The Agents API, a public beta opened 2026-09-10 (secondary; the openai.com page returned 403), moves this to a managed long-running session with orchestration, context compaction and recovery server-side, on the harness that powers Codex.

**Google.** ADK (developers.googleblog.com, 2025): an explicit orchestration graph of agents (Sequential, Parallel, Loop, or LLM-driven routing) that can pause and resume.

**AWS Kiro.** The unit of work is a spec: requirements.md (or bugfix.md), design.md, tasks.md, with requirements in EARS notation (kiro.dev/docs/specs/feature-specs; kiro.dev/blog/introducing-kiro, 2025-07-14).

**Cognition/Factory.** A multi-day goal pursued with graduated autonomy; the human moves from implementer to reviewer/manager (cognition.com/blog/devin-2, 2025-04-03; factory.com/news/missions, dated 2025-02-26).

Convergence: an agent (or team) given a goal and a scope of permitted action that plans, acts and produces a reviewable artifact (PR, diff, doc) without a human driving each step.

## 2. Recurring features

**Event and schedule triggers.** Strong, but the mechanism differs by vendor.
- Native: gh-aw (issue/PR events, cron, manual dispatch, comment commands). Devin Automations (Slack, GitHub, GitLab, Linear, Jira, PagerDuty, schedule, incoming webhook; docs.devin.ai/product-guides/automations). Cursor Automations (cron, GitHub/GitLab/Bitbucket PR and push, Slack, Linear, Sentry, PagerDuty, webhooks; cursor.com/docs/cloud-agent/automations). Jules: the `jules` GitHub label assigns a task (jules.google).
- Partial: Codex. OpenAI's docs call the feature "scheduled tasks": schedules plus app events (Gmail, Slack, GitHub "pull request activity"), with event triggers only on eligible plans, in ChatGPT web and mobile, not CLI, IDE or desktop (learn.chatgpt.com/docs/automations). Push and CI triggers come from the user's own GitHub Actions via codex-action (learn.chatgpt.com/docs/github-action); Jules likewise uses jules-action. "Codex Triggers" appears only on a personal blog (codex.danielvaughan.com, 2026-04-01), which says triggers "are implemented through the `openai/codex-action@v1` GitHub Action". No OpenAI page names the product, and github.com/openai/codex/issues/24864 (2026-05-28, open) still requests webhook and GitHub-event triggers.

**Isolated per-task execution.** Strong. Codex cloud: "each task has its own workspace"; internet access is an explicit setting (learn.chatgpt.com/docs/cloud). Devin: its own cloud VM per instance (cognition.com/blog/devin-2, 2025-04-03). Jules: clones the repo into a Cloud VM (jules.google). gh-aw: sandboxed Actions runner, network isolation, SHA-pinned dependencies (github.blog/changelog/2026-02-13). Cursor cloud agents and Factory worktrees: secondary only.

**Default-deny permissions with a staged write path.** Strong for gh-aw, moderate elsewhere. gh-aw agent jobs are read-only; writes go through "safe outputs", buffered, validated and applied in a separate scoped job (gh-aw glossary; changelog 2026-02-13). Codex: read-only / workspace-write / danger-full-access sandbox tiers (secondary). Factory: Off/Low/Medium/High autonomy gating edits and commands (docs.factory.ai/autonomy-and-safety/auto-run). Kiro hooks are also guardrails: in-session events (Prompt Submit, Pre/Post Tool Use, File Save, Agent Stop, pre/post spec task) with no external triggers (kiro.dev/docs/hooks/types).

**Plan, then approve.** Strong. Jules "develops a plan" and waits for approval (jules.google). Factory Missions: "Once you approve the plan, Droid enters Mission Control" (factory.com/news/missions). Kiro's three-phase spec workflow has approval gates; Quick Spec removes them (kiro.dev/docs/specs).

**PR/diff as the review gate.** Strong for agents that publish work. Copilot cloud agent (docs.github.com), Jules ("Jules creates a PR of the changes", jules.google), Codex cloud ("commit or open a pull request when you're ready", learn.chatgpt.com/docs/cloud), gh-aw safe outputs. For Devin, Cursor and Factory I did not read a primary statement; treat as probable.

**Verification and review agents.** Strong. Devin Review reviews PRs on open or push (docs.devin.ai/work-with-devin/devin-review). Cursor Bugbot "runs automatic reviews on every PR update" (cursor.com/docs/bugbot). Jules CI Fixer repairs CI failures on its own PRs (2026-02-19) and a Planning Critic reviews auto-approved plans (2026-01-26) (jules.google/docs/changelog). Factory Missions run validation checkpoints per milestone.

**Parallelism / multi-agent.** Strong. Devin 2.0: "multiple parallel Devins" (2025-04-03). Jules: 3/15/60 concurrent tasks by plan. Factory: an orchestrator with "a fresh worker session with clean context" per feature (factory.com/news/missions). Amp subagents "work in isolation, so they can't communicate with each other" (ampcode.com/docs/models-and-subagents). OpenAI SDK: handoffs.

**Context management.** Three distinct mechanisms, not one feature. Session persistence: Agents SDK sessions (SQLite/Redis/Mongo). Compaction: Agents API, server-side. Fresh context per work unit: Factory workers. A shared instruction store also exists: Devin Knowledge, "instructions and advice that Devin can reference in all sessions" (docs.devin.ai). Least standardized area.

**MCP and instruction files.** Strong. MCP: Jules (2026-02-02), Amp, Copilot custom agents, Agents API. AGENTS.md, "stewarded by the Agentic AI Foundation under the Linux Foundation", is supported by 25+ tools including Codex, Jules, Cursor and Copilot (agents.md).

**Observability.** Moderate. Agents SDK tracing; Factory "Mission Control". gh-aw's audit trail in Actions logs is inferred from its design, not a named feature.

**Cost controls.** Present at Devin, tier-based elsewhere. Devin automations can set a maximum ACU budget per session; "If Devin hits the limit, the session stops" (docs.devin.ai/product-guides/automations). Organization ACU limits and per-user monthly caps also ship (docs.devin.ai/admin/billing/enterprise; /enterprise/features/usage-policies). Jules prices by concurrency tier; the Agents API bills usage with no platform fee (secondary). Devin is the only explicit budget dial I found.

## 3. Unique bets

- **gh-aw's compile step**: Markdown plus YAML frontmatter compiles to a hardened `.lock.yml` Actions workflow, so the workflow definition is a build artifact reviewed in git.
- **Kiro's spec artifact set** (requirements or bugfix, design, tasks; EARS) as the work unit before code. Plan approval itself is not unique.
- **Amp's modes and Oracle**: four modes (low, medium, high, ultra), each "a model, reasoning effort, system prompt, tools, and oracle"; Oracle runs GPT-6 Astra and Fable 5.1; Gemini 3.7 Flash serves only View Media (ampcode.com/modes). The earlier "Opus for UI, Gemini for codegen, GPT-5 for reasoning" routing is stale.
- **Factory's orchestrator, milestones and autonomy gating**: Missions need High autonomy (docs.factory.ai).
- **Jules's concurrency-tiered pricing.**
- **OpenAI's Agents API**: a bet that the Codex harness generalizes beyond coding; unproven outside coding.

## 4. Maturity, hype or churn

- **Maturity**: gh-aw was a technical preview on 2026-02-13 and a public preview on 2026-06-11 (github.blog/changelog). Agents API: public beta. Factory: "Missions is early" (factory.com/news/missions).
- **OpenAI Agent Builder** (AgentKit canvas): launched 2025-10-06; deprecation announced 2026-06-03, eight months in; shuts down 2026-11-30, about 14 months. Evals goes read-only 2026-10-31 and shuts down 2026-11-30. OpenAI points code-first users to the Agents SDK (developers.openai.com/api/docs/deprecations).
- **Gemini CLI to Antigravity CLI**: on 2026-06-18 Gemini CLI/Code Assist stopped serving many users as Google consolidated into Antigravity CLI (developers.googleblog.com). Read later "Gemini CLI" claims as a merged product.
- **Jules V2** ("Jitro", goal-driven): trade press (testingcatalog.com, devops.com, 2026) reports it, with a waitlist expected. jules.google mentions neither, and I found no Google primary. Unconfirmed.
- **Amp**: spun out of Sourcegraph into Amp, Inc. in December 2025 (tessl.io; Wikipedia). Amp claims above now rest on ampcode.com.
- **Devin**: cognition.com/blog/devin-2 (2025-04-03) is stale. Current docs.devin.ai adds Automations, Devin Review, Devin CLI and Desktop, and Windsurf under shared ACU limits. The "Fusion" lead/sidekick architecture has no primary source I could confirm.

## 5. Coverage

Primary and fetched: gh-aw docs and both GitHub changelogs; Codex automations, cloud and GitHub Action docs; OpenAI deprecations page; Devin docs (automations, Devin Review, usage policies, enterprise billing, scheduled sessions); Amp docs (modes, models-and-subagents, manual); Kiro docs and launch post; Factory Missions post; Jules site and changelog; Cursor Automations and Bugbot docs; Copilot cloud agent docs; agents.md.

Secondary only: Agents API (openai.com returned 403), Cursor and Factory isolation details, Amp Inc spin-out, Jules V2, Codex sandbox tiers. Not covered: Replit Agent, Windsurf, Warp, Vercel, and entrants beyond the brief.

## Response to the adversary

H1 fixed: Codex triggers re-sourced to OpenAI's "scheduled tasks" doc; the blog's "Triggers" is shown to be codex-action. H2 fixed: Devin's per-session, org and per-user ACU limits added (the API field name `max_acu_limit` I could not confirm, so omitted). M1 fixed: "Plan, then approve" is a recurring feature; Kiro's bet narrowed. M2 fixed: Amp rewritten from ampcode.com. M3 fixed in part: hooks moved to guardrails and Bugfix/Quick Spec added; the staleness claim for EARS is rebutted, since kiro.dev/docs/specs/feature-specs and the launch post both say EARS. M4 fixed: gh-aw is now "public preview" (2026-06-11), newer than the adversary's technical-preview date. M5 fixed: verification agents, MCP and AGENTS.md added. M6 fixed: Copilot cloud agent and gh-aw's engine list added. M7 fixed: Devin and Factory use primary docs. L1 fixed: both dates given (8 months to announcement, about 14 to shutdown; Evals read-only 2026-10-31). L2 fixed: sources per vendor, with gaps stated. L3 fixed: split into three. L4 fixed: V2 marked unconfirmed, "octopus" and waitlist-status claims dropped.
