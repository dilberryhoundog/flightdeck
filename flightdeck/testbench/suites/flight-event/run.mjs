#!/usr/bin/env node
// suites/flight-event — flight event: one line appended to the run's events.jsonl, carrying source leaf and the run it resolved. Covers B88, I13.
import path from 'node:path';
import { assertEq, assertExit, assertMatch, flight, mkCoreLaunch, readEvents, readLines, suite, validateWithRunSchema } from '../../lib/core-lib.mjs';

const event = (made, json) => flight(['event', json], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });

await suite('flight-event', [
  {
    id: 'B88 one line is appended and the earlier lines are untouched',
    covers: ['B88', 'I13'],
    fn: () => {
      const made = mkCoreLaunch();
      const file = path.join(made.runDir, 'events.jsonl');
      const before = readLines(file);
      assertExit(event(made, JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-build' } })), 0, 'flight event');
      const after = readLines(file);
      assertEq(after.length, before.length + 1, 'exactly one line is appended');
      assertEq(after.slice(0, before.length), before, 'the earlier lines are byte-equal');
    },
  },
  {
    id: 'B88 the appended line carries source leaf, the launch, the run and the detail it was given',
    covers: ['B88', 'I13'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(event(made, JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-verify' } })), 0, 'flight event');
      const line = readEvents(path.join(made.runDir, 'events.jsonl')).at(-1);
      assertEq(line.event, 'workflow_end', 'event');
      assertEq(line.source, 'leaf', 'source');
      assertEq(line.launch, made.launch, 'launch');
      assertEq(line.run, made.run, 'run');
      assertEq(line.detail.workflow, 'fc-verify', 'detail');
      assertMatch(line.ts, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, 'ts is an iso timestamp');
    },
  },
  {
    id: 'I13 the appended line validates against the event schema',
    covers: ['I13'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(event(made, JSON.stringify({ event: 'unit_merged', detail: { unit: 'U1' } })), 0, 'flight event');
      const line = readEvents(path.join(made.runDir, 'events.jsonl')).at(-1);
      assertEq(validateWithRunSchema('event.schema.json', line), [], 'the appended line against event.schema.json');
    },
  },
  {
    id: 'I13 an event name outside the allowed set is refused',
    covers: ['I13'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
      const result = event(made, JSON.stringify({ event: 'invented_event', detail: {} }));
      assertEq(result.code === 0, false, 'an unlisted event name is not appended silently');
      assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, 'nothing is appended');
    },
  },
  {
    id: 'I13 a detail key outside the allowed set is refused',
    covers: ['I13'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = readLines(path.join(made.runDir, 'events.jsonl')).length;
      const result = event(made, JSON.stringify({ event: 'workflow_end', detail: { workflow: 'fc-build', secret: 'no' } }));
      assertEq(result.code === 0, false, 'an unlisted detail key is not appended silently');
      assertEq(readLines(path.join(made.runDir, 'events.jsonl')).length, before, 'nothing is appended');
    },
  },
]);
