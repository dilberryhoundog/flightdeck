// flightcrew/bin/cmd/events.mjs — fc events: appends one event line to the launch's events.jsonl, records a usage event, or summarises the file by event, by agent and by unparseable line.
// Usage: node flightdeck/flightcrew/bin/fc.mjs events append <json> [--stated] | events usage <json> | events summary; exit 0 on success, 1 on a usage or environment error.
//
// An appended line is completed by launch-lib: ts (now), launch and phase (from launch.json) and source ('fc', or
// 'stated' when --stated says a human is recording something that happened outside the hooks). The summary is a
// listing, so it prints more than one line; it counts a line that is not JSON rather than failing on it (spec E4),
// and treats an absent events file as empty (spec E21).

import { appendEvent, readEvents } from '../../checks/lib/launch-lib.mjs';
import { EXIT, fail, json, ok, print } from '../../checks/lib/output.mjs';
import { parseFlags, UsageError } from '../fc.mjs';

export const help = 'fc events append <json> [--stated] | fc events usage <json> | fc events summary';

const SUBCOMMANDS = ['append', 'usage', 'summary'];

function parsePayload(text, what) {
  if (text === undefined || text === null || String(text).trim() === '') throw new UsageError(`fc events ${what} needs a JSON object`);
  let parsed;
  try {
    parsed = JSON.parse(String(text));
  } catch (error) {
    throw new UsageError(`fc events ${what}: the argument is not valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new UsageError(`fc events ${what} needs a JSON object`);
  return parsed;
}

function tally(list) {
  const counts = new Map();
  for (const name of list) counts.set(name, (counts.get(name) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
}

function summarise(dir) {
  const { events, unparseable } = readEvents(dir);
  const byEvent = tally(events.map((event) => String(event?.event ?? '(unnamed)')));
  const agents = new Map();
  for (const event of events) {
    const id = event?.agent_id ?? event?.detail?.agent_id;
    if (!id) continue;
    const entry = agents.get(String(id)) ?? { count: 0, type: null };
    entry.count += 1;
    if (!entry.type && event?.agent_type) entry.type = String(event.agent_type);
    agents.set(String(id), entry);
  }
  const byAgent = [...agents.entries()].sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return { total: events.length, unparseable, byEvent, byAgent };
}

export async function run(args, ctx) {
  const [sub, ...rest] = args;
  if (!sub || !SUBCOMMANDS.includes(sub)) {
    fail([`fc events: expected one of ${SUBCOMMANDS.join(', ')}`, help]);
    return EXIT.usage;
  }
  const dir = ctx.launch.dir;

  if (sub === 'summary') {
    const { positional } = parseFlags(rest, {});
    if (positional.length > 0) throw new UsageError(`fc events summary takes no arguments; got ${positional.join(' ')}`);
    const report = summarise(dir);
    if (ctx.json) {
      json({
        launch: ctx.launch.name,
        total: report.total,
        unparseable: report.unparseable,
        by_event: Object.fromEntries(report.byEvent),
        by_agent: Object.fromEntries(report.byAgent.map(([id, entry]) => [id, entry.count])),
      });
      return EXIT.ok;
    }
    print(`events: ${report.total}`);
    print(`unparseable: ${report.unparseable}`);
    print('by event:');
    if (report.byEvent.length === 0) print('  —');
    for (const [name, count] of report.byEvent) print(`  ${name}  ${count}`);
    print('by agent:');
    if (report.byAgent.length === 0) print('  —');
    for (const [id, entry] of report.byAgent) print(`  ${id}${entry.type ? ` (${entry.type})` : ''}  ${entry.count}`);
    return EXIT.ok;
  }

  const { positional, flags } = parseFlags(rest, { stated: 'boolean' });
  const payload = parsePayload(positional[0], sub);

  if (sub === 'usage') {
    const line = appendEvent(dir, {
      event: 'usage',
      agent_id: payload.agent_id ?? null,
      source: flags.stated ? 'stated' : 'fc',
      detail: payload,
    });
    ok(`usage recorded at ${line.ts}`);
    return EXIT.ok;
  }

  if (typeof payload.event !== 'string' || payload.event.trim() === '') {
    throw new UsageError('fc events append needs an object carrying an event name');
  }
  const line = appendEvent(dir, {
    ts: payload.ts,
    event: payload.event,
    launch: payload.launch,
    phase: payload.phase,
    source: flags.stated ? 'stated' : (payload.source ?? 'fc'),
    session_id: payload.session_id,
    agent_id: payload.agent_id,
    agent_type: payload.agent_type,
    detail: payload.detail,
  });
  ok(`${line.event} recorded at ${line.ts}`);
  return EXIT.ok;
}
