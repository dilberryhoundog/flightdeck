#!/usr/bin/env node
// suites/hook-frozen-guard — frozen-guard: the deny it prints for a frozen document whatever the launch state, and what it leaves alone. Covers B7, E3, C11.
import path from 'node:path';
import {
  CORE_HOOKS, WRITE_TOOLS, assert, assertEq, assertMatch, coreHook, denied, denyReason, exists, git,
  mkCoreLaunch, mkCoreLaunchNoControlCentre, preToolUse, readJson, readText, suite, tmp, writeJson, writeText,
} from '../../lib/core-lib.mjs';
import fs from 'node:fs';

const guard = (envelope, made) => coreHook('frozen-guard', envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const rel = (made, ...parts) => path.posix.join('flightdeck', 'launch', made.launch, ...parts);

await suite('hook-frozen-guard', [
  {
    id: 'B7 an Edit, a Write and a NotebookEdit at a frozen document are each denied, with the file named',
    covers: ['B7'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const tool of WRITE_TOOLS) {
        const target = path.join(made.launchDir, 'specs', 'spec.v1.json');
        const result = guard(preToolUse(tool, target, { tool_input: { old_string: 'frozen', new_string: 'draft', content: '{}' } }), made);
        assert(denied(result), `${tool} at a frozen spec is denied`);
        assertMatch(denyReason(result), /spec\.v1\.json/, `the ${tool} reason names the file`);
      }
    },
  },
  {
    id: 'B7 a frozen tests map and a frozen plan are denied alike',
    covers: ['B7'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const target of [path.join(made.launchDir, 'specs', 'tests-map.v1.json'), path.join(made.runDir, 'plan.json')]) {
        const result = guard(preToolUse('Edit', target), made);
        assert(denied(result), `an edit at ${path.basename(target)} is denied`);
      }
    },
  },
  {
    id: 'C11 the decision is read from the file, not from the launch: a draft document is left alone',
    covers: ['C11', 'B7'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'specs', 'spec.v1.json');
      const spec = readJson(file);
      delete spec.commit;
      writeJson(file, { ...spec, status: 'draft' });
      const result = guard(preToolUse('Edit', file), made);
      assert(!denied(result), 'a draft document is not denied');
      assertEq(result.stdout.trim(), '', 'nothing is printed for a draft');
    },
  },
  {
    id: 'C11 a frozen JSON file outside every launch is denied all the same',
    covers: ['C11'],
    fn: () => {
      const made = mkCoreLaunch();
      const stray = path.join(made.root, 'notes', 'anything.json');
      writeJson(stray, { status: 'frozen', commit: 'a1b2c3d', note: 'not in a launch at all' });
      const result = guard(preToolUse('Edit', stray), made);
      assert(denied(result), 'a frozen file anywhere is denied');
      assertMatch(denyReason(result), /anything\.json/, 'the reason names the file');
    },
  },
  {
    id: 'C11 no freeze depends on a run: the same file is denied with the record naming no run',
    covers: ['C11', 'B7'],
    fn: () => {
      const made = mkCoreLaunch();
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      writeJson(path.join(made.launchDir, 'launch.json'), { ...record, current_run: null, tests_map: null });
      const result = guard(preToolUse('Edit', path.join(made.launchDir, 'specs', 'spec.v1.json')), made);
      assert(denied(result), 'the deny does not depend on a run being in progress');
    },
  },
  {
    id: 'B7 with flightdeck/.controlcenter absent the deny still stands',
    covers: ['B7'],
    fn: () => {
      const made = mkCoreLaunchNoControlCentre();
      assert(!exists(path.join(made.root, 'flightdeck', '.controlcenter')), 'the control centre is gone');
      const result = guard(preToolUse('Edit', path.join(made.launchDir, 'specs', 'spec.v1.json')), made);
      assert(denied(result), 'a frozen document is denied with no launch resolved');
    },
  },
  {
    id: 'B7 inside a worktree the deny still stands',
    covers: ['B7'],
    fn: () => {
      const made = mkCoreLaunch();
      const worktree = path.join(made.root, '.worktrees', 'U1');
      git(made.root, ['branch', 'unit/u1']);
      git(made.root, ['worktree', 'add', '-q', worktree, 'unit/u1']);
      const target = path.join(worktree, 'flightdeck', 'launch', made.launch, 'specs', 'spec.v1.json');
      assert(exists(target), 'the frozen spec is visible in the worktree');
      const result = coreHook('frozen-guard', preToolUse('Edit', target), { cwd: worktree, env: { CLAUDE_PROJECT_DIR: worktree } });
      assert(denied(result), 'a frozen document inside a worktree is denied');
    },
  },
  {
    id: 'B7 a draft-free non-JSON file and a JSON file with no status are left alone',
    covers: ['B7'],
    fn: () => {
      const made = mkCoreLaunch();
      writeText(path.join(made.root, 'src', 'export', 'index.mjs'), '// ordinary code\n');
      writeJson(path.join(made.root, 'notes', 'plain.json'), { hello: 'there' });
      for (const target of [path.join(made.root, 'src', 'export', 'index.mjs'), path.join(made.root, 'notes', 'plain.json')]) {
        const result = guard(preToolUse('Write', target), made);
        assert(!denied(result), `${path.basename(target)} is not denied`);
      }
    },
  },
  {
    id: 'E3 the same frozen paths the guard refuses are listed under the settings sandbox denyWrite',
    covers: ['E3'],
    fn: () => {
      const fragment = readJson(path.join(CORE_HOOKS, 'settings.fragment.json'));
      const deny = fragment.sandbox?.filesystem?.denyWrite ?? [];
      assert(deny.includes('flightdeck/launch/*/specs/**'), 'the spec and map folder is denied to the sandbox, so a Bash redirect cannot write it');
      assert(fragment.sandbox?.enabled !== false, 'the sandbox section ships active');
    },
  },
  {
    id: 'E3 a frozen file is unchanged after a denied edit',
    covers: ['E3'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'specs', 'spec.v1.json');
      const before = readText(file);
      guard(preToolUse('Edit', file, { tool_input: { old_string: '"frozen"', new_string: '"draft"' } }), made);
      assertEq(readText(file), before, 'the guard writes nothing itself and the file stands');
      assert(fs.existsSync(file), 'the file is still there');
      assert(rel(made, 'specs', 'spec.v1.json').startsWith('flightdeck/launch/'), 'the frozen document lives where the deny rule names');
    },
  },
]);
