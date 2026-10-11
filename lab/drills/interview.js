export const meta = { name: 'flightdeck-lab-interview-drill', description: 'Drill the workshop interviewer against an owner persona who holds one fact back, scored mechanically', phases: [{ title: 'Setup' }, { title: 'Interview' }, { title: 'Score' }, { title: 'Page' }] }

// The interview drill: the workshop interviewer (file mode) asks questions about a rough request, an imposter
// owner answers while holding one invented fact back, and 8 mechanical checks say whether the interviewer drew it out.
// Run it by path with the Workflow tool. It needs the workshops part (pull request 3) merged and says so when it is not.
// Arguments:
//   repo     absolute path of the project root (required)
//   scratch  absolute scratch folder (required)
//   today    YYYY-MM-DD (required)
//   ask      the owner's rough request (default: a short page that lists every open question across all my workshops, oldest first)
//   persona  repository path of the persona file (default lab/personas/commander-withholds.md)
// Writes <repo>/lab/results/<today>-interview/index.html and transcripts.md. Commits nothing.
const A = args || {}

const RANK_WORKER = 'Rank: Worker. Reports to: the interview drill workflow that sent you. You decide: how to do this one task. You do not decide: scores, what is true, or what happens next; you send out no agents.'
const RULES = 'Hard rules: never push to main or master; never force-push; never delete a branch; never merge a pull request; nothing above Opus at high effort. Work only inside the scratch folder named below, except where the task names a result file. Write one paragraph per line in markdown, no hard wrapping.'

const halted = x => x && typeof x === 'object' && x.halt
async function stage(name, fn) {
  try {
    const r = await fn()
    return r == null ? { halt: `${name} returned nothing` } : r
  } catch (e) {
    return { halt: `${name} failed: ${e && e.message}` }
  }
}

const SETUP_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, workshop_skill: { type: 'boolean' }, listing: { type: 'string' }, notes: { type: 'string' } },
  required: ['ok', 'workshop_skill', 'listing', 'notes'],
}
const ASK_SCHEMA = {
  type: 'object',
  properties: { session_id: { type: 'string' }, bundle_path: { type: 'string' }, bundle_text: { type: 'string' }, ok: { type: 'boolean' }, nested_reply: { type: 'string' } },
  required: ['session_id', 'bundle_path', 'bundle_text', 'ok'],
}
const OWNER_SCHEMA = {
  type: 'object',
  properties: { block: { type: 'string' }, revealed_fact: { type: 'boolean' } },
  required: ['block', 'revealed_fact'],
}
const ANSWER_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, workshop: { type: 'string' }, files: { type: 'array', items: { type: 'string' } }, nested_reply: { type: 'string' } },
  required: ['ok', 'workshop', 'files'],
}
const SCORE_SCHEMA = {
  type: 'object',
  properties: {
    checks: { type: 'array', items: { type: 'object', properties: { id: { type: 'string' }, pass: { type: 'boolean' }, quote: { type: 'string' } }, required: ['id', 'pass', 'quote'] } },
    score: { type: 'number' },
  },
  required: ['checks', 'score'],
}
const PAGE_SCHEMA = {
  type: 'object',
  properties: { page: { type: 'string' }, transcripts: { type: 'string' }, ok: { type: 'boolean' } },
  required: ['page', 'transcripts', 'ok'],
}

const missing = ['repo', 'scratch', 'today'].filter(k => typeof A[k] !== 'string' || A[k] === '')
if (missing.length) return { halt: `missing required argument: ${missing.join(', ')}` }

const REPO = A.repo.replace(/\/+$/, '')
const SCRATCH = A.scratch.replace(/\/+$/, '')
const TODAY = A.today
const ASK = A.ask || 'a short page that lists every open question across all my workshops, oldest first'
const PERSONA = A.persona || 'lab/personas/commander-withholds.md'
const DIR = `${SCRATCH}/interview-${TODAY}`
const CLONE = `${DIR}/clone`
const RESULT = `${REPO}/lab/results/${TODAY}-interview`
// Claude Code keeps a session's transcripts in a folder named after the working folder, with every / and . turned into -.
const TRANSCRIPT_DIR = `$HOME/.claude/projects/${CLONE.replace(/[/.]/g, '-')}/`
const NESTED = `claude -p --plugin-dir "${CLONE}/flightdeck" --model sonnet --settings '{"env":{"FLIGHTDECK_UNATTENDED":"1"}}' --permission-mode acceptEdits --allowedTools 'Bash(node *)' --output-format json`

// ---- Setup
phase('Setup')
const setup = await stage('setup', () => agent(`${RANK_WORKER}
${RULES}

Task: set up a scratch copy of the project for the interview drill.
1. Run \`git clone ${REPO} ${CLONE}\`. git clone creates the folders; run no mkdir and no other command before it.
2. Run \`git init --bare ${DIR}/origin.git\`.
3. In the clone ${CLONE} (a separate clone under the scratch folder, where this is allowed) run \`git remote set-url origin ${DIR}/origin.git\`, so nothing the drill does can reach a real remote.
4. Find out whether the file ${CLONE}/flightdeck/skills/workshop/SKILL.md exists by reading it with the file-read tool, not with a shell command; a read that says the file does not exist means false. Then list the folder ${CLONE}/.flightdeck/ (names only, one line); if that listing is refused, leave listing empty.
Return ok (true only when steps 1 to 3 worked; step 4 never changes it), workshop_skill (true only when the file exists), listing and notes (what went wrong, or an empty string).`,
  { label: 'interview:setup', phase: 'Setup', model: 'haiku', effort: 'low', schema: SETUP_SCHEMA }))
if (halted(setup)) return { halt: setup.halt }
if (setup.ok !== true) return { halt: `setup failed: ${setup.notes || 'the clone could not be made'}` }
if (setup.workshop_skill !== true) return { halt: 'needs PR 3 (workshops) merged: flightdeck/skills/workshop/SKILL.md not found' }
log(`interview drill: clone ready in ${CLONE}`)

// ---- Interview
phase('Interview')
const asked = await stage('ask', () => agent(`${RANK_WORKER}
${RULES}

Task: run the first half of an interview and collect what the interviewer wrote. In the clone ${CLONE}, run this one command and nothing else that changes files:
${NESTED} "/flight:workshop ${ASK} (file mode: write the question bundle to the file beside workshops.md and stop)"
The command prints one JSON object; its session_id field is the session to remember. The plugin is loaded from the clone's own folder for this one command; do not install anything and do not change any plugin settings.
Then find the new file matching ${CLONE}/.flightdeck/*.activate.md (the question bundle) and read it.
Return session_id (from the JSON), bundle_path (the path of the bundle file), bundle_text (its full text) and ok (true only when you got a session id and a bundle). Also return nested_reply: the JSON's result text, then its permission_denials (the commands it was refused, if any), filled in even when everything worked. If the command failed or no bundle appeared, return ok false with empty strings for the other fields and still fill nested_reply.`,
  { label: 'interview:ask', phase: 'Interview', model: 'sonnet', effort: 'high', schema: ASK_SCHEMA }))
if (halted(asked)) return { halt: asked.halt }
if (asked.ok !== true || !asked.session_id || !asked.bundle_text) return { halt: 'the interviewer did not write a question bundle', ask: asked }

const owner = await stage('owner', () => agent(`${RANK_WORKER}
${RULES}

Task: you play the owner in a drill. Read the persona file ${CLONE}/${PERSONA} and the owner's profile ${CLONE}/.flightdeck/persona.md, and stay in that voice. The persona tells you one fact to hold back and exactly when you may say it; follow it.
The interviewer wrote this question bundle (file ${asked.bundle_path}; the workshop name is the file name without \`.activate.md\`):
=== bundle ===
${asked.bundle_text}
=== end of bundle ===
Answer it as the owner would. Return the paste-back block in exactly this format, with nothing before or after it:
First line: FlightDeck answers for workshop <name>: file these into .flightdeck/<name>/questions.md
Then one line per question: q<n>: <option letter or text> | note: <text>   or, when the owner would not care: q<n>: (unanswered)
Last line: Other notes: <text>
Also return revealed_fact: true only if your block states the held-back fact, otherwise false.`,
  { label: 'interview:owner', phase: 'Interview', model: 'sonnet', effort: 'high', schema: OWNER_SCHEMA }))
if (halted(owner)) return { halt: owner.halt }
if (!owner.block) return { halt: 'the owner persona returned no answers' }

const answered = await stage('answer', () => agent(`${RANK_WORKER}
${RULES}

Task: finish the interview. Write the block below, exactly as it is, to the file ${DIR}/block.txt. Then run this one command, which resumes the interviewer's own session and passes the block on standard input, with no prompt argument:
cd ${CLONE} && ${NESTED.replace('claude -p', `claude -p --resume ${asked.session_id}`)} < ${DIR}/block.txt
The block:
=== block ===
${owner.block}
=== end of block ===
Then list the new workshop folder the interviewer made under ${CLONE}/.flightdeck/ (a folder that holds workshop.md) and the files in it.
Return ok (true only when the command finished and a workshop folder exists), workshop (the folder's name), files (the file names in it) and nested_reply (the command's JSON result text, then its permission_denials, filled in even when everything worked).`,
  { label: 'interview:answer', phase: 'Interview', model: 'sonnet', effort: 'high', schema: ANSWER_SCHEMA }))
if (halted(answered)) return { halt: answered.halt }
if (answered.ok !== true || !answered.workshop) return { halt: 'the interviewer did not create a workshop folder', answer: answered, nested_reply: answered.nested_reply || '' }

// ---- Score
phase('Score')
const scored = await stage('score', () => agent(`${RANK_WORKER}
${RULES}

Task: score the interview with exactly these 8 checks, mechanically, quoting the text each one rests on (at most 20 words, or an empty string when a check fails because something is missing). Do not change any file.
The question bundle (it no longer exists on disk once the interviewer finished) is:
=== bundle ===
${asked.bundle_text}
=== end of bundle ===
The new workshop is ${CLONE}/.flightdeck/${answered.workshop}/ and the bundle's file was ${asked.bundle_path}.
c1: the bundle has between 1 and 5 headings of the form \`## q<n>:\`.
c2: every question has a \`why:\` line and a \`recommended:\` line.
c3: one question contains the word \`weakest\`.
c4: no question asks the owner to approve, sign off or confirm agent-written text.
c5: some question asks where, when, how or on what device the result will be read or used.
c6: the words phone, mobile, thumb or small screen appear in the new workshop's context.md, verify.md or questions.md.
c7: the workshop folder holds workshop.md, context.md and verify.md, and the .activate.md file is gone.
c8: the workshop folder holds no constraints.md.
Return checks (one entry per check with id c1 to c8, pass and quote) and score (the number of passes divided by 8).`,
  { label: 'interview:score', phase: 'Score', model: 'haiku', effort: 'low', schema: SCORE_SCHEMA }))
if (halted(scored)) return { halt: scored.halt, workshop: answered.workshop }
const IDS = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']
const byId = {}
for (const c of Array.isArray(scored.checks) ? scored.checks : []) if (c && typeof c.id === 'string') byId[c.id] = c
if (IDS.some(id => !byId[id])) return { halt: 'the score listed fewer than the 8 checks', workshop: answered.workshop, checks: scored.checks }
const checks = IDS.map(id => ({ id, pass: byId[id].pass === true, quote: byId[id].quote || '' }))
const passes = checks.filter(c => c.pass).length
const score = passes / 8
const withheld = byId.c5.pass === true && byId.c6.pass === true
log(`interview drill: ${passes}/8, withheld fact ${withheld ? 'found' : 'not found'}`)

// ---- Page
phase('Page')
const page = await stage('page', () => agent(`${RANK_WORKER}
${RULES}

Task: write two result files in ${RESULT} (create the folder). Write nothing else and commit nothing.
1. ${RESULT}/index.html: one self-contained page. Title "Interview drill ${TODAY}". It shows the score (${passes} of 8), the 8 checks with pass or fail and their quotes, whether the held-back fact was found (${withheld ? 'yes' : 'no'}), and a link to transcripts.md. It loads nothing from the network (no fonts, scripts or images from outside). Colours are tokens defined on :root, with a dark set under a prefers-color-scheme: dark media query. It reads well at phone width (a 16px side gutter, no sideways scrolling). Plain words, no jargon.
2. ${RESULT}/transcripts.md: the clone path (${CLONE}), the interviewer's session id (${asked.session_id}) and the expected transcript folder ${TRANSCRIPT_DIR} (write it exactly like that, with $HOME as is). Do not search for transcript files. Try to list that folder; if it cannot be listed, write 'not checked' beside it.
The facts: ${JSON.stringify({ workshop: answered.workshop, passes, checks })}
Return page (the path of index.html), transcripts (the path of transcripts.md) and ok.`,
  { label: 'interview:page', phase: 'Page', model: 'sonnet', effort: 'medium', schema: PAGE_SCHEMA }))
if (halted(page)) return { halt: page.halt, workshop: answered.workshop, score, checks, withheld_fact_found: withheld }

return { workshop: answered.workshop, score, passes, score_text: `${passes}/8`, checks, withheld_fact_found: withheld, page: page.page, transcripts: page.transcripts }
