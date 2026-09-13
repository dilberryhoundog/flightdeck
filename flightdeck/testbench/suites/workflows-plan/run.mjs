#!/usr/bin/env node
// suites/workflows-plan — fc-plan-<kind> under the runtime stub: one explorer per question, the planner after them with its kind's template, the plan it returns, and the freeze it asks the steward for. Covers B27, B28, B29, B30.
import path from 'node:path';
import { SAMPLE_LAUNCH, TASK_KINDS, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { commandOf, crew, dispatchedTypes, runWorkflow, runWorkflowStrict } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));

const explorerReturn = (n) => ({
  id: `X${n}`, question: `question ${n}`, stage: 'plan', answer: `answer ${n}`, confidence: 'high',
  pointers: [{ path: 'src/export/index.mjs', why: 'the exporter' }], candidates: [],
});

const PLANNER = { target: 'plan', fix: null, plan: { ...PLAN, status: 'draft' } };

const argsFor = (questions, kind = 'feature') => ({
  launch: 'sample-core',
  run: 1,
  liftoff: { ...LIFTOFF, task: kind },
  entry: { questions },
});

const world = (questions) =>
  crew({
    plan: PLAN,
    returns: {
      explorer: questions.map((_, i) => explorerReturn(i + 1)),
      planner: PLANNER,
    },
  });

const plan = (questions, kind = 'feature') =>
  runWorkflowStrict(`fc-plan-${kind}`, argsFor(questions, kind), { agents: world(questions) });

await suite('workflows-plan', [
  {
    id: 'B27 one explorer is dispatched per question in the entry args',
    covers: ['B27'],
    fn: async () => {
      for (const questions of [[], ['one'], ['one', 'two'], ['one', 'two', 'three']]) {
        const run = await plan(questions);
        assertEq(run.error, null, `fc-plan-feature ran: ${run.error?.message ?? ''}`);
        const explorers = dispatchedTypes(run).filter((type) => type === 'explorer');
        assertEq(explorers.length, questions.length, `${questions.length} questions dispatch ${questions.length} explorers`);
      }
    },
  },
  {
    id: 'B27 each explorer dispatch carries its own question',
    covers: ['B27'],
    fn: async () => {
      const questions = ['How is a project shaped?', 'Where do warnings come from?'];
      const run = await plan(questions);
      const dispatched = run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'explorer');
      for (const question of questions) {
        assert(dispatched.some((call) => JSON.stringify(call.spec).includes(question)), `a dispatch carries the question: ${question}`);
      }
    },
  },
  {
    id: 'B28 the planner is dispatched after every explorer has returned',
    covers: ['B28'],
    fn: async () => {
      const run = await plan(['one', 'two']);
      const order = dispatchedTypes(run);
      const planner = order.indexOf('planner');
      assert(planner !== -1, 'the planner was dispatched');
      assertEq(order.slice(0, planner).filter((t) => t === 'explorer').length, 2, 'both explorers were dispatched before the planner');
      assert(!order.slice(planner + 1).includes('explorer'), 'no explorer is dispatched after the planner');
    },
  },
  {
    id: 'B28 the planner dispatch carries the explorer returns',
    covers: ['B28'],
    fn: async () => {
      const run = await plan(['one', 'two']);
      const dispatch = run.agents.find((call) => (call.spec.agentType ?? call.spec.type) === 'planner');
      const text = JSON.stringify(dispatch.spec);
      for (const n of [1, 2]) assert(text.includes(`answer ${n}`), `the planner dispatch carries explorer ${n}'s answer`);
    },
  },
  {
    id: 'B28 the planner is dispatched for the kind the workflow is',
    covers: ['B28'],
    fn: async () => {
      for (const kind of TASK_KINDS) {
        const run = await plan(['one'], kind);
        assertEq(run.error, null, `fc-plan-${kind} ran: ${run.error?.message ?? ''}`);
        const dispatch = run.agents.find((call) => (call.spec.agentType ?? call.spec.type) === 'planner');
        assert(dispatch !== undefined, `fc-plan-${kind} dispatched the planner`);
        assert(JSON.stringify(dispatch.spec).includes(kind), `the ${kind} planner dispatch names its kind`);
      }
    },
  },
  {
    id: 'B29 the result names the plan and counts the explorers, with halt null',
    covers: ['B29'],
    fn: async () => {
      const run = await plan(['one', 'two']);
      assertEq(typeof run.result?.plan, 'string', 'plan is a path');
      assert(/plan\.json$/.test(run.result.plan), `the result names plan.json, got ${run.result.plan}`);
      assert(run.result.plan.includes('run-1'), 'the plan is the run\'s own');
      assertEq(run.result.explorers, 2, 'the explorer count');
      assertEq(run.result.halt, null, 'halt is null on a clean plan');
    },
  },
  {
    id: 'B29 a planner halt is carried and the workflow stops there',
    covers: ['B29'],
    fn: async () => {
      const halt = { kind: 'unsatisfiable', detail: 'the spec names no unit boundary' };
      const run = await runWorkflowStrict('fc-plan-feature', argsFor(['one']), {
        agents: crew({ plan: PLAN, returns: { explorer: [explorerReturn(1)], planner: { target: 'plan', fix: null, halt } } }),
      });
      assertEq(run.result?.halt?.kind, 'unsatisfiable', 'the halt is carried into the result');
      const after = dispatchedTypes(run);
      assertEq(after.filter((t) => t === 'steward').length, 0, 'no freeze is asked for after a halt');
    },
  },
  {
    id: 'B30 the steward is dispatched with flight freeze on the plan, after the planner',
    covers: ['B30'],
    fn: async () => {
      const run = await plan(['one']);
      const order = dispatchedTypes(run);
      const planner = order.indexOf('planner');
      const stewards = run.agents.map((call, at) => ({ call, at })).filter(({ call }) => (call.spec.agentType ?? call.spec.type) === 'steward');
      assert(stewards.length > 0, 'a steward was dispatched');
      const freeze = stewards.find(({ call }) => /freeze/.test(commandOf(call.spec)));
      assert(freeze !== undefined, `a steward dispatch carries flight freeze: ${stewards.map(({ call }) => commandOf(call.spec)).join(' | ')}`);
      assert(freeze.at > planner, 'the freeze comes after the planner');
      assert(/plan\.json/.test(commandOf(freeze.call.spec)), 'the freeze names plan.json');
    },
  },
]);
