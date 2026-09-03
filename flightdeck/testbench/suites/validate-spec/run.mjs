// testbench/suites/validate-spec/run.mjs — T14: the regression suite of flightcrew/checks/validators/validate-spec.mjs (spec B22). Each case in cases.mjs mutates one field of a golden fixture, runs the validator on the result, and asserts the exact set of rule ids reported, the exit code, and any warnings.
// Usage: node flightdeck/testbench/suites/validate-spec/run.mjs   (no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exits 0 when every case passes, else 2)

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite, tmp, sh, FD, readJson, writeJson } from '../../lib/suite-lib.mjs';
import { cases } from './cases.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR = path.join(FD, 'flightcrew', 'checks', 'validators', 'validate-spec.mjs');
const GOLDENS = {
  v1: path.join(HERE, 'fixtures', 'agent-sample', 'spec.v1.json'),
  v2: path.join(HERE, 'fixtures', 'agent-sample', 'spec.v2.json'),
};

const q = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

/** Runs the validator on one file and splits its output into the distinct rule ids raised and the warning messages. */
function runValidator(file, args) {
  const r = sh([process.execPath, VALIDATOR, file, ...args].map(q).join(' '));
  const out = `${r.stdout}${r.stderr}`;
  const rules = [...new Set([...out.matchAll(/^error: .* — \[([^\]]+)\]/gm)].map((m) => m[1]))];
  const warns = [...out.matchAll(/^warn: {2}(.*)$/gm)].map((m) => m[1]);
  return { code: r.code, rules, warns, out };
}

function tail(text, lines = 5) {
  return String(text).split('\n').filter((l) => l.trim()).slice(-lines).join(' / ') || '(no output)';
}

const work = tmp('validate-spec');

const list = cases.map((c) => ({
  id: c.name,
  covers: ['B22'],
  fn: async () => {
    const spec = readJson(GOLDENS[c.base]);
    c.mutate?.(spec);
    const dir = path.join(work, c.name, c.dir ?? spec.name ?? 'unnamed');
    const file = path.join(dir, c.as ?? `spec.v${c.base === 'v2' ? 2 : 1}.json`);
    writeJson(file, spec);

    const got = runValidator(file, c.args ?? []);
    const wantRules = c.clean ? [] : (c.rules ?? []);
    const wantCode = c.code ?? (wantRules.length > 0 ? 2 : 0);
    const problems = [];

    if (got.code !== wantCode) problems.push(`exit ${got.code}, expected ${wantCode}`);
    const missing = wantRules.filter((r) => !got.rules.includes(r));
    const extra = got.rules.filter((r) => !wantRules.includes(r));
    if (missing.length) problems.push(`rules not raised: ${missing.join(', ')}`);
    if (extra.length) problems.push(`rules raised unexpectedly: ${extra.join(', ')}`);
    if (c.clean && got.warns.length) problems.push(`expected no warnings, got ${got.warns.length}`);
    for (const w of c.warns ?? []) {
      if (!got.warns.some((line) => line.includes(w))) problems.push(`no warning containing "${w}"`);
    }
    if (problems.length) throw new Error(`${problems.join('; ')} | output: ${tail(got.out)}`);
  },
}));

await suite('validate-spec', list);
