// testbench/suites/_checks/no-remote-no-model/run.mjs — T34 (C8): nothing the suite runs reaches a remote repository or starts a model session.
// Usage: node flightdeck/testbench/suites/_checks/no-remote-no-model/run.mjs; exit 0 when no suite run or script does either, 2 otherwise.
//
// Every suite runs with shims for git, gh and claude first on PATH (../lib/check-lib.mjs) that record and refuse git push, fetch,
// pull and ls-remote, any gh command other than a version or help query, and any claude invocation other than a version query. The
// scripts of the suite (flightdeck/testbench/ outside benches/ and suites/_checks/) are also read, comments removed, for network
// modules, fetch calls and literal spawns of claude or gh, which a shim on PATH would not see when given an absolute path.

import path from 'node:path';
import { none, readText, REPO, report, indexOutputs, worktreeFiles } from '../lib/check-lib.mjs';

const NETWORK = ['http', 'https', 'http2', 'net', 'tls', 'dgram'];
let outputs = null;
let prep = null;
try {
  outputs = await indexOutputs(REPO);
} catch (error) {
  prep = error;
}

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');
}

await report(['C8'], [
  {
    name: 'no suite run pushes, pulls, fetches, calls gh or starts claude',
    fn: () => {
      if (prep) throw prep;
      none([...outputs.values()].flatMap((run) => run.refused.map((line) => `${run.suite}: ${line}`)), 'refused invocations');
    },
  },
  {
    name: 'no suite script imports a network module, calls fetch or spawns claude or gh',
    fn: () => {
      const problems = [];
      const scripts = worktreeFiles(REPO).filter((rel) => rel.startsWith('flightdeck/testbench/') && !rel.startsWith('flightdeck/testbench/benches/') && !rel.startsWith('flightdeck/testbench/suites/_checks/') && /\.(mjs|js|cjs)$/.test(rel));
      for (const rel of scripts) {
        const code = stripComments(readText(path.join(REPO, rel)) ?? '');
        for (const mod of NETWORK) {
          if (new RegExp(`(from|import)\\s*\\(?\\s*['"](node:)?${mod}['"]`).test(code)) problems.push(`${rel} imports ${mod}`);
        }
        if (/(^|[^.\w$])fetch\s*\(/m.test(code)) problems.push(`${rel} calls fetch`);
        if (/\b(spawn|spawnSync|exec|execSync|execFile|execFileSync)\s*\(\s*['"`](claude|gh)\b/.test(code)) problems.push(`${rel} spawns claude or gh`);
      }
      none(problems, 'network or model reaches');
    },
  },
]);
