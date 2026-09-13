#!/usr/bin/env node
// suites/return-schemas — the return schema per subagent role under schemas/run/, the shapes I8 fixes for the new ones, and every return fixture held to its role's schema. Covers B75, I8.
import path from 'node:path';
import {
  FIXTURES, RUN_SCHEMAS, SUBAGENT_ROLES, assert, assertEq, exists, listFiles, readJson, suite, validateAgainst,
} from '../../lib/core-lib.mjs';

/** The schema file each role's return is held to (I8). */
const SCHEMA_OF = {
  explorer: 'explorer-return.schema.json',
  planner: 'planner-return.schema.json',
  steward: 'steward-return.schema.json',
  'interface-builder': 'interface-builder-return.schema.json',
  implementer: 'worker-return.schema.json',
  'strong-worker': 'worker-return.schema.json',
  adversary: 'adversary-return.schema.json',
  verifier: 'verifier-verdict.schema.json',
  critic: 'critic-findings.schema.json',
  judge: 'judge-return.schema.json',
  scribe: 'scribe-return.schema.json',
  'test-builder': 'test-builder-return.schema.json',
};

const REUSED = ['explorer-return.schema.json', 'worker-return.schema.json', 'verifier-verdict.schema.json', 'critic-findings.schema.json'];

const schema = (name) => readJson(path.join(RUN_SCHEMAS, name));

/** Every return fixture under fixtures/, as { file, role }. The role is the part before the first dash of the file name. */
function returnFixtures() {
  const found = [];
  for (const rel of listFiles(FIXTURES)) {
    const match = /(?:^|\/)returns\/([\w-]+?)-(.+)\.json$/.exec(rel);
    if (!match) continue;
    if (rel.endsWith('.invalid.json')) continue;
    const role = Object.keys(SCHEMA_OF).find((name) => match[1] === name || rel.includes(`/returns/${name}-`));
    found.push({ file: path.join(FIXTURES, rel), rel, role: role ?? match[1] });
  }
  return found;
}

await suite('return-schemas', [
  {
    id: 'I8 one return schema per subagent role lives under schemas/run/',
    covers: ['I8'],
    fn: () => {
      for (const role of [...SUBAGENT_ROLES, 'test-builder']) {
        const name = SCHEMA_OF[role];
        assert(name !== undefined, `${role} has a named return schema`);
        assert(exists(path.join(RUN_SCHEMAS, name)), `schemas/run/${name} exists for ${role}`);
      }
    },
  },
  {
    id: 'I8 the four reused schemas keep the shape they already had',
    covers: ['I8'],
    fn: () => {
      const WAS = {
        'explorer-return.schema.json': ['id', 'question', 'stage', 'answer', 'confidence', 'pointers', 'candidates'],
        'worker-return.schema.json': ['unit', 'status', 'branch', 'worktree', 'spec_refs', 'checks', 'artefacts', 'commits', 'iterations', 'halt', 'notes'],
        'verifier-verdict.schema.json': ['refuted', 'checks_rerun', 'reasons', 'unverified', 'test_file_changes', 'outside_boundary'],
        'critic-findings.schema.json': ['verdict', 'pass', 'findings'],
      };
      for (const name of REUSED) {
        assertEq(schema(name).required, WAS[name], `${name} keeps its required fields`);
      }
    },
  },
  {
    id: 'I8 interface-builder-return is worker-return with the spec-contradiction halt kind added',
    covers: ['I8'],
    fn: () => {
      const worker = schema('worker-return.schema.json');
      const builder = schema('interface-builder-return.schema.json');
      for (const field of worker.required) assert(builder.required.includes(field), `interface-builder-return keeps ${field}`);
      const kinds = JSON.stringify(builder.properties?.halt ?? {});
      assert(kinds.includes('spec-contradiction'), 'the halt kind spec-contradiction is added');
      const workerKinds = JSON.stringify(worker.properties?.halt ?? {});
      assert(!workerKinds.includes('spec-contradiction'), 'worker-return itself does not carry the added kind');
    },
  },
  {
    id: 'I8 adversary-return is critic-findings plus unit',
    covers: ['I8'],
    fn: () => {
      const critic = schema('critic-findings.schema.json');
      const adversary = schema('adversary-return.schema.json');
      for (const field of critic.required) assert(adversary.required.includes(field), `adversary-return keeps ${field}`);
      assert(adversary.required.includes('unit'), 'adversary-return requires unit');
      assertEq(adversary.properties.unit.type, 'string', 'unit is a string');
    },
  },
  {
    id: 'I8 the scribe, steward, judge and test-builder shapes are the ones I8 states',
    covers: ['I8'],
    fn: () => {
      const shapes = {
        'scribe-return.schema.json': ['target', 'report', 'log_entry', 'assembled', 'missing'],
        'steward-return.schema.json': ['target', 'command', 'exit', 'stdout_tail', 'stderr_tail'],
        'judge-return.schema.json': ['rubric', 'subject', 'answers', 'verdict'],
        'test-builder-return.schema.json': ['map', 'checks', 'unverified', 'spec_findings'],
      };
      for (const [name, fields] of Object.entries(shapes)) {
        const required = schema(name).required ?? [];
        for (const field of fields) assert(required.includes(field), `${name} requires ${field}`);
      }
    },
  },
  {
    id: 'I8 planner-return carries the plan object',
    covers: ['I8'],
    fn: () => {
      const planner = schema('planner-return.schema.json');
      const text = JSON.stringify(planner);
      assert(/plan/.test(text), 'planner-return names the plan');
      assert(/units/.test(text) && /waves/.test(text), 'the plan object it carries is the plan of I13');
    },
  },
  {
    id: 'I8 the new shapes carry target and fix',
    covers: ['I8'],
    fn: () => {
      const NEW = ['planner-return.schema.json', 'interface-builder-return.schema.json', 'adversary-return.schema.json', 'judge-return.schema.json', 'scribe-return.schema.json', 'steward-return.schema.json', 'test-builder-return.schema.json'];
      for (const name of NEW) {
        const s = schema(name);
        assert((s.required ?? []).includes('target'), `${name} requires target`);
        assert(Object.prototype.hasOwnProperty.call(s.properties ?? {}, 'fix'), `${name} carries fix`);
      }
    },
  },
  {
    id: 'B75 every return fixture validates against its role-s schema',
    covers: ['B75'],
    fn: () => {
      const fixtures = returnFixtures();
      assert(fixtures.length >= 10, `the fixtures hold a return per role, found ${fixtures.length}`);
      for (const { file, rel, role } of fixtures) {
        const name = SCHEMA_OF[role];
        assert(name !== undefined, `${rel} names a role with a schema, got ${role}`);
        const errors = validateAgainst(schema(name), readJson(file));
        assertEq(errors, [], `${rel} against ${name}`);
      }
    },
  },
  {
    id: 'I13 the invalid-return shape is the one I13 states',
    covers: ['I13'],
    fn: () => {
      const s = schema('invalid-return.schema.json');
      for (const field of ['agent_id', 'agent_type', 'raw', 'errors']) {
        assert((s.required ?? []).includes(field), `invalid-return requires ${field}`);
      }
    },
  },
]);
