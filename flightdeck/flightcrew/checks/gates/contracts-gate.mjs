// flightcrew/checks/gates/contracts-gate.mjs — the gate of the contracts phase: it runs the checks of the plan's contracts unit (the acceptance check when the plan declares no_contracts) and the boundary, and reports what blocks.
// Usage: node flightdeck/flightcrew/checks/gates/contracts-gate.mjs (the launch comes from FLIGHTCREW_LAUNCH or the unique active one); exit 0 when nothing blocks, 2 when a check or the boundary does, 1 when no launch or no tests map can be resolved.
//
// Exports: contractsChecks(context) → { ids, unit, reason } (the ids this gate runs and why); run(context) →
// { ran, reason?, checks: [...], extra: [...] }, the shape the stop-gate hook loads a gate for; main().
// The blocking rules are those of spec B40: a check whose verdict is error blocks; a check that fails while its
// baseline expect starts with 'pass' blocks; a check that fails while its baseline expects a failure does not; and
// fc boundary exiting 2 blocks, reported as the item 'boundary'. Importing this module has no side effect.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail } from '../lib/output.mjs';
import { acceptanceId, checksById, evidenceFor, gateContext, itemFor, report, runFcCheck } from './acceptance-gate.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FC = path.resolve(HERE, '..', '..', 'bin', 'fc.mjs');
const MAX_BUFFER = 16 * 1024 * 1024;
const TIMEOUT_MS = 600_000;

/** The first word of a baseline field, without its trailing punctuation: 'pass', 'fail' or 'error'. */
function firstWord(text) {
  const token = String(text ?? '').trim().split(/\s+/)[0] ?? '';
  return token.replace(/[:,.;]+$/, '');
}

/**
 * The checks this gate runs: the checks of the plan unit whose kind is contracts, or the acceptance check when the
 * plan declares no_contracts, carries no such unit, or is absent altogether. Returns { ids, unit, reason }.
 */
export function contractsChecks(context = {}) {
  const plan = context.plan ?? null;
  const units = Array.isArray(plan?.units) ? plan.units : [];
  const unit = plan?.no_contracts ? null : units.find((u) => u?.kind === 'contracts') ?? null;
  const ids = Array.isArray(unit?.checks) ? unit.checks.filter((id) => typeof id === 'string') : [];
  if (unit && ids.length > 0) return { ids, unit, reason: null };
  const fallback = acceptanceId(context);
  const reason = plan?.no_contracts
    ? 'the plan declares no_contracts'
    : unit
      ? `the contracts unit ${unit.id ?? unit.name ?? '?'} names no checks`
      : 'the plan carries no contracts unit';
  return { ids: [fallback], unit: null, reason };
}

/** Runs fc boundary in the launch's root. Returns { code, stdout, stderr }; it never throws. */
export function runFcBoundary(context) {
  if (!fs.existsSync(FC)) return { code: EXIT.usage, stdout: '', stderr: `fc is not installed at ${FC}\n` };
  const env = { ...(context.env ?? process.env) };
  env.FLIGHTCREW_ROOT = context.root;
  if (context.launch) env.FLIGHTCREW_LAUNCH = context.launch;
  const result = spawnSync(process.execPath, [FC, 'boundary'], {
    cwd: context.root,
    env,
    encoding: 'utf8',
    timeout: TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    killSignal: 'SIGKILL',
  });
  const stderr = `${result.stderr ?? ''}${result.error ? `fc boundary could not be run: ${result.error.message}\n` : ''}`;
  return { code: typeof result.status === 'number' ? result.status : EXIT.usage, stdout: result.stdout ?? '', stderr };
}

/**
 * The contracts phase's gate. Returns { ran: false, reason } when none of the ids it would run is in the pinned map,
 * so a launch whose plan and map disagree is reported rather than guessed at.
 */
export async function run(context = {}) {
  const { ids } = contractsChecks(context);
  const index = checksById(context.map);
  const known = ids.filter((id) => index.has(id));
  if (known.length === 0) {
    return { ran: false, reason: `the pinned tests map carries none of the contracts checks ${ids.join(', ')}`, checks: [], extra: [] };
  }

  const outcome = runFcCheck(context, known);
  // Exit 1 means no check ran — a pin mismatch, an unknown id, an unreadable map — and the evidence files on disk are
  // from an earlier run. Reporting them would release the turn on a stale pass, so the gate reports that it could not run.
  if (outcome.code === EXIT.usage) {
    return { ran: false, reason: outcome.stderr.trim().split('\n')[0] || 'fc check exited 1', checks: [], extra: [] };
  }
  const checks = known.map((id) => {
    const item = itemFor(id, evidenceFor(context.launchDir, id), outcome);
    const expected = firstWord(index.get(id)?.baseline?.expect);
    item.blocking = item.verdict === 'error' || (item.verdict === 'fail' && expected === 'pass');
    return item;
  });

  const boundary = runFcBoundary(context);
  const extra = [];
  if (boundary.code === EXIT.blocked) {
    extra.push({
      id: 'boundary',
      verdict: 'fail',
      code: boundary.code,
      output: `${boundary.stdout}${boundary.stderr}`.trimEnd() || 'fc boundary reported changes outside the allowed paths',
      blocking: true,
    });
  }
  return { ran: true, checks, extra };
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
  return report(await run(context), { label: 'contracts gate' });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(await main());
}
