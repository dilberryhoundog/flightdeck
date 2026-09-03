// testbench/suites/hook-timing/run.mjs — T25: every hook, spawned with a minimal envelope against an active copy of the sample launch, exits within 2000 ms wall-clock (best of three), and the settings fragment gives the Stop hook entry timeout 600. Covers C4.
// Usage: node flightdeck/testbench/suites/hook-timing/run.mjs; exit 0 when every case passes, 2 otherwise.

import path from 'node:path';
import {
  suite, hook, mkActiveLaunch, HOOKS,
  readJson, writeJson, writeText, exists,
  assert, assertEq, assertExit,
} from '../../lib/suite-lib.mjs';

const LIMIT_MS = 2000;
const RUNS = 3;

function envelope(root, event, extra = {}) {
  return {
    session_id: 'sess-testbench',
    transcript_path: path.join(root, 'transcript.jsonl'),
    cwd: root,
    permission_mode: 'acceptEdits',
    hook_event_name: event,
    ...extra,
  };
}

function minimalEnvelope(root, name) {
  switch (name) {
    case 'event-log':
      return envelope(root, 'SessionStart', { mode: 'startup' });
    case 'lock-guard':
      return envelope(root, 'PreToolUse', { tool_name: 'Edit', tool_use_id: 'toolu_t', tool_input: { file_path: path.join(root, 'src', 'export', 'index.mjs'), old_string: 'a', new_string: 'b' } });
    case 'boundary-guard':
      return envelope(root, 'PreToolUse', { tool_name: 'Edit', tool_use_id: 'toolu_t', tool_input: { file_path: path.join(root, 'src', 'export', 'index.mjs'), old_string: 'a', new_string: 'b' } });
    case 'structural-check':
      return envelope(root, 'PostToolUse', { tool_name: 'Edit', tool_use_id: 'toolu_t', tool_input: { file_path: path.join(root, 'src', 'export', 'timing.mjs') }, tool_result: { success: true } });
    case 'stop-gate':
      return envelope(root, 'Stop', { stop_reason: 'end_turn', stop_hook_active: false });
    case 'session-end':
      return envelope(root, 'SessionEnd', { reason: 'other' });
    default:
      throw new Error(`unknown hook ${name}`);
  }
}

// Active sample launch in phase verify, so stop-gate runs the acceptance check and every hook does its real work.
function timingLaunch() {
  const active = mkActiveLaunch();
  const p = path.join(active.launchDir, 'launch.json');
  const launch = readJson(p);
  launch.phase = 'verify';
  writeJson(p, launch);
  writeText(path.join(active.root, 'src', 'export', 'timing.mjs'), 'export const timing = true;\n');
  return active;
}

const cases = [];

for (const name of ['event-log', 'lock-guard', 'boundary-guard', 'structural-check', 'stop-gate', 'session-end']) {
  cases.push({
    id: `${name}-under-2000ms`,
    covers: ['C4'],
    fn: async () => {
      assert(exists(path.join(HOOKS, `${name}.mjs`)), `hook script ${name}.mjs exists`);
      const active = timingLaunch();
      const timings = [];
      for (let i = 0; i < RUNS; i += 1) {
        const started = process.hrtime.bigint();
        const result = hook(name, minimalEnvelope(active.root, name), { cwd: active.root, env: active.env });
        const elapsed = Number(process.hrtime.bigint() - started) / 1e6;
        assertExit(result, 0, `${name} run ${i + 1}`);
        timings.push(elapsed);
      }
      const best = Math.min(...timings);
      assert(best < LIMIT_MS, `${name}: best of ${RUNS} runs is ${best.toFixed(0)} ms (limit ${LIMIT_MS} ms; runs ${timings.map((t) => t.toFixed(0)).join(', ')})`);
    },
  });
}

cases.push({
  id: 'settings-fragment-stop-timeout-600',
  covers: ['C4'],
  fn: async () => {
    const fragmentPath = path.join(HOOKS, 'settings.fragment.json');
    assert(exists(fragmentPath), 'hooks/settings.fragment.json exists');
    const fragment = readJson(fragmentPath);
    assert(fragment.hooks && Array.isArray(fragment.hooks.Stop), 'the fragment declares a Stop hook list');
    const stopEntries = fragment.hooks.Stop.flatMap((group) => (Array.isArray(group.hooks) ? group.hooks : []));
    const stopGate = stopEntries.filter((entry) => entry.type === 'command' && typeof entry.command === 'string' && entry.command.includes('stop-gate.mjs'));
    assertEq(stopGate.length, 1, 'exactly one Stop command runs stop-gate.mjs');
    assertEq(stopGate[0].timeout, 600, 'the stop-gate Stop entry declares timeout 600');
    assert(stopGate[0].command.includes('$CLAUDE_PROJECT_DIR') || stopGate[0].command.includes('${CLAUDE_PROJECT_DIR}'), 'the command runs the hook in place through $CLAUDE_PROJECT_DIR');
  },
});

await suite('hook-timing', cases);
