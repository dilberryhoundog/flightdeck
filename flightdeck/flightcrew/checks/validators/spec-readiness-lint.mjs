// flightcrew/checks/validators/spec-readiness-lint.mjs — the readiness rules a spec passes before a human freezes it: the nine domains, the open questions, the id sequences, the out-of-scope list, the artefacts and commands its text names, the ids its verification claims, the boundary in its acceptance text, and the class tags an agent-shaped spec owes.
// Usage: node flightdeck/flightcrew/checks/validators/spec-readiness-lint.mjs <spec.vN.json> [--repo <root>] [--deliverable <path>]... [--strict]
//
// Exports: RULES (the rule ids, in the order they are reported); lintSpec(file, { repo, deliverables }) →
// { spec, errors: [{ rule, message }], warnings: [string] }; main(argv). The rule ids are those of design 5.14:
// lint-domains, lint-open-questions, lint-sequential, lint-out-list, lint-artefacts, lint-commands-run, lint-claimed,
// lint-boundary and lint-class-tags, with the two warnings warn-impression and warn-length. An artefact token is one
// the spec's interface or verification text names — it holds a '/' or ends in .mjs .js .json .md or .sh — and it
// passes when it resolves under --repo or is named by a --deliverable, which is how a spec may name a file the run
// has still to build. A command named in the verification text passes when its first token is a runner this machine
// can start and, for node, bash and sh, its script argument resolves the same way. Warnings never fail the lint;
// --strict makes them fail. Exit 0, or 2 on any error. Importing this module has no side effect.

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { EXIT, fail, print, warn } from '../lib/output.mjs';
import { artefactTokens, loadSpec, SECTIONS } from '../lib/spec-lib.mjs';
import { toplevel } from '../lib/git-lib.mjs';

const USAGE = 'usage: spec-readiness-lint.mjs <spec.vN.json> [--repo <root>] [--deliverable <path>]... [--strict]';

/** The rule ids this linter reports, in the order it reports them (design 5.14). */
export const RULES = [
  'lint-domains',
  'lint-open-questions',
  'lint-sequential',
  'lint-out-list',
  'lint-artefacts',
  'lint-commands-run',
  'lint-claimed',
  'lint-boundary',
  'lint-class-tags',
];

/** The nine domains a readable spec fills; open questions are a register, not a domain. */
const DOMAINS = ['intent', 'scope', 'constraints', 'interfaces', 'behaviours', 'edges', 'decisions', 'verification', 'acceptance'];

/** The runners a verification text may name; anything else in the text is prose, not a command. */
const RUNNERS = new Set([
  'node', 'npm', 'npx', 'deno', 'bun', 'python', 'python3', 'ruby', 'perl', 'bash', 'sh', 'zsh',
  'make', 'cargo', 'go', 'java', 'dotnet', 'php', 'pytest', 'jest', 'vitest', 'mocha', 'tap', 'git',
]);

/** The runners whose script argument is a file the repository has to carry. */
const SCRIPT_RUNNERS = new Set(['node', 'bash', 'sh', 'zsh']);

/** The four class tags an agent-shaped spec's behaviours carry (design 5.14). */
const CLASS_TAGS = ['[deterministic]', '[property]', '[statistical]', '[judged]'];

/** Words that describe an impression rather than an observable outcome; two in one behaviour earn a warning. */
const IMPRESSION_WORDS = [
  'fast', 'slow', 'robust', 'gracefully', 'graceful', 'clean', 'cleanly', 'readable', 'user-friendly', 'friendly',
  'intuitive', 'nice', 'elegant', 'simple', 'seamless', 'seamlessly', 'smooth', 'smoothly', 'performant',
  'scalable', 'flexible', 'maintainable', 'reasonable', 'reasonably', 'appropriate', 'appropriately', 'sensible',
  'good', 'better', 'best', 'properly', 'correctly', 'efficient', 'efficiently', 'modern', 'polished',
];

/** Beyond these a spec has stopped being one sitting; both are warnings, never errors. */
const MAX_TEXT_CHARS = 12_000;
const MAX_NODES = 60;

const ARTEFACT_EXTENSIONS = ['.mjs', '.js', '.json', '.md', '.sh'];
const ID_SHAPE = /^([A-Z]+)([0-9]+)$/;

/** The command line this linter accepts. */
export function parseArgs(argv = []) {
  const opts = { file: null, repo: null, deliverables: [], strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = String(argv[i]);
    if (arg === '--strict') opts.strict = true;
    else if (arg === '--repo') {
      i += 1;
      if (argv[i] === undefined) throw new Error('--repo needs a directory');
      opts.repo = String(argv[i]);
    } else if (arg === '--deliverable') {
      i += 1;
      if (argv[i] === undefined) throw new Error('--deliverable needs a path');
      opts.deliverables.push(String(argv[i]));
    } else if (arg.startsWith('--')) throw new Error(`unknown flag ${arg}`);
    else if (opts.file === null) opts.file = arg;
    else throw new Error(`unexpected argument ${arg}`);
  }
  if (opts.file === null) throw new Error('no spec file given');
  return opts;
}

function nodesOf(spec, key) {
  const section = SECTIONS.find((s) => s.key === key);
  const value = spec?.[key];
  if (section?.single) return value && typeof value === 'object' && !Array.isArray(value) ? [value] : [];
  return Array.isArray(value) ? value.filter((n) => n && typeof n === 'object') : [];
}

/** Every live node of every section, in document order. */
function allNodes(spec) {
  return SECTIONS.flatMap((section) => nodesOf(spec, section.key));
}

function textOfNodes(nodes) {
  return nodes.map((n) => (typeof n.text === 'string' ? n.text : '')).join(' ');
}

/** One path as the linter compares them: forward slashes, no leading './', no trailing slash. */
function normalise(value) {
  return String(value ?? '').split(path.sep).join('/').replace(/^\.\//, '').replace(/\/+$/, '');
}

/** True when a token names something the repository already carries or a --deliverable promises. */
function resolvesUnder(token, { repo, deliverables }) {
  const wanted = normalise(token);
  if (wanted === '') return true;
  if (deliverables.some((given) => normalise(given) === wanted)) return true;
  if (!repo) return false;
  return fs.existsSync(path.resolve(repo, wanted));
}

/** True when the machine can start this runner: on PATH, or node, which is the interpreter already running. */
function runnerAvailable(name) {
  if (name === 'node' && fs.existsSync(process.execPath)) return true;
  const dirs = String(process.env.PATH ?? '').split(path.delimiter).filter((d) => d !== '');
  for (const dir of dirs) {
    const candidate = path.join(dir, name);
    try {
      const stat = fs.statSync(candidate);
      if (stat.isFile() && (stat.mode & 0o111) !== 0) return true;
    } catch {
      // not here; the next directory on PATH may carry it
    }
  }
  return false;
}

/** One whitespace-separated word with its wrapping quotes, brackets and trailing sentence punctuation removed. */
function bare(token) {
  return String(token).replace(/^[`'"(\[{]+/, '').replace(/[`'"),\];:.!?]+$/, '');
}

/** True when a token names a file rather than a word: it holds a '/' or ends in a script or document extension. */
function looksLikePath(token) {
  return token.includes('/') || ARTEFACT_EXTENSIONS.some((ext) => token.endsWith(ext));
}

/**
 * The commands a verification text names: each run of words starting at a runner, with the first non-flag word after
 * it as the script argument when that word names a file. Returns [{ runner, script }].
 */
export function commandsIn(text) {
  const words = String(text ?? '').split(/\s+/).map(bare).filter((w) => w !== '');
  const commands = [];
  for (let i = 0; i < words.length; i += 1) {
    const runner = words[i];
    if (!RUNNERS.has(runner)) continue;
    let script = null;
    for (let j = i + 1; j < words.length; j += 1) {
      const word = words[j];
      if (word.startsWith('-')) continue;
      if (looksLikePath(word)) script = word;
      break;
    }
    commands.push({ runner, script });
  }
  return commands;
}

/** The impression words one text carries, without repeats. */
function impressionWords(text) {
  const lower = String(text ?? '').toLowerCase();
  return IMPRESSION_WORDS.filter((word) => new RegExp(`(^|[^a-z-])${word}([^a-z-]|$)`).test(lower));
}

/**
 * Every readiness failure of one spec, in the rule order of design 5.14, plus the two warnings. repo is the tree the
 * spec's artefacts and commands are resolved against; deliverables are paths a run is expected to produce and that
 * therefore need not exist yet.
 */
export function lintSpec(file, { repo = null, deliverables = [] } = {}) {
  const spec = loadSpec(file);
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });
  const where = { repo, deliverables };

  const nodes = allNodes(spec);
  const specText = `${textOfNodes(nodes)} ${typeof spec.reason === 'string' ? spec.reason : ''}`;
  const verificationText = textOfNodes(nodes.filter((n) => n.id === 'VER'));
  const acceptanceText = textOfNodes(nodes.filter((n) => n.id === 'ACC'));
  const intentAndScope = textOfNodes([...nodesOf(spec, 'intent'), ...nodesOf(spec, 'scope')]);
  const behaviours = nodesOf(spec, 'behaviours');

  // lint-domains: nine domains, each filled unless the spec records it as empty by decision.
  for (const domain of DOMAINS) {
    if (nodesOf(spec, domain).length > 0) continue;
    const excused = new RegExp(`empty by decision[^.]*\\b${domain}\\b|\\b${domain}\\b[^.]*empty by decision`, 'i').test(specText);
    if (!excused) {
      error('lint-domains', `the ${domain} domain is empty and nothing in the spec records it as empty by decision with a reason`);
    }
  }

  // lint-open-questions: a spec is ready when nothing is still open.
  const open = Array.isArray(spec.open_questions) ? spec.open_questions : [];
  for (const question of open) {
    const id = question?.id ?? 'an open question';
    error('lint-open-questions', `${id} is still open: a spec is ready when every question is answered or moved out of scope`);
  }

  // lint-sequential: the live and retired ids of each prefix form an unbroken 1..N.
  const numbers = new Map();
  const collect = (id) => {
    const parsed = ID_SHAPE.exec(String(id ?? ''));
    if (!parsed || parsed[1] === 'Q') return;
    if (!numbers.has(parsed[1])) numbers.set(parsed[1], new Set());
    numbers.get(parsed[1]).add(Number(parsed[2]));
  };
  for (const node of nodes) collect(node.id);
  for (const entry of Array.isArray(spec.retired) ? spec.retired : []) collect(entry?.id);
  for (const [prefix, set] of numbers) {
    const highest = Math.max(...set);
    const missing = [];
    for (let n = 1; n <= highest; n += 1) if (!set.has(n)) missing.push(`${prefix}${n}`);
    if (missing.length > 0) {
      error('lint-sequential', `the ${prefix} ids run to ${prefix}${highest} but ${missing.join(', ')} appear in neither the live sections nor the retired registry`);
    }
  }

  // lint-out-list: what the spec is not is as much a boundary as what it is.
  const scope = nodesOf(spec, 'scope');
  if (!scope.some((node) => node.kind === 'out')) {
    error('lint-out-list', 'no scope entry has kind out: a spec states what it does not build as well as what it does');
  }

  // lint-artefacts: every file the interfaces and the verification name resolves, or is promised as a deliverable.
  const artefactSources = [...nodesOf(spec, 'interfaces'), ...nodesOf(spec, 'verification')];
  for (const node of artefactSources) {
    for (const token of artefactTokens(node.text)) {
      if (!resolvesUnder(token, where)) {
        error('lint-artefacts', `${node.id ?? '?'} names ${token}, which is neither in the repository nor listed as a deliverable`);
      }
    }
  }

  // lint-commands-run: every command the verification names can be started, and its script exists.
  for (const command of commandsIn(verificationText)) {
    if (!runnerAvailable(command.runner)) {
      error('lint-commands-run', `the verification names the command ${command.runner}, which is not on PATH`);
      continue;
    }
    if (command.script && SCRIPT_RUNNERS.has(command.runner) && !resolvesUnder(command.script, where)) {
      error('lint-commands-run', `the verification runs ${command.runner} ${command.script}, and ${command.script} is neither in the repository nor listed as a deliverable`);
    }
  }

  // lint-claimed: every behaviour and edge is named in the verification text.
  for (const node of [...behaviours, ...nodesOf(spec, 'edges')]) {
    const id = typeof node.id === 'string' ? node.id : null;
    if (!id) continue;
    if (!new RegExp(`\\b${id}\\b`).test(verificationText)) {
      error('lint-claimed', `${id} appears in no verification text: every behaviour and edge names the check that proves it`);
    }
  }

  // lint-boundary: the acceptance text draws the diff boundary with a path.
  const boundaryToken = String(acceptanceText).split(/\s+/).map(bare).some((token) => /\/$|\/\*\*$/.test(token));
  if (!boundaryToken) {
    error('lint-boundary', 'the acceptance text names no path ending in / or /**: it states no boundary the diff has to stay inside');
  }

  // lint-class-tags: an agent-shaped spec says how each behaviour is proved.
  if (/agent-shaped/i.test(intentAndScope)) {
    for (const node of behaviours) {
      const text = String(node.text ?? '').trimStart();
      if (!CLASS_TAGS.some((tag) => text.startsWith(tag))) {
        error('lint-class-tags', `${node.id ?? '?'} carries no class tag: an agent-shaped spec starts each behaviour with ${CLASS_TAGS.join(', ')}`);
      }
    }
  }

  // warn-impression: a behaviour written as impressions cannot be proved either way.
  for (const node of behaviours) {
    const found = impressionWords(node.text);
    if (found.length >= 2) {
      warnings.push(`${node.id ?? '?'} reads as impressions rather than observable outcomes: ${found.slice(0, 4).join(', ')} — [warn-impression]`);
    }
  }

  // warn-length: past this size a spec stops being readable in one sitting.
  const characters = textOfNodes(nodes).length;
  if (characters > MAX_TEXT_CHARS || nodes.length > MAX_NODES) {
    warnings.push(`the spec runs to ${nodes.length} nodes and ${characters} characters of text, beyond the length a reader holds in one sitting — [warn-length]`);
  }

  return { spec, errors, warnings };
}

/** Prints the violations and returns the exit code: 2 on any error, 2 on a warning under --strict, 0 otherwise. */
export function report({ errors = [], warnings = [] }, { strict = false, okLine = null } = {}) {
  for (const e of errors) fail(`error: ${e.message} — [${e.rule}]`);
  for (const w of warnings) warn(w);
  if (errors.length > 0) return EXIT.blocked;
  if (strict && warnings.length > 0) return EXIT.blocked;
  if (okLine && warnings.length === 0) print(okLine);
  return EXIT.ok;
}

/** Runs the linter over one spec. Returns the exit code rather than exiting, so fc can call it in process. */
export function main(argv = []) {
  let opts;
  try {
    opts = parseArgs(argv);
  } catch (error) {
    fail(`${error.message}\n${USAGE}`);
    return EXIT.usage;
  }
  const repo = opts.repo
    ? path.resolve(opts.repo)
    : toplevel(path.dirname(path.resolve(opts.file))) ?? process.cwd();
  let result;
  try {
    result = lintSpec(opts.file, { repo, deliverables: opts.deliverables });
  } catch (error) {
    fail(error.message);
    return EXIT.usage;
  }
  return report(result, { strict: opts.strict, okLine: `ok: ${path.basename(opts.file)} is ready for a freeze` });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  process.exit(main(process.argv.slice(2)));
}
