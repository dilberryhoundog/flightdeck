export const meta = { name: 'library-review', description: 'Have the librarian check a piece of work against the FlightDeck manuals and library', whenToUse: 'After a launch or any change: the librarian reads the work and the corpus and reports where they disagree.', phases: [{ title: 'Locate', detail: 'plugin root, corpus pages, changed files, workshop block' }, { title: 'Review', detail: 'the librarian checks the work against the corpus' }] }

// Arguments (a script cannot read files or the clock, so the caller passes what it needs):
// work: required, a branch name, a path to a diff file, or one or more paths separated by spaces.
// base: the branch the work is compared with when work is a branch; default 'main'.
// workshop: optional workshop name; its own notes and checks go to the librarian only when it is given.
// today: optional YYYY-MM-DD, used in the report only.
const A = args || {}
const WORK = typeof A.work === 'string' ? A.work.trim() : ''
const BASE = A.base || 'main'
const WORKSHOP = A.workshop || ''
const TODAY = A.today || 'today'

const GLOBAL = 'Binding documents, read first: .flightdeck/VISION.md, .flightdeck/build.txt and, for a workshop, its constraints.md; the newest lines win. Hard rules: never push to main or master, never force-push, never delete a branch, never merge a pull request, never write the owner\'s files. Ceiling: nothing above Opus at high effort. Writing: one paragraph per line, plain words.'
const RANK = 'Rank: Worker. Reports to: the Captain (the session that ran this workflow). You decide: how to do your own task. You do not decide: scope, done, verification or truth; you do not accept your own findings, you change no files and you send out no agents.'
const CAPTURE = 'Work outside your brief: report it as a capture line; do not do it.'

const LOCATE_SCHEMA = {
  type: 'object',
  properties: {
    plugin_root: { type: 'string' },
    pages: { type: 'array', items: { type: 'string' } },
    changed: { type: 'array', items: { type: 'string' } },
    diff_command: { type: 'string' },
    block: { type: 'string' },
    checks: { type: 'array', items: { type: 'string' } },
    questions: { type: 'array', items: { type: 'string' } },
    notes: { type: 'string' },
  },
  required: ['plugin_root', 'pages', 'changed'],
}
const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: { type: 'array', items: { type: 'object', properties: { severity: { type: 'string', enum: ['high', 'medium', 'low'] }, where: { type: 'string' }, finding: { type: 'string' }, evidence: { type: 'string' }, suggested_fix: { type: 'string' } }, required: ['severity', 'where', 'finding', 'evidence', 'suggested_fix'] } },
    pages_used: { type: 'array', items: { type: 'string' } },
    stale_pages: { type: 'array', items: { type: 'string' } },
    captures: { type: 'array', items: { type: 'string' } },
  },
  required: ['findings', 'pages_used'],
}

const halted = x => x && typeof x === 'object' && x.halt
async function stage(label, fn) {
  try {
    const r = await fn()
    return r == null ? { halt: `${label} returned nothing` } : r
  } catch (e) {
    return { halt: `${label} failed: ${e && e.message}` }
  }
}

async function run() {
  if (!WORK) return { halt: 'args.work is required: a branch, a diff file or paths' }

  phase('Locate')
  const located = await stage('locate', () => agent([
    GLOBAL,
    RANK,
    CAPTURE,
    `Task: locate what the librarian needs. You only read; you write nothing.`,
    `1. Find the plugin root. In FlightDeck's own repository it is flightdeck/ at the project root. Otherwise run: find ~/.claude/plugins -path '*agents/librarian.md' 2>/dev/null, and take the folder two levels above the match.`,
    `2. List every .md file under the plugin root's manuals/ and library/ folders, and under the project's .flightdeck/manuals/ if it exists. Return the paths.`,
    `3. Resolve the work into changed files. The work is: ${WORK}. If it names a branch, list its files with git diff --name-only ${BASE}...${WORK} and return the full diff command (git diff ${BASE}...${WORK}) as diff_command for the librarian to run; do not write the diff to a file. If it is the path of a diff file, return the paths on its lines that start with +++ b/. Otherwise treat it as one or more paths separated by spaces and return those paths.`,
    WORKSHOP
      ? `4. The workshop is ${WORKSHOP}. Run: node <plugin root>/lib/workshops.mjs scope ${WORKSHOP} --json, and return its block, checks and questions unchanged.`
      : `4. No workshop was named; leave block, checks and questions empty.`,
    `Put anything odd (a missing folder, an unreadable file) in notes.`,
  ].join('\n'), { label: 'locate', phase: 'Locate', model: 'haiku', effort: 'low', schema: LOCATE_SCHEMA }))
  if (halted(located)) return { halt: located.halt, stage: 'Locate' }

  phase('Review')
  const withBlock = WORKSHOP && located.block
  const reviewed = await stage('review', () => agent([
    GLOBAL,
    RANK,
    withBlock ? `Workshop ${WORKSHOP}'s own context and verification (in addition to the global rules):\n${located.block}` : null,
    CAPTURE,
    `Task: review a piece of work against the FlightDeck corpus.`,
    `Plugin root: ${located.plugin_root}`,
    `Corpus pages:\n${(located.pages || []).map(p => `- ${p}`).join('\n') || '- (none found)'}`,
    `The work: ${WORK}`,
    `Changed files:\n${(located.changed || []).map(p => `- ${p}`).join('\n') || '- (none found)'}`,
    located.diff_command ? `Diff command (run it yourself, read only): ${located.diff_command}` : null,
    withBlock && located.questions && located.questions.length ? `The workshop's questions:\n${located.questions.map(q => `- ${q}`).join('\n')}` : null,
    `Review the work against the corpus as your Reviewing work against the corpus section says. Also list any page you used whose checked: date is more than 30 days before ${TODAY}.`,
  ].filter(x => x !== null).join('\n'), { label: 'review', phase: 'Review', model: 'sonnet', effort: 'high', agentType: 'flight:librarian', schema: FINDINGS_SCHEMA }))
  if (halted(reviewed)) return { halt: reviewed.halt, stage: 'Review' }

  const findings = Array.isArray(reviewed.findings) ? reviewed.findings : []
  const pagesUsed = Array.isArray(reviewed.pages_used) ? reviewed.pages_used : []
  const high = findings.filter(f => f && f.severity === 'high').length
  return {
    work: WORK,
    workshop: WORKSHOP || null,
    pages_checked: pagesUsed.length,
    findings,
    stale_pages: reviewed.stale_pages || [],
    captures: reviewed.captures || [],
    summary: `${findings.length} findings (${high} high) against ${pagesUsed.length} corpus pages`,
  }
}

return await run()
