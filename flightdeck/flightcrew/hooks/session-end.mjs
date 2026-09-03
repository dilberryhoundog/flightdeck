// flightcrew/hooks/session-end.mjs — refreshes the active launch's evidence page and report when a session ends, so the last state of a run survives the session that produced it.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/session-end.mjs (stdin: the SessionEnd envelope); always exits 0.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { runHook, log } from './lib.mjs';

// The whole hook shares this budget: a session ending must never wait on a render (design section 8, spec C4).
const BUDGET_MS = 1500;
const MIN_MS = 250;

await runHook('session-end', async (ctx) => {
  if (ctx.input.hook_event_name !== 'SessionEnd') return 0;
  if (!ctx.launch) return 0;
  const runner = fileURLToPath(new URL('../bin/fc.mjs', import.meta.url));
  if (!fs.existsSync(runner)) {
    log(ctx, 'fc.mjs is not installed beside the hooks; evidence and report were not refreshed');
    return 0;
  }
  const env = { ...process.env, CLAUDE_PROJECT_DIR: ctx.root, FLIGHTCREW_ROOT: ctx.root, FLIGHTCREW_LAUNCH: ctx.launch.name };
  const deadline = Date.now() + BUDGET_MS;
  for (const command of ['evidence', 'report']) {
    const remaining = deadline - Date.now();
    if (remaining < MIN_MS) {
      log(ctx, `fc ${command} was skipped: the session-end budget of ${BUDGET_MS} ms was spent`);
      break;
    }
    const result = spawnSync(process.execPath, [runner, command], {
      cwd: ctx.root, env, encoding: 'utf8', timeout: remaining, stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (result.status !== 0) {
      log(ctx, `fc ${command} did not complete: ${(result.stderr || result.stdout || result.error?.message || 'no output').split('\n')[0]}`);
    }
  }
  return 0;
});
