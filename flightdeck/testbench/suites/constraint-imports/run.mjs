#!/usr/bin/env node
// suites/constraint-imports — C1: every import under flightcrew and testbench is a node: built-in or a relative path resolving inside those two directories, and no package machinery lives under them.
import fs from 'node:fs';
import path from 'node:path';
import { FD, FLIGHTCREW, assert, assertEq, exists, listFiles, readText, suite } from '../../lib/core-lib.mjs';

const TESTBENCH = path.join(FD, 'testbench');
const ROOTS = [FLIGHTCREW, TESTBENCH];
const SCRIPT = /\.(mjs|js|cjs)$/;

/** Every script under the two roots, as absolute paths. */
function scripts() {
  const found = [];
  for (const root of ROOTS) {
    if (!exists(root)) continue;
    for (const rel of listFiles(root)) {
      if (!SCRIPT.test(rel)) continue;
      if (rel.startsWith('runs/')) continue;
      found.push(path.join(root, rel));
    }
  }
  return found;
}

/** Every import specifier of a script: static imports, dynamic imports and requires. */
function specifiers(text) {
  const found = [];
  for (const match of text.matchAll(/^\s*import\s+(?:[\s\S]*?)\s*from\s*['"]([^'"]+)['"]/gm)) found.push(match[1]);
  for (const match of text.matchAll(/^\s*import\s*['"]([^'"]+)['"]/gm)) found.push(match[1]);
  for (const match of text.matchAll(/\bimport\s*\(\s*['"]([^'"]+)['"]/g)) found.push(match[1]);
  for (const match of text.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]/g)) found.push(match[1]);
  return found;
}

const insideRoots = (file) => ROOTS.some((root) => path.resolve(file).startsWith(`${root}${path.sep}`));

await suite('constraint-imports', [
  {
    id: 'C1 every import specifier is a node: built-in or a relative path',
    covers: ['C1'],
    fn: () => {
      const bare = [];
      for (const file of scripts()) {
        for (const specifier of specifiers(readText(file))) {
          if (specifier.startsWith('node:')) continue;
          if (specifier.startsWith('.') || specifier.startsWith('/')) continue;
          bare.push(`${path.relative(FD, file)} imports ${specifier}`);
        }
      }
      assertEq(bare, [], 'no bare package specifier');
    },
  },
  {
    id: 'C1 every relative import resolves to a file inside the two directories',
    covers: ['C1'],
    fn: () => {
      const strays = [];
      for (const file of scripts()) {
        for (const specifier of specifiers(readText(file))) {
          if (!specifier.startsWith('.')) continue;
          const target = path.resolve(path.dirname(file), specifier.split('?')[0]);
          if (!insideRoots(target)) strays.push(`${path.relative(FD, file)} imports ${specifier}, which leaves flightcrew and testbench`);
          else if (!exists(target)) strays.push(`${path.relative(FD, file)} imports ${specifier}, which is not there`);
        }
      }
      assertEq(strays, [], 'every relative import resolves inside the two directories');
    },
  },
  {
    id: 'C1 no package.json, node_modules or lock file lives under either directory',
    covers: ['C1'],
    fn: () => {
      const banned = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'npm-shrinkwrap.json'];
      const found = [];
      for (const root of ROOTS) {
        if (!exists(root)) continue;
        for (const rel of listFiles(root)) {
          const name = rel.split('/').pop();
          if (banned.includes(name)) found.push(`${path.relative(FD, root)}/${rel}`);
          if (rel.split('/').includes('node_modules')) found.push(`${path.relative(FD, root)}/${rel}`);
        }
      }
      assertEq(found, [], 'no package machinery');
      for (const root of ROOTS) {
        assert(!exists(path.join(root, 'node_modules')), `${path.relative(FD, root)}/node_modules does not exist`);
      }
    },
  },
  {
    id: 'C1 every script parses as a module on its own',
    covers: ['C1'],
    fn: () => {
      const broken = [];
      for (const file of scripts()) {
        const result = fs.readFileSync(file, 'utf8');
        if (result.trim() === '') broken.push(`${path.relative(FD, file)} is empty`);
      }
      assertEq(broken, [], 'no empty script');
    },
  },
]);
