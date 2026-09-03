// flightcrew/bin/cmd/report.mjs — renders the run report: the eight fixed sections of what the run checked, what a critic reviewed and what a human stated, each with its provenance mark and its placeholder when its input is absent.
// Usage: fc report; exit 0 when report.md was written, 1 when no launch resolves or the file could not be written.

import fs from 'node:fs';
import path from 'node:path';
import { worktreeList } from '../../checks/lib/git-lib.mjs';
import { DASH, dash, listOrDash, loadLaunchData, mdSections, mdTable } from '../../checks/lib/render-lib.mjs';
import { EXIT, ok, fail } from '../../checks/lib/output.mjs';

export const help = 'fc report                          render launch/<L>/report.md from the plan, the returns, the evidence and the events';

/** The eight headings of spec I12, in order, each carrying the provenance of what it holds. */
export const HEADINGS = [
  '## Ledger [checked · reviewed · stated]',
  '## Verification [checked]',
  '## Review [reviewed]',
  '## Phases [recorded · stated]',
  '## Agents [recorded · stated]',
  '## Failures and interventions [recorded]',
  '## Orchestrator notes [stated]',
];

/** What the Phases, Agents and Failures sections read when the launch recorded no events at all. */
const NO_EVENTS = 'no events recorded';
/** What the Verification and Review sections read when their input file was never written. */
const NOT_RUN = 'not run';

const FAILURE_EVENTS = ['PostToolUseFailure', 'PermissionDenied', 'escalation', 'trigger', 'stall', 'stop_block', 'lock_denied', 'boundary_denied'];

// ── counting the events ──────────────────────────────────────────────────────

function timeOf(event) {
  const parsed = Date.parse(event?.ts ?? '');
  return Number.isFinite(parsed) ? parsed : null;
}

/** The cost line's four numbers: agents spawned, stop blocks, wall-clock minutes and tokens where usage was observed. */
function costOf(events) {
  let agents = 0;
  let stopBlocks = 0;
  let tokens = null;
  let first = null;
  let last = null;
  for (const event of events) {
    if (event?.event === 'SubagentStart') agents += 1;
    if (event?.event === 'stop_block') stopBlocks += 1;
    if (event?.event === 'usage') {
      tokens = (tokens ?? 0) + Number(event.detail?.input_tokens ?? 0) + Number(event.detail?.output_tokens ?? 0);
    }
    const at = timeOf(event);
    if (at === null) continue;
    if (first === null || at < first) first = at;
    if (last === null || at > last) last = at;
  }
  const minutes = first === null || last === null ? 0 : Math.round((last - first) / 60000);
  return { agents, stopBlocks, minutes, tokens, first, last };
}

/** The phases the run passed through, in the order the phase events record them. */
function phasesOf(events, launch) {
  const seen = [];
  for (const event of events) {
    if (event?.event !== 'phase') continue;
    const from = event.detail?.from;
    const to = event.detail?.to;
    if (typeof from === 'string' && seen.length === 0) seen.push(from);
    if (typeof to === 'string' && seen[seen.length - 1] !== to) seen.push(to);
  }
  if (seen.length === 0 && typeof launch?.phase === 'string') seen.push(launch.phase);
  return seen;
}

/** Every unit a unit_merged event names, mapped to the commit that merged it. */
function mergedCommits(events) {
  const merged = new Map();
  for (const event of events) {
    if (event?.event === 'unit_merged' && typeof event.detail?.unit === 'string') {
      merged.set(event.detail.unit, event.detail.commit ?? '');
    }
  }
  return merged;
}

// ── the header ───────────────────────────────────────────────────────────────

function headerLines(data, cost, phases) {
  const launch = data.launch ?? {};
  const spec = launch.spec ?? {};
  const started = cost.first !== null ? new Date(cost.first).toISOString() : (launch.created ?? null);
  const lines = [
    `spec: ${dash(spec.name)} v${dash(spec.version)} @ ${spec.commit ?? 'draft'}    kickoff: ${dash(launch.kickoff?.version)}`,
    `started: ${dash(started)}    ended: ${dash(launch.ended)}    outcome: ${dash(launch.outcome)}`,
    `cost: ${cost.agents} agents · ${cost.stopBlocks} stop blocks · ${cost.minutes} minutes · ${cost.tokens === null ? 'not recorded' : `${cost.tokens} tokens`}`,
    `agents: ${cost.agents}    phases: ${phases.length > 0 ? phases.join(' → ') : DASH} [recorded]`,
  ];
  if (launch.allow_draft === true) lines.push('allow_draft: true');
  if (launch.landed && typeof launch.landed === 'object') {
    lines.push(`landed: ${dash(launch.landed.commit)} · ${dash(launch.landed.pr)} · ${dash(launch.landed.integration_check)}`);
  }
  const accepted = Array.isArray(launch.accepted_units) ? launch.accepted_units : [];
  const abandoned = Array.isArray(launch.abandoned_units) ? launch.abandoned_units : [];
  if (accepted.length > 0 || abandoned.length > 0) {
    lines.push(`accepted units: ${listOrDash(accepted)}    abandoned units: ${listOrDash(abandoned)}`);
  }
  return lines;
}

// ── the sections ─────────────────────────────────────────────────────────────

function verdictsFor(data, ids) {
  const byId = new Map((data.summary?.checks ?? []).map((entry) => [entry.id, entry.verdict]));
  return (Array.isArray(ids) ? ids : []).map((id) => `${id} ${byId.get(id) ?? 'not run'}`);
}

/**
 * One row per plan unit and the four lists below them. Without plan.json every list reads the placeholder and a line
 * reads 'plan: none', so a report of a run that never planned still has the shape a reader expects.
 */
function ledgerBody(data, root) {
  const merged = mergedCommits(data.events);
  const returns = new Map(data.units.map((entry) => [entry.unit, entry.doc]));
  const unverified = listOrDash(data.summary?.unverified ?? []);
  const discarded = [];
  for (const event of data.events) {
    if (event?.event !== 'WorktreeRemove') continue;
    const where = event.detail?.worktree_path;
    if (typeof where !== 'string' || where === '') continue;
    const owner = data.units.find((entry) => entry.doc?.worktree === where);
    const green = owner?.doc?.status === 'green' || (owner && merged.has(owner.unit));
    if (!green) discarded.push(where);
  }
  for (const tree of worktreeList(root)) {
    const where = path.relative(root, tree.path).split(path.sep).join('/');
    if (!where.startsWith('.claude/worktrees/') || discarded.includes(where)) continue;
    const owner = data.units.find((entry) => entry.doc?.worktree === where);
    if (!owner || !merged.has(owner.unit)) discarded.push(where);
  }

  if (!data.plan) {
    return [
      'plan: none',
      'units: —',
      'merged: —',
      'open: —',
      `unverified: ${unverified}`,
      `attempted and discarded: ${listOrDash(discarded)}`,
    ].join('\n');
  }
  const units = Array.isArray(data.plan.units) ? data.plan.units : [];
  const rows = units.map((unit) => {
    const stored = returns.get(unit.id) ?? null;
    return [
      unit.id,
      unit.kind ?? '',
      listOrDash(verdictsFor(data, unit.checks)),
      stored?.branch ?? '',
      merged.get(unit.id) ?? '',
      stored ? stored.status : 'not returned',
    ];
  });
  const open = units.filter((unit) => !merged.has(unit.id)).map((unit) => unit.id);
  return [
    mdTable(['unit', 'kind', 'checks', 'branch', 'merge commit', 'return'], rows),
    '',
    `merged: ${listOrDash([...merged.keys()])}`,
    `open: ${listOrDash(open)}`,
    `unverified: ${unverified}`,
    `attempted and discarded: ${listOrDash(discarded)}`,
  ].join('\n');
}

function verificationBody(data) {
  const counts = data.summary?.counts ?? null;
  const head = counts
    ? `checks: ${counts.pass} pass · ${counts.fail} fail · ${counts.error} error · ${counts.skipped} skipped${data.summary?.commit ? ` at ${data.summary.commit}` : ''}`
    : NOT_RUN;
  const verifier = data.verifiers[data.verifiers.length - 1]?.doc ?? null;
  const boundary = data.boundary
    ? `${(data.boundary.changed ?? []).length} changed · ${(data.boundary.outside ?? []).length} outside`
    : DASH;
  return [
    head,
    `unverified: ${counts ? listOrDash(data.summary?.unverified ?? []) : DASH}`,
    `quarantined: ${counts ? listOrDash(data.summary?.quarantined ?? []) : DASH}`,
    `test-file changes: ${listOrDash(verifier?.test_file_changes ?? [])}`,
    `diff boundary: ${boundary}`,
  ].join('\n');
}

function reviewBody(data) {
  if (data.passes.length === 0) return NOT_RUN;
  const resolutions = data.resolutions ?? {};
  const blocks = data.passes.map(({ pass, doc }) => {
    const findings = Array.isArray(doc?.findings) ? doc.findings : [];
    const rows = findings.map((finding) => {
      const resolution = resolutions[finding.id] ?? null;
      return [
        finding.id,
        finding.kind,
        finding.severity,
        finding.spec_ref,
        `${finding.file ?? ''}${finding.line ? `:${finding.line}` : ''}`,
        resolution?.state ?? finding.state,
        finding.text,
      ];
    });
    const head = `pass ${pass} · verdict ${dash(doc?.verdict)}`;
    return findings.length === 0 ? `${head}\n\n${DASH}` : `${head}\n\n${mdTable(['finding', 'kind', 'severity', 'spec', 'where', 'state', 'text'], rows)}`;
  });
  return blocks.join('\n\n');
}

function phasesBody(data) {
  if (data.events.length === 0) return NO_EVENTS;
  const rows = data.events
    .filter((event) => ['phase', 'gate', 'launch_end'].includes(event?.event))
    .map((event) => [
      event.ts,
      event.event,
      event.event === 'phase'
        ? `${dash(event.detail?.from)} to ${dash(event.detail?.to)}${event.detail?.forced ? ' (forced)' : ''}`
        : event.event === 'gate'
          ? `${dash(event.detail?.gate)} ${dash(event.detail?.decision)}`
          : dash(event.detail?.outcome),
      event.source === 'stated' ? 'stated' : 'recorded',
    ]);
  if (rows.length === 0) return DASH;
  return mdTable(['when', 'event', 'detail', 'provenance'], rows);
}

function agentsBody(data) {
  if (data.events.length === 0) return NO_EVENTS;
  const agents = new Map();
  for (const event of data.events) {
    const id = event?.agent_id ?? event?.detail?.agent_id;
    if (typeof id !== 'string' || id === '') continue;
    const entry = agents.get(id) ?? { id, type: '', turns: 0, tokens: null };
    if (typeof event.agent_type === 'string') entry.type = event.agent_type;
    if (event.event === 'SubagentStart' || event.event === 'SubagentStop') entry.turns += 1;
    if (event.event === 'usage') {
      entry.tokens = (entry.tokens ?? 0) + Number(event.detail?.input_tokens ?? 0) + Number(event.detail?.output_tokens ?? 0);
    }
    agents.set(id, entry);
  }
  if (agents.size === 0) return DASH;
  const rows = [...agents.values()].map((entry) => [entry.id, entry.type, entry.turns, entry.tokens === null ? 'unobserved' : entry.tokens]);
  return mdTable(['agent', 'role', 'events', 'tokens'], rows);
}

function failuresBody(data) {
  if (data.events.length === 0 && data.unparseable === 0) return NO_EVENTS;
  const rows = data.events
    .filter((event) => FAILURE_EVENTS.includes(event?.event))
    .map((event) => [event.ts, event.event, JSON.stringify(event.detail ?? {})]);
  const parts = [];
  if (data.unparseable > 0) parts.push(`unparseable: ${data.unparseable}`, '');
  if (rows.length > 0) parts.push(mdTable(['when', 'event', 'detail'], rows));
  else if (parts.length === 0) parts.push(DASH);
  return parts.join('\n');
}

// ── the document ─────────────────────────────────────────────────────────────

/** The whole report as text, from the launch data the loader returns. */
export function document(data, { root }) {
  const cost = costOf(data.events);
  const phases = phasesOf(data.events, data.launch);
  const title = `# Run report · ${dash(data.launch?.spec?.name)} · ${data.name}`;
  const sections = [
    { heading: HEADINGS[0], body: ledgerBody(data, root) },
    { heading: HEADINGS[1], body: verificationBody(data) },
    { heading: HEADINGS[2], body: reviewBody(data) },
    { heading: HEADINGS[3], body: phasesBody(data) },
    { heading: HEADINGS[4], body: agentsBody(data) },
    { heading: HEADINGS[5], body: failuresBody(data) },
    { heading: HEADINGS[6], body: data.notes ? data.notes.replace(/\n+$/, '') : '(none recorded)' },
  ];
  return `${[title, ...headerLines(data, cost, phases)].join('\n')}\n\n${mdSections(sections)}`;
}

/** Writes launch/<L>/report.md for a launch folder and returns the path. */
export function render(launchDir, ctx = {}) {
  const data = loadLaunchData(launchDir);
  const file = path.join(launchDir, 'report.md');
  fs.mkdirSync(launchDir, { recursive: true });
  fs.writeFileSync(file, document(data, { root: ctx.root ?? path.resolve(launchDir, '..', '..', '..') }));
  return file;
}

export async function run(args, ctx) {
  if (args.length > 0) {
    fail(`fc report: unexpected argument ${args[0]}`);
    return EXIT.usage;
  }
  const launch = ctx?.launch;
  if (!launch?.dir) {
    fail('no active launch');
    return EXIT.usage;
  }
  let file;
  try {
    file = render(launch.dir, ctx);
  } catch (error) {
    fail(`report: the run report could not be written: ${error.message}`);
    return EXIT.usage;
  }
  ok(`report: ${path.relative(ctx.root ?? launch.dir, file)}`);
  return EXIT.ok;
}
