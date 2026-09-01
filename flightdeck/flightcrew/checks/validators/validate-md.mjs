#!/usr/bin/env node
/**
 * validate-md.mjs — validates a markdown document against a docspec.
 *
 * The parse-then-judge approach: the markdown is parsed into a JSON shape
 * (frontmatter map + section tree), the docspec's frontmatter schema is
 * executed by schema-lib, and the docspec's section and content rules are
 * checked in code. One tool validates agent definitions, prompt templates,
 * kickoffs, or any other markdown document agents fill — each document kind
 * gets its own docspec file.
 *
 * Usage:
 *   node validate-md.mjs <doc.md> --docspec <docspec.json> [--as-template]
 *
 *   --as-template   placeholder patterns from docspec.placeholders are
 *                   ALLOWED (the file is a template); without it they are
 *                   ERRORS (the file is a filled instance with unfilled slots)
 *
 * Docspec shape (orchestration/schemas/*.docspec.json):
 * {
 *   "version": 1,
 *   "changelog": [{ "v": 1, "reason": "..." }],
 *   "frontmatter": {
 *     "required": true,
 *     "schema": { ...JSON Schema for the key/value map... }
 *   },
 *   "sections": [
 *     { "heading": "^What you receive$",   // regex on heading text
 *       "depth": 2,                         // ## level (omit: any)
 *       "required": true,
 *       "min_words": 20,                    // body must not be a stub
 *       "must_match": ["regex", ...],       // each must appear in body
 *       "must_not_match": ["regex", ...] }
 *   ],
 *   "ordered": true,                        // required sections keep docspec order
 *   "allow_extra_sections": false,
 *   "placeholders": ["{{[^}]+}}", "<[a-z][^>]*>"],   // slot syntaxes
 *   "must_match": ["regex", ...],           // whole-document requirements
 *   "must_not_match": ["regex", ...]
 * }
 *
 * Frontmatter parsing is deliberately minimal: `key: value` scalar lines
 * between --- fences (the shape Claude Code agent files use). Values are
 * strings; "true"/"false" become booleans, bare integers become numbers.
 * Documents needing richer frontmatter should carry JSON, not YAML.
 *
 * Exit codes: 0 valid · 1 usage · 2 invalid.
 */

import { readFileSync } from "node:fs";
import { validate, report } from "./schema-lib.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const docspecPath = opt("--docspec");
if (!file || !docspecPath) { console.error("usage: validate-md.mjs <doc.md> --docspec <docspec.json> [--as-template]"); process.exit(1); }
const asTemplate = args.includes("--as-template");

const docspec = JSON.parse(readFileSync(docspecPath, "utf8"));
const raw = readFileSync(file, "utf8");

const errors = [];
const warnings = [];
const err = (path, rule, message) => errors.push({ path, rule, message });

// ---------- parse: frontmatter ----------
let body = raw;
let frontmatter = null;
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
if (fmMatch) {
  frontmatter = {};
  for (const line of fmMatch[1].split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const m = line.match(/^([\w-]+):\s*(.*)$/);
    if (!m) { warnings.push({ path: "frontmatter", message: `unparsed line: "${line.trim()}" (only key: value scalars supported)` }); continue; }
    const [, k, v] = m;
    frontmatter[k] = v === "true" ? true : v === "false" ? false : /^\d+$/.test(v) ? Number(v) : v;
  }
  body = raw.slice(fmMatch[0].length);
}

// ---------- parse: section tree ----------
const lines = body.split("\n");
const sections = []; // {depth, title, body, line}
let current = null;
let inFence = false;
lines.forEach((line, i) => {
  if (/^```/.test(line)) inFence = !inFence;
  const h = !inFence && line.match(/^(#{1,6})\s+(.*)$/);
  if (h) {
    current = { depth: h[1].length, title: h[2].trim(), body: "", line: i + 1 };
    sections.push(current);
  } else if (current) {
    current.body += line + "\n";
  }
});

// ---------- judge: frontmatter ----------
if (docspec.frontmatter) {
  if (docspec.frontmatter.required && !frontmatter)
    err("frontmatter", "required", "document has no frontmatter block");
  if (frontmatter && docspec.frontmatter.schema)
    for (const e of validate(docspec.frontmatter.schema, frontmatter))
      errors.push({ ...e, path: `frontmatter${e.path.slice(1)}` });
}

// ---------- judge: sections ----------
const specSections = docspec.sections ?? [];
const matchedIndex = new Map(); // docspec index -> section index
for (const [si, rule] of specSections.entries()) {
  const re = new RegExp(rule.heading);
  const found = sections.findIndex((s, i) =>
    re.test(s.title) && (rule.depth == null || s.depth === rule.depth) && ![...matchedIndex.values()].includes(i));
  if (found < 0) {
    if (rule.required) err(`sections["${rule.heading}"]`, "required", "section not found");
    continue;
  }
  matchedIndex.set(si, found);
  const s = sections[found];
  const words = s.body.split(/\s+/).filter(Boolean).length;
  if (rule.min_words != null && words < rule.min_words)
    err(`sections."${s.title}"`, "min_words", `${words} words, need ${rule.min_words}; looks like a stub`);
  for (const p of rule.must_match ?? [])
    if (!new RegExp(p, "m").test(s.body)) err(`sections."${s.title}"`, "must_match", `body does not match /${p}/`);
  for (const p of rule.must_not_match ?? [])
    if (new RegExp(p, "m").test(s.body)) err(`sections."${s.title}"`, "must_not_match", `body matches forbidden /${p}/`);
}

// order: matched required sections appear in docspec order
if (docspec.ordered) {
  let last = -1;
  for (const [si] of specSections.entries()) {
    if (!matchedIndex.has(si)) continue;
    const at = matchedIndex.get(si);
    if (at < last) err(`sections["${specSections[si].heading}"]`, "ordered", "section out of order");
    last = Math.max(last, at);
  }
}

// extras
if (docspec.allow_extra_sections === false) {
  const claimed = new Set(matchedIndex.values());
  sections.forEach((s, i) => {
    if (!claimed.has(i)) err(`sections."${s.title}"`, "extra", "section not in docspec");
  });
}

// ---------- judge: whole document ----------
for (const p of docspec.must_match ?? [])
  if (!new RegExp(p, "m").test(body)) err("$", "must_match", `document does not match /${p}/`);
for (const p of docspec.must_not_match ?? [])
  if (new RegExp(p, "m").test(body)) err("$", "must_not_match", `document matches forbidden /${p}/`);

// placeholders: template vs instance
for (const p of docspec.placeholders ?? []) {
  const hits = body.match(new RegExp(p, "g")) ?? [];
  if (!asTemplate && hits.length > 0)
    err("$", "placeholders", `${hits.length} unfilled slot(s), e.g. ${hits[0]} — filled instances must contain none`);
  if (asTemplate && hits.length === 0)
    warnings.push({ path: "$", message: `template contains no /${p}/ slots; is the docspec's placeholder pattern right?` });
}

process.exit(report(`${file}`, errors, warnings));
