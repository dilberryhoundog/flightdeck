export const meta = {
  name: 'build-and-check',
  description: 'Build and check one workshop task: a builder in its own worktree, script checks, review, adversary and imposter, one fix round, then a draft pull request',
  phases: [{ title: 'Scope' }, { title: 'Brief' }, { title: 'Build' }, { title: 'Check' }, { title: 'Verify' }, { title: 'Triage' }, { title: 'Fix' }, { title: 'Deliver' }],
}

// Arguments: workshop (required) or a plain string; attempt (default 1), base (default main), dryRun, today, pluginRoot,
// card (the launch card shown to the owner), task (the owner's extra words), agentTypes (false: agent files are read, not named).
// The script has no file or shell access: every agent gets the same opening text, built by opening().
const A = typeof args === 'string' ? { workshop: args.trim() } : (args || {})

const GLOBAL = 'Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner\'s files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.'
const CAPTURE = 'Work outside your brief: report it as a capture line; do not do it.'
const SEAT = {
  builder: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: how to build your unit inside your own files. You do not decide: scope, done, verification or truth; you do not accept your own findings and you send out no agents.',
  reviewer: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to report and how severe each is. You do not decide: whether a finding is accepted, the brief, done or truth; you change no files.',
  adversary: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to raise, their severity and confidence, and when to withdraw one. You do not decide: whether a finding is accepted, the criteria or truth; you change no files.',
  imposter: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: how the owner would answer and what confused you. You do not decide: the try steps, done or truth; you write only in your scratch folder and the files the try steps say the owner edits.',
}
const RANK_TASK = 'Rank: Worker. Reports to: the Captain (the session that started this launch). You decide: how to do this one task. You do not decide: scope, done, verification or truth; you do not accept your own findings and you send out no agents.'
const RANK_TRIAGE = 'Rank: Worker. Reports to: the Captain (the session that started this launch). You decide: a recommended accept or reject for each finding, with a one-line reason. You do not decide: scope, done, verification or truth; the Captain may overrule any decision, and you send out no agents.'
const GLOBAL_CHECKS = base => ['node lab/checks/hard-rules.mjs --base ' + base, 'claude plugin validate flightdeck']
const GLOBAL_CHECK_FILES = ['lab/checks/hard-rules.mjs', 'flightdeck/.claude-plugin/plugin.json']

function opening(rank, block, task) {
  return [GLOBAL, rank, block, CAPTURE, 'Task: ' + task].filter(Boolean).join('\n\n')
}

const WS = String(A.workshop || '').trim()
const K = Number(A.attempt) || 1
const BASE = A.base || 'main'
const DRY = !!A.dryRun
const BRANCH = WS + '-a' + K
const ATT = '.flightdeck/' + WS + '/attempts/a' + K
const TODAY = A.today || "today's date (run date +%F)"
const CAPS = []
const ROWS = []
let R = A.pluginRoot || '<plugin root>'

if (!WS) return { status: 'halted', halt: 'no workshop given: pass the workshop name, for example /flight:build-and-check <workshop>', stage: 'args', workshop: '', attempt: K, branch: '', captures: [] }
if (!/^[a-z0-9][a-z0-9-]*$/.test(WS)) return { status: 'halted', halt: 'workshop name "' + WS + '" must use lowercase letters, digits and hyphens', stage: 'args', workshop: WS, attempt: K, branch: BRANCH, captures: [] }

const halted = x => !!x && typeof x === 'object' && !!x.halt
async function stage(label, fn) {
  try {
    const r = await fn()
    return r == null ? { halt: label + ' returned nothing' } : r
  } catch (e) {
    return { halt: label + ' failed: ' + (e && e.message ? e.message : String(e)) }
  }
}
function stop(label, halt) {
  return { status: 'halted', halt, stage: label, workshop: WS, attempt: K, branch: BRANCH, captures: CAPS }
}
// ask() records a row for the stage table in the report, then calls the agent.
function ask(seat, prompt, opts) {
  const m = /^Rank: (\w+)/m.exec(prompt)
  ROWS.push('- ' + opts.label + ': seat ' + seat + ', rank ' + (m ? m[1] : 'unknown') + ', ' + opts.model + ' ' + opts.effort + ', ' + (opts.isolation ? 'worktree' : 'not isolated'))
  return agent(prompt, opts)
}
const at = path => R + '/' + path + (R === '<plugin root>' ? ' (find it as flightdeck/' + path + ' in the repository, or under ~/.claude/plugins in the folder whose .claude-plugin/plugin.json names flight)' : '')
const AT = name => (A.agentTypes === false ? {} : { agentType: 'flight:' + name })
const FB = name => (A.agentTypes === false ? 'First read ' + at('agents/' + name + '.md') + ' and follow it. ' : '')
// Embedded text must not start a line with Rank: or Task: (the opening has exactly one of each).
const safe = t => String(t == null ? '' : t).replace(/^(Rank|Task): /gm, ' $1: ')
const dry = t => (DRY ? t.replace(/git push/g, 'sending to the remote').replace(/gh pr create/g, 'opening a pull request') : t)
const lines = (...a) => a.filter(x => x !== null && x !== undefined && x !== false).join('\n')
const json = x => safe(JSON.stringify(x, null, 1))

const STR = { type: 'string' }
const STRS = { type: 'array', items: STR }
const obj = (properties, required) => ({ type: 'object', properties, required: required || Object.keys(properties) })
const RESULTS = { type: 'array', items: obj({ command: STR, exit: { type: 'number' }, tail: STR, skipped: { type: 'boolean' } }) }
const SCOPE_SCHEMA = obj({ block: STR, checks: STRS, questions: STRS, warnings: STRS, plugin_root: STR, notes: STR })
const BRIEF_SCHEMA = obj({ title: STR, brief_md: STR, files: STRS, try_steps: STRS, done: STRS, notes: STR })
const BUILD_SCHEMA = obj({ branch: STR, commit: STR, files: STRS, status: { type: 'string', enum: ['complete', 'blocked', 'contradiction-found', 'over-budget'] }, notes: STR, captures: STRS })
const CHECK_SCHEMA = obj({ worktree: STR, diff_path: STR, changed_path: STR, results: RESULTS, notes: STR })
const FINDINGS_SCHEMA = obj({
  findings: { type: 'array', items: obj({ severity: { type: 'string', enum: ['high', 'medium', 'low'] }, where: STR, finding: STR, evidence: STR, suggested_fix: STR }) },
  verdict: STR,
  timings: STR,
}, ['findings', 'verdict'])
const TRIAGE_SCHEMA = obj({
  decisions: { type: 'array', items: obj({ verifier: STR, severity: STR, finding: STR, decision: { type: 'string', enum: ['accept', 'reject', 'question'] }, reason: STR }) },
  fixes: STRS, questions: STRS, captures: STRS, proposals: STRS, high_accepted: STRS,
})
const FIX_SCHEMA = obj({ commit: STR, checks_green: { type: 'boolean' }, notes: STR })
const RECHECK_SCHEMA = obj({ results: RESULTS })
const REPORT_SCHEMA = obj({ title: STR, report_md: STR, log_md: STR, findings_md: STR, pr_md: STR, url: STR, pushed: { type: 'boolean' }, draft_reasons: STRS }, ['title', 'report_md', 'log_md', 'findings_md', 'pushed', 'draft_reasons'])

// ---- Scope ----
phase('Scope')
const scope0 = await stage('scope', () => ask('scope', opening(RANK_TASK, '', lines(
  'From the repository root run: node ' + (A.pluginRoot ? A.pluginRoot + '/lib/workshops.mjs' : '<plugin root>/lib/workshops.mjs') + ' scope ' + WS + ' --json',
  A.pluginRoot ? null : 'The plugin root is not known: try flightdeck/lib/workshops.mjs in the repository, then a lib/workshops.mjs under ~/.claude/plugins whose plugin is named flight.',
  'Return its block, checks, questions and warnings exactly as printed, unedited, plus plugin_root (the folder that holds lib/workshops.mjs, up one level) and notes.'
)), { label: 'scope', phase: 'Scope', model: 'haiku', effort: 'low', schema: SCOPE_SCHEMA }))
if (halted(scope0)) return stop('scope', scope0.halt)
if (!scope0.block) return stop('scope', 'scope: workshop ' + WS + ' has no folder (captured, not active): activate it first')
const S = { ...scope0, checks: scope0.checks || [], questions: scope0.questions || [] }
if (!A.pluginRoot && S.plugin_root) R = S.plugin_root
const open = (rank, task) => opening(rank, S.block, task)
const QUESTIONS = S.questions.length ? S.questions.join('\n') : '(none)'

// ---- Brief ----
phase('Brief')
const B = await stage('brief', () => ask('brief', open(RANK_TASK, lines(
  'Write the build brief for workshop ' + WS + ', attempt ' + K + ', base branch ' + BASE + '. Today is ' + TODAY + '. Write no files; return the text.',
  'Read the workshop card .flightdeck/' + WS + '/workshop.md, its constraints.md, context.md and verify.md, the answered questions in questions.md and decisions.md (any may be missing).',
  'The launch card the owner saw: ' + (A.card ? '\n' + safe(A.card) : 'none given.'),
  'The owner\'s extra words: ' + (A.task ? '"' + safe(A.task) + '"' : 'none.'),
  K > 1 ? 'This is attempt ' + K + '. Read the earlier attempt with git show ' + WS + '-a' + (K - 1) + ':.flightdeck/' + WS + '/attempts/a' + (K - 1) + '/findings.md and the same path ending report.md; say what this attempt does differently.' : null,
  'The workshop\'s checks, to quote verbatim in the brief:',
  S.checks.length ? safe(S.checks.join('\n')) : '(none)',
  'Return brief_md: markdown that holds, in this order, the launch card first, the task, the files the builder may write, the checks quoted verbatim, the done line as yes-is-pass questions, the five-minute try steps for the owner, and anything you decided with a reason.',
  'Also return files (the paths the builder may write; never the workshop\'s constraints.md, context.md or verify.md, and never .flightdeck/workshops.md), try_steps, done (the yes-is-pass questions), a short title and notes.'
)), { label: 'brief', phase: 'Brief', model: 'opus', effort: 'high', schema: BRIEF_SCHEMA }))
if (halted(B)) return stop('brief', B.halt)

// ---- Build ----
phase('Build')
const built = await stage('build', () => ask('builder', open(SEAT.builder, FB('builder') + lines(
  'Build workshop ' + WS + ' attempt ' + K + ' in your own worktree (a separate copy of the repository).',
  'Your first command is exactly: git switch -c ' + BRANCH + ' ' + BASE,
  'Then write ' + ATT + '/brief.md with the brief text below, verbatim, and commit it first.',
  '=== Brief begins ===',
  safe(B.brief_md),
  '=== Brief ends ===',
  'Then make the change. Write only these files and the attempt folder ' + ATT + ': ' + JSON.stringify(B.files || []),
  'Run the workshop\'s checks and fix what they show:',
  S.checks.length ? safe(S.checks.join('\n')) : '(none)',
  'Commit by file name, never git add -A. Do not push. Your last command is: git switch --detach (so the branch is free for the next stage).',
  'Return branch, commit, files, status (complete, blocked, contradiction-found or over-budget), notes and captures.'
)), { label: 'build', phase: 'Build', model: 'sonnet', effort: 'high', isolation: 'worktree', ...AT('builder'), schema: BUILD_SCHEMA }))
if (halted(built)) return stop('build', built.halt)
for (const c of built.captures || []) CAPS.push(c)
if (built.status !== 'complete') return stop('build', 'build: ' + built.status + ': ' + built.notes)

// ---- Check ----
function checkLines() {
  const g = GLOBAL_CHECKS(BASE).map((c, i) => c + '   (run only if ' + GLOBAL_CHECK_FILES[i] + ' exists in the worktree; otherwise record it as skipped: not in this project)')
  return g.concat(S.checks.map(c => safe(c) + '   (the workshop\'s check)')).map((c, i) => (i + 1) + '. ' + c).join('\n')
}
phase('Check')
const C = await stage('check', () => ask('checks', open(RANK_TASK, lines(
  'Run git switch --detach ' + BRANCH + '.',
  'Write the output of git diff ' + BASE + '...' + BRANCH + ' to ' + ATT + '/diff.patch and the output of git diff --name-only ' + BASE + '...' + BRANCH + ' to ' + ATT + '/changed.txt in this worktree. Never stage or commit them.',
  'Then run these commands in this order, one per line, and record each exit code and the last 20 lines of its output:',
  checkLines(),
  'Return worktree, diff_path and changed_path as absolute paths (use pwd), results (command, exit, tail, skipped) and notes.'
)), { label: 'check', phase: 'Check', model: 'haiku', effort: 'low', isolation: 'worktree', schema: CHECK_SCHEMA }))
if (halted(C)) return stop('check', C.halt)
const checkResults = C.results || []

// ---- Verify ----
phase('Verify')
async function verifier(name, fn) {
  const r = await stage(name, fn)
  return halted(r) ? { verifier: name, halt: r.halt } : { verifier: name, ...r }
}
const WORK = lines('The diff file: ' + C.diff_path, 'The changed-file list: ' + C.changed_path)
const verified = await parallel([
  () => verifier('review', () => ask('reviewer', open(SEAT.reviewer, FB('reviewer') + lines(
    'Review the work on branch ' + BRANCH + ' against its brief.',
    'The brief: run git show ' + BRANCH + ':' + ATT + '/brief.md',
    WORK,
    'The rubric: ' + at('rubric.md'),
    'The workshop\'s questions:',
    QUESTIONS,
    'Findings only on correctness or the brief. Each finding has severity, where, finding, evidence and suggested_fix. Give a verdict.'
  )), { label: 'review', phase: 'Verify', model: 'sonnet', effort: 'high', ...AT('reviewer'), schema: FINDINGS_SCHEMA })),
  () => verifier('adversary', () => ask('adversary', open(SEAT.adversary, FB('adversary') + lines(
    '=== The Work ===',
    WORK,
    'The branch ' + BRANCH + ' is checked out at ' + C.worktree + ' (read any file there with Read).',
    '=== The Criteria ===',
    'The brief\'s done list:',
    json(B.done || []),
    'The rubric: ' + at('rubric.md'),
    'The workshop\'s questions:',
    QUESTIONS,
    'The workshop\'s constraints: .flightdeck/' + WS + '/constraints.md (where present), .flightdeck/VISION.md and .flightdeck/build.txt (where present).',
    'Cold mode: you get no notes from the builder or the other readers. Start at once. Findings only on correctness or the criteria, each with evidence a second reader can reproduce.'
  )), { label: 'adversary', phase: 'Verify', model: 'opus', effort: 'high', ...AT('adversary'), schema: FINDINGS_SCHEMA })),
  () => verifier('imposter', () => ask('imposter', open(SEAT.imposter, FB('imposter') + lines(
    'Run git switch --detach ' + BRANCH + ' in your worktree.',
    'Become the owner: adopt .flightdeck/persona.md (if present) and the persona: lines of .flightdeck/' + WS + '/constraints.md (if present).',
    'Follow the brief\'s try steps literally and time each one in minutes:',
    json(B.try_steps || []),
    'Never run a claude plugin command that adds, installs, uninstalls or removes anything, never start a nested claude session, never push. A step you cannot run is marked [stated].',
    'The workshop\'s questions:',
    QUESTIONS,
    'Report where you got stuck, what confused you and any jargon, each as a finding. Put the minutes per step in timings.'
  )), { label: 'imposter', phase: 'Verify', model: 'sonnet', effort: 'high', isolation: 'worktree', ...AT('imposter'), schema: FINDINGS_SCHEMA })),
])
const NAMES = ['review', 'adversary', 'imposter']
const V = NAMES.map((n, i) => verified[i] || { verifier: n, halt: n + ' did not run' })

// ---- Triage ----
phase('Triage')
const failed = checkResults.filter(r => !r.skipped && r.exit !== 0).map(r => ({ verifier: 'check', severity: 'high', where: r.command, finding: 'exit ' + r.exit, evidence: r.tail }))
const T = await stage('triage', () => ask('triage', open(RANK_TRIAGE, lines(
  'Triage every finding for workshop ' + WS + ' attempt ' + K + ' (branch ' + BRANCH + '). Today is ' + TODAY + '.',
  'A verifier with a halt field did not run; say so. Verify a factual claim against the cited file before you recommend accepting it. A reader told to find faults always finds some, so keep a severity bar.',
  'Verifier results:',
  json(V),
  'Failed checks (each counts as a high finding):',
  json(failed),
  'Return decisions (verifier, severity, finding, decision accept, reject or question, reason) and fixes (one concrete instruction each, for findings you recommend accepting).',
  'Return questions for the owner as blocks in the questions.md format: a line "## q<n>: <question>", then why:, options:, recommended:, "asked: ' + TODAY + ' by triage ' + BRANCH + '" and answer: (empty).',
  'Return captures as lines "- <name>: <the ask> (' + TODAY + ')", proposals as "context: <line>" or "verify: <line>" for the workshop\'s own files (an attempt never edits them), and high_accepted (the high findings you recommend accepting).'
)), { label: 'triage', phase: 'Triage', model: 'opus', effort: 'high', schema: TRIAGE_SCHEMA }))
if (halted(T)) return stop('triage', T.halt)
for (const c of T.captures || []) CAPS.push(c)

// ---- Fix (one round only) ----
let fixResult = null
let finalResults = checkResults
if ((T.fixes || []).length) {
  phase('Fix')
  fixResult = await stage('fix', () => ask('builder', open(SEAT.builder, FB('builder') + lines(
    'Run git switch ' + BRANCH + '. Apply exactly these fixes and nothing else:',
    json(T.fixes),
    'Rerun the checks that failed:',
    json(failed.map(f => f.where)),
    'Commit by file name, never git add -A. Do not push. Your last command is: git switch --detach',
    'Return commit, checks_green and notes.'
  )), { label: 'fix', phase: 'Fix', model: 'sonnet', effort: 'high', isolation: 'worktree', ...AT('builder'), schema: FIX_SCHEMA }))
  if (halted(fixResult)) return stop('fix', fixResult.halt)
  const re = await stage('recheck', () => ask('checks', open(RANK_TASK, lines(
    'Run git switch --detach ' + BRANCH + ', then rerun these commands in this order and record each exit code and the last 20 lines:',
    checkLines(),
    'Return results (command, exit, tail, skipped).'
  )), { label: 'recheck', phase: 'Fix', model: 'haiku', effort: 'low', isolation: 'worktree', schema: RECHECK_SCHEMA }))
  if (halted(re)) return stop('recheck', re.halt)
  finalResults = re.results || []
}

// ---- Deliver ----
phase('Deliver')
const TITLE = String(B.title || WS).replace(/"/g, "'")
const PR_TITLE = WS + ' a' + K + ': ' + TITLE
const TABLE = ROWS.concat(['- report: seat report, rank Worker, sonnet medium, worktree']).join('\n')
const toPr = 'the title on the first line, a blank line, the body (the same text as report.md), then the line that tells the owner how to open it, as the template shows'
const deliverTask = dry(lines(
  'Run git switch ' + BRANCH + '.',
  'Write ' + ATT + '/findings.md, ' + ATT + '/report.md and ' + ATT + '/log.md in the formats of ' + at('skills/launch/report-template.md') + '. report.md is the pull request body file; these three files are the attempt\'s required record, so writing them is this task.',
  'report.md leads with the owner\'s five-minute try (the brief\'s try steps with the imposter\'s minutes). Mark every line [checked] (a script ran), [reviewed] (an agent judged it) or [stated] (an agent said so and nobody ran it).',
  'Pull request: base ' + BASE + ', branch ' + BRANCH + ', title "' + PR_TITLE + '". Today is ' + TODAY + '.',
  'The brief: title "' + TITLE + '", files ' + JSON.stringify(B.files || []) + ', done questions and try steps:',
  json({ done: B.done || [], try_steps: B.try_steps || [], notes: B.notes || '' }),
  'The builder: ' + json({ commit: built.commit, files: built.files, notes: built.notes, captures: built.captures || [] }),
  'Check results (first run):',
  json(checkResults),
  fixResult ? 'The fix round and the rerun of the checks: ' + json({ fix: fixResult, checks: finalResults }) : 'No fix round ran.',
  'Verifier results (the imposter\'s timings are in its result):',
  json(V),
  'Triage:',
  json(T),
  'Stage table for log.md (label, seat, rank, model and effort, worktree or not):',
  TABLE,
  DRY
    ? 'Dry run: also write ' + ATT + '/pr.md with ' + toPr + '. Commit all four files by name (never git add -A). Do not open a pull request and send nothing to the remote.'
    : 'Commit the three files by name (never git add -A). Then run: git push -u origin ' + BRANCH + '. Then run: gh pr create --draft --base ' + BASE + ' --head ' + BRANCH + ' --title "' + PR_TITLE + '" --body-file ' + ATT + '/report.md and return the url. If gh is missing or fails, write ' + ATT + '/pr.md with ' + toPr + ', commit it, and say so in draft_reasons.',
  'Your last command is: git switch --detach',
  'Return title, report_md, log_md, findings_md, pr_md, url, pushed and draft_reasons. The texts are the full file contents, so the Captain can write any file you could not.'
))
const D = await stage('report', () => ask('report', open(RANK_TASK, deliverTask), { label: 'report', phase: 'Deliver', model: 'sonnet', effort: 'medium', isolation: 'worktree', schema: REPORT_SCHEMA }))
if (halted(D)) return stop('report', D.halt)

return {
  status: 'delivered',
  workshop: WS,
  attempt: K,
  branch: BRANCH,
  base: BASE,
  dryRun: DRY,
  url: DRY ? '' : (D.url || ''),
  draft: true,
  title: D.title || PR_TITLE,
  brief_md: B.brief_md,
  report_md: D.report_md,
  log_md: D.log_md,
  findings_md: D.findings_md,
  pr_md: D.pr_md || '',
  questions: T.questions || [],
  captures: CAPS,
  proposals: T.proposals || [],
  checks: finalResults,
  verifiers: { review: V[0], adversary: V[1], imposter: V[2] },
}
