// testbench/suites/bin-plan/run.mjs — regression suite T13: fc plan render validates plan.json and writes plan.md with fixed headings, deterministically, refusing an invalid plan without writing. Covers B21.
// Usage: node flightdeck/testbench/suites/bin-plan/run.mjs — no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers:' line and '<n>/<m> passed'; exit 0 when every case passes, else 2.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, mkActiveLaunch,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertExit,
} from '../../lib/suite-lib.mjs';

const HEADINGS = [
  '# Plan: export-html · export-html-1',
  '## Approach',
  '## Waves and units',
  '## Risks',
  '## Gates',
  '## Abandon triggers',
];

/** The sample launch with plan.md removed, so every render here is a fresh write. */
function launchWithoutPlanMd() {
  const L = mkActiveLaunch();
  fs.rmSync(path.join(L.launchDir, 'plan.md'), { force: true });
  return { ...L, planJson: path.join(L.launchDir, 'plan.json'), planMd: path.join(L.launchDir, 'plan.md') };
}
function render(L) {
  return fc(['plan', 'render'], { cwd: L.root, env: L.env });
}
function section(text, heading) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  assert(start >= 0, `heading ${JSON.stringify(heading)} not found`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#{1,2} /.test(l));
  return rest.slice(0, end === -1 ? rest.length : end);
}

await suite('bin-plan', [
  {
    id: 'render-writes-headings-in-order',
    covers: ['B21'],
    fn: async () => {
      const L = launchWithoutPlanMd();
      const r = render(L);
      assertExit(r, 0, 'fc plan render');
      assert(exists(L.planMd), 'plan.md written');
      const text = readText(L.planMd);
      const lines = text.split('\n');
      assertEq(lines[0], HEADINGS[0], 'first line is the plan title');
      let last = -1;
      for (const h of HEADINGS) {
        const i = lines.indexOf(h);
        assert(i > last, `heading ${JSON.stringify(h)} present after the previous one (found at ${i}, previous at ${last})`);
        last = i;
      }
      const headingLines = lines.filter((l) => /^#{1,2} /.test(l));
      assertEq(headingLines, HEADINGS, 'exactly the six headings, in order');
    },
  },
  {
    id: 'render-one-table-row-per-unit',
    covers: ['B21'],
    fn: async () => {
      const L = launchWithoutPlanMd();
      assertExit(render(L), 0, 'fc plan render');
      const plan = readJson(L.planJson);
      const rows = section(readText(L.planMd), '## Waves and units').filter((l) => l.startsWith('|'));
      assert(rows.length >= 2, `table has a header and a separator: ${JSON.stringify(rows)}`);
      assertMatch(rows[1], /^\|\s*:?-+/, 'second table line is the separator');
      const body = rows.slice(2);
      assertEq(body.length, plan.units.length, 'one row per unit');
      for (const u of plan.units) {
        const matching = body.filter((l) => new RegExp(`\\|\\s*${u.id}\\s*\\|`).test(l));
        assertEq(matching.length, 1, `exactly one row for ${u.id}`);
      }
    },
  },
  {
    id: 'render-is-deterministic',
    covers: ['B21'],
    fn: async () => {
      const L = launchWithoutPlanMd();
      assertExit(render(L), 0, 'first render');
      const first = fs.readFileSync(L.planMd);
      assert(first.length > 0, 'plan.md is not empty');
      fs.rmSync(L.planMd, { force: true });
      assertExit(render(L), 0, 'second render');
      const second = fs.readFileSync(L.planMd);
      assert(first.equals(second), `two renders of the same plan.json are byte-identical (${first.length} vs ${second.length} bytes)`);
      assertExit(render(L), 0, 'third render over the existing file');
      assert(first.equals(fs.readFileSync(L.planMd)), 'rendering over an existing plan.md leaves the same bytes');
    },
  },
  {
    id: 'render-invalid-plan-exits-2-without-writing',
    covers: ['B21'],
    fn: async () => {
      const L = launchWithoutPlanMd();
      const plan = readJson(L.planJson);
      plan.abandon_triggers = [];
      writeJson(L.planJson, plan);
      const r = render(L);
      assertExit(r, 2, 'render with empty abandon_triggers');
      assert(!exists(L.planMd), 'plan.md not written');
      writeText(L.planMd, 'SENTINEL\n');
      const r2 = render(L);
      assertExit(r2, 2, 'render again with the sentinel in place');
      assertEq(readText(L.planMd), 'SENTINEL\n', 'existing plan.md untouched');
    },
  },
  {
    id: 'render-schema-invalid-plan-exits-2',
    covers: ['B21'],
    fn: async () => {
      const L = launchWithoutPlanMd();
      const plan = readJson(L.planJson);
      delete plan.waves;
      writeJson(L.planJson, plan);
      assertExit(render(L), 2, 'render with waves missing');
      assert(!exists(L.planMd), 'plan.md not written');
      const plan2 = readJson(L.planJson);
      plan2.waves = [{ id: 'W0', mode: 'serial', units: ['U0'] }];
      plan2.units[1].checks = ['T99'];
      writeJson(L.planJson, plan2);
      assertExit(render(L), 2, 'render with a check id absent from the pinned map');
      assert(!exists(L.planMd), 'plan.md still not written');
    },
  },
]);
