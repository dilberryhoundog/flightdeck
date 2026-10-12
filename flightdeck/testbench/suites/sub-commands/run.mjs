// testbench/suites/sub-commands/run.mjs — names the runner's subcommands that the e2e sequence does not reach (spec B1, B2): each case runs one subcommand as a child process against a temporary copy of the sample launch and asserts its exit code and the effect its usage line states.
// Usage: node flightdeck/testbench/suites/sub-commands/run.mjs; exit 0 when every case passes, 2 otherwise.
//
// Every case builds its own repository with mkActiveLaunch (the sample launch, active, phase review) and changes only that copy, so the cases are independent and
// the suite stays fast enough to be run once per subcommand by the sweep. A case name carries the subcommand token exactly as the runner's usage prints it; the
// subcommands of a whole run (launch new, activate, status, pin, phase, gate, end, land, check, verify, locked, plan write, plan render, worker render,
// runlog show) are named by the e2e suite instead.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, tmp, mkActiveLaunch, mkLaunchRepo, readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const LAUNCH = 'export-html-1';
const combined = (r) => `${r.stdout}\n${r.stderr}`;
const git = (root, args) => sh(`git ${args}`, { cwd: root });
const headSha = (root) => git(root, 'rev-parse HEAD').stdout.trim();
const fcAt = (l, args) => fc(args, { cwd: l.root, env: l.env });
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const eventsPath = (l) => path.join(l.launchDir, 'events.jsonl');

function editLaunch(l, mutate) {
  const lj = readJson(launchJsonPath(l));
  mutate(lj);
  writeJson(launchJsonPath(l), lj);
  return lj;
}

/** The sample launch with its base and lock commits re-pointed at the temporary repository's HEAD, optionally in another phase. */
function ready(phase = null) {
  const l = mkActiveLaunch();
  const head = headSha(l.root);
  editLaunch(l, (lj) => {
    lj.base_commit = head;
    lj.lock_commit = head;
    if (phase) lj.phase = phase;
  });
  return l;
}

/** Commits everything, then records evidence/summary.json at the new HEAD, as fc verify would have. */
function evidenceAtHead(l) {
  assertExit(git(l.root, 'add -A'), 0, 'git add -A');
  assertExit(git(l.root, 'commit -q --no-verify -m "align launch"'), 0, 'git commit');
  const head = headSha(l.root);
  const file = path.join(l.launchDir, 'evidence', 'summary.json');
  writeJson(file, { ...readJson(file), commit: head, ran_at: new Date().toISOString() });
  return head;
}

function events(l) {
  if (!exists(eventsPath(l))) return [];
  return readText(eventsPath(l)).split('\n').filter((line) => line.trim() !== '').map((line) => JSON.parse(line));
}

function lastEvent(l) {
  const all = events(l);
  return all[all.length - 1] ?? null;
}

/** A JSON file kept outside the repository. */
function jsonFile(name, obj) {
  const file = path.join(tmp('fc-sub-file'), name);
  writeJson(file, obj);
  return file;
}

await suite({ name: 'sub-commands', covers: ['B1', 'B2'] }, [
  {
    id: 'fc launch kickoff re-renders a removed kickoff.md from the launch pins and exits 0',
    fn: () => {
      const l = ready();
      const file = path.join(l.launchDir, 'kickoff.md');
      fs.rmSync(file);
      const r = fcAt(l, ['launch', 'kickoff']);
      assertExit(r, 0, 'fc launch kickoff');
      assert(exists(file), 'kickoff.md written again');
      const text = readText(file);
      assertEq(text.split('\n')[0], '# Kickoff: task-feature · shape-session', 'kickoff.md heading names the task and shape parts');
      assertIncludes(text, `launch: flightdeck/launch/${LAUNCH}`, 'kickoff header names the launch folder');
      assertMatch(readJson(launchJsonPath(l)).kickoff.version, /^base@\d+\+shape-session@\d+\+task-feature@\d+$/, 'launch.json records the rendered parts with their versions');
    },
  },
  {
    id: 'fc launch escalate writes escalation.json and appends an escalation event',
    fn: () => {
      const l = ready();
      const r = fcAt(l, ['launch', 'escalate', 'blocked', '--detail', 'the map names a missing script']);
      assertExit(r, 0, 'fc launch escalate blocked --detail');
      const escalation = readJson(path.join(l.launchDir, 'escalation.json'));
      assertEq(escalation.kind, 'blocked', 'escalation.json kind');
      assertEq(escalation.detail, 'the map names a missing script', 'escalation.json detail');
      const ev = lastEvent(l);
      assertEq(ev.event, 'escalation', 'last event name');
      assertEq(ev.detail.kind, 'blocked', 'escalation event kind');
      const bad = fcAt(l, ['launch', 'escalate', 'unknown-kind', '--detail', 'x']);
      assertExit(bad, 1, 'fc launch escalate with a kind outside the list');
    },
  },
  {
    id: 'fc launch note appends the text to notes.md and exits 0',
    fn: () => {
      const l = ready();
      const r = fcAt(l, ['launch', 'note', 'the', 'sample', 'note', 'from', 'sub-commands']);
      assertExit(r, 0, 'fc launch note <text>');
      const lines = readText(path.join(l.launchDir, 'notes.md')).split('\n').filter((line) => line !== '');
      assertEq(lines[lines.length - 1], 'the sample note from sub-commands', 'the last line of notes.md is the note');
    },
  },
  {
    id: 'fc boundary exits 0 when every change is inside and 2 naming a changed path outside the boundary',
    fn: () => {
      const l = ready();
      const clean = fcAt(l, ['boundary', '--base', 'HEAD']);
      assertExit(clean, 0, 'fc boundary with only the launch folder changed');
      assertEq(readJson(path.join(l.launchDir, 'evidence', 'boundary.json')).outside, [], 'boundary.json outside is empty');
      writeText(path.join(l.root, 'stray-outside.txt'), 'outside the boundary\n');
      const r = fcAt(l, ['boundary', '--base', 'HEAD']);
      assertExit(r, 2, 'fc boundary with a change outside the allowed and locked paths');
      assertIncludes(combined(r), 'stray-outside.txt', 'the message names the outside path');
      assertEq(readJson(path.join(l.launchDir, 'evidence', 'boundary.json')).outside, ['stray-outside.txt'], 'boundary.json outside lists the path');
    },
  },
  {
    id: 'fc budget exits 0 within the ceilings and 2 with a trigger event when a ceiling is passed',
    fn: () => {
      const l = ready();
      const within = fcAt(l, ['budget']);
      assertExit(within, 0, 'fc budget on the sample launch');
      const record = readJson(path.join(l.launchDir, 'evidence', 'budget.json'));
      assertEq(record.exceeded, [], 'budget.json exceeded is empty');
      assert(typeof record.counts?.agents?.count === 'number', 'budget.json counts agents');
      editLaunch(l, (lj) => { lj.ceilings.agents = 0; });
      const over = fcAt(l, ['budget']);
      assertExit(over, 2, 'fc budget with the agents ceiling at 0');
      const ev = lastEvent(l);
      assertEq(ev.event, 'trigger', 'a trigger event is appended');
      assertEq(ev.detail.name, 'budget', 'the trigger is named budget');
    },
  },
  {
    id: 'fc events append appends the event line with ts, launch and phase filled',
    fn: () => {
      const l = ready();
      const before = events(l).length;
      const r = fcAt(l, ['events', 'append', JSON.stringify({ event: 'sub_commands_probe', detail: { n: 1 } })]);
      assertExit(r, 0, 'fc events append <json>');
      assertEq(events(l).length, before + 1, 'one line appended');
      const ev = lastEvent(l);
      assertEq(ev.event, 'sub_commands_probe', 'event name');
      assertEq(ev.launch, LAUNCH, 'launch filled');
      assertEq(ev.phase, 'review', 'phase filled from launch.json');
      assertEq(ev.source, 'fc', 'source filled');
      assertMatch(ev.ts, /^\d{4}-\d{2}-\d{2}T/, 'ts filled');
      const bad = fcAt(l, ['events', 'append', '{"detail":{}}']);
      assertExit(bad, 1, 'fc events append without an event name');
      assertEq(events(l).length, before + 1, 'nothing appended for the refused line');
    },
  },
  {
    id: 'fc events usage appends a usage event carrying the token counts',
    fn: () => {
      const l = ready();
      const r = fcAt(l, ['events', 'usage', JSON.stringify({ agent_id: 'agent-probe', input_tokens: 120, output_tokens: 30 })]);
      assertExit(r, 0, 'fc events usage <json>');
      const ev = lastEvent(l);
      assertEq(ev.event, 'usage', 'event name');
      assertEq(ev.agent_id, 'agent-probe', 'agent id');
      assertEq(ev.detail.input_tokens, 120, 'input tokens carried');
      assertEq(ev.detail.output_tokens, 30, 'output tokens carried');
    },
  },
  {
    id: 'fc events summary prints the event count by event and exits 0',
    fn: () => {
      const l = ready();
      const all = events(l);
      const r = fcAt(l, ['events', 'summary']);
      assertExit(r, 0, 'fc events summary');
      const lines = r.stdout.split('\n');
      assertEq(lines[0], `events: ${all.length}`, 'first line counts the events');
      assertEq(lines[1], 'unparseable: 0', 'second line counts unparseable lines');
      const usage = all.filter((e) => e.event === 'usage').length;
      assertIncludes(lines, `  usage  ${usage}`, 'the by-event listing counts usage events');
    },
  },
  {
    id: 'fc evidence writes evidence.html for the launch and exits 0',
    fn: () => {
      const l = ready();
      const file = path.join(l.launchDir, 'evidence.html');
      fs.rmSync(file, { force: true });
      const r = fcAt(l, ['evidence']);
      assertExit(r, 0, 'fc evidence');
      assert(exists(file), 'evidence.html written');
      const html = readText(file);
      assertMatch(html, /<html[\s>]/i, 'evidence.html is an HTML page');
      assertIncludes(html, LAUNCH, 'the page names the launch');
      const extra = fcAt(l, ['evidence', 'extra']);
      assertExit(extra, 1, 'fc evidence with an argument');
    },
  },
  {
    id: 'fc report writes report.md with the run report title and exits 0',
    fn: () => {
      const l = ready();
      const file = path.join(l.launchDir, 'report.md');
      fs.rmSync(file, { force: true });
      const r = fcAt(l, ['report']);
      assertExit(r, 0, 'fc report');
      assert(exists(file), 'report.md written');
      assertEq(readText(file).split('\n')[0], `# Run report · export-html · ${LAUNCH}`, 'report.md title');
    },
  },
  {
    id: 'fc runlog stub inserts the entry of an ended launch into RUNLOG.md and exits 0',
    fn: () => {
      const l = ready();
      const refused = fcAt(l, ['runlog', 'stub']);
      assertExit(refused, 1, 'fc runlog stub on a launch that has not ended');
      const runlog = path.join(l.root, 'flightdeck', 'launch', 'RUNLOG.md');
      assert(!exists(runlog), 'no RUNLOG.md written for the refused stub');
      editLaunch(l, (lj) => {
        lj.status = 'accepted';
        lj.outcome = 'accepted';
        lj.phase = 'ended';
        lj.ended = '2026-08-30T12:00:00Z';
      });
      const r = fc(['runlog', 'stub', '--launch', LAUNCH], { cwd: l.root, env: l.env });
      assertExit(r, 0, 'fc runlog stub --launch <ended launch>');
      const text = readText(runlog);
      assertEq(text.split('\n')[0], '# Run log', 'RUNLOG.md opens with its heading');
      assertIncludes(text, `## 2026-08-30 · export-html · ${LAUNCH}`, 'the entry heading');
      assertIncludes(text, 'outcome: accepted', 'the entry outcome line');
      assertIncludes(text, 'kept: <fill>', 'the human field is left to fill');
    },
  },
  {
    id: 'fc validate exits 0 on the sample launch.json and 2 on one missing its name',
    fn: () => {
      const l = ready();
      const good = fcAt(l, ['validate', 'launch', launchJsonPath(l)]);
      assertExit(good, 0, 'fc validate launch <sample launch.json>');
      editLaunch(l, (lj) => { delete lj.name; });
      const bad = fcAt(l, ['validate', 'launch', launchJsonPath(l)]);
      assertExit(bad, 2, 'fc validate launch <launch.json without name>');
      assertMatch(combined(bad), /name/, 'the error names the missing field');
    },
  },
  {
    id: 'fc lint spec exits 0 on the sample spec and 2 naming lint-open-questions on a spec with an open question',
    fn: () => {
      const repo = mkLaunchRepo();
      const file = path.join(repo.root, repo.specPath);
      const run = () => fc(['lint', 'spec', file, '--repo', repo.root], { cwd: repo.root, env: { FLIGHTCREW_ROOT: repo.root } });
      const clean = run();
      assertExit(clean, 0, 'fc lint spec <sample spec> --repo <root>');
      const spec = readJson(file);
      spec.open_questions = [{ id: 'Q1', status: 'ok', text: 'Which browsers must the page support?' }];
      writeJson(file, spec);
      const open = run();
      assertExit(open, 2, 'fc lint spec on a spec with an open question');
      assertIncludes(combined(open), '[lint-open-questions]', 'the failed rule is named');
    },
  },
  {
    id: 'fc worker merge exits 2 and changes nothing when the unit has no stored return',
    fn: () => {
      const l = ready('implement');
      fs.rmSync(path.join(l.launchDir, 'returns', 'U3.json'));
      const head = headSha(l.root);
      const before = git(l.root, 'status --porcelain').stdout;
      const eventCount = events(l).length;
      const r = fcAt(l, ['worker', 'merge', 'U3']);
      assertExit(r, 2, 'fc worker merge U3 without returns/U3.json');
      assertIncludes(combined(r), 'returns/U3.json', 'the message names the missing return');
      assertEq(headSha(l.root), head, 'HEAD unchanged');
      assertEq(git(l.root, 'status --porcelain').stdout, before, 'working tree unchanged');
      assertEq(events(l).length, eventCount, 'no event appended');
    },
  },
  {
    id: 'fc worker return stores the return at returns/<unit>.json and appends a return event',
    fn: () => {
      const l = ready('implement');
      const stored = path.join(l.launchDir, 'returns', 'U2.json');
      const payload = readJson(stored);
      fs.rmSync(stored);
      const r = fcAt(l, ['worker', 'return', 'U2', jsonFile('U2.json', payload)]);
      assertExit(r, 0, 'fc worker return U2 <file>');
      assertEq(readJson(stored), payload, 'returns/U2.json holds the return');
      const ev = lastEvent(l);
      assertEq(ev.event, 'return', 'event name');
      assertEq(ev.detail.kind, 'worker', 'event kind');
      assertEq(ev.detail.unit, 'U2', 'event unit');
    },
  },
  {
    id: 'fc return stores an explorer return at returns/explore-<id>.json and exits 2 on an invalid one',
    fn: () => {
      const l = ready();
      const explorer = { id: 'X2', question: 'Which file renders a page?', stage: 'planning', answer: 'src/export/index.mjs renders every page.', confidence: 'probable', pointers: ['src/export/index.mjs'], candidates: [] };
      const r = fcAt(l, ['return', 'explorer', jsonFile('explore.json', explorer), '--id', 'X2']);
      assertExit(r, 0, 'fc return explorer <file> --id X2');
      assertEq(readJson(path.join(l.launchDir, 'returns', 'explore-X2.json')), explorer, 'stored at returns/explore-X2.json');
      const ev = lastEvent(l);
      assertEq(ev.event, 'return', 'event name');
      assertEq(ev.detail.kind, 'explorer', 'event kind');
      const bad = fcAt(l, ['return', 'explorer', jsonFile('bad.json', { ...explorer, id: 'X3', confidence: 'certain-ish' }), '--id', 'X3']);
      assertExit(bad, 2, 'fc return explorer with a confidence outside the enumeration');
      assert(!exists(path.join(l.launchDir, 'returns', 'explore-X3.json')), 'nothing stored for the invalid return');
    },
  },
  {
    id: 'fc critic render writes review/pass-2.prompt.md in phase review with evidence at HEAD',
    fn: () => {
      const l = ready('review');
      const refused = fcAt(l, ['critic', 'render', '--pass', '2']);
      assertExit(refused, 1, 'fc critic render with evidence older than HEAD');
      evidenceAtHead(l);
      const r = fcAt(l, ['critic', 'render', '--pass', '2']);
      assertExit(r, 0, 'fc critic render --pass 2');
      const file = path.join(l.launchDir, 'review', 'pass-2.prompt.md');
      assert(exists(file), 'review/pass-2.prompt.md written');
      assert(readText(file).trim().length > 0, 'the prompt is not empty');
    },
  },
  {
    id: 'fc verifier render writes returns/verify-2.prompt.md in phase verify with evidence at HEAD',
    fn: () => {
      const l = ready('review');
      const refused = fcAt(l, ['verifier', 'render', '--pass', '2']);
      assertExit(refused, 1, 'fc verifier render outside phase verify');
      editLaunch(l, (lj) => { lj.phase = 'verify'; });
      evidenceAtHead(l);
      const r = fcAt(l, ['verifier', 'render', '--pass', '2']);
      assertExit(r, 0, 'fc verifier render --pass 2');
      const file = path.join(l.launchDir, 'returns', 'verify-2.prompt.md');
      assert(exists(file), 'returns/verify-2.prompt.md written');
      assertIncludes(readText(file), 'T1', 'the prompt names the checks to re-run');
    },
  },
  {
    id: 'fc distribute copies the crew and the workflows into the target and never a hook',
    fn: () => {
      const { root } = mkLaunchRepo();
      const target = path.join(root, 'target-claude');
      const dry = fc(['distribute', '--target', target], { cwd: root, env: { FLIGHTCREW_ROOT: root } });
      assertExit(dry, 0, 'fc distribute --target <dir> (dry run)');
      assert(!exists(target), 'the dry run writes nothing');
      assertIncludes(dry.stdout, '-> agents/flightcrew/implementer.md', 'the dry run lists the implementer');
      const r = fc(['distribute', '--apply', '--target', target], { cwd: root, env: { FLIGHTCREW_ROOT: root } });
      assertExit(r, 0, 'fc distribute --apply --target <dir>');
      assert(exists(path.join(target, 'agents', 'flightcrew', 'implementer.md')), 'the implementer is copied');
      assert(fs.readdirSync(path.join(target, 'workflows')).some((name) => name.endsWith('.js')), 'a workflow script is copied');
      assert(!exists(path.join(target, 'hooks')), 'no hook is copied');
      const noTarget = fc(['distribute', '--apply'], { cwd: root, env: { FLIGHTCREW_ROOT: root } });
      assertExit(noTarget, 1, 'fc distribute --apply without --target');
    },
  },
  {
    id: 'fc doctor exits 0 and reports that every condition holds in a repository with no launch folder',
    fn: () => {
      const { root } = mkLaunchRepo();
      const r = fc(['doctor'], { cwd: root, env: { FLIGHTCREW_ROOT: root } });
      assertExit(r, 0, 'fc doctor');
      assertIncludes(r.stdout, 'doctor: every condition holds', 'the closing line');
      assertMatch(r.stdout, /^ok {4}launch: 0 launch folders, 0 active$/m, 'the launch condition finds no launch');
      const bad = fc(['doctor', '--no-such-flag'], { cwd: root, env: { FLIGHTCREW_ROOT: root } });
      assertExit(bad, 1, 'fc doctor with an unexpected argument');
    },
  },
]);
