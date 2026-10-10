export const meta = {
  name: 'flightdeck-build-1-plan',
  description: 'Plan FlightDeck side build 1: research, competing designs, verified plan, plain-language review page',
  whenToUse: 'Planning (and re-planning after the owner adds constraints) for a FlightDeck side build. Stops before building.',
  phases: [
    { title: 'Research', detail: 'owner intent, Claude Code harness, sources, earlier branches, precedents' },
    { title: 'Design', detail: 'three independent plans from different angles' },
    { title: 'Judge', detail: 'score the plans, then merge into one' },
    { title: 'Verify plan', detail: 'review, fact check, adversary, human imposter, then revise' },
    { title: 'Review page', detail: 'plain-language HTML page, checked by imposter and fidelity check' },
  ],
}

const A = args || {}
const OUT = A.outDir || '.flightdeck/build-1'
const ATTEMPT = A.attempt || 1
const REPO = '/home/user/flightdeck'

const CONTEXT = `You are part of the planning run (attempt ${ATTEMPT}) for side build 1 of FlightDeck, in the git repository at ${REPO}, branch build-1.
Binding documents, written by the owner (the human): .flightdeck/VISION.md and .flightdeck/build.txt. .flightdeck/build-1-brief.md relays the owner's later answers (build.txt wins where they differ). ${OUT}/constraints.md holds constraints the owner added for retries: read it first; anything listed there is binding and outranks everything except VISION.md and build.txt.
Everything else in the repository and on other branches was written by agents (INTENT.md, README.md, HISTORY.md, dev/, the reports). Mine it, change it or ignore it; never treat it as canon. Never describe earlier work as "finished".
Rules for you: do not run git commands that change anything (no commit, checkout, switch, stash, push, branch). Read other branches with \`git show origin/<branch>:<path>\` and \`git ls-tree -r --name-only origin/<branch>\`. Only write the file(s) you are told to write. In markdown files write each paragraph as one line with no hard wrapping; say things literally and directly.
Model ceiling set by the owner: nothing above Opus at high effort. Sonnet 5.5 is the preferred worker, Haiku for cheap reading.`

const RESEARCH_SCHEMA = {
  type: 'object',
  properties: {
    report_path: { type: 'string' },
    summary: { type: 'string', description: 'At most 250 words: the most decision-relevant findings.' },
  },
  required: ['report_path', 'summary'],
}

const RESEARCH = [
  {
    key: 'owner-truth', model: 'sonnet', effort: 'high',
    task: `Distil what the owner wants. Read in full: .flightdeck/VISION.md, .flightdeck/build.txt, .flightdeck/build-1-brief.md, ${OUT}/constraints.md, dev/workspace/research/repo-reset/interview-record.md, dev/workspace/research/repo-reset/user-intent.md, dev/workspace/research/repo-reset/concept-trace.md, INTENT.md.
Write a report with these sections: (1) For each of the 13 VISION.md sections: what the owner means, backed by their dated quotes from user-intent.md where they exist, and what a result that "works great and fits the goal" would show for it. (2) Every hard requirement in build.txt and the brief, as a numbered checklist. (3) The owner's pain points and the corrections they have made to agents (scope creep, invented mechanisms, too many questions, jargon, token waste, replacement infrastructure, building all at once), each with one quote. (4) The owner's vocabulary: terms they coined and what each means in their usage (commander, pilot, officers, crew, workshop, launch, truth, drills, missions, dossier, etc.), marking which are current and which are dated. (5) Evidence bearing on the three questions the vision does not answer: how the owner starts a piece of work, where questions waiting on the owner are held, whether FlightDeck replaces dev-workspace or sits beside it. (6) Acceptance tests in the owner's own terms: short statements the owner would use to judge the build.`,
  },
  {
    key: 'harness-core', model: 'sonnet', effort: 'high',
    task: `Establish exact facts about Claude Code content that FlightDeck can ship. Read library/source/claude-code/: subagents.md, skills.md, hooks.md, hooks-guide.md, memory.md, output-styles.md, permissions.md, claude-directory.md, model-config.md, tools-reference.md, env-vars.md, security.md, sandboxing.md. Then try WebFetch on https://code.claude.com/docs/en/plugins and https://code.claude.com/docs/en/plugins-reference (and https://code.claude.com/docs/en/llms.txt to find other plugin pages) for the plugin layout; if the network refuses, say so and rely on library/source/claude-code/llms.txt and claude-directory.md.
Report, citing file and heading for each fact: agent definition frontmatter fields (model, effort, tools, hooks, skills, memory, permissionMode, isolation, color, etc.) and which work when the agent is shipped by a plugin; skill frontmatter and folder layout, how skills are invoked and preloaded; every hook event, the hooks config shape, hooks in agent frontmatter, hook input/output; CLAUDE.md and .claude/rules (path-scoped rules, imports with @); output styles; settings.json keys relevant to agents/permissions/env; the plugin directory layout and every component type a plugin can ship (agents, skills, commands, hooks, output styles, MCP/LSP servers, bin/executables on PATH, settings, monitors, etc.) and what a plugin cannot ship (for example CLAUDE.md or rules, if so); how to load a plugin from a local directory for instant testing (--plugin-dir, marketplace add of a local path); plugin variable substitutions such as \${CLAUDE_PLUGIN_ROOT}. End with "Facts that constrain FlightDeck's layout" as a list.`,
  },
  {
    key: 'harness-multi', model: 'sonnet', effort: 'high',
    task: `Establish exact facts about Claude Code multi-agent features. Read library/source/claude-code/: workflows.md, agent-teams.md, worktrees.md, cross-session-messaging.md, agent-view.md, headless.md, large-codebases.md, best-practices.md, monitoring-usage.md, glossary.md, sandbox-environments.md, and library/source/claude-dev-blog/a-harness-for-every-task-dynamic-workflows-in-claude-code.md.
Report, citing file and heading: the Workflow tool (script API, saved workflows location and format, how a saved workflow is invoked by name, args, resume, model and effort per agent, worktree isolation, limits); agent teams (how enabled, how a team is defined and started, teammates, shared tasks, messaging, limits); background sessions and agent view; cross-session messaging; worktrees; headless/print mode for scripted runs; usage monitoring. Then a section "Shapes of multi-agent work Claude Code supports natively" listing each shape (single HITL chat, subagent fan-out, saved dynamic workflow, agent team with live adversary, background sessions messaging each other, headless batch, etc.) with when each fits. End with "Facts that constrain how FlightDeck launches work".`,
  },
  {
    key: 'sources', model: 'sonnet', effort: 'high',
    task: `Extract best practice from the owner's favourite sources. Read every file in library/source/claude-dev-blog/ and library/source/anthropic/ (the .txt papers are long; read them fully but report concisely). For each source: three to six findings that bear on building FlightDeck (agentic accelerator: workshops, launches, verification, evals and hill-climbing, HTML pages as an interface between agent and human, context engineering for Claude 5 models, skills, Claude Code mods, containment, multi-agent patterns and failure modes). Then a synthesis section "Practices FlightDeck should adopt" (each with source) and "Traps the sources warn about". Pay special attention to: using-claude-code-the-unreasonable-effectiveness-of-html.md (the HTML page suite), getting-started-with-claude-code-mods.md (what mods can add to Claude Code's interface), automating-eval-design-and-hillclimbing.md and demistifying-evals.txt (the laboratory), patterns-and-problems-in-mulitagent-systems.txt (launches).`,
  },
  {
    key: 'jetbrains', model: 'haiku', effort: 'medium',
    task: `Read the seven PDFs in library/source/jetbrains-developer-ai/ (use the Read tool with the pages parameter; read them all). For each, list the key concepts and patterns in a few lines. Then a short section "Ideas relevant to an agentic accelerator for Claude Code" (agent loop, memory types, orchestration patterns, single versus multi-agent choice, workflow shapes). Keep the report under 1500 words.`,
  },
  {
    key: 'mine-cockpit', model: 'sonnet', effort: 'high',
    task: `Mine the cockpit branch for content FlightDeck build-1 can reuse. Start with dev/workspace/research/repo-reset/work-inventory.md and branch-report.md (on the current branch) as the index. Then explore origin/cockpit: flightdeck/.cockpit-archive/ (base, team, commander, records, work), flightdeck/manuals/, flightdeck/testbench/benches/, flightdeck/flightcrew/crew, library/terms.md, library/rubrics/rubric-guide.md, library/review/adversarial-mandate.md, library/spec/interview-session-conventions.md, and dev/workspace/research on that branch (sample the files; skim large record sets by listing and reading a representative few).
Report as an inventory: for each useful item give branch:path, what it is in one line, and a verdict (reuse nearly as-is / adapt / idea only / ignore) with the reason. Focus on: ranks and roles (commander, pilot, officers, crew), team definitions and dispatch, workshops (per-order directories), truth and advice records, dossiers and requests to the commander, procedures, HUD and HTML pages, manuals, rubrics, the adversarial mandate. Then "What went wrong here, in the files" (overbuilt records, prefixes, tedium the owner complained about) so the plan can avoid it.`,
  },
  {
    key: 'mine-flightcrew', model: 'sonnet', effort: 'high',
    task: `Mine the flightcrew branches for content FlightDeck build-1 can reuse. Start with dev/workspace/research/repo-reset/work-inventory.md (current branch) as the index. Then explore origin/flightcrew-core (the most developed) and compare with origin/flightcrew-buildout and origin/run/flightcrew-characterization-2: flightdeck/flightcrew/ (crew, hooks, schemas, templates, checks, bin, workflows), flightdeck/manuals/ (orchestration, harness, spec, testing, versioning), flightdeck/testbench/ (benches, suites, fixtures, lib), flightdeck/launch/ (specs and one launch folder as a sample), .claude/agents/flightcrew/.
Report as an inventory: branch:path, what it is, verdict (reuse nearly as-is / adapt / idea only / ignore) and why. Focus on: agent role definitions and their frontmatter, hooks that enforce role guarantees, launch/run folder shapes and retry, verification checks and rubrics, workflow scripts, testbench/drill ideas for the laboratory, manuals worth carrying forward. Then "What went wrong here, in the files" (the fc CLI that overshadowed everything, invented state files like run.json and HALT.json, test suites the owner had to fight).`,
  },
  {
    key: 'mine-early', model: 'sonnet', effort: 'medium',
    task: `Mine the early branches and the current dev/ folder. Explore origin/engage-crew (flightdeck/launch/agent-spec-interviewer, flightdeck/launch/agent-types, flightcrew/crew), origin/rubric-testing (flightdeck/testbench/runs: what was tested and learned), origin/constitution-research (library/constitution/*.md, flightdeck/missions/shape-library.md, flightdeck/launch/reference-library), origin/archive/main-2026-10-09 (flightdeck/missions/*.md, library/*), and on the current branch dev/workspace/filebox/, dev/workspace/plans/, dev/workspace/prompts/, dev/workspace/history/.
Report as an inventory with verdicts (as above). Find especially: the "about 6 shapes" of orchestration the owner mentioned (look in shape-library.md and the concept documents), agent-type taxonomies, the interviewer agent spec (useful for a human-imposter or interview feature), rubric lessons (the owner said yes/no rubric questions all answer yes; inability to answer yes is a finding), and the principles documents.`,
  },
  {
    key: 'precedents', model: 'haiku', effort: 'medium',
    task: `Record layout precedents. (1) List and read the owner's installed plugins under /root/.claude/plugins/synced/*/ (chat-tools, classroom, cowork-plugin-management): their folder layout, plugin.json, agent and skill frontmatter, any hooks, scripts, templates, CHANGELOG. (2) Read this repository's .claude/ (settings.json, agents/adversary.md, rules/*.md) and .claude-plugin/*.json. (3) Read dev/workspace/README.md, dev/workspace/WORKSPACE.md, dev/workspace/workspace-config.yml to describe what dev-workspace does (workspaces per branch, archives, history, the CLI commands). (4) Run \`claude --help\` and \`claude plugin --help\` (and \`claude plugin marketplace --help\` if it exists) and record the flags relevant to loading a local plugin, agents, background sessions and workflows. Do not start any Claude session. Report: "How the owner's own plugins lay things out", "What dev-workspace does and which parts overlap with the FlightDeck vision", "How to load a local plugin for instant testing", and note that .claude/agents/adversary.md sets model: fable, above the owner's Opus ceiling.`,
  },
]

phase('Research')
const research = await pipeline(
  RESEARCH,
  r => agent(`${CONTEXT}

Your job: ${r.task}

Write your report to ${OUT}/research/${r.key}.md (create the folder if needed). Start the file with a one-paragraph summary. Cite paths (branch:path for other branches) so later agents can open what you found. Then return the report path and a short summary.`,
    { label: `research:${r.key}`, phase: 'Research', model: r.model, effort: r.effort, schema: RESEARCH_SCHEMA })
)
const reports = research.filter(Boolean)
const missing = RESEARCH.filter((r, i) => !research[i]).map(r => r.key)
if (missing.length) log(`Research reports missing: ${missing.join(', ')}`)
const REPORT_LIST = reports.map(r => `- ${r.report_path}: ${r.summary.replace(/\n+/g, ' ')}`).join('\n')

const PLAN_SPEC = `The plan must contain these sections, in this order:
1. In one paragraph: what the owner gets from this build and how they try it straight away (the owner said: "Agent should build it so I can instantly try it out, particularly dogfooding itself").
2. Decisions the owner left to the lead ("let em cook"), each with the choice and a one-line reason: (a) what "working" means for each part; (b) where everything goes: the layout of .flightdeck/, what lives in .claude/, what lives at the plugin root (the repository root is the plugin root: .claude-plugin/marketplace.json uses source "./"); (c) how a retry works: where the owner's added constraints go and how a second attempt is kept apart from the first, both for the whole build and for one pull request; (d) how big the build is and what to cut first; (e) how the owner starts a piece of work; (f) where questions waiting on the owner are held; (g) whether FlightDeck replaces dev-workspace or sits beside it.
3. Parts: every VISION.md section (Accelerate Claude Code, Roleplay, Themed HTML page suite, Workshops, Launches, Local CLI, dev-workspace, Cheap tokens smart agents, Built with quality, Human energy, Keep it simple, Manuals and libraries, Laboratory) mapped to concrete parts. For each part: what it is, the files it creates (paths), the Claude Code features it uses, what "working" means as a check that an agent or the owner can run, and which pull request carries it. A vision section may be covered lightly, but none may be silently dropped.
4. Pull requests, in order. PR 1 is the basic one required by build.txt: only Claude Code content (agent definitions, hooks, rules, CLAUDE.md, skills, settings, output styles, commands) plus core files and locations (team dispatches, agent entry points, workflow patterns, the workshop skeleton). Every advanced feature is its own pull request so it can be rejected and retried alone. For each PR: title, one-paragraph purpose, file list, depends on, how the owner tries it in under five minutes, the checks it must pass, its size (file count and rough lines), and how it is retried.
5. The build run: the dynamic workflow that will build these PRs after the owner approves. Stages, which model and effort each stage uses (nothing above Opus high; Sonnet workers; Haiku for reading), when worktrees are used, how each PR is verified by review, by adversary and by human imposter (an agent that acts like the human, for example by answering the interview questions a feature asks), and how its results become a PR into build-1. The script itself is written later; describe it precisely enough that it can be written from this section.
6. Dogfooding: how FlightDeck is used to build and test itself during this build (for example this build living in its own workshop, the lab drilling the PRs).
7. Risks, and what not to build.
Keep custom machinery small: prefer Claude Code harness content (agents, skills, hooks, rules, saved workflows, agent teams, output styles, plugin bin) over bespoke infrastructure. Do not invent state files or mechanisms the plan does not need. Every Claude Code feature you rely on must be one the research reports show exists.`

const LENSES = [
  { key: 'harness-lean', angle: 'Harness-native and lean. Lean as hard as possible on Claude Code primitives, keep custom files and scripts to the minimum that delivers the vision, and keep every part independently removable. Guard against the owner\'s named mistakes: building everything at once and building replacement infrastructure.' },
  { key: 'fly-today', angle: 'Fly it today. Optimise for the owner\'s first hour: they open a session and immediately get a flight-themed experience that works great, with roleplay ranks, an HTML page that shows them state and takes their input back, and FlightDeck building or testing itself. Every PR has a vivid, instant way to try it.' },
  { key: 'improving-machine', angle: 'A machine that improves. Optimise for long-lasting human inputs: workshops with truth, decisions and requirements that let any work be retried; promotion of decisions to global places; manuals and library kept fresh by mid-tier agents; a laboratory with drills and evals that hill-climb FlightDeck\'s own documents.' },
]

phase('Design')
const candidates = await parallel(LENSES.map(l => () => agent(`${CONTEXT}

You are one of three architects writing competing plans for FlightDeck build-1. Your angle: ${l.angle}
Still cover everything the plan specification asks for; your angle decides emphasis and trade-offs, not scope.

Read first: .flightdeck/VISION.md, .flightdeck/build.txt, .flightdeck/build-1-brief.md, ${OUT}/constraints.md. Then the research reports (read every one in full; open the cited sources when a decision depends on them):
${REPORT_LIST}

${PLAN_SPEC}

Write your plan to ${OUT}/plan/candidates/${l.key}.md. Return a 200-word summary of its distinctive choices.`,
  { label: `design:${l.key}`, phase: 'Design', effort: 'high' })))

const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    scores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          candidate: { type: 'string' },
          vision_fit: { type: 'number', description: '0-10' },
          build_txt_compliance: { type: 'number', description: '0-10' },
          harness_native: { type: 'number', description: '0-10' },
          instantly_tryable: { type: 'number', description: '0-10' },
          cuttable_and_retryable: { type: 'number', description: '0-10' },
          feasible_as_stated: { type: 'number', description: '0-10: features used really exist and work as claimed' },
          owner_would_like_it: { type: 'number', description: '0-10' },
          best_ideas: { type: 'array', items: { type: 'string' } },
          problems: { type: 'array', items: { type: 'string' } },
        },
        required: ['candidate', 'vision_fit', 'build_txt_compliance', 'harness_native', 'instantly_tryable', 'cuttable_and_retryable', 'feasible_as_stated', 'owner_would_like_it', 'best_ideas', 'problems'],
      },
    },
    winner: { type: 'string' },
    reasoning: { type: 'string' },
  },
  required: ['scores', 'winner', 'reasoning'],
}

const CAND_PATHS = LENSES.map(l => `${OUT}/plan/candidates/${l.key}.md`).join(', ')
const JUDGES = [
  { key: 'fidelity', model: undefined, effort: 'high', lens: 'You judge fidelity: does the plan deliver VISION.md and every requirement of build.txt and the brief, and is each Claude Code feature it relies on real (check claims against the research reports harness-core and harness-multi and the docs in library/source/claude-code/).' },
  { key: 'engineering', model: undefined, effort: 'high', lens: 'You judge engineering: is it simple, harness-native, isolated and testable per part, cheap in tokens, really retryable, and buildable by a dynamic workflow of Sonnet workers in a sensible number of PRs.' },
  { key: 'owner-imposter', model: 'sonnet', effort: 'high', lens: 'You are a human imposter: you judge as the owner would. Read dev/workspace/research/repo-reset/user-intent.md and ' + OUT + '/research/owner-truth.md first and adopt the owner\'s viewpoint: a HITL veteran of two years, fatigued, who wants something that works great and fits the goal, hates tedium, jargon, invented mechanisms and replacement infrastructure, and loves the flight theme.' },
]

phase('Judge')
const judgements = await parallel(JUDGES.map(j => () => agent(`${CONTEXT}

${j.lens}

Score the three candidate plans: ${CAND_PATHS}. Read each in full. Use the binding documents as the yardstick. Score every dimension 0-10, list each plan's best ideas (ones worth grafting into the final plan even if that plan loses) and its problems, and name a winner.`,
  { label: `judge:${j.key}`, phase: 'Judge', model: j.model, effort: j.effort, schema: SCORE_SCHEMA })))
const judged = judgements.filter(Boolean)
const tally = {}
for (const j of judged) for (const s of j.scores) {
  const total = ['vision_fit', 'build_txt_compliance', 'harness_native', 'instantly_tryable', 'cuttable_and_retryable', 'feasible_as_stated', 'owner_would_like_it'].reduce((a, k) => a + (s[k] || 0), 0)
  tally[s.candidate] = (tally[s.candidate] || 0) + total
}
log(`Judge totals: ${JSON.stringify(tally)}; winners named: ${judged.map(j => j.winner).join(', ')}`)

const synth = await agent(`${CONTEXT}

You are the lead architect. Three candidate plans (${CAND_PATHS}) were scored by three judges. Judge totals across all dimensions: ${JSON.stringify(tally)}. Judges' full output:
${JSON.stringify(judged, null, 1)}

Write the final plan to ${OUT}/plan/plan.md. Base it on the strongest candidate and graft in the best ideas the judges named from the others; fix every problem the judges raised that you agree with. Read the candidates, the binding documents and any research report you need (${reports.map(r => r.report_path).join(', ')}).

${PLAN_SPEC}

Add a final section "Where this plan came from": which candidate it is based on, what was grafted from the others, and which judge problems you rejected and why. Return a 300-word summary of the plan.`,
  { label: 'synthesise-plan', phase: 'Judge', effort: 'high' })

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          where: { type: 'string', description: 'plan section or page section' },
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

const PLAN = `${OUT}/plan/plan.md`
const VERIFIERS = [
  { key: 'review', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `Review ${PLAN} for completeness. Build a checklist from VISION.md (every section), build.txt (every sentence that asks for something) and the brief (every item under "What the owner left to you" and "What the owner did state"), and check each against the plan. A missing, vague or contradictory item is a finding. Also check each PR can be tried by the owner in under five minutes as described, and each PR's checks are things an agent can actually run.` },
  { key: 'fact-check', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `Fact-check ${PLAN} against Claude Code as documented. For every Claude Code feature, file location, frontmatter field, hook event, command, flag or plugin behaviour the plan relies on, find it in library/source/claude-code/ or the research reports ${OUT}/research/harness-core.md and ${OUT}/research/harness-multi.md (open the cited source). Anything not supported, misdescribed, or relying on something a plugin cannot ship is a finding. Also flag invented state files or mechanisms the plan does not need.` },
  { key: 'adversary', model: 'opus', effort: 'high', agentType: 'adversary',
    task: `=== The Work ===
${PLAN} (the final plan for FlightDeck build-1).

=== The Criteria ===
1. Delivers the owner's vision in .flightdeck/VISION.md and every requirement in .flightdeck/build.txt and ${OUT}/constraints.md.
2. Avoids each mistake the owner named and each correction the owner made to agents, as recorded in dev/workspace/research/repo-reset/user-intent.md headings 4 and 6: building everything at once, replacement infrastructure, invented mechanisms presented as settled, tedium for the human, jargon, token waste, half-built systems used to build themselves.
3. Every claim about Claude Code is true per library/source/claude-code/.
4. Each PR is independently rejectable and retryable, and PR 1 contains only Claude Code content plus core files and locations.
5. Model use never exceeds Opus at high effort.
Write your findings to ${OUT}/verify/plan-adversary.md as well as returning them.` },
  { key: 'human-imposter', model: 'sonnet', effort: 'high', agentType: undefined,
    task: `You are a human imposter: an agent that acts like the human owner of this repository. Read dev/workspace/research/repo-reset/user-intent.md, dev/workspace/research/repo-reset/interview-record.md and ${OUT}/research/owner-truth.md, and become the owner: a two-year HITL veteran on a Claude 20x Max subscription, fatigued from weeks of failed attempts, who wants "something that works great and fits the goal", who coined the flight theme and caught the bug roleplaying the commander. Then read ${PLAN} as the owner would. In the owner's voice, react: what excites you, what you would cut, what confuses you, what smells like the mistakes you made before, what you would ask the agent, and whether you could try it straight away. Turn each reaction that needs a change into a finding.` },
]

phase('Verify plan')
const verifications = await parallel(VERIFIERS.map(v => () => agent(`${CONTEXT}

${v.task}

Write your findings to ${OUT}/verify/plan-${v.key}.md (one finding per paragraph, severity first) and return them.`,
  { label: `verify:${v.key}`, phase: 'Verify plan', model: v.model, effort: v.effort, agentType: v.agentType, schema: FINDINGS_SCHEMA })))
const allFindings = verifications.map((v, i) => v ? { verifier: VERIFIERS[i].key, ...v } : null).filter(Boolean)
const counts = allFindings.map(v => `${v.verifier}: ${v.findings.length} (${v.findings.filter(f => f.severity === 'high').length} high)`).join('; ')
log(`Plan findings: ${counts}`)

const revision = await agent(`${CONTEXT}

You are the lead architect revising the final plan ${PLAN} after verification by review, fact check, adversary and human imposter. Findings:
${JSON.stringify(allFindings, null, 1)}

For each finding decide: accept (change the plan) or reject (with a reason). Verify a finding before accepting it when it is a factual claim (open the cited source). Apply all accepted changes directly to ${PLAN}. Write ${OUT}/verify/plan-resolution.md listing every finding with verifier, severity, decision and one-line reason. Return a 200-word summary of what changed.`,
  { label: 'revise-plan', phase: 'Verify plan', effort: 'high' })

const PAGE = `${OUT}/review.html`
const PAGE_RULES = `Page rules (the page is opened as a local file in a browser and may also be published as a claude.ai artifact):
- Put a <title> first (a short name such as "FlightDeck Build 1 Review"), then one <style> block, then content. Do not write <!doctype>, <html>, <head> or <body> tags; the content is wrapped at publish time, and browsers render it fine locally.
- Define every colour as a CSS custom property on :root (light values), redefine them under @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... color-scheme: dark } } and again under :root[data-theme="dark"]. body sets an explicit background from a token.
- Fonts only from Google Fonts with real fallback stacks. No other external resources; all CSS and JS inline. No alert/confirm/prompt; no print button; no download links.
- Works at phone width (about 400px) with a 16px side gutter and no sideways page scroll. Running text near 65 characters wide.
- A tasteful flight-deck identity grounded in aviation (for example a pre-flight checklist or flight-plan feel), restrained, not a generic AI look (no cream-and-terracotta, no purple gradient, no emoji section markers).
- Copy buttons use navigator.clipboard.writeText inside the click handler and fall back to selecting the text if it rejects.`

phase('Review page')
const pageDraft = await agent(`${CONTEXT}

Write the review page the owner asked for in build.txt: "stop after planning but before building stage and offer a review HTML page of everything awaiting building. I may make some last minute changes. deliver in review in plain, simple language, with no jargon."

Source: ${PLAN} (the verified plan) and ${OUT}/verify/plan-resolution.md. The page covers everything awaiting building and nothing the plan does not contain. Write for a tired human who knows Claude Code well as a user but has not read the plan: short sentences, everyday words, no undefined terms (if a Claude Code term like "hook" or "skill" is unavoidable, say in a few plain words what it does the first time). Literal and direct. No markdown tables in prose; HTML tables are fine where they help.

Contents, in this order:
1. What you get, in a few sentences, and how you try it the moment PR 1 lands.
2. The decisions I made for you (each of the seven items the owner left to the lead), each as: the choice, why, and what it means for you.
3. The pull requests in build order, one card each: what it adds, how you try it, how we know it works, size, what depends on it, and how to reject or retry it alone.
4. How the build will run once you say go (who does what, which models, how each PR is checked by review, adversary and human imposter), briefly.
5. What I would cut first if it is too big.
6. How to change things and retry: the constraints file ${OUT}/constraints.md and rerunning the planning workflow.
7. An interactive "Your answer" panel: for each PR a keep / change / cut choice and a note box, plus a free-text box for last-minute changes; a "Copy my answer" button that builds a plain-text reply the owner can paste back to the agent (this is the human returning content to the agent, as the vision describes). Keep the panel's choices only in the page; optional localStorage for drafts wrapped in try/catch.

${PAGE_RULES}

Write the page to ${PAGE}. Return a short description of its sections.`,
  { label: 'write-review-page', phase: 'Review page', effort: 'high' })

const PAGE_CHECKS = [
  { key: 'page-imposter', model: 'sonnet', effort: 'high',
    task: `You are a human imposter acting as the repository owner (read ${OUT}/research/owner-truth.md first to adopt their voice and viewpoint: fatigued, plain-spoken, allergic to jargon and walls of text). Read ${PAGE} as the owner would, as text (read the HTML source and judge the visible words). Every word or sentence you would not understand at a glance, every place you would get lost, every wall of text, and every question you would have to ask before saying go is a finding. Also say whether the "Your answer" panel would let you reply in under two minutes.` },
  { key: 'page-fidelity', model: 'sonnet', effort: 'high',
    task: `Check ${PAGE} against ${PLAN}. Findings: anything the page promises that the plan does not contain; any PR, decision or vision part in the plan missing from the page; numbers (PR count, sizes, models) that disagree; anything that breaks these page rules:
${PAGE_RULES}
Also read the page's script for bugs (the copy button and answer builder must work).` },
]
const pageFindings = await parallel(PAGE_CHECKS.map(c => () => agent(`${CONTEXT}

${c.task}

Return your findings.`, { label: c.key, phase: 'Review page', model: c.model, effort: c.effort, schema: FINDINGS_SCHEMA })))
const pf = pageFindings.map((v, i) => v ? { checker: PAGE_CHECKS[i].key, ...v } : null).filter(Boolean)
log(`Page findings: ${pf.map(p => `${p.checker}: ${p.findings.length}`).join('; ')}`)

const pageFix = await agent(`${CONTEXT}

Revise the review page ${PAGE} using these findings from a human imposter and a fidelity check:
${JSON.stringify(pf, null, 1)}

Apply every finding you agree with (check fidelity findings against ${PLAN}). Keep the language plain and the page tidy. Keep these rules:
${PAGE_RULES}
Return a list of what you changed and any finding you rejected with the reason.`,
  { label: 'fix-review-page', phase: 'Review page', model: 'sonnet', effort: 'high' })

return {
  outDir: OUT,
  attempt: ATTEMPT,
  reports: reports.map(r => r.report_path),
  missingResearch: missing,
  candidates: candidates.map((c, i) => ({ lens: LENSES[i].key, summary: c })),
  judgeTotals: tally,
  judgeWinners: judged.map(j => j.winner),
  planSummary: synth,
  findingCounts: counts,
  revision,
  page: PAGE,
  pageDraft,
  pageFix,
}
