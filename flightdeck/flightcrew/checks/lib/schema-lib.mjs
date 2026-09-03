// flightcrew/checks/lib/schema-lib.mjs — the JSON Schema checker every validator runs its document through, covering exactly the keyword subset the schemas beside it are written in.
// Usage: import { validate, loadSchema, formatErrors } from '<relative>/checks/lib/schema-lib.mjs'; const { ok, errors } = validate(loadSchema('launch'), doc).
//
// Exports: validate(schema, data) → { ok, errors: [{ path, rule, message }] }; loadSchema(name) (a schema file from
// flightcrew/schemas/, parsed and cached); schemaPath(name); formatErrors(errors) → the 'error: <message> — [<rule>]'
// lines of design 5.12; describeErrors(errors, limit) (a one-line digest for a message).
//
// Supported keywords (design section 5.12): type (a string or an array of strings), required, properties,
// additionalProperties (false or a schema), enum, const, pattern, minimum, maximum, minLength, minItems, items
// (one schema or a tuple), oneOf, anyOf, and $defs with same-document $ref ('#/$defs/<name>'). 'format' is ignored,
// '$schema' is informational and never resolved, and any other keyword is ignored rather than guessed at. A schema
// object carrying $ref is replaced by what the reference resolves to. Paths in errors read '$.a.b[0].c'.
// Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_DIR = path.resolve(HERE, '..', '..', 'schemas');
const cache = new Map();

/** The absolute path of a schema file. Accepts 'launch', 'launch.schema' or 'launch.schema.json'. */
export function schemaPath(name) {
  const file = String(name).endsWith('.json')
    ? String(name)
    : `${String(name).replace(/\.schema$/, '')}.schema.json`;
  return path.join(SCHEMA_DIR, file);
}

/** Reads and parses a schema from the schemas directory beside this library. Throws when the file is absent or unparseable. */
export function loadSchema(name) {
  const file = schemaPath(name);
  if (cache.has(file)) return cache.get(file);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`schema ${file} could not be read: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error(`schema ${file} is not valid JSON: ${error.message}`);
  }
  cache.set(file, parsed);
  return parsed;
}

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number';
  return typeof value;
}

function typeMatches(expected, value) {
  const actual = typeOf(value);
  if (expected === 'number') return actual === 'number' || actual === 'integer';
  return expected === actual;
}

function show(value) {
  try {
    const text = JSON.stringify(value);
    return text === undefined ? String(value) : text;
  } catch {
    return String(value);
  }
}

function resolveRef(root, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#')) throw new Error(`unsupported $ref ${ref}`);
  const parts = ref.slice(1).split('/').filter((p) => p !== '');
  let node = root;
  for (const raw of parts) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (node === undefined || node === null || !(key in node)) throw new Error(`unresolvable $ref ${ref}`);
    node = node[key];
  }
  return node;
}

function add(errors, path, rule, message) {
  errors.push({ path, rule, message });
}

function check(schema, value, root, at, errors) {
  if (schema === true || schema === undefined) return;
  if (schema === false) {
    add(errors, at, 'false', `${at} is not allowed`);
    return;
  }
  if (!schema || typeof schema !== 'object') return;
  if (schema.$ref) {
    check(resolveRef(root, schema.$ref), value, root, at, errors);
    return;
  }

  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(t, value))) {
      add(errors, at, 'type', `${at} is ${typeOf(value)}, expected ${types.join('|')}`);
      return;
    }
  }
  if (schema.enum !== undefined && Array.isArray(schema.enum)) {
    if (!schema.enum.some((e) => show(e) === show(value))) {
      add(errors, at, 'enum', `${at} is ${show(value)}, expected one of ${schema.enum.map(show).join(', ')}`);
    }
  }
  if (schema.const !== undefined && show(schema.const) !== show(value)) {
    add(errors, at, 'const', `${at} is ${show(value)}, expected ${show(schema.const)}`);
  }

  if (typeof value === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      add(errors, at, 'pattern', `${at} is ${show(value)}, which does not match ${schema.pattern}`);
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      add(errors, at, 'minLength', `${at} is shorter than ${schema.minLength} characters`);
    }
  }

  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      add(errors, at, 'minimum', `${at} is ${value}, below the minimum ${schema.minimum}`);
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      add(errors, at, 'maximum', `${at} is ${value}, above the maximum ${schema.maximum}`);
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      add(errors, at, 'minItems', `${at} has ${value.length} items, fewer than the ${schema.minItems} required`);
    }
    if (schema.items !== undefined) {
      if (Array.isArray(schema.items)) {
        value.forEach((item, i) => {
          if (schema.items[i] !== undefined) check(schema.items[i], item, root, `${at}[${i}]`, errors);
        });
      } else {
        value.forEach((item, i) => check(schema.items, item, root, `${at}[${i}]`, errors));
      }
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) add(errors, at, 'required', `${at} lacks required ${key}`);
    }
    const properties = schema.properties ?? {};
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${at}.${key}`;
      if (key in properties) {
        check(properties[key], child, root, childPath, errors);
      } else if (schema.additionalProperties === false) {
        add(errors, childPath, 'additionalProperties', `${childPath} is not allowed`);
      } else if (schema.additionalProperties !== undefined) {
        check(schema.additionalProperties, child, root, childPath, errors);
      }
    }
  }

  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf.map((sub) => branchErrors(sub, value, root, at));
    if (!branches.some((b) => b.length === 0)) {
      add(errors, at, 'anyOf', `${at} matches none of anyOf`);
      for (const b of branches) errors.push(...b);
    }
  }
  if (Array.isArray(schema.oneOf)) {
    const branches = schema.oneOf.map((sub) => branchErrors(sub, value, root, at));
    const passing = branches.filter((b) => b.length === 0).length;
    if (passing !== 1) {
      add(errors, at, 'oneOf', `${at} matches ${passing} of oneOf, expected exactly one`);
      if (passing === 0) for (const b of branches) errors.push(...b);
    }
  }
}

/** The errors one branch of a oneOf or anyOf raises, at the value's own path; empty when the branch accepts it. */
function branchErrors(schema, value, root, at) {
  const errors = [];
  check(schema, value, root, at, errors);
  return errors;
}

/**
 * Validates data against schema. root defaults to the schema itself, which is where same-document $ref resolves.
 * Returns { ok, errors } with one error per violation: { path: '$.a.b[0]', rule: <schema keyword>, message }.
 */
export function validate(schema, data, root = schema) {
  const errors = [];
  try {
    check(schema, data, root, '$', errors);
  } catch (error) {
    add(errors, '$', 'schema', `the schema could not be applied: ${error.message}`);
  }
  return { ok: errors.length === 0, errors };
}

/** One 'error: <message> — [<rule>]' line per error, per design 5.12. Returns an array of lines. */
export function formatErrors(errors) {
  return (errors ?? []).map((e) => `error: ${e.message} — [${e.rule}]`);
}

/** A short one-line digest of the first few errors, for an exception message or a log line. */
export function describeErrors(errors, limit = 4) {
  const list = errors ?? [];
  const head = list.slice(0, limit).map((e) => `${e.message} [${e.rule}]`).join(' / ');
  return list.length > limit ? `${head} (+${list.length - limit} more)` : head;
}
