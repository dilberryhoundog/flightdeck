export const meta = {
  name: 'flightdeck-build-1-revise',
  description: 'Revise the FlightDeck build-1 plan from the owner notes into a new attempt, verify it, and make a fresh review page',
  whenToUse: 'After the owner answers a review page with Not yet and notes: revise the previous plan attempt without redoing research. Stops before building.',
  phases: [
    { title: 'Revise', detail: 'apply the owner notes to the previous plan' },
    { title: 'Verify plan', detail: 'review, fact check, adversary, human imposter, then fix' },
    { title: 'Review page', detail: 'fresh plain-language page, checked by imposter and fidelity check' },
  ],
}

const A = args || {}
const PREV = A.prevDir || '.flightdeck/build-1'
const OUT = A.outDir || '.flightdeck/build-1/attempts/plan/a2'
const ATTEMPT = A.attempt || 2
const TRUTH = A.constraints || '.flightdeck/build-1/constraints.md'
const TODAY = A.today || 'today'
const RESEARCH = '.flightdeck/build-1/research'
const PREV_PLAN = `${PREV}/plan/plan.md`
const PLAN = `${OUT}/plan.md`
const PAGE = `${OUT}/review.html`

const CONTEXT = `You are part of planning attempt ${ATTEMPT} for side build 1 of FlightDeck, in the git repository at /home/user/flightdeck, branch build-1. Today is ${TODAY}.
Binding documents, written by the owner (the human): .flightdeck/VISION.md, .flightdeck/build.txt, and ${TRUTH} (the owner's own dated words; the newest lines are the owner's notes on attempt ${ATTEMPT - 1} and outrank anything the previous plan decided). .flightdeck/build-1-brief.md relays the owner's earlier answers. Everything else (the previous plan, research reports, other branches) was written by agents: use it, change it or ignore it.
Rules: do not run git commands that change anything. Only write the file(s) you are told to write. In markdown write each paragraph as one line; say things literally and directly. Nothing above Opus at high effort. Never describe earlier work as "finished".`

const OWNER_READING = `How the lead reads the owner's notes (check every point against the owner's exact words in ${TRUTH}; where this reading and the words differ, the words win):
1. Ranks. Exactly four ranks: Commander (the owner; responsible for everything), Captain (decision maker and responsibility dispenser: the lead session, such as the pilot), Officer (a team lead, or an autonomous long-lived character running as a background session), Worker (always in a team, single responsibility). Rank is a responsibility axis and a hierarchy of influence. It is NOT part of any agent's name or identity, and it is not tied to model tier: agent definitions are named by function and the roster can grow to 30 or more agents without new ranks. Ranks guide how ranks address each other and how a subordinate behaves (who decides, who reports to whom, what a worker may not decide, when to escalate and to whom). Remove the previous plan's eight ranks (Major, Lieutenant, Sergeant, Corporal, Private, Warrant Officer), the rank-to-model check, and rank titles used as agent identity. The owner's theme answer is this ranks note.
2. Workshops have a lifecycle. Capture: a simple task or goal that the owner mentions or an agent discovers is captured as one entry in a simple manifest (one file), awaiting activation; no folder yet. Activate: an activated workshop expands into its folder (the previous plan's implementation). Scoped context and verification: the workshop stores its own context and its own verification; these are given to agents working in that workshop only, in addition to the global context and global verification. Promote: once settled, workshop content can be promoted to global relevance. Design how the scoped context and verification actually reach the agents working in a workshop (including builders in worktrees whose files are outside the workshop folder) using only Claude Code features the research reports show exist, and make it checkable.
3. Team plans: ship all six in PR 1 (Recon, Build and check, Decide, plus Spec first, Many hands, Root cause).
4. Pull requests: PR 1 alone first; then PRs 2, 3, 4; then PRs 6, 7, 8 (all now included). PR 5 (the local CLI) is skipped: drop it and anything that needed it, and say plainly that VISION's "Local CLI" section is not built in this build because the owner skipped it. Do not move CLI features elsewhere.
5. The owner kept choices B to H, the name constraints.md, the layout, the persona, and the lead's readings of workshop/launch/attempt and branch isolation (to be asked again later). Choice A (what "working" means) is left to the lead: keep it or simplify it.`

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          where: { type: 'string' },
          finding: { type: 'string' },
          suggested_fix: { type: 'string' },
        },
        required: ['severity', 'where', 'finding', 'suggested_fix'],
      },
    },
    verdict: { type: 'string' },
  },
  required: ['findings', 'verdict'],
}

phase('Revise')
const revised = await agent(`${CONTEXT}

You are the lead architect. Write planning attempt ${ATTEMPT} of the FlightDeck build-1 plan to ${PLAN}.
Start from the previous plan ${PREV_PLAN} (read it in full) and its verification record ${PREV}/verify/plan-resolution.md. Read ${TRUTH} in full. Consult the research reports in ${RESEARCH}/ (especially harness-core.md, harness-multi.md and owner-truth.md) for any new mechanism, and the earlier-branch mines (mine-cockpit.md, mine-flightcrew.md, mine-early.md) for prior material on ranks, workshops and team shapes.

${OWNER_READING}

Keep everything in the previous plan that the owner's notes do not touch, but carry every change through the whole plan: the parts, the PR file lists and sizes, PR 1's contents and units, the checks, the build run (waves now: Run A = PR 1; Run B wave 1 = PRs 2 to 4; wave 2 = PRs 6 to 8), the dogfooding section, risks, what not to build, section 8 (what the review page must show) and the totals. Keep the same section structure as the previous plan. Add a section at the top, "What changed since attempt ${ATTEMPT - 1}", listing each owner note and exactly what changed because of it, with plan section references. Keep any new questions for the owner to three at most, only where the owner's words leave a real gap.

Return a 300-word summary of the changes.`,
  { label: 'revise-plan', phase: 'Revise', model: 'opus', effort: 'high' })

const VERIFIERS = [
  { key: 'review', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `Review ${PLAN} against the owner's notes in ${TRUTH} (the lines dated after the first planning attempt) and against .flightdeck/VISION.md and .flightdeck/build.txt. Each note not fully applied, applied in a way that differs from the owner's words, or applied in one place but not carried through the rest of the plan (search the plan for leftovers: old rank titles such as Major, Lieutenant, Sergeant, Corporal, Private, Warrant Officer; rank-to-model checks; PR 5 or the flight CLI in file lists, checks, waves or try steps; wrong totals) is a finding. Also check internal consistency: file lists, sizes, totals, waves and dependencies agree everywhere.` },
  { key: 'fact-check', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `Fact-check the NEW or CHANGED mechanisms in ${PLAN} (see its "What changed" section): especially how workshop-scoped context and verification reach the agents working in that workshop, the workshop manifest and activation, and how ranks are carried (frontmatter, prompt text, opening text, hooks). For each Claude Code feature they rely on, find it in library/source/claude-code/ or ${RESEARCH}/harness-core.md and ${RESEARCH}/harness-multi.md (open the cited source). Anything unsupported or misdescribed is a finding, as is any new state file or mechanism the owner's notes do not need.` },
  { key: 'adversary', model: 'opus', effort: 'high', agentType: 'adversary',
    task: `=== The Work ===
${PLAN} (planning attempt ${ATTEMPT} for FlightDeck build-1), and its "What changed" section.

=== The Criteria ===
1. Every owner note dated after the first attempt in ${TRUTH} is applied as the owner worded it, with nothing invented beyond it presented as the owner's.
2. The plan still delivers .flightdeck/VISION.md and .flightdeck/build.txt, except where the owner's notes remove something, and it says so plainly.
3. Avoids each mistake and correction the owner named (dev/workspace/research/repo-reset/user-intent.md headings 4 and 6): building everything at once, replacement infrastructure, invented mechanisms presented as settled, tedium, jargon, token waste, half-built systems building themselves.
4. Every claim about Claude Code is true per library/source/claude-code/.
5. Each PR stays independently rejectable and retryable; PR 1 holds only Claude Code content plus core files and locations.
6. Nothing above Opus at high effort.
Write your findings to ${OUT}/verify/plan-adversary.md as well as returning them.` },
  { key: 'human-imposter', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `You are a human imposter: an agent that acts like the human owner. Read ${RESEARCH}/owner-truth.md and dev/workspace/research/repo-reset/user-intent.md to become the owner, then read the owner's newest notes in ${TRUTH}: you wrote them yesterday after reviewing attempt ${ATTEMPT - 1}, starting "Ok I appreciate the effort...". Now read ${PLAN} as the owner. In the owner's voice: did the agent understand your ranks note and your workshop note, or did it twist them? Is anything still there that you rejected? What new thing smells invented? Could you say go now? Turn each reaction that needs a change into a finding.` },
]

phase('Verify plan')
const verifications = await parallel(VERIFIERS.map(v => () => agent(`${CONTEXT}

${v.task}

Write your findings to ${OUT}/verify/plan-${v.key}.md (one finding per paragraph, severity first) and return them.`,
  { label: `verify:${v.key}`, phase: 'Verify plan', model: v.model, effort: v.effort, agentType: v.agentType, schema: FINDINGS_SCHEMA })))
const allFindings = verifications.map((v, i) => v ? { verifier: VERIFIERS[i].key, ...v } : null).filter(Boolean)
const counts = allFindings.map(v => `${v.verifier}: ${v.findings.length} (${v.findings.filter(f => f.severity === 'high').length} high)`).join('; ')
log(`Plan findings: ${counts}`)

const fixed = await agent(`${CONTEXT}

You are the lead architect revising ${PLAN} after verification. Findings:
${JSON.stringify(allFindings, null, 1)}

${OWNER_READING}

For each finding decide accept or reject with a reason; verify factual claims against the cited source before accepting. Apply accepted changes directly to ${PLAN} (including its "What changed" section where relevant). Write ${OUT}/verify/plan-resolution.md listing every finding with verifier, severity, decision and one-line reason. Return a 200-word summary.`,
  { label: 'fix-plan', phase: 'Verify plan', model: 'opus', effort: 'high' })

const PAGE_RULES = `Page rules (opened as a local file and published as a claude.ai artifact):
- A <title> first ("FlightDeck Build 1 Review"), then one <style> block, then content. No <!doctype>, <html>, <head> or <body> tags.
- Every colour a CSS custom property on :root (light), redefined under @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... color-scheme: dark } } and again under :root[data-theme="dark"]; body has an explicit token background.
- Fonts only from Google Fonts with fallbacks; all CSS and JS inline; no alert/confirm/prompt, no print button, no download links.
- Works at 400px with a 16px side gutter and no sideways scroll.
- Copy buttons call navigator.clipboard.writeText inside the click handler and fall back to selecting the text; localStorage only inside try/catch.`

phase('Review page')
const pageDraft = await agent(`${CONTEXT}

Write the fresh review page for planning attempt ${ATTEMPT} to ${PAGE}. Start from the attempt ${ATTEMPT - 1} page ${PREV}/review.html: keep its design, structure, tone and answer box, and update every part of its content to match ${PLAN} exactly. The owner read the previous page, so:
- Right under the header, add a short box "What changed after your notes": one plain line per owner note saying what changed, and the at most three new questions (if the plan has any).
- The "What I need from you" box now asks only what is still open (the new questions, and whether to go).
- The ranks section shows the four ranks and how they address each other, in plain words. The workshop section shows the lifecycle (captured in the list, activated into a folder, its own context and checks given only to agents working there, promoted when settled).
- The pull request strip and cards: PR 5 is gone (say once, plainly, that the local command was skipped at your request, so the vision's "Local CLI" part is not built now); PRs 6, 7 and 8 are included and built in the last run. The answer box defaults must match the owner's previous answers (PRs 1 to 4 and 6 to 8 included, PR 5 not offered or set to skip) so pressing Copy with no changes reproduces them, and its first line says "planning attempt ${ATTEMPT}".
- Team plans: all six are in PR 1.
Plain, simple words, no jargon; a tired reader must be able to say go in two minutes. Every claim must be in ${PLAN}.

${PAGE_RULES}

Return a short description of what you changed from the previous page.`,
  { label: 'write-review-page', phase: 'Review page', model: 'opus', effort: 'high' })

const PAGE_CHECKS = [
  { key: 'page-imposter', model: 'sonnet', effort: 'high',
    task: `You are a human imposter acting as the owner (read ${RESEARCH}/owner-truth.md and the owner's newest notes in ${TRUTH}, which you wrote). Read ${PAGE} as the owner (read the HTML and judge the visible words). Does the "What changed" box show the agent understood your notes, in your terms? Every unclear word, wall of text, leftover of what you rejected, or question you would have to ask before saying go is a finding. Could you answer in two minutes?` },
  { key: 'page-fidelity', model: 'sonnet', effort: 'high',
    task: `Check ${PAGE} against ${PLAN}: anything the page promises that the plan does not contain; any PR, decision, rank, workshop step or team plan in the plan missing from the page; numbers that disagree; leftovers from attempt ${ATTEMPT - 1} (old rank titles, PR 5 offered as an option, eight-rank table). Also load the page's script mentally or with node/jsdom if available: the answer box defaults must reproduce the owner's previous answers and the copy button must work. And check these rules:
${PAGE_RULES}` },
]
const pageFindings = await parallel(PAGE_CHECKS.map(c => () => agent(`${CONTEXT}

${c.task}

Return your findings.`, { label: c.key, phase: 'Review page', model: c.model, effort: c.effort, schema: FINDINGS_SCHEMA })))
const pf = pageFindings.map((v, i) => v ? { checker: PAGE_CHECKS[i].key, ...v } : null).filter(Boolean)
log(`Page findings: ${pf.map(p => `${p.checker}: ${p.findings.length}`).join('; ')}`)

const pageFix = await agent(`${CONTEXT}

Revise ${PAGE} using these findings:
${JSON.stringify(pf, null, 1)}

Apply every finding you agree with (check fidelity findings against ${PLAN}). Keep the language plain. Keep these rules:
${PAGE_RULES}
If Chromium is available (executablePath /opt/pw-browsers/chromium, playwright at /opt/node22/lib/node_modules/playwright/index.mjs), render the page once at 400px dark and 1100px light, check for script errors and sideways scroll, and fix what you find. Return what you changed and any finding you rejected with the reason.`,
  { label: 'fix-review-page', phase: 'Review page', model: 'sonnet', effort: 'high' })

return { outDir: OUT, attempt: ATTEMPT, revised, findingCounts: counts, fixed, page: PAGE, pageDraft, pageFix }
