// testbench/suites/_checks/lib/map-file.mjs — locates this spec's tests map: the highest-numbered tests-map.v<n>.json beside the spec at flightdeck/launch/specs/flightcrew-characterization/.
// Usage: import { mapFile } from '../lib/map-file.mjs'; mapFile(root) → repository-relative path, or throws when there is none.

import fs from 'node:fs';
import path from 'node:path';

export const MAP_DIR_REL = 'flightdeck/launch/specs/flightcrew-characterization';

export function mapFile(root) {
  let names = [];
  try {
    names = fs.readdirSync(path.join(root, MAP_DIR_REL));
  } catch {
    names = [];
  }
  const versions = names.map((n) => /^tests-map\.v([1-9]\d*)\.json$/.exec(n)).filter(Boolean).map((m) => Number(m[1])).sort((a, b) => b - a);
  if (versions.length === 0) throw new Error(`no tests-map.v<n>.json in ${MAP_DIR_REL}`);
  return `${MAP_DIR_REL}/tests-map.v${versions[0]}.json`;
}
