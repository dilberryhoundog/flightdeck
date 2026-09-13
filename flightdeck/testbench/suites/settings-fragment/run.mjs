#!/usr/bin/env node
// suites/settings-fragment — settings.fragment.json: the events each hook is wired for, the permissions, the sandbox denyWrite superset, the worktree base, and what the fragment must not carry. Covers I6, C12.
import path from 'node:path';
import {
  CORE_HOOKS, CORE_WORKFLOWS, CREW, assert, assertEq, assertIncludes, exists, listFiles, readJson, readText, suite,
} from '../../lib/core-lib.mjs';

const FRAGMENT = () => readJson(path.join(CORE_HOOKS, 'settings.fragment.json'));

const EVENT_LOG_EVENTS = [
  'SessionStart', 'SessionEnd', 'SubagentStart', 'SubagentStop', 'TaskCreated', 'TaskCompleted',
  'PostToolUseFailure', 'PermissionDenied', 'PreCompact', 'PostCompact', 'Stop', 'WorktreeRemove',
];
const PATH_GUARDS = ['frozen-guard', 'locked-guard', 'boundary-guard', 'log-guard'];
const DENY_WRITE = ['flightdeck/launch/*/specs/**', 'flightdeck/launch/*/runs/*/checks/**', 'flightdeck/launch/FLIGHTLOG.md'];

/** Every command string the fragment wires, flattened. */
function commands(fragment) {
  const found = [];
  for (const [event, entries] of Object.entries(fragment.hooks ?? {})) {
    for (const entry of entries ?? []) {
      for (const hook of entry.hooks ?? []) found.push({ event, matcher: entry.matcher ?? null, command: String(hook.command ?? ''), timeout: hook.timeout ?? null });
    }
  }
  return found;
}

await suite('settings-fragment', [
  {
    id: 'I6 event-log is wired for each of the twelve recorded events',
    covers: ['I6'],
    fn: () => {
      const wired = commands(FRAGMENT()).filter((c) => c.command.includes('event-log'));
      for (const event of EVENT_LOG_EVENTS) {
        assert(wired.some((c) => c.event === event), `event-log is wired for ${event}`);
      }
    },
  },
  {
    id: 'I6 the four path guards are wired on PreToolUse with the Edit|Write|NotebookEdit matcher',
    covers: ['I6'],
    fn: () => {
      const wired = commands(FRAGMENT());
      for (const guard of PATH_GUARDS) {
        const entries = wired.filter((c) => c.command.includes(guard));
        assert(entries.length > 0, `${guard} is wired`);
        for (const entry of entries) {
          assertEq(entry.event, 'PreToolUse', `${guard} is wired on PreToolUse`);
          assert(/Edit\|Write\|NotebookEdit/.test(String(entry.matcher)), `${guard} carries the Edit|Write|NotebookEdit matcher, got ${entry.matcher}`);
        }
      }
    },
  },
  {
    id: 'I6 return-capture is wired on SubagentStop',
    covers: ['I6'],
    fn: () => {
      const wired = commands(FRAGMENT()).filter((c) => c.command.includes('return-capture'));
      assert(wired.length > 0, 'return-capture is wired');
      for (const entry of wired) assertEq(entry.event, 'SubagentStop', 'return-capture is wired on SubagentStop');
    },
  },
  {
    id: 'I6 check-after-edit and the worker gate are not in the fragment',
    covers: ['I6'],
    fn: () => {
      const wired = commands(FRAGMENT());
      assert(!wired.some((c) => c.command.includes('check-after-edit')), 'check-after-edit is wired in the role frontmatter, not globally');
      assert(!wired.some((c) => c.command.includes('gate')), 'the worker gate is wired in the role frontmatter, not globally');
    },
  },
  {
    id: 'I6 permissions.allow holds one Agent per crew file and one Workflow per workflow',
    covers: ['I6'],
    fn: () => {
      const allow = FRAGMENT().permissions?.allow ?? [];
      for (const name of listFiles(CREW).filter((n) => n.endsWith('.md'))) {
        assertIncludes(allow, `Agent(${name.replace(/\.md$/, '')})`, 'an Agent permission per crew file');
      }
      const workflows = exists(CORE_WORKFLOWS) ? listFiles(CORE_WORKFLOWS).filter((n) => n.endsWith('.js')) : [];
      assert(workflows.length > 0, 'the workflow suite has files');
      for (const name of workflows) assertIncludes(allow, `Workflow(${name.replace(/\.js$/, '')})`, 'a Workflow permission per workflow');
    },
  },
  {
    id: 'I6 permissions.allow holds the Bash rules the run needs and no more reach than the spec grants',
    covers: ['I6'],
    fn: () => {
      const allow = (FRAGMENT().permissions?.allow ?? []).filter((rule) => rule.startsWith('Bash('));
      const text = allow.join('\n');
      for (const needle of ['flightdeck/flightcrew/bin/flight', 'flightdeck/flightcrew/bin/', 'git status', 'git diff', 'git log', 'git rev-parse', 'git switch', 'git worktree list', 'git push', 'gh pr create']) {
        assert(text.includes(needle), `the Bash rules cover ${needle}`);
      }
      assert(!/Bash\(\*|Bash\(:\*\)/.test(text), 'no blanket Bash rule');
    },
  },
  {
    id: 'C12 sandbox.filesystem.denyWrite lists every path the guards refuse by fixed rule',
    covers: ['C12'],
    fn: () => {
      const sandbox = FRAGMENT().sandbox ?? {};
      const deny = sandbox.filesystem?.denyWrite ?? [];
      for (const rule of DENY_WRITE) assertIncludes(deny, rule, 'the denyWrite superset');
      assert(sandbox.enabled !== false, 'the sandbox section ships active');
    },
  },
  {
    id: 'I6 worktree.baseRef is head',
    covers: ['I6'],
    fn: () => {
      assertEq(FRAGMENT().worktree?.baseRef, 'head', 'worktree.baseRef');
    },
  },
  {
    id: 'I6 every wired command resolves to a hook script that is there',
    covers: ['I6'],
    fn: () => {
      for (const entry of commands(FRAGMENT())) {
        const match = /hooks\/([\w-]+)\.mjs/.exec(entry.command);
        assert(match !== null, `the command names a hook script: ${entry.command}`);
        assert(exists(path.join(CORE_HOOKS, `${match[1]}.mjs`)), `hooks/${match[1]}.mjs exists`);
        assert(/CLAUDE_PROJECT_DIR/.test(entry.command), `${match[1]} is run in place through $CLAUDE_PROJECT_DIR: ${entry.command}`);
      }
    },
  },
  {
    id: 'C12 a map-s own locked paths and the plan boundary are held by the guards, not by the sandbox',
    covers: ['C12'],
    fn: () => {
      const deny = FRAGMENT().sandbox?.filesystem?.denyWrite ?? [];
      assert(!deny.some((rule) => /tests\/|src\//.test(rule)), 'no project path from a map or a plan is baked into the settings');
      assertEq(deny.filter((rule) => rule.startsWith('flightdeck/launch/')).length >= 3, true, 'the three fixed rules are the launch paths');
      const text = readText(path.join(CORE_HOOKS, 'settings.fragment.json'));
      assert(!text.includes('allowed_paths'), 'the settings carry no plan boundary');
    },
  },
]);
