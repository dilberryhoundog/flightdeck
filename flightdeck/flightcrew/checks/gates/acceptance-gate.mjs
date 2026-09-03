// flightcrew/checks/gates/acceptance-gate.mjs — the gate of the verify phase: it runs the pinned tests map's acceptance check through fc check and reports whether that check holds the turn.
// Usage: node flightdeck/flightcrew/checks/gates/acceptance-gate.mjs (the launch comes from FLIGHTCREW_LAUNCH or the unique active one); exit 0 when the acceptance check passes, 2 when it fails or errors, 1 when no launch or no tests map can be resolved.
//
// Exports: run(context) → { ran, reason?, checks: [{ id, verdict, blocking, code, output }], extra: [] }, the shape
// the stop-gate hook loads a gate for; runFcCheck(context, ids) and evidenceFor(launchDir, id), which the other gates
// share; gateContext({ env, cwd }), which builds a context from the environment for the command-line form.
// The gate never decides what to do about a red check: it reports the verdict, the check's own exit code and the
// output the session is shown, and the caller decides whether to block, count or record. Importing this module has
// no side effect.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, ok } from '../lib/output.mjs';
import { readLaunch, resolveLaunch, resolveRoot } from '../lib/launch-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FC = path.resolve(HERE, '..', '..', 'bin', 'fc.mjs');
const MAX_BUFFER = 16 * 1024 * 1024;
const TIMEOUT_MS = 600_000;

/** The acceptance check of a launch: the map's own field, then the launch's, then T1 (spec B12, design 5.1). */
export function acceptanceId({ map = null, launchJson = null } = {}) {
  const fromMap = typeof map?.acceptance === 'string' ? map.acceptance : null;
  const fromLaunch = typeof launchJson?.acceptance === 'string' ? launchJson.acceptance : null;
  return fromMap || fromLaunch || 'T1';
}

/** Runs fc check over the named ids in the launch's root. Returns { code, stdout, stderr }; it never throws. */
export function runFcCheck(context, ids) {
  if (!fs.existsSync(FC)) {
    return { code: EXIT.usage, stdout: '', stderr: `fc is not installed at ${FC}\n` };
  }
  const env = { ...(context.env ?? process.env) };
  env.FLIGHTCREW_ROOT = context.root;
  if (context.launch) env.FLIGHTCREW_LAUNCH = context.launch;
  const result = spawnSync(process.execPath, [FC, 'check', ...ids.map(String)], {
    cwd: context.root,
    env,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    killSignal: 'SIGKILL',
  });
  const stderr = `${result.stderr ?? ''}${result.error ? `fc check could not be run: ${result.error.message}\n` : ''}`;
  return { code: typeof result.status === 'number' ? result.status : EXIT.usage, stdout: result.stdout ?? '', stderr };
}

/** The evidence document one check run left behind, or null when it wrote none. */
export function evidenceFor(launchDir, id) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(launchDir, 'evidence', `${id}.json`), 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** One check's evidence as the item a caller reports: the verdict, the check's own exit code and its output. */
export function itemFor(id, document, fallback) {
  if (!document) {
    return {
      id,
      verdict: 'error',
      code: fallback?.code ?? null,
      output: `${fallback?.stdout ?? ''}${fallback?.stderr ?? ''}`.trimEnd() || `${id} left no evidence file`,
      blocking: true,
    };
  }
  const lines = [...(document.stdout_tail ?? []), ...(document.stderr_tail ?? [])];
  return {
    id,
    verdict: document.verdict,
    code: Number.isInteger(document.exit) ? document.exit : null,
    output: lines.join('\n'),
    blocking: false,
  };
}

/** The checks of a map, keyed by id. */
export function checksById(map) {
  const index = new Map();
  for (const check of Array.isArray(map?.checks) ? map.checks : []) {
    if (check && typeof check.id === 'string') index.set(check.id, check);
  }
  return index;
}

/**
 * The verify phase's gate: the acceptance check alone, run through fc check, with a fail or an error blocking.
 * Returns { ran: false, reason } when the map carries no such check, so the caller can stay silent rather than guess.
 */
export async function run(context = {}) {
  const id = acceptanceId(context);
  const index = checksById(context.map);
  if (!index.has(id)) {
    return { ran: false, reason: `the pinned tests map has no acceptance check ${id}`, checks: [], extra: [] };
  }
  const outcome = runFcCheck(context, [id]);
  const item = itemFor(id, evidenceFor(context.launchDir, id), outcome);
  item.blocking = item.blocking || item.verdict === 'fail' || item.verdict === 'error';
  return { ran: true, checks: [item], extra: [] };
}

/**
 * The context the command-line form builds: the root, the active launch and its pinned map. Throws when no launch
 * resolves, and — unless requireMap is false, which is what a gate needing no checks passes — when no map is pinned.
 */
export function gateContext({ env = process.env, cwd = process.cwd(), requireMap = true } = {}) {
  const { root, launchDir } = resolveRoot({ env, cwd, scriptDir: HERE });
  const found = resolveLaunch({ env, launchDir });
  const launchJson = found.json ?? readLaunch(found.dir);
  const pin = launchJson?.tests_map;
  const pinned = pin && typeof pin.path === 'string' && pin.path !== '';
  if (!pinned && requireMap) throw new Error('no tests map pinned');
  const mapPath = pinned ? path.resolve(found.dir, pin.path) : null;
  let map = null;
  try {
    if (mapPath) map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  } catch (error) {
    if (requireMap) throw new Error(`the pinned tests map could not be read: ${error.message}`);
  }
  let plan = null;
  try {
    plan = JSON.parse(fs.readFileSync(path.join(found.dir, 'plan.json'), 'utf8'));
  } catch {
    plan = null;
  }
  return {
    root,
    launchDir: found.dir,
    launch: found.name,
    launchJson,
    phase: launchJson?.phase ?? null,
    map,
    mapPath,
    plan,
    env,
  };
}

/** Prints the blocking lines a gate result carries and returns the exit code the command-line form ends with. */
export function report(result, { label = 'gate' } = {}) {
  if (!result || result.ran === false) {
    fail(`${label} did not run: ${result?.reason ?? 'no reason given'}`);
    return EXIT.usage;
  }
  const items = [...(result.checks ?? []), ...(result.extra ?? [])];
  const blocking = items.filter((item) => item.blocking);
  if (blocking.length === 0) {
    ok(`${label}: ${items.map((item) => `${item.id} ${item.verdict}`).join(', ') || 'nothing to run'}`);
    return EXIT.ok;
  }
  for (const item of blocking) {
    fail(`${item.id} exit ${Number.isInteger(item.code) ? item.code : 'non-zero'}`);
    if (item.output) fail(item.output);
  }
  return EXIT.blocked;
}

/** Runs the gate from the command line. Returns the exit code rather than exiting. */
export async function main() {
  let context;
  try {
    context = gateContext();
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(await run(context), { label: 'acceptance gate' });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(await main());
}
