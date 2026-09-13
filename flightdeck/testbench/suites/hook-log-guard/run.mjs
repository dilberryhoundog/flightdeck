#!/usr/bin/env node
// suites/hook-log-guard — log-guard: the two edits to FLIGHTLOG.md it lets through and everything else it refuses. Covers B86.
import path from 'node:path';
import { SAMPLE_LAUNCH, assert, assertEq, coreHook, denied, denyReason, mkCoreLaunch, preToolUse, readText, suite, writeText } from '../../lib/core-lib.mjs';

const ENTRY = readText(path.join(SAMPLE_LAUNCH, 'FLIGHTLOG.entry.md'));
const HEAD = '# Flight log\n\nOne entry per run, newest first.\n\n';

function logged(entry = ENTRY) {
  const made = mkCoreLaunch();
  const file = path.join(made.root, 'flightdeck', 'launch', 'FLIGHTLOG.md');
  writeText(file, `${HEAD}${entry}`);
  return { ...made, file };
}

const guard = (made, envelope) => coreHook('log-guard', envelope, { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const edit = (made, oldString, newString) => guard(made, preToolUse('Edit', made.file, { tool_input: { old_string: oldString, new_string: newString } }));
const write = (made, content) => guard(made, preToolUse('Write', made.file, { tool_input: { content } }));

const NEW_ENTRY = `## 2026-09-11 · sample-core · run-2
spec: specs/spec.v1.json @ b2c3d4e
kickoff: sample @ b2c3d4e
cost: 4 agents · 30 minutes
symptom: the exporter dropped a warning
pr: —
outcome: <fill>
seen on: <fill>
cause: <fill>
fixed on: <fill>
change: <fill>
watch: <fill>
kept: <fill>
reservation: <fill>
promote: <fill>

`;

await suite('hook-log-guard', [
  {
    id: 'B86 an edit that changes a <fill> line is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = edit(made, 'outcome: <fill>', 'outcome: accepted');
      assert(denied(result), 'filling an outcome line through a tool is denied');
      assertEq(denyReason(result).trim() === '', false, 'the deny carries a reason');
    },
  },
  {
    id: 'B86 an edit that changes a human-owned line already written is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged(ENTRY.replace('outcome: <fill>', 'outcome: accepted'));
      const result = edit(made, 'outcome: accepted', 'outcome: abandoned');
      assert(denied(result), 'rewriting a human-owned line is denied');
    },
  },
  {
    id: 'B86 an edit that changes a scribe-written line is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = edit(made, 'cost: 6 agents · 60 minutes', 'cost: 2 agents · 5 minutes');
      assert(denied(result), 'rewriting the cost line is denied');
    },
  },
  {
    id: 'B86 a write that only inserts a new entry is permitted',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = write(made, `${HEAD}${NEW_ENTRY}${ENTRY}`);
      assert(!denied(result), `inserting a new entry is permitted: ${denyReason(result)}`);
    },
  },
  {
    id: 'B86 an edit that only fills the pr line is permitted',
    covers: ['B86'],
    fn: () => {
      const made = logged(ENTRY.replace('pr: https://github.com/example/example/pull/1', 'pr: —'));
      const result = edit(made, 'pr: —', 'pr: https://github.com/example/example/pull/2');
      assert(!denied(result), `filling the pr line is permitted: ${denyReason(result)}`);
    },
  },
  {
    id: 'B86 a write that inserts an entry and also changes an existing line is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = write(made, `${HEAD}${NEW_ENTRY}${ENTRY.replace('symptom: the warning shape was not settled before the edges unit started', 'symptom: rewritten')}`);
      assert(denied(result), 'an insert that also rewrites an old entry is denied');
    },
  },
  {
    id: 'B86 a write that drops an existing entry is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = write(made, `${HEAD}${NEW_ENTRY}`);
      assert(denied(result), 'dropping an entry is denied');
    },
  },
  {
    id: 'B86 a NotebookEdit at the log is denied',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = guard(made, preToolUse('NotebookEdit', made.file, { tool_input: { new_source: 'anything' } }));
      assert(denied(result), 'the third write tool is refused too');
    },
  },
  {
    id: 'B86 an edit to another markdown file is not the log-guard-s business',
    covers: ['B86'],
    fn: () => {
      const made = logged();
      const result = guard(made, preToolUse('Edit', path.join(made.root, 'README.md'), { tool_input: { old_string: 'a', new_string: 'b' } }));
      assert(!denied(result), 'another file is not denied');
      assertEq(result.stdout.trim(), '', 'nothing is printed');
    },
  },
]);
