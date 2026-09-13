#!/usr/bin/env node
// suites/judge-returns — B66: the sheets this run's judge wrote, held to the shape I15 fixes and to the rubric each one answers.
import fs from 'node:fs';
import path from 'node:path';
import { THIS_RUN_DIR, assert, assertEq, exists, readJson, readText, suite, validateWithRunSchema } from '../../lib/core-lib.mjs';

const returnsDir = path.join(THIS_RUN_DIR, 'returns');
const rubricsDir = path.join(THIS_RUN_DIR, 'checks', 'rubrics');
const sheets = () => (exists(returnsDir) ? fs.readdirSync(returnsDir).filter((name) => /^judge-.*\.json$/.test(name)) : []);
const rubrics = () => (exists(rubricsDir) ? fs.readdirSync(rubricsDir).filter((name) => /^T\d+\.md$/.test(name)) : []);

await suite('judge-returns', [
  {
    id: 'B66 there is one sheet for every rubric this run carries',
    covers: ['B66'],
    fn: () => {
      const wanted = rubrics().map((name) => name.replace(/\.md$/, ''));
      assert(wanted.length > 0, 'the run carries at least one rubric');
      const found = sheets().map((name) => name.replace(/^judge-/, '').replace(/\.json$/, ''));
      for (const id of wanted) assert(found.includes(id), `a sheet was written for ${id}`);
    },
  },
  {
    id: 'B66 every sheet holds to the judge return schema',
    covers: ['B66'],
    fn: () => {
      const found = sheets();
      assert(found.length > 0, 'there are sheets to read');
      for (const name of found) {
        assertEq(validateWithRunSchema('judge-return.schema.json', readJson(path.join(returnsDir, name))), [], `${name} against judge-return.schema.json`);
      }
    },
  },
  {
    id: 'B66 every answer carries a non-empty quote',
    covers: ['B66'],
    fn: () => {
      const found = sheets();
      assert(found.length > 0, 'there are sheets to read');
      for (const name of found) {
        const sheet = readJson(path.join(returnsDir, name));
        assert(sheet.answers.length > 0, `${name}: the sheet answers something`);
        for (const [index, answer] of sheet.answers.entries()) {
          assert(typeof answer.quote === 'string' && answer.quote.trim() !== '', `${name}: answer ${index + 1} carries a quote`);
          assert(['yes', 'no'].includes(answer.answer), `${name}: answer ${index + 1} is yes or no`);
        }
      }
    },
  },
  {
    id: 'B66 every sheet names the rubric it answered and a subject that is there',
    covers: ['B66'],
    fn: () => {
      const found = sheets();
      assert(found.length > 0, 'there are sheets to read');
      for (const name of found) {
        const sheet = readJson(path.join(returnsDir, name));
        const id = name.replace(/^judge-/, '').replace(/\.json$/, '');
        assert(sheet.rubric.includes(`${id}.md`), `${name}: the sheet names its own rubric, got ${sheet.rubric}`);
        assert(rubrics().includes(`${id}.md`), `${name}: the rubric it names is in the run`);
      }
    },
  },
  {
    id: 'B66 every question of a rubric is answered',
    covers: ['B66'],
    fn: () => {
      const found = sheets();
      assert(found.length > 0, 'there are sheets to read');
      for (const name of found) {
        const sheet = readJson(path.join(returnsDir, name));
        const id = name.replace(/^judge-/, '').replace(/\.json$/, '');
        const file = path.join(rubricsDir, `${id}.md`);
        if (!exists(file)) continue;
        const questions = readText(file).split('\n').filter((line) => /^\s*\d+\.\s+\S/.test(line));
        assert(questions.length > 0, `${id}.md asks numbered questions`);
        assertEq(sheet.answers.length, questions.length, `${name}: one answer per question of ${id}.md`);
      }
    },
  },
]);
