#!/usr/bin/env node
// suites/workflows-report — fc-report under the runtime stub: the scribe, the worktree removal after it, the branches that survive it, and the result it returns. Covers B59, B60, B61.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, readJson, suite } from '../../lib/core-lib.mjs';
import { commandOf, crew, dispatchedTypes, runWorkflowStrict } from '../../lib/workflow-stub.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'liftoff', 'sample.json'));
const PLAN = readJson(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'plan.json'));

const WORKTREES = ['.worktrees/U2', '.worktrees/U3'];
const scribeReturn = (assembled = true, missing = []) => ({
  target: 'report', fix: null,
  report: 'flightdeck/launch/sample-core/runs/run-1/report.json',
  log_entry: '## 2026-09-10 · sample-core · run-1',
  assembled, missing,
});

const report = (options = {}) =>
  runWorkflowStrict('fc-report', { launch: 'sample-core', run: 1, liftoff: LIFTOFF, entry: {} }, {
    agents: crew({
      plan: PLAN,
      returns: { scribe: options.scribe ?? scribeReturn() },
      steward: (command) => {
        if (/worktree list/.test(command)) {
          return { target: 'worktree', fix: null, command, exit: 0, stdout_tail: (options.worktrees ?? WORKTREES).map((w) => `${w}  abc1234 [unit]`), stderr_tail: [] };
        }
        return { target: 'steward', fix: null, command, exit: options.removeExit ?? 0, stdout_tail: [], stderr_tail: options.removeExit ? ['fatal: worktree is dirty'] : [] };
      },
    }),
  });

const stewards = (run) => run.agents.filter((call) => (call.spec.agentType ?? call.spec.type) === 'steward').map((call) => commandOf(call.spec));

await suite('workflows-report', [
  {
    id: 'B59 the scribe is dispatched',
    covers: ['B59'],
    fn: async () => {
      const run = await report();
      assertEq(run.error, null, `fc-report ran: ${run.error?.message ?? ''}`);
      assertEq(dispatchedTypes(run).filter((type) => type === 'scribe').length, 1, 'exactly one scribe');
      assertEq(run.result.report, 'flightdeck/launch/sample-core/runs/run-1/report.json', 'the result names the report');
      assertEq(run.result.log_entry, true, 'the result says the log entry was written');
      assertEq(run.result.error, null, 'no error');
    },
  },
  {
    id: 'B60 the worktrees are removed after the scribe returns, one git worktree remove each',
    covers: ['B60'],
    fn: async () => {
      const run = await report();
      const order = dispatchedTypes(run);
      const scribeAt = order.indexOf('scribe');
      const removals = run.agents
        .map((call, at) => ({ command: commandOf(call.spec), at, type: call.spec.agentType ?? call.spec.type }))
        .filter((call) => call.type === 'steward' && /worktree remove/.test(call.command));
      assertEq(removals.length, WORKTREES.length, 'one removal per remaining worktree');
      for (const removal of removals) assert(removal.at > scribeAt, 'every removal comes after the scribe');
      for (const worktree of WORKTREES) {
        assert(removals.some((removal) => removal.command.includes(worktree)), `${worktree} is removed`);
      }
      assertEq(run.result.worktrees_removed, WORKTREES.length, 'the result counts them');
    },
  },
  {
    id: 'B61 no branch is deleted by the removal',
    covers: ['B61'],
    fn: async () => {
      const run = await report();
      const commands = stewards(run);
      for (const command of commands) {
        assert(!/branch\s+-[dD]/.test(command), `no branch deletion: ${command}`);
        assert(!/worktree remove[^\n]*--force[^\n]*branch/.test(command), `no branch is taken with the worktree: ${command}`);
        assert(!/push\s+.*--delete/.test(command), `no remote branch deletion: ${command}`);
      }
    },
  },
  {
    id: 'B60 with no worktree left, nothing is removed and the count is zero',
    covers: ['B60'],
    fn: async () => {
      const run = await report({ worktrees: [] });
      assertEq(stewards(run).filter((command) => /worktree remove/.test(command)).length, 0, 'no removal');
      assertEq(run.result.worktrees_removed, 0, 'the count is zero');
    },
  },
  {
    id: 'B59 a scribe that could not assemble is carried in the error field',
    covers: ['B59'],
    fn: async () => {
      const run = await report({ scribe: scribeReturn(false, ['evidence/summary.json']) });
      assertEq(run.result.log_entry, false, 'no log entry was written');
      assert(typeof run.result.error === 'string' && run.result.error.length > 0, 'the error field says what was missing');
      assert(run.result.error.includes('summary.json'), 'the missing input is named');
    },
  },
  {
    id: 'B60 a removal that fails is carried in the error field and the rest still run',
    covers: ['B60'],
    fn: async () => {
      const run = await report({ removeExit: 1 });
      const removals = stewards(run).filter((command) => /worktree remove/.test(command));
      assertEq(removals.length, WORKTREES.length, 'every removal is still attempted');
      assert(typeof run.result.error === 'string' && run.result.error.length > 0, 'the failure is reported in the error field');
    },
  },
]);
