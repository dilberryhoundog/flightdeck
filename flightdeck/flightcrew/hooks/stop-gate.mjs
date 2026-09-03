// flightcrew/hooks/stop-gate.mjs — holds the turn at the end of a phase whose work has a gate: the acceptance check in verify, the contracts unit's checks and the boundary in contracts; counts consecutive blocks and stalls at the ceiling.
// Usage: wired by hooks/settings.fragment.json as: node "$CLAUDE_PROJECT_DIR"/flightdeck/flightcrew/hooks/stop-gate.mjs (stdin: the Stop envelope, timeout 600); exits 0 when the gate is green, released or silent, 2 when it blocks.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runHook, record, log, err, tailLines, readEscalation, readEvents } from './lib.mjs';

/** The gate each gated phase runs; every other phase is a no-op. */
const GATE_FOR = { verify: 'acceptance-gate', contracts: 'contracts-gate' };

/** The hard ceiling on consecutive blocks, whatever a launch's own ceiling says (design section 4). */
const MAX_BLOCKS = 8;
const TAIL = 20;

function readJsonFile(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Consecutive stop_block events since the newest passing check_run, escalation, gate or phase event. */
function consecutiveBlocks(events) {
  let blocks = 0;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event?.event === 'stop_block') {
      blocks += 1;
    } else if (['gate', 'phase', 'escalation'].includes(event?.event)) {
      break;
    } else if (event?.event === 'check_run' && event?.detail?.verdict === 'pass') {
      break;
    }
  }
  return blocks;
}

/** The gate module for a phase, or null with the reason it could not be used. */
async function loadGate(name) {
  const url = new URL(`../checks/gates/${name}.mjs`, import.meta.url);
  if (!fs.existsSync(fileURLToPath(url))) return { gate: null, reason: `${name}.mjs is not installed under flightcrew/checks/gates` };
  let module;
  try {
    module = await import(url.href);
  } catch (error) {
    return { gate: null, reason: `${name}.mjs could not be loaded: ${error?.message ?? error}` };
  }
  if (typeof module.run !== 'function') return { gate: null, reason: `${name}.mjs exports no run(context) function` };
  return { gate: module.run, reason: null };
}

/** One blocking item as the lines the session is shown: '<id> exit <code>' and the last 20 lines of its output. */
function blockLines(item) {
  const code = Number.isInteger(item.code) ? item.code : 'non-zero';
  return [`${item.id} exit ${code}`, ...tailLines(item.output, TAIL)];
}

await runHook('stop-gate', async (ctx) => {
  if (ctx.input.hook_event_name !== 'Stop') return 0;
  if (!ctx.launch) {
    if (ctx.ambiguity) log(ctx, `the launch could not be resolved (${ctx.ambiguity.kind}); the gate did not run`);
    return 0;
  }
  const launch = ctx.launch.json ?? {};
  const phase = launch.phase;
  const gateName = GATE_FOR[phase];
  if (!gateName) return 0;

  if (readEscalation(ctx.launch.dir)) {
    record(ctx, 'stop_release', { reason: 'an escalation is open' });
    return 0;
  }

  const pin = launch.tests_map;
  if (!pin || typeof pin.path !== 'string' || pin.path.trim() === '') {
    log(ctx, `no tests map is pinned; the ${phase} gate did not run`);
    return 0;
  }
  const mapPath = path.resolve(ctx.launch.dir, pin.path);
  const map = readJsonFile(mapPath);
  if (!map) {
    log(ctx, `the pinned tests map ${pin.path} is missing or unreadable; the ${phase} gate did not run`);
    return 0;
  }

  const { gate, reason } = await loadGate(gateName);
  if (!gate) {
    log(ctx, `${reason}; the ${phase} gate did not run`);
    return 0;
  }

  const planPath = path.join(ctx.launch.dir, 'plan.json');
  let result;
  try {
    result = await gate({
      root: ctx.root,
      launchDir: ctx.launch.dir,
      launch: ctx.launch.name,
      launchJson: launch,
      phase,
      map,
      mapPath,
      plan: readJsonFile(planPath),
      planPath,
      tail: TAIL,
      env: process.env,
    });
  } catch (error) {
    log(ctx, `${gateName} failed: ${error?.message ?? error}; the ${phase} gate did not run`);
    return 0;
  }
  if (!result || result.ran === false) {
    log(ctx, `${gateName} could not run: ${result?.reason ?? 'no reason given'}`);
    return 0;
  }

  const checks = Array.isArray(result.checks) ? result.checks : [];
  const extra = Array.isArray(result.extra) ? result.extra : [];
  const blocking = [...checks, ...extra].filter((item) => item?.blocking);
  if (blocking.length === 0) {
    for (const check of checks) record(ctx, 'check_run', { id: check.id, verdict: check.verdict });
    return 0;
  }

  const ids = blocking.map((item) => item.id).filter((id) => typeof id === 'string' && id !== '');
  const blocks = consecutiveBlocks(readEvents(ctx.launch.dir).events);
  const cap = Math.min(Number.isInteger(launch.ceilings?.stop_blocks) ? launch.ceilings.stop_blocks : MAX_BLOCKS, MAX_BLOCKS);
  const count = blocks + 1;

  if (count >= cap) {
    const detail = `${ids.join(', ') || 'the gate'} still red after ${blocks} consecutive stop blocks in phase ${phase}`;
    record(ctx, 'stall', { blocks });
    record(ctx, 'trigger', { name: 'stop-gate stall', detail });
    err(`stall: ${detail}; the gate is releasing the turn. Escalate with fc launch escalate, or end the launch.\n`);
    return 0;
  }

  record(ctx, 'stop_block', { count, checks: ids });
  err(`${blocking.flatMap(blockLines).join('\n')}\n`);
  return 2;
});
