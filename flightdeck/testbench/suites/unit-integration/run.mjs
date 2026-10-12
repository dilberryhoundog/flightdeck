// testbench/suites/unit-integration/run.mjs — the integration unit's own suite (spec I13, B38, B9): MANIFEST.txt covers every file the system ships rather than only the paths the manifest suite names, it lists no run output, and the gate modules the stop-gate hook loads carry the interface the hook calls; each of the three gates, run from the command line against a temporary sample launch, exits as its usage line states.
// Usage: node flightdeck/testbench/suites/unit-integration/run.mjs; exit 0 when every case passes, 2 otherwise. The repository is only read; the gates run in temporary repositories.

import fs from 'node:fs';
import path from 'node:path';
import { suite, mkActiveLaunch, sh, REPO, FD, readJson, writeJson, readText, writeText, exists, assert, assertEq, assertExit, assertMatch } from '../../lib/suite-lib.mjs';

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
    // Only this system's own first run ships its inputs; every other launch folder is run output.
    if (match[1] !== 'flightcrew-buildout') return true;
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

// ── the gates from the command line ──────────────────────────────────────────
const GATES_DIR = path.join(FD, 'flightcrew', 'checks', 'gates');
const MAP_REL = path.join('specs', 'export-html', 'tests-map.v1.json');
const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** The sample launch in the given phase, its base and lock commits pinned to the temporary repository's HEAD so fc boundary has a real base. */
function gateLaunch(phase) {
  const L = mkActiveLaunch();
  const head = sh('git rev-parse HEAD', { cwd: L.root });
  assertExit(head, 0, 'git rev-parse HEAD in the temporary repository');
  const file = path.join(L.launchDir, 'launch.json');
  const launch = readJson(file);
  launch.phase = phase;
  launch.base_commit = head.stdout.trim();
  launch.lock_commit = head.stdout.trim();
  writeJson(file, launch);
  return L;
}

/** Rewrites one check's command in the launch's pinned tests map. */
function setCheck(L, id, command) {
  const file = path.join(L.launchDir, MAP_REL);
  const map = readJson(file);
  const check = map.checks.find((c) => c.id === id);
  assert(check, `the pinned sample map carries ${id}`);
  check.command = command;
  writeJson(file, map);
}

/** Runs one gate script as a child process in the launch's root, the launch selected through FLIGHTCREW_LAUNCH. */
function runGate(L, name, args = []) {
  const script = path.join(GATES_DIR, `${name}.mjs`);
  const r = sh([process.execPath, script, ...args].map(q).join(' '), { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
  return { ...r, out: `${r.stdout}${r.stderr}` };
}

const gateCases = [
  {
    id: 'flightdeck/flightcrew/checks/gates/acceptance-gate.mjs exits 0 when the acceptance check passes',
    fn: () => {
      const r = runGate(gateLaunch('verify'), 'acceptance-gate');
      assertExit(r, 0, 'acceptance gate on the shipped sample launch, whose T1 passes');
      assertMatch(r.stdout, /^acceptance gate: T1 pass$/m, 'the gate reports T1 pass');
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/gates/acceptance-gate.mjs exits 2 when the acceptance check fails',
    fn: () => {
      const L = gateLaunch('verify');
      setCheck(L, 'T1', 'sh -c "echo smoke broken; exit 3"');
      const r = runGate(L, 'acceptance-gate');
      assertExit(r, 2, 'acceptance gate with a red T1');
      assertMatch(r.stderr, /^T1 exit 3$/m, 'the gate names the check and its exit code');
      assertMatch(r.stderr, /smoke broken/, 'the gate carries the check output');
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/gates/contracts-gate.mjs exits 0 when the contracts unit check passes and the boundary is clean',
    fn: () => {
      const r = runGate(gateLaunch('contracts'), 'contracts-gate');
      assertExit(r, 0, 'contracts gate on the shipped sample launch, whose contracts unit checks T3');
      assertMatch(r.stdout, /^contracts gate: T3 pass$/m, 'the gate reports T3 pass');
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/gates/contracts-gate.mjs exits 2 when the contracts unit check fails while its baseline expects a pass',
    fn: () => {
      const L = gateLaunch('contracts');
      setCheck(L, 'T3', 'sh -c "echo contract broken; exit 4"');
      const r = runGate(L, 'contracts-gate');
      assertExit(r, 2, 'contracts gate with a red T3 whose baseline expects pass');
      assertMatch(r.stderr, /^T3 exit 4$/m, 'the gate names the check and its exit code');
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/gates/structural-gate.mjs exits 0 on a JSON file that parses',
    fn: () => {
      const L = gateLaunch('implement');
      const file = path.join(L.root, 'data', 'sound.json');
      writeText(file, '{ "pages": 3 }\n');
      const r = runGate(L, 'structural-gate', [file]);
      assertExit(r, 0, 'structural gate on a JSON file that parses');
      assertMatch(r.stdout, /^structural gate: sound\.json parses$/m, 'the gate reports the file parses');
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/gates/structural-gate.mjs exits 2 on a JSON file that does not parse',
    fn: () => {
      const L = gateLaunch('implement');
      const file = path.join(L.root, 'data', 'broken.json');
      writeText(file, '{ "pages": 3,\n');
      const r = runGate(L, 'structural-gate', [file]);
      assertExit(r, 2, 'structural gate on a JSON file that does not parse');
      assertMatch(r.stderr, /JSON/, 'the gate carries the parse error of the launch structural command');
    },
  },
];

await suite({ name: 'unit-integration', covers: ['B1', 'B2'] }, [
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
  ...gateCases,
]);
