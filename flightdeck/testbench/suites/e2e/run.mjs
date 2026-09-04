// testbench/suites/e2e/run.mjs — T1 (spec B34): drives the fc command sequence of a whole run over a temporary git repository holding the sample project and the sample spec, exactly as a user would, and checks every exit code and every produced file.
// Usage: node flightdeck/testbench/suites/e2e/run.mjs; exit 0 when every step passes, 2 otherwise. Steps run in order and share one repository; once a step fails, later steps report 'not reached'.
//
// One reading is assumed and is stated here because the sequence cannot be run without it. `fc launch pin tests-map` adds flightdeck/launch/<L>/specs/** to the locked
// paths and records lock_commit as HEAD at pin time, so the pin's own copies are committed one commit after lock_commit and match a locked glob by the letter of B14 and
// B15. The spec's acceptance requires `fc locked` to report no change under the paths the map locks after exactly that pin-then-commit, so a launch's own pinned copies
// under flightdeck/launch/<L>/specs/** are not counted as locked or outside changes. The `verify` and `launch-phase-review` steps below rest on that reading; the
// standalone `locked-reports-no-change` step does not — it passes an explicit --base so it proves B15 on its own terms.

import path from 'node:path';
import {
  suite, fc, sh, mkLaunchRepo, readJson, readText, exists, listFiles,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const LAUNCH = 'export-html-1';
const SPEC_NAME = 'export-html';
const HEADINGS = [
  `# Run report · ${SPEC_NAME} · ${LAUNCH}`,
  '## Ledger [checked · reviewed · stated]',
  '## Verification [checked]',
  '## Review [reviewed]',
  '## Phases [recorded · stated]',
  '## Agents [recorded · stated]',
  '## Failures and interventions [recorded]',
  '## Orchestrator notes [stated]',
];
const HEX = /^[0-9a-f]{7,40}$/;

const state = { repo: null, failed: null };

function launchDir() {
  return path.join(state.repo.root, 'flightdeck', 'launch', LAUNCH);
}

function launchJson() {
  return readJson(path.join(launchDir(), 'launch.json'));
}

function run(args) {
  return fc(args, { cwd: state.repo.root, env: { FLIGHTCREW_ROOT: state.repo.root } });
}

function commit(message) {
  const r = sh(`git add -A && git commit -q --no-verify --allow-empty -m "${message}"`, { cwd: state.repo.root });
  assertExit(r, 0, `git commit '${message}'`);
}

function head() {
  const r = sh('git rev-parse HEAD', { cwd: state.repo.root });
  assertExit(r, 0, 'git rev-parse HEAD');
  return r.stdout.trim();
}

function sameCommit(a, b) {
  return typeof a === 'string' && typeof b === 'string' && a.length >= 7 && b.length >= 7 && (a.startsWith(b) || b.startsWith(a));
}

function step(id, fn) {
  return {
    id,
    covers: ['B34'],
    fn: async () => {
      if (state.failed) throw new Error(`not reached: step '${state.failed}' failed first`);
      try {
        await fn();
      } catch (error) {
        state.failed = id;
        throw error;
      }
    },
  };
}

await suite('e2e', [
  step('setup-temporary-repository', () => {
    state.repo = mkLaunchRepo();
    assert(exists(path.join(state.repo.root, state.repo.specPath)), 'sample spec is at its canonical home');
    assert(exists(path.join(state.repo.root, state.repo.mapPath)), 'sample map is at its canonical home');
    assert(exists(path.join(state.repo.root, state.repo.planPath)), 'sample plan is beside the spec');
  }),

  step('launch-new', () => {
    const r = run(['launch', 'new', state.repo.specPath, '--name', LAUNCH]);
    assertExit(r, 0, 'fc launch new');
    const lj = launchJson();
    assertEq(lj.status, 'draft', 'launch.json.status after new');
    assertEq(lj.phase, 'targets', 'launch.json.phase after new');
    assertEq(lj.name, LAUNCH, 'launch.json.name');
    assert(exists(path.join(launchDir(), 'kickoff.md')), 'kickoff.md written');
    assert(exists(path.join(launchDir(), 'events.jsonl')), 'events.jsonl written');
    assert(exists(path.join(launchDir(), 'specs', SPEC_NAME, 'spec.v1.json')), 'spec copy pinned into the launch');
  }),

  step('launch-activate', () => {
    const r = run(['launch', 'activate', LAUNCH, '--allow-draft']);
    assertExit(r, 0, 'fc launch activate --allow-draft');
    assertEq(launchJson().status, 'active', 'launch.json.status after activate');
    commit('open launch');
  }),

  step('check-all-baseline', () => {
    const r = run(['check', 'all', '--baseline', state.repo.mapPath]);
    assertExit(r, 0, 'fc check all --baseline');
    const map = readJson(path.join(state.repo.root, state.repo.mapPath));
    assertMatch(map.baseline?.commit ?? '', HEX, 'map baseline.commit recorded');
    assertMatch(map.baseline?.date ?? '', /^\d{4}-\d{2}-\d{2}/, 'map baseline.date recorded');
    for (const check of map.checks) {
      assertMatch(check.baseline?.observed ?? '', /^pass:/, `${check.id} baseline.observed records the sample project passing`);
    }
    const evidenceDir = path.join(launchDir(), 'evidence');
    const evidence = exists(evidenceDir) ? listFiles(evidenceDir).filter((f) => /^T\d+\.json$/.test(f)) : [];
    assertEq(evidence, [], 'a baseline run writes no evidence files');
    commit('record map baseline');
  }),

  step('launch-pin-tests-map', () => {
    const r = run(['launch', 'pin', 'tests-map', state.repo.mapPath, '--allow-draft']);
    assertExit(r, 0, 'fc launch pin tests-map --allow-draft');
    const lj = launchJson();
    assert(lj.tests_map && typeof lj.tests_map.path === 'string', 'launch.json.tests_map pinned');
    assertMatch(lj.lock_commit ?? '', HEX, 'launch.json.lock_commit recorded');
    assert(sameCommit(lj.lock_commit, head()), 'lock_commit is HEAD at pin time');
    assertEq(lj.allow_draft, true, 'allow_draft recorded for a draft map');
    assertEq(lj.paths?.enforce_boundary, true, 'enforce_boundary set by the pin');
    assert(Array.isArray(lj.paths?.allowed) && lj.paths.allowed.length > 0, 'allowed paths set from the map');
    assert(exists(path.join(launchDir(), 'specs', SPEC_NAME, 'tests-map.v1.json')), 'map copy pinned into the launch');
    assertIncludes(readText(path.join(launchDir(), 'kickoff.md')), 'tests-map: ', 'kickoff header re-rendered with the map line');
    commit('pin tests map');
  }),

  step('launch-phase-plan', () => {
    const r = run(['launch', 'phase', 'plan']);
    assertExit(r, 0, 'fc launch phase plan');
    assertEq(launchJson().phase, 'plan', 'phase after plan');
  }),

  step('plan-write', () => {
    const r = run(['plan', 'write', state.repo.planPath]);
    assertExit(r, 0, 'fc plan write <sample plan>');
    assert(exists(path.join(launchDir(), 'plan.json')), 'plan.json stored');
    const planMd = readText(path.join(launchDir(), 'plan.md'));
    assertMatch(planMd, new RegExp(`^# Plan: ${SPEC_NAME} · ${LAUNCH}`, 'm'), 'plan.md rendered with its title');
  }),

  step('launch-gate-g1-approve', () => {
    const r = run(['launch', 'gate', 'G1', 'approve']);
    assertExit(r, 0, 'fc launch gate G1 approve');
    const lj = launchJson();
    assertEq(lj.gates?.G1?.status, 'approved', 'G1 recorded');
    assertEq(lj.phase, 'contracts', 'G1 approve moves the phase to contracts');
    commit('plan approved at G1');
  }),

  step('check-all-in-contracts', () => {
    const r = run(['check', 'all']);
    assertExit(r, 0, 'fc check all in phase contracts');
    const summary = readJson(path.join(launchDir(), 'evidence', 'summary.json'));
    assertEq(summary.counts?.fail, 0, 'summary fail count');
    assertEq(summary.counts?.error, 0, 'summary error count');
    commit('wave 0 checks');
  }),

  step('launch-gate-g2-approve', () => {
    const r = run(['launch', 'gate', 'G2', 'approve']);
    assertExit(r, 0, 'fc launch gate G2 approve');
    const lj = launchJson();
    assertEq(lj.gates?.G2?.status, 'approved', 'G2 recorded');
    assertEq(lj.phase, 'implement', 'G2 approve moves the phase to implement');
  }),

  step('launch-phase-verify', () => {
    const r = run(['launch', 'phase', 'verify']);
    assertExit(r, 0, 'fc launch phase verify');
    assertEq(launchJson().phase, 'verify', 'phase after verify');
  }),

  step('verify', () => {
    const r = run(['verify']);
    assertExit(r, 0, 'fc verify');
    for (const file of ['summary.json', 'boundary.json', 'locked.json', 'budget.json']) {
      assert(exists(path.join(launchDir(), 'evidence', file)), `evidence/${file} written by fc verify`);
    }
    const summary = readJson(path.join(launchDir(), 'evidence', 'summary.json'));
    assert(sameCommit(summary.commit, head()), `summary.json.commit ${summary.commit} is HEAD`);
    assertEq(summary.counts?.fail, 0, 'summary fail count after verify');
    assertEq(summary.counts?.error, 0, 'summary error count after verify');
  }),

  step('launch-phase-review', () => {
    const r = run(['launch', 'phase', 'review']);
    assertExit(r, 0, 'fc launch phase review');
    assertEq(launchJson().phase, 'review', 'phase after review');
  }),

  step('launch-phase-report', () => {
    const r = run(['launch', 'phase', 'report']);
    assertExit(r, 0, 'fc launch phase report');
    assertEq(launchJson().phase, 'report', 'phase after report');
  }),

  step('locked-reports-no-change', () => {
    const base = head();
    const r = run(['locked', '--base', base]);
    assertExit(r, 0, 'fc locked --base <HEAD>');
    const locked = readJson(path.join(launchDir(), 'evidence', 'locked.json'));
    assert(sameCommit(locked.base, base), `locked.json.base ${locked.base} is the base given`);
    assertEq(locked.locked, [], 'no changed file under a locked path since the last commit');
  }),

  step('launch-end-accepted', () => {
    const r = run(['launch', 'end', 'accepted']);
    assertExit(r, 0, 'fc launch end accepted');
    const lj = launchJson();
    assertEq(lj.status, 'accepted', 'launch.json.status after end');
    assertEq(lj.outcome, 'accepted', 'launch.json.outcome after end');
    assertEq(lj.phase, 'ended', 'launch.json.phase after end');
    assert(typeof lj.ended === 'string' && lj.ended.length > 0, 'launch.json.ended set');
  }),

  step('artefacts-left-in-place', () => {
    for (const file of ['launch.json', 'plan.md', path.join('evidence', 'summary.json'), 'report.md', 'evidence.html']) {
      assert(exists(path.join(launchDir(), file)), `${file} left in place`);
    }
    const runlogPath = path.join(state.repo.root, 'flightdeck', 'launch', 'RUNLOG.md');
    assert(exists(runlogPath), 'flightdeck/launch/RUNLOG.md created');
    const runlog = readText(runlogPath);
    assertMatch(runlog, /^# Run log/m, 'RUNLOG.md carries its first heading');
    assertMatch(runlog, new RegExp(`^## \\d{4}-\\d{2}-\\d{2} · ${SPEC_NAME} · ${LAUNCH}$`, 'm'), 'RUNLOG.md holds the entry for this run');
    assertMatch(runlog, /^(?:[-*] )?outcome: .*accepted/m, 'RUNLOG entry carries the outcome line');
  }),

  step('report-headings-and-ledger', () => {
    const report = readText(path.join(launchDir(), 'report.md'));
    let cursor = -1;
    for (const heading of HEADINGS) {
      const at = report.indexOf(heading, cursor + 1);
      assert(at > cursor && (at === 0 || report[at - 1] === '\n'), `report.md heading in order at line start: ${heading}`);
      cursor = at;
    }
    const ledgerStart = report.indexOf(HEADINGS[1]);
    const ledgerEnd = report.indexOf(HEADINGS[2]);
    const ledger = report.slice(ledgerStart + HEADINGS[1].length, ledgerEnd).trim();
    assert(ledger.length > 0, 'the ledger section has content');
    const header = report.slice(0, ledgerStart);
    assertMatch(header, /outcome\b.*accepted/, 'report header carries the outcome');
    assertMatch(header, /allow_draft/, 'report header prints allow_draft for a run that accepted a draft map');
  }),
]);
