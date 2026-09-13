#!/usr/bin/env node
// suites/workflows-verify — fc-verify under the runtime stub: a judge per sheet check with its rubric and subject, the verifier after them, and the one condition under which it returns green. Covers B51, B52, B53.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { crew, dispatchedTypes, runWorkflowStrict } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));
const MAP = readJson(path.join(SAMPLE_LAUNCH, 'specs', 'tests-map.v1.json'));

const args = { launch: 'sample-core', run: 1, liftoff: LIFTOFF, entry: {} };

const sheet = (id) => ({
  target: id, fix: null,
  rubric: `flightdeck/launch/sample-core/runs/run-1/checks/rubrics/${id}.md`,
  subject: 'src/export/index.mjs',
  answers: [{ question: 'does it hold?', answer: 'yes', quote: 'const head = `# ${project.title}`;' }],
  verdict: 'pass',
});

const verifier = (refuted, checks) => ({
  refuted, checks_rerun: checks, reasons: refuted ? ['the acceptance proof does not exercise the edge'] : [],
  unverified: [], test_file_changes: [], outside_boundary: [],
});

const verify = (map, verifierReturn) =>
  runWorkflowStrict('fc-verify', args, { agents: crew({ plan: PLAN, map, returns: { judge: (unit, n, spec) => sheet(spec.target ?? 'T5'), verifier: verifierReturn } }) });

const GREEN = verifier(false, [{ id: 'T1', verdict: 'pass' }, { id: 'T5', verdict: 'pass' }]);

await suite('workflows-verify', [
  {
    id: 'B51 one judge per sheet check of the pinned map, with that check-s rubric and subject',
    covers: ['B51'],
    fn: async () => {
      const run = await verify(MAP, GREEN);
      assertEq(run.error, null, `fc-verify ran: ${run.error?.message ?? ''}`);
      const sheetChecks = MAP.checks.filter((check) => check.verdict === 'sheet');
      const judges = run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'judge');
      assertEq(judges.length, sheetChecks.length, `one judge per sheet check, expected ${sheetChecks.length}`);
      for (const check of sheetChecks) {
        const dispatch = judges.find((call) => JSON.stringify(call.spec).includes(check.id));
        assert(dispatch !== undefined, `a judge was dispatched for ${check.id}`);
        assert(JSON.stringify(dispatch.spec).includes(check.rubric.replace('{run}', 'flightdeck/launch/sample-core/runs/run-1')) || JSON.stringify(dispatch.spec).includes(`${check.id}.md`), `the judge dispatch for ${check.id} carries its rubric`);
      }
    },
  },
  {
    id: 'B51 a map with no sheet check dispatches no judge',
    covers: ['B51'],
    fn: async () => {
      const map = { ...MAP, checks: MAP.checks.filter((check) => check.verdict !== 'sheet') };
      const run = await verify(map, GREEN);
      assertEq(run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'judge').length, 0, 'no judge');
      assert(dispatchedTypes(run).includes('verifier'), 'the verifier still runs');
    },
  },
  {
    id: 'B52 the verifier is dispatched after every judge has returned',
    covers: ['B52'],
    fn: async () => {
      const run = await verify(MAP, GREEN);
      const order = dispatchedTypes(run);
      const verifierAt = order.indexOf('verifier');
      assert(verifierAt !== -1, 'the verifier was dispatched');
      assert(!order.slice(verifierAt + 1).includes('judge'), 'no judge is dispatched after the verifier');
      assert(order.slice(0, verifierAt).includes('judge'), 'the judges came first');
    },
  },
  {
    id: 'B52 the verifier is pointed at the merged run branch',
    covers: ['B52'],
    fn: async () => {
      const run = await verify(MAP, GREEN);
      const dispatch = run.agents.find((call) => (call.spec.agentType ?? call.spec.type) === 'verifier');
      assert(/run\/sample-core-1/.test(JSON.stringify(dispatch.spec)), 'the verifier dispatch names the run branch');
      assert(dispatch.spec.isolation !== 'worktree', 'the verifier reads the merged branch itself, not a worktree of its own');
    },
  },
  {
    id: 'B53 green only when every verdict passes and the verifier does not refute',
    covers: ['B53'],
    fn: async () => {
      const green = await verify(MAP, GREEN);
      assertEq(green.result.green, true, 'all pass and no refutation');
      assertEq(green.result.refuted, false, 'refuted is false');
      assertEq(green.result.failing, [], 'nothing failing');

      const failing = await verify(MAP, verifier(false, [{ id: 'T1', verdict: 'pass' }, { id: 'T5', verdict: 'fail' }]));
      assertEq(failing.result.green, false, 'a failing verdict is not green');
      assertEq(failing.result.failing, ['T5'], 'the failing id is carried');

      const refuted = await verify(MAP, verifier(true, [{ id: 'T1', verdict: 'pass' }, { id: 'T5', verdict: 'pass' }]));
      assertEq(refuted.result.green, false, 'a refutation is not green even with every verdict passing');
      assertEq(refuted.result.refuted, true, 'refuted is carried');
    },
  },
]);
