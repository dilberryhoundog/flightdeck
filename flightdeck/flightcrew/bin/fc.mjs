// flightcrew/bin/fc.mjs — the fc entry point: it parses the two global flags, resolves the launch root and the launch a command acts on, and hands the rest to bin/cmd/<command>.mjs.
// Usage: node flightdeck/flightcrew/bin/fc.mjs <command> [sub] [args] [--launch <name>] [--json]; exit 0 success, 1 usage or environment error, 2 failed check or blocking decision.
//
// A command module exports run(args, ctx) returning an exit code (undefined counts as 0), a `help` string, and
// optionally `needsLaunch` — a boolean or a function of the command's arguments. Assets (schemas, templates, crew,
// validators) resolve from this file's own location; the launch root resolves through launch-lib, so a run can act on
// any repository while the code stays where it was installed. ctx carries { root, launchDir, launch, env, json, cwd,
// fd } where fd holds the asset paths and launch is null for a command that does not need one.
// This module also exports the small helpers the command modules share: argument parsing, path resolution, spawning a
// validator, and the exit-guarded call used when one command renders through another.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LaunchError, resolveRoot, resolveLaunch } from '../checks/lib/launch-lib.mjs';
import { EXIT, fail, setJson } from '../checks/lib/output.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FLIGHTCREW = path.resolve(HERE, '..');
const FD = path.resolve(FLIGHTCREW, '..');

/** Every command fc dispatches, in the order the usage text lists them. */
export const COMMANDS = [
  'launch', 'check', 'verify', 'boundary', 'locked', 'budget', 'events', 'evidence', 'report', 'runlog',
  'plan', 'validate', 'lint', 'worker', 'critic', 'verifier', 'return', 'distribute', 'doctor',
];

/** Commands that act without resolving a launch. A module may override this with its own needsLaunch export. */
const WITHOUT_LAUNCH = new Set(['validate', 'lint', 'distribute', 'doctor']);

const USAGE = [
  'usage: fc <command> [sub] [args] [--launch <name>] [--json]',
  '',
  'commands:',
  '  launch new|activate|status|phase|gate|end|pin|kickoff|escalate|note|land',
  '  check [all|T...]        run the pinned checks and write evidence',
  '  verify                  check all, boundary, locked and budget',
  '  boundary | locked       the changed set since the lock commit',
  '  budget                  counts beside the ceilings',
  '  events append|usage|summary',
  '  evidence | report       render the evidence page or the run report',
  '  runlog stub|show        the run-log entry and the run log',
  '  plan write|render       store and render the plan',
  '  validate <kind> [path]  run a validator',
  '  lint spec <path>        run the spec readiness linter',
  '  worker render|merge|return',
  '  critic render | verifier render',
  '  return <kind> <file>    store an agent return',
  '  distribute | doctor',
];

/** The asset paths every command reads from, all under the flightdeck directory holding this script. */
export function assetPaths() {
  const flightcrew = FLIGHTCREW;
  const checks = path.join(flightcrew, 'checks');
  const templates = path.join(flightcrew, 'templates');
  return {
    fd: FD,
    flightcrew,
    bin: HERE,
    cmd: path.join(HERE, 'cmd'),
    checks,
    lib: path.join(checks, 'lib'),
    validators: path.join(checks, 'validators'),
    gates: path.join(checks, 'gates'),
    schemas: path.join(flightcrew, 'schemas'),
    templates,
    kickoff: path.join(templates, 'kickoff'),
    crew: path.join(flightcrew, 'crew'),
    hooks: path.join(flightcrew, 'hooks'),
    workflows: path.join(flightcrew, 'workflows'),
    manuals: path.join(FD, 'manuals'),
    testbench: path.join(FD, 'testbench'),
  };
}

/**
 * Splits arguments into positionals and flags. `spec` maps a flag name (without dashes) to 'boolean', 'string' or
 * 'array'. An unknown flag, or a value flag at the end of the list, throws a UsageError naming it.
 */
export function parseFlags(args, spec = {}) {
  const positional = [];
  const flags = {};
  for (const [name, kind] of Object.entries(spec)) {
    if (kind === 'array') flags[name] = [];
    else if (kind === 'boolean') flags[name] = false;
    else flags[name] = null;
  }
  const list = Array.isArray(args) ? args.map(String) : [];
  for (let i = 0; i < list.length; i += 1) {
    const item = list[i];
    if (!item.startsWith('--') || item === '--') {
      positional.push(item);
      continue;
    }
    const eq = item.indexOf('=');
    const name = (eq === -1 ? item.slice(2) : item.slice(2, eq));
    const kind = spec[name];
    if (!kind) throw new UsageError(`unknown flag --${name}`);
    if (kind === 'boolean') {
      flags[name] = true;
      continue;
    }
    let value;
    if (eq !== -1) value = item.slice(eq + 1);
    else {
      i += 1;
      if (i >= list.length) throw new UsageError(`--${name} needs a value`);
      value = list[i];
    }
    if (kind === 'array') flags[name].push(value);
    else flags[name] = value;
  }
  return { positional, flags };
}

/** A usage or environment error: fc prints its message on stderr and exits 1. */
export class UsageError extends Error {}

/** A failed check or a blocking decision: fc prints its message on stderr and exits 2. */
export class BlockedError extends Error {}

/** True when the path names an existing file. */
export function isFile(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** True when the path names an existing directory. */
export function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** A path given on the command line: absolute as given, else resolved against cwd, else against the launch root. */
export function resolveInput(ctx, given) {
  if (!given) return null;
  if (path.isAbsolute(given)) return given;
  const fromCwd = path.resolve(ctx.cwd, given);
  if (fs.existsSync(fromCwd)) return fromCwd;
  const fromRoot = path.resolve(ctx.root, given);
  if (fs.existsSync(fromRoot)) return fromRoot;
  return fromCwd;
}

/** A path under the launch root as a repository-relative path with '/' separators. */
export function repoPath(ctx, absolute) {
  return path.relative(ctx.root, absolute).split(path.sep).join('/');
}

/** Reads and parses a JSON file. Throws a UsageError naming the file when it cannot be read or parsed. */
export function readJsonFile(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new UsageError(`${file} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new UsageError(`${file} is not valid JSON: ${error.message}`);
  }
}

/** Writes a JSON document pretty-printed and newline-terminated, creating the directory when needed. */
export function writeJsonFile(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

/** The environment a child process of fc inherits: the parent's, plus the resolved launch and root. */
export function childEnv(ctx, extra = {}) {
  const env = { ...ctx.env };
  env.FLIGHTCREW_ROOT = ctx.root;
  if (ctx.launch) env.FLIGHTCREW_LAUNCH = ctx.launch.name;
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === null) delete env[key];
    else env[key] = String(value);
  }
  return env;
}

/**
 * Runs one validator or linter from flightcrew/checks/validators/ as a program, letting its own lines reach the
 * caller's streams, and returns its exit code. A validator that is not installed is an environment error, reported as
 * exit 1 with the path that is missing rather than passed over in silence.
 */
export function runValidator(ctx, name, args = [], options = {}) {
  const script = path.join(ctx.fd.validators, `${name}.mjs`);
  if (!isFile(script)) {
    fail(`validator not found: ${repoPath(ctx, script)}`);
    return EXIT.usage;
  }
  const result = spawnSync(process.execPath, [script, ...args.map(String)], {
    cwd: options.cwd ?? ctx.cwd,
    env: childEnv(ctx, options.env ?? {}),
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  if (options.capture) {
    return { code: typeof result.status === 'number' ? result.status : EXIT.usage, stdout: result.stdout ?? '', stderr: result.stderr ?? '' };
  }
  return typeof result.status === 'number' ? result.status : EXIT.usage;
}

class ExitSignal extends Error {
  constructor(code) {
    super(`exit ${code}`);
    this.code = code;
  }
}

/**
 * Calls another command module to produce a document, preferring its pure render(launchDir, ctx) and falling back to
 * its run(args, ctx). process.exit is held back for the duration of the fallback so that a command module written to
 * end the process does not end the command that is only borrowing its renderer. Returns the exit code it reported.
 */
export async function renderThrough(moduleUrl, ctx, args = []) {
  let module;
  try {
    module = await import(moduleUrl);
  } catch (error) {
    throw new UsageError(`could not load ${moduleUrl}: ${error.message}`);
  }
  if (typeof module.render === 'function') {
    await module.render(ctx.launch.dir, ctx);
    return EXIT.ok;
  }
  if (typeof module.run !== 'function') throw new UsageError(`${moduleUrl} exports neither render nor run`);
  const realExit = process.exit;
  let code = EXIT.ok;
  process.exit = (value) => {
    throw new ExitSignal(typeof value === 'number' ? value : EXIT.ok);
  };
  try {
    const returned = await module.run(args, ctx);
    if (typeof returned === 'number') code = returned;
  } catch (error) {
    if (error instanceof ExitSignal) code = error.code;
    else throw error;
  } finally {
    process.exit = realExit;
  }
  return code;
}

/** Pulls --launch and --json out of the argument list, wherever they appear, and returns them with the rest. */
function takeGlobals(argv) {
  const rest = [];
  let launch = null;
  let json = false;
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i];
    if (item === '--json') {
      json = true;
    } else if (item === '--launch') {
      i += 1;
      if (i >= argv.length) throw new UsageError('--launch needs a launch name');
      launch = argv[i];
    } else if (item.startsWith('--launch=')) {
      launch = item.slice('--launch='.length);
    } else {
      rest.push(item);
    }
  }
  return { rest, launch, json };
}

/** The line fc prints for each way the launch could not be resolved (spec E1, E3, E6, E13). */
function launchErrorLine(error) {
  if (error.code === 'TwoActive') return `two launches are active: ${(error.names ?? []).join(', ')}; pass --launch <name> or set FLIGHTCREW_LAUNCH`;
  if (error.code === 'MissingLaunch') return `no launch folder named ${error.launchName}`;
  return error.message;
}

async function main() {
  const argv = process.argv.slice(2);
  let globals;
  try {
    globals = takeGlobals(argv);
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  const [command, ...args] = globals.rest;
  if (globals.json) setJson(true);
  if (!command) {
    fail(['fc: no command given', ...USAGE]);
    return EXIT.usage;
  }
  if (!COMMANDS.includes(command)) {
    fail([`fc: unknown command '${command}'`, ...USAGE]);
    return EXIT.usage;
  }

  const env = { ...process.env };
  if (globals.launch !== null) env.FLIGHTCREW_LAUNCH = globals.launch;
  const cwd = process.cwd();

  let root;
  let launchDir;
  try {
    ({ root, launchDir } = resolveRoot({ env, cwd, scriptDir: HERE }));
  } catch (error) {
    fail(error instanceof LaunchError ? error.message : String(error?.message ?? error));
    return EXIT.usage;
  }

  const ctx = { root, launchDir, launch: null, env, json: globals.json, cwd, command, fd: assetPaths() };

  let module;
  try {
    module = await import(new URL(`./cmd/${command}.mjs`, import.meta.url).href);
  } catch (error) {
    fail([`fc: command '${command}' is not installed`, String(error?.message ?? error)]);
    return EXIT.usage;
  }

  let needs = true;
  if (typeof module.needsLaunch === 'function') needs = Boolean(module.needsLaunch(args));
  else if (typeof module.needsLaunch === 'boolean') needs = module.needsLaunch;
  else needs = !WITHOUT_LAUNCH.has(command);

  try {
    ctx.launch = resolveLaunch({ env, root, launchDir });
  } catch (error) {
    if (needs) {
      fail(error instanceof LaunchError ? launchErrorLine(error) : String(error?.message ?? error));
      return EXIT.usage;
    }
    ctx.launch = null;
  }

  try {
    const code = await module.run(args, ctx);
    return typeof code === 'number' ? code : EXIT.ok;
  } catch (error) {
    if (error instanceof UsageError) {
      fail(error.message);
      return EXIT.usage;
    }
    if (error instanceof BlockedError) {
      fail(error.message);
      return EXIT.blocked;
    }
    if (error instanceof LaunchError) {
      fail(launchErrorLine(error));
      return EXIT.usage;
    }
    fail(`fc ${command}: ${error && error.stack ? error.stack : error}`);
    return EXIT.usage;
  }
}

function invokedDirectly() {
  try {
    return Boolean(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main().then((code) => process.exit(code), (error) => {
    fail(`fc: ${error && error.stack ? error.stack : error}`);
    process.exit(EXIT.usage);
  });
}
