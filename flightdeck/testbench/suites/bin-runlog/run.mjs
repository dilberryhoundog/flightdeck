// testbench/suites/bin-runlog/run.mjs — regression suite T12: fc runlog stub and the RUNLOG entry fc launch end inserts, for accepted, abandoned and partial outcomes. Covers B20.
// Usage: node flightdeck/testbench/suites/bin-runlog/run.mjs — no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers:' line and '<n>/<m> passed'; exit 0 when every case passes, else 2.
//
// The entry format asserted here: '## <ended date> · <spec name> · <launch name>' followed by '<field>: <value>' lines, inserted after the first heading of flightdeck/launch/RUNLOG.md (created with '# Run log' when absent), newest first. Accepted family: spec, kickoff, outcome, cost, kept: <fill>, reservation: <fill>. Abandoned or partial: spec, kickoff, outcome, cost, symptom (pre-filled from the ending event), seen on, cause, fixed on, change, watch reading '<fill>'; partial adds landed and abandoned listing the units.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, mkActiveLaunch,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const HASH = /^[0-9a-f]{7,40}$/;

function git(root, args) {
  const r = sh(`git ${args}`, { cwd: root });
  if (r.code !== 0) throw new Error(`git ${args} failed: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout.trim();
}
const head = (root) => git(root, 'rev-parse HEAD');
const runlogPath = (L) => path.join(L.root, 'flightdeck', 'launch', 'RUNLOG.md');
function patchLaunch(L, fn) {
  const p = path.join(L.launchDir, 'launch.json');
  const j = readJson(p);
  fn(j);
  writeJson(p, j);
  return j;
}
function appendEvent(L, event) {
  fs.appendFileSync(path.join(L.launchDir, 'events.jsonl'), `${JSON.stringify(event)}\n`);
}
/** The sample launch made consistent with its temporary repository, at phase report with the shipped evidence removed. */
function atHead(patch) {
  const L = mkActiveLaunch();
  const h = head(L.root);
  patchLaunch(L, (j) => {
    j.base_commit = h;
    j.lock_commit = h;
    j.phase = 'report';
    if (patch) patch(j);
  });
  fs.rmSync(path.join(L.launchDir, 'evidence'), { recursive: true, force: true });
  fs.mkdirSync(path.join(L.launchDir, 'evidence'));
  return L;
}
function greenEvidence(L) {
  const r = fc(['check', 'all'], { cwd: L.root, env: L.env });
  assertExit(r, 0, 'precondition: fc check all');
  const s = readJson(path.join(L.launchDir, 'evidence', 'summary.json'));
  assert(typeof s.commit === 'string' && HASH.test(s.commit) && head(L.root).startsWith(s.commit), `precondition: summary commit at HEAD (${s.commit})`);
}
/** A launch ended by hand (launch.json fields and the launch_end event) so fc runlog stub can be exercised on its own. */
function endedByHand(outcome, extra) {
  const L = mkActiveLaunch();
  patchLaunch(L, (j) => {
    j.status = outcome;
    j.outcome = outcome;
    j.ended = '2026-08-30T12:00:00Z';
    j.phase = 'ended';
    if (extra) extra(j);
  });
  appendEvent(L, { ts: '2026-08-30T12:00:00Z', event: 'launch_end', launch: L.launch, phase: 'ended', source: 'fc', detail: { outcome } });
  return { ...L, env: { ...L.env, FLIGHTCREW_LAUNCH: L.launch } };
}
/** The lines of the entry under the given heading (up to the next '## ' heading or the end of the file). */
function entry(text, heading) {
  const lines = text.split('\n');
  const start = lines.indexOf(heading);
  assert(start >= 0, `heading ${JSON.stringify(heading)} not found in:\n${text.slice(0, 600)}`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.startsWith('## '));
  return rest.slice(0, end === -1 ? rest.length : end);
}
function field(lines, name) {
  const line = lines.find((l) => l.startsWith(`${name}:`));
  assert(line !== undefined, `line '${name}:' missing from entry: ${JSON.stringify(lines)}`);
  return line.slice(name.length + 1).trim();
}
function assertFill(lines, name) {
  assertEq(field(lines, name), '<fill>', `${name} line reads <fill>`);
}
function assertCommonFields(lines, outcome) {
  assertIncludes(field(lines, 'spec'), 'export-html', 'spec line filled from launch.json');
  assertIncludes(field(lines, 'kickoff'), 'base@1+shape-session@1+task-feature@1', 'kickoff line filled from launch.json');
  assertEq(field(lines, 'outcome'), outcome, 'outcome line');
  const cost = field(lines, 'cost');
  assert(cost !== '' && cost !== '<fill>' && /\d/.test(cost), `cost line filled from evidence: ${JSON.stringify(cost)}`);
  assertFieldLineShapes(lines);
}
/**
 * Every field line of the entry has the form '<field>: <value>'. The observations block the run-log format puts last
 * ends the check: its body is prose from the critic pass, not fields, and continuation lines of a wrapped value are
 * skipped rather than read as fields.
 */
function assertFieldLineShapes(lines) {
  for (const l of lines) {
    if (l.trim() === '') continue;
    if (/^observations:/.test(l)) break;
    if (/^\s/.test(l) || l.startsWith('-')) continue;
    assertMatch(l, /^[a-z][a-z ]*: /, `entry line has the form <field>: <value>: ${JSON.stringify(l)}`);
  }
}
function assertDiagnosisFields(lines) {
  const symptom = field(lines, 'symptom');
  assert(symptom !== '' && symptom !== '<fill>', `symptom is pre-filled from the ending event: ${JSON.stringify(symptom)}`);
  for (const name of ['seen on', 'cause', 'fixed on', 'change', 'watch']) assertFill(lines, name);
}

await suite('bin-runlog', [
  {
    id: 'stub-creates-run-log-with-accepted-entry',
    covers: ['B20'],
    fn: async () => {
      const L = endedByHand('accepted');
      assert(!exists(runlogPath(L)), 'no RUNLOG.md before the stub');
      const r = fc(['runlog', 'stub'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc runlog stub');
      const text = readText(runlogPath(L));
      assertEq(text.split('\n')[0], '# Run log', 'file created with the run log heading');
      const heading = '## 2026-08-30 · export-html · export-html-1';
      const lines = entry(text, heading);
      assertCommonFields(lines, 'accepted');
      assertFill(lines, 'kept');
      assertFill(lines, 'reservation');
      assert(!lines.some((l) => l.startsWith('symptom:')), 'no symptom line for an accepted outcome');
      assert(!lines.some((l) => l.startsWith('landed:')), 'no landed line for an accepted outcome');
    },
  },
  {
    id: 'stub-inserts-after-first-heading-newest-first',
    covers: ['B20'],
    fn: async () => {
      const L = endedByHand('accepted');
      const older = '## 2026-01-01 · older-spec · older-1\nspec: older-spec v1 @ 0000000\nkickoff: base@1+shape-session@1+task-feature@1\noutcome: accepted\ncost: 1 agent · 0 stop blocks · 5 minutes · not recorded\nkept: yes\nreservation: none\n';
      writeText(runlogPath(L), `# Run log\n\n${older}`);
      const r = fc(['runlog', 'stub'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc runlog stub');
      const text = readText(runlogPath(L));
      assertEq(text.split('\n')[0], '# Run log', 'first heading kept');
      const iNew = text.indexOf('## 2026-08-30 · export-html · export-html-1');
      const iOld = text.indexOf('## 2026-01-01 · older-spec · older-1');
      assert(iNew > 0, 'new entry present');
      assert(iOld > iNew, `new entry sits above the older one (new ${iNew}, old ${iOld})`);
      assertIncludes(text, 'kept: yes', 'older entry preserved');
      assertEq(text.split('## 2026-08-30 · export-html · export-html-1').length, 2, 'entry inserted once');
    },
  },
  {
    id: 'stub-abandoned-carries-diagnosis-fields',
    covers: ['B20'],
    fn: async () => {
      const L = mkActiveLaunch();
      patchLaunch(L, (j) => { j.phase = 'report'; });
      const g = fc(['launch', 'gate', 'G3', 'exit', '--note', 'acceptance not reached'], { cwd: L.root, env: L.env });
      assertExit(g, 0, 'fc launch gate G3 exit records the ending the run-log entry is built from');
      const r = fc(['launch', 'end', 'abandoned', '--at', 'G3'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc launch end abandoned --at G3');
      const ended = readJson(path.join(L.launchDir, 'launch.json')).ended;
      assertMatch(ended, /^\d{4}-\d{2}-\d{2}T/, 'ended recorded');
      const text = readText(runlogPath(L));
      assertEq(text.split('\n')[0], '# Run log', 'file created with the run log heading');
      const lines = entry(text, `## ${ended.slice(0, 10)} · export-html · export-html-1`);
      assertCommonFields(lines, 'abandoned');
      assertDiagnosisFields(lines);
      assertMatch(field(lines, 'symptom'), /G3|acceptance not reached/, 'symptom carries text from the recorded ending event');
      assert(!lines.some((l) => l.startsWith('reservation:')), 'no reservation line for an abandoned outcome');
    },
  },
  {
    id: 'stub-partial-lists-landed-and-abandoned-units',
    covers: ['B20'],
    fn: async () => {
      const L = atHead();
      greenEvidence(L);
      const r = fc(['launch', 'end', 'partial', '--units', 'U0,U1'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc launch end partial --units U0,U1');
      const ended = readJson(path.join(L.launchDir, 'launch.json')).ended;
      const lines = entry(readText(runlogPath(L)), `## ${ended.slice(0, 10)} · export-html · export-html-1`);
      assertCommonFields(lines, 'partial');
      assertDiagnosisFields(lines);
      const landed = field(lines, 'landed');
      const abandoned = field(lines, 'abandoned');
      for (const u of ['U0', 'U1']) assertMatch(landed, new RegExp(`\\b${u}\\b`), `landed lists ${u}`);
      for (const u of ['U2', 'U3']) assertMatch(abandoned, new RegExp(`\\b${u}\\b`), `abandoned lists ${u}`);
      for (const u of ['U2', 'U3']) assert(!new RegExp(`\\b${u}\\b`).test(landed), `landed does not list ${u}`);
      for (const u of ['U0', 'U1']) assert(!new RegExp(`\\b${u}\\b`).test(abandoned), `abandoned does not list ${u}`);
    },
  },
  {
    id: 'end-accepted-inserts-accepted-entry',
    covers: ['B20'],
    fn: async () => {
      const L = atHead();
      greenEvidence(L);
      const r = fc(['launch', 'end', 'accepted'], { cwd: L.root, env: L.env });
      assertExit(r, 0, 'fc launch end accepted');
      const ended = readJson(path.join(L.launchDir, 'launch.json')).ended;
      const text = readText(runlogPath(L));
      assertEq(text.split('\n')[0], '# Run log', 'file created with the run log heading');
      const lines = entry(text, `## ${ended.slice(0, 10)} · export-html · export-html-1`);
      assertCommonFields(lines, 'accepted');
      assertFill(lines, 'kept');
      assertFill(lines, 'reservation');
      assert(!lines.some((l) => l.startsWith('symptom:')), 'no symptom line for an accepted outcome');
    },
  },
]);
