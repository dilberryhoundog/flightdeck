// testbench/suites/_checks/fable-refusal/run.mjs — T21 (E4, C5): a scenario set that names fable as its tier or its judge is refused, and the check that reads it fails naming the set and the opus cap.
// Usage: node flightdeck/testbench/suites/_checks/fable-refusal/run.mjs; exit 0 when every such set is refused by every suite reading it, 2 otherwise.
//
// One snapshot copy sets the tier of every set a statistical suite reads to 'fable'; another sets the judge of every set a judged
// suite reads to 'fable'. Each suite reading a changed set must exit 2 with a FAIL case whose name or reason carries the set's name
// and 'opus'. With no statistical or judged suite reading a set the check passes empty (D3).

import fs from 'node:fs';
import path from 'node:path';
import { ensure, REPO, report, snapshotCopy, suiteOutputs } from '../lib/check-lib.mjs';
import { agentSuites, setsOfSuite } from '../lib/agent-suites.mjs';
import { readOutput } from '../lib/protocol.mjs';

async function variant(reads, key) {
  const copy = snapshotCopy(REPO);
  try {
    const changed = new Set();
    for (const read of reads) {
      for (const set of setsOfSuite(read, a.sets)) {
        if (changed.has(set.name) || !set.set) continue;
        const file = path.join(copy.dir, set.rel, 'set.json');
        fs.writeFileSync(file, `${JSON.stringify({ ...set.set, [key]: 'fable' }, null, 2)}\n`);
        changed.add(set.name);
      }
    }
    return await suiteOutputs(copy.dir, { mode: 'copy', only: reads.map((r) => r.suite) });
  } finally {
    copy.remove();
  }
}

let a = null;
let tierRuns = null;
let judgeRuns = null;
let prep = null;
try {
  a = await agentSuites(REPO);
  if (a.statistical.length > 0) tierRuns = await variant(a.statistical, 'tier');
  if (a.judged.length > 0) judgeRuns = await variant(a.judged, 'judge');
} catch (error) {
  prep = error;
}

function refusal(runs, read, set, key) {
  return () => {
    const run = runs.get(read.suite);
    const now = readOutput(run, a.ids);
    ensure(run.exit === 2, `suite ${read.suite} exited ${run.exit} with ${key} fable in ${set.rel}/set.json`);
    ensure(
      now.cases.some((c) => c.verdict === 'FAIL' && `${c.name} ${c.reason}`.includes(set.name) && /opus/i.test(`${c.name} ${c.reason}`)),
      `no FAIL case of ${read.suite} names set ${set.name} and the opus cap`,
    );
  };
}

const cases = [];
if (prep) cases.push({ name: 'the suites run', fn: () => { throw prep; } });
else {
  for (const read of a.statistical) for (const set of setsOfSuite(read, a.sets)) cases.push({ name: `suite ${read.suite} refuses set ${set.name} when its tier is fable, naming the cap`, fn: refusal(tierRuns, read, set, 'tier') });
  for (const read of a.judged) for (const set of setsOfSuite(read, a.sets)) cases.push({ name: `suite ${read.suite} refuses set ${set.name} when its judge is fable, naming the cap`, fn: refusal(judgeRuns, read, set, 'judge') });
  if (cases.length === 0) cases.push({ name: 'no statistical or judged suite reads a scenario set, so no set is given fable', fn: () => {} });
}

await report(['E4', 'C5'], cases);
