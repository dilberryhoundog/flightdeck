#!/usr/bin/env node
// SessionStart hook: prints the pre-flight card, only in a flight:pilot session and only when
// the project has a .flightdeck/ folder. Silent (no output, exit 0) in every other case and on
// any internal error.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findRoot, listWorkshops } from '../lib/workshops.mjs';

const MAX_LINES = 10;
const MAX_CHARS = 800;
const FALLBACK_VERSION = '0.2.0';

function git(root, args) {
  return execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
}

export function currentBranch(root) {
  try { const b = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']); if (b) return b; } catch { /* try next */ }
  try { const b = git(root, ['symbolic-ref', '--short', 'HEAD']); if (b) return b; } catch { /* unknown */ }
  return 'unknown';
}

export function pluginVersion() {
  try {
    const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.claude-plugin', 'plugin.json');
    const v = JSON.parse(fs.readFileSync(file, 'utf8')).version;
    if (typeof v === 'string' && v) return v;
  } catch { /* fall back */ }
  return FALLBACK_VERSION;
}

function workshopLine(w) {
  const labels = w.attempts.map(a => a.label);
  let attempts = 'none';
  if (labels.length) {
    attempts = labels.slice(0, 3).join(', ');
    if (labels.length > 3) attempts += `, +${labels.length - 3} more`;
  }
  let line = `Workshop ${w.name}: latest attempts ${attempts}; open questions: ${w.openQuestions}`;
  if (w.heldForLater > 0) line += ` (${w.heldForLater} held to ask later)`;
  return line;
}

// The card: at most 10 lines and 800 characters. Settled workshops are not listed.
export function buildCard(root, { branch = 'unknown', version = FALLBACK_VERSION } = {}) {
  const { workshops, captured } = listWorkshops(root);
  const active = workshops.filter(w => w.state === 'active');
  const head = [`FlightDeck ${version} pre-flight: Captain on deck`, `Branch: ${String(branch).slice(0, 80)}`];
  const tail = [
    `Captured, waiting to start: ${captured}`,
    'How to start: say what you want done, or say "activate <name>" for captured work.',
  ];
  if (active.length === 0) return [...head, 'No active workshops.', ...tail].join('\n');
  const lines = active.map(workshopLine);
  for (let k = lines.length; k >= 0; k--) {
    const shown = lines.slice(0, k);
    const rest = lines.length - k;
    const body = rest > 0 ? [...shown, `...and ${rest} more active workshops`] : shown;
    const all = [...head, ...body, ...tail];
    if (all.length <= MAX_LINES && all.join('\n').length <= MAX_CHARS) return all.join('\n');
  }
  return [...head, `...and ${lines.length} more active workshops`, ...tail].join('\n').slice(0, MAX_CHARS);
}

function main() {
  try {
    const input = JSON.parse(fs.readFileSync(0, 'utf8'));
    if (!input || input.agent_type !== 'flight:pilot') return;
    const root = findRoot(process.env.CLAUDE_PROJECT_DIR || input.cwd);
    if (!root) return;
    const card = buildCard(root, { branch: currentBranch(root), version: pluginVersion() });
    process.stdout.write(JSON.stringify({
      systemMessage: card,
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: card },
    }));
  } catch { /* silent */ }
}

function isMain() {
  try { return pathToFileURL(fs.realpathSync(process.argv[1])).href === import.meta.url; } catch { return false; }
}

if (isMain()) {
  main();
  process.exitCode = 0;
}
