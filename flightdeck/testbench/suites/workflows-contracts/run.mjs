#!/usr/bin/env node
// suites/workflows-contracts — fc-contracts under the runtime stub: the interface-builder on the contracts unit, the stop on a spec contradiction, and the refusal when the plan has no contracts unit. Covers B49, B50, E19.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { crew, dispatchedTypes, runWorkflowStrict, unitOf, workerReturn } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));
const MAP = readJson(path.join(SAMPLE_LAUNCH, 'specs', 'tests-map.v1.json'));

const args = { launch: 'sample-core', run: 1, liftoff: LIFTOFF, entry: {} };
const builderReturn = (status, halt = null) => ({ target: 'U0', fix: null, ...workerReturn('U0', status), halt });

const contracts = (plan, answer) =>
  runWorkflowStrict('fc-contracts', { ...args }, { agents: crew({ plan, map: MAP, returns: { 'interface-builder': answer } }) });

await suite('workflows-contracts', [
  {
    id: 'B49 the interface-builder is dispatched for the contracts unit of wave 0',
    covers: ['B49'],
    fn: async () => {
      const run = await contracts(PLAN, builderReturn('green'));
      assertEq(run.error, null, `fc-contracts ran: ${run.error?.message ?? ''}`);
      const dispatched = run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'interface-builder');
      assertEq(dispatched.length, 1, 'exactly one interface-builder');
      assertEq(unitOf(dispatched[0].spec), 'U0', 'it is dispatched for the contracts unit');
      assertEq(run.result.unit, 'U0', 'the result names the unit');
      assertEq(run.result.green, true, 'the result says green');
      assertEq(run.result.halt, null, 'halt is null');
    },
  },
  {
    id: 'B49 a red return is carried as green false without a halt',
    covers: ['B49'],
    fn: async () => {
      const run = await contracts(PLAN, builderReturn('red'));
      assertEq(run.result.green, false, 'green is false');
      assertEq(run.result.halt, null, 'a red unit is not a halt');
    },
  },
  {
    id: 'B49 B50 a spec-contradiction halt stops the workflow and is carried as its halt',
    covers: ['B49', 'B50'],
    fn: async () => {
      const halt = { kind: 'spec-contradiction', detail: 'I2 and I13 name different plan fields' };
      const run = await contracts(PLAN, builderReturn('halt', halt));
      const after = dispatchedTypes(run).slice(dispatchedTypes(run).indexOf('interface-builder') + 1);
      assertEq(after, [], 'nothing is dispatched after the halt');
      assertEq(run.result.halt, halt, 'the return\'s halt is the workflow\'s halt');
      assertEq(run.result.green, false, 'green is false on a halt');
    },
  },
  {
    id: 'E19 a plan with no contracts unit is refused, and nothing is dispatched',
    covers: ['E19'],
    fn: async () => {
      const plan = { ...PLAN, units: PLAN.units.filter((unit) => unit.kind !== 'contracts'), waves: PLAN.waves.filter((wave) => wave.id !== 'W0') };
      const run = await contracts(plan, builderReturn('green'));
      assertEq(typeof run.result?.refused, 'string', `the result is a refusal, got ${JSON.stringify(run.result)}`);
      assertEq(run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'interface-builder').length, 0, 'no interface-builder is dispatched');
    },
  },
]);
