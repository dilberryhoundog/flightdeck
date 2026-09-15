// testbench/suites/_checks/lib/sweep-run.mjs — the body shared by the sweep checks (B2): take the inventory's parts of the given kinds, sorted by name, keep chunk `chunk` of `chunks`, sweep them, print one case per part.
// Usage: import { runSweep } from '../lib/sweep-run.mjs'; await runSweep(['B2'], (p) => p.kind === 'hook', 'hooks', 1, 2);
//
// Chunk i of n holds the parts at sorted positions from floor((i-1)*len/n) up to floor(i*len/n), so every part of the kinds falls in
// exactly one chunk whatever the inventory grows to. A case passes when breaking its part turns at least one case naming the part
// red, or when the part is listed in fixtures/sweep-exempt.json with a reason. The name index decides which suites name a part.

import path from 'node:path';
import { FIXTURES, oneLine, REPO, report, specIds, indexOutputs } from './check-lib.mjs';
import { inventory, readExempt, sweep } from './parts.mjs';

export function chunkOf(parts, chunk, chunks) {
  const sorted = [...parts].sort((a, b) => (a.part < b.part ? -1 : a.part > b.part ? 1 : 0));
  return sorted.slice(Math.floor(((chunk - 1) * sorted.length) / chunks), Math.floor((chunk * sorted.length) / chunks));
}

export async function runSweep(covers, filter, label, chunk = 1, chunks = 1) {
  let results = null;
  let prep = null;
  try {
    const all = inventory(REPO).filter(filter);
    if (all.length === 0) throw new Error(`the inventory holds no ${label}`);
    const parts = chunkOf(all, chunk, chunks);
    if (parts.length === 0) throw new Error(`chunk ${chunk} of ${chunks} of the ${all.length} ${label} is empty`);
    const outputs = await indexOutputs(REPO);
    const exempt = readExempt(path.join(FIXTURES, 'sweep-exempt.json'));
    results = await sweep({ root: REPO, parts, outputs, ids: specIds(), exempt });
  } catch (error) {
    prep = error;
  }
  if (prep) {
    await report(covers, [{ name: `the sweep of ${label}, chunk ${chunk} of ${chunks}, runs`, fn: () => { throw new Error(oneLine(prep)); } }]);
    return;
  }
  await report(
    covers,
    results.map((r) => ({
      name: `breaking ${r.part} turns a case naming it red`,
      fn: () => {
        if (!r.held) throw new Error(r.detail);
      },
    })),
  );
}
