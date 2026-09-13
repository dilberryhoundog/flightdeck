#!/usr/bin/env node
// suites/test-builder-artefacts — where a test-builder's work lands: the map beside the spec, the check scripts and rubrics in the run, and its own return. Covers B67, B68, B69, B98, I16.
import fs from 'node:fs';
import path from 'node:path';
import {
  THIS_LAUNCH_DIR, THIS_RUN_DIR, assert, assertEq, exists, listFiles, readJson, suite, validateWithRunSchema,
} from '../../lib/core-lib.mjs';

const specsDir = path.join(THIS_LAUNCH_DIR, 'specs');
const checksDir = path.join(THIS_RUN_DIR, 'checks');
const rubricsDir = path.join(checksDir, 'rubrics');

const maps = () => (exists(specsDir) ? fs.readdirSync(specsDir).filter((name) => /^tests-map\.v\d+\.json$/.test(name)) : []);
const newestMap = () => {
  const found = maps().sort((a, b) => Number(/v(\d+)/.exec(a)[1]) - Number(/v(\d+)/.exec(b)[1]));
  return found.length === 0 ? null : path.join(specsDir, found.at(-1));
};

await suite('test-builder-artefacts', [
  {
    id: 'B67 the tests map sits beside the spec under specs/, as a numbered version',
    covers: ['B67', 'I16'],
    fn: () => {
      const found = maps();
      assert(found.length > 0, 'specs/ holds a tests-map.v<n>.json');
      assert(exists(path.join(specsDir, 'spec.v1.json')), 'the spec it maps is beside it');
      for (const name of found) assert(/^tests-map\.v\d+\.json$/.test(name), `${name} is a numbered version`);
    },
  },
  {
    id: 'B67 the map names the spec version it satisfies',
    covers: ['B67'],
    fn: () => {
      const file = newestMap();
      assert(file !== null, 'there is a map to read');
      const map = readJson(file);
      assertEq(map.spec?.name, readJson(path.join(specsDir, 'spec.v1.json')).name, 'the pin names the spec');
      assertEq(typeof map.spec?.version, 'number', 'the pin names a version');
    },
  },
  {
    id: 'B68 every check script the map names lives under the run-s checks folder',
    covers: ['B68', 'I16'],
    fn: () => {
      const file = newestMap();
      assert(file !== null, 'there is a map to read');
      assert(exists(checksDir), 'runs/run-1/checks/ exists');
      const scripts = listFiles(checksDir).filter((rel) => !rel.startsWith('rubrics/'));
      assert(scripts.length > 0, 'the checks folder holds the check scripts');
      for (const check of readJson(file).checks) {
        const named = check.command.match(/[\w./{}-]*checks\/[\w./-]+/g) ?? [];
        for (const target of named) {
          const rel = target.replace(/^.*checks\//, '');
          assert(scripts.includes(rel) || scripts.some((script) => script.endsWith(rel)), `${check.id} names ${rel}, which is in the checks folder`);
        }
      }
    },
  },
  {
    id: 'B69 every sheet check has its rubric under checks/rubrics/<T>.md',
    covers: ['B69'],
    fn: () => {
      const file = newestMap();
      assert(file !== null, 'there is a map to read');
      const map = readJson(file);
      const sheetChecks = map.checks.filter((check) => check.verdict === 'sheet' || check.kind === 'judged');
      assert(sheetChecks.length > 0, 'the map holds at least one judged check');
      assert(exists(rubricsDir), 'runs/run-1/checks/rubrics/ exists');
      const rubrics = fs.readdirSync(rubricsDir).filter((name) => name.endsWith('.md'));
      for (const check of sheetChecks) {
        assert(rubrics.includes(`${check.id}.md`), `${check.id} has its rubric at checks/rubrics/${check.id}.md`);
      }
      for (const name of rubrics) {
        const id = name.replace(/\.md$/, '');
        assert(sheetChecks.some((check) => check.id === id), `${name} belongs to a judged check the map names`);
      }
    },
  },
  {
    id: 'B98 the test-builder-s own return is stored in the run and holds to its schema',
    covers: ['B98'],
    fn: () => {
      const file = path.join(THIS_RUN_DIR, 'returns', 'test-builder-map.json');
      assert(exists(file), 'runs/run-1/returns/test-builder-map.json exists');
      assertEq(validateWithRunSchema('test-builder-return.schema.json', readJson(file)), [], 'the return against its schema');
    },
  },
  {
    id: 'B98 the return names the map it wrote and every check of it',
    covers: ['B98'],
    fn: () => {
      const file = path.join(THIS_RUN_DIR, 'returns', 'test-builder-map.json');
      assert(exists(file), 'the return is there');
      const record = readJson(file);
      const mapFile = newestMap();
      assert(mapFile !== null, 'there is a map to compare it with');
      assert(record.map.endsWith(path.basename(mapFile)), `the return names the map it wrote, got ${record.map}`);
      const map = readJson(mapFile);
      assertEq(record.checks.map((check) => check.id).sort(), map.checks.map((check) => check.id).sort(), 'every check of the map is in the return');
      for (const check of record.checks) {
        const inMap = map.checks.find((entry) => entry.id === check.id);
        assertEq(check.covers.sort(), [...inMap.covers].sort(), `${check.id}: the covers of the return are the covers of the map`);
        assertEq(check.command, inMap.command, `${check.id}: the command of the return is the command of the map`);
      }
    },
  },
  {
    id: 'I16 nothing under the run-s checks folder is a test the project owns',
    covers: ['I16'],
    fn: () => {
      assert(exists(checksDir), 'the checks folder exists');
      for (const rel of listFiles(checksDir)) {
        assert(!/\.test\.(mjs|js)$/.test(rel), `${rel} is a check, not a test file: tests live in the project's own folder`);
      }
    },
  },
]);
