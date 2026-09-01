#!/usr/bin/env node
/**
 * spec-readiness-lint.mjs — part one of the spec-readiness rubric.
 *
 * Deterministic and property checks that need no judgment, only the draft and
 * read access to the repository it references. A draft that fails any check is
 * returned to its authors unjudged: judging a structurally broken document
 * wastes the expensive instrument on findings the cheap one already made.
 * Only a linter-clean draft reaches part two.
 *
 * Usage:
 *   node spec-readiness-lint.mjs <spec file> [--repo <dir>] [--run-commands]
 *                                            [--deliverable <path>]...
 *
 *   --repo           root the spec's named artefacts resolve against
 *                    (default: the repository containing this script)
 *   --run-commands   execute the commands named in verification (check 6).
 *                    Off by default: executing strings out of a document is a
 *                    real action, so it is opted into, never assumed.
 *   --deliverable    a path this spec produces rather than references; may be
 *                    repeated. Declared deliverables are reported, not failed.
 *
 * Checks, numbered as the rubric lists them:
 *   1  all nine domains present; an empty one says "empty by decision" + reason
 *   2  open questions empty
 *   3  behaviours B1…Bn and edges E1…En sequential, no gaps
 *   4  scope carries at least one explicit exclusion
 *   5  every named artefact in interfaces and verification resolves
 *   6  every command named in verification runs (assertions may fail)
 *   7  every B and E identifier appears in verification
 *   8  the definition of done names the paths the change may touch
 *   9  where the product is agent-shaped, one check class tag per behaviour
 *  10  (warning) impression words, for part two's attention
 *  11  (warning) behaviours or edges over three sentences
 *
 * Known limit: check 5 resolves file paths. Type, function and command NAMES
 * that are not path-shaped are not extractable without a language server, so
 * they pass here and are part two's business.
 *
 * Exit: 0 clean · 1 usage · 2 returned unjudged.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--") && args[args.indexOf(a) - 1] !== "--repo" && args[args.indexOf(a) - 1] !== "--deliverable");
if (!file) { console.error("usage: spec-readiness-lint.mjs <spec file> [--repo <dir>] [--run-commands] [--deliverable <path>]..."); process.exit(1); }

const here = dirname(fileURLToPath(import.meta.url));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const repo = resolve(opt("--repo", resolve(here, "..", "..")));
const runCommands = args.includes("--run-commands");
const deliverables = args.reduce((a, v, i) => (v === "--deliverable" ? [...a, args[i + 1]] : a), []);

let spec;
try { spec = JSON.parse(readFileSync(file, "utf8")); }
catch (e) { console.error(`error: $ — [parse] ${e.message}`); console.error(`${file}: 1 error`); process.exit(2); }

const fails = [], warns = [], notes = [];
const fail = (n, m) => fails.push({ n, m });
const warn = (n, m) => warns.push({ n, m });
const pass = [];
const ok = (n, m = "") => pass.push({ n, m });

const DOMAINS = ["intent","scope","constraints","interfaces","behaviours","edges","decisions","verification","acceptance"];
const textOf = (d) => Array.isArray(spec[d]) ? spec[d].map(x => x.text ?? "").join(" ") : (spec[d]?.text ?? "");
const allText = DOMAINS.map(textOf).join(" ");

// 1 — nine domains, and an empty one declares itself
{
  const absent = DOMAINS.filter(d => !(d in spec) || spec[d] == null);
  const empty  = DOMAINS.filter(d => Array.isArray(spec[d]) && spec[d].length === 0);
  const undeclared = empty.filter(d => !/empty by decision/i.test(JSON.stringify(spec[d] ?? "")));
  if (absent.length) fail(1, `domains absent: ${absent.join(", ")}`);
  else if (undeclared.length) fail(1, `domains empty without "empty by decision" and a reason: ${undeclared.join(", ")}`);
  else ok(1, "all nine domains present");
}

// 2 — open questions empty
{
  const q = spec.open_questions ?? [];
  q.length ? fail(2, `${q.length} open: ${q.map(x => x.id).join(", ")}`) : ok(2, "open questions empty");
}

// 3 — B and E sequential
{
  const gaps = (arr, pfx) => {
    if (!arr?.length) return [];
    const nums = arr.map(x => Number(String(x.id).slice(pfx.length))).filter(Number.isInteger);
    const top = Math.max(...nums), out = [];
    for (let i = 1; i <= top; i++) if (!nums.includes(i)) out.push(pfx + i);
    return out;
  };
  const g = [...gaps(spec.behaviours, "B"), ...gaps(spec.edges, "E")];
  g.length ? fail(3, `gaps: ${g.join(", ")}`) : ok(3, "behaviours and edges sequential");
}

// 4 — an explicit exclusion
{
  const outs = (spec.scope ?? []).filter(x => x.kind === "out");
  outs.length ? ok(4, `${outs.length} exclusions`) : fail(4, "scope names nothing as out");
}

// 5 — named artefacts resolve
{
  const hay = [...(spec.interfaces ?? []).map(i => `${i.text ?? ""} ${i.reuse ?? ""}`), textOf("verification")].join(" ");
  const found = [...new Set(hay.match(/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+|[A-Za-z0-9_-]+\.(?:json|mjs|js|ts|md|sh|yaml|yml)\b/g) ?? [])];
  const declared = found.filter(p => deliverables.some(d => p === d || p.startsWith(d)));
  const checked = found.filter(p => !declared.includes(p));
  const missing = checked.filter(p => !existsSync(resolve(repo, p)));
  if (declared.length) notes.push(`declared deliverables, not resolved: ${declared.join(", ")}`);
  missing.length
    ? fail(5, `unresolved: ${missing.join(", ")}`)
    : ok(5, `${checked.length} artefact${checked.length === 1 ? "" : "s"} resolve`);
}

// 6 — named commands run
{
  const cmds = [...new Set((textOf("verification").match(/`([^`\n]+)`/g) ?? [])
    .map(s => s.slice(1, -1).trim())
    .filter(s => /^(node|npm|npx|bash|sh|python3?|make|git|\.\/)/.test(s)))];
  if (!cmds.length) ok(6, "no commands named");
  else if (!runCommands) fail(6, `${cmds.length} command(s) named but not executed; pass --run-commands`);
  else {
    const dead = [];
    for (const c of cmds) {
      try { execSync(c, { cwd: repo, stdio: "ignore", timeout: 30000 }); }
      catch (e) { if (e.status == null) dead.push(`${c} (${e.code ?? "unrunnable"})`); }
    }
    dead.length ? fail(6, `unrunnable: ${dead.join("; ")}`) : ok(6, `${cmds.length} command(s) ran`);
  }
}

// 7 — every B and E claimed by verification
{
  const v = textOf("verification");
  const un = [...(spec.behaviours ?? []), ...(spec.edges ?? [])]
    .map(x => x.id).filter(id => !new RegExp(`\\b${id}\\b`).test(v));
  un.length ? fail(7, `unclaimed by verification: ${un.join(", ")}`) : ok(7, "every behaviour and edge claimed");
}

// 8 — the definition of done names paths
{
  const a = textOf("acceptance");
  const paths = a.match(/(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.*-]*|[A-Za-z0-9_-]+\.(?:json|mjs|js|ts|md|sh)\b/g) ?? [];
  paths.length
    ? ok(8, `path boundary names ${paths.length} path${paths.length === 1 ? "" : "s"}`)
    : fail(8, "the definition of done names no path the change may touch");
}

// 9 — check class tags where agent-shaped
{
  const CLASSES = ["deterministic", "property", "statistical", "judged"];
  const agentShaped = /agent-shaped/i.test(allText);
  if (!agentShaped) ok(9, "product not declared agent-shaped");
  else {
    const bad = (spec.behaviours ?? []).filter(b =>
      CLASSES.filter(c => new RegExp(`\\[${c}\\]`).test(b.text ?? "")).length !== 1).map(b => b.id);
    bad.length ? fail(9, `not exactly one class tag: ${bad.join(", ")}`) : ok(9, "one class tag per behaviour");
  }
}

// 10 / 11 — warnings
{
  const WORDS = ["properly", "gracefully", "appropriately", "clearly", "handles well", "robust"];
  const hits = [];
  for (const d of DOMAINS)
    for (const n of (Array.isArray(spec[d]) ? spec[d] : [spec[d]]).filter(Boolean))
      for (const w of WORDS)
        if (new RegExp(`\\b${w}\\b`, "i").test(n.text ?? "")) hits.push(`${n.id ?? d}:"${w}"`);
  if (hits.length) warn(10, hits.join(", "));

  const longs = [...(spec.behaviours ?? []), ...(spec.edges ?? [])]
    .filter(n => (String(n.text).match(/[.!?](?:\s|$)/g) ?? []).length > 3).map(n => n.id);
  if (longs.length) warn(11, `over three sentences: ${longs.join(", ")}`);
}

for (const p of pass)  console.log(`  pass  ${p.n}. ${p.m}`);
for (const n of notes) console.log(`  note  ${n}`);
for (const w of warns) console.error(`  warn  ${w.n}. ${w.m}`);
for (const f of fails) console.error(`  FAIL  ${f.n}. ${f.m}`);

const label = `${spec.name ?? file} v${spec.version ?? "?"}`;
if (fails.length === 0) {
  console.log(`\n${label}: linter clean — proceeds to part two${warns.length ? ` (${warns.length} warning${warns.length > 1 ? "s" : ""})` : ""}`);
  process.exit(0);
}
console.error(`\n${label}: returned unjudged — ${fails.length} linter failure${fails.length > 1 ? "s" : ""}`);
process.exit(2);
