// testbench/suites/bin-doctor/run.mjs — T21 (spec B30): fc doctor exits 0 on the built repository and on a prepared target, naming the checks it ran, and exits 2 on a repository whose launches are ambiguous, or when the target misses a hook command, an agent differs, worktree.baseRef is not head, or another agent carries a crew name.
// Usage: node flightdeck/testbench/suites/bin-doctor/run.mjs; exit 0 when every case passes, 2 otherwise. Targets and the ambiguous-launch repository are temporary directories; the built repository is only read.
//
// One reading is assumed. B30 makes 'at most one launch is active' one of doctor's own conditions, and a failed condition is exit 2 (C3); the exit 1 that two active
// launches produce elsewhere belongs to commands that must resolve a single launch before they can act. doctor's purpose is to report the inconsistency, so it exits 2.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, tmp, initRepo, copyDir, mkActiveLaunch, REPO, CREW, HOOKS, readJson, writeJson, readText, writeText,
  assert, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

function crewWithFrontmatter() {
  return fs.readdirSync(CREW)
    .filter((name) => name.endsWith('.md') && readText(path.join(CREW, name)).startsWith('---'))
    .sort();
}

/** A repository root whose .claude/ holds byte-equal agents, a settings.json carrying the fragment's hooks, worktree.baseRef head, and a .gitignore with .claude/worktrees/. */
function prepareTarget() {
  const root = tmp('fc-doctor-target');
  const target = path.join(root, '.claude');
  const crew = crewWithFrontmatter();
  assert(crew.length > 0, 'crew files with frontmatter exist');
  for (const name of crew) fs.cpSync(path.join(CREW, name), path.join(target, 'agents', 'flightcrew', name));
  const fragment = readJson(path.join(HOOKS, 'settings.fragment.json'));
  assert(fragment.hooks && Object.keys(fragment.hooks).length > 0, 'settings.fragment.json declares hooks');
  const settings = { hooks: fragment.hooks, worktree: fragment.worktree ?? { baseRef: 'head' }, permissions: fragment.permissions ?? {} };
  writeJson(path.join(target, 'settings.json'), settings);
  writeText(path.join(root, '.gitignore'), '.claude/worktrees/\n');
  initRepo(root);
  return { root, target, settings, crew };
}

function doctor(target) {
  const args = ['doctor'];
  if (target) args.push('--target', target);
  return fc(args, { cwd: REPO });
}

function firstHook(settings) {
  const [event, entries] = Object.entries(settings.hooks)[0];
  const command = entries[0].hooks[0].command;
  return { event, command, name: path.basename(command.split(/\s+/).pop().replace(/["']/g, ''), '.mjs') };
}

await suite('bin-doctor', [
  {
    id: 'doctor-passes-on-the-repository',
    covers: ['B30'],
    fn: () => {
      const r = doctor(null);
      assertExit(r, 0, 'fc doctor on the built repository');
      const text = `${r.stdout}\n${r.stderr}`.toLowerCase();
      for (const named of ['node', 'git', 'launch', 'crew', 'schema', 'manifest']) {
        assertIncludes(text, named, `doctor names the condition it checked: ${named}`);
      }
    },
  },
  {
    id: 'two-active-launches-exit-2',
    covers: ['B30'],
    fn: () => {
      const active = mkActiveLaunch();
      const second = 'export-html-2';
      const secondDir = path.join(active.root, 'flightdeck', 'launch', second);
      copyDir(active.launchDir, secondDir);
      const lj = readJson(path.join(secondDir, 'launch.json'));
      lj.name = second;
      writeJson(path.join(secondDir, 'launch.json'), lj);
      assert(readJson(path.join(active.launchDir, 'launch.json')).status === 'active', 'the first launch is active');
      assert(lj.status === 'active', 'the second launch is active too');
      const r = fc(['doctor'], { cwd: active.root, env: { FLIGHTCREW_ROOT: active.root } });
      assertExit(r, 2, 'fc doctor with two active launches');
      const text = `${r.stdout}\n${r.stderr}`;
      assertIncludes(text, active.launch, 'the first active launch is named');
      assertIncludes(text, second, 'the second active launch is named');
    },
  },
  {
    id: 'doctor-passes-on-a-prepared-target',
    covers: ['B30'],
    fn: () => {
      const { target } = prepareTarget();
      assertExit(doctor(target), 0, 'fc doctor --target on a prepared target');
    },
  },
  {
    id: 'target-missing-hook-command-exits-2',
    covers: ['B30'],
    fn: () => {
      const { target, settings } = prepareTarget();
      const missing = firstHook(settings);
      settings.hooks[missing.event][0].hooks.shift();
      if (settings.hooks[missing.event][0].hooks.length === 0) settings.hooks[missing.event].shift();
      if (settings.hooks[missing.event].length === 0) delete settings.hooks[missing.event];
      writeJson(path.join(target, 'settings.json'), settings);
      const r = doctor(target);
      assertExit(r, 2, 'fc doctor --target with one fragment hook command absent');
      const text = `${r.stdout}\n${r.stderr}`;
      assert(text.includes(missing.name) || text.includes(missing.event), `the missing hook is named (${missing.name} or ${missing.event})`);
    },
  },
  {
    id: 'target-agent-not-byte-equal-exits-2',
    covers: ['B30'],
    fn: () => {
      const { target, crew } = prepareTarget();
      const file = path.join(target, 'agents', 'flightcrew', crew[0]);
      writeText(file, `${readText(file)}\nlocal edit\n`);
      const r = doctor(target);
      assertExit(r, 2, 'fc doctor --target with a differing agent copy');
      assert(`${r.stdout}\n${r.stderr}`.includes(crew[0]), 'the differing agent is named');
    },
  },
  {
    id: 'target-baseref-not-head-exits-2',
    covers: ['B30'],
    fn: () => {
      const { target, settings } = prepareTarget();
      settings.worktree = { baseRef: 'fresh' };
      writeJson(path.join(target, 'settings.json'), settings);
      assertExit(doctor(target), 2, 'fc doctor --target with worktree.baseRef fresh');
    },
  },
  {
    id: 'target-crew-name-collision-exits-2',
    covers: ['B30'],
    fn: () => {
      const { target } = prepareTarget();
      writeText(path.join(target, 'agents', 'local', 'my-critic.md'), '---\nname: critic\ndescription: A local agent that reuses a crew name.\ntools: Read\nmodel: sonnet\n---\n\nBody.\n');
      const r = doctor(target);
      assertExit(r, 2, 'fc doctor --target with another agent carrying a crew name');
      assertIncludes(`${r.stdout}\n${r.stderr}`, 'my-critic.md', 'the colliding agent file is named');
    },
  },
]);
