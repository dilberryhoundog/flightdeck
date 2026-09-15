// testbench/suites/_checks/lib/rules.mjs — the rule checkers over suite outputs and the tests map: defect markers (B10, E7), the defects file (B11, E10, I4), continuity of the earlier suites' case names (B12, E6), and kind and class on every map check (B5, E9).
// Usage: import { defectProblems, defectsFileProblems, continuityProblems, mapClassProblems } from '../lib/rules.mjs'.
//
// Defects file (I4): defects.md in the run's evidence folder, flightdeck/launch/<L>/evidence/defects.md for the launch whose
// launch.json names this spec; one line per defect '<suite> · <case> · <defect text> · <reference>'; blank lines and lines
// starting with '#' are not defect lines. The case may be written with or without its ' [defect]' mark; the reference is the
// '<path>:<line>' of the defect line, with or without its parentheses.
// Continuity (B12): the committed golden fixtures/earlier-cases.txt holds '<suite> · <case>' for every case the thirty earlier
// suites printed at the spec's commit. Each is found when its case name is printed by some suite now, or when the mapping file
// flightdeck/testbench/case-map.json, committed and unmodified, maps '<suite> · <case>' to '<new suite> · <new case>' and that
// new suite prints that case.

import path from 'node:path';
import fs from 'node:fs';
import { readOutput, bareName } from './protocol.mjs';
import { git, gitRun, isFile, readJson, readText, SPEC_NAME } from './check-lib.mjs';

export const SEP = ' · ';
export const MAPPING_REL = 'flightdeck/testbench/case-map.json';
export const KINDS = ['structural', 'behavioural', 'artefact', 'invariant', 'project-rule', 'statistical', 'judged'];
export const CLASSES = ['deterministic', 'property', 'statistical', 'judged'];

// ── defect markers ───────────────────────────────────────────────────────────
/** Problems with defect markers across suite outputs: a marked case that fails, and pairing faults the protocol reader reports. */
export function defectProblems(outputs, ids) {
  const problems = [];
  for (const [suite, run] of outputs) {
    const read = readOutput(run, ids);
    for (const e of read.errors) if (/defect/.test(e)) problems.push(e);
    for (const c of read.cases) {
      if (c.defect && c.verdict !== 'pass') problems.push(`${suite} · ${c.name}: a case marked [defect] fails on the current behaviour`);
    }
  }
  return problems;
}

/** Every defect the suites print: [{ suite, case, bare, text, ref }]. */
export function printedDefects(outputs, ids) {
  const list = [];
  for (const [suite, run] of outputs) {
    for (const d of readOutput(run, ids).defects) list.push({ suite, case: d.case, bare: d.bare, text: d.text, ref: `${d.path}:${d.line}` });
  }
  return list;
}

// ── the defects file ─────────────────────────────────────────────────────────
/** The launch folders under flightdeck/launch/ whose launch.json names this spec, by spec.name or by name. */
export function specLaunches(root) {
  const base = path.join(root, 'flightdeck/launch');
  let names = [];
  try {
    names = fs.readdirSync(base, { withFileTypes: true }).filter((e) => e.isDirectory() && e.name !== 'specs').map((e) => e.name);
  } catch {
    return [];
  }
  return names.filter((n) => {
    const parsed = readJson(path.join(base, n, 'launch.json'));
    return parsed.ok && (parsed.value?.spec?.name === SPEC_NAME || parsed.value?.name === SPEC_NAME);
  }).sort();
}

/** The defects file's repository-relative path, or throws naming why none or several were found. */
export function locateDefectsFile(root) {
  const found = specLaunches(root)
    .map((l) => `flightdeck/launch/${l}/evidence/defects.md`)
    .filter((rel) => isFile(path.join(root, rel)));
  if (found.length === 0) throw new Error(`no evidence/defects.md in any launch folder whose launch.json names ${SPEC_NAME}`);
  if (found.length > 1) throw new Error(`more than one defects file: ${found.join(', ')}`);
  return found[0];
}

/** The defect lines of a defects file's text: { entries: [{ suite, bare, text, ref, line }], problems }. */
export function readDefectsFile(text, where) {
  const entries = [];
  const problems = [];
  String(text ?? '').split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.trim() === '' || line.trimStart().startsWith('#')) return;
    const fields = line.split(SEP);
    if (fields.length !== 4 || fields.some((f) => f.trim() === '')) {
      problems.push(`${where}:${i + 1} is not '<suite> · <case> · <defect text> · <reference>'`);
      return;
    }
    const ref = fields[3].trim().replace(/^\((.*)\)$/, '$1');
    if (!/^[^\s()]+:[1-9]\d*$/.test(ref)) problems.push(`${where}:${i + 1} reference '${fields[3].trim()}' is not '<path>:<line>'`);
    entries.push({ suite: fields[0].trim(), bare: bareName(fields[1].trim()), text: fields[2].trim(), ref, line: i + 1 });
  });
  return { entries, problems };
}

const defectKey = (d) => [d.suite, d.bare, d.text, d.ref].join('\0');

/** Problems comparing the printed defects with a defects file's entries, both ways. */
export function defectsFileProblems(printed, fileText, where) {
  const { entries, problems } = readDefectsFile(fileText, where);
  const inFile = new Map();
  for (const e of entries) {
    const k = defectKey(e);
    if (inFile.has(k)) problems.push(`${where}:${e.line} repeats the defect at line ${inFile.get(k).line}`);
    else inFile.set(k, e);
  }
  const printedKeys = new Set(printed.map(defectKey));
  for (const d of printed) {
    if (!inFile.has(defectKey(d))) problems.push(`${where} does not carry the defect of suite ${d.suite} case ${d.case}`);
  }
  for (const e of entries) {
    if (!printedKeys.has(defectKey(e))) problems.push(`${where}:${e.line} carries a defect no suite prints (suite ${e.suite} case ${e.bare})`);
  }
  return problems;
}

// ── continuity ───────────────────────────────────────────────────────────────
/** The golden's entries: [{ suite, name }]. */
export function readEarlierCases(text) {
  return String(text ?? '')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'))
    .map((l) => {
      const at = l.indexOf(SEP);
      return { suite: l.slice(0, at), name: l.slice(at + SEP.length) };
    });
}

/**
 * Problems with continuity. `earlier` is the golden's entries; `printed` is a Map suite → Set of bare case names now printed;
 * `mapping` is the parsed mapping object or null.
 */
export function continuityProblems(earlier, printed, mapping) {
  const problems = [];
  const everywhere = new Set();
  for (const names of printed.values()) for (const n of names) everywhere.add(n);
  for (const e of earlier) {
    const bare = bareName(e.name);
    if (everywhere.has(bare)) continue;
    const key = `${e.suite}${SEP}${e.name}`;
    const target = mapping && typeof mapping === 'object' ? mapping[key] : undefined;
    if (typeof target !== 'string') {
      problems.push(`earlier case '${e.name}' of suite ${e.suite} appears neither in the new suite nor in the mapping file`);
      continue;
    }
    const at = target.indexOf(SEP);
    const toSuite = at === -1 ? '' : target.slice(0, at);
    const toCase = at === -1 ? '' : bareName(target.slice(at + SEP.length));
    if (!printed.get(toSuite)?.has(toCase)) {
      problems.push(`earlier case '${e.name}' of suite ${e.suite} is mapped to '${target}', which no suite prints`);
    }
  }
  return problems;
}

/** The mapping file of the tree: { mapping, problems }; an absent file is no mapping and no problem. */
export function readMapping(root) {
  const file = path.join(root, MAPPING_REL);
  if (!isFile(file)) return { mapping: null, problems: [] };
  const problems = [];
  const parsed = readJson(file);
  if (!parsed.ok) return { mapping: null, problems: [parsed.error] };
  const doc = parsed.value;
  if (!doc || typeof doc !== 'object' || Array.isArray(doc) || !Object.values(doc).every((v) => typeof v === 'string')) {
    problems.push(`${MAPPING_REL} is not an object of '<suite> · <case>' to '<suite> · <case>'`);
  }
  const tracked = gitRun(root, ['ls-files', '--error-unmatch', MAPPING_REL]).status === 0;
  const clean = tracked && gitRun(root, ['diff', '--quiet', 'HEAD', '--', MAPPING_REL]).status === 0;
  if (!tracked || !clean) problems.push(`${MAPPING_REL} is not committed as it stands`);
  return { mapping: doc, problems };
}

// ── the tests map ────────────────────────────────────────────────────────────
/** Problems with a tests map document: every check carries a kind of the seven and a class of the four, named by check id. */
export function mapClassProblems(doc, where) {
  const problems = [];
  if (!doc || !Array.isArray(doc.checks)) return [`${where} carries no checks list`];
  doc.checks.forEach((c, i) => {
    const id = typeof c?.id === 'string' ? c.id : `checks[${i}]`;
    if (!KINDS.includes(c?.kind)) problems.push(`${where}: check ${id} carries no kind of the seven (${c?.kind === undefined ? 'none' : `'${c.kind}'`})`);
    if (!CLASSES.includes(c?.class)) problems.push(`${where}: check ${id} carries no class of the four (${c?.class === undefined ? 'none' : `'${c.class}'`})`);
  });
  return problems;
}

export { git, readText };
