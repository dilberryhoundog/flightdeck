#!/usr/bin/env node
/**
 * validate-plan.mjs — validates a plan instance against plan.schema.json,
 * then checks the eight cross-reference invariants against the spec and
 * tests map the plan names. This is the mechanical half of the plan gate;
 * the gate page runs the same checks via schema-lib before rendering.
 *
 * Usage:
 *   node validate-plan.mjs <plan file> [--schema <file>] [--tests-map <file>]
 *                          [--spec <file>] [--verify-approval]
 *
 *   --spec           override plan.spec.path (fixtures, dry runs)
 *   --tests-map      default: <spec dir>/tests-map.json
 *   --verify-approval  also verify approval.plan_hash when status is approved
 *
 * The eight invariants (numbered as in plan.schema.json's description):
 *   1  every behaviour and edge id in the spec appears in exactly one unit
 *   2  every id in a unit's needs exists in interfaces
 *   3  stub interfaces are produced by exactly one unit; non-stub by none
 *   4  no path appears in more than one unit's owns (exact or nested)
 *   5  every unit check exists in the tests map
 *   6  order references existing groups; every unit's group appears exactly once
 *   7  a unit needing an interface produced by another unit is in a later wave
 *   8  a unit with decisions carries the human-decision flag
 *
 * Also checked: spec_refs resolve; spec is frozen and versions match;
 * interface spec_refs resolve (null allowed, warned); contract checks of
 * needs/produces present in the unit's checks (warning).
 *
 * Exit codes: 0 valid · 1 usage · 2 invalid.
 */

import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validate, report } from "./schema-lib.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) { console.error("usage: validate-plan.mjs <plan file> [options]"); process.exit(1); }
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const schema = JSON.parse(readFileSync(opt("--schema", resolve(here, "plan.schema.json")), "utf8"));
const plan = JSON.parse(readFileSync(file, "utf8"));

const errors = validate(schema, plan);
const warnings0 = [];
if (schema.version == null) warnings0.push({ path: "schema", message: "schema file carries no version; add one" });
else if (Number(plan.schema_version) !== Number(schema.version))
  errors.push({ path: "$.schema_version", rule: "schema-version", message: `instance declares schema_version ${plan.schema_version}, schema file is v${schema.version}; refusing to judge by mismatched rules` });
const warnings = [...warnings0];
const push = (rule, message, path = "$") => errors.push({ path, rule, message });

// Load spec + tests map
const specPath = opt("--spec", plan.spec?.path);
let spec = null, testsMap = null;
if (specPath && existsSync(specPath)) {
  spec = JSON.parse(readFileSync(specPath, "utf8"));
  if (spec.status !== "frozen") push("spec", `spec status is "${spec.status}", not frozen`, "$.spec");
  if (Number(spec.version) !== Number(plan.spec?.spec_version))
    push("spec", `drift: plan built against spec v${plan.spec?.spec_version}, file is v${spec.version}`, "$.spec");
} else {
  push("spec", `spec not found: ${specPath}`, "$.spec.path");
}
const tmPath = opt("--tests-map", specPath ? resolve(dirname(specPath), "tests-map.json") : null);
if (tmPath && existsSync(tmPath)) {
  testsMap = JSON.parse(readFileSync(tmPath, "utf8"));
  if (spec && Number(testsMap.spec?.version) !== Number(spec.version))
    warnings.push({ path: "tests-map", message: `tests map is for spec v${testsMap.spec?.version}, spec is v${spec.version}` });
  if (testsMap.status !== "frozen")
    warnings.push({ path: "tests-map", message: `tests map status is "${testsMap.status}", not frozen` });
} else {
  warnings.push({ path: "tests-map", message: `no tests map at ${tmPath}; invariant 5 skipped` });
}

const units = plan.units ?? [];
const interfaces = plan.interfaces ?? [];
const ifaceById = new Map(interfaces.map((i) => [i.id, i]));

// 1 — full, exclusive spec coverage
if (spec) {
  const liveIds = [...(spec.behaviours ?? []), ...(spec.edges ?? [])].map((n) => n.id);
  const claimedBy = new Map();
  for (const u of units)
    for (const ref of u.spec_refs ?? []) {
      if (!liveIds.includes(ref)) push("invariant-1", `${u.id} references ${ref}, not in spec v${spec.version}`, `units.${u.id}`);
      if (claimedBy.has(ref)) push("invariant-1", `${ref} claimed by both ${claimedBy.get(ref)} and ${u.id}`, `units.${u.id}`);
      else claimedBy.set(ref, u.id);
    }
  for (const id of liveIds)
    if (!claimedBy.has(id)) push("invariant-1", `spec ${id} is not covered by any unit`, "$.units");
  // interface lineage
  const specIfaceIds = new Set((spec.interfaces ?? []).map((i) => i.id));
  for (const i of interfaces) {
    if (i.spec_ref === null) warnings.push({ path: `interfaces.${i.id}`, message: `seam has no spec ancestor (spec_ref null) — the plan invented a contract; glance at it at the gate` });
    else if (i.spec_ref && !specIfaceIds.has(i.spec_ref)) push("interfaces", `${i.id} spec_ref ${i.spec_ref} not in spec`, `interfaces.${i.id}`);
  }
}

// 2 — needs resolve
for (const u of units)
  for (const n of u.needs ?? [])
    if (!ifaceById.has(n)) push("invariant-2", `${u.id} needs ${n}, not in plan.interfaces`, `units.${u.id}`);

// 3 — producer counts
const producers = new Map();
for (const u of units)
  for (const p of u.produces ?? []) {
    if (!ifaceById.has(p)) { push("invariant-3", `${u.id} produces ${p}, not in plan.interfaces`, `units.${u.id}`); continue; }
    producers.set(p, [...(producers.get(p) ?? []), u.id]);
  }
for (const i of interfaces) {
  const who = producers.get(i.id) ?? [];
  if (i.stub && who.length !== 1) push("invariant-3", `stub ${i.id} produced by ${who.length} units (${who.join(", ") || "none"}); need exactly one`, `interfaces.${i.id}`);
  if (!i.stub && who.length > 0) push("invariant-3", `${i.id} is complete-in-itself but ${who.join(", ")} claim to produce it`, `interfaces.${i.id}`);
}

// 4 — exclusive ownership, nesting-aware
const owns = units.flatMap((u) => (u.owns ?? []).map((p) => [normalise(p), u.id]));
for (let a = 0; a < owns.length; a++)
  for (let b = a + 1; b < owns.length; b++) {
    const [pa, ua] = owns[a], [pb, ub] = owns[b];
    if (ua === ub) continue;
    if (pa === pb) push("invariant-4", `"${pa}" owned by both ${ua} and ${ub}`, "$.units");
    else if (pa.startsWith(pb + "/") || pb.startsWith(pa + "/"))
      push("invariant-4", `overlap: ${ua} owns "${pa}", ${ub} owns "${pb}"`, "$.units");
  }

// 5 — checks exist in tests map
if (testsMap) {
  const known = new Map((testsMap.checks ?? []).map((c) => [c.id, c]));
  for (const u of units) {
    const coveredByChecks = new Set();
    for (const c of u.checks ?? []) {
      if (!known.has(c)) { push("invariant-5", `${u.id} check ${c} is not a live check in the tests map`, `units.${u.id}`); continue; }
      for (const ref of known.get(c).covers ?? []) coveredByChecks.add(ref);
    }
    for (const ref of u.spec_refs ?? [])
      if (known.size && !coveredByChecks.has(ref))
        warnings.push({ path: `units.${u.id}`, message: `spec_ref ${ref} is not covered by any of this unit's checks` });
  }
}

// 6 — order/group consistency
const groupsInOrder = (plan.order ?? []).flat();
const groupCount = new Map();
for (const g of groupsInOrder) groupCount.set(g, (groupCount.get(g) ?? 0) + 1);
const unitGroups = new Set(units.map((u) => u.group));
for (const g of groupsInOrder)
  if (!unitGroups.has(g)) push("invariant-6", `order references group "${g}" with no units`, "$.order");
for (const g of unitGroups) {
  const c = groupCount.get(g) ?? 0;
  if (c === 0) push("invariant-6", `group "${g}" never appears in order`, "$.order");
  if (c > 1) push("invariant-6", `group "${g}" appears ${c} times in order`, "$.order");
}

// 7 — dependency respects waves
const waveOfGroup = new Map();
(plan.order ?? []).forEach((wave, w) => wave.forEach((g) => waveOfGroup.set(g, w)));
const waveOfUnit = (u) => waveOfGroup.get(u.group);
const producerOf = (iid) => (producers.get(iid) ?? [])[0];
for (const u of units)
  for (const n of u.needs ?? []) {
    const p = producerOf(n);
    if (!p || p === u.id) continue; // stubbed in interfaces phase, or self
    const pu = units.find((x) => x.id === p);
    if (pu && waveOfUnit(u) != null && waveOfUnit(pu) != null && waveOfUnit(u) <= waveOfUnit(pu))
      push("invariant-7", `${u.id} (wave ${waveOfUnit(u) + 1}) needs ${n}, produced by ${p} (wave ${waveOfUnit(pu) + 1}); must be a later wave`, `units.${u.id}`);
  }

// 8 — decisions require the flag
for (const u of units)
  if ((u.decisions ?? []).length > 0 && !(u.flags ?? []).includes("human-decision"))
    push("invariant-8", `${u.id} has decisions but no human-decision flag`, `units.${u.id}`);

// Warning: contract checks of needs/produces present in unit checks
for (const u of units)
  for (const iid of [...(u.needs ?? []), ...(u.produces ?? [])]) {
    const i = ifaceById.get(iid);
    if (i && !(u.checks ?? []).includes(i.check))
      warnings.push({ path: `units.${u.id}`, message: `checks do not include ${iid}'s contract check "${i.check}"` });
  }

// Approval hash
if (args.includes("--verify-approval") && plan.status === "approved") {
  const clone = JSON.parse(readFileSync(file, "utf8"));
  delete clone.approval;
  const hash = createHash("sha256").update(JSON.stringify(clone)).digest("hex");
  if (hash !== plan.approval?.plan_hash)
    push("approval", "plan has changed since it was approved (hash mismatch)", "$.approval");
}

function normalise(p) { return p.replace(/\/+$/, ""); }

process.exit(report(`plan ${plan.run ?? file} v${plan.plan_version ?? "?"}`, errors, warnings));
