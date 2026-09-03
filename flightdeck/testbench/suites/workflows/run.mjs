// testbench/suites/workflows/run.mjs — T29 (spec B39): every flightcrew/workflows/*.js passes node --experimental-default-type=module --check, opens with export const meta whose name equals the filename, uses no clock or randomness, and inlines schemas identical to flightcrew/schemas/*.json.
// Usage: node flightdeck/testbench/suites/workflows/run.mjs; exit 0 when every case passes, 2 otherwise. Scripts are read, never executed.

import fs from 'node:fs';
import path from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { suite, sh, WORKFLOWS, SCHEMAS, readJson, readText, exists, assert, assertEq, assertIncludes, assertExit } from '../../lib/suite-lib.mjs';
import { firstStatement, metaLiteral, schemaLiterals, agentCallCount } from './extract.mjs';

const NAMED = ['fc-implement', 'fc-review', 'fc-explore'];
const REQUIRED_SCHEMAS = {
  'fc-implement': ['worker-return.schema.json'],
  'fc-review': ['critic-findings.schema.json'],
  'fc-explore': ['explorer-return.schema.json'],
};
const FORBIDDEN = ['Date.now', 'new Date', 'Math.random'];

function scripts() {
  assert(exists(WORKFLOWS), 'flightcrew/workflows exists');
  const files = fs.readdirSync(WORKFLOWS).filter((f) => f.endsWith('.js')).sort();
  for (const name of NAMED) assertIncludes(files, `${name}.js`, 'workflow script present');
  return files.map((f) => ({ name: f, base: path.basename(f, '.js'), file: path.join(WORKFLOWS, f), src: readText(path.join(WORKFLOWS, f)) }));
}

function schemaFiles() {
  assert(exists(SCHEMAS), 'flightcrew/schemas exists');
  return fs.readdirSync(SCHEMAS).filter((f) => f.endsWith('.json')).sort().map((f) => ({ name: f, json: readJson(path.join(SCHEMAS, f)) }));
}

await suite('workflows', [
  {
    id: 'passes-node-module-check',
    covers: ['B39'],
    fn: () => {
      for (const s of scripts()) {
        const r = sh(`"${process.execPath}" --experimental-default-type=module --check "${s.file}"`);
        assertExit(r, 0, `node --experimental-default-type=module --check ${s.name}`);
      }
    },
  },
  {
    id: 'first-statement-is-export-const-meta-with-name-equal-to-filename',
    covers: ['B39'],
    fn: () => {
      for (const s of scripts()) {
        assert(/^export const meta$/.test(firstStatement(s.src)), `${s.name}: first statement is 'export const meta' (found '${firstStatement(s.src)}')`);
        const meta = metaLiteral(s.src);
        assertEq(meta.name, s.base, `${s.name}: meta.name equals the filename`);
      }
    },
  },
  {
    id: 'no-date-now-new-date-or-math-random',
    covers: ['B39'],
    fn: () => {
      const problems = [];
      for (const s of scripts()) for (const token of FORBIDDEN) if (s.src.includes(token)) problems.push(`${s.name} contains ${token}`);
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'schema-literals-equal-the-schema-files',
    covers: ['B39'],
    fn: () => {
      const schemas = schemaFiles();
      for (const s of scripts()) {
        assert(agentCallCount(s.src) > 0, `${s.name} dispatches through agent()`);
        const literals = schemaLiterals(s.src);
        assert(literals.length > 0, `${s.name} passes at least one schema literal to agent()`);
        const matched = [];
        literals.forEach((literal, i) => {
          const hit = schemas.find((schema) => isDeepStrictEqual(literal, schema.json));
          assert(hit, `${s.name}: schema literal ${i + 1} equals no file under flightcrew/schemas/ (keys: ${Object.keys(literal).join(', ')})`);
          matched.push(hit.name);
        });
        for (const required of REQUIRED_SCHEMAS[s.base] ?? []) assertIncludes(matched, required, `${s.name} inlines its return schema`);
      }
    },
  },
]);
