// testbench/suites/_checks/imports-and-packages/run.mjs — T31 (C1): every script of the suite is a Node ES module importing only Node built-ins or relative paths, and no package.json, node_modules or lock file exists anywhere under flightdeck/.
// Usage: node flightdeck/testbench/suites/_checks/imports-and-packages/run.mjs; exit 0 when both hold, 2 otherwise.
//
// The suite's scripts are the .mjs, .js and .cjs files git sees under flightdeck/testbench/, outside benches/. Comments are removed
// before static imports ('import … from', 'import "…"', 'export … from') and literal dynamic imports are read; a require( call or a
// .cjs file is not an ES module. The package walk reads the filesystem under flightdeck/, skipping .git.

import fs from 'node:fs';
import { builtinModules } from 'node:module';
import path from 'node:path';
import { none, readText, REPO, report, worktreeFiles } from '../lib/check-lib.mjs';

const PACKAGE_FILES = new Set(['package.json', 'package-lock.json', 'npm-shrinkwrap.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb', 'bun.lock']);

function stripComments(code) {
  return code.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\'"`])\/\/.*$/gm, '$1');
}

function specifiers(code) {
  const found = [];
  const patterns = [
    /(?:^|[;\n])\s*import\s+(?:[\w*${}\s,]+?\s+from\s+)?(['"])([^'"\n]+)\1/g,
    /(?:^|[;\n])\s*export\s+(?:\*(?:\s+as\s+\w+)?|\{[^}]*\})\s*from\s+(['"])([^'"\n]+)\1/g,
    /\bimport\s*\(\s*(['"])([^'"\n]+)\1\s*\)/g,
  ];
  for (const re of patterns) for (const m of code.matchAll(re)) found.push(m[2]);
  return found;
}

const allowed = (spec) => spec.startsWith('node:') || builtinModules.includes(spec) || spec.startsWith('./') || spec.startsWith('../');

await report(['C1'], [
  {
    name: 'every script of the suite imports only Node built-ins or relative paths and is an ES module',
    fn: () => {
      const problems = [];
      const scripts = worktreeFiles(REPO).filter((rel) => rel.startsWith('flightdeck/testbench/') && !rel.startsWith('flightdeck/testbench/benches/') && /\.(mjs|js|cjs)$/.test(rel));
      for (const rel of scripts) {
        if (rel.endsWith('.cjs')) problems.push(`${rel} is a CommonJS file`);
        const text = readText(path.join(REPO, rel));
        if (text === null) continue;
        const code = stripComments(text);
        for (const spec of specifiers(code)) if (!allowed(spec)) problems.push(`${rel} imports '${spec}'`);
        if (/(^|[^.\w$'"`])require\s*\(/m.test(code)) problems.push(`${rel} calls the CommonJS require function`);
      }
      none(problems, 'script problems');
    },
  },
  {
    name: 'no package.json, node_modules or lock file exists under flightdeck/',
    fn: () => {
      const problems = [];
      const visit = (dir) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
          if (e.name === '.git') continue;
          const p = path.join(dir, e.name);
          const rel = path.relative(REPO, p);
          if (e.isDirectory()) {
            if (e.name === 'node_modules') problems.push(rel);
            else visit(p);
          } else if (PACKAGE_FILES.has(e.name)) problems.push(rel);
        }
      };
      visit(path.join(REPO, 'flightdeck'));
      none(problems, 'package files');
    },
  },
]);
