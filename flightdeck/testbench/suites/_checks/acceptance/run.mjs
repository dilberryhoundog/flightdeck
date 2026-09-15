// testbench/suites/_checks/acceptance/run.mjs — T1, the acceptance check: the reviewer's second act, breaking one part of flightcrew turns a case of the suite that names it red.
// Usage: node flightdeck/testbench/suites/_checks/acceptance/run.mjs; exit 0 when the act holds, 2 otherwise.
//
// The part a reviewer breaks is fixed as the lock-guard hook. The suites whose case names carry
// flightdeck/flightcrew/hooks/lock-guard.mjs (from the parallel name index) run in an unaltered snapshot copy and in a copy with
// the hook's decision flipped, the two copies at once; at least one naming case must pass in the first and fail in the second.
// The reviewer's first act, the whole suite green from one command, is proven by the suite-group checks together, because the
// whole suite does not fit one command inside fc check's 300-second limit. The third act, a human reading one transcript, is not a
// check. The check stops inside its 240-second budget and fails naming what was left undone.

import { ensure, indexOutputs, oneLine, REPO, report, snapshotCopy, specIds, suiteOutputs } from '../lib/check-lib.mjs';
import { readOutput } from '../lib/protocol.mjs';
import { alter, namesPart } from '../lib/parts.mjs';

const PART = 'flightdeck/flightcrew/hooks/lock-guard.mjs';

await report(['B2'], [
  {
    name: `breaking ${PART} turns a case naming it red`,
    fn: async () => {
      const ids = specIds();
      let index;
      try {
        index = await indexOutputs(REPO);
      } catch (error) {
        throw new Error(oneLine(error));
      }
      const suites = [...index].filter(([, run]) => readOutput(run, ids).cases.some((c) => namesPart(c.name, PART))).map(([s]) => s).sort();
      ensure(suites.length > 0, `no case of any suite names ${PART}`);
      const base = snapshotCopy(REPO);
      const copy = snapshotCopy(REPO);
      try {
        ensure(alter(copy.dir, PART) !== null, `the decision of ${PART} could not be flipped`);
        let unaltered;
        let altered;
        try {
          [unaltered, altered] = await Promise.all([
            suiteOutputs(base.dir, { mode: 'copy', only: suites }),
            suiteOutputs(copy.dir, { mode: 'copy', only: suites }),
          ]);
        } catch (error) {
          throw new Error(oneLine(error));
        }
        const green = [];
        for (const [suite, run] of unaltered) {
          for (const c of readOutput(run, ids).cases) if (c.verdict === 'pass' && namesPart(c.name, PART)) green.push({ suite, name: c.name });
        }
        ensure(green.length > 0, `no case naming ${PART} passes on the unaltered tree (suites: ${suites.join(', ')})`);
        const red = green.filter((g) => {
          const after = readOutput(altered.get(g.suite), ids).cases.find((c) => c.name === g.name);
          return !after || after.verdict === 'FAIL';
        });
        ensure(red.length > 0, `every case naming ${PART} stays green with its decision flipped: ${green.slice(0, 3).map((g) => `${g.suite} · ${g.name}`).join('; ')}`);
      } finally {
        base.remove();
        copy.remove();
      }
    },
  },
]);
