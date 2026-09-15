// testbench/suites/_checks/manifest-reflects-testbench/run.mjs — T38 (scope: SC2, SC4): flightdeck/flightcrew/MANIFEST.txt reflects the files present: every listed path exists and is not empty, and every file of the suite under flightdeck/testbench/ is listed.
// Usage: node flightdeck/testbench/suites/_checks/manifest-reflects-testbench/run.mjs; exit 0 when both hold, 2 otherwise.

import fs from 'node:fs';
import path from 'node:path';
import { none, readText, REPO, report, worktreeFiles } from '../lib/check-lib.mjs';
import { manifestPaths, MANIFEST_REL } from '../lib/parts.mjs';

const listed = manifestPaths(readText(path.join(REPO, MANIFEST_REL)));

await report(['scope'], [
  {
    name: 'every path MANIFEST.txt lists exists and is not empty',
    fn: () => none(listed.filter((rel) => { try { return fs.statSync(path.join(REPO, rel)).size === 0; } catch { return true; } }), 'listed paths missing or empty'),
  },
  {
    name: 'every file under flightdeck/testbench/ is listed in MANIFEST.txt',
    fn: () => {
      const set = new Set(listed);
      none(worktreeFiles(REPO).filter((rel) => rel.startsWith('flightdeck/testbench/') && fs.existsSync(path.join(REPO, rel)) && !set.has(rel)), 'unlisted files', 15);
    },
  },
]);
