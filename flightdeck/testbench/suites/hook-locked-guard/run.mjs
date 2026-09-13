#!/usr/bin/env node
// suites/hook-locked-guard — locked-guard: the deny for a locked path, a depends_on path or anything under the run's checks folder, and the silence for everything else. Covers B76.
import path from 'node:path';
import { WRITE_TOOLS, assert, assertEq, assertMatch, coreHook, denied, denyReason, mkCoreLaunch, preToolUse, readJson, suite, writeJson } from '../../lib/core-lib.mjs';

const guard = (envelope, made) => coreHook('locked-guard', envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('hook-locked-guard', [
  {
    id: 'B76 a file matching a locked_paths glob of the pinned map is denied',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = guard(preToolUse('Edit', path.join(made.root, 'tests', 'export', 'behaviours.test.mjs')), made);
      assert(denied(result), 'a locked_paths file is denied');
      assertMatch(denyReason(result), /tests\/export\/behaviours\.test\.mjs/, 'the reason names the file');
    },
  },
  {
    id: 'B76 the three write tools are denied alike',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const tool of WRITE_TOOLS) {
        const result = guard(preToolUse(tool, path.join(made.root, 'tests', 'export', 'contract.test.mjs'), { tool_input: { content: 'x' } }), made);
        assert(denied(result), `${tool} at a locked path is denied`);
      }
    },
  },
  {
    id: 'B76 a depends_on path of a check is denied',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
      const map = readJson(file);
      map.locked_paths = ['flightdeck/launch/sample-core/specs/**'];
      map.checks.find((c) => c.id === 'T1').depends_on = ['src/export/fixtures/**'];
      writeJson(file, map);
      const result = guard(preToolUse('Write', path.join(made.root, 'src', 'export', 'fixtures', 'shape.json')), made);
      assert(denied(result), 'a depends_on path is denied even when locked_paths does not name it');
      assertMatch(denyReason(result), /shape\.json/, 'the reason names the file');
    },
  },
  {
    id: 'B76 anything under the run checks folder is denied',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const target of [path.join(made.runDir, 'checks', 'ok.sh'), path.join(made.runDir, 'checks', 'rubrics', 'T5.md'), path.join(made.runDir, 'checks', 'new-check.mjs')]) {
        const result = guard(preToolUse('Write', target), made);
        assert(denied(result), `${path.basename(target)} under runs/run-1/checks/ is denied`);
      }
    },
  },
  {
    id: 'B76 a target outside the locked set draws nothing at all',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const target of [
        path.join(made.root, 'src', 'export', 'index.mjs'),
        path.join(made.root, 'README.md'),
        path.join(made.runDir, 'returns', 'implementer-U1.json'),
        path.join(made.runDir, 'evidence', 'T1.json'),
      ]) {
        const result = guard(preToolUse('Edit', target), made);
        assert(!denied(result), `${path.basename(target)} is not denied`);
        assertEq(result.stdout.trim(), '', `nothing is printed for ${path.basename(target)}`);
      }
    },
  },
  {
    id: 'B76 with no map pinned the guard says nothing',
    covers: ['B76'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'launch.json');
      writeJson(file, { ...readJson(file), tests_map: null });
      const result = guard(preToolUse('Edit', path.join(made.root, 'tests', 'export', 'behaviours.test.mjs')), made);
      assert(!denied(result), 'with no pinned map there is no locked set to enforce');
      assertEq(result.stdout.trim(), '', 'nothing is printed');
    },
  },
]);
