// testbench/suites/_checks/runall-hygiene/run.mjs — T30 (E5, C2): a suite that writes into the checkout, leaves a file in the temporary directory, or leaves the checkout's settings changed makes run-all fail on hygiene naming that suite.
// Usage: node flightdeck/testbench/suites/_checks/runall-hygiene/run.mjs; exit 0 when run-all names every offender and passes a clean set, 2 otherwise.
//
// Each variant is a snapshot copy whose suites folder holds only 'aa-clean' (one passing case) and, except in the control, one
// offending suite. run-all is run there with the scrubbed environment. An offender must bring exit 2 and a line mentioning hygiene
// that carries the offender's name and not the clean suite's. The checkout's settings are .claude/settings.json.

import fs from 'node:fs';
import path from 'node:path';
import { ensure, REPO, report, runNode, snapshotCopy, SUITES_REL, writeTree } from '../lib/check-lib.mjs';

const HEAD = [
  "import fs from 'node:fs';",
  "import os from 'node:os';",
  "import path from 'node:path';",
  "import { fileURLToPath } from 'node:url';",
  "const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');",
].join('\n');
const TAIL = "fs.writeSync(1, 'pass  the suite ran\\ncovers: E5\\n1/1 passed\\n');\nprocess.exit(0);\n";
const OFFENDERS = [
  { suite: 'bb-writes-checkout', what: 'writes into the checkout', body: "fs.writeFileSync(path.join(REPO, 'flightdeck', 'stray-from-a-suite.txt'), 'stray\\n');" },
  { suite: 'bb-leaks-tmpdir', what: 'leaves a file in the temporary directory', body: "fs.writeFileSync(path.join(os.tmpdir(), 'left-by-a-suite.txt'), 'left\\n');" },
  { suite: 'bb-changes-settings', what: "leaves the checkout's settings changed", body: "fs.appendFileSync(path.join(REPO, '.claude', 'settings.json'), '\\n');" },
];

function runVariant(offender) {
  const copy = snapshotCopy(REPO);
  try {
    const suitesDir = path.join(copy.dir, SUITES_REL);
    for (const entry of fs.readdirSync(suitesDir, { withFileTypes: true })) {
      if (entry.isDirectory() && !entry.name.startsWith('_')) fs.rmSync(path.join(suitesDir, entry.name), { recursive: true, force: true });
    }
    const files = { [`${SUITES_REL}/aa-clean/run.mjs`]: `${HEAD}\n${TAIL}` };
    if (offender) files[`${SUITES_REL}/${offender.suite}/run.mjs`] = `${HEAD}\n${offender.body}\n${TAIL}`;
    writeTree(copy.dir, files);
    return runNode(copy.dir, [path.join(copy.dir, 'flightdeck/testbench/run-all.mjs')]);
  } finally {
    copy.remove();
  }
}

await report(['E5', 'C2'], [
  {
    name: 'run-all passes a suite set that keeps hygiene',
    fn: () => {
      const r = runVariant(null);
      ensure(r.exit === 0, `run-all exited ${r.exit}: ${`${r.stdout}${r.stderr}`.trim().split('\n').slice(-4).join(' | ')}`);
    },
  },
  ...OFFENDERS.map((o) => ({
    name: `run-all fails on hygiene naming a suite that ${o.what}`,
    fn: () => {
      const r = runVariant(o);
      const lines = `${r.stdout}\n${r.stderr}`.split('\n');
      const hygiene = lines.filter((l) => /hygiene/i.test(l));
      ensure(r.exit === 2, `run-all exited ${r.exit}`);
      ensure(hygiene.some((l) => l.includes(o.suite)), `no hygiene line names ${o.suite}: ${hygiene.join(' | ') || 'no hygiene line'}`);
      ensure(!hygiene.some((l) => l.includes('aa-clean')), `a hygiene line names the clean suite: ${hygiene.join(' | ')}`);
    },
  })),
]);
