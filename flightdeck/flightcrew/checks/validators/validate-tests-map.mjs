#!/usr/bin/env node
/**
 * validate-tests-map.mjs — validates a tests map against tests-map.schema.json
 * plus the cross-reference invariants, resolving against the spec it names.
 * Run by the test-writing session before freeze, by the plan gate, and by the
 * freeze step with --for-freeze.
 *
 * Usage:
 *   node validate-tests-map.mjs <tests-map file> [--schema <f>] [--spec <f>]
 *                               [--for-freeze]
 *
 *   --spec        override; default is spec.v<map.spec.version>.json beside the map
 *   --for-freeze  apply frozen gates while status is still draft
 *
 * Invariants are numbered as in the schema's description. Warnings never
 * fail the run: uncovered constraints/interfaces, locked-path gaps for the
 * map file itself, and baseline expectations that look inverted.
 *
 * Exit codes: 0 valid · 1 usage · 2 invalid.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validate, report } from "./schema-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: validate-tests-map.mjs <tests-map file> [options]"); process.exit(1); }
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const forFreeze = args.includes("--for-freeze");

const schema = JSON.parse(readFileSync(opt("--schema", resolve(here, "tests-map.schema.json")), "utf8"));
const map = JSON.parse(readFileSync(file, "utf8"));

const errors = validate(schema, map);
const warnings = [];
const push = (rule, message, path = "$") => errors.push({ path, rule, message });
if (schema.version == null) warnings.push({ path: "schema", message: "schema file carries no version; add one" });
else if (Number(map.schema_version) !== Number(schema.version))
  push("schema-version", `instance declares schema_version ${map.schema_version}, schema file is v${schema.version}; refusing to judge by mismatched rules`, "$.schema_version");

// Resolve the spec
const specPath = opt("--spec", join(dirname(resolve(file)), `spec.v${map.spec?.version}.json`));
let spec = null;
if (specPath && existsSync(specPath)) {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
  if (spec.status !== "frozen") push("invariant-3", `spec status is "${spec.status}", not frozen`, "$.spec");
  if (spec.name !== map.spec?.name) push("invariant-3", `map names spec "${map.spec?.name}", file is "${spec.name}"`, "$.spec.name");
  if (Number(spec.version) !== Number(map.spec?.version)) push("invariant-3", `map is for spec v${map.spec?.version}, file is v${spec.version}`, "$.spec.version");
  if (spec.commit && map.spec?.commit && spec.commit !== map.spec.commit)
    push("invariant-3", `map records spec commit ${map.spec.commit}, spec file froze at ${spec.commit}`, "$.spec.commit");
  if (map.name && spec.name && map.name !== spec.name) push("invariant-3", `map name "${map.name}" does not match spec name "${spec.name}"`, "$.name");
} else {
  push("invariant-3", `spec not found: ${specPath}`, "$.spec");
}

const checks = map.checks ?? [];
const retired = map.retired ?? [];
const unverified = map.unverified ?? [];

// 1 — unique ids, no resurrection
const seen = new Set();
for (const c of checks) {
  if (seen.has(c.id)) push("invariant-1", `duplicate check id ${c.id}`, `checks.${c.id}`);
  seen.add(c.id);
}
const retiredIds = new Set(retired.map((r) => r.id));
for (const c of checks)
  if (retiredIds.has(c.id)) push("invariant-1", `check id ${c.id} is retired and may not be reused`, `checks.${c.id}`);

// 2 — acceptance points at a real acceptance check
const byId = new Map(checks.map((c) => [c.id, c]));
if (map.acceptance) {
  const acc = byId.get(map.acceptance);
  if (!acc) push("invariant-2", `acceptance "${map.acceptance}" is not a live check`, "$.acceptance");
  else if (acc.kind !== "acceptance") push("invariant-2", `acceptance ${map.acceptance} has kind "${acc.kind}", not "acceptance"`, "$.acceptance");
}

// 3 — covers resolve to live spec nodes
let liveIds = new Set(), behavioural = [];
if (spec) {
  const all = [
    ...(spec.behaviours ?? []), ...(spec.edges ?? []),
    ...(spec.constraints ?? []), ...(spec.interfaces ?? []),
  ];
  liveIds = new Set(all.map((n) => n.id));
  behavioural = [...(spec.behaviours ?? []), ...(spec.edges ?? [])].map((n) => n.id);
  for (const c of checks)
    for (const ref of c.covers ?? [])
      if (ref !== "scope" && !liveIds.has(ref))
        push("invariant-3", `${c.id} covers ${ref}, not a live node in spec v${spec.version}`, `checks.${c.id}`);
}

// 4 — coverage complete and non-contradictory
const covered = new Set(checks.flatMap((c) => c.covers ?? []));
const unverifiedRefs = new Set(unverified.map((u) => u.ref));
if (spec) {
  for (const id of behavioural) {
    const inCovers = covered.has(id), inUnverified = unverifiedRefs.has(id);
    if (!inCovers && !inUnverified) push("invariant-4", `spec ${id} is neither covered by a check nor listed unverified`, "$.checks");
    if (inCovers && inUnverified) push("invariant-4", `spec ${id} is both covered and listed unverified; pick one`, "$.unverified");
  }
  for (const n of [...(spec.constraints ?? []), ...(spec.interfaces ?? [])])
    if (!covered.has(n.id) && !unverifiedRefs.has(n.id))
      warnings.push({ path: `spec.${n.id}`, message: `${n.id} has no mapped check and is not listed unverified` });
}

// 5 — unverified entries resolve, human, at <= version
for (const u of unverified) {
  if (spec && !liveIds.has(u.ref)) push("invariant-5", `unverified ref ${u.ref} is not a live spec node`, "$.unverified");
  if (u.at != null && map.version != null && u.at > map.version)
    push("invariant-5", `unverified ${u.ref} decided at v${u.at}, later than this map's v${map.version}`, "$.unverified");
}

// 6 — freeze gates
const frozenGates = map.status === "frozen" || forFreeze;
if (frozenGates) {
  if (!map.commit && map.status === "frozen") push("invariant-6", "frozen map has no commit", "$.commit");
  if (!map.baseline) push("invariant-6", "frozen map has no baseline block; the map is not a target until the baseline has run", "$.baseline");
  for (const c of checks)
    if (!c.baseline?.observed)
      push("invariant-6", `${c.id} has no baseline.observed; expect without observed is a hope, not a baseline`, `checks.${c.id}`);
}
if (map.status === "draft" && map.commit) push("invariant-6", "draft map carries a commit; commit is written at freeze", "$.commit");

// 7 — previous_versions chain
let lastV = 0; const files = new Set();
for (const [i, p] of (map.previous_versions ?? []).entries()) {
  if (p.v <= lastV) push("invariant-7", `v ${p.v} not ascending`, `$.previous_versions[${i}]`);
  if (map.version != null && p.v >= map.version) push("invariant-7", `v ${p.v} is not lower than version ${map.version}`, `$.previous_versions[${i}]`);
  if (files.has(p.file)) push("invariant-7", `duplicate file "${p.file}"`, `$.previous_versions[${i}]`);
  files.add(p.file); lastV = p.v;
}

// 8 — retired coverage remapped
for (const r of retired)
  for (const ref of r.covers ?? [])
    if (!covered.has(ref) && !unverifiedRefs.has(ref))
      push("invariant-8", `retired ${r.id} covered ${ref}, now neither covered by a live check nor listed unverified`, "$.retired");

// 9 — locked paths cover the target
const locked = (map.locked_paths ?? []).map((p) => p.replace(/\/+$/, ""));
const under = (path) => locked.some((l) => path === l || path.startsWith(l + "/"));
if (map.fixture?.path && !under(map.fixture.path))
  push("invariant-9", `fixture "${map.fixture.path}" is not under any locked path; an unlockable target is editable by the agents it judges`, "$.fixture");
for (const c of checks)
  if (c.file && !under(c.file))
    push("invariant-9", `${c.id} file "${c.file}" is not under any locked path`, `checks.${c.id}`);

// Advisory: baseline expectations that look inverted while the feature is unbuilt
for (const c of checks)
  if (c.kind === "acceptance" && c.baseline?.expect === "pass" && map.version === 1)
    warnings.push({ path: `checks.${c.id}`, message: `acceptance expected to pass at v1 baseline; if the feature does not exist yet, expect should be "fail: <reason>"` });

process.exit(report(`tests-map ${map.name ?? file} v${map.version ?? "?"}`, errors, warnings));
