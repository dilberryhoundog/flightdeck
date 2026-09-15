// testbench/suites/_checks/lib/group-run.mjs — the body shared by the suite-group checks (B4, C2): run the suites of group k serially in the checkout, as run-all runs them, and require each to pass and to leave the temporary directory and the checkout as it found them.
// Usage: import { runGroup } from '../lib/group-run.mjs'; await runGroup(3);
//
// The suites run-all runs are sorted by name and dealt round-robin into GROUPS groups (../lib/check-lib.mjs groupSuites), so the whole
// suite is green exactly when every group check is green, and no one command runs more than an eighth of it. Each suite runs with
// the scrubbed environment and a private TMPDIR; a new 'git status --porcelain' line outside flightdeck/testbench/runs/ after a suite
// is charged to that suite.

import { ensure, GROUPS, groupSuites, none, oneLine, REPO, report, suiteOutputs } from './check-lib.mjs';

export async function runGroup(k) {
  const suites = groupSuites(REPO, k);
  let runs = null;
  let prep = null;
  try {
    runs = await suiteOutputs(REPO, { mode: 'group', only: suites, trackStatus: true });
  } catch (error) {
    prep = error;
  }
  const need = () => { if (prep) throw new Error(oneLine(prep)); };
  await report(['B4', 'C2'], [
    ...suites.map((suite) => ({
      name: `suite ${suite} of group ${k} of ${GROUPS} exits 0`,
      fn: () => {
        need();
        const run = runs.get(suite);
        const fails = run.stdout.split('\n').filter((l) => l.startsWith('FAIL')).slice(0, 3);
        ensure(run.exit === 0, `exit ${run.exit}${run.signal ? ` (${run.signal})` : ''}${fails.length ? `: ${fails.join(' | ')}` : ''}`);
      },
    })),
    {
      name: `the suites of group ${k} of ${GROUPS} leave no entry in their temporary directory`,
      fn: () => { need(); none(suites.filter((s) => runs.get(s).tmp_left.length > 0).map((s) => `${s} left ${runs.get(s).tmp_left.join(', ')}`), 'suites leaking'); },
    },
    {
      name: `the suites of group ${k} of ${GROUPS} leave the checkout's git status unchanged`,
      fn: () => { need(); none(suites.filter((s) => (runs.get(s).status_added ?? []).length > 0).map((s) => `${s} added ${runs.get(s).status_added.join(', ')}`), 'suites writing into the checkout'); },
    },
  ]);
}
