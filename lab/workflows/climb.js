export const meta = { name: 'flightdeck-lab-climb', description: 'Improve one FlightDeck document by eval-measured rounds, keeping a change only when it beats the noise', phases: [{ title: 'Setup' }, { title: 'Noise' }, { title: 'Rounds' }, { title: 'Report' }] }

// A climb improves one document by measured rounds. Run it by path with the Workflow tool.
// Arguments:
//   target     repository path of the one document to improve (required)
//   train      --case glob over flightdeck/evals/ for the training cases (required)
//   test       --case glob for the held-back test cases; the proposer never sees them (required)
//   repo       absolute path of the project root (required)
//   scratch    absolute scratch folder (required)
//   today      YYYY-MM-DD (required)
//   base       branch to cut from (default build-1)
//   attempt    attempt number (default 1)
//   rounds     number of rounds, at most five (default 3)
//   runs       runs per case (default 3)
//   maxCostUsd spending cap for the whole climb (default 10)
//   dryRun     true: nothing is pushed and no pull request is opened (default false)
// The script decides keep or revert, never an agent. A change is kept only when the training score and the
// held-back test score both rise by more than their noise; otherwise it is reverted with git revert.
const A = args || {}

const RANK_WORKER = 'Rank: Worker. Reports to: the climb workflow that sent you. You decide: how to do this one task. You do not decide: whether a change is kept, what is true, or what happens next; you send out no agents.'
const RULES = 'Hard rules: never push to main or master; never force-push; never delete a branch; never merge a pull request; nothing above Opus at high effort. Work only inside the clone named below. Write one paragraph per line in markdown, no hard wrapping.'

const halted = x => x && typeof x === 'object' && x.halt
async function stage(name, fn) {
  try {
    const r = await fn()
    return r == null ? { halt: `${name} returned nothing` } : r
  } catch (e) {
    return { halt: `${name} failed: ${e && e.message}` }
  }
}
const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const round4 = v => Math.round(v * 10000) / 10000
const show = v => (Math.round(v * 100) / 100).toFixed(2)

const SETUP_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, eval_available: { type: 'boolean' }, notes: { type: 'string' } },
  required: ['ok', 'eval_available', 'notes'],
}
const MEASURE_SCHEMA = {
  type: 'object',
  properties: { train: { type: 'number' }, test: { type: 'number' }, cost_usd: { type: 'number' }, ok: { type: 'boolean' }, notes: { type: 'string' } },
  required: ['train', 'test', 'cost_usd', 'ok', 'notes'],
}
const PROPOSE_SCHEMA = {
  type: 'object',
  properties: { commit: { type: 'string' }, summary: { type: 'string' }, ok: { type: 'boolean' } },
  required: ['commit', 'summary', 'ok'],
}
const REVERT_SCHEMA = {
  type: 'object',
  properties: { ok: { type: 'boolean' }, commit: { type: 'string' } },
  required: ['ok', 'commit'],
}
const REPORT_SCHEMA = {
  type: 'object',
  properties: { report_path: { type: 'string' }, report_text: { type: 'string' }, pr_url: { type: 'string' } },
  required: ['report_path', 'report_text', 'pr_url'],
}

const missing = ['target', 'train', 'test', 'repo', 'scratch', 'today'].filter(k => typeof A[k] !== 'string' || A[k] === '')
if (missing.length) return { halt: `missing required argument: ${missing.join(', ')}` }

const TARGET = A.target
const TRAIN = A.train
const TEST = A.test
const REPO = A.repo
const SCRATCH = A.scratch.replace(/\/+$/, '')
const TODAY = A.today
const BASE = A.base || 'build-1'
const ATTEMPT = A.attempt || 1
const ROUNDS = A.rounds === undefined || A.rounds === null ? 3 : Number(A.rounds)
const RUNS = A.runs || 3
const MAX_COST = A.maxCostUsd === undefined || A.maxCostUsd === null ? 10 : Number(A.maxCostUsd)
const DRY = A.dryRun === true

if (!Number.isInteger(ROUNDS) || ROUNDS < 1) return { halt: 'rounds must be a whole number of at least one' }
if (ROUNDS > 5) return { halt: 'at most five rounds' }

const SLUG = TARGET.replace(/^flightdeck\//, '').replace(/\.[^./]*$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const BRANCH = `climb-${SLUG}-a${ATTEMPT}`
const DIR = `${SCRATCH}/climb-${SLUG}-a${ATTEMPT}`
const CLONE = `${DIR}/clone`
const CAP = Math.max(0.1, Math.floor((MAX_COST / (2 * (2 + ROUNDS))) * 100 + 1e-9) / 100)
const RESULT_DIR = `lab/results/${TODAY}-climb-${SLUG}`

const partial = { target: TARGET, branch: BRANCH }

function measurePrompt(label) {
  const cmd = (which, kind) => `claude plugin eval flightdeck --eval-dir evals --case '${which}' --runs ${RUNS} --no-publish --trust-plugin --ablation none --max-cost-usd ${CAP} --output-dir ${DIR}/${label}-${kind}`
  return `${RANK_WORKER}
${RULES}

Task: measure the document's eval scores in the clone ${CLONE} (branch ${BRANCH}). Run these two commands from the clone, one after the other, train first. Do not change any file.
Training set: ${cmd(TRAIN, 'train')}
Held-back test set: ${cmd(TEST, 'test')}
Add \`--scaffold --allow-tools 'Bash(node *)'\` to a command only when one of the case folders it selects (under ${CLONE}/flightdeck/evals/) holds a case.yaml that has a scaffold_script entry; leave both flags off otherwise.
An exit code of 0 or 1 is fine (1 only means some case scored below 1.0). Exit code 2 means the cost cap was hit: report ok false and say so in notes.
Then read aggregate-result.json in each output folder and take the mean of every cases[*].arms.with[*].score value in it: that is the score of that set. Return train (mean for the training set), test (mean for the test set), cost_usd (the total cost the two reports state, or 0 if none is stated), ok (true only when both scores were read from a real aggregate-result.json) and notes. If a command failed or a file is missing, return ok false with the reason in notes and 0 for the scores.`
}

async function measure(label) {
  const r = await stage(label, () => agent(measurePrompt(label), { label: `climb:measure:${label}`, phase: label.startsWith('base') ? 'Noise' : 'Rounds', model: 'haiku', effort: 'low', schema: MEASURE_SCHEMA }))
  if (halted(r)) return r
  if (r.ok !== true || num(r.train) === null || num(r.test) === null) return { halt: `measurement ${label} failed: ${r.notes || 'no scores'}` }
  return r
}

// ---- Setup
phase('Setup')
const setup = await stage('setup', () => agent(`${RANK_WORKER}
${RULES}

Task: set up a scratch clone for a climb.
1. Run \`git clone "$(git -C ${REPO} remote get-url origin)" ${CLONE}\` (clone from the GitHub remote, not from the local path, so the branches come with it).
2. In ${CLONE} run \`git switch -c ${BRANCH} origin/${BASE}\`.
3. Confirm the file ${CLONE}/${TARGET} exists.
4. In ${CLONE} run \`claude plugin eval --help\` and report whether it exits 0.
Return ok (true only when steps 1 to 3 worked), eval_available (true only when the help command exited 0) and notes (what went wrong, or an empty string).`,
  { label: 'climb:setup', phase: 'Setup', model: 'haiku', effort: 'low', schema: SETUP_SCHEMA }))
if (halted(setup)) return { ...partial, halt: setup.halt }
if (setup.ok !== true) return { ...partial, halt: `setup failed: ${setup.notes || 'the clone could not be made'}` }
if (setup.eval_available !== true) return { ...partial, halt: 'plugin eval not available here', verdict: 'plugin eval not available here' }
log(`climb ${BRANCH}: clone ready, cap $${CAP.toFixed(2)} per measurement`)

// ---- Noise
phase('Noise')
const baseRuns = await parallel([() => measure('base-1'), () => measure('base-2')])
const [b1, b2] = baseRuns
if (!b1 || halted(b1)) return { ...partial, halt: (b1 && b1.halt) || 'measurement base-1 returned nothing' }
if (!b2 || halted(b2)) return { ...partial, halt: (b2 && b2.halt) || 'measurement base-2 returned nothing' }
const noise = {
  train: Math.max(round4(Math.abs(b1.train - b2.train)), 0.02),
  test: Math.max(round4(Math.abs(b1.test - b2.test)), 0.02),
}
let baseline = { train: round4((b1.train + b2.train) / 2), test: round4((b1.test + b2.test) / 2) }
const startBaseline = { ...baseline }
log(`noise: training ${show(noise.train)}, test ${show(noise.test)}; baseline training ${show(baseline.train)}, test ${show(baseline.test)}`)

// ---- Rounds
phase('Rounds')
const rounds = []
let keptAny = false
for (let k = 1; k <= ROUNDS; k++) {
  const prior = rounds.map(r => `round ${r.n}: ${r.summary} (${r.decision})`).join('; ') || 'none yet'
  const proposal = await stage(`propose r${k}`, () => agent(`${RANK_WORKER}
${RULES}

Task: round ${k} of a climb. In the clone ${CLONE} (branch ${BRANCH}) make exactly one change to the file ${TARGET}, and to no other file, that you expect to raise its eval score.
Read ${TARGET}, the training case folders under ${CLONE}/flightdeck/evals/ that match the glob '${TRAIN}' (cases are folders there), and the numbers below. Other case folders are held back on purpose: do not open or list any case folder that does not match '${TRAIN}'.
Latest training score: ${show(baseline.train)} (noise ${show(noise.train)}, so a gain smaller than that is not real). Earlier rounds: ${prior}.
Keep the change small and in plain words; do not change what the document is for. Commit it by file name with the message \`climb round ${k}: <one-line summary>\` and end the message with these two lines:
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0191zZ3K2XqnZwPQqF6LFH2x
Do not push. Return commit (the new commit's hash), summary (the one-line summary) and ok.`,
  { label: `climb:propose:r${k}`, phase: 'Rounds', model: 'sonnet', effort: 'high', schema: PROPOSE_SCHEMA }))
  if (halted(proposal) || proposal.ok !== true || !proposal.commit) {
    return { ...partial, noise, baseline: startBaseline, rounds, halt: halted(proposal) ? proposal.halt : `proposal for round ${k} did not make a commit` }
  }

  const m = await measure(`r${k}`)
  if (halted(m)) return { ...partial, noise, baseline: startBaseline, rounds: [...rounds, { n: k, commit: proposal.commit, summary: proposal.summary, decision: 'not measured', reason: m.halt }], halt: m.halt }

  const gainTrain = round4(m.train - baseline.train)
  const gainTest = round4(m.test - baseline.test)
  const okTrain = gainTrain > noise.train
  const okTest = gainTest > noise.test
  const entry = { n: k, commit: proposal.commit, summary: proposal.summary, train: m.train, test: m.test }
  if (okTrain && okTest) {
    entry.decision = 'kept'
    entry.reason = `training rose ${show(gainTrain)} (noise ${show(noise.train)}) and test rose ${show(gainTest)} (noise ${show(noise.test)})`
    baseline = { train: m.train, test: m.test }
    keptAny = true
    rounds.push(entry)
  } else {
    const why = []
    if (!okTrain) why.push(`training did not rise beyond its noise (${show(gainTrain)} against ${show(noise.train)})`)
    if (!okTest) why.push(`test did not rise beyond its noise (${show(gainTest)} against ${show(noise.test)})`)
    entry.decision = 'reverted'
    entry.reason = why.join('; ')
    rounds.push(entry)
    const rev = await stage(`revert r${k}`, () => agent(`${RANK_WORKER}
${RULES}

Task: in the clone ${CLONE} (branch ${BRANCH}) run \`git revert --no-edit ${proposal.commit}\`. Never use reset, checkout of old files, or a force push. If the revert stops on a conflict, run \`git revert --abort\` and report ok false. Return ok and the hash of the new revert commit (empty if it failed).`,
    { label: `climb:revert:r${k}`, phase: 'Rounds', model: 'haiku', effort: 'low', schema: REVERT_SCHEMA }))
    if (halted(rev) || rev.ok !== true) {
      return { ...partial, noise, baseline: startBaseline, rounds, halt: `revert of round ${k} failed: the change ${proposal.commit} is still on the branch` }
    }
  }
  log(`round ${k}: ${entry.decision}: ${entry.reason}`)
}

// ---- Report
phase('Report')
const verdict = keptAny
  ? (DRY ? 'improved (dry run): nothing pushed' : 'improved: a draft pull request is open')
  : 'within noise, do not merge'
const summaryJson = JSON.stringify({ target: TARGET, branch: BRANCH, noise, startBaseline, finalBaseline: baseline, rounds, verdict })
const report = await stage('report', () => agent(`${RANK_WORKER}
${RULES}

Task: write the report of a climb and, only if allowed below, open a draft pull request.
Write ${CLONE}/${RESULT_DIR}/report.md (create the folder). One paragraph per line, no hard wrapping, plain words. The first line is exactly the verdict: ${verdict}
Then say: the target (${TARGET}); the noise (training ${show(noise.train)}, test ${show(noise.test)}) and what it means (a score must rise by more than this to count); then one paragraph per round with its change, its training and test scores, and the decision with the reason. If no round was kept, say plainly that the document is unchanged in effect and nothing should be merged. Use only these facts: ${summaryJson}
Commit the report by file name with the message \`climb report: ${TARGET}\` and end the message with these two lines:
Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_0191zZ3K2XqnZwPQqF6LFH2x
${keptAny && !DRY
    ? `Because a change was kept and this is not a dry run: run \`git push -u origin ${BRANCH}\` in the clone, then \`gh pr create --draft --base ${BASE} --head ${BRANCH} --title "Climb: ${TARGET}" --body-file ${RESULT_DIR}/report.md\` and return its URL as pr_url.`
    : 'Push nothing and open no pull request; return pr_url as an empty string.'}
Return report_path (the path of report.md in the clone), report_text (its full text) and pr_url.`,
  { label: 'climb:report', phase: 'Report', model: 'sonnet', effort: 'medium', schema: REPORT_SCHEMA }))
if (halted(report)) return { ...partial, noise, baseline: startBaseline, rounds, verdict, halt: report.halt }

return { target: TARGET, branch: BRANCH, noise, baseline: startBaseline, final: baseline, rounds, verdict, report_path: report.report_path, pr_url: report.pr_url }
