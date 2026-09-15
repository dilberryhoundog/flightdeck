// testbench/suites/_checks/lib/agent-suites.mjs — finds the statistical suites (those printing ratio lines) and the judged suites (those printing a sheet line) among the checkout's suite outputs, and maps them to scenario sets.
// Usage: import { agentSuites, scenarioIndex, setsOfSuite } from '../lib/agent-suites.mjs'.

import path from 'node:path';
import { REPO, specIds, indexOutputs } from './check-lib.mjs';
import { readOutput } from './protocol.mjs';
import { readSets } from './scenarios.mjs';

/** { ids, outputs, reads, statistical: [read], judged: [read], sets } for the tree at `root`. */
export async function agentSuites(root = REPO) {
  const ids = specIds(root);
  const outputs = await indexOutputs(root);
  const reads = new Map([...outputs].map(([suite, run]) => [suite, readOutput(run, ids)]));
  const statistical = [...reads.values()].filter((r) => r.ratios.length > 0);
  const judged = [...reads.values()].filter((r) => r.sheet !== null);
  return { ids, outputs, reads, statistical, judged, sets: readSets(root) };
}

/** A Map from scenario folder name to [{ set, scenario }] across every set. */
export function scenarioIndex(sets) {
  const index = new Map();
  for (const set of sets) {
    for (const scenario of set.scenarios) {
      if (!index.has(scenario.name)) index.set(scenario.name, []);
      index.get(scenario.name).push({ set, scenario });
    }
  }
  return index;
}

/** The sets a statistical suite reads (through its ratio scenarios) or a judged suite reads (through its sheet path). */
export function setsOfSuite(read, sets) {
  const found = new Set();
  const index = scenarioIndex(sets);
  for (const r of read.ratios) for (const hit of index.get(r.scenario) ?? []) found.add(hit.set.name);
  if (read.sheet) {
    const p = path.posix.normalize(read.sheet.path);
    for (const set of sets) if (p === set.rel || p.startsWith(`${set.rel}/`)) found.add(set.name);
  }
  return sets.filter((s) => found.has(s.name));
}
