// testbench/suites/_checks/scope-untouched/run.mjs — T37 (scope: SC2, SC4, SC6, SC8): nothing the scope puts out of bounds changed since the spec's commit.
// Usage: node flightdeck/testbench/suites/_checks/scope-untouched/run.mjs; exit 0 when every out-of-scope path is unchanged, 2 otherwise.
//
// Changed means differing between commit ee8c088 and the working tree, untracked files included.

import { changedSince, gitRun, none, REPO, report, SPEC_COMMIT } from '../lib/check-lib.mjs';

const changed = changedSince(REPO, SPEC_COMMIT);
const under = (prefixes, except = []) => changed.filter((rel) => prefixes.some((p) => (p.endsWith('/') ? rel.startsWith(p) : rel === p)) && !except.includes(rel));

await report(['scope'], [
  { name: 'nothing under flightdeck/flightcrew/ changed except MANIFEST.txt', fn: () => none(under(['flightdeck/flightcrew/'], ['flightdeck/flightcrew/MANIFEST.txt']), 'changed paths') },
  { name: 'nothing under flightdeck/manuals/, library/ or .claude/, nor CLAUDE.md, changed', fn: () => none(under(['flightdeck/manuals/', 'library/', '.claude/', 'CLAUDE.md']), 'changed paths') },
  {
    name: 'the earlier launch folders, the flightcrew-v1 spec series and the rubric bench are unchanged',
    fn: () => none(under(['flightdeck/launch/flightcrew-buildout/', 'flightdeck/launch/flightcrew-buildout-2/', 'flightdeck/launch/specs/flightcrew-v1/', 'flightdeck/testbench/benches/']), 'changed paths'),
  },
  {
    name: 'flightdeck/launch/RUNLOG.md keeps every earlier line',
    fn: () => {
      const diff = gitRun(REPO, ['diff', '--unified=0', SPEC_COMMIT, '--', 'flightdeck/launch/RUNLOG.md']).stdout;
      none(diff.split('\n').filter((l) => l.startsWith('-') && !l.startsWith('---')), 'removed or rewritten lines');
    },
  },
]);
