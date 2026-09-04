// flightcrew/bin/cmd/worker.mjs — the three implementer-facing commands: rendering a unit's sealed dispatch prompt, merging a unit branch back into the run branch, and storing an implementer's return.
// Usage: fc worker render <unit> | fc worker merge <unit> | fc worker return <unit> <file>; exit 0 on success, 1 on a usage or phase error, 2 when a trigger is fired or a merge is refused or red.

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent, bestEffortRender, firedIn, readEvents } from '../../checks/lib/launch-lib.mjs';
import { run as git } from '../../checks/lib/git-lib.mjs';
import { loadSpec } from '../../checks/lib/spec-lib.mjs';
import { EXIT, ok, fail, print, isJson, json } from '../../checks/lib/output.mjs';
import { pinnedMap, runChecks } from './check.mjs';
import { workerPrompt, readTemplate } from '../worker/render.mjs';
import { store as storeReturn } from './return.mjs';

export const help = [
  'fc worker render <unit>            print the sealed dispatch prompt for one plan unit',
  'fc worker merge <unit>             merge the unit branch, run its checks and record the merge',
  'fc worker return <unit> <file>     store an implementer return (fc return worker <file> --unit <unit>)',
].join('\n');

/** A usage or blocking failure a caller turns into its exit line. */
class WorkerError extends Error {
  constructor(message, code = EXIT.usage) {
    super(message);
    this.exitCode = code;
  }
}

function readJsonFile(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new WorkerError(`${what} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new WorkerError(`${what} is not valid JSON: ${error.message}`);
  }
}

/** The stored plan of a launch. Throws naming plan.json when the launch has none (spec E19). */
function planOf(launchDir) {
  const file = path.join(launchDir, 'plan.json');
  if (!fs.existsSync(file)) throw new WorkerError('no plan.json in this launch: run fc plan write before dispatching a unit');
  return readJsonFile(file, 'plan.json');
}

/** One unit of the plan by id. Throws naming the id when the plan has no such unit (spec E19). */
function unitOf(plan, id) {
  const units = Array.isArray(plan?.units) ? plan.units : [];
  const unit = units.find((entry) => entry?.id === id);
  if (!unit) throw new WorkerError(`unknown unit ${id}: the plan names ${units.map((entry) => entry.id).join(', ') || 'no units'}`);
  return unit;
}

/** The launch's pinned spec copy. */
function specOf(launchDir, launchJson) {
  const given = launchJson?.spec?.path;
  if (typeof given !== 'string' || given === '') throw new WorkerError('the launch pins no spec');
  return loadSpec(path.resolve(launchDir, given));
}

/** The unit branch a launch names for a unit: <launch>/<unit name>, falling back to the branch the return recorded. */
function branchFor(launchName, unit, workerReturn) {
  const computed = `${launchName}/${unit?.name ?? unit?.id}`;
  if (typeof workerReturn?.branch === 'string' && workerReturn.branch !== '') return workerReturn.branch;
  return computed;
}

// ── render ───────────────────────────────────────────────────────────────────

function render(args, ctx) {
  const id = args[0];
  if (!id) throw new WorkerError('fc worker render: expected a unit id');
  const launch = ctx.launch;
  const phase = launch.json?.phase;
  if (phase !== 'implement') {
    throw new WorkerError(`fc worker render: the launch is in phase ${phase ?? 'unknown'}, and a unit is dispatched in phase implement`);
  }
  const trigger = firedIn(launch.dir);
  if (trigger) {
    throw new WorkerError(`abandon trigger fired: ${trigger.detail?.name ?? 'unnamed'}; end or exit the launch before dispatching`, EXIT.blocked);
  }
  const plan = planOf(launch.dir);
  const unit = unitOf(plan, id);
  const spec = specOf(launch.dir, launch.json);
  const { map } = pinnedMap(launch.dir, launch.json);
  const prompt = workerPrompt({
    unit,
    spec,
    map,
    launch: { name: launch.name },
    template: readTemplate(ctx.fd.templates, 'worker-dispatch.template.md'),
  });
  // The dispatch is written beside being printed: a subagent worktree branches from HEAD, so the
  // prompt file has to exist in the run branch before the dispatch names it by repository path.
  const file = path.join(launch.dir, 'returns', `${id}.prompt.md`);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, prompt.endsWith('\n') ? prompt : `${prompt}\n`);
  print(prompt.replace(/\n+$/, ''));
  return EXIT.ok;
}

// ── merge ────────────────────────────────────────────────────────────────────

function currentBranch(root) {
  const result = git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
  return result.ok ? result.stdout.trim() : null;
}

function branchExists(root, name) {
  return git(['rev-parse', '--verify', '--quiet', `refs/heads/${name}`], root).ok;
}

function conflictPaths(root) {
  const result = git(['diff', '--name-only', '--diff-filter=U'], root);
  return result.ok ? result.stdout.split('\n').map((line) => line.trim()).filter((line) => line !== '') : [];
}

function abortMerge(root) {
  git(['merge', '--abort'], root);
}

/** The units a unit_merged event has already recorded as merged. */
function mergedUnits(launchDir) {
  const merged = new Set();
  for (const event of readEvents(launchDir).events) {
    if (event?.event === 'unit_merged' && typeof event.detail?.unit === 'string') merged.add(event.detail.unit);
  }
  return merged;
}

async function merge(args, ctx) {
  const id = args[0];
  if (!id) throw new WorkerError('fc worker merge: expected a unit id');
  const launch = ctx.launch;
  const root = ctx.root;
  const plan = planOf(launch.dir);
  const unit = unitOf(plan, id);

  // Every refusal is decided before anything is written, so a refused merge leaves the repository exactly as it was.
  const trigger = firedIn(launch.dir);
  if (trigger) throw new WorkerError(`abandon trigger fired: ${trigger.detail?.name ?? 'unnamed'}; end or exit the launch`, EXIT.blocked);
  const returnFile = path.join(launch.dir, 'returns', `${id}.json`);
  if (!fs.existsSync(returnFile)) throw new WorkerError(`${id}: no return stored at returns/${id}.json`, EXIT.blocked);
  const workerReturn = readJsonFile(returnFile, `returns/${id}.json`);
  if (workerReturn.status !== 'green') {
    throw new WorkerError(`${id}: the stored return is ${workerReturn.status ?? 'without a status'}, and only a green return is merged`, EXIT.blocked);
  }
  const merged = mergedUnits(launch.dir);
  const waiting = (Array.isArray(unit.depends_on) ? unit.depends_on : []).filter((dep) => !merged.has(dep));
  if (waiting.length > 0) {
    throw new WorkerError(`${id}: ${waiting.join(', ')} not merged yet; merge every dependency first`, EXIT.blocked);
  }
  const runBranch = launch.json?.branch ?? null;
  const on = currentBranch(root);
  if (runBranch && on !== runBranch) {
    throw new WorkerError(`${id}: the repository is on ${on ?? 'no branch'} and the run branch is ${runBranch}`, EXIT.blocked);
  }
  const branch = branchFor(launch.name, unit, workerReturn);
  if (!branchExists(root, branch)) throw new WorkerError(`${id}: branch ${branch} does not exist`, EXIT.blocked);

  const attempt = git(['merge', '--no-ff', '--no-commit', branch], root);
  if (!attempt.ok) {
    const conflicts = conflictPaths(root);
    abortMerge(root);
    const where = conflicts.length > 0 ? conflicts.join(', ') : (attempt.stderr || attempt.stdout).trim().split('\n')[0];
    throw new WorkerError(`${id}: the merge of ${branch} conflicts in ${where}; the merge was aborted`, EXIT.blocked);
  }

  const { map } = pinnedMap(launch.dir, launch.json);
  const ids = Array.isArray(unit.checks) ? unit.checks : [];
  const outcome = runChecks({ root, launchDir: launch.dir, launchJson: launch.json, map, ids: ids.length > 0 ? ids : null });
  if (outcome.code !== EXIT.ok) {
    abortMerge(root);
    throw new WorkerError(`${id}: ${outcome.red.map((doc) => `${doc.id} ${doc.verdict}`).join(', ')} on the merged tree; the merge was aborted`, EXIT.blocked);
  }

  const committed = git(['commit', '--no-verify', '-m', `merge ${id} (${branch})`], root);
  if (!committed.ok) {
    abortMerge(root);
    throw new WorkerError(`${id}: the merge commit failed: ${(committed.stderr || committed.stdout).trim().split('\n')[0]}`, EXIT.blocked);
  }
  const commit = git(['rev-parse', 'HEAD'], root).stdout.trim();
  appendEvent(launch.dir, { event: 'unit_merged', detail: { unit: id, branch, commit } });

  const worktree = typeof workerReturn.worktree === 'string' && workerReturn.worktree !== ''
    ? path.resolve(root, workerReturn.worktree)
    : null;
  // Cleanup is reported rather than assumed: a changed worktree can be locked, and `worktree remove` then exits 128,
  // after which `branch -D` refuses because the branch is still checked out there. The merge itself already stands.
  const leftovers = [];
  if (worktree && fs.existsSync(worktree)) {
    git(['worktree', 'unlock', worktree], root);
    const removed = git(['worktree', 'remove', '--force', worktree], root);
    if (!removed.ok) leftovers.push([`worktree ${worktree}`, removed]);
  }
  git(['worktree', 'prune'], root);
  if (branchExists(root, branch)) {
    const deleted = git(['branch', '-D', branch], root);
    if (!deleted.ok) leftovers.push([`branch ${branch}`, deleted]);
  }
  for (const [what, result] of leftovers) {
    const why = (result.stderr || result.stdout || '').trim().split('\n')[0] || 'git gave no reason';
    fail(`warn:  ${id}: ${what} was not removed: ${why}; run the cleanup line fc launch end prints`);
  }

  await bestEffortRender(launch.dir);
  if (isJson()) json({ unit: id, branch, commit, checks: outcome.results.map((doc) => ({ id: doc.id, verdict: doc.verdict })) });
  else ok(`merged: ${id} from ${branch} at ${commit.slice(0, 7)}`);
  return EXIT.ok;
}

// ── the command ──────────────────────────────────────────────────────────────

export async function run(args, ctx) {
  const sub = args[0];
  const rest = args.slice(1);
  try {
    if (!ctx?.launch?.dir) throw new WorkerError('no active launch');
    if (sub === 'render') return render(rest, ctx);
    if (sub === 'merge') return await merge(rest, ctx);
    if (sub === 'return') {
      const [unit, ...tail] = rest;
      if (!unit) throw new WorkerError('fc worker return: expected a unit id and a return file');
      return await storeReturn(['worker', ...tail, '--unit', unit], ctx);
    }
    throw new WorkerError(`fc worker: expected render, merge or return, not ${sub ?? 'nothing'}`);
  } catch (error) {
    fail(error.message);
    return error.exitCode ?? (error.blocking ? EXIT.blocked : EXIT.usage);
  }
}
