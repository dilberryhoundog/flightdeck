// testbench/suites/bin-evidence/run.mjs — regression suite T11: fc evidence and the self-contained evidence.html it writes (spec B19, B37).
// Usage: node flightdeck/testbench/suites/bin-evidence/run.mjs; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exit 0 when every case passes, 2 otherwise.
//
// Every case renders launch/<L>/evidence.html from a temporary copy of the sample launch (mkActiveLaunch) and inspects the markup with regular expressions:
// forbidden elements and external references (B19), one pre element per evidence file carrying command, exit and every tail line verbatim, the named sections
// with '—' when empty, the changed-since-lock counts, and the header (B37). The page is never executed; only its text is read.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, mkActiveLaunch, readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const SECTIONS = ['Unverified', 'Quarantined', 'Test-file changes', 'Boundary', 'Changed since lock', 'Findings', 'Phases', 'Agents', 'Failures'];
// Any element a section may be labelled with, for the "is a section headed X present" test.
const LABEL_RE = /<(h[1-6]|summary|legend|caption|th)\b[^>]*>([\s\S]*?)<\/\1>/gi;
// The elements that start a section: a table header cell sits inside a section and never ends it.
const HEADING_RE = /<(h[1-6]|summary|legend|caption)\b[^>]*>([\s\S]*?)<\/\1>/gi;

// ── helpers ──────────────────────────────────────────────────────────────────
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const evidenceDir = (l) => path.join(l.launchDir, 'evidence');
const pagePath = (l) => path.join(l.launchDir, 'evidence.html');
const git = (root, args) => sh(`git ${args}`, { cwd: root });
const headSha = (root) => git(root, 'rev-parse HEAD').stdout.trim();
const fcAt = (l, args) => fc(args, { cwd: l.root, env: l.env });

function ready() {
  const l = mkActiveLaunch();
  const lj = readJson(launchJsonPath(l));
  const head = headSha(l.root);
  lj.base_commit = head;
  lj.lock_commit = head;
  writeJson(launchJsonPath(l), lj);
  return l;
}

function render(l) {
  const r = fcAt(l, ['evidence']);
  assertExit(r, 0, 'fc evidence');
  assert(exists(pagePath(l)), 'evidence.html written');
  return readText(pagePath(l));
}

/** Tags stripped, the five basic entities decoded: what a reader of the page sees. */
function decode(html) {
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;|&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** What a reader sees, with each tag boundary kept as a space so adjacent table cells stay separate tokens, and runs of whitespace collapsed. */
function decodeText(html) {
  return decode(html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

/** Every element a section may be labelled with, decoded. */
function labels(html) {
  const found = [];
  const re = new RegExp(LABEL_RE.source, 'gi');
  let m;
  while ((m = re.exec(html)) !== null) found.push(decodeText(m[2]));
  return found;
}

function headings(html) {
  const found = [];
  const re = new RegExp(HEADING_RE.source, 'gi');
  let m;
  while ((m = re.exec(html)) !== null) found.push({ title: decodeText(m[2]), start: m.index, end: m.index + m[0].length });
  return found;
}

const titled = (title, name) => title.toLowerCase() === name.toLowerCase() || title.toLowerCase().startsWith(`${name.toLowerCase()} `) || title.toLowerCase().startsWith(`${name.toLowerCase()}:`);

/** Decoded text of the section headed by title (case-insensitive prefix match), up to the next section heading. */
function sectionText(html, title) {
  const all = headings(html);
  const i = all.findIndex((h) => titled(h.title, title));
  assert(i >= 0, `section headed ${title} present (headings found: ${all.map((h) => h.title).join(' | ').slice(0, 300)})`);
  const next = all[i + 1]?.start ?? html.length;
  return decodeText(html.slice(all[i].end, next));
}

/** The decoded text between `target` and whichever of `others` comes next: the cells belonging to one row, however the row is marked up. */
function between(text, target, others) {
  const start = text.indexOf(target);
  assert(start >= 0, `${target} listed`);
  const from = start + target.length;
  let end = text.length;
  for (const other of others) {
    const i = text.indexOf(other, from);
    if (i >= 0 && i < end) end = i;
  }
  return text.slice(from, end);
}

function preBlocks(html) {
  const blocks = [];
  const re = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi;
  let m;
  while ((m = re.exec(html)) !== null) blocks.push(decode(m[1]));
  return blocks;
}

function styleText(html) {
  const parts = [];
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parts.push(m[1]);
  for (const m of html.matchAll(/\bstyle\s*=\s*("[^"]*"|'[^']*')/gi)) parts.push(m[1]);
  return parts.join('\n');
}

function evidenceIds(l) {
  return fs.readdirSync(evidenceDir(l)).filter((n) => /^T\d+\.json$/.test(n)).map((n) => n.slice(0, -5)).sort();
}

const LAST_EVENT_TS = '2026-08-30T11:52:00Z';

// ── cases ────────────────────────────────────────────────────────────────────
await suite('bin-evidence', [
  {
    id: 'evidence-html-is-self-contained',
    covers: ['B19'],
    fn: async () => {
      const l = ready();
      const html = render(l);
      assert(html.length > 0, 'evidence.html is not empty');
      for (const tag of ['script', 'link', 'iframe', 'object', 'form']) {
        assert(!new RegExp(`<\\s*${tag}\\b`, 'i').test(html), `no ${tag} element`);
      }
      assert(!/\b(src|href|srcset|action)\s*=\s*["']?\s*(https?:|\/\/)/i.test(html), 'no src, href, srcset or action pointing at http:, https: or //');
      const styles = styleText(html);
      assert(!/url\(/i.test(styles), 'no url( in styles');
      assert(!/@import/i.test(styles), 'no @import in styles');
    },
  },
  {
    id: 'hostile-check-output-is-shown-verbatim-and-escaped-never-injected',
    covers: ['B19', 'B37'],
    fn: async () => {
      const l = ready();
      const hostile = ['<script>alert(1)</script>', '<link rel="stylesheet" href="https://example.invalid/x.css">', 'href="https://example.invalid/page"', 'background: url(https://example.invalid/i.png) @import "x"'];
      const t1Path = path.join(evidenceDir(l), 'T1.json');
      const t1 = readJson(t1Path);
      t1.stdout_tail = [...t1.stdout_tail, ...hostile];
      t1.stderr_tail = ['<form action="https://example.invalid/post"></form>'];
      writeJson(t1Path, t1);
      const html = render(l);
      for (const tag of ['script', 'link', 'iframe', 'object', 'form']) {
        assert(!new RegExp(`<\\s*${tag}\\b`, 'i').test(html), `no ${tag} element after hostile output`);
      }
      // Attributes are what B19 forbids; the same characters sitting in the text of a pre element are output shown verbatim, not a reference.
      const outsidePre = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/gi, ' ');
      assert(!/\b(src|href|srcset|action)\s*=\s*["']?\s*(https?:|\/\/)/i.test(outsidePre), 'no external reference after hostile output');
      assert(!/url\(/i.test(styleText(html)) && !/@import/i.test(styleText(html)), 'hostile output never reaches the styles');
      const pres = preBlocks(html);
      const block = pres.find((p) => p.includes(t1.command) && hostile.every((line) => p.includes(line)) && p.includes(t1.stderr_tail[0]));
      assert(block, 'a pre element shows every hostile line verbatim (escaped)');
    },
  },
  {
    id: 'one-pre-element-per-evidence-file-with-command-exit-and-tails',
    covers: ['B37'],
    fn: async () => {
      const l = ready();
      writeJson(path.join(evidenceDir(l), 'T6.json'), {
        id: 'T6', command: 'node scripts/never-there.mjs --probe', cwd: l.root, exit: 7, verdict: 'fail',
        stdout_tail: ['probe line one', 'probe line "two" & <three>'], stderr_tail: ['probe: FAIL something specific', 'probe: second stderr line'],
        duration_ms: 12, ran_at: '2026-08-30T10:46:00Z', commit: '18293a4', covers: ['B1'], phase: 'verify',
      });
      const html = render(l);
      const pres = preBlocks(html);
      for (const id of evidenceIds(l)) {
        const ev = readJson(path.join(evidenceDir(l), `${id}.json`));
        const lines = [...ev.stdout_tail, ...ev.stderr_tail];
        const block = pres.find((p) => p.includes(ev.command) && lines.every((line) => p.includes(line)));
        assert(block, `${id}: a pre element carries the command and every tail line verbatim`);
        assertIncludes(block, String(ev.exit), `${id}: the pre element carries the exit code ${ev.exit}`);
      }
      const t6 = pres.find((p) => p.includes('node scripts/never-there.mjs --probe'));
      assertMatch(t6, /\b7\b/, 'T6 pre carries exit 7');
      assertIncludes(t6, 'probe line "two" & <three>', 'T6 pre carries the line with quotes, ampersand and angle brackets verbatim');
    },
  },
  {
    id: 'named-sections-present-and-header-names-phase-and-last-event-time',
    covers: ['B37'],
    fn: async () => {
      const l = ready();
      const html = render(l);
      const titles = labels(html);
      for (const name of SECTIONS) {
        assert(titles.some((t) => titled(t, name)), `section headed ${name} present`);
      }
      const findings = sectionText(html, 'Findings');
      assertIncludes(findings, 'F1', 'Findings lists F1');
      assertIncludes(findings, 'F2', 'Findings lists F2');
      const phases = sectionText(html, 'Phases');
      assertIncludes(phases, 'contracts', 'Phases lists the recorded phase changes');
      const agents = sectionText(html, 'Agents');
      assertIncludes(agents, 'agent-u1', 'Agents lists the recorded agents');
      const first = headings(html)[0];
      assert(first, 'the page has a header');
      const headerText = decodeText(html.slice(0, headings(html).find((h) => SECTIONS.some((s) => titled(h.title, s)))?.start ?? html.length));
      assertIncludes(headerText, 'review', 'header names the phase');
      assert(headerText.includes(LAST_EVENT_TS) || headerText.includes('2026-08-30 11:52') || headerText.includes('2026-08-30T11:52'), `header names the timestamp of the last event (${LAST_EVENT_TS})`);
      const boundary = sectionText(html, 'Boundary');
      assertIncludes(boundary, 'src/export/index.mjs', 'Boundary shows the boundary evidence');
    },
  },
  {
    id: 'every-named-section-shows-a-dash-when-empty',
    covers: ['B37'],
    fn: async () => {
      const l = ready();
      fs.rmSync(path.join(l.launchDir, 'events.jsonl'));
      fs.rmSync(path.join(l.launchDir, 'review'), { recursive: true, force: true });
      fs.rmSync(path.join(l.launchDir, 'returns', 'verify-1.json'));
      for (const name of ['boundary.json', 'locked.json', 'budget.json']) fs.rmSync(path.join(evidenceDir(l), name), { force: true });
      const html = render(l);
      for (const name of SECTIONS) {
        const body = sectionText(html, name);
        assertIncludes(body, '—', `${name} shows — when empty`);
      }
    },
  },
  {
    id: 'changed-since-lock-lists-each-path-with-added-and-removed-counts',
    covers: ['B37'],
    fn: async () => {
      const l = ready();
      fs.appendFileSync(path.join(l.root, 'src/export/index.mjs'), '\n// evidence probe line one\n// evidence probe line two\n');
      writeText(path.join(l.root, 'src/export/probe.mjs'), 'export const probe = 1;\nexport const probe2 = 2;\nexport const probe3 = 3;\n');
      assertExit(git(l.root, 'add -A'), 0, 'git add');
      assertExit(git(l.root, 'commit -q --no-verify -m "changes after lock"'), 0, 'git commit');
      assertExit(fcAt(l, ['boundary']), 0, 'fc boundary after the change');
      const html = render(l);
      const changed = sectionText(html, 'Changed since lock');
      assertIncludes(changed, 'src/export/index.mjs', 'changed path listed');
      assertIncludes(changed, 'src/export/probe.mjs', 'added file listed');
      const indexCounts = between(changed, 'src/export/index.mjs', ['src/export/probe.mjs']);
      assertMatch(indexCounts, /\b2\b/, 'index.mjs shows 2 added lines');
      assertMatch(indexCounts, /\b0\b/, 'index.mjs shows 0 removed lines');
      const probeCounts = between(changed, 'src/export/probe.mjs', ['src/export/index.mjs']);
      assertMatch(probeCounts, /\b3\b/, 'probe.mjs shows 3 added lines');
      assert(!changed.includes('—'), 'Changed since lock does not show — when a path changed');
    },
  },
]);
