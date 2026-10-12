// testbench/suites/hooks-decisions/run.mjs — names each of the six hook scripts under flightdeck/flightcrew/hooks/ by its repository path and feeds it a real envelope against an active copy of the sample launch, asserting the decision it answers with (a deny, a held turn, or a silent allow) and the effect it leaves (events, hooks.log, the evidence page and report), as flightdeck/manuals/harness/hooks.md and flightdeck/flightcrew/hooks/README.md state them.
// Usage: node flightdeck/testbench/suites/hooks-decisions/run.mjs; exit 0 when every case passes, 2 otherwise.
//
// A small, fast suite on purpose: the part sweep runs a hook's naming suites once per hook, so every case here is one or two hook runs.

import path from 'node:path';
import {
  suite, hook, sh, mkActiveLaunch,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const HOOK_DIR = 'flightdeck/flightcrew/hooks';
const LOCKED_FILE = 'tests/export/contract.test.mjs';
const INSIDE_FILE = 'src/export/index.mjs';
const OUTSIDE_FILE = 'outside/new-file.txt';

function envelope(root, event, extra = {}) {
  return {
    session_id: 'sess-decisions',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: event,
    ...extra,
  };
}

function editOf(root, rel) {
  return envelope(root, 'PreToolUse', {
    tool_name: 'Edit',
    tool_use_id: 'toolu_decisions',
    tool_input: { file_path: path.join(root, rel), old_string: 'a', new_string: 'b' },
  });
}

function postEditOf(root, rel) {
  const file = path.join(root, rel);
  return envelope(root, 'PostToolUse', {
    tool_name: 'Edit',
    tool_use_id: 'toolu_decisions',
    tool_input: { file_path: file, old_string: 'a', new_string: 'b' },
    tool_response: { filePath: file, success: true },
  });
}

function launchIn(phase) {
  const active = mkActiveLaunch();
  if (phase) {
    const head = sh('git rev-parse HEAD', { cwd: active.root });
    if (head.code !== 0) throw new Error(`git rev-parse failed: ${head.stderr}`);
    const p = path.join(active.launchDir, 'launch.json');
    const launch = readJson(p);
    launch.phase = phase;
    launch.base_commit = head.stdout.trim();
    launch.lock_commit = head.stdout.trim();
    writeJson(p, launch);
  }
  return active;
}

function eventsText(active) {
  const p = path.join(active.launchDir, 'events.jsonl');
  return exists(p) ? readText(p) : '';
}

/** Runs one hook against the launch and returns the result with the events the run appended. */
function run(name, active, input) {
  const before = eventsText(active);
  const result = hook(name, input, { cwd: active.root, env: active.env });
  const after = eventsText(active);
  assert(after.startsWith(before), `${name}: the existing event lines are preserved`);
  const added = after.slice(before.length).split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
  return { result, added };
}

function assertSilentAllow(result, label) {
  assertExit(result, 0, `${label}: exit code`);
  assertEq(result.stdout, '', `${label}: stdout is empty (no decision)`);
}

function assertDeny(result, label) {
  assertExit(result, 0, `${label}: a guard exits 0 and answers on stdout`);
  assert(result.decision !== null, `${label}: stdout carries a JSON decision, got ${JSON.stringify(result.stdout)}`);
  const out = result.decision.hookSpecificOutput ?? {};
  assertEq(out.hookEventName, 'PreToolUse', `${label}: hookEventName`);
  assertEq(out.permissionDecision, 'deny', `${label}: permissionDecision`);
  return String(out.permissionDecisionReason ?? '');
}

const cases = [];

// ── lock-guard ───────────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/lock-guard.mjs denies an Edit of a locked path with a deny decision naming the path and appends lock_denied`,
  fn: () => {
    const active = launchIn(null);
    const { result, added } = run('lock-guard', active, editOf(active.root, LOCKED_FILE));
    const reason = assertDeny(result, 'locked target');
    assertIncludes(reason, LOCKED_FILE, 'the reason names the repository-relative path');
    assertIncludes(reason, 'report a wrong or unsatisfiable check instead of editing it', 'the reason tells the session to report the check');
    const denied = added.filter((e) => e.event === 'lock_denied');
    assertEq(denied.length, 1, 'one lock_denied event appended');
    assertEq(denied[0].detail?.path, LOCKED_FILE, 'lock_denied names the path');
    assertEq(denied[0].source, 'hook', 'lock_denied source');
  },
});

cases.push({
  id: `${HOOK_DIR}/lock-guard.mjs answers nothing on an Edit of a path that is not locked`,
  fn: () => {
    const active = launchIn(null);
    const { result, added } = run('lock-guard', active, editOf(active.root, INSIDE_FILE));
    assertSilentAllow(result, 'unlocked target');
    assertEq(added.length, 0, 'no event appended');
  },
});

// ── boundary-guard ───────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/boundary-guard.mjs denies an Edit outside the allowed paths in phase implement and appends boundary_denied`,
  fn: () => {
    const active = launchIn('implement');
    const { result, added } = run('boundary-guard', active, editOf(active.root, OUTSIDE_FILE));
    const reason = assertDeny(result, 'outside target');
    assertIncludes(reason, OUTSIDE_FILE, 'the reason names the repository-relative path');
    const denied = added.filter((e) => e.event === 'boundary_denied');
    assertEq(denied.length, 1, 'one boundary_denied event appended');
    assertEq(denied[0].detail?.path, OUTSIDE_FILE, 'boundary_denied names the path');
  },
});

cases.push({
  id: `${HOOK_DIR}/boundary-guard.mjs answers nothing on an Edit inside the allowed paths in phase implement`,
  fn: () => {
    const active = launchIn('implement');
    const { result, added } = run('boundary-guard', active, editOf(active.root, INSIDE_FILE));
    assertSilentAllow(result, 'inside target');
    assertEq(added.length, 0, 'no event appended');
  },
});

// ── structural-check ─────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/structural-check.mjs holds the turn with exit 2 and the check output on stderr after an Edit leaves a broken .mjs file`,
  fn: () => {
    const active = launchIn(null);
    writeText(path.join(active.root, 'src', 'export', 'broken.mjs'), 'export const broken = ;\n');
    const { result } = run('structural-check', active, postEditOf(active.root, 'src/export/broken.mjs'));
    assertExit(result, 2, 'a failing structural command');
    assertMatch(result.stderr, /SyntaxError/, 'stderr carries the output of node --check');
    assertEq(result.stdout, '', 'nothing on stdout');
  },
});

cases.push({
  id: `${HOOK_DIR}/structural-check.mjs stays silent with exit 0 after an Edit leaves a sound .mjs file`,
  fn: () => {
    const active = launchIn(null);
    writeText(path.join(active.root, 'src', 'export', 'sound.mjs'), 'export const sound = true;\n');
    const { result } = run('structural-check', active, postEditOf(active.root, 'src/export/sound.mjs'));
    assertSilentAllow(result, 'a passing structural command');
    assertEq(result.stderr, '', 'nothing on stderr');
  },
});

// ── stop-gate ────────────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/stop-gate.mjs blocks the Stop with exit 2 naming the red acceptance check in phase verify and appends stop_block`,
  fn: () => {
    const active = launchIn('verify');
    const mapFile = path.join(active.launchDir, 'specs', 'export-html', 'tests-map.v1.json');
    const map = readJson(mapFile);
    const t1 = map.checks.find((c) => c.id === 'T1');
    assert(t1, 'the pinned map carries T1');
    t1.command = 'sh -c "echo decisions-red; exit 3"';
    writeJson(mapFile, map);
    const { result, added } = run('stop-gate', active, envelope(active.root, 'Stop', { stop_reason: 'end_turn', stop_hook_active: false }));
    assertExit(result, 2, 'a red acceptance check');
    assertMatch(result.stderr, /\bT1 exit 3\b/, "stderr carries '<id> exit <code>'");
    assertIncludes(result.stderr, 'decisions-red', 'stderr carries the check output');
    const blocks = added.filter((e) => e.event === 'stop_block');
    assertEq(blocks.length, 1, 'one stop_block event appended');
    assertEq(blocks[0].detail?.count, 1, 'the running count starts at 1');
  },
});

cases.push({
  id: `${HOOK_DIR}/stop-gate.mjs lets the Stop through silently in phase implement, where no gate runs`,
  fn: () => {
    const active = launchIn('implement');
    const { result, added } = run('stop-gate', active, envelope(active.root, 'Stop', { stop_reason: 'end_turn', stop_hook_active: false }));
    assertSilentAllow(result, 'phase implement');
    assertEq(result.stderr, '', 'nothing on stderr');
    assertEq(added.length, 0, 'no event appended');
  },
});

// ── event-log ────────────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/event-log.mjs records SessionStart and announces the launch and its phase in a systemMessage`,
  fn: () => {
    const active = launchIn(null);
    const { result, added } = run('event-log', active, envelope(active.root, 'SessionStart', { mode: 'startup' }));
    assertExit(result, 0, 'event-log exit code');
    assert(result.decision !== null && typeof result.decision.systemMessage === 'string', `stdout carries a systemMessage, got ${JSON.stringify(result.stdout)}`);
    assertIncludes(result.decision.systemMessage, active.launch, 'the message names the launch');
    assertIncludes(result.decision.systemMessage, 'review', 'the message names the phase');
    assertIncludes(result.decision.systemMessage, 'FLIGHTCREW_LAUNCH=none', 'the message says how to opt the session out');
    assertEq(added.length, 1, 'one event line appended');
    assertEq(added[0].event, 'SessionStart', 'event name');
    assertEq(added[0].source, 'hook', 'event source');
    assertEq(added[0].session_id, 'sess-decisions', 'session_id from the envelope');
    assertEq(added[0].detail, { mode: 'startup' }, 'detail carries the envelope mode only');
  },
});

cases.push({
  id: `${HOOK_DIR}/event-log.mjs ignores a PreToolUse envelope with exit 0 and no event`,
  fn: () => {
    const active = launchIn(null);
    const { result, added } = run('event-log', active, editOf(active.root, INSIDE_FILE));
    assertSilentAllow(result, 'an unrecorded event');
    assertEq(added.length, 0, 'no event appended');
  },
});

// ── session-end ──────────────────────────────────────────────────────────────
cases.push({
  id: `${HOOK_DIR}/session-end.mjs exits 0 on SessionEnd and leaves the evidence page and report refreshed or a hooks.log line saying why not`,
  fn: () => {
    const active = launchIn(null);
    const evidencePage = path.join(active.launchDir, 'evidence.html');
    const report = path.join(active.launchDir, 'report.md');
    const hooksLog = path.join(active.launchDir, 'hooks.log');
    assert(!exists(evidencePage) && !exists(report), 'precondition: the sample launch has no evidence page or report');
    const { result } = run('session-end', active, envelope(active.root, 'SessionEnd', { reason: 'other' }));
    assertSilentAllow(result, 'SessionEnd');
    const log = exists(hooksLog) ? readText(hooksLog) : '';
    for (const [command, file] of [['evidence', evidencePage], ['report', report]]) {
      const explained = new RegExp(`session-end fc ${command} (did not complete|was skipped)`).test(log);
      assert(exists(file) || explained, `fc ${command} left neither its file nor a hooks.log line (hooks.log: ${JSON.stringify(log)})`);
    }
    assert(exists(evidencePage) || exists(report) || log !== '', 'the hook did something observable');
  },
});

cases.push({
  id: `${HOOK_DIR}/session-end.mjs does nothing on an envelope that is not SessionEnd`,
  fn: () => {
    const active = launchIn(null);
    const { result, added } = run('session-end', active, envelope(active.root, 'Stop', { stop_reason: 'end_turn' }));
    assertSilentAllow(result, 'a Stop envelope');
    assertEq(added.length, 0, 'no event appended');
    assert(!exists(path.join(active.launchDir, 'report.md')), 'no report rendered');
  },
});

await suite({ name: 'hooks-decisions', covers: ['B1', 'B2'] }, cases);
