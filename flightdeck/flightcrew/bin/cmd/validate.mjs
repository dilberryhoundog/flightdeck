// flightcrew/bin/cmd/validate.mjs — fc validate: runs one validator from flightcrew/checks/validators/ over the document named, or over the launch's own copy of it when no path is given.
// Usage: node flightdeck/flightcrew/bin/fc.mjs validate <spec|tests-map|plan|launch|kickoff|return|all> [path] [--kind K] [--for-freeze] [--strict] [--resolve-commits] [--schema f]; exit 0 clean, 2 on an error (or a warning under --strict), 1 on a usage or environment error.
//
// The validators are programs in their own right and print the error and warning lines of design 5.12 themselves, so
// this command adds nothing to their output: it resolves the document, hands the remaining arguments through
// unchanged, and returns their exit code. A kind whose path is left out is read from the resolved launch — launch.json,
// plan.json, kickoff.md, or the pinned spec or map — which is why the command works with or without an active launch.

import path from 'node:path';
import { EXIT, fail } from '../../checks/lib/output.mjs';
import { runValidator, UsageError } from '../fc.mjs';

export const help = 'fc validate <spec|tests-map|plan|launch|kickoff|return|all> [path] [flags] — run a validator.';

/** A command that names its document needs no launch; one that leaves it out reads the launch's own copy. */
export const needsLaunch = false;

const VALIDATOR_OF = {
  spec: 'validate-spec',
  'tests-map': 'validate-tests-map',
  plan: 'validate-plan',
  launch: 'validate-launch',
  kickoff: 'validate-kickoff',
  return: 'validate-return',
  all: 'validate-all',
};

/** The document of a kind inside a launch folder, for the form that leaves the path out. */
function defaultTarget(kind, ctx) {
  if (!ctx.launch) throw new UsageError(`fc validate ${kind} needs a path when no launch is active`);
  const dir = ctx.launch.dir;
  const json = ctx.launch.json ?? {};
  if (kind === 'launch') return path.join(dir, 'launch.json');
  if (kind === 'plan') return path.join(dir, 'plan.json');
  if (kind === 'kickoff') return path.join(dir, json.kickoff?.path ?? 'kickoff.md');
  if (kind === 'all') return dir;
  if (kind === 'spec') {
    if (!json.spec?.path) throw new UsageError('fc validate spec: the launch has no pinned spec');
    return path.join(dir, json.spec.path);
  }
  if (kind === 'tests-map') {
    if (!json.tests_map?.path) throw new UsageError('fc validate tests-map: no tests map pinned');
    return path.join(dir, json.tests_map.path);
  }
  throw new UsageError(`fc validate ${kind} needs a path`);
}

export async function run(args, ctx) {
  const kind = args[0];
  if (!kind || !VALIDATOR_OF[kind]) {
    fail([`fc validate: expected one of ${Object.keys(VALIDATOR_OF).join(', ')}`, help]);
    return EXIT.usage;
  }
  // The interface puts the document first and the flags after it, so the path is present exactly when rest[0] is not a flag.
  const rest = args.slice(1);
  const forwarded = rest.length > 0 && !rest[0].startsWith('--') ? rest : [defaultTarget(kind, ctx), ...rest];
  return runValidator(ctx, VALIDATOR_OF[kind], forwarded);
}
