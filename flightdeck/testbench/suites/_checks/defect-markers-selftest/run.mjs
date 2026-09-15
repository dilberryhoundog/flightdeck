// testbench/suites/_checks/defect-markers-selftest/run.mjs — T25 (E7): a case marked as a defect that fails, or a defect line with no marked case beneath it, fails the check naming the case.
// Usage: node flightdeck/testbench/suites/_checks/defect-markers-selftest/run.mjs; exit 0 when each fault is reported by name, 2 otherwise.

import { ensure, report, specIds } from '../lib/check-lib.mjs';
import { defectProblems } from '../lib/rules.mjs';

const ids = specIds();
const REF = '(flightdeck/manuals/harness/hooks.md:12)';
const one = (stdout, exit) => defectProblems(new Map([['hooks-lock-guard', { suite: 'hooks-lock-guard', stdout, exit }]]), ids);

await report(['E7'], [
  {
    name: 'a sound defect marker is admitted',
    fn: () => {
      const p = one(`defect: the guard should deny a rename into a locked path ${REF}\npass  lock-guard allows a rename into a locked path [defect]\ncovers: B10\n1/1 passed\n`, 0);
      ensure(p.length === 0, p.join('; '));
    },
  },
  {
    name: 'a marked case that fails on the current behaviour is reported naming the case',
    fn: () => {
      const p = one(`defect: the guard should deny a rename into a locked path ${REF}\nFAIL  lock-guard allows a rename into a locked path [defect]: it denied\ncovers: B10\n0/1 passed\n`, 2);
      ensure(p.some((x) => x.includes('hooks-lock-guard') && x.includes('lock-guard allows a rename into a locked path [defect]') && /fails on the current behaviour/.test(x)), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a defect line followed by an unmarked case is reported naming the case',
    fn: () => {
      const p = one(`defect: the guard should deny a rename into a locked path ${REF}\npass  lock-guard allows a rename into a locked path\ncovers: B10\n1/1 passed\n`, 0);
      ensure(p.some((x) => x.includes('hooks-lock-guard') && x.includes("'lock-guard allows a rename into a locked path'")), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a defect line with no case beneath it is reported naming the suite and line',
    fn: () => {
      const p = one(`pass  lock-guard denies an edit to a locked path\ndefect: the guard should deny a rename into a locked path ${REF}\ncovers: B10\n1/1 passed\n`, 0);
      ensure(p.some((x) => x.startsWith('hooks-lock-guard: line 2: ') && /not followed by a case marked/.test(x)), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a marked case with no defect line above it is reported naming the case',
    fn: () => {
      const p = one('pass  lock-guard allows a rename into a locked path [defect]\ncovers: B10\n1/1 passed\n', 0);
      ensure(p.some((x) => x.includes('lock-guard allows a rename into a locked path [defect]') && /not preceded by a defect line/.test(x)), `got: ${p.join('; ') || 'none'}`);
    },
  },
]);
