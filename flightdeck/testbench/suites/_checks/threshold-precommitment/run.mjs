// testbench/suites/_checks/threshold-precommitment/run.mjs — T23 (C5): every scenario's trials and threshold were committed before its counted trials, and are unchanged since.
// Usage: node flightdeck/testbench/suites/_checks/threshold-precommitment/run.mjs; exit 0 when every scenario's declaration precedes its records, 2 otherwise.
//
// For each scenario folder: let T be the first commit that added a file under its trials/. When T exists, scenario.json must exist in
// T's parent with the same trials and threshold as now. When no commit holds trials yet but the working tree does, scenario.json must be
// committed at HEAD with the same trials and threshold as now. World-state rule: it holds vacuously while no scenario set exists.

import path from 'node:path';
import { git, isDir, none, REPO, report, showAt, gitRun } from '../lib/check-lib.mjs';
import { readSets } from '../lib/scenarios.mjs';

function declared(buffer) {
  if (buffer === null) return null;
  try {
    const doc = JSON.parse(buffer.toString('utf8'));
    return { trials: doc.trials, threshold: doc.threshold };
  } catch {
    return null;
  }
}

await report(['C5'], [
  {
    name: "every scenario's trials and threshold were committed before its first trial record",
    fn: () => {
      const problems = [];
      for (const set of readSets(REPO)) {
        for (const s of set.scenarios) {
          if (!s.scenario || !isDir(path.join(s.dir, 'trials'))) continue;
          const now = { trials: s.scenario.trials, threshold: s.scenario.threshold };
          const log = gitRun(REPO, ['log', '--diff-filter=A', '--format=%H', '--reverse', '--', `${s.rel}/trials`]);
          const first = log.stdout.split('\n').find((l) => l.trim() !== '');
          let before;
          let where;
          if (first) {
            const parent = git(REPO, ['rev-parse', '--verify', '--quiet', `${first}^`]);
            before = parent ? declared(showAt(REPO, parent, `${s.rel}/scenario.json`)) : null;
            where = `the parent of ${first.slice(0, 10)}, the commit adding its first trial`;
          } else {
            before = declared(showAt(REPO, 'HEAD', `${s.rel}/scenario.json`));
            where = 'HEAD, with its trials not yet committed';
          }
          if (before === null) problems.push(`${s.rel}/scenario.json was not committed at ${where}`);
          else if (before.trials !== now.trials || before.threshold !== now.threshold) {
            problems.push(`${s.rel}/scenario.json declared trials ${before.trials} threshold ${before.threshold} at ${where} and declares ${now.trials}/${now.threshold} now`);
          }
        }
      }
      none(problems, 'scenarios whose declaration does not precede their trials');
    },
  },
]);
