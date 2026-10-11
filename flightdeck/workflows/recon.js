export const meta = {
  name: 'recon',
  description: 'Recon: three scouts read one question from separate angles, one summary, one claim check; writes no files',
  phases: [{ title: 'Scope' }, { title: 'Read' }, { title: 'Summarise' }, { title: 'Check claims' }],
}

// Arguments: question (required) or a plain string; workshop (optional), angles (optional array of three strings),
// lookIn (optional paths), today, pluginRoot, agentTypes (false: agent files are read, not named).
// The script has no file or shell access and writes no files; it returns the report text.
const A = typeof args === 'string' ? { question: args.trim() } : (args || {})

const GLOBAL = 'Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner\'s files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.'
const CAPTURE = 'Work outside your brief: report it as a capture line; do not do it.'
const SEAT = {
  scout: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: where to look and how to read. You do not decide: the question, its scope or what is done with the answer; you change no files and send out no agents.',
  reviewer: 'Rank: Worker. Reports to: whoever sent you (your Officer, or the Captain). You decide: which findings to report and how severe each is. You do not decide: whether a finding is accepted, the brief, done or truth; you change no files.',
}
const RANK_TASK = 'Rank: Worker. Reports to: the Captain (the session that started this launch). You decide: how to do this one task. You do not decide: scope, done, verification or truth; you do not accept your own findings and you send out no agents.'

function opening(rank, block, task) {
  return [GLOBAL, rank, block, CAPTURE, 'Task: ' + task].filter(Boolean).join('\n\n')
}

const Q = String(A.question || '').trim()
const WS = String(A.workshop || '').trim()
const TODAY = A.today || "today's date (run date +%F)"
const ANGLES = Array.isArray(A.angles) && A.angles.length === 3 ? A.angles.map(String) : ['what the documents say', 'what the code does', 'what earlier branches and history did']
let R = A.pluginRoot || '<plugin root>'
let BLOCK = ''

if (!Q) return { status: 'halted', halt: 'no question given: pass the question, for example /flight:recon <question>', stage: 'args', question: '', workshop: WS, report_text: '' }

const halted = x => !!x && typeof x === 'object' && !!x.halt
async function stage(label, fn) {
  try {
    const r = await fn()
    return r == null ? { halt: label + ' returned nothing' } : r
  } catch (e) {
    return { halt: label + ' failed: ' + (e && e.message ? e.message : String(e)) }
  }
}
function stop(label, halt, extra) {
  return { status: 'halted', halt, stage: label, question: Q, workshop: WS, report_text: '', ...(extra || {}) }
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
const SCOUT_SCHEMA = obj({ answer: STR, pointers: { type: 'array', items: obj({ claim: STR, where: STR, confidence: { type: 'string', enum: ['high', 'medium', 'low'] } }) }, not_found: STRS })
const SUMMARY_SCHEMA = obj({ summary: STR, claims: { type: 'array', items: obj({ claim: STR, where: STR }) }, not_found: STRS })
const CLAIMS_SCHEMA = obj({ marks: { type: 'array', items: obj({ claim: STR, where: STR, mark: { type: 'string', enum: ['confirmed', 'wrong', 'unsupported', 'could not check'] } }) } })

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
}
const open = (rank, task) => opening(rank, BLOCK, task)

// ---- Read: three scouts in parallel, one angle each, no shared notes ----
phase('Read')
const scout = (n) => () => stage('scout-' + n, () => agent(open(SEAT.scout, FB('scout') + lines(
  'Question: ' + safe(Q),
  'Your angle: ' + safe(ANGLES[n - 1]) + '. Read only from this angle; other scouts read the other angles.',
  A.lookIn ? 'Look in: ' + safe(Array.isArray(A.lookIn) ? A.lookIn.join(', ') : A.lookIn) : null,
  'Use Read, Grep and Glob only. Answer the question as far as your angle shows. Give a pointer for every claim: the claim, where (path:line), and your confidence (high, medium or low). List what you looked for and did not find in not_found.'
)), { label: 'scout-' + n, phase: 'Read', model: 'haiku', effort: 'low', ...AT('scout'), schema: SCOUT_SCHEMA }))
const reads = await parallel([scout(1), scout(2), scout(3)])
const scouts = [1, 2, 3].map(n => reads[n - 1] || { halt: 'scout-' + n + ' returned nothing' })
const ok = scouts.map((r, i) => ({ angle: ANGLES[i], ...r })).filter(r => !halted(r))
if (!ok.length) return stop('scouts', 'scouts returned nothing')
const missing = scouts.map((r, i) => (halted(r) ? 'scout-' + (i + 1) + ' (' + ANGLES[i] + ') returned nothing' : null)).filter(Boolean)

// ---- Summarise ----
phase('Summarise')
const sum = await stage('summary', () => agent(open(RANK_TASK, lines(
  'Write one short summary that answers the question from the scouts\' returns below. Keep every pointer. Read no sources yourself.',
  'Question: ' + safe(Q),
  missing.length ? 'Not run: ' + missing.join('; ') : null,
  'The scouts\' returns:',
  json(ok),
  'Return summary (plain words, short), claims (each claim with its where pointer, nothing dropped) and not_found (what no scout found).'
)), { label: 'summary', phase: 'Summarise', model: 'sonnet', effort: 'medium', schema: SUMMARY_SCHEMA }))
if (halted(sum)) return stop('summary', sum.halt)

// ---- Check claims ----
phase('Check claims')
const chk = await stage('claims', () => agent(open(SEAT.reviewer, FB('reviewer') + lines(
  'Check each claim below against the file it points to.',
  'Use Read, Grep and Glob only, never Bash. A pointer you cannot open is marked could not check.',
  'Mark each claim: confirmed (the file says it), wrong (the file says otherwise), unsupported (the file does not say it) or could not check.',
  json(sum.claims || []),
  'Return marks: one entry per claim, with the claim, its where and its mark.'
)), { label: 'claims', phase: 'Check claims', model: 'sonnet', effort: 'high', ...AT('reviewer'), schema: CLAIMS_SCHEMA }))
if (halted(chk)) return stop('claims', chk.halt, { summary: sum.summary, not_found: sum.not_found || [] })

const marks = chk.marks || []
const notFound = sum.not_found || []
const reportText = [
  sum.summary,
  '',
  'Claims:',
  marks.length ? marks.map(m => '- [' + m.mark + '] ' + m.claim + ' (' + m.where + ')').join('\n') : '- none to check',
  '',
  'Not found:',
  notFound.length ? notFound.map(n => '- ' + n).join('\n') : '- nothing reported',
  missing.length ? '\nNot run: ' + missing.join('; ') : null,
].filter(x => x !== null).join('\n')

return { status: 'done', question: Q, workshop: WS, summary: sum.summary, marks, not_found: notFound, report_text: reportText }
