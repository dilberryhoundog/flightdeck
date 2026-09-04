// testbench/suites/validate-plan/run.mjs — T16: validate-plan exits 2 naming a rule for each plan defect spec B24 lists (and the further rules design section 5.4 states), and exits 0 on the sample plan.
// Usage: node flightdeck/testbench/suites/validate-plan/run.mjs   (no arguments; prints pass/FAIL per case and '<n>/<m> passed'; exits 0 or 2)

import path from 'node:path';
import { suite, mkActiveLaunch, fc, sh, FD, readJson, writeJson, exists, assert, assertExit } from '../../lib/suite-lib.mjs';

const VALIDATOR = path.join(FD, 'flightcrew', 'checks', 'validators', 'validate-plan.mjs');
const RULE = /^(plan-rule-\d+|required|additionalProperties|enum|type|minItems|pattern|minimum|maximum|minLength)$/;

/** Splits validator output (design 5.12) into error lines {message, rule}. */
function parse(result) {
  const out = `${result.stdout}${result.stderr}`;
  const errors = [...out.matchAll(/^error: (.*) — \[([^\]]+)\]\s*$/gm)].map((m) => ({ message: m[1], rule: m[2] }));
  return { out, errors };
}

function tail(text, lines = 6) {
  return String(text).split('\n').filter((l) => l.trim()).slice(-lines).join(' / ') || '(no output)';
}

/** A fresh active sample launch whose plan.json (and optionally launch.json) has been mutated in place. */
function launchWithPlan(mutatePlan, mutateLaunch) {
  const L = mkActiveLaunch();
  const planPath = path.join(L.launchDir, 'plan.json');
  const plan = readJson(planPath);
  mutatePlan?.(plan);
  writeJson(planPath, plan);
  if (mutateLaunch) {
    const lp = path.join(L.launchDir, 'launch.json');
    const lj = readJson(lp);
    mutateLaunch(lj);
    writeJson(lp, lj);
  }
  return { ...L, planPath };
}

function validate(L) {
  return fc(['validate', 'plan', L.planPath], { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
}

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** The validator script itself, run as a program on the plan, in the launch's context (design section 2 names it as the thing under test). */
function validateScript(L) {
  return sh([process.execPath, VALIDATOR, L.planPath].map(q).join(' '), { cwd: L.root, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } });
}

/** The plan must be refused (exit 2) with at least one 'error: … — [<rule>]' line whose message matches token. */
function expectRefused(result, token, what) {
  assertExit(result, 2, `validate-plan should exit 2 for ${what}`);
  const { out, errors } = parse(result);
  assert(errors.length > 0, `no 'error: <message> — [<rule>]' line for ${what}; output: ${tail(out)}`);
  const named = errors.filter((e) => RULE.test(e.rule));
  assert(named.length > 0, `no error line names a plan-rule-N or schema keyword rule for ${what}; got rules ${errors.map((e) => e.rule).join(', ')}`);
  assert(named.some((e) => token.test(e.message)), `no error message matches ${token} for ${what}; output: ${tail(out)}`);
}

await suite('validate-plan', [
  {
    id: 'positive-sample-plan',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan();
      const result = validate(L);
      assertExit(result, 0, 'validate-plan should exit 0 on the sample plan');
      const { out, errors } = parse(result);
      assert(errors.length === 0, `unexpected error lines on the sample plan: ${tail(out)}`);
    },
  },
  {
    id: 'check-id-absent-from-map',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[3].checks = ['T99']; });
      expectRefused(validate(L), /T99/, 'a unit naming check T99, absent from the pinned map');
    },
  },
  {
    id: 'spec-ref-absent-from-spec',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[3].spec_refs = ['B99']; });
      expectRefused(validate(L), /B99/, 'a unit naming spec ref B99, absent from the pinned spec');
    },
  },
  {
    id: 'abandon-triggers-empty',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.abandon_triggers = []; });
      expectRefused(validate(L), /abandon_triggers|abandon triggers/, 'an empty abandon_triggers list');
    },
  },
  {
    id: 'parallel-wave-exceeds-implementers-concurrent',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan(undefined, (lj) => { lj.ceilings.implementers_concurrent = 1; });
      expectRefused(validate(L), /W1|implementers_concurrent/, 'parallel wave W1 holding two units above implementers_concurrent 1');
    },
  },
  {
    id: 'budget-turns-exceeds-turns-per-agent',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[1].budget_turns = 26; });
      expectRefused(validate(L), /U1|budget_turns/, 'unit U1 with budget_turns 26 above turns_per_agent 25');
    },
  },
  {
    id: 'budget-turns-exceeds-implementer-maxturns',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[1].budget_turns = 300; }, (lj) => { lj.ceilings.turns_per_agent = 400; });
      expectRefused(validate(L), /U1|budget_turns|turns_per_agent|maxTurns/, 'unit U1 with budget_turns 300 above the implementer maxTurns');
    },
  },
  {
    id: 'expected-agents-exceeds-ceiling',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.expected_cost.agents = 13; });
      expectRefused(validate(L), /expected_cost|agents/, 'expected_cost.agents 13 above ceilings.agents 12');
    },
  },
  {
    id: 'unit-without-checks',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[3].checks = []; });
      expectRefused(validate(L), /U3|checks/, 'unit U3 with no checks');
    },
  },
  {
    id: 'shape-differs-from-kickoff-part',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.shape = 'workflow'; });
      expectRefused(validate(L), /shape/, 'shape workflow against kickoff part shape-session');
    },
  },
  {
    id: 'depends-on-names-later-wave',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[0].depends_on = ['U3']; });
      expectRefused(validate(L), /U0|U3|depends_on/, 'unit U0 depending on U3 from a later wave');
    },
  },
  {
    id: 'no-contracts-unit-in-w0',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { p.units[0].kind = 'feature'; });
      expectRefused(validate(L), /contracts|W0|U0/, 'a serial W0 without a contracts unit and no no_contracts reason');
    },
  },
  {
    id: 'validator-script-accepts-the-sample-plan',
    covers: ['B24'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B24 names validate-plan as the thing under test`);
      const L = launchWithPlan();
      const result = validateScript(L);
      assertExit(result, 0, 'the validator script should exit 0 on the sample plan');
      const { out, errors } = parse(result);
      assert(errors.length === 0, `unexpected error lines on the sample plan: ${tail(out)}`);
    },
  },
  {
    id: 'validator-script-refuses-a-check-absent-from-the-map',
    covers: ['B24'],
    fn: async () => {
      assert(exists(VALIDATOR), `${VALIDATOR} does not exist; B24 names validate-plan as the thing under test`);
      const L = launchWithPlan((p) => { p.units[3].checks = ['T99']; });
      expectRefused(validateScript(L), /T99/, 'a unit naming check T99, run through the validator script');
    },
  },
  {
    id: 'first-parallel-wave-without-pilot',
    covers: ['B24'],
    fn: async () => {
      const L = launchWithPlan((p) => { delete p.units[1].pilot; });
      expectRefused(validate(L), /pilot|W1/, 'the first parallel wave holding no pilot unit');
    },
  },
]);
