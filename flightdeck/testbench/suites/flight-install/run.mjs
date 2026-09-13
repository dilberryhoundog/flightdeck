#!/usr/bin/env node
// suites/flight-install — flight install: the set it writes with --apply, the single CLAUDE.md block, the single .gitignore line, the dry run, and the conflict refusal. Covers B16, B17, B18, B19, B20, E13, I11, I17.
import fs from 'node:fs';
import path from 'node:path';
import {
  CORE_HOOKS, CORE_WORKFLOWS, CREW, assert, assertEq, assertExit, assertIncludes, assertMatch, exists,
  flight, listFiles, mkBareRepo, readJson, readText, suite, writeJson, writeText,
} from '../../lib/core-lib.mjs';

const TARGET = '.claude';
const install = (repo, args = []) => flight(['install', ...args], { cwd: repo.root, env: repo.env });
const apply = (repo, extra = []) => install(repo, ['--apply', '--target', TARGET, ...extra]);
const at = (repo, ...parts) => path.join(repo.root, ...parts);

const crewFiles = () => listFiles(CREW).filter((name) => name.endsWith('.md'));
const workflowFiles = () => (exists(CORE_WORKFLOWS) ? listFiles(CORE_WORKFLOWS).filter((name) => name.endsWith('.js')) : []);

/** The four sentences I11 fixes for the Flightcrew block. */
const BLOCK_LINES = [
  'Launches live under flightdeck/launch/<name>/; a run is runs/run-<n>/ (see flightdeck/launch/README.md)',
  'Frozen: any JSON file whose status is frozen; locked: specs/**, runs/*/checks/** and the pinned map’s locked paths',
  'Checks: flightdeck/flightcrew/bin/flight check',
  'A role reads its own dispatch and nothing else',
];

function blockOf(text) {
  const match = /^# Flightcrew$([\s\S]*?)(?=^# |\Z)/m.exec(text);
  return match ? match[0] : null;
}

await suite('flight-install', [
  {
    id: 'B16 every crew file is written under the target, byte-equal',
    covers: ['B16', 'I17'],
    fn: () => {
      const repo = mkBareRepo();
      const result = apply(repo);
      assertExit(result, 0, `flight install --apply: ${result.stdout}${result.stderr}`);
      for (const name of crewFiles()) {
        const written = at(repo, TARGET, 'agents', 'flightcrew', name);
        assert(exists(written), `${TARGET}/agents/flightcrew/${name} is written`);
        assertEq(fs.readFileSync(written).toString('base64'), fs.readFileSync(path.join(CREW, name)).toString('base64'), `${name} is byte-equal`);
      }
    },
  },
  {
    id: 'B16 every workflow of the suite is written under the target, byte-equal',
    covers: ['B16', 'I17'],
    fn: () => {
      const repo = mkBareRepo();
      apply(repo);
      const names = workflowFiles();
      assert(names.length > 0, 'the workflow suite has files to install');
      for (const name of names) {
        const written = at(repo, TARGET, 'workflows', name);
        assert(exists(written), `${TARGET}/workflows/${name} is written`);
        assertEq(fs.readFileSync(written).toString('base64'), fs.readFileSync(path.join(CORE_WORKFLOWS, name)).toString('base64'), `${name} is byte-equal`);
      }
    },
  },
  {
    id: 'I17 settings.json carries the fragment hooks, sandbox and worktree entries and one permission per agent and workflow',
    covers: ['I17', 'B16'],
    fn: () => {
      const repo = mkBareRepo();
      apply(repo);
      const settings = readJson(at(repo, TARGET, 'settings.json'));
      const fragment = readJson(path.join(CORE_HOOKS, 'settings.fragment.json'));
      for (const event of Object.keys(fragment.hooks ?? {})) {
        assert(settings.hooks?.[event] !== undefined, `settings.json carries the ${event} hooks of the fragment`);
      }
      assertEq(settings.sandbox, fragment.sandbox, 'the sandbox section is merged in');
      assertEq(settings.worktree, fragment.worktree, 'the worktree section is merged in');
      const allow = settings.permissions?.allow ?? [];
      for (const name of crewFiles()) assertIncludes(allow, `Agent(${name.replace(/\.md$/, '')})`, 'one Agent permission per crew file');
      for (const name of workflowFiles()) assertIncludes(allow, `Workflow(${name.replace(/\.js$/, '')})`, 'one Workflow permission per workflow');
    },
  },
  {
    id: 'B18 with no CLAUDE.md, one is created holding the Flightcrew block',
    covers: ['B18', 'I11'],
    fn: () => {
      const repo = mkBareRepo();
      fs.rmSync(at(repo, 'CLAUDE.md'), { force: true });
      apply(repo);
      const text = readText(at(repo, 'CLAUDE.md'));
      const block = blockOf(text);
      assert(block !== null, 'the file holds a # Flightcrew section');
      for (const line of BLOCK_LINES) assertIncludes(block.replace(/[’']/g, "'"), line.replace(/[’']/g, "'"), 'the block carries its I11 sentence');
    },
  },
  {
    id: 'B17 an existing block is replaced, never added beside',
    covers: ['B17', 'I11'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(at(repo, 'CLAUDE.md'), '# House rules\n\nKeep it short.\n\n# Flightcrew\n\nan older block that says something else\n\n# After\n\nkeep me.\n');
      apply(repo, ['--force']);
      const text = readText(at(repo, 'CLAUDE.md'));
      assertEq((text.match(/^# Flightcrew$/gm) ?? []).length, 1, 'exactly one Flightcrew heading');
      assert(!text.includes('an older block that says something else'), 'the old block is gone');
      assertIncludes(text, '# House rules', 'the section before it survives');
      assertIncludes(text, 'keep me.', 'the section after it survives');
    },
  },
  {
    id: 'I11 the block ends at the next top-level heading',
    covers: ['I11'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(at(repo, 'CLAUDE.md'), '# Flightcrew\n\nold\n\n# Other\n\nuntouched line\n');
      apply(repo, ['--force']);
      const block = blockOf(readText(at(repo, 'CLAUDE.md')));
      assert(!block.includes('untouched line'), 'the block stops at the next # heading');
      assertIncludes(readText(at(repo, 'CLAUDE.md')), 'untouched line', 'the next section survives');
    },
  },
  {
    id: 'B20 with no .gitignore, the control centre line is written',
    covers: ['B20', 'I17'],
    fn: () => {
      const repo = mkBareRepo();
      fs.rmSync(at(repo, '.gitignore'), { force: true });
      apply(repo);
      assertMatch(readText(at(repo, '.gitignore')), /^flightdeck\/\.controlcenter$/m, 'the line is written');
    },
  },
  {
    id: 'B20 with a .gitignore that lacks the line, the line is appended and the rest survives',
    covers: ['B20'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(at(repo, '.gitignore'), 'node_modules/\n*.log\n');
      apply(repo);
      const text = readText(at(repo, '.gitignore'));
      assertMatch(text, /^flightdeck\/\.controlcenter$/m, 'the line is written');
      assertIncludes(text, 'node_modules/', 'the earlier lines survive');
    },
  },
  {
    id: 'B19 with the line already there, nothing is added',
    covers: ['B19'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(at(repo, '.gitignore'), 'node_modules/\nflightdeck/.controlcenter\n');
      const before = readText(at(repo, '.gitignore'));
      apply(repo);
      assertEq(readText(at(repo, '.gitignore')), before, '.gitignore is byte-identical');
    },
  },
  {
    id: 'E13 without --apply the planned writes are printed, one path per line, and nothing is written',
    covers: ['E13'],
    fn: () => {
      const repo = mkBareRepo();
      const before = listFiles(repo.root);
      const result = install(repo, ['--target', TARGET]);
      assertExit(result, 0, 'the dry run');
      const lines = result.stdout.split('\n').filter((line) => line.trim() !== '');
      assert(lines.length >= crewFiles().length, 'every planned write is listed');
      for (const line of lines) assertMatch(line.trim(), /^[\w./-]+$/, 'each line is a path and nothing else');
      assertIncludes(lines.map((l) => l.trim()), `${TARGET}/settings.json`, 'the settings file is among the planned writes');
      assertEq(listFiles(repo.root), before, 'the dry run writes nothing');
    },
  },
  {
    id: 'E13 a settings key holding a different value is a conflict: nothing is written, exit 2',
    covers: ['E13'],
    fn: () => {
      const repo = mkBareRepo();
      const fragment = readJson(path.join(CORE_HOOKS, 'settings.fragment.json'));
      writeJson(at(repo, TARGET, 'settings.json'), { ...fragment, worktree: { baseRef: 'main' } });
      const before = listFiles(repo.root).map((rel) => `${rel}:${fs.readFileSync(at(repo, rel)).toString('base64')}`);
      const result = apply(repo);
      assertExit(result, 2, 'a conflicting settings key');
      assertMatch(`${result.stdout}${result.stderr}`, /worktree/, 'the conflicting key is listed');
      assertEq(listFiles(repo.root).map((rel) => `${rel}:${fs.readFileSync(at(repo, rel)).toString('base64')}`), before, 'nothing is written');
    },
  },
  {
    id: 'E13 an agent file with different content is a conflict, and --force writes through it',
    covers: ['E13'],
    fn: () => {
      const repo = mkBareRepo();
      const name = crewFiles()[0];
      writeText(at(repo, TARGET, 'agents', 'flightcrew', name), '---\nname: drifted\n---\n\nnot the crew file.\n');
      const result = apply(repo);
      assertExit(result, 2, 'a drifted agent file');
      assertMatch(`${result.stdout}${result.stderr}`, new RegExp(name.replace('.', '\\.')), 'the conflicting path is listed');
      assertEq(readText(at(repo, TARGET, 'agents', 'flightcrew', name)), '---\nname: drifted\n---\n\nnot the crew file.\n', 'nothing is written without --force');
      assertExit(apply(repo, ['--force']), 0, 'with --force');
      assertEq(
        fs.readFileSync(at(repo, TARGET, 'agents', 'flightcrew', name)).toString('base64'),
        fs.readFileSync(path.join(CREW, name)).toString('base64'),
        '--force writes the crew file through',
      );
    },
  },
  {
    id: 'E13 a Flightcrew block whose text differs is a conflict',
    covers: ['E13'],
    fn: () => {
      const repo = mkBareRepo();
      writeText(at(repo, 'CLAUDE.md'), '# Flightcrew\n\nsomething else entirely\n');
      const result = apply(repo);
      assertExit(result, 2, 'a drifted CLAUDE.md block');
      assertMatch(`${result.stdout}${result.stderr}`, /CLAUDE\.md/, 'the conflicting path is listed');
      assertIncludes(readText(at(repo, 'CLAUDE.md')), 'something else entirely', 'nothing is written');
    },
  },
  {
    id: 'B16 a second --apply over its own output is quiet and changes nothing',
    covers: ['B16'],
    fn: () => {
      const repo = mkBareRepo();
      assertExit(apply(repo), 0, 'the first apply');
      const before = listFiles(repo.root).map((rel) => `${rel}:${fs.readFileSync(at(repo, rel)).toString('base64')}`);
      assertExit(apply(repo), 0, 'the second apply');
      assertEq(listFiles(repo.root).map((rel) => `${rel}:${fs.readFileSync(at(repo, rel)).toString('base64')}`), before, 'the install set is idempotent');
    },
  },
]);
