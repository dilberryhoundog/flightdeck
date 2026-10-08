# Adversary findings: SYNTHESIS.md

Held: X1 to X4 and X6 keep both sides, quoted figures match the reports, and every path in section 7 exists.

## High

**H1. The "improve in isolation" verdict is the synthesiser's own.** Claim: "isolation is available only through evals, which makes feature 9 a dependency of the other nine". The quoted lines (C on stars, D's "no controlled study") describe the public evidence base, not whether a feature can change without the others. The reports show features revised one at a time: A's version-gated `ultracode` and size guidelines; C's Ralph loop and commands absorbed separately. A feature marked "borderline" becomes the linchpin and step 2 of the build order, and step 2 contradicts its citation: cases come "from real failures" (D), which need running features first.

## Medium

**M1. Settled standards are left out of "the mechanisms have not settled".** B: AGENTS.md "is supported by 25+ tools". C: agentskills.io "lists more than 40 clients". The synthesis lists AGENTS.md only as an add-on.

**M2. "Supported for six, not four" rests on untagged inference.** Only features 1, 4 and 8 tag their Dependence line. No report says multi-agent "needs... isolation (8)". They also disagree with the verdict: triggers "need feature 8 first" and "every other feature is built from" 7, yet both count as standing alone.

**M3. Convergence borrows D's scale wrongly.** "strong = several independent sources", but the reports share sources (A and D use the same Anthropic posts). Three reports earn "strong" for review and triggers but "moderate" for loops.

**M4. Feature 8 loses a distinction.** It is defined as "Deterministic limits", then lists auto mode, which D calls a "classifier", and permission modes, whose approval prompts section 6 calls unsettled. A separates deterministic from probabilistic; D separates containment from supervision.

**M5. Feature 1 drops B's caveat.** Vendors are removing the approval: Kiro's "Quick Spec removes them"; Jules's critic "reviews auto-approved plans". Plan approval is also an approval gate (X3).

**M6. Section 7 misses a room.** "Still nothing for... containment" and guardrails "Nearest: none". `.cockpit/base/` exists and is not mentioned. Its `settings/README.md` describes `permissions.defaultMode: auto` and a PreToolUse hook that "Blocks writes outside the cockpit". That README points at absent team files, so `base/` may be carried over from v1; I did not check. Nothing else in section 7 is invented.

## Low

**L1.** Code Review for PRs has no status; adv-D records "a research preview in beta" at launch. Step 6 says multi-agent "rests on experimental and preview mechanisms"; subagents and dynamic workflows carry no label.

**L2.** Section 4 rules self-reflection "Not core"; section 6 calls the same question unsettled.

**L3.** "Anthropic replaced it with a Grep tool" concerns codebase search, not cross-session memory. My adv-E N1 was loose on the same point.

**L4.** "there are ten" is a cut inherited from my adv-cross groups, a merge aid. B splits context into "Three distinct mechanisms".

**L5.** "so a release can invalidate a tuned add-on" is unmarked inference. Observability merges traces with a human-attention view.
