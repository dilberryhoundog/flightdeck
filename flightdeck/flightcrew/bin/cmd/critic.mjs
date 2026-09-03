// flightcrew/bin/cmd/critic.mjs — writes the sealed review dispatch for one critic pass: the pinned spec, the diff since the lock commit with the launch folder left out, the evidence summary and the locked-path change list.
// Usage: fc critic render [--pass n]; exit 0 when the prompt was written, 1 when the phase is not review, the evidence is older than HEAD, or the launch pins nothing.

import fs from 'node:fs';
import path from 'node:path';
import { head, run as git } from '../../checks/lib/git-lib.mjs';
import { loadSpec } from '../../checks/lib/spec-lib.mjs';
import { EXIT, ok, fail } from '../../checks/lib/output.mjs';
import {
  DispatchError, criticPrompt, currentEvidence, diffSinceLock, lockedChangeList, nextPass, readPinnedSpecPath,
  readTemplate,
} from '../worker/render.mjs';

export const help = 'fc critic render [--pass n]        write review/pass-<n>.prompt.md for a fresh critic';

export async function run(args, ctx) {
  try {
    const sub = args[0];
    if (sub !== 'render') throw new DispatchError(`fc critic: expected render, not ${sub ?? 'nothing'}`);
    const launch = ctx?.launch;
    if (!launch?.dir) throw new DispatchError('no active launch');
    if (launch.json?.phase !== 'review') {
      throw new DispatchError(`fc critic render: the launch is in phase ${launch.json?.phase ?? 'unknown'}, and a review pass is dispatched in phase review`);
    }
    let pass = null;
    for (let i = 1; i < args.length; i += 1) {
      if (args[i] === '--pass') pass = args[i + 1] === undefined ? null : String(args[i += 1]);
      else if (String(args[i]).startsWith('--pass=')) pass = String(args[i]).slice('--pass='.length);
      else throw new DispatchError(`fc critic render: unknown argument ${args[i]}`);
    }
    if (pass === null) pass = String(nextPass(path.join(launch.dir, 'review'), /^pass-(\d+)\.json$/));

    const summary = currentEvidence(launch.dir, ctx.root);
    const spec = loadSpec(readPinnedSpecPath(launch));
    const lock = launch.json?.lock_commit ?? launch.json?.base_commit ?? null;
    const prompt = criticPrompt({
      pass,
      launch: { name: launch.name },
      spec,
      specCommit: launch.json?.spec?.commit ?? 'draft',
      lockCommit: lock,
      diff: diffSinceLock(ctx.root, lock, launch.name),
      evidence: `\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\``,
      lockedChanges: lockedChangeList(launch.dir),
      template: readTemplate(ctx.fd.templates, 'critic-dispatch.template.md'),
    });
    const file = path.join(launch.dir, 'review', `pass-${pass}.prompt.md`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, prompt.endsWith('\n') ? prompt : `${prompt}\n`);
    ok(`critic: review/pass-${pass}.prompt.md at ${String(head(ctx.root) ?? '').slice(0, 7)}`);
    return EXIT.ok;
  } catch (error) {
    fail(error.message);
    return error.exitCode ?? EXIT.usage;
  }
}
