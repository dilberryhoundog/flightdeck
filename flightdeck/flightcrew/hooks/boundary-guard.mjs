// flightcrew/hooks/boundary-guard.mjs — denies an Edit, Write or NotebookEdit whose target sits outside the set of paths the active launch's current phase permits.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/boundary-guard.mjs (stdin: the PreToolUse envelope); always exits 0, answering on stdout.

import { runGuard, record, decide, matchAny, BOUNDARY_PHASES } from './lib.mjs';

/**
 * The paths this phase permits: the allowed paths and the launch folder while the run is building, and — while targets
 * are being written — the locked paths, the launch folder and the spec's canonical home instead.
 */
function permitted(ctx, launch) {
  const paths = launch.paths ?? {};
  const ownFolder = `flightdeck/launch/${ctx.launch.name}/**`;
  if (launch.phase === 'targets') {
    const specHome = launch.spec?.name ? [`flightdeck/launch/specs/${launch.spec.name}/**`] : [];
    return [...(paths.locked ?? []), ownFolder, ...specHome];
  }
  if (BOUNDARY_PHASES.includes(launch.phase)) return [...(paths.allowed ?? []), ownFolder];
  return null;
}

await runGuard('boundary-guard', (ctx, relative) => {
  const launch = ctx.launch.json ?? {};
  if (!launch.paths?.enforce_boundary) return 0;
  const inside = permitted(ctx, launch);
  if (inside === null || matchAny(inside, relative)) return 0;
  record(ctx, 'boundary_denied', { path: relative });
  decide('deny', `${relative} is outside the boundary of launch ${ctx.launch.name} in phase ${launch.phase}; work inside the unit's paths, or escalate if the boundary is wrong`);
  return 0;
});
