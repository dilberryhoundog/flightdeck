#!/usr/bin/env node
// suites/run-schemas — the run-document schemas of I13 and the verdict fields of I15: what each schema keeps, what it drops, and what it gains.
import path from 'node:path';
import { RUN_SCHEMAS, SCHEMAS, assert, assertEq, exists, listFiles, readJson, suite } from '../../lib/core-lib.mjs';

const schema = (name) => readJson(path.join(RUN_SCHEMAS, name));
const has = (s, field) => Object.prototype.hasOwnProperty.call(s.properties ?? {}, field);

await suite('run-schemas', [
  {
    id: 'I13 every run document has its schema under schemas/run/',
    covers: ['I13'],
    fn: () => {
      const needed = [
        'launch.schema.json', 'tests-map.schema.json', 'plan.schema.json', 'event.schema.json',
        'check-result.schema.json', 'evidence-summary.schema.json', 'report.schema.json',
        'liftoff.schema.json', 'invalid-return.schema.json', 'fill.schema.json',
      ];
      for (const name of needed) assert(exists(path.join(RUN_SCHEMAS, name)), `schemas/run/${name} exists`);
    },
  },
  {
    id: 'I13 the spec schema stays where it was and no other schema sits directly under schemas/',
    covers: ['I13'],
    fn: () => {
      assert(exists(path.join(SCHEMAS, 'spec.schema.json')), 'schemas/spec.schema.json stands');
      const direct = listFiles(SCHEMAS).filter((rel) => !rel.includes('/') && rel.endsWith('.json'));
      assertEq(direct, ['spec.schema.json'], 'nothing else sits directly under schemas/');
    },
  },
  {
    id: 'I13 the plan schema renames pilot to scout, drops the six fields and gains status and commit',
    covers: ['I13'],
    fn: () => {
      const plan = schema('plan.schema.json');
      const unit = plan.properties.units.items;
      assert(has(unit, 'scout'), 'a unit carries scout');
      assert(!has(unit, 'pilot'), 'pilot is gone');
      assert(!(unit.required ?? []).includes('budget_turns'), 'budget_turns is gone from a unit');
      assert(!has(unit, 'budget_turns'), 'budget_turns is not a unit field at all');
      for (const field of ['gates', 'abandon_triggers', 'kickoff_version', 'shape', 'models', 'expected_cost']) {
        assert(!has(plan, field), `${field} is gone from the plan`);
        assert(!(plan.required ?? []).includes(field), `${field} is not required`);
      }
      assert(has(plan, 'status') && has(plan, 'commit'), 'the plan carries status and commit');
      assertEq(plan.properties.status.enum, ['draft', 'frozen'], 'the status values');
    },
  },
  {
    id: 'I13 the event schema drops phase, gains run, and fixes the source and event vocabularies',
    covers: ['I13'],
    fn: () => {
      const event = schema('event.schema.json');
      assert(!has(event, 'phase'), 'phase is gone');
      assert(!(event.required ?? []).includes('phase'), 'phase is not required');
      assert(has(event, 'run'), 'run is there');
      assert((event.required ?? []).includes('run'), 'run is required');
      assertEq(event.properties.source.enum, ['hook', 'leaf', 'role'], 'the three sources');
      const names = event.properties.event.enum ?? [];
      assert(names.length > 0, 'the event names are an enumeration, not any string');
      for (const name of ['frozen_denied', 'locked_denied', 'boundary_denied', 'log_denied', 'return', 'return_invalid', 'stop_block', 'check_run', 'stalled', 'unit_merged', 'workflow_end', 'SessionStart', 'WorktreeRemove']) {
        assert(names.includes(name), `the event vocabulary holds ${name}`);
      }
    },
  },
  {
    id: 'I15 the tests-map schema replaces class with verdict, adds depends_on, and drops allowed_paths and gate_only',
    covers: ['I15'],
    fn: () => {
      const map = schema('tests-map.schema.json');
      const check = map.properties.checks.items;
      assert(has(check, 'verdict'), 'a check carries verdict');
      assertEq(check.properties.verdict.enum, ['exit', 'ratio', 'sheet'], 'the three verdict kinds');
      assert(!has(check, 'class'), 'class is gone');
      assert(has(check, 'kind'), 'kind stands');
      assert(has(check, 'depends_on'), 'depends_on is there');
      assert(!has(check, 'gate_only'), 'gate_only is gone');
      assert(!has(map, 'allowed_paths'), 'allowed_paths is gone from the map');
      assert(has(map, 'fixture') && has(map, 'run_all'), 'fixture and run_all stand');
      assert(has(check, 'trials') && has(check, 'threshold'), 'a ratio check carries trials and threshold');
      assert(has(check, 'rubric'), 'a sheet check carries a rubric');
    },
  },
  {
    id: 'I15 the check-result schema carries the ratio and sheet fields',
    covers: ['I15'],
    fn: () => {
      const result = schema('check-result.schema.json');
      assertEq(result.properties.verdict.enum, ['pass', 'fail', 'error', 'skipped'], 'the four verdicts');
      assert(has(result, 'observed'), 'observed is there for a ratio check');
      assert(has(result, 'sheet'), 'sheet is there for a sheet check');
      const observed = result.properties.observed;
      assert(JSON.stringify(observed).includes('passes') && JSON.stringify(observed).includes('trials'), 'observed is { passes, trials }');
      for (const field of ['id', 'command', 'cwd', 'exit', 'verdict', 'stdout_tail', 'stderr_tail', 'duration_ms', 'ran_at', 'commit', 'covers']) {
        assert(has(result, field), `check-result keeps ${field}`);
      }
    },
  },
  {
    id: 'I13 the evidence summary and report schemas are the shapes I13 states',
    covers: ['I13'],
    fn: () => {
      const summary = schema('evidence-summary.schema.json');
      for (const field of ['ran_at', 'commit', 'counts', 'checks', 'boundary', 'locked']) {
        assert((summary.required ?? []).includes(field), `the summary requires ${field}`);
      }
      const counts = summary.properties.counts;
      for (const field of ['pass', 'fail', 'error', 'skipped']) assert(has(counts, field), `the counts carry ${field}`);
      const report = schema('report.schema.json');
      for (const field of ['launch', 'run', 'header', 'ledger', 'verification', 'review', 'phases', 'agents', 'failures', 'notes']) {
        assert((report.required ?? []).includes(field), `the report requires ${field}`);
      }
      for (const field of ['spec', 'kickoff', 'cost', 'started', 'ended']) {
        assert(Object.prototype.hasOwnProperty.call(report.properties.header.properties ?? {}, field), `the report header carries ${field}`);
      }
    },
  },
  {
    id: 'I15 the judge return schema is the verdict sheet of I15',
    covers: ['I15'],
    fn: () => {
      const judge = schema('judge-return.schema.json');
      for (const field of ['rubric', 'subject', 'answers', 'verdict']) assert((judge.required ?? []).includes(field), `the sheet requires ${field}`);
      const answer = judge.properties.answers.items;
      assertEq(answer.properties.answer.enum, ['yes', 'no'], 'an answer is yes or no');
      assertEq(answer.properties.quote.minLength, 1, 'a quote is never empty');
      assertEq(judge.properties.verdict.enum, ['pass', 'fail'], 'a sheet verdict is pass or fail');
    },
  },
  {
    id: 'I13 the fill schema names the slots a caller may pass and no others',
    covers: ['I13'],
    fn: () => {
      const fill = schema('fill.schema.json');
      assertEq(Object.keys(fill.properties ?? {}).sort(), ['evidence', 'leaf', 'previous_findings', 'question', 'rubric', 'subject'], 'the six fill slots');
      assertEq(fill.additionalProperties, false, 'nothing else may be passed');
    },
  },
]);
