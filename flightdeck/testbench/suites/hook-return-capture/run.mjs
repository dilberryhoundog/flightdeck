#!/usr/bin/env node
// suites/hook-return-capture — return-capture: the return it stores and where, the fix suffix, and the two-strike answer to a return it cannot read. Covers B73, E4.
import fs from 'node:fs';
import path from 'node:path';
import { assert, assertEq, assertMatch, coreHook, exists, fenced, mkCoreLaunch, readEvents, readJson, subagentStop, suite, validateWithRunSchema } from '../../lib/core-lib.mjs';

const capture = (made, envelope) => coreHook('return-capture', envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const events = (made) => readEvents(path.join(made.runDir, 'events.jsonl'));
const returnAt = (made, name) => path.join(made.runDir, 'returns', name);

const WORKER = {
  unit: 'U3', status: 'green', branch: 'sample-core/proof', worktree: '.worktrees/U3',
  spec_refs: ['B1'], checks: [{ id: 'T1', verdict: 'pass' }], artefacts: ['src/export/index.mjs'],
  commits: ['eeeeeee'], iterations: 2, halt: null, notes: 'the proof lands',
};

const STEWARD = { target: 'merge', fix: null, command: 'flightdeck/flightcrew/bin/flight merge U1', exit: 0, stdout_tail: ['merged U1'], stderr_tail: [] };

await suite('hook-return-capture', [
  {
    id: 'B73 a valid worker return is stored at returns/<agent_type>-<unit>.json',
    covers: ['B73'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = capture(made, subagentStop('implementer', fenced(WORKER), { agent_id: 'w1' }));
      assertEq(result.code, 0, `exit 0: ${result.stderr}`);
      const file = returnAt(made, 'implementer-U3.json');
      assert(exists(file), 'returns/implementer-U3.json is written');
      assertEq(readJson(file), WORKER, 'the stored object is the return, unchanged');
    },
  },
  {
    id: 'B73 a return whose target field names it is stored under that target',
    covers: ['B73'],
    fn: () => {
      const made = mkCoreLaunch();
      capture(made, subagentStop('steward', fenced(STEWARD), { agent_id: 's1' }));
      assert(exists(returnAt(made, 'steward-merge.json')), 'returns/steward-merge.json is written');
    },
  },
  {
    id: 'B73 a fix return gets the -fix-<k> suffix',
    covers: ['B73'],
    fn: () => {
      const made = mkCoreLaunch();
      capture(made, subagentStop('implementer', fenced({ ...WORKER, fix: 2 }), { agent_id: 'w2' }));
      assert(exists(returnAt(made, 'implementer-U3-fix-2.json')), 'returns/implementer-U3-fix-2.json is written');
      assert(!exists(returnAt(made, 'implementer-U3.json')), 'the unsuffixed name is not used for a fix return');
    },
  },
  {
    id: 'B73 a return event is appended when a return is stored',
    covers: ['B73'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      capture(made, subagentStop('implementer', fenced(WORKER), { agent_id: 'w3' }));
      const after = events(made);
      assertEq(after.length, before + 1, 'exactly one event');
      assertEq(after.at(-1).event, 'return', 'the event name');
      assertEq(after.at(-1).detail.agent_type, 'implementer', 'the event names the role');
    },
  },
  {
    id: 'B73 an agent_type with no return schema is left alone',
    covers: ['B73'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      const result = capture(made, subagentStop('general-purpose', fenced({ anything: true }), { agent_id: 'g1' }));
      assertEq(result.code, 0, 'exit 0');
      assertEq(events(made).length, before, 'no event is appended for a role with no return schema');
    },
  },
  {
    id: 'E4 the first unreadable return exits 2 with the errors on stderr and stores nothing',
    covers: ['E4'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = events(made).length;
      const result = capture(made, subagentStop('implementer', 'No fenced block here at all.', { agent_id: 'bad-1' }));
      assertEq(result.code, 2, 'the first occurrence blocks');
      assert(result.stderr.trim() !== '', 'the errors are on stderr');
      assert(!exists(returnAt(made, 'implementer-U3.invalid.json')), 'nothing is stored on the first occurrence');
      assertEq(events(made).length, before, 'no event on the first occurrence');
    },
  },
  {
    id: 'E4 a fenced block failing the schema blocks the first time too',
    covers: ['E4'],
    fn: () => {
      const made = mkCoreLaunch();
      const result = capture(made, subagentStop('implementer', fenced({ unit: 'U3', status: 'purple' }), { agent_id: 'bad-2' }));
      assertEq(result.code, 2, 'a return failing its schema blocks');
      assertMatch(result.stderr, /status|purple|required/i, 'the schema errors are named');
    },
  },
  {
    id: 'E4 the second unreadable return for one agent stores the invalid file, appends return_invalid, and exits 0',
    covers: ['E4'],
    fn: () => {
      const made = mkCoreLaunch();
      capture(made, subagentStop('implementer', 'Still nothing fenced.', { agent_id: 'bad-3' }));
      const before = events(made).length;
      const result = capture(made, subagentStop('implementer', 'Still nothing fenced.', { agent_id: 'bad-3' }));
      assertEq(result.code, 0, 'the second occurrence lets the agent go');
      const invalid = fs.readdirSync(path.join(made.runDir, 'returns')).filter((name) => name.endsWith('.invalid.json'));
      assertEq(invalid.length, 1, 'exactly one .invalid.json file is written on the second occurrence');
      assertMatch(invalid[0], /^implementer-.*\.invalid\.json$/, 'the invalid file is named for the role');
      const written = returnAt(made, invalid[0]);
      assertEq(validateWithRunSchema('invalid-return.schema.json', readJson(written)), [], 'the invalid file against its schema');
      const after = events(made);
      assertEq(after.length, before + 1, 'exactly one event');
      assertEq(after.at(-1).event, 'return_invalid', 'the event name');
    },
  },
  {
    id: 'E4 the two-strike count is per agent_id',
    covers: ['E4'],
    fn: () => {
      const made = mkCoreLaunch();
      capture(made, subagentStop('implementer', 'nothing', { agent_id: 'first' }));
      const other = capture(made, subagentStop('implementer', 'nothing', { agent_id: 'second' }));
      assertEq(other.code, 2, "another agent's first unreadable return still blocks");
    },
  },
]);
