// testbench/suites/validate-tests-map/run.mjs — T15: validate-tests-map names each of tm-invariant-1 to tm-invariant-13 and the coverage rule when a mutated copy of the sample launch's pinned map violates it, and exits 0 on the sample map (spec B23; design sections 5.1 and 5.12).
// Usage: node flightdeck/testbench/suites/validate-tests-map/run.mjs   (no arguments; prints pass/FAIL per case and '<n>/<m> passed'; exits 0 or 2)

import path from 'node:path';
import { suite, mkActiveLaunch, fc, sh, FD, readJson, writeJson, exists, assert, assertExit } from '../../lib/suite-lib.mjs';

const VALIDATOR = path.join(FD, 'flightcrew', 'checks', 'validators', 'validate-tests-map.mjs');
const SPEC_DIR = ['specs', 'export-html'];
const MAP_FILE = 'tests-map.v1.json';
const SPEC_FILE = 'spec.v1.json';

/** Splits validator output (design 5.12) into error lines {message, rule} and warning messages. */
function parse(result) {
  const out = `${result.stdout}${result.stderr}`;
  const errors = [...out.matchAll(/^error: (.*) — \[([^\]]+)\]\s*$/gm)].map((m) => ({ message: m[1], rule: m[2] }));
  const warns = [...out.matchAll(/^warn: {2}(.*)$/gm)].map((m) => m[1]);
  return { out, errors, warns };
}

function tail(text, lines = 6) {
  return String(text).split('\n').filter((l) => l.trim()).slice(-lines).join(' / ') || '(no output)';
}

/** A fresh active sample launch whose pinned map has been mutated in place; mutate may return another file name inside the spec folder to write instead (a v2 or v3 map). */
function launchWithMap(mutate) {
  const L = mkActiveLaunch();
  const specDir = path.join(L.launchDir, ...SPEC_DIR);
  const map = readJson(path.join(specDir, MAP_FILE));
  const as = mutate(map, L, specDir) ?? MAP_FILE;
  const mapPath = path.join(specDir, as);
  writeJson(mapPath, map);
  return { ...L, mapPath, specDir };
}

function validate(L, args = []) {
  return fc(['validate', 'tests-map', L.mapPath, ...args], {
    cwd: L.root,
    env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch },
  });
}

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** The validator script itself, run as a program on the map, in the launch's context (design section 2 names it as the thing under test). */
function validateScript(L, args = []) {
  return sh([process.execPath, VALIDATOR, L.mapPath, ...args].map(q).join(' '), {
    cwd: L.root,
    env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch },
  });
}

/** token is a literal substring or a RegExp; a rule whose message may name either of two ids is asserted with a RegExp. */
function expectRule(result, rule, token) {
  assertExit(result, 2, `validate-tests-map should exit 2 for a map violating ${rule}`);
  const { out, errors } = parse(result);
  const hits = errors.filter((e) => e.rule === rule);
  assert(hits.length > 0, `no 'error: … — [${rule}]' line; output: ${tail(out)}`);
  if (token) {
    const re = token instanceof RegExp ? token : new RegExp(String(token).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    assert(hits.some((e) => re.test(e.message)), `no [${rule}] line matches ${re}; output: ${tail(out)}`);
  }
}

/** Exit 0 and no error lines. Warnings are not asserted: design 5.12 makes them non-fatal, and only --strict promotes them. */
function expectClean(result, label) {
  assertExit(result, 0, `validate-tests-map should exit 0 on ${label}`);
  const { out, errors } = parse(result);
  assert(errors.length === 0, `unexpected error lines on ${label}: ${tail(out)}`);
}

/** Turns the frozen v1 map into a frozen v2 revision with a complete lineage; returns the v2 file name. */
function asVersion2(map) {
  map.previous_versions = [
    { v: 1, file: 'tests-map.v1.json', date: '2026-08-29', commit: map.commit, reason: map.reason, spec: { ...map.spec } },
  ];
  map.version = 2;
  map.commit = 'c3d4e5f';
  map.reason = 'revision: the same five checks re-baselined; a fixture revision for the map validator';
  return 'tests-map.v2.json';
}

await suite('validate-tests-map', [
  {
    id: 'positive-sample-map',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap(() => undefined);
      expectClean(validate(L), 'the sample launch\'s pinned map');
    },
  },
  {
    id: 'tm-invariant-1-id-without-prefix',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.checks[4].id = 'X5'; });
      expectRule(validate(L), 'tm-invariant-1', 'X5');
    },
  },
  {
    id: 'tm-invariant-2-duplicate-id',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.checks[4].id = 'T4'; });
      expectRule(validate(L), 'tm-invariant-2', 'T4');
    },
  },
  {
    id: 'tm-invariant-3-id-hole',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.checks[4].id = 'T7'; });
      expectRule(validate(L), 'tm-invariant-3');
    },
  },
  {
    id: 'tm-invariant-4-v1-check-not-ok',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        m.checks[1].status = 'changed';
        m.checks[1].note = 'there is no previous version for this check to have changed against';
      });
      expectRule(validate(L), 'tm-invariant-4');
    },
  },
  {
    id: 'tm-invariant-4-v1-carries-retired',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        m.retired = [{ id: 'T6', at: 1, covers: ['B1'], note: 'a v1 map has nothing to retire' }];
      });
      expectRule(validate(L), 'tm-invariant-4');
    },
  },
  {
    id: 'tm-invariant-5-non-ok-without-note',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        m.checks[1].status = 'changed';
        delete m.checks[1].note;
        return as;
      });
      expectRule(validate(L), 'tm-invariant-5', 'T2');
    },
  },
  {
    id: 'tm-invariant-6-frozen-without-commit',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { delete m.commit; });
      expectRule(validate(L), 'tm-invariant-6');
    },
  },
  {
    id: 'tm-invariant-6-draft-with-commit',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.status = 'draft'; });
      expectRule(validate(L), 'tm-invariant-6');
    },
  },
  {
    id: 'tm-invariant-7-retired-at-above-version',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        m.retired = [{ id: 'T6', at: 3, covers: ['B5'], note: 'retired in a version that does not exist yet' }];
        return as;
      });
      expectRule(validate(L), 'tm-invariant-7', 'T6');
    },
  },
  {
    id: 'tm-invariant-7-retired-at-below-two',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        m.retired = [{ id: 'T6', at: 1, covers: ['B5'], note: 'nothing can be retired in v1' }];
        return as;
      });
      expectRule(validate(L), 'tm-invariant-7', 'T6');
    },
  },
  {
    id: 'tm-invariant-8-retired-covers-not-remapped',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        const t5 = m.checks.pop();
        m.retired = [{ id: t5.id, at: 2, covers: t5.covers, note: 'invariants scan retired without remapping C1 and C2' }];
        return as;
      });
      expectRule(validate(L), 'tm-invariant-8', /T5|C1/);
    },
  },
  {
    id: 'tm-invariant-8-retired-covers-remapped-is-clean',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        const t5 = m.checks.pop();
        m.retired = [{ id: t5.id, at: 2, covers: t5.covers, note: 'invariants scan retired; C1 and C2 moved to unverified' }];
        m.unverified = t5.covers.map((id) => ({ id, reason: 'the invariants scan is re-derived in the next map revision', decided_by: 'human' }));
        return as;
      });
      expectClean(validate(L), 'a v2 map whose retired covers are listed in unverified');
    },
  },
  {
    id: 'tm-invariant-9-lineage-missing-earlier-version',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        const as = asVersion2(m);
        m.previous_versions = [];
        return as;
      });
      expectRule(validate(L), 'tm-invariant-9');
    },
  },
  {
    id: 'tm-invariant-9-lineage-not-newest-first',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        asVersion2(m);
        m.previous_versions.push({ v: 2, file: 'tests-map.v2.json', date: '2026-08-30', commit: 'c3d4e5f', reason: 'second revision', spec: { ...m.spec } });
        m.version = 3;
        m.commit = 'd4e5f60';
        return 'tests-map.v3.json';
      });
      expectRule(validate(L), 'tm-invariant-9');
    },
  },
  {
    id: 'tm-invariant-10-acceptance-not-T1',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.acceptance = 'T2'; });
      expectRule(validate(L), 'tm-invariant-10');
    },
  },
  {
    id: 'tm-invariant-11-observed-word-differs',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.checks[1].baseline.observed = 'fail: TAP version 13'; });
      expectRule(validate(L), 'tm-invariant-11', 'T2');
    },
  },
  {
    id: 'tm-invariant-12-spec-pin-not-frozen',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m, launch, specDir) => {
        const spec = readJson(path.join(specDir, SPEC_FILE));
        spec.status = 'draft';
        delete spec.commit;
        writeJson(path.join(specDir, SPEC_FILE), spec);
      });
      expectRule(validate(L), 'tm-invariant-12');
    },
  },
  {
    id: 'tm-invariant-12-waived-under-allow-draft',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m, launch, specDir) => {
        const spec = readJson(path.join(specDir, SPEC_FILE));
        spec.status = 'draft';
        delete spec.commit;
        writeJson(path.join(specDir, SPEC_FILE), spec);
        const lj = readJson(path.join(launch.launchDir, 'launch.json'));
        lj.allow_draft = true;
        writeJson(path.join(launch.launchDir, 'launch.json'), lj);
      });
      const result = validate(L);
      const { out, errors } = parse(result);
      assert(!errors.some((e) => e.rule === 'tm-invariant-12'), `tm-invariant-12 reported although allow_draft is true: ${tail(out)}`);
      assertExit(result, 0, 'a draft spec pin is waived under allow_draft');
    },
  },
  {
    id: 'tm-invariant-13-empty-allowed-paths',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.allowed_paths = []; });
      expectRule(validate(L), 'tm-invariant-13', 'allowed_paths');
    },
  },
  {
    id: 'tm-invariant-13-empty-locked-paths',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.locked_paths = []; });
      expectRule(validate(L), 'tm-invariant-13', 'locked_paths');
    },
  },
  {
    id: 'validator-script-accepts-the-pinned-map',
    covers: ['B23'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B23 names validate-tests-map as the thing under test`);
      const L = launchWithMap(() => undefined);
      expectClean(validateScript(L), 'the pinned map, running the validator script directly');
    },
  },
  {
    id: 'validator-script-names-tm-invariant-1',
    covers: ['B23'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B23 names validate-tests-map as the thing under test`);
      const L = launchWithMap((m) => { m.checks[4].id = 'X5'; });
      expectRule(validateScript(L), 'tm-invariant-1', 'X5');
    },
  },
  {
    id: 'coverage-rule-live-node-uncovered',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => { m.checks[4].covers = ['C2']; });
      const result = validate(L);
      assertExit(result, 2, 'a frozen map leaving C1 uncovered should exit 2');
      const { out, errors } = parse(result);
      assert(errors.some((e) => e.message.includes('C1')), `no error line naming the uncovered id C1: ${tail(out)}`);
    },
  },
  {
    id: 'coverage-rule-satisfied-by-unverified',
    covers: ['B23'],
    fn: async () => {
      const L = launchWithMap((m) => {
        m.checks[4].covers = ['C2'];
        m.unverified = [{ id: 'C1', reason: 'the import scan needs a tool the fixture does not ship', decided_by: 'human' }];
      });
      expectClean(validate(L), 'a map whose uncovered node is listed in unverified');
    },
  },
]);
