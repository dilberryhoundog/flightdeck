/**
 * schema-lib.mjs — minimal JSON Schema interpreter, zero dependencies.
 *
 * Executes the subset of JSON Schema the orchestration schemas use:
 *   type (string | integer | number | boolean | object | array)
 *   required · properties · additionalProperties:false
 *   items · minItems · enum · pattern · minimum · default (ignored)
 *   description / $schema / $id / title (ignored)
 *
 * Usage:
 *   import { validate } from "./schema-lib.mjs";
 *   const errors = validate(schema, instance);   // [] when legal
 *
 * Each error: { path: "units[2].id", rule: "pattern", message: "..." }
 * validate() may be given any schema fragment and any instance fragment,
 * so callers can check a single unit or behaviour in isolation.
 */

export function validate(schema, data, path = "$") {
  const errors = [];
  check(schema, data, path, errors);
  return errors;
}

function check(schema, data, path, errors) {
  if (schema == null || typeof schema !== "object") return;

  if (schema.type && !typeOk(schema.type, data)) {
    errors.push(err(path, "type", `expected ${schema.type}, got ${kindOf(data)}`));
    return; // further keywords assume the type
  }

  if (schema.enum && !schema.enum.includes(data))
    errors.push(err(path, "enum", `must be one of ${schema.enum.join(" | ")}, got ${JSON.stringify(data)}`));

  if (schema.pattern && typeof data === "string" && !new RegExp(schema.pattern).test(data))
    errors.push(err(path, "pattern", `"${data}" does not match ${schema.pattern}`));

  if (schema.minimum != null && typeof data === "number" && data < schema.minimum)
    errors.push(err(path, "minimum", `${data} < ${schema.minimum}`));

  if (schema.type === "object" && isObject(data)) {
    for (const key of schema.required ?? [])
      if (!(key in data)) errors.push(err(path, "required", `missing "${key}"`));
    const props = schema.properties ?? {};
    for (const [key, sub] of Object.entries(props))
      if (key in data) check(sub, data[key], `${path}.${key}`, errors);
    if (schema.additionalProperties === false)
      for (const key of Object.keys(data))
        if (!(key in props)) errors.push(err(path, "additionalProperties", `unknown key "${key}"`));
  }

  if (schema.type === "array" && Array.isArray(data)) {
    if (schema.minItems != null && data.length < schema.minItems)
      errors.push(err(path, "minItems", `${data.length} items, need ${schema.minItems}`));
    if (schema.items)
      data.forEach((item, i) => check(schema.items, item, `${path}[${i}]`, errors));
  }
}

function typeOk(type, data) {
  switch (type) {
    case "object": return isObject(data);
    case "array": return Array.isArray(data);
    case "string": return typeof data === "string";
    case "boolean": return typeof data === "boolean";
    case "number": return typeof data === "number";
    case "integer": return Number.isInteger(data);
    default: return true;
  }
}
const isObject = (d) => d !== null && typeof d === "object" && !Array.isArray(d);
const kindOf = (d) => (d === null ? "null" : Array.isArray(d) ? "array" : Number.isInteger(d) ? "integer" : typeof d);
const err = (path, rule, message) => ({ path, rule, message });

/** Shared reporting helper: print errors and return an exit code. */
export function report(label, errors, warnings = []) {
  for (const w of warnings) console.error(`warn:  ${w.path ?? "$"} — ${w.message ?? w}`);
  for (const e of errors) console.error(`error: ${e.path} — [${e.rule}] ${e.message}`);
  if (errors.length === 0) {
    console.log(`${label}: valid${warnings.length ? ` (${warnings.length} warning${warnings.length > 1 ? "s" : ""})` : ""}`);
    return 0;
  }
  console.error(`${label}: ${errors.length} error${errors.length > 1 ? "s" : ""}`);
  return 2;
}
