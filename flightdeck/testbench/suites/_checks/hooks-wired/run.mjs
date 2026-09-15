// testbench/suites/_checks/hooks-wired/run.mjs — T36 (C10): the six hook scripts are wired in .claude/settings.json and fc doctor --target .claude passes against it.
// Usage: node flightdeck/testbench/suites/_checks/hooks-wired/run.mjs; exit 0 when both hold, 2 otherwise.

import fs from 'node:fs';
import path from 'node:path';
import { ensure, none, readJson, REPO, report, runNode } from '../lib/check-lib.mjs';

await report(['C10'], [
  {
    name: 'fc doctor --target .claude exits 0',
    fn: () => {
      const r = runNode(REPO, [path.join(REPO, 'flightdeck/flightcrew/bin/fc.mjs'), 'doctor', '--target', '.claude']);
      ensure(r.exit === 0, `doctor exited ${r.exit}: ${`${r.stdout}${r.stderr}`.split('\n').filter((l) => !/^ok\b/.test(l) && l.trim()).slice(0, 5).join(' | ')}`);
    },
  },
  {
    name: 'each of the six hook scripts is a command in .claude/settings.json',
    fn: () => {
      const hooks = fs.readdirSync(path.join(REPO, 'flightdeck/flightcrew/hooks')).filter((n) => n.endsWith('.mjs') && n !== 'lib.mjs').sort();
      ensure(hooks.length === 6, `found ${hooks.length} hook scripts: ${hooks.join(', ')}`);
      const parsed = readJson(path.join(REPO, '.claude/settings.json'));
      if (!parsed.ok) throw new Error(parsed.error);
      const commands = [];
      for (const entries of Object.values(parsed.value.hooks ?? {})) {
        for (const entry of Array.isArray(entries) ? entries : []) for (const h of Array.isArray(entry.hooks) ? entry.hooks : []) commands.push(String(h.command ?? ''));
      }
      none(hooks.filter((h) => !commands.some((c) => c.includes(`flightdeck/flightcrew/hooks/${h}`))), 'hook scripts not wired');
    },
  },
]);
