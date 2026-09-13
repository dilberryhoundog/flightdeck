// testbench/lib/core-lib.mjs — helpers for the suites that check the flightcrew-core spec: the flight dispatcher and its leaves, the hooks, the new-layout launch fixture and the envelopes hooks read.
// Usage: import { suite, flight, leaf, coreHook, mkCoreLaunch, preToolUse, subagentStop, assert, … } from '../../lib/core-lib.mjs';
//
// Everything generic (suite, tmp, assertions, git, file helpers) is re-exported from suite-lib.mjs unchanged. What is added here is the surface the flightcrew-core spec names: bin/flight and bin/<leaf>.mjs (I5), flightdeck/flightcrew/hooks/<name>.mjs (I6), the I1 launch folder built from fixtures/sample-launch-core, and flightdeck/.controlcenter (I3).
// A suite never asserts against this repository's own launches: every case builds a temporary repository under os.tmpdir() and points CLAUDE_PROJECT_DIR at it.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

import {
  FD,
  REPO,
  FIXTURES,
  copyDir,
  initRepo,
  listFiles,
  readJson,
  readText,
  tmp,
  writeJson,
  writeText,
} from './suite-lib.mjs';

export {
  FD,
  REPO,
  FIXTURES,
  CREW,
  HOOKS,
  MANUALS,
  SCHEMAS,
  SUITES,
  TEMPLATES,
  WORKFLOWS,
  assert,
  assertEq,
  assertExit,
  assertIncludes,
  assertMatch,
  copyDir,
  exists,
  initRepo,
  listFiles,
  readJson,
  readText,
  sh,
  suite,
  tmp,
  writeJson,
  writeText,
} from './suite-lib.mjs';

// ── locations the flightcrew-core spec names ─────────────────────────────────
export const FLIGHTCREW = path.join(FD, 'flightcrew');
export const BIN = path.join(FLIGHTCREW, 'bin');
export const FLIGHT = path.join(BIN, 'flight');
export const CORE_HOOKS = path.join(FLIGHTCREW, 'hooks');
export const RUN_SCHEMAS = path.join(FLIGHTCREW, 'schemas', 'run');
export const DISPATCH_TEMPLATES = path.join(FLIGHTCREW, 'templates', 'dispatch');
export const LIFTOFFS = path.join(FLIGHTCREW, 'liftoffs');
export const CORE_WORKFLOWS = path.join(FLIGHTCREW, 'workflows');
export const VERIFY_LIB = path.join(FLIGHTCREW, 'verify');
export const SAMPLE_LAUNCH = path.join(FIXTURES, 'sample-launch-core');
export const SAMPLE_PROJECT = path.join(FIXTURES, 'sample-project');
export const SAMPLE_TRANSCRIPT = path.join(FIXTURES, 'sample-transcript');

/** The subagent roles of the run chain (I7); the three spec-chain files are named separately because they are out of scope (SC6). */
export const RUN_ROLES = [
  'explorer',
  'planner',
  'orchestrator',
  'steward',
  'interface-builder',
  'implementer',
  'strong-worker',
  'adversary',
  'verifier',
  'critic',
  'judge',
  'scribe',
  'test-builder',
];

/** The roles that are dispatched by a workflow and therefore have a dispatch template and a return schema (I8, I9). */
export const SUBAGENT_ROLES = RUN_ROLES.filter((role) => role !== 'orchestrator' && role !== 'test-builder');

export const SPEC_CHAIN_ROLES = ['spec-builder', 'spec-judge', 'spec-attacker'];

export const TASK_KINDS = ['feature', 'migration', 'audit', 'agent'];

export const WORKFLOW_NAMES = [
  'fc-plan-feature',
  'fc-plan-migration',
  'fc-plan-audit',
  'fc-plan-agent',
  'fc-contracts',
  'fc-build',
  'fc-verify',
  'fc-review',
  'fc-report',
];

const TIMEOUT_MS = 120_000;
const MAX_BUFFER = 16 * 1024 * 1024;
const SCRUBBED = ['CLAUDE_PROJECT_DIR', 'FLIGHTCREW_ROOT', 'FLIGHTCREW_LAUNCH'];

function childEnv(overrides = {}) {
  const env = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!SCRUBBED.includes(key) && value !== undefined) env[key] = value;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) delete env[key];
    else env[key] = String(value);
  }
  return env;
}

function run(file, args, opts = {}) {
  const timeout = opts.timeout ?? TIMEOUT_MS;
  let result;
  try {
    result = spawnSync(file, args, {
      cwd: opts.cwd,
      env: childEnv(opts.env),
      input: opts.input === undefined ? '' : String(opts.input),
      encoding: 'utf8',
      timeout,
      maxBuffer: MAX_BUFFER,
      killSignal: 'SIGKILL',
    });
  } catch (error) {
    return { code: null, signal: null, stdout: '', stderr: `[core-lib] could not spawn ${file}: ${error.message}\n`, ms: 0 };
  }
  let stderr = result.stderr ?? '';
  if (result.error) {
    const why = result.error.code === 'ETIMEDOUT' ? `timeout after ${timeout} ms` : result.error.message;
    stderr += `${stderr && !stderr.endsWith('\n') ? '\n' : ''}[core-lib] ${file}: ${why}\n`;
  }
  return {
    code: typeof result.status === 'number' ? result.status : null,
    signal: result.signal ?? null,
    stdout: result.stdout ?? '',
    stderr,
  };
}

/** Runs flightdeck/flightcrew/bin/flight with args, cwd defaulting to the temporary repository the caller passes. */
export function flight(args, opts = {}) {
  return run(FLIGHT, args.map(String), opts);
}

/** Runs a leaf by its own path, as C3 requires it to run with the dispatcher absent: node bin/<name>.mjs. <name> may be 'launch' or 'launch init'. */
export function leaf(name, args = [], opts = {}) {
  const parts = String(name).trim().split(/\s+/);
  const file = path.join(BIN, `${parts[0]}.mjs`);
  return run(process.execPath, [file, ...parts.slice(1), ...args.map(String)], opts);
}

/** Runs a hook script by path with the envelope (object or raw string) on stdin. Adds decision: parsed stdout JSON or null, and ms: wall-clock milliseconds. */
export function coreHook(name, envelope, opts = {}) {
  const file = path.join(CORE_HOOKS, String(name).endsWith('.mjs') ? String(name) : `${name}.mjs`);
  const input = typeof envelope === 'string' ? envelope : JSON.stringify(envelope);
  const cwd = opts.cwd ?? opts.env?.CLAUDE_PROJECT_DIR ?? REPO;
  const started = Date.now();
  const result = run(process.execPath, [file], { ...opts, cwd, input });
  const ms = Date.now() - started;
  let decision = null;
  const text = result.stdout.trim();
  if (text.startsWith('{')) {
    try {
      decision = JSON.parse(text);
    } catch {
      decision = null;
    }
  }
  return { ...result, decision, ms };
}

/** True when the hook's answer denies the tool call: a permissionDecision of 'deny' on stdout, or exit 2 with a reason on stderr. */
export function denied(result) {
  const decision = result.decision;
  const spoken = decision?.permissionDecision ?? decision?.hookSpecificOutput?.permissionDecision ?? decision?.decision;
  if (typeof spoken === 'string' && spoken.toLowerCase() === 'deny') return true;
  return result.code === 2 && String(result.stderr).trim() !== '';
}

/** The reason a hook gave for its answer, from either shape. */
export function denyReason(result) {
  const decision = result.decision;
  const reason =
    decision?.permissionDecisionReason ??
    decision?.hookSpecificOutput?.permissionDecisionReason ??
    decision?.reason ??
    decision?.systemMessage;
  return typeof reason === 'string' && reason.trim() !== '' ? reason : String(result.stderr ?? '').trim();
}

// ── envelopes (I6: hooks read the stdin envelope) ────────────────────────────
function envelope(event, extra = {}) {
  return { session_id: 'sess-core-1', transcript_path: '/dev/null', hook_event_name: event, ...extra };
}

export function preToolUse(toolName, filePath, extra = {}) {
  const input = { file_path: filePath, ...(extra.tool_input ?? {}) };
  if (toolName === 'NotebookEdit') input.notebook_path = filePath;
  return envelope('PreToolUse', { tool_name: toolName, tool_input: input, ...stripInput(extra) });
}

/** The three write tools every path guard is wired for (I6). */
export const WRITE_TOOLS = ['Edit', 'Write', 'NotebookEdit'];

export function preToolUseBash(command, extra = {}) {
  return envelope('PreToolUse', { tool_name: 'Bash', tool_input: { command }, ...extra });
}

export function subagentStop(agentType, lastMessage, extra = {}) {
  return envelope('SubagentStop', {
    agent_id: extra.agent_id ?? 'agent-1',
    agent_type: agentType,
    last_assistant_message: lastMessage,
    ...stripInput(extra),
  });
}

export function postToolUse(toolName, filePath, extra = {}) {
  return envelope('PostToolUse', { tool_name: toolName, tool_input: { file_path: filePath }, ...stripInput(extra) });
}

export function sessionStart(extra = {}) {
  return envelope('SessionStart', { source: 'startup', ...extra });
}

function stripInput(extra) {
  const { tool_input, ...rest } = extra ?? {};
  return rest;
}

/** A fenced JSON block as an agent's last assistant message, which return-capture and the worker gate read. */
export function fenced(object, prose = 'Done.') {
  return `${prose}\n\n\`\`\`json\n${JSON.stringify(object, null, 2)}\n\`\`\`\n`;
}

// ── the launch fixture ───────────────────────────────────────────────────────
function git(dir, args) {
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8', env: childEnv(), maxBuffer: MAX_BUFFER });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed in ${dir}: ${(result.stderr || result.stdout || '').trim()}`);
  }
  return result.stdout;
}

export { git };

export function head(dir) {
  return git(dir, ['rev-parse', 'HEAD']).trim();
}

export function branch(dir) {
  return git(dir, ['rev-parse', '--abbrev-ref', 'HEAD']).trim();
}

export function branches(dir) {
  return git(dir, ['for-each-ref', '--format=%(refname:short)', 'refs/heads'])
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .sort();
}

export const SAMPLE_LAUNCH_NAME = 'sample-core';

/**
 * A temporary git repository holding the sample project and, under flightdeck/launch/sample-core/, the I1 launch folder from
 * fixtures/sample-launch-core with its run-1 in progress; flightdeck/.controlcenter names it. Everything is committed on main.
 * Returns { root, launch, launchDir, run, runDir, env } with paths absolute and env carrying CLAUDE_PROJECT_DIR.
 */
export function mkCoreLaunch(options = {}) {
  const root = options.root ?? tmp('fc-core');
  copyDir(SAMPLE_PROJECT, root);
  const launch = options.launch ?? SAMPLE_LAUNCH_NAME;
  const launchDir = path.join(root, 'flightdeck', 'launch', launch);
  copyDir(SAMPLE_LAUNCH, launchDir);
  fs.mkdirSync(path.join(root, 'flightdeck', 'flightcrew'), { recursive: true });
  writeText(path.join(root, 'flightdeck', '.controlcenter'), `LAUNCH_DIRECTORY=flightdeck/launch/${launch}\n`);
  writeText(path.join(root, '.gitignore'), 'flightdeck/.controlcenter\n');
  initRepo(root);
  const record = readJson(path.join(launchDir, 'launch.json'));
  const run = record.current_run;
  const runDir = path.join(launchDir, 'runs', `run-${run}`);
  const base = head(root);
  record.runs = record.runs.map((entry) => (entry.n === run ? { ...entry, base_commit: base, lock_commit: base } : entry));
  writeJson(path.join(launchDir, 'launch.json'), record);
  git(root, ['add', '-A']);
  git(root, ['commit', '-q', '--no-verify', '-m', 'launch base commit']);
  git(root, ['branch', '-f', `run/${launch}-${run}`]);
  git(root, ['switch', '-q', `run/${launch}-${run}`]);
  return {
    root,
    launch,
    launchDir,
    run,
    runDir,
    rel: (...parts) => path.posix.join('flightdeck', 'launch', launch, ...parts),
    env: { CLAUDE_PROJECT_DIR: root, FLIGHTCREW_ROOT: root },
  };
}

/** mkCoreLaunch with no flightdeck/.controlcenter: the E7 case. */
export function mkCoreLaunchNoControlCentre(options = {}) {
  const made = mkCoreLaunch(options);
  fs.rmSync(path.join(made.root, 'flightdeck', '.controlcenter'), { force: true });
  return made;
}

/** A temporary git repository holding the sample project alone, with no launch: what flight launch init is run against. */
export function mkBareRepo(options = {}) {
  const root = options.root ?? tmp('fc-bare');
  copyDir(SAMPLE_PROJECT, root);
  fs.mkdirSync(path.join(root, 'flightdeck', 'launch'), { recursive: true });
  writeText(path.join(root, 'flightdeck', 'launch', '.keep'), '');
  initRepo(root);
  return { root, env: { CLAUDE_PROJECT_DIR: root, FLIGHTCREW_ROOT: root } };
}

// ── reading what the run wrote ───────────────────────────────────────────────
export function readLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '');
}

export function readEvents(file) {
  return readLines(file).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch (error) {
      throw new Error(`events line ${index + 1} is not JSON: ${error.message}`);
    }
  });
}

/** Every file under dir as posix paths relative to dir, .git skipped. */
export { listFiles as files };

/** A map of relative path to content hash for every file under dir, for before/after comparisons (C2). */
export function snapshot(dir) {
  const map = new Map();
  for (const rel of listFiles(dir)) {
    const full = path.join(dir, rel);
    try {
      map.set(rel, fs.readFileSync(full).toString('base64'));
    } catch {
      map.set(rel, '<unreadable>');
    }
  }
  return map;
}

/** The paths that differ between two snapshots, added, removed or changed, sorted. */
export function changedPaths(before, after) {
  const changed = new Set();
  for (const [rel, value] of after) if (before.get(rel) !== value) changed.add(rel);
  for (const rel of before.keys()) if (!after.has(rel)) changed.add(rel);
  return [...changed].sort();
}

// ── a minimal JSON Schema check, enough for the shapes this spec names ───────
/**
 * Validates value against a JSON Schema subset: type, required, properties, additionalProperties, items, enum, pattern,
 * minimum, minItems, minLength, const, oneOf, anyOf, allOf and local $ref into $defs. Returns an array of error strings.
 * Suites use it to read a schema file the run wrote and hold a document to it without any package dependency (C1).
 */
export function validateAgainst(schema, value, options = {}) {
  const rootSchema = options.root ?? schema;
  const errors = [];
  check(schema, value, options.at ?? '$');
  return errors;

  function resolve(node) {
    if (!node || typeof node !== 'object' || typeof node.$ref !== 'string') return node;
    const parts = node.$ref.replace(/^#\//, '').split('/');
    let found = rootSchema;
    for (const part of parts) found = found?.[part.replace(/~1/g, '/').replace(/~0/g, '~')];
    return found ?? {};
  }

  function typeOf(v) {
    if (v === null) return 'null';
    if (Array.isArray(v)) return 'array';
    if (Number.isInteger(v)) return 'integer';
    return typeof v;
  }

  function check(node, v, at) {
    const s = resolve(node);
    if (!s || typeof s !== 'object') return;
    if (s.type) {
      const wanted = Array.isArray(s.type) ? s.type : [s.type];
      const actual = typeOf(v);
      const ok = wanted.some((t) => (t === 'number' ? actual === 'number' || actual === 'integer' : t === actual));
      if (!ok) {
        errors.push(`${at}: expected ${wanted.join('|')}, got ${actual}`);
        return;
      }
    }
    if (Array.isArray(s.enum) && !s.enum.some((e) => JSON.stringify(e) === JSON.stringify(v))) {
      errors.push(`${at}: ${JSON.stringify(v)} not one of ${JSON.stringify(s.enum)}`);
    }
    if (Object.prototype.hasOwnProperty.call(s, 'const') && JSON.stringify(s.const) !== JSON.stringify(v)) {
      errors.push(`${at}: expected ${JSON.stringify(s.const)}`);
    }
    if (typeof v === 'string') {
      if (s.pattern && !new RegExp(s.pattern).test(v)) errors.push(`${at}: ${JSON.stringify(v)} fails ${s.pattern}`);
      if (typeof s.minLength === 'number' && v.length < s.minLength) errors.push(`${at}: shorter than ${s.minLength}`);
    }
    if (typeof v === 'number' && typeof s.minimum === 'number' && v < s.minimum) errors.push(`${at}: below ${s.minimum}`);
    if (Array.isArray(v)) {
      if (typeof s.minItems === 'number' && v.length < s.minItems) errors.push(`${at}: fewer than ${s.minItems} items`);
      if (s.items) v.forEach((item, i) => check(s.items, item, `${at}[${i}]`));
    }
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const key of s.required ?? []) {
        if (!Object.prototype.hasOwnProperty.call(v, key)) errors.push(`${at}: missing ${key}`);
      }
      const props = s.properties ?? {};
      for (const [key, child] of Object.entries(v)) {
        if (props[key]) check(props[key], child, `${at}.${key}`);
        else if (s.additionalProperties === false) errors.push(`${at}: unexpected ${key}`);
        else if (s.additionalProperties && typeof s.additionalProperties === 'object') {
          check(s.additionalProperties, child, `${at}.${key}`);
        }
      }
    }
    for (const child of s.allOf ?? []) check(child, v, at);
    if (Array.isArray(s.oneOf) || Array.isArray(s.anyOf)) {
      const branches = s.oneOf ?? s.anyOf;
      const matched = branches.some((b) => validateAgainst(b, v, { root: rootSchema, at }).length === 0);
      if (!matched) errors.push(`${at}: matches none of ${branches.length} alternatives`);
    }
  }
}

/** Reads a schema the run wrote under flightdeck/flightcrew/schemas/run/ and validates value against it. Throws when the schema is absent. */
export function validateWithRunSchema(schemaName, value) {
  const file = path.join(RUN_SCHEMAS, schemaName);
  if (!fs.existsSync(file)) throw new Error(`schema absent: flightdeck/flightcrew/schemas/run/${schemaName}`);
  return validateAgainst(readJson(file), value);
}

/** Frontmatter of a markdown file as { data, body }; data values are parsed as JSON where they parse, else kept as strings. */
export function frontmatter(file) {
  const text = readText(file);
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text);
  if (!match) return { data: null, body: text, raw: '' };
  const data = {};
  let key = null;
  for (const line of match[1].split('\n')) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const top = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (top) {
      key = top[1];
      const value = top[2].trim();
      data[key] = value === '' ? [] : parseScalar(value);
      continue;
    }
    const item = /^\s*-\s*(.*)$/.exec(line);
    if (item && key) {
      if (!Array.isArray(data[key])) data[key] = [];
      data[key].push(parseScalar(item[1].trim()));
      continue;
    }
    const nested = /^\s+([A-Za-z_][\w-]*):\s*(.*)$/.exec(line);
    if (nested && key) {
      if (typeof data[key] !== 'object' || data[key] === null || Array.isArray(data[key])) data[key] = {};
      data[key][nested[1]] = parseScalar(nested[2].trim());
    }
  }
  return { data, body: match[2], raw: match[1] };
}

function parseScalar(text) {
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (text === 'null') return null;
  if (/^-?\d+$/.test(text)) return Number(text);
  if ((text.startsWith('[') && text.endsWith(']')) || (text.startsWith('{') && text.endsWith('}'))) {
    try {
      return JSON.parse(text.replace(/'/g, '"'));
    } catch {
      return text
        .slice(1, -1)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    }
  }
  return text.replace(/^["']|["']$/g, '');
}

/** Every markdown or JSON file under dir matching the filter, as absolute paths. */
export function filesUnder(dir, filter = () => true) {
  if (!fs.existsSync(dir)) return [];
  return listFiles(dir)
    .map((rel) => path.join(dir, rel))
    .filter((full) => filter(full));
}

// ── transcripts (fixtures/sample-transcript) ─────────────────────────────────
/**
 * A Claude Code transcript as an ordered list of turns: { kind: 'human'|'say'|'use'|'result', ts, text, tool, input, output }.
 * A record of type 'user' carrying a toolUseResult is a tool result, not a human turn; every other 'user' record is a human turn.
 */
export function readTranscript(file) {
  return readLines(file).map((line, index) => {
    let record;
    try {
      record = JSON.parse(line);
    } catch (error) {
      throw new Error(`transcript line ${index + 1} is not JSON: ${error.message}`);
    }
    const content = record.message?.content ?? [];
    const blocks = Array.isArray(content) ? content : [{ type: 'text', text: String(content) }];
    const call = blocks.find((b) => b.type === 'tool_use');
    const text = blocks
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
    if (record.type === 'user') {
      if (record.toolUseResult !== undefined) return { kind: 'result', ts: record.timestamp, output: record.toolUseResult, text };
      return { kind: 'human', ts: record.timestamp, text };
    }
    if (call) return { kind: 'use', ts: record.timestamp, tool: call.name, input: call.input ?? {}, text };
    return { kind: 'say', ts: record.timestamp, text };
  });
}

/** Every workflow invocation of a transcript, in order: { name, args, at } where at is the turn index. */
export function workflowCalls(turns) {
  return turns
    .map((turn, at) => ({ turn, at }))
    .filter(({ turn }) => turn.kind === 'use' && turn.tool === 'Workflow')
    .map(({ turn, at }) => ({ name: turn.input.workflow ?? turn.input.name ?? null, args: turn.input.args ?? {}, at }));
}

/** Every Bash invocation of a transcript, in order: { command, at }. */
export function bashCalls(turns) {
  return turns
    .map((turn, at) => ({ turn, at }))
    .filter(({ turn }) => turn.kind === 'use' && turn.tool === 'Bash')
    .map(({ turn, at }) => ({ command: String(turn.input.command ?? ''), at }));
}

// ── the launch this repository is itself running ─────────────────────────────
/** flightdeck/launch/flightcrew-core: the launch whose spec these suites check, and whose run-1 produces the artefacts T1 reads. */
export const THIS_LAUNCH = 'flightcrew-core';
export const THIS_LAUNCH_DIR = path.join(FD, 'launch', THIS_LAUNCH);
export const THIS_RUN = 1;
export const THIS_RUN_DIR = path.join(THIS_LAUNCH_DIR, 'runs', `run-${THIS_RUN}`);
export const FLIGHTLOG = path.join(FD, 'launch', 'FLIGHTLOG.md');

/**
 * The transcript of this run's orchestrator session, or null: the transcript_path of the newest event that carries one.
 * A check that needs the real session reports its absence rather than passing on a fixture.
 */
export function thisRunTranscript() {
  const events = path.join(THIS_RUN_DIR, 'events.jsonl');
  if (!fs.existsSync(events)) return null;
  for (const line of readEvents(events).reverse()) {
    const candidate = line.detail?.transcript_path;
    if (typeof candidate === 'string' && candidate && fs.existsSync(candidate)) return candidate;
  }
  return null;
}
