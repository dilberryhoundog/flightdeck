// testbench/suites/bin-check/run.mjs — regression suite T8: fc check, fc check --baseline and fc verify (spec B12, B13, B36, B46, I6, E2, E8, E11, E17) driven over a temporary copy of the sample launch.
// Usage: node flightdeck/testbench/suites/bin-check/run.mjs; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exit 0 when every case passes, 2 otherwise.
//
// Every case builds its own active launch under os.tmpdir() with mkActiveLaunch, points base_commit and lock_commit at that repository's HEAD, and mutates the
// pinned copy of the tests map (launch/<L>/specs/export-html/tests-map.v1.json) for the negative outcomes. Only the public surface is asserted: exit codes,
// the message lines, and the files under launch/<L>/evidence/ as spec I6 shapes them. Nothing here is run against the repository that holds this suite.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, tmp, mkActiveLaunch, readJson, writeJson, exists, SCHEMAS,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const MAP_REL = ['specs', 'export-html', 'tests-map.v1.json'];
const ALL_IDS = ['T1', 'T2', 'T3', 'T4', 'T5'];

// ── helpers ──────────────────────────────────────────────────────────────────
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const pinnedMapPath = (l) => path.join(l.launchDir, ...MAP_REL);
const evidenceDir = (l) => path.join(l.launchDir, 'evidence');
const evidencePath = (l, id) => path.join(evidenceDir(l), `${id}.json`);
const summaryPath = (l) => path.join(evidenceDir(l), 'summary.json');
const combined = (r) => `${r.stdout}\n${r.stderr}`;
const headSha = (root) => sh('git rev-parse HEAD', { cwd: root }).stdout.trim();
const sameCommit = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length >= 7 && b.length >= 7 && (a.startsWith(b) || b.startsWith(a));
const fresh = (iso, since) => Number.isFinite(Date.parse(iso)) && Date.parse(iso) >= since - 5000;

/** An active copy of the sample launch whose base_commit and lock_commit are the temporary repository's own HEAD. */
function ready() {
  const l = mkActiveLaunch();
  const lj = readJson(launchJsonPath(l));
  const head = headSha(l.root);
  lj.base_commit = head;
  lj.lock_commit = head;
  writeJson(launchJsonPath(l), lj);
  return l;
}

function clearEvidence(l) {
  fs.rmSync(evidenceDir(l), { recursive: true, force: true });
  fs.mkdirSync(evidenceDir(l), { recursive: true });
}

function evidenceFiles(l) {
  return fs.readdirSync(evidenceDir(l)).filter((name) => /^T\d+\.json$/.test(name)).sort();
}

function editMap(mapPath, mutate) {
  const map = readJson(mapPath);
  mutate(map);
  writeJson(mapPath, map);
  return map;
}

function check(map, id) {
  const found = map.checks.find((c) => c.id === id);
  assert(found, `map has no check ${id}`);
  return found;
}

/** A sixth check appended to a map: ok status, covers B1, the given command. */
function extraCheck(command, expect = 'pass: extra check') {
  return { id: 'T6', status: 'ok', kind: 'behavioural', class: 'deterministic', covers: ['B1'], command, baseline: { expect, observed: expect } };
}

function fcAt(l, args, extra = {}) {
  return fc(args, { cwd: l.root, env: l.env, ...extra });
}

// ── a minimal reading of check-result.schema.json (type, required, additionalProperties, enum, pattern, items.type) ──
function typeOk(value, type) {
  const types = Array.isArray(type) ? type : [type];
  return types.some((t) => {
    if (t === 'null') return value === null;
    if (t === 'array') return Array.isArray(value);
    if (t === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
    if (t === 'integer') return Number.isInteger(value);
    if (t === 'number') return typeof value === 'number';
    return typeof value === t;
  });
}

function schemaProblems(schema, doc) {
  const problems = [];
  for (const key of schema.required ?? []) if (!(key in doc)) problems.push(`missing ${key}`);
  const props = schema.properties ?? {};
  if (schema.additionalProperties === false) {
    for (const key of Object.keys(doc)) if (!(key in props)) problems.push(`unexpected ${key}`);
  }
  for (const [key, rule] of Object.entries(props)) {
    if (!(key in doc)) continue;
    const value = doc[key];
    if (rule.type && !typeOk(value, rule.type)) problems.push(`${key}: type`);
    if (rule.enum && !rule.enum.includes(value)) problems.push(`${key}: enum`);
    if (rule.pattern && typeof value === 'string' && !new RegExp(rule.pattern).test(value)) problems.push(`${key}: pattern`);
    if (rule.items?.type && Array.isArray(value)) {
      for (const item of value) if (!typeOk(item, rule.items.type)) problems.push(`${key}: item type`);
    }
  }
  return problems;
}

// ── cases ────────────────────────────────────────────────────────────────────
await suite('bin-check', [
  {
    id: 'check-all-runs-every-live-check-and-exits-0',
    covers: ['B12', 'I6'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      const started = Date.now();
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 0, 'fc check all on the ready launch');
      assertEq(evidenceFiles(l), ALL_IDS.map((id) => `${id}.json`), 'one evidence file per check');
      assert(exists(summaryPath(l)), 'evidence/summary.json written');
      const summary = readJson(summaryPath(l));
      assertEq(summary.counts, { pass: 5, fail: 0, error: 0, skipped: 0 }, 'summary counts');
      assertEq(summary.checks.map((c) => c.id), ALL_IDS, 'summary lists every check in map order');
      assert(fresh(summary.ran_at, started), `summary.ran_at is fresh: ${summary.ran_at}`);
      assert(sameCommit(summary.commit, headSha(l.root)), `summary.commit is HEAD: ${summary.commit}`);
      assert(Array.isArray(summary.unverified) && Array.isArray(summary.quarantined) && Array.isArray(summary.uncovered), 'summary carries unverified, quarantined and uncovered lists');
      const map = readJson(pinnedMapPath(l));
      for (const entry of summary.checks) {
        assertEq(entry.verdict, 'pass', `${entry.id} verdict in summary`);
        assertEq(entry.covers, check(map, entry.id).covers, `${entry.id} covers in summary`);
      }
      const t5 = readJson(evidencePath(l, 'T5'));
      assertEq(t5.verdict, 'pass', 'the gate_only check T5 ran under check all');
      assert(fresh(t5.ran_at, started), 'T5 evidence is fresh');
    },
  },
  {
    id: 'check-all-exits-2-on-a-failing-verdict',
    covers: ['B12'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => { check(map, 'T4').command = 'echo failing on purpose; exit 1'; });
      clearEvidence(l);
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 2, 'fc check all with one failing check');
      const t4 = readJson(evidencePath(l, 'T4'));
      assertEq(t4.verdict, 'fail', 'T4 verdict');
      assertEq(t4.exit, 1, 'T4 exit code recorded');
      assertIncludes(t4.stdout_tail, 'failing on purpose', 'T4 stdout_tail holds the output line');
      const summary = readJson(summaryPath(l));
      assertEq(summary.counts, { pass: 4, fail: 1, error: 0, skipped: 0 }, 'summary counts with one fail');
      assertEq(evidenceFiles(l).length, 5, 'the other checks still ran');
    },
  },
  {
    id: 'check-all-records-skipped-for-quarantined-ids-without-affecting-exit',
    covers: ['B12'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => {
        check(map, 'T4').command = 'echo would fail; exit 1';
        map.quarantined = [{ id: 'T4', since: '2026-08-30', reason: 'quarantined by decision for this case' }];
      });
      clearEvidence(l);
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 0, 'fc check all with the failing check quarantined');
      const t4 = readJson(evidencePath(l, 'T4'));
      assertEq(t4.verdict, 'skipped', 'quarantined T4 has verdict skipped');
      const summary = readJson(summaryPath(l));
      assertIncludes(summary.quarantined, 'T4', 'summary.quarantined names T4');
      assertEq(summary.counts, { pass: 4, fail: 0, error: 0, skipped: 1 }, 'summary counts with one skipped');
      assertEq(summary.checks.find((c) => c.id === 'T4')?.verdict, 'skipped', 'summary lists T4 as skipped');
    },
  },
  {
    id: 'check-subset-rebuilds-summary-from-the-evidence-files-present',
    covers: ['B12'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      const first = fcAt(l, ['check', 'T1', 'T3']);
      assertExit(first, 0, 'fc check T1 T3');
      assertEq(evidenceFiles(l), ['T1.json', 'T3.json'], 'only the named checks wrote evidence');
      let summary = readJson(summaryPath(l));
      assertEq(summary.checks.map((c) => c.id), ['T1', 'T3'], 'summary built from the two files present');
      assertEq(summary.counts, { pass: 2, fail: 0, error: 0, skipped: 0 }, 'summary counts for two checks');
      const second = fcAt(l, ['check', 'T2']);
      assertExit(second, 0, 'fc check T2');
      assertEq(evidenceFiles(l), ['T1.json', 'T2.json', 'T3.json'], 'earlier results left in place');
      summary = readJson(summaryPath(l));
      assertEq(summary.checks.map((c) => c.id).sort(), ['T1', 'T2', 'T3'], 'summary rebuilt from all three files');
      assertEq(summary.counts.pass, 3, 'summary counts all three');
    },
  },
  {
    id: 'evidence-file-validates-and-carries-command-exit-commit-phase-covers',
    covers: ['B13', 'I6'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      const started = Date.now();
      assertExit(fcAt(l, ['check', 'all']), 0, 'fc check all');
      const schemaPath = path.join(SCHEMAS, 'check-result.schema.json');
      assert(exists(schemaPath), 'flightcrew/schemas/check-result.schema.json exists');
      const schema = readJson(schemaPath);
      const map = readJson(pinnedMapPath(l));
      const phase = readJson(launchJsonPath(l)).phase;
      const head = headSha(l.root);
      for (const id of ALL_IDS) {
        const ev = readJson(evidencePath(l, id));
        assertEq(schemaProblems(schema, ev), [], `${id}.json against check-result.schema.json`);
        assertEq(ev.id, id, `${id}.json id`);
        assertEq(ev.command, check(map, id).command, `${id}.json carries the exact command`);
        assertEq(ev.cwd, l.root, `${id}.json cwd is the launch root`);
        assertEq(ev.exit, 0, `${id}.json exit`);
        assertEq(ev.verdict, 'pass', `${id}.json verdict`);
        assert(Array.isArray(ev.stdout_tail) && ev.stdout_tail.every((s) => typeof s === 'string'), `${id}.json stdout_tail is a list of lines`);
        assert(Array.isArray(ev.stderr_tail) && ev.stderr_tail.every((s) => typeof s === 'string'), `${id}.json stderr_tail is a list of lines`);
        assert(Number.isInteger(ev.duration_ms) && ev.duration_ms >= 0, `${id}.json duration_ms`);
        assert(fresh(ev.ran_at, started), `${id}.json ran_at is fresh: ${ev.ran_at}`);
        assert(sameCommit(ev.commit, head), `${id}.json commit is HEAD ${head}: ${ev.commit}`);
        assertEq(ev.covers, check(map, id).covers, `${id}.json covers`);
        assertEq(ev.phase, phase, `${id}.json phase`);
      }
      const t1 = readJson(evidencePath(l, 'T1'));
      assertIncludes(t1.stdout_tail, 'export-smoke: ok (3 pages, 1 asset, 0 warnings)', 'T1 stdout_tail holds the smoke line');
    },
  },
  {
    id: 'evidence-tails-are-the-last-forty-lines-of-each-stream',
    covers: ['B13'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => {
        map.checks.push(extraCheck('i=0; while [ $i -lt 50 ]; do echo out$i; echo err$i 1>&2; i=$((i+1)); done', 'pass: prints fifty lines'));
      });
      const r = fcAt(l, ['check', 'T6']);
      assertExit(r, 0, 'fc check T6');
      const ev = readJson(evidencePath(l, 'T6'));
      assertEq(ev.stdout_tail.length, 40, 'stdout_tail holds forty lines');
      assertEq(ev.stdout_tail[0], 'out10', 'stdout_tail starts at the eleventh line');
      assertEq(ev.stdout_tail[39], 'out49', 'stdout_tail ends at the last line');
      assertEq(ev.stderr_tail.length, 40, 'stderr_tail holds forty lines');
      assertEq(ev.stderr_tail[0], 'err10', 'stderr_tail starts at the eleventh line');
      assertEq(ev.stderr_tail[39], 'err49', 'stderr_tail ends at the last line');
    },
  },
  {
    id: 'check-runs-with-flightcrew-launch-in-env-and-cwd-launch-root-or-cwd-flag',
    covers: ['I6'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => { map.checks.push(extraCheck('echo "$FLIGHTCREW_LAUNCH"; pwd', 'pass: export-html-1')); });
      const plain = fcAt(l, ['check', 'T6']);
      assertExit(plain, 0, 'fc check T6');
      let ev = readJson(evidencePath(l, 'T6'));
      assertEq(ev.stdout_tail, ['export-html-1', l.root], 'FLIGHTCREW_LAUNCH names the launch and cwd is the launch root');
      assertEq(ev.cwd, l.root, 'cwd recorded as the launch root');
      const sub = path.join(l.root, 'src');
      const withCwd = fcAt(l, ['check', 'T6', '--cwd', sub]);
      assertExit(withCwd, 0, 'fc check T6 --cwd <dir>');
      ev = readJson(evidencePath(l, 'T6'));
      assertEq(ev.stdout_tail, ['export-html-1', sub], 'with --cwd the command runs in that directory');
      assertEq(ev.cwd, sub, 'cwd recorded as the --cwd directory');
    },
  },
  {
    id: 'checks-run-serially-in-map-order',
    covers: ['I6'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => {
        // T6 sits between T1 and T2 in map order and writes a marker; T2 is replaced by a command that reads the marker, so order and seriality are observable.
        const marker = path.join(tmp('fc-order'), 'marker');
        const t6 = extraCheck(`sleep 1; echo ran > "${marker}"`, 'pass: writes the marker');
        map.checks.splice(1, 0, t6);
        check(map, 'T2').command = `test -f "${marker}" && echo marker-present`;
        check(map, 'T2').baseline.observed = 'pass: marker-present';
      });
      clearEvidence(l);
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 0, 'fc check all with the ordering probe');
      const t2 = readJson(evidencePath(l, 'T2'));
      assertEq(t2.verdict, 'pass', 'T2 ran after T6 finished (map order, serial)');
      assertIncludes(t2.stdout_tail, 'marker-present', 'T2 saw the marker T6 wrote');
      const order = ['T1', 'T6', 'T2', 'T3', 'T4', 'T5'].map((id) => Date.parse(readJson(evidencePath(l, id)).ran_at));
      for (let i = 1; i < order.length; i += 1) assert(order[i] >= order[i - 1], `ran_at is non-decreasing in map order at position ${i}`);
    },
  },
  {
    id: 'missing-binary-is-verdict-error-others-still-run-exit-2',
    covers: ['E2', 'I6'],
    fn: async () => {
      const l = ready();
      const bad = 'definitely-missing-binary-4f2e --version';
      editMap(pinnedMapPath(l), (map) => { check(map, 'T2').command = bad; });
      clearEvidence(l);
      const started = Date.now();
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 2, 'fc check all with a missing binary');
      const t2 = readJson(evidencePath(l, 'T2'));
      assertEq(t2.verdict, 'error', 'T2 verdict is error');
      assertIncludes(t2.stderr_tail.join('\n'), 'definitely-missing-binary-4f2e', 'T2 stderr_tail names the command');
      for (const id of ['T3', 'T4', 'T5']) {
        const ev = readJson(evidencePath(l, id));
        assertEq(ev.verdict, 'pass', `${id} still ran after the error`);
        assert(fresh(ev.ran_at, started), `${id} evidence is fresh`);
      }
      const summary = readJson(summaryPath(l));
      assertEq(summary.counts, { pass: 4, fail: 0, error: 1, skipped: 0 }, 'summary counts one error');
    },
  },
  {
    id: 'pin-mismatch-exits-1-and-runs-nothing',
    covers: ['E8'],
    fn: async () => {
      for (const [label, mutate] of [
        ['commit', (map) => { map.spec.commit = 'ffffff0'; }],
        ['version', (map) => { map.spec.version = 2; }],
        ['name', (map) => { map.spec.name = 'export-pdf'; }],
      ]) {
        const l = ready();
        editMap(pinnedMapPath(l), mutate);
        clearEvidence(l);
        const r = fcAt(l, ['check', 'all']);
        assertExit(r, 1, `fc check all with a spec pin differing in ${label}`);
        assertIncludes(combined(r), 'pin mismatch', `message for a ${label} mismatch`);
        assertEq(evidenceFiles(l), [], `no evidence written on a ${label} mismatch`);
        assert(!exists(summaryPath(l)), `no summary written on a ${label} mismatch`);
      }
    },
  },
  {
    id: 'no-tests-map-pinned-exits-1',
    covers: ['E11'],
    fn: async () => {
      const l = ready();
      const lj = readJson(launchJsonPath(l));
      lj.tests_map = null;
      writeJson(launchJsonPath(l), lj);
      clearEvidence(l);
      const r = fcAt(l, ['check', 'all']);
      assertExit(r, 1, 'fc check all without a pinned map');
      assertIncludes(combined(r), 'no tests map pinned', 'message names the missing pin');
      assertEq(evidenceFiles(l), [], 'no evidence written');
    },
  },
  {
    id: 'unknown-check-id-exits-1-naming-it-and-runs-nothing',
    covers: ['E17'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      const alone = fcAt(l, ['check', 'T99']);
      assertExit(alone, 1, 'fc check T99');
      assertIncludes(combined(alone), 'T99', 'message names the unknown id');
      assertEq(evidenceFiles(l), [], 'nothing ran for T99');
      const mixed = fcAt(l, ['check', 'T1', 'T99']);
      assertExit(mixed, 1, 'fc check T1 T99');
      assertIncludes(combined(mixed), 'T99', 'message names the unknown id among known ones');
      assertEq(evidenceFiles(l), [], 'nothing ran when one id is unknown');
    },
  },
  {
    id: 'baseline-writes-observed-commit-and-date-into-the-draft-map-and-no-evidence',
    covers: ['B36'],
    fn: async () => {
      const l = ready();
      const draft = path.join(l.root, l.mapPath);
      editMap(draft, (map) => {
        for (const c of map.checks) c.baseline.observed = '';
        map.baseline = { commit: 'none', date: '1970-01-01', note: map.baseline.note };
      });
      clearEvidence(l);
      const r = fcAt(l, ['check', 'all', '--baseline', l.mapPath]);
      assertExit(r, 0, 'fc check all --baseline <draft map>');
      const map = readJson(draft);
      assertEq(map.status, 'draft', 'the map stays draft');
      assertEq(check(map, 'T1').baseline.observed, 'pass: export-smoke: ok (3 pages, 1 asset, 0 warnings)', 'T1 observed');
      assertEq(check(map, 'T2').baseline.observed, 'pass: TAP version 13', 'T2 observed');
      assertEq(check(map, 'T3').baseline.observed, 'pass: TAP version 13', 'T3 observed');
      assertEq(check(map, 'T4').baseline.observed, 'pass: TAP version 13', 'T4 observed');
      assertEq(check(map, 'T5').baseline.observed, 'pass: export-invariants: ok (1 source file scanned, 2 exports checked)', 'T5 observed');
      assert(sameCommit(map.baseline.commit, headSha(l.root)), `file-level baseline.commit is HEAD: ${map.baseline.commit}`);
      const now = new Date();
      const utc = now.toISOString().slice(0, 10);
      const local = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      assert(typeof map.baseline.date === 'string' && [utc, local].includes(map.baseline.date.slice(0, 10)), `file-level baseline.date is today: ${map.baseline.date}`);
      assertEq(evidenceFiles(l), [], 'baseline writes no evidence files');
      assert(!exists(summaryPath(l)), 'baseline writes no summary');
    },
  },
  {
    id: 'baseline-records-fail-and-error-words-and-exits-2-when-a-command-cannot-spawn',
    covers: ['B36'],
    fn: async () => {
      const l = ready();
      const draft = path.join(l.root, l.mapPath);
      clearEvidence(l);
      editMap(draft, (map) => { check(map, 'T2').command = 'echo nope; exit 1'; });
      const failing = fcAt(l, ['check', 'all', '--baseline', l.mapPath]);
      assertExit(failing, 0, 'baseline with a failing command still exits 0');
      assertEq(check(readJson(draft), 'T2').baseline.observed, 'fail: nope', 'T2 observed after a failing command');
      editMap(draft, (map) => { check(map, 'T3').command = 'definitely-missing-binary-4f2e --version'; });
      const broken = fcAt(l, ['check', 'all', '--baseline', l.mapPath]);
      assertExit(broken, 2, 'baseline with a command that cannot spawn exits 2');
      const t3 = check(readJson(draft), 'T3').baseline.observed;
      assertMatch(t3, /^error: /, 'T3 observed starts with error:');
      assertEq(evidenceFiles(l), [], 'baseline writes no evidence files even on error');
    },
  },
  {
    id: 'verify-runs-check-boundary-locked-budget-in-order-and-exits-0-when-clean',
    covers: ['B46'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      const started = Date.now();
      const r = fcAt(l, ['verify']);
      assertExit(r, 0, 'fc verify on a clean launch');
      assertEq(evidenceFiles(l), ALL_IDS.map((id) => `${id}.json`), 'check evidence written');
      const files = ['summary.json', 'boundary.json', 'locked.json', 'budget.json'].map((name) => path.join(evidenceDir(l), name));
      for (const f of files) assert(exists(f), `${path.basename(f)} written by fc verify`);
      const summary = readJson(files[0]);
      assert(fresh(summary.ran_at, started), 'summary is fresh');
      assertEq(readJson(files[1]).outside, [], 'boundary outside list empty');
      assertEq(readJson(files[2]).locked, [], 'locked list empty');
      const times = files.map((f) => fs.statSync(f).mtimeMs);
      for (let i = 1; i < times.length; i += 1) {
        assert(times[i] >= times[i - 1], `${path.basename(files[i])} written no earlier than ${path.basename(files[i - 1])} (check all, boundary, locked, budget order)`);
      }
    },
  },
  {
    id: 'verify-exits-2-when-boundary-is-red-and-still-writes-every-file',
    covers: ['B46'],
    fn: async () => {
      const l = ready();
      clearEvidence(l);
      fs.appendFileSync(path.join(l.root, 'README.md'), '\nchanged outside the allowed paths\n');
      const started = Date.now();
      const r = fcAt(l, ['verify']);
      assertExit(r, 2, 'fc verify with a change outside the boundary');
      const boundary = readJson(path.join(evidenceDir(l), 'boundary.json'));
      assert(boundary.outside.length > 0, 'boundary.json lists the outside path');
      for (const name of ['summary.json', 'locked.json', 'budget.json']) {
        const f = path.join(evidenceDir(l), name);
        assert(exists(f) && fs.statSync(f).mtimeMs >= started - 5000, `${name} written by this fc verify run`);
      }
    },
  },
  {
    id: 'verify-exits-2-when-a-check-fails',
    covers: ['B46'],
    fn: async () => {
      const l = ready();
      editMap(pinnedMapPath(l), (map) => { check(map, 'T4').command = 'echo failing on purpose; exit 1'; });
      clearEvidence(l);
      const r = fcAt(l, ['verify']);
      assertExit(r, 2, 'fc verify with a failing check');
      assertEq(readJson(evidencePath(l, 'T4')).verdict, 'fail', 'T4 verdict recorded');
      for (const name of ['boundary.json', 'locked.json', 'budget.json']) {
        assert(exists(path.join(evidenceDir(l), name)), `${name} still written after the red check`);
      }
    },
  },
]);
