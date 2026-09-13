#!/usr/bin/env node
// suites/terms — I16: what library/terms.md says a test, a check and a verdict are, that check class is gone, and where each of the four things lives.
import path from 'node:path';
import { REPO, assert, assertEq, exists, readText, suite } from '../../lib/core-lib.mjs';

const FILE = path.join(REPO, 'library', 'terms.md');
const text = () => readText(FILE).toLowerCase();

await suite('terms', [
  {
    id: 'I16 library/terms.md is there',
    covers: ['I16'],
    fn: () => {
      assert(exists(FILE), 'library/terms.md exists');
      assert(readText(FILE).trim().length > 0, 'it is not empty');
    },
  },
  {
    id: 'I16 a test is an assertion the project owns and a run never writes',
    covers: ['I16'],
    fn: () => {
      const body = text();
      assert(/\btest\b/.test(body), 'the word test is defined');
      assert(/own(ed)? by the project|the project owns/.test(body), 'a test is owned by the project');
      assert(/never written by a run|a run never writes/.test(body), 'a run never writes one');
      assert(/invoked by a check/.test(body), 'a check invokes it');
    },
  },
  {
    id: 'I16 a check is the wrapper a tests map names, returning a verdict a gate reads',
    covers: ['I16'],
    fn: () => {
      const body = text();
      assert(/wrapper/.test(body), 'a check is a wrapper');
      assert(/tests map names|a tests map names/.test(body), 'the tests map names it');
      assert(/verdict a gate reads/.test(body), 'it returns a verdict a gate reads');
    },
  },
  {
    id: 'I16 a verdict is an exit code, a ratio against a threshold declared first, or a sheet against a rubric',
    covers: ['I16'],
    fn: () => {
      const body = text();
      assert(/exit code/.test(body), 'the exit code');
      assert(/ratio/.test(body) && /threshold/.test(body), 'the ratio and its threshold');
      assert(/declared before any trial|before any trial ran|declared in advance/.test(body), 'the threshold is declared before any trial');
      assert(/verdict sheet/.test(body) && /rubric/.test(body), 'the verdict sheet and its rubric');
    },
  },
  {
    id: 'I16 check class is gone and verdict kind stands in its place',
    covers: ['I16'],
    fn: () => {
      const body = text();
      assert(/verdict kind/.test(body), 'verdict kind is named');
      assert(/check class is removed|class is removed|removed; verdict kind|no check class/.test(body), 'the removal of check class is stated');
      const live = readText(FILE).split('\n').filter((line) => /^\s*[-*#]/.test(line) && /check class/i.test(line) && !/removed/i.test(line));
      assertEq(live, [], 'no live definition of check class survives');
    },
  },
  {
    id: 'I16 the four homes are named',
    covers: ['I16'],
    fn: () => {
      const body = readText(FILE);
      for (const place of ['runs/run-<n>/checks/', 'specs/', 'flightdeck/testbench/', 'flightdeck/flightcrew/verify/']) {
        assert(body.includes(place), `terms.md names ${place}`);
      }
    },
  },
]);
