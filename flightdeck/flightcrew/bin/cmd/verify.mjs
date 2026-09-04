// flightcrew/bin/cmd/verify.mjs — the whole verification pass in one command: every check, the boundary, the locked paths and the budget, in that order.
// Usage: fc verify; exit 0 when all four are clean, 1 on a usage or environment error, 2 when any of them is blocked.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { EXIT, ok, fail, isJson, json } from '../../checks/lib/output.mjs';
import { pinnedMap, runChecks } from './check.mjs';
import { reportBoundary } from './boundary.mjs';
import { reportLocked } from './locked.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
/** The runner this command re-enters to count the budget, so the budget counters have exactly one implementation. */
const FC = path.resolve(HERE, '..', 'fc.mjs');

export const help = 'fc verify                          run check all, boundary, locked and budget in that order';

/** Runs `fc budget` as its own process so the budget counters stay in one place. Returns its exit code. */
function runBudget({ root, launchName, env = process.env }) {
  if (!fs.existsSync(FC)) {
    fail('verify: the runner could not be found, so the budget was not counted');
    return EXIT.usage;
  }
  const childEnv = { ...env, FLIGHTCREW_ROOT: root };
  if (launchName) childEnv.FLIGHTCREW_LAUNCH = launchName;
  const result = spawnSync(process.execPath, [FC, 'budget'], { cwd: root, env: childEnv, encoding: 'utf8' });
  if (result.error) {
    fail(`verify: the budget could not be counted: ${result.error.message}`);
    return EXIT.usage;
  }
  if (result.status !== EXIT.ok && result.stderr) fail(String(result.stderr).trimEnd());
  return typeof result.status === 'number' ? result.status : EXIT.usage;
}

export async function run(args, ctx) {
  if (args.length > 0) {
    fail(`fc verify: unexpected argument ${args[0]}`);
    return process.exit(EXIT.usage);
  }
  const launch = ctx?.launch;
  if (!ctx?.root || !launch?.dir) {
    fail('no active launch');
    return process.exit(EXIT.usage);
  }
  let map;
  try {
    ({ map } = pinnedMap(launch.dir, launch.json));
  } catch (error) {
    fail(error.message);
    return process.exit(error.exitCode ?? EXIT.usage);
  }
  const shared = { root: ctx.root, launchDir: launch.dir, launchJson: launch.json, launchName: launch.name };
  const checks = runChecks({ ...shared, map });
  const boundary = reportBoundary(shared);
  const locked = reportLocked(shared);
  const budget = runBudget({ root: ctx.root, launchName: launch.name, env: ctx.env ?? process.env });
  await bestEffortRender(launch.dir);

  const stages = [
    { name: 'checks', code: checks.code },
    { name: 'boundary', code: boundary.code },
    { name: 'locked', code: locked.code },
    { name: 'budget', code: budget },
  ];
  const red = stages.filter((stage) => stage.code !== EXIT.ok);
  const code = red.some((stage) => stage.code === EXIT.blocked)
    ? EXIT.blocked
    : red.length > 0 ? EXIT.usage : EXIT.ok;
  if (isJson()) {
    json({
      code,
      checks: checks.summary.counts,
      outside: boundary.document.outside,
      locked: locked.document.locked,
      budget,
    });
  } else if (code === EXIT.ok) {
    const counts = checks.summary.counts;
    ok(`verify: ${counts.pass} pass, ${counts.fail} fail, ${counts.error} error, ${counts.skipped} skipped; boundary clean; no locked change; within budget`);
  } else {
    fail(`verify: ${red.map((stage) => stage.name).join(', ')} blocked`);
  }
  return process.exit(code);
}
