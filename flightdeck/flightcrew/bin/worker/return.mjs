// flightcrew/bin/worker/return.mjs — storing what a dispatched agent returned: the four return kinds, the schema each is validated against, the fixed path each is stored at, and the finding-state file the critic's resolutions go to.
// Usage: import { KINDS, storeReturn, resolveFinding } from '<relative>/bin/worker/return.mjs'; storeReturn({ launchDir, kind, doc, unit }).
//
// Exports: KINDS (kind → { schema, status(doc), identifier }); ReturnError; targetFor(kind, identifier);
// validateReturn(kind, doc) → { ok, errors }; storeReturn({ launchDir, kind, doc, identifier, agent }) → { file, event };
// resolveFinding({ launchDir, id, commit, dispute, pass }) → the resolutions document.
//
// A return is stored only after it validates against its kind's schema: an invalid return is a blocking decision, and
// nothing is written and no event appended when one arrives (spec B28). Pass files are never edited — a later change
// to a finding's state is written to review/resolutions.json, which the run report joins with the pass file it
// belongs to. Nothing here decides an exit code; the command module does.

import fs from 'node:fs';
import path from 'node:path';
import { loadSchema, validate, describeErrors } from '../../checks/lib/schema-lib.mjs';
import { appendEvent } from '../../checks/lib/launch-lib.mjs';

/** A return that cannot be stored: the message is the line fc prints, code says whether it is usage or blocking. */
export class ReturnError extends Error {
  constructor(message, { blocking = false } = {}) {
    super(message);
    this.blocking = blocking;
  }
}

/** The four kinds a run stores, with the schema each validates against and where each is kept. */
export const KINDS = {
  worker: {
    schema: 'worker-return',
    flag: 'unit',
    identifierOf: (doc, given) => given ?? (typeof doc?.unit === 'string' ? doc.unit : null),
    fileFor: (identifier) => path.join('returns', `${identifier}.json`),
    statusOf: (doc) => (typeof doc?.status === 'string' ? doc.status : null),
    detailKey: 'unit',
  },
  explorer: {
    schema: 'explorer-return',
    flag: 'id',
    identifierOf: (doc, given) => given ?? (typeof doc?.id === 'string' ? doc.id : null),
    fileFor: (identifier) => path.join('returns', `explore-${identifier}.json`),
    statusOf: (doc) => (typeof doc?.confidence === 'string' ? doc.confidence : null),
    detailKey: 'id',
  },
  verifier: {
    schema: 'verifier-verdict',
    flag: 'pass',
    identifierOf: (doc, given) => (given ?? null),
    fileFor: (identifier) => path.join('returns', `verify-${identifier}.json`),
    statusOf: (doc) => (doc?.refuted === true ? 'refuted' : 'not refuted'),
    detailKey: 'pass',
    numeric: true,
  },
  critic: {
    schema: 'critic-findings',
    flag: 'pass',
    identifierOf: (doc, given) => given ?? (Number.isInteger(doc?.pass) ? String(doc.pass) : null),
    fileFor: (identifier) => path.join('review', `pass-${identifier}.json`),
    statusOf: (doc) => (typeof doc?.verdict === 'string' ? doc.verdict : null),
    detailKey: 'pass',
    numeric: true,
  },
};

/** The kind names fc accepts, in the order the usage line lists them. */
export const KIND_NAMES = Object.keys(KINDS);

/** The path, relative to the launch folder, one kind's return with that identifier is stored at. */
export function targetFor(kind, identifier) {
  const spec = KINDS[kind];
  if (!spec) throw new ReturnError(`unknown return kind ${kind}: expected one of ${KIND_NAMES.join(', ')}`);
  return spec.fileFor(identifier);
}

/** Validates a return document against its kind's schema. Returns { ok, errors } with schema-lib's error records. */
export function validateReturn(kind, doc) {
  const spec = KINDS[kind];
  if (!spec) throw new ReturnError(`unknown return kind ${kind}: expected one of ${KIND_NAMES.join(', ')}`);
  return validate(loadSchema(spec.schema), doc);
}

function writeJsonFile(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/**
 * Validates one return and, only when it validates, stores it at its kind's fixed path and appends the 'return' event
 * carrying the kind, the status and the identifier. Throws ReturnError (blocking) for a document that does not
 * validate and ReturnError (usage) when no identifier can be found for a kind that needs one.
 */
export function storeReturn({ launchDir, kind, doc, identifier = null, agent = null }) {
  const spec = KINDS[kind];
  if (!spec) throw new ReturnError(`unknown return kind ${kind}: expected one of ${KIND_NAMES.join(', ')}`);
  const result = validateReturn(kind, doc);
  if (!result.ok) {
    throw new ReturnError(`${kind} return does not validate: ${describeErrors(result.errors)}`, { blocking: true });
  }
  const id = spec.identifierOf(doc, identifier);
  if (id === null || String(id) === '') {
    throw new ReturnError(`fc return ${kind} needs --${spec.flag} <value>: the file does not name one`);
  }
  const relative = spec.fileFor(String(id));
  const file = path.join(launchDir, relative);
  writeJsonFile(file, doc);
  const detail = { kind, status: spec.statusOf(doc) };
  detail[spec.detailKey] = spec.numeric ? Number(id) : String(id);
  if (agent) detail.agent_id = String(agent);
  const event = appendEvent(launchDir, { event: 'return', agent_id: agent ?? undefined, detail });
  return { file, relative, event, identifier: String(id) };
}

/**
 * Records a finding's new state in review/resolutions.json without touching any pass file (design 5.5). A finding
 * given a commit is resolved; one given only a dispute is disputed. Returns the whole resolutions document.
 */
export function resolveFinding({ launchDir, id, commit = null, dispute = null, pass = null }) {
  if (!id) throw new ReturnError('fc return critic --resolve needs a finding id');
  if (!commit && !dispute) throw new ReturnError(`fc return critic --resolve ${id} needs --commit <sha> or --dispute "<reason>"`);
  const file = path.join(launchDir, 'review', 'resolutions.json');
  let document = {};
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) document = parsed;
  } catch {
    document = {};
  }
  document[String(id)] = {
    pass: pass === null ? null : Number(pass),
    state: commit ? 'resolved' : 'disputed',
    resolved_commit: commit ? String(commit) : null,
    dispute: dispute ? String(dispute) : null,
    at: new Date().toISOString(),
  };
  writeJsonFile(file, document);
  return { file, document };
}
