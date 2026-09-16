// testbench/suites/validate-spec/run.mjs — T14: the regression suite of flightcrew/checks/validators/validate-spec.mjs (spec B22). Each case in cases.mjs mutates one field of a golden fixture, runs the validator on the result, and asserts the exact set of rule ids reported, the exit code, and any warnings.
// Usage: node flightdeck/testbench/suites/validate-spec/run.mjs   (no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exits 0 when every case passes, else 2)

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { suite, tmp, sh, mkLaunchRepo, FD, readJson, writeJson } from '../../lib/suite-lib.mjs';
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

const VALIDATORS = path.join(FD, 'flightcrew', 'checks', 'validators');
const LINT = path.join(VALIDATORS, 'spec-readiness-lint.mjs');
const VALIDATE_ALL = path.join(VALIDATORS, 'validate-all.mjs');

/** Runs a validator script as a child process with the given arguments. */
function runScript(script, args, cwd) {
  const r = sh([process.execPath, script, ...args].map(q).join(' '), cwd ? { cwd } : {});
  return { ...r, out: `${r.stdout}${r.stderr}` };
}

/** The v1 golden, mutated, written as <dir>/<folder>/spec.v1.json under a fresh directory. Returns { dir, file }. */
function writeGolden(label, mutate, folder = 'agent-sample') {
  const spec = readJson(GOLDENS.v1);
  mutate?.(spec);
  const dir = path.join(work, label);
  const file = path.join(dir, folder, 'spec.v1.json');
  writeJson(file, spec);
  return { dir, file };
}

list.push(
  {
    id: 'flightdeck/flightcrew/checks/validators/validate-spec.mjs exits 0 on the draft golden spec',
    fn: async () => {
      const { file } = writeGolden('script-validate-spec-clean');
      const r = runScript(VALIDATOR, [file]);
      if (r.code !== 0) throw new Error(`exit ${r.code}, expected 0 | output: ${tail(r.out)}`);
      if (!/^ok: spec\.v1\.json is a valid spec$/m.test(r.stdout)) throw new Error(`no ok line on stdout | output: ${tail(r.out)}`);
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/validators/validate-spec.mjs exits 2 on a spec with two nodes sharing an id',
    fn: async () => {
      const { file } = writeGolden('script-validate-spec-duplicate', (s) => { s.behaviours.push({ ...s.behaviours[0] }); });
      const r = runScript(VALIDATOR, [file]);
      if (r.code !== 2) throw new Error(`exit ${r.code}, expected 2 | output: ${tail(r.out)}`);
      if (!/^error: .* — \[invariant-1\]\s*$/m.test(r.stderr)) throw new Error(`no invariant-1 error line on stderr | output: ${tail(r.out)}`);
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs exits 0 on a spec ready for a freeze',
    fn: async () => {
      const repo = mkLaunchRepo();
      const r = runScript(LINT, [path.join(repo.root, repo.specPath)], repo.root);
      if (r.code !== 0) throw new Error(`exit ${r.code}, expected 0 | output: ${tail(r.out, 12)}`);
      if (!/^ok: spec\.v1\.json is ready for a freeze$/m.test(r.stdout)) throw new Error(`no ok line on stdout | output: ${tail(r.out)}`);
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs exits 2 on a spec with an open question',
    fn: async () => {
      const { dir, file } = writeGolden('script-lint-open', (s) => {
        s.open_questions = [{ id: 'Q1', status: 'ok', text: 'Which format does the export write?' }];
      });
      const r = runScript(LINT, [file, '--repo', dir]);
      if (r.code !== 2) throw new Error(`exit ${r.code}, expected 2 | output: ${tail(r.out)}`);
      if (!/^error: Q1 is still open.* — \[lint-open-questions\]\s*$/m.test(r.stderr)) throw new Error(`no lint-open-questions line naming Q1 | output: ${tail(r.out)}`);
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/validators/validate-all.mjs exits 0 on a directory whose one spec is valid',
    fn: async () => {
      const { dir } = writeGolden('script-validate-all-clean');
      const r = runScript(VALIDATE_ALL, [dir]);
      if (r.code !== 0) throw new Error(`exit ${r.code}, expected 0 | output: ${tail(r.out)}`);
      if (!/^ok agent-sample\/spec\.v1\.json$/m.test(r.stdout)) throw new Error(`no ok line for the spec | output: ${tail(r.out)}`);
      if (!/^1 document: 1 ok, 0 warn, 0 FAIL$/m.test(r.stdout)) throw new Error(`no count line for one ok document | output: ${tail(r.out)}`);
    },
  },
  {
    id: 'flightdeck/flightcrew/checks/validators/validate-all.mjs exits 2 on a directory holding an invalid spec',
    fn: async () => {
      const { dir } = writeGolden('script-validate-all-fail', (s) => { delete s.behaviours; });
      const r = runScript(VALIDATE_ALL, [dir]);
      if (r.code !== 2) throw new Error(`exit ${r.code}, expected 2 | output: ${tail(r.out)}`);
      if (!/^FAIL agent-sample\/spec\.v1\.json$/m.test(r.stdout)) throw new Error(`no FAIL line for the spec | output: ${tail(r.out)}`);
      if (!/^error: .* — \[required\]\s*$/m.test(r.stderr)) throw new Error(`no required error line on stderr | output: ${tail(r.out)}`);
    },
  },
);

await suite({ name: 'validate-spec', covers: ['B1', 'B2'] }, list);
