// testbench/suites/constraints/run.mjs — T24 (spec C1, C2, C3, C5, C6, C7, C9): static scans of every script under the four in-scope directories for import specifiers, package files and network use; durable-phrase and length scans of the markdown; one-line success output and the three exit codes on a sample of fc commands; write hygiene of commands and of run-all.
// Usage: node flightdeck/testbench/suites/constraints/run.mjs; exit 0 when every case passes, 2 otherwise. The repository is only read; every command runs against a temporary repository.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  suite, fc, hook, sh, tmp, initRepo, mkLaunchRepo, mkActiveLaunch, REPO, FD, FC_MJS, HOOKS, SUITES, WORKFLOWS, MANUALS,
  readText, writeText, exists, listFiles, assert, assertEq, assertExit,
} from '../../lib/suite-lib.mjs';
import { walk, stripCommentsAndStrings, importSpecifiers } from './scan-lib.mjs';

const FLIGHTCREW = path.join(FD, 'flightcrew');
const TESTBENCH = path.join(FD, 'testbench');
const LAUNCH = path.join(FD, 'launch');
const VALIDATORS = path.join(FLIGHTCREW, 'checks', 'validators');
const RUN_ALL = path.join(TESTBENCH, 'run-all.mjs');
const SUITE_LIB = path.join(TESTBENCH, 'lib', 'suite-lib.mjs');

const HOOK_NAMES = ['event-log', 'lock-guard', 'boundary-guard', 'structural-check', 'stop-gate'];
const VALIDATOR_NAMES = ['validate-spec', 'validate-tests-map', 'validate-plan', 'validate-launch', 'validate-kickoff', 'spec-readiness-lint'];
const WORKFLOW_NAMES = ['fc-implement', 'fc-review', 'fc-explore'];
const NETWORK_MODULES = new Set(['node:http', 'node:https', 'node:net', 'node:dgram', 'node:tls', 'http', 'https', 'net', 'dgram', 'tls']);
const PHRASES = ['this session', 'we decided', 'as discussed', 'earlier today', 'the user asked'];
const PACKAGE_FILES = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'npm-shrinkwrap.json'];
const MAX_MANUAL_LINES = 150;

function rel(file) {
  return path.relative(REPO, file).split(path.sep).join('/');
}

/** Every .mjs and .js script under the four in-scope directories (testbench/runs excluded), with the spec-named entry points required to be among them. */
function scripts() {
  const files = [...walk(FLIGHTCREW), ...walk(LAUNCH), ...walk(MANUALS), ...walk(TESTBENCH, { skipDirs: ['runs'] })].filter((f) => /\.(mjs|js)$/.test(f));
  const required = [
    FC_MJS,
    ...HOOK_NAMES.map((n) => path.join(HOOKS, `${n}.mjs`)),
    ...VALIDATOR_NAMES.map((n) => path.join(VALIDATORS, `${n}.mjs`)),
    ...WORKFLOW_NAMES.map((n) => path.join(WORKFLOWS, `${n}.js`)),
    RUN_ALL,
    SUITE_LIB,
  ];
  const missing = required.filter((f) => !files.includes(f)).map(rel);
  assert(missing.length === 0, `scan covers the spec-named scripts; absent: ${missing.join(', ')}`);
  return files;
}

function nonEmptyLines(text) {
  return String(text).split('\n').filter((l) => l.trim() !== '');
}

function lineCount(text) {
  const lines = String(text).split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.length;
}

function gitStatus(dir) {
  const r = sh('git status --porcelain', { cwd: dir });
  assertExit(r, 0, `git status in ${dir}`);
  return r.stdout.split('\n').filter((l) => l !== '');
}

function tmpEntries() {
  return fs.readdirSync(os.tmpdir()).sort();
}

function newItems(before, after) {
  const known = new Set(before);
  return after.filter((x) => !known.has(x));
}

function headOf(dir) {
  const r = sh('git rev-parse HEAD', { cwd: dir });
  assertExit(r, 0, 'git rev-parse HEAD');
  return r.stdout.trim();
}

const PASS_SUITE = "for (const l of ['pass  one', '1/1 passed']) console.log(l);\nprocess.exit(0);\n";
const leakSuite = (name) => `import fs from 'node:fs';\nimport os from 'node:os';\nimport path from 'node:path';\nfs.mkdirSync(path.join(os.tmpdir(), ${JSON.stringify(name)}), { recursive: true });\nfor (const l of ['pass  one', '1/1 passed']) console.log(l);\nprocess.exit(0);\n`;
const DIRTY_SUITE = "import fs from 'node:fs';\nimport path from 'node:path';\nimport { fileURLToPath } from 'node:url';\nconst root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');\nfs.writeFileSync(path.join(root, 'stray-file.txt'), 'left behind by a suite\\n');\nfor (const l of ['pass  one', '1/1 passed']) console.log(l);\nprocess.exit(0);\n";

function mkTestbench(suites) {
  assert(exists(RUN_ALL), 'flightdeck/testbench/run-all.mjs exists');
  const root = tmp('fc-constraints-runall');
  const tb = path.join(root, 'flightdeck', 'testbench');
  fs.mkdirSync(path.join(tb, 'suites'), { recursive: true });
  fs.copyFileSync(RUN_ALL, path.join(tb, 'run-all.mjs'));
  for (const [name, body] of Object.entries(suites)) writeText(path.join(tb, 'suites', name, 'run.mjs'), body);
  initRepo(root);
  return { root, run: () => sh(`"${process.execPath}" "${path.join(tb, 'run-all.mjs')}"`, { cwd: root }) };
}

await suite('constraints', [
  {
    id: 'C1-imports-are-node-builtins-or-relative-inside-scope',
    covers: ['C1'],
    fn: () => {
      const problems = [];
      for (const file of scripts()) {
        for (const spec of importSpecifiers(readText(file))) {
          if (spec.startsWith('node:')) continue;
          if (!spec.startsWith('./') && !spec.startsWith('../')) {
            problems.push(`${rel(file)}: bare specifier '${spec}'`);
            continue;
          }
          const resolved = path.resolve(path.dirname(file), spec);
          const inside = resolved.startsWith(FLIGHTCREW + path.sep) || resolved.startsWith(TESTBENCH + path.sep);
          if (!inside) problems.push(`${rel(file)}: '${spec}' resolves outside flightcrew/ and testbench/`);
          else if (!exists(resolved)) problems.push(`${rel(file)}: '${spec}' does not resolve to a file`);
        }
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'C1-no-package-json-node-modules-or-lock-files',
    covers: ['C1'],
    fn: () => {
      const offenders = [];
      for (const dir of [FLIGHTCREW, LAUNCH, TESTBENCH, MANUALS]) {
        assert(exists(dir), `in-scope directory exists: ${rel(dir)}`);
        const visit = (current) => {
          for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
            if (entry.name === '.git') continue;
            const full = path.join(current, entry.name);
            if (entry.isDirectory() && entry.name === 'node_modules') offenders.push(rel(full));
            else if (entry.isDirectory()) visit(full);
            else if (PACKAGE_FILES.includes(entry.name)) offenders.push(rel(full));
          }
        };
        visit(dir);
      }
      assert(offenders.length === 0, `package files present: ${offenders.join(', ')}`);
    },
  },
  {
    id: 'C6-no-network-modules-and-no-fetch',
    covers: ['C6'],
    fn: () => {
      const problems = [];
      const fetchCall = new RegExp('\\bfetch\\s*\\(');
      for (const file of scripts()) {
        const src = readText(file);
        for (const spec of importSpecifiers(src)) if (NETWORK_MODULES.has(spec)) problems.push(`${rel(file)}: imports ${spec}`);
        const code = stripCommentsAndStrings(src);
        const lines = code.split('\n');
        lines.forEach((line, i) => {
          if (fetchCall.test(line)) problems.push(`${rel(file)}:${i + 1}: calls fetch`);
        });
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'C5-markdown-carries-no-session-phrases',
    covers: ['C5'],
    fn: () => {
      const singles = [path.join(FLIGHTCREW, 'README.md'), path.join(LAUNCH, 'README.md'), path.join(TESTBENCH, 'README.md')];
      const dirs = ['crew', 'templates', 'hooks', 'workflows'].map((d) => path.join(FLIGHTCREW, d));
      const files = [...singles];
      for (const dir of dirs) {
        const md = walk(dir).filter((f) => f.endsWith('.md'));
        assert(md.length > 0, `${rel(dir)} holds markdown to scan`);
        files.push(...md);
      }
      const manuals = walk(MANUALS).filter((f) => f.endsWith('.md'));
      assert(manuals.length > 0, 'manuals/ holds markdown to scan');
      files.push(...manuals);
      const problems = [];
      for (const file of files) {
        assert(exists(file), `markdown file exists: ${rel(file)}`);
        const lines = readText(file).split('\n');
        lines.forEach((line, i) => {
          const lower = line.toLowerCase();
          for (const phrase of PHRASES) if (lower.includes(phrase)) problems.push(`${rel(file)}:${i + 1}: '${phrase}'`);
        });
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'C9-manuals-at-most-150-lines',
    covers: ['C9'],
    fn: () => {
      const problems = [];
      for (const name of ['orchestration', 'harness', 'launch']) {
        const dir = path.join(MANUALS, name);
        const files = walk(dir);
        assert(files.length > 0, `manuals/${name} exists and holds files`);
        for (const file of files) {
          const n = lineCount(readText(file));
          if (n > MAX_MANUAL_LINES) problems.push(`${rel(file)}: ${n} lines`);
        }
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
  {
    id: 'C3-success-prints-at-most-one-line-and-exit-codes',
    covers: ['C3'],
    fn: () => {
      const repo = mkLaunchRepo();
      const env = { FLIGHTCREW_ROOT: repo.root };
      const one = (args, cwd, label) => {
        const r = fc(args, { cwd, env: { FLIGHTCREW_ROOT: cwd } });
        assertExit(r, 0, label);
        const lines = nonEmptyLines(r.stdout);
        assert(lines.length <= 1, `${label} prints at most one line on success (got ${lines.length}: ${lines.slice(0, 3).join(' / ')})`);
      };
      one(['launch', 'new', repo.specPath, '--name', 'export-html-1'], repo.root, 'fc launch new');
      one(['launch', 'activate', 'export-html-1'], repo.root, 'fc launch activate');
      one(['launch', 'note', 'a note from the constraints suite'], repo.root, 'fc launch note');
      one(['check', 'all', '--baseline', repo.mapPath], repo.root, 'fc check all --baseline');
      const active = mkActiveLaunch();
      const base = headOf(active.root);
      one(['check', 'all'], active.root, 'fc check all');
      one(['boundary', '--base', base], active.root, 'fc boundary');
      one(['locked', '--base', base], active.root, 'fc locked');
      one(['evidence'], active.root, 'fc evidence');
      one(['report'], active.root, 'fc report');
      assertExit(fc([], { cwd: repo.root, env }), 1, 'fc with no command is a usage error');
      assertExit(fc(['no-such-command'], { cwd: repo.root, env }), 1, 'fc with an unknown command is a usage error');
      assertExit(fc(['launch', 'activate', 'no-such-launch'], { cwd: repo.root, env }), 1, 'fc launch activate on a missing launch is an error');
      // The 2 arm: a failed check and a blocking decision, both against the active-launch repository the green calls above left clean.
      writeText(path.join(active.root, 'src', 'export', 'index.mjs'), 'throw new Error("the export module is broken");\n');
      assertExit(fc(['check', 'all'], { cwd: active.root, env: active.env }), 2, 'a red check exits 2');
      writeText(path.join(active.root, 'README.md'), `${readText(path.join(active.root, 'README.md'))}\nA line outside every allowed path.\n`);
      assertExit(fc(['boundary', '--base', base], { cwd: active.root, env: active.env }), 2, 'a change outside the allowed paths exits 2');
    },
  },
  {
    id: 'C2-commands-and-hooks-write-only-inside-their-launch-root',
    covers: ['C2'],
    fn: () => {
      const repo = mkLaunchRepo();
      const active = mkActiveLaunch();
      const repoStatusBefore = gitStatus(REPO);
      const env = { FLIGHTCREW_ROOT: repo.root };
      assertExit(fc(['launch', 'new', repo.specPath, '--name', 'export-html-1'], { cwd: repo.root, env }), 0, 'fc launch new');
      assertExit(fc(['launch', 'activate', 'export-html-1'], { cwd: repo.root, env }), 0, 'fc launch activate');
      assertExit(fc(['check', 'all', '--baseline', repo.mapPath], { cwd: repo.root, env }), 0, 'fc check all --baseline');
      assertExit(fc(['check', 'all'], { cwd: active.root, env: active.env }), 0, 'fc check all');
      assertExit(fc(['report'], { cwd: active.root, env: active.env }), 0, 'fc report');
      assertExit(fc(['evidence'], { cwd: active.root, env: active.env }), 0, 'fc evidence');
      const envelope = { session_id: 'constraints', transcript_path: '/dev/null', cwd: active.root, permission_mode: 'default', hook_event_name: 'SessionStart', mode: 'startup' };
      assertExit(hook('event-log', envelope, { cwd: active.root, env: active.env }), 0, 'event-log hook');
      // C2's one exception: fc distribute --apply may write into the target directory named on the command line, and nowhere else.
      const target = tmp('fc-c2-target');
      assertExit(fc(['distribute', '--apply', '--target', target], { cwd: repo.root, env }), 0, 'fc distribute --apply');
      assert(listFiles(target).length > 0, 'the apply wrote into the target it was given');
      assertEq(newItems(repoStatusBefore, gitStatus(REPO)), [], 'no new git status line in the repository');
      for (const root of [repo.root, active.root]) {
        const outside = gitStatus(root).filter((line) => !line.slice(3).replace(/^"/, '').startsWith('flightdeck/launch/'));
        assertEq(outside, [], `every write in ${path.basename(root)} landed under flightdeck/launch/`);
      }
    },
  },
  {
    id: 'C7-run-all-leaves-tmpdir-and-git-status-unchanged',
    covers: ['C7', 'C2'],
    fn: () => {
      const tb = mkTestbench({ 'suite-a': PASS_SUITE, 'suite-b': PASS_SUITE });
      const tmpBefore = tmpEntries();
      const statusBefore = gitStatus(tb.root);
      const r = tb.run();
      assertExit(r, 0, 'run-all with clean suites');
      assertEq(newItems(tmpBefore, tmpEntries()), [], 'no new entry under os.tmpdir() after run-all');
      const outside = newItems(statusBefore, gitStatus(tb.root)).filter((l) => !l.slice(3).startsWith('flightdeck/testbench/runs'));
      assertEq(outside, [], 'no new git status line outside flightdeck/testbench/runs/');
    },
  },
  {
    id: 'C7-run-all-fails-on-a-tmpdir-leak-or-a-stray-file',
    covers: ['C7'],
    fn: () => {
      const leaked = `fc-constraints-leak-${process.pid}-${Date.now()}`;
      try {
        const leaky = mkTestbench({ 'suite-a': PASS_SUITE, 'suite-b': leakSuite(leaked) });
        assertExit(leaky.run(), 2, 'run-all with a suite leaving a tmpdir entry');
      } finally {
        fs.rmSync(path.join(os.tmpdir(), leaked), { recursive: true, force: true });
      }
      const dirty = mkTestbench({ 'suite-a': PASS_SUITE, 'suite-b': DIRTY_SUITE });
      const r = dirty.run();
      assert(exists(path.join(dirty.root, 'stray-file.txt')), 'the fake suite left a stray file in its repository');
      assertExit(r, 2, 'run-all with a suite adding a git status line outside runs/');
    },
  },
  {
    id: 'C7-suites-create-temp-dirs-only-with-cleanup',
    covers: ['C7', 'C2'],
    fn: () => {
      const files = walk(SUITES).filter((f) => /\.(mjs|js)$/.test(f));
      assert(files.length > 0, 'suites exist to scan');
      const problems = [];
      for (const file of files) {
        const code = stripCommentsAndStrings(readText(file));
        const makesTemp = /\bmkdtempSync\b|\bmkdtemp\b|\btmpdir\s*\(/.test(code);
        if (!makesTemp) continue;
        const cleansUp = /\brmSync\b|\brm\s*\(/.test(code);
        if (!cleansUp) problems.push(`${rel(file)} creates temp directories and never removes them`);
      }
      assert(problems.length === 0, problems.join(' | '));
    },
  },
]);
