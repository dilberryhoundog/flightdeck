// flightcrew/bin/cmd/doctor.mjs — checks that the installation is whole and, with a target, that a project's .claude directory carries the distribution the system expects.
// Usage: fc doctor [--target <dir>]; exit 0 when every condition holds, 1 on a usage error, 2 when any condition failed.

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { launchesIn } from '../../checks/lib/launch-lib.mjs';
import { EXIT, fail, print, warn } from '../../checks/lib/output.mjs';

export const help = [
  'fc doctor                          check node, git, the launches, the crew, the scripts, the schemas and the manifest',
  'fc doctor --target <dir>           also check a distributed .claude directory against this installation',
].join('\n');

/** doctor reports on every launch it finds rather than acting on one, so it never resolves a single launch. */
export const needsLaunch = false;

const REQUIRED_NODE_MAJOR = 22;
const CREW_FRONTMATTER = ['name', 'description', 'tools', 'model'];

function readText(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function readJson(file) {
  const text = readText(file);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function listing(dir, filter) {
  try {
    return fs.readdirSync(dir).filter(filter).sort();
  } catch {
    return [];
  }
}

/** Every file under dir whose name passes the filter, walked to any depth, in sorted order. */
function walk(dir, filter) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1));
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...walk(full, filter));
    else if (filter(entry.name)) found.push(full);
  }
  return found;
}

/** The frontmatter of a markdown file as a flat map of its scalar keys, or null when the file carries none. */
function frontmatter(text) {
  if (typeof text !== 'string' || !text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fields = {};
  for (const line of text.slice(3, end).split('\n')) {
    const at = line.indexOf(':');
    if (at === -1) continue;
    const key = line.slice(0, at).trim();
    if (key === '' || key.startsWith('#')) continue;
    fields[key] = line.slice(at + 1).trim();
  }
  return fields;
}

/** Every hook command the settings fragment declares, keyed by the event it belongs to. */
function fragmentCommands(fragment) {
  const byEvent = new Map();
  for (const [event, entries] of Object.entries(fragment?.hooks ?? {})) {
    const commands = [];
    for (const entry of Array.isArray(entries) ? entries : []) {
      for (const hook of Array.isArray(entry.hooks) ? entry.hooks : []) {
        if (typeof hook.command === 'string') commands.push(hook.command);
      }
    }
    byEvent.set(event, commands);
  }
  return byEvent;
}

/** The conditions doctor reports on, each as one 'ok' or 'FAIL' line with the detail a reader needs. */
class Report {
  constructor() {
    this.failed = 0;
  }

  pass(label, detail) {
    print(`ok    ${label}${detail ? `: ${detail}` : ''}`);
  }

  fail(label, detail) {
    this.failed += 1;
    print(`FAIL  ${label}${detail ? `: ${detail}` : ''}`);
  }

  say(label, ok, detail) {
    if (ok) this.pass(label, detail);
    else this.fail(label, detail);
  }
}

// ── the installation ─────────────────────────────────────────────────────────

function checkNode(report) {
  const major = Number(String(process.versions.node).split('.')[0]);
  report.say('node', major >= REQUIRED_NODE_MAJOR, `v${process.versions.node} (${REQUIRED_NODE_MAJOR} or newer required)`);
}

function checkGit(report) {
  const result = spawnSync('git', ['--version'], { encoding: 'utf8' });
  report.say('git', result.status === 0, result.status === 0 ? result.stdout.trim() : 'not on PATH');
}

function checkLaunches(report, launchDir) {
  const all = launchesIn(launchDir);
  const active = all.filter((entry) => entry.json?.status === 'active');
  const unreadable = all.filter((entry) => entry.error).map((entry) => entry.name);
  if (active.length > 1) {
    report.fail('launch', `two or more launches are active: ${active.map((entry) => entry.name).join(', ')}`);
  } else if (unreadable.length > 0) {
    report.fail('launch', `launch.json could not be read for ${unreadable.join(', ')}`);
  } else {
    report.pass('launch', `${all.length} launch folders, ${active.length} active${active.length === 1 ? ` (${active[0].name} in phase ${active[0].json?.phase ?? 'unknown'})` : ''}`);
  }
}

function checkCrew(report, fd) {
  const names = listing(fd.crew, (n) => n.endsWith('.md'));
  const problems = [];
  let agents = 0;
  for (const name of names) {
    const fields = frontmatter(readText(path.join(fd.crew, name)));
    if (fields === null) continue;
    agents += 1;
    const missing = CREW_FRONTMATTER.filter((key) => !fields[key]);
    if (missing.length > 0) problems.push(`${name} has no ${missing.join(', ')}`);
  }
  if (agents === 0) problems.push('no crew file carries frontmatter');
  report.say('crew', problems.length === 0, problems.length === 0 ? `${agents} agent definitions parse with name, description, tools and model` : problems.join('; '));
  return names;
}

function checkScripts(report, fd) {
  const files = [...walk(fd.bin, (n) => n.endsWith('.mjs')), ...walk(fd.checks, (n) => n.endsWith('.mjs')), ...walk(fd.hooks, (n) => n.endsWith('.mjs'))];
  const broken = [];
  for (const file of files) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) broken.push(`${path.relative(fd.fd, file)} (${(result.stderr ?? '').trim().split('\n')[0]})`);
  }
  report.say('scripts', broken.length === 0, broken.length === 0 ? `${files.length} scripts pass node --check` : broken.join('; '));
}

function checkSchemas(report, fd) {
  const names = listing(fd.schemas, (n) => n.endsWith('.json'));
  const broken = names.filter((name) => readJson(path.join(fd.schemas, name)) === null);
  if (names.length === 0) report.fail('schemas', 'flightcrew/schemas/ holds no schema');
  else report.say('schemas', broken.length === 0, broken.length === 0 ? `${names.length} schemas parse` : `${broken.join(', ')} do not parse`);
}

function checkSampleLaunch(report, fd, ctx) {
  const sample = path.join(fd.testbench, 'fixtures', 'sample-launch', 'launch.json');
  if (!fs.existsSync(sample)) {
    report.fail('sample launch', `${path.relative(fd.fd, sample)} is missing`);
    return;
  }
  const validator = path.join(fd.validators, 'validate-launch.mjs');
  if (!fs.existsSync(validator)) {
    report.fail('sample launch', 'checks/validators/validate-launch.mjs is not installed');
    return;
  }
  const result = spawnSync(process.execPath, [validator, sample], { encoding: 'utf8', env: { ...ctx.env, FLIGHTCREW_LAUNCH: 'none' } });
  report.say('sample launch', result.status === 0, result.status === 0 ? 'validates without --resolve-commits' : `${(result.stdout ?? '').trim().split('\n')[0] || (result.stderr ?? '').trim().split('\n')[0]}`);
}

function checkManifest(report, fd) {
  const file = path.join(fd.flightcrew, 'MANIFEST.txt');
  const text = readText(file);
  if (text === null) {
    report.fail('manifest', 'flightcrew/MANIFEST.txt is missing');
    return;
  }
  const repo = path.resolve(fd.fd, '..');
  const paths = text.split('\n').map((line) => line.trim()).filter((line) => line !== '' && !line.startsWith('#'));
  const missing = [];
  for (const rel of paths) {
    let stat = null;
    try {
      stat = fs.statSync(path.resolve(repo, rel));
    } catch {
      stat = null;
    }
    if (stat === null) missing.push(`${rel} is missing`);
    else if (stat.isFile() && stat.size === 0) missing.push(`${rel} is empty`);
  }
  report.say('manifest', missing.length === 0, missing.length === 0 ? `${paths.length} paths exist and are not empty` : missing.slice(0, 8).join('; '));
}

function checkTurnCap(report, fd) {
  const fields = frontmatter(readText(path.join(fd.crew, 'implementer.md')));
  const cap = fields?.maxTurns ? Number(fields.maxTurns) : null;
  report.say('implementer turn cap', Number.isFinite(cap) && cap > 0, cap === null ? 'implementer.md declares no maxTurns' : `maxTurns ${cap}`);
}

// ── a distributed target ─────────────────────────────────────────────────────

function checkTarget(report, fd, target) {
  const agentsDir = path.join(target, 'agents', 'flightcrew');
  const crewNames = new Set();
  const differing = [];
  for (const name of listing(fd.crew, (n) => n.endsWith('.md'))) {
    const source = readText(path.join(fd.crew, name));
    if (source === null || !source.startsWith('---')) continue;
    const fields = frontmatter(source);
    if (fields?.name) crewNames.add(fields.name);
    const there = readText(path.join(agentsDir, name));
    if (there === null) differing.push(`${name} is not in the target`);
    else if (there !== source) differing.push(`${name} differs from flightcrew/crew/${name}`);
  }
  report.say('target agents', differing.length === 0, differing.length === 0 ? `${crewNames.size} agents are byte-equal to flightcrew/crew/` : differing.join('; '));

  const settings = readJson(path.join(target, 'settings.json'));
  if (settings === null) {
    report.fail('target settings', `${path.join(target, 'settings.json')} is missing or does not parse`);
  } else {
    const fragment = readJson(path.join(fd.hooks, 'settings.fragment.json'));
    const wanted = fragmentCommands(fragment);
    const there = fragmentCommands(settings);
    const missing = [];
    for (const [event, commands] of wanted) {
      const have = there.get(event) ?? [];
      for (const command of commands) {
        const present = have.some((line) => line === command || line.replace(/^\S+(?=\s)/, 'node') === command);
        if (!present) missing.push(`${event}: ${command}`);
      }
    }
    report.say('target hooks', missing.length === 0, missing.length === 0 ? `every fragment hook command is in settings.json (${wanted.size} events)` : missing.join('; '));
    // A hook command whose interpreter is not on PATH fails silently at every event, so the leading token is resolved
    // rather than only compared as text (design section 6: 'hook node resolvable').
    const interpreters = new Set();
    for (const commands of there.values()) {
      for (const command of commands) {
        const token = String(command).trim().split(/\s+/)[0];
        if (token) interpreters.add(token);
      }
    }
    const unresolved = [...interpreters].filter((token) => (path.isAbsolute(token)
      ? !fs.existsSync(token)
      : spawnSync(token, ['--version'], { encoding: 'utf8' }).status !== 0));
    report.say('target hook interpreter', unresolved.length === 0, unresolved.length === 0
      ? `every hook interpreter resolves (${[...interpreters].join(', ')})`
      : `${unresolved.join(', ')} does not resolve on this machine`);
    const baseRef = settings.worktree?.baseRef;
    report.say('target worktree.baseRef', baseRef === 'head', `worktree.baseRef is ${baseRef ?? 'unset'}, and the crew's worktrees branch from head`);
  }

  const ignore = readText(path.join(path.dirname(target), '.gitignore'));
  report.say('target gitignore', typeof ignore === 'string' && ignore.includes('.claude/worktrees/'), '.claude/worktrees/ is ignored beside the target');

  const collisions = [];
  for (const file of walk(path.join(target, 'agents'), (n) => n.endsWith('.md'))) {
    if (path.dirname(file) === agentsDir) continue;
    const fields = frontmatter(readText(file));
    if (fields?.name && crewNames.has(fields.name)) collisions.push(`${path.basename(file)} carries the crew name ${fields.name}`);
  }
  report.say('target agent names', collisions.length === 0, collisions.length === 0 ? 'no other agent carries a crew name' : collisions.join('; '));

  if (spawnSync('gh', ['--version'], { encoding: 'utf8' }).status !== 0) {
    warn('gh is not on PATH: fc launch land and the pull-request step of a run need it');
  }
}

// ── the command ──────────────────────────────────────────────────────────────

export async function run(args, ctx) {
  let target = null;
  for (let i = 0; i < args.length; i += 1) {
    const item = String(args[i]);
    if (item === '--target') {
      i += 1;
      if (i >= args.length) {
        fail('fc doctor: --target needs a directory');
        return EXIT.usage;
      }
      target = String(args[i]);
    } else if (item.startsWith('--target=')) target = item.slice('--target='.length);
    else {
      fail(`fc doctor: unexpected argument ${item}`);
      return EXIT.usage;
    }
  }
  const fd = ctx.fd;
  const report = new Report();
  checkNode(report);
  checkGit(report);
  checkLaunches(report, ctx.launchDir);
  checkCrew(report, fd);
  checkScripts(report, fd);
  checkSchemas(report, fd);
  checkSampleLaunch(report, fd, ctx);
  checkManifest(report, fd);
  checkTurnCap(report, fd);
  if (target !== null) checkTarget(report, fd, path.resolve(ctx.cwd ?? process.cwd(), target));
  print(report.failed === 0 ? 'doctor: every condition holds' : `doctor: ${report.failed} conditions failed`);
  return report.failed === 0 ? EXIT.ok : EXIT.blocked;
}
