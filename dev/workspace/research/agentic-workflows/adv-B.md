# Adversary findings: B-platforms.md

## High

**H1. "Codex Triggers" contradicted by OpenAI's docs.** Claim: "Codex Triggers, introduced March 2026, fire on GitHub webhooks (pushes, PRs, issue comments, CI failures) plus cron". The source, codex.danielvaughan.com, is a personal blog, not OpenAI. OpenAI's automations doc (developers.openai.com/codex/app/automations, which redirects to learn.chatgpt.com/docs/automations) calls the feature "scheduled tasks". Its events are Gmail, Slack and GitHub "Pull request activity", "on eligible plans", web and mobile only, with no webhooks and no product named Triggers. github.com/openai/codex/issues/24864 (May 28 2026) still asks for GitHub-event and webhook triggers. Push and CI events come from the user's own GitHub Actions via codex-action. Jules's events likewise come through a GitHub Action (jules-action).

**H2. "Unmet need" for budgets is wrong.** Claim: "found no vendor publishing an explicit 'token budget' dial as a shipped feature... an unmet need". Devin docs (docs.devin.ai): a per-session `max_acu_limit`, org-level ACU limits, per-user monthly caps ("Usage policies"), and "a maximum ACU budget per session started by an automation". All of these are shipped compute budgets.

## Medium

**M1. Planning with approval is common, not a Kiro bet.** jules.google: Jules "develops a plan" and the user approves it. factory.com/news/missions: the user approves "the plan before execution begins". kiro.dev/docs/specs: Quick Spec runs "without approval gates", so the default spec has them. B lists only Kiro, as a unique bet.

**M2. Amp primary was reachable and contradicts B.** ampcode.com/manual, /docs/models-and-subagents and /modes all fetched. The routing "Opus for UI, Gemini for codegen, GPT-5 for reasoning" is stale. Amp now has low/medium/high/ultra modes, Oracle runs "GPT-6 Astra and Fable 5.1", and Gemini handles only "View Media". Its docs say subagents "can't communicate with each other".

**M3. Kiro hooks misfiled; specs may be stale.** kiro.dev/docs/hooks lists PostFileSave, PreToolUse/PostToolUse and Stop. These are session lifecycle hooks, not triggers that start work, so they belong with guardrails rather than "Event + schedule triggers". kiro.dev/docs/specs does not mention EARS, and it adds Bugfix and Quick Specs. B's Kiro claims rest on secondary sources although kiro.dev is reachable.

**M4. Maturity labels missing.** gh-aw: the cited changelog is titled "now in technical preview" (Feb 13 2026). OpenAI Agents API: a "public beta" opened Sep 10 2026. Factory: "Missions is early". B labels none.

**M5. Converged features omitted.** MCP support, repo instruction files (AGENTS.md, Cursor rules) and verification agents (Devin Review in docs.devin.ai, Cursor Bugbot, Codex review) have no entry, while thinner items such as cost controls and observability do.

**M6. GitHub coverage too narrow.** The Copilot coding agent is absent. gh-aw's overview lists its engines as "GitHub Copilot, Claude Code, OpenAI Codex, Google Gemini, Pi". B omits this, although for flightdeck it is the key fact: gh-aw layers over Claude Code.

**M7. Devin is stale.** B rests on Devin 2.0 (Apr 3 2025). Current docs.devin.ai covers Automations (missing from triggers), Devin Review, Devin CLI and Desktop, and Windsurf, which share ACU limits. Factory is described from trade press ("specialist droids") although the primary describes an orchestrator, "milestones with validation checkpoints" and "a fresh worker session with clean context" per feature.

## Low

**L1.** "eight-month lifespan": Agent Builder launched Oct 6 2025, its deprecation was announced Jun 3 2026, and it shuts Nov 30 2026, about 14 months. Evals goes read-only Oct 31 2026, not Nov 30.

**L2.** "PR/diff as the review gate" cites only "Evidence across all fetched sources above", with no source for any vendor.

**L3.** "Memory / context management" bundles three things: session persistence (OpenAI), context compaction (Amp, Agents API) and a shared knowledge index (Factory).

**L4.** "Jules V2... in waitlist" rests on theaiagentindex.com. jules.google mentions neither V2 nor a waitlist.

## Revision check (2026-10-07, revised B)

**Withdrawn:** the EARS part of M3. kiro.dev/docs/specs/feature-specs says "The `requirements.md` file uses EARS... notation"; I had read only the parent specs page. The rest of M3 is fixed.

**Closed:** H1, H2, M1, M2, M4 to M7, L1 to L4. Both highs are fixed in the text: Codex is re-sourced to OpenAI's "scheduled tasks" doc, and Devin's ACU budgets are quoted. The gh-aw public-preview date is right (github.blog/changelog/2026-06-11-github-agentic-workflows-is-now-in-public-preview) and newer than mine. New Cursor, Devin, Jules and agents.md claims held on fetch.

**Still standing:** none.

**New:**
- **N1 (low).** "Devin is the only explicit budget dial I found": GitHub's docs let users "set a budget for additional premium requests", and each Copilot cloud agent session consumes one. Devin's is the only per-session dial.
- **N2 (low).** Devin's isolation and parallelism still cite the Devin 2.0 post that section 4 calls stale.
