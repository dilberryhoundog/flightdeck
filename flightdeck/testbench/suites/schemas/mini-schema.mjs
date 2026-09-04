// testbench/suites/schemas/mini-schema.mjs — a small JSON Schema checker for the schemas suite, covering the keywords design section 5.12 requires of schema-lib (type, required, properties, additionalProperties, enum, const, pattern, minimum, maximum, minLength, minItems, items, oneOf, anyOf, $defs with same-document $ref) plus allOf, not, maxItems, maxLength and patternProperties; unknown keywords are ignored.
// Usage: import { validate } from './mini-schema.mjs'; const errors = validate(schema, document) → [{ path, keyword, message }], empty when the document conforms.
// When no branch of a oneOf or anyOf accepts the value, the branch errors are reported alongside the oneOf/anyOf error, at the value's own path, so that a defect inside a union — a bad enum member of `halt: null | {kind, detail}`, say — is visible as its own keyword and path rather than hidden behind the union.

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

/** The errors one branch of a oneOf/anyOf raises against the value, at the value's own path; empty when the branch accepts it. */
function branchErrors(schema, value, root, path) {
  const errors = [];
  check(schema, value, root, path, errors);
  return errors;
}

function check(schema, value, root, path, errors) {
  if (schema === true) return;
  if (schema === false) {
    errors.push({ path, keyword: 'false', message: `${path} is not allowed` });
    return;
  }
  if (!schema || typeof schema !== 'object') return;
  if (schema.$ref) {
    check(resolveRef(root, schema.$ref), value, root, path, errors);
    return;
  }
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => typeMatches(t, value))) {
      errors.push({ path, keyword: 'type', message: `${path} is ${typeOf(value)}, expected ${types.join('|')}` });
      return;
    }
  }
  if (schema.enum !== undefined && !schema.enum.some((e) => JSON.stringify(e) === JSON.stringify(value))) {
    errors.push({ path, keyword: 'enum', message: `${path} is ${JSON.stringify(value)}, expected one of ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}` });
  }
  if (schema.const !== undefined && JSON.stringify(schema.const) !== JSON.stringify(value)) {
    errors.push({ path, keyword: 'const', message: `${path} is ${JSON.stringify(value)}, expected ${JSON.stringify(schema.const)}` });
  }
  if (typeof value === 'string') {
    if (schema.pattern !== undefined && !new RegExp(schema.pattern).test(value)) {
      errors.push({ path, keyword: 'pattern', message: `${path} does not match ${schema.pattern}` });
    }
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, keyword: 'minLength', message: `${path} is shorter than ${schema.minLength}` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, keyword: 'maxLength', message: `${path} is longer than ${schema.maxLength}` });
    }
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, keyword: 'minimum', message: `${path} is below ${schema.minimum}` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, keyword: 'maximum', message: `${path} is above ${schema.maximum}` });
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push({ path, keyword: 'minItems', message: `${path} has fewer than ${schema.minItems} items` });
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push({ path, keyword: 'maxItems', message: `${path} has more than ${schema.maxItems} items` });
    }
    if (schema.items !== undefined) {
      if (Array.isArray(schema.items)) {
        value.forEach((item, i) => { if (schema.items[i] !== undefined) check(schema.items[i], item, root, `${path}[${i}]`, errors); });
      } else {
        value.forEach((item, i) => check(schema.items, item, root, `${path}[${i}]`, errors));
      }
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const key of schema.required ?? []) {
      if (!(key in value)) errors.push({ path, keyword: 'required', message: `${path} lacks required ${key}` });
    }
    const props = schema.properties ?? {};
    const patterns = Object.entries(schema.patternProperties ?? {});
    for (const [key, child] of Object.entries(value)) {
      const childPath = `${path}.${key}`;
      let matched = false;
      if (key in props) {
        matched = true;
        check(props[key], child, root, childPath, errors);
      }
      for (const [pattern, sub] of patterns) {
        if (new RegExp(pattern).test(key)) {
          matched = true;
          check(sub, child, root, childPath, errors);
        }
      }
      if (!matched && schema.additionalProperties !== undefined) {
        if (schema.additionalProperties === false) {
          errors.push({ path: childPath, keyword: 'additionalProperties', message: `${childPath} is not allowed` });
        } else {
          check(schema.additionalProperties, child, root, childPath, errors);
        }
      }
    }
  }
  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) check(sub, value, root, path, errors);
  }
  if (Array.isArray(schema.anyOf)) {
    const branches = schema.anyOf.map((sub) => branchErrors(sub, value, root, path));
    if (!branches.some((b) => b.length === 0)) {
      errors.push({ path, keyword: 'anyOf', message: `${path} matches none of anyOf` });
      for (const b of branches) errors.push(...b);
    }
  }
  if (Array.isArray(schema.oneOf)) {
    const branches = schema.oneOf.map((sub) => branchErrors(sub, value, root, path));
    const passing = branches.filter((b) => b.length === 0).length;
    if (passing !== 1) {
      errors.push({ path, keyword: 'oneOf', message: `${path} matches ${passing} of oneOf, expected exactly one` });
      if (passing === 0) for (const b of branches) errors.push(...b);
    }
  }
  if (schema.not !== undefined && validate(schema.not, value, root).length === 0) {
    errors.push({ path, keyword: 'not', message: `${path} matches a forbidden schema` });
  }
}

/** Validates document against schema; root is the document holding $defs for same-document $ref (defaults to schema). */
export function validate(schema, document, root = schema) {
  const errors = [];
  check(schema, document, root, '$', errors);
  return errors;
}
