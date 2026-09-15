// testbench/suites/_checks/lib/scenarios.mjs — reads scenario sets in the shape of spec I3, checks a rubric against the form of flightdeck/manuals/testing/rubric-guide.md, and reads the question lines of a verdict sheet.
// Usage: import { readSets, checkSet, checkTrials, checkRubric, sheetQuestions } from '../lib/scenarios.mjs'.
//
// I3: flightdeck/testbench/fixtures/scenarios/<set>/set.json = { covers: [string], tier: 'opus'|'sonnet'|'haiku',
// judge: 'opus'|'sonnet'|'haiku'|null }; rubric.md beside it for a judged set; one folder per scenario holding
// scenario.json = { trials: integer, threshold: integer, control: boolean, start: { prompt: string, files: { <path>: <content> } },
// must: [string], must_not: [string] } where every must and must_not entry is a regular expression; and per trial
// trials/<n>/ holding transcript.jsonl, events.jsonl, hooks.log, tier.txt, verdict.txt, and sheet.md for a judged set, whose first
// line is 'judge: <model>'.
// Rubric form (rubric-guide.md, Anatomy and Template): a '# Rubric:' title; 'Rubric version:' with 'Spec:'; 'Judge receives:';
// one or more blocks '## <ID> — <behaviour>' each with a 'Material:' line, two to five questions
// '- Q<id> (critical|advisory) <question>?' with at least one critical, and a 'Pass:' line; a '## Verdict sheet format' section;
// a '## Calibration record' section. Sheet question lines (rubric-guide.md, Verdict sheet format): 'id · yes/no · quotation · reason'.

import fs from 'node:fs';
import path from 'node:path';
import { isDir, isFile, readJson, readText, SCENARIOS_REL } from './check-lib.mjs';

export const TIERS = ['opus', 'sonnet', 'haiku'];
export const RECORDS = ['transcript.jsonl', 'events.jsonl', 'hooks.log', 'tier.txt', 'verdict.txt'];

function subdirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

/** Every set under the scenarios folder: [{ name, dir, rel, set (parsed or null), setError, scenarios: [{ name, dir, rel, scenario, error }] }]. */
export function readSets(root) {
  const base = path.join(root, SCENARIOS_REL);
  return subdirs(base).map((name) => {
    const dir = path.join(base, name);
    const parsed = readJson(path.join(dir, 'set.json'));
    const scenarios = subdirs(dir)
      .filter((s) => isFile(path.join(dir, s, 'scenario.json')))
      .map((s) => {
        const sp = readJson(path.join(dir, s, 'scenario.json'));
        return { name: s, dir: path.join(dir, s), rel: `${SCENARIOS_REL}/${name}/${s}`, scenario: sp.ok ? sp.value : null, error: sp.ok ? null : sp.error };
      });
    return { name, dir, rel: `${SCENARIOS_REL}/${name}`, set: parsed.ok ? parsed.value : null, setError: parsed.ok ? null : parsed.error, scenarios };
  });
}

function exactKeys(obj, keys, where, problems) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    problems.push(`${where} is not an object`);
    return false;
  }
  for (const k of keys) if (!(k in obj)) problems.push(`${where} lacks ${k}`);
  for (const k of Object.keys(obj)) if (!keys.includes(k)) problems.push(`${where} carries ${k}, which I3 does not define`);
  return true;
}

const stringArray = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Problems with one set's set.json and its scenarios' scenario.json against I3. */
export function checkSet(entry) {
  const problems = [];
  const where = `${entry.rel}/set.json`;
  if (entry.set === null) problems.push(entry.setError ?? `${where} is missing`);
  else if (exactKeys(entry.set, ['covers', 'tier', 'judge'], where, problems)) {
    if (!stringArray(entry.set.covers)) problems.push(`${where} covers is not a list of strings`);
    if (!TIERS.includes(entry.set.tier)) problems.push(`${where} tier '${entry.set.tier}' is not one of ${TIERS.join(', ')}`);
    if (!(entry.set.judge === null || TIERS.includes(entry.set.judge))) problems.push(`${where} judge '${entry.set.judge}' is not one of ${TIERS.join(', ')} or null`);
  }
  if (entry.scenarios.length === 0) problems.push(`${entry.rel} holds no scenario folder with a scenario.json`);
  for (const s of entry.scenarios) {
    const sw = `${s.rel}/scenario.json`;
    if (s.scenario === null) {
      problems.push(s.error);
      continue;
    }
    if (!exactKeys(s.scenario, ['trials', 'threshold', 'control', 'start', 'must', 'must_not'], sw, problems)) continue;
    const { trials, threshold, control, start, must, must_not: mustNot } = s.scenario;
    if (!Number.isInteger(trials) || trials < 1) problems.push(`${sw} trials is not a positive integer`);
    if (!Number.isInteger(threshold) || threshold < 1 || (Number.isInteger(trials) && threshold > trials)) problems.push(`${sw} threshold is not an integer from 1 to trials`);
    if (typeof control !== 'boolean') problems.push(`${sw} control is not a boolean`);
    if (exactKeys(start, ['prompt', 'files'], `${sw} start`, problems)) {
      if (typeof start.prompt !== 'string') problems.push(`${sw} start.prompt is not a string`);
      if (!start.files || typeof start.files !== 'object' || Array.isArray(start.files) || !Object.values(start.files).every((v) => typeof v === 'string')) {
        problems.push(`${sw} start.files is not an object of path to content`);
      }
    }
    for (const [key, list] of [['must', must], ['must_not', mustNot]]) {
      if (!stringArray(list)) {
        problems.push(`${sw} ${key} is not a list of strings`);
        continue;
      }
      for (const pattern of list) {
        try {
          new RegExp(pattern);
        } catch (error) {
          problems.push(`${sw} ${key} entry '${pattern}' is not a regular expression: ${error.message}`);
        }
      }
    }
  }
  return problems;
}

/** The model family a tier file names: 'opus', 'sonnet' or 'haiku' when exactly one appears and fable does not; else null. */
export function tierFamily(text) {
  const t = String(text ?? '').toLowerCase();
  if (/fable/.test(t)) return null;
  const found = TIERS.filter((tier) => new RegExp(`(^|[^a-z])${tier}([^a-z]|$)`).test(t));
  return found.length === 1 ? found[0] : null;
}

/** Problems with the trial records of every scenario of a set against I3 and B7. */
export function checkTrials(entry) {
  const problems = [];
  const judged = entry.set && entry.set.judge !== null && entry.set.judge !== undefined;
  for (const s of entry.scenarios) {
    if (!s.scenario || !Number.isInteger(s.scenario.trials)) continue;
    const trialsDir = path.join(s.dir, 'trials');
    const found = subdirs(trialsDir);
    const want = Array.from({ length: s.scenario.trials }, (_, i) => String(i + 1));
    const missing = want.filter((n) => !found.includes(n));
    const extra = found.filter((n) => !want.includes(n));
    if (missing.length > 0) problems.push(`${s.rel}/trials lacks trial folders ${missing.join(', ')} of the declared ${s.scenario.trials}`);
    if (extra.length > 0) problems.push(`${s.rel}/trials holds folders ${extra.join(', ')} beyond the declared ${s.scenario.trials}`);
    for (const n of found.filter((x) => want.includes(x))) {
      const tdir = path.join(trialsDir, n);
      const trel = `${s.rel}/trials/${n}`;
      const need = judged ? [...RECORDS, 'sheet.md'] : RECORDS;
      for (const f of need) if (!isFile(path.join(tdir, f))) problems.push(`${trel} lacks ${f}`);
      const tier = readText(path.join(tdir, 'tier.txt'));
      if (tier !== null) {
        const family = tierFamily(tier);
        if (family === null) problems.push(`${trel}/tier.txt names no model at or below opus: '${tier.trim()}'`);
        else if (entry.set && family !== entry.set.tier) problems.push(`${trel}/tier.txt names ${family} where the set declares ${entry.set.tier}`);
      }
      const sheet = judged ? readText(path.join(tdir, 'sheet.md')) : null;
      if (sheet !== null) {
        const first = sheet.split('\n')[0];
        const m = /^judge: (\S.*)$/.exec(first);
        if (!m) problems.push(`${trel}/sheet.md does not open with 'judge: <model>'`);
        else if (tierFamily(m[1]) === null) problems.push(`${trel}/sheet.md names no judge at or below opus: '${m[1].trim()}'`);
        else if (tierFamily(m[1]) !== entry.set.judge) problems.push(`${trel}/sheet.md names judge ${tierFamily(m[1])} where the set declares ${entry.set.judge}`);
      }
      const verdict = readText(path.join(tdir, 'verdict.txt'));
      if (verdict !== null && !/^(pass|fail|inconclusive)\b[\s:—-]+\S/.test(verdict.trim())) {
        problems.push(`${trel}/verdict.txt does not open with pass, fail or inconclusive and a reason`);
      }
    }
  }
  return problems;
}

/** Problems with a rubric's text against the guide's form. */
export function checkRubric(text, where) {
  const problems = [];
  if (text === null) return [`${where} is missing`];
  const lines = text.split('\n');
  if (!lines.some((l) => /^# Rubric: \S/.test(l))) problems.push(`${where} has no '# Rubric: <name>' title`);
  if (!lines.some((l) => /^Rubric version: *\S.*\bSpec: *\S/.test(l))) problems.push(`${where} has no 'Rubric version: <n>  Spec: <path> @ <commit>' line`);
  if (!lines.some((l) => /^Judge receives: *\S/.test(l))) problems.push(`${where} has no 'Judge receives:' line`);
  const sectionAt = (title) => lines.findIndex((l) => l.trim() === `## ${title}`);
  if (sectionAt('Verdict sheet format') === -1) problems.push(`${where} has no '## Verdict sheet format' section`);
  if (sectionAt('Calibration record') === -1) problems.push(`${where} has no '## Calibration record' section`);
  const blocks = [];
  let current = null;
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (/^## /.test(l)) {
      current = null;
      const m = /^## ([A-Z]+[0-9]+) — \S/.exec(l);
      if (m) {
        current = { id: m[1], line: i + 1, material: false, questions: [], critical: 0, pass: false };
        blocks.push(current);
      }
      continue;
    }
    if (!current) continue;
    if (/^Material: *\S/.test(l)) current.material = true;
    const q = /^- (Q[0-9A-Za-z.]+) \((critical|advisory)\) \S.*\?/.exec(l);
    if (q) {
      current.questions.push(q[1]);
      if (q[2] === 'critical') current.critical += 1;
    } else if (/^- Q/.test(l)) problems.push(`${where}:${i + 1} question line not in the form '- Q<id> (critical|advisory) <question>?'`);
    if (/^\s*Pass: *\S/.test(l)) current.pass = true;
  }
  if (blocks.length === 0) problems.push(`${where} has no question block '## <ID> — <behaviour>'`);
  for (const b of blocks) {
    const at = `${where}:${b.line} block ${b.id}`;
    if (!b.material) problems.push(`${at} has no 'Material:' line`);
    if (b.questions.length < 2 || b.questions.length > 5) problems.push(`${at} has ${b.questions.length} questions where the guide asks for two to five`);
    if (b.critical === 0) problems.push(`${at} has no critical question`);
    if (!b.pass) problems.push(`${at} has no 'Pass:' rule`);
  }
  return problems;
}

/** The question lines of a sheet: [{ index, id, answer, quotation, reason, raw }]. */
export function sheetQuestions(text) {
  const out = [];
  const lines = String(text ?? '').split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const m = /^\s*(?:[-*]\s+)?(Q[0-9A-Za-z.]+)\s*·(.*)$/.exec(lines[i]);
    if (!m) continue;
    const fields = m[2].split('·').map((f) => f.trim());
    out.push({ index: i, id: m[1], answer: fields[0] ?? '', quotation: fields[1] ?? '', reason: fields.slice(2).join(' · '), fields, raw: lines[i] });
  }
  return out;
}

export { isDir };
