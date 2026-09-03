// flightcrew/checks/lib/launch-lib.mjs — finding the launch root and the active launch, and reading and writing the files inside a launch folder: launch.json, events.jsonl, escalation.json.
// Usage: import { resolveRoot, resolveLaunch, appendEvent, readEvents, fired } from '<relative>/checks/lib/launch-lib.mjs'.
//
// Exports: LaunchError (code: NoRoot | NoLaunch | TwoActive | MissingLaunch | Unreadable); ROOT_SOURCES;
// resolveRoot({ env, cwd, scriptDir, sources }) → { root, launchDir }; launchesIn(launchDir);
// resolveLaunch({ env, root, launchDir }) → { name, dir, json }; launchFile/readLaunch/writeLaunch;
// eventsFile/appendEvent/readEvents; hooksLogFile/appendHookLog; PHASES/nextPhase/isNextPhase/phaseIndex;
// fired(events)/firedIn(dir); escalationFile/readEscalation/writeEscalation/clearEscalation;
// bestEffortRender(dir, render) — render(launchDir) comes from the evidence command module, which the runner and the
// session-end hook import and pass in; passing nothing falls back to a run-time lookup of that module beside this one.
//
// Root resolution (design section 4): $FLIGHTCREW_ROOT, then $CLAUDE_PROJECT_DIR, then the git toplevel of cwd, then
// the repository holding the script. The first source that names a root is final; a root without flightdeck/launch/ is
// NoRoot, never a reason to fall through to a later source. Hooks pass sources: ['CLAUDE_PROJECT_DIR'], because a hook
// with $CLAUDE_PROJECT_DIR unset is a silent no-op.
// Launch resolution: FLIGHTCREW_LAUNCH names one launch whatever its status ('none' means no launch); otherwise the
// unique launch.json with status active. Nothing here writes outside the launch folder it is given, and importing
// this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { toplevel } from './git-lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The phases of a run, in the only order fc launch phase accepts. */
export const PHASES = ['targets', 'plan', 'contracts', 'implement', 'verify', 'review', 'report', 'ended'];

/** The root candidates, in the order design section 4 fixes. */
export const ROOT_SOURCES = ['FLIGHTCREW_ROOT', 'CLAUDE_PROJECT_DIR', 'cwd', 'script'];

/** Every failure a caller has to tell apart: the code says which, the message is the line fc prints. */
export class LaunchError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.code = code;
    for (const [key, value] of Object.entries(extra)) this[key] = value;
  }
}

function isDirectory(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function launchDirFor(root) {
  return path.join(root, 'flightdeck', 'launch');
}

/** The nearest ancestor of dir (dir included) that carries flightdeck/launch/, or null. */
function walkUpForLaunch(dir) {
  let current = path.resolve(dir);
  for (;;) {
    if (isDirectory(launchDirFor(current))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function candidatesFor(source, env, cwd, scriptDir) {
  if (source === 'FLIGHTCREW_ROOT' || source === 'CLAUDE_PROJECT_DIR') {
    const value = env?.[source];
    return typeof value === 'string' && value.trim() !== '' ? [path.resolve(value)] : [];
  }
  if (source === 'cwd') {
    const top = toplevel(cwd);
    return top ? [top] : [];
  }
  if (source === 'script') {
    const dir = scriptDir ?? HERE;
    const found = [];
    const top = toplevel(dir);
    if (top) found.push(top);
    const walked = walkUpForLaunch(dir);
    if (walked && !found.includes(walked)) found.push(walked);
    return found;
  }
  return [];
}

/**
 * The launch root and its launch directory. The first source that names a root decides: when that root carries no
 * flightdeck/launch/, resolution stops with LaunchError('NoRoot') and the line 'no flightdeck root' rather than moving
 * on to a later source, so a stated root can never be silently replaced by another repository. The same error stands
 * when no source names a root at all. scriptDir defaults to this library's own directory; sources may be narrowed.
 */
export function resolveRoot({ env = process.env, cwd = process.cwd(), scriptDir = null, sources = ROOT_SOURCES } = {}) {
  for (const source of sources) {
    const candidates = candidatesFor(source, env, cwd, scriptDir);
    if (candidates.length === 0) continue;
    for (const candidate of candidates) {
      if (isDirectory(launchDirFor(candidate))) {
        return { root: candidate, launchDir: launchDirFor(candidate) };
      }
    }
    throw new LaunchError('NoRoot', 'no flightdeck root', { source, root: candidates[0] });
  }
  throw new LaunchError('NoRoot', 'no flightdeck root');
}

/** The launch.json of a launch folder. */
export function launchFile(dir) {
  return path.join(dir, 'launch.json');
}

/** Parses a launch folder's launch.json. Throws LaunchError('Unreadable') when it is absent or not valid JSON. */
export function readLaunch(dir) {
  const file = launchFile(dir);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new LaunchError('Unreadable', `${file} could not be read: ${error.message}`, { file });
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new LaunchError('Unreadable', `${file} could not be parsed: ${error.message}`, { file });
  }
}

/** Writes launch.json, pretty-printed and newline-terminated. */
export function writeLaunch(dir, json) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(launchFile(dir), `${JSON.stringify(json, null, 2)}\n`);
  return json;
}

/** Every launch folder under launchDir: [{ name, dir, json, error }], json null when the file could not be parsed. */
export function launchesIn(launchDir) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(launchDir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries.sort((a, b) => (a.name < b.name ? -1 : 1))) {
    if (!entry.isDirectory() || entry.name === 'specs') continue;
    const dir = path.join(launchDir, entry.name);
    if (!isFile(launchFile(dir))) continue;
    try {
      found.push({ name: entry.name, dir, json: readLaunch(dir), error: null });
    } catch (error) {
      found.push({ name: entry.name, dir, json: null, error });
    }
  }
  return found;
}

/**
 * The launch a command or hook acts on: FLIGHTCREW_LAUNCH names one whatever its status ('none' means none), and
 * otherwise the unique launch.json with status active is it. Throws LaunchError with code NoLaunch ('no active
 * launch'), TwoActive (message and .names carry both), MissingLaunch (.launchName) or Unreadable (.file).
 */
export function resolveLaunch({ env = process.env, root = null, launchDir = null } = {}) {
  const dir = launchDir ?? (root ? launchDirFor(root) : null);
  if (!dir) throw new LaunchError('NoRoot', 'no flightdeck root');
  const selected = env?.FLIGHTCREW_LAUNCH;
  if (typeof selected === 'string' && selected.trim() !== '') {
    const name = selected.trim();
    if (name === 'none') throw new LaunchError('NoLaunch', 'no active launch');
    const folder = path.join(dir, name);
    if (!isFile(launchFile(folder))) {
      throw new LaunchError('MissingLaunch', `FLIGHTCREW_LAUNCH names launch ${name}, which does not exist`, { launchName: name, dir: folder });
    }
    return { name, dir: folder, json: readLaunch(folder) };
  }
  const all = launchesIn(dir);
  const active = all.filter((entry) => entry.json?.status === 'active');
  if (active.length === 1) return { name: active[0].name, dir: active[0].dir, json: active[0].json };
  if (active.length > 1) {
    const names = active.map((entry) => entry.name);
    throw new LaunchError('TwoActive', `two or more launches are active: ${names.join(', ')}`, { names });
  }
  const broken = all.find((entry) => entry.error);
  if (broken) throw broken.error;
  throw new LaunchError('NoLaunch', 'no active launch');
}

/** The events file of a launch folder. */
export function eventsFile(dir) {
  return path.join(dir, 'events.jsonl');
}

/** The hooks log of a launch folder. */
export function hooksLogFile(dir) {
  return path.join(dir, 'hooks.log');
}

function launchFacts(dir) {
  try {
    const json = readLaunch(dir);
    return { name: json?.name ?? path.basename(dir), phase: json?.phase ?? 'unknown' };
  } catch {
    return { name: path.basename(dir), phase: 'unknown' };
  }
}

/**
 * Appends one event line, filling ts (now, ISO), launch and phase (from launch.json) and source ('fc') when the
 * caller left them out. Returns the line as written.
 */
export function appendEvent(dir, event = {}) {
  const facts = launchFacts(dir);
  const line = {
    ts: event.ts ?? new Date().toISOString(),
    event: event.event,
    launch: event.launch ?? facts.name,
    phase: event.phase ?? facts.phase,
    source: event.source ?? 'fc',
  };
  for (const key of ['session_id', 'agent_id', 'agent_type']) {
    if (event[key] !== undefined && event[key] !== null) line[key] = String(event[key]);
  }
  line.detail = event.detail && typeof event.detail === 'object' ? event.detail : {};
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(eventsFile(dir), `${JSON.stringify(line)}\n`);
  return line;
}

/** Every parseable event line in order, with the count of lines that were not JSON. An absent file reads as empty. */
export function readEvents(dir) {
  let text;
  try {
    text = fs.readFileSync(eventsFile(dir), 'utf8');
  } catch {
    return { events: [], unparseable: 0 };
  }
  const events = [];
  let unparseable = 0;
  for (const line of text.split('\n')) {
    if (line.trim() === '') continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) events.push(parsed);
      else unparseable += 1;
    } catch {
      unparseable += 1;
    }
  }
  return { events, unparseable };
}

/** Appends one '<iso ts> <hook name> <message>' line to hooks.log. */
export function appendHookLog(dir, hookName, message) {
  const line = `${new Date().toISOString()} ${hookName} ${String(message).replace(/\s+/g, ' ').trim()}\n`;
  fs.mkdirSync(dir, { recursive: true });
  fs.appendFileSync(hooksLogFile(dir), line);
  return line;
}

/** The position of a phase in PHASES, or -1. */
export function phaseIndex(phase) {
  return PHASES.indexOf(phase);
}

/** The phase that follows this one, or null at the end of the run. */
export function nextPhase(phase) {
  const index = phaseIndex(phase);
  if (index === -1 || index === PHASES.length - 1) return null;
  return PHASES[index + 1];
}

/** True when 'to' is the phase immediately after 'from'. */
export function isNextPhase(from, to) {
  return nextPhase(from) === to && to !== null;
}

function timeOf(event) {
  const parsed = Date.parse(event?.ts ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
}

/** The newest event of a set of names, with its position, or null. Ties are broken by position: the later line wins. */
function newestOf(events, names) {
  let best = null;
  events.forEach((event, index) => {
    if (!names.includes(event?.event)) return;
    const at = timeOf(event);
    if (best === null || at > best.at || (at === best.at && index > best.index)) best = { event, at, index };
  });
  return best;
}

/**
 * The fired abandon trigger: the newest 'trigger' event, when it is newer than the newest 'gate', 'escalation' or
 * 'launch_end' event. Returns that event, or null when no trigger stands.
 */
export function fired(events) {
  const list = Array.isArray(events) ? events : [];
  const trigger = newestOf(list, ['trigger']);
  if (!trigger) return null;
  const cleared = newestOf(list, ['gate', 'escalation', 'launch_end']);
  if (cleared && (cleared.at > trigger.at || (cleared.at === trigger.at && cleared.index > trigger.index))) return null;
  return trigger.event;
}

/** fired() for a launch folder, reading its events file. */
export function firedIn(dir) {
  return fired(readEvents(dir).events);
}

/** The escalation file of a launch folder; its presence releases the stop gate. */
export function escalationFile(dir) {
  return path.join(dir, 'escalation.json');
}

/** The open escalation, or null when there is none or the file cannot be parsed. */
export function readEscalation(dir) {
  try {
    const parsed = JSON.parse(fs.readFileSync(escalationFile(dir), 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** Writes the open escalation, filling at (now, ISO) when the caller left it out. */
export function writeEscalation(dir, escalation = {}) {
  const record = { at: escalation.at ?? new Date().toISOString(), ...escalation };
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(escalationFile(dir), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

/** Removes the escalation file. Returns true when a file was there to remove. */
export function clearEscalation(dir) {
  try {
    fs.rmSync(escalationFile(dir));
    return true;
  } catch {
    return false;
  }
}

/**
 * Regenerates evidence.html for a launch folder, swallowing every failure: this never changes a caller's exit code.
 * The renderer is supplied by the caller — the commands and the session-end hook import the evidence command module
 * themselves and pass its render(launchDir), which keeps this library free of any dependency on the runner layer.
 * When no renderer is passed, the evidence command module is looked up beside this library at run time and used when
 * it is there; a build without it simply leaves the page as it was. Returns true when a page was rendered.
 */
export async function bestEffortRender(dir, render = null) {
  try {
    let fn = typeof render === 'function' ? render : null;
    if (!fn) {
      const url = new URL('../../bin/cmd/evidence.mjs', import.meta.url);
      if (!isFile(fileURLToPath(url))) return false;
      const module = await import(url.href);
      fn = module.render ?? module.renderEvidence ?? null;
    }
    if (typeof fn !== 'function') return false;
    await fn(dir);
    return true;
  } catch {
    return false;
  }
}
