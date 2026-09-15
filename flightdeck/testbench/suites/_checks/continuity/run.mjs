// testbench/suites/_checks/continuity/run.mjs — T28 (B12): every case name the thirty earlier suites carried at the spec's commit appears in the suite now, verbatim or under the committed mapping file.
// Usage: node flightdeck/testbench/suites/_checks/continuity/run.mjs; exit 0 when no earlier case is lost, 2 otherwise.
//
// The earlier names are the golden fixtures/earlier-cases.txt; the mapping file is flightdeck/testbench/case-map.json (see
// ../lib/rules.mjs). One case per earlier suite. World-state rule: it holds while the earlier suites stand unchanged.

import path from 'node:path';
import { FIXTURES, none, readText, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { continuityProblems, readEarlierCases, readMapping } from '../lib/rules.mjs';
import { readOutput } from '../lib/protocol.mjs';

const earlier = readEarlierCases(readText(path.join(FIXTURES, 'earlier-cases.txt')));
let printed = null;
let mapping = null;
let prep = null;
try {
  const ids = specIds();
  const outputs = await indexOutputs(REPO);
  printed = new Map([...outputs].map(([suite, run]) => [suite, new Set(readOutput(run, ids).cases.map((c) => c.bare))]));
  mapping = readMapping(REPO);
} catch (error) {
  prep = error;
}
const suites = [...new Set(earlier.map((e) => e.suite))];

await report(['B12'], [
  { name: 'the golden holds the case names of thirty earlier suites', fn: () => { if (suites.length !== 30) throw new Error(`the golden names ${suites.length} suites`); } },
  { name: 'the mapping file, when present, is well formed and committed', fn: () => { if (prep) throw prep; none(mapping.problems, 'mapping file problems'); } },
  ...suites.map((suite) => ({
    name: `every case of earlier suite ${suite} is carried by the suite`,
    fn: () => {
      if (prep) throw prep;
      none(continuityProblems(earlier.filter((e) => e.suite === suite), printed, mapping.mapping), 'earlier cases lost', 10);
    },
  })),
]);
