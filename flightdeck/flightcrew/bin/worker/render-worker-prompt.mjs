#!/usr/bin/env node
/**
 * render-worker-prompt.mjs
 *
 * Renders worker task prompts deterministically from plan.json + spec.vN.json
 * + tests-map.json, using flightdeck/flightcrew/templates/worker.template.md. The rendered file
 * is the prompt the worker receives and the record the run report points at.
 *
 * Zero dependencies. Node is always present where Claude Code runs.
 *
 * Usage:
 *   node render-worker-prompt.mjs --run <runs/dir> --unit U2
 *   node render-worker-prompt.mjs --run <runs/dir> --all
 *
 * Options:
 *   --run <dir>            run directory containing plan.json (required)
 *   --unit <id>            render one unit
 *   --all                  render every unit in the plan
 *   --template <file>      default: flightdeck/flightcrew/templates/worker.template.md
 *   --tests-map <file>     default: <spec dir>/tests-map.json
 *   --out <dir>            default: <run dir>/prompts
 *   --default-iterations N default: 8 (used when a unit has no ceiling)
 *   --allow-draft          render from an unapproved plan (dry runs only)
 *   --no-verify            skip approval-hash verification
 *   --stdout               print instead of writing files
 *
 * Conventions this script relies on:
 *   - plan.approval.plan_hash is sha256 of JSON.stringify(plan) with the
 *     approval block removed, using the file's own key order. The gate page
 *     must compute it the same way (JS key order is insertion order for both).
 *   - Interface declarations are extracted from the seam file between marker
 *     comments containing "@seam <I-id>" and "@endseam", any comment syntax:
 *         // @seam I3
 *         export function exportProject(...): Promise<ExportResult>
 *         // @endseam
 *     The interfaces phase writes these markers when it stubs the seam.
 *     If no marker is found the whole file is inlined with a warning.
 *   - tests-map.json:
 *       { "spec_version": <int>,
 *         "command": "npm test -- {checks}",
 *         "checks": [ { "name": "...", "covers": ["B1","E2"] } ] }
 *     {checks} in command is replaced by the unit's check names, space-joined.
 *
 * Exit codes: 0 rendered · 1 usage · 2 unresolvable reference or drift.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join, dirname, basename } from "node:path";

// ---------- args ----------
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const flag = (name) => args.includes(name);

const runDir = opt("--run");
if (!runDir) fail(1, "usage: render-worker-prompt.mjs --run <dir> (--unit <id> | --all)");
const unitArg = opt("--unit");
const all = flag("--all");
if (!unitArg && !all) fail(1, "specify --unit <id> or --all");

// ---------- load ----------
const planPath = join(runDir, "plan.json");
const plan = readJson(planPath);
const specPath = plan.spec?.path;
if (!specPath || !existsSync(specPath)) fail(2, `spec not found at plan.spec.path: ${specPath}`);
const spec = readJson(specPath);

const templatePath = opt("--template", "flightdeck/flightcrew/templates/worker.template.md");
const template = readFileSync(templatePath, "utf8");

const testsMapPath = opt("--tests-map", join(dirname(specPath), "tests-map.json"));
const testsMap = existsSync(testsMapPath) ? readJson(testsMapPath) : null;
if (!testsMap) warn(`no tests map at ${testsMapPath}; check coverage will read "—" and the check command must come from --check-command`);
const mapChecks = new Map((testsMap?.checks ?? []).map((c) => [c.id, c]));

// ---------- guards: status, version drift, approval hash ----------
if (spec.status !== "frozen") fail(2, `spec status is "${spec.status}", not frozen`);
if (Number(spec.version) !== Number(plan.spec.spec_version))
  fail(2, `drift: plan built against spec v${plan.spec.spec_version}, file is v${spec.version}`);
if (testsMap && Number(testsMap.spec?.version) !== Number(spec.version))
  fail(2, `drift: tests map is for spec v${testsMap.spec?.version}, spec file is v${spec.version}`);
if (testsMap && testsMap.status !== "frozen") fail(2, `tests map status is "${testsMap.status}", not frozen`);

if (plan.status !== "approved" && !flag("--allow-draft"))
  fail(2, `plan status is "${plan.status}"; pass --allow-draft for dry runs`);
if (plan.status === "approved" && !flag("--no-verify")) {
  const clone = JSON.parse(readFileSync(planPath, "utf8"));
  delete clone.approval;
  const hash = createHash("sha256").update(JSON.stringify(clone)).digest("hex");
  if (hash !== plan.approval?.plan_hash)
    fail(2, `approval hash mismatch: plan has changed since it was approved`);
}

// ---------- indexes ----------
const specEntities = new Map(); // B/E id -> {id, kind, text}
for (const b of spec.behaviours ?? []) specEntities.set(b.id, { id: b.id, kind: "behaviour", text: b.text });
for (const e of spec.edges ?? []) specEntities.set(e.id, { id: e.id, kind: "edge", text: e.text });

const planInterfaces = new Map((plan.interfaces ?? []).map((i) => [i.id, i]));


// ---------- render ----------
const units = all ? plan.units : plan.units.filter((u) => u.id === unitArg);
if (units.length === 0) fail(2, `unit ${unitArg} not found in plan`);

const outDir = opt("--out", join(runDir, "prompts"));
if (!flag("--stdout")) mkdirSync(outDir, { recursive: true });

for (const unit of units) {
  const ctx = buildContext(unit);
  const rendered = renderTemplate(template, ctx);
  const unresolved = rendered.match(/{{[^}]+}}/g);
  if (unresolved) fail(2, `${unit.id}: unresolved slots after render: ${[...new Set(unresolved)].join(" ")}`);
  if (flag("--stdout")) {
    process.stdout.write(rendered + "\n");
  } else {
    const outPath = join(outDir, `${unit.id}.md`);
    writeFileSync(outPath, rendered);
    console.log(outPath);
  }
}

// ---------- context assembly ----------
function buildContext(unit) {
  const spec_entities = unit.spec_refs.map((ref) => {
    const e = specEntities.get(ref);
    if (!e) fail(2, `${unit.id}: spec ref ${ref} not found in spec v${spec.version}`);
    return e;
  });

  const resolveInterface = (iid) => {
    const pi = planInterfaces.get(iid);
    if (!pi) fail(2, `${unit.id}: interface ${iid} not found in plan.interfaces`);
    return {
      id: pi.id,
      name: pi.name,
      kind: pi.kind,
      path: pi.path,
      check: pi.check,
      declaration: extractDeclaration(pi),
    };
  };

  const needs_interfaces = (unit.needs ?? []).map(resolveInterface);
  const produces_interfaces = (unit.produces ?? []).map(resolveInterface);

  const checks = (unit.checks ?? []).map((id) => {
    const c = mapChecks.get(id);
    if (!c) { warnOnce(`check ${id} not in tests map`); return { name: id, covers: "—" }; }
    return { name: c.name ? `${c.id} — ${c.name}` : c.id, covers: (c.covers ?? []).join(" ") || "—" };
  });

  const commands = (unit.checks ?? []).map((id) => mapChecks.get(id)?.command).filter(Boolean);
  const check_command = opt("--check-command",
    commands.length ? [...new Set(commands)].join(" && ") : null)
    ?? fail(2, `${unit.id}: no check command (per-check commands in the tests map, or --check-command)`);

  return {
    run: { id: basename(resolve(runDir)) },
    plan: { plan_version: plan.plan_version, spec: plan.spec, approval: plan.approval ?? { plan_hash: "draft" } },
    unit,
    spec_entities,
    needs_interfaces,
    produces_interfaces,
    checks,
    check_command,
    ceilings: { iterations: unit.ceilings?.iterations ?? Number(opt("--default-iterations", 8)) },
  };
}

function extractDeclaration(pi) {
  if (!existsSync(pi.path)) {
    fail(2, `interface ${pi.id}: seam file not found: ${pi.path} (has the interfaces phase run?)`);
  }
  const src = readFileSync(pi.path, "utf8");
  const lines = src.split("\n");
  const start = lines.findIndex((l) => l.includes(`@seam ${pi.id}`) && !l.includes("@endseam"));
  if (start < 0) {
    warn(`interface ${pi.id}: no "@seam ${pi.id}" marker in ${pi.path}; inlining whole file`);
    return src.trim();
  }
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => l.includes("@endseam"));
  const body = (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
  // Continuation lines get the template's fence indentation so the block renders aligned.
  return body.split("\n").map((l, i) => (i === 0 ? l : "  " + l)).join("\n");
}

// ---------- minimal template engine ----------
// Supports {{path}}, {{this}}, {{this.path}}, {{#each name}}...{{/each}},
// {{^name}}...{{/name}}. Sections do not nest. No escaping: output is markdown.
function renderTemplate(tpl, ctx) {
  let out = tpl;
  out = out.replace(/{{#each ([\w.]+)}}\n?([\s\S]*?){{\/each}}\n?/g, (_, name, body) => {
    const arr = lookup(ctx, name) ?? [];
    return arr.map((item) => renderScalars(body, ctx, item)).join("");
  });
  out = out.replace(/{{\^([\w.]+)}}\n?([\s\S]*?){{\/\1}}\n?/g, (_, name, body) => {
    const arr = lookup(ctx, name);
    return !arr || arr.length === 0 ? renderScalars(body, ctx, undefined) : "";
  });
  return renderScalars(out, ctx, undefined);
}

function renderScalars(text, ctx, item) {
  return text.replace(/{{([\w.]+)}}/g, (m, path) => {
    let v;
    if (path === "this") v = item;
    else if (path.startsWith("this.")) v = lookup(item, path.slice(5));
    else v = lookup(ctx, path);
    return v === undefined || v === null ? m : String(v);
  });
}

function lookup(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

// ---------- helpers ----------
function readJson(p) {
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch (e) {
    fail(2, `cannot read ${p}: ${e.message}`);
  }
}
const warned = new Set();
function warnOnce(msg) {
  if (!warned.has(msg)) { warned.add(msg); warn(msg); }
  return undefined;
}
function warn(msg) { console.error(`warn: ${msg}`); }
function fail(code, msg) { console.error(`error: ${msg}`); process.exit(code); }
