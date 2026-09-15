// testbench/suites/_checks/spec-copies/run.mjs — T32 (C6): the spec and every copy of it are byte-identical to the frozen spec, and the run's documents changed since the freeze sit inside one launch folder.
// Usage: node flightdeck/testbench/suites/_checks/spec-copies/run.mjs; exit 0 when both hold, 2 otherwise.
//
// The frozen spec is flightdeck/launch/flightcrew-characterization/specs/spec.v1.json at the freeze commit eca2bba. Copies are the
// canonical flightdeck/launch/specs/flightcrew-characterization/spec.v1.json, the interview home's copy, and any
// flightdeck/launch/<L>/specs/flightcrew-characterization/spec.v1.json. The launch-folder rule counts paths changed since the freeze
// under flightdeck/launch/, outside flightdeck/launch/specs/flightcrew-characterization/ and flightdeck/launch/RUNLOG.md, by their
// first folder. The run log entry itself is written by fc launch end, after the checks are green, and is not checked here.

import fs from 'node:fs';
import path from 'node:path';
import { changedSince, ensure, FREEZE_COMMIT, none, REPO, report, showAt, SPEC_REL } from '../lib/check-lib.mjs';

const FROZEN_REL = 'flightdeck/launch/flightcrew-characterization/specs/spec.v1.json';

await report(['C6'], [
  {
    name: 'every copy of spec.v1.json for this spec is byte-identical to the frozen spec',
    fn: () => {
      const frozen = showAt(REPO, FREEZE_COMMIT, FROZEN_REL);
      ensure(frozen !== null, `${FROZEN_REL} is not in commit ${FREEZE_COMMIT}`);
      const copies = new Set([SPEC_REL, FROZEN_REL]);
      const launch = path.join(REPO, 'flightdeck/launch');
      for (const e of fs.readdirSync(launch, { withFileTypes: true })) {
        const rel = `flightdeck/launch/${e.name}/specs/flightcrew-characterization/spec.v1.json`;
        if (e.isDirectory() && fs.existsSync(path.join(REPO, rel))) copies.add(rel);
      }
      const problems = [];
      for (const rel of copies) {
        let bytes = null;
        try {
          bytes = fs.readFileSync(path.join(REPO, rel));
        } catch {
          problems.push(`${rel} is missing`);
          continue;
        }
        if (!bytes.equals(frozen)) problems.push(`${rel} differs from the frozen spec`);
      }
      none(problems, 'spec copies not byte-identical');
    },
  },
  {
    name: "the run's documents changed since the freeze sit inside one launch folder",
    fn: () => {
      const folders = new Set();
      for (const rel of changedSince(REPO, FREEZE_COMMIT)) {
        if (!rel.startsWith('flightdeck/launch/')) continue;
        if (rel === 'flightdeck/launch/RUNLOG.md' || rel.startsWith('flightdeck/launch/specs/flightcrew-characterization/')) continue;
        folders.add(rel.split('/')[2]);
      }
      ensure(folders.size <= 1, `changes under ${folders.size} launch folders: ${[...folders].sort().join(', ')}`);
    },
  },
]);
