#!/usr/bin/env node
// suites/flight-freeze — flight freeze: the status and commit a frozen document carries, the version pin it writes into the record, and the lock commit a map sets. Covers B92, B93, B94, I4.
import path from 'node:path';
import { assert, assertEq, assertExit, assertMatch, flight, git, head, mkCoreLaunch, readJson, suite, writeJson } from '../../lib/core-lib.mjs';

/** The fixture launch with its spec, map and plan set back to draft and committed, so freeze has something to do. */
function drafted() {
  const made = mkCoreLaunch();
  for (const rel of [['specs', 'spec.v1.json'], ['specs', 'tests-map.v1.json'], ['runs', 'run-1', 'plan.json']]) {
    const file = path.join(made.launchDir, ...rel);
    const document = readJson(file);
    delete document.commit;
    writeJson(file, { ...document, status: 'draft' });
  }
  const record = readJson(path.join(made.launchDir, 'launch.json'));
  record.tests_map = null;
  record.runs = record.runs.map((entry) => ({ ...entry, lock_commit: null }));
  writeJson(path.join(made.launchDir, 'launch.json'), record);
  git(made.root, ['add', '-A']);
  git(made.root, ['commit', '-q', '--no-verify', '-m', 'drafts']);
  return { ...made, at: (...parts) => path.posix.join('flightdeck', 'launch', made.launch, ...parts) };
}

const freeze = (made, target) => flight(['freeze', target], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('flight-freeze', [
  {
    id: 'B92 freezing a spec sets status frozen and commit to HEAD',
    covers: ['B92', 'I4'],
    fn: () => {
      const made = drafted();
      const at = head(made.root);
      assertExit(freeze(made, made.at('specs/spec.v1.json')), 0, 'flight freeze on the spec');
      const spec = readJson(path.join(made.launchDir, 'specs', 'spec.v1.json'));
      assertEq(spec.status, 'frozen', 'status');
      assertMatch(spec.commit, /^[0-9a-f]{7,40}$/, 'commit is 7 to 40 hex characters');
      assert(at.startsWith(spec.commit), `commit ${spec.commit} is the HEAD ${at}`);
    },
  },
  {
    id: 'B93 freezing a spec writes its version pin into the record',
    covers: ['B93'],
    fn: () => {
      const made = drafted();
      assertExit(freeze(made, made.at('specs/spec.v1.json')), 0, 'flight freeze on the spec');
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      assertEq(record.spec, { version: 1 }, 'the spec pin');
    },
  },
  {
    id: 'B93 freezing a map writes its version pin into the record',
    covers: ['B93'],
    fn: () => {
      const made = drafted();
      assertExit(freeze(made, made.at('specs/tests-map.v1.json')), 0, 'flight freeze on the map');
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      assertEq(record.tests_map, { version: 1 }, 'the tests_map pin');
    },
  },
  {
    id: 'B92 freezing a map sets its own status and commit',
    covers: ['B92', 'I4'],
    fn: () => {
      const made = drafted();
      const at = head(made.root);
      assertExit(freeze(made, made.at('specs/tests-map.v1.json')), 0, 'flight freeze on the map');
      const map = readJson(path.join(made.launchDir, 'specs', 'tests-map.v1.json'));
      assertEq(map.status, 'frozen', 'status');
      assert(at.startsWith(map.commit), `commit ${map.commit} is the HEAD ${at}`);
    },
  },
  {
    id: 'B94 freezing a map sets the current run lock_commit to HEAD',
    covers: ['B94'],
    fn: () => {
      const made = drafted();
      const at = head(made.root);
      assertExit(freeze(made, made.at('specs/tests-map.v1.json')), 0, 'flight freeze on the map');
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      const entry = record.runs.find((r) => r.n === record.current_run);
      assert(at.startsWith(entry.lock_commit) || entry.lock_commit === at, `lock_commit ${entry.lock_commit} is the HEAD ${at}`);
    },
  },
  {
    id: 'B94 freezing a spec leaves lock_commit alone',
    covers: ['B94'],
    fn: () => {
      const made = drafted();
      assertExit(freeze(made, made.at('specs/spec.v1.json')), 0, 'flight freeze on the spec');
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      assertEq(record.runs.find((r) => r.n === record.current_run).lock_commit, null, 'lock_commit is untouched by a spec freeze');
    },
  },
  {
    id: 'I4 freezing the plan sets its status and commit and pins nothing',
    covers: ['I4'],
    fn: () => {
      const made = drafted();
      const at = head(made.root);
      assertExit(freeze(made, made.at('runs/run-1/plan.json')), 0, 'flight freeze on the plan');
      const plan = readJson(path.join(made.runDir, 'plan.json'));
      assertEq(plan.status, 'frozen', 'status');
      assert(at.startsWith(plan.commit), `commit ${plan.commit} is the HEAD ${at}`);
      const record = readJson(path.join(made.launchDir, 'launch.json'));
      assertEq(record.tests_map, null, 'freezing a plan pins no map version');
      assertEq(record.runs.find((r) => r.n === record.current_run).lock_commit, null, 'freezing a plan sets no lock commit');
    },
  },
]);
