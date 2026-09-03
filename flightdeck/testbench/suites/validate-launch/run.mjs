// testbench/suites/validate-launch/run.mjs — T17: validate-launch exits 2 for each launch.json defect spec B25 lists, checks hash shape only unless --resolve-commits is passed, and exits 0 on the sample launch.
// Usage: node flightdeck/testbench/suites/validate-launch/run.mjs   (no arguments; prints pass/FAIL per case and '<n>/<m> passed'; exits 0 or 2)

import path from 'node:path';
import { suite, mkActiveLaunch, fc, sh, FD, readJson, writeJson, exists, assert, assertExit } from '../../lib/suite-lib.mjs';

const VALIDATOR = path.join(FD, 'flightcrew', 'checks', 'validators', 'validate-launch.mjs');
const RULE = /^(launch-rule-\d+|required|additionalProperties|enum|type|minItems|pattern|minimum|maximum|minLength)$/;

/** Splits validator output (design 5.12) into error lines {message, rule}. */
function parse(result) {
  const out = `${result.stdout}${result.stderr}`;
  const errors = [...out.matchAll(/^error: (.*) — \[([^\]]+)\]\s*$/gm)].map((m) => ({ message: m[1], rule: m[2] }));
  return { out, errors };
}

function tail(text, lines = 6) {
  return String(text).split('\n').filter((l) => l.trim()).slice(-lines).join(' / ') || '(no output)';
}

/** A fresh sample launch whose launch.json has been mutated in place; FLIGHTCREW_LAUNCH selects it whatever its status. */
function launchWith(mutate) {
  const L = mkActiveLaunch();
  const file = path.join(L.launchDir, 'launch.json');
  const lj = readJson(file);
  mutate?.(lj, L);
  writeJson(file, lj);
  return { ...L, file };
}

function validate(L, args = []) {
  return fc(['validate', 'launch', L.file, ...args], { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
}

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** The validator script itself, run as a program on the launch file (design section 2 names it as the thing under test). */
function validateScript(L, args = []) {
  return sh([process.execPath, VALIDATOR, L.file, ...args].map(q).join(' '), { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
}

function expectRefused(result, token, what) {
  assertExit(result, 2, `validate-launch should exit 2 for ${what}`);
  const { out, errors } = parse(result);
  assert(errors.length > 0, `no 'error: <message> — [<rule>]' line for ${what}; output: ${tail(out)}`);
  const named = errors.filter((e) => RULE.test(e.rule));
  assert(named.length > 0, `no error line names a launch-rule-N or schema keyword rule for ${what}; got rules ${errors.map((e) => e.rule).join(', ')}`);
  if (token) assert(named.some((e) => token.test(e.message)), `no error message matches ${token} for ${what}; output: ${tail(out)}`);
}

function expectClean(result, what) {
  assertExit(result, 0, `validate-launch should exit 0 on ${what}`);
  const { out, errors } = parse(result);
  assert(errors.length === 0, `unexpected error lines on ${what}: ${tail(out)}`);
}

await suite('validate-launch', [
  {
    id: 'positive-sample-launch',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith();
      expectClean(validate(L), 'the sample launch without --resolve-commits');
    },
  },
  {
    id: 'status-outside-enumeration',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.status = 'bogus'; });
      expectRefused(validate(L), /status/, 'status bogus');
    },
  },
  {
    id: 'phase-outside-enumeration',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.phase = 'bogus'; });
      expectRefused(validate(L), /phase/, 'phase bogus');
    },
  },
  {
    id: 'spec-path-does-not-exist',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.spec.path = 'specs/export-html/spec.v9.json'; });
      expectRefused(validate(L), /spec\.v9\.json/, 'a spec path that does not exist');
    },
  },
  {
    id: 'spec-commit-differs-from-pinned-file',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.spec.commit = 'ffffff0'; });
      expectRefused(validate(L), /ffffff0|a1b2c3d/, 'spec.commit ffffff0 against the pinned file header a1b2c3d');
    },
  },
  {
    id: 'stop-blocks-above-eight',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.ceilings.stop_blocks = 9; });
      expectRefused(validate(L), /stop_blocks/, 'ceilings.stop_blocks 9');
    },
  },
  {
    id: 'boundary-enforced-without-lock-commit',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.lock_commit = null; });
      expectRefused(validate(L), /lock_commit/, 'phase review with enforce_boundary true and no lock_commit');
    },
  },
  {
    id: 'boundary-enforced-with-empty-allowed-paths',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.paths.allowed = []; });
      expectRefused(validate(L), /allowed/, 'phase review with enforce_boundary true and empty allowed paths');
    },
  },
  {
    id: 'targets-phase-permits-unlocked-launch',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => {
        lj.phase = 'targets';
        lj.tests_map = null;
        lj.lock_commit = null;
        lj.paths = { allowed: [], locked: [], enforce_boundary: false };
        lj.gates = { G1: { status: 'pending', at: null }, G2: { status: 'pending', at: null }, G3: { status: 'pending', at: null } };
      });
      expectClean(validate(L), 'a launch in phase targets with no lock_commit and no allowed paths');
    },
  },
  {
    id: 'hash-shape-checked-without-resolve-commits',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith((lj) => { lj.base_commit = 'not-a-hash'; });
      expectRefused(validate(L), /base_commit|not-a-hash/, 'base_commit that is not a hex hash');
    },
  },
  {
    id: 'validator-script-accepts-the-sample-launch',
    covers: ['B25'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B25 names validate-launch as the thing under test`);
      const L = launchWith();
      expectClean(validateScript(L), 'the sample launch, running the validator script directly');
    },
  },
  {
    id: 'validator-script-refuses-a-status-outside-the-enumeration',
    covers: ['B25'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B25 names validate-launch as the thing under test`);
      const L = launchWith((lj) => { lj.status = 'bogus'; });
      expectRefused(validateScript(L), /status/, 'status bogus, run through the validator script');
    },
  },
  {
    id: 'resolve-commits-rejects-unknown-hashes',
    covers: ['B25'],
    fn: async () => {
      const L = launchWith();
      const result = validate(L, ['--resolve-commits']);
      assertExit(result, 2, 'the sample launch\'s commits do not exist in a fresh repository, so --resolve-commits must exit 2');
      const { out, errors } = parse(result);
      assert(errors.length > 0, `no 'error: <message> — [<rule>]' line under --resolve-commits; output: ${tail(out)}`);
    },
  },
]);
