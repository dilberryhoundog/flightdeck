// testbench/suites/bin-launch/run.mjs — regression suite T2: the fc launch command family (new, activate, status, phase, gate, end, pin, kickoff, escalate, note, land), fc plan write and launch selection, driven over temporary repositories built from the fixtures. Covers B1, B2, B3, B32, B35, B41, B44, B45, B47, B49, B50, B52, B54, I1, E1, E3, E6, E7, E12, E15, E18, E20, E22, E24.
// Usage: node flightdeck/testbench/suites/bin-launch/run.mjs — no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers:' line and '<n>/<m> passed'; exit 0 when every case passes, else 2.
//
// Every case runs fc against a temporary copy of the sample project, spec and launch; nothing here touches the repository. Assertions read only the public surface: exit codes, stdout and stderr, launch.json, kickoff.md, events.jsonl and the files the spec names. Commit hashes are compared by prefix (7-40 hex).

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, hook, sh, mkLaunchRepo, mkActiveLaunch, FIXTURES, TEMPLATES, FC, FC_MJS,
  readJson, writeJson, readText, writeText, exists, listFiles,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const FROZEN_MAP = path.join(FIXTURES, 'sample-launch', 'specs', 'export-html', 'tests-map.v1.json');
const SAMPLE_PLAN = path.join(FIXTURES, 'sample-spec', 'plan.sample.json');
const HASH = /^[0-9a-f]{7,40}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

// ── git and file helpers ──────────────────────────────────────────────────────
function git(root, args) {
  const r = sh(`git ${args}`, { cwd: root });
  if (r.code !== 0) throw new Error(`git ${args} failed: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout.trim();
}
const head = (root) => git(root, 'rev-parse HEAD');
const rootCommit = (root) => git(root, 'rev-list --max-parents=0 HEAD');
function commitAll(root, message) {
  git(root, 'add -A');
  git(root, `commit -q --no-verify --allow-empty -m "${message}"`);
  return head(root);
}
const launchDir = (root, name) => path.join(root, 'flightdeck', 'launch', name);
const readLaunch = (root, name) => readJson(path.join(launchDir(root, name), 'launch.json'));
function patchLaunch(root, name, fn) {
  const p = path.join(launchDir(root, name), 'launch.json');
  const j = readJson(p);
  fn(j);
  writeJson(p, j);
  return j;
}
function events(root, name) {
  const p = path.join(launchDir(root, name), 'events.jsonl');
  if (!exists(p)) return [];
  return readText(p).split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l));
}
function writeEvents(root, name, list) {
  writeText(path.join(launchDir(root, name), 'events.jsonl'), `${list.map((e) => JSON.stringify(e)).join('\n')}\n`);
}
const lastEvent = (root, name) => events(root, name).at(-1);
const out = (r) => `${r.stdout}\n${r.stderr}`;
function tail(text, n = 5) {
  return String(text ?? '').split('\n').filter((l) => l.trim() !== '').slice(-n).join(' / ') || '(empty)';
}
function assertPrefixHash(actual, full, msg) {
  assert(typeof actual === 'string' && HASH.test(actual), `${msg}: expected a 7-40 hex hash, got ${JSON.stringify(actual)}`);
  assert(full.startsWith(actual), `${msg}: expected a prefix of ${full}, got ${actual}`);
}
function assertRefused(r, msg) {
  assert(r.code === 1 || r.code === 2, `${msg}: expected exit 1 or 2, got ${r.code} | stdout: ${tail(r.stdout)} | stderr: ${tail(r.stderr)}`);
}
/** Guards cases whose expected outcome is a non-zero exit: an absent fc would exit 1 too, and a case must never pass because the thing under test is missing. */
function fcPresent() {
  assert(exists(FC), 'flightdeck/flightcrew/bin/fc exists');
  assert(exists(FC_MJS), 'flightdeck/flightcrew/bin/fc.mjs exists');
}
const part = (name) => readText(path.join(TEMPLATES, 'kickoff', `${name}.md`)).trim();

// ── hook envelopes (manuals/harness/claude-code-facts.md: common fields plus the per-event fields) ──
const envelope = (root, extra) => ({ session_id: 'suite-session', transcript_path: `${root}/.transcript.jsonl`, cwd: root, permission_mode: 'acceptEdits', ...extra });
const sessionStart = (root) => envelope(root, { hook_event_name: 'SessionStart', mode: 'startup' });
const sessionEnd = (root) => envelope(root, { hook_event_name: 'SessionEnd', reason: 'exit' });
const stopTurn = (root) => envelope(root, { hook_event_name: 'Stop', stop_reason: 'end_turn', stop_hook_active: false });
const editLocked = (root) => envelope(root, { hook_event_name: 'PreToolUse', tool_name: 'Edit', tool_use_id: 'suite-tool-1', tool_input: { file_path: 'tests/export/behaviours.test.mjs' } });
const wroteSource = (root) => envelope(root, { hook_event_name: 'PostToolUse', tool_name: 'Write', tool_use_id: 'suite-tool-2', tool_input: { file_path: path.join(root, 'src', 'export', 'index.mjs') }, tool_result: {} });
/** The permissionDecision a guard printed, or a message saying what it printed instead. */
function decisionOf(r, name) {
  assert(r.decision && r.decision.hookSpecificOutput, `${name} prints a PreToolUse decision object: stdout ${tail(r.stdout)} | stderr ${tail(r.stderr)}`);
  assertEq(r.decision.hookSpecificOutput.hookEventName, 'PreToolUse', `${name} decision names the event`);
  return r.decision.hookSpecificOutput.permissionDecision;
}

// ── fixture builders ──────────────────────────────────────────────────────────
function freezeMap(repo) {
  fs.copyFileSync(FROZEN_MAP, path.join(repo.root, repo.mapPath));
  commitAll(repo.root, 'freeze tests map');
  return repo;
}
function addSpec(repo, name, mutate, commit = true) {
  const spec = readJson(path.join(repo.root, repo.specPath));
  spec.name = name;
  if (mutate) mutate(spec);
  const rel = `flightdeck/launch/specs/${name}/spec.v1.json`;
  writeJson(path.join(repo.root, rel), spec);
  if (commit) commitAll(repo.root, `add spec ${name}`);
  return rel;
}
const draftSpec = (repo, commit = true) => addSpec(repo, 'draft-spec', (s) => { s.status = 'draft'; delete s.commit; }, commit);
function newLaunch(repo, name, extra = [], specPath = repo.specPath) {
  const r = fc(['launch', 'new', specPath, '--name', name, ...extra], { cwd: repo.root });
  assertExit(r, 0, `fc launch new ${name}`);
  return r;
}
function activate(repo, name, extra = []) {
  const r = fc(['launch', 'activate', name, ...extra], { cwd: repo.root });
  assertExit(r, 0, `fc launch activate ${name}`);
  return r;
}
const pinMap = (repo, name, extra = []) => fc(['launch', 'pin', 'tests-map', repo.mapPath, ...extra], { cwd: repo.root, env: { FLIGHTCREW_LAUNCH: name } });
/** A launch at phase targets with a frozen spec and a frozen map pinned: everything fc launch phase plan asks for. */
function pinnedLaunch(name = 'L1') {
  const repo = freezeMap(mkLaunchRepo());
  newLaunch(repo, name);
  activate(repo, name);
  assertExit(pinMap(repo, name), 0, 'fc launch pin tests-map (frozen map)');
  return { ...repo, name, dir: launchDir(repo.root, name) };
}
/** The sample launch made consistent with its temporary repository: base and lock commits at HEAD, shipped evidence removed. */
function activeAtHead(patch) {
  const L = mkActiveLaunch();
  const h = head(L.root);
  patchLaunch(L.root, L.launch, (j) => {
    j.base_commit = h;
    j.lock_commit = h;
    if (patch) patch(j);
  });
  fs.rmSync(path.join(L.launchDir, 'evidence'), { recursive: true, force: true });
  fs.mkdirSync(path.join(L.launchDir, 'evidence'));
  return L;
}
function checkAll(L) {
  const r = fc(['check', 'all'], { cwd: L.root, env: L.env });
  assertExit(r, 0, 'precondition: fc check all on the sample launch');
  const s = readJson(path.join(L.launchDir, 'evidence', 'summary.json'));
  assertPrefixHash(s.commit, head(L.root), 'precondition: evidence/summary.json.commit');
  assertEq([s.counts.fail, s.counts.error], [0, 0], 'precondition: summary counts');
  return s;
}
const endedPhaseReport = (patch) => activeAtHead((j) => { j.phase = 'report'; if (patch) patch(j); });

// ── cases ─────────────────────────────────────────────────────────────────────
await suite('bin-launch', [
  // ── launch new ──
  {
    id: 'new-creates-launch-folder',
    covers: ['B1', 'I1'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const r = newLaunch(repo, 'L1');
      assertIncludes(r.stdout, 'export FLIGHTCREW_LAUNCH=L1', 'stdout carries the export line');
      const dir = launchDir(repo.root, 'L1');
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.status, 'draft', 'status');
      assertEq(j.phase, 'targets', 'phase');
      assertEq(j.name, 'L1', 'name');
      assertIncludes(readText(path.join(dir, 'kickoff.md')), 'tests-map: (none)', 'kickoff header');
      assertEq(fs.statSync(path.join(dir, 'events.jsonl')).size, 0, 'events.jsonl is empty');
      for (const d of ['evidence', 'returns', 'review']) assert(fs.statSync(path.join(dir, d)).isDirectory(), `${d}/ is a directory`);
      assert(exists(path.join(dir, 'specs', 'export-html', 'spec.v1.json')), 'pinned spec copy exists');
    },
  },
  {
    id: 'new-copies-only-the-named-spec-file',
    covers: ['B1'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const dir = launchDir(repo.root, 'L1');
      assertEq(listFiles(path.join(dir, 'specs')), ['export-html/spec.v1.json'], 'specs/ holds the named file only');
      assertEq(readText(path.join(dir, 'specs', 'export-html', 'spec.v1.json')), readText(path.join(repo.root, repo.specPath)), 'copy is byte-equal');
    },
  },
  {
    id: 'new-records-launch-json-fields',
    covers: ['B2'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const h = head(repo.root);
      const fileCommit = git(repo.root, `log -1 --format=%H -- ${repo.specPath}`);
      newLaunch(repo, 'L1');
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.schema_version, 1, 'schema_version');
      assertEq(j.spec.name, 'export-html', 'spec.name');
      assertEq(j.spec.version, 1, 'spec.version');
      assertEq(j.spec.commit, 'a1b2c3d', 'spec.commit is the file\'s own commit header');
      assertPrefixHash(j.spec.file_commit, fileCommit, 'spec.file_commit is git log -1 for the file');
      assertPrefixHash(j.base_commit, h, 'base_commit is HEAD');
      assertEq(j.previous_launch, null, 'previous_launch');
      assertEq(j.tests_map, null, 'tests_map');
      assertEq(j.lock_commit, null, 'lock_commit');
      assertEq(j.allow_draft, false, 'allow_draft');
      assertEq(j.branch, 'run/L1', 'branch default');
      assertEq(j.paths.allowed, [], 'paths.allowed default');
      assertEq(j.paths.enforce_boundary, false, 'enforce_boundary default');
      assertMatch(j.kickoff.version, /^base@\d+\+shape-session@\d+\+task-feature@\d+$/, 'kickoff.version default parts');
      assertMatch(j.kickoff.path, /kickoff\.md$/, 'kickoff.path');
      assert(typeof j.spec.path === 'string' && j.spec.path.endsWith('specs/export-html/spec.v1.json'), `spec.path: ${j.spec.path}`);
      assert(exists(path.join(launchDir(repo.root, 'L1'), j.spec.path)) || exists(path.join(repo.root, j.spec.path)), 'spec.path resolves');
      for (const g of ['G1', 'G2', 'G3']) assertEq([j.gates[g].status, j.gates[g].at], ['pending', null], `gate ${g}`);
      assertEq([j.outcome, j.ended], [null, null], 'outcome and ended');
      assert(Number.isInteger(j.ceilings.stop_blocks) && j.ceilings.stop_blocks <= 8, 'ceilings.stop_blocks at most 8');
    },
  },
  {
    id: 'new-draft-spec-records-null-spec-commit',
    covers: ['B2'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const rel = draftSpec(repo);
      const fileCommit = git(repo.root, `log -1 --format=%H -- ${rel}`);
      newLaunch(repo, 'D1', [], rel);
      const j = readLaunch(repo.root, 'D1');
      assertEq(j.spec.commit, null, 'spec.commit is null while the file is draft');
      assertPrefixHash(j.spec.file_commit, fileCommit, 'spec.file_commit still recorded');
      assertEq(j.spec.name, 'draft-spec', 'spec.name');
    },
  },
  {
    id: 'new-untracked-spec-records-null-file-commit',
    covers: ['B2'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const rel = addSpec(repo, 'untracked-spec', null, false);
      newLaunch(repo, 'U1', [], rel);
      const j = readLaunch(repo.root, 'U1');
      assertEq(j.spec.file_commit, null, 'spec.file_commit is null for an untracked file');
      assertEq(j.spec.commit, 'a1b2c3d', 'spec.commit still read from the file');
    },
  },
  {
    id: 'new-previous-launch-newest-same-spec',
    covers: ['B2'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      newLaunch(repo, 'L2');
      assertEq(readLaunch(repo.root, 'L2').previous_launch, 'L1', 'L2 points at L1');
      assertEq(readLaunch(repo.root, 'L1').previous_launch, null, 'L1 unchanged');
    },
  },
  {
    id: 'new-previous-launch-null-for-other-spec',
    covers: ['B2'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const rel = addSpec(repo, 'other-spec');
      newLaunch(repo, 'O1', [], rel);
      assertEq(readLaunch(repo.root, 'O1').previous_launch, null, 'no launch of other-spec exists');
      newLaunch(repo, 'O2', [], rel);
      assertEq(readLaunch(repo.root, 'O2').previous_launch, 'O1', 'only the same spec name counts');
    },
  },
  {
    id: 'new-existing-name-exits-1',
    covers: ['E18'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const r = fc(['launch', 'new', repo.specPath, '--name', 'L1'], { cwd: repo.root });
      assertExit(r, 1, 'second launch new with the same name');
      assertIncludes(out(r), 'launch exists', 'message');
    },
  },
  {
    id: 'new-flags-branch-allow-kickoff',
    covers: ['I1'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1', ['--branch', 'feat/x', '--allow', 'src/**', '--allow', 'docs/**', '--kickoff', 'base+shape-workflow+task-migration']);
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.branch, 'feat/x', '--branch');
      assertIncludes(j.paths.allowed, 'src/**', '--allow seeds paths.allowed');
      assertIncludes(j.paths.allowed, 'docs/**', '--allow is repeatable');
      assertMatch(j.kickoff.version, /^base@\d+\+shape-workflow@\d+\+task-migration@\d+$/, 'kickoff.version names the parts');
      const kickoff = readText(path.join(launchDir(repo.root, 'L1'), 'kickoff.md'));
      assertMatch(kickoff.split('\n')[0], /^# Kickoff: task-migration · shape-workflow$/, 'title names task then shape');
      assertIncludes(kickoff, part('shape-workflow'), 'shape-workflow part present');
      assertIncludes(kickoff, part('task-migration'), 'task-migration part present');
      assert(!kickoff.includes(part('shape-session')), 'shape-session part absent');
    },
  },
  {
    id: 'new-kickoff-assembled-and-validates',
    covers: ['B32', 'I1'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const kickoff = readText(path.join(launchDir(repo.root, 'L1'), 'kickoff.md'));
      const base = part('base');
      const shape = part('shape-session');
      const task = part('task-feature');
      const iBase = kickoff.indexOf(base);
      const iShape = kickoff.indexOf(shape);
      const iTask = kickoff.indexOf(task);
      assert(iBase > 0, 'base.md follows the header');
      assert(iShape > iBase && iTask > iShape, `order header, base, shape, task (base ${iBase}, shape ${iShape}, task ${iTask})`);
      const header = kickoff.slice(0, iBase);
      assertMatch(header, /^# Kickoff: task-feature · shape-session\n/, 'title');
      assertIncludes(header, 'launch: flightdeck/launch/L1', 'launch line');
      assertMatch(header, /spec: flightdeck\/launch\/(L1\/)?specs\/export-html\/spec\.v1\.json @ a1b2c3d/, 'spec line');
      assertIncludes(header, 'tests-map: (none)', 'tests-map line');
      assertIncludes(header, 'read first: flightdeck/launch/RUNLOG.md', 'read first line');
      assertIncludes(header, 'prior reports: none', 'prior reports line');
      assertIncludes(header, 'write plan with: fc plan write', 'write plan line');
      assertIncludes(header, 'evidence: flightdeck/launch/L1/evidence.html', 'evidence line');
      const v = fc(['validate', 'kickoff', 'flightdeck/launch/L1/kickoff.md'], { cwd: repo.root, env: { FLIGHTCREW_LAUNCH: 'L1' } });
      assertExit(v, 0, 'validate-kickoff on the fresh kickoff while tests_map is null');
    },
  },

  // ── launch activate ──
  {
    id: 'activate-sets-active',
    covers: ['B3'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const r = activate(repo, 'L1');
      assertEq(readLaunch(repo.root, 'L1').status, 'active', 'status after activate');
      assert(r.stdout.trim().split('\n').length <= 1, `at most one stdout line on success: ${tail(r.stdout)}`);
    },
  },
  {
    id: 'activate-refused-while-another-active',
    covers: ['B3'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      newLaunch(repo, 'L2');
      const r = fc(['launch', 'activate', 'L2'], { cwd: repo.root });
      assertExit(r, 1, 'activate L2 while L1 is active');
      assertIncludes(out(r), 'L1', 'names the active launch');
      assertEq(readLaunch(repo.root, 'L2').status, 'draft', 'L2 stays draft');
    },
  },
  {
    id: 'activate-non-draft-status-exits-1',
    covers: ['E20'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      patchLaunch(repo.root, 'L1', (j) => { j.status = 'abandoned'; });
      const r = fc(['launch', 'activate', 'L1'], { cwd: repo.root });
      assertExit(r, 1, 'activate an abandoned launch');
      assertIncludes(out(r), 'abandoned', 'names the status');
      assertEq(readLaunch(repo.root, 'L1').status, 'abandoned', 'status unchanged');
    },
  },
  {
    id: 'activate-draft-spec-needs-allow-draft',
    covers: ['E7'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const rel = draftSpec(repo);
      newLaunch(repo, 'D1', [], rel);
      const r = fc(['launch', 'activate', 'D1'], { cwd: repo.root });
      assertExit(r, 1, 'activate without --allow-draft');
      assertIncludes(out(r), 'spec not frozen', 'message');
      assertEq(readLaunch(repo.root, 'D1').status, 'draft', 'status unchanged');
      activate(repo, 'D1', ['--allow-draft']);
      const j = readLaunch(repo.root, 'D1');
      assertEq(j.status, 'active', 'status with the flag');
      assertEq(j.allow_draft, true, 'allow_draft recorded');
    },
  },
  {
    id: 'activate-draft-map-needs-allow-draft',
    covers: ['E7'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      assertExit(pinMap(repo, 'L1', ['--allow-draft']), 0, 'pin the draft map with the flag');
      patchLaunch(repo.root, 'L1', (j) => { j.allow_draft = false; });
      const r = fc(['launch', 'activate', 'L1'], { cwd: repo.root });
      assertExit(r, 1, 'activate with a draft map pinned and no flag');
      assertIncludes(out(r), 'tests map not frozen', 'message');
      activate(repo, 'L1', ['--allow-draft']);
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.status, 'active', 'status with the flag');
      assertEq(j.allow_draft, true, 'allow_draft recorded');
    },
  },

  // ── launch pin tests-map and launch kickoff ──
  {
    id: 'pin-draft-map-refused-without-flag',
    covers: ['E15'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      const r = pinMap(repo, 'L1');
      assertExit(r, 1, 'pin a draft map without --allow-draft');
      assertIncludes(out(r), 'tests map not frozen', 'message');
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.tests_map, null, 'tests_map still null');
      assert(!exists(path.join(launchDir(repo.root, 'L1'), 'specs', 'export-html', 'tests-map.v1.json')), 'no map copied');
    },
  },
  {
    id: 'pin-draft-map-with-flag-records-pins',
    covers: ['E15', 'B49'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      const h = head(repo.root);
      assertExit(pinMap(repo, 'L1', ['--allow-draft']), 0, 'pin with --allow-draft');
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.allow_draft, true, 'allow_draft');
      assert(j.tests_map && j.tests_map.version === 1, `tests_map pinned: ${JSON.stringify(j.tests_map)}`);
      assertEq(j.tests_map.commit, null, 'draft map has no commit');
      assertPrefixHash(j.lock_commit, h, 'lock_commit is HEAD at pin');
      assert(exists(path.join(launchDir(repo.root, 'L1'), 'specs', 'export-html', 'tests-map.v1.json')), 'map copied into the launch');
      const kickoff = readText(path.join(launchDir(repo.root, 'L1'), 'kickoff.md'));
      assertMatch(kickoff, /tests-map: flightdeck\/launch\/(L1\/)?specs\/export-html\/tests-map\.v1\.json/, 'kickoff tests-map line carries the path');
      assert(!kickoff.includes('tests-map: (none)'), 'kickoff no longer reads (none)');
    },
  },
  {
    id: 'pin-frozen-map-sets-paths-lock-and-kickoff',
    covers: ['B49', 'I1'],
    fn: async () => {
      const repo = freezeMap(mkLaunchRepo());
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      const h = head(repo.root);
      const map = readJson(path.join(repo.root, repo.mapPath));
      const r = pinMap(repo, 'L1');
      assertExit(r, 0, 'pin a frozen map');
      for (const c of map.checks) assertIncludes(r.stdout, `Bash(${c.command})`, `allow line for ${c.id}`);
      const j = readLaunch(repo.root, 'L1');
      assertEq(j.tests_map.version, 1, 'tests_map.version');
      assertEq(j.tests_map.commit, 'b2c3d4e', 'tests_map.commit from the map header');
      assert(j.tests_map.path.endsWith('specs/export-html/tests-map.v1.json'), `tests_map.path: ${j.tests_map.path}`);
      assertPrefixHash(j.lock_commit, h, 'lock_commit');
      assertEq([...j.paths.allowed].sort(), [...map.allowed_paths].sort(), 'paths.allowed from the map');
      assertEq([...j.paths.locked].sort(), [...map.locked_paths, 'flightdeck/launch/L1/specs/**', 'flightdeck/launch/specs/export-html/**'].filter((p, i, a) => a.indexOf(p) === i).sort(), 'paths.locked = map locked ∪ launch specs ∪ canonical spec folder');
      assertEq(j.paths.enforce_boundary, true, 'enforce_boundary');
      assertEq(j.allow_draft, false, 'no draft accepted');
      assertEq(readText(path.join(launchDir(repo.root, 'L1'), 'specs', 'export-html', 'tests-map.v1.json')), readText(path.join(repo.root, repo.mapPath)), 'map copy byte-equal');
      const kickoff = readText(path.join(launchDir(repo.root, 'L1'), 'kickoff.md'));
      assertMatch(kickoff, /tests-map: flightdeck\/launch\/(L1\/)?specs\/export-html\/tests-map\.v1\.json @ b2c3d4e/, 'kickoff tests-map line carries path and commit');
    },
  },
  {
    id: 'kickoff-rerenders-and-lists-prior-reports',
    covers: ['B49'],
    fn: async () => {
      const repo = freezeMap(mkLaunchRepo());
      newLaunch(repo, 'L0');
      writeText(path.join(launchDir(repo.root, 'L0'), 'report.md'), '# Run report · export-html · L0\n');
      const rel = addSpec(repo, 'other-spec');
      newLaunch(repo, 'O1', [], rel);
      writeText(path.join(launchDir(repo.root, 'O1'), 'report.md'), '# Run report · other-spec · O1\n');
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      assertExit(pinMap(repo, 'L1'), 0, 'pin');
      const p = path.join(launchDir(repo.root, 'L1'), 'kickoff.md');
      const rendered = readText(p);
      assertIncludes(rendered, 'flightdeck/launch/L0/report.md', 'prior reports lists the matching launch');
      assert(!rendered.includes('flightdeck/launch/O1/report.md'), 'prior reports omits other specs');
      assert(!rendered.includes('prior reports: none'), 'prior reports is not none');
      writeText(p, `${rendered}\nHAND EDIT\n`);
      const r = fc(['launch', 'kickoff'], { cwd: repo.root });
      assertExit(r, 0, 'fc launch kickoff');
      assertEq(readText(p), rendered, 're-render restores the rendered content');
      const r2 = fc(['launch', 'kickoff', '--parts', 'base+shape-workflow+task-audit'], { cwd: repo.root });
      assertExit(r2, 0, 'fc launch kickoff --parts');
      const swapped = readText(p);
      assertMatch(swapped.split('\n')[0], /^# Kickoff: task-audit · shape-workflow$/, 'title follows --parts');
      assertIncludes(swapped, part('shape-workflow'), 'shape-workflow part');
      assertIncludes(swapped, part('task-audit'), 'task-audit part');
      assertMatch(swapped, /kickoff version: base@\d+\+shape-workflow@\d+\+task-audit@\d+/, 'version line follows --parts');
    },
  },

  // ── launch selection: status, no launch, FLIGHTCREW_LAUNCH, two active ──
  {
    id: 'status-prints-launch',
    covers: ['I1'],
    fn: async () => {
      const L = mkActiveLaunch();
      const r = fc(['launch', 'status'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc launch status');
      for (const needle of ['export-html-1', 'active', 'review', 'G1', 'G2', 'G3']) assertIncludes(r.stdout, needle, 'status text');
      const j = fc(['launch', 'status', '--json'], { cwd: L.root, env: L.env });
      assertExit(j, 0, 'fc launch status --json');
      let parsed = null;
      try { parsed = JSON.parse(j.stdout); } catch (e) { throw new Error(`--json stdout is not JSON: ${tail(j.stdout)}`); }
      assertIncludes(JSON.stringify(parsed), 'export-html-1', '--json names the launch');
    },
  },
  {
    id: 'no-active-launch-exits-1',
    covers: ['E1'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const r = fc(['launch', 'status'], { cwd: repo.root });
      assertExit(r, 1, 'status with no launches');
      assertIncludes(out(r), 'no active launch', 'message');
      newLaunch(repo, 'L1');
      const r2 = fc(['launch', 'status'], { cwd: repo.root });
      assertExit(r2, 1, 'status with only a draft launch');
      assertIncludes(out(r2), 'no active launch', 'message');
      const r3 = fc(['launch', 'note', 'hello'], { cwd: repo.root });
      assertExit(r3, 1, 'note with no active launch');
      assertIncludes(out(r3), 'no active launch', 'message');
    },
  },
  {
    id: 'flightcrew-launch-none-disables',
    covers: ['B52', 'E1'],
    fn: async () => {
      const L = mkActiveLaunch();
      const env = { ...L.env, FLIGHTCREW_LAUNCH: 'none' };
      for (const args of [['launch', 'status'], ['launch', 'note', 'x'], ['launch', 'phase', 'report'], ['launch', 'escalate', 'blocked', '--detail', 'x'], ['events', 'summary']]) {
        const r = fc(args, { cwd: L.root, env });
        assertExit(r, 1, `fc ${args.join(' ')} under FLIGHTCREW_LAUNCH=none`);
        assertIncludes(out(r), 'no active launch', `message for fc ${args.join(' ')}`);
      }
      assertEq(readLaunch(L.root, L.launch).phase, 'review', 'nothing changed');
    },
  },
  {
    id: 'flightcrew-launch-missing-folder-exits-1',
    covers: ['E3'],
    fn: async () => {
      const L = mkActiveLaunch();
      const r = fc(['launch', 'status'], { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: 'ghost-launch' } });
      assertExit(r, 1, 'FLIGHTCREW_LAUNCH names a missing folder');
      assertIncludes(out(r), 'ghost-launch', 'names the folder');
    },
  },
  {
    id: 'missing-launch-folder-silences-every-hook',
    covers: ['E3'],
    fn: async () => {
      const L = mkActiveLaunch();
      const env = { ...L.env, FLIGHTCREW_LAUNCH: 'ghost-launch' };
      const cases = [
        ['event-log', sessionStart(L.root)],
        ['lock-guard', editLocked(L.root)],
        ['boundary-guard', editLocked(L.root)],
        ['structural-check', wroteSource(L.root)],
        ['stop-gate', stopTurn(L.root)],
        ['session-end', sessionEnd(L.root)],
      ];
      for (const [name, input] of cases) {
        const r = hook(name, input, { cwd: L.root, env });
        assertExit(r, 0, `${name} exits 0 while FLIGHTCREW_LAUNCH names a missing folder`);
        assertEq(r.stdout, '', `${name} prints no stdout`);
      }
    },
  },
  {
    id: 'two-active-launches-exit-1-naming-both',
    covers: ['E6'],
    fn: async () => {
      const L = mkActiveLaunch();
      newLaunch(L, 'L2');
      patchLaunch(L.root, 'L2', (j) => { j.status = 'active'; });
      const r = fc(['launch', 'status'], { cwd: L.root, env: L.env });
      assertExit(r, 1, 'two active launches');
      assertIncludes(out(r), 'export-html-1', 'names the first');
      assertIncludes(out(r), 'L2', 'names the second');
    },
  },
  {
    id: 'two-active-launches-silence-recorders-and-ask-guards',
    covers: ['E6'],
    fn: async () => {
      const L = mkActiveLaunch();
      newLaunch(L, 'L2');
      patchLaunch(L.root, 'L2', (j) => { j.status = 'active'; });
      const env = { CLAUDE_PROJECT_DIR: L.root };
      for (const [name, input] of [['event-log', sessionStart(L.root)], ['session-end', sessionEnd(L.root)]]) {
        const r = hook(name, input, { cwd: L.root, env });
        assertExit(r, 0, `${name} exits 0 while two launches are active and FLIGHTCREW_LAUNCH is unset`);
        assertEq(r.stdout, '', `${name} prints no stdout`);
      }
      for (const name of ['lock-guard', 'boundary-guard']) {
        const r = hook(name, editLocked(L.root), { cwd: L.root, env });
        assertExit(r, 0, `${name} exits 0 while the launch is ambiguous`);
        assertEq(decisionOf(r, name), 'ask', `${name} asks while two launches are active`);
      }
    },
  },
  {
    id: 'launch-override-selects-one-of-two',
    covers: ['E6', 'I1'],
    fn: async () => {
      const L = mkActiveLaunch();
      newLaunch(L, 'L2');
      patchLaunch(L.root, 'L2', (j) => { j.status = 'active'; });
      const byEnv = fc(['launch', 'status'], { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: 'L2' } });
      assertExit(byEnv, 0, 'FLIGHTCREW_LAUNCH selects L2');
      assertIncludes(byEnv.stdout, 'L2', 'status names L2');
      const byFlag = fc(['launch', 'status', '--launch', 'L2'], { cwd: L.root, env: L.env });
      assertExit(byFlag, 0, '--launch selects L2');
      assertIncludes(byFlag.stdout, 'L2', 'status names L2');
    },
  },
  {
    id: 'fc-shim-runs-by-path',
    covers: ['I1'],
    fn: async () => {
      const L = mkActiveLaunch();
      const r = sh(`"${FC}" launch status`, { cwd: L.root, env: L.env });
      assertExit(r, 0, 'bin/fc shim invoked by absolute path');
      assertIncludes(r.stdout, 'export-html-1', 'status names the launch');
      const viaNode = sh(`node "${FC_MJS}" launch status`, { cwd: L.root, env: L.env });
      assertExit(viaNode, 0, 'node bin/fc.mjs');
      assertIncludes(viaNode.stdout, 'export-html-1', 'status names the launch');
    },
  },
  {
    id: 'unknown-command-exits-1',
    covers: ['I1'],
    fn: async () => {
      fcPresent();
      const L = mkActiveLaunch();
      const r = fc(['no-such-command'], { cwd: L.root, env: L.env });
      assertExit(r, 1, 'unknown command');
      assertMatch(out(r), /no-such-command|usage/i, 'usage error names the command or prints usage');
      assertExit(fc(['launch', 'no-such-sub'], { cwd: L.root, env: L.env }), 1, 'unknown launch subcommand');
      assertExit(fc(['launch', 'phase'], { cwd: L.root, env: L.env }), 1, 'phase without an argument');
      assertEq(readLaunch(L.root, L.launch).phase, 'review', 'nothing changed');
    },
  },

  // ── launch phase ──
  {
    id: 'phase-next-appends-event',
    covers: ['B47'],
    fn: async () => {
      const L = pinnedLaunch();
      const before = events(L.root, L.name).length;
      const r = fc(['launch', 'phase', 'plan'], { cwd: L.root });
      assertExit(r, 0, 'fc launch phase plan');
      assertEq(readLaunch(L.root, L.name).phase, 'plan', 'phase');
      const list = events(L.root, L.name);
      assertEq(list.length, before + 1, 'one event appended');
      const e = list.at(-1);
      assertEq(e.event, 'phase', 'event name');
      assertEq(e.source, 'fc', 'source');
      assertEq(e.launch, L.name, 'launch');
      assertEq([e.detail.from, e.detail.to, e.detail.forced], ['targets', 'plan', false], 'detail');
      assertMatch(e.ts, ISO, 'ts');
    },
  },
  {
    id: 'phase-skip-is-illegal-unless-forced',
    covers: ['E22', 'B47'],
    fn: async () => {
      const L = pinnedLaunch();
      const r = fc(['launch', 'phase', 'contracts'], { cwd: L.root });
      assertExit(r, 1, 'skip from targets to contracts');
      assertIncludes(out(r), 'illegal phase change', 'message');
      assertEq(readLaunch(L.root, L.name).phase, 'targets', 'phase unchanged');
      assertEq(events(L.root, L.name).filter((e) => e.event === 'phase').length, 0, 'no phase event');
      const back = fc(['launch', 'phase', 'targets'], { cwd: L.root });
      assertExit(back, 1, 'same phase is not the next phase');
      const forced = fc(['launch', 'phase', 'contracts', '--force'], { cwd: L.root });
      assertExit(forced, 0, 'skip with --force');
      assertEq(readLaunch(L.root, L.name).phase, 'contracts', 'phase after force');
      const e = lastEvent(L.root, L.name);
      assertEq(e.event, 'phase', 'event');
      assertEq([e.detail.from, e.detail.to, e.detail.forced], ['targets', 'contracts', true], 'forced recorded');
    },
  },
  {
    id: 'phase-plan-refused-draft-pin-without-allow-draft',
    covers: ['B47'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      assertExit(pinMap(repo, 'L1', ['--allow-draft']), 0, 'pin the draft map');
      patchLaunch(repo.root, 'L1', (j) => { j.allow_draft = false; });
      const r = fc(['launch', 'phase', 'plan'], { cwd: repo.root });
      assertRefused(r, 'phase plan with a draft map pin and allow_draft false');
      assertEq(readLaunch(repo.root, 'L1').phase, 'targets', 'phase unchanged');
      assertEq(events(repo.root, 'L1').filter((e) => e.event === 'phase').length, 0, 'no phase event');
      patchLaunch(repo.root, 'L1', (j) => { j.allow_draft = true; });
      const ok = fc(['launch', 'phase', 'plan'], { cwd: repo.root });
      assertExit(ok, 0, 'phase plan with allow_draft true');
      assertEq(readLaunch(repo.root, 'L1').phase, 'plan', 'phase after');
    },
  },
  {
    id: 'phase-plan-refused-baseline-disagreement',
    covers: ['B47'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const mapFile = path.join(repo.root, repo.mapPath);
      const map = readJson(mapFile);
      map.checks[1].baseline.observed = 'fail: TAP version 13';
      writeJson(mapFile, map);
      commitAll(repo.root, 'map with a disagreeing baseline');
      newLaunch(repo, 'L1');
      activate(repo, 'L1', ['--allow-draft']);
      assertExit(pinMap(repo, 'L1', ['--allow-draft']), 0, 'pin');
      const r = fc(['launch', 'phase', 'plan'], { cwd: repo.root });
      assertRefused(r, 'phase plan while observed word differs from expect word');
      assertEq(readLaunch(repo.root, 'L1').phase, 'targets', 'phase unchanged');
    },
  },
  {
    id: 'phase-plan-refused-invalid-launch',
    covers: ['B47'],
    fn: async () => {
      const L = pinnedLaunch();
      patchLaunch(L.root, L.name, (j) => { j.ceilings.stop_blocks = 9; });
      const r = fc(['launch', 'phase', 'plan'], { cwd: L.root });
      assertRefused(r, 'phase plan while validate-launch fails');
      assertEq(readLaunch(L.root, L.name).phase, 'targets', 'phase unchanged');
    },
  },
  {
    id: 'phase-plan-refused-invalid-kickoff',
    covers: ['B47'],
    fn: async () => {
      const L = pinnedLaunch();
      const p = path.join(L.dir, 'kickoff.md');
      const kickoff = readText(p);
      assertIncludes(kickoff, '## Roles', 'Roles heading present');
      writeText(p, kickoff.replace('## Roles\n', '## Roles\n`no-such-crew-member` (imaginary role)\n'));
      const r = fc(['launch', 'phase', 'plan'], { cwd: L.root });
      assertRefused(r, 'phase plan while validate-kickoff fails');
      assertEq(readLaunch(L.root, L.name).phase, 'targets', 'phase unchanged');
    },
  },
  {
    id: 'phase-review-refused-without-summary',
    covers: ['B47'],
    fn: async () => {
      fcPresent();
      const L = activeAtHead((j) => { j.phase = 'verify'; });
      const r = fc(['launch', 'phase', 'review'], { cwd: L.root, env: L.env });
      assertRefused(r, 'phase review with no evidence/summary.json');
      assertEq(readLaunch(L.root, L.launch).phase, 'verify', 'phase unchanged');
    },
  },
  {
    id: 'phase-review-refused-stale-summary',
    covers: ['B47'],
    fn: async () => {
      fcPresent();
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'verify'; });
      assert(!head(L.root).startsWith(readJson(path.join(L.launchDir, 'evidence', 'summary.json')).commit), 'shipped summary is older than HEAD');
      const r = fc(['launch', 'phase', 'review'], { cwd: L.root, env: L.env });
      assertRefused(r, 'phase review with summary older than HEAD');
      assertEq(readLaunch(L.root, L.launch).phase, 'verify', 'phase unchanged');
    },
  },
  {
    id: 'phase-review-refused-red-counts',
    covers: ['B47'],
    fn: async () => {
      const L = activeAtHead((j) => { j.phase = 'verify'; });
      assertExit(fc(['verify'], { cwd: L.root, env: L.env }), 0, 'precondition: fc verify');
      const p = path.join(L.launchDir, 'evidence', 'summary.json');
      const s = readJson(p);
      s.counts.fail = 1;
      writeJson(p, s);
      const r = fc(['launch', 'phase', 'review'], { cwd: L.root, env: L.env });
      assertRefused(r, 'phase review with a non-zero fail count');
      assertEq(readLaunch(L.root, L.launch).phase, 'verify', 'phase unchanged');
    },
  },
  {
    id: 'phase-review-accepted-with-green-evidence',
    covers: ['B47'],
    fn: async () => {
      const L = activeAtHead((j) => { j.phase = 'verify'; });
      assertExit(fc(['verify'], { cwd: L.root, env: L.env }), 0, 'precondition: fc verify');
      const r = fc(['launch', 'phase', 'review'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'phase review with green evidence at HEAD');
      assertEq(readLaunch(L.root, L.launch).phase, 'review', 'phase');
      const e = lastEvent(L.root, L.launch);
      assertEq([e.event, e.detail.from, e.detail.to, e.detail.forced], ['phase', 'verify', 'review', false], 'phase event');
    },
  },

  // ── launch gate ──
  {
    id: 'gate-g1-approve-moves-to-contracts',
    covers: ['B35'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; j.gates.G1 = { status: 'pending', at: null }; });
      const r = fc(['launch', 'gate', 'G1', 'approve', '--note', 'plan read against the spec'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'G1 approve');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.phase, 'contracts', 'phase');
      assertEq(j.gates.G1.status, 'approved', 'G1 status');
      assertMatch(j.gates.G1.at, ISO, 'G1 at');
      assertEq(j.gates.G1.note, 'plan read against the spec', 'G1 note');
      assertEq(j.gates.G2.status, 'approved', 'G2 untouched (already approved in the fixture; G1 did not depend on it)');
      const list = events(L.root, L.launch);
      const gate = list.findLast((e) => e.event === 'gate');
      assertEq([gate.detail.gate, gate.detail.decision], ['G1', 'approve'], 'gate event');
      const phase = list.findLast((e) => e.event === 'phase');
      assertEq([phase.detail.from, phase.detail.to], ['plan', 'contracts'], 'phase event');
    },
  },
  {
    id: 'gate-g2-approve-moves-to-implement',
    covers: ['B35'],
    fn: async () => {
      const L = activeAtHead((j) => {
        j.phase = 'contracts';
        j.gates.G1 = { status: 'pending', at: null };
        j.gates.G2 = { status: 'pending', at: null };
      });
      patchLaunch(L.root, L.launch, (j) => { j.lock_commit = rootCommit(L.root); });
      assertExit(fc(['check', 'T3'], { cwd: L.root, env: L.env }), 0, 'precondition: W0 check T3 green at HEAD');
      const r = fc(['launch', 'gate', 'G2', 'approve'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'G2 approve with T3 green since lock_commit and G1 still pending');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.phase, 'implement', 'phase');
      assertEq(j.gates.G2.status, 'approved', 'G2 status');
      assertEq(j.gates.G1.status, 'pending', 'G1 not consulted');
      const phase = lastEvent(L.root, L.launch);
      assertEq([phase.event, phase.detail.from, phase.detail.to], ['phase', 'contracts', 'implement'], 'phase event');
    },
  },
  {
    id: 'gate-g2-refused-w0-check-not-run-since-lock',
    covers: ['B35'],
    fn: async () => {
      const L = activeAtHead((j) => { j.phase = 'contracts'; j.gates.G2 = { status: 'pending', at: null }; });
      assertExit(fc(['check', 'T3'], { cwd: L.root, env: L.env }), 0, 'precondition: T3 evidence at the old HEAD');
      writeText(path.join(L.root, 'NOTE.txt'), 'a later commit\n');
      const later = commitAll(L.root, 'later commit');
      patchLaunch(L.root, L.launch, (j) => { j.lock_commit = later; });
      const r = fc(['launch', 'gate', 'G2', 'approve'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'G2 approve while T3 has not run since lock_commit');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.phase, 'contracts', 'phase unchanged');
      assertEq(j.gates.G2.status, 'pending', 'G2 unchanged');
    },
  },
  {
    id: 'gate-g2-refused-w0-check-error',
    covers: ['B35'],
    fn: async () => {
      const L = activeAtHead((j) => { j.phase = 'contracts'; j.gates.G2 = { status: 'pending', at: null }; });
      patchLaunch(L.root, L.launch, (j) => { j.lock_commit = rootCommit(L.root); });
      const mapFile = path.join(L.launchDir, 'specs', 'export-html', 'tests-map.v1.json');
      const map = readJson(mapFile);
      map.checks.find((c) => c.id === 'T3').command = 'no-such-binary-for-t3 --contract';
      writeJson(mapFile, map);
      const c = fc(['check', 'T3'], { cwd: L.root, env: L.env });
      assertExit(c, 2, 'precondition: T3 cannot spawn');
      assertEq(readJson(path.join(L.launchDir, 'evidence', 'T3.json')).verdict, 'error', 'precondition: T3 verdict error');
      const r = fc(['launch', 'gate', 'G2', 'approve'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'G2 approve while a W0 check has verdict error');
      assertEq(readLaunch(L.root, L.launch).phase, 'contracts', 'phase unchanged');
    },
  },
  {
    id: 'gate-already-decided-exits-1-unless-forced',
    covers: ['E12'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; });
      const r = fc(['launch', 'gate', 'G1', 'approve'], { cwd: L.root, env: L.env });
      assertExit(r, 1, 'G1 approve when G1 is already approved');
      assertIncludes(out(r), 'approved', 'names the recorded state');
      assertEq(readLaunch(L.root, L.launch).phase, 'plan', 'phase unchanged');
      patchLaunch(L.root, L.launch, (j) => { j.gates.G1.status = 'exited'; });
      const r2 = fc(['launch', 'gate', 'G1', 'approve'], { cwd: L.root, env: L.env });
      assertExit(r2, 1, 'G1 approve when G1 is exited');
      assertIncludes(out(r2), 'exited', 'names the recorded state');
      const forced = fc(['launch', 'gate', 'G1', 'approve', '--force'], { cwd: L.root, env: L.env });
      assertExit(forced, 0, 'G1 approve --force');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.gates.G1.status, 'approved', 'G1 re-recorded');
      assertEq(j.phase, 'contracts', 'phase moved');
    },
  },
  {
    id: 'gate-exit-records-and-prints-end-hint',
    covers: ['I1'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; j.gates.G1 = { status: 'pending', at: null }; });
      const r = fc(['launch', 'gate', 'G1', 'exit', '--note', 'plan too wide'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'G1 exit');
      assertIncludes(r.stdout, 'now run: fc launch end abandoned --at G1', 'hint line');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.gates.G1.status, 'exited', 'G1 status');
      assertEq(j.gates.G1.note, 'plan too wide', 'note');
      assertEq(j.phase, 'plan', 'exit does not move the phase');
      const gate = lastEvent(L.root, L.launch);
      assertEq([gate.event, gate.detail.gate, gate.detail.decision], ['gate', 'G1', 'exit'], 'gate event');
    },
  },

  // ── launch escalate ──
  {
    id: 'escalate-writes-file-and-event',
    covers: ['B41'],
    fn: async () => {
      const L = mkActiveLaunch();
      const before = events(L.root, L.launch).length;
      const r = fc(['launch', 'escalate', 'spec-gap', '--detail', 'B3 is silent on nested pages'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc launch escalate');
      const file = path.join(L.launchDir, 'escalation.json');
      assert(exists(file), 'escalation.json written');
      const body = readJson(file);
      assertIncludes(JSON.stringify(body), 'spec-gap', 'file carries the kind');
      assertIncludes(JSON.stringify(body), 'B3 is silent on nested pages', 'file carries the detail');
      const list = events(L.root, L.launch);
      assertEq(list.length, before + 1, 'one event appended');
      const e = list.at(-1);
      assertEq([e.event, e.source, e.detail.kind], ['escalation', 'fc', 'spec-gap'], 'escalation event');
      assertIncludes(e.detail.detail, 'B3 is silent on nested pages', 'event detail');
    },
  },
  {
    id: 'escalate-cleared-by-gate-phase-and-end',
    covers: ['B41'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; j.gates.G1 = { status: 'pending', at: null }; });
      const file = path.join(L.launchDir, 'escalation.json');
      const escalate = (kind) => {
        assertExit(fc(['launch', 'escalate', kind, '--detail', `${kind} detail`], { cwd: L.root, env: L.env }), 0, `escalate ${kind}`);
        assert(exists(file), 'escalation.json present after escalate');
      };
      escalate('blocked');
      assertExit(fc(['launch', 'gate', 'G1', 'approve'], { cwd: L.root, env: L.env }), 0, 'gate G1 approve');
      assert(!exists(file), 'gate removes escalation.json');
      escalate('budget');
      assertExit(fc(['launch', 'phase', 'implement'], { cwd: L.root, env: L.env }), 0, 'phase implement');
      assert(!exists(file), 'phase removes escalation.json');
      escalate('halt');
      assertExit(fc(['launch', 'end', 'abandoned', '--at', 'implement'], { cwd: L.root, env: L.env }), 0, 'end abandoned');
      assert(!exists(file), 'end removes escalation.json');
    },
  },
  {
    id: 'escalate-invalid-kind-exits-1',
    covers: ['I1'],
    fn: async () => {
      fcPresent();
      const L = mkActiveLaunch();
      const before = events(L.root, L.launch).length;
      const r = fc(['launch', 'escalate', 'no-such-kind', '--detail', 'x'], { cwd: L.root, env: L.env });
      assertExit(r, 1, 'unknown escalation kind');
      assert(!exists(path.join(L.launchDir, 'escalation.json')), 'no file written');
      const r2 = fc(['launch', 'escalate', 'blocked'], { cwd: L.root, env: L.env });
      assertExit(r2, 1, 'missing --detail');
      assert(!exists(path.join(L.launchDir, 'escalation.json')), 'no file written');
      assertEq(events(L.root, L.launch).length, before, 'no escalation event appended');
    },
  },

  // ── launch note and plan write ──
  {
    id: 'note-appends-and-report-prints-notes',
    covers: ['B54'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      activate(repo, 'L1');
      assertExit(fc(['launch', 'note', 'first note about U0'], { cwd: repo.root }), 0, 'first note');
      assertExit(fc(['launch', 'note', 'second note about U1'], { cwd: repo.root }), 0, 'second note');
      const notes = readText(path.join(launchDir(repo.root, 'L1'), 'notes.md'));
      const i1 = notes.indexOf('first note about U0');
      const i2 = notes.indexOf('second note about U1');
      assert(i1 >= 0 && i2 > i1, `notes.md holds both notes in order: ${JSON.stringify(notes)}`);
      assertExit(fc(['report'], { cwd: repo.root }), 0, 'fc report');
      const report = readText(path.join(launchDir(repo.root, 'L1'), 'report.md'));
      const h = report.indexOf('## Orchestrator notes [stated]');
      assert(h >= 0, 'report has the Orchestrator notes heading');
      const section = report.slice(h);
      assertIncludes(section, 'first note about U0', 'first note under the heading');
      assertIncludes(section, 'second note about U1', 'second note under the heading');
    },
  },
  {
    id: 'plan-write-stores-and-renders',
    covers: ['B54'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; });
      const planJson = path.join(L.launchDir, 'plan.json');
      const planMd = path.join(L.launchDir, 'plan.md');
      fs.rmSync(planJson, { force: true });
      fs.rmSync(planMd, { force: true });
      const sample = readJson(SAMPLE_PLAN);
      const r = fc(['plan', 'write', path.join(L.root, L.planPath)], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc plan write <path>');
      assertEq(readJson(planJson), sample, 'plan.json equals the input');
      assertMatch(readText(planMd).split('\n')[0], /^# Plan: export-html · export-html-1$/, 'plan.md rendered');
      fs.rmSync(planJson, { force: true });
      fs.rmSync(planMd, { force: true });
      const viaStdin = fc(['plan', 'write', '--stdin'], { cwd: L.root, env: L.env, input: JSON.stringify(sample) });
      assertExit(viaStdin, 0, 'fc plan write --stdin');
      assertEq(readJson(planJson), sample, 'plan.json equals stdin');
      assert(exists(planMd), 'plan.md rendered from stdin');
    },
  },
  {
    id: 'plan-write-invalid-exits-2-without-writing',
    covers: ['B54'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'plan'; });
      const planJson = path.join(L.launchDir, 'plan.json');
      const planMd = path.join(L.launchDir, 'plan.md');
      fs.rmSync(planJson, { force: true });
      fs.rmSync(planMd, { force: true });
      const bad = readJson(SAMPLE_PLAN);
      bad.abandon_triggers = [];
      const badFile = path.join(L.root, 'bad-plan.json');
      writeJson(badFile, bad);
      const r = fc(['plan', 'write', badFile], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'plan write with empty abandon_triggers');
      assert(!exists(planJson), 'plan.json not written');
      assert(!exists(planMd), 'plan.md not written');
      const bad2 = readJson(SAMPLE_PLAN);
      bad2.units[1].checks = ['T99'];
      const r2 = fc(['plan', 'write', '--stdin'], { cwd: L.root, env: L.env, input: JSON.stringify(bad2) });
      assertExit(r2, 2, 'plan write with a check id absent from the pinned map');
      assert(!exists(planJson), 'plan.json still not written');
    },
  },

  // ── launch end ──
  {
    id: 'end-partial-writes-units',
    covers: ['B44'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const r = fc(['launch', 'end', 'partial', '--units', 'U0,U1'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'end partial --units U0,U1');
      const j = readLaunch(L.root, L.launch);
      assertEq([...j.accepted_units].sort(), ['U0', 'U1'], 'accepted_units');
      assertEq([...j.abandoned_units].sort(), ['U2', 'U3'], 'abandoned_units');
      assertEq([j.outcome, j.status, j.phase], ['partial', 'partial', 'ended'], 'outcome, status, phase');
      assertEq(lastEvent(L.root, L.launch).event, 'launch_end', 'launch_end appended');
    },
  },
  {
    id: 'end-partial-refuses-dependency-outside-list',
    covers: ['B44'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const r = fc(['launch', 'end', 'partial', '--units', 'U3'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'U3 depends on U1 and U2, which are outside the list');
      assertIncludes(out(r), 'U3', 'names the unit');
      assertMatch(out(r), /depend/i, 'names the reason: the dependency rule');
      const j = readLaunch(L.root, L.launch);
      assertEq(j.status, 'active', 'status unchanged');
      assertEq(j.accepted_units, undefined, 'accepted_units not written');
    },
  },
  {
    id: 'end-partial-refuses-unit-without-green-return-or-merge',
    covers: ['B44'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const ret = path.join(L.launchDir, 'returns', 'U1.json');
      const u1 = readJson(ret);
      u1.status = 'red';
      writeJson(ret, u1);
      writeEvents(L.root, L.launch, events(L.root, L.launch).filter((e) => !(e.event === 'unit_merged' && e.detail.unit === 'U1')));
      const r = fc(['launch', 'end', 'partial', '--units', 'U0,U1'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'U1 has neither a green return nor a unit_merged event');
      assertIncludes(out(r), 'U1', 'names the unit');
      assertMatch(out(r), /return|merge/i, 'names the reason: no green return or unit_merged event');
      assertEq(readLaunch(L.root, L.launch).status, 'active', 'status unchanged');
    },
  },
  {
    id: 'end-partial-refuses-open-blocking-finding',
    covers: ['B44'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      fs.rmSync(path.join(L.launchDir, 'review', 'resolutions.json'), { force: true });
      const r = fc(['launch', 'end', 'partial', '--units', 'U0,U1'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'F1 is open, blocking and under src/export/**');
      assertMatch(out(r), /\bU[01]\b/, 'names the unit whose paths hold the finding');
      assertMatch(out(r), /finding|\bF1\b/i, 'names the reason: the open blocking finding');
      assertEq(readLaunch(L.root, L.launch).status, 'active', 'status unchanged');
    },
  },
  {
    id: 'end-partial-requires-units',
    covers: ['I1'],
    fn: async () => {
      fcPresent();
      const L = endedPhaseReport();
      const r = fc(['launch', 'end', 'partial'], { cwd: L.root, env: L.env });
      assertExit(r, 1, 'partial without --units');
      assertMatch(out(r), /units/i, 'usage error names --units');
      assertEq(readLaunch(L.root, L.launch).status, 'active', 'status unchanged');
      const r2 = fc(['launch', 'end', 'no-such-outcome'], { cwd: L.root, env: L.env });
      assertExit(r2, 1, 'unknown outcome');
    },
  },
  {
    id: 'end-accepted-stale-evidence-exits-2',
    covers: ['B45'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'report'; });
      const h = head(L.root);
      const r = fc(['launch', 'end', 'accepted'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'end accepted while summary.json.commit differs from HEAD');
      assertIncludes(out(r), '18293a4', 'names the evidence commit');
      assertIncludes(out(r), h.slice(0, 7), 'names HEAD');
      const j = readLaunch(L.root, L.launch);
      assertEq([j.status, j.outcome, j.phase], ['active', null, 'report'], 'nothing recorded');
      assert(!events(L.root, L.launch).some((e) => e.event === 'launch_end'), 'no launch_end event');
    },
  },
  {
    id: 'end-accepted-at-head',
    covers: ['B45'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const r = fc(['launch', 'end', 'accepted'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'end accepted with evidence at HEAD');
      const j = readLaunch(L.root, L.launch);
      assertEq([j.outcome, j.status, j.phase], ['accepted', 'accepted', 'ended'], 'outcome, status, phase');
      assertMatch(j.ended, ISO, 'ended');
      const report = path.join(L.launchDir, 'report.md');
      assert(exists(report), 'report.md rendered');
      assertMatch(readText(report), /^# Run report/, 'report.md starts with the run report title');
      assert(exists(path.join(L.launchDir, 'evidence.html')), 'evidence.html rendered');
      const runlog = path.join(L.root, 'flightdeck', 'launch', 'RUNLOG.md');
      assert(exists(runlog), 'RUNLOG.md created');
      assertMatch(readText(runlog), /^## \d{4}-\d{2}-\d{2} · export-html · export-html-1$/m, 'RUNLOG entry heading');
      const e = lastEvent(L.root, L.launch);
      assertEq([e.event, e.source, e.detail.outcome], ['launch_end', 'fc', 'accepted'], 'launch_end event');
      assertIncludes(r.stdout, 'flightdeck/launch/export-html-1/report.md', 'prints the report path');
      assertMatch(r.stdout, /worktree/i, 'prints a worktree cleanup line');
      assertMatch(r.stdout, /branch/i, 'prints a branch cleanup line');
    },
  },
  {
    id: 'end-accepted-with-reservations-at-head',
    covers: ['B45'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const r = fc(['launch', 'end', 'accepted-with-reservations'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'end accepted-with-reservations');
      const j = readLaunch(L.root, L.launch);
      assertEq([j.outcome, j.status, j.phase], ['accepted-with-reservations', 'accepted-with-reservations', 'ended'], 'outcome, status, phase');
      assertEq(lastEvent(L.root, L.launch).detail.outcome, 'accepted-with-reservations', 'launch_end outcome');
      assert(exists(path.join(L.launchDir, 'report.md')), 'report.md rendered');
    },
  },
  {
    id: 'end-abandoned-records-and-renders',
    covers: ['B45', 'I1'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L.root, L.launch, (j) => { j.phase = 'report'; });
      const r = fc(['launch', 'end', 'abandoned', '--at', 'G3'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'end abandoned does not need evidence at HEAD');
      const j = readLaunch(L.root, L.launch);
      assertEq([j.outcome, j.status, j.phase], ['abandoned', 'abandoned', 'ended'], 'outcome, status, phase');
      assertMatch(j.ended, ISO, 'ended');
      assert(exists(path.join(L.launchDir, 'report.md')), 'report.md rendered');
      assert(exists(path.join(L.launchDir, 'evidence.html')), 'evidence.html rendered');
      assert(exists(path.join(L.root, 'flightdeck', 'launch', 'RUNLOG.md')), 'RUNLOG.md written');
      const e = lastEvent(L.root, L.launch);
      assertEq([e.event, e.detail.outcome], ['launch_end', 'abandoned'], 'launch_end event');
    },
  },
  {
    id: 'end-accepted-dirty-allowed-paths-exits-2',
    covers: ['E24'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const src = path.join(L.root, 'src', 'export', 'index.mjs');
      writeText(src, `${readText(src)}\n// uncommitted change under an allowed path\n`);
      const r = fc(['launch', 'end', 'accepted'], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'end accepted with an uncommitted change under src/export/**');
      assertIncludes(out(r), 'working tree not clean under allowed paths', 'message');
      const j = readLaunch(L.root, L.launch);
      assertEq([j.status, j.outcome], ['active', null], 'nothing recorded');
    },
  },

  // ── launch land ──
  {
    id: 'land-writes-landed',
    covers: ['B50'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const h = head(L.root);
      const r = fc(['launch', 'land', '--commit', h, '--pr', 'https://example.invalid/pr/7'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'land with green evidence at the commit');
      const j = readLaunch(L.root, L.launch);
      assert(j.landed && typeof j.landed === 'object', 'landed written');
      assertPrefixHash(j.landed.commit, h, 'landed.commit');
      assertEq(j.landed.pr, 'https://example.invalid/pr/7', 'landed.pr');
      assert('integration_check' in j.landed, 'landed.integration_check present');
    },
  },
  {
    id: 'land-refused-without-green-evidence-at-commit',
    covers: ['B50'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const other = rootCommit(L.root);
      const r = fc(['launch', 'land', '--commit', other], { cwd: L.root, env: L.env });
      assertExit(r, 2, 'no evidence at that commit');
      assertEq(readLaunch(L.root, L.launch).landed, undefined, 'landed not written');
      const p = path.join(L.launchDir, 'evidence', 'summary.json');
      const s = readJson(p);
      s.counts.error = 1;
      writeJson(p, s);
      const r2 = fc(['launch', 'land', '--commit', head(L.root)], { cwd: L.root, env: L.env });
      assertExit(r2, 2, 'evidence at HEAD has a non-zero error count');
      assertEq(readLaunch(L.root, L.launch).landed, undefined, 'landed still not written');
      const r3 = fc(['launch', 'land'], { cwd: L.root, env: L.env });
      assertExit(r3, 1, 'land without --commit');
    },
  },
  {
    id: 'land-evidence-commit-flag',
    covers: ['B50'],
    fn: async () => {
      const L = endedPhaseReport();
      checkAll(L);
      const evidenceCommit = head(L.root);
      writeText(path.join(L.root, 'INTEGRATION.txt'), 'integration commit\n');
      const integration = commitAll(L.root, 'integration commit');
      const refused = fc(['launch', 'land', '--commit', integration], { cwd: L.root, env: L.env });
      assertExit(refused, 2, 'no evidence at the integration commit itself');
      const r = fc(['launch', 'land', '--commit', integration, '--evidence-commit', evidenceCommit], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'land with --evidence-commit pointing at the green evidence');
      const j = readLaunch(L.root, L.launch);
      assertPrefixHash(j.landed.commit, integration, 'landed.commit is the integration commit');
      assertEq(j.landed.pr, null, 'landed.pr null without --pr');
    },
  },
]);
