// flightcrew/bin/cmd/boundary.mjs — reports every file changed since the lock and marks the ones outside the launch's allowed and locked paths.
// Usage: fc boundary [--base <commit>]; exit 0 when nothing changed outside the boundary, 1 on a usage or environment error, 2 when something did.

import fs from 'node:fs';
import path from 'node:path';
import { changedSince } from '../../checks/lib/git-lib.mjs';
import { matchAny } from '../../checks/lib/glob-lib.mjs';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { EXIT, ok, fail, isJson, json } from '../../checks/lib/output.mjs';

export const help = [
  'fc boundary                        list the changes since lock_commit and the ones outside the boundary',
  'fc boundary --base <commit>        measure the change set from that commit instead',
].join('\n');

/**
 * A launch's own pinned copies of the spec and the tests map are written one commit after lock_commit by
 * `fc launch pin tests-map`, so counting them as changes would make every run report its own pin as a locked-path
 * change. They are excluded from the change set; the guards still refuse edits to them after phase targets
 * (design section 13).
 */
export function pinExclusions(launchName) {
  return launchName ? [`flightdeck/launch/${launchName}/specs/**`] : [];
}

/** The commit a change set is measured from: --base, else lock_commit, else base_commit. */
export function baseOf(launchJson, given = null) {
  if (given) return given;
  return launchJson?.lock_commit ?? launchJson?.base_commit ?? null;
}

/**
 * The change set spec B14 fixes: commits after the base, plus staged, unstaged and untracked-not-ignored files, less
 * .claude/worktrees/**, flightdeck/testbench/runs/** and the launch's own pinned copies. Entries carry added and
 * removed line counts.
 */
export function changeSet(root, launchJson, base, launchName) {
  return changedSince(root, base, { exclude: pinExclusions(launchName) })
    .map((entry) => ({ path: entry.path, added: entry.added, removed: entry.removed }));
}

/** The paths a boundary report counts as inside: the allowed paths, the locked paths and the launch folder itself. */
export function insidePatterns(launchJson, launchName) {
  const allowed = Array.isArray(launchJson?.paths?.allowed) ? launchJson.paths.allowed : [];
  const locked = Array.isArray(launchJson?.paths?.locked) ? launchJson.paths.locked : [];
  return [...allowed, ...locked, ...(launchName ? [`flightdeck/launch/${launchName}/**`] : [])];
}

function writeEvidence(launchDir, name, document) {
  const file = path.join(launchDir, 'evidence', name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  return document;
}

/** Writes evidence/boundary.json and returns { code, document }. */
export function reportBoundary({ root, launchDir, launchJson, launchName, base = null }) {
  const from = baseOf(launchJson, base);
  const changed = changeSet(root, launchJson, from, launchName);
  const inside = insidePatterns(launchJson, launchName);
  const outside = changed.filter((entry) => !matchAny(inside, entry.path)).map((entry) => entry.path);
  const document = writeEvidence(launchDir, 'boundary.json', { base: from, changed, outside });
  return { code: outside.length > 0 ? EXIT.blocked : EXIT.ok, document };
}

function parse(args) {
  let base = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = String(args[i]);
    if (arg === '--base') base = args[i + 1] === undefined ? null : String(args[i += 1]);
    else throw new Error(`fc boundary: unexpected argument ${arg}`);
  }
  return { base };
}

export async function run(args, ctx) {
  let base;
  try {
    ({ base } = parse(args));
  } catch (error) {
    fail(error.message);
    return process.exit(EXIT.usage);
  }
  const launch = ctx?.launch;
  if (!ctx?.root || !launch?.dir) {
    fail('no active launch');
    return process.exit(EXIT.usage);
  }
  const { code, document } = reportBoundary({
    root: ctx.root,
    launchDir: launch.dir,
    launchJson: launch.json,
    launchName: launch.name,
    base,
  });
  await bestEffortRender(launch.dir);
  if (isJson()) json(document);
  else if (code === EXIT.ok) ok(`boundary: ${document.changed.length} changed since ${document.base ?? 'the working tree'}, none outside`);
  else fail([`boundary: ${document.outside.length} path(s) outside the boundary`, ...document.outside.map((p) => `  ${p}`)]);
  return process.exit(code);
}
