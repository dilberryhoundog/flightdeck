// flightcrew/hooks/lock-guard.mjs — denies an Edit, Write or NotebookEdit whose target sits under one of the active launch's locked paths, in every phase but targets.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/lock-guard.mjs (stdin: the PreToolUse envelope); always exits 0, answering on stdout.

import { runGuard, record, decide, matchAny } from './lib.mjs';

await runGuard('lock-guard', (ctx, relative) => {
  const launch = ctx.launch.json ?? {};
  if (launch.phase === 'targets') return 0;
  const locked = launch.paths?.locked ?? [];
  if (!matchAny(locked, relative)) return 0;
  record(ctx, 'lock_denied', { path: relative });
  decide('deny', `${relative} is locked for launch ${ctx.launch.name}; report a wrong or unsatisfiable check instead of editing it`);
  return 0;
});
