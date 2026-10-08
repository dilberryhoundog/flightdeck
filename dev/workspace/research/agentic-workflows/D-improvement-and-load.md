# Explorer D: improving agent systems, and keeping load off the human

Strength: strong = several independent sources; moderate = first-party data or credible account with examples (vendor-reported); thin = vendor, single post, or documentation without outcome data.

## 1. Improvement practices

**Automated agent evals.** Run a task, score the transcript or end-state with code, model or human graders. "Demystifying evals for AI agents" (anthropic.com/engineering/demystifying-evals-for-ai-agents, 9 Jan 2026): code graders fast but brittle, model graders flexible but need calibration, humans slow; start with 20-50 tasks from real failures; CORE-Bench went 42% to 95% after grading bugs were fixed. It separates pass@k from pass^k (75% per trial gives 42% for three straight passes) and capability evals from regression evals (~100%), with saturated capability evals graduating. OpenAI's advice converges (developers.openai.com/api/docs/guides/evaluation-best-practices, undated: evaluate early, log to mine cases, validate judges against humans), but its hosted Evals platform goes read-only 31 Oct 2026 and shuts 30 Nov 2026, graders included, with Promptfoo suggested (developers.openai.com/api/docs/deprecations, 3 Jun 2026). The agent-evals page (trace grading, datasets) carries no notice and the deprecation does not name them. Strength: moderate (convergent guidance, anecdotes, no controlled study). Cost: moderate to build, cheap to rerun; maintenance recurs.

**Transcript and trace review.** Read full transcripts to tell an agent mistake from a grader rejecting a valid solution. Anthropic reads them routinely, built viewing tooling, and says manual review "doesn't scale" and suffers reviewer fatigue (same post). Strength: moderate. Cost: high per unit of coverage; weekly sampling advised.

**LLM-as-judge with rubrics.** A second model scores checkable rubric claims, ideally pairwise, using a model different from the one under test (Anthropic hillclimbing post, claude.dev/blog/automating-eval-design-and-hillclimbing/, 28 Sep 2026). Husain and Shankar (hamel.dev/blog/posts/evals-faq/, 28 May 2025; search-summary level) advise error analysis before rubrics. "Reliability without Validity" (arxiv.org/abs/2606.19544, 17 Jun 2026) tested 21 judges (~541,000 judgments): exact-match agreement exceeded chance-corrected Cohen's kappa by 33-41 points on MT-Bench, and two production judges had severe position bias despite test-retest reliability above 0.95. Strength: strong for that finding, but on chat benchmarks, not agent transcripts; moderate for the practice. Cost: moderate (judge API plus periodic human labelling).

**Hillclimbing with train/test splits.** Edit a prompt, skill or harness against an eval, hold out a test split, revert train-only gains. Anthropic's claude-api skill (`/claude-api hillclimb`; claude.dev, 28 Sep 2026), 44-ticket support benchmark (30 search, 14 held out): a prompt audit, model swaps and a prompt rewrite took accuracy from 74.4% (Opus 4.8, 4.6 cents per ticket) to 98.9% (Sonnet 5, about 1 cent). On the 14 held-out tickets: 78.6% to 90.5%. Inference: one ticket is 7 points, so the gap may be noise as well as overfitting. Strength: moderate. Cost: low per round once an eval exists.

**A/B and pairwise comparison.** Anthropic lists A/B testing among five methods (real outcomes; slow, needs traffic, weak on why). The dynamic-workflows post (claude.dev, 2 Jun 2026) says "comparative judgment is more reliable than absolute scoring" and recommends tournaments of one comparison per agent. Strength: thin (assertion). Cost: A/B is the costliest method; tournaments cost tokens only.

**Observability and tracing.** Capture model and tool-call spans for eval and production. Anthropic's appendix names Braintrust, LangSmith, Langfuse and Arize Phoenix. A roundup (MarkTechPost, 9 Aug 2026; search-summary level) reports ClickHouse bought Langfuse and Braintrust raised $80M. Strength: thin. Cost: self-hosted operations to managed SaaS.

**Drills apart from real work.** Scheduled fault injection (tool errors, degraded models, poisoned context, forced escalation). Tian Pan, "Game Days for Agents" (tianpan.co, 2 Jul 2026): one post, four drill families, no metrics. Strength: thin. Cost: not measured.

**Skill evals and feeding failures back.** `claude plugin eval` (code.claude.com/docs/en/plugin-evals; search-summary level) runs a plugin against test cases with six grader types, a no-plugin baseline arm and CI gates. OpenAI's skills-eval post (developers.openai.com/blog/eval-skills, undated) uses 10-20 prompts and deterministic trace graders; no results. Anthropic's skills post (claude.dev, 3 Jun 2026) calls a gotchas section, grown from observed failures, the highest-signal part of a skill; its context-engineering post (claude.dev, 24 Jul 2026) says removing over 80% of Claude Code's system prompt caused "no measurable loss on our coding evaluations." Strength: thin to moderate. Cost: low.

## 2. Human-load practices

**Oversight modes and what telemetry shows.** In-the-loop approves each action; on-the-loop monitors and intervenes on exception. Vendor writing (waxell.ai, bytebridge/Medium, 2025; search-summary level) says per-action approval "does not scale." Anthropic measured the shift (anthropic.com/research/measuring-agent-autonomy, 18 Feb 2026): users under 50 sessions fully auto-approve about 20% of the time, over 40% by 750 sessions; interrupts rise from 5% of turns to ~9% for experienced users; on the most complex tasks Claude Code asks for clarification more often than humans interrupt it. The containment post (below) reports ~93% of permission prompts approved, attention falling as approvals accumulated. A search-result summary gave 97% approval and ~5% catch rate after fifty prompts; I could not source it, so treat it as unverified. IMDA's agentic framework (v1.5, 20 May 2026; imda.gov.sg PDF unreadable to my fetch; two secondary summaries agree) names override rate and review response time as audit indicators ("a low rate may signal rubber-stamping"). A substack adds edit distance and written justification (unverified). Strength: moderate (vendor telemetry, self-reported). Cost: approval spends attention; auto-approval risks missed drift.

**Containment instead of supervision.** Bound what an agent can reach. Anthropic (anthropic.com/engineering/how-we-contain-claude, 25 May 2026) describes an ephemeral container (claude.ai), an OS sandbox under approval prompts (Claude Code), and a full VM (Cowork). The sandbox cut permission prompts 84%; the auto-mode classifier blocks ~0.4% of benign commands but lets ~17% of overeager actions through, so it is "one layer." Incidents: project hooks that ran before the trust prompt; an allowlisted api.anthropic.com let a file carrying an attacker's API key send workspace files to the attacker's account. Related: reader agents summarise untrusted input and a privileged actor sees only summaries (dynamic-workflows post). Strength: moderate. Cost: heavy engineering up front, near zero at run time.

**Agent-initiated escalation.** The clarification rate above is the only measured escalation signal I found; no source tests an escalation policy. The dynamic-workflows triage example escalates to a human when the actor cannot fix an item; no outcome data. Strength: thin. Cost: "stuck" must be defined in advance (inference).

**Async dispatch and visibility.** Cursor Background Agents run in cloud VMs, start from Slack or GitHub and return PRs; a forum bug report says Slack completion notices fire only for website-started, standard-mode agents (builder.io, Cursor forum, 2026; search-summary level). Claude Code's agent view groups sessions as "Needs input" and "Ready for review" (code.claude.com/docs/en/agent-view; search-summary level). Strength: thin. Cost: moves load from watching to reviewing.

**Where human time goes.** LinearB (linearb.io/library/ai-in-software-development, undated; this page states 8.1M PRs and 4,800 teams, other LinearB pages 2.7M PRs and 253 organisations): "Agentic pull requests wait 17.6 hours at the 75th percentile against 3.4 hours for unassisted work"; AI PRs merge within 30 days 32.7% of the time against 84.4%. A DEV Community post cites an unnamed Q1 2026 survey of ~3,000 developers: 11.4h weekly reviewing AI code, 9.8h writing. An EASE 2026 study of GitHub's AIDev dataset (arxiv.org/abs/2605.02273, 4 May 2026) found most AI-generated PRs get no review. METR's randomised trial (metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/, 10 Jul 2025; 16 developers, 246 issues) found tasks took 19% longer with AI while developers believed it saved 20%; review time was not itemised in my fetch; a 2026 follow-up is reported unreliable (search summary). Strength: moderate for LinearB, METR and AIDev; thin for the survey. Inference: review queueing is the visible bottleneck where review happens, but many agent PRs get no human review.

**Practices that cut review load.** Automated review first: Anthropic's Code Review (launched 9 Mar 2026; helpnetsecurity.com/2026/03/10/anthropic-claude-code-review/) runs parallel agents per PR; Anthropic reports substantive comments rose from 16% to 54% of its PRs, under 1% of findings marked incorrect, $15-25 per review. That measures false positives, not missed bugs. Devin Review (cognition.com/blog/devin-review) groups diffs and flags issues. Plan approval up front: plan mode blocks edits until a written plan is approved (code.claude.com/docs/en/permission-modes). Model-judged completion: `/goal` has a small model judge a condition after each turn from transcript text only (code.claude.com/docs/en/goal); inference: it cannot run commands, so it can accept unverified claims. Strength: thin (vendor-reported). Cost: tokens per PR or turn; plan review spends human time earlier.

## 3. What fails

- **Per-step approval at volume.** ~93% approval with decaying attention; Anthropic built auto mode and an OS sandbox because it failed.
- **Grading exact tool-call sequences.** Produces "overly brittle tests" because capable agents find valid paths; grade outcomes.
- **Output review assumed to happen.** Most AI-generated PRs in the AIDev sample got no review.
- **Contested: decision fatigue.** WorkOS (5 Aug 2026) cites a 2025 field study finding no credible evidence that decision quality falls with decision count; unreconciled with the approval evidence.

## 4. Hype or thin evidence

- **Game days for agents:** one post, no metrics.
- **Vendor rankings and review-tool speed-ups:** names and funding are real; the figures come from vendors.
- **">80% judge-human agreement":** raw agreement overstated chance-corrected agreement by 33-41 points on chat benchmarks.
- **OpenAI hosted eval tooling:** being retired; treat its workflow as unstable.
- **"Harness engineering" attributed to Mitchell Hashimoto (Feb 2026):** search snippets only.

## 5. Coverage

Read in full: local Anthropic papers (demystifying-evals, containing-claude, multiagent-patterns) and the hillclimbing post; skills and context-engineering posts by grep. Fetched at page level: four OpenAI pages, Anthropic's autonomy study, WorkOS, the IMDA substack, Game Days, LinearB, the DEV Community post, METR's 2025 page, both arXiv abstracts. Search-summary only: Husain/Shankar, HITL/HOTL pieces, observability roundup, Cursor, Code Review, Devin Review, `/goal`, plugin eval, agent view, plan mode, METR's 2026 follow-up. Not reached: IMDA PDF text, full papers, controlled evidence on escalation policy.

## Response to the adversary

Accepted and fixed: M1, M2, M4, M5, M6, L1, L2, L3.

**M3.** Used METR's trial. It measures individual developers with early-2025 tools, not orchestrated agent runs, so it does not answer where human time goes in agent workflows. The 2026 follow-up stays search-summary level.

**L4.** Re-rated first-party telemetry to moderate and labelled it self-reported. The autonomy study is a second Anthropic dataset, consistent but not independent.

**L5.** I found no different merge rates: search snippets of a 2.7M-PR LinearB page show the same 32.7% and 84.4%. The sample-size conflict is now disclosed. The 17.6h and 3.4h sentence appears verbatim in my fetch of linearb.io/library/ai-in-software-development; I did not see the 28 July page, and the adversary did not reproduce the quote.

**L6.** I located the imda.gov.sg PDF but my fetch returned unreadable binary, so the indicators rest on two secondary summaries; written justification is marked substack-only.

**M2 detail.** The clarification ratio is omitted: my fetch ("more than twice as often as on minimal-complexity tasks") and the adversary's quote differ, so the body gives direction only.
