#!/usr/bin/env node
/**
 * run.mjs — the validator's own test suite.
 *
 * Each case in cases.mjs mutates one field of a golden fixture, writes the
 * result to a temp directory, runs validate-spec.mjs against it, and asserts
 * on the exit code and the exact set of rule ids reported. Asserting the set
 * exactly, rather than merely containing the expected rule, catches an
 * invariant that fires on files it has no business rejecting.
 *
 * Usage:
 *   node test/run.mjs [--only <substring>] [--keep] [-v]
 *
 *   --only   run cases whose name contains the substring
 *   --keep   leave the temp tree in place and print its path
 *   -v       print the validator's own output for every case
 *
 * Exit codes: 0 all cases pass · 1 usage · 2 one or more cases failed.
 */

import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { cases } from "./cases.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const validator = resolve(root, "validate-spec.mjs");
const goldens = {
  v1: resolve(here, "fixtures/agent-sample/spec.v1.json"),
  v2: resolve(here, "fixtures/agent-sample/spec.v2.json"),
};

const argv = process.argv.slice(2);
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;
const keep = argv.includes("--keep");
const verbose = argv.includes("-v");

const work = mkdtempSync(join(tmpdir(), "spec-tests-"));

/** Run the validator on one file and split its output into rules and warnings. */
function runValidator(file, args = []) {
  const r = spawnSync("node", [validator, file, ...args], { encoding: "utf8" });
  const out = `${r.stdout}${r.stderr}`;
  const rules = [...new Set([...out.matchAll(/^error: .* — \[([^\]]+)\]/gm)].map((m) => m[1]))];
  const warns = [...out.matchAll(/^warn: {2}(.*)$/gm)].map((m) => m[1]);
  return { code: r.status, rules, warns, out };
}

const selected = cases.filter((c) => !only || c.name.includes(only));
if (selected.length === 0) {
  console.error(only ? `no case matches "${only}"` : "no cases defined");
  process.exit(1);
}

const failures = [];

for (const c of selected) {
  const spec = JSON.parse(readFileSync(goldens[c.base], "utf8"));
  c.mutate?.(spec);

  const dir = join(work, c.name, c.dir ?? spec.name ?? "unnamed");
  mkdirSync(dir, { recursive: true });
  const file = join(dir, c.as ?? `spec.v${c.base === "v2" ? 2 : 1}.json`);
  writeFileSync(file, `${JSON.stringify(spec, null, 2)}\n`);

  const got = runValidator(file, c.args ?? []);
  const wantRules = c.clean ? [] : (c.rules ?? []);
  const wantCode = c.code ?? (wantRules.length > 0 ? 2 : 0);
  const problems = [];

  if (got.code !== wantCode) problems.push(`exit ${got.code}, expected ${wantCode}`);

  const missing = wantRules.filter((r) => !got.rules.includes(r));
  const extra = got.rules.filter((r) => !wantRules.includes(r));
  if (missing.length) problems.push(`rules not raised: ${missing.join(", ")}`);
  if (extra.length) problems.push(`rules raised unexpectedly: ${extra.join(", ")}`);

  if (c.clean && got.warns.length) problems.push(`expected no warnings, got ${got.warns.length}`);
  for (const w of c.warns ?? [])
    if (!got.warns.some((line) => line.includes(w))) problems.push(`no warning containing "${w}"`);

  if (problems.length) {
    failures.push({ name: c.name, problems, out: got.out, file });
    console.log(`FAIL  ${c.name}`);
    for (const p of problems) console.log(`        ${p}`);
  } else {
    console.log(`pass  ${c.name}`);
  }
  if (verbose) console.log(got.out.replace(/^/gm, "        "));
}

console.log("");
console.log(`${selected.length - failures.length}/${selected.length} passed`);

if (failures.length) {
  console.log("");
  for (const f of failures) {
    console.log(`── ${f.name}`);
    console.log(`   file: ${f.file}`);
    console.log(f.out.replace(/^/gm, "   "));
  }
}

if (keep) console.log(`temp tree kept at ${work}`);
else rmSync(work, { recursive: true, force: true });

process.exit(failures.length ? 2 : 0);
