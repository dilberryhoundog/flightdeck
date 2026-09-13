#!/usr/bin/env node
// suites/scribe — B83, B84, B85 and I10 read from what this run's scribe wrote: the report, its rendering, and the log entry it inserted.
import fs from 'node:fs';
import path from 'node:path';
import {
  FLIGHTLOG, THIS_LAUNCH, THIS_RUN, THIS_RUN_DIR, assert, assertEq, assertMatch, exists, readEvents,
  readJson, readText, suite, validateWithRunSchema,
} from '../../lib/core-lib.mjs';

const reportFile = path.join(THIS_RUN_DIR, 'report.json');
const reportMd = path.join(THIS_RUN_DIR, 'report.md');
const MARKS = ['recorded', 'checked', 'reviewed', 'stated'];

/** The I10 field order of a log entry. */
const FIELDS = ['spec', 'kickoff', 'cost', 'symptom', 'pr', 'outcome', 'seen on', 'cause', 'fixed on', 'change', 'watch', 'kept', 'reservation', 'promote'];
const HUMAN_OWNED = ['outcome', 'seen on', 'cause', 'fixed on', 'change', 'watch', 'kept', 'reservation', 'promote'];

/** This run's entry of the flight log, as its lines. */
function entry() {
  if (!exists(FLIGHTLOG)) return null;
  const text = readText(FLIGHTLOG);
  const heading = new RegExp(`^## \\d{4}-\\d{2}-\\d{2} · ${THIS_LAUNCH} · run-${THIS_RUN}$`, 'm');
  const match = heading.exec(text);
  if (!match) return null;
  const after = text.slice(match.index);
  const end = after.indexOf('\n## ', 1);
  return (end === -1 ? after : after.slice(0, end)).split('\n').filter((line) => line.trim() !== '');
}

await suite('scribe', [
  {
    id: 'B83 report.json is there and holds to the report schema',
    covers: ['B83'],
    fn: () => {
      assert(exists(reportFile), 'runs/run-1/report.json exists');
      assertEq(validateWithRunSchema('report.schema.json', readJson(reportFile)), [], 'report.json against report.schema.json');
    },
  },
  {
    id: 'B83 the header is drawn from the run, and the cost from the agent and event counts',
    covers: ['B83'],
    fn: () => {
      const report = readJson(reportFile);
      assertEq(report.launch, THIS_LAUNCH, 'the launch');
      assertEq(report.run, THIS_RUN, 'the run');
      assertMatch(report.header.cost, /^\d+ agents · \d+ minutes$/, "the cost reads '<agents> agents · <minutes> minutes'");
      assertMatch(report.header.kickoff, /^[\w-]+ @ [0-9a-f]{7,40}$/, "the kickoff reads '<liftoff name> @ <commit>'");
      assertMatch(report.header.started, /^\d{4}-\d{2}-\d{2}T/, 'started is an iso timestamp');
      assertMatch(report.header.ended, /^\d{4}-\d{2}-\d{2}T/, 'ended is an iso timestamp');
      const events = readEvents(path.join(THIS_RUN_DIR, 'events.jsonl'));
      const started = events.filter((event) => event.event === 'SubagentStart').length;
      assertEq(Number(report.header.cost.split(' ')[0]), started, 'the agent count is the SubagentStart count');
    },
  },
  {
    id: 'B83 every ledger line carries its provenance mark',
    covers: ['B83'],
    fn: () => {
      const report = readJson(reportFile);
      assert(report.ledger.length > 0, 'the ledger says something');
      for (const line of report.ledger) {
        const match = /^\[(\w+)\] \S/.exec(line);
        assert(match !== null, `the line opens with its mark: ${line}`);
        assert(MARKS.includes(match[1]), `${match[1]} is one of the four marks`);
      }
    },
  },
  {
    id: 'B83 the verification counts are the ones the evidence summary recorded',
    covers: ['B83'],
    fn: () => {
      const report = readJson(reportFile);
      const summaryFile = path.join(THIS_RUN_DIR, 'evidence', 'summary.json');
      assert(exists(summaryFile), 'evidence/summary.json exists');
      assertEq(report.verification.counts, readJson(summaryFile).counts, 'the counts match the summary');
      assertEq(report.verification.locked, readJson(summaryFile).locked.changed, 'the locked list matches the summary');
      assertEq(report.verification.boundary, readJson(summaryFile).boundary.outside, 'the boundary list matches the summary');
    },
  },
  {
    id: 'B83 one phases entry per workflow_end event and one agents entry per type',
    covers: ['B83'],
    fn: () => {
      const report = readJson(reportFile);
      const events = readEvents(path.join(THIS_RUN_DIR, 'events.jsonl'));
      const ends = events.filter((event) => event.event === 'workflow_end');
      assertEq(report.phases.map((phase) => phase.workflow), ends.map((event) => event.detail.workflow), 'one phase per workflow_end, in order');
      const types = new Set(events.filter((event) => event.event === 'SubagentStart').map((event) => event.agent_type ?? event.detail?.agent_type));
      assertEq(report.agents.map((entry) => entry.agent_type).sort(), [...types].filter(Boolean).sort(), 'one agents entry per type that ran');
    },
  },
  {
    id: 'B84 report.md is rendered from report.json',
    covers: ['B84'],
    fn: () => {
      assert(exists(reportMd), 'runs/run-1/report.md exists');
      const text = readText(reportMd);
      const report = readJson(reportFile);
      assert(text.includes(report.header.cost), 'the rendering carries the cost');
      assert(text.includes(report.header.kickoff), 'the rendering carries the kickoff');
      for (const line of report.ledger) assert(text.includes(line), `the rendering carries the ledger line: ${line}`);
    },
  },
  {
    id: 'B85 the flight log carries this run-s entry with the I10 fields in order',
    covers: ['B85', 'I10'],
    fn: () => {
      const lines = entry();
      assert(lines !== null, `flightdeck/launch/FLIGHTLOG.md carries an entry for ${THIS_LAUNCH} run-${THIS_RUN}`);
      const fields = lines.slice(1).map((line) => line.split(':')[0].trim());
      assertEq(fields, FIELDS, 'the fields are the I10 fields, in the I10 order');
    },
  },
  {
    id: 'B85 the scribe-written lines are filled and the human-owned lines read <fill>',
    covers: ['B85', 'I10'],
    fn: () => {
      const lines = entry();
      assert(lines !== null, 'the entry is there');
      const values = Object.fromEntries(lines.slice(1).map((line) => {
        const at = line.indexOf(':');
        return [line.slice(0, at).trim(), line.slice(at + 1).trim()];
      }));
      for (const field of ['spec', 'kickoff', 'cost', 'symptom']) {
        assert(values[field] && values[field] !== '<fill>', `${field} is written by the scribe, not left to the human`);
      }
      assert(values.pr === '—' || /^https?:\/\//.test(values.pr), `pr reads a pull request URL or an em dash, got ${values.pr}`);
      for (const field of HUMAN_OWNED) assertEq(values[field], '<fill>', `${field} is left for the human`);
    },
  },
  {
    id: 'I10 the log opens with its heading and a preamble, and this entry is the newest',
    covers: ['I10'],
    fn: () => {
      assert(exists(FLIGHTLOG), 'the flight log exists');
      const text = readText(FLIGHTLOG);
      const lines = text.split('\n');
      assertEq(lines[0], '# Flight log', 'the file opens with its heading');
      const firstEntry = lines.findIndex((line) => line.startsWith('## '));
      assert(firstEntry > 1, 'a preamble sits between the heading and the first entry');
      assert(lines.slice(1, firstEntry).some((line) => line.trim() !== ''), 'the preamble says something');
      assertMatch(lines[firstEntry], new RegExp(`^## \\d{4}-\\d{2}-\\d{2} · ${THIS_LAUNCH} · run-${THIS_RUN}$`), 'the newest entry is this run');
    },
  },
]);
