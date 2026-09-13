#!/usr/bin/env node
// suites/hook-worker-gate — the SubagentStop gate in the worker frontmatter: the block on a red unit, the pass on a green one, the stall on the fifth consecutive block, and the refusal when it cannot find the checks. Covers B78, B79, B80, E5.
import fs from 'node:fs';
import path from 'node:path';
import {
  CORE_HOOKS, CREW, assert, assertEq, assertMatch, coreHook, exists, fenced, mkCoreLaunch, readEvents,
  readJson, readText, subagentStop, suite, writeJson, writeText,
} from '../../lib/core-lib.mjs';

/**
 * The gate script the implementer's own frontmatter wires for SubagentStop. The role file is the source of truth (I6);
 * hooks/worker-gate.mjs is the fallback so the case reports a missing gate rather than a missing role file.
 */
function gateScript() {
  const file = path.join(CREW, 'implementer.md');
  if (exists(file)) {
    const names = [...readText(file).matchAll(/hooks\/([\w-]+)\.mjs/g)].map((m) => m[1]);
    const gate = names.find((name) => name.includes('gate'));
    if (gate) return gate;
  }
  return 'worker-gate';
}

const NAME = gateScript();
const gate = (made, envelope) => coreHook(NAME, envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const events = (made) => readEvents(path.join(made.runDir, 'events.jsonl'));

const workerReturn = (unit, status = 'red') => ({
  unit,
  status,
  branch: `sample-core/${unit}`,
  worktree: `.worktrees/${unit}`,
  spec_refs: ['B1'],
  checks: [],
  artefacts: [],
  commits: [],
  iterations: 1,
  halt: null,
  notes: 'ready',
});

await suite('hook-worker-gate', [
  {
    id: 'B78 a red unit blocks the stop, exit 2, with the failing ids on stderr',
    covers: ['B78'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'red-1' }));
      assertEq(result.code, 2, `a red unit blocks: ${result.stdout}${result.stderr}`);
      assertMatch(result.stderr, /T2/, 'the stderr names the failing check');
      assertMatch(result.stderr, /T7/, 'the stderr names every failing check');
    },
  },
  {
    id: 'B78 the failing output reaches the worker, at most twenty lines per check',
    covers: ['B78'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(
        path.join(made.runDir, 'checks', 'noisy.sh'),
        '#!/bin/sh\ni=1\nwhile [ $i -le 40 ]; do echo "line $i"; i=$((i+1)); done\nexit 2\n',
      );
      fs.chmodSync(path.join(made.runDir, 'checks', 'noisy.sh'), 0o755);
      const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
      const map = readJson(file);
      map.checks.find((c) => c.id === 'T2').command = 'sh {run}/checks/noisy.sh';
      map.checks.find((c) => c.id === 'T7').command = 'sh {run}/checks/ok.sh';
      writeJson(file, map);
      const result = gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'red-2' }));
      assertEq(result.code, 2, 'still blocked');
      assertMatch(result.stderr, /line 40/, 'the last output line of the failing check is shown');
      assert(!result.stderr.includes('line 20\n'), 'more than the last twenty lines are not shown');
      assert(!result.stderr.includes('line 1\n'), 'the first line of a forty-line failure is not shown');
    },
  },
  {
    id: 'B78 the block appends exactly one stop_block event naming the unit',
    covers: ['B78'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'red-3' }));
      const after = events(made);
      assertEq(after.length, before + 1, 'exactly one event per gate run');
      assertEq(after.at(-1).event, 'stop_block', 'the event name');
      assertEq(after.at(-1).detail.unit, 'U2', 'the event names the unit');
    },
  },
  {
    id: 'B79 a green unit lets the stop through, exit 0, with a check_run event',
    covers: ['B79'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      const result = gate(made, subagentStop('implementer', fenced(workerReturn('U1', 'green')), { agent_id: 'green-1' }));
      assertEq(result.code, 0, `a green unit passes the gate: ${result.stdout}${result.stderr}`);
      const after = events(made);
      assertEq(after.length, before + 1, 'exactly one event per gate run');
      assertEq(after.at(-1).event, 'check_run', 'the event name');
    },
  },
  {
    id: 'B80 the fifth consecutive block for one agent writes stalled instead and exits 0',
    covers: ['B80'],
    fn: () => {
      const made = mkCoreLaunch();
      const codes = [];
      for (let i = 0; i < 5; i += 1) {
        codes.push(gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'stalling' })).code);
      }
      assertEq(codes.slice(0, 4), [2, 2, 2, 2], 'the first four block');
      assertEq(codes[4], 0, 'the fifth lets the worker return');
      const written = events(made).filter((e) => ['stop_block', 'stalled'].includes(e.event));
      assertEq(written.map((e) => e.event), ['stop_block', 'stop_block', 'stop_block', 'stop_block', 'stalled'], 'the fifth event is stalled in place of a stop_block');
      const stalled = written.at(-1);
      assertEq(stalled.detail.unit, 'U2', 'the stalled event names the unit');
      assertMatch(JSON.stringify(stalled.detail), /T2/, 'the stalled event names the failing check ids');
    },
  },
  {
    id: 'B80 the count is per agent_id and a check_run between resets it',
    covers: ['B80'],
    fn: () => {
      const made = mkCoreLaunch();
      for (let i = 0; i < 3; i += 1) gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'agent-a' }));
      gate(made, subagentStop('implementer', fenced(workerReturn('U1', 'green')), { agent_id: 'agent-a' }));
      for (let i = 0; i < 3; i += 1) gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'agent-a' }));
      const written = events(made).filter((e) => ['stop_block', 'stalled', 'check_run'].includes(e.event));
      assert(!written.some((e) => e.event === 'stalled'), 'a check_run between blocks resets the count');
      const other = gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'agent-b' }));
      assertEq(other.code, 2, "another agent's first block is a block, not a stall");
    },
  },
  {
    id: 'E5 a return naming no unit and a dispatch naming none exits 2 and appends a stop_block',
    covers: ['E5'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      const result = gate(made, subagentStop('implementer', 'I am done, with no fenced return at all.', { agent_id: 'no-unit' }));
      assertEq(result.code, 2, 'the gate refuses rather than permits');
      assert(result.stderr.trim() !== '', 'the reason is on stderr');
      const after = events(made);
      assertEq(after.length, before + 1, 'exactly one event');
      assertEq(after.at(-1).event, 'stop_block', 'a stop_block is appended');
    },
  },
  {
    id: 'E5 no pinned map exits 2 naming the reason',
    covers: ['E5'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'launch.json');
      writeJson(file, { ...readJson(file), tests_map: null });
      const result = gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'no-map' }));
      assertEq(result.code, 2, 'the gate refuses');
      assertMatch(result.stderr, /map|checks/i, 'the reason names what it could not find');
      assertEq(events(made).at(-1).event, 'stop_block', 'a stop_block is appended');
    },
  },
  {
    id: 'E5 an unreadable map exits 2 naming the reason',
    covers: ['E5'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.launchDir, 'specs', 'tests-map.v1.json'), '{ this is not json\n');
      const result = gate(made, subagentStop('implementer', fenced(workerReturn('U2')), { agent_id: 'bad-map' }));
      assertEq(result.code, 2, 'the gate refuses');
      assertMatch(result.stderr, /tests-map/, 'the reason names the file');
      assertEq(events(made).at(-1).event, 'stop_block', 'a stop_block is appended');
    },
  },
]);
