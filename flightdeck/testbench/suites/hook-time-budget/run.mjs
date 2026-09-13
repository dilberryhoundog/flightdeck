#!/usr/bin/env node
// suites/hook-time-budget — C4: every hook answers a minimal envelope for its event against the sample launch inside two seconds, best of three, and the worker gate declares its longer timeout where it is wired.
import path from 'node:path';
import {
  CORE_HOOKS, CREW, assert, assertEq, coreHook, exists, fenced, listFiles, mkCoreLaunch, preToolUse,
  readText, sessionStart, subagentStop, suite,
} from '../../lib/core-lib.mjs';

const BUDGET_MS = 2000;
const GATE_TIMEOUT = 600;

const hookNames = () =>
  listFiles(CORE_HOOKS)
    .filter((name) => name.endsWith('.mjs') && !name.includes('/'))
    .map((name) => name.replace(/\.mjs$/, ''));

const GREEN_RETURN = { unit: 'U1', status: 'green', branch: 'sample-core/exporter-core', worktree: '.worktrees/U1', spec_refs: ['B1'], checks: [], artefacts: [], commits: [], iterations: 1, halt: null, notes: '' };

function envelopeFor(name, made) {
  if (['frozen-guard', 'locked-guard', 'boundary-guard'].includes(name)) return preToolUse('Edit', path.join(made.root, 'src', 'export', 'index.mjs'), { tool_input: { old_string: 'a', new_string: 'b' } });
  if (name === 'log-guard') return preToolUse('Edit', path.join(made.root, 'README.md'), { tool_input: { old_string: 'a', new_string: 'b' } });
  if (name === 'return-capture' || name.includes('gate')) return subagentStop('implementer', fenced(GREEN_RETURN));
  if (name === 'check-after-edit') return { session_id: 's', transcript_path: '/dev/null', hook_event_name: 'PostToolUse', tool_name: 'Edit', tool_input: { file_path: 'src/export/index.mjs' }, agent_id: 'a1', agent_type: 'implementer' };
  return sessionStart();
}

/** Three runs, the fastest kept: the cost being measured is the hook's, not the machine's worst moment. */
function bestOfThree(name, made) {
  let best = Infinity;
  for (let i = 0; i < 3; i += 1) {
    const result = coreHook(name, envelopeFor(name, made), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
    assert(result.code !== null, `${name} ran to completion`);
    best = Math.min(best, result.ms);
  }
  return best;
}

await suite('hook-time-budget', [
  {
    id: 'C4 every hook but the worker gate answers within two seconds',
    covers: ['C4'],
    fn: () => {
      const made = mkCoreLaunch();
      for (const name of hookNames()) {
        if (name.includes('gate')) continue;
        const ms = bestOfThree(name, made);
        assert(ms <= BUDGET_MS, `${name} took ${ms} ms, over the ${BUDGET_MS} ms budget`);
      }
    },
  },
  {
    id: 'C4 the worker gate declares timeout 600 in every frontmatter that wires it',
    covers: ['C4'],
    fn: () => {
      const roles = ['implementer', 'strong-worker', 'interface-builder'];
      for (const role of roles) {
        const file = path.join(CREW, `${role}.md`);
        assert(exists(file), `crew/${role}.md exists`);
        const text = readText(file);
        const frontmatter = /^---\n([\s\S]*?)\n---/.exec(text);
        assert(frontmatter !== null, `crew/${role}.md has frontmatter`);
        assert(/SubagentStop/.test(frontmatter[1]), `crew/${role}.md wires a SubagentStop hook`);
        assert(new RegExp(`timeout:\\s*${GATE_TIMEOUT}\\b`).test(frontmatter[1]), `crew/${role}.md declares timeout ${GATE_TIMEOUT} for its gate`);
      }
    },
  },
  {
    id: 'C4 the timing hooks all answered the sample launch, so the budget was measured against real work',
    covers: ['C4'],
    fn: () => {
      const made = mkCoreLaunch();
      const names = hookNames().filter((name) => !name.includes('gate'));
      assert(names.length >= 6, `every hook of the I6 set was timed, found ${names.length}`);
      for (const name of names) {
        const result = coreHook(name, envelopeFor(name, made), { cwd: made.root, env: { CLAUDE_PROJECT_DIR: made.root } });
        assertEq(typeof result.code, 'number', `${name} exited with a code`);
      }
    },
  },
]);
