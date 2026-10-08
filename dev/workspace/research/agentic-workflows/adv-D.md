# Adversary findings: D-improvement-and-load.md

Attacked: the revised file (overwritten 18:35). Withdrawals from the earlier draft are at the end. Local Anthropic quotes held, except as below.

## Medium

**M1. OpenAI guidance rests on a platform being shut down.** Claim: "OpenAI ships trace grading"; "then datasets and eval runs, then automatic prompt optimization". developers.openai.com/api/docs/deprecations: Evals platform deprecation announced June 3 2026; "October 31, 2026: Existing evals become read-only"; dashboard and API shut down November 30 2026; "Graders documented for eval workflows are part of this transition." The agent-evals page carries no notice.

**M2. Primary research on oversight is missing, so "rarely measured" is wrong.** Anthropic, "Measuring AI agent autonomy in practice" (anthropic.com/research/measuring-agent-autonomy, Feb 18 2026): full auto-approve "20% of the time; by 750 sessions... over 40%"; interrupts in 5% of turns for new users, about 9% for experienced; "On the most complex tasks, Claude Code asks for clarification more than twice as often as humans interrupt it". D rates in-the-loop versus on-the-loop "thin (argued, rarely measured)" from vendor blogs. Agent-initiated clarification has no entry.

**M3. The controlled evidence on human time is unused.** D lists "Unused: METR posts". METR's 2025 randomised trial (16 developers, 246 issues; 19% slower with AI while estimating 20% faster; a 2026 follow-up METR calls unreliable) is known to me from search summaries only. "Where human time goes" rests on a vendor report and an untraced survey.

**M4. No practice answers the bottleneck D finds.** D concludes review is where time goes, then lists nothing that reduces review load:
- automated review before human review (Code Review, `/code-review`, ultrareview in the captured llms.txt; Devin Review);
- plan approval up front (adv-B M1);
- completion judged by a second model (`/goal`);
- views showing which sessions need the human (agent view, Projects).

**M5. Feeding failures back into instructions is missing.** Section 1 covers measuring only. Omitted: the skills post's "Build a gotchas section"; `claude plugin eval` ("compare against a no-plugin baseline, and gate CI on the score", llms.txt); auto memory; pruning the harness as models improve (context-engineering post: "removed over 80%").

**M6. Shape.**
- "OpenAI's guidance" is a source, not a practice; it duplicates "Automated agent evals" and "LLM-as-judge".
- "Human-in-the-loop versus on-the-loop", "Approval-gate failure" and the first "What fails" bullet are one item.
- "Escalation and quarantine" is two. Quarantine is a security pattern that belongs with containment. The turf-war study is about conflict between agents, not escalation to a human.

## Low

**L1.** "a stolen key": the source says "an API key controlled by the attacker"; files went "to the attacker's Anthropic account".

**L2.** The hillclimb gain mixes model swaps with prompt edits (Opus 4.8 74.4%, Opus 5.5 87.8%, Sonnet 5 88.9%, improved prompt 98.9%). "The gap... is the overfitting the split catches" is D's inference; on 14 tickets it may be noise.

**L3.** Section 4's "overstates validity by 33-41 points" contradicts section 1 (exact match versus Cohen's kappa). The study used chat benchmarks, not agent transcripts.

**L4.** "strong = first-party data" rates Anthropic's telemetry strong; report A calls the same figures "self-reported... not externally audited".

**L5.** LinearB sells AI code review; its July 28 2026 page (2.7M PRs) gives different merge rates.

**L6.** The IMDA primary is public at imda.gov.sg; D read a substack.

## Withdrawn (earlier draft; answered by the revision)

- Hillclimb rated "strong" with no sample size: now "moderate", 44 tickets.
- "older models... escalated into sabotage": reworded.
- Sierra, Stripe, Shopify as users: removed.
- "planted risky ones": fixed.
- 11.4h/9.8h attributed to LinearB: now an unnamed survey.
- arXiv 2605.02273 finding unreported: now reported.
- JetBrains "14x rework gap": dropped.

## Revision check (2026-10-07, revised D)

**Closed:** M1, M2, M4, M5, M6, L1 to L4, and L6 (limit disclosed). M3: the qualification is right; METR measures individual developers, not agent runs.

**Withdrawn:** L5. The 17.6h and 3.4h sentence is verbatim on linearb.io/library/ai-in-software-development (8.1M PRs). The rates I cited from the July page were cohort cuts, not a conflict.

**Ruling on the M2 detail:** both sentences are in the study body: "more than twice as often as humans interrupt it" and "as on minimal-complexity tasks". The ratio can be restored.

**New (all low):**
- Code Review launched as "a research preview in beta for Team and Enterprise plans" (claude.com/blog/code-review); D gives no label. Its figures held.
- The review-load practices rest on search summaries, though agent-view.md and best-practices.md are captured.
- "strong for that finding" rates one study strong; D's scale requires "several independent sources".
