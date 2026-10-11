export const meta = {
  name: 'flightdeck-build-1-build',
  description: 'Build FlightDeck build-1 pull requests from the approved plan',
  whenToUse: 'After the owner says go on a build-1 review page: builds the listed pull requests, verifies each by review, adversary, human imposter, script and live checks, fixes once and pushes a branch ready for a pull request into build-1.',
  phases: [
    { title: 'Gather', detail: 'sources and scoped context' },
    { title: 'Brief', detail: 'exact brief per pull request' },
    { title: 'Build', detail: 'builders in worktrees, then integrate' },
    { title: 'Verify', detail: 'review, adversary, human imposter, script checks, live checks' },
    { title: 'Fix', detail: 'triage, fix once, recheck' },
    { title: 'Land', detail: 'report, log and pull request text' },
  ],
}

// Arguments (passed by the lead; the script cannot read files or the clock):
// prs: [n, ...] pull request numbers; attempt: k; base: branch to cut from (build-1 for PR 1, PR 1's branch for the others);
// target: branch the pull request opens into (build-1); run: 'A' (PR 1) or 'B' (later PRs, PR 1's files exist on base);
// today: 'YYYY-MM-DD'; scratch: absolute scratch folder; plan: path of the approved plan.
const A = args || {}
const REPO = '/home/user/flightdeck'
const OUT = '.flightdeck/build-1'
const PLAN = A.plan || `${OUT}/attempts/plan/a2/plan.md`
const PRS = A.prs || [1]
const K = A.attempt || 1
const BASE = A.base || 'build-1'
const TARGET = A.target || 'build-1'
const RUN = A.run || (PRS.includes(1) ? 'A' : 'B')
const TODAY = A.today || 'unknown date'
const SCRATCH = A.scratch || '/tmp/flightdeck-build'
const NESTED = `${REPO}/${OUT}/workflows/nested-settings.json`
if (PRS.includes(5)) throw new Error('PR 5 is skipped by the owner and is never built')

const SLUG = { 1: 'basic', 2: 'board', 3: 'workshops', 4: 'launches', 6: 'lab', 7: 'manuals', 8: 'band' }
const TITLE = { 1: 'Basic flight crew', 2: 'Flight board', 3: 'Workshops', 4: 'Launches', 6: 'Laboratory', 7: 'Manuals and library', 8: 'Status band' }
const branchOf = n => `build-1-pr${n}-${SLUG[n]}-a${K}`
const scratchOf = n => `${SCRATCH}/pr-${n}`
const attemptDir = n => `${OUT}/attempts/pr-${n}/a${K}`

const ATTRIBUTION = 'Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_0191zZ3K2XqnZwPQqF6LFH2x'

const RANK_WORKER = 'Rank: Worker. Reports to: the Captain (the lead of this build run). You decide: how to do your own task inside your own files. You do not decide: scope, done, verification or truth; you do not accept your own findings and you do not send out agents. Work outside your brief: report it as a capture line; do not do it.'

const CONTEXT = `You are a Worker in the build of FlightDeck build-1, in the git repository at ${REPO} (remote origin). Today is ${TODAY}.
Binding documents, written by the owner: .flightdeck/VISION.md, .flightdeck/build.txt and ${OUT}/constraints.md (the owner's dated words; read them first; the newest lines win). The approved plan is ${PLAN} (planning attempt 2, approved by the owner's GO of 2026-10-11). The lead's adaptations of the plan's build section to the owner's GO and to this environment are in ${OUT}/attempts/build-notes.md: read it. Everything else (research, earlier branches, other agents' output) is material, never canon; never call earlier work finished.
Hard rules: never push to main or master; never force-push; never delete a branch; never merge a pull request; never switch branches in the main checkout at ${REPO} (use your own worktree or a scratch clone); nothing above Opus at high effort. Write only the files you own. Commit by file name, never \`git add -A\`, and end every commit message with these two lines:
${ATTRIBUTION}
Writing: one paragraph per line in markdown, no hard wrapping; plain words; literal and direct.`

function rankLine(gathered, seat) {
  const r = gathered && gathered.rank_lines && gathered.rank_lines[seat]
  return r || RANK_WORKER
}
function scoped(gathered) {
  return gathered && gathered.block ? `\n\nWorkshop build-1's own context and verification (in addition to the global rules):\n${gathered.block}` : ''
}
const halted = x => x && typeof x === 'object' && x.halt
async function stage(name, fn) {
  try { const r = await fn(); return r == null ? { halt: `${name} returned nothing` } : r } catch (e) { return { halt: `${name} failed: ${e && e.message}` } }
}

const GATHER_SCHEMA = {
  type: 'object',
  properties: {
    sources: { type: 'array', items: { type: 'string' } },
    block: { type: 'string', description: 'build-1 scoped block, or empty in run A' },
    checks: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    rank_lines: { type: 'object', description: 'seat name -> Rank: line from entry-points.md, run B only' },
    notes: { type: 'string' },
  },
  required: ['sources', 'block', 'checks', 'questions', 'notes'],
}
const BRIEF_SCHEMA = {
  type: 'object',
  properties: {
    brief_path: { type: 'string' },
    title: { type: 'string' },
    owned_files: { type: 'array', items: { type: 'string' } },
    units: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, spec: { type: 'string' } }, required: ['id', 'files', 'spec'] } },
    checks: { type: 'array', items: { type: 'string' } },
    live_checks: { type: 'array', items: { type: 'string' } },
    try_steps: { type: 'array', items: { type: 'string' } },
    done: { type: 'array', items: { type: 'string' } },
  },
  required: ['brief_path', 'title', 'owned_files', 'units', 'checks', 'live_checks', 'try_steps', 'done'],
}
const BUILD_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' }, commit: { type: 'string' }, files: { type: 'array', items: { type: 'string' } },
    status: { type: 'string', enum: ['complete', 'blocked', 'contradiction-found', 'over-budget'] },
    notes: { type: 'string' }, captures: { type: 'array', items: { type: 'string' } },
  },
  required: ['branch', 'commit', 'files', 'status', 'notes', 'captures'],
}
const INTEGRATE_SCHEMA = {
  type: 'object',
  properties: {
    branch: { type: 'string' }, commit: { type: 'string' }, pushed: { type: 'boolean' },
    diff_path: { type: 'string' }, changed_path: { type: 'string' },
    checks: { type: 'array', items: { type: 'object', properties: { command: { type: 'string' }, exit: { type: 'number' }, tail: { type: 'string' } }, required: ['command', 'exit', 'tail'] } },
    notes: { type: 'string' },
  },
  required: ['branch', 'commit', 'pushed', 'diff_path', 'changed_path', 'checks', 'notes'],
}
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['high', 'medium', 'low'] }, where: { type: 'string' }, finding: { type: 'string' }, evidence: { type: 'string' }, suggested_fix: { type: 'string' } }, required: ['severity', 'where', 'finding', 'evidence', 'suggested_fix'] } },
    verdict: { type: 'string' },
    timings: { type: 'string', description: 'imposter and live checks: minutes per step, [stated] steps' },
  },
  required: ['findings', 'verdict'],
}
const TRIAGE_SCHEMA = {
  type: 'object',
  properties: {
    decisions: { type: 'array', items: { type: 'object', properties: { verifier: { type: 'string' }, severity: { type: 'string' }, finding: { type: 'string' }, decision: { type: 'string', enum: ['accept', 'reject', 'question'] }, reason: { type: 'string' } }, required: ['verifier', 'severity', 'finding', 'decision', 'reason'] } },
    fixes: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    captures: { type: 'array', items: { type: 'string' } },
    high_accepted: { type: 'array', items: { type: 'string' } },
  },
  required: ['decisions', 'fixes', 'questions', 'captures', 'high_accepted'],
}
const FIX_SCHEMA = {
  type: 'object',
  properties: { commit: { type: 'string' }, pushed: { type: 'boolean' }, checks_green: { type: 'boolean' }, rounds: { type: 'number' }, notes: { type: 'string' } },
  required: ['commit', 'pushed', 'checks_green', 'rounds', 'notes'],
}
const RECHECK_SCHEMA = {
  type: 'object',
  properties: { items: { type: 'array', items: { type: 'object', properties: { finding: { type: 'string' }, fixed: { type: 'boolean' }, quote: { type: 'string' } }, required: ['finding', 'fixed', 'quote'] } } },
  required: ['items'],
}
const LAND_SCHEMA = {
  type: 'object',
  properties: {
    title: { type: 'string' }, report_md: { type: 'string' }, log_md: { type: 'string' }, draft: { type: 'boolean' },
    draft_reasons: { type: 'array', items: { type: 'string' } }, summary: { type: 'string' },
  },
  required: ['title', 'report_md', 'log_md', 'draft', 'draft_reasons', 'summary'],
}

async function buildOne(n) {
  const S = scratchOf(n)
  const BR = branchOf(n)
  const AD = attemptDir(n)

  phase('Gather')
  const gathered = await stage('gather', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: gather material for pull request ${n} (${TITLE[n]}). Read the plan ${PLAN} sections that describe PR ${n} (section 4 "PR ${n}" and every section 3 part it lists, plus 3.0). Create ${S}/sources/ and copy every source file the plan names for PR ${n} from other branches with \`git show origin/<branch>:<path> > ${S}/sources/<flattened name>\` (run \`git fetch origin\` first; skip and note any path that does not exist). Return the list of copied files.
${RUN === 'B' ? `Run B: PR 1's files exist on branch ${BASE}. Make a read-only checkout with \`git worktree add --detach ${S}/base origin/${BASE}\` (from ${REPO}; this does not touch the main checkout), then in ${S}/base run \`node flightdeck/lib/workshops.mjs scope build-1 --json\` and return its block, checks and questions (if the command fails, return the text of .flightdeck/build-1/context.md and verify.md as the block and the commands under "## checks" in verify.md as checks, and say so in notes). Also read ${S}/base/flightdeck/skills/team-plans/entry-points.md and return, as rank_lines, a map from each seat name (lowercase: scout, builder, reviewer, adversary, imposter, runner, brief, triage, ...) to its "Rank:" line, verbatim.` : 'Run A: return an empty block, empty checks and questions, and no rank_lines.'}`,
    { label: `gather:pr${n}`, phase: 'Gather', model: 'haiku', effort: 'low', schema: GATHER_SCHEMA }))
  if (halted(gathered)) return { n, status: 'not built', halt: gathered.halt }

  phase('Brief')
  const brief = await stage('brief', () => agent(`${CONTEXT}

${rankLine(gathered, 'brief')}${scoped(gathered)}

Task: write the exact build brief for pull request ${n} (${TITLE[n]}) of FlightDeck build-1. Read ${PLAN} in full (it is long; read every section that touches PR ${n}, including 2(a) to 2(h), 3.0, the section 3 parts PR ${n} carries, section 4 "PR ${n}", section 5 and section 7), ${OUT}/constraints.md, ${OUT}/attempts/build-notes.md, and the gathered sources in ${S}/sources/ (${(gathered.sources || []).length} files). ${RUN === 'B' ? `PR 1 is already built on branch ${BASE}; read its files there with \`git show origin/${BASE}:<path>\` so this PR uses PR 1's real formats, reader functions, rank lines and team plans, and edits none of PR 1's files.` : ''}
Write the brief to ${S}/brief.md and return its parts. The brief holds: purpose; every owned file (path) with a one-line content spec, including \`lab/owned/pr${n}.txt\` (which lists every file this PR adds or edits, one per line, including the attempt files ${AD}/brief.md, ${AD}/findings.md, ${AD}/report.md and ${AD}/log.md); files it must not touch; done as yes-is-pass questions; script check commands with exact flags${RUN === 'B' ? ' (including build-1\'s checks: ' + JSON.stringify(gathered.checks || []) + ')' : ''}; live checks (each an exact nested command or a precise instruction for a tester running \`claude -p\` sessions in a scratch clone with the plugin installed); the five-minute try steps for the owner; the VISION sections served; and the units (${n === 1 ? 'exactly the five units the plan names for PR 1 in section 5 "Build"' : 'at most three'}), each with a disjoint file list and a spec precise enough that a Sonnet builder can write the files without reading the whole plan. Keep every number and name the plan gives (agent names, file paths, ranks, formats). Where the plan leaves a detail open, decide it and say so in the brief.`,
    { label: `brief:pr${n}`, phase: 'Brief', model: 'opus', effort: 'high', schema: BRIEF_SCHEMA }))
  if (halted(brief)) return { n, status: 'not built', halt: brief.halt }

  phase('Build')
  const unitResults = await parallel(brief.units.map((u, i) => () => stage(`build u${i + 1}`, () => agent(`${CONTEXT}

${rankLine(gathered, 'builder')}${scoped(gathered)}

Task: build unit ${u.id} of pull request ${n} (${TITLE[n]}). You are in your own git worktree. First run \`git fetch origin && git switch -c ${BR}-u${i + 1} origin/${BASE}\`.
Your files (write only these): ${JSON.stringify(u.files)}
Unit spec: ${u.spec}
Read the full brief at ${S}/brief.md and the plan sections it cites in ${PLAN}; adapt sources from ${S}/sources/ where the brief names them (remove rank words from copied agent names and descriptions; set model and effort from the plan, never from the source). Files in other units are being written in parallel by other builders: rely only on what the brief says about them.
When done: run any check from the brief that works on your files alone (for example \`node --test\` on your test file, \`node lab/checks/hard-rules.mjs\` if it exists in your worktree); commit your files by name; push with \`git push -u origin ${BR}-u${i + 1}\`. Return the build-return schema; status is complete only if every file exists. Put any work you noticed outside your brief in captures, one line each.`,
    { label: `build:pr${n}:u${i + 1}`, phase: 'Build', model: 'sonnet', effort: 'high', isolation: 'worktree', schema: BUILD_SCHEMA }))))
  const units = unitResults.map((r, i) => ({ id: brief.units[i].id, ...r }))
  const pushedUnits = units.filter(u => !halted(u) && u.branch)
  if (!pushedUnits.length) return { n, status: 'not built', halt: 'no unit was built', units }

  const integrated = await stage('integrate', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: integrate pull request ${n}. You are in your own git worktree. Run \`git fetch origin && git switch -c ${BR} origin/${BASE}\`, then merge each unit branch: ${pushedUnits.map(u => `origin/${u.branch}`).join(', ')} (\`git merge --no-ff --no-edit <branch>\`; units own disjoint files, so a conflict means a unit wrote outside its list: resolve it toward the brief ${S}/brief.md and say so). Units that did not finish: ${JSON.stringify(units.filter(u => halted(u) || u.status !== 'complete').map(u => ({ id: u.id, status: u.status, halt: u.halt, notes: u.notes })))}.
Then copy ${S}/brief.md to ${AD}/brief.md and commit it. Run each check and record exit code and last 20 lines: ${JSON.stringify(brief.checks)}. Do not fix product files here (a later stage fixes); only fix a merge mistake. Push with \`git push -u origin ${BR}\`. Write \`git diff origin/${RUN === 'B' ? BASE : TARGET}...${BR}\` to ${S}/diff.patch and \`git diff --name-only origin/${RUN === 'B' ? BASE : TARGET}...${BR}\` to ${S}/changed.txt.`,
    { label: `integrate:pr${n}`, phase: 'Build', model: 'sonnet', effort: 'medium', isolation: 'worktree', schema: INTEGRATE_SCHEMA }))
  if (halted(integrated) || !integrated.pushed) return { n, status: 'not built', halt: integrated.halt || 'integrate did not push', units }

  phase('Verify')
  const tryHome = seat => `${S}/${seat}`
  const nestedHow = seat => `Use a scratch clone only: \`git clone ${REPO} ${tryHome(seat)}/repo && cd ${tryHome(seat)}/repo && git fetch origin ${BR} && git switch ${BR}\` (fetching from the local repository; then create a bare repository \`git init --bare ${tryHome(seat)}/origin.git\` and \`git remote set-url origin ${tryHome(seat)}/origin.git\` so nothing real can be pushed). Rewrite the clone's .claude-plugin/marketplace.json "name" to "DBHD-FlightDeck-try-pr${n}-a${K}" and follow the install steps with that name. Run every nested Claude Code command with a private home folder so nothing outside your scratch folder changes: prefix each with \`HOME=${tryHome(seat)}/home\`, for example \`HOME=${tryHome(seat)}/home claude plugin marketplace add "$PWD" --scope local\`, \`HOME=${tryHome(seat)}/home claude plugin install flight@DBHD-FlightDeck-try-pr${n}-a${K} --scope local\`, and sessions as \`HOME=${tryHome(seat)}/home claude -p --model haiku --settings ${NESTED} --permission-mode acceptEdits --output-format json "<prompt>"\` (add \`--agent flight:pilot\` or \`--agent flight:runner\` where a step needs it; continue a conversation with \`--resume <session_id>\`). Never touch ${REPO}'s checkout. A step you cannot run is marked [stated] with the reason.`
  const verifiers = [
    () => stage('review', () => agent(`${CONTEXT}

${rankLine(gathered, 'reviewer')}${scoped(gathered)}

Task: review pull request ${n} (branch ${BR}). Read the brief ${S}/brief.md, the diff ${S}/diff.patch and the changed-file list ${S}/changed.txt; read files on the branch with \`git show origin/${BR}:<path>\`. ${RUN === 'B' ? `Use the rubric \`git show origin/${BASE}:flightdeck/rubric.md\` and build-1's questions above.` : ''} Check: every owned file exists and matches its spec; nothing outside \`lab/owned/pr${n}.txt\` changed; nothing under dev/ or .claude/rules/ changed; every check command is real; the try steps would work as written. Findings only on correctness or the brief, each with evidence another reader can reproduce.`,
      { label: `review:pr${n}`, phase: 'Verify', model: 'sonnet', effort: 'high', schema: FINDINGS_SCHEMA })),
    () => stage('adversary', () => agent(`${CONTEXT}

${rankLine(gathered, 'adversary')}

=== The Work ===
Pull request ${n} (${TITLE[n]}) on branch ${BR}: the diff ${S}/diff.patch, the changed files ${S}/changed.txt (read any of them with \`git show origin/${BR}:<path>\`).

=== The Criteria ===
1. The brief's done list in ${S}/brief.md.
2. The VISION.md sections this PR serves (named in the brief), .flightdeck/build.txt and ${OUT}/constraints.md (the owner's ranks and workshop notes of 2026-10-11 especially).
3. The owner's pain points: ${OUT}/research/owner-truth.md section 3 (invented mechanisms, replacement infrastructure, tedium, jargon, token waste).
4. Every Claude Code claim is true per ${PLAN} section 3.0 and library/source/claude-code/.
5. Nothing above Opus at high effort; nothing pushes to main.${RUN === 'B' ? '\n6. build-1\'s own verification (above).' + scoped(gathered) : ''}
Findings only on correctness or stated requirements, each with evidence a second reader can reproduce by reading files. Start at once; do not ask for the work.`,
      { label: `adversary:pr${n}`, phase: 'Verify', model: 'opus', effort: 'high', agentType: 'adversary', schema: FINDINGS_SCHEMA })),
    () => stage('imposter', () => agent(`${CONTEXT}

${rankLine(gathered, 'imposter')}

Task: you are the human imposter: an agent that acts like the owner. Become the owner from ${OUT}/research/owner-truth.md, dev/workspace/research/repo-reset/user-intent.md and the owner's dated notes in ${OUT}/constraints.md${RUN === 'B' ? ` (and \`git show origin/${BASE}:.flightdeck/persona.md\`)` : ''}: a two-year HITL veteran, fatigued, plain-spoken, who wants something that works great and fits the goal.
Try pull request ${n} exactly as the owner would, following these five-minute try steps literally: ${JSON.stringify(brief.try_steps)}. ${n === 8 ? 'This PR draws on the screen above the prompt, which you cannot see: read the code and steps instead of running them, and mark the try [stated].' : nestedHow('imposter')}
Where a feature asks the owner something, answer in the owner's voice. Record minutes per step, where you got stuck, what confused you, any jargon, anything that smells like the owner's past complaints, and what you would cut. Turn each into a finding; put the per-step timings and [stated] steps in timings.`,
      { label: `imposter:pr${n}`, phase: 'Verify', model: 'sonnet', effort: 'high', schema: FINDINGS_SCHEMA })),
    () => stage('checks', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: run the script checks for pull request ${n}. You are in your own worktree: run \`git fetch origin && git switch --detach origin/${BR}\`, then run each command and report pass or fail with the last 20 lines: ${JSON.stringify(brief.checks)}. A failing command is a high finding; a passing one is not a finding. Do not change files.`,
      { label: `checks:pr${n}`, phase: 'Verify', model: 'haiku', effort: 'low', isolation: 'worktree', schema: FINDINGS_SCHEMA })),
    () => stage('live', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: run the live checks for pull request ${n}: ${JSON.stringify(brief.live_checks)}. ${n === 8 ? 'For this PR run only `claude plugin validate` and `claude plugin test` on the band plugin in a scratch clone (with a private HOME as below); the screen itself cannot be seen.' : ''} ${nestedHow('live')} Report each check as pass, fail (a finding with the output as evidence) or [stated].`,
      { label: `live:pr${n}`, phase: 'Verify', model: 'sonnet', effort: 'high', schema: FINDINGS_SCHEMA })),
  ]
  const VNAMES = ['review', 'adversary', 'imposter', 'checks', 'live']
  const vres = await parallel(verifiers)
  const verified = vres.map((v, i) => ({ verifier: VNAMES[i], ...(v || { halt: 'no result' }) }))

  phase('Fix')
  const triage = await stage('triage', () => agent(`${CONTEXT}

${rankLine(gathered, 'triage')}${scoped(gathered)}

Task: triage every finding on pull request ${n} (branch ${BR}, brief ${S}/brief.md). Findings and timings from five independent verifiers (a verifier with "halt" did not run; say so):
${JSON.stringify(verified, null, 1)}
Accept or reject each with a one-line reason. Apply a severity bar: a reviewer told to find gaps always finds some. Verify factual claims against the cited file before accepting. A finding that needs the owner's view becomes a question (decision "question"), written as a question block in the format of \`.flightdeck/build-1/questions.md\` (## q<n>: ..., why:, options:, recommended:, asked: ${TODAY} by triage pr${n}, answer:). Work outside this PR becomes a capture line \`- <name>: <the ask> (${TODAY})\`. Return the list of fixes to make (each precise), the questions, the captures, and the accepted high-severity findings.`,
    { label: `triage:pr${n}`, phase: 'Fix', model: 'opus', effort: 'high', schema: TRIAGE_SCHEMA }))
  if (halted(triage)) return { n, status: 'built, not triaged', branch: BR, halt: triage.halt, verified }

  const fixed = await stage('fix', () => agent(`${CONTEXT}

${rankLine(gathered, 'builder')}${scoped(gathered)}

Task: fix pull request ${n} once. You are in your own worktree: \`git fetch origin && git switch -c ${BR}-fix origin/${BR}\`. Apply these accepted fixes: ${JSON.stringify(triage.fixes)}. (The Captain writes ${AD}/findings.md from the triage record; Claude Code does not let a subagent write findings or report files, so do not write them and do not work around it.)${n === 1 ? ` Also add these questions to .flightdeck/build-1/questions.md: ${JSON.stringify(triage.questions)} and these capture lines to .flightdeck/workshops.md: ${JSON.stringify(triage.captures)} (PR 1 owns both files).` : ''} Rerun the checks ${JSON.stringify(brief.checks)}; if a script check is still red, make one more round of fixes and rerun. Commit by file name and push fast-forward with \`git push origin HEAD:${BR}\` (never force). Then write \`git diff origin/${RUN === 'B' ? BASE : TARGET}...${BR}\` to ${S}/diff.patch again.`,
    { label: `fix:pr${n}`, phase: 'Fix', model: 'sonnet', effort: 'high', isolation: 'worktree', schema: FIX_SCHEMA }))

  let recheck = null
  if (!halted(fixed) && triage.high_accepted.length) {
    recheck = await stage('recheck', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: for each accepted high-severity finding on pull request ${n}, answer "is it fixed on branch ${BR}?" yes or no, with a quote from the file (read with \`git fetch origin && git show origin/${BR}:<path>\`): ${JSON.stringify(triage.high_accepted)}`,
      { label: `recheck:pr${n}`, phase: 'Fix', model: 'opus', effort: 'high', schema: RECHECK_SCHEMA }))
  }

  phase('Land')
  const landed = await stage('land', () => agent(`${CONTEXT}

${RANK_WORKER}

Task: write the landing text for pull request ${n} (${TITLE[n]}). Claude Code does not let a subagent write report files, so do not write any file: return the text of report.md and log.md in report_md and log_md, and the Captain commits them to ${AD}/ on ${BR} and opens the pull request into ${TARGET}. You may read the branch with \`git fetch origin && git show origin/${BR}:<path>\` and run \`git diff --stat\`.
The verifiers' verdicts, for your report: ${JSON.stringify(verified.map(v => ({ verifier: v.verifier, verdict: v.verdict, halt: v.halt })))}. Triage decisions: ${JSON.stringify(triage.decisions.map(x => ({ verifier: x.verifier, severity: x.severity, decision: x.decision, finding: x.finding })))}. The recheck runs only when triage accepted a high-severity finding (accepted high findings: ${triage.high_accepted.length}).
report.md (plain words, one paragraph per line) leads with the owner's five-minute try ${JSON.stringify(brief.try_steps)} and its measured time from the human imposter, whose timings were: ${verified[2] && verified[2].timings ? JSON.stringify(verified[2].timings) : 'not measured'} (mark a step [stated] only if the imposter says it could not run it); then the script checks marked [checked]; then verification marked [reviewed] (review, adversary, imposter, live checks) and every finding with its decision; the size (files and lines, from \`git diff --stat origin/${RUN === 'B' ? BASE : TARGET}...origin/${BR}\`); the models per stage (gather Haiku low, brief Opus high, builders Sonnet high, integrate Sonnet medium, review Sonnet high, adversary Opus high, imposter Sonnet high, checks Haiku low, live Sonnet high, triage Opus high, fix Sonnet high${recheck ? ', recheck Opus high' : ''}, land Sonnet medium); how to retry this pull request alone (add "PR ${n}:" lines to ${OUT}/constraints.md, say "retry PR ${n}", new branch build-1-pr${n}-${SLUG[n]}-a${K + 1}).${RUN === 'B' ? ` Add near the top: "Built on PR 1's branch (${BASE}). Merge PR 1 first; until then this pull request's diff also shows PR 1's files."` : ''}
Mark every line [checked] (a script ran), [reviewed] (an agent judged it) or [stated] (an agent said so).
log.md: stages, the agent seat and rank for each (the lead is Captain, every stage is a Worker), model and effort, and these stage results: units ${JSON.stringify(units.map(u => ({ id: u.id, status: u.status || 'halted', halt: u.halt })))}; integrate checks ${JSON.stringify(integrated.checks.map(c => ({ command: c.command, exit: c.exit })))}; fix ${JSON.stringify(halted(fixed) ? fixed : { checks_green: fixed.checks_green, rounds: fixed.rounds })}; recheck ${JSON.stringify(recheck)}.
The pull request is a draft when any of these hold, and you list each that holds in draft_reasons: a script check is still red; an accepted high finding is not fixed per the recheck; any try step was [stated]; any verifier did not run; triage raised questions for the owner. Title: "PR ${n}: ${TITLE[n]}".`,
    { label: `land:pr${n}`, phase: 'Land', model: 'sonnet', effort: 'medium', schema: LAND_SCHEMA }))

  return {
    n, branch: BR, status: halted(landed) ? 'built, not landed' : 'landed',
    land: landed, units: units.map(u => ({ id: u.id, status: u.status, halt: u.halt })),
    checks: integrated.checks.map(c => ({ command: c.command, exit: c.exit })),
    findings: verified.map(v => ({ verifier: v.verifier, count: v.findings ? v.findings.length : null, halt: v.halt })),
    triage: { fixes: triage.fixes.length, decisions: triage.decisions, questions: triage.questions, captures: triage.captures, high_accepted: triage.high_accepted.length },
    fix: fixed, recheck,
  }
}

const results = await pipeline(PRS, n => buildOne(n))
return { run: RUN, base: BASE, target: TARGET, attempt: K, prs: results }
