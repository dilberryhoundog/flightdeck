// flightcrew/bin/cmd/budget.mjs — fc budget: counts what the run has spent beside the ceilings launch.json declares, writes evidence/budget.json, and fires an abandon trigger when a count passes a ceiling.
// Usage: node flightdeck/flightcrew/bin/fc.mjs budget [--launch <name>] [--json]; exit 0 within every ceiling, 2 when one is exceeded, 1 on a usage or environment error.
//
// Counters and their sources (design section 4): agents from SubagentStart events; stop blocks from stop_block events;
// consecutive stop blocks from the stop_block events after the newest passing check_run, escalation, gate or phase
// event; critic passes from review/pass-*.json; minutes from the first and last timestamps of the events recorded as
// the run happened (usage events, which are entered out of band, are outside the span); tokens from usage
// events, reported as 'unobserved' when no usage event was ever recorded; tool failures, permission denials and
// compactions from PostToolUseFailure, PermissionDenied and PreCompact. A counter whose ceiling is null is reported
// and never enforced, and 'unobserved' is never compared to anything.

import fs from 'node:fs';
import path from 'node:path';
import { appendEvent, bestEffortRender, readEvents } from '../../checks/lib/launch-lib.mjs';
import { EXIT, fail, json, ok } from '../../checks/lib/output.mjs';
import { writeJsonFile } from '../fc.mjs';

export const help = 'fc budget — counts beside the ceilings; exit 2 and a trigger event when one is exceeded.';

/** The counters whose ceiling comes from a differently named field of launch.json.ceilings. */
const CEILING_OF = {
  agents: 'agents',
  stop_blocks: 'stop_blocks',
  consecutive_stop_blocks: 'gate_iterations',
  critic_passes: 'critic_passes',
  minutes: 'minutes',
  tokens: 'tokens',
};

const CLEARS_CONSECUTIVE = ['escalation', 'gate', 'phase'];

function millis(event) {
  const parsed = Date.parse(event?.ts ?? '');
  return Number.isFinite(parsed) ? parsed : null;
}

/** The index of the newest event that ends a run of stop blocks, or -1 when none has happened yet. */
function lastClearIndex(events) {
  let found = -1;
  events.forEach((event, index) => {
    if (CLEARS_CONSECUTIVE.includes(event?.event)) found = index;
    else if (event?.event === 'check_run' && event?.detail?.verdict === 'pass') found = index;
  });
  return found;
}

function criticPasses(launchDir) {
  try {
    return fs.readdirSync(path.join(launchDir, 'review')).filter((name) => /^pass-\d+\.json$/.test(name)).length;
  } catch {
    return 0;
  }
}

/**
 * The wall clock of the run: the span from the first to the last event that happened while the run was happening.
 * `usage` events are left out of the span because they are the one kind recorded out of band — token and cost
 * accounting is entered after the fact with `fc events usage`, and a line entered a week later is not wall clock the
 * run spent. Every other event is stamped at the moment it happened, so the span is the run's own elapsed time.
 */
function minutesSpanned(events) {
  const stamps = events.filter((event) => event?.event !== 'usage').map(millis).filter((value) => value !== null);
  if (stamps.length === 0) return 0;
  return Math.floor((Math.max(...stamps) - Math.min(...stamps)) / 60000);
}

function tokensUsed(events) {
  const usage = events.filter((event) => event?.event === 'usage');
  if (usage.length === 0) return 'unobserved';
  let total = 0;
  for (const event of usage) {
    const input = Number(event?.detail?.input_tokens);
    const output = Number(event?.detail?.output_tokens);
    if (Number.isFinite(input)) total += input;
    if (Number.isFinite(output)) total += output;
  }
  return total;
}

/**
 * Every counter of design section 4 for one launch, each as { count, ceiling }: the shape evidence/budget.json holds
 * and the run report's cost line is built from. Reads the events file, the review folder and launch.json only.
 */
export function countBudget(launchDir, launchJson) {
  const { events } = readEvents(launchDir);
  const ceilings = launchJson?.ceilings ?? {};
  const clear = lastClearIndex(events);
  const countOf = (name) => events.filter((event) => event?.event === name).length;
  const raw = {
    agents: countOf('SubagentStart'),
    stop_blocks: countOf('stop_block'),
    consecutive_stop_blocks: events.slice(clear + 1).filter((event) => event?.event === 'stop_block').length,
    critic_passes: criticPasses(launchDir),
    minutes: minutesSpanned(events),
    tokens: tokensUsed(events),
    tool_failures: countOf('PostToolUseFailure'),
    permission_denials: countOf('PermissionDenied'),
    compactions: countOf('PreCompact'),
  };
  const counts = {};
  for (const [name, count] of Object.entries(raw)) {
    const key = CEILING_OF[name];
    const ceiling = key && ceilings[key] !== undefined ? ceilings[key] : null;
    counts[name] = { count, ceiling: typeof ceiling === 'number' ? ceiling : null };
  }
  return counts;
}

/** The counters that have passed their ceiling, as '<name> <count> above ceiling <ceiling>' phrases. */
export function exceededCeilings(counts) {
  const over = [];
  for (const [name, entry] of Object.entries(counts)) {
    if (typeof entry.ceiling !== 'number' || typeof entry.count !== 'number') continue;
    if (entry.count > entry.ceiling) over.push(`${name} ${entry.count} above ceiling ${entry.ceiling}`);
  }
  return over;
}

/** The one-line cost summary the run report and the run-log entry carry. */
export function costLine(counts) {
  const tokens = counts.tokens.count === 'unobserved' ? 'not recorded' : `${counts.tokens.count} tokens`;
  return `${counts.agents.count} agents · ${counts.stop_blocks.count} stop blocks · ${counts.minutes.count} minutes · ${tokens}`;
}

export async function run(args, ctx) {
  if (args.length > 0) {
    fail(`fc budget takes no arguments; got ${args.join(' ')}`);
    return EXIT.usage;
  }
  const dir = ctx.launch.dir;
  const counts = countBudget(dir, ctx.launch.json);
  const over = exceededCeilings(counts);
  const record = {
    ran_at: new Date().toISOString(),
    launch: ctx.launch.name,
    phase: ctx.launch.json?.phase ?? 'unknown',
    counts,
    exceeded: over,
  };
  writeJsonFile(path.join(dir, 'evidence', 'budget.json'), record);
  if (over.length > 0) {
    appendEvent(dir, { event: 'trigger', detail: { name: 'budget', detail: over.join('; ') } });
  }
  await bestEffortRender(dir);
  if (ctx.json) json(record);
  if (over.length > 0) {
    fail(`budget exceeded: ${over.join('; ')}`);
    return EXIT.blocked;
  }
  ok(`budget: ${costLine(counts)}`);
  return EXIT.ok;
}
