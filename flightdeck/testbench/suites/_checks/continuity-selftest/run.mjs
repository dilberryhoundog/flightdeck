// testbench/suites/_checks/continuity-selftest/run.mjs — T29 (E6): an earlier case name that appears neither in the new suite nor in the mapping file fails the continuity check naming the case.
// Usage: node flightdeck/testbench/suites/_checks/continuity-selftest/run.mjs; exit 0 when each fault is reported by name, 2 otherwise.

import { ensure, report } from '../lib/check-lib.mjs';
import { continuityProblems } from '../lib/rules.mjs';

const earlier = [
  { suite: 'bin-check', name: 'check-runs-every-check' },
  { suite: 'bin-check', name: 'check-writes-evidence' },
  { suite: 'crew', name: 'every-role-has-a-name' },
];
const printed = new Map([
  ['fc-check', new Set(['check-runs-every-check', 'fc check writes one evidence file per check'])],
  ['crew-files', new Set(['flightdeck/flightcrew/crew/critic.md carries a name'])],
]);

await report(['E6'], [
  {
    name: 'names carried verbatim or through a mapping to a printed case are admitted',
    fn: () => {
      const p = continuityProblems(earlier, printed, {
        'bin-check · check-writes-evidence': 'fc-check · fc check writes one evidence file per check',
        'crew · every-role-has-a-name': 'crew-files · flightdeck/flightcrew/crew/critic.md carries a name',
      });
      ensure(p.length === 0, p.join('; '));
    },
  },
  {
    name: 'a name in neither the new suite nor the mapping file is reported naming the case',
    fn: () => {
      const p = continuityProblems(earlier, printed, { 'bin-check · check-writes-evidence': 'fc-check · fc check writes one evidence file per check' });
      ensure(p.length === 1 && p[0].includes("'every-role-has-a-name'") && p[0].includes('suite crew'), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a name mapped to a case no suite prints is reported naming the case',
    fn: () => {
      const p = continuityProblems(earlier, printed, {
        'bin-check · check-writes-evidence': 'fc-check · a case that does not exist',
        'crew · every-role-has-a-name': 'crew-files · flightdeck/flightcrew/crew/critic.md carries a name',
      });
      ensure(p.length === 1 && p[0].includes("'check-writes-evidence'") && /no suite prints/.test(p[0]), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'with no mapping file every name missing from the new suite is reported',
    fn: () => {
      const p = continuityProblems(earlier, printed, null);
      ensure(p.length === 2, `got: ${p.join('; ') || 'none'}`);
    },
  },
]);
