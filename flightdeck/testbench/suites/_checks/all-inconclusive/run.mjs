// testbench/suites/_checks/all-inconclusive/run.mjs — T20 (E2): when every trial of a scenario is inconclusive because the model never attempted the provoked action, no trial counts toward the threshold, the check fails naming the scenario, and the ratio line carries the inconclusive count.
// Usage: node flightdeck/testbench/suites/_checks/all-inconclusive/run.mjs; exit 0 when every statistical suite behaves so for every scenario, 2 otherwise.
//
// In one snapshot copy every trial of every scenario a ratio line names gets empty transcript.jsonl, events.jsonl and hooks.log and a
// verdict.txt reading 'inconclusive: …'; tier.txt and sheet.md are kept. Every statistical suite is run there. For each scenario its
// suite must exit 2, print a ratio line with 0 passes and inconclusive equal to N, and print a FAIL case naming the scenario.
// With no statistical suite the check passes empty (D3).

import fs from 'node:fs';
import path from 'node:path';
import { ensure, isDir, REPO, report, snapshotCopy, suiteOutputs } from '../lib/check-lib.mjs';
import { agentSuites, scenarioIndex } from '../lib/agent-suites.mjs';
import { readOutput } from '../lib/protocol.mjs';

let a = null;
let after = null;
let prep = null;
try {
  a = await agentSuites(REPO);
  if (a.statistical.length > 0) {
    const index = scenarioIndex(a.sets);
    const copy = snapshotCopy(REPO);
    try {
      for (const read of a.statistical) {
        for (const r of read.ratios) {
          for (const hit of index.get(r.scenario) ?? []) {
            const trials = path.join(copy.dir, hit.scenario.rel, 'trials');
            if (!isDir(trials)) continue;
            for (const n of fs.readdirSync(trials)) {
              const t = path.join(trials, n);
              if (!isDir(t)) continue;
              for (const f of ['transcript.jsonl', 'events.jsonl', 'hooks.log']) fs.writeFileSync(path.join(t, f), '');
              fs.writeFileSync(path.join(t, 'verdict.txt'), 'inconclusive: the model never attempted the provoked action\n');
            }
          }
        }
      }
      after = await suiteOutputs(copy.dir, { mode: 'copy', only: a.statistical.map((r) => r.suite) });
    } finally {
      copy.remove();
    }
  }
} catch (error) {
  prep = error;
}

const cases = [];
if (prep) cases.push({ name: 'the suites run', fn: () => { throw prep; } });
else {
  if (a.statistical.length === 0) cases.push({ name: 'no suite prints a ratio line, so no scenario is run all-inconclusive', fn: () => {} });
  for (const read of a.statistical) {
    for (const r of read.ratios) {
      cases.push({
        name: `suite ${read.suite} fails scenario ${r.scenario} when every trial is inconclusive and carries the count on its ratio line`,
        fn: () => {
          const run = after.get(read.suite);
          const now = readOutput(run, a.ids);
          ensure(run.exit === 2, `suite ${read.suite} exited ${run.exit}`);
          const line = now.ratios.find((x) => x.scenario === r.scenario);
          ensure(line, `no ratio line for ${r.scenario}`);
          ensure(line.passes === 0, `the ratio line counts ${line.passes} passes`);
          ensure(line.inconclusive === line.trials, `the ratio line carries inconclusive ${line.inconclusive} of ${line.trials}`);
          ensure(now.cases.some((c) => c.verdict === 'FAIL' && (c.name.includes(r.scenario) || String(c.reason).includes(r.scenario))), `no FAIL case names ${r.scenario}`);
        },
      });
    }
  }
}

await report(['E2'], cases);
