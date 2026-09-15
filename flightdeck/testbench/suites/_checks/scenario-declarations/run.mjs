// testbench/suites/_checks/scenario-declarations/run.mjs — T16 (B6, I3): every statistical check has a scenario set stating its trials, its threshold, at least one control and a tier at or below opus, and its ratio lines repeat what the set declares.
// Usage: node flightdeck/testbench/suites/_checks/scenario-declarations/run.mjs; exit 0 when every declaration holds, 2 otherwise.
//
// A statistical check is a suite that prints a ratio line. Each ratio line's scenario must be exactly one scenario folder under
// flightdeck/testbench/fixtures/scenarios/, whose scenario.json trials and threshold equal the line's N and k and whose set's tier
// equals the line's tier. With no scenario set and no ratio line the check passes empty (D3).

import { none, REPO, report } from '../lib/check-lib.mjs';
import { agentSuites, scenarioIndex } from '../lib/agent-suites.mjs';
import { checkSet } from '../lib/scenarios.mjs';

let a = null;
let prep = null;
try {
  a = await agentSuites(REPO);
} catch (error) {
  prep = error;
}
const need = () => { if (prep) throw prep; };

await report(['B6', 'I3'], [
  { name: 'every scenario set and scenario matches the scenario set interface', fn: () => { need(); none(a.sets.flatMap(checkSet), 'departures from I3'); } },
  {
    name: 'every scenario set holds at least one control scenario',
    fn: () => {
      need();
      none(a.sets.filter((s) => !s.scenarios.some((x) => x.scenario?.control === true)).map((s) => `${s.rel} has no scenario with control true`), 'sets without a control');
    },
  },
  {
    name: 'every ratio line names one scenario whose trials, threshold and tier it repeats',
    fn: () => {
      need();
      const index = scenarioIndex(a.sets);
      const problems = [];
      for (const read of a.statistical) {
        for (const r of read.ratios) {
          const hits = index.get(r.scenario) ?? [];
          if (hits.length !== 1) {
            problems.push(`${read.suite} line ${r.line}: scenario '${r.scenario}' matches ${hits.length} scenario folders`);
            continue;
          }
          const { set, scenario } = hits[0];
          if (scenario.scenario?.trials !== r.trials) problems.push(`${read.suite} line ${r.line}: N ${r.trials} where ${scenario.rel} declares ${scenario.scenario?.trials} trials`);
          if (scenario.scenario?.threshold !== r.threshold) problems.push(`${read.suite} line ${r.line}: threshold ${r.threshold} where ${scenario.rel} declares ${scenario.scenario?.threshold}`);
          if (set.set?.tier !== r.tier) problems.push(`${read.suite} line ${r.line}: tier ${r.tier} where ${set.rel} declares ${set.set?.tier}`);
        }
      }
      none(problems, 'ratio lines that do not repeat their declarations');
    },
  },
]);
