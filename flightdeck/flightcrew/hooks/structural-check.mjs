// flightcrew/hooks/structural-check.mjs — runs the active launch's structural command for the edited file's extension after an Edit or Write, and holds the turn when it fails.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/structural-check.mjs (stdin: the PostToolUse envelope); exits 0 when the file is sound, 2 when it is not.

import { spawnSync } from 'node:child_process';
import path from 'node:path';

import { runHook, targetPath, absoluteTarget, tailLines, toplevel, err } from './lib.mjs';

const MAX_BUFFER = 16 * 1024 * 1024;
const TAIL = 20;

/** One path as a single-quoted shell word, safe for any character a filename may hold. */
function quote(value) {
  return `'${String(value).split("'").join("'\\''")}'`;
}

await runHook('structural-check', async (ctx) => {
  const input = ctx.input;
  if (input.hook_event_name !== 'PostToolUse') return 0;
  if (!ctx.launch) return 0;
  const target = targetPath(input);
  if (!target) return 0;
  const file = absoluteTarget(ctx, target);
  const structural = ctx.launch.json?.structural;
  const template = structural && typeof structural === 'object' ? structural[path.extname(file)] : null;
  if (typeof template !== 'string' || template.trim() === '') return 0;

  const command = template.split('{file}').join(quote(file));
  const envelopeCwd = input.cwd || ctx.cwd;
  const cwd = toplevel(envelopeCwd, { projectDir: ctx.root }) || envelopeCwd;
  const result = spawnSync('/bin/sh', ['-c', command], { cwd, encoding: 'utf8', maxBuffer: MAX_BUFFER });
  if (result.error) {
    err(`structural check for ${path.basename(file)} could not run: ${result.error.message}\n`);
    return 2;
  }
  if (result.status === 0) return 0;
  const lines = tailLines(`${result.stdout ?? ''}${result.stderr ?? ''}`, TAIL);
  err(lines.length > 0 ? `${lines.join('\n')}\n` : `structural check exited ${result.status} with no output\n`);
  return 2;
});
