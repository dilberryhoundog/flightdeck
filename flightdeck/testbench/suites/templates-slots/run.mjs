// testbench/suites/templates-slots/run.mjs — names each template under flightdeck/flightcrew/templates/ by its repository path and asserts what depends on its slots: the fc command that renders or reads the template fills them (worker, critic and verifier dispatches, the report, the run-log entry, the kickoff parts' version comments, the constitution fragment fc distribute prints), or the slot set the template carries matches its reader (the JSON templates against their schemas and the files fc writes or reads, the explorer dispatch against the question fields flightdeck/manuals/harness/workflows.md lists).
// Usage: node flightdeck/testbench/suites/templates-slots/run.mjs; exit 0 when every case passes, 2 otherwise.
//
// Every fc command runs against a temporary copy of the sample launch or the sample project; nothing is written into the checkout.

import path from 'node:path';
import {
  suite, fc, sh, tmp, mkLaunchRepo, mkActiveLaunch, TEMPLATES, SCHEMAS, FIXTURES, MANUALS,
  readJson, writeJson, readText, exists,
  assert, assertEq, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const TPL = 'flightdeck/flightcrew/templates';
const KICKOFF_PARTS = ['base', 'shape-session', 'shape-sessions', 'shape-workflow', 'task-feature', 'task-migration', 'task-audit', 'task-agent'];
const SLOT = /\{\{\s*([\w.-]+)\s*\}\}/g;

const template = (rel) => readText(path.join(TEMPLATES, ...rel.split('/')));
const firstLine = (text) => String(text).split('\n')[0];
const slotsOf = (text) => new Set([...String(text).matchAll(SLOT)].map((m) => m[1]));
const out = (r) => `${r.stdout}\n${r.stderr}`;

/** A template line with every slot replaced by the value fc fills it with; a slot fc has no value for fails the case. */
function fillKnown(line, values, what) {
  return line.replace(SLOT, (whole, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) throw new Error(`${what}: slot {{${name}}} in ${JSON.stringify(line)} is not one fc fills (known: ${Object.keys(values).join(', ')})`);
    return String(values[name]);
  });
}

/** The lines of the first fenced block of a markdown text. */
function firstFence(text) {
  const lines = String(text).split('\n');
  const open = lines.findIndex((l) => l.startsWith('```'));
  assert(open !== -1, 'the template carries a fenced block');
  const close = lines.findIndex((l, i) => i > open && l.startsWith('```'));
  assert(close !== -1, 'the fenced block is closed');
  return lines.slice(open + 1, close);
}

function head(root) {
  const r = sh('git rev-parse HEAD', { cwd: root });
  if (r.code !== 0) throw new Error(`git rev-parse failed: ${r.stderr}`);
  return r.stdout.trim();
}

/** The sample launch in `phase`, its base and lock at HEAD and its evidence summary recorded at HEAD. */
function launchAt(phase) {
  const active = mkActiveLaunch();
  const sha = head(active.root);
  const launchFile = path.join(active.launchDir, 'launch.json');
  const launch = readJson(launchFile);
  launch.phase = phase;
  launch.base_commit = sha;
  launch.lock_commit = sha;
  writeJson(launchFile, launch);
  const summaryFile = path.join(active.launchDir, 'evidence', 'summary.json');
  const summary = readJson(summaryFile);
  summary.commit = sha;
  summary.ran_at = new Date().toISOString();
  writeJson(summaryFile, summary);
  return active;
}

const fcIn = (active, args) => fc(args, { cwd: active.root, env: active.env });

/** Top-level keys of a JSON template, without $schema. */
function templateKeys(rel) {
  return Object.keys(JSON.parse(template(rel))).filter((k) => k !== '$schema');
}

function assertSubset(keys, of, label) {
  const missing = keys.filter((k) => !of.includes(k));
  assertEq(missing, [], label);
}

/** The slot set of a JSON template holds every field its schema requires and no field its schema does not define. */
function assertMatchesSchema(rel, schemaFile) {
  const keys = templateKeys(rel);
  const schema = readJson(path.join(SCHEMAS, schemaFile));
  assert(Array.isArray(schema.required) && schema.required.length > 0, `${schemaFile} declares its required fields`);
  assertSubset(schema.required, keys, `fields ${schemaFile} requires that ${rel} does not carry`);
  assertSubset(keys, Object.keys(schema.properties ?? {}), `fields ${rel} carries that ${schemaFile} does not define`);
  return keys;
}

const cases = [];

// ── the dispatch templates fc renders ────────────────────────────────────────
cases.push({
  id: `fc worker render fills the first line of ${TPL}/worker-dispatch.template.md with the unit id`,
  fn: () => {
    const active = launchAt('implement');
    const r = fcIn(active, ['worker', 'render', 'U1']);
    assertExit(r, 0, 'fc worker render U1');
    const expected = fillKnown(firstLine(template('worker-dispatch.template.md')), { unit: 'U1' }, 'worker-dispatch');
    assertEq(expected, 'unit: U1', 'the manual first line of a worker dispatch');
    assertEq(firstLine(r.stdout), expected, 'the first line fc prints');
    assertEq(firstLine(readText(path.join(active.launchDir, 'returns', 'U1.prompt.md'))), expected, 'the first line of returns/U1.prompt.md');
    assert(!/\{\{/.test(r.stdout), 'no slot is left unfilled');
  },
});

cases.push({
  id: `fc critic render fills the heading of ${TPL}/critic-dispatch.template.md with the pass and the launch`,
  fn: () => {
    const active = launchAt('review');
    const r = fcIn(active, ['critic', 'render', '--pass', '2']);
    assertExit(r, 0, 'fc critic render --pass 2');
    const prompt = readText(path.join(active.launchDir, 'review', 'pass-2.prompt.md'));
    const expected = fillKnown(firstLine(template('critic-dispatch.template.md')), { pass: 2, launch: active.launch }, 'critic-dispatch');
    assertEq(firstLine(prompt), expected, 'the first line of review/pass-2.prompt.md');
    assert(!/\{\{/.test(prompt), 'no slot is left unfilled');
  },
});

cases.push({
  id: `fc verifier render fills the heading of ${TPL}/verifier-dispatch.template.md with the pass and the launch`,
  fn: () => {
    const active = launchAt('verify');
    const r = fcIn(active, ['verifier', 'render', '--pass', '2']);
    assertExit(r, 0, 'fc verifier render --pass 2');
    const file = path.join(active.launchDir, 'returns', 'verify-2.prompt.md');
    assert(exists(file), 'returns/verify-2.prompt.md written');
    const prompt = readText(file);
    const expected = fillKnown(firstLine(template('verifier-dispatch.template.md')), { pass: 2, launch: active.launch }, 'verifier-dispatch');
    assertEq(firstLine(prompt), expected, 'the first line of the verifier prompt');
    assert(!/\{\{/.test(prompt), 'no slot is left unfilled');
  },
});

cases.push({
  id: `${TPL}/explorer-dispatch.template.md carries a slot for every question field /fc-explore takes`,
  fn: () => {
    const manual = readText(path.join(MANUALS, 'harness', 'workflows.md'));
    const row = manual.split('\n').find((l) => l.startsWith('| `fc-explore.js`'));
    assert(row, 'flightdeck/manuals/harness/workflows.md has the fc-explore.js row');
    const m = /questions: \[\{([^}]*)\}\]/.exec(row);
    assert(m, `the fc-explore.js row lists the question fields: ${row.slice(0, 200)}`);
    const fields = m[1].split(',').map((f) => f.trim()).filter(Boolean);
    assertEq(fields.sort(), ['id', 'question', 'scope_paths', 'stage'], 'the question fields the manual lists');
    const slots = slotsOf(template('explorer-dispatch.template.md'));
    assertSubset(fields, [...slots], 'question fields with no slot in the explorer dispatch');
    assert(slots.has('return_shape'), 'the dispatch closes on the return shape slot');
  },
});

// ── the report and the run-log entry ─────────────────────────────────────────
cases.push({
  id: `fc report writes the title line of ${TPL}/report.template.md with its slots filled from launch.json`,
  fn: () => {
    const active = launchAt('review');
    const r = fcIn(active, ['report']);
    assertExit(r, 0, 'fc report');
    const report = readText(path.join(active.launchDir, 'report.md'));
    const block = firstFence(template('report.template.md'));
    const expected = fillKnown(block[0], { spec_name: 'export-html', launch: active.launch }, 'report');
    assertEq(firstLine(report), expected, 'the first line of report.md');
    const launch = readJson(path.join(active.launchDir, 'launch.json'));
    const second = fillKnown(block[1], { spec_name: 'export-html', spec_version: 1, spec_commit: launch.spec.commit, kickoff_version: launch.kickoff.version }, 'report');
    assertEq(report.split('\n')[1], second, 'the second line of report.md');
  },
});

cases.push({
  id: `fc runlog stub writes the heading and mechanical lines of ${TPL}/runlog-entry.template.md with their slots filled`,
  fn: () => {
    const active = mkActiveLaunch();
    const launchFile = path.join(active.launchDir, 'launch.json');
    const launch = readJson(launchFile);
    launch.status = 'accepted';
    launch.outcome = 'accepted';
    launch.ended = '2026-08-30T12:00:00Z';
    launch.phase = 'ended';
    writeJson(launchFile, launch);
    const r = fc(['runlog', 'stub'], { cwd: active.root, env: { ...active.env, FLIGHTCREW_LAUNCH: active.launch } });
    assertExit(r, 0, 'fc runlog stub');
    const lines = readText(path.join(active.root, 'flightdeck', 'launch', 'RUNLOG.md')).split('\n');
    const values = {
      ended_date: '2026-08-30',
      spec_name: 'export-html',
      launch: active.launch,
      spec_version: 1,
      spec_commit: launch.spec.commit,
      kickoff_version: launch.kickoff.version,
      outcome: 'accepted',
    };
    const block = firstFence(template('runlog-entry.template.md'));
    const heading = fillKnown(block[0], values, 'runlog-entry');
    const at = lines.indexOf(heading);
    assert(at !== -1, `RUNLOG.md carries the heading ${JSON.stringify(heading)}: ${JSON.stringify(lines.slice(0, 4))}`);
    for (const line of block.slice(1, 4)) {
      assertIncludes(lines.slice(at + 1, at + 8), fillKnown(line, values, 'runlog-entry'), 'the entry carries the filled line');
    }
  },
});

// ── the kickoff library ──────────────────────────────────────────────────────
function kickoffRepo() {
  const repo = mkLaunchRepo();
  const r = fc(['launch', 'new', repo.specPath, '--name', 'slots-1'], { cwd: repo.root });
  assertExit(r, 0, 'fc launch new');
  return { ...repo, env: { FLIGHTCREW_LAUNCH: 'slots-1' }, dir: path.join(repo.root, 'flightdeck', 'launch', 'slots-1') };
}

let sharedKickoff = null;
for (const part of KICKOFF_PARTS) {
  cases.push({
    id: `fc launch kickoff reads the version comment of ${TPL}/kickoff/${part}.md into the kickoff version`,
    fn: () => {
      sharedKickoff ??= kickoffRepo();
      const repo = sharedKickoff;
      const shape = part.startsWith('shape-') ? part : 'shape-session';
      const task = part.startsWith('task-') ? part : 'task-feature';
      const r = fc(['launch', 'kickoff', '--parts', `base+${shape}+${task}`], { cwd: repo.root, env: repo.env });
      assertExit(r, 0, `fc launch kickoff --parts base+${shape}+${task}`);
      const m = /^<!-- version: (\d+) -->$/.exec(firstLine(template(`kickoff/${part}.md`)));
      assert(m, `the first line of kickoff/${part}.md is '<!-- version: N -->' as flightdeck/manuals/orchestration/kickoff.md states`);
      const token = `${part}@${m[1]}`;
      const version = readJson(path.join(repo.dir, 'launch.json')).kickoff?.version ?? '';
      assertIncludes(version.split('+'), token, 'launch.json kickoff.version');
      assertIncludes(readText(path.join(repo.dir, 'kickoff.md')).split('\n'), `kickoff version: ${version}`, 'the kickoff.md header');
    },
  });
}

// ── the constitution fragment ────────────────────────────────────────────────
cases.push({
  id: `fc distribute --apply prints ${TPL}/constitution-fragment.md as its Flightcrew section for the project instructions`,
  fn: () => {
    const repo = mkLaunchRepo();
    const target = path.join(tmp('fc-slots-target'), '.claude');
    const r = fc(['distribute', '--apply', '--target', target], { cwd: repo.root });
    assertExit(r, 0, 'fc distribute --apply --target');
    const lines = r.stdout.split('\n');
    const at = lines.indexOf('add to the project instructions:');
    assert(at !== -1, `fc distribute prints the project instructions label: ${out(r).slice(-300)}`);
    const printed = lines.slice(at + 1).join('\n').replace(/\n+$/, '');
    assertEq(printed, template('constitution-fragment.md').replace(/\n+$/, ''), 'the printed block is the fragment');
    // Merged into the project constitution (flightdeck/manuals/harness/hooks.md Install step 5), the block is one section under the
    // constitution's own title: a single level-2 heading opening it, named for the system as flightdeck/flightcrew/README.md titles it.
    const system = /^# (.+)$/.exec(firstLine(readText(path.join(TEMPLATES, '..', 'README.md'))));
    assert(system, 'flightdeck/flightcrew/README.md opens with its title heading');
    assertEq(firstLine(printed), `## ${system[1]}`, 'the printed block opens the section named for the system');
    const sections = printed.split('\n').filter((l) => /^#{1,2} /.test(l));
    assertEq(sections.length, 1, 'the printed block is a single section to merge');
  },
});

// ── the JSON templates ───────────────────────────────────────────────────────
cases.push({
  id: `fc launch new writes launch.json with only fields ${TPL}/launch.template.json carries, and the template matches launch.schema.json`,
  fn: () => {
    const keys = assertMatchesSchema('launch.template.json', 'launch.schema.json');
    const repo = mkLaunchRepo();
    const r = fc(['launch', 'new', repo.specPath, '--name', 'slots-2'], { cwd: repo.root });
    assertExit(r, 0, 'fc launch new');
    const written = Object.keys(readJson(path.join(repo.root, 'flightdeck', 'launch', 'slots-2', 'launch.json')));
    assertSubset(written, keys, 'fields fc launch new writes that the template does not carry');
  },
});

cases.push({
  id: `${TPL}/plan.template.json carries every field plan.schema.json requires and every field of the sample plan`,
  fn: () => {
    const keys = assertMatchesSchema('plan.template.json', 'plan.schema.json');
    assertSubset(Object.keys(readJson(path.join(FIXTURES, 'sample-launch', 'plan.json'))), keys, 'sample plan fields the template does not carry');
  },
});

cases.push({
  id: `${TPL}/spec.template.json carries every field spec.schema.json requires and every field of the sample spec`,
  fn: () => {
    const keys = assertMatchesSchema('spec.template.json', 'spec.schema.json');
    assertSubset(Object.keys(readJson(path.join(FIXTURES, 'sample-spec', 'spec.v1.json'))).filter((k) => k !== '$schema'), keys, 'sample spec fields the template does not carry');
  },
});

cases.push({
  id: `${TPL}/tests-map.template.json carries every field tests-map.schema.json requires and every field of the sample map`,
  fn: () => {
    const keys = assertMatchesSchema('tests-map.template.json', 'tests-map.schema.json');
    assertSubset(Object.keys(readJson(path.join(FIXTURES, 'sample-spec', 'tests-map.v1.json'))).filter((k) => k !== '$schema'), keys, 'sample map fields the template does not carry');
  },
});

await suite({ name: 'templates-slots', covers: ['B1', 'B2'] }, cases);
