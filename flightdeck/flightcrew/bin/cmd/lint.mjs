// flightcrew/bin/cmd/lint.mjs — fc lint spec: runs the spec readiness linter over a spec file, with the repository and any extra deliverables the artefact rules should resolve against.
// Usage: node flightdeck/flightcrew/bin/fc.mjs lint spec <path> [--repo <root>] [--deliverable <path>]...; exit 0 clean, 2 when a rule fails, 1 on a usage or environment error.
//
// The linter prints the 'error: <message> — [<rule>]' and 'warn:  <message>' lines of design 5.12 itself and this
// command adds nothing to them: it checks the shape of the invocation, hands the arguments through unchanged, and
// returns the linter's exit code. Linting is a spec-stage act, so it needs no launch.

import { EXIT, fail } from '../../checks/lib/output.mjs';
import { runValidator } from '../fc.mjs';

export const help = 'fc lint spec <path> [--repo <root>] [--deliverable <path>]... — run the spec readiness linter.';

/** Linting happens before a launch exists, so no launch is resolved. */
export const needsLaunch = false;

export async function run(args, ctx) {
  const [kind, ...rest] = args;
  if (kind !== 'spec') {
    fail(['fc lint: the only linter is spec', help]);
    return EXIT.usage;
  }
  if (rest.length === 0 || rest[0].startsWith('--')) {
    fail(['fc lint spec needs the path of the spec to lint', help]);
    return EXIT.usage;
  }
  return runValidator(ctx, 'spec-readiness-lint', rest);
}
