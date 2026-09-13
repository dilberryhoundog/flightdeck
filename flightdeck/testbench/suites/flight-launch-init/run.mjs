#!/usr/bin/env node
// suites/flight-launch-init — flight launch init: the launch record, the drafted spec, the interview folder, the control centre line, and the refusal when the folder is there. Covers B1, B2, B6, E2, I2, I3.
import path from 'node:path';
import fs from 'node:fs';
import {
  TEMPLATES, assert, assertEq, assertExit, assertMatch, exists, flight, mkBareRepo, readJson, readText,
  suite, validateWithRunSchema, writeText,
} from '../../lib/core-lib.mjs';

const NAME = 'widget-core';
const LAUNCH = `flightdeck/launch/${NAME}`;

function init(extra = []) {
  const repo = mkBareRepo();
  const result = flight(['launch', 'init', NAME, ...extra], { cwd: repo.root, env: repo.env });
  return { ...repo, result, dir: path.join(repo.root, 'flightdeck', 'launch', NAME) };
}

await suite('flight-launch-init', [
  {
    id: 'B1 launch.json carries the I2 fields, no run and no runs entry',
    covers: ['B1', 'I2'],
    fn: () => {
      const { result, dir } = init(['--test-dir', 'tests/export']);
      assertExit(result, 0, 'flight launch init');
      const record = readJson(path.join(dir, 'launch.json'));
      assertEq(record.schema_version, 1, 'schema_version');
      assertEq(record.name, NAME, 'name');
      assertMatch(record.created, /^\d{4}-\d{2}-\d{2}$/, 'created is a date');
      assertEq(record.spec, { version: 1 }, 'spec pin');
      assertEq(record.tests_map, null, 'tests_map');
      assertEq(record.test_dir, 'tests/export', 'test_dir comes from --test-dir');
      assertEq(record.current_run, null, 'current_run');
      assertEq(record.runs, [], 'runs');
    },
  },
  {
    id: 'B1 the launch record validates against launch.schema.json',
    covers: ['B1', 'I2'],
    fn: () => {
      const { dir } = init(['--test-dir', 'tests/export']);
      const errors = validateWithRunSchema('launch.schema.json', readJson(path.join(dir, 'launch.json')));
      assertEq(errors, [], 'launch.json against its schema');
    },
  },
  {
    id: 'B1 an empty specs/interview/ is made and no run folder is',
    covers: ['B1'],
    fn: () => {
      const { dir } = init(['--test-dir', 'tests/export']);
      assert(fs.statSync(path.join(dir, 'specs', 'interview')).isDirectory(), 'specs/interview/ is a directory');
      const inside = fs.readdirSync(path.join(dir, 'specs', 'interview')).filter((e) => e !== '.keep' && e !== '.gitkeep');
      assertEq(inside, [], 'specs/interview/ is empty');
      assert(!exists(path.join(dir, 'runs')), 'no runs/ folder is created by launch init');
    },
  },
  {
    id: 'B2 specs/spec.v1.json is the template, filled and drafted',
    covers: ['B2'],
    fn: () => {
      const { dir } = init(['--test-dir', 'tests/export']);
      const specPath = path.join(dir, 'specs', 'spec.v1.json');
      assert(exists(specPath), 'specs/spec.v1.json exists');
      const spec = readJson(specPath);
      assertEq(spec.schema_version, 1, 'schema_version');
      assertEq(spec.name, NAME, 'name');
      assertEq(spec.version, 1, 'version');
      assertEq(spec.status, 'draft', 'status');
      assert(spec.commit === undefined || spec.commit === null, 'a draft carries no commit');
    },
  },
  {
    id: 'B2 every top-level domain of the spec template survives into the drafted spec',
    covers: ['B2'],
    fn: () => {
      const { dir } = init(['--test-dir', 'tests/export']);
      const template = readJson(path.join(TEMPLATES, 'spec.template.json'));
      const spec = readJson(path.join(dir, 'specs', 'spec.v1.json'));
      for (const key of Object.keys(template)) {
        assert(Object.prototype.hasOwnProperty.call(spec, key), `the drafted spec keeps the template key ${key}`);
      }
    },
  },
  {
    id: 'B2 flight validate accepts the spec that launch init wrote',
    covers: ['B2'],
    fn: () => {
      const { result, root } = init(['--test-dir', 'tests/export']);
      assertExit(result, 0, 'flight launch init');
      const validated = flight(['validate', `${LAUNCH}/specs/spec.v1.json`], { cwd: root, env: { CLAUDE_PROJECT_DIR: root } });
      assertExit(validated, 0, `flight validate on the drafted spec: ${validated.stdout}${validated.stderr}`);
    },
  },
  {
    id: 'B6 flightdeck/.controlcenter names the launch folder',
    covers: ['B6', 'I3'],
    fn: () => {
      const { root } = init(['--test-dir', 'tests/export']);
      const text = readText(path.join(root, 'flightdeck', '.controlcenter'));
      assertMatch(text, new RegExp(`^LAUNCH_DIRECTORY=${LAUNCH}$`, 'm'), 'the LAUNCH_DIRECTORY line');
      for (const line of text.split('\n').filter((l) => l.trim() !== '')) {
        assertMatch(line, /^[A-Z][A-Z0-9_]*=.*$/, 'every line is KEY=value');
      }
    },
  },
  {
    id: 'B6 an existing control centre keeps its other keys',
    covers: ['B6', 'I3'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(path.join(repo.root, 'flightdeck', '.controlcenter'), 'OTHER_KEY=kept\nLAUNCH_DIRECTORY=flightdeck/launch/stale\n');
      const result = flight(['launch', 'init', NAME, '--test-dir', 'tests/export'], { cwd: repo.root, env: repo.env });
      assertExit(result, 0, 'flight launch init');
      const text = readText(path.join(repo.root, 'flightdeck', '.controlcenter'));
      assertMatch(text, /^OTHER_KEY=kept$/m, 'the unrelated key survives');
      assertMatch(text, new RegExp(`^LAUNCH_DIRECTORY=${LAUNCH}$`, 'm'), 'LAUNCH_DIRECTORY is rewritten');
      assert(!/launch\/stale/.test(text), 'the stale value is gone');
    },
  },
  {
    id: 'E2 a second init for the same name exits 1 with launch exists and changes nothing',
    covers: ['E2'],
    fn: () => {
      const { root, dir, result } = init(['--test-dir', 'tests/export']);
      assertExit(result, 0, 'the first init');
      const before = readText(path.join(dir, 'specs', 'spec.v1.json'));
      const again = flight(['launch', 'init', NAME, '--test-dir', 'tests/other'], { cwd: root, env: { CLAUDE_PROJECT_DIR: root } });
      assertExit(again, 1, 'the second init');
      assertMatch(`${again.stdout}${again.stderr}`, /launch exists/, 'the message');
      assertEq(readText(path.join(dir, 'specs', 'spec.v1.json')), before, 'the drafted spec is untouched');
      assertEq(readJson(path.join(dir, 'launch.json')).test_dir, 'tests/export', 'the record is untouched');
    },
  },
]);
