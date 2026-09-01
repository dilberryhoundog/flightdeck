#!/usr/bin/env node
/**
 * validate-spec.mjs — validates a spec instance against spec.schema.json
 * plus the cross-reference invariants a schema cannot express.
 *
 * Usage:
 *   node validate-spec.mjs <spec file> [--schema <file>] [--for-freeze]
 *
 *   --for-freeze   apply the frozen gates even if status is still draft:
 *                  use in the freeze step to answer "could this freeze now?"
 *
 * Coded invariants (numbered as in the schema's description):
 *   1  all node ids unique across every section
 *   2  ids carry their section prefix (enforced by schema patterns; re-checked
 *      here across sections so a B-id in edges is caught)
 *   3  frozen ⇒ commit present and open_questions empty
 *   4  draft ⇒ commit absent
 *   5  no live node reuses a retired id
 *   6  previous_versions ascending, all lower than version, files distinct
 *
 * Invariant 7 in the schema's description is a judgement call and is emitted as
 * a warning, never an error. The remaining coded invariants come from
 * spec-versioning.md, which the schema description does not enumerate:
 *   8  in v1 every node is ok; v1 carries no retired entries
 *   9  a node whose status is not ok carries a note
 *  10  the filename's v-number matches the version field
 *  11  each retired entry's `at` is between 2 and version
 *  12  previous_versions covers every earlier version, 1..version-1
 *  13  live ids and retired ids together form an unbroken 1..N per prefix, so
 *      no id ever used vanishes from the page (Q ids excluded)
 *
 * Warnings (judgement flags for the attack session, never fatal):
 *   - an edge whose text contains no outcome-ish phrasing  (invariant 7)
 *   - name not matching the parent folder, when detectable
 *   - a filename that is not recognisably spec.v<n>.json
 *
 * Exit codes: 0 valid · 1 usage · 2 invalid.
 */

import { readFileSync } from "node:fs";
import { dirname, basename, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate, report } from "./schema-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: validate-spec.mjs <spec file> [--schema <f>] [--for-freeze]"); process.exit(1); }
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const forFreeze = args.includes("--for-freeze");

const schema = JSON.parse(readFileSync(opt("--schema", resolve(here, "spec.schema.json")), "utf8"));
const spec = JSON.parse(readFileSync(file, "utf8"));

const errors = validate(schema, spec);
const warnings = [];

// Collect nodes: [id, sectionName, node]
const sections = [
  ["intent", [spec.intent]], ["scope", spec.scope], ["constraints", spec.constraints],
  ["interfaces", spec.interfaces], ["behaviours", spec.behaviours], ["edges", spec.edges],
  ["decisions", spec.decisions], ["verification", [spec.verification]], ["acceptance", [spec.acceptance]],
  ["open_questions", spec.open_questions],
];
const nodes = [];
for (const [name, arr] of sections)
  for (const n of arr ?? []) if (n && typeof n === "object") nodes.push([n.id, name, n]);

// 1 — unique ids everywhere
const seen = new Map();
for (const [id, section] of nodes) {
  if (id == null) continue;
  if (seen.has(id)) errors.push({ path: `${section}`, rule: "invariant-1", message: `duplicate id "${id}" (also in ${seen.get(id)})` });
  else seen.set(id, section);
}

// 2 — prefix belongs to section (cross-section misplacement)
const prefixOf = { scope: /^SC\d+$/, constraints: /^C\d+$/, interfaces: /^I\d+$/, behaviours: /^B\d+$/, edges: /^E\d+$/, decisions: /^D\d+$/, open_questions: /^Q\d+$/ };
for (const [id, section] of nodes) {
  const re = prefixOf[section];
  if (re && id != null && !re.test(id))
    errors.push({ path: section, rule: "invariant-2", message: `id "${id}" does not belong in ${section}` });
}

// 3 / 4 — freeze gates
const frozenGates = spec.status === "frozen" || forFreeze;
if (frozenGates) {
  if (!spec.commit && spec.status === "frozen")
    errors.push({ path: "$.commit", rule: "invariant-3", message: "frozen spec has no commit" });
  if ((spec.open_questions ?? []).length > 0)
    errors.push({ path: "$.open_questions", rule: "invariant-3", message: `${spec.open_questions.length} open question(s); a question left open is a decision delegated to whichever agent hits it first` });
}
if (spec.status === "draft" && spec.commit)
  errors.push({ path: "$.commit", rule: "invariant-4", message: "draft spec carries a commit; commit is written at freeze" });

// 5 — retired ids never come back
const retired = new Set((spec.retired ?? []).map((r) => r.id));
for (const [id, section] of nodes)
  if (retired.has(id))
    errors.push({ path: section, rule: "invariant-5", message: `id "${id}" is retired and may not be reused` });

// 13 — every id ever used stays on the page: live ids and retired ids together
//      form an unbroken 1..N in each prefix. Q ids are excluded; an answered
//      question is not a retired node.
const idPrefixSection = { SC: "scope", C: "constraints", I: "interfaces", B: "behaviours", E: "edges", D: "decisions" };
const idBuckets = new Map();
const bucketId = (id) => {
  const m = /^([A-Z]+)(\d+)$/.exec(id ?? "");
  if (!m || !(m[1] in idPrefixSection)) return;
  if (!idBuckets.has(m[1])) idBuckets.set(m[1], new Set());
  idBuckets.get(m[1]).add(Number(m[2]));
};
for (const [id] of nodes) bucketId(id);
for (const r of spec.retired ?? []) bucketId(r.id);
for (const [pfx, nums] of idBuckets) {
  const highest = Math.max(...nums);
  const missing = [];
  for (let i = 1; i <= highest; i++) if (!nums.has(i)) missing.push(`${pfx}${i}`);
  if (missing.length)
    errors.push({
      path: idPrefixSection[pfx],
      rule: "invariant-13",
      message: `${missing.join(", ")} absent from both the array and the retired registry; every id ever used stays on the page, live or retired`,
    });
}

// 6 — previous_versions chain
const prev = spec.previous_versions ?? [];
let lastV = 0;
const files = new Set();
for (const [i, p] of prev.entries()) {
  if (p.v <= lastV) errors.push({ path: `$.previous_versions[${i}]`, rule: "invariant-6", message: `v ${p.v} not ascending` });
  if (p.v >= spec.version) errors.push({ path: `$.previous_versions[${i}]`, rule: "invariant-6", message: `v ${p.v} is not lower than version ${spec.version}` });
  if (files.has(p.file)) errors.push({ path: `$.previous_versions[${i}]`, rule: "invariant-6", message: `duplicate file "${p.file}"` });
  files.add(p.file); lastV = p.v;
}

// 8 — v1 is a baseline: nothing is new or changed relative to nothing
if (spec.version === 1) {
  for (const [id, section, n] of nodes)
    if (n.status != null && n.status !== "ok")
      errors.push({ path: `${section}.${id}`, rule: "invariant-8", message: `status "${n.status}" in v1; every node in a first version is ok` });
  if ((spec.retired ?? []).length > 0)
    errors.push({ path: "$.retired", rule: "invariant-8", message: "v1 carries retired entries; nothing can have been removed yet" });
}

// 9 — a status that is not ok owes a reason
for (const [id, section, n] of nodes)
  if (n.status != null && n.status !== "ok" && !n.note)
    errors.push({ path: `${section}.${id}`, rule: "invariant-9", message: `status "${n.status}" with no note; the note is what tells a later agent why` });

// 10 — filename agrees with the version field
const fname = basename(resolve(file));
const vInName = /spec\.v(\d+)\.json$/.exec(fname);
if (vInName) {
  // Only when the schema accepted version; otherwise the type error says it already.
  if (Number.isInteger(spec.version) && Number(vInName[1]) !== spec.version)
    errors.push({ path: "$.version", rule: "invariant-10", message: `file is ${fname} but version is ${spec.version}` });
} else {
  warnings.push({ path: "$.version", message: `filename "${fname}" is not spec.v<n>.json; version could not be cross-checked` });
}

// 11 — a retired entry names the version that removed it
for (const [i, r] of (spec.retired ?? []).entries()) {
  if (r.at > spec.version)
    errors.push({ path: `$.retired[${i}]`, rule: "invariant-11", message: `at ${r.at} is later than version ${spec.version}` });
  if (r.at < 2)
    errors.push({ path: `$.retired[${i}]`, rule: "invariant-11", message: `at ${r.at} is not a version in which a node could be removed` });
}

// 12 — the lineage has no holes
if (prev.length > 0 || spec.version > 1) {
  const have = new Set(prev.map((p) => p.v));
  for (let v = 1; v < spec.version; v++)
    if (!have.has(v))
      errors.push({ path: "$.previous_versions", rule: "invariant-12", message: `no entry for v${v}; the lineage must cover 1..${spec.version - 1}` });
}

// Warnings — judgement flags
// An edge earns its place by naming what happens, not just what worries us.
// Two ways to show that: an outcome verb anywhere, or the "condition: outcome"
// form these specs are written in, where the clause after the colon is the
// outcome. A bare noun phrase satisfies neither and is what this flags.
const outcomeVerb = /\b(reject|return|render|redirect|rais|writ|creat|placeholder|warn|error|succeed|fail|exit|respond|display|ignor|skip|retr|stop|end|wait|proceed|record|note|report|surface|present|exclud|withh|append|ask|say|said|nam|block|found|split|invent)/i;
const statesOutcome = (t) => outcomeVerb.test(t) || /:\s*\S+(\s+\S+){2,}/.test(t);
for (const e of spec.edges ?? [])
  if (e.text && !statesOutcome(e.text))
    warnings.push({ path: `edges.${e.id}`, message: `text may state a concern rather than an outcome: "${e.text.slice(0, 60)}…"` });
const folder = basename(dirname(resolve(file)));
if (spec.name && folder !== spec.name && folder !== ".")
  warnings.push({ path: "$.name", message: `name "${spec.name}" does not match folder "${folder}"` });

process.exit(report(`spec ${spec.name ?? file} v${spec.version ?? "?"}`, errors, warnings));
