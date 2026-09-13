#!/usr/bin/env node
// suites/hook-check-after-edit — check-after-edit: the unit checks it runs after a building role writes, the failing ids it prints, and the exit that never blocks. Covers B91.
import fs from 'node:fs';
import path from 'node:path';
import { assert, assertEq, assertMatch, coreHook, exists, mkCoreLaunch, postToolUse, readJson, suite, writeText } from '../../lib/core-lib.mjs';

const after = (made, extra = {}) =>
  coreHook('check-after-edit', postToolUse('Edit', path.join(made.root, 'src', 'export', 'index.mjs'), { agent_id: 'w1', agent_type: 'implementer', ...extra }), {
    cwd: made.root,
    env: { CLAUDE_PROJECT_DIR: made.root },
  });

/** The fixture launch with exactly one dispatch standing, for the unit named. */
function dispatchedFor(unit) {
  const made = mkCoreLaunch();
  for (const name of fs.readdirSync(path.join(made.runDir, 'dispatches'))) {
    fs.rmSync(path.join(made.runDir, 'dispatches', name), { force: true });
  }
  writeText(path.join(made.runDir, 'dispatches', `implementer-${unit}.md`), `implementer · ${unit}\n\n## Target\n\n${unit}\n`);
  return made;
}

await suite('hook-check-after-edit', [
  {
    id: 'B91 a red unit prints its failing ids on stderr and exits 0',
    covers: ['B91'],
    fn: () => {
      const made = dispatchedFor('U2');
      const result = after(made);
      assertEq(result.code, 0, `the hook never blocks: ${result.stderr}`);
      assertMatch(result.stderr, /T2/, 'the failing id is printed');
      assertMatch(result.stderr, /T7/, 'every failing id is printed');
    },
  },
  {
    id: 'B91 a green unit prints no failing id and exits 0',
    covers: ['B91'],
    fn: () => {
      const made = dispatchedFor('U1');
      const result = after(made);
      assertEq(result.code, 0, 'exit 0');
      assert(!/T\d+/.test(result.stderr), `nothing is printed when the unit is green: ${result.stderr}`);
    },
  },
  {
    id: 'B91 the unit checks really ran',
    covers: ['B91'],
    fn: () => {
      const made = dispatchedFor('U2');
      after(made);
      for (const id of ['T2', 'T7']) {
        assert(exists(path.join(made.runDir, 'evidence', `${id}.json`)), `${id} left evidence`);
      }
      assertEq(readJson(path.join(made.runDir, 'evidence', 'T2.json')).verdict, 'fail', 'T2 failed');
    },
  },
  {
    id: 'B91 a write is answered like an edit',
    covers: ['B91'],
    fn: () => {
      const made = dispatchedFor('U2');
      const result = coreHook('check-after-edit', postToolUse('Write', path.join(made.root, 'src', 'export', 'index.mjs'), { agent_id: 'w1', agent_type: 'implementer' }), {
        cwd: made.root,
        env: { CLAUDE_PROJECT_DIR: made.root },
      });
      assertEq(result.code, 0, 'exit 0');
      assertMatch(result.stderr, /T2/, 'the failing id is printed after a Write too');
    },
  },
  {
    id: 'B91 with no unit to be found the hook still exits 0 and blocks nothing',
    covers: ['B91'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const name of fs.readdirSync(path.join(made.runDir, 'dispatches'))) fs.rmSync(path.join(made.runDir, 'dispatches', name), { force: true });
      for (const name of fs.readdirSync(path.join(made.runDir, 'returns'))) fs.rmSync(path.join(made.runDir, 'returns', name), { force: true });
      const result = after(made);
      assertEq(result.code, 0, 'a hook that informs never blocks');
    },
  },
]);
