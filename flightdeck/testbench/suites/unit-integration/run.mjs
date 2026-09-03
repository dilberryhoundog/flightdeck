// testbench/suites/unit-integration/run.mjs — the integration unit's own suite (spec I13, B38, B9): MANIFEST.txt covers every file the system ships rather than only the paths the manifest suite names, it lists no run output, and the gate modules the stop-gate hook loads carry the interface the hook calls.
// Usage: node flightdeck/testbench/suites/unit-integration/run.mjs; exit 0 when every case passes, 2 otherwise. The repository is only read.

import fs from 'node:fs';
import path from 'node:path';
import { suite, REPO, FD, readText, exists, assert, assertEq } from '../../lib/suite-lib.mjs';

const MANIFEST = path.join(FD, 'flightcrew', 'MANIFEST.txt');
const SHIPPED_DIRS = ['flightcrew', 'launch', 'manuals', 'testbench'];
const GATES = ['acceptance-gate', 'structural-gate', 'contracts-gate'];

/** The files a run writes rather than the system shipping: they belong to no manifest line. */
const RUN_OUTPUT = {
  // testbench/runs/ holds one log per suite plus last.json; only its .gitignore ships.
  runs: (rel) => rel.startsWith('testbench/runs/') && rel !== 'testbench/runs/.gitignore',
  // Inside a launch folder only the launch's own inputs ship; evidence, events, returns and reports are rewritten by every command.
  launch: (rel) => {
    const match = /^launch\/(?!specs\/)([^/]+)\/(.+)$/.exec(rel);
    if (!match) return false;
    const inside = match[2];
    return !(inside === 'launch.json' || inside === 'kickoff.md' || inside === 'plan.json' || inside === 'plan.md' || inside.startsWith('specs/'));
  },
};

function isRunOutput(rel) {
  return Object.values(RUN_OUTPUT).some((test) => test(rel));
}

/** Every file under the four in-scope directories, as paths relative to flightdeck/, sorted. */
function shippedFiles() {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      if (entry.name === '.git') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (entry.isFile()) files.push(path.relative(FD, full).split(path.sep).join('/'));
    }
  };
  for (const name of SHIPPED_DIRS) {
    const dir = path.join(FD, name);
    assert(exists(dir), `in-scope directory exists: flightdeck/${name}`);
    visit(dir);
  }
  return files.filter((rel) => !isRunOutput(rel));
}

/** The manifest's path lines, comments and blank lines dropped. */
function entries() {
  assert(exists(MANIFEST), 'flightdeck/flightcrew/MANIFEST.txt exists');
  return readText(MANIFEST)
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !line.startsWith('#'));
}

await suite('unit-integration', [
  {
    id: 'every-shipped-file-is-listed-in-the-manifest',
    covers: ['I13'],
    fn: () => {
      const listed = new Set(entries().map((line) => line.replace(/^flightdeck\//, '')));
      const missing = shippedFiles().filter((rel) => !listed.has(rel));
      assertEq(missing, [], 'files under flightcrew/, launch/, manuals/ or testbench/ with no MANIFEST.txt line');
    },
  },
  {
    id: 'the-manifest-lists-no-run-output',
    covers: ['I13'],
    fn: () => {
      const offenders = entries()
        .map((line) => line.replace(/^flightdeck\//, ''))
        .filter((rel) => isRunOutput(rel));
      assertEq(offenders, [], 'MANIFEST.txt lines naming files a run rewrites');
    },
  },
  {
    id: 'the-gate-modules-the-stop-gate-loads-export-run',
    covers: ['B9'],
    fn: () => {
      const hook = readText(path.join(FD, 'flightcrew', 'hooks', 'stop-gate.mjs'));
      assert(/checks\/gates\//.test(hook), 'stop-gate.mjs loads its gates from flightcrew/checks/gates/');
      const problems = [];
      for (const name of GATES) {
        const file = path.join(FD, 'flightcrew', 'checks', 'gates', `${name}.mjs`);
        if (!exists(file)) {
          problems.push(`${name}.mjs is missing`);
          continue;
        }
        if (!/export\s+(?:async\s+)?function\s+run\b/.test(readText(file))) problems.push(`${name}.mjs exports no run function`);
      }
      assertEq(problems, [], 'gate modules missing the interface the stop gate calls');
    },
  },
  {
    id: 'every-manifest-path-is-inside-the-repository',
    covers: ['B38'],
    fn: () => {
      const problems = [];
      for (const line of entries()) {
        const full = path.resolve(REPO, line);
        if (!full.startsWith(REPO + path.sep)) problems.push(`${line}: resolves outside the repository`);
      }
      assertEq(problems, [], 'MANIFEST.txt lines escaping the repository root');
    },
  },
]);
