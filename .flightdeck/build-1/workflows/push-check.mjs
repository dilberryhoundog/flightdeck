#!/usr/bin/env node
// PreToolUse hook for the build's nested sessions: refuses a git push to main or master,
// any force push and any remote branch deletion. Fails closed: an internal error denies.
import { execFileSync } from 'node:child_process';

const PROTECTED = new Set(['main', 'master']);

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
  return command.split(/&&|\|\||;|\||\n/).map(s => s.trim()).filter(Boolean);
}

function branchName(ref) {
  return ref.replace(/^refs\/heads\//, '');
}

// Returns a reason string when the push must be refused, otherwise null.
export function checkPush(args, currentBranch) {
  const positional = [];
  for (const a of args) {
    if (a === '--force' || a === '-f' || a.startsWith('--force-with-lease') || a === '--force-if-includes') return 'force push is not allowed (owner rule: never force-push)';
    if (a === '--mirror' || a === '--all') return `${a} would push every branch, including main (owner rule: never push to main)`;
    if (a === '--delete' || a === '-d') return 'deleting a remote branch is not allowed (owner rule: never delete a branch)';
    if (/^-[a-zA-Z]*f[a-zA-Z]*$/.test(a) && !a.startsWith('--')) return 'force push is not allowed (owner rule: never force-push)';
    if (a.startsWith('-')) continue;
    positional.push(a);
  }
  const refspecs = positional.slice(1);
  if (refspecs.length === 0) {
    if (currentBranch && PROTECTED.has(currentBranch)) return `a bare git push from ${currentBranch} would push to ${currentBranch} (owner rule: never push to main)`;
    return null;
  }
  for (const spec of refspecs) {
    if (spec.startsWith('+')) return 'a + refspec is a force push (owner rule: never force-push)';
    if (spec.startsWith(':')) return 'a :branch refspec deletes a remote branch (owner rule: never delete a branch)';
    const dst = spec.includes(':') ? spec.slice(spec.indexOf(':') + 1) : spec;
    const name = branchName(dst === 'HEAD' && currentBranch ? currentBranch : dst);
    if (PROTECTED.has(name)) return `pushing to ${name} is not allowed (owner rule: never push to main)`;
  }
  return null;
}

// Finds every git push in a shell command and returns the first refusal reason, or null.
export function checkCommand(command, currentBranch) {
  for (const seg of segments(command)) {
    const t = tokenize(seg);
    let i = 0;
    while (i < t.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(t[i])) i++;
    if (t[i] === 'command' || t[i] === 'exec') i++;
    if (!t[i] || !/(^|\/)git$/.test(t[i])) continue;
    i++;
    while (i < t.length && t[i].startsWith('-')) {
      if (t[i] === '-C' || t[i] === '-c') i += 2; else i += 1;
    }
    if (t[i] !== 'push') continue;
    const reason = checkPush(t.slice(i + 1), currentBranch);
    if (reason) return reason;
  }
  return null;
}

function currentBranchIn(cwd) {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch { return null; }
}

function deny(reason) {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
  process.exit(0);
}

async function main() {
  let raw = '';
  for await (const chunk of process.stdin) raw += chunk;
  try {
    const input = JSON.parse(raw);
    const command = input?.tool_input?.command ?? '';
    if (!/\bgit\b/.test(command) || !/\bpush\b/.test(command)) process.exit(0);
    const reason = checkCommand(command, currentBranchIn(input.cwd || process.cwd()));
    if (reason) deny(reason);
    process.exit(0);
  } catch (e) {
    deny(`guard error: ${e.message}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
