// testbench/suites/_checks/part-coverage-selftest/run.mjs — T3 (E1): the coverage check and the sweep fail naming a part that has no case, a part whose only cases stay green when it is broken, and a part with no alteration.
// Usage: node flightdeck/testbench/suites/_checks/part-coverage-selftest/run.mjs; exit 0 when the checkers report each fault by name, 2 otherwise.
//
// The first two cases feed the inventory the real MANIFEST, usage and distribute listing with one part added and a suite output
// naming every other part. The sweep cases build a small git repository with two hooks and a role file, one suite that exercises a
// hook and one that only tests the other files exist, and sweep it.

import path from 'node:path';
import { ensure, gitRun, REPO, report, runNode, specIds, suiteOutputs, tempDir, writeTree, readText } from '../lib/check-lib.mjs';
import { inventoryFrom, namingCases, sweep, MANIFEST_REL } from '../lib/parts.mjs';

const ids = specIds();
const fcMjs = path.join(REPO, 'flightdeck/flightcrew/bin/fc.mjs');

function sources() {
  const usage = runNode(REPO, [fcMjs]);
  const distribute = runNode(REPO, [fcMjs, 'distribute']);
  return { manifest: readText(path.join(REPO, MANIFEST_REL)), usage: `${usage.stdout}\n${usage.stderr}`, distribute: distribute.stdout };
}

function outputNaming(parts) {
  const lines = parts.map((p) => `pass  ${p.part} is named`);
  return new Map([['fixture', { suite: 'fixture', exit: 0, stdout: `${lines.join('\n')}\ncovers: E1\n${parts.length}/${parts.length} passed\n` }]]);
}

function unnamed(parts, outputs) {
  const naming = namingCases(parts, outputs, ids);
  return parts.filter((p) => naming.get(p.part).length === 0).map((p) => p.part);
}

const HOOK = [
  "import fs from 'node:fs';",
  "const input = fs.readFileSync(0, 'utf8');",
  "if (input.includes('locked')) fs.writeSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: 'locked' } }) + '\\n');",
  'process.exit(0);',
  '',
].join('\n');

function suiteSource(cases) {
  return [
    "import { spawnSync } from 'node:child_process';",
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    "const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');",
    'let passed = 0; const lines = [];',
    `const cases = [${cases.join(',\n')}];`,
    "for (const [name, fn] of cases) { let ok = false; try { ok = fn(); } catch { ok = false; } if (ok) { passed += 1; lines.push('pass  ' + name); } else lines.push('FAIL  ' + name + ': did not hold'); }",
    "lines.push('covers: E1'); lines.push(passed + '/' + cases.length + ' passed');",
    "fs.writeSync(1, lines.join('\\n') + '\\n');",
    'process.exit(passed === cases.length ? 0 : 2);',
    '',
  ].join('\n');
}

function miniRepo() {
  const root = tempDir('fc-chk-mini-');
  writeTree(root, {
    'flightdeck/flightcrew/hooks/toy-guard.mjs': HOOK,
    'flightdeck/flightcrew/hooks/idle-guard.mjs': HOOK,
    'flightdeck/flightcrew/crew/nameless.md': '---\ndescription: a role file with no name field\n---\nBody.\n',
    'flightdeck/testbench/suites/holds/run.mjs': suiteSource([
      "['flightdeck/flightcrew/hooks/toy-guard.mjs denies an edit to a locked path', () => { const r = spawnSync(process.execPath, [path.join(REPO, 'flightdeck/flightcrew/hooks/toy-guard.mjs')], { input: '{\"path\":\"locked\"}', encoding: 'utf8' }); return r.status === 0 && r.stdout.includes('\"deny\"'); }]",
    ]),
    'flightdeck/testbench/suites/idle/run.mjs': suiteSource([
      "['flightdeck/flightcrew/hooks/idle-guard.mjs is present', () => fs.existsSync(path.join(REPO, 'flightdeck/flightcrew/hooks/idle-guard.mjs'))]",
      "['flightdeck/flightcrew/crew/nameless.md is present', () => fs.existsSync(path.join(REPO, 'flightdeck/flightcrew/crew/nameless.md'))]",
    ]),
  });
  gitRun(root, ['init', '--quiet']);
  gitRun(root, ['add', '-A']);
  const commit = gitRun(root, ['-c', 'user.name=check', '-c', 'user.email=check@example.invalid', 'commit', '--quiet', '-m', 'mini']);
  if (commit.status !== 0) throw new Error(`mini repository commit failed: ${commit.stderr}`);
  return root;
}

let mini = null;
let miniError = null;
try {
  mini = miniRepo();
} catch (error) {
  miniError = error;
}

await report(['E1'], [
  {
    name: 'a hook added to MANIFEST.txt with no case is reported by its path',
    fn: () => {
      const src = sources();
      const real = inventoryFrom(src);
      const added = 'flightdeck/flightcrew/hooks/added-later.mjs';
      const grown = inventoryFrom({ ...src, manifest: `${src.manifest}\n${added}\n` });
      const missing = unnamed(grown, outputNaming(real));
      ensure(missing.length === 1 && missing[0] === added, `expected exactly [${added}] unnamed, got [${missing.join(', ')}]`);
    },
  },
  {
    name: 'a subcommand added to the usage with no case is reported by its token',
    fn: () => {
      const src = sources();
      const real = inventoryFrom(src);
      const grown = inventoryFrom({ ...src, usage: src.usage.replace(/\n  distribute \| doctor/, '\n  frobnicate              added later\n  distribute | doctor') });
      const missing = unnamed(grown, outputNaming(real));
      ensure(missing.length === 1 && missing[0] === 'fc frobnicate', `expected exactly [fc frobnicate] unnamed, got [${missing.join(', ')}]`);
    },
  },
  {
    name: 'the sweep holds a hook whose naming case goes red when its decision is flipped',
    fn: async () => {
      if (miniError) throw miniError;
      const outputs = await suiteOutputs(mini);
      const [toy] = await sweep({ root: mini, parts: [{ part: 'flightdeck/flightcrew/hooks/toy-guard.mjs', kind: 'hook' }], outputs, ids, concurrency: 1 });
      ensure(toy.held === true && !toy.exempt, `toy-guard was not held: ${toy.detail}`);
    },
  },
  {
    name: 'the sweep fails a hook whose only naming case stays green, naming the hook',
    fn: async () => {
      if (miniError) throw miniError;
      const outputs = await suiteOutputs(mini);
      const [idle] = await sweep({ root: mini, parts: [{ part: 'flightdeck/flightcrew/hooks/idle-guard.mjs', kind: 'hook' }], outputs, ids, concurrency: 1 });
      ensure(idle.held === false, 'idle-guard was reported held');
      ensure(idle.detail.includes('flightdeck/flightcrew/hooks/idle-guard.mjs') && /stays green/.test(idle.detail), `the report does not name the part as staying green: ${idle.detail}`);
    },
  },
  {
    name: 'the sweep fails a part no alteration applies to, naming it, unless it is exempt',
    fn: async () => {
      if (miniError) throw miniError;
      const outputs = await suiteOutputs(mini);
      const part = { part: 'flightdeck/flightcrew/crew/nameless.md', kind: 'role' };
      const [plain] = await sweep({ root: mini, parts: [part], outputs, ids, concurrency: 1 });
      ensure(plain.held === false && plain.detail.includes(part.part) && /no alteration applies/.test(plain.detail), `unexpected report: ${plain.detail}`);
      const [exempt] = await sweep({ root: mini, parts: [part], outputs, ids, exempt: new Map([[part.part, 'no name field to drop']]), concurrency: 1 });
      ensure(exempt.exempt === true, `an exempt part was swept: ${exempt.detail}`);
    },
  },
  {
    name: 'the sweep fails a part no case names, naming it',
    fn: async () => {
      if (miniError) throw miniError;
      const [r] = await sweep({ root: mini, parts: [{ part: 'flightdeck/flightcrew/hooks/unnamed.mjs', kind: 'hook' }], outputs: new Map(), ids, concurrency: 1 });
      ensure(r.held === false && r.detail === 'no case names flightdeck/flightcrew/hooks/unnamed.mjs', `unexpected report: ${r.detail}`);
    },
  },
]);
