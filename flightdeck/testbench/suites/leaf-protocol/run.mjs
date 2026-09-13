#!/usr/bin/env node
// suites/leaf-protocol — the leaf contract: one script per leaf, the dispatcher that only routes, the three exit codes, the one line on success, and running with bin/flight absent. Covers C3, I5.
import fs from 'node:fs';
import path from 'node:path';
import {
  BIN, FLIGHTCREW, assert, assertEq, assertExit, assertMatch, copyDir, exists, flight, leaf,
  mkCoreLaunch, readJson, sh, suite, tmp, writeJson,
} from '../../lib/core-lib.mjs';

/** Every leaf I5 names, with the argv that reaches it and what the dispatcher is asked for. */
const LEAVES = ['launch', 'run', 'check', 'event', 'render', 'merge', 'freeze', 'validate', 'lint', 'install'];

const env = (made) => ({ CLAUDE_PROJECT_DIR: made.root });

/** flightdeck/flightcrew copied to a temporary directory with bin/flight removed. */
function withoutDispatcher() {
  const dir = path.join(tmp('fc-noflight'), 'flightcrew');
  copyDir(FLIGHTCREW, dir);
  fs.rmSync(path.join(dir, 'bin', 'flight'), { force: true });
  return dir;
}

/** node <file> <args> in the launch repository, with the launch resolvable. */
function runNode(file, args, made) {
  return sh([process.execPath, file, ...args].map((part) => `'${String(part).replace(/'/g, "'\\''")}'`).join(' '), {
    cwd: made.root,
    env: env(made),
  });
}

await suite('leaf-protocol', [
  {
    id: 'I5 bin/ holds one script per leaf, and bin/flight is executable',
    covers: ['I5'],
    fn: () => {
      assert(exists(path.join(BIN, 'flight')), 'bin/flight exists');
      assert((fs.statSync(path.join(BIN, 'flight')).mode & 0o111) !== 0, 'bin/flight is executable');
      for (const name of LEAVES) assert(exists(path.join(BIN, `${name}.mjs`)), `bin/${name}.mjs exists`);
    },
  },
  {
    id: 'I5 the dispatcher only routes: flight <leaf> and the leaf by its own path answer alike',
    covers: ['I5'],
    fn: () => {
      const cases = [
        ['validate', (made) => [`flightdeck/launch/${made.launch}/launch.json`]],
        ['render', () => ['implementer', 'U1']],
        ['check', () => ['T1']],
      ];
      for (const [name, argv] of cases) {
        const a = mkCoreLaunch();
        const b = mkCoreLaunch();
        const viaFlight = flight([name, ...argv(a)], { cwd: a.root, env: env(a) });
        const viaPath = leaf(name, argv(b), { cwd: b.root, env: env(b) });
        assertEq(viaPath.code, viaFlight.code, `${name} exits alike through the dispatcher and by its own path`);
        assertEq(viaPath.stdout, viaFlight.stdout, `${name} prints alike through the dispatcher and by its own path`);
      }
    },
  },
  {
    id: 'C3 a leaf runs by its own path from a tree with bin/flight absent',
    covers: ['C3'],
    fn: () => {
      const made = mkCoreLaunch();
      const dir = withoutDispatcher();
      assert(!exists(path.join(dir, 'bin', 'flight')), 'the dispatcher is gone from the copy');
      const target = `flightdeck/launch/${made.launch}/launch.json`;
      const direct = runNode(path.join(dir, 'bin', 'validate.mjs'), [target], made);
      assertEq(direct.code, 0, `validate from a tree with no dispatcher: ${direct.stdout}${direct.stderr}`);
      const rendered = runNode(path.join(dir, 'bin', 'render.mjs'), ['implementer', 'U1'], made);
      assertEq(rendered.code, 0, `render from a tree with no dispatcher: ${rendered.stdout}${rendered.stderr}`);
    },
  },
  {
    id: 'C3 a leaf exits 0 on success and prints at most one line',
    covers: ['C3'],
    fn: () => {
      const made = mkCoreLaunch();
      const cases = [
        ['event', [JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-build' } })]],
        ['render', ['implementer', 'U1']],
        ['check', ['T1']],
      ];
      for (const [name, args] of cases) {
        const result = flight([name, ...args], { cwd: made.root, env: env(made) });
        assertExit(result, 0, `flight ${name}: ${result.stdout}${result.stderr}`);
        const lines = result.stdout.split('\n').filter((line) => line.trim() !== '');
        assert(lines.length <= 1, `flight ${name} printed ${lines.length} lines on success: ${lines.join(' | ')}`);
      }
      const validated = flight(['validate', `flightdeck/launch/${made.launch}/launch.json`], { cwd: made.root, env: env(made) });
      assertExit(validated, 0, 'flight validate');
      assertEq(validated.stdout.trim(), '', 'flight validate prints nothing on success');
    },
  },
  {
    id: 'C3 a usage error exits 1',
    covers: ['C3'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const name of LEAVES) {
        const result = flight([name, '--no-such-flag'], { cwd: made.root, env: env(made) });
        assertExit(result, 1, `flight ${name} --no-such-flag`);
      }
    },
  },
  {
    id: 'C3 an environment error exits 1 and names what it could not resolve',
    covers: ['C3'],
    fn: () => {
      const made = mkCoreLaunch();
      fs.rmSync(path.join(made.root, 'flightdeck', '.controlcenter'), { force: true });
      const result = flight(['check', 'T1'], { cwd: made.root, env: env(made) });
      assertExit(result, 1, 'a leaf that needs a run with no control centre');
      assertMatch(`${result.stdout}${result.stderr}`, /controlcenter/, 'the message names the file');
    },
  },
  {
    id: 'C3 a failed check or a refused action exits 2',
    covers: ['C3'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(flight(['check', 'T2'], { cwd: made.root, env: env(made) }), 2, 'a failing check');
      const drafted = mkCoreLaunch();
      const file = path.join(drafted.launchDir, 'specs', 'spec.v1.json');
      const spec = readJson(file);
      delete spec.commit;
      writeJson(file, { ...spec, status: 'draft' });
      const record = readJson(path.join(drafted.launchDir, 'launch.json'));
      writeJson(path.join(drafted.launchDir, 'launch.json'), { ...record, current_run: null, runs: [] });
      assertExit(flight(['run', 'new', drafted.launch], { cwd: drafted.root, env: env(drafted) }), 2, 'a refused action');
    },
  },
  {
    id: 'I5 an unknown leaf and no leaf at all exit 1',
    covers: ['I5'],
    fn: () => {
      const made = mkCoreLaunch();
      const unknown = flight(['teleport'], { cwd: made.root, env: env(made) });
      assertExit(unknown, 1, 'an unknown leaf');
      assertMatch(`${unknown.stdout}${unknown.stderr}`, /teleport/, 'the message names the leaf');
      assertExit(flight([], { cwd: made.root, env: env(made) }), 1, 'no leaf at all');
    },
  },
]);
