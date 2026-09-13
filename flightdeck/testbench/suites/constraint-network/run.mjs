#!/usr/bin/env node
// suites/constraint-network — C6: no leaf, hook or validator reaches the network, and only the two roles the spec names hold a network tool.
import path from 'node:path';
import { BIN, CORE_HOOKS, CREW, FD, VERIFY_LIB, assert, assertEq, exists, frontmatter, listFiles, readText, suite } from '../../lib/core-lib.mjs';
import { stripLiterals } from '../../lib/workflow-scan.mjs';

const BANNED = ['node:http', 'node:https', 'node:net', 'node:dgram', 'node:tls'];
const DIRS = [BIN, CORE_HOOKS, VERIFY_LIB];

function scripts() {
  const found = [];
  for (const dir of DIRS) {
    if (!exists(dir)) continue;
    for (const rel of listFiles(dir)) {
      if (/\.(mjs|js|cjs)$/.test(rel)) found.push(path.join(dir, rel));
    }
  }
  return found;
}

const asList = (value) => (Array.isArray(value) ? value : typeof value === 'string' ? value.split(',').map((s) => s.trim()).filter(Boolean) : []);

await suite('constraint-network', [
  {
    id: 'C6 no leaf, hook or validator imports a network module',
    covers: ['C6'],
    fn: () => {
      const found = [];
      const files = scripts();
      assert(files.length > 0, 'there are leaves, hooks and validators to scan');
      for (const file of files) {
        const text = readText(file);
        for (const module of BANNED) {
          if (new RegExp(`['"]${module}['"]`).test(text)) found.push(`${path.relative(FD, file)} imports ${module}`);
        }
      }
      assertEq(found, [], 'no network module is imported');
    },
  },
  {
    id: 'C6 no leaf, hook or validator calls fetch',
    covers: ['C6'],
    fn: () => {
      const found = [];
      for (const file of scripts()) {
        const code = stripLiterals(readText(file));
        if (/(^|[^.\w])fetch\s*\(/.test(code)) found.push(path.relative(FD, file));
      }
      assertEq(found, [], 'no call to fetch');
    },
  },
  {
    id: 'C6 only the explorer holds the web tools',
    covers: ['C6'],
    fn: () => {
      const holders = [];
      for (const name of listFiles(CREW).filter((n) => n.endsWith('.md'))) {
        const tools = asList(frontmatter(path.join(CREW, name)).data?.tools).join(' ');
        if (/WebFetch|WebSearch/.test(tools)) holders.push(name.replace(/\.md$/, ''));
      }
      assertEq(holders.filter((role) => !role.startsWith('spec-')), ['explorer'], 'the explorer alone reaches the web among the run roles');
    },
  },
  {
    id: 'C6 only the orchestrator names gh and git push among its reach',
    covers: ['C6'],
    fn: () => {
      const holders = [];
      for (const name of listFiles(CREW).filter((n) => n.endsWith('.md'))) {
        const role = name.replace(/\.md$/, '');
        if (role.startsWith('spec-')) continue;
        const text = readText(path.join(CREW, name));
        if (/\bgh pr create\b|\bgit push\b/.test(text)) holders.push(role);
      }
      assertEq(holders, ['orchestrator'], 'the orchestrator alone reaches the remote');
    },
  },
]);
