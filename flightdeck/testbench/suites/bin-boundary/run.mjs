// testbench/suites/bin-boundary/run.mjs — regression suite T9: fc boundary, fc locked, fc budget and fc events usage/summary (spec B14, B15, B16, B51) over a temporary copy of the sample launch.
// Usage: node flightdeck/testbench/suites/bin-boundary/run.mjs; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exit 0 when every case passes, 2 otherwise.
//
// Each case builds an active launch with mkActiveLaunch, sets lock_commit and base_commit to that repository's HEAD, then creates the change set the spec
// describes (committed after lock, staged, unstaged, untracked, and the two excluded prefixes) and reads back evidence/boundary.json, evidence/locked.json,
// evidence/budget.json and events.jsonl. Only exit codes, message lines, evidence files and event lines are asserted.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, mkActiveLaunch, readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

// ── helpers ──────────────────────────────────────────────────────────────────
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const eventsPath = (l) => path.join(l.launchDir, 'events.jsonl');
const evidenceFile = (l, name) => path.join(l.launchDir, 'evidence', name);
const combined = (r) => `${r.stdout}\n${r.stderr}`;
const git = (root, args) => sh(`git ${args}`, { cwd: root });
const headSha = (root) => git(root, 'rev-parse HEAD').stdout.trim();
const sameCommit = (a, b) => typeof a === 'string' && typeof b === 'string' && a.length >= 7 && b.length >= 7 && (a.startsWith(b) || b.startsWith(a));
const pathOf = (entry) => (typeof entry === 'string' ? entry : entry?.path);
const pathsOf = (list) => (Array.isArray(list) ? list.map(pathOf).sort() : list);

/**
 * The launch folder path that `ready` and `editLaunch` leave changed by re-pointing the pinned commits. It is part of the change set spec B14 defines
 * (an unstaged edit, or a committed one once `commitAll` has staged everything), so every expected changed list below carries it.
 */
const LAUNCH_JSON = 'flightdeck/launch/export-html-1/launch.json';

function ready() {
  const l = mkActiveLaunch();
  const lj = readJson(launchJsonPath(l));
  const head = headSha(l.root);
  lj.base_commit = head;
  lj.lock_commit = head;
  writeJson(launchJsonPath(l), lj);
  return l;
}

function editLaunch(l, mutate) {
  const lj = readJson(launchJsonPath(l));
  mutate(lj);
  writeJson(launchJsonPath(l), lj);
  return lj;
}

function append(root, rel, text) {
  fs.appendFileSync(path.join(root, rel), text);
}

function commitAll(root, message) {
  assertExit(git(root, 'add -A'), 0, 'git add -A');
  assertExit(git(root, `commit -q --no-verify -m "${message}"`), 0, `git commit ${message}`);
  return headSha(root);
}

/** Parsed event lines (unparseable lines dropped) and the raw line count. */
function events(l) {
  if (!exists(eventsPath(l))) return { lines: [], raw: 0 };
  const raw = readText(eventsPath(l)).split('\n').filter((line) => line.trim() !== '');
  const lines = [];
  for (const line of raw) {
    try { lines.push(JSON.parse(line)); } catch { /* counted by raw only */ }
  }
  return { lines, raw: raw.length };
}

function lastEvent(l) {
  const { lines } = events(l);
  return lines[lines.length - 1] ?? null;
}

/**
 * The change set spec B14 describes: a commit after lock touching scripts/ (outside), a staged edit under src/export/ (allowed), an unstaged edit to
 * README.md (outside), an untracked file under tests/export/ (locked, therefore inside), an edit inside the launch folder, plus untracked files under
 * .claude/worktrees/ and flightdeck/testbench/runs/ which must be excluded from the changed set. The launch.json edit made by `ready` is swept into the
 * after-lock commit by `commitAll`, so it is changed too.
 */
function makeChanges(l) {
  append(l.root, 'scripts/export-smoke.mjs', '\n// committed after lock\n');
  commitAll(l.root, 'after-lock change under scripts');
  append(l.root, 'src/export/index.mjs', '\n// staged change under src/export\n');
  assertExit(git(l.root, 'add src/export/index.mjs'), 0, 'stage the src/export change');
  append(l.root, 'README.md', '\nunstaged change outside the allowed paths\n');
  writeText(path.join(l.root, 'tests/export/extra.test.mjs'), '// untracked file under a locked path\n');
  append(l.root, 'flightdeck/launch/export-html-1/notes.md', 'a note written during the run\n');
  writeText(path.join(l.root, '.claude/worktrees/x/note.txt'), 'inside a worktree directory\n');
  writeText(path.join(l.root, 'flightdeck/testbench/runs/probe.log'), 'a suite log\n');
  return {
    changed: ['README.md', LAUNCH_JSON, 'flightdeck/launch/export-html-1/notes.md', 'scripts/export-smoke.mjs', 'src/export/index.mjs', 'tests/export/extra.test.mjs'],
    outside: ['README.md', 'scripts/export-smoke.mjs'],
    locked: ['tests/export/extra.test.mjs'],
    excluded: ['.claude/worktrees/x/note.txt', 'flightdeck/testbench/runs/probe.log'],
  };
}

function budgetCounts(l) {
  const budget = readJson(evidenceFile(l, 'budget.json'));
  assert(budget && typeof budget.counts === 'object', 'budget.json carries counts');
  return budget.counts;
}

function fcAt(l, args) {
  return fc(args, { cwd: l.root, env: l.env });
}

// ── cases ────────────────────────────────────────────────────────────────────
await suite('bin-boundary', [
  {
    id: 'boundary-lists-changed-marks-outside-excludes-worktrees-and-runs-exits-2',
    covers: ['B14'],
    fn: async () => {
      const l = ready();
      const lock = readJson(launchJsonPath(l)).lock_commit;
      const expected = makeChanges(l);
      const r = fcAt(l, ['boundary']);
      assertExit(r, 2, 'fc boundary with changes outside the allowed paths');
      const boundary = readJson(evidenceFile(l, 'boundary.json'));
      assert(sameCommit(boundary.base, lock), `boundary.base is lock_commit: ${boundary.base}`);
      assertEq(pathsOf(boundary.changed), expected.changed, 'changed set: commits after lock + staged + unstaged + untracked, minus the excluded prefixes');
      for (const entry of boundary.changed) {
        assert(Number.isInteger(entry.added) && Number.isInteger(entry.removed), `${entry.path} carries added and removed counts`);
      }
      assertEq(pathsOf(boundary.outside), expected.outside, 'outside: the paths beyond allowed, locked and the launch folder');
      for (const excluded of expected.excluded) {
        assert(!pathsOf(boundary.changed).includes(excluded), `${excluded} is excluded from the changed set`);
      }
    },
  },
  {
    id: 'boundary-exits-0-with-empty-outside-when-every-change-is-inside',
    covers: ['B14'],
    fn: async () => {
      const l = ready();
      append(l.root, 'src/export/index.mjs', '\n// change inside the allowed paths\n');
      writeText(path.join(l.root, '.claude/worktrees/x/note.txt'), 'ignored by the boundary\n');
      const r = fcAt(l, ['boundary']);
      assertExit(r, 0, 'fc boundary with only allowed changes');
      const boundary = readJson(evidenceFile(l, 'boundary.json'));
      assertEq(pathsOf(boundary.changed), [LAUNCH_JSON, 'src/export/index.mjs'].sort(), 'changed lists the allowed edit and the launch.json edit');
      assertEq(boundary.outside, [], 'outside is empty');
    },
  },
  {
    id: 'boundary-base-falls-back-to-base-commit-and-honours-the-base-flag',
    covers: ['B14'],
    fn: async () => {
      // Two commits after the launch was made, in two separate launches: fc boundary writes inside the launch folder, so a second invocation against the
      // same launch would see its own output in the changed set.
      const history = (l) => {
        const start = headSha(l.root);
        append(l.root, 'src/export/index.mjs', '\n// first commit after the base\n');
        const first = commitAll(l.root, 'first');
        append(l.root, 'README.md', '\nsecond commit after the base\n');
        commitAll(l.root, 'second');
        return { start, first };
      };

      const a = ready();
      const { start } = history(a);
      editLaunch(a, (lj) => { lj.lock_commit = null; lj.base_commit = start; });
      const fallback = fcAt(a, ['boundary']);
      assertExit(fallback, 2, 'fc boundary falling back to base_commit');
      let boundary = readJson(evidenceFile(a, 'boundary.json'));
      assert(sameCommit(boundary.base, start), `base falls back to base_commit: ${boundary.base}`);
      assertEq(pathsOf(boundary.changed), ['README.md', LAUNCH_JSON, 'src/export/index.mjs'].sort(), 'both commits after base_commit are changed, with the unstaged launch.json edit');
      assertEq(pathsOf(boundary.outside), ['README.md'], 'README.md is outside');

      const b = ready();
      const { first } = history(b);
      const flagged = fcAt(b, ['boundary', '--base', first]);
      assertExit(flagged, 2, 'fc boundary --base <first commit>');
      boundary = readJson(evidenceFile(b, 'boundary.json'));
      assert(sameCommit(boundary.base, first), `base is the --base commit: ${boundary.base}`);
      assertEq(pathsOf(boundary.changed), ['README.md'], 'only the commit after --base is changed');
      assertEq(pathsOf(boundary.outside), ['README.md'], 'README.md is outside the allowed paths');
    },
  },
  {
    id: 'locked-lists-changes-under-locked-paths-and-exits-2',
    covers: ['B15'],
    fn: async () => {
      const l = ready();
      const expected = makeChanges(l);
      append(l.root, 'flightdeck/launch/specs/export-html/tests-map.v1.json', '\n');
      const r = fcAt(l, ['locked']);
      assertExit(r, 2, 'fc locked with a change under a locked path');
      const locked = readJson(evidenceFile(l, 'locked.json'));
      assertEq(pathsOf(locked.changed), [...expected.changed, 'flightdeck/launch/specs/export-html/tests-map.v1.json'].sort(), 'locked.json carries the same changed set as boundary.json');
      assertEq(pathsOf(locked.locked), ['flightdeck/launch/specs/export-html/tests-map.v1.json', ...expected.locked].sort(), 'locked: only the changed files matching a locked path');
      assert(sameCommit(locked.base, readJson(launchJsonPath(l)).lock_commit), 'locked.base is lock_commit');
    },
  },
  {
    id: 'locked-exits-0-with-empty-list-when-no-locked-path-changed',
    covers: ['B15'],
    fn: async () => {
      const l = ready();
      append(l.root, 'src/export/index.mjs', '\n// change inside the allowed paths\n');
      append(l.root, 'README.md', '\nchange outside the boundary but not locked\n');
      const r = fcAt(l, ['locked']);
      assertExit(r, 0, 'fc locked with no locked change');
      const locked = readJson(evidenceFile(l, 'locked.json'));
      assertEq(locked.locked, [], 'locked list is empty');
      assertEq(pathsOf(locked.changed), ['README.md', LAUNCH_JSON, 'src/export/index.mjs'].sort(), 'changed still lists every change');
    },
  },
  {
    id: 'budget-counts-beside-ceilings-and-exits-0-within-them',
    covers: ['B16'],
    fn: async () => {
      const l = ready();
      const before = events(l).raw;
      const r = fcAt(l, ['budget']);
      assertExit(r, 0, 'fc budget within every ceiling');
      const counts = budgetCounts(l);
      for (const key of ['agents', 'stop_blocks', 'consecutive_stop_blocks', 'critic_passes', 'minutes', 'tokens', 'tool_failures', 'permission_denials', 'compactions']) {
        assert(counts[key] && 'count' in counts[key] && 'ceiling' in counts[key], `counts.${key} carries count and ceiling`);
      }
      assertEq(counts.agents, { count: 8, ceiling: 12 }, 'agents spawned from SubagentStart events beside ceilings.agents');
      assertEq(counts.stop_blocks, { count: 1, ceiling: 8 }, 'stop blocks beside ceilings.stop_blocks');
      assertEq(counts.consecutive_stop_blocks, { count: 0, ceiling: 3 }, 'consecutive stop blocks since the newest passing check_run beside gate_iterations');
      assertEq(counts.critic_passes, { count: 1, ceiling: 2 }, 'critic passes from review/pass-*.json beside critic_passes');
      assert(typeof counts.minutes.count === 'number' && counts.minutes.count >= 0, 'minutes is a number');
      assertEq(counts.minutes.ceiling, 240, 'minutes ceiling');
      assertEq(counts.tokens, { count: 193350, ceiling: null }, 'tokens from usage events beside the null ceiling');
      assertEq(counts.tool_failures, { count: 1, ceiling: null }, 'tool failures from PostToolUseFailure');
      assertEq(counts.permission_denials, { count: 1, ceiling: null }, 'permission denials from PermissionDenied');
      assertEq(counts.compactions, { count: 1, ceiling: null }, 'compactions from PreCompact');
      assertEq(events(l).raw, before, 'no event appended within the ceilings');
    },
  },
  {
    id: 'budget-exits-2-and-appends-trigger-when-agents-exceed-the-ceiling',
    covers: ['B16'],
    fn: async () => {
      const l = ready();
      editLaunch(l, (lj) => { lj.ceilings.agents = 3; });
      const before = events(l).raw;
      const r = fcAt(l, ['budget']);
      assertExit(r, 2, 'fc budget with agents above the ceiling');
      assertEq(budgetCounts(l).agents, { count: 8, ceiling: 3 }, 'agents count beside the lowered ceiling');
      assertEq(events(l).raw, before + 1, 'exactly one event appended');
      const last = lastEvent(l);
      assertEq(last.event, 'trigger', 'the appended event is a trigger');
      assertIncludes(JSON.stringify(last.detail), 'agents', 'the trigger detail names the exceeded ceiling');
    },
  },
  {
    id: 'budget-counts-consecutive-stop-blocks-against-gate-iterations',
    covers: ['B16'],
    fn: async () => {
      const l = ready();
      const extra = [];
      for (let i = 1; i <= 4; i += 1) {
        extra.push(JSON.stringify({ ts: `2026-08-30T12:0${i}:00Z`, event: 'stop_block', launch: 'export-html-1', phase: 'verify', source: 'hook', session_id: 'sess-4f1e8c2a', detail: { count: i, checks: ['T1'] } }));
      }
      fs.appendFileSync(eventsPath(l), `${extra.join('\n')}\n`);
      const before = events(l).raw;
      const r = fcAt(l, ['budget']);
      assertExit(r, 2, 'fc budget with four consecutive stop blocks against gate_iterations 3');
      const counts = budgetCounts(l);
      assertEq(counts.consecutive_stop_blocks, { count: 4, ceiling: 3 }, 'consecutive stop blocks since the newest passing event');
      assertEq(counts.stop_blocks.count, 5, 'total stop blocks');
      assertEq(events(l).raw, before + 1, 'one trigger event appended');
      assertEq(lastEvent(l).event, 'trigger', 'the appended event is a trigger');
    },
  },
  {
    id: 'budget-reports-tokens-unobserved-without-usage-events',
    covers: ['B16'],
    fn: async () => {
      const l = ready();
      const kept = readText(eventsPath(l)).split('\n').filter((line) => line.trim() !== '' && !line.includes('"event":"usage"'));
      writeText(eventsPath(l), `${kept.join('\n')}\n`);
      const r = fcAt(l, ['budget']);
      assertExit(r, 0, 'fc budget without usage events');
      assertEq(budgetCounts(l).tokens, { count: 'unobserved', ceiling: null }, 'tokens unobserved');
    },
  },
  {
    id: 'budget-treats-an-absent-events-file-as-empty',
    covers: ['B16'],
    fn: async () => {
      const l = ready();
      fs.rmSync(eventsPath(l));
      const r = fcAt(l, ['budget']);
      assertExit(r, 0, 'fc budget with no events.jsonl');
      const counts = budgetCounts(l);
      assertEq(counts.agents.count, 0, 'no agents counted');
      assertEq(counts.stop_blocks.count, 0, 'no stop blocks counted');
      assertEq(counts.tokens.count, 'unobserved', 'tokens unobserved');
    },
  },
  {
    id: 'events-usage-appends-a-usage-event',
    covers: ['B51'],
    fn: async () => {
      const l = ready();
      const before = events(l).raw;
      const started = Date.now();
      const r = fcAt(l, ['events', 'usage', JSON.stringify({ agent_id: 'agent-t9', input_tokens: 100, output_tokens: 20, cost_usd: 0.01, source: 'suite' })]);
      assertExit(r, 0, 'fc events usage');
      assertEq(events(l).raw, before + 1, 'exactly one line appended');
      const last = lastEvent(l);
      assertEq(last.event, 'usage', 'event name');
      assertEq(last.launch, 'export-html-1', 'launch filled');
      assertEq(last.phase, 'review', 'phase filled from launch.json');
      assertEq(last.source, 'fc', 'source fc');
      assert(Number.isFinite(Date.parse(last.ts)) && Date.parse(last.ts) >= started - 5000, `ts is a fresh iso timestamp: ${last.ts}`);
      assertEq(last.detail.input_tokens, 100, 'detail.input_tokens');
      assertEq(last.detail.output_tokens, 20, 'detail.output_tokens');
      assertEq(last.detail.agent_id, 'agent-t9', 'detail.agent_id');
      const budget = fcAt(l, ['budget']);
      assertExit(budget, 0, 'fc budget after the usage event');
      assertEq(budgetCounts(l).tokens.count, 193470, 'tokens now include the appended usage');
    },
  },
  {
    id: 'events-summary-prints-counts-by-event-per-agent-and-unparseable',
    covers: ['B51'],
    fn: async () => {
      const l = ready();
      const clean = fcAt(l, ['events', 'summary']);
      assertExit(clean, 0, 'fc events summary');
      assertIncludes(clean.stdout, 'unparseable: 0', 'unparseable line with a clean file');
      const startLine = clean.stdout.split('\n').find((line) => line.includes('SubagentStart'));
      assert(startLine, 'summary carries a SubagentStart count line');
      assertMatch(startLine, /\b8\b/, 'SubagentStart count is 8');
      const stopLine = clean.stdout.split('\n').find((line) => line.includes('stop_block'));
      assert(stopLine && /\b1\b/.test(stopLine), 'stop_block count is 1');
      assertIncludes(clean.stdout, 'agent-x1', 'per-agent counts name agent-x1');
      assertIncludes(clean.stdout, 'agent-c1', 'per-agent counts name agent-c1');
      fs.appendFileSync(eventsPath(l), 'this line is not json {\n');
      const dirty = fcAt(l, ['events', 'summary']);
      assertExit(dirty, 0, 'fc events summary with an unparseable line');
      assertIncludes(dirty.stdout, 'unparseable: 1', 'the unparseable line is counted');
      assertMatch(combined(dirty), /SubagentStart/, 'the parseable events are still summarised');
    },
  },
]);
