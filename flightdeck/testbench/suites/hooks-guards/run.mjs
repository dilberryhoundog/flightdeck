// testbench/suites/hooks-guards/run.mjs — T5: lock-guard denies edits to locked paths outside phase targets, boundary-guard denies edits outside the permitted set per phase, both resolve targets against the git toplevel (worktrees included), emit ask on an ambiguous launch, and deny everything after a fired abandon trigger, which also blocks fc worker render, fc worker merge and fc launch phase. Covers B6, B7, B42, B53, I7.
// Usage: node flightdeck/testbench/suites/hooks-guards/run.mjs; exit 0 when every case passes, 2 otherwise.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, hook, fc, sh, mkActiveLaunch, copyDir,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const GUARDS = ['lock-guard', 'boundary-guard'];

function envelope(root, extra = {}) {
  return {
    session_id: 'sess-testbench',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: 'PreToolUse',
    tool_use_id: 'toolu_guard',
    ...extra,
  };
}

function editOf(root, file, extra = {}) {
  return envelope(root, { tool_name: 'Edit', tool_input: { file_path: path.isAbsolute(file) ? file : path.join(root, file), old_string: 'a', new_string: 'b' }, ...extra });
}

function writeOf(root, file, extra = {}) {
  return envelope(root, { tool_name: 'Write', tool_input: { file_path: path.isAbsolute(file) ? file : path.join(root, file), content: 'x' }, ...extra });
}

function notebookOf(root, file, extra = {}) {
  return envelope(root, { tool_name: 'NotebookEdit', tool_input: { notebook_path: path.isAbsolute(file) ? file : path.join(root, file), new_source: 'x', cell_id: '1' }, ...extra });
}

function launchPath(active) {
  return path.join(active.launchDir, 'launch.json');
}

function patchLaunch(active, fn) {
  const launch = readJson(launchPath(active));
  fn(launch);
  writeJson(launchPath(active), launch);
}

function eventsText(active) {
  return readText(path.join(active.launchDir, 'events.jsonl'));
}

function parseEvents(text) {
  return text.split('\n').filter((line) => line.trim() !== '').map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`events.jsonl line ${index + 1} is not JSON: ${error.message}`);
    }
  });
}

function appendEvent(active, event, detail, ts) {
  const line = { ts: ts ?? new Date().toISOString(), event, launch: active.launch, phase: readJson(launchPath(active)).phase, source: 'fc', detail };
  fs.appendFileSync(path.join(active.launchDir, 'events.jsonl'), `${JSON.stringify(line)}\n`);
  return line;
}

function isoPlus(ms) {
  return new Date(Date.now() + ms).toISOString();
}

// Runs the guard and returns { result, added } where added is the list of events appended by the call.
function runGuard(name, active, envelopeObj, opts = {}) {
  const before = eventsText(active);
  const result = hook(name, envelopeObj, { cwd: opts.cwd ?? active.root, env: opts.env ?? active.env });
  const after = eventsText(active);
  assert(after.startsWith(before), `${name}: existing event lines are preserved`);
  return { result, added: parseEvents(after.slice(before.length)) };
}

function assertDecision(result, decision, label) {
  assertExit(result, 0, `${label}: exit code`);
  assert(result.decision && typeof result.decision === 'object', `${label}: stdout must be a JSON decision, got ${JSON.stringify(result.stdout.slice(0, 200))}`);
  assertEq(Object.keys(result.decision), ['hookSpecificOutput'], `${label}: the only top-level key is hookSpecificOutput`);
  const out = result.decision.hookSpecificOutput;
  assertEq(Object.keys(out).sort(), ['hookEventName', 'permissionDecision', 'permissionDecisionReason'], `${label}: hookSpecificOutput carries exactly the three fields`);
  assertEq(out.hookEventName, 'PreToolUse', `${label}: hookEventName`);
  assertEq(out.permissionDecision, decision, `${label}: permissionDecision`);
  assert(typeof out.permissionDecisionReason === 'string' && out.permissionDecisionReason.trim() !== '', `${label}: permissionDecisionReason is a non-empty string`);
  return out.permissionDecisionReason;
}

function assertSilent(result, label) {
  assertExit(result, 0, `${label}: exit code`);
  assertEq(result.stdout, '', `${label}: stdout must be empty`);
}

function assertDeniedEvent(added, event, relPath, label) {
  assertEq(added.length, 1, `${label}: exactly one ${event} event appended`);
  assertEq(added[0].event, event, `${label}: event name`);
  assert(added[0].detail && typeof added[0].detail === 'object', `${label}: detail object`);
  assertEq(added[0].detail.path, relPath, `${label}: detail.path is the repository-relative target`);
}

function addWorktree(active, name) {
  const rel = path.join('.claude', 'worktrees', name);
  const result = sh(`git worktree add -q ${JSON.stringify(rel)} -b ${JSON.stringify(name)}`, { cwd: active.root });
  if (result.code !== 0) throw new Error(`git worktree add failed: ${result.stderr}`);
  return fs.realpathSync(path.join(active.root, rel));
}

// A second launch folder with status active, so resolution by status is ambiguous.
function addSecondActiveLaunch(active) {
  const second = 'export-html-2';
  const dir = path.join(active.root, 'flightdeck', 'launch', second);
  copyDir(active.launchDir, dir);
  const launch = readJson(path.join(dir, 'launch.json'));
  launch.name = second;
  launch.branch = `run/${second}`;
  writeJson(path.join(dir, 'launch.json'), launch);
  return { name: second, dir };
}

const LOCKED = 'tests/export/contract.test.mjs';
const ALLOWED = 'src/export/index.mjs';
const OUTSIDE = 'README.md';

const cases = [];

// ── lock-guard: B6 ────────────────────────────────────────────────────────────
cases.push({
  id: 'lock-edit-locked-denied',
  covers: ['B6', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const { result, added } = runGuard('lock-guard', active, editOf(active.root, LOCKED));
    const reason = assertDecision(result, 'deny', 'Edit of a locked file');
    assertIncludes(reason, LOCKED, 'the reason names the path');
    assertDeniedEvent(added, 'lock_denied', LOCKED, 'lock_denied');
  },
});

cases.push({
  id: 'lock-write-locked-denied',
  covers: ['B6'],
  fn: async () => {
    const active = mkActiveLaunch();
    const target = 'tests/export/new-check.test.mjs';
    const { result, added } = runGuard('lock-guard', active, writeOf(active.root, target));
    assertDecision(result, 'deny', 'Write into a locked directory');
    assertDeniedEvent(added, 'lock_denied', target, 'lock_denied');
  },
});

cases.push({
  id: 'lock-notebook-locked-denied',
  covers: ['B6', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const target = 'tests/export/notes.ipynb';
    const { result, added } = runGuard('lock-guard', active, notebookOf(active.root, target));
    assertDecision(result, 'deny', 'NotebookEdit via notebook_path under a locked path');
    assertDeniedEvent(added, 'lock_denied', target, 'lock_denied');
  },
});

cases.push({
  id: 'lock-launch-spec-copy-denied',
  covers: ['B6'],
  fn: async () => {
    const active = mkActiveLaunch();
    const target = `flightdeck/launch/${active.launch}/specs/export-html/spec.v1.json`;
    const { result, added } = runGuard('lock-guard', active, editOf(active.root, target));
    assertDecision(result, 'deny', 'Edit of the pinned spec copy');
    assertDeniedEvent(added, 'lock_denied', target, 'lock_denied');
    const canonical = 'flightdeck/launch/specs/export-html/tests-map.v1.json';
    const second = runGuard('lock-guard', active, editOf(active.root, canonical));
    assertDecision(second.result, 'deny', 'Edit of the canonical tests map');
    assertDeniedEvent(second.added, 'lock_denied', canonical, 'lock_denied');
  },
});

cases.push({
  id: 'lock-unlocked-target-silent',
  covers: ['B6'],
  fn: async () => {
    const active = mkActiveLaunch();
    for (const envelopeObj of [editOf(active.root, ALLOWED), writeOf(active.root, OUTSIDE), notebookOf(active.root, 'src/export/scratch.ipynb'), editOf(active.root, `flightdeck/launch/${active.launch}/notes.md`)]) {
      const { result, added } = runGuard('lock-guard', active, envelopeObj);
      assertSilent(result, `lock-guard on ${envelopeObj.tool_name}`);
      assertEq(added, [], 'no event for an unlocked target');
    }
  },
});

cases.push({
  id: 'lock-every-phase-except-targets',
  covers: ['B6'],
  fn: async () => {
    const active = mkActiveLaunch();
    for (const phase of ['plan', 'contracts', 'implement', 'verify', 'review', 'report']) {
      patchLaunch(active, (l) => { l.phase = phase; });
      const { result, added } = runGuard('lock-guard', active, editOf(active.root, LOCKED));
      assertDecision(result, 'deny', `phase ${phase}`);
      assertDeniedEvent(added, 'lock_denied', LOCKED, `phase ${phase}`);
    }
  },
});

cases.push({
  id: 'lock-phase-targets-silent',
  covers: ['B6'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'targets'; });
    const { result, added } = runGuard('lock-guard', active, editOf(active.root, LOCKED));
    assertSilent(result, 'lock-guard in phase targets');
    assertEq(added, [], 'no event in phase targets');
  },
});

cases.push({
  id: 'lock-relative-path-absolutised-against-cwd',
  covers: ['B6', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const cwd = path.join(active.root, 'tests');
    const envelopeObj = editOf(active.root, LOCKED);
    envelopeObj.cwd = cwd;
    envelopeObj.tool_input.file_path = 'export/contract.test.mjs';
    const { result, added } = runGuard('lock-guard', active, envelopeObj, { cwd });
    assertDecision(result, 'deny', 'relative file_path resolved against envelope cwd');
    assertDeniedEvent(added, 'lock_denied', LOCKED, 'lock_denied');
  },
});

cases.push({
  id: 'lock-worktree-target-relative-to-worktree-root',
  covers: ['B6', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const wt = addWorktree(active, 'w1');
    const denied = editOf(active.root, path.join(wt, LOCKED));
    denied.cwd = wt;
    const first = runGuard('lock-guard', active, denied, { cwd: wt });
    assertDecision(first.result, 'deny', 'locked path inside a worktree');
    assertDeniedEvent(first.added, 'lock_denied', LOCKED, 'lock_denied from a worktree');
    const relative = editOf(active.root, 'ignored');
    relative.cwd = wt;
    relative.tool_input.file_path = 'tests/export/edges.test.mjs';
    const second = runGuard('lock-guard', active, relative, { cwd: wt });
    assertDecision(second.result, 'deny', 'relative locked path inside a worktree');
    assertDeniedEvent(second.added, 'lock_denied', 'tests/export/edges.test.mjs', 'lock_denied from a worktree, relative path');
    const allowed = editOf(active.root, path.join(wt, ALLOWED));
    allowed.cwd = wt;
    const third = runGuard('lock-guard', active, allowed, { cwd: wt });
    assertSilent(third.result, 'unlocked path inside a worktree');
    assertEq(third.added, [], 'no event for an unlocked worktree path');
  },
});

// ── boundary-guard: B7 ────────────────────────────────────────────────────────
cases.push({
  id: 'boundary-outside-denied',
  covers: ['B7', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const { result, added } = runGuard('boundary-guard', active, editOf(active.root, OUTSIDE));
    const reason = assertDecision(result, 'deny', 'Edit outside the allowed paths');
    assertIncludes(reason, OUTSIDE, 'the reason names the path');
    assertDeniedEvent(added, 'boundary_denied', OUTSIDE, 'boundary_denied');
    const write = runGuard('boundary-guard', active, writeOf(active.root, 'scripts/new-tool.mjs'));
    assertDecision(write.result, 'deny', 'Write outside the allowed paths');
    assertDeniedEvent(write.added, 'boundary_denied', 'scripts/new-tool.mjs', 'boundary_denied');
    const notebook = runGuard('boundary-guard', active, notebookOf(active.root, 'docs/notes.ipynb'));
    assertDecision(notebook.result, 'deny', 'NotebookEdit outside the allowed paths');
    assertDeniedEvent(notebook.added, 'boundary_denied', 'docs/notes.ipynb', 'boundary_denied');
  },
});

cases.push({
  id: 'boundary-inside-silent',
  covers: ['B7'],
  fn: async () => {
    const active = mkActiveLaunch();
    for (const file of [ALLOWED, 'src/export/new-module.mjs', 'tests/export/fixtures/other.json', `flightdeck/launch/${active.launch}/notes.md`, `flightdeck/launch/${active.launch}/returns/U9.json`]) {
      const { result, added } = runGuard('boundary-guard', active, writeOf(active.root, file));
      assertSilent(result, `boundary-guard on ${file}`);
      assertEq(added, [], `no event for ${file}`);
    }
  },
});

cases.push({
  id: 'boundary-enforced-phases',
  covers: ['B7'],
  fn: async () => {
    const active = mkActiveLaunch();
    for (const phase of ['contracts', 'implement', 'verify', 'review']) {
      patchLaunch(active, (l) => { l.phase = phase; });
      const { result, added } = runGuard('boundary-guard', active, editOf(active.root, OUTSIDE));
      assertDecision(result, 'deny', `phase ${phase}`);
      assertDeniedEvent(added, 'boundary_denied', OUTSIDE, `phase ${phase}`);
      const inside = runGuard('boundary-guard', active, editOf(active.root, ALLOWED));
      assertSilent(inside.result, `phase ${phase} inside`);
      assertEq(inside.added, [], `phase ${phase}: no event inside`);
    }
  },
});

cases.push({
  id: 'boundary-phase-targets',
  covers: ['B7'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'targets'; });
    const denied = runGuard('boundary-guard', active, editOf(active.root, ALLOWED));
    assertDecision(denied.result, 'deny', 'phase targets: an allowed-but-not-locked source file');
    assertDeniedEvent(denied.added, 'boundary_denied', ALLOWED, 'phase targets');
    const outside = runGuard('boundary-guard', active, editOf(active.root, OUTSIDE));
    assertDecision(outside.result, 'deny', 'phase targets: a file outside everything');
    for (const file of [LOCKED, 'tests/export/new.test.mjs', 'flightdeck/launch/specs/export-html/tests-map.v1.json', 'flightdeck/launch/specs/export-html/checks/new-check.mjs', `flightdeck/launch/${active.launch}/launch.json`]) {
      const { result, added } = runGuard('boundary-guard', active, writeOf(active.root, file));
      assertSilent(result, `phase targets: ${file}`);
      assertEq(added, [], `phase targets: no event for ${file}`);
    }
  },
});

cases.push({
  id: 'boundary-not-enforced-silent',
  covers: ['B7'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; l.paths.enforce_boundary = false; });
    const { result, added } = runGuard('boundary-guard', active, editOf(active.root, OUTSIDE));
    assertSilent(result, 'enforce_boundary false');
    assertEq(added, [], 'no event when the boundary is not enforced');
  },
});

cases.push({
  id: 'boundary-worktree-target-relative-to-worktree-root',
  covers: ['B7', 'I7'],
  fn: async () => {
    const active = mkActiveLaunch();
    const wt = addWorktree(active, 'w2');
    const outside = editOf(active.root, path.join(wt, OUTSIDE));
    outside.cwd = wt;
    const first = runGuard('boundary-guard', active, outside, { cwd: wt });
    assertDecision(first.result, 'deny', 'outside path inside a worktree');
    assertDeniedEvent(first.added, 'boundary_denied', OUTSIDE, 'boundary_denied from a worktree');
    const inside = editOf(active.root, path.join(wt, ALLOWED));
    inside.cwd = wt;
    const second = runGuard('boundary-guard', active, inside, { cwd: wt });
    assertSilent(second.result, 'allowed path inside a worktree');
    assertEq(second.added, [], 'no event for an allowed worktree path');
    const relative = editOf(active.root, 'ignored');
    relative.cwd = path.join(wt, 'src');
    relative.tool_input.file_path = 'export/index.mjs';
    const third = runGuard('boundary-guard', active, relative, { cwd: relative.cwd });
    assertSilent(third.result, 'relative allowed path from a worktree subdirectory');
    assertEq(third.added, [], 'no event for a relative allowed worktree path');
  },
});

// ── B53: ambiguous launch → ask ───────────────────────────────────────────────
cases.push({
  id: 'two-active-launches-ask',
  covers: ['B53'],
  fn: async () => {
    const active = mkActiveLaunch();
    const second = addSecondActiveLaunch(active);
    const firstEvents = eventsText(active);
    const secondEvents = readText(path.join(second.dir, 'events.jsonl'));
    for (const name of GUARDS) {
      const result = hook(name, editOf(active.root, ALLOWED), { cwd: active.root, env: active.env });
      const reason = assertDecision(result, 'ask', `${name} with two active launches`);
      assertMatch(reason, /active/i, `${name}: the reason names the cause`);
    }
    const log = hook('event-log', envelope(active.root, { hook_event_name: 'Stop', stop_reason: 'end_turn', stop_hook_active: false }), { cwd: active.root, env: active.env });
    assertSilent(log, 'event-log with two active launches');
    assertEq(eventsText(active), firstEvents, 'first launch events untouched');
    assertEq(readText(path.join(second.dir, 'events.jsonl')), secondEvents, 'second launch events untouched');
  },
});

cases.push({
  id: 'two-active-launches-env-selects-one',
  covers: ['B53'],
  fn: async () => {
    const active = mkActiveLaunch();
    addSecondActiveLaunch(active);
    const env = { ...active.env, FLIGHTCREW_LAUNCH: active.launch };
    const { result, added } = runGuard('lock-guard', active, editOf(active.root, LOCKED), { env });
    assertDecision(result, 'deny', 'FLIGHTCREW_LAUNCH resolves the ambiguity');
    assertDeniedEvent(added, 'lock_denied', LOCKED, 'lock_denied on the selected launch');
  },
});

cases.push({
  id: 'unreadable-launch-json-ask',
  covers: ['B53'],
  fn: async () => {
    const active = mkActiveLaunch();
    writeText(launchPath(active), '{ "schema_version": 1, "name": "export-html-1", "status": "active", "phase": "review", ');
    const env = { ...active.env, FLIGHTCREW_LAUNCH: active.launch };
    const before = eventsText(active);
    for (const name of GUARDS) {
      const result = hook(name, editOf(active.root, ALLOWED), { cwd: active.root, env });
      const reason = assertDecision(result, 'ask', `${name} with an unreadable launch.json`);
      assertMatch(reason, /launch\.json|pars|read/i, `${name}: the reason names the cause`);
    }
    const log = hook('event-log', envelope(active.root, { hook_event_name: 'Stop', stop_reason: 'end_turn', stop_hook_active: false }), { cwd: active.root, env });
    assertSilent(log, 'event-log with an unreadable launch.json');
    assertEq(eventsText(active), before, 'events untouched when launch.json is unreadable');
  },
});

// ── B42: fired abandon trigger ────────────────────────────────────────────────
const TRIGGER_NAME = 'boundary-breach-trigger';

function fireTrigger(active) {
  return appendEvent(active, 'trigger', { name: TRIGGER_NAME, detail: 'any edit outside src/export/ and tests/export/' }, isoPlus(0));
}

cases.push({
  id: 'trigger-fired-guards-deny-everything',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    fireTrigger(active);
    for (const name of GUARDS) {
      for (const envelopeObj of [editOf(active.root, ALLOWED), writeOf(active.root, 'src/export/new.mjs'), notebookOf(active.root, 'src/export/n.ipynb'), editOf(active.root, `flightdeck/launch/${active.launch}/notes.md`)]) {
        const result = hook(name, envelopeObj, { cwd: active.root, env: active.env });
        const reason = assertDecision(result, 'deny', `${name} after a trigger on ${envelopeObj.tool_name}`);
        assertIncludes(reason, TRIGGER_NAME, `${name}: the reason names the trigger`);
      }
    }
  },
});

cases.push({
  id: 'trigger-cleared-by-newer-gate-event',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    fireTrigger(active);
    appendEvent(active, 'gate', { gate: 'G3', decision: 'exit', note: 'trigger acknowledged' }, isoPlus(2000));
    for (const name of GUARDS) {
      const { result, added } = runGuard(name, active, editOf(active.root, ALLOWED));
      assertSilent(result, `${name} after a newer gate event`);
      assertEq(added, [], `${name}: no event once the trigger is superseded`);
    }
  },
});

cases.push({
  id: 'trigger-cleared-by-newer-escalation-or-end',
  covers: ['B42'],
  fn: async () => {
    for (const [event, detail] of [['escalation', { kind: 'trigger', detail: 'trigger reviewed' }], ['launch_end', { outcome: 'abandoned' }]]) {
      const active = mkActiveLaunch();
      patchLaunch(active, (l) => { l.phase = 'implement'; });
      fireTrigger(active);
      appendEvent(active, event, detail, isoPlus(2000));
      for (const name of GUARDS) {
        const { result, added } = runGuard(name, active, editOf(active.root, ALLOWED));
        assertSilent(result, `${name} after a newer ${event} event`);
        assertEq(added, [], `${name}: no event after a newer ${event}`);
      }
    }
  },
});

cases.push({
  id: 'trigger-older-than-gate-does-not-fire',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    appendEvent(active, 'trigger', { name: TRIGGER_NAME, detail: 'old' }, '2026-08-30T09:30:00Z');
    for (const name of GUARDS) {
      const { result, added } = runGuard(name, active, editOf(active.root, ALLOWED));
      assertSilent(result, `${name}: a trigger older than the G2 gate event does not fire`);
      assertEq(added, [], `${name}: no event`);
    }
  },
});

cases.push({
  id: 'trigger-fired-fc-worker-render-exits-2',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    const before = fc(['worker', 'render', 'U1'], { cwd: active.root, env: active.env });
    assertExit(before, 0, 'worker render succeeds before the trigger');
    assertMatch(before.stdout, /^unit: U1/, 'worker render prints the dispatch prompt before the trigger');
    fireTrigger(active);
    const after = fc(['worker', 'render', 'U1'], { cwd: active.root, env: active.env });
    assertExit(after, 2, 'worker render after the trigger');
    assertMatch(`${after.stdout}\n${after.stderr}`, /trigger/i, 'the refusal names the trigger');
  },
});

cases.push({
  id: 'trigger-fired-fc-worker-merge-exits-2',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    fireTrigger(active);
    const result = fc(['worker', 'merge', 'U1'], { cwd: active.root, env: active.env });
    assertExit(result, 2, 'worker merge after the trigger');
    assertMatch(`${result.stdout}\n${result.stderr}`, /trigger/i, 'the refusal names the trigger');
  },
});

cases.push({
  id: 'trigger-fired-fc-launch-phase-exits-2',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'implement'; });
    fireTrigger(active);
    const before = eventsText(active);
    const result = fc(['launch', 'phase', 'verify'], { cwd: active.root, env: active.env });
    assertExit(result, 2, 'launch phase verify after the trigger');
    assertMatch(`${result.stdout}\n${result.stderr}`, /trigger/i, 'the refusal names the trigger');
    assertEq(readJson(launchPath(active)).phase, 'implement', 'the phase did not change');
    const after = eventsText(active);
    assert(after.startsWith(before), 'existing event lines are preserved');
    const added = parseEvents(after.slice(before.length));
    assert(!added.some((e) => e.event === 'phase'), 'no phase event was appended');
  },
});

cases.push({
  id: 'trigger-fired-fc-launch-phase-ended-allowed',
  covers: ['B42'],
  fn: async () => {
    const active = mkActiveLaunch();
    patchLaunch(active, (l) => { l.phase = 'report'; });
    fireTrigger(active);
    const result = fc(['launch', 'phase', 'ended'], { cwd: active.root, env: active.env });
    assertExit(result, 0, 'launch phase ended is allowed while a trigger is fired');
    assertEq(readJson(launchPath(active)).phase, 'ended', 'phase is ended');
  },
});

await suite('hooks-guards', cases);
