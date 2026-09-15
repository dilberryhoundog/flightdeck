// testbench/suites/_checks/spec-chain-bytes/run.mjs — T33 (C7): the spec chain, its rubrics, the spec schema and the spec template are byte-identical to the spec's commit.
// Usage: node flightdeck/testbench/suites/_checks/spec-chain-bytes/run.mjs; exit 0 when no byte changed, 2 otherwise.

import fs from 'node:fs';
import path from 'node:path';
import { gitRun, none, REPO, report, showAt, SPEC_COMMIT, worktreeFiles } from '../lib/check-lib.mjs';

const FILES = [
  'flightdeck/flightcrew/crew/spec-builder.md',
  'flightdeck/flightcrew/crew/spec-judge.md',
  'flightdeck/flightcrew/crew/spec-attacker.md',
  'flightdeck/flightcrew/schemas/spec.schema.json',
  'flightdeck/flightcrew/templates/spec.template.json',
];
const RUBRICS = 'flightdeck/flightcrew/checks/rubrics/';

await report(['C7'], [
  {
    name: 'the spec chain, rubrics, spec schema and spec template are byte-identical to the spec commit',
    fn: () => {
      const then = gitRun(REPO, ['ls-tree', '-r', '--name-only', SPEC_COMMIT, '--', RUBRICS]).stdout.split('\n').filter(Boolean);
      const now = worktreeFiles(REPO).filter((rel) => rel.startsWith(RUBRICS));
      const paths = [...new Set([...FILES, ...then, ...now])].sort();
      const problems = [];
      for (const rel of paths) {
        const before = showAt(REPO, SPEC_COMMIT, rel);
        let after = null;
        try {
          after = fs.readFileSync(path.join(REPO, rel));
        } catch {
          after = null;
        }
        if (before === null && after !== null) problems.push(`${rel} was added`);
        else if (before !== null && after === null) problems.push(`${rel} was removed`);
        else if (before === null && after === null) problems.push(`${rel} exists neither at the spec commit nor now`);
        else if (!before.equals(after)) problems.push(`${rel} changed`);
      }
      none(problems, 'calibration files changed');
    },
  },
]);
