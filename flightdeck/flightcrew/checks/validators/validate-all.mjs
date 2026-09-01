#!/usr/bin/env node
/**
 * validate-all.mjs — runs validate-spec.mjs over every spec in a tree and
 * prints one summary, so a bulk edit can be checked in a single command.
 *
 * Usage:
 *   node validate-all.mjs [dir] [--quiet] [--strict] [--for-freeze]
 *
 *   dir            tree to walk, default the current directory
 *   --quiet        print only files that fail
 *   --strict       treat warnings as failures
 *   --for-freeze   passed through: gate every file as if it were freezing
 *
 * A spec file is any file matching spec.v<n>.json, in either the folder
 * layout (specs/<name>/spec.v1.json) or the flat one (<name>.spec.v1.json).
 *
 * Exit codes: 0 all valid · 1 usage or nothing found · 2 one or more invalid.
 */

import { readdirSync, statSync } from "node:fs";
import { dirname, resolve, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const validator = resolve(here, "validate-spec.mjs");

const argv = process.argv.slice(2);
const flags = argv.filter((a) => a.startsWith("--"));
const dir = resolve(argv.find((a) => !a.startsWith("--")) ?? ".");
const quiet = flags.includes("--quiet");
const strict = flags.includes("--strict");
const passthrough = flags.filter((f) => f === "--for-freeze");

const SPEC_FILE = /(^|\.)spec\.v\d+\.json$/;

function walk(d, found = []) {
  for (const entry of readdirSync(d)) {
    if (entry.startsWith(".") || entry === "node_modules") continue;
    const full = join(d, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (SPEC_FILE.test(entry)) found.push(full);
  }
  return found;
}

const files = walk(dir).sort();
if (files.length === 0) {
  console.error(`no spec.v<n>.json files under ${dir}`);
  process.exit(1);
}

let failed = 0;
let warned = 0;

for (const file of files) {
  const r = spawnSync("node", [validator, file, ...passthrough], { encoding: "utf8" });
  const out = `${r.stdout}${r.stderr}`;
  const errors = (out.match(/^error: /gm) ?? []).length;
  const warnings = (out.match(/^warn: {2}/gm) ?? []).length;
  const bad = errors > 0 || (strict && warnings > 0);

  if (bad) failed++;
  if (warnings > 0) warned++;

  if (bad || !quiet) {
    const mark = errors > 0 ? "FAIL" : warnings > 0 ? "warn" : "ok  ";
    const tail = errors > 0 ? `${errors} error${errors > 1 ? "s" : ""}`
      : warnings > 0 ? `${warnings} warning${warnings > 1 ? "s" : ""}` : "";
    console.log(`${mark}  ${relative(dir, file)}${tail ? `  (${tail})` : ""}`);
  }
  if (bad || (!quiet && warnings > 0))
    console.log(out.split("\n").filter((l) => l.startsWith("error:") || l.startsWith("warn:")).map((l) => `        ${l}`).join("\n"));
}

console.log("");
console.log(`${files.length - failed}/${files.length} valid${warned ? `, ${warned} with warnings` : ""}`);
process.exit(failed ? 2 : 0);
