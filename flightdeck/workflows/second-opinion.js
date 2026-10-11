export const meta = {
  name: 'second-opinion',
  description: 'Second opinion: review, adversary and imposter read one file, diff or branch with no shared notes, then one short summary',
  phases: [{ title: 'Scope' }, { title: 'Prepare' }, { title: 'Read' }, { title: 'Summary' }],
}

// Arguments: target (required: a file path, a diff file path or a branch name) or a plain string; base (default main, for a branch),
// workshop (optional), criteria (optional text), today, pluginRoot, agentTypes (false: agent files are read, not named).
// The script has no file or shell access and writes nothing in the repository.
const A = typeof args === 'string' ? { target: args.trim() } : (args || {})

const GLOBAL = 'Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner\'s files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.'
const CAPTURE = 'Work outside your brief: report it as a capture line; do not do it.'
const SEAT = {
  reviewer: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to report and how severe each is. You do not decide: whether a finding is accepted, the brief, done or truth; you change no files.',
  adversary: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to raise, their severity and confidence, and when to withdraw one. You do not decide: whether a finding is accepted, the criteria or truth; you change no files.',
  imposter: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: how the owner would answer and what confused you. You do not decide: the try steps, done or truth; you write only in your scratch folder and the files the try steps say the owner edits.',
}
const RANK_TASK = 'Rank: Worker. Reports to: the Captain (the session that started this launch). You decide: how to do this one task. You do not decide: scope, done, verification or truth; you do not accept your own findings and you send out no agents.'

function opening(rank, block, task) {
  return [GLOBAL, rank, block ? safe(block) : '', CAPTURE, 'Task: ' + task].filter(Boolean).join('\n\n')
}

const TARGET = String(A.target || '').trim()
const BASE = A.base || 'main'
const WS = String(A.workshop || '').trim()
const TODAY = A.today || "today's date (run date +%F)"
let R = A.pluginRoot || '<plugin root>'
let BLOCK = ''
let QUESTIONS = '(none)'

if (!TARGET) return { status: 'halted', halt: 'no target given: pass a file, a diff file or a branch, for example /flight:second-opinion <target>', stage: 'args', target: '', workshop: WS }

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
  return { status: 'halted', halt, stage: label, target: TARGET, workshop: WS }
}
const at = path => R + '/' + path + (R === '<plugin root>' ? ' (find it as flightdeck/' + path + ' in the repository, or under ~/.claude/plugins in the folder whose .claude-plugin/plugin.json names flight)' : '')
const AT = name => (A.agentTypes === false ? {} : { agentType: 'flight:' + name })
const FB = name => (A.agentTypes === false ? 'First read ' + at('agents/' + name + '.md') + ' and follow it. ' : '')
const safe = t => String(t == null ? '' : t).replace(/^(Rank|Task): /gm, ' $1: ')
const lines = (...a) => a.filter(x => x !== null && x !== undefined && x !== false).join('\n')
const json = x => safe(JSON.stringify(x, null, 1))

const STR = { type: 'string' }
const STRS = { type: 'array', items: STR }
const obj = (properties, required) => ({ type: 'object', properties, required: required || Object.keys(properties) })
const SCOPE_SCHEMA = obj({ block: STR, checks: STRS, questions: STRS, warnings: STRS, plugin_root: STR, notes: STR })
const PREPARE_SCHEMA = obj({ kind: { type: 'string', enum: ['file', 'diff', 'branch'] }, paths: STRS, worktree: STR, notes: STR })
const FINDINGS_SCHEMA = obj({
  findings: { type: 'array', items: obj({ severity: { type: 'string', enum: ['high', 'medium', 'low'] }, where: STR, finding: STR, evidence: STR, suggested_fix: STR }) },
  verdict: STR,
  timings: STR,
}, ['findings', 'verdict'])
const SUMMARY_SCHEMA = obj({ summary: STR, top_findings: { type: 'array', items: obj({ severity: STR, finding: STR, raised_by: STRS }) } })

// ---- Scope (only when a workshop is given) ----
if (WS) {
  phase('Scope')
  const s = await stage('scope', () => agent(opening(RANK_TASK, '', lines(
    'From the repository root run: node ' + (A.pluginRoot ? A.pluginRoot + '/lib/workshops.mjs' : '<plugin root>/lib/workshops.mjs') + ' scope ' + WS + ' --json',
    A.pluginRoot ? null : 'The plugin root is not known: try flightdeck/lib/workshops.mjs in the repository, then a lib/workshops.mjs under ~/.claude/plugins whose plugin is named flight.',
    'Return its block, checks, questions and warnings exactly as printed, unedited, plus plugin_root (the folder that holds lib/workshops.mjs, up one level) and notes.'
  )), { label: 'scope', phase: 'Scope', model: 'haiku', effort: 'low', schema: SCOPE_SCHEMA }))
  if (halted(s)) return stop('scope', s.halt)
  if (!s.block) return stop('scope', 'scope: workshop ' + WS + ' has no folder (captured, not active): activate it first')
  BLOCK = s.block
  if (!A.pluginRoot && s.plugin_root) R = s.plugin_root
  if ((s.questions || []).length) QUESTIONS = safe(s.questions.join('\n'))
}
const open = (rank, task) => opening(rank, BLOCK, task)

// ---- Prepare ----
phase('Prepare')
const P = await stage('prepare', () => agent(open(RANK_TASK, lines(
  'Prepare one target for three readers. The target is: ' + safe(TARGET),
  'Run git rev-parse --verify --quiet ' + safe(TARGET) + '. If it names a branch: do not switch branches and do not create a worktree. Run mktemp -d to make a temp folder outside the repository, write the output of git diff ' + BASE + '...' + safe(TARGET) + ' to <tmp>/diff.patch and the output of git diff --name-only ' + BASE + '...' + safe(TARGET) + ' to <tmp>/changed.txt, and return kind branch with the absolute paths of those two files in paths and worktree empty.',
  'Otherwise the target is a file. If it is a diff file, return kind diff, else kind file. Return its absolute path in the owner\'s checkout in paths: run git rev-parse --show-toplevel and join it with the target (an absolute target is returned as it is). Never return a path under .claude/worktrees/. Return worktree empty.',
  'Write nothing in the repository. Return kind, paths, worktree and notes.'
)), { label: 'prepare', phase: 'Prepare', model: 'haiku', effort: 'low', schema: PREPARE_SCHEMA }))
if (halted(P)) return stop('prepare', P.halt)

// ---- Read: three readers in parallel, no shared notes ----
phase('Read')
const PATHS = (P.paths || []).join('\n')
const WORK = lines('The ' + P.kind + ' to read, one path per line:', PATHS, P.kind === 'branch' ? 'Read any file on the branch with git show ' + safe(TARGET) + ':<path>' : null)
const verifier = (name, fn) => () => stage(name, fn).then(r => (halted(r) ? { verifier: name, halt: r.halt } : { verifier: name, ...r }))
const read = await parallel([
  verifier('review', () => agent(open(SEAT.reviewer, FB('reviewer') + lines(
    'Review the work below for correctness.',
    WORK,
    'The rubric: ' + at('rubric.md'),
    A.criteria ? 'More criteria from the owner: ' + safe(A.criteria) : null,
    'The workshop\'s questions:',
    QUESTIONS,
    'Each finding has severity, where, finding, evidence and suggested_fix. Give a verdict.'
  )), { label: 'review', phase: 'Read', model: 'sonnet', effort: 'high', ...AT('reviewer'), schema: FINDINGS_SCHEMA })),
  verifier('adversary', () => agent(open(SEAT.adversary, FB('adversary') + lines(
    '=== The Work ===',
    WORK,
    '=== The Criteria ===',
    'The rubric: ' + at('rubric.md'),
    A.criteria ? 'More criteria from the owner: ' + safe(A.criteria) : null,
    'The workshop\'s questions:',
    QUESTIONS,
    'Cold mode: you get no notes from anyone. Start at once. Findings only on correctness or the criteria, each with evidence a second reader can reproduce.'
  )), { label: 'adversary', phase: 'Read', model: 'opus', effort: 'high', ...AT('adversary'), schema: FINDINGS_SCHEMA })),
  verifier('imposter', () => agent(open(SEAT.imposter, FB('imposter') + lines(
    'Read the work below as the owner would: adopt .flightdeck/persona.md if it is present. Would the owner understand it, and would it suit them? Note where you got stuck, what confused you and any jargon, each as a finding. Write nothing.',
    WORK,
    A.criteria ? 'More criteria from the owner: ' + safe(A.criteria) : null,
    'The workshop\'s questions:',
    QUESTIONS
  )), { label: 'imposter', phase: 'Read', model: 'sonnet', effort: 'high', ...AT('imposter'), schema: FINDINGS_SCHEMA })),
])
const NAMES = ['review', 'adversary', 'imposter']
const F = NAMES.map((n, i) => read[i] || { verifier: n, halt: n + ' did not run' })
const gone = F.filter(halted)
if (gone.length >= 2) return stop('read', gone.length + ' of 3 readers returned nothing: ' + gone.map(g => g.halt).join('; '))

// ---- Summary ----
phase('Summary')
const sum = await stage('summary', () => agent(open(RANK_TASK, lines(
  'Write one short summary of at most ten lines from the three readings below. A reading with a halt field did not run; say so.',
  'Rank the findings, most severe first. Name who raised each (review, adversary or imposter). Say where the three agree and where they disagree. Read no sources yourself.',
  json(F),
  'Return summary (at most ten lines) and top_findings (severity, finding, raised_by).'
)), { label: 'summary', phase: 'Summary', model: 'sonnet', effort: 'medium', schema: SUMMARY_SCHEMA }))
if (halted(sum)) return stop('summary', sum.halt)

return { status: 'done', target: TARGET, kind: P.kind, summary: sum.summary, top_findings: sum.top_findings || [], findings: { review: F[0], adversary: F[1], imposter: F[2] } }
