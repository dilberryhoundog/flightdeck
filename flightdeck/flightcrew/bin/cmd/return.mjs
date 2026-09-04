// flightcrew/bin/cmd/return.mjs — stores what a dispatched agent returned: validates the file against its kind's schema, writes it at that kind's fixed path, and appends the return event.
// Usage: fc return <worker|explorer|verifier|critic> <file> [--unit U | --id X | --pass n] [--agent id]; fc return critic --resolve F1 --commit <sha> [--dispute "…"]; exit 0 stored, 1 usage, 2 the return does not validate.

import fs from 'node:fs';
import path from 'node:path';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { EXIT, ok, fail, isJson, json } from '../../checks/lib/output.mjs';
import { KIND_NAMES, ReturnError, resolveFinding, storeReturn } from '../worker/return.mjs';

export const help = [
  'fc return worker <file> --unit U    store an implementer return at returns/<unit>.json',
  'fc return explorer <file> --id X1   store an explorer return at returns/explore-<id>.json',
  'fc return verifier <file> --pass n  store a verifier verdict at returns/verify-<n>.json',
  'fc return critic <file> --pass n    store a critic pass at review/pass-<n>.json',
  'fc return critic --resolve F1 --commit <sha> [--dispute "…"]   record a finding state change',
].join('\n');

const FLAGS = { unit: 'string', id: 'string', pass: 'string', agent: 'string', resolve: 'string', commit: 'string', dispute: 'string' };

function parse(args) {
  const positional = [];
  const flags = {};
  for (const name of Object.keys(FLAGS)) flags[name] = null;
  for (let i = 0; i < args.length; i += 1) {
    const item = String(args[i]);
    if (!item.startsWith('--')) {
      positional.push(item);
      continue;
    }
    const eq = item.indexOf('=');
    const name = eq === -1 ? item.slice(2) : item.slice(2, eq);
    if (!(name in FLAGS)) throw new ReturnError(`fc return: unknown flag --${name}`);
    if (eq !== -1) {
      flags[name] = item.slice(eq + 1);
      continue;
    }
    i += 1;
    if (i >= args.length) throw new ReturnError(`fc return: --${name} needs a value`);
    flags[name] = String(args[i]);
  }
  return { positional, flags };
}

function readDocument(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new ReturnError(`${file} could not be read: ${error.message}`);
  }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new ReturnError(`${file} is not a JSON object`, { blocking: true });
    }
    return parsed;
  } catch (error) {
    if (error instanceof ReturnError) throw error;
    throw new ReturnError(`${file} is not valid JSON: ${error.message}`, { blocking: true });
  }
}

/** The identifier flag a kind reads, whichever of --unit, --id and --pass was given. */
function identifierOf(kind, flags) {
  if (kind === 'worker') return flags.unit;
  if (kind === 'explorer') return flags.id;
  return flags.pass;
}

/**
 * Stores one return for the resolved launch. Shared with fc worker return, which is the same command with the unit
 * given positionally. Returns the exit code; the caller prints nothing else.
 */
export async function store(args, ctx) {
  const { positional, flags } = parse(args);
  const kind = positional[0];
  if (!kind || !KIND_NAMES.includes(kind)) {
    throw new ReturnError(`fc return: expected a kind, one of ${KIND_NAMES.join(', ')}`);
  }
  const launch = ctx?.launch;
  if (!launch?.dir) throw new ReturnError('no active launch');

  if (flags.resolve !== null) {
    if (kind !== 'critic') throw new ReturnError('fc return --resolve applies to a critic return');
    const outcome = resolveFinding({
      launchDir: launch.dir,
      id: flags.resolve,
      commit: flags.commit,
      dispute: flags.dispute,
      pass: flags.pass,
    });
    await bestEffortRender(launch.dir);
    const state = outcome.document[flags.resolve].state;
    if (isJson()) json(outcome.document);
    else ok(`resolution: ${flags.resolve} ${state}`);
    return EXIT.ok;
  }

  const given = positional[1];
  if (!given) throw new ReturnError(`fc return ${kind}: expected the path of the return file`);
  const file = path.isAbsolute(given) ? given : path.resolve(ctx.cwd ?? process.cwd(), given);
  const doc = readDocument(file);
  const stored = storeReturn({
    launchDir: launch.dir,
    kind,
    doc,
    identifier: identifierOf(kind, flags),
    agent: flags.agent,
  });
  await bestEffortRender(launch.dir);
  if (isJson()) json({ kind, stored: stored.relative, status: stored.event.detail.status });
  else ok(`return: ${kind} ${stored.identifier} stored at ${stored.relative}`);
  return EXIT.ok;
}

export async function run(args, ctx) {
  try {
    return await store(args, ctx);
  } catch (error) {
    fail(error.message);
    return error instanceof ReturnError && error.blocking ? EXIT.blocked : EXIT.usage;
  }
}
