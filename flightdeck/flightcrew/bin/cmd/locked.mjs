// flightcrew/bin/cmd/locked.mjs — reports which of the files changed since the lock match one of the launch's locked paths.
// Usage: fc locked [--base <commit>]; exit 0 when no locked path changed, 1 on a usage or environment error, 2 when one did.

import fs from 'node:fs';
import path from 'node:path';
import { matchAny } from '../../checks/lib/glob-lib.mjs';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { EXIT, ok, fail, isJson, json } from '../../checks/lib/output.mjs';
import { baseOf, changeSet } from './boundary.mjs';

export const help = [
  'fc locked                          list the changes since lock_commit that fall under a locked path',
  'fc locked --base <commit>          measure the change set from that commit instead',
].join('\n');

function writeEvidence(launchDir, name, document) {
  const file = path.join(launchDir, 'evidence', name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(document, null, 2)}\n`);
  return document;
}

/**
 * Writes evidence/locked.json from the same change set the boundary report uses (spec B15) and returns
 * { code, document }. The locked list holds only the changed paths matching a locked glob.
 */
export function reportLocked({ root, launchDir, launchJson, launchName, base = null }) {
  const from = baseOf(launchJson, base);
  const changed = changeSet(root, launchJson, from, launchName);
  const patterns = Array.isArray(launchJson?.paths?.locked) ? launchJson.paths.locked : [];
  const locked = changed.filter((entry) => matchAny(patterns, entry.path)).map((entry) => entry.path);
  const document = writeEvidence(launchDir, 'locked.json', { base: from, changed, locked });
  return { code: locked.length > 0 ? EXIT.blocked : EXIT.ok, document };
}

function parse(args) {
  let base = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = String(args[i]);
    if (arg === '--base') base = args[i + 1] === undefined ? null : String(args[i += 1]);
    else throw new Error(`fc locked: unexpected argument ${arg}`);
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
  const { code, document } = reportLocked({
    root: ctx.root,
    launchDir: launch.dir,
    launchJson: launch.json,
    launchName: launch.name,
    base,
  });
  await bestEffortRender(launch.dir);
  if (isJson()) json(document);
  else if (code === EXIT.ok) ok(`locked: no change under a locked path since ${document.base ?? 'the working tree'}`);
  else fail([`locked: ${document.locked.length} path(s) changed under a locked path`, ...document.locked.map((p) => `  ${p}`)]);
  return process.exit(code);
}
