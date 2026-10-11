// Engine tests for the FlightDeck status band, run by `claude plugin test mods/status-band`.
// The files the band reads are an in-memory tree under /proj, answered by the hooks that sit
// beneath the plugin. Every test runs on the terminal and desktop surfaces.
import { test, expect, mock } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const

// PR 1's questions fixture: 1 open, 1 answered, 1 held for later.
const QUESTIONS = `# Questions for workshop alpha

## q1: First question?
why: because
options: a) yes; b) no
recommended: a) yes
asked: 2026-10-01 by lead
answer:

## q2: Second question?
why: because
asked: 2026-10-01 by lead
answer: a) yes | note: fine

## q3: Third question?
why: because
asked: 2026-10-01 by lead
ask-later: next sitting
answer:
`

const EXTRA_OPEN = `
## q4: Fourth question?
why: because
asked: 2026-10-11 by lead
answer:
`

const MANIFEST = [
  '# Workshops',
  '',
  '- alpha: fix a|b: the [x] (y) part (2026-10-01)',
  '- beta: later (2026-10-02)',
  '- gamma: pending (2026-10-03)',
  '- done-one: finished (2026-10-04)',
  '',
].join('\n')

type Node = { kind: 'file'; text: string; mtimeMs: number } | { kind: 'dir'; mtimeMs: number }

// An in-memory file tree. Parent folders are made as files are put.
function makeTree() {
  const nodes = new Map<string, Node>()
  const dir = (path: string, mtimeMs = 0) => {
    const parts = path.split('/').filter(Boolean)
    let cur = ''
    for (const part of parts) {
      cur += '/' + part
      if (!nodes.has(cur)) nodes.set(cur, { kind: 'dir', mtimeMs: 0 })
    }
    const node = nodes.get(cur)
    if (node && node.kind === 'dir' && mtimeMs) node.mtimeMs = mtimeMs
  }
  const put = (path: string, text: string, mtimeMs = 1000) => {
    dir(path.slice(0, path.lastIndexOf('/')))
    nodes.set(path, { kind: 'file', text, mtimeMs })
  }
  return { nodes, dir, put }
}

type Tree = ReturnType<typeof makeTree>

// Every fs.write the band makes in any test lands here; it must stay 0.
const writes = { count: 0 }

// The tree the bottom hooks answer from; a test swaps it for each surface.
type World = { tree: Tree }

// The full fixture project: two workshop folders, two captured entries (one pending activation).
function fixtureTree(): Tree {
  const t = makeTree()
  t.dir('/proj/sub')
  t.put('/proj/.flightdeck/workshops.md', MANIFEST, 5000)
  t.put('/proj/.flightdeck/gamma.activate.md', 'activate gamma\n', 5000)
  t.put('/proj/.flightdeck/alpha/workshop.md', '# Workshop alpha\n', 1000)
  t.put('/proj/.flightdeck/alpha/questions.md', QUESTIONS, 2000)
  t.dir('/proj/.flightdeck/alpha/attempts/a1', 100)
  t.dir('/proj/.flightdeck/alpha/attempts/pr-1/a1', 200)
  t.dir('/proj/.flightdeck/alpha/attempts/pr-1/a2', 900)
  t.dir('/proj/.flightdeck/alpha/attempts/plan/a2', 300)
  t.put('/proj/.flightdeck/done-one/workshop.md', '# Workshop done-one\n\nsettled: 2026-10-05\n', 500)
  t.put('/proj/.flightdeck/done-one/questions.md', '# Questions\n\n## q1: Still open?\nwhy: x\nasked: 2026-10-04 by lead\nanswer:\n', 600)
  return t
}

// Installs the hooks beneath the plugin: they stand for the engine and answer with result objects.
function answerFrom(on: any, world: World) {
  on('fs.read', ($: any, e: { path: string }) => {
    const n = world.tree.nodes.get(e.path)
    return n && n.kind === 'file' ? { value: n.text } : { deny: 'ENOENT' }
  })
  on('fs.list', ($: any, e: { path: string }) => {
    const base = e.path.replace(/\/+$/, '')
    const n = world.tree.nodes.get(base)
    if (!n || n.kind !== 'dir') return { deny: 'ENOENT' }
    const value = []
    for (const [p, node] of world.tree.nodes) {
      if (!p.startsWith(base + '/') || p.slice(base.length + 1).includes('/')) continue
      value.push({
        name: p.slice(base.length + 1),
        kind: node.kind,
        size: node.kind === 'file' ? node.text.length : 0,
        mtimeMs: node.kind === 'file' ? node.mtimeMs : 0,
        isLink: false,
      })
    }
    return { value }
  })
  on('fs.stat', ($: any, e: { path: string }) => {
    const n = world.tree.nodes.get(e.path.replace(/\/+$/, ''))
    if (!n) return { deny: 'ENOENT' }
    return { value: { kind: n.kind, size: n.kind === 'file' ? n.text.length : 0, mtimeMs: n.mtimeMs, isLink: false } }
  })
  on('fs.write', () => {
    writes.count += 1
    return { deny: 'read-only test' }
  })
  on('session.start', ($: any, e: { cwd: string }) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/proj/sub' }))
  on('turn.complete', () => ({ text: '' }))
}

function propsFor(overrides: { hasSurvey?: boolean; bodyColumns?: number } = {}) {
  return {
    hasSurvey: false,
    isWorking: false,
    maxRows: 10,
    bodyColumns: 200,
    scroll: { offset: 0, bodyRows: 10 },
    view: {},
    ...overrides,
  }
}

async function start($: any) {
  await $.session.start({ cwd: '/proj/sub', surface: 'terminal', isInteractive: true })
}

// Mounts the band, returns the text of the line that starts with "FlightDeck: " (or null).
async function drawnLine($: any, surface: 'terminal' | 'desktop', overrides = {}): Promise<string | null> {
  let ui: any
  try {
    ui = await $.ui.mount({ plugin: 'flight-band', surface, component: 'AbovePrompt', props: propsFor(overrides) })
  } catch {
    // The engine refuses a mount when the hook draws nothing: that counts as nothing drawn.
    return null
  }
  try {
    const found = await ui.find({ type: 'Text', text: /^FlightDeck: / })
    return found ? String(found.text) : null
  } finally {
    await ui.unmount()
  }
}

async function anyFlightDeckText($: any, surface: 'terminal' | 'desktop', overrides = {}): Promise<boolean> {
  let ui: any
  try {
    ui = await $.ui.mount({ plugin: 'flight-band', surface, component: 'AbovePrompt', props: propsFor(overrides) })
  } catch {
    // A mount that rejects because nothing is drawn is accepted as "nothing drawn".
    return false
  }
  try {
    return (await ui.find({ text: /FlightDeck/ })) !== undefined
  } finally {
    await ui.unmount()
  }
}

const FULL = 'FlightDeck: 1 active workshop (alpha, latest pr-1/a2) | 2 questions waiting on you | 2 captured, waiting to start'
const FULL_THREE = 'FlightDeck: 1 active workshop (alpha, latest pr-1/a2) | 3 questions waiting on you | 2 captured, waiting to start'

// A world the bottom hooks answer from; each test swaps its tree before each surface.
function newWorld(on: any, tree: Tree): World {
  const world: World = { tree }
  answerFrom(on, world)
  return world
}

test('the band draws the full line', async ($, on) => {
  const world = newWorld(on, fixtureTree())
  for (const surface of SURFACES) {
    world.tree = fixtureTree()
    await start($)
    expect(await drawnLine($, surface)).toBe(FULL)
  }
})

test('the band draws the short line when the room is narrow', async ($, on) => {
  const world = newWorld(on, fixtureTree())
  for (const surface of SURFACES) {
    world.tree = fixtureTree()
    await start($)
    expect(await drawnLine($, surface, { bodyColumns: 60 })).toBe('FlightDeck: 1 active | 2 waiting on you | 2 captured')
  }
})

test('the band draws nothing outside a FlightDeck project', async ($, on) => {
  const bare = makeTree()
  bare.dir('/proj/sub')
  bare.put('/proj/README.md', 'no flightdeck here\n')
  const world = newWorld(on, bare)
  for (const surface of SURFACES) {
    world.tree = bare
    await start($)
    expect(await anyFlightDeckText($, surface)).toBe(false)
  }
})

test('the band yields while a survey holds it', async ($, on) => {
  const world = newWorld(on, fixtureTree())
  for (const surface of SURFACES) {
    world.tree = fixtureTree()
    await start($)
    expect(await anyFlightDeckText($, surface, { hasSurvey: true })).toBe(false)
  }
})

// Refresh path tested here: raising `turn.complete` through the test's `$`, as the engine does
// after every completed turn. The 30 second timer path is tested in the next test.
test('a completed turn picks up a changed questions file', async ($, on) => {
  const world = newWorld(on, fixtureTree())
  for (const surface of SURFACES) {
    world.tree = fixtureTree()
    await start($)
    expect(await drawnLine($, surface)).toBe(FULL)
    world.tree.put('/proj/.flightdeck/alpha/questions.md', QUESTIONS + EXTRA_OPEN, 3000)
    await $.turn.complete({ answer: '', durationMs: 10, isAborted: false, turnId: 't1', reason: 'answer' })
    expect(await drawnLine($, surface)).toBe(FULL_THREE)
  }
})

// Refresh path tested here: advancing the mocked clock past 30000 ms fires the band's own timer.
test('the 30 second timer picks up a changed questions file', async ($, on) => {
  const clock = mock.clock(on)
  const world = newWorld(on, fixtureTree())
  await start($)
  expect(await drawnLine($, 'terminal')).toBe(FULL)
  world.tree.put('/proj/.flightdeck/alpha/questions.md', QUESTIONS + EXTRA_OPEN, 3000)
  await clock.advance(30500)
  expect(await drawnLine($, 'terminal')).toBe(FULL_THREE)
})

test('broken files still draw a line', async ($, on) => {
  const broken = () => {
    const tree = makeTree()
    tree.dir('/proj/sub')
    tree.put('/proj/.flightdeck/workshops.md', '- no colon here\n- Bad Name: x (2026-10-01)\nnot a list line\n')
    tree.put('/proj/.flightdeck/alpha/workshop.md', '# Workshop alpha\n')
    tree.put('/proj/.flightdeck/alpha/questions.md', '## q1: Heading without an answer line\nwhy: x\n')
    return tree
  }
  const world = newWorld(on, broken())
  for (const surface of SURFACES) {
    world.tree = broken()
    await start($)
    // The malformed manifest lists nothing, so alpha counts as a folder the manifest lacks; its
    // question has no answer line and counts as open.
    expect(await drawnLine($, surface)).toBe(
      'FlightDeck: 1 active workshop (alpha) | 1 question waiting on you | 0 captured, waiting to start',
    )
  }
})

// Runs last in this file: the band must never have written anything in any test above.
test('the band never writes a file', async ($, on) => {
  newWorld(on, fixtureTree())
  await start($)
  await $.turn.complete({ answer: '', durationMs: 10, isAborted: false, turnId: 't2', reason: 'answer' })
  expect(await drawnLine($, 'terminal')).toBe(FULL)
  expect(writes.count).toBe(0)
})
