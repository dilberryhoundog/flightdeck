#!/usr/bin/env node
// FlightDeck guard: one script, three rules, the mode comes from argv[2].
//   truth   : agents may not write the owner's own words (fails open)
//   git     : agents may not push to main/master, force-push or delete remote branches (fails closed)
//   ceiling : nothing above Opus at high effort in agent launches, workflow scripts and model switches (fails open)
// Hook input is JSON on stdin; a refusal is printed as a PreToolUse / PreModelSwitch deny and the
// exit code is always 0. The git rule's command parser is adapted from the build's push-check.mjs
// (copied, not imported, so the plugin stands alone).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TRUTH_REASON = "This file holds the owner's own words; write a question in questions.md instead.";
const CEILING_REASON = "Owner's ceiling: Opus at high effort";
const PROTECTED_BRANCHES = new Set(['main', 'master']);

// ---------- shared ----------

function isAgentContext(input, env) {
  if (input && input.agent_id) return true;
  if (input && typeof input.agent_type === 'string' && input.agent_type.startsWith('flight:')) return true;
  return env?.FLIGHTDECK_UNATTENDED === '1';
}

// ---------- truth rule ----------

const PROTECTED_PATHS = [
  /(^|\/)\.flightdeck\/(.+\/)?constraints\.md$/,
  /(^|\/)\.flightdeck\/(VISION\.md|build\.txt)$/,
];

function hasHumanWriteFrontmatter(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return false; }
  const m = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  return !!m && /^write:\s*["']?human["']?\s*$/m.test(m[1]);
}

export function truthDecision(input, env = {}) {
  const e = env || {};
  const file = input?.tool_input?.file_path;
  if (typeof file !== 'string' || !file) return null;
  const caller = !!input.agent_id || input.agent_type === 'flight:runner' || e.FLIGHTDECK_UNATTENDED === '1';
  if (!caller) return null;
  const root = e.CLAUDE_PROJECT_DIR || input.cwd;
  if (!root) return null;
  const abs = path.resolve(root, file);
  const rel = path.relative(path.resolve(root), abs).split(path.sep).join('/');
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  if (PROTECTED_PATHS.some(re => re.test(rel))) return TRUTH_REASON;
  if (!/(^|\/)flightdeck\/templates\//.test(rel) && hasHumanWriteFrontmatter(abs)) return TRUTH_REASON;
  return null;
}

// ---------- git rule ----------

export function tokenize(segment) {
  const out = [];
  let cur = '', quote = null, has = false;
  for (const ch of segment) {
    if (quote) { if (ch === quote) quote = null; else cur += ch; continue; }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (/\s/.test(ch)) { if (has || cur) { out.push(cur); cur = ''; has = false; } continue; }
    cur += ch;
  }
  if (has || cur) out.push(cur);
  return out;
}

function segments(command) {
  return command
    .replace(/\$\(|`|\(|\)/g, '\n')
    .split(/&&|\|\||;|\||\n/)
    .map(s => s.trim())
    .filter(Boolean);
}

const branchName = ref => ref.replace(/^refs\/heads\//, '');
const PUSH_VALUE_OPTIONS = new Set(['-o', '--push-option', '--receive-pack', '--exec', '--repo']);
const GIT_VALUE_OPTIONS = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace', '--exec-path']);
const WRAPPERS = new Set(['command', 'exec', 'env', 'sudo', 'nohup', 'time']);
const SHELLS = new Set(['bash', 'sh', 'zsh', 'dash']);

// Returns a reason string when this push must be refused, otherwise null.
export function checkPush(args, currentBranch) {
  const positional = [];
  let hasRepoOption = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--') { positional.push(...args.slice(i + 1)); break; }
    if (a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || a === '--force-if-includes') return 'force push is not allowed (owner rule: never force-push)';
    if (a === '--mirror' || a === '--all') return `${a} would push every branch, including main (owner rule: never push to main)`;
    if (a === '--delete' || a === '-d') return 'deleting a remote branch is not allowed (owner rule: never delete a branch)';
    if (/^-[a-zA-Z]+$/.test(a) && a.includes('f')) return 'force push is not allowed (owner rule: never force-push)';
    if (/^-[a-zA-Z]+$/.test(a) && a.includes('d')) return 'deleting a remote branch is not allowed (owner rule: never delete a branch)';
    if (a.startsWith('-')) {
      if (a === '--repo' || a.startsWith('--repo=')) hasRepoOption = true;
      if (PUSH_VALUE_OPTIONS.has(a)) i++;
      continue;
    }
    positional.push(a);
  }
  const refspecs = hasRepoOption ? positional : positional.slice(1);
  if (refspecs.length === 0) {
    if (currentBranch && PROTECTED_BRANCHES.has(currentBranch)) return `a bare git push from ${currentBranch} would push to ${currentBranch} (owner rule: never push to main)`;
    return null;
  }
  for (const spec of refspecs) {
    if (spec.startsWith('+')) return 'a + refspec is a force push (owner rule: never force-push)';
    if (spec.startsWith(':')) return 'a :branch refspec deletes a remote branch (owner rule: never delete a branch)';
    const dst = spec.includes(':') ? spec.slice(spec.indexOf(':') + 1) : spec;
    const name = branchName(dst === 'HEAD' && currentBranch ? currentBranch : dst);
    if (PROTECTED_BRANCHES.has(name)) return `pushing to ${name} is not allowed (owner rule: never push to main)`;
  }
  return null;
}

// Finds every git push in a shell command and returns the first refusal reason, or null.
export function checkCommand(command, currentBranch, depth = 0) {
  for (const seg of segments(String(command))) {
    const t = tokenize(seg);
    let i = 0;
    for (;;) {
      while (i < t.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t[i])) i++;
      if (i < t.length && WRAPPERS.has(t[i])) {
        i++;
        while (i < t.length && t[i].startsWith('-')) i++;
        continue;
      }
      break;
    }
    if (!t[i]) continue;
    const prog = t[i].split('/').pop();
    if (SHELLS.has(prog) && depth < 3) {
      const c = t.indexOf('-c', i + 1);
      if (c >= 0 && t[c + 1]) {
        const reason = checkCommand(t[c + 1], currentBranch, depth + 1);
        if (reason) return reason;
      }
      continue;
    }
    if (prog === 'eval' && depth < 3) {
      const reason = checkCommand(t.slice(i + 1).join(' '), currentBranch, depth + 1);
      if (reason) return reason;
      continue;
    }
    if (prog !== 'git') continue;
    i++;
    while (i < t.length && t[i].startsWith('-')) {
      if (GIT_VALUE_OPTIONS.has(t[i])) i += 2; else i += 1;
    }
    if (t[i] !== 'push') continue;
    const reason = checkPush(t.slice(i + 1), currentBranch);
    if (reason) return reason;
  }
  return null;
}

export function gitDecision(input, env = {}, currentBranch = null) {
  if (!isAgentContext(input, env)) return null;
  const command = input?.tool_input?.command;
  if (typeof command !== 'string') throw new TypeError('tool_input.command is not a string');
  if (!/\bpush\b/.test(command)) return null;
  return checkCommand(command, currentBranch);
}

function currentBranchIn(cwd) {
  const run = args => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
  try { return run(['rev-parse', '--abbrev-ref', 'HEAD']) || null; } catch { /* try next */ }
  try { return run(['symbolic-ref', '--short', 'HEAD']) || null; } catch { return null; }
}

// ---------- ceiling rule ----------

const MODEL_FABLE_OR_BEST = /model['"`]?\s*:\s*['"`](fable|best)\b/i;
const MODEL_CONTAINS_FABLE = /model['"`]?\s*:\s*['"`][^'"`]*fable/i;
const EFFORT_ABOVE_HIGH = /effort['"`]?\s*:\s*['"`](xhigh|max)['"`]/i;

function textBreaksCeiling(text) {
  return MODEL_FABLE_OR_BEST.test(text) || MODEL_CONTAINS_FABLE.test(text) || EFFORT_ABOVE_HIGH.test(text);
}

function collectStrings(value, out = [], depth = 0) {
  if (out.length > 500 || depth > 8) return out;
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out, depth + 1);
  else if (value && typeof value === 'object') for (const v of Object.values(value)) collectStrings(v, out, depth + 1);
  return out;
}

export function ceilingDecision(input, env = {}, readFile = f => fs.readFileSync(f, 'utf8')) {
  if (!input) return null;
  const isSwitch = input.hook_event_name === 'PreModelSwitch' || (!input.tool_name && (input.to_model || input.requested_model));
  if (isSwitch) {
    if (typeof input.agent_type !== 'string' || !input.agent_type.startsWith('flight:')) return null;
    const to = String(input.to_model ?? '');
    const req = String(input.requested_model ?? '');
    if (/fable/i.test(to) || /fable/i.test(req) || req.toLowerCase() === 'best') return CEILING_REASON;
    return null;
  }
  const ti = input.tool_input;
  if (!ti || typeof ti !== 'object') return null;
  if (input.tool_name === 'Agent') {
    const model = typeof ti.model === 'string' ? ti.model.toLowerCase() : '';
    if (model === 'best' || model.includes('fable')) return CEILING_REASON;
    if (typeof ti.effort === 'string' && /^(xhigh|max)$/i.test(ti.effort)) return CEILING_REASON;
    return null;
  }
  if (input.tool_name === 'Workflow') {
    for (const s of collectStrings(ti)) {
      if (textBreaksCeiling(s)) return CEILING_REASON;
      const name = s.trim();
      if (/\.(m?js)$/.test(name) && name.length < 1024 && !name.includes('\n')) {
        let text = null;
        try { text = readFile(path.resolve(input.cwd || process.cwd(), name)); } catch { /* not a readable file */ }
        if (typeof text === 'string' && textBreaksCeiling(text)) return CEILING_REASON;
      }
    }
  }
  return null;
}

// ---------- command line ----------

function deny(eventName, reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: eventName, permissionDecision: 'deny', permissionDecisionReason: reason },
  }));
}

function main() {
  const mode = process.argv[2];
  let input;
  try {
    input = JSON.parse(fs.readFileSync(0, 'utf8'));
  } catch (e) {
    if (mode === 'git') deny('PreToolUse', `guard error: ${e.message}`);
    return;
  }
  const event = input?.hook_event_name === 'PreModelSwitch' ? 'PreModelSwitch' : 'PreToolUse';
  if (mode === 'git') {
    try {
      const agent = isAgentContext(input, process.env);
      const branch = agent && /\bpush\b/.test(String(input?.tool_input?.command ?? '')) ? currentBranchIn(input.cwd || process.cwd()) : null;
      const reason = gitDecision(input, process.env, branch);
      if (reason) deny(event, reason);
    } catch (e) {
      deny('PreToolUse', `guard error: ${e.message}`);
    }
    return;
  }
  try {
    const reason = mode === 'truth' ? truthDecision(input, process.env)
      : mode === 'ceiling' ? ceilingDecision(input, process.env)
        : null;
    if (reason) deny(event, reason);
  } catch { /* fails open */ }
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) {
  main();
  process.exitCode = 0;
}
