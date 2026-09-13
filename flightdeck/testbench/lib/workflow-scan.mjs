// testbench/lib/workflow-scan.mjs — the static scan C13 states, as one function a suite runs over the workflow suite and over a mutated copy.
// Usage: import { scanWorkflow, scanSuite } from '../../lib/workflow-scan.mjs'; scanWorkflow(name, source, { schemas }) → [ { rule, detail } ], empty when the script holds.
//
// Each rule is one clause of C13, read literally. The clause 'passes a schema on every agent() call whose return it branches on' is not scanned: whether a return is branched on is not decidable from the text, and a scan that guessed would fail a compliant script. What is scanned is the clause that can be: an inline schema, where one is passed, is byte-equal to the file under schemas/run/ it copies (E20).

const FILESYSTEM = ['node:fs', 'node:fs/promises', 'fs', 'readFileSync', 'writeFileSync', 'mkdirSync', 'readdirSync', 'existsSync', 'appendFileSync', 'rmSync', 'renameSync', 'createWriteStream', 'createReadStream'];
const SHELL = ['node:child_process', 'child_process', 'spawnSync', 'spawn', 'execSync', 'exec(', 'execFileSync'];
const CLOCK = ['Date.now', 'new Date'];
const RANDOM = ['Math.random'];

/** The source with every string, template and comment blanked, so a scan reads code alone. */
export function stripLiterals(source) {
  let out = '';
  let mode = null;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];
    if (mode === null) {
      if (char === '/' && next === '/') { mode = 'line'; out += '  '; i += 1; continue; }
      if (char === '/' && next === '*') { mode = 'block'; out += '  '; i += 1; continue; }
      if (char === '"' || char === "'" || char === '`') { mode = char; out += ' '; continue; }
      out += char;
      continue;
    }
    if (mode === 'line') { if (char === '\n') { mode = null; out += '\n'; } else out += ' '; continue; }
    if (mode === 'block') { if (char === '*' && next === '/') { mode = null; out += '  '; i += 1; } else out += char === '\n' ? '\n' : ' '; continue; }
    if (char === '\\') { out += '  '; i += 1; continue; }
    if (char === mode) { mode = null; out += ' '; continue; }
    out += char === '\n' ? '\n' : ' ';
  }
  return out;
}

/** The object literal that starts at the given index of source, as text, or null when the braces do not close. */
export function literalAt(source, start) {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return null;
}

/** Every agent() call of a script, as { at, argsText }. */
export function agentCalls(source) {
  const code = stripLiterals(source);
  const found = [];
  const re = /\bagent\s*\(/g;
  let match;
  while ((match = re.exec(code)) !== null) {
    const open = match.index + match[0].length - 1;
    let depth = 0;
    let end = open;
    for (let i = open; i < code.length; i += 1) {
      if (code[i] === '(') depth += 1;
      else if (code[i] === ')') {
        depth -= 1;
        if (depth === 0) { end = i; break; }
      }
    }
    found.push({ at: match.index, argsText: source.slice(open + 1, end) });
  }
  return found;
}

/** Every workflow('<name>') call of a script, by the literal name it names. */
export function nestedWorkflowNames(source) {
  return [...source.matchAll(/\bworkflow\s*\(\s*['"]([\w-]+)['"]/g)].map((match) => match[1]);
}

/** True when a return statement sits outside every brace, bracket and paren: C13's top-level return. */
export function hasTopLevelReturn(source) {
  const code = stripLiterals(source);
  let depth = 0;
  for (let i = 0; i < code.length; i += 1) {
    const char = code[i];
    if (char === '{' || char === '(' || char === '[') depth += 1;
    else if (char === '}' || char === ')' || char === ']') depth -= 1;
    else if (depth === 0 && code.startsWith('return', i) && !/[\w$]/.test(code[i - 1] ?? ' ') && !/[\w$]/.test(code[i + 6] ?? ' ')) return true;
  }
  return false;
}

/**
 * The findings of one workflow script. schemas is a map of schema file name to its exact text.
 * A finding is { rule, detail }; an empty array means the script holds.
 */
export function scanWorkflow(name, source, { schemas = {} } = {}) {
  const findings = [];
  const code = stripLiterals(source);
  const say = (rule, detail) => findings.push({ rule, detail: `${name}: ${detail}` });

  for (const needle of FILESYSTEM) if (code.includes(needle)) say('no-filesystem', `reaches the filesystem through ${needle}`);
  for (const needle of SHELL) if (code.includes(needle)) say('no-shell', `reaches the shell through ${needle}`);
  for (const needle of CLOCK) if (code.includes(needle)) say('no-clock', `reads the clock through ${needle}`);
  for (const needle of RANDOM) if (code.includes(needle)) say('no-random', `reaches for chance through ${needle}`);
  if (/\bimport\s*[({]/.test(code) || /^\s*import\s+/m.test(code)) say('no-import', 'imports a module');

  for (const call of agentCalls(source)) {
    if (!/\bagentType\s*:/.test(call.argsText)) say('agent-type', 'an agent() call names no agentType');
    const schemaAt = /\bschema\s*:\s*/.exec(call.argsText);
    if (schemaAt) {
      const rest = call.argsText.slice(schemaAt.index + schemaAt[0].length);
      if (!rest.trimStart().startsWith('{')) {
        say('schema-inline', 'an agent() call passes a schema that is not an inline object literal');
      } else {
        const literal = literalAt(rest, rest.indexOf('{'));
        const normalised = literal === null ? '' : literal.trim();
        const match = Object.entries(schemas).find(([, text]) => text.trim() === normalised);
        if (!match) {
          const named = /"\$id"\s*:\s*"([^"]+)"/.exec(normalised)?.[1] ?? /"title"\s*:\s*"([^"]+)"/.exec(normalised)?.[1] ?? 'an unnamed schema';
          say('schema-byte-equal', `the inline schema ${named} is not byte-equal to any file under schemas/run/`);
        }
      }
    }
  }

  if (!hasTopLevelReturn(source)) say('top-level-return', 'the script does not end with a top-level return');
  return findings;
}

/** The findings of the whole suite, including the nesting rule, which spans files. sources is a map of workflow name to source. */
export function scanSuite(sources, { schemas = {} } = {}) {
  const findings = [];
  for (const [name, source] of Object.entries(sources)) findings.push(...scanWorkflow(name, source, { schemas }));
  for (const [name, source] of Object.entries(sources)) {
    for (const called of nestedWorkflowNames(source)) {
      const inner = sources[called];
      if (inner === undefined) {
        findings.push({ rule: 'nesting', detail: `${name}: calls workflow('${called}'), which is not in the suite` });
        continue;
      }
      const deeper = nestedWorkflowNames(inner);
      if (deeper.length > 0) findings.push({ rule: 'nesting', detail: `${name}: calls ${called}, which itself calls ${deeper.join(', ')} — that is two levels` });
    }
  }
  return findings;
}
