// testbench/suites/_checks/trial-records/run.mjs — T17 (B7, I3): every trial's records are complete and name the tier that ran it, a model at or below opus matching its set's tier.
// Usage: node flightdeck/testbench/suites/_checks/trial-records/run.mjs; exit 0 when every trial folder holds its records, 2 otherwise.
//
// Per scenario the folders trials/1 … trials/<trials> exist and no others; each holds transcript.jsonl, events.jsonl, hooks.log,
// tier.txt and verdict.txt, and sheet.md in a judged set; tier.txt names exactly one of opus, sonnet, haiku, equal to the set's tier,
// and not fable; verdict.txt opens with pass, fail or inconclusive and a reason; a judged set's sheet.md opens with 'judge: <model>' naming
// its set's judge. With no scenario set the check passes empty (D3).

import { none, REPO, report } from '../lib/check-lib.mjs';
import { checkTrials, readSets } from '../lib/scenarios.mjs';

let sets = [];
let prep = null;
try {
  sets = readSets(REPO);
} catch (error) {
  prep = error;
}

await report(['B7', 'I3'], [
  { name: 'every trial folder holds its records and names its tier', fn: () => { if (prep) throw prep; none(sets.flatMap(checkTrials), 'trial record problems'); } },
]);
