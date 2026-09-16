// testbench/suites/e2e/run.mjs — T1 (spec B34): drives the fc command sequence of a whole run over a temporary git repository holding the sample project and the sample spec, exactly as a user would, and checks every exit code and every produced file.
// Usage: node flightdeck/testbench/suites/e2e/run.mjs; exit 0 when every step passes, 2 otherwise. Steps run in order and share one repository; once a step fails, later steps report 'not reached'.
//
// One reading is assumed and is stated here because the sequence cannot be run without it. `fc launch pin tests-map` adds flightdeck/launch/<L>/specs/** to the locked
// paths and records lock_commit as HEAD at pin time, so the pin's own copies are committed one commit after lock_commit and match a locked glob by the letter of B14 and
// B15. The spec's acceptance requires `fc locked` to report no change under the paths the map locks after exactly that pin-then-commit, so a launch's own pinned copies
// under flightdeck/launch/<L>/specs/** are not counted as locked or outside changes. The `verify` and `launch-phase-review` steps below rest on that reading; the
// standalone `locked-reports-no-change` step does not — it passes an explicit --base so it proves B15 on its own terms.
//
// Naming steps (spec B1, B2): beside each earlier step sits a step whose name carries the subcommand token as the runner's usage prints it ('fc launch new', 'fc check',
// …). A naming step asserts the exit code and the effect of the invocation the step before it made, or makes its own invocation (fc launch status, fc plan render,
// fc worker render, fc launch land, fc runlog show), so breaking that subcommand's exit code turns the step naming it red. The run ends with one defect step: a
// launch that has ended still accepts a gate decision.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, defect, fc, sh, mkLaunchRepo, readJson, readText, exists, listFiles,
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

const state = { repo: null, failed: null, log: [] };

function launchDir() {
  return path.join(state.repo.root, 'flightdeck', 'launch', LAUNCH);
}

function launchJson() {
  return readJson(path.join(launchDir(), 'launch.json'));
}

function run(args) {
  const r = fc(args, { cwd: state.repo.root, env: { FLIGHTCREW_ROOT: state.repo.root } });
  state.log.push({ args, r });
  return r;
}

/** The result of the newest invocation whose arguments start with `prefix`. */
function ran(prefix) {
  for (let i = state.log.length - 1; i >= 0; i -= 1) {
    const { args, r } = state.log[i];
    if (prefix.every((word, at) => args[at] === word)) return r;
  }
  throw new Error(`fc ${prefix.join(' ')} was never run`);
}

function events() {
  const file = path.join(launchDir(), 'events.jsonl');
  return readText(file).split('\n').filter((line) => line.trim() !== '').map((line) => JSON.parse(line));
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

/** A step pinning a defect: today's behaviour, asserted, with the stated behaviour in its defect line. */
function defectStep(id, should, ref, fn) {
  return defect({ id, should, ref, fn: step(id, fn).fn });
}

await suite({ name: 'e2e', covers: ['B1', 'B2'] }, [
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

  step('fc launch new exits 0 and writes a draft launch in phase targets with its kickoff and events file', () => {
    assertExit(ran(['launch', 'new']), 0, 'fc launch new <spec> --name');
    const lj = launchJson();
    assertEq([lj.status, lj.phase], ['draft', 'targets'], 'launch.json status and phase');
    assertEq(lj.spec?.name, SPEC_NAME, 'launch.json names the spec');
    assert(exists(path.join(launchDir(), 'kickoff.md')) && exists(path.join(launchDir(), 'events.jsonl')), 'kickoff.md and events.jsonl written');
  }),

  step('launch-activate', () => {
    const r = run(['launch', 'activate', LAUNCH, '--allow-draft']);
    assertExit(r, 0, 'fc launch activate --allow-draft');
    assertEq(launchJson().status, 'active', 'launch.json.status after activate');
    commit('open launch');
  }),

  step('fc launch activate exits 0 and makes the draft launch the active one', () => {
    assertExit(ran(['launch', 'activate']), 0, 'fc launch activate <name> --allow-draft');
    const lj = launchJson();
    assertEq(lj.status, 'active', 'launch.json.status');
    const again = run(['launch', 'activate', LAUNCH]);
    assertExit(again, 1, 'fc launch activate on a launch that is already active');
    assertIncludes(again.stderr, 'only a draft launch can be activated', 'the refusal names the rule');
  }),

  step('fc launch status prints the active launch with its status and phase and exits 0', () => {
    const r = run(['launch', 'status']);
    assertExit(r, 0, 'fc launch status');
    const lines = r.stdout.split('\n');
    assertEq(lines[0], `launch: ${LAUNCH}`, 'first line names the launch');
    assertEq(lines[1], 'status: active    phase: targets', 'second line carries status and phase');
    assertIncludes(r.stdout, 'gates: G1 pending · G2 pending · G3 pending', 'the gates line');
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

  step('fc check all --baseline exits 0 and records an observed baseline for every check of the draft map', () => {
    assertExit(ran(['check', 'all', '--baseline']), 0, 'fc check all --baseline <map>');
    const map = readJson(path.join(state.repo.root, state.repo.mapPath));
    assert(map.checks.length > 0 && map.checks.every((check) => /^pass:/.test(check.baseline?.observed ?? '')), 'every check carries an observed pass');
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

  step('fc launch pin tests-map exits 0 and records the pinned map, the lock commit and the locked paths', () => {
    assertExit(ran(['launch', 'pin', 'tests-map']), 0, 'fc launch pin tests-map <map> --allow-draft');
    const lj = launchJson();
    assertMatch(lj.lock_commit ?? '', HEX, 'lock_commit recorded');
    assertIncludes(lj.paths?.locked ?? [], `flightdeck/launch/${LAUNCH}/specs/**`, 'the launch pinned copies are locked');
    assert(exists(path.resolve(launchDir(), lj.tests_map.path)), 'tests_map.path resolves to the pinned copy');
  }),

  step('launch-phase-plan', () => {
    const r = run(['launch', 'phase', 'plan']);
    assertExit(r, 0, 'fc launch phase plan');
    assertEq(launchJson().phase, 'plan', 'phase after plan');
  }),

  step('fc launch phase plan exits 0 and appends a phase event from targets to plan', () => {
    assertExit(ran(['launch', 'phase', 'plan']), 0, 'fc launch phase plan');
    const phases = events().filter((event) => event.event === 'phase');
    const last = phases[phases.length - 1];
    assert(last, 'a phase event is appended');
    assertEq([last.detail?.from, last.detail?.to, last.detail?.forced], ['targets', 'plan', false], 'phase event detail');
  }),

  step('plan-write', () => {
    const r = run(['plan', 'write', state.repo.planPath]);
    assertExit(r, 0, 'fc plan write <sample plan>');
    assert(exists(path.join(launchDir(), 'plan.json')), 'plan.json stored');
    const planMd = readText(path.join(launchDir(), 'plan.md'));
    assertMatch(planMd, new RegExp(`^# Plan: ${SPEC_NAME} · ${LAUNCH}`, 'm'), 'plan.md rendered with its title');
  }),

  step('fc plan write exits 0 and stores the plan as plan.json', () => {
    assertExit(ran(['plan', 'write']), 0, 'fc plan write <plan>');
    assertEq(readJson(path.join(launchDir(), 'plan.json')), readJson(path.join(state.repo.root, state.repo.planPath)), 'plan.json holds the plan written');
  }),

  step('fc plan render re-renders a removed plan.md from plan.json and exits 0', () => {
    const planMd = path.join(launchDir(), 'plan.md');
    const before = readText(planMd);
    fs.rmSync(planMd);
    const r = run(['plan', 'render']);
    assertExit(r, 0, 'fc plan render');
    assert(exists(planMd), 'plan.md written again');
    assertEq(readText(planMd), before, 'the same plan renders the same plan.md');
  }),

  step('launch-gate-g1-approve', () => {
    const r = run(['launch', 'gate', 'G1', 'approve']);
    assertExit(r, 0, 'fc launch gate G1 approve');
    const lj = launchJson();
    assertEq(lj.gates?.G1?.status, 'approved', 'G1 recorded');
    assertEq(lj.phase, 'contracts', 'G1 approve moves the phase to contracts');
    commit('plan approved at G1');
  }),

  step('fc launch gate G1 approve exits 0 and records the gate with the move to contracts', () => {
    assertExit(ran(['launch', 'gate', 'G1']), 0, 'fc launch gate G1 approve');
    const gates = events().filter((event) => event.event === 'gate');
    assertEq(gates[gates.length - 1]?.detail?.gate, 'G1', 'a gate event names G1');
    assertEq(launchJson().gates?.G1?.status, 'approved', 'G1 approved in launch.json');
  }),

  step('check-all-in-contracts', () => {
    const r = run(['check', 'all']);
    assertExit(r, 0, 'fc check all in phase contracts');
    const summary = readJson(path.join(launchDir(), 'evidence', 'summary.json'));
    assertEq(summary.counts?.fail, 0, 'summary fail count');
    assertEq(summary.counts?.error, 0, 'summary error count');
    commit('wave 0 checks');
  }),

  step('fc check all exits 0 and writes one evidence file per check of the pinned map', () => {
    assertExit(ran(['check', 'all']), 0, 'fc check all');
    const map = readJson(path.resolve(launchDir(), launchJson().tests_map.path));
    for (const check of map.checks) {
      assertEq(readJson(path.join(launchDir(), 'evidence', `${check.id}.json`)).verdict, 'pass', `evidence/${check.id}.json verdict`);
    }
  }),

  step('launch-gate-g2-approve', () => {
    const r = run(['launch', 'gate', 'G2', 'approve']);
    assertExit(r, 0, 'fc launch gate G2 approve');
    const lj = launchJson();
    assertEq(lj.gates?.G2?.status, 'approved', 'G2 recorded');
    assertEq(lj.phase, 'implement', 'G2 approve moves the phase to implement');
  }),

  step('fc worker render U1 prints the sealed dispatch prompt in phase implement and writes it beside the returns', () => {
    const r = run(['worker', 'render', 'U1']);
    assertExit(r, 0, 'fc worker render U1');
    assertEq(r.stdout.split('\n')[0], 'unit: U1', 'the prompt opens with the unit');
    const file = path.join(launchDir(), 'returns', 'U1.prompt.md');
    assert(exists(file), 'returns/U1.prompt.md written');
    assertEq(readText(file).trimEnd(), r.stdout.trimEnd(), 'the file holds the printed prompt');
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

  step('fc verify exits 0 with clean boundary, locked and budget evidence', () => {
    assertExit(ran(['verify']), 0, 'fc verify');
    assertEq(readJson(path.join(launchDir(), 'evidence', 'boundary.json')).outside, [], 'boundary.json outside');
    assertEq(readJson(path.join(launchDir(), 'evidence', 'locked.json')).locked, [], 'locked.json locked');
    assertEq(readJson(path.join(launchDir(), 'evidence', 'budget.json')).exceeded, [], 'budget.json exceeded');
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

  step('fc locked exits 0 and writes locked.json when no locked path changed', () => {
    assertExit(ran(['locked']), 0, 'fc locked --base <HEAD>');
    const locked = readJson(path.join(launchDir(), 'evidence', 'locked.json'));
    assert(Array.isArray(locked.changed), 'locked.json carries the change set');
    assertEq(locked.locked, [], 'locked.json locked is empty');
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

  step('fc launch end accepted exits 0 and appends the launch_end event after writing the report', () => {
    assertExit(ran(['launch', 'end']), 0, 'fc launch end accepted');
    const all = events();
    assertEq(all[all.length - 1]?.event, 'launch_end', 'the last event is launch_end');
    assertEq(all[all.length - 1]?.detail?.outcome, 'accepted', 'launch_end carries the outcome');
    assert(exists(path.join(launchDir(), 'report.md')), 'report.md written');
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

  step('fc runlog show prints the run-log entry of the ended launch and exits 0', () => {
    const r = run(['runlog', 'show', '--spec', SPEC_NAME]);
    assertExit(r, 0, 'fc runlog show --spec');
    assertMatch(r.stdout.split('\n')[0], new RegExp(`^## \\d{4}-\\d{2}-\\d{2} · ${SPEC_NAME} · ${LAUNCH}$`), 'the entry heading comes first');
    assertMatch(r.stdout, /^outcome: accepted$/m, 'the entry carries its outcome');
  }),

  step('fc launch land records the landed commit on the ended launch and exits 0', () => {
    const commitHead = head();
    const r = run(['launch', 'land', '--commit', commitHead, '--launch', LAUNCH]);
    assertExit(r, 0, 'fc launch land --commit <HEAD>');
    const landed = launchJson().landed;
    assert(landed && sameCommit(landed.commit, commitHead), `launch.json.landed.commit is HEAD: ${JSON.stringify(landed)}`);
    assertEq(landed.pr, null, 'no pull request given');
  }),

  defectStep(
    'fc launch gate G3 approve records a gate decision on a launch that has ended',
    'a launch that has ended refuses a gate decision, because afterwards only the land command and the run-log stub still write',
    'flightdeck/manuals/launch/launch-anatomy.md:73',
    () => {
      assertEq(launchJson().status, 'accepted', 'the launch has ended');
      const r = run(['launch', 'gate', 'G3', 'approve', '--launch', LAUNCH]);
      assertExit(r, 0, 'fc launch gate G3 approve on the ended launch');
      assertEq(launchJson().gates?.G3?.status, 'approved', 'G3 is recorded as approved after the ending');
    },
  ),
]);
