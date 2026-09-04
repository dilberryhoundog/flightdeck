// flightcrew/bin/cmd/evidence.mjs — renders the launch's evidence page: one self-contained HTML file holding every check's raw output and the run's unverified, quarantined, boundary, findings, phase, agent and failure lists.
// Usage: fc evidence; exit 0 when the page was written, 1 when no launch resolves or the page could not be written.

import fs from 'node:fs';
import path from 'node:path';
import { DASH, escapeHtml, listOrDash, loadLaunchData, preBlock } from '../../checks/lib/render-lib.mjs';
import { EXIT, ok, fail } from '../../checks/lib/output.mjs';

export const help = 'fc evidence                        render launch/<L>/evidence.html from everything the run has recorded';

/** The sections of the page, in the one order spec B37 fixes. Each shows '—' when it has nothing to show. */
export const SECTIONS = [
  'Unverified',
  'Quarantined',
  'Test-file changes',
  'Boundary',
  'Changed since lock',
  'Findings',
  'Phases',
  'Agents',
  'Failures',
];

/**
 * The page's whole stylesheet. It is inline, uses no url() and no @import, and states both colour schemes so the page
 * reads the same whichever the viewer's system prefers (spec B19: nothing external, ever).
 */
const STYLE = `
:root { color-scheme: light dark; --bg: #fbfbfa; --fg: #1b1b1a; --muted: #5f6360; --rule: #dcdcd8; --panel: #f2f2ef; --red: #8c2f24; --green: #1f6b3a; }
@media (prefers-color-scheme: dark) {
  :root { --bg: #16181a; --fg: #e6e6e3; --muted: #9aa0a0; --rule: #2c3033; --panel: #1e2124; --red: #e2857a; --green: #7fc79a; }
}
* { box-sizing: border-box; }
body { margin: 0; padding: 1.5rem; background: var(--bg); color: var(--fg); font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif; }
main { max-width: 60rem; margin: 0 auto; }
h1 { font-size: 1.4rem; margin: 0 0 0.5rem; }
h2 { font-size: 1.05rem; margin: 2rem 0 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid var(--rule); }
h3 { font-size: 0.95rem; margin: 1.25rem 0 0.35rem; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
p.meta { margin: 0.2rem 0; color: var(--muted); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.85rem; }
table { border-collapse: collapse; width: 100%; margin: 0.25rem 0; }
th, td { text-align: left; padding: 0.25rem 0.6rem 0.25rem 0; border-bottom: 1px solid var(--rule); vertical-align: top; font-size: 0.9rem; }
th { color: var(--muted); font-weight: 600; }
td.num { text-align: right; padding-right: 1.2rem; font-variant-numeric: tabular-nums; }
pre { background: var(--panel); border: 1px solid var(--rule); border-radius: 4px; padding: 0.6rem 0.8rem; overflow-x: auto; white-space: pre; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 0.82rem; }
.pass { color: var(--green); }
.fail, .error { color: var(--red); }
ul { margin: 0.25rem 0; padding-left: 1.2rem; }
`;

// ── small helpers ────────────────────────────────────────────────────────────

const esc = (value) => escapeHtml(value === undefined || value === null ? '' : String(value));

function paragraph(text) {
  return `<p>${esc(text)}</p>`;
}

function list(items) {
  const kept = (items ?? []).filter((item) => item !== undefined && item !== null && String(item).trim() !== '');
  if (kept.length === 0) return '';
  return `<ul>\n${kept.map((item) => `  <li>${esc(item)}</li>`).join('\n')}\n</ul>`;
}

/** A table with a header row and one row per entry; cells marked num are right-aligned. Empty rows render nothing. */
function table(headers, rows) {
  if (!Array.isArray(rows) || rows.length === 0) return '';
  const head = headers.map((h) => `<th>${esc(h.label ?? h)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell, index) => `<td${headers[index]?.num ? ' class="num"' : ''}>${esc(cell)}</td>`).join('')}</tr>`)
    .join('\n');
  return `<table>\n<thead><tr>${head}</tr></thead>\n<tbody>\n${body}\n</tbody>\n</table>`;
}

function section(heading, body) {
  const content = String(body ?? '').trim();
  return `<h2>${esc(heading)}</h2>\n${content === '' ? DASH : content}`;
}

const idsOf = (list) => (Array.isArray(list) ? list.map((entry) => (typeof entry === 'string' ? entry : entry?.id)).filter(Boolean) : []);

// ── the section bodies ───────────────────────────────────────────────────────

function boundaryBody(data) {
  if (!data.boundary) return '';
  const changed = Array.isArray(data.boundary.changed) ? data.boundary.changed : [];
  const outside = new Set(Array.isArray(data.boundary.outside) ? data.boundary.outside.map((entry) => (typeof entry === 'string' ? entry : entry?.path)) : []);
  const lockedPaths = new Set(Array.isArray(data.locked?.locked) ? data.locked.locked.map((entry) => (typeof entry === 'string' ? entry : entry?.path)) : []);
  const rows = changed.map((entry) => [
    entry.path,
    outside.has(entry.path) ? 'outside' : 'inside',
    lockedPaths.has(entry.path) ? 'locked' : '',
  ]);
  return [
    `<p class="meta">base: ${esc(data.boundary.base ?? DASH)} · outside: ${outside.size} · locked: ${lockedPaths.size}</p>`,
    outside.size > 0 ? list([...outside]) : '',
    table(['path', 'boundary', 'lock'], rows),
  ].filter(Boolean).join('\n');
}

function changedBody(data) {
  const changed = Array.isArray(data.boundary?.changed) ? data.boundary.changed : [];
  if (changed.length === 0) return '';
  const rows = changed.map((entry) => [entry.path, String(entry.added ?? 0), String(entry.removed ?? 0)]);
  return table(['path', { label: 'added', num: true }, { label: 'removed', num: true }], rows);
}

function findingsBody(data) {
  const newest = data.passes[data.passes.length - 1];
  const findings = Array.isArray(newest?.doc?.findings) ? newest.doc.findings : [];
  if (findings.length === 0) return '';
  const resolutions = data.resolutions ?? {};
  const rows = findings.map((finding) => {
    const resolution = resolutions[finding.id] ?? null;
    return [
      finding.id,
      finding.kind,
      finding.severity,
      finding.spec_ref ?? '',
      `${finding.file ?? ''}${finding.line ? `:${finding.line}` : ''}`,
      resolution?.state ?? finding.state ?? '',
      finding.text ?? '',
    ];
  });
  return [
    `<p class="meta">pass ${esc(newest.pass)} · verdict ${esc(newest.doc?.verdict ?? '')}</p>`,
    table(['finding', 'kind', 'severity', 'spec', 'where', 'state', 'text'], rows),
  ].join('\n');
}

function phasesBody(data) {
  const rows = data.events
    .filter((event) => event?.event === 'phase' || event?.event === 'gate' || event?.event === 'launch_end')
    .map((event) => [
      event.ts ?? '',
      event.event,
      event.event === 'phase'
        ? `${event.detail?.from ?? ''} to ${event.detail?.to ?? ''}${event.detail?.forced ? ' (forced)' : ''}`
        : event.event === 'gate'
          ? `${event.detail?.gate ?? ''} ${event.detail?.decision ?? ''}`
          : `${event.detail?.outcome ?? ''}`,
      event.source ?? '',
    ]);
  return table(['when', 'event', 'detail', 'source'], rows);
}

function agentsBody(data) {
  const agents = new Map();
  for (const event of data.events) {
    const id = event?.agent_id;
    if (!id) continue;
    const entry = agents.get(id) ?? { id, type: event.agent_type ?? '', started: null, stopped: null, tokens: 0 };
    if (event.agent_type) entry.type = event.agent_type;
    if (event.event === 'SubagentStart' && !entry.started) entry.started = event.ts ?? '';
    if (event.event === 'SubagentStop') entry.stopped = event.ts ?? '';
    if (event.event === 'usage') {
      entry.tokens += Number(event.detail?.input_tokens ?? 0) + Number(event.detail?.output_tokens ?? 0);
    }
    agents.set(id, entry);
  }
  const rows = [...agents.values()].map((entry) => [
    entry.id,
    entry.type,
    entry.started ?? '',
    entry.stopped ?? '',
    entry.tokens > 0 ? String(entry.tokens) : '',
  ]);
  return table(['agent', 'role', 'started', 'stopped', 'tokens'], rows);
}

const FAILURE_EVENTS = ['PostToolUseFailure', 'PermissionDenied', 'stop_block', 'stall', 'trigger', 'escalation', 'lock_denied', 'boundary_denied'];

function failuresBody(data) {
  const rows = data.events
    .filter((event) => FAILURE_EVENTS.includes(event?.event))
    .map((event) => [event.ts ?? '', event.event, JSON.stringify(event.detail ?? {})]);
  const parts = [];
  if (data.unparseable > 0) parts.push(`<p class="meta">unparseable: ${data.unparseable}</p>`);
  const rendered = table(['when', 'event', 'detail'], rows);
  if (rendered) parts.push(rendered);
  return parts.join('\n');
}

function checksBody(data) {
  if (data.results.length === 0) return `<h2>Checks</h2>\n${DASH}`;
  const blocks = data.results.map(({ id, doc }) => {
    const lines = [
      `$ ${doc.command}`,
      `exit: ${doc.exit === null || doc.exit === undefined ? 'null' : doc.exit}`,
      ...(Array.isArray(doc.stdout_tail) ? doc.stdout_tail : []),
      ...(Array.isArray(doc.stderr_tail) ? doc.stderr_tail : []),
    ];
    const verdict = String(doc.verdict ?? '');
    return [
      `<h3>${esc(id)} <span class="${esc(verdict)}">${esc(verdict)}</span></h3>`,
      `<p class="meta">ran ${esc(doc.ran_at ?? '')} at ${esc(doc.commit ?? '')} in phase ${esc(doc.phase ?? '')} · ${esc(doc.duration_ms ?? 0)} ms · covers ${esc(listOrDash(doc.covers))}</p>`,
      preBlock(lines),
    ].join('\n');
  });
  return `<h2>Checks</h2>\n${blocks.join('\n')}`;
}

// ── the page ─────────────────────────────────────────────────────────────────

/** The whole page as text, from the launch data the loader returns. Pure: every timestamp is passed in. */
export function page(data, { renderedAt }) {
  const launch = data.launch ?? {};
  const counts = data.summary?.counts ?? null;
  const lastEvent = data.events.length > 0 ? data.events[data.events.length - 1] : null;
  const verifier = data.verifiers[data.verifiers.length - 1]?.doc ?? null;
  const bodies = {
    Unverified: list(idsOf(data.summary?.unverified)),
    Quarantined: list(idsOf(data.summary?.quarantined)),
    'Test-file changes': list(verifier?.test_file_changes ?? []),
    Boundary: boundaryBody(data),
    'Changed since lock': changedBody(data),
    Findings: findingsBody(data),
    Phases: phasesBody(data),
    Agents: agentsBody(data),
    Failures: failuresBody(data),
  };
  const header = [
    `<h1>Evidence · ${esc(data.name)}</h1>`,
    `<p class="meta">launch: ${esc(data.name)} · spec: ${esc(launch.spec?.name ?? DASH)} v${esc(launch.spec?.version ?? '?')} @ ${esc(launch.spec?.commit ?? 'draft')} · status: ${esc(launch.status ?? DASH)}</p>`,
    `<p class="meta">phase: ${esc(launch.phase ?? DASH)} · last event: ${esc(lastEvent?.ts ?? DASH)} · rendered: ${esc(renderedAt)}</p>`,
    `<p class="meta">checks: ${counts ? `${counts.pass} pass · ${counts.fail} fail · ${counts.error} error · ${counts.skipped} skipped` : 'not run'}${data.summary?.commit ? ` at ${esc(data.summary.commit)}` : ''}</p>`,
  ].join('\n');
  const body = SECTIONS.map((heading) => section(heading, bodies[heading])).join('\n');
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>Evidence · ${esc(data.name)}</title>`,
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    '<main>',
    header,
    body,
    checksBody(data),
    '</main>',
    '</body>',
    '</html>',
    '',
  ].join('\n');
}

/** Writes launch/<L>/evidence.html for a launch folder and returns the path. Called by every command that changes evidence. */
export function render(launchDir) {
  const data = loadLaunchData(launchDir);
  const file = path.join(launchDir, 'evidence.html');
  fs.mkdirSync(launchDir, { recursive: true });
  fs.writeFileSync(file, page(data, { renderedAt: new Date().toISOString() }));
  return file;
}

export async function run(args, ctx) {
  if (args.length > 0) {
    fail(`fc evidence: unexpected argument ${args[0]}`);
    return process.exit(EXIT.usage);
  }
  const launch = ctx?.launch;
  if (!launch?.dir) {
    fail('no active launch');
    return process.exit(EXIT.usage);
  }
  let file;
  try {
    file = render(launch.dir);
  } catch (error) {
    fail(`evidence: the page could not be written: ${error.message}`);
    return process.exit(EXIT.usage);
  }
  ok(`evidence: ${path.relative(ctx.root ?? launch.dir, file)}`);
  return process.exit(EXIT.ok);
}
