// testbench/suites/_checks/rubric-form/run.mjs — T18 (B8, C3): every judged check has a rubric in the form of flightdeck/manuals/testing/rubric-guide.md in its scenario set's folder.
// Usage: node flightdeck/testbench/suites/_checks/rubric-form/run.mjs; exit 0 when every judged set's rubric is in form, 2 otherwise.
//
// A judged set is a set whose set.json judge is not null; a judged check is a suite that prints a sheet line, and its sheet path
// must lie inside a judged set's folder and exist. With no judged set and no sheet line the check passes empty (D3).

import fs from 'node:fs';
import path from 'node:path';
import { none, readText, REPO, report } from '../lib/check-lib.mjs';
import { agentSuites, setsOfSuite } from '../lib/agent-suites.mjs';
import { checkRubric } from '../lib/scenarios.mjs';

let a = null;
let prep = null;
try {
  a = await agentSuites(REPO);
} catch (error) {
  prep = error;
}
const need = () => { if (prep) throw prep; };
const judgedSets = () => a.sets.filter((s) => s.set && s.set.judge !== null && s.set.judge !== undefined);

await report(['B8', 'C3'], [
  {
    name: "every judged set's rubric.md is in the rubric guide's form",
    fn: () => { need(); none(judgedSets().flatMap((s) => checkRubric(readText(path.join(s.dir, 'rubric.md')), `${s.rel}/rubric.md`)), 'rubric form problems'); },
  },
  {
    name: "every judged check's sheet line points at an existing sheet inside a judged set",
    fn: () => {
      need();
      const problems = [];
      for (const read of a.judged) {
        const sets = setsOfSuite(read, a.sets).filter((s) => s.set && s.set.judge !== null);
        if (sets.length === 0) problems.push(`${read.suite}: sheet ${read.sheet.path} lies in no judged set`);
        if (!fs.existsSync(path.join(REPO, read.sheet.path))) problems.push(`${read.suite}: sheet ${read.sheet.path} does not exist`);
      }
      none(problems, 'sheet lines out of place');
    },
  },
]);
