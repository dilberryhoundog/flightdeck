#!/usr/bin/env node
// suites/constraint-residue — C5: no markdown a reader inherits carries a phrase from the session that wrote it.
import path from 'node:path';
import { FD, REPO, assert, assertEq, exists, listFiles, readText, suite } from '../../lib/core-lib.mjs';

const PHRASES = ['this session', 'we decided', 'as discussed', 'earlier today', 'the user asked'];

/** Every markdown file C5 names. */
function files() {
  const found = [];
  for (const dir of [path.join(FD, 'flightcrew'), path.join(FD, 'manuals')]) {
    if (!exists(dir)) continue;
    for (const rel of listFiles(dir)) if (rel.endsWith('.md')) found.push(path.join(dir, rel));
  }
  for (const file of [path.join(FD, 'launch', 'README.md'), path.join(FD, 'testbench', 'README.md'), path.join(REPO, 'CLAUDE.md')]) {
    if (exists(file)) found.push(file);
  }
  return found;
}

await suite('constraint-residue', [
  {
    id: 'C5 no named file carries a session phrase',
    covers: ['C5'],
    fn: () => {
      const found = [];
      const scanned = files();
      assert(scanned.length > 0, 'there is markdown to scan');
      for (const file of scanned) {
        const lines = readText(file).split('\n');
        for (const [index, line] of lines.entries()) {
          const lower = line.toLowerCase();
          for (const phrase of PHRASES) {
            if (lower.includes(phrase)) found.push(`${path.relative(REPO, file)}:${index + 1}: ${phrase}`);
          }
        }
      }
      assertEq(found, [], 'no session residue');
    },
  },
  {
    id: 'C5 the three README files C5 names are among the scanned set',
    covers: ['C5'],
    fn: () => {
      const scanned = files().map((file) => path.relative(REPO, file));
      for (const named of ['flightdeck/launch/README.md', 'flightdeck/testbench/README.md', 'CLAUDE.md']) {
        assert(scanned.includes(named), `${named} exists and is scanned`);
      }
      assert(scanned.some((file) => file.startsWith('flightdeck/flightcrew/')), 'the flightcrew markdown is scanned');
      assert(scanned.some((file) => file.startsWith('flightdeck/manuals/')), 'the manuals are scanned');
    },
  },
]);
