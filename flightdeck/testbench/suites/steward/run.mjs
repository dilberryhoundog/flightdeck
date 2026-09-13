#!/usr/bin/env node
// suites/steward — B97: what the steward's own returns show of the invocations it was given, read from the returns this run stored.
import fs from 'node:fs';
import path from 'node:path';
import { THIS_RUN_DIR, assert, assertEq, exists, readJson, suite, validateWithRunSchema } from '../../lib/core-lib.mjs';

const returnsDir = path.join(THIS_RUN_DIR, 'returns');
const stewardReturns = () => (exists(returnsDir) ? fs.readdirSync(returnsDir).filter((name) => /^steward-.*\.json$/.test(name)) : []);

await suite('steward', [
  {
    id: 'B97 this run dispatched the steward and its returns are stored',
    covers: ['B97'],
    fn: () => {
      const found = stewardReturns();
      assert(found.length > 0, 'the run stored at least one steward return under runs/run-1/returns/');
    },
  },
  {
    id: 'B97 every steward return holds to its schema',
    covers: ['B97'],
    fn: () => {
      const found = stewardReturns();
      assert(found.length > 0, 'there are steward returns to read');
      for (const name of found) {
        assertEq(validateWithRunSchema('steward-return.schema.json', readJson(path.join(returnsDir, name))), [], `${name} against steward-return.schema.json`);
      }
    },
  },
  {
    id: 'B97 every steward return names one leaf or git invocation and its exit',
    covers: ['B97'],
    fn: () => {
      const found = stewardReturns();
      assert(found.length > 0, 'there are steward returns to read');
      for (const name of found) {
        const record = readJson(path.join(returnsDir, name));
        assert(typeof record.command === 'string' && record.command.trim() !== '', `${name}: the invocation is named`);
        assert(/(^|\/|\s)(flight|git)\b/.test(record.command), `${name}: the invocation is a leaf or a git command, got ${record.command}`);
        assertEq(record.command.split('\n').length, 1, `${name}: one invocation, not a sequence`);
        assert(!/&&|\|\||;/.test(record.command), `${name}: one invocation, not a chain: ${record.command}`);
        assert(Number.isInteger(record.exit), `${name}: the exit code is an integer`);
        assert(Array.isArray(record.stdout_tail) && Array.isArray(record.stderr_tail), `${name}: the output tails are lists`);
      }
    },
  },
  {
    id: 'B97 no steward return names an invocation that writes outside the leaves',
    covers: ['B97'],
    fn: () => {
      const found = stewardReturns();
      assert(found.length > 0, 'there are steward returns to read');
      for (const name of found) {
        const command = readJson(path.join(returnsDir, name)).command;
        assert(!/\brm\b|\bmv\b|>\s*\S/.test(command), `${name}: the steward runs a leaf or git, not a shell edit: ${command}`);
      }
    },
  },
]);
