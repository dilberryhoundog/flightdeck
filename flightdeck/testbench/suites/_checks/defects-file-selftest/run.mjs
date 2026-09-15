// testbench/suites/_checks/defects-file-selftest/run.mjs — T27 (E10): a defect line a suite prints that the defects file does not carry fails the defects check naming the suite and the case.
// Usage: node flightdeck/testbench/suites/_checks/defects-file-selftest/run.mjs; exit 0 when each fault is reported by name, 2 otherwise.

import { ensure, report, specIds } from '../lib/check-lib.mjs';
import { defectsFileProblems, printedDefects } from '../lib/rules.mjs';

const ids = specIds();
const outputs = new Map([
  ['hooks-lock-guard', { suite: 'hooks-lock-guard', exit: 0, stdout: 'defect: the guard should deny a rename into a locked path (flightdeck/manuals/harness/hooks.md:12)\npass  lock-guard allows a rename into a locked path [defect]\ncovers: B10\n1/1 passed\n' }],
  ['fc-report', { suite: 'fc-report', exit: 0, stdout: 'pass  fc report renders the ledger\ndefect: the report should list quarantined ids (flightdeck/manuals/orchestration/run-report.md:30)\npass  fc report omits quarantined ids [defect]\ncovers: B10\n2/2 passed\n' }],
]);
const printed = printedDefects(outputs, ids);
const LINE_A = 'hooks-lock-guard · lock-guard allows a rename into a locked path [defect] · the guard should deny a rename into a locked path · flightdeck/manuals/harness/hooks.md:12';
const LINE_B = 'fc-report · fc report omits quarantined ids · the report should list quarantined ids · (flightdeck/manuals/orchestration/run-report.md:30)';

await report(['E10'], [
  { name: 'the suites of the fixture print two defects', fn: () => ensure(printed.length === 2, `read ${printed.length} defects`) },
  { name: 'a defects file carrying both defect lines is admitted', fn: () => { const p = defectsFileProblems(printed, `# Defects\n\n${LINE_A}\n${LINE_B}\n`, 'defects.md'); ensure(p.length === 0, p.join('; ')); } },
  {
    name: 'a defects file missing a printed defect is reported naming the suite and the case',
    fn: () => {
      const p = defectsFileProblems(printed, `${LINE_A}\n`, 'defects.md');
      ensure(p.length === 1 && p[0].includes('suite fc-report') && p[0].includes('fc report omits quarantined ids'), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a defects file whose text differs from the printed defect line is reported',
    fn: () => {
      const p = defectsFileProblems(printed, `${LINE_A}\n${LINE_B.replace('should list', 'lists')}\n`, 'defects.md');
      ensure(p.some((x) => x.includes('suite fc-report')), `got: ${p.join('; ') || 'none'}`);
    },
  },
  {
    name: 'a defects file line in the wrong form or carrying a defect no suite prints is reported with its line',
    fn: () => {
      const p = defectsFileProblems(printed, `${LINE_A}\n${LINE_B}\nnot a defect line\nbin-check · a case · a defect · flightdeck/manuals/harness/hooks.md:3\n`, 'defects.md');
      ensure(p.some((x) => x.startsWith('defects.md:3 ')) && p.some((x) => x.startsWith('defects.md:4 ') && /no suite prints/.test(x)), `got: ${p.join('; ') || 'none'}`);
    },
  },
]);
