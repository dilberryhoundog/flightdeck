// flightcrew/bin/cmd/launch.mjs — fc launch: opening a run, activating it, pinning its targets, rendering its kickoff, moving it through the phases and gates, escalating, noting, ending and landing it.
// Usage: node flightdeck/flightcrew/bin/fc.mjs launch new|activate|status|phase|gate|end|pin|kickoff|escalate|note|land [args]; exit 0 on success, 1 on a usage or environment error, 2 on a blocking decision.
//
// The launch folder is the run's whole record: launch.json is its state, kickoff.md is rendered from the library parts
// and the current pins, events.jsonl is what happened, and evidence/, returns/ and review/ hold what the run produced.
// Every state change here writes launch.json, appends the event design 5.3 names for it, and re-renders the evidence
// page best-effort so the page is never behind the state. Nothing here is hand-written by an agent: kickoff.md and the
// pinned copies are produced by these commands, which is why re-rendering a kickoff restores it byte for byte.
// A refusal writes nothing: every precondition is read before the first write, so a launch never lands half-changed.

import fs from 'node:fs';
import path from 'node:path';
import {
  appendEvent, bestEffortRender, clearEscalation, firedIn, isNextPhase, launchesIn,
  PHASES, readEvents, readLaunch, writeEscalation, writeLaunch,
} from '../../checks/lib/launch-lib.mjs';
import * as git from '../../checks/lib/git-lib.mjs';
import { matchAny } from '../../checks/lib/glob-lib.mjs';
import { EXIT, fail, json, ok, print, warn } from '../../checks/lib/output.mjs';
import {
  BlockedError, isDir, isFile, parseFlags, readJsonFile, renderThrough, repoPath, resolveInput,
  runValidator, UsageError,
} from '../fc.mjs';
import { countBudget } from './budget.mjs';
import { pinnedMap } from './check.mjs';
import { writeStub } from './runlog.mjs';

export const help = [
  'fc launch new <spec-path> [--name N] [--kickoff base+shape-<s>+task-<t>] [--branch B] [--allow <glob>]...',
  'fc launch activate [<name>] [--allow-draft]      fc launch status',
  'fc launch phase <p> [--force]                    fc launch gate <G1|G2|G3> <approve|exit> [--note <text>] [--force]',
  'fc launch pin tests-map <path> [--allow-draft]   fc launch kickoff [--parts base+shape-<s>+task-<t>]',
  'fc launch escalate <kind> --detail <text>        fc launch note <text>',
  'fc launch end <outcome> [--at <stage>] [--units U,...]',
  'fc launch land --commit <sha> [--pr <url>] [--evidence-commit <sha>]',
].join('\n');

/** new and activate name the launch they act on, so neither waits for one to be resolved. */
export const needsLaunch = (args) => !['new', 'activate'].includes(args?.[0]);

const OUTCOMES = ['accepted', 'accepted-with-reservations', 'abandoned', 'partial'];
const ACCEPTED_FAMILY = ['accepted', 'accepted-with-reservations', 'partial'];
const GATES = ['G1', 'G2', 'G3'];
const ESCALATION_KINDS = ['spec-gap', 'wrong-check', 'blocked', 'trigger', 'budget', 'halt'];
const DEFAULT_PARTS = 'base+shape-session+task-feature';

/** The launch.json a new launch starts from when the template carries no value of its own. */
const BUILT_IN_DEFAULTS = {
  acceptance: 'T1',
  structural: {
    '.mjs': 'node --check {file}',
    '.js': 'node --experimental-default-type=module --check {file}',
    '.json': 'node -e "JSON.parse(require(\'node:fs\').readFileSync(process.argv[1], \'utf8\'))" {file}',
    '.sh': 'sh -n {file}',
  },
  ceilings: {
    agents: 12,
    implementers_concurrent: 4,
    turns_per_agent: 25,
    gate_iterations: 3,
    stop_blocks: 8,
    critic_passes: 2,
    minutes: 240,
    tokens: null,
    expected_tokens: null,
  },
};

// ── small readers ────────────────────────────────────────────────────────────

function readJsonSafe(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function unique(list) {
  return [...new Set(list)];
}

function shortHash(value) {
  return typeof value === 'string' && value !== '' ? value.slice(0, 7) : '(none)';
}

function sameCommit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a === '' || b === '') return false;
  return a.startsWith(b) || b.startsWith(a);
}

function firstWord(text) {
  return String(text ?? '').trim().split(/\s+/)[0] ?? '';
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** True when `descendant` is `ancestor` or a commit after it. A hash git cannot resolve answers false. */
function ranSince(root, ancestor, descendant) {
  if (!ancestor) return true;
  if (!descendant) return false;
  return git.run(['merge-base', '--is-ancestor', String(ancestor), String(descendant)], root).ok;
}

/** The launch folder a name points at, read. Throws a UsageError naming the folder when it is not there. */
function launchAt(ctx, name) {
  const dir = path.join(ctx.launchDir, name);
  if (!isFile(path.join(dir, 'launch.json'))) throw new UsageError(`no launch folder named ${name}`);
  return { name, dir, json: readLaunch(dir) };
}

// ── the kickoff ──────────────────────────────────────────────────────────────

/** The version comment every kickoff library part opens with, as a number. */
function partVersion(text) {
  const found = /^<!--\s*version:\s*(\d+)\s*-->/.exec(String(text).split('\n')[0] ?? '');
  return found ? Number(found[1]) : null;
}

/**
 * The library parts a kickoff spec names, in the order it names them. A part that is not in the library, or one
 * without its version comment, is an environment error naming the file, because a kickoff assembled from a part
 * whose version cannot be read could never be traced back to what an agent was told.
 */
function loadParts(ctx, spec) {
  const names = String(spec ?? '').split('+').map((name) => name.trim()).filter((name) => name !== '');
  if (names.length === 0) throw new UsageError('a kickoff needs parts: base+shape-<s>+task-<t>');
  if (names[0] !== 'base') throw new UsageError(`a kickoff starts with the base part: ${names.join('+')}`);
  const parts = [];
  for (const name of names) {
    const file = path.join(ctx.fd.kickoff, `${name}.md`);
    if (!isFile(file)) throw new UsageError(`kickoff part not found: ${repoPath(ctx, file)}`);
    const text = fs.readFileSync(file, 'utf8');
    const version = partVersion(text);
    if (version === null) throw new UsageError(`kickoff part has no version comment: ${repoPath(ctx, file)}`);
    parts.push({ name, text: text.trim(), version });
  }
  return parts;
}

/** Every other launch of the same spec that has a report, as repository-relative paths in name order. */
function priorReports(ctx, launchJson) {
  const found = [];
  for (const entry of launchesIn(ctx.launchDir)) {
    if (entry.name === launchJson.name) continue;
    if (entry.json?.spec?.name !== launchJson.spec?.name) continue;
    const report = path.join(entry.dir, 'report.md');
    if (isFile(report)) found.push(repoPath(ctx, report));
  }
  return found.sort();
}

/**
 * kickoff.md for a launch: the header block of spec I11 and then the library parts in order. Pure apart from the
 * launch folder it reads the pins and the prior reports from, so re-rendering an unchanged launch restores exactly
 * the bytes the last render wrote — which is what makes a hand edit to kickoff.md recoverable.
 */
export function renderKickoff(ctx, launchDir, launchJson, partsSpec) {
  const parts = loadParts(ctx, partsSpec);
  const shape = parts.find((part) => part.name.startsWith('shape-'));
  const task = parts.find((part) => part.name.startsWith('task-'));
  if (!shape || !task) throw new UsageError(`a kickoff names one shape-<s> and one task-<t> part; got ${partsSpec}`);
  const version = parts.map((part) => `${part.name}@${part.version}`).join('+');
  const launchRel = repoPath(ctx, launchDir);
  const specPath = repoPath(ctx, path.resolve(launchDir, launchJson.spec?.path ?? ''));
  const specLine = `${specPath} @ ${launchJson.spec?.commit ?? 'draft'}`;
  const mapLine = launchJson.tests_map
    ? `${repoPath(ctx, path.resolve(launchDir, launchJson.tests_map.path ?? ''))} @ ${launchJson.tests_map.commit ?? 'draft'}`
    : '(none)';
  const priors = priorReports(ctx, launchJson);
  const header = [
    `# Kickoff: ${task.name} · ${shape.name}`,
    `launch: ${launchRel}    spec: ${specLine}    tests-map: ${mapLine}`,
    `kickoff version: ${version}`,
    `read first: ${repoPath(ctx, path.join(ctx.launchDir, 'RUNLOG.md'))}    prior reports: ${priors.length > 0 ? priors.join(', ') : 'none'}`,
    `write plan with: fc plan write    evidence: ${launchRel}/evidence.html`,
  ].join('\n');
  const body = parts.map((part) => part.text).join('\n\n');
  return { text: `${header}\n\n${body}\n`, version };
}

/** The parts spec a launch was last rendered from ('base@1+shape-session@1' → 'base+shape-session'). */
function partsOf(launchJson) {
  const version = String(launchJson?.kickoff?.version ?? '');
  const names = version.split('+').map((entry) => entry.split('@')[0]).filter((name) => name !== '');
  return names.length > 0 ? names.join('+') : DEFAULT_PARTS;
}

/** Renders kickoff.md into the launch folder and returns the version string it was assembled from. */
function writeKickoff(ctx, launchDir, launchJson, partsSpec) {
  const { text, version } = renderKickoff(ctx, launchDir, launchJson, partsSpec);
  fs.writeFileSync(path.join(launchDir, launchJson.kickoff?.path ?? 'kickoff.md'), text);
  return version;
}

// ── launch new ───────────────────────────────────────────────────────────────

/** Template values that are real values rather than the angle-bracket descriptions the template documents itself with. */
function concrete(value) {
  if (typeof value === 'string') return /^<.*>$/.test(value.trim()) ? undefined : value;
  if (Array.isArray(value)) {
    const list = value.map(concrete).filter((item) => item !== undefined);
    return list.length > 0 ? list : undefined;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, item] of Object.entries(value)) {
      if (key.startsWith('$')) continue;
      const kept = concrete(item);
      if (kept !== undefined) out[key] = kept;
    }
    return Object.keys(out).length > 0 ? out : undefined;
  }
  return value;
}

/** The acceptance id, structural commands and ceilings a new launch starts with. */
function defaultsFor(ctx) {
  const file = path.join(ctx.fd.templates, 'launch.template.json');
  const template = concrete(readJsonSafe(file) ?? {}) ?? {};
  return {
    acceptance: template.acceptance ?? BUILT_IN_DEFAULTS.acceptance,
    structural: { ...BUILT_IN_DEFAULTS.structural, ...(template.structural ?? {}) },
    ceilings: { ...BUILT_IN_DEFAULTS.ceilings, ...(template.ceilings ?? {}) },
  };
}

/** The first free '<spec name>-<n>' under the launch directory. */
function defaultName(ctx, specName) {
  for (let n = 1; ; n += 1) {
    const candidate = `${specName}-${n}`;
    if (!isDir(path.join(ctx.launchDir, candidate))) return candidate;
  }
}

/** The newest other launch of the same spec, by recorded creation date and then by when its state was written. */
function previousLaunch(ctx, specName, selfName) {
  const candidates = launchesIn(ctx.launchDir)
    .filter((entry) => entry.name !== selfName && entry.json?.spec?.name === specName)
    .map((entry) => {
      let written = 0;
      try {
        written = fs.statSync(path.join(entry.dir, 'launch.json')).mtimeMs;
      } catch {
        written = 0;
      }
      return { name: entry.name, created: String(entry.json?.created ?? ''), written };
    })
    .sort((a, b) => (a.created < b.created ? -1 : a.created > b.created ? 1 : a.written - b.written || (a.name < b.name ? -1 : 1)));
  return candidates.length > 0 ? candidates[candidates.length - 1].name : null;
}

async function newLaunch(args, ctx) {
  const { positional, flags } = parseFlags(args, { name: 'string', kickoff: 'string', branch: 'string', allow: 'array' });
  const given = positional[0];
  if (!given) throw new UsageError('fc launch new needs the path of the spec to run');
  const specFile = resolveInput(ctx, given);
  if (!isFile(specFile)) throw new UsageError(`no spec at ${given}`);
  const spec = readJsonFile(specFile);
  const specName = String(spec?.name ?? '');
  if (specName === '') throw new UsageError(`${given} carries no spec name`);
  const name = flags.name ?? defaultName(ctx, specName);
  const dir = path.join(ctx.launchDir, name);
  if (isDir(dir)) throw new UsageError(`launch exists: ${repoPath(ctx, dir)}`);

  const specCopy = path.join(dir, 'specs', specName, path.basename(specFile));
  fs.mkdirSync(path.dirname(specCopy), { recursive: true });
  fs.copyFileSync(specFile, specCopy);
  for (const child of ['evidence', 'returns', 'review']) fs.mkdirSync(path.join(dir, child), { recursive: true });
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '');

  const defaults = defaultsFor(ctx);
  const launchJson = {
    schema_version: 1,
    name,
    status: 'draft',
    phase: 'targets',
    created: today(),
    spec: {
      name: specName,
      version: Number(spec?.version ?? 1),
      commit: typeof spec?.commit === 'string' && spec.commit !== '' ? spec.commit : null,
      file_commit: git.lastCommitOf(ctx.root, specFile),
      path: path.relative(dir, specCopy).split(path.sep).join('/'),
    },
    tests_map: null,
    kickoff: { path: 'kickoff.md', version: '' },
    base_commit: git.head(ctx.root),
    lock_commit: null,
    branch: flags.branch ?? `run/${name}`,
    previous_launch: previousLaunch(ctx, specName, name),
    allow_draft: false,
    paths: { allowed: unique(flags.allow ?? []), locked: [], enforce_boundary: false },
    acceptance: defaults.acceptance,
    structural: defaults.structural,
    ceilings: defaults.ceilings,
    gates: Object.fromEntries(GATES.map((gate) => [gate, { status: 'pending', at: null }])),
    outcome: null,
    ended: null,
  };
  launchJson.kickoff.version = writeKickoff(ctx, dir, launchJson, flags.kickoff ?? DEFAULT_PARTS);
  writeLaunch(dir, launchJson);
  ok(`export FLIGHTCREW_LAUNCH=${name}`);
  return EXIT.ok;
}

// ── launch activate ──────────────────────────────────────────────────────────

async function activate(args, ctx) {
  const { positional, flags } = parseFlags(args, { 'allow-draft': 'boolean' });
  const allowDraft = flags['allow-draft'];
  let name = positional[0];
  if (!name) {
    const drafts = launchesIn(ctx.launchDir).filter((entry) => entry.json?.status === 'draft');
    if (drafts.length !== 1) throw new UsageError('fc launch activate needs the name of the launch to activate');
    name = drafts[0].name;
  }
  const target = launchAt(ctx, name);
  if (target.json.status !== 'draft') {
    throw new UsageError(`launch ${name} has status ${target.json.status}; only a draft launch can be activated`);
  }
  const active = launchesIn(ctx.launchDir).filter((entry) => entry.json?.status === 'active' && entry.name !== name);
  if (active.length > 0) {
    throw new UsageError(`launch ${active.map((entry) => entry.name).join(', ')} is active; end it before activating ${name}`);
  }
  let acceptedDraft = false;
  if (target.json.spec?.commit === null || target.json.spec?.commit === undefined) {
    if (!allowDraft) throw new UsageError(`spec not frozen: ${target.json.spec?.path ?? 'the pinned spec'} carries no commit; pass --allow-draft`);
    acceptedDraft = true;
  }
  if (target.json.tests_map) {
    if (!target.json.tests_map.commit) {
      if (!allowDraft) throw new UsageError(`tests map not frozen: ${target.json.tests_map.path} carries no commit; pass --allow-draft`);
      acceptedDraft = true;
    }
    const map = readJsonSafe(path.resolve(target.dir, target.json.tests_map.path ?? ''));
    const mapSpec = map?.spec ?? {};
    const spec = target.json.spec ?? {};
    if (map && (mapSpec.name !== spec.name || Number(mapSpec.version) !== Number(spec.version))) {
      throw new UsageError(`pin mismatch: the pinned tests map names spec ${mapSpec.name} v${mapSpec.version}, the launch names ${spec.name} v${spec.version}`);
    }
  }
  target.json.status = 'active';
  if (acceptedDraft) target.json.allow_draft = true;
  writeLaunch(target.dir, target.json);
  ok(`launch ${name} is active in phase ${target.json.phase}`);
  return EXIT.ok;
}

// ── launch status ────────────────────────────────────────────────────────────

function gateSummary(launchJson) {
  return GATES.map((gate) => `${gate} ${launchJson?.gates?.[gate]?.status ?? 'pending'}`).join(' · ');
}

function ceilingLines(counts) {
  return Object.entries(counts).map(([name, entry]) => {
    const ceiling = entry.ceiling === null ? '—' : entry.ceiling;
    return `  ${name.replace(/_/g, ' ')}: ${entry.count} / ${ceiling}`;
  });
}

async function status(args, ctx) {
  if (args.length > 0) throw new UsageError(`fc launch status takes no arguments; got ${args.join(' ')}`);
  const { dir, json: launchJson } = ctx.launch;
  const counts = countBudget(dir, launchJson);
  const { events } = readEvents(dir);
  const newest = events.length > 0 ? Date.parse(events[events.length - 1]?.ts ?? '') : NaN;
  const staleHours = Number.isFinite(newest) ? Math.floor((Date.now() - newest) / 3_600_000) : null;
  if (ctx.json) {
    json({
      name: launchJson.name,
      status: launchJson.status,
      phase: launchJson.phase,
      spec: launchJson.spec,
      tests_map: launchJson.tests_map,
      kickoff: launchJson.kickoff,
      branch: launchJson.branch,
      base_commit: launchJson.base_commit,
      lock_commit: launchJson.lock_commit,
      allow_draft: launchJson.allow_draft,
      paths: launchJson.paths,
      gates: launchJson.gates,
      counts,
      stale_hours: staleHours,
    });
    return EXIT.ok;
  }
  print(`launch: ${launchJson.name}`);
  print(`status: ${launchJson.status}    phase: ${launchJson.phase}`);
  print(`spec: ${launchJson.spec?.name} v${launchJson.spec?.version} @ ${launchJson.spec?.commit ?? 'draft'}`);
  print(`tests-map: ${launchJson.tests_map ? `v${launchJson.tests_map.version} @ ${launchJson.tests_map.commit ?? 'draft'}` : '(none)'}`);
  print(`kickoff: ${launchJson.kickoff?.version ?? '(none)'}`);
  print(`branch: ${launchJson.branch}    base: ${shortHash(launchJson.base_commit)}    lock: ${shortHash(launchJson.lock_commit)}`);
  print(`gates: ${gateSummary(launchJson)}`);
  print('counts and ceilings:');
  for (const line of ceilingLines(counts)) print(line);
  if (launchJson.allow_draft) print('allow_draft: true');
  if (staleHours !== null && staleHours >= 24) warn(`the newest event is ${staleHours} hours old; this launch may be stale`);
  return EXIT.ok;
}

// ── launch pin tests-map ─────────────────────────────────────────────────────

async function pin(args, ctx) {
  const [what, ...rest] = args;
  if (what !== 'tests-map') throw new UsageError('fc launch pin: the only pin is tests-map');
  const { positional, flags } = parseFlags(rest, { 'allow-draft': 'boolean' });
  const given = positional[0];
  if (!given) throw new UsageError('fc launch pin tests-map needs the path of the map to pin');
  const mapFile = resolveInput(ctx, given);
  if (!isFile(mapFile)) throw new UsageError(`no tests map at ${given}`);
  const map = readJsonFile(mapFile);
  const { dir, name, json: launchJson } = ctx.launch;
  const frozen = map?.status === 'frozen' && typeof map?.commit === 'string' && map.commit !== '';
  if (!frozen && !flags['allow-draft']) {
    throw new UsageError(`tests map not frozen: ${given} is a draft; pass --allow-draft to pin it anyway`);
  }
  const specName = String(launchJson.spec?.name ?? map?.spec?.name ?? '');
  if (map?.spec?.name && map.spec.name !== specName) {
    throw new UsageError(`pin mismatch: the map names spec ${map.spec.name}, the launch names ${specName}`);
  }
  const copy = path.join(dir, 'specs', specName, path.basename(mapFile));
  fs.mkdirSync(path.dirname(copy), { recursive: true });
  fs.copyFileSync(mapFile, copy);

  launchJson.tests_map = {
    version: Number(map?.version ?? 1),
    commit: frozen ? map.commit : null,
    path: path.relative(dir, copy).split(path.sep).join('/'),
  };
  launchJson.paths = {
    allowed: unique(Array.isArray(map?.allowed_paths) ? map.allowed_paths : []),
    locked: unique([
      ...(Array.isArray(map?.locked_paths) ? map.locked_paths : []),
      `flightdeck/launch/${name}/specs/**`,
      `flightdeck/launch/specs/${specName}/**`,
    ]),
    enforce_boundary: true,
  };
  launchJson.lock_commit = git.head(ctx.root);
  if (!frozen) launchJson.allow_draft = true;
  launchJson.kickoff.version = writeKickoff(ctx, dir, launchJson, partsOf(launchJson));
  writeLaunch(dir, launchJson);

  print(`tests map pinned: ${repoPath(ctx, copy)} @ ${launchJson.tests_map.commit ?? 'draft'}; lock ${shortHash(launchJson.lock_commit)}`);
  print('allow these commands so the checks can run:');
  for (const check of Array.isArray(map?.checks) ? map.checks : []) print(`  Bash(${check.command})`);
  return EXIT.ok;
}

// ── launch kickoff ───────────────────────────────────────────────────────────

async function kickoff(args, ctx) {
  const { flags } = parseFlags(args, { parts: 'string' });
  const { dir, json: launchJson } = ctx.launch;
  launchJson.kickoff.version = writeKickoff(ctx, dir, launchJson, flags.parts ?? partsOf(launchJson));
  writeLaunch(dir, launchJson);
  ok(`kickoff rendered: ${repoPath(ctx, path.join(dir, launchJson.kickoff.path))} (${launchJson.kickoff.version})`);
  return EXIT.ok;
}

// ── phase preconditions ──────────────────────────────────────────────────────

/** The checks whose baseline observed word disagrees with its expect word, as one phrase each. */
function baselineDisagreements(map) {
  const problems = [];
  for (const check of Array.isArray(map?.checks) ? map.checks : []) {
    const expect = firstWord(check?.baseline?.expect);
    const observed = firstWord(check?.baseline?.observed);
    if (observed === '') {
      problems.push(`${check?.id}: no baseline was observed`);
    } else if (expect !== observed) {
      problems.push(`${check?.id}: observed ${observed} where the map expects ${expect}`);
    }
  }
  return problems;
}

/** Everything that stands between a launch and phase plan, as one line each. */
function planBlockers(ctx) {
  const { dir, json: launchJson } = ctx.launch;
  const problems = [];
  if (!launchJson.spec?.commit && !launchJson.allow_draft) problems.push('the pinned spec is a draft; activate or pin with --allow-draft');
  if (!launchJson.tests_map) problems.push('no tests map is pinned; run fc launch pin tests-map');
  else if (!launchJson.tests_map.commit && !launchJson.allow_draft) problems.push('the pinned tests map is a draft; pin it with --allow-draft');
  if (launchJson.tests_map) {
    try {
      const { map } = pinnedMap(dir, launchJson);
      problems.push(...baselineDisagreements(map));
    } catch (error) {
      problems.push(String(error?.message ?? error));
    }
  }
  const launchFile = path.join(dir, 'launch.json');
  if (runValidator(ctx, 'validate-launch', [launchFile]) !== EXIT.ok) problems.push('launch.json does not validate');
  const kickoffFile = path.join(dir, launchJson.kickoff?.path ?? 'kickoff.md');
  if (runValidator(ctx, 'validate-kickoff', [kickoffFile]) !== EXIT.ok) problems.push('kickoff.md does not validate');
  return problems;
}

/** Everything that stands between a launch and phase review, as one line each. */
function reviewBlockers(ctx) {
  const { dir } = ctx.launch;
  const problems = [];
  const summary = readJsonSafe(path.join(dir, 'evidence', 'summary.json'));
  const head = git.head(ctx.root);
  if (!summary) {
    problems.push('evidence/summary.json is absent; run fc verify');
  } else {
    if (!sameCommit(summary.commit ?? '', head ?? '')) problems.push(`evidence/summary.json is at ${shortHash(summary.commit)}, HEAD is ${shortHash(head)}`);
    const counts = summary.counts ?? {};
    if (Number(counts.fail ?? 0) > 0 || Number(counts.error ?? 0) > 0) {
      problems.push(`evidence records ${counts.fail ?? 0} failed and ${counts.error ?? 0} errored checks`);
    }
  }
  const boundary = readJsonSafe(path.join(dir, 'evidence', 'boundary.json'));
  if (!boundary) problems.push('evidence/boundary.json is absent; run fc boundary');
  else if ((boundary.outside ?? []).length > 0) problems.push(`${boundary.outside.length} changed paths are outside the boundary`);
  const locked = readJsonSafe(path.join(dir, 'evidence', 'locked.json'));
  if (!locked) problems.push('evidence/locked.json is absent; run fc locked');
  else if ((locked.locked ?? []).length > 0) problems.push(`${locked.locked.length} changed paths match a locked glob`);
  return problems;
}

// ── launch phase ─────────────────────────────────────────────────────────────

/** The fired abandon trigger of a launch, or null; a fired trigger stops every move except the one to ended. */
function firedTrigger(dir) {
  return firedIn(dir);
}

async function phase(args, ctx) {
  const { positional, flags } = parseFlags(args, { force: 'boolean' });
  const to = positional[0];
  if (!to) throw new UsageError(`fc launch phase needs one of ${PHASES.join(', ')}`);
  if (!PHASES.includes(to)) throw new UsageError(`unknown phase ${to}; expected one of ${PHASES.join(', ')}`);
  const { dir, json: launchJson } = ctx.launch;
  const from = launchJson.phase;
  const trigger = firedTrigger(dir);
  if (trigger && to !== 'ended') {
    throw new BlockedError(`abandon trigger ${trigger.detail?.name ?? 'fired'}: end or exit the launch before changing phase`);
  }
  if (!flags.force && !isNextPhase(from, to)) {
    throw new UsageError(`illegal phase change: ${from} → ${to}; the next phase is ${PHASES[PHASES.indexOf(from) + 1] ?? '(none)'}`);
  }
  if (!flags.force) {
    const problems = to === 'plan' ? planBlockers(ctx) : to === 'review' ? reviewBlockers(ctx) : [];
    if (problems.length > 0) throw new BlockedError([`phase ${to} refused:`, ...problems.map((line) => `  ${line}`)]);
  }
  const branch = git.run(['rev-parse', '--abbrev-ref', 'HEAD'], ctx.root);
  if (branch.ok && branch.stdout.trim() !== '' && launchJson.branch && branch.stdout.trim() !== launchJson.branch) {
    warn(`the checked-out branch is ${branch.stdout.trim()}, the launch names ${launchJson.branch}`);
  }
  launchJson.phase = to;
  writeLaunch(dir, launchJson);
  appendEvent(dir, { event: 'phase', phase: to, detail: { from, to, forced: Boolean(flags.force) } });
  clearEscalation(dir);
  await bestEffortRender(dir);
  ok(`phase ${from} → ${to}`);
  return EXIT.ok;
}

// ── launch gate ──────────────────────────────────────────────────────────────

/** The checks the wave-0 contracts unit names, falling back to the launch's acceptance check. */
function w0Checks(dir, launchJson) {
  const plan = readJsonSafe(path.join(dir, 'plan.json'));
  const units = Array.isArray(plan?.units) ? plan.units : [];
  const contracts = units.find((unit) => unit?.kind === 'contracts');
  const checks = Array.isArray(contracts?.checks) ? contracts.checks.map(String) : [];
  return checks.length > 0 ? checks : [String(launchJson?.acceptance ?? 'T1')];
}

/** Why gate 2 cannot be approved yet: a wave-0 check in error, or one that has not run since the lock commit. */
function gate2Blockers(ctx) {
  const { dir, json: launchJson } = ctx.launch;
  const lock = launchJson.lock_commit ?? launchJson.base_commit ?? null;
  const problems = [];
  for (const id of w0Checks(dir, launchJson)) {
    const result = readJsonSafe(path.join(dir, 'evidence', `${id}.json`));
    if (!result) {
      problems.push(`${id} has no evidence; run fc check ${id}`);
    } else if (result.verdict === 'error') {
      problems.push(`${id} has verdict error`);
    } else if (!ranSince(ctx.root, lock, result.commit)) {
      problems.push(`${id} last ran at ${shortHash(result.commit)}, before the lock commit ${shortHash(lock)}`);
    }
  }
  return problems;
}

async function gate(args, ctx) {
  const { positional, flags } = parseFlags(args, { note: 'string', force: 'boolean' });
  const [id, decision] = positional;
  if (!id || !GATES.includes(id)) throw new UsageError(`fc launch gate needs one of ${GATES.join(', ')}`);
  if (decision !== 'approve' && decision !== 'exit') throw new UsageError('fc launch gate needs approve or exit');
  const { dir, json: launchJson } = ctx.launch;
  const recorded = launchJson.gates?.[id]?.status ?? 'pending';
  if (recorded !== 'pending' && !flags.force) {
    throw new UsageError(`gate ${id} is already ${recorded}; pass --force to record it again`);
  }
  if (decision === 'approve' && id === 'G2') {
    const problems = gate2Blockers(ctx);
    if (problems.length > 0) throw new BlockedError(['gate G2 refused:', ...problems.map((line) => `  ${line}`)]);
  }
  const at = new Date().toISOString();
  launchJson.gates[id] = { status: decision === 'approve' ? 'approved' : 'exited', at };
  if (flags.note) launchJson.gates[id].note = flags.note;
  const from = launchJson.phase;
  const moveTo = decision === 'approve' ? (id === 'G1' ? 'contracts' : id === 'G2' ? 'implement' : null) : null;
  if (moveTo && moveTo !== from) launchJson.phase = moveTo;
  writeLaunch(dir, launchJson);
  appendEvent(dir, { event: 'gate', detail: { gate: id, decision, note: flags.note ?? null } });
  if (moveTo && moveTo !== from) {
    appendEvent(dir, { event: 'phase', phase: moveTo, detail: { from, to: moveTo, forced: false } });
  }
  clearEscalation(dir);
  await bestEffortRender(dir);
  if (decision === 'exit') {
    print(`gate ${id} exited; now run: fc launch end abandoned --at ${id}`);
    return EXIT.ok;
  }
  ok(`gate ${id} approved${moveTo && moveTo !== from ? `; phase ${from} → ${moveTo}` : ''}`);
  return EXIT.ok;
}

// ── launch escalate, note, land ──────────────────────────────────────────────

async function escalate(args, ctx) {
  const { positional, flags } = parseFlags(args, { detail: 'string' });
  const kind = positional[0];
  if (!kind || !ESCALATION_KINDS.includes(kind)) throw new UsageError(`fc launch escalate needs one of ${ESCALATION_KINDS.join(', ')}`);
  if (!flags.detail) throw new UsageError('fc launch escalate needs --detail <text> naming the finding');
  const { dir, json: launchJson } = ctx.launch;
  writeEscalation(dir, { kind, detail: flags.detail, phase: launchJson.phase, launch: launchJson.name });
  appendEvent(dir, { event: 'escalation', detail: { kind, detail: flags.detail } });
  await bestEffortRender(dir);
  ok(`escalation recorded: ${kind}`);
  return EXIT.ok;
}

async function note(args, ctx) {
  const text = args.filter((item) => !item.startsWith('--')).join(' ').trim();
  if (text === '') throw new UsageError('fc launch note needs the text to record');
  const file = path.join(ctx.launch.dir, 'notes.md');
  const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  const prefix = existing === '' || existing.endsWith('\n') ? '' : '\n';
  fs.appendFileSync(file, `${prefix}${text}\n`);
  ok(`note recorded in ${repoPath(ctx, file)}`);
  return EXIT.ok;
}

async function land(args, ctx) {
  const { flags } = parseFlags(args, { commit: 'string', pr: 'string', 'evidence-commit': 'string' });
  if (!flags.commit) throw new UsageError('fc launch land needs --commit <sha>');
  const { dir, json: launchJson } = ctx.launch;
  const landedCommit = git.resolveCommit(ctx.root, flags.commit) ?? flags.commit;
  const evidenceCommit = flags['evidence-commit']
    ? (git.resolveCommit(ctx.root, flags['evidence-commit']) ?? flags['evidence-commit'])
    : landedCommit;
  const summary = readJsonSafe(path.join(dir, 'evidence', 'summary.json'));
  if (!summary || !sameCommit(summary.commit ?? '', evidenceCommit)) {
    throw new BlockedError(`no evidence at ${shortHash(evidenceCommit)}: evidence/summary.json records ${shortHash(summary?.commit)}`);
  }
  const counts = summary.counts ?? {};
  if (Number(counts.fail ?? 0) > 0 || Number(counts.error ?? 0) > 0) {
    throw new BlockedError(`evidence at ${shortHash(evidenceCommit)} records ${counts.fail ?? 0} failed and ${counts.error ?? 0} errored checks`);
  }
  launchJson.landed = {
    commit: landedCommit,
    pr: flags.pr ?? null,
    integration_check: `evidence/summary.json @ ${shortHash(evidenceCommit)}: ${counts.pass ?? 0} passed, 0 failed, 0 errored`,
  };
  writeLaunch(dir, launchJson);
  await bestEffortRender(dir);
  ok(`landed at ${shortHash(landedCommit)}${flags.pr ? ` · ${flags.pr}` : ''}`);
  return EXIT.ok;
}

// ── launch end ───────────────────────────────────────────────────────────────

/** The state of every finding of every critic pass, with review/resolutions.json applied over the pass files. */
function findings(dir) {
  const reviewDir = path.join(dir, 'review');
  let names = [];
  try {
    names = fs.readdirSync(reviewDir).filter((entry) => /^pass-\d+\.json$/.test(entry)).sort();
  } catch {
    names = [];
  }
  const resolutions = readJsonSafe(path.join(reviewDir, 'resolutions.json')) ?? {};
  const found = [];
  for (const entry of names) {
    const doc = readJsonSafe(path.join(reviewDir, entry));
    for (const finding of Array.isArray(doc?.findings) ? doc.findings : []) {
      const state = resolutions[finding?.id]?.state ?? finding?.state ?? 'open';
      found.push({ ...finding, state });
    }
  }
  return found;
}

/** Why the units named for a partial ending cannot all be kept (spec B44), as one line each. */
function partialBlockers(dir, plan, keep) {
  const units = Array.isArray(plan?.units) ? plan.units : [];
  const byId = new Map(units.map((unit) => [String(unit?.id), unit]));
  const contracts = units.find((unit) => unit?.kind === 'contracts');
  const problems = [];
  for (const id of keep) {
    if (!byId.has(id)) problems.push(`${id} is not a unit of this plan`);
  }
  if (problems.length > 0) return problems;
  for (const id of keep) {
    for (const dependency of byId.get(id)?.depends_on ?? []) {
      const dep = String(dependency);
      if (!keep.includes(dep) && dep !== String(contracts?.id ?? '')) {
        problems.push(`${id} depends on ${dep}, which is not among the units kept`);
      }
    }
  }
  if (problems.length > 0) return problems;
  const merged = new Set(readEvents(dir).events.filter((event) => event?.event === 'unit_merged').map((event) => String(event?.detail?.unit ?? '')));
  for (const id of keep) {
    const returned = readJsonSafe(path.join(dir, 'returns', `${id}.json`));
    if (returned?.status !== 'green' && !merged.has(id)) {
      problems.push(`${id} has no green worker return and no unit_merged event`);
    }
  }
  if (problems.length > 0) return problems;
  const open = findings(dir).filter((finding) => finding.severity === 'blocking' && finding.state === 'open');
  for (const id of keep) {
    for (const finding of open) {
      if (finding.file && matchAny(byId.get(id)?.paths ?? [], String(finding.file))) {
        problems.push(`${id} has the open blocking finding ${finding.id} under its paths (${finding.file})`);
      }
    }
  }
  return problems;
}

/** The worktree and branch cleanup lines the human runs after the run has ended. */
function cleanupLines(ctx, launchJson, plan) {
  const worktrees = git.worktreeList(ctx.root)
    .map((tree) => tree.path)
    .filter((p) => typeof p === 'string' && p.includes(`${path.sep}.claude${path.sep}worktrees${path.sep}`));
  const branches = (Array.isArray(plan?.units) ? plan.units : [])
    .map((unit) => `${launchJson.name}/${unit?.name ?? unit?.id}`);
  const lines = [];
  lines.push(worktrees.length > 0
    ? `worktrees to remove: ${worktrees.map((p) => `git worktree remove ${repoPath(ctx, p)}`).join(' · ')}`
    : 'worktrees to remove: none');
  lines.push(branches.length > 0
    ? `branches to delete: ${branches.map((branch) => `git branch -D ${branch}`).join(' · ')}`
    : 'branches to delete: none');
  return lines;
}

async function end(args, ctx) {
  const { positional, flags } = parseFlags(args, { at: 'string', units: 'string' });
  const outcome = positional[0];
  if (!outcome || !OUTCOMES.includes(outcome)) throw new UsageError(`fc launch end needs one of ${OUTCOMES.join(', ')}`);
  const { dir, name, json: launchJson } = ctx.launch;
  const plan = readJsonSafe(path.join(dir, 'plan.json'));
  let keep = null;
  if (outcome === 'partial') {
    if (!flags.units) throw new UsageError('fc launch end partial needs --units <U0,U1,...>');
    keep = flags.units.split(',').map((item) => item.trim()).filter((item) => item !== '');
    if (keep.length === 0) throw new UsageError('fc launch end partial needs --units <U0,U1,...>');
  }

  if (ACCEPTED_FAMILY.includes(outcome)) {
    const head = git.head(ctx.root);
    const summary = readJsonSafe(path.join(dir, 'evidence', 'summary.json'));
    if (!summary) throw new BlockedError(`no evidence: evidence/summary.json is absent, HEAD is ${shortHash(head)}; run fc verify`);
    if (!sameCommit(summary.commit ?? '', head ?? '')) {
      throw new BlockedError(`evidence is stale: evidence/summary.json is at ${shortHash(summary.commit)}, HEAD is ${shortHash(head)}`);
    }
    const dirty = git.dirtyPaths(ctx.root, launchJson.paths?.allowed ?? []);
    if (dirty.length > 0) {
      throw new BlockedError(`working tree not clean under allowed paths: ${dirty.join(', ')}`);
    }
  }
  if (keep) {
    if (!plan) throw new BlockedError('a partial ending needs plan.json to know the units');
    const problems = partialBlockers(dir, plan, keep);
    if (problems.length > 0) throw new BlockedError(['partial ending refused:', ...problems.map((line) => `  ${line}`)]);
  }

  const endedAt = new Date().toISOString();
  launchJson.outcome = outcome;
  launchJson.status = outcome;
  launchJson.ended = endedAt;
  launchJson.phase = 'ended';
  if (keep) {
    launchJson.accepted_units = keep;
    launchJson.abandoned_units = (Array.isArray(plan?.units) ? plan.units : [])
      .map((unit) => String(unit?.id))
      .filter((id) => !keep.includes(id));
  }
  writeLaunch(dir, launchJson);
  appendEvent(dir, { event: 'launch_end', phase: 'ended', detail: { outcome, at: flags.at ?? null } });
  clearEscalation(dir);

  let code = EXIT.ok;
  const evidenceUrl = new URL('./evidence.mjs', import.meta.url).href;
  const reportUrl = new URL('./report.mjs', import.meta.url).href;
  try {
    await renderThrough(evidenceUrl, ctx, []);
  } catch (error) {
    fail(`the evidence page could not be rendered: ${error?.message ?? error}`);
    code = EXIT.usage;
  }
  try {
    await renderThrough(reportUrl, ctx, []);
  } catch (error) {
    fail(`report.md could not be rendered: ${error?.message ?? error}`);
    code = EXIT.usage;
  }
  try {
    writeStub(ctx);
  } catch (error) {
    fail(`the run-log stub could not be inserted: ${error?.message ?? error}`);
    code = EXIT.usage;
  }

  for (const line of cleanupLines(ctx, launchJson, plan)) print(line);
  print(repoPath(ctx, path.join(dir, 'report.md')));
  if (code !== EXIT.ok) return code;
  return EXIT.ok;
}

// ── dispatch ─────────────────────────────────────────────────────────────────

const SUBCOMMANDS = {
  new: newLaunch,
  activate,
  status,
  phase,
  gate,
  end,
  pin,
  kickoff,
  escalate,
  note,
  land,
};

export async function run(args, ctx) {
  const [sub, ...rest] = args;
  const handler = SUBCOMMANDS[sub];
  if (!handler) {
    fail([`fc launch: expected one of ${Object.keys(SUBCOMMANDS).join(', ')}`, help]);
    return EXIT.usage;
  }
  return handler(rest, ctx);
}
