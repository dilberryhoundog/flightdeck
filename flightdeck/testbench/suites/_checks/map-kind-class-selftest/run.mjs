// testbench/suites/_checks/map-kind-class-selftest/run.mjs — T15 (E9): a tests map with a check that carries no kind or no class is refused, naming the check.
// Usage: node flightdeck/testbench/suites/_checks/map-kind-class-selftest/run.mjs; exit 0 when every fixture map is judged as expected, 2 otherwise.

import path from 'node:path';
import { ensure, FIXTURES, readJson, report } from '../lib/check-lib.mjs';
import { mapClassProblems } from '../lib/rules.mjs';

function problemsOf(name) {
  const parsed = readJson(path.join(FIXTURES, 'maps', name));
  if (!parsed.ok) throw new Error(parsed.error);
  return mapClassProblems(parsed.value, name);
}

await report(['E9'], [
  { name: 'a map whose every check carries a kind and a class is admitted', fn: () => { const p = problemsOf('good.json'); ensure(p.length === 0, p.join('; ')); } },
  {
    name: 'a map with a check that carries no class is refused naming that check',
    fn: () => { const p = problemsOf('no-class.json'); ensure(p.length === 1 && /check T2 carries no class/.test(p[0]), `got: ${p.join('; ') || 'none'}`); },
  },
  {
    name: 'a map with a check that carries no kind is refused naming that check',
    fn: () => { const p = problemsOf('no-kind.json'); ensure(p.length === 1 && /check T1 carries no kind/.test(p[0]), `got: ${p.join('; ') || 'none'}`); },
  },
  {
    name: 'a map with a kind or class outside the named sets is refused naming the check',
    fn: () => { const p = problemsOf('unknown-kind-and-class.json'); ensure(p.length === 2 && p.every((x) => x.includes('check T3')), `got: ${p.join('; ') || 'none'}`); },
  },
]);
