#!/usr/bin/env node
// suites/hook-boundary-guard — boundary-guard: the deny for a target outside the frozen plan's allowed paths, and the silence for one inside them or under the run folder. Covers B77.
import path from 'node:path';
import { WRITE_TOOLS, assert, assertEq, assertMatch, coreHook, denied, denyReason, mkCoreLaunch, preToolUse, readJson, suite, writeJson } from '../../lib/core-lib.mjs';

const guard = (envelope, made) => coreHook('boundary-guard', envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('hook-boundary-guard', [
  {
    id: 'B77 a target outside every unit path of the frozen plan is denied and named',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = guard(preToolUse('Write', path.join(made.root, 'scripts', 'export-smoke.mjs')), made);
      assert(denied(result), 'a file outside the plan paths is denied');
      assertMatch(denyReason(result), /scripts\/export-smoke\.mjs/, 'the reason names the file');
    },
  },
  {
    id: 'B77 the three write tools are denied alike',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const tool of WRITE_TOOLS) {
        const result = guard(preToolUse(tool, path.join(made.root, 'README.md'), { tool_input: { content: 'x' } }), made);
        assert(denied(result), `${tool} outside the plan paths is denied`);
      }
    },
  },
  {
    id: 'B77 a target inside a unit path draws nothing',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = guard(preToolUse('Edit', path.join(made.root, 'src', 'export', 'index.mjs')), made);
      assert(!denied(result), 'a file inside the plan paths is allowed');
      assertEq(result.stdout.trim(), '', 'nothing is printed');
    },
  },
  {
    id: 'B77 a target under the run folder draws nothing',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const target of [
        path.join(made.runDir, 'returns', 'implementer-U1.json'),
        path.join(made.runDir, 'evidence', 'T1.json'),
        path.join(made.runDir, 'dispatches', 'implementer-U1.md'),
      ]) {
        const result = guard(preToolUse('Write', target), made);
        assert(!denied(result), `${path.basename(target)} under the run folder is allowed`);
      }
    },
  },
  {
    id: 'B77 with the plan still draft the guard says nothing',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'plan.json');
      const plan = readJson(file);
      delete plan.commit;
      writeJson(file, { ...plan, status: 'draft' });
      const result = guard(preToolUse('Write', path.join(made.root, 'scripts', 'export-smoke.mjs')), made);
      assert(!denied(result), 'a draft plan holds no boundary');
      assertEq(result.stdout.trim(), '', 'nothing is printed');
    },
  },
  {
    id: 'B77 widening the plan paths widens what is allowed',
    covers: ['B77'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'plan.json');
      const plan = readJson(file);
      plan.units = plan.units.map((unit) => (unit.id === 'U1' ? { ...unit, paths: [...unit.paths, 'scripts/**'] } : unit));
      writeJson(file, plan);
      const result = guard(preToolUse('Write', path.join(made.root, 'scripts', 'export-smoke.mjs')), made);
      assert(!denied(result), 'the boundary is read from the plan, not hardcoded');
    },
  },
]);
