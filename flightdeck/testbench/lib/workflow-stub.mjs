// testbench/lib/workflow-stub.mjs — a stub of the workflow runtime: it loads a workflow script, answers its agent() and workflow() calls from fixtures, and hands back the object the script returned together with every call it made, in order.
// Usage: import { runWorkflow, agentCalls, workflowCalls } from '../../lib/workflow-stub.mjs'; const run = await runWorkflow('fc-build', args, { agents, workflows });
//
// The calling convention is the one C13 and I14 fix: a workflow script's body ends with a top-level return of one object, it receives args, and it reaches the crew through agent() and other workflows through workflow(). The script is therefore evaluated as the body of an async function with args, agent, workflow and meta in scope. A script that instead exports a default function is loaded as a module and called with args, so a runtime that turns out to prefer that shape is read rather than failed.
// agent() is answered by the agents responder, workflow() by the workflows responder; both record the call before answering, so a case asserts on the order and content of what was dispatched, never on how the script is written.

import fs from 'node:fs';
import path from 'node:path';

import { CORE_WORKFLOWS } from './core-lib.mjs';

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

export function workflowFile(name) {
  return path.join(CORE_WORKFLOWS, name.endsWith('.js') ? name : `${name}.js`);
}

export function workflowSource(name) {
  return fs.readFileSync(workflowFile(name), 'utf8');
}

/** The meta object a workflow declares, read from its source. Returns null when the script declares none. */
export function workflowMeta(name) {
  const source = workflowSource(name);
  const match = /(?:export\s+)?const\s+meta\s*=\s*(\{[\s\S]*?\})\s*;?\s*(?:\n|$)/.exec(source);
  if (!match) return null;
  try {
    return new Function(`return (${match[1]});`)();
  } catch {
    return null;
  }
}

/** True when the script carries a return statement outside every function body, which is what C13 requires. */
export function hasTopLevelReturn(source) {
  const text = stripLiterals(source);
  let depth = 0;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '{' || char === '(' || char === '[') depth += 1;
    else if (char === '}' || char === ')' || char === ']') depth -= 1;
    else if (depth === 0 && text.startsWith('return', i) && !/[\w$]/.test(text[i - 1] ?? ' ') && !/[\w$]/.test(text[i + 6] ?? ' ')) {
      return true;
    }
  }
  return false;
}

/** The source with every string, template and comment replaced by spaces of the same length, so a scan reads code alone. */
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

/**
 * Runs a workflow under the stub.
 * agents: a function (spec, calls) => return object, or a list of { agentType, return } answered in order per type.
 * workflows: a function (name, args) => result, or an object of name to result.
 * Returns { result, calls, agents: [...], workflows: [...], error }.
 */
export async function runWorkflow(name, args, { agents = {}, workflows = {} } = {}) {
  const calls = [];
  const queues = new Map();
  if (Array.isArray(agents)) {
    for (const entry of agents) {
      const key = entry.agentType ?? entry.type ?? '*';
      if (!queues.has(key)) queues.set(key, []);
      queues.get(key).push(entry.return ?? entry.result ?? entry);
    }
  }

  const answerAgent = (spec) => {
    if (typeof agents === 'function') return agents(spec, calls);
    const key = spec.agentType ?? spec.type ?? '*';
    const queue = queues.get(key) ?? queues.get('*') ?? [];
    if (queue.length === 0) return null;
    return queue.length === 1 ? queue[0] : queue.shift();
  };

  const answerWorkflow = (called, calledArgs) => {
    if (typeof workflows === 'function') return workflows(called, calledArgs);
    return Object.prototype.hasOwnProperty.call(workflows, called) ? workflows[called] : null;
  };

  const agent = async (first, second) => {
    const spec = typeof first === 'string' ? { agentType: first, ...(second ?? {}) } : { ...(first ?? {}) };
    const answer = answerAgent(spec);
    calls.push({ kind: 'agent', spec, answer });
    return answer;
  };

  const workflow = async (called, calledArgs) => {
    const answer = answerWorkflow(called, calledArgs);
    calls.push({ kind: 'workflow', name: called, args: calledArgs, answer });
    return answer;
  };

  const meta = workflowMeta(name) ?? { name: name.replace(/\.js$/, '') };
  const source = workflowSource(name);

  try {
    if (hasTopLevelReturn(source)) {
      const body = new AsyncFunction('args', 'agent', 'workflow', 'meta', 'console', source);
      const result = await body(args, agent, workflow, meta, console);
      return { result, calls, agents: calls.filter((c) => c.kind === 'agent'), workflows: calls.filter((c) => c.kind === 'workflow'), error: null };
    }
    const module = await import(`${workflowFile(name)}?t=${Date.now()}`);
    const entry = module.default ?? module.run;
    if (typeof entry !== 'function') throw new Error('the script neither returns at top level nor exports a callable default');
    const result = await entry(args, { agent, workflow, meta });
    return { result, calls, agents: calls.filter((c) => c.kind === 'agent'), workflows: calls.filter((c) => c.kind === 'workflow'), error: null };
  } catch (error) {
    return { result: null, calls, agents: calls.filter((c) => c.kind === 'agent'), workflows: calls.filter((c) => c.kind === 'workflow'), error };
  }
}

/** The agent types dispatched, in order. */
export const dispatchedTypes = (run) => run.agents.map((call) => call.spec.agentType ?? call.spec.type ?? null);

/** The workflow names called, in order. */
export const nestedNames = (run) => run.workflows.map((call) => call.name);

/** Worker-shaped returns, for the fixtures a build case queues. */
export const workerReturn = (unit, status = 'green', extra = {}) => ({
  unit,
  status,
  branch: `sample-core/${unit}`,
  worktree: `.worktrees/${unit}`,
  spec_refs: ['B1'],
  checks: [{ id: 'T1', verdict: status === 'green' ? 'pass' : 'fail' }],
  artefacts: ['src/export/index.mjs'],
  commits: status === 'green' ? ['aaaaaaa'] : [],
  iterations: 3,
  halt: null,
  notes: '',
  ...extra,
});

export const adversaryReturn = (unit, blocking = false) => ({
  target: unit,
  fix: null,
  unit,
  verdict: blocking ? 'fail' : 'pass',
  pass: 1,
  findings: blocking
    ? [{ id: `F-${unit}`, severity: 'blocking', node: 'B1', unit, text: 'the unit does not hold B1', evidence: 'src/export/index.mjs:1' }]
    : [],
});

export const stewardReturn = (target, exit = 0) => ({ target, fix: null, command: `flight ${target}`, exit, stdout_tail: [], stderr_tail: [] });

/**
 * A responder that plays the crew: each agent type is answered from the world it is handed, and a steward invocation that
 * reads a document is answered with that document in its output tail, so a workflow that fetches the plan through the
 * steward and one that is handed it another way are both readable by the same case.
 * world = { plan, returns: { <agentType>: return | [returns] }, adversary: (unit, n) => return, steward: (command) => return }.
 */
export function crew(world = {}) {
  const seen = new Map();
  return (spec) => {
    const type = spec.agentType ?? spec.type ?? '';
    const text = JSON.stringify(spec);
    const n = (seen.get(type) ?? 0) + 1;
    seen.set(type, n);
    if (type === 'steward') {
      const command = commandOf(spec);
      if (typeof world.steward === 'function') return world.steward(command, n);
      if (/plan\.json/.test(command) && world.plan) return { target: 'plan', fix: null, command, exit: 0, stdout_tail: [JSON.stringify(world.plan)], stderr_tail: [] };
      if (/tests-map/.test(command) && world.map) return { target: 'map', fix: null, command, exit: 0, stdout_tail: [JSON.stringify(world.map)], stderr_tail: [] };
      return { target: 'steward', fix: null, command, exit: 0, stdout_tail: [], stderr_tail: [] };
    }
    if (type === 'adversary' && typeof world.adversary === 'function') return world.adversary(unitOf(spec), n);
    const answer = world.returns?.[type];
    if (Array.isArray(answer)) return answer[Math.min(n - 1, answer.length - 1)];
    if (typeof answer === 'function') return answer(unitOf(spec), n, spec);
    if (answer !== undefined) return answer;
    if (/text/.test(text)) return null;
    return null;
  };
}

/** The invocation a steward dispatch carries, wherever in the dispatch it sits. */
export function commandOf(spec) {
  const direct = spec.leaf ?? spec.command ?? spec.fill?.leaf ?? spec.input?.leaf;
  if (typeof direct === 'string') return direct;
  const text = JSON.stringify(spec);
  const match = /((?:flightdeck\/flightcrew\/bin\/)?flight [\w -]+[^"\\]*)/.exec(text) ?? /(git [\w -]+[^"\\]*)/.exec(text);
  return match ? match[1] : text;
}

/** The unit a dispatch names, from its target, unit or fill. */
export function unitOf(spec) {
  const direct = spec.target ?? spec.unit ?? spec.fill?.unit;
  if (typeof direct === 'string') return direct;
  const match = /\bU\d+\b/.exec(JSON.stringify(spec));
  return match ? match[0] : null;
}

/** runWorkflow, but a script that cannot be loaded or that threw is a failure of the case, not a silent empty run. */
export async function runWorkflowStrict(name, args, stubs) {
  const run = await runWorkflow(name, args, stubs);
  if (run.error) throw new Error(`${name} could not run: ${run.error.message}`);
  if (run.result === null || typeof run.result !== 'object') throw new Error(`${name} returned ${JSON.stringify(run.result)}, not an object`);
  return run;
}
