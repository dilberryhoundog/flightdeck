#!/usr/bin/env node
// suites/orchestrator — the orchestrator's conduct: the liftoff written unchanged, the sequence in order, one entry per human instruction, the workflow_end events, the pull request and its failure. The rules are calibrated on the fixture sessions and then applied to this run's own. Covers B21, B22, B23, B62, B63, B88, E14, E15.
import fs from 'node:fs';
import path from 'node:path';
import {
  LIFTOFFS, RUN_SCHEMAS, SAMPLE_TRANSCRIPT, THIS_RUN_DIR, assert, assertEq, exists, readEvents,
  readJson, suite, thisRunTranscript, validateAgainst,
} from '../../lib/core-lib.mjs';
import { REQUIRED, readSession, rules } from '../../lib/orchestrator-rules.mjs';

const LIFTOFF = readJson(path.join(SAMPLE_TRANSCRIPT, 'liftoff.json'));
const obedient = () => readSession(path.join(SAMPLE_TRANSCRIPT, 'orchestrator.jsonl'), LIFTOFF);
const control = () => readSession(path.join(SAMPLE_TRANSCRIPT, 'orchestrator-control.jsonl'), LIFTOFF);
const prFailed = () => readSession(path.join(SAMPLE_TRANSCRIPT, 'orchestrator-pr-failed.jsonl'), LIFTOFF);

/** This run's own orchestrator session, and the liftoff it was handed, or a reason it cannot be read. */
function thisRun() {
  const transcript = thisRunTranscript();
  if (!transcript) return { why: 'no orchestrator transcript is recorded in this run\'s events.jsonl' };
  const dir = path.join(THIS_RUN_DIR, 'liftoff');
  const names = exists(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.json')) : [];
  if (names.length !== 1) return { why: `runs/run-1/liftoff/ holds ${names.length} liftoff files, expected one` };
  return { session: readSession(transcript, readJson(path.join(dir, names[0]))), name: names[0] };
}

await suite('orchestrator', [
  {
    id: 'calibration: every rule holds of the obedient session',
    covers: ['B21', 'B22', 'B23', 'B62', 'B63', 'B88'],
    fn: () => {
      const session = obedient();
      for (const [id, rule] of Object.entries(REQUIRED)) {
        const verdict = rule(session);
        assert(verdict.ok, `${id} should hold of the obedient session: ${verdict.why}`);
      }
    },
  },
  {
    id: 'calibration: every rule fails on the control session',
    covers: ['B21', 'B22', 'B23', 'B62', 'B63', 'B88'],
    fn: () => {
      const session = control();
      for (const [id, rule] of Object.entries(REQUIRED)) {
        const verdict = rule(session);
        assert(!verdict.ok, `${id} should fail on the control session, and it passed`);
      }
    },
  },
  {
    id: 'calibration: the E15 reading holds on the failed-pull-request session and not on the obedient one',
    covers: ['E15'],
    fn: () => {
      const failed = rules.pullRequestFailureReported(prFailed());
      assert(failed.ok, `the E15 rule should hold of the failed session: ${failed.why}`);
      assert(!rules.pullRequestFailureReported(obedient()).ok, 'the E15 rule does not hold where the pull request succeeded');
      assert(!rules.pullRequestAfterReport(prFailed()).ok, 'no pull request was opened in the E15 session');
    },
  },
  {
    id: 'E14 a liftoff that fails its schema is caught, and the library liftoffs pass',
    covers: ['E14'],
    fn: () => {
      const schema = readJson(path.join(RUN_SCHEMAS, 'liftoff.schema.json'));
      const bad = validateAgainst(schema, readJson(path.join(SAMPLE_TRANSCRIPT, 'liftoff-invalid.json')));
      assert(bad.length > 0, 'the invalid liftoff is refused by the schema');
      assertEq(validateAgainst(schema, LIFTOFF), [], 'the valid liftoff passes');
      for (const name of fs.readdirSync(LIFTOFFS).filter((n) => n.endsWith('.json'))) {
        assertEq(validateAgainst(schema, readJson(path.join(LIFTOFFS, name))), [], `the library liftoff ${name} passes its schema`);
      }
    },
  },
  {
    id: 'B21 this run wrote its liftoff into the run folder, byte-equal to the library file',
    covers: ['B21'],
    fn: () => {
      const dir = path.join(THIS_RUN_DIR, 'liftoff');
      const names = exists(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.json')) : [];
      assertEq(names.length, 1, `runs/run-1/liftoff/ holds exactly one liftoff file, found ${names.length}`);
      const inRun = fs.readFileSync(path.join(dir, names[0]));
      const inLibrary = path.join(LIFTOFFS, names[0]);
      assert(exists(inLibrary), `the liftoff ${names[0]} is a library file`);
      assertEq(inRun.toString('base64'), fs.readFileSync(inLibrary).toString('base64'), 'the copy in the run is byte-equal to the library file');
    },
  },
  {
    id: 'B88 this run has one workflow_end event per liftoff entry, in the liftoff-s order',
    covers: ['B88', 'B22'],
    fn: () => {
      const dir = path.join(THIS_RUN_DIR, 'liftoff');
      const names = exists(dir) ? fs.readdirSync(dir).filter((name) => name.endsWith('.json')) : [];
      assertEq(names.length, 1, 'the run has its liftoff');
      const liftoff = readJson(path.join(dir, names[0]));
      const ended = readEvents(path.join(THIS_RUN_DIR, 'events.jsonl'))
        .filter((event) => event.event === 'workflow_end')
        .map((event) => event.detail?.workflow);
      assertEq(ended, liftoff.sequence.map((entry) => entry.workflow), 'the workflow_end events follow the liftoff sequence');
    },
  },
  {
    id: 'B21 B22 B23 B62 B63 every rule holds of this run-s own orchestrator session',
    covers: ['B21', 'B22', 'B23', 'B62', 'B63'],
    fn: () => {
      const found = thisRun();
      assert(found.session !== undefined, found.why ?? 'this run has no readable orchestrator session');
      for (const [id, rule] of Object.entries(REQUIRED)) {
        const verdict = rule(found.session);
        assert(verdict.ok, `${id} does not hold of this run's session: ${verdict.why}`);
      }
    },
  },
  {
    id: 'E15 this run either opened a pull request or reported why it could not',
    covers: ['E15'],
    fn: () => {
      const found = thisRun();
      assert(found.session !== undefined, found.why ?? 'this run has no readable orchestrator session');
      const opened = rules.pullRequestAfterReport(found.session);
      const reported = rules.pullRequestFailureReported(found.session);
      assert(opened.ok || reported.ok, `neither a pull request nor a reported failure: ${opened.why} / ${reported.why}`);
    },
  },
]);
