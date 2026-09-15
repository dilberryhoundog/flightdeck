// testbench/suites/_checks/fable-cap-records/run.mjs — T22 (C5): no trial or judge the suite relies on uses fable; opus is the ceiling.
// Usage: node flightdeck/testbench/suites/_checks/fable-cap-records/run.mjs; exit 0 when fable appears in no set declaration, trial tier or ratio or sheet line, 2 otherwise.
//
// World-state rule: it holds vacuously while no scenario set exists.

import fs from 'node:fs';
import path from 'node:path';
import { isDir, none, readText, REPO, report } from '../lib/check-lib.mjs';
import { agentSuites } from '../lib/agent-suites.mjs';

let a = null;
let prep = null;
try {
  a = await agentSuites(REPO);
} catch (error) {
  prep = error;
}
const need = () => { if (prep) throw prep; };

await report(['C5'], [
  {
    name: 'no scenario set names fable as its tier or its judge',
    fn: () => {
      need();
      none(a.sets.filter((s) => s.set && (/fable/i.test(String(s.set.tier)) || /fable/i.test(String(s.set.judge)))).map((s) => `${s.rel}/set.json`), 'sets naming fable');
    },
  },
  {
    name: 'no trial record names fable as the model that ran it or judged it',
    fn: () => {
      need();
      const problems = [];
      for (const set of a.sets) {
        for (const s of set.scenarios) {
          const trials = path.join(s.dir, 'trials');
          if (!isDir(trials)) continue;
          for (const n of fs.readdirSync(trials)) {
            if (/fable/i.test(readText(path.join(trials, n, 'tier.txt')) ?? '')) problems.push(`${s.rel}/trials/${n}/tier.txt`);
            if (/^judge:.*fable/i.test((readText(path.join(trials, n, 'sheet.md')) ?? '').split('\n')[0])) problems.push(`${s.rel}/trials/${n}/sheet.md`);
          }
        }
      }
      none(problems, 'trials run on fable');
    },
  },
  {
    name: 'no ratio line names fable as its tier and no sheet line names fable as its judge',
    fn: () => {
      need();
      const problems = [];
      for (const read of a.reads.values()) {
        for (const r of read.ratios) if (/fable/i.test(r.tier)) problems.push(`${read.suite} line ${r.line}`);
        if (read.sheet && /fable/i.test(read.sheet.judge)) problems.push(`${read.suite} line ${read.sheet.line}`);
      }
      none(problems, 'lines naming fable');
    },
  },
]);
