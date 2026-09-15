// testbench/suites/_checks/defect-references/run.mjs — T35 (C9): every defect line names the manual and its line, or, for a part with no manual, the part's own header comment or usage line, and the named line exists.
// Usage: node flightdeck/testbench/suites/_checks/defect-references/run.mjs; exit 0 when every reference resolves, 2 otherwise.
//
// A manual reference names one of the files C9 lists. A part reference names a schema, template, validator, gate or command file
// under flightdeck/flightcrew/; for a script its line lies in the leading comment block, for a JSON file at or above the top-level
// "description" line, for any other file at or above its first blank line. World-state rule: it holds vacuously while no defect is marked.

import path from 'node:path';
import { none, readText, REPO, report, specIds, indexOutputs } from '../lib/check-lib.mjs';
import { printedDefects } from '../lib/rules.mjs';

const MANUALS = new Set([
  'flightdeck/manuals/harness/hooks.md',
  'flightdeck/manuals/harness/workflows.md',
  'flightdeck/manuals/harness/permissions.md',
  'flightdeck/manuals/harness/claude-code-facts.md',
  'flightdeck/manuals/launch/launch-anatomy.md',
  'flightdeck/manuals/orchestration/crew.md',
  'flightdeck/manuals/orchestration/kickoff.md',
  'flightdeck/manuals/orchestration/planning.md',
  'flightdeck/manuals/orchestration/review.md',
  'flightdeck/manuals/orchestration/endings.md',
  'flightdeck/manuals/orchestration/run-log.md',
  'flightdeck/manuals/orchestration/run-report.md',
  'flightdeck/flightcrew/hooks/README.md',
  'flightdeck/flightcrew/crew/README.md',
  'flightdeck/flightcrew/workflows/README.md',
  'library/flightcrew/creating-harness-documents.md',
]);
const PART = /^flightdeck\/flightcrew\/(schemas\/[^/]+\.json|templates\/.+|checks\/validators\/[^/]+\.mjs|checks\/gates\/[^/]+\.mjs|bin\/fc|bin\/fc\.mjs|bin\/cmd\/[^/]+\.mjs|bin\/worker\/[^/]+\.mjs)$/;

function headerEnd(rel, lines) {
  if (/\.(mjs|js)$/.test(rel) || rel === 'flightdeck/flightcrew/bin/fc') {
    let n = 0;
    while (n < lines.length && /^\s*(\/\/|#)/.test(lines[n])) n += 1;
    return n;
  }
  if (rel.endsWith('.json')) {
    const at = lines.findIndex((l) => /^\s{2}"description"\s*:/.test(l));
    return at === -1 ? 0 : at + 1;
  }
  const blank = lines.findIndex((l) => l.trim() === '');
  return blank === -1 ? lines.length : blank;
}

let outputs = null;
let prep = null;
try {
  outputs = await indexOutputs(REPO);
} catch (error) {
  prep = error;
}

await report(['C9'], [
  {
    name: 'every defect line references a stated behaviour line that exists',
    fn: () => {
      if (prep) throw prep;
      const problems = [];
      for (const d of printedDefects(outputs, specIds())) {
        const [rel, lineText] = [d.ref.slice(0, d.ref.lastIndexOf(':')), d.ref.slice(d.ref.lastIndexOf(':') + 1)];
        const line = Number(lineText);
        const where = `${d.suite} · ${d.case}`;
        const text = readText(path.join(REPO, rel));
        if (text === null) {
          problems.push(`${where}: ${rel} does not exist`);
          continue;
        }
        const lines = text.split('\n');
        if (line > lines.length) problems.push(`${where}: ${rel} has no line ${line}`);
        else if (MANUALS.has(rel)) continue;
        else if (!PART.test(rel)) problems.push(`${where}: ${rel} is neither a manual C9 names nor a schema, template, validator, gate or command`);
        else if (line > headerEnd(rel, lines)) problems.push(`${where}: ${rel}:${line} is outside the part's header`);
      }
      none(problems, 'defect references that do not resolve');
    },
  },
]);
