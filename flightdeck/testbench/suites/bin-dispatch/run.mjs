// testbench/suites/bin-dispatch/run.mjs — regression suite T19: fc worker render, fc return (and the fc worker return alias), fc worker merge and fc critic render (spec B27, B28, B43, B48, E19, E23).
// Usage: node flightdeck/testbench/suites/bin-dispatch/run.mjs; prints 'pass  <case>' or 'FAIL  <case>: <reason>' per case and '<n>/<m> passed'; exit 0 when every case passes, 2 otherwise.
//
// Every case runs against a temporary copy of the sample launch (mkActiveLaunch) whose commits are re-pointed at that repository's HEAD. The merge cases
// create the run branch named in launch.json, a real unit branch in a worktree under .claude/worktrees/ of the temporary repository, and a commit on it;
// the render cases read the pinned spec, plan.json, kickoff.md and the returns to decide what the prompt must and must not contain.

import fs from 'node:fs';
import path from 'node:path';
import {
  suite, fc, sh, tmp, mkActiveLaunch, readJson, writeJson, readText, writeText, exists,
  assert, assertEq, assertMatch, assertIncludes, assertExit,
} from '../../lib/suite-lib.mjs';

// ── helpers ──────────────────────────────────────────────────────────────────
const launchJsonPath = (l) => path.join(l.launchDir, 'launch.json');
const eventsPath = (l) => path.join(l.launchDir, 'events.jsonl');
const specPath = (l) => path.join(l.launchDir, 'specs', 'export-html', 'spec.v1.json');
const mapPath = (l) => path.join(l.launchDir, 'specs', 'export-html', 'tests-map.v1.json');
const returnsDir = (l) => path.join(l.launchDir, 'returns');
const reviewDir = (l) => path.join(l.launchDir, 'review');
const combined = (r) => `${r.stdout}\n${r.stderr}`;
const norm = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const git = (root, args) => sh(`git ${args}`, { cwd: root });
const headSha = (root) => git(root, 'rev-parse HEAD').stdout.trim();
const status = (root) => git(root, 'status --porcelain').stdout;
const fcAt = (l, args) => fc(args, { cwd: l.root, env: l.env });

function ready(phase) {
  const l = mkActiveLaunch();
  const lj = readJson(launchJsonPath(l));
  const head = headSha(l.root);
  lj.base_commit = head;
  lj.lock_commit = head;
  if (phase) lj.phase = phase;
  writeJson(launchJsonPath(l), lj);
  return l;
}

function editLaunch(l, mutate) {
  const lj = readJson(launchJsonPath(l));
  mutate(lj);
  writeJson(launchJsonPath(l), lj);
  return lj;
}

function commitAll(root, message) {
  assertExit(git(root, 'add -A'), 0, 'git add -A');
  assertExit(git(root, `commit -q --no-verify -m "${message}"`), 0, `git commit ${message}`);
  return headSha(root);
}

function events(l) {
  if (!exists(eventsPath(l))) return [];
  return readText(eventsPath(l)).split('\n').filter((line) => line.trim() !== '').map((line) => JSON.parse(line));
}

function lastEvent(l) {
  const all = events(l);
  return all[all.length - 1] ?? null;
}

/** Every node text of the pinned spec, keyed by id. */
function specTexts(l) {
  const spec = readJson(specPath(l));
  const texts = { INT: spec.intent.text };
  for (const group of ['scope', 'constraints', 'interfaces', 'behaviours', 'edges', 'decisions']) {
    for (const node of spec[group] ?? []) texts[node.id] = node.text;
  }
  return texts;
}

function mapCommands(l) {
  return readJson(mapPath(l)).checks.map((c) => c.command);
}

/** A file holding a JSON return, kept outside the repository. */
function returnFile(name, obj) {
  const file = path.join(tmp('fc-return'), name);
  writeJson(file, obj);
  return file;
}

/**
 * The run branch named in launch.json checked out at the temporary root, and a unit branch <L>/<unit.name> in a worktree at the path the unit's return
 * names, carrying one commit that applies `mutate` to src/export/index.mjs. Returns the unit commit.
 */
function makeUnitBranch(l, unitId, mutate) {
  const lj = readJson(launchJsonPath(l));
  const ret = readJson(path.join(returnsDir(l), `${unitId}.json`));
  commitAll(l.root, 'align launch');
  assertExit(git(l.root, `switch -q -c ${lj.branch}`), 0, 'create the run branch');
  const worktree = path.join(l.root, ret.worktree);
  fs.mkdirSync(path.dirname(worktree), { recursive: true });
  assertExit(git(l.root, `worktree add -q "${worktree}" -b ${ret.branch}`), 0, 'create the unit worktree and branch');
  const file = path.join(worktree, 'src', 'export', 'index.mjs');
  writeText(file, mutate(readText(file)));
  assertExit(git(worktree, 'add -A'), 0, 'stage in the worktree');
  assertExit(git(worktree, `commit -q --no-verify -m "${unitId} work"`), 0, 'commit in the worktree');
  const commit = headSha(worktree);
  ret.commits = [commit];
  writeJson(path.join(returnsDir(l), `${unitId}.json`), ret);
  return { commit, worktree, branch: ret.branch };
}

const branchExists = (root, name) => git(root, `rev-parse --verify -q refs/heads/${name}`).code === 0;
const mergeInProgress = (root) => exists(path.join(root, '.git', 'MERGE_HEAD'));

// ── cases ────────────────────────────────────────────────────────────────────
await suite('bin-dispatch', [
  {
    id: 'worker-render-prompt-first-line-and-always-present-nodes',
    covers: ['B27'],
    fn: async () => {
      const l = ready('implement');
      const r = fcAt(l, ['worker', 'render', 'U1']);
      assertExit(r, 0, 'fc worker render U1');
      assertEq(r.stdout.split('\n')[0], 'unit: U1', 'first line is unit: <id>');
      const prompt = norm(r.stdout);
      const texts = specTexts(l);
      for (const id of ['INT', 'SC1', 'SC2', 'SC3', 'C1', 'C2', 'I1', 'I2', 'D1', 'D2']) {
        assertIncludes(prompt, norm(texts[id]), `prompt carries the text of ${id}`);
      }
      assertIncludes(prompt, 'src/export/**', 'prompt carries the unit paths');
    },
  },
  {
    id: 'worker-render-carries-only-the-units-b-and-e-nodes',
    covers: ['B27'],
    fn: async () => {
      const l = ready('implement');
      const texts = specTexts(l);
      const u1 = fcAt(l, ['worker', 'render', 'U1']);
      assertExit(u1, 0, 'fc worker render U1');
      const p1 = norm(u1.stdout);
      for (const id of ['B1', 'B2', 'B3', 'B4', 'B5']) assertIncludes(p1, norm(texts[id]), `U1 prompt carries ${id}`);
      for (const id of ['E1', 'E2', 'E3']) assert(!p1.includes(norm(texts[id])), `U1 prompt carries no text of ${id}`);
      const u2 = fcAt(l, ['worker', 'render', 'U2']);
      assertExit(u2, 0, 'fc worker render U2');
      const p2 = norm(u2.stdout);
      for (const id of ['E1', 'E2', 'E3']) assertIncludes(p2, norm(texts[id]), `U2 prompt carries ${id}`);
      for (const id of ['B1', 'B2', 'B3', 'B4', 'B5']) assert(!p2.includes(norm(texts[id])), `U2 prompt carries no text of ${id}`);
    },
  },
  {
    id: 'worker-render-lists-checks-by-id-with-covers-run-line-and-gate-only-mark-never-commands',
    covers: ['B27'],
    fn: async () => {
      const l = ready('implement');
      const commands = mapCommands(l);
      const u1 = fcAt(l, ['worker', 'render', 'U1']);
      assertExit(u1, 0, 'fc worker render U1');
      assertIncludes(u1.stdout, 'run fc check T2', 'U1 prompt carries the run instruction');
      const t2Line = u1.stdout.split('\n').find((line) => /\bT2\b/.test(line) && /\bB1\b/.test(line));
      assert(t2Line, 'U1 prompt lists T2 with its covers (B1 …)');
      assertMatch(t2Line, /\bB5\b/, 'T2 covers list reaches B5');
      for (const command of commands) assert(!u1.stdout.includes(command), `U1 prompt carries no command text: ${command}`);
      const u2 = fcAt(l, ['worker', 'render', 'U2']);
      assertExit(u2, 0, 'fc worker render U2');
      assertIncludes(u2.stdout, 'run fc check T4 T5', 'U2 prompt carries the run instruction for both checks');
      const t4Line = u2.stdout.split('\n').find((line) => /\bT4\b/.test(line) && /\bE1\b/.test(line));
      assert(t4Line, 'U2 prompt lists T4 with its covers');
      const t5Line = u2.stdout.split('\n').find((line) => /\bT5\b/.test(line) && /\bC1\b/.test(line));
      assert(t5Line, 'U2 prompt lists T5 with its covers');
      assertMatch(t5Line, /gate[ -]only/i, 'T5 is marked gate only');
      assert(!/gate[ -]only/i.test(t4Line), 'T4 is not marked gate only');
      for (const command of commands) assert(!u2.stdout.includes(command), `U2 prompt carries no command text: ${command}`);
      assert(!u2.stdout.includes('export-invariants.mjs') && !u2.stdout.includes('edges.test.mjs'), 'no check script path leaks into the prompt');
    },
  },
  {
    id: 'worker-render-exits-1-outside-phase-implement',
    covers: ['B27'],
    fn: async () => {
      const l = ready('implement');
      const ok = fcAt(l, ['worker', 'render', 'U1']);
      assertExit(ok, 0, 'fc worker render in phase implement');
      assertEq(ok.stdout.split('\n')[0], 'unit: U1', 'a prompt is printed in phase implement');
      for (const phase of ['contracts', 'verify', 'review']) {
        editLaunch(l, (lj) => { lj.phase = phase; });
        const r = fcAt(l, ['worker', 'render', 'U1']);
        assertExit(r, 1, `fc worker render in phase ${phase}`);
        assert(!r.stdout.startsWith('unit: U1'), `no prompt printed in phase ${phase}`);
      }
    },
  },
  {
    id: 'worker-render-unknown-unit-or-missing-plan-exits-1-naming-it',
    covers: ['E19'],
    fn: async () => {
      const l = ready('implement');
      const unknown = fcAt(l, ['worker', 'render', 'U9']);
      assertExit(unknown, 1, 'fc worker render U9');
      assertIncludes(combined(unknown), 'U9', 'message names the unknown unit');
      fs.rmSync(path.join(l.launchDir, 'plan.json'));
      const noPlan = fcAt(l, ['worker', 'render', 'U1']);
      assertExit(noPlan, 1, 'fc worker render without plan.json');
      assertIncludes(combined(noPlan), 'plan.json', 'message names the missing file');
    },
  },
  {
    id: 'return-worker-stores-at-returns-unit-and-appends-a-return-event',
    covers: ['B28'],
    fn: async () => {
      const l = ready('implement');
      const stored = path.join(returnsDir(l), 'U1.json');
      const payload = readJson(stored);
      fs.rmSync(stored);
      const file = returnFile('U1.json', payload);
      const before = events(l).length;
      const r = fcAt(l, ['return', 'worker', file, '--unit', 'U1']);
      assertExit(r, 0, 'fc return worker <file> --unit U1');
      assert(exists(stored), 'returns/U1.json stored');
      assertEq(readJson(stored), payload, 'stored return equals the file');
      assertEq(events(l).length, before + 1, 'one event appended');
      const ev = lastEvent(l);
      assertEq(ev.event, 'return', 'event name');
      assertEq(ev.detail.kind, 'worker', 'event detail.kind');
      assertEq(ev.detail.status, 'green', 'event detail.status');
      assertEq(ev.detail.unit, 'U1', 'event detail.unit');
      assertEq(ev.source, 'fc', 'event source');
    },
  },
  {
    id: 'return-rejects-an-invalid-file-with-exit-2-storing-nothing',
    covers: ['B28'],
    fn: async () => {
      const l = ready('implement');
      const stored = path.join(returnsDir(l), 'U1.json');
      const good = readJson(stored);
      fs.rmSync(stored);
      const before = events(l).length;
      const badStatus = returnFile('bad-status.json', { ...good, status: 'purple' });
      const r1 = fcAt(l, ['return', 'worker', badStatus, '--unit', 'U1']);
      assertExit(r1, 2, 'fc return worker with a status outside the enumeration');
      assert(!exists(stored), 'nothing stored for an invalid status');
      const { checks, ...missing } = good;
      const r2 = fcAt(l, ['return', 'worker', returnFile('missing.json', missing), '--unit', 'U1']);
      assertExit(r2, 2, 'fc return worker with a required field missing');
      assert(!exists(stored), 'nothing stored for a missing field');
      const r3 = fcAt(l, ['return', 'critic', returnFile('bad-critic.json', { verdict: 'maybe', pass: 2, findings: [] }), '--pass', '2']);
      assertExit(r3, 2, 'fc return critic with a verdict outside the enumeration');
      assert(!exists(path.join(reviewDir(l), 'pass-2.json')), 'no pass file stored for an invalid critic return');
      assertEq(events(l).length, before, 'no event appended for invalid returns');
    },
  },
  {
    id: 'return-stores-explorer-verifier-and-critic-at-their-fixed-paths',
    covers: ['B28'],
    fn: async () => {
      const l = ready('review');
      const explorer = { id: 'X2', question: 'Which file renders a page?', stage: 'planning', answer: 'src/export/index.mjs renders every page in renderPage.', confidence: 'probable', pointers: ['src/export/index.mjs'], candidates: [] };
      const rx = fcAt(l, ['return', 'explorer', returnFile('explore.json', explorer), '--id', 'X2']);
      assertExit(rx, 0, 'fc return explorer --id X2');
      assertEq(readJson(path.join(returnsDir(l), 'explore-X2.json')), explorer, 'stored at returns/explore-X2.json');
      let ev = lastEvent(l);
      assertEq(ev.event, 'return', 'explorer return event');
      assertEq(ev.detail.kind, 'explorer', 'explorer event kind');
      assertEq(ev.detail.id, 'X2', 'explorer event id');
      const verifier = readJson(path.join(returnsDir(l), 'verify-1.json'));
      const rv = fcAt(l, ['return', 'verifier', returnFile('verify.json', verifier), '--pass', '2']);
      assertExit(rv, 0, 'fc return verifier --pass 2');
      assertEq(readJson(path.join(returnsDir(l), 'verify-2.json')), verifier, 'stored at returns/verify-2.json');
      ev = lastEvent(l);
      assertEq(ev.detail.kind, 'verifier', 'verifier event kind');
      assertEq(ev.detail.pass, 2, 'verifier event pass');
      const critic = { verdict: 'no gaps', pass: 2, findings: [] };
      const rc = fcAt(l, ['return', 'critic', returnFile('critic.json', critic), '--pass', '2']);
      assertExit(rc, 0, 'fc return critic --pass 2');
      assertEq(readJson(path.join(reviewDir(l), 'pass-2.json')), critic, 'stored at review/pass-2.json');
      ev = lastEvent(l);
      assertEq(ev.detail.kind, 'critic', 'critic event kind');
      assertEq(ev.detail.status, 'no gaps', 'critic event status is the verdict');
      assertEq(ev.detail.pass, 2, 'critic event pass');
      assertEq(readJson(path.join(reviewDir(l), 'pass-1.json')).verdict, 'gaps', 'the earlier pass file is untouched');
    },
  },
  {
    id: 'worker-return-alias-behaves-as-return-worker-with-unit',
    covers: ['B28'],
    fn: async () => {
      const l = ready('implement');
      const stored = path.join(returnsDir(l), 'U2.json');
      const payload = readJson(stored);
      fs.rmSync(stored);
      const before = events(l).length;
      const r = fcAt(l, ['worker', 'return', 'U2', returnFile('U2.json', payload)]);
      assertExit(r, 0, 'fc worker return U2 <file>');
      assertEq(readJson(stored), payload, 'returns/U2.json stored');
      assertEq(events(l).length, before + 1, 'one event appended');
      const ev = lastEvent(l);
      assertEq(ev.event, 'return', 'event name');
      assertEq(ev.detail.kind, 'worker', 'event kind worker');
      assertEq(ev.detail.unit, 'U2', 'event unit');
      assertEq(ev.detail.status, 'green', 'event status');
      const bad = fcAt(l, ['worker', 'return', 'U2', returnFile('bad.json', { ...payload, status: 'purple' })]);
      assertExit(bad, 2, 'the alias validates too');
    },
  },
  {
    id: 'worker-merge-green-path-merges-no-ff-runs-checks-commits-appends-unit-merged-and-cleans-up',
    covers: ['B43'],
    fn: async () => {
      const l = ready('implement');
      const unit = makeUnitBranch(l, 'U1', (src) => `${src}\n// exporter-core: merged through fc worker merge\n`);
      const runHead = headSha(l.root);
      const started = Date.now();
      const r = fcAt(l, ['worker', 'merge', 'U1']);
      assertExit(r, 0, 'fc worker merge U1');
      const head = headSha(l.root);
      assert(head !== runHead, 'HEAD moved');
      const parents = git(l.root, 'rev-list --parents -n 1 HEAD').stdout.trim().split(/\s+/).slice(1);
      assertEq(parents.length, 2, 'HEAD is a merge commit (--no-ff)');
      assertIncludes(parents, unit.commit, 'the unit commit is a parent of the merge');
      assertIncludes(parents, runHead, 'the run branch tip is a parent of the merge');
      assertIncludes(readText(path.join(l.root, 'src', 'export', 'index.mjs')), 'exporter-core: merged through fc worker merge', 'the unit change landed');
      assert(!mergeInProgress(l.root), 'no merge left in progress');
      const ev = lastEvent(l);
      assertEq(ev.event, 'unit_merged', 'unit_merged appended');
      assertEq(ev.detail.unit, 'U1', 'unit_merged names the unit');
      assertEq(ev.detail.branch, unit.branch, 'unit_merged names the branch');
      const t2 = path.join(l.launchDir, 'evidence', 'T2.json');
      const t2Doc = readJson(t2);
      assert(Date.parse(t2Doc.ran_at) >= started - 5000, 'the unit check T2 ran during the merge');
      assertEq(t2Doc.verdict, 'pass', 'T2 passed on the merged tree');
      assert(!branchExists(l.root, unit.branch), 'the unit branch is removed');
      assert(!exists(unit.worktree), 'the worktree directory is removed');
      assert(!git(l.root, 'worktree list').stdout.includes(unit.worktree), 'git no longer lists the worktree');
    },
  },
  {
    id: 'worker-merge-aborts-and-exits-2-naming-the-failing-check',
    covers: ['B43'],
    fn: async () => {
      const l = ready('implement');
      const unit = makeUnitBranch(l, 'U1', (src) => src.replace('`<title>${text(name)}</title>`', '`<title>broken</title>`'));
      const runHead = headSha(l.root);
      const mergedBefore = events(l).filter((e) => e.event === 'unit_merged').length;
      const r = fcAt(l, ['worker', 'merge', 'U1']);
      assertExit(r, 2, 'fc worker merge U1 with a red check');
      assertIncludes(combined(r), 'T2', 'message names the failing check');
      assertEq(headSha(l.root), runHead, 'HEAD unchanged after the abort');
      assert(!mergeInProgress(l.root), 'the merge was aborted');
      assert(!readText(path.join(l.root, 'src', 'export', 'index.mjs')).includes('<title>broken</title>'), 'the unit change is not left in the tree');
      const dirty = status(l.root).split('\n').filter((line) => line.trim() !== '' && !line.includes('flightdeck/launch/') && !line.includes('.claude/'));
      assertEq(dirty, [], 'no source change left behind');
      assert(branchExists(l.root, unit.branch), 'the unit branch is kept');
      assertEq(events(l).filter((e) => e.event === 'unit_merged').length, mergedBefore, 'no new unit_merged event');
    },
  },
  {
    id: 'worker-merge-aborts-and-exits-2-naming-the-conflicting-path',
    covers: ['B43'],
    fn: async () => {
      const l = ready('implement');
      const unit = makeUnitBranch(l, 'U1', (src) => src.replace("const STYLE = 'body{", "const STYLE = 'body{color:#111;"));
      const file = path.join(l.root, 'src', 'export', 'index.mjs');
      writeText(file, readText(file).replace("const STYLE = 'body{", "const STYLE = 'body{color:#222;"));
      const runHead = commitAll(l.root, 'run branch change on the same line');
      const r = fcAt(l, ['worker', 'merge', 'U1']);
      assertExit(r, 2, 'fc worker merge U1 with a conflict');
      assertIncludes(combined(r), 'src/export/index.mjs', 'message names the conflicting path');
      assertEq(headSha(l.root), runHead, 'HEAD unchanged after the abort');
      assert(!mergeInProgress(l.root), 'the merge was aborted');
      assert(!readText(file).includes('<<<<<<<'), 'no conflict markers left in the tree');
      assert(branchExists(l.root, unit.branch), 'the unit branch is kept');
    },
  },
  {
    id: 'worker-merge-refuses-a-missing-red-or-unmerged-dependency-return-and-changes-nothing',
    covers: ['E23', 'B43'],
    fn: async () => {
      const l = ready('implement');
      const unit = makeUnitBranch(l, 'U3', (src) => `${src}\n// proof unit\n`);
      const runHead = headSha(l.root);
      // Each attempt sets the refusal up first and snapshots the tree and the event count only then, so 'changes nothing' is measured against the state
      // fc worker merge is actually handed.
      const attempt = (label, needle, mutate, { worktree = false } = {}) => {
        mutate();
        const before = status(l.root);
        const eventsBefore = events(l).length;
        const r = fcAt(l, ['worker', 'merge', 'U3']);
        assertExit(r, 2, label);
        assertIncludes(combined(r), needle, `${label}: message names the condition`);
        assertEq(headSha(l.root), runHead, `${label}: HEAD unchanged`);
        assertEq(status(l.root), before, `${label}: working tree unchanged`);
        assertEq(events(l).length, eventsBefore, `${label}: no event appended`);
        assert(branchExists(l.root, unit.branch), `${label}: unit branch kept`);
        if (worktree) assert(exists(unit.worktree), `${label}: worktree kept`);
      };
      const retPath = path.join(returnsDir(l), 'U3.json');
      const green = readJson(retPath);
      attempt('dependency U2 unmerged', 'U2', () => {
        const kept = readText(eventsPath(l)).split('\n').filter((line) => line.trim() !== '' && !(line.includes('"unit_merged"') && line.includes('"U2"')));
        writeText(eventsPath(l), `${kept.join('\n')}\n`);
      }, { worktree: true });
      attempt('return not green', 'U3', () => {
        writeText(eventsPath(l), `${events(l).map((e) => JSON.stringify(e)).join('\n')}\n`);
        fs.appendFileSync(eventsPath(l), `${JSON.stringify({ ts: '2026-08-30T10:16:00Z', event: 'unit_merged', launch: 'export-html-1', phase: 'implement', source: 'fc', detail: { unit: 'U2', branch: 'export-html-1/edges-and-invariants', commit: '0718293' } })}\n`);
        writeJson(retPath, { ...green, status: 'red' });
      });
      attempt('return missing', 'U3', () => { fs.rmSync(retPath); });
    },
  },
  {
    id: 'critic-render-writes-a-sealed-prompt-with-spec-diff-summary-and-locked-list-only',
    covers: ['B48'],
    fn: async () => {
      const l = mkActiveLaunch();
      // The commit before the launch folder existed, so the folder's own addition falls inside the diff range and must be excluded by fc critic render.
      const lock = git(l.root, 'rev-parse HEAD~1').stdout.trim();
      assert(/^[0-9a-f]{40}$/.test(lock), `the commit before the launch folder: ${lock}`);
      fs.appendFileSync(path.join(l.root, 'src', 'export', 'index.mjs'), '\n// critic-diff-marker: a change after the lock\n');
      const head = commitAll(l.root, 'change after lock');
      editLaunch(l, (lj) => { lj.base_commit = lock; lj.lock_commit = lock; lj.phase = 'review'; });
      const summaryPath = path.join(l.launchDir, 'evidence', 'summary.json');
      const summary = readJson(summaryPath);
      summary.commit = head;
      summary.ran_at = new Date().toISOString();
      writeJson(summaryPath, summary);
      const r = fcAt(l, ['critic', 'render', '--pass', '2']);
      assertExit(r, 0, 'fc critic render --pass 2');
      const file = path.join(reviewDir(l), 'pass-2.prompt.md');
      assert(exists(file), 'review/pass-2.prompt.md written');
      const prompt = readText(file);
      const flat = norm(prompt);
      const texts = specTexts(l);
      for (const id of ['INT', 'B1', 'E3', 'C2', 'I1']) assertIncludes(flat, norm(texts[id]), `prompt carries the pinned spec text of ${id}`);
      assertIncludes(prompt, 'critic-diff-marker', 'prompt carries the diff since lock_commit');
      assertIncludes(prompt, 'src/export/index.mjs', 'the diff names the changed file');
      for (const id of ['T1', 'T2', 'T3', 'T4', 'T5']) assertIncludes(prompt, id, `prompt carries evidence/summary.json (${id})`);
      assertMatch(prompt, /locked/i, 'prompt carries the locked-path change list');
      const kickoff = readText(path.join(l.launchDir, 'kickoff.md'));
      assert(!prompt.includes('Cut the work vertically'), 'prompt carries no kickoff.md text');
      assert(!flat.includes(norm(kickoff.split('\n').find((line) => line.startsWith('Stop and ask a human')))), 'prompt carries no kickoff Escalate text');
      assert(!prompt.includes('flightdeck/launch/export-html-1/kickoff.md') && !prompt.includes('+# Kickoff:'), 'the launch folder is excluded from the diff');
      const plan = readJson(path.join(l.launchDir, 'plan.json'));
      assert(!flat.includes(norm(plan.approach)), 'prompt carries no plan.json approach text');
      assert(!prompt.includes(plan.risks[0].text), 'prompt carries no plan.json risk text');
      assert(!prompt.includes('exporter-core') && !prompt.includes('edges-and-invariants'), 'prompt carries no plan unit names');
      for (const name of fs.readdirSync(returnsDir(l))) {
        const doc = readJson(path.join(returnsDir(l), name));
        const marker = doc.notes ?? doc.answer;
        if (marker) assert(!flat.includes(norm(marker)), `prompt carries no text from returns/${name}`);
      }
    },
  },
  {
    id: 'critic-render-exits-1-outside-phase-review-or-with-stale-summary',
    covers: ['B48'],
    fn: async () => {
      const l = mkActiveLaunch();
      const lock = headSha(l.root);
      fs.appendFileSync(path.join(l.root, 'src', 'export', 'index.mjs'), '\n// critic-diff-marker\n');
      const head = commitAll(l.root, 'change after lock');
      const summaryPath = path.join(l.launchDir, 'evidence', 'summary.json');
      const summary = readJson(summaryPath);
      editLaunch(l, (lj) => { lj.base_commit = lock; lj.lock_commit = lock; lj.phase = 'review'; });
      writeJson(summaryPath, { ...summary, commit: head, ran_at: new Date().toISOString() });
      const ok = fcAt(l, ['critic', 'render', '--pass', '2']);
      assertExit(ok, 0, 'fc critic render in phase review with a current summary');
      assert(exists(path.join(reviewDir(l), 'pass-2.prompt.md')), 'review/pass-2.prompt.md written on the green path');
      editLaunch(l, (lj) => { lj.phase = 'verify'; });
      const wrongPhase = fcAt(l, ['critic', 'render', '--pass', '3']);
      assertExit(wrongPhase, 1, 'fc critic render in phase verify');
      assert(!exists(path.join(reviewDir(l), 'pass-3.prompt.md')), 'no prompt written outside phase review');
      editLaunch(l, (lj) => { lj.phase = 'review'; });
      writeJson(summaryPath, { ...summary, commit: lock, ran_at: '2026-08-30T10:45:03Z' });
      const stale = fcAt(l, ['critic', 'render', '--pass', '3']);
      assertExit(stale, 1, 'fc critic render with summary.json older than HEAD');
      assert(!exists(path.join(reviewDir(l), 'pass-3.prompt.md')), 'no prompt written with a stale summary');
    },
  },
]);
