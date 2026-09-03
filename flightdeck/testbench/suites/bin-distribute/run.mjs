// testbench/suites/bin-distribute/run.mjs — T20 (spec B29, E10): fc distribute dry run writes nothing; --apply --target copies crew files with frontmatter and workflow scripts only, prints the fragment, and refuses conflicts unless --force.
// Usage: node flightdeck/testbench/suites/bin-distribute/run.mjs; exit 0 when every case passes, 2 otherwise. Every target directory is temporary; the repository's own .claude is never the target.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, tmp, REPO, CREW, WORKFLOWS, HOOKS, TEMPLATES, readJson, readText, writeText, exists, listFiles,
  assert, assertEq, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

const ROLES = ['spec-builder', 'spec-judge', 'spec-attacker', 'explorer', 'test-builder', 'planner', 'orchestrator', 'implementer', 'verifier', 'critic'];
const WORKFLOW_NAMES = ['fc-implement.js', 'fc-review.js', 'fc-explore.js'];

function crewWithFrontmatter() {
  return fs.readdirSync(CREW)
    .filter((name) => name.endsWith('.md') && readText(path.join(CREW, name)).startsWith('---'))
    .sort();
}

function workflowScripts() {
  return fs.readdirSync(WORKFLOWS).filter((name) => name.endsWith('.js')).sort();
}

function distribute(target, ...flags) {
  return fc(['distribute', '--target', target, ...flags], { cwd: REPO });
}

function hookCommands() {
  const fragment = readJson(path.join(HOOKS, 'settings.fragment.json'));
  const commands = [];
  for (const entries of Object.values(fragment.hooks ?? {})) {
    for (const entry of entries) for (const h of entry.hooks ?? []) if (typeof h.command === 'string') commands.push(h.command);
  }
  assert(commands.length > 0, 'settings.fragment.json declares hook commands');
  return commands;
}

function assertApplied(target) {
  const crew = crewWithFrontmatter();
  for (const role of ROLES) assertIncludes(crew, `${role}.md`, 'crew file with frontmatter present for role');
  const agents = listFiles(path.join(target, 'agents', 'flightcrew'));
  assertEq(agents, crew, 'agents/flightcrew/ holds exactly the crew files carrying frontmatter');
  for (const name of crew) {
    assertEq(readText(path.join(target, 'agents', 'flightcrew', name)), readText(path.join(CREW, name)), `${name} copied byte-equal`);
  }
  assert(!exists(path.join(target, 'agents', 'flightcrew', 'README.md')), 'crew README.md (no frontmatter) is not copied');
  const workflows = workflowScripts();
  for (const name of WORKFLOW_NAMES) assertIncludes(workflows, name, 'workflow script present');
  assertEq(listFiles(path.join(target, 'workflows')), workflows, 'workflows/ holds exactly the workflow scripts');
  for (const name of workflows) {
    assertEq(readText(path.join(target, 'workflows', name)), readText(path.join(WORKFLOWS, name)), `${name} copied byte-equal`);
  }
  const expected = [...crew.map((n) => `agents/flightcrew/${n}`), ...workflows.map((n) => `workflows/${n}`)].sort();
  assertEq(listFiles(target), expected, 'the target holds exactly the crew and workflow copies (no hook, schema, template or manifest file)');
}

await suite('bin-distribute', [
  {
    id: 'dry-run-lists-and-writes-nothing',
    covers: ['B29'],
    fn: () => {
      const target = tmp('fc-distribute-dry');
      const r = distribute(target);
      assertExit(r, 0, 'fc distribute (dry run)');
      assertEq(listFiles(target), [], 'dry run writes nothing into the target');
      assertIncludes(r.stdout, 'agents/flightcrew', 'dry run lists the crew copies');
      assertIncludes(r.stdout, 'workflows', 'dry run lists the workflow copies');
      for (const role of ROLES) assertIncludes(r.stdout, `${role}.md`, 'dry run names each crew file');
    },
  },
  {
    id: 'apply-copies-crew-and-workflows-only',
    covers: ['B29'],
    fn: () => {
      const target = tmp('fc-distribute-apply');
      const r = distribute(target, '--apply');
      assertExit(r, 0, 'fc distribute --apply --target');
      assertApplied(target);
    },
  },
  {
    id: 'apply-prints-fragment-gitignore-and-constitution',
    covers: ['B29'],
    fn: () => {
      const target = tmp('fc-distribute-print');
      const r = distribute(target, '--apply');
      assertExit(r, 0, 'fc distribute --apply --target');
      assertIncludes(r.stdout, process.execPath, 'the absolute node path is substituted into the printed fragment');
      for (const command of hookCommands()) {
        const substituted = command.replace(/^node(?=\s)/, process.execPath);
        const escaped = JSON.stringify(substituted).slice(1, -1);
        assert(r.stdout.includes(substituted) || r.stdout.includes(escaped), `printed fragment carries the hook command with node substituted: ${command}`);
      }
      assertIncludes(r.stdout, '.claude/worktrees/', 'the gitignore line is printed');
      const constitution = readText(path.join(TEMPLATES, 'constitution-fragment.md'));
      const firstLine = constitution.split('\n').map((l) => l.trim()).find((l) => l.length > 0);
      assert(firstLine, 'constitution-fragment.md has content');
      assertIncludes(r.stdout, firstLine, 'the constitution fragment is printed');
    },
  },
  {
    id: 'apply-twice-with-identical-content-succeeds',
    covers: ['E10'],
    fn: () => {
      const target = tmp('fc-distribute-again');
      assertExit(distribute(target, '--apply'), 0, 'first apply');
      const r = distribute(target, '--apply');
      assertExit(r, 0, 'second apply over identical files');
      assertApplied(target);
    },
  },
  {
    id: 'conflict-lists-paths-copies-nothing-exits-2',
    covers: ['E10'],
    fn: () => {
      const target = tmp('fc-distribute-conflict');
      assertExit(distribute(target, '--apply'), 0, 'first apply');
      const crew = crewWithFrontmatter();
      const changed = path.join(target, 'agents', 'flightcrew', crew[0]);
      const localText = `${readText(changed)}\nlocal change kept by the target\n`;
      writeText(changed, localText);
      const removed = path.join(target, 'workflows', workflowScripts()[0]);
      fs.rmSync(removed);
      const r = distribute(target, '--apply');
      assertExit(r, 2, 'apply over a differing target file');
      assertIncludes(`${r.stdout}\n${r.stderr}`, crew[0], 'the conflicting path is listed');
      assertEq(readText(changed), localText, 'the differing file is left untouched');
      assert(!exists(removed), 'nothing is copied while a conflict exists');
    },
  },
  {
    id: 'force-overwrites-conflicts',
    covers: ['E10'],
    fn: () => {
      const target = tmp('fc-distribute-force');
      assertExit(distribute(target, '--apply'), 0, 'first apply');
      const crew = crewWithFrontmatter();
      const changed = path.join(target, 'agents', 'flightcrew', crew[0]);
      writeText(changed, `${readText(changed)}\nlocal change\n`);
      const removed = path.join(target, 'workflows', workflowScripts()[0]);
      fs.rmSync(removed);
      const r = distribute(target, '--apply', '--force');
      assertExit(r, 0, 'apply --force over a differing target file');
      assertApplied(target);
    },
  },
]);
