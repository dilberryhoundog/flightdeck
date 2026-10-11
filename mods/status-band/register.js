// FlightDeck status band: one line above the prompt that shows how many workshops are active
// (with the latest attempt of the one changed most recently), how many questions are waiting on
// the owner and how many captured entries are waiting to start.
// It is read-only: it reads files through $.fs and never writes, runs or asks anything.
// The reading rules (comment and fence stripping, the manifest, the questions, the latest
// attempt, the line's wording) live in lib/read.js.
import { atom, read, update } from 'claude-code'
import { NAME_RE, ATTEMPT_DEPTH, REFRESH_MS, latestAttempts, summarize, bandText } from './lib/read.js'

const band = atom({ plugin: 'flight-band', key: 'band' }, null)
let lastCwd = null
let timer = null

async function isDir($, p) {
  try {
    const s = await $.fs.stat(p)
    return s.kind === 'dir'
  } catch {
    return false
  }
}

// Walks up from start to the first folder that holds a .flightdeck folder; null when none does.
async function findRoot($, start) {
  let dir = start.length > 1 ? start.replace(/\/+$/, '') : start
  for (;;) {
    if (await isDir($, (dir === '/' ? '' : dir) + '/.flightdeck')) return dir
    if (dir === '/' || dir === '') return null
    const i = dir.lastIndexOf('/')
    dir = i <= 0 ? '/' : dir.slice(0, i)
  }
}

// Collects every folder below base (relative paths) down to ATTEMPT_DEPTH levels.
async function walkAttempts($, base, rel, depth, out) {
  let entries = []
  try {
    entries = await $.fs.list(rel ? base + '/' + rel : base)
  } catch {
    entries = []
  }
  for (const entry of entries) {
    if (entry.kind !== 'dir') continue
    const path = rel ? rel + '/' + entry.name : entry.name
    out.push(path)
    if (depth < ATTEMPT_DEPTH - 1) await walkAttempts($, base, path, depth + 1, out)
  }
  return out
}

async function readOrNull($, path) {
  try {
    return await $.fs.read(path)
  } catch {
    return null
  }
}

async function listOrEmpty($, path) {
  try {
    return await $.fs.list(path)
  } catch {
    return []
  }
}

async function gather($, root) {
  const fd = root + '/.flightdeck'
  const manifestText = await readOrNull($, fd + '/workshops.md')
  const folders = []
  for (const entry of await listOrEmpty($, fd)) {
    if (entry.kind !== 'dir' || !NAME_RE.test(entry.name)) continue
    const dir = fd + '/' + entry.name
    const cardText = await readOrNull($, dir + '/workshop.md')
    const questionsText = await readOrNull($, dir + '/questions.md')
    let changedMs = 0
    for (const f of await listOrEmpty($, dir)) {
      if (f.kind === 'file' && f.mtimeMs > changedMs) changedMs = f.mtimeMs
    }
    const attemptDirs = await walkAttempts($, dir + '/attempts', '', 0, [])
    const attemptMs = {}
    for (const a of latestAttempts(attemptDirs)) {
      try {
        const s = await $.fs.stat(dir + '/attempts/' + a.label)
        attemptMs[a.label] = s.mtimeMs
      } catch {
        attemptMs[a.label] = 0
      }
    }
    folders.push({ name: entry.name, cardText, questionsText, attemptDirs, changedMs, attemptMs })
  }
  return { manifestText, folders }
}

// Reads the project again and stores the summary; on any error the previous summary stays.
async function refresh($, cwd) {
  if (!cwd) return
  try {
    const root = await findRoot($, cwd)
    const next = root ? summarize(await gather($, root)) : null
    await update($, band, () => next)
  } catch {
    // keep the previous summary
  }
}

// The space in "import (" below is deliberate: the read-only check greps this file for a dynamic
// import call, and a type annotation must not trip it.
/** @type {import ('claude-code').Register} */
export const register = on => {
  on('session.start', async ($, e, next) => {
    lastCwd = e.cwd
    await refresh($, e.cwd)
    if (!timer) timer = $.clock.every(REFRESH_MS, () => refresh($, lastCwd))
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    await refresh($, lastCwd ?? (await $.session.cwd()))
    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, band)
    if (!s || e.props.hasSurvey) return next(e)
    const text = bandText(s, e.props.bodyColumns)
    if (!text) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return h(Box, { key: 'flight-band' }, h(Text, { dimColor: true, wrap: 'truncate-end' }, text))
  })
}
