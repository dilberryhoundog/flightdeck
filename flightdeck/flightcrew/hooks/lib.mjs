// flightcrew/hooks/lib.mjs — the shared half of every flightcrew hook: reading the stdin envelope, resolving the root and the launch, turning an edit target into a repository-relative path, writing events, decisions and hooks.log lines, and swallowing every error so a hook can never break a session.
// Usage: import { runHook, runGuard, record, log, decide, targetPath, repoRelative } from './lib.mjs'; then runHook('<name>', async (ctx) => 0).

import fs from 'node:fs';
import path from 'node:path';

import {
  LaunchError, resolveRoot, resolveLaunch, appendEvent as appendLaunchEvent,
  readEvents, appendHookLog, readEscalation,
} from '../checks/lib/launch-lib.mjs';
import { repoRelative as gitRepoRelative, toplevel } from '../checks/lib/git-lib.mjs';
import { matchAny } from '../checks/lib/glob-lib.mjs';

/** The tools whose target a guard inspects; the settings fragment gives both guards this matcher. */
export const FILE_TOOLS = ['Edit', 'Write', 'NotebookEdit'];

/** The phases in which the boundary is enforced against the allowed paths. */
export const BOUNDARY_PHASES = ['contracts', 'implement', 'verify', 'review'];

export { readEscalation, readEvents, toplevel, matchAny };

// ── output ───────────────────────────────────────────────────────────────────
// A pipe on macOS can be asynchronous, so a hook that exits immediately after writing must write synchronously.
function writeFd(fd, text) {
  const buffer = Buffer.from(String(text));
  let offset = 0;
  while (offset < buffer.length) {
    try {
      offset += fs.writeSync(fd, buffer, offset, buffer.length - offset);
    } catch (error) {
      if (error.code === 'EAGAIN') {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2);
        continue;
      }
      return;
    }
  }
}

/** Writes to stdout synchronously. */
export function out(text) {
  writeFd(1, text);
}

/** Writes to stderr synchronously. */
export function err(text) {
  writeFd(2, text);
}

/** The last n non-trailing-empty lines of a block of output, as an array. */
export function tailLines(text, n = 20) {
  const lines = String(text ?? '').split('\n');
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.slice(-n);
}

/** A PreToolUse decision on stdout: the only shape Claude Code reads from a guard. */
export function decide(decision, reason) {
  out(`${JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: String(reason) },
  })}\n`);
}

/** A message shown to the session on stdout. */
export function systemMessage(text) {
  out(`${JSON.stringify({ systemMessage: String(text) })}\n`);
}

// ── stdin ────────────────────────────────────────────────────────────────────
function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseEnvelope(raw) {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── context ──────────────────────────────────────────────────────────────────
/**
 * The launch a hook acts on. $CLAUDE_PROJECT_DIR is the only root source: a hook without it, or whose root carries no
 * flightdeck/launch/, is a silent no-op and returns null, as it does when no launch is active or FLIGHTCREW_LAUNCH is
 * none. Two active launches or an unreadable launch.json come back as an ambiguity a guard turns into an ask decision
 * and a recorder ignores. No git command runs on this path.
 */
export function resolveContext(hook, { env = process.env, cwd = process.cwd() } = {}) {
  let root;
  let launchDir;
  try {
    ({ root, launchDir } = resolveRoot({ env, cwd, sources: ['CLAUDE_PROJECT_DIR'] }));
  } catch {
    return null;
  }
  let launch = null;
  let ambiguity = null;
  try {
    launch = resolveLaunch({ env, launchDir });
  } catch (error) {
    const code = error instanceof LaunchError ? error.code : null;
    if (code === 'TwoActive') {
      ambiguity = {
        kind: 'two-active',
        dir: null,
        reason: `two or more launches are active (${(error.names ?? []).join(', ')}); set FLIGHTCREW_LAUNCH to the run this session belongs to, or FLIGHTCREW_LAUNCH=none, before editing`,
      };
    } else if (code === 'Unreadable') {
      ambiguity = {
        kind: 'unreadable',
        dir: error.file ? path.dirname(error.file) : null,
        reason: `the resolved launch.json could not be read or parsed (${error.file ?? 'launch.json'}); repair it before editing`,
      };
    } else {
      return null;
    }
  }
  return {
    hook,
    env,
    cwd,
    root,
    launchDir,
    launch,
    ambiguity,
    input: null,
    logDir: launch?.dir ?? ambiguity?.dir ?? null,
  };
}

/** Appends one '<iso ts> <hook name> <message>' line to the launch's hooks.log. Silent when no launch folder is known. */
export function log(ctx, message) {
  if (!ctx?.logDir) return;
  try {
    appendHookLog(ctx.logDir, ctx.hook, message);
  } catch {
    // a hook never fails because it could not write its own log
  }
}

/** Appends one event line with source 'hook', carrying the envelope's session and agent fields. */
export function record(ctx, event, detail = {}, extra = {}) {
  if (!ctx?.launch) return null;
  try {
    return appendLaunchEvent(ctx.launch.dir, {
      event,
      launch: ctx.launch.name,
      phase: ctx.launch.json?.phase ?? 'unknown',
      source: 'hook',
      session_id: ctx.input?.session_id,
      ...extra,
      detail,
    });
  } catch {
    return null;
  }
}

/** The target of an Edit, Write or NotebookEdit as the envelope states it, or null. */
export function targetPath(input) {
  const toolInput = input?.tool_input;
  if (!toolInput || typeof toolInput !== 'object') return null;
  const target = toolInput.file_path ?? toolInput.notebook_path;
  return typeof target === 'string' && target.trim() !== '' ? target : null;
}

/** One edit target as a repository-relative path: absolutised against the envelope cwd, relative to its git toplevel (the worktree root inside a worktree). */
export function repoRelative(ctx, target) {
  return gitRepoRelative(target, { cwd: ctx?.input?.cwd || ctx?.cwd, projectDir: ctx?.root });
}

/** The absolute form of an edit target, against the envelope cwd. */
export function absoluteTarget(ctx, target) {
  return path.resolve(ctx?.input?.cwd || ctx?.cwd || process.cwd(), String(target));
}

/**
 * The fired abandon trigger: the newest 'trigger' event when no 'gate', 'escalation' or 'launch_end' event is newer.
 * Read here rather than through launch-lib's fired() so a malformed events file is a null rather than a throw.
 */
export function firedTrigger(ctx) {
  if (!ctx?.launch) return null;
  try {
    const { events } = readEvents(ctx.launch.dir);
    let trigger = null;
    let cleared = null;
    events.forEach((event, index) => {
      const at = Date.parse(event?.ts ?? '');
      const stamp = { at: Number.isFinite(at) ? at : 0, index, event };
      if (event?.event === 'trigger') trigger = stamp;
      else if (['gate', 'escalation', 'launch_end'].includes(event?.event)) cleared = stamp;
    });
    if (!trigger) return null;
    if (cleared && (cleared.at > trigger.at || (cleared.at === trigger.at && cleared.index > trigger.index))) return null;
    return trigger.event;
  } catch {
    return null;
  }
}

// ── the wrapper ──────────────────────────────────────────────────────────────
/**
 * Runs one hook: read stdin, resolve the launch, hand the context to the handler, exit with whatever it returns (0
 * unless it asks for 2). Silence is the answer to everything unusual — no launch, no root, stdin that is not a JSON
 * object (one hooks.log line when a launch is known), any thrown error — so a hook can never block or crash a session.
 */
export async function runHook(name, handler) {
  let ctx = null;
  try {
    const raw = readStdin();
    ctx = resolveContext(name);
    if (!ctx) process.exit(0);
    const input = parseEnvelope(raw);
    if (!input) {
      log(ctx, 'stdin was not a JSON object; no action taken');
      process.exit(0);
    }
    ctx.input = input;
    const code = await handler(ctx);
    process.exit(code === 2 ? 2 : 0);
  } catch (error) {
    try {
      log(ctx, `${name} failed: ${error?.message ?? error}`);
    } catch {
      // nothing further can be done; the hook still exits 0
    }
    process.exit(0);
  }
}

/**
 * Runs one PreToolUse guard. The parts both guards share sit here: only Edit, Write and NotebookEdit are inspected, an
 * ambiguous launch answers 'ask', a fired abandon trigger denies every edit, and the target reaches the guard as a
 * repository-relative path. decideForTarget(ctx, relativePath, absolutePath) returns 0.
 */
export function runGuard(name, decideForTarget) {
  return runHook(name, async (ctx) => {
    const input = ctx.input;
    if (input.hook_event_name !== 'PreToolUse') return 0;
    if (!FILE_TOOLS.includes(input.tool_name)) return 0;
    const target = targetPath(input);
    if (!target) return 0;
    if (ctx.ambiguity) {
      decide('ask', ctx.ambiguity.reason);
      return 0;
    }
    if (!ctx.launch) return 0;
    const trigger = firedTrigger(ctx);
    if (trigger) {
      const triggerName = trigger.detail?.name ?? 'unnamed';
      decide('deny', `abandon trigger ${triggerName} fired; end or exit the launch rather than editing anything further`);
      return 0;
    }
    const relative = repoRelative(ctx, target);
    if (typeof relative !== 'string' || relative === '') return 0;
    return decideForTarget(ctx, relative, absoluteTarget(ctx, target));
  });
}
