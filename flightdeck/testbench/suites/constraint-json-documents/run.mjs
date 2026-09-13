#!/usr/bin/env node
// suites/constraint-json-documents — C10: every document a run reads or writes is JSON held to a schema under schemas/run/, and the markdown under a run is a rendering nothing reads back.
import path from 'node:path';
import {
  BIN, CORE_HOOKS, FD, RUN_SCHEMAS, SAMPLE_LAUNCH, VERIFY_LIB, assert, assertEq, exists, listFiles,
  readJson, readLines, readText, suite, validateAgainst,
} from '../../lib/core-lib.mjs';
import { stripLiterals } from '../../lib/workflow-scan.mjs';

/** The schema each run document's file name selects. */
function schemaFor(rel) {
  const name = rel.split('/').pop();
  if (name === 'launch.json') return 'launch.schema.json';
  if (/^spec\.v\d+\.json$/.test(name)) return 'spec';
  if (/^tests-map\.v\d+\.json$/.test(name)) return 'tests-map.schema.json';
  if (name === 'plan.json') return 'plan.schema.json';
  if (name === 'report.json') return 'report.schema.json';
  if (name === 'summary.json') return 'evidence-summary.schema.json';
  if (rel.includes('/liftoff/')) return 'liftoff.schema.json';
  if (rel.includes('/evidence/')) return 'check-result.schema.json';
  if (rel.includes('/returns/')) return null;
  return null;
}

const runFiles = () => listFiles(SAMPLE_LAUNCH);

await suite('constraint-json-documents', [
  {
    id: 'C10 every document of the fixture launch is JSON and holds to the schema its name selects',
    covers: ['C10'],
    fn: () => {
      const checked = [];
      for (const rel of runFiles()) {
        if (!rel.endsWith('.json')) continue;
        const name = schemaFor(rel);
        if (name === null) continue;
        const file = path.join(SAMPLE_LAUNCH, rel);
        if (name === 'spec') {
          const schema = readJson(path.join(FD, 'flightcrew', 'schemas', 'spec.schema.json'));
          assertEq(validateAgainst(schema, readJson(file)), [], `${rel} against spec.schema.json`);
          checked.push(rel);
          continue;
        }
        const schemaFile = path.join(RUN_SCHEMAS, name);
        assert(exists(schemaFile), `schemas/run/${name} exists for ${rel}`);
        assertEq(validateAgainst(readJson(schemaFile), readJson(file)), [], `${rel} against ${name}`);
        checked.push(rel);
      }
      assert(checked.length >= 5, `the fixture launch carries documents to check, found ${checked.length}`);
    },
  },
  {
    id: 'C10 every events line holds to the event schema',
    covers: ['C10'],
    fn: () => {
      const schema = readJson(path.join(RUN_SCHEMAS, 'event.schema.json'));
      const lines = readLines(path.join(SAMPLE_LAUNCH, 'runs', 'run-1', 'events.jsonl'));
      assert(lines.length > 0, 'the fixture has events');
      for (const [index, line] of lines.entries()) {
        assertEq(validateAgainst(schema, JSON.parse(line)), [], `events line ${index + 1}`);
      }
    },
  },
  {
    id: 'C10 the only markdown under a run is a rendering: a dispatch, a plan or a report',
    covers: ['C10'],
    fn: () => {
      const allowed = /^runs\/run-\d+\/(dispatches\/[\w.-]+\.md|plan\.md|report\.md|checks\/rubrics\/T\d+\.md)$/;
      const strays = runFiles().filter((rel) => rel.endsWith('.md') && !allowed.test(rel) && !rel.startsWith('specs/'));
      assertEq(strays.filter((rel) => rel.startsWith('runs/')), [], 'no markdown under a run that is not a rendering');
    },
  },
  {
    id: 'C10 no leaf, hook or validator reads a markdown file back',
    covers: ['C10'],
    fn: () => {
      const found = [];
      for (const dir of [BIN, CORE_HOOKS, VERIFY_LIB]) {
        if (!exists(dir)) continue;
        for (const rel of listFiles(dir)) {
          if (!/\.(mjs|js)$/.test(rel)) continue;
          const text = readText(path.join(dir, rel));
          const code = stripLiterals(text);
          for (const match of text.matchAll(/\b(readFileSync|readFile|createReadStream)\s*\(([^)]*)\)/g)) {
            if (/\.md\b/.test(match[2])) found.push(`${rel}: ${match[0].slice(0, 80)}`);
          }
          if (/\breadFileSync\b/.test(code) && /report\.md|plan\.md|dispatches\/[^'"]*\.md/.test(text)) {
            const reads = [...text.matchAll(/readFileSync\s*\([^)]*\.md[^)]*\)/g)];
            for (const read of reads) found.push(`${rel}: ${read[0].slice(0, 80)}`);
          }
        }
      }
      assertEq([...new Set(found)], [], 'no script reads a rendering back');
    },
  },
  {
    id: 'C10 a schema under schemas/run/ exists for every run document kind',
    covers: ['C10'],
    fn: () => {
      const needed = [
        'launch.schema.json', 'tests-map.schema.json', 'plan.schema.json', 'event.schema.json',
        'check-result.schema.json', 'evidence-summary.schema.json', 'report.schema.json',
        'liftoff.schema.json', 'invalid-return.schema.json', 'fill.schema.json',
      ];
      for (const name of needed) assert(exists(path.join(RUN_SCHEMAS, name)), `schemas/run/${name} exists`);
    },
  },
]);
