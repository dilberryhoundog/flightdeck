#!/usr/bin/env node
// suites/flight-render — flight render: the dispatch it writes, its first line, every I9 slot's content, what it must not carry, the commit it makes, and the refusals. Covers B11, B12, B74, E11, I9.
import fs from 'node:fs';
import path from 'node:path';
import {
  DISPATCH_TEMPLATES, RUN_SCHEMAS, SUBAGENT_ROLES, TASK_KINDS, assert, assertEq, assertExit, assertIncludes,
  assertMatch, exists, flight, git, mkCoreLaunch, readJson, readText, suite, writeJson, writeText,
} from '../../lib/core-lib.mjs';

const render = (made, args) => flight(['render', ...args], { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
const dispatchAt = (made, role, target) => path.join(made.runDir, 'dispatches', `${role}-${target}.md`);

/** A --fill file holding object, returned as a repository-relative path. */
function fill(made, object) {
  const rel = 'fill.json';
  writeJson(path.join(made.root, rel), object);
  return rel;
}

/** The target every subagent role is rendered for, following the I8 storage names. */
const TARGET = {
  explorer: 'X1',
  planner: 'plan',
  steward: 'check',
  'interface-builder': 'U0',
  implementer: 'U1',
  'strong-worker': 'U2',
  adversary: 'U1',
  verifier: 'pass-1',
  critic: 'pass-1',
  judge: 'T5',
  scribe: 'report',
};

const FILL = {
  explorer: { question: 'How does the exporter shape a project?' },
  judge: { rubric: 'runs/run-1/checks/rubrics/T5.md', subject: 'src/export/index.mjs' },
  'strong-worker': { evidence: 'T2 failed: warning shape absent' },
  steward: { leaf: 'flightdeck/flightcrew/bin/flight check T1' },
  critic: { previous_findings: { verdict: 'fail', pass: 1, findings: [] } },
};

await suite('flight-render', [
  {
    id: 'B11 the dispatch is written at dispatches/<role>-<target>.md',
    covers: ['B11'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(render(made, ['implementer', 'U1']), 0, 'flight render implementer U1');
      assert(exists(dispatchAt(made, 'implementer', 'U1')), 'dispatches/implementer-U1.md exists');
    },
  },
  {
    id: 'I9 line 1 is "<role> · <target>"',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      assertEq(readText(dispatchAt(made, 'implementer', 'U1')).split('\n')[0], 'implementer · U1', 'line 1');
    },
  },
  {
    id: 'I9 the unit slots are filled from the plan unit the target names',
    covers: ['I9', 'B11'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      const spec = readJson(path.join(made.launchDir, 'specs', 'spec.v1.json'));
      for (const node of spec.behaviours.filter((b) => ['B1', 'B2'].includes(b.id))) {
        assertIncludes(text, node.text, `spec_refs carries the text of ${node.id}`);
      }
      assertIncludes(text, 'T1: B1 B2', "checks reads '<id>: <covers>'");
      assertIncludes(text, 'src/export/**', 'paths');
      assertIncludes(text, 'U0', 'depends_on');
      assertIncludes(text, made.launch, 'launch');
      assertMatch(text, /\b1\b/, 'run');
    },
  },
  {
    id: 'I9 the four domain slots carry their texts, one per line',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      const spec = readJson(path.join(made.launchDir, 'specs', 'spec.v1.json'));
      assertIncludes(text, spec.intent.text, 'intent');
      for (const domain of ['scope', 'constraints', 'interfaces', 'decisions']) {
        for (const node of spec[domain] ?? []) assertIncludes(text, node.text, `${domain} carries ${node.id}`);
      }
    },
  },
  {
    id: 'I9 the return shape slot carries the role-s return schema',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      const schema = readJson(path.join(RUN_SCHEMAS, 'worker-return.schema.json'));
      for (const field of schema.required) assertIncludes(text, field, `the return shape names ${field}`);
    },
  },
  {
    id: 'I9 no slot is left unfilled',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      assert(!/\{\{\s*\w+\s*\}\}/.test(text), `an unfilled slot survived: ${(/\{\{\s*\w+\s*\}\}/.exec(text) ?? [''])[0]}`);
    },
  },
  {
    id: 'I9 a dispatch carries no B or E text outside spec_refs and no check command',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['implementer', 'U1']);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      const spec = readJson(path.join(made.launchDir, 'specs', 'spec.v1.json'));
      const named = new Set(['B1', 'B2']);
      for (const node of [...spec.behaviours, ...spec.edges]) {
        if (named.has(node.id)) continue;
        assert(!text.includes(node.text), `the dispatch carries the text of ${node.id}, which its target does not name`);
      }
      for (const check of readJson(path.join(made.launchDir, 'specs', 'tests-map.v1.json')).checks) {
        assert(!text.includes(check.command), `the dispatch carries the command of ${check.id}`);
      }
    },
  },
  {
    id: 'B11 the planner is rendered from the planner template of the run-s liftoff task',
    covers: ['B11'],
    fn: () => {
      const made = mkCoreLaunch();
      assertExit(render(made, ['planner', 'plan']), 0, 'flight render planner plan');
      const text = readText(dispatchAt(made, 'planner', 'plan'));
      const literals = (file) =>
        readText(file)
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 24 && !line.includes('{{') && !line.startsWith('#'));
      const feature = literals(path.join(DISPATCH_TEMPLATES, 'planner-feature.template.md'));
      const migration = literals(path.join(DISPATCH_TEMPLATES, 'planner-migration.template.md'));
      const onlyFeature = feature.filter((line) => !migration.includes(line));
      const onlyMigration = migration.filter((line) => !feature.includes(line));
      assert(onlyFeature.length > 0 && onlyMigration.length > 0, 'the two planner templates differ in their literal lines');
      for (const line of onlyFeature) assertIncludes(text, line, 'the feature template lines are in the dispatch');
      for (const line of onlyMigration) assert(!text.includes(line), 'no migration template line is in the dispatch');
    },
  },
  {
    id: 'B74 every subagent role renders against the sample launch',
    covers: ['B74'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const role of SUBAGENT_ROLES) {
        const target = TARGET[role];
        const args = FILL[role] ? [role, target, '--fill', fill(made, FILL[role])] : [role, target];
        const result = render(made, args);
        assertExit(result, 0, `flight render ${role} ${target}: ${result.stdout}${result.stderr}`);
        const text = readText(dispatchAt(made, role, target));
        assertEq(text.split('\n')[0], `${role} · ${target}`, `line 1 of the ${role} dispatch`);
        assert(!/\{\{\s*\w+\s*\}\}/.test(text), `an unfilled slot survived in the ${role} dispatch`);
      }
    },
  },
  {
    id: 'B74 every planner kind renders',
    covers: ['B74'],
    fn: () => {
      const made = mkCoreLaunch();
      const liftoff = path.join(made.runDir, 'liftoff', 'sample.json');
      for (const kind of TASK_KINDS) {
        const object = readJson(liftoff);
        writeJson(liftoff, { ...object, task: kind });
        const result = render(made, ['planner', 'plan']);
        assertExit(result, 0, `flight render planner plan for task ${kind}: ${result.stdout}${result.stderr}`);
      }
    },
  },
  {
    id: 'I9 the explorer question and the judge rubric and subject reach their dispatches',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      render(made, ['explorer', 'X1', '--fill', fill(made, FILL.explorer)]);
      assertIncludes(readText(dispatchAt(made, 'explorer', 'X1')), FILL.explorer.question, 'the question slot');
      render(made, ['judge', 'T5', '--fill', fill(made, FILL.judge)]);
      const judged = readText(dispatchAt(made, 'judge', 'T5'));
      assertIncludes(judged, readText(path.join(made.runDir, 'checks', 'rubrics', 'T5.md')).split('\n')[0], "the rubric file's text");
      assertIncludes(judged, FILL.judge.subject, 'the subject path');
    },
  },
  {
    id: 'I9 a --fill previous_findings reaches the dispatch as the open findings',
    covers: ['I9'],
    fn: () => {
      const made = mkCoreLaunch();
      const findings = { verdict: 'fail', pass: 1, findings: [{ id: 'F1', severity: 'blocking', node: 'B2', unit: 'U1', text: 'the warning order is wrong', evidence: 'src/export/index.mjs:41' }] };
      const result = render(made, ['implementer', 'U1', '--fill', fill(made, { previous_findings: findings })]);
      assertExit(result, 0, `flight render with previous_findings: ${result.stdout}${result.stderr}`);
      const text = readText(dispatchAt(made, 'implementer', 'U1'));
      assertIncludes(text, 'the warning order is wrong', 'the finding text is in the dispatch');
      assertIncludes(text, 'F1', 'the finding id is in the dispatch');
    },
  },
  {
    id: 'B12 the dispatch is committed on the run branch before render exits',
    covers: ['B12'],
    fn: () => {
      const made = mkCoreLaunch();
      const rel = `flightdeck/launch/${made.launch}/runs/run-${made.run}/dispatches/implementer-U1.md`;
      assertExit(render(made, ['implementer', 'U1']), 0, 'flight render');
      const log = git(made.root, ['log', '-1', '--format=%H', '--', rel]).trim();
      assertMatch(log, /^[0-9a-f]{40}$/, 'git log -1 on the dispatch path resolves');
      assertEq(git(made.root, ['status', '--porcelain', '--', rel]).trim(), '', 'the dispatch is committed, not left in the working tree');
      assertEq(git(made.root, ['rev-parse', '--abbrev-ref', 'HEAD']).trim(), `run/${made.launch}-${made.run}`, 'the commit is on the run branch');
    },
  },
  {
    id: 'E11 an unknown role exits 1, names the role, and writes nothing',
    covers: ['E11'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = fs.readdirSync(path.join(made.runDir, 'dispatches')).sort();
      const result = render(made, ['inspector', 'U1']);
      assertExit(result, 1, 'an unknown role');
      assertMatch(`${result.stdout}${result.stderr}`, /inspector/, 'the message names the role');
      assertEq(fs.readdirSync(path.join(made.runDir, 'dispatches')).sort(), before, 'nothing is written');
    },
  },
  {
    id: 'E11 an unknown planner kind exits 1 and names the kind',
    covers: ['E11'],
    fn: () => {
      const made = mkCoreLaunch();
      const liftoff = path.join(made.runDir, 'liftoff', 'sample.json');
      writeJson(liftoff, { ...readJson(liftoff), task: 'refactor' });
      const result = render(made, ['planner', 'plan']);
      assertExit(result, 1, 'a planner kind with no template');
      assertMatch(`${result.stdout}${result.stderr}`, /refactor/, 'the message names the kind');
    },
  },
  {
    id: 'E11 a unit target absent from the plan exits 1, names the target, and writes nothing',
    covers: ['E11'],
    fn: () => {
      const made = mkCoreLaunch();
      const before = fs.readdirSync(path.join(made.runDir, 'dispatches')).sort();
      const result = render(made, ['implementer', 'U9']);
      assertExit(result, 1, 'an absent unit target');
      assertMatch(`${result.stdout}${result.stderr}`, /U9/, 'the message names the target');
      assertEq(fs.readdirSync(path.join(made.runDir, 'dispatches')).sort(), before, 'nothing is written');
    },
  },
]);
