// testbench/suites/templates/run.mjs — regression suite T27: the kickoff library parts under flightcrew/templates/kickoff/, the kickoff.md assembly fc launch new and fc launch kickoff produce from them, and every rejection of validate-kickoff run through fc validate kickoff. Covers I11, E16.
// Usage: node flightdeck/testbench/suites/templates/run.mjs — no arguments; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case, one 'covers:' line and '<n>/<m> passed'; exit 0 when every case passes, else 2.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, mkLaunchRepo, TEMPLATES, CREW,
  readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const KICKOFF = path.join(TEMPLATES, 'kickoff');
const REQUIRED_PARTS = ['base', 'shape-session', 'shape-workflow', 'shape-sessions', 'task-feature', 'task-migration', 'task-audit', 'task-agent'];
const VERSION_LINE = /^<!-- version: (\d+) -->$/;

function git(root, args) {
  const r = sh(`git ${args}`, { cwd: root });
  if (r.code !== 0) throw new Error(`git ${args} failed: ${(r.stderr || r.stdout).trim()}`);
  return r.stdout.trim();
}
function commitAll(root, message) {
  git(root, 'add -A');
  git(root, `commit -q --no-verify --allow-empty -m "${message}"`);
}
const partText = (name) => readText(path.join(KICKOFF, `${name}.md`));
function partVersion(name) {
  const first = partText(name).split('\n')[0];
  const m = VERSION_LINE.exec(first);
  assert(m, `${name}.md first line is a version comment: ${JSON.stringify(first)}`);
  return Number(m[1]);
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();
const launchDir = (root, name) => path.join(root, 'flightdeck', 'launch', name);
const kickoffPath = (root, name) => path.join(launchDir(root, name), 'kickoff.md');
function newLaunch(repo, name, extra = [], specPath = repo.specPath) {
  const r = fc(['launch', 'new', specPath, '--name', name, ...extra], { cwd: repo.root });
  assertExit(r, 0, `fc launch new ${name}`);
  return r;
}
function addSpec(repo, name, mutate) {
  const spec = readJson(path.join(repo.root, repo.specPath));
  spec.name = name;
  if (mutate) mutate(spec);
  const rel = `flightdeck/launch/specs/${name}/spec.v1.json`;
  writeJson(path.join(repo.root, rel), spec);
  commitAll(repo.root, `add spec ${name}`);
  return rel;
}
const draftSpec = (repo) => addSpec(repo, 'draft-spec', (s) => { s.status = 'draft'; delete s.commit; });
const validate = (repo, name) => fc(['validate', 'kickoff', `flightdeck/launch/${name}/kickoff.md`], { cwd: repo.root, env: { FLIGHTCREW_LAUNCH: name } });
function assertRejected(r, pointer, msg) {
  assertExit(r, 2, msg);
  assertMatch(`${r.stdout}\n${r.stderr}`, /error: /, `${msg}: an error line`);
  assertIncludes(`${r.stdout}\n${r.stderr}`, pointer, `${msg}: names the pointer`);
}
/** Replaces one header field value in a rendered kickoff, whatever line it shares. */
function replaceField(text, label, value) {
  const re = new RegExp(`(${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}: )([^\\n]*?)(?=(\\s{2,}[a-z -]+:|\\n|$))`);
  assert(re.test(text), `field ${JSON.stringify(label)} present in the kickoff header`);
  return text.replace(re, `$1${value}`);
}
/** Splits a rendered kickoff into its header (before base.md) and the rest. */
function split(kickoff) {
  const base = partText('base').trim();
  const i = kickoff.indexOf(base);
  assert(i > 0, 'base.md content follows a header block');
  return { header: kickoff.slice(0, i), rest: kickoff.slice(i) };
}

await suite('templates', [
  {
    id: 'kickoff-parts-start-with-version-comment',
    covers: ['I11'],
    fn: async () => {
      const files = fs.readdirSync(KICKOFF).filter((f) => f.endsWith('.md') && f !== 'README.md').sort();
      for (const required of REQUIRED_PARTS) assertIncludes(files, `${required}.md`, 'library part present');
      for (const f of files) {
        const first = readText(path.join(KICKOFF, f)).split('\n')[0];
        assertMatch(first, VERSION_LINE, `${f} first line`);
      }
    },
  },
  {
    id: 'kickoff-equals-header-plus-parts-in-order',
    covers: ['I11'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const kickoff = readText(kickoffPath(repo.root, 'L1'));
      const { header, rest } = split(kickoff);
      const base = partText('base').trim();
      const shape = partText('shape-session').trim();
      const task = partText('task-feature').trim();
      assertEq(norm(rest), norm(`${base}\n${shape}\n${task}`), 'after the header: base.md, shape-session.md, task-feature.md and nothing else');
      assert(rest.indexOf(base) < rest.indexOf(shape) && rest.indexOf(shape) < rest.indexOf(task), 'parts in order base, shape, task');
      assertMatch(header, /^# Kickoff: task-feature · shape-session\n/, 'title line');
      assertIncludes(header, 'launch: flightdeck/launch/L1', 'launch path');
      assertMatch(header, /spec: flightdeck\/launch\/(L1\/)?specs\/export-html\/spec\.v1\.json @ a1b2c3d/, 'spec path @ commit');
      assertIncludes(header, 'tests-map: (none)', 'tests-map (none) while unpinned');
      assertIncludes(header, 'read first: flightdeck/launch/RUNLOG.md', 'read first');
      assertIncludes(header, 'prior reports: none', 'prior reports none');
      assertIncludes(header, 'write plan with: fc plan write', 'write plan with');
      assertIncludes(header, 'evidence: flightdeck/launch/L1/evidence.html', 'evidence path');
    },
  },
  {
    id: 'kickoff-version-joins-part-versions',
    covers: ['I11'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const expected = `base@${partVersion('base')}+shape-session@${partVersion('shape-session')}+task-feature@${partVersion('task-feature')}`;
      assertIncludes(readText(kickoffPath(repo.root, 'L1')), `kickoff version: ${expected}`, 'header version line');
      assertEq(readJson(path.join(launchDir(repo.root, 'L1'), 'launch.json')).kickoff.version, expected, 'launch.json.kickoff.version');
      newLaunch(repo, 'L2', ['--kickoff', 'base+shape-sessions+task-agent']);
      const expected2 = `base@${partVersion('base')}+shape-sessions@${partVersion('shape-sessions')}+task-agent@${partVersion('task-agent')}`;
      const k2 = readText(kickoffPath(repo.root, 'L2'));
      assertIncludes(k2, `kickoff version: ${expected2}`, 'header version line for other parts');
      assertMatch(k2.split('\n')[0], /^# Kickoff: task-agent · shape-sessions$/, 'title names the parts');
      assertEq(norm(split(k2).rest), norm(`${partText('base').trim()}\n${partText('shape-sessions').trim()}\n${partText('task-agent').trim()}`), 'body is base, shape-sessions, task-agent');
    },
  },
  {
    id: 'kickoff-header-draft-spec-reads-draft',
    covers: ['I11'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const rel = draftSpec(repo);
      newLaunch(repo, 'D1', [], rel);
      const { header } = split(readText(kickoffPath(repo.root, 'D1')));
      assertMatch(header, /spec: flightdeck\/launch\/(D1\/)?specs\/draft-spec\/spec\.v1\.json @ draft/, 'spec line reads @ draft');
    },
  },
  {
    id: 'kickoff-prior-reports-lists-same-spec-reports',
    covers: ['I11'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L0');
      writeText(path.join(launchDir(repo.root, 'L0'), 'report.md'), '# Run report · export-html · L0\n');
      newLaunch(repo, 'L1');
      const other = addSpec(repo, 'other-spec');
      newLaunch(repo, 'O1', [], other);
      writeText(path.join(launchDir(repo.root, 'O1'), 'report.md'), '# Run report · other-spec · O1\n');
      newLaunch(repo, 'L2');
      const { header } = split(readText(kickoffPath(repo.root, 'L2')));
      assertIncludes(header, 'flightdeck/launch/L0/report.md', 'prior reports lists L0');
      assert(!header.includes('flightdeck/launch/L1/report.md'), 'a launch without report.md is not listed');
      assert(!header.includes('flightdeck/launch/O1/report.md'), 'a report of another spec is not listed');
      assert(!header.includes('prior reports: none'), 'not none');
    },
  },
  {
    id: 'roles-names-are-backticked-crew-names',
    covers: ['I11'],
    fn: async () => {
      const base = partText('base');
      const lines = base.split('\n');
      const start = lines.findIndex((l) => /^##\s+Roles\b/.test(l));
      assert(start >= 0, 'base.md has a Roles heading');
      const rest = lines.slice(start + 1);
      const end = rest.findIndex((l) => /^##\s/.test(l));
      const roles = rest.slice(0, end === -1 ? rest.length : end).join('\n');
      const names = [...roles.matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
      assert(names.length > 0, 'Roles names at least one backticked agent');
      for (const name of names) {
        assertMatch(name, /^[a-z][a-z0-9-]*$/, 'backticked role is an agent name');
        assert(exists(path.join(CREW, `${name}.md`)), `flightcrew/crew/${name}.md exists for role ${name}`);
      }
      for (const role of ['explorer', 'implementer', 'critic']) assertIncludes(names, role, 'Roles names the crew');
    },
  },
  {
    id: 'validate-accepts-fresh-kickoff-with-no-map',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      assertIncludes(readText(kickoffPath(repo.root, 'L1')), 'tests-map: (none)', 'kickoff reads (none)');
      assertEq(readJson(path.join(launchDir(repo.root, 'L1'), 'launch.json')).tests_map, null, 'tests_map is null');
      const r = validate(repo, 'L1');
      assertExit(r, 0, 'validate-kickoff accepts (none) while tests_map is null');
    },
  },
  {
    id: 'validate-rejects-missing-spec-path',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const p = kickoffPath(repo.root, 'L1');
      const bad = 'flightdeck/launch/L1/specs/export-html/spec.v9.json';
      writeText(p, replaceField(readText(p), 'spec', `${bad} @ a1b2c3d`));
      assertRejected(validate(repo, 'L1'), bad, 'header spec path that does not exist');
    },
  },
  {
    id: 'validate-rejects-missing-tests-map-path',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      assertExit(fc(['launch', 'pin', 'tests-map', repo.mapPath, '--allow-draft'], { cwd: repo.root, env: { FLIGHTCREW_LAUNCH: 'L1' } }), 0, 'pin the draft map');
      const p = kickoffPath(repo.root, 'L1');
      const rendered = readText(p);
      assert(!rendered.includes('tests-map: (none)'), 'kickoff carries the map path after the pin');
      const bad = 'flightdeck/launch/L1/specs/export-html/tests-map.v9.json';
      writeText(p, replaceField(rendered, 'tests-map', bad));
      assertRejected(validate(repo, 'L1'), bad, 'header tests-map path that does not exist');
    },
  },
  {
    id: 'validate-rejects-bad-spec-commit',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const p = kickoffPath(repo.root, 'L1');
      const rendered = readText(p);
      assertIncludes(rendered, '@ a1b2c3d', 'rendered commit');
      writeText(p, rendered.replace('@ a1b2c3d', '@ zz'));
      const r = validate(repo, 'L1');
      assertExit(r, 2, 'spec commit that is neither a hex hash nor draft');
      assertMatch(`${r.stdout}\n${r.stderr}`, /error: .*spec/i, 'error line points at the spec commit');
      writeText(p, rendered.replace('@ a1b2c3d', '@ abcdef'));
      assertExit(validate(repo, 'L1'), 2, 'a six-character hex string is not a hash');
      writeText(p, rendered.replace('@ a1b2c3d', '@ draft'));
      assertExit(validate(repo, 'L1'), 2, "'draft' is not accepted while allow_draft is false");
      const full = '0123456789abcdef0123456789abcdef01234567';
      const lp = path.join(launchDir(repo.root, 'L1'), 'launch.json');
      const j = readJson(lp);
      j.spec.commit = full;
      writeJson(lp, j);
      writeText(p, rendered.replace('@ a1b2c3d', `@ ${full}`));
      assertExit(validate(repo, 'L1'), 0, 'a forty-character hex hash matching the launch pin is accepted');
    },
  },
  {
    id: 'validate-draft-commit-needs-allow-draft',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      const rel = draftSpec(repo);
      newLaunch(repo, 'D1', [], rel);
      assertIncludes(readText(kickoffPath(repo.root, 'D1')), '@ draft', 'kickoff reads @ draft');
      const r = validate(repo, 'D1');
      assertExit(r, 2, "'draft' without allow_draft");
      assertMatch(`${r.stdout}\n${r.stderr}`, /error: /, 'an error line');
      assertExit(fc(['launch', 'activate', 'D1', '--allow-draft'], { cwd: repo.root }), 0, 'activate --allow-draft');
      assertEq(readJson(path.join(launchDir(repo.root, 'D1'), 'launch.json')).allow_draft, true, 'allow_draft recorded');
      assertExit(validate(repo, 'D1'), 0, "'draft' accepted under allow_draft");
    },
  },
  {
    id: 'validate-rejects-unresolved-prior-report',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const p = kickoffPath(repo.root, 'L1');
      const bad = 'flightdeck/launch/nope/report.md';
      writeText(p, replaceField(readText(p), 'prior reports', bad));
      assertRejected(validate(repo, 'L1'), bad, 'prior-reports path that does not resolve');
    },
  },
  {
    id: 'validate-rejects-unknown-role-name',
    covers: ['E16'],
    fn: async () => {
      const repo = mkLaunchRepo();
      newLaunch(repo, 'L1');
      const p = kickoffPath(repo.root, 'L1');
      const rendered = readText(p);
      assertMatch(rendered, /^##\s+Roles\b/m, 'Roles heading present');
      assert(!exists(path.join(CREW, 'no-such-crew-member.md')), 'the imaginary role has no crew file');
      writeText(p, rendered.replace(/^(##\s+Roles[^\n]*\n)/m, '$1`no-such-crew-member` (an imaginary role) · '));
      assertRejected(validate(repo, 'L1'), 'no-such-crew-member', 'backticked name under Roles with no crew file');
    },
  },
]);
