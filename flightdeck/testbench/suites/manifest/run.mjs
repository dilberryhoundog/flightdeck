// testbench/suites/manifest/run.mjs — T28 (spec B38, I13): flightcrew/MANIFEST.txt lists one repository-relative path per line (comments start with #), every path exists and is a non-empty file, every file the scope names is listed, and no launch folder other than launch/specs and the buildout appears.
// Usage: node flightdeck/testbench/suites/manifest/run.mjs; exit 0 when every case passes, 2 otherwise. Reads the repository only.

import fs from 'node:fs';
import path from 'node:path';
import { suite, REPO, FD, readText, exists, assert, assertEq } from '../../lib/suite-lib.mjs';

const MANIFEST = path.join(FD, 'flightcrew', 'MANIFEST.txt');

const ROLES = ['spec-builder', 'spec-judge', 'spec-attacker', 'explorer', 'test-builder', 'planner', 'orchestrator', 'implementer', 'verifier', 'critic'];
const SCHEMAS = ['spec', 'launch', 'tests-map', 'plan', 'event', 'check-result', 'explorer-return', 'worker-return', 'verifier-verdict', 'critic-findings'];
const SUITES = [
  'e2e', 'bin-launch', 'hooks-noop', 'hooks-eventlog', 'hooks-guards', 'hooks-structural', 'hooks-stopgate', 'bin-check', 'bin-boundary', 'bin-report',
  'bin-evidence', 'bin-runlog', 'bin-plan', 'validate-spec', 'validate-tests-map', 'validate-plan', 'validate-launch', 'lint-spec', 'bin-dispatch',
  'bin-distribute', 'bin-doctor', 'crew', 'run-all', 'constraints', 'hook-timing', 'schemas', 'templates', 'manifest', 'workflows',
];
const MANUALS = [
  'manuals/README.md',
  ...['journey', 'planning', 'kickoff', 'review', 'endings', 'run-log', 'run-report', 'crew'].map((n) => `manuals/orchestration/${n}.md`),
  ...['hooks', 'permissions', 'workflows'].map((n) => `manuals/harness/${n}.md`),
  'manuals/launch/launch-anatomy.md',
];

const COMMANDS = [
  'launch', 'check', 'verify', 'boundary', 'locked', 'budget', 'events', 'evidence', 'report', 'runlog',
  'plan', 'validate', 'lint', 'worker', 'critic', 'verifier', 'return', 'distribute', 'doctor',
];
const VALIDATORS = ['validate-spec', 'validate-tests-map', 'validate-plan', 'validate-launch', 'validate-return', 'validate-kickoff', 'validate-all', 'spec-readiness-lint'];
const CHECK_LIBS = ['schema-lib', 'spec-lib', 'launch-lib', 'git-lib', 'glob-lib', 'output', 'render-lib'];
const GATES = ['acceptance-gate', 'structural-gate', 'contracts-gate'];
const KICKOFF_PARTS = ['base', 'shape-session', 'shape-workflow', 'shape-sessions', 'task-feature', 'task-migration', 'task-audit', 'task-agent'];
const FIXTURE_FILES = [
  'testbench/fixtures/sample-project/README.md',
  'testbench/fixtures/sample-spec/spec.v1.json',
  'testbench/fixtures/sample-launch/launch.json',
];

/** The files the spec's scope and interfaces name by path; every one must appear in the manifest. */
const REQUIRED = [
  'flightcrew/bin/fc',
  'flightcrew/bin/fc.mjs',
  ...COMMANDS.map((n) => `flightcrew/bin/cmd/${n}.mjs`),
  'flightcrew/MANIFEST.txt',
  'flightcrew/README.md',
  ...CHECK_LIBS.map((n) => `flightcrew/checks/lib/${n}.mjs`),
  ...VALIDATORS.map((n) => `flightcrew/checks/validators/${n}.mjs`),
  ...GATES.map((n) => `flightcrew/checks/gates/${n}.mjs`),
  'flightcrew/hooks/README.md',
  'flightcrew/hooks/settings.fragment.json',
  ...['event-log', 'lock-guard', 'boundary-guard', 'structural-check', 'stop-gate'].map((n) => `flightcrew/hooks/${n}.mjs`),
  ...SCHEMAS.map((n) => `flightcrew/schemas/${n}.schema.json`),
  'flightcrew/crew/README.md',
  ...ROLES.map((n) => `flightcrew/crew/${n}.md`),
  'flightcrew/workflows/README.md',
  ...['fc-implement', 'fc-review', 'fc-explore'].map((n) => `flightcrew/workflows/${n}.js`),
  'flightcrew/templates/constitution-fragment.md',
  ...KICKOFF_PARTS.map((n) => `flightcrew/templates/kickoff/${n}.md`),
  'launch/README.md',
  'launch/RUNLOG.md',
  'launch/specs/flightcrew-v1/spec.v1.json',
  'launch/specs/flightcrew-v1/tests-map.v1.json',
  'launch/flightcrew-buildout/launch.json',
  'testbench/README.md',
  'testbench/run-all.mjs',
  ...SUITES.map((n) => `testbench/suites/${n}/run.mjs`),
  ...FIXTURE_FILES,
  ...MANUALS,
].map((p) => `flightdeck/${p}`);

const LAUNCH_ALLOWED = ['flightdeck/launch/specs/', 'flightdeck/launch/flightcrew-buildout/', 'flightdeck/launch/README.md', 'flightdeck/launch/RUNLOG.md', 'flightdeck/launch/runs.keep'];

function entries() {
  assert(exists(MANIFEST), 'flightdeck/flightcrew/MANIFEST.txt exists');
  return readText(MANIFEST)
    .split('\n')
    .map((l) => l.trimEnd())
    .filter((l) => l.trim() !== '' && !l.trimStart().startsWith('#'))
    .map((l) => l.trim());
}

await suite('manifest', [
  {
    id: 'manifest-exists-with-path-lines',
    covers: ['I13'],
    fn: () => {
      const lines = entries();
      assert(lines.length > 0, 'MANIFEST.txt lists at least one path');
      for (const line of lines) {
        assert(!/\s/.test(line), `one path per line, no spaces: '${line}'`);
      }
    },
  },
  {
    id: 'every-path-exists-and-is-non-empty',
    covers: ['B38'],
    fn: () => {
      const problems = [];
      for (const line of entries()) {
        const full = path.join(REPO, line);
        if (!exists(full)) {
          problems.push(`${line}: missing`);
          continue;
        }
        const stat = fs.statSync(full);
        if (!stat.isFile()) problems.push(`${line}: not a file`);
        else if (stat.size === 0) problems.push(`${line}: empty`);
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'paths-are-repository-relative-under-flightdeck',
    covers: ['I13'],
    fn: () => {
      const problems = [];
      for (const line of entries()) {
        if (line.startsWith('/') || line.startsWith('./') || line.split('/').includes('..')) problems.push(`${line}: not a plain repository-relative path`);
        else if (!line.startsWith('flightdeck/')) problems.push(`${line}: outside flightdeck/`);
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'lists-every-file-the-scope-names',
    covers: ['I13'],
    fn: () => {
      const listed = new Set(entries());
      const missing = REQUIRED.filter((p) => !listed.has(p));
      assertEq(missing, [], 'spec-named files absent from MANIFEST.txt');
    },
  },
  {
    id: 'no-launch-folder-other-than-specs-and-the-buildout',
    covers: ['I13'],
    fn: () => {
      const offenders = entries().filter((line) => line.startsWith('flightdeck/launch/') && !LAUNCH_ALLOWED.some((ok) => line === ok || line.startsWith(ok)));
      assertEq(offenders, [], 'launch folders listed that are neither launch/specs nor the buildout');
    },
  },
]);
