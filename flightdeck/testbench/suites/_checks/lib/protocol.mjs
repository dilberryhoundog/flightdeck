// testbench/suites/_checks/lib/protocol.mjs — reads one suite's output against the suite output protocol of spec I2 and returns its cases, defect pairs, covers, ratio and sheet lines, and every departure by line number.
// Usage: import { readOutput } from '../lib/protocol.mjs'; const r = readOutput({ suite, stdout, exit }, specIds); r.errors is a list of '<suite>: line <n>: <what>'.
//
// The protocol, in order: case lines 'pass  <case>' or 'FAIL  <case>: <reason>', where a case named '<case> [defect]' is
// immediately preceded by 'defect: <text> (<path>:<line>)' and every such defect line is immediately followed by a marked case;
// one 'covers: <ids>' line of this spec's ids separated by single spaces; zero or more
// 'ratio: <scenario> <passes>/<N> inconclusive <n> threshold <k>/<N> tier <model>' lines; at most one 'sheet: <path> judge <model>'
// line; a final '<n>/<m> passed' line counting the pass lines and the case lines. Exit 0 when every case passes, 2 otherwise.
// A ratio below its threshold must be accompanied by a FAIL case naming its scenario. No other stdout line is allowed.

const PASS = /^pass {2}(\S(?:.*\S)?)$/;
const FAIL = /^FAIL {2}(\S.*?): (\S.*)$/;
const DEFECT = /^defect: (\S.*?) \(([^\s()]+):([1-9]\d*)\)$/;
const COVERS = /^covers: (\S+(?: \S+)*)$/;
const RATIO = /^ratio: (\S+) (\d+)\/(\d+) inconclusive (\d+) threshold (\d+)\/(\d+) tier (\S+)$/;
const SHEET = /^sheet: (\S+) judge (\S+)$/;
const COUNT = /^(\d+)\/(\d+) passed$/;
export const DEFECT_MARK = ' [defect]';

/** A case name without its defect mark. */
export function bareName(name) {
  return name.endsWith(DEFECT_MARK) ? name.slice(0, -DEFECT_MARK.length) : name;
}

/**
 * Reads one suite run. `run` is { suite, stdout, exit }; `ids` is the set of this spec's node ids. Returns
 * { suite, cases: [{ verdict, name, bare, reason, line, defect }], defects: [{ text, path, line, case, bare }], covers, ratios,
 * sheet, count, errors }.
 */
export function readOutput(run, ids) {
  const suite = run.suite;
  const errors = [];
  const err = (n, what) => errors.push(`${suite}: line ${n}: ${what}`);
  const lines = String(run.stdout ?? '').split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  const cases = [];
  const defects = [];
  const ratios = [];
  let covers = null;
  let sheet = null;
  let count = null;
  let stage = 'cases';
  let pendingDefect = null;

  for (let i = 0; i < lines.length; i += 1) {
    const n = i + 1;
    const line = lines[i];
    if (count !== null) {
      err(n, `a line after the final count line: '${line}'`);
      continue;
    }
    let m;
    if ((m = DEFECT.exec(line))) {
      if (stage !== 'cases') err(n, 'a defect line after the covers line');
      if (pendingDefect) err(pendingDefect.lineNo, 'a defect line not followed by a case marked [defect]');
      pendingDefect = { text: m[1], path: m[2], line: Number(m[3]), lineNo: n };
      continue;
    }
    if (line.startsWith('defect:')) {
      err(n, `a malformed defect line (expected 'defect: <text> (<path>:<line>)'): '${line}'`);
      continue;
    }
    const pm = PASS.exec(line);
    const fm = pm ? null : FAIL.exec(line);
    if (pm || fm) {
      if (stage !== 'cases') err(n, 'a case line after the covers line');
      const name = pm ? pm[1] : fm[1];
      const entry = { verdict: pm ? 'pass' : 'FAIL', name, bare: bareName(name), reason: fm ? fm[2] : null, line: n, defect: name.endsWith(DEFECT_MARK) };
      if (entry.defect && entry.bare.trim() === '') err(n, 'a defect case with an empty name');
      if (entry.defect) {
        if (!pendingDefect) err(n, `case '${name}' is marked [defect] and is not preceded by a defect line`);
        else defects.push({ text: pendingDefect.text, path: pendingDefect.path, line: pendingDefect.line, case: name, bare: entry.bare, lineNo: pendingDefect.lineNo });
      } else if (pendingDefect) {
        err(pendingDefect.lineNo, `a defect line followed by case '${name}', which is not marked [defect]`);
      }
      pendingDefect = null;
      cases.push(entry);
      continue;
    }
    if (pendingDefect) {
      err(pendingDefect.lineNo, 'a defect line not followed by a case marked [defect]');
      pendingDefect = null;
    }
    if (/^(pass|FAIL)\b/.test(line)) {
      err(n, `a malformed case line (expected 'pass  <case>' or 'FAIL  <case>: <reason>'): '${line}'`);
      continue;
    }
    if ((m = COVERS.exec(line))) {
      if (covers !== null) err(n, 'a second covers line');
      else if (stage !== 'cases') err(n, 'the covers line out of order');
      const listed = m[1].split(' ');
      const unknown = listed.filter((id) => !ids.has(id));
      if (unknown.length > 0) err(n, `covers names ids this spec does not carry: ${unknown.join(' ')}`);
      covers = listed;
      stage = 'ratios';
      continue;
    }
    if (line.startsWith('covers:')) {
      err(n, `a malformed covers line (expected 'covers: <ids>' separated by single spaces): '${line}'`);
      continue;
    }
    if ((m = RATIO.exec(line))) {
      if (stage !== 'ratios') err(n, stage === 'cases' ? 'a ratio line before the covers line' : 'a ratio line after the sheet line');
      const r = { scenario: m[1], passes: Number(m[2]), trials: Number(m[3]), inconclusive: Number(m[4]), threshold: Number(m[5]), thresholdOf: Number(m[6]), tier: m[7], line: n };
      if (r.trials < 1) err(n, 'a ratio line with no declared trials');
      if (r.thresholdOf !== r.trials) err(n, `the threshold's N (${r.thresholdOf}) differs from the declared trials (${r.trials})`);
      if (r.threshold > r.trials) err(n, 'a threshold above the declared trials');
      if (r.passes + r.inconclusive > r.trials) err(n, 'passes and inconclusive trials together exceed the declared trials');
      ratios.push(r);
      continue;
    }
    if (line.startsWith('ratio:')) {
      err(n, `a malformed ratio line: '${line}'`);
      continue;
    }
    if ((m = SHEET.exec(line))) {
      if (sheet !== null) err(n, 'a second sheet line');
      else if (stage === 'cases') err(n, 'a sheet line before the covers line');
      sheet = { path: m[1], judge: m[2], line: n };
      stage = 'sheet';
      continue;
    }
    if (line.startsWith('sheet:')) {
      err(n, `a malformed sheet line: '${line}'`);
      continue;
    }
    if ((m = COUNT.exec(line))) {
      count = { passed: Number(m[1]), total: Number(m[2]), line: n };
      if (covers === null) err(n, 'the final count line with no covers line before it');
      continue;
    }
    err(n, `a line the protocol does not allow: '${line}'`);
  }
  if (pendingDefect) err(pendingDefect.lineNo, 'a defect line not followed by a case marked [defect]');
  const last = lines.length;
  if (covers === null && count !== null) {
    // already reported at the count line
  } else if (covers === null) err(last + 1, 'no covers line');
  if (count === null) err(last + 1, "no final '<n>/<m> passed' line");
  const passes = cases.filter((c) => c.verdict === 'pass').length;
  if (count !== null) {
    if (count.passed !== passes) err(count.line, `the count says ${count.passed} passed and ${passes} pass lines were printed`);
    if (count.total !== cases.length) err(count.line, `the count says ${count.total} cases and ${cases.length} case lines were printed`);
  }
  const allPass = cases.every((c) => c.verdict === 'pass');
  const wantExit = allPass ? 0 : 2;
  if (run.exit !== wantExit) err(last, `exit ${run.exit === null ? 'none (killed)' : run.exit} where the cases call for exit ${wantExit}`);
  for (const r of ratios) {
    if (r.passes < r.threshold) {
      const named = cases.some((c) => c.verdict === 'FAIL' && (c.name.includes(r.scenario) || String(c.reason).includes(r.scenario)));
      if (!named) err(r.line, `ratio for '${r.scenario}' is below its threshold and no FAIL case names the scenario`);
    }
  }
  return { suite, cases, defects, covers, ratios, sheet, count, errors };
}

/** Every case name printed across a map of suite outputs, as bare names, mapped to the suites and verdicts that printed them. */
export function caseIndex(outputs, ids) {
  const index = new Map();
  const reads = new Map();
  for (const [suite, run] of outputs) {
    const read = readOutput(run, ids);
    reads.set(suite, read);
    for (const c of read.cases) {
      if (!index.has(c.bare)) index.set(c.bare, []);
      index.get(c.bare).push({ suite, verdict: c.verdict, name: c.name });
    }
  }
  return { index, reads };
}
