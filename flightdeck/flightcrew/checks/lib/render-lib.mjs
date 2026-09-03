// flightcrew/checks/lib/render-lib.mjs — the rendering helpers every rendered document shares: HTML escaping, the '—' placeholder for an empty value, markdown tables, field lines, verbatim <pre> blocks, and fixed-order sections.
// Usage: import { escapeHtml, dash, listOrDash, mdTable, fieldLines, preBlock, inOrder, mdSections, htmlSections } from '<relative>/checks/lib/render-lib.mjs'.
//
// Exports: DASH; escapeHtml(text); dash(value); listOrDash(items, separator); mdCell(value); mdTable(headers, rows);
// fieldLines(pairs); preBlock(lines, { className }); inOrder(order, bodies); mdSections(sections); htmlSections(sections);
// loadLaunchData(dir) — the one loader the run report and the evidence page both read a launch folder through.
//
// The rendering helpers are pure: nothing in them reads the clock, the filesystem or the environment, so a caller that
// passes the same values twice gets byte-identical output (the rule fc plan render is held to). Timestamps and counts
// are arguments. An empty or absent value renders as the placeholder '—', which is what the report and the evidence
// page show for an empty list or section. loadLaunchData is the one exception: it reads the launch folder, and it is
// here so that the two documents can never disagree about what the run produced. Importing this module has no side
// effect.

import fs from 'node:fs';
import path from 'node:path';
import { readEvents } from './launch-lib.mjs';

/** The placeholder an empty value, list or section renders as. */
export const DASH = '—';

/** Text safe to put inside an HTML element or a double-quoted attribute. */
export function escapeHtml(text) {
  if (text === undefined || text === null) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function isEmpty(value) {
  if (value === undefined || value === null) return true;
  if (Array.isArray(value)) return value.length === 0;
  return String(value).trim() === '';
}

/** The value as a single-line string, or '—' when it is null, undefined, blank or an empty list. */
export function dash(value) {
  if (isEmpty(value)) return DASH;
  if (Array.isArray(value)) return value.map((item) => String(item).replace(/\s+/g, ' ').trim()).join(', ');
  return String(value).replace(/\s+/g, ' ').trim();
}

/** The items joined by the separator, or '—' when there are none. Order is the caller's; nothing is sorted here. */
export function listOrDash(items, separator = ', ') {
  const list = (Array.isArray(items) ? items : [items]).filter((item) => !isEmpty(item));
  if (list.length === 0) return DASH;
  return list.map((item) => String(item).replace(/\s+/g, ' ').trim()).join(separator);
}

/** One markdown table cell: single-line, pipes escaped, '—' when empty. */
export function mdCell(value) {
  return dash(value).replace(/\\/g, '\\\\').replace(/\|/g, '\\|');
}

/**
 * A markdown table with one row per entry, in the order given. Rows shorter than the header are padded with '—' and
 * longer rows are truncated, so a table never loses its column alignment. An empty row list still renders the header.
 */
export function mdTable(headers, rows) {
  const head = (Array.isArray(headers) ? headers : []).map((h) => mdCell(h));
  if (head.length === 0) return '';
  const body = (Array.isArray(rows) ? rows : []).map((row) => {
    const cells = (Array.isArray(row) ? row : [row]).map((cell) => mdCell(cell));
    while (cells.length < head.length) cells.push(DASH);
    return cells.slice(0, head.length);
  });
  const width = head.map((cell, column) => Math.max(cell.length, ...body.map((row) => row[column].length), 3));
  const line = (cells) => `| ${cells.map((cell, column) => cell.padEnd(width[column])).join(' | ')} |`;
  const rule = `| ${width.map((w) => '-'.repeat(w)).join(' | ')} |`;
  return [line(head), rule, ...body.map(line)].join('\n');
}

/** One '<field>: <value>' line per pair, in the order given, with '—' for an empty value. Pairs may be an object. */
export function fieldLines(pairs) {
  const entries = Array.isArray(pairs) ? pairs : Object.entries(pairs ?? {});
  return entries.map(([field, value]) => `${field}: ${dash(value)}`).join('\n');
}

/**
 * A <pre> element holding the lines verbatim, escaped: the form the evidence page quotes a check's command, its exit
 * code and its output tails in. No line is wrapped, reordered or trimmed. No lines renders as the placeholder.
 */
export function preBlock(lines, { className = null } = {}) {
  const list = (Array.isArray(lines) ? lines : [lines])
    .filter((line) => line !== undefined && line !== null)
    .flatMap((line) => String(line).split('\n'));
  const attribute = className ? ` class="${escapeHtml(className)}"` : '';
  if (list.length === 0) return `<pre${attribute}>${DASH}</pre>`;
  return `<pre${attribute}>${list.map((line) => escapeHtml(line)).join('\n')}</pre>`;
}

/**
 * The sections of a document in the one order the interface fixes: order is the list of headings, bodies maps each
 * heading to its content. Every heading of the order appears exactly once, in that position, with the placeholder for
 * a heading whose body is empty; a body under a heading the order does not name is an error, because a renderer that
 * invents a section no longer matches the document's stated shape.
 */
export function inOrder(order, bodies = {}) {
  const headings = Array.isArray(order) ? order : [];
  const map = bodies instanceof Map ? bodies : new Map(Object.entries(bodies ?? {}));
  for (const heading of map.keys()) {
    if (!headings.includes(heading)) throw new Error(`render: '${heading}' is not one of the fixed headings`);
  }
  return headings.map((heading) => {
    const body = map.get(heading);
    return { heading, body: isEmpty(body) ? DASH : (Array.isArray(body) ? body.join('\n') : String(body)) };
  });
}

/** Markdown for the sections of inOrder(): each heading, a blank line, its body, a blank line. Newline-terminated. */
export function mdSections(sections) {
  const blocks = (Array.isArray(sections) ? sections : []).map(({ heading, body }) => `${heading}\n\n${isEmpty(body) ? DASH : String(body).replace(/\n+$/, '')}\n`);
  return `${blocks.join('\n')}`;
}

/** HTML for the sections of inOrder(): an <h2> per heading and its body as given (already-escaped HTML). */
export function htmlSections(sections, { level = 2 } = {}) {
  const tag = `h${level}`;
  return (Array.isArray(sections) ? sections : [])
    .map(({ heading, body }) => `<${tag}>${escapeHtml(heading)}</${tag}>\n${isEmpty(body) ? DASH : String(body).replace(/\n+$/, '')}`)
    .join('\n');
}

// ── the one loader ───────────────────────────────────────────────────────────

function readJsonFile(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function readTextFile(file) {
  try {
    const text = fs.readFileSync(file, 'utf8');
    return text.trim() === '' ? null : text;
  } catch {
    return null;
  }
}

function entriesOf(dir) {
  try {
    return fs.readdirSync(dir).sort();
  } catch {
    return [];
  }
}

function numberIn(name) {
  const found = /(\d+)/.exec(String(name));
  return found ? Number(found[1]) : 0;
}

/**
 * Everything a launch folder holds, read once and shared by the run report and the evidence page so the two documents
 * can never disagree. Every part is optional: an absent or unreadable file reads as null (or an empty list), which is
 * what the two documents render as their placeholder. Nothing here writes, and nothing here decides how a value is
 * shown — that is each document's own business.
 *
 * Returns { dir, name, launch, plan, notes, kickoff, summary, results, boundary, locked, budget, events, unparseable,
 * units, explorers, verifiers, passes, resolutions, escalation }, where results is [{ id, doc }] in numeric T order,
 * units is [{ unit, doc }] in filename order, and passes is [{ pass, doc }] in numeric order.
 */
export function loadLaunchData(dir) {
  const at = (...parts) => path.join(dir, ...parts);
  const launch = readJsonFile(at('launch.json'));
  const evidenceDir = at('evidence');
  const results = entriesOf(evidenceDir)
    .filter((name) => /^T\d+\.json$/.test(name))
    .map((name) => ({ id: name.slice(0, -5), doc: readJsonFile(path.join(evidenceDir, name)) }))
    .filter((entry) => entry.doc !== null)
    .sort((a, b) => numberIn(a.id) - numberIn(b.id));
  const returnsDir = at('returns');
  const returnFiles = entriesOf(returnsDir).filter((name) => name.endsWith('.json'));
  const units = returnFiles
    .filter((name) => !name.startsWith('explore-') && !name.startsWith('verify-'))
    .map((name) => ({ unit: name.slice(0, -5), doc: readJsonFile(path.join(returnsDir, name)) }))
    .filter((entry) => entry.doc !== null);
  const explorers = returnFiles
    .filter((name) => name.startsWith('explore-'))
    .map((name) => ({ id: name.slice('explore-'.length, -5), doc: readJsonFile(path.join(returnsDir, name)) }))
    .filter((entry) => entry.doc !== null);
  const verifiers = returnFiles
    .filter((name) => name.startsWith('verify-') && name.endsWith('.json'))
    .map((name) => ({ pass: numberIn(name), doc: readJsonFile(path.join(returnsDir, name)) }))
    .filter((entry) => entry.doc !== null)
    .sort((a, b) => a.pass - b.pass);
  const reviewDir = at('review');
  const passes = entriesOf(reviewDir)
    .filter((name) => /^pass-\d+\.json$/.test(name))
    .map((name) => ({ pass: numberIn(name), doc: readJsonFile(path.join(reviewDir, name)) }))
    .filter((entry) => entry.doc !== null)
    .sort((a, b) => a.pass - b.pass);
  const { events, unparseable } = readEvents(dir);
  return {
    dir,
    name: launch?.name ?? path.basename(dir),
    launch,
    plan: readJsonFile(at('plan.json')),
    notes: readTextFile(at('notes.md')),
    kickoff: readTextFile(at('kickoff.md')),
    summary: readJsonFile(path.join(evidenceDir, 'summary.json')),
    results,
    boundary: readJsonFile(path.join(evidenceDir, 'boundary.json')),
    locked: readJsonFile(path.join(evidenceDir, 'locked.json')),
    budget: readJsonFile(path.join(evidenceDir, 'budget.json')),
    events,
    unparseable,
    units,
    explorers,
    verifiers,
    passes,
    resolutions: readJsonFile(path.join(reviewDir, 'resolutions.json')),
    escalation: readJsonFile(at('escalation.json')),
  };
}
