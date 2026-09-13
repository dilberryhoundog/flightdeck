#!/usr/bin/env node
// suites/workflow-static-scan — C13 read over the workflow suite as a static scan, and E20: a drifted inline schema fails the scan, naming the workflow and the schema.
import fs from 'node:fs';
import path from 'node:path';
import { CORE_WORKFLOWS, RUN_SCHEMAS, WORKFLOW_NAMES, assert, assertEq, exists, listFiles, readText, suite } from '../../lib/core-lib.mjs';
import { nestedWorkflowNames, scanSuite, scanWorkflow } from '../../lib/workflow-scan.mjs';
import { workflowMeta } from '../../lib/workflow-stub.mjs';

const sources = () => Object.fromEntries(
  listFiles(CORE_WORKFLOWS)
    .filter((name) => name.endsWith('.js'))
    .map((name) => [name.replace(/\.js$/, ''), readText(path.join(CORE_WORKFLOWS, name))]),
);

const schemas = () => Object.fromEntries(
  (exists(RUN_SCHEMAS) ? listFiles(RUN_SCHEMAS) : [])
    .filter((name) => name.endsWith('.json'))
    .map((name) => [name, readText(path.join(RUN_SCHEMAS, name))]),
);

await suite('workflow-static-scan', [
  {
    id: 'C13 the workflow suite passes the static scan',
    covers: ['C13'],
    fn: () => {
      const found = sources();
      assert(Object.keys(found).length > 0, 'the workflow suite has scripts');
      const findings = scanSuite(found, { schemas: schemas() });
      assertEq(findings.map((f) => `${f.rule}: ${f.detail}`), [], 'the scan finds nothing');
    },
  },
  {
    id: 'C13 every workflow of I14 is there and its meta.name is its file name',
    covers: ['C13'],
    fn: () => {
      const found = sources();
      for (const name of WORKFLOW_NAMES) {
        assert(found[name] !== undefined, `workflows/${name}.js exists`);
        const meta = workflowMeta(name);
        assert(meta !== null, `${name} declares meta`);
        assertEq(meta.name, name, `${name}: meta.name is the file name`);
      }
    },
  },
  {
    id: 'C13 workflow() nests at most one level',
    covers: ['C13'],
    fn: () => {
      const found = sources();
      for (const [name, source] of Object.entries(found)) {
        for (const called of nestedWorkflowNames(source)) {
          const deeper = nestedWorkflowNames(found[called] ?? '');
          assertEq(deeper, [], `${name} calls ${called}, and ${called} calls ${deeper.join(', ')}`);
        }
      }
    },
  },
  {
    id: 'C13 the scan catches a workflow that reaches the filesystem, the shell, the clock or chance',
    covers: ['C13'],
    fn: () => {
      const cases = [
        ['no-filesystem', "const text = readFileSync('plan.json');\nreturn { plan: text };\n"],
        ['no-shell', "const out = execSync('ls');\nreturn { plan: out };\n"],
        ['no-clock', 'const started = Date.now();\nreturn { started };\n'],
        ['no-random', 'const pick = Math.random();\nreturn { pick };\n'],
        ['top-level-return', 'const meta = { name: "fc-nothing" };\nconst answer = 1;\n'],
      ];
      for (const [rule, source] of cases) {
        const findings = scanWorkflow('fc-probe', source, { schemas: schemas() });
        assert(findings.some((f) => f.rule === rule), `the scan catches ${rule}: ${JSON.stringify(findings)}`);
      }
    },
  },
  {
    id: 'C13 the scan catches an agent() call with no agentType',
    covers: ['C13'],
    fn: () => {
      const findings = scanWorkflow('fc-probe', 'const r = await agent({ prompt: "do it" });\nreturn { r };\n', { schemas: schemas() });
      assert(findings.some((f) => f.rule === 'agent-type'), `the scan catches a nameless agent call: ${JSON.stringify(findings)}`);
    },
  },
  {
    id: 'E20 an inline schema that differs from the file it copies fails the scan, naming the workflow and the schema',
    covers: ['E20'],
    fn: () => {
      const all = schemas();
      const name = 'worker-return.schema.json';
      assert(all[name] !== undefined, `schemas/run/${name} is there to copy`);
      const held = `const r = await agent({ agentType: 'implementer', schema: ${all[name].trim()} });\nreturn { r };\n`;
      assertEq(scanWorkflow('fc-probe', held, { schemas: all }).filter((f) => f.rule === 'schema-byte-equal'), [], 'a byte-equal copy passes');
      const drifted = JSON.parse(all[name]);
      drifted.required = [...drifted.required, 'invented_field'];
      const source = `const r = await agent({ agentType: 'implementer', schema: ${JSON.stringify(drifted, null, 2)} });\nreturn { r };\n`;
      const findings = scanWorkflow('fc-drifted', source, { schemas: all });
      const drift = findings.find((f) => f.rule === 'schema-byte-equal');
      assert(drift !== undefined, `the scan catches the drift: ${JSON.stringify(findings)}`);
      assert(drift.detail.includes('fc-drifted'), 'the finding names the workflow');
      assert(/worker-return|Worker return/i.test(drift.detail), `the finding names the schema: ${drift.detail}`);
    },
  },
  {
    id: 'C13 every inline schema in the shipped suite is byte-equal to its file',
    covers: ['C13', 'E20'],
    fn: () => {
      const all = schemas();
      for (const [name, source] of Object.entries(sources())) {
        const findings = scanWorkflow(name, source, { schemas: all }).filter((f) => ['schema-byte-equal', 'schema-inline'].includes(f.rule));
        assertEq(findings.map((f) => f.detail), [], `${name}: every inline schema is a byte-equal copy`);
      }
    },
  },
]);
