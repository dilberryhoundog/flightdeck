#!/usr/bin/env node
// suites/workflows-build — fc-build under the runtime stub: the rendered dispatches, the worktree isolation, the scouts, the strong worker and what its dispatch carries, the stop, the adversary and fix rounds, and the two nested workflows. Covers B31 to B48, B89, B90.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { adversaryReturn, commandOf, crew, dispatchedTypes, nestedNames, runWorkflowStrict, unitOf, workerReturn } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const BASE = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));

/** A plan of two waves: a scout and a second unit in parallel, then a proof. No contracts unit, so every unit here is fc-build's. */
const PLAN = {
  ...BASE,
  waves: [
    { id: 'W1', mode: 'parallel', units: ['U1', 'U2'] },
    { id: 'W2', mode: 'serial', units: ['U3'] },
  ],
  units: [
    { id: 'U1', name: 'exporter-core', kind: 'feature', spec_refs: ['B1'], checks: ['T1'], owner: 'implementer', paths: ['src/export/**'], depends_on: [], scout: true },
    { id: 'U2', name: 'edges', kind: 'feature', spec_refs: ['E1'], checks: ['T2'], owner: 'implementer', paths: ['src/export/**'], depends_on: [] },
    { id: 'U3', name: 'proof', kind: 'proof', spec_refs: ['B1'], checks: ['T1'], owner: 'implementer', paths: ['src/export/**'], depends_on: ['U1', 'U2'] },
  ],
};

const VERIFY = { green: true, refuted: false, failing: [] };
const REVIEW = { passes: 2, open: [], resolved: ['F1'] };

const entry = (extra = {}) => ({ standalone: false, waves: null, session: null, ...extra });
const argsFor = (extra = {}, liftoff = LIFTOFF) => ({ launch: 'sample-core', run: 1, liftoff, entry: entry(extra) });

const build = (options = {}) => {
  const { units = {}, adversary, liftoff = LIFTOFF, entryArgs = {}, workflows = { 'fc-verify': VERIFY, 'fc-review': REVIEW }, transcript } = options;
  const answers = new Map();
  const responder = crew({
    plan: PLAN,
    adversary,
    returns: {
      implementer: (unit, n, spec) => next(unit ?? unitOf(spec), 'implementer'),
      'strong-worker': (unit, n, spec) => next(unit ?? unitOf(spec), 'strong-worker'),
    },
  });
  function next(unit, role) {
    const queue = answers.get(`${role}:${unit}`) ?? [...(units[`${role}:${unit}`] ?? units[unit] ?? [workerReturn(unit, 'green')])];
    const answer = queue.length > 1 ? queue.shift() : queue[0];
    answers.set(`${role}:${unit}`, queue);
    return answer;
  }
  return runWorkflowStrict('fc-build', { ...argsFor(entryArgs, liftoff), transcript }, { agents: responder, workflows });
};

const agentsOf = (run, type) => run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === type);
const indexOfCall = (run, predicate) => run.agents.findIndex(predicate);

await suite('workflows-build', [
  {
    id: 'B31 every implementer dispatch is preceded by a steward dispatch of flight render for that unit',
    covers: ['B31'],
    fn: async () => {
      const run = await build();
      assertEq(run.error, null, `fc-build ran: ${run.error?.message ?? ''}`);
      for (const [at, call] of run.agents.entries()) {
        if ((call.spec.agentType ?? call.spec.type) !== 'implementer') continue;
        const unit = unitOf(call.spec);
        const rendered = run.agents.slice(0, at).some(
          (earlier) => (earlier.spec.agentType ?? earlier.spec.type) === 'steward'
            && /render/.test(commandOf(earlier.spec))
            && commandOf(earlier.spec).includes(unit),
        );
        assert(rendered, `the dispatch for ${unit} was rendered by a steward running flight render`);
      }
    },
  },
  {
    id: 'B32 every implementer and strong-worker dispatch carries isolation worktree',
    covers: ['B32'],
    fn: async () => {
      const run = await build({ units: { 'implementer:U2': [workerReturn('U2', 'red'), workerReturn('U2', 'red')], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      const isolated = [...agentsOf(run, 'implementer'), ...agentsOf(run, 'strong-worker')];
      assert(isolated.length > 0, 'workers were dispatched');
      for (const call of isolated) {
        assertEq(call.spec.isolation, 'worktree', `${call.spec.agentType ?? call.spec.type} for ${unitOf(call.spec)} is isolated in a worktree`);
      }
      for (const call of agentsOf(run, 'steward')) {
        assert(call.spec.isolation !== 'worktree', 'the steward is not isolated');
      }
    },
  },
  {
    id: 'B33 the scout of a wave is run to green before the rest of its wave',
    covers: ['B33'],
    fn: async () => {
      const run = await build();
      const order = agentsOf(run, 'implementer').map((call) => unitOf(call.spec));
      assertEq(order[0], 'U1', 'the scout unit of W1 goes first');
      assert(order.indexOf('U1') < order.indexOf('U2'), 'the rest of the wave follows the scout');
      assert(order.indexOf('U2') < order.indexOf('U3'), 'the next wave follows this one');
    },
  },
  {
    id: 'B33 a red scout holds the rest of its wave back',
    covers: ['B33'],
    fn: async () => {
      const run = await build({
        units: { 'implementer:U1': [workerReturn('U1', 'red'), workerReturn('U1', 'red')], 'strong-worker:U1': [workerReturn('U1', 'red')] },
      });
      const dispatched = [...agentsOf(run, 'implementer'), ...agentsOf(run, 'strong-worker')].map((call) => unitOf(call.spec));
      assert(!dispatched.includes('U2'), 'the rest of the wave is never dispatched while the scout is red');
      assert(!dispatched.includes('U3'), 'the later wave is never dispatched');
    },
  },
  {
    id: 'B34 a red return draws one strong-worker for that unit, and one only',
    covers: ['B34'],
    fn: async () => {
      const run = await build({ units: { 'implementer:U2': [workerReturn('U2', 'red')], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      const strong = agentsOf(run, 'strong-worker').map((call) => unitOf(call.spec));
      assertEq(strong, ['U2'], 'exactly one strong-worker, for the red unit');
    },
  },
  {
    id: 'B34 a stalled return draws a strong-worker too',
    covers: ['B34'],
    fn: async () => {
      const run = await build({ units: { 'implementer:U2': [workerReturn('U2', 'stalled')], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      assertEq(agentsOf(run, 'strong-worker').map((call) => unitOf(call.spec)), ['U2'], 'a stall draws the strong worker');
    },
  },
  {
    id: 'B35 the strong-worker dispatch carries the liftoff-s strong model',
    covers: ['B35'],
    fn: async () => {
      const liftoff = { ...LIFTOFF, models: { ...LIFTOFF.models, strong: 'opus-strong-fixture' } };
      const run = await build({ liftoff, units: { 'implementer:U2': [workerReturn('U2', 'red')], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      const strong = agentsOf(run, 'strong-worker')[0];
      assertEq(strong.spec.model, 'opus-strong-fixture', 'the model comes from liftoff.models.strong');
    },
  },
  {
    id: 'B36 the strong-worker starts from the run branch, not the failed worker-s branch or worktree',
    covers: ['B36'],
    fn: async () => {
      const failed = workerReturn('U2', 'red', { branch: 'sample-core/edges-attempt-1', worktree: '.worktrees/U2-attempt-1' });
      const run = await build({ units: { 'implementer:U2': [failed], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      const spec = JSON.stringify(agentsOf(run, 'strong-worker')[0].spec);
      assertEq(spec.includes('sample-core/edges-attempt-1'), false, "the failed worker's branch is not handed on");
      assertEq(spec.includes('.worktrees/U2-attempt-1'), false, "the failed worker's worktree is not handed on");
      assertEq(agentsOf(run, 'strong-worker')[0].spec.isolation, 'worktree', 'the strong worker gets a worktree of its own');
    },
  },
  {
    id: 'B37 the strong-worker dispatch carries the failed unit-s check output and return',
    covers: ['B37'],
    fn: async () => {
      const failed = workerReturn('U2', 'red', { checks: [{ id: 'T2', verdict: 'fail', output: 'FAIL  e1-case: warning shape absent' }], notes: 'what was tried' });
      const run = await build({ units: { 'implementer:U2': [failed], 'strong-worker:U2': [workerReturn('U2', 'green')] } });
      const spec = JSON.stringify(agentsOf(run, 'strong-worker')[0].spec);
      assert(spec.includes('T2'), 'the failing check id is in the dispatch');
      assert(spec.includes('warning shape absent'), 'the check output is in the dispatch');
    },
  },
  {
    id: 'B38 the strong-worker dispatch carries no transcript and no approach of the failed worker',
    covers: ['B38'],
    fn: async () => {
      const failed = workerReturn('U2', 'red', { checks: [{ id: 'T2', verdict: 'fail', output: 'FAIL  e1-case' }] });
      const run = await build({
        transcript: 'I first tried rewriting the renderer, then I tried a lookup table, and neither worked.',
        units: { 'implementer:U2': [failed], 'strong-worker:U2': [workerReturn('U2', 'green')] },
      });
      const spec = JSON.stringify(agentsOf(run, 'strong-worker')[0].spec);
      assertEq(spec.includes('I first tried rewriting the renderer'), false, "no text of the failed worker's transcript");
      assertEq(/"(transcript|approach)"\s*:/.test(spec), false, 'no transcript or approach field is passed');
    },
  },
  {
    id: 'B39 a second red or stalled return for one unit draws nothing further',
    covers: ['B39'],
    fn: async () => {
      const run = await build({
        units: { 'implementer:U2': [workerReturn('U2', 'red')], 'strong-worker:U2': [workerReturn('U2', 'red')] },
      });
      assertEq(agentsOf(run, 'strong-worker').filter((call) => unitOf(call.spec) === 'U2').length, 1, 'the strong worker is not sent twice');
      assertEq(agentsOf(run, 'implementer').filter((call) => unitOf(call.spec) === 'U2').length, 1, 'the implementer is not sent again either');
    },
  },
  {
    id: 'B40 B41 B42 stopping on a unit merges what is already green, dispatches nothing further, and says so',
    covers: ['B40', 'B41', 'B42'],
    fn: async () => {
      const run = await build({
        units: { 'implementer:U2': [workerReturn('U2', 'red', { checks: [{ id: 'T2', verdict: 'fail' }] })], 'strong-worker:U2': [workerReturn('U2', 'red', { checks: [{ id: 'T2', verdict: 'fail' }] })] },
      });
      const merges = agentsOf(run, 'steward').filter((call) => /merge/.test(commandOf(call.spec))).map((call) => commandOf(call.spec));
      assert(merges.some((command) => command.includes('U1')), 'the green unit already returned is merged');
      assert(!merges.some((command) => command.includes('U2')), 'the failing unit is not merged');
      const lastMerge = run.agents.map((call) => call.spec).findLastIndex((spec) => /merge/.test(commandOf(spec)));
      const afterMerges = run.agents.slice(lastMerge + 1).map((call) => call.spec.agentType ?? call.spec.type);
      assertEq(afterMerges.filter((type) => ['implementer', 'strong-worker', 'adversary'].includes(type)), [], 'nothing further is dispatched after the stop');
      assertEq(run.result.stopped?.unit, 'U2', 'stopped names the unit');
      assertEq(run.result.stopped?.check, 'T2', 'stopped names the failing check');
      assertEq(run.result.verify, null, 'verify is null when the build stopped');
      assertEq(run.result.review, null, 'review is null when the build stopped');
      assertEq(nestedNames(run), [], 'no workflow is nested after a stop');
    },
  },
  {
    id: 'B43 with adversary_per_unit true, every green unit draws an adversary before its merge',
    covers: ['B43'],
    fn: async () => {
      const run = await build({ adversary: (unit) => adversaryReturn(unit, false) });
      for (const unit of ['U1', 'U2', 'U3']) {
        const attacked = indexOfCall(run, (call) => (call.spec.agentType ?? call.spec.type) === 'adversary' && unitOf(call.spec) === unit);
        const merged = indexOfCall(run, (call) => (call.spec.agentType ?? call.spec.type) === 'steward' && /merge/.test(commandOf(call.spec)) && commandOf(call.spec).includes(unit));
        assert(attacked !== -1, `${unit} was attacked`);
        assert(merged !== -1, `${unit} was merged`);
        assert(attacked < merged, `${unit} was attacked before it was merged`);
      }
    },
  },
  {
    id: 'B43 with adversary_per_unit false, no adversary is dispatched',
    covers: ['B43'],
    fn: async () => {
      const liftoff = { ...LIFTOFF, review: { ...LIFTOFF.review, adversary_per_unit: false } };
      const run = await build({ liftoff, adversary: (unit) => adversaryReturn(unit, false) });
      assertEq(agentsOf(run, 'adversary').length, 0, 'the adversary is off');
    },
  },
  {
    id: 'B44 B45 B46 a blocking finding draws one fix, then one more adversary pass, and the unit stays unmerged while it blocks',
    covers: ['B44', 'B45', 'B46'],
    fn: async () => {
      const run = await build({ adversary: (unit) => adversaryReturn(unit, unit === 'U2') });
      const fixes = run.agents.filter((call) => unitOf(call.spec) === 'U2' && ['implementer', 'strong-worker'].includes(call.spec.agentType ?? call.spec.type));
      assertEq(fixes.length, 2, 'the same worker is sent once more for the unit the adversary blocked');
      assertEq(fixes[1].spec.agentType ?? fixes[1].spec.type, 'implementer', 'the fix goes to the unit\'s own worker');
      assert(JSON.stringify(fixes[1].spec).includes('F-U2'), 'the fix dispatch carries the blocking finding');
      const attacks = agentsOf(run, 'adversary').filter((call) => unitOf(call.spec) === 'U2');
      assertEq(attacks.length, 2, 'the adversary is dispatched once more after the fix');
      const merged = agentsOf(run, 'steward').filter((call) => /merge/.test(commandOf(call.spec))).map((call) => commandOf(call.spec));
      assert(!merged.some((command) => command.includes('U2')), 'the unit is left unmerged while its second pass blocks');
      const u2 = run.result.units.find((unit) => unit.id === 'U2');
      assertEq(u2.status, 'unmerged', 'the result carries status unmerged');
      assertEq(u2.merged, false, 'the result says it was not merged');
    },
  },
  {
    id: 'B47 B48 fc-verify runs after the last merge and fc-review after a green verify, both carried in the result',
    covers: ['B47', 'B48'],
    fn: async () => {
      const run = await build();
      assertEq(nestedNames(run), ['fc-verify', 'fc-review'], 'fc-verify then fc-review');
      const lastMerge = run.agents.map((call) => call.spec).findLastIndex((spec) => /merge/.test(commandOf(spec)));
      assert(lastMerge !== -1, 'something was merged');
      assertEq(run.result.verify, VERIFY, 'the verify result is carried');
      assertEq(run.result.review, REVIEW, 'the review result is carried');
    },
  },
  {
    id: 'B48 a red fc-verify keeps fc-review from running',
    covers: ['B48'],
    fn: async () => {
      const red = { green: false, refuted: false, failing: ['T2'] };
      const run = await build({ workflows: { 'fc-verify': red, 'fc-review': REVIEW } });
      assertEq(nestedNames(run), ['fc-verify'], 'fc-review is not called after a red verify');
      assertEq(run.result.verify, red, 'the verify result is carried');
      assertEq(run.result.review, null, 'review is null');
    },
  },
  {
    id: 'B47 standalone true keeps both nested workflows from running',
    covers: ['B47', 'B48'],
    fn: async () => {
      const run = await build({ entryArgs: { standalone: true } });
      assertEq(nestedNames(run), [], 'no workflow is nested when standalone is true');
      assertEq(run.result.verify, null, 'verify is null');
      assertEq(run.result.review, null, 'review is null');
    },
  },
  {
    id: 'B89 B90 a halt return stops that unit and is carried in the result',
    covers: ['B89', 'B90'],
    fn: async () => {
      const halt = { kind: 'test-contradicts-spec', detail: 'T2 asks for a shape E1 forbids' };
      const run = await build({ units: { 'implementer:U2': [workerReturn('U2', 'halt', { halt })] } });
      const forU2 = run.agents.filter((call) => unitOf(call.spec) === 'U2' && ['implementer', 'strong-worker', 'adversary'].includes(call.spec.agentType ?? call.spec.type));
      assertEq(forU2.length, 1, 'nothing further is dispatched for a halted unit');
      const entryFor = run.result.units.find((unit) => unit.id === 'U2');
      assertEq(entryFor.status, 'halt', 'the result carries status halt');
      assertEq(entryFor.halt, halt, 'the result carries the halt object');
      assertEq(entryFor.merged, false, 'a halted unit is not merged');
    },
  },
  {
    id: 'entry args narrow the build: waves and session pick what runs',
    covers: ['B31'],
    fn: async () => {
      const byWave = await build({ entryArgs: { waves: ['W2'] } });
      assertEq(agentsOf(byWave, 'implementer').map((call) => unitOf(call.spec)), ['U3'], 'only the named wave runs');
      const liftoff = { ...LIFTOFF, sessions: [{ name: 'edges', units: ['U2'] }] };
      const bySession = await build({ liftoff, entryArgs: { session: 'edges' } });
      assertEq(agentsOf(bySession, 'implementer').map((call) => unitOf(call.spec)), ['U2'], "only the session's units run");
    },
  },
]);
