// testbench/suites/hooks-stopgate/run.mjs — T7: stop-gate blocks the turn on a red acceptance check in phase verify (counting stop_block events), stalls and fires a trigger at min(ceilings.stop_blocks, 8), runs the contracts unit's checks plus fc boundary in phase contracts, does nothing in other phases, and releases while escalation.json exists. Covers B9, B10, B11, B40, B41.
// Usage: node flightdeck/testbench/suites/hooks-stopgate/run.mjs; exit 0 when every case passes, 2 otherwise.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, hook, fc, sh, mkActiveLaunch,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const MAP_REL = path.join('specs', 'export-html', 'tests-map.v1.json');

function stopEnvelope(root) {
  return {
    session_id: 'sess-testbench',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: 'Stop',
    stop_reason: 'end_turn',
    stop_hook_active: false,
    last_assistant_message: 'done',
  };
}

function launchPath(active) {
  return path.join(active.launchDir, 'launch.json');
}

function patchLaunch(active, fn) {
  const launch = readJson(launchPath(active));
  fn(launch);
  writeJson(launchPath(active), launch);
}

function setCheck(active, id, command, expect) {
  const p = path.join(active.launchDir, MAP_REL);
  const map = readJson(p);
  const check = map.checks.find((c) => c.id === id);
  if (!check) throw new Error(`no check ${id} in the pinned map`);
  check.command = command;
  if (expect !== undefined) check.baseline.expect = expect;
  writeJson(p, map);
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

function appendEvent(active, event, detail) {
  const line = { ts: new Date().toISOString(), event, launch: active.launch, phase: readJson(launchPath(active)).phase, source: 'fc', detail };
  fs.appendFileSync(path.join(active.launchDir, 'events.jsonl'), `${JSON.stringify(line)}\n`);
}

function head(root) {
  const result = sh('git rev-parse HEAD', { cwd: root });
  if (result.code !== 0) throw new Error(`git rev-parse failed: ${result.stderr}`);
  return result.stdout.trim();
}

// Sample launch moved to the given phase; commits pinned to the temporary repository so fc boundary has a real base.
function launchIn(phase) {
  const active = mkActiveLaunch();
  const sha = head(active.root);
  patchLaunch(active, (l) => {
    l.phase = phase;
    l.base_commit = sha;
    l.lock_commit = sha;
  });
  return active;
}

// Runs stop-gate once; returns the result and the events appended by the call.
function gate(active) {
  const before = eventsText(active);
  const result = hook('stop-gate', stopEnvelope(active.root), { cwd: active.root, env: active.env });
  const after = eventsText(active);
  assert(after.startsWith(before), 'existing event lines are preserved');
  return { result, added: parseEvents(after.slice(before.length)) };
}

function only(added, event) {
  return added.filter((e) => e.event === event);
}

function assertBlocked(run, id, code, count, label) {
  assertExit(run.result, 2, `${label}: exit code`);
  assertMatch(run.result.stderr, new RegExp(`\\b${id}\\b`), `${label}: stderr names ${id}`);
  if (code !== null) assertMatch(run.result.stderr, new RegExp(`\\b${id}\\b[^\\n]*\\bexit\\b[^\\n]*\\b${code}\\b`), `${label}: stderr names the exit code ${code}`);
  const blocks = only(run.added, 'stop_block');
  assertEq(blocks.length, 1, `${label}: exactly one stop_block appended`);
  assertEq(blocks[0].detail.count, count, `${label}: stop_block count`);
  assertIncludes(blocks[0].detail.checks ?? [], id, `${label}: stop_block names the failing check`);
  assertEq(only(run.added, 'stall').length, 0, `${label}: no stall`);
  assertEq(only(run.added, 'trigger').length, 0, `${label}: no trigger`);
}

function assertStalled(run, label) {
  assertExit(run.result, 0, `${label}: exit code`);
  assertEq(only(run.added, 'stall').length, 1, `${label}: one stall event`);
  assertEq(only(run.added, 'trigger').length, 1, `${label}: one trigger event`);
  assertEq(only(run.added, 'stop_block').length, 0, `${label}: no further stop_block`);
  assertMatch(run.result.stderr, /stall/i, `${label}: stderr reports the stall`);
}

function assertGreen(run, id, label) {
  assertExit(run.result, 0, `${label}: exit code`);
  assertEq(run.result.stdout, '', `${label}: stdout empty`);
  const runs = only(run.added, 'check_run');
  assert(runs.length >= 1, `${label}: a check_run event is appended`);
  assert(runs.some((e) => e.detail && e.detail.id === id && e.detail.verdict === 'pass'), `${label}: check_run records ${id} pass`);
  assertEq(only(run.added, 'stop_block').length, 0, `${label}: no stop_block`);
}

const RED_T1 = 'sh -c "echo boom; exit 3"';

const cases = [];

// ── B9: phase verify, red acceptance ─────────────────────────────────────────
cases.push({
  id: 'verify-red-blocks-with-id-code-and-output',
  covers: ['B9'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    const run = gate(active);
    assertBlocked(run, 'T1', 3, 1, 'first red run');
    assertIncludes(run.result.stderr, 'boom', 'stderr carries the check output');
  },
});

cases.push({
  id: 'verify-red-counts-consecutive-blocks',
  covers: ['B9', 'B10'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'block 1');
    assertBlocked(gate(active), 'T1', 3, 2, 'block 2');
    assertBlocked(gate(active), 'T1', 3, 3, 'block 3');
  },
});

cases.push({
  id: 'verify-red-last-twenty-lines',
  covers: ['B9'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', 'sh -c \'i=1; while [ $i -le 30 ]; do echo line$i; i=$((i+1)); done; exit 5\'');
    const run = gate(active);
    assertBlocked(run, 'T1', 5, 1, 'thirty-line red run');
    const lines = run.result.stderr.split('\n').map((l) => l.trim());
    for (const kept of ['line11', 'line30']) assertIncludes(lines, kept, `stderr keeps ${kept}`);
    assert(!lines.includes('line10'), 'stderr drops line10 (only the last 20 lines)');
  },
});

cases.push({
  id: 'verify-green-appends-check-run',
  covers: ['B9', 'B10'],
  fn: async () => {
    const active = launchIn('verify');
    assertGreen(gate(active), 'T1', 'shipped acceptance passes');
  },
});

cases.push({
  id: 'verify-green-resets-count',
  covers: ['B10'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'block 1');
    assertBlocked(gate(active), 'T1', 3, 2, 'block 2');
    setCheck(active, 'T1', 'node scripts/export-smoke.mjs');
    assertGreen(gate(active), 'T1', 'green run');
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'count restarts after a passing check_run');
  },
});

cases.push({
  id: 'verify-phase-or-gate-event-resets-count',
  covers: ['B10'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'block 1');
    assertBlocked(gate(active), 'T1', 3, 2, 'block 2');
    appendEvent(active, 'phase', { from: 'verify', to: 'verify', forced: true });
    assertBlocked(gate(active), 'T1', 3, 1, 'count restarts after a phase event');
    appendEvent(active, 'gate', { gate: 'G3', decision: 'approve', note: 'reset' });
    assertBlocked(gate(active), 'T1', 3, 1, 'count restarts after a gate event');
    appendEvent(active, 'escalation', { kind: 'blocked', detail: 'reset' });
    assertBlocked(gate(active), 'T1', 3, 1, 'count restarts after an escalation event');
  },
});

cases.push({
  id: 'verify-runs-only-the-acceptance-check',
  covers: ['B9'],
  fn: async () => {
    const active = launchIn('verify');
    const marker = path.join(active.launchDir, 'non-acceptance.marker');
    const p = path.join(active.launchDir, MAP_REL);
    const map = readJson(p);
    for (const check of map.checks) {
      if (check.id !== 'T1') check.command = `sh -c "touch ${marker}; exit 3"`;
    }
    writeJson(p, map);
    const run = gate(active);
    assertGreen(run, 'T1', 'only the acceptance check runs in phase verify');
    assert(!exists(marker), 'no check other than the acceptance check ran');
    assertEq(only(run.added, 'check_run').length, 1, 'one check_run event, for the acceptance check alone');
  },
});

// ── B10: stall at the cap ─────────────────────────────────────────────────────
cases.push({
  id: 'stall-at-stop-blocks-ceiling',
  covers: ['B10'],
  fn: async () => {
    const active = launchIn('verify');
    patchLaunch(active, (l) => { l.ceilings.stop_blocks = 3; });
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'block 1');
    assertBlocked(gate(active), 'T1', 3, 2, 'block 2');
    const stalled = gate(active);
    assertStalled(stalled, 'third red run at cap 3');
    const events = parseEvents(eventsText(active));
    const newestTrigger = events.filter((e) => e.event === 'trigger').pop();
    const newestGate = events.filter((e) => ['gate', 'escalation', 'launch_end'].includes(e.event)).pop();
    assert(newestTrigger && (!newestGate || newestTrigger.ts >= newestGate.ts), 'the trigger is now the newest of trigger, gate, escalation and launch_end');
  },
});

cases.push({
  id: 'stall-at-cap-eight',
  covers: ['B10'],
  fn: async () => {
    const active = launchIn('verify');
    patchLaunch(active, (l) => { l.ceilings.stop_blocks = 8; });
    setCheck(active, 'T1', 'sh -c "exit 1"');
    for (let n = 1; n <= 7; n += 1) assertBlocked(gate(active), 'T1', 1, n, `block ${n}`);
    assertStalled(gate(active), 'eighth red run at cap 8');
  },
});

// ── B11: other phases ─────────────────────────────────────────────────────────
cases.push({
  id: 'other-phases-no-op',
  covers: ['B11'],
  fn: async () => {
    for (const phase of ['targets', 'plan', 'implement', 'review', 'report', 'ended']) {
      const active = launchIn(phase);
      const marker = path.join(active.root, 'flightdeck', 'launch', active.launch, `ran-${phase}.marker`);
      setCheck(active, 'T1', `sh -c "touch ${marker}; exit 3"`);
      const map = readJson(path.join(active.launchDir, MAP_REL));
      for (const check of map.checks) check.command = `sh -c "touch ${marker}; exit 3"`;
      writeJson(path.join(active.launchDir, MAP_REL), map);
      const run = gate(active);
      assertExit(run.result, 0, `phase ${phase}: exit code`);
      assertEq(run.result.stdout, '', `phase ${phase}: stdout empty`);
      assertEq(run.added, [], `phase ${phase}: no event appended`);
      assert(!exists(marker), `phase ${phase}: no check ran`);
    }
  },
});

// ── B40: phase contracts ──────────────────────────────────────────────────────
cases.push({
  id: 'contracts-green-appends-check-run',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    assertGreen(gate(active), 'T3', 'W0 unit checks pass and the boundary is clean');
  },
});

cases.push({
  id: 'contracts-runs-only-w0-checks',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    setCheck(active, 'T1', RED_T1);
    setCheck(active, 'T2', RED_T1);
    assertGreen(gate(active), 'T3', 'a red non-W0 check does not block the contracts gate');
  },
});

cases.push({
  id: 'contracts-red-w0-check-blocks',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    setCheck(active, 'T3', 'sh -c "echo contract broken; exit 4"');
    const run = gate(active);
    assertBlocked(run, 'T3', 4, 1, 'red W0 check');
    assertIncludes(run.result.stderr, 'contract broken', 'stderr carries the check output');
  },
});

cases.push({
  id: 'contracts-error-verdict-blocks',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    setCheck(active, 'T3', 'no-such-binary-for-flightcrew-tests --check');
    const run = gate(active);
    assertExit(run.result, 2, 'a check with verdict error blocks');
    assertMatch(run.result.stderr, /\bT3\b/, 'stderr names T3');
    assertEq(only(run.added, 'stop_block').length, 1, 'one stop_block appended');
  },
});

cases.push({
  id: 'contracts-expected-failure-does-not-block',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    setCheck(active, 'T3', 'sh -c "echo not built yet; exit 1"', 'fail: the contract is not yet implemented');
    const run = gate(active);
    assertExit(run.result, 0, 'a failing check whose baseline expects failure does not block');
    assertEq(only(run.added, 'stop_block').length, 0, 'no stop_block');
  },
});

cases.push({
  id: 'contracts-boundary-red-blocks',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    writeText(path.join(active.root, 'scripts', 'stray.mjs'), 'export const stray = true;\n');
    const run = gate(active);
    assertExit(run.result, 2, 'a boundary violation blocks the contracts gate');
    assertMatch(run.result.stderr, /boundary/i, 'stderr names the boundary');
    assertEq(only(run.added, 'stop_block').length, 1, 'one stop_block appended');
  },
});

cases.push({
  id: 'contracts-no-contracts-falls-back-to-t1',
  covers: ['B40'],
  fn: async () => {
    const active = launchIn('contracts');
    const planPath = path.join(active.launchDir, 'plan.json');
    const plan = readJson(planPath);
    plan.waves = plan.waves.filter((w) => w.id !== 'W0');
    plan.units = plan.units.filter((u) => u.id !== 'U0').map((u) => ({ ...u, depends_on: u.depends_on.filter((d) => d !== 'U0') }));
    plan.no_contracts = { reason: 'the interfaces already exist in the sample project' };
    writeJson(planPath, plan);
    setCheck(active, 'T3', RED_T1);
    assertGreen(gate(active), 'T1', 'T1 stands in for the contracts unit');
    setCheck(active, 'T1', RED_T1);
    assertBlocked(gate(active), 'T1', 3, 1, 'red T1 under no_contracts');
  },
});

// ── B41: escalation releases the gate ────────────────────────────────────────
cases.push({
  id: 'escalation-file-releases-stop-gate',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    writeJson(path.join(active.launchDir, 'escalation.json'), { kind: 'wrong-check', detail: 'T1 contradicts B1', at: new Date().toISOString() });
    const run = gate(active);
    assertExit(run.result, 0, 'released while escalation.json exists');
    assertEq(run.result.stdout, '', 'stdout empty');
    assertEq(only(run.added, 'stop_release').length, 1, 'one stop_release appended');
    assertEq(only(run.added, 'stop_block').length, 0, 'no stop_block while escalated');
    fs.rmSync(path.join(active.launchDir, 'escalation.json'));
    assertBlocked(gate(active), 'T1', 3, 1, 'the gate holds again once the file is gone');
  },
});

cases.push({
  id: 'escalation-file-releases-contracts-gate',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('contracts');
    setCheck(active, 'T3', RED_T1);
    writeJson(path.join(active.launchDir, 'escalation.json'), { kind: 'blocked', detail: 'waiting on a human', at: new Date().toISOString() });
    const run = gate(active);
    assertExit(run.result, 0, 'released in phase contracts');
    assertEq(only(run.added, 'stop_release').length, 1, 'one stop_release appended');
  },
});

cases.push({
  id: 'fc-escalate-writes-file-and-event',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('verify');
    setCheck(active, 'T1', RED_T1);
    const before = parseEvents(eventsText(active)).length;
    const result = fc(['launch', 'escalate', 'spec-gap', '--detail', 'B1 says html, the fixture says xhtml'], { cwd: active.root, env: active.env });
    assertExit(result, 0, 'fc launch escalate');
    const file = path.join(active.launchDir, 'escalation.json');
    assert(exists(file), 'escalation.json written');
    const escalation = readJson(file);
    assertEq(escalation.kind, 'spec-gap', 'escalation.json records the kind');
    assertIncludes(escalation.detail, 'xhtml', 'escalation.json records the detail');
    const events = parseEvents(eventsText(active));
    const appended = events.slice(before).filter((e) => e.event === 'escalation');
    assertEq(appended.length, 1, 'one escalation event appended');
    assertEq(appended[0].detail.kind, 'spec-gap', 'escalation event carries the kind');
    const run = gate(active);
    assertExit(run.result, 0, 'stop-gate released by fc launch escalate');
    assertEq(only(run.added, 'stop_release').length, 1, 'stop_release appended');
  },
});

cases.push({
  id: 'fc-gate-removes-escalation',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('verify');
    assertExit(fc(['launch', 'escalate', 'blocked', '--detail', 'waiting'], { cwd: active.root, env: active.env }), 0, 'fc launch escalate');
    assert(exists(path.join(active.launchDir, 'escalation.json')), 'escalation.json present');
    assertExit(fc(['launch', 'gate', 'G3', 'exit', '--note', 'stopping here'], { cwd: active.root, env: active.env }), 0, 'fc launch gate G3 exit');
    assert(!exists(path.join(active.launchDir, 'escalation.json')), 'fc launch gate removed escalation.json');
  },
});

cases.push({
  id: 'fc-phase-removes-escalation',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('report');
    assertExit(fc(['launch', 'escalate', 'halt', '--detail', 'halting'], { cwd: active.root, env: active.env }), 0, 'fc launch escalate');
    assert(exists(path.join(active.launchDir, 'escalation.json')), 'escalation.json present');
    assertExit(fc(['launch', 'phase', 'ended'], { cwd: active.root, env: active.env }), 0, 'fc launch phase ended');
    assert(!exists(path.join(active.launchDir, 'escalation.json')), 'fc launch phase removed escalation.json');
  },
});

cases.push({
  id: 'fc-end-removes-escalation',
  covers: ['B41'],
  fn: async () => {
    const active = launchIn('verify');
    assertExit(fc(['launch', 'escalate', 'trigger', '--detail', 'abandon trigger fired'], { cwd: active.root, env: active.env }), 0, 'fc launch escalate');
    assert(exists(path.join(active.launchDir, 'escalation.json')), 'escalation.json present');
    assertExit(fc(['launch', 'end', 'abandoned', '--at', 'verify'], { cwd: active.root, env: active.env }), 0, 'fc launch end abandoned');
    assert(!exists(path.join(active.launchDir, 'escalation.json')), 'fc launch end removed escalation.json');
  },
});

await suite('hooks-stopgate', cases);
