#!/usr/bin/env node
// suites/crew-files — every crew file against I7, field by field: the roster, the frontmatter, the write bans, the isolation, the wired hooks, the closing return block and the inputs sentence. Covers B71, I7.
import path from 'node:path';
import {
  CREW, RUN_ROLES, SPEC_CHAIN_ROLES, SUBAGENT_ROLES, assert, assertEq, assertIncludes, exists,
  frontmatter, listFiles, readText, suite,
} from '../../lib/core-lib.mjs';

const file = (role) => path.join(CREW, `${role}.md`);
const fm = (role) => frontmatter(file(role)).data;
const body = (role) => frontmatter(file(role)).body;
const asList = (value) => (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

const SESSION_AGENTS = ['spec-builder', 'test-builder'];
const WORKTREE = ['implementer', 'strong-worker'];
const GATED = ['implementer', 'strong-worker', 'interface-builder'];

await suite('crew-files', [
  {
    id: 'I7 the roster is exactly the thirteen run roles and the three spec-chain files',
    covers: ['I7', 'B71'],
    fn: () => {
      const found = listFiles(CREW).filter((name) => name.endsWith('.md')).map((name) => name.replace(/\.md$/, '')).sort();
      assertEq(found, [...RUN_ROLES, ...SPEC_CHAIN_ROLES].sort(), 'crew/ holds one file per role and nothing else');
    },
  },
  {
    id: 'I7 every crew file carries name, description, tools and a model that is never inherit',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of [...RUN_ROLES, ...SPEC_CHAIN_ROLES]) {
        const data = fm(role);
        assert(data !== null, `crew/${role}.md has frontmatter`);
        assertEq(data.name, role, `${role}: name matches the file name`);
        assert(typeof data.description === 'string' && data.description.trim() !== '', `${role}: description is filled`);
        assert(asList(data.tools).length > 0, `${role}: tools are named`);
        assert(typeof data.model === 'string' && data.model.trim() !== '', `${role}: model is named`);
        assert(data.model !== 'inherit', `${role}: model is never inherit`);
      }
    },
  },
  {
    id: 'I7 every subagent declares maxTurns and the two session agents do not',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of SUBAGENT_ROLES) {
        const data = fm(role);
        assert(Number.isInteger(data.maxTurns) && data.maxTurns > 0, `${role}: maxTurns is a positive integer, got ${data.maxTurns}`);
      }
      for (const role of SESSION_AGENTS) {
        const data = fm(role);
        assert(data.maxTurns === undefined, `${role} is a session agent and declares no maxTurns`);
        assertIncludes(asList(data.tools).join(' '), 'AskUserQuestion', `${role} holds AskUserQuestion`);
      }
    },
  },
  {
    id: 'I7 every role not granted the write tools bans Write and Edit by name',
    covers: ['B71', 'I7'],
    fn: () => {
      let checked = 0;
      for (const role of [...RUN_ROLES, ...SPEC_CHAIN_ROLES]) {
        const tools = asList(fm(role).tools);
        const writes = tools.includes('Write') || tools.includes('Edit');
        if (writes) continue;
        checked += 1;
        const banned = asList(fm(role).disallowedTools);
        for (const tool of ['Write', 'Edit']) assertIncludes(banned, tool, `${role} is not granted the write tools, so disallowedTools names ${tool}`);
      }
      assert(checked > 0, 'at least one role must not write');
    },
  },
  {
    id: 'I7 isolation worktree is declared on the implementer and the strong worker, and on no one else',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of [...RUN_ROLES, ...SPEC_CHAIN_ROLES]) {
        const isolation = fm(role).isolation;
        if (WORKTREE.includes(role)) assertEq(isolation, 'worktree', `${role}: isolation worktree`);
        else assert(isolation !== 'worktree', `${role}: no worktree isolation`);
      }
    },
  },
  {
    id: 'I7 the three gated roles wire the PostToolUse check and the SubagentStop gate',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of GATED) {
        const raw = frontmatter(file(role)).raw;
        assert(/PostToolUse/.test(raw), `${role}: a PostToolUse hook is wired`);
        assert(/check-after-edit/.test(raw), `${role}: the PostToolUse hook is check-after-edit`);
        assert(/SubagentStop/.test(raw), `${role}: a SubagentStop hook is wired`);
        assert(/Edit\|Write/.test(raw), `${role}: the PostToolUse matcher is Edit|Write`);
      }
      for (const role of RUN_ROLES.filter((r) => !GATED.includes(r))) {
        assert(!/check-after-edit/.test(frontmatter(file(role)).raw), `${role}: no check-after-edit hook`);
      }
    },
  },
  {
    id: 'I7 the steward holds Bash alone; the orchestrator holds gh and git push; the explorer holds the web tools',
    covers: ['B71', 'I7'],
    fn: () => {
      assertEq(asList(fm('steward').tools), ['Bash'], 'the steward holds Bash and nothing else');
      const orchestrator = `${asList(fm('orchestrator').tools).join(' ')} ${body('orchestrator')}`;
      assertIncludes(asList(fm('orchestrator').tools).join(' '), 'Bash', 'the orchestrator holds Bash');
      assert(/gh\b/.test(orchestrator), 'the orchestrator reaches gh');
      assert(/git push/.test(orchestrator), 'the orchestrator reaches git push');
      const explorer = asList(fm('explorer').tools).join(' ');
      assertIncludes(explorer, 'WebFetch', 'the explorer holds WebFetch');
      assertIncludes(explorer, 'WebSearch', 'the explorer holds WebSearch');
    },
  },
  {
    id: 'I7 every subagent body ends with a fenced JSON return block',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of SUBAGENT_ROLES) {
        const text = body(role).trimEnd();
        const fences = [...text.matchAll(/```json\n([\s\S]*?)```/g)];
        assert(fences.length > 0, `${role}: the body carries a fenced JSON block`);
        const last = fences.at(-1);
        assertEq(text.endsWith('```'), true, `${role}: the body ends with the fenced block`);
        try {
          JSON.parse(last[1]);
        } catch (error) {
          throw new Error(`${role}: the closing fenced block is not JSON: ${error.message}`);
        }
      }
    },
  },
  {
    id: 'I7 every subagent body carries the inputs sentence',
    covers: ['B71', 'I7'],
    fn: () => {
      for (const role of SUBAGENT_ROLES) {
        assertIncludes(body(role), 'Your inputs are only those named in the dispatch', `${role}: the inputs sentence`);
      }
    },
  },
  {
    id: 'I7 the steward names one invocation per dispatch and returns its exit and output',
    covers: ['B71', 'I7'],
    fn: () => {
      const text = body('steward');
      assert(/one\b[^.]*\b(leaf|invocation|command)/i.test(text), 'the steward runs one invocation per dispatch');
      assert(/exit/i.test(text), 'the steward returns the exit code');
    },
  },
  {
    id: 'I7 the three spec-chain files are there and are not touched by the run roster rules',
    covers: ['I7'],
    fn: () => {
      for (const role of SPEC_CHAIN_ROLES) assert(exists(file(role)), `crew/${role}.md exists`);
      assert(readText(file('spec-builder')).length > 0, 'spec-builder.md is not empty');
    },
  },
]);
