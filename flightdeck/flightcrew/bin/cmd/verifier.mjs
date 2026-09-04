// flightcrew/bin/cmd/verifier.mjs — writes the sealed verification dispatch for one pass: the merged branch and commit, the checks to re-run, the recorded evidence, the tests map and the boundary.
// Usage: fc verifier render [--pass n]; exit 0 when the prompt was written, 1 when the phase is not verify, the evidence is older than HEAD, or the launch pins nothing.

import fs from 'node:fs';
import path from 'node:path';
import { head } from '../../checks/lib/git-lib.mjs';
import { EXIT, ok, fail } from '../../checks/lib/output.mjs';
import {
  DispatchError, currentEvidence, nextPass, readTemplate, verifierPrompt,
} from '../worker/render.mjs';
import { pinnedMap } from './check.mjs';

export const help = 'fc verifier render [--pass n]      write returns/verify-<n>.prompt.md for a fresh verifier';

export async function run(args, ctx) {
  try {
    const sub = args[0];
    if (sub !== 'render') throw new DispatchError(`fc verifier: expected render, not ${sub ?? 'nothing'}`);
    const launch = ctx?.launch;
    if (!launch?.dir) throw new DispatchError('no active launch');
    if (launch.json?.phase !== 'verify') {
      throw new DispatchError(`fc verifier render: the launch is in phase ${launch.json?.phase ?? 'unknown'}, and a verification pass is dispatched in phase verify`);
    }
    let pass = null;
    for (let i = 1; i < args.length; i += 1) {
      if (args[i] === '--pass') pass = args[i + 1] === undefined ? null : String(args[i += 1]);
      else if (String(args[i]).startsWith('--pass=')) pass = String(args[i]).slice('--pass='.length);
      else throw new DispatchError(`fc verifier render: unknown argument ${args[i]}`);
    }
    if (pass === null) pass = String(nextPass(path.join(launch.dir, 'returns'), /^verify-(\d+)\.json$/));

    const summary = currentEvidence(launch.dir, ctx.root);
    const { map } = pinnedMap(launch.dir, launch.json);
    const prompt = verifierPrompt({
      pass,
      launch: { name: launch.name },
      branch: launch.json?.branch ?? null,
      commit: summary.commit ?? head(ctx.root),
      map,
      evidence: `\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\``,
      testsMap: `\`\`\`json\n${JSON.stringify(map, null, 2)}\n\`\`\``,
      allowed: launch.json?.paths?.allowed ?? [],
      locked: launch.json?.paths?.locked ?? [],
      template: readTemplate(ctx.fd.templates, 'verifier-dispatch.template.md'),
    });
    const file = path.join(launch.dir, 'returns', `verify-${pass}.prompt.md`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, prompt.endsWith('\n') ? prompt : `${prompt}\n`);
    ok(`verifier: returns/verify-${pass}.prompt.md`);
    return EXIT.ok;
  } catch (error) {
    fail(error.message);
    return error.exitCode ?? EXIT.usage;
  }
}
