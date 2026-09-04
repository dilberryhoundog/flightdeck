// testbench/suites/bin-report/run.mjs — regression suite T10: fc report and the events edge cases it shares with fc events summary and fc budget (spec B17, B18, I12, E4, E21).
// Usage: node flightdeck/testbench/suites/bin-report/run.mjs; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exit 0 when every case passes, 2 otherwise.
//
// Every case renders launch/<L>/report.md from a temporary copy of the sample launch (mkActiveLaunch) and reads the markdown back: heading order, the header
// lines, the section placeholders when an input file is absent, the forbidden verdict strings, and the unparseable-line row. Nothing is asserted about how
// the report is assembled, only about the text spec I12 and design section 5.6 fix.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, mkActiveLaunch, readJson, writeJson, readText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const HEADINGS = [
  '# Run report · export-html · export-html-1',
  '## Ledger [checked · reviewed · stated]',
  '## Verification [checked]',
  '## Review [reviewed]',
  '## Phases [recorded · stated]',
  '## Agents [recorded · stated]',
  '## Failures and interventions [recorded]',
  '## Orchestrator notes [stated]',
];
const VERIFICATION_LINES = ['unverified:', 'quarantined:', 'test-file changes:', 'diff boundary:'];
const FORBIDDEN = ['ready to merge', 'should be accepted', 'accept this run'];

// ── helpers ──────────────────────────────────────────────────────────────────
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const reportPath = (l) => path.join(l.launchDir, 'report.md');
const eventsPath = (l) => path.join(l.launchDir, 'events.jsonl');
const fcAt = (l, args) => fc(args, { cwd: l.root, env: l.env });

function render(l) {
  const r = fcAt(l, ['report']);
  assertExit(r, 0, 'fc report');
  assert(exists(reportPath(l)), 'report.md written');
  return readText(reportPath(l));
}

function editLaunch(l, mutate) {
  const lj = readJson(launchJsonPath(l));
  mutate(lj);
  writeJson(launchJsonPath(l), lj);
}

/** Lines of the section that starts with the given heading text, up to the next '## ' heading. */
function section(md, heading) {
  const lines = md.split('\n');
  const start = lines.findIndex((line) => line.startsWith(heading));
  assert(start >= 0, `heading present: ${heading}`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start + 1, end);
}

const text = (lines) => lines.join('\n');

/** The header block: everything between the title line and the Ledger heading. */
function header(md) {
  const lines = md.split('\n');
  const ledger = lines.findIndex((line) => line.startsWith(HEADINGS[1]));
  assert(ledger > 0, 'Ledger heading present');
  return text(lines.slice(1, ledger));
}

/** The first content row of a section: table header and separator rows are skipped, blank lines ignored. */
function firstRow(lines) {
  const rows = lines.filter((line) => line.trim() !== '');
  if (rows.length >= 2 && /^\|?\s*:?-{2,}/.test(rows[1])) return rows[2] ?? '';
  return rows[0] ?? '';
}

// ── cases ────────────────────────────────────────────────────────────────────
await suite('bin-report', [
  {
    id: 'report-has-the-eight-headings-in-order',
    covers: ['B17', 'I12'],
    fn: async () => {
      const l = mkActiveLaunch();
      const md = render(l);
      assertEq(md.split('\n')[0], HEADINGS[0], 'the title is the first line');
      let last = -1;
      for (const heading of HEADINGS) {
        const at = md.indexOf(`${heading}\n`) >= 0 ? md.indexOf(`${heading}\n`) : (md.endsWith(heading) ? md.length - heading.length : -1);
        assert(at >= 0, `heading present on its own line: ${heading}`);
        assert(at > last, `heading in order: ${heading}`);
        last = at;
      }
    },
  },
  {
    id: 'report-header-carries-spec-kickoff-started-ended-outcome-cost-agents-phases',
    covers: ['I12'],
    fn: async () => {
      const l = mkActiveLaunch();
      const head = header(render(l));
      for (const field of ['spec', 'kickoff', 'started', 'ended', 'outcome', 'cost', 'agents', 'phases']) {
        assertMatch(head, new RegExp(`(^|\\n)[^\\n]*\\b${field}\\b`, 'i'), `header carries ${field}`);
      }
      assertIncludes(head, '[recorded]', 'phases are marked [recorded]');
      assertIncludes(head, 'export-html', 'header names the spec');
      assertIncludes(head, 'base@1+shape-session@1+task-feature@1', 'header names the kickoff version');
      assert(!/allow_draft/.test(head), 'allow_draft absent while false');
      assert(!/landed/.test(head), 'landed absent while unset');
    },
  },
  {
    id: 'report-header-shows-allow-draft-landed-accepted-and-abandoned-when-set',
    covers: ['I12'],
    fn: async () => {
      const l = mkActiveLaunch();
      editLaunch(l, (lj) => {
        lj.allow_draft = true;
        lj.landed = { commit: 'abc1234', pr: 'https://example.invalid/pr/7', integration_check: null };
        lj.accepted_units = ['U0', 'U1'];
        lj.abandoned_units = ['U2', 'U3'];
        lj.outcome = 'partial';
      });
      const head = header(render(l));
      assertIncludes(head, 'allow_draft', 'allow_draft shown when set');
      assertIncludes(head, 'landed', 'landed shown when set');
      assertIncludes(head, 'abc1234', 'landed commit shown');
      assertMatch(head, /accepted[^\n]*U1/i, 'accepted units listed');
      assertMatch(head, /abandoned[^\n]*U3/i, 'abandoned units listed');
    },
  },
  {
    id: 'report-verification-section-carries-the-four-lines-with-evidence-present',
    covers: ['B17'],
    fn: async () => {
      const l = mkActiveLaunch();
      const md = render(l);
      const verification = text(section(md, HEADINGS[2]));
      for (const line of VERIFICATION_LINES) assertIncludes(verification, line, `Verification carries '${line}'`);
      assert(!/not run/.test(verification), 'Verification does not read not run when summary.json exists');
      assertMatch(verification, /\b5\b/, 'Verification shows the pass count from summary.json');
      const review = text(section(md, HEADINGS[3]));
      assert(!/not run/.test(review), 'Review does not read not run when a pass file exists');
      assertIncludes(review, 'F1', 'Review lists finding F1');
      assertIncludes(review, 'F2', 'Review lists finding F2');
      const ledger = text(section(md, HEADINGS[1]));
      assert(!/plan: none/.test(ledger), 'ledger does not say plan: none when plan.json exists');
      for (const unit of ['U0', 'U1', 'U2', 'U3']) assertIncludes(ledger, unit, `ledger names ${unit}`);
      const notes = text(section(md, HEADINGS[7]));
      assertIncludes(notes, 'U0 took two iterations', 'Orchestrator notes carry notes.md');
    },
  },
  {
    id: 'report-placeholders-when-summary-review-plan-and-events-are-absent',
    covers: ['B17'],
    fn: async () => {
      const l = mkActiveLaunch();
      fs.rmSync(path.join(l.launchDir, 'evidence', 'summary.json'));
      fs.rmSync(path.join(l.launchDir, 'review'), { recursive: true, force: true });
      fs.rmSync(path.join(l.launchDir, 'plan.json'));
      fs.rmSync(eventsPath(l));
      const md = render(l);
      let last = -1;
      for (const heading of HEADINGS) {
        const at = md.indexOf(heading);
        assert(at > last, `heading present and in order: ${heading}`);
        last = at;
      }
      const verification = text(section(md, HEADINGS[2]));
      assertIncludes(verification, 'not run', 'Verification reads not run without summary.json');
      for (const line of VERIFICATION_LINES) assertIncludes(verification, line, `Verification still carries '${line}'`);
      assertIncludes(text(section(md, HEADINGS[3])), 'not run', 'Review reads not run without a pass file');
      const ledger = text(section(md, HEADINGS[1]));
      assertIncludes(ledger, 'plan: none', 'ledger reads plan: none without plan.json');
      const dashes = (ledger.match(/—/g) ?? []).length;
      assert(dashes >= 4, `the ledger's four lists each show — when empty (found ${dashes})`);
      for (const heading of [HEADINGS[4], HEADINGS[5], HEADINGS[6]]) {
        assertIncludes(text(section(md, heading)), 'no events recorded', `${heading} reads no events recorded`);
      }
    },
  },
  {
    id: 'report-carries-no-acceptance-verdict-strings',
    covers: ['B18'],
    fn: async () => {
      const l = mkActiveLaunch();
      const full = render(l).toLowerCase();
      for (const phrase of FORBIDDEN) assert(!full.includes(phrase), `report never says '${phrase}'`);
      fs.rmSync(path.join(l.launchDir, 'evidence', 'summary.json'));
      fs.rmSync(path.join(l.launchDir, 'review'), { recursive: true, force: true });
      const sparse = render(l).toLowerCase();
      for (const phrase of FORBIDDEN) assert(!sparse.includes(phrase), `report with absent inputs never says '${phrase}'`);
    },
  },
  {
    id: 'malformed-event-line-is-counted-as-unparseable-and-exit-stays-0',
    covers: ['E4'],
    fn: async () => {
      const l = mkActiveLaunch();
      fs.appendFileSync(eventsPath(l), 'this line is not json {\n');
      const summary = fcAt(l, ['events', 'summary']);
      assertExit(summary, 0, 'fc events summary with a malformed line');
      assertIncludes(summary.stdout, 'unparseable: 1', 'summary counts the malformed line');
      assertIncludes(summary.stdout, 'SubagentStart', 'summary still lists the parseable events');
      const md = render(l);
      const failures = section(md, HEADINGS[6]);
      assertIncludes(firstRow(failures), 'unparseable: 1', 'the first row of Failures is the unparseable count');
      assertIncludes(text(section(md, HEADINGS[4])), 'plan', 'Phases still rendered from the parseable lines');
    },
  },
  {
    id: 'absent-events-file-is-treated-as-empty-by-summary-budget-and-report',
    covers: ['E21'],
    fn: async () => {
      const l = mkActiveLaunch();
      fs.rmSync(eventsPath(l));
      const summary = fcAt(l, ['events', 'summary']);
      assertExit(summary, 0, 'fc events summary without events.jsonl');
      assertIncludes(summary.stdout, 'unparseable: 0', 'summary reports zero unparseable lines');
      const budget = fcAt(l, ['budget']);
      assertExit(budget, 0, 'fc budget without events.jsonl');
      const budgetFile = path.join(l.launchDir, 'evidence', 'budget.json');
      assert(exists(budgetFile), 'budget.json written');
      assertEq(readJson(budgetFile).counts.agents.count, 0, 'no agents counted');
      const md = render(l);
      for (const heading of [HEADINGS[4], HEADINGS[5], HEADINGS[6]]) {
        assertIncludes(text(section(md, heading)), 'no events recorded', `${heading} reads no events recorded`);
      }
      assert(!exists(eventsPath(l)) || readText(eventsPath(l)).trim() === '', 'no command recorded an event');
    },
  },
]);
