#!/usr/bin/env node
// suites/flight-merge — flight merge: the no-ff merge it makes when the unit is green and its dependencies are in, the event it appends, the worktree and branch it removes, and what it leaves alone when it aborts. Covers B13, B14, B15, E12.
import fs from 'node:fs';
import path from 'node:path';
import {
  assert, assertEq, assertExit, assertMatch, exists, flight, git, head, mkCoreLaunch, readEvents,
  readJson, readText, suite, writeJson, writeText,
} from '../../lib/core-lib.mjs';

const merge = (made, unit) => flight(['merge', unit], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

/**
 * The fixture launch with unit U0 built on its own branch in its own worktree: one commit inside the unit's paths,
 * and the green return already stored. Returns the branch name and worktree path.
 */
function withUnitBranch(made, { unit = 'U0', file = 'src/export/index.mjs', text = '// the contracts unit\n' } = {}) {
  const record = readJson(path.join(made.runDir, 'returns', `interface-builder-${unit}.json`));
  const branch = record.branch;
  const worktree = path.join(made.root, '.worktrees', unit);
  git(made.root, ['branch', branch]);
  git(made.root, ['worktree', 'add', '-q', worktree, branch]);
  writeText(path.join(worktree, file), text);
  git(worktree, ['add', '-A']);
  git(worktree, ['commit', '-q', '--no-verify', '-m', `${unit}: work`]);
  writeJson(path.join(made.runDir, 'returns', `interface-builder-${unit}.json`), { ...record, worktree: `.worktrees/${unit}` });
  git(made.root, ['add', '-A']);
  git(made.root, ['commit', '-q', '--no-verify', '-m', 'return stored']);
  return { branch, worktree };
}

await suite('flight-merge', [
  {
    id: 'B13 a green unit whose dependencies are in is merged with --no-ff onto the run branch',
    covers: ['B13'],
    fn: () => {
      const made = mkCoreLaunch();
      const { branch } = withUnitBranch(made);
      const before = head(made.root);
      const result = merge(made, 'U0');
      assertExit(result, 0, `flight merge U0: ${result.stdout}${result.stderr}`);
      const now = head(made.root);
      assert(now !== before, 'the run branch moved');
      const parents = git(made.root, ['rev-list', '--parents', '-n', '1', now]).trim().split(/\s+/).slice(1);
      assertEq(parents.length, 2, 'the merge commit has two parents, so it was --no-ff');
      assertEq(parents[0], before, 'the first parent is the run branch as it was');
      assertMatch(readText(path.join(made.root, 'src', 'export', 'index.mjs')), /the contracts unit/, "the unit's work is in the run branch");
      assertEq(git(made.root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(), `run/${made.launch}-${made.run}`, 'the merge happened on the run branch');
      assert(branch.length > 0, 'the unit branch was named by the return');
    },
  },
  {
    id: 'B13 the merge is refused when the checked-out branch is not the run branch',
    covers: ['B13'],
    fn: () => {
      const made = mkCoreLaunch();
      withUnitBranch(made);
      git(made.root, ['switch', '-q', 'main']);
      const before = head(made.root);
      const result = merge(made, 'U0');
      assert(result.code !== 0, 'merging from another branch is refused');
      assertEq(head(made.root), before, 'the branch did not move');
    },
  },
  {
    id: 'B13 the merge is refused while a depends_on unit is unmerged',
    covers: ['B13'],
    fn: () => {
      const made = mkCoreLaunch();
      const record = readJson(path.join(made.runDir, 'returns', 'implementer-U1.json'));
      git(made.root, ['branch', record.branch]);
      git(made.root, ['worktree', 'add', '-q', path.join(made.root, '.worktrees', 'U1'), record.branch]);
      writeText(path.join(made.root, '.worktrees', 'U1', 'src', 'export', 'index.mjs'), '// U1\n');
      git(path.join(made.root, '.worktrees', 'U1'), ['add', '-A']);
      git(path.join(made.root, '.worktrees', 'U1'), ['commit', '-q', '--no-verify', '-m', 'U1']);
      const before = head(made.root);
      const result = merge(made, 'U1');
      assert(result.code !== 0, 'U1 is refused while U0 is unmerged');
      assertMatch(`${result.stdout}${result.stderr}`, /U0/, 'the message names the unmerged dependency');
      assertEq(head(made.root), before, 'the run branch did not move');
    },
  },
  {
    id: 'B13 the unit checks are run after the merge and the merge is kept when they pass',
    covers: ['B13'],
    fn: () => {
      const made = mkCoreLaunch();
      withUnitBranch(made);
      assertExit(merge(made, 'U0'), 0, 'flight merge U0');
      const evidence = path.join(made.runDir, 'evidence', 'T1.json');
      assert(exists(evidence), "the unit's checks left evidence");
      assertEq(readJson(evidence).verdict, 'pass', 'the unit check passed');
    },
  },
  {
    id: 'B14 a unit_merged event is appended after the merge commit',
    covers: ['B14'],
    fn: () => {
      const made = mkCoreLaunch();
      withUnitBranch(made);
      const before = readEvents(path.join(made.runDir, 'events.jsonl')).length;
      assertExit(merge(made, 'U0'), 0, 'flight merge U0');
      const events = readEvents(path.join(made.runDir, 'events.jsonl'));
      assertEq(events.length, before + 1, 'exactly one event is appended');
      const last = events.at(-1);
      assertEq(last.event, 'unit_merged', 'the event name');
      assertEq(last.detail.unit, 'U0', 'the event names the unit');
    },
  },
  {
    id: 'B15 the unit worktree and branch are gone after the merge',
    covers: ['B15'],
    fn: () => {
      const made = mkCoreLaunch();
      const { branch, worktree } = withUnitBranch(made);
      assertExit(merge(made, 'U0'), 0, 'flight merge U0');
      assert(!exists(worktree), 'the worktree directory is removed');
      assert(!git(made.root, ['worktree', 'list']).includes(worktree), 'git no longer lists the worktree');
      const refs = git(made.root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']).split('\n').map((l) => l.trim());
      assert(!refs.includes(branch), `the unit branch ${branch} is deleted`);
    },
  },
  {
    id: 'E12 a red unit check aborts the merge and leaves everything as it was',
    covers: ['E12'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.launchDir, 'specs', 'tests-map.v1.json');
      const map = readJson(file);
      map.checks.find((c) => c.id === 'T1').command = 'sh {run}/checks/fail.sh';
      writeJson(file, map);
      const { branch, worktree } = withUnitBranch(made);
      const before = head(made.root);
      const status = git(made.root, ['status', '--porcelain']);
      const result = merge(made, 'U0');
      assertExit(result, 2, 'a red unit check');
      assertMatch(`${result.stdout}${result.stderr}`, /T1/, 'the message names the failing check id');
      assertEq(head(made.root), before, 'the run branch is where it was');
      assertEq(git(made.root, ['status', '--porcelain']), status, 'the working tree is as it was');
      assert(exists(worktree), 'the worktree is left standing');
      assertIncludesBranch(made, branch);
    },
  },
  {
    id: 'E12 a merge conflict aborts, names the conflicting path, and leaves everything as it was',
    covers: ['E12'],
    fn: () => {
      const made = mkCoreLaunch();
      const { branch, worktree } = withUnitBranch(made, { text: '// the unit line\n' });
      writeText(path.join(made.root, 'src', 'export', 'index.mjs'), '// a different line on the run branch\n');
      git(made.root, ['add', '-A']);
      git(made.root, ['commit', '-q', '--no-verify', '-m', 'run branch work']);
      const before = head(made.root);
      const status = git(made.root, ['status', '--porcelain']);
      const result = merge(made, 'U0');
      assertExit(result, 2, 'a conflicting merge');
      assertMatch(`${result.stdout}${result.stderr}`, /src\/export\/index\.mjs/, 'the message names the conflicting path');
      assertEq(head(made.root), before, 'the run branch is where it was');
      assertEq(git(made.root, ['status', '--porcelain']), status, 'the working tree is clean of conflict markers');
      assert(exists(worktree), 'the worktree is left standing');
      assertIncludesBranch(made, branch);
      assert(!exists(path.join(made.root, '.git', 'MERGE_HEAD')), 'no merge is left in progress');
    },
  },
]);

function assertIncludesBranch(made, branch) {
  const refs = git(made.root, ['for-each-ref', '--format=%(refname:short)', 'refs/heads']).split('\n').map((l) => l.trim());
  assert(refs.includes(branch), `the unit branch ${branch} is left standing`);
}
