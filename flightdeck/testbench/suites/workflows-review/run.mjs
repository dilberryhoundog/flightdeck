#!/usr/bin/env node
// suites/workflows-review — fc-review under the runtime stub: the critic passes, the fix dispatches between them, the merge of a green fix, the verifier rerun, and the open and resolved lists it returns. Covers B54, B55, B56, B57, B58.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { commandOf, crew, dispatchedTypes, runWorkflowStrict, unitOf, workerReturn } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));
const MAP = readJson(path.join(SAMPLE_LAUNCH, 'specs', 'tests-map.v1.json'));

const finding = (id, unit, severity = 'blocking') => ({ id, severity, node: 'B2', unit, text: `${id}: the unit does not hold B2`, evidence: 'src/export/index.mjs:41' });
const criticReturn = (pass, findings) => ({ verdict: findings.some((f) => f.severity === 'blocking') ? 'fail' : 'pass', pass, findings });
const verifierReturn = { refuted: false, checks_rerun: [{ id: 'T1', verdict: 'pass' }], reasons: [], unverified: [], test_file_changes: [], outside_boundary: [] };

const review = (passes, criticReturns, options = {}) =>
  runWorkflowStrict('fc-review', {
    launch: 'sample-core', run: 1,
    liftoff: { ...LIFTOFF, review: { ...LIFTOFF.review, critic_passes: 2 } },
    entry: { passes },
  }, {
    agents: crew({
      plan: PLAN,
      map: MAP,
      returns: {
        critic: criticReturns,
        verifier: verifierReturn,
        implementer: (unit, n, spec) => workerReturn(unitOf(spec) ?? 'U1', options.fixStatus ?? 'green'),
        'strong-worker': (unit, n, spec) => workerReturn(unitOf(spec) ?? 'U1', options.fixStatus ?? 'green'),
      },
    }),
  });

const typesOf = (run) => dispatchedTypes(run);
const agentsOf = (run, type) => run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === type);

await suite('workflows-review', [
  {
    id: 'B54 the critic is dispatched up to the liftoff-s pass count',
    covers: ['B54'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [])]);
      assertEq(run.error, null, `fc-review ran: ${run.error?.message ?? ''}`);
      assertEq(agentsOf(run, 'critic').length, 2, 'two passes, as the liftoff says');
    },
  },
  {
    id: 'B54 the entry args override the liftoff-s pass count',
    covers: ['B54'],
    fn: async () => {
      const run = await review(1, [criticReturn(1, [finding('F1', 'U1')])]);
      assertEq(agentsOf(run, 'critic').length, 1, 'the entry override wins');
    },
  },
  {
    id: 'B54 a clean first pass stops the passes early',
    covers: ['B54'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [])]);
      assertEq(agentsOf(run, 'critic').length, 1, 'no second pass is needed when the first is clean');
    },
  },
  {
    id: 'B56 each blocking finding draws one fix dispatch to the unit-s own worker',
    covers: ['B56'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1'), finding('F2', 'U2')]), criticReturn(2, [])]);
      const fixes = [...agentsOf(run, 'implementer'), ...agentsOf(run, 'strong-worker')];
      assertEq(fixes.length, 2, 'one fix dispatch per blocking finding');
      assertEq(fixes.map((call) => unitOf(call.spec)).sort(), ['U1', 'U2'], 'each goes to its own unit');
      for (const call of fixes) {
        assertEq(call.spec.agentType ?? call.spec.type, 'implementer', "the fix goes to the unit's own worker as the plan names it");
      }
    },
  },
  {
    id: 'B56 a non-blocking finding draws no fix',
    covers: ['B56'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1', 'minor')])]);
      assertEq([...agentsOf(run, 'implementer'), ...agentsOf(run, 'strong-worker')].length, 0, 'a minor finding is not fixed in the run');
    },
  },
  {
    id: 'B56 a fix runs in a fresh worktree on <unit>-fix-<k> cut from the run branch',
    covers: ['B56'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [])]);
      const fix = agentsOf(run, 'implementer')[0];
      assertEq(fix.spec.isolation, 'worktree', 'the fix is isolated');
      const text = JSON.stringify(fix.spec);
      assert(/U1-fix-1/.test(text), `the branch is <unit>-fix-<k>: ${text}`);
      assert(/run\/sample-core-1/.test(text), 'the fix branch is cut from the run branch');
    },
  },
  {
    id: 'B57 a green fix return draws a steward merge for the fix branch',
    covers: ['B57'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [])]);
      const merges = agentsOf(run, 'steward').filter((call) => /merge/.test(commandOf(call.spec))).map((call) => commandOf(call.spec));
      assert(merges.some((command) => /U1-fix-1|U1/.test(command)), `the fix branch is merged: ${merges.join(' | ')}`);
    },
  },
  {
    id: 'B57 a red fix return is not merged',
    covers: ['B57'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [finding('F1', 'U1')])], { fixStatus: 'red' });
      const merges = agentsOf(run, 'steward').filter((call) => /merge/.test(commandOf(call.spec)));
      assertEq(merges.length, 0, 'nothing is merged when the fix came back red');
    },
  },
  {
    id: 'B58 a verifier rerun sits between the fixes of a pass and the next critic pass',
    covers: ['B58'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [])]);
      const order = typesOf(run);
      const firstCritic = order.indexOf('critic');
      const secondCritic = order.indexOf('critic', firstCritic + 1);
      assert(secondCritic !== -1, 'there is a second pass');
      const between = order.slice(firstCritic + 1, secondCritic);
      assert(between.includes('implementer'), 'the fix sits between the passes');
      assert(between.includes('verifier'), 'the verifier rerun sits between the passes');
      assert(between.lastIndexOf('verifier') > between.indexOf('implementer'), 'the verifier reruns after the fixes, not before');
    },
  },
  {
    id: 'B55 the result carries the open and resolved ids of the last pass',
    covers: ['B55'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1'), finding('F2', 'U2')]), criticReturn(2, [finding('F2', 'U2')])]);
      assertEq(run.result.passes, 2, 'the pass count');
      assertEq(run.result.open, ['F2'], 'the finding the last pass still reports is open');
      assertEq(run.result.resolved, ['F1'], 'the finding the last pass no longer reports is resolved');
    },
  },
  {
    id: 'B55 a clean last pass resolves everything the pass before found',
    covers: ['B55'],
    fn: async () => {
      const run = await review(null, [criticReturn(1, [finding('F1', 'U1')]), criticReturn(2, [])]);
      assertEq(run.result.open, [], 'nothing open');
      assertEq(run.result.resolved, ['F1'], 'the earlier finding is resolved');
    },
  },
]);
