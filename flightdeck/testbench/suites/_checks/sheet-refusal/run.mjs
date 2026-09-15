// testbench/suites/_checks/sheet-refusal/run.mjs — T19 (B9, E3, C3): a verdict sheet with a missing quotation, an answer outside yes or no, no judging model, or a broken shape is a FAIL case of its judged check naming the sheet path or the question, and none of its answers count.
// Usage: node flightdeck/testbench/suites/_checks/sheet-refusal/run.mjs; exit 0 when every judged suite fails every broken sheet, 2 otherwise.
//
// For each suite that prints a sheet line, the first sheet.md at or under the line's path is broken four ways, each in its own
// snapshot copy, and the suite is run there. Question lines are read in the guide's form 'id · yes/no · quotation · reason'. The
// quotation variant empties the first question's quotation; the answer variant sets its answer to 'maybe'; the model variant removes
// the sheet's first line, which I3 fixes as 'judge: <model>'; the shape variant replaces the sheet with one line of prose. Each
// variant requires exit 2 and a FAIL case whose name or reason carries the sheet's path or the broken question's id. The broken sheet
// keeps every other answer as committed, so a suite that counted them would still pass; the exit 2 is the evidence that none counted.
// The suite must pass with its sheets as committed. With no judged suite the check passes empty (D3).

import fs from 'node:fs';
import path from 'node:path';
import { ensure, isDir, isFile, REPO, report, snapshotCopy, suiteOutputs } from '../lib/check-lib.mjs';
import { agentSuites } from '../lib/agent-suites.mjs';
import { readOutput } from '../lib/protocol.mjs';
import { sheetQuestions } from '../lib/scenarios.mjs';

function firstSheet(rel) {
  const abs = path.join(REPO, rel);
  if (isFile(abs)) return rel;
  if (!isDir(abs)) return null;
  const found = [];
  const visit = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) visit(p);
      else if (e.name === 'sheet.md') found.push(path.relative(REPO, p).split(path.sep).join('/'));
    }
  };
  visit(abs);
  return found.sort()[0] ?? null;
}

function variants(text, judge) {
  const lines = text.split('\n');
  const qs = sheetQuestions(text);
  const out = [];
  if (qs.length > 0) {
    const q = qs[0];
    const prefix = q.raw.slice(0, q.raw.indexOf(q.id));
    const rebuild = (fields) => { const copy = [...lines]; copy[q.index] = `${prefix}${q.id} · ${fields.join(' · ')}`; return copy.join('\n'); };
    out.push({ what: 'a missing quotation', token: q.id, text: rebuild([q.answer, '', q.reason]) });
    out.push({ what: 'an answer outside yes or no', token: q.id, text: rebuild(['maybe', q.quotation, q.reason]) });
  }
  out.push({ what: 'no judging model', token: 'path', text: /^judge: \S/.test(lines[0] ?? '') ? lines.slice(1).join('\n') : null });
  out.push({ what: 'a broken shape', token: 'path', text: 'This is not a verdict sheet.\n' });
  return { qs, out };
}

let a = null;
let prep = null;
try {
  a = await agentSuites(REPO);
} catch (error) {
  prep = error;
}

const cases = [];
if (prep) cases.push({ name: 'the suites run', fn: () => { throw prep; } });
else {
  if (a.judged.length === 0) cases.push({ name: 'no suite prints a sheet line, so no sheet is broken', fn: () => {} });
  for (const read of a.judged) {
    const suite = read.suite;
    const rel = firstSheet(read.sheet.path);
    cases.push({
      name: `judged suite ${suite} passes with its sheets as committed`,
      fn: () => ensure(a.outputs.get(suite).exit === 0, `suite ${suite} exits ${a.outputs.get(suite).exit} before any sheet is broken`),
    });
    const text = rel ? fs.readFileSync(path.join(REPO, rel), 'utf8') : null;
    const planned = text === null ? null : variants(text, read.sheet.judge);
    cases.push({
      name: `judged suite ${suite} has a sheet with question lines in the guide's form`,
      fn: () => {
        ensure(rel !== null, `no sheet.md at or under ${read.sheet.path}`);
        ensure(planned.qs.length > 0, `${rel} has no line 'Q<id> · yes/no · quotation · reason'`);
      },
    });
    for (const what of ['a missing quotation', 'an answer outside yes or no', 'no judging model', 'a broken shape']) {
      cases.push({
        name: `judged suite ${suite} fails a sheet with ${what}, naming the sheet path or the question`,
        fn: async () => {
          ensure(rel !== null && planned !== null, `no sheet.md at or under ${read.sheet.path}`);
          const v = planned.out.find((x) => x.what === what);
          ensure(v, `${rel} has no question line to break`);
          ensure(v.text !== null, `${rel} does not open with 'judge: <model>'`);
          const copy = snapshotCopy(REPO);
          try {
            fs.writeFileSync(path.join(copy.dir, rel), v.text);
            const run = (await suiteOutputs(copy.dir, { mode: 'copy', only: [suite] })).get(suite);
            const after = readOutput(run, a.ids);
            ensure(run.exit === 2, `suite ${suite} exited ${run.exit} with ${what} in ${rel}`);
            const tokens = v.token === 'path' ? [rel, read.sheet.path] : [v.token, rel, read.sheet.path];
            ensure(
              after.cases.some((c) => c.verdict === 'FAIL' && tokens.some((t) => c.name.includes(t) || String(c.reason).includes(t))),
              `no FAIL case of ${suite} names ${tokens.join(' or ')}`,
            );
          } finally {
            copy.remove();
          }
        },
      });
    }
  }
}

await report(['B9', 'E3', 'C3'], cases);
