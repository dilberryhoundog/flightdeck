#!/usr/bin/env node
// suites/constraint-manuals — C9: every file of the three rewritten manual folders is at most 150 lines.
import path from 'node:path';
import { MANUALS, REPO, assert, assertEq, exists, listFiles, readText, suite } from '../../lib/core-lib.mjs';

const FOLDERS = ['launch', 'harness', 'orchestration'];
const LIMIT = 150;

await suite('constraint-manuals', [
  {
    id: 'C9 the three manual folders are there',
    covers: ['C9'],
    fn: () => {
      for (const folder of FOLDERS) {
        const dir = path.join(MANUALS, folder);
        assert(exists(dir), `flightdeck/manuals/${folder}/ exists`);
        assert(listFiles(dir).length > 0, `flightdeck/manuals/${folder}/ is not empty`);
      }
    },
  },
  {
    id: 'C9 no file of the three folders runs past 150 lines',
    covers: ['C9'],
    fn: () => {
      const over = [];
      for (const folder of FOLDERS) {
        const dir = path.join(MANUALS, folder);
        if (!exists(dir)) continue;
        for (const rel of listFiles(dir)) {
          const file = path.join(dir, rel);
          const lines = readText(file).split('\n');
          const count = lines.at(-1) === '' ? lines.length - 1 : lines.length;
          if (count > LIMIT) over.push(`${path.relative(REPO, file)}: ${count} lines`);
        }
      }
      assertEq(over, [], `every file is at most ${LIMIT} lines`);
    },
  },
  {
    id: 'C9 no command sequence is left in the three folders',
    covers: ['C9'],
    fn: () => {
      const found = [];
      for (const folder of FOLDERS) {
        const dir = path.join(MANUALS, folder);
        if (!exists(dir)) continue;
        for (const rel of listFiles(dir)) {
          const text = readText(path.join(dir, rel));
          for (const block of text.matchAll(/```(?:sh|bash|console|shell)\n([\s\S]*?)```/g)) {
            const lines = block[1].split('\n').filter((line) => line.trim() !== '' && !line.trim().startsWith('#'));
            if (lines.length > 1) found.push(`flightdeck/manuals/${folder}/${rel}: a ${lines.length}-line command block`);
          }
        }
      }
      assertEq(found, [], 'the manuals name artefacts and readings, not command sequences');
    },
  },
]);
