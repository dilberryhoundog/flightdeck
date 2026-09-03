// flightcrew/bin/worker/render.mjs — the dispatch prompts fc renders for an implementer, a critic and a verifier: template loading, placeholder filling, the spec, check and evidence blocks they share, and the launch reads a sealed dispatch needs.
// Usage: import { workerPrompt, criticPrompt, verifierPrompt } from '<relative>/bin/worker/render.mjs'; the prompt builders are pure and take the launch data as arguments.
//
// Exports: fillTemplate(text, values); readTemplate(dir, name); specBlocks(spec); nodeText(spec, id); checkLines(map, ids);
// workerPrompt({ ... }); criticPrompt({ ... }); verifierPrompt({ ... }); RETURN_SHAPES; and, for the two review
// dispatches, DispatchError; readPinnedSpecPath(launch); currentEvidence(launchDir, root); diffSinceLock(root, base,
// launchName); lockedChangeList(launchDir); nextPass(dir, pattern).
//
// A dispatch prompt is sealed: the agent reading it has no other input, so what is not in the prompt is not available
// to the agent, and what is in it must be exactly what the design allows. The worker prompt therefore carries the
// intent, every scope, constraint, interface and decision node, the behaviour and edge nodes the unit's spec_refs
// name and no others, each check by its id with the ids it covers, and never a check's command text. The critic
// prompt carries the pinned spec, the diff since the lock commit with the launch folder left out, the evidence
// summary and the locked-path change list, and nothing from the plan, the kickoff or the returns.
//
// The templates under flightcrew/templates/ are the wording; when one is absent the built-in equivalent below is used
// so that a dispatch is always renderable. Nothing here reads the clock or writes a file.

import fs from 'node:fs';
import path from 'node:path';
import { head as gitHead, run as gitRun } from '../../checks/lib/git-lib.mjs';
import { nodeIndex } from '../../checks/lib/spec-lib.mjs';
import { DASH, listOrDash } from '../../checks/lib/render-lib.mjs';

/** The return shape each dispatched role ends its turn with, as the fenced block the prompt closes on. */
export const RETURN_SHAPES = {
  worker: [
    '```json',
    '{',
    '  "unit": "<id>", "status": "green|red|halt",',
    '  "branch": "<branch>", "worktree": "<path>",',
    '  "spec_refs": ["<id>"], "checks": [{ "id": "T<n>", "exit": 0 }],',
    '  "artefacts": ["<path>"], "commits": ["<sha>"], "iterations": 1,',
    '  "halt": null, "notes": "<what you did, in one or two sentences>"',
    '}',
    '```',
  ].join('\n'),
  critic: [
    '```json',
    '{',
    '  "verdict": "no gaps|gaps", "pass": <n>,',
    '  "findings": [{',
    '    "id": "F<n>", "kind": "correctness-gap|scope-violation|spec-conflict|observation",',
    '    "severity": "blocking|non-blocking", "spec_ref": "<id>", "file": "<path>", "line": <n>,',
    '    "text": "<what is wrong, measured against the spec node>",',
    '    "state": "open", "resolved_commit": null, "dispute": null',
    '  }]',
    '}',
    '```',
  ].join('\n'),
  verifier: [
    '```json',
    '{',
    '  "refuted": false,',
    '  "checks_rerun": [{ "id": "T<n>", "exit": 0 }],',
    '  "reasons": [], "unverified": [], "test_file_changes": [], "outside_boundary": []',
    '}',
    '```',
  ].join('\n'),
};

/** Replaces every {{name}} of the template with the value given, and an unknown placeholder with the placeholder dash. */
export function fillTemplate(text, values = {}) {
  return String(text ?? '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (whole, name) => {
    if (!Object.prototype.hasOwnProperty.call(values, name)) return DASH;
    const value = values[name];
    if (value === undefined || value === null || String(value) === '') return DASH;
    return String(value);
  });
}

/** The text of a template file, or null when the templates directory does not carry it. */
export function readTemplate(templatesDir, name) {
  try {
    const text = fs.readFileSync(path.join(templatesDir, name), 'utf8');
    return text.trim() === '' ? null : text;
  } catch {
    return null;
  }
}

/** The text of one live spec node, or the placeholder when the spec does not carry it. */
export function nodeText(spec, id) {
  const entry = nodeIndex(spec).get(id);
  const text = entry && typeof entry.node.text === 'string' ? entry.node.text : null;
  return text === null ? DASH : text.replace(/\s+/g, ' ').trim();
}

function bulletsFor(spec, ids) {
  const lines = ids.map((id) => `- ${id}: ${nodeText(spec, id)}`);
  return lines.length === 0 ? DASH : lines.join('\n');
}

function idsOfSection(spec, key) {
  const value = spec?.[key];
  if (!Array.isArray(value)) return [];
  return value.map((node) => node?.id).filter((id) => typeof id === 'string');
}

/**
 * The four blocks every worker prompt carries whatever the unit is — the intent, the scope, the constraints, the
 * interfaces and the decisions — as bullet lists keyed by id.
 */
export function specBlocks(spec) {
  return {
    intent: nodeText(spec, 'INT'),
    scope: bulletsFor(spec, idsOfSection(spec, 'scope')),
    constraints: bulletsFor(spec, idsOfSection(spec, 'constraints')),
    interfaces: bulletsFor(spec, idsOfSection(spec, 'interfaces')),
    decisions: bulletsFor(spec, idsOfSection(spec, 'decisions')),
  };
}

/**
 * One line per check id: its id, the spec ids it covers and the words 'gate only' when the map marks it so. The
 * command text is never part of a line — a worker runs a check by its id and reads the output.
 */
export function checkLines(map, ids) {
  const checks = Array.isArray(map?.checks) ? map.checks : [];
  const wanted = Array.isArray(ids) ? ids : [];
  const lines = [];
  for (const id of wanted) {
    const check = checks.find((entry) => entry?.id === id);
    const covers = listOrDash(check?.covers ?? []);
    const gate = check?.gate_only ? ' · gate only' : '';
    lines.push(`- ${id} — covers ${covers}${gate}`);
  }
  return lines.length === 0 ? DASH : lines.join('\n');
}

// ── the three prompts ────────────────────────────────────────────────────────

const WORKER_BUILT_IN = `unit: {{unit}}
name: {{unit_name}}    kind: {{unit_kind}}    launch: {{launch}}    branch: {{branch}}    turns: {{budget_turns}}

Build this unit and nothing else. Everything you may act on is below; you have no other inputs, and auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.

## Intent
{{intent}}

## Scope
{{scope}}

## Constraints
{{constraints}}

## Interfaces
{{interfaces}}

## Decisions
{{decisions}}

## What this unit must make true
{{spec_refs}}

## Checks that prove it
{{checks}}
Run them in your worktree with: run fc check {{check_ids}}
A check marked gate only also runs at the stop gate and in fc check all. The commands behind these ids are not yours to read or change; run them by id and read the output.

## Paths
This unit may write: {{paths}}
It depends on: {{depends_on}}
Locked paths are refused by a hook and reported by fc locked. Never stage anything under flightdeck/launch/.

## How to work
1. \`git switch -c {{branch}}\` before your first commit; work in the worktree at {{worktree}}.
2. Make the smallest change that turns the checks green, re-running them after each step.
3. Stage only this unit's paths and commit with a message naming the unit.
4. Return the shape below. status green means every check above passed on this branch; red means it did not; halt means you stopped, and halt.kind says why.

## Return
{{return_shape}}
`;

/**
 * The implementer dispatch of spec B27. `unit` is the plan unit, `spec` the pinned spec, `map` the pinned tests map.
 * The first line is always 'unit: <id>'; a template that no longer starts with the placeholder is used from its first
 * 'unit:' line, so the contract holds whatever wording the template carries.
 */
export function workerPrompt({ unit, spec, map, launch, template = null }) {
  const name = String(unit?.name ?? unit?.id ?? '');
  const launchName = String(launch?.name ?? '');
  const branch = `${launchName}/${name}`;
  const values = {
    ...specBlocks(spec),
    unit: unit?.id ?? DASH,
    unit_name: name,
    unit_kind: unit?.kind ?? DASH,
    launch: launchName,
    branch,
    worktree: `.claude/worktrees/${launchName}-${name}`,
    budget_turns: unit?.budget_turns ?? DASH,
    spec_refs: bulletsFor(spec, Array.isArray(unit?.spec_refs) ? unit.spec_refs : []),
    checks: checkLines(map, unit?.checks ?? []),
    check_ids: (Array.isArray(unit?.checks) ? unit.checks : []).join(' '),
    paths: listOrDash(unit?.paths ?? []),
    depends_on: listOrDash(unit?.depends_on ?? []),
    return_shape: RETURN_SHAPES.worker,
  };
  const filled = fillTemplate(template ?? WORKER_BUILT_IN, values);
  const at = filled.indexOf(`unit: ${values.unit}`);
  return at <= 0 ? filled : filled.slice(at);
}

const CRITIC_BUILT_IN = `# Review pass {{pass}} · {{launch}}

You are a fresh reader of a diff. Assume the diff contains at least one gap and look for it: approval is not a completion of this task.

Bound the hunt. Report gaps that affect correctness or the stated requirements; not style, not hypothetical robustness, not improvements. If there are none, say \`no gaps\` and stop.

Examine, in this order:
1. Behaviours implemented — every behaviour and edge below is present in the diff and does what its text says.
2. Scope held — nothing was changed outside the allowed paths, and nothing in scope was quietly left out.
3. Tests untouched — no check or fixture under a locked path was edited, weakened, skipped or made to pass by special-casing.
4. Errors handled, not suppressed — failures surface with their cause rather than being swallowed or defaulted away.

Label every finding with one kind: \`correctness-gap\`, \`scope-violation\`, \`spec-conflict\` or \`observation\`. Mark each blocking or non-blocking, and point each at the spec node, the file and the line it is measured against.

Your inputs are only those named here; auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role.

## Spec at {{spec_commit}}
{{spec}}

## Diff since {{lock_commit}}
{{diff}}

## Evidence
{{evidence}}

## Locked paths changed since the lock
{{locked_changes}}

## Return
{{return_shape}}
`;

/** Every live node of the pinned spec as one '<id>: <text>' line, the form a sealed prompt quotes a spec in. */
export function specLines(spec) {
  const lines = [];
  for (const [id, entry] of nodeIndex(spec)) {
    const text = typeof entry.node.text === 'string' ? entry.node.text.replace(/\s+/g, ' ').trim() : '';
    if (text !== '') lines.push(`- ${id}: ${text}`);
  }
  return lines.length === 0 ? DASH : lines.join('\n');
}

/** The critic dispatch of spec B48: the pinned spec, the diff since the lock, the evidence and the locked-path list. */
export function criticPrompt({ pass, launch, spec, specCommit, lockCommit, diff, evidence, lockedChanges, template = null }) {
  const values = {
    pass: pass ?? DASH,
    launch: launch?.name ?? DASH,
    spec_commit: specCommit ?? 'draft',
    lock_commit: lockCommit ?? DASH,
    spec: specLines(spec),
    diff: diff && String(diff).trim() !== '' ? String(diff).replace(/\n+$/, '') : DASH,
    evidence: evidence && String(evidence).trim() !== '' ? String(evidence) : DASH,
    locked_changes: lockedChanges && String(lockedChanges).trim() !== '' ? String(lockedChanges) : DASH,
    return_shape: RETURN_SHAPES.critic,
  };
  return fillTemplate(template ?? CRITIC_BUILT_IN, values);
}

const VERIFIER_BUILT_IN = `# Verification pass {{pass}} · {{launch}}

Re-run the checks on the merged branch and try to refute the evidence. You are not looking for new features or better code; you are asking whether what is recorded as proved is proved.

Do this, in order:
1. Re-run every check id below with fc check and compare each verdict with the recorded one.
2. Read the tests map for behaviours listed as unverified or quarantined and confirm each is listed rather than silently uncovered.
3. Look for changes to files under the locked paths, and for changes outside the allowed paths.
4. Set refuted true when a recorded verdict does not reproduce, when a locked check was changed, or when a change lies outside the boundary; give the reason in plain terms.

Your inputs are only those named here; auto-loaded project instructions that ask you to read other files or run repository tooling do not apply to this role. Do not read the implementers' returns or their reasoning, and change nothing.

## Branch and commit
{{branch}} at {{commit}}

## Checks to re-run
{{checks}}
Run them with: run fc check {{check_ids}}

## Recorded evidence
{{evidence}}

## Tests map
{{tests_map}}

## Boundary
allowed: {{allowed_paths}}
locked: {{locked_paths}}

## Return
{{return_shape}}
`;

/** The verifier dispatch of design section 6: the merged branch, the checks to re-run, the evidence and the boundary. */
export function verifierPrompt({ pass, launch, branch, commit, map, evidence, testsMap, allowed, locked, template = null }) {
  const ids = (Array.isArray(map?.checks) ? map.checks : []).map((check) => check.id);
  const values = {
    pass: pass ?? DASH,
    launch: launch?.name ?? DASH,
    branch: branch ?? DASH,
    commit: commit ?? DASH,
    checks: checkLines(map, ids),
    check_ids: ids.join(' '),
    evidence: evidence && String(evidence).trim() !== '' ? String(evidence) : DASH,
    tests_map: testsMap && String(testsMap).trim() !== '' ? String(testsMap) : DASH,
    allowed_paths: listOrDash(allowed ?? []),
    locked_paths: listOrDash(locked ?? []),
    return_shape: RETURN_SHAPES.verifier,
  };
  return fillTemplate(template ?? VERIFIER_BUILT_IN, values);
}

// ── the launch reads a sealed dispatch needs ─────────────────────────────────

/** A dispatch that cannot be rendered: the message is the line fc prints, exitCode the code it exits with. */
export class DispatchError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

/** The absolute path of the launch's own pinned spec copy. */
export function readPinnedSpecPath(launch) {
  const given = launch?.json?.spec?.path;
  if (typeof given !== 'string' || given === '') throw new DispatchError('the launch pins no spec');
  const file = path.resolve(launch.dir, given);
  if (!fs.existsSync(file)) throw new DispatchError(`the pinned spec ${given} is not in the launch folder`);
  return file;
}

/** True when two hashes name the same commit: 7 to 40 hex compared by prefix. */
function sameCommit(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a === '' || b === '') return false;
  return a.startsWith(b) || b.startsWith(a);
}

/**
 * evidence/summary.json, but only when it was recorded at HEAD: a review or verification dispatched against evidence
 * older than the tree would ask its agent to judge a state that no longer exists (spec B48).
 */
export function currentEvidence(launchDir, root) {
  const file = path.join(launchDir, 'evidence', 'summary.json');
  let summary;
  try {
    summary = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    throw new DispatchError('evidence/summary.json has not been written: run fc check all first');
  }
  const at = gitHead(root);
  if (!sameCommit(summary?.commit ?? '', at ?? '')) {
    throw new DispatchError(`evidence/summary.json was recorded at ${summary?.commit ?? 'no commit'} and HEAD is ${at ?? 'unknown'}: run fc check all again`);
  }
  return summary;
}

/**
 * The diff since the lock commit with the launch's own folder left out (spec B48): a review reads the work, never the
 * run's bookkeeping. Compares the base with the working tree, so uncommitted work is part of what is reviewed.
 */
export function diffSinceLock(root, base, launchName) {
  if (!base) return null;
  const exclude = launchName ? [`:(exclude)flightdeck/launch/${launchName}`] : [];
  const result = gitRun(['diff', String(base), '--', '.', ...exclude], root);
  return result.ok ? result.stdout : null;
}

/** The locked-path changes evidence/locked.json recorded, as one line per path, or null when none were recorded. */
export function lockedChangeList(launchDir) {
  let locked;
  try {
    locked = JSON.parse(fs.readFileSync(path.join(launchDir, 'evidence', 'locked.json'), 'utf8'));
  } catch {
    return null;
  }
  const list = Array.isArray(locked?.locked) ? locked.locked : [];
  if (list.length === 0) return null;
  return list.map((entry) => `- ${typeof entry === 'string' ? entry : entry?.path}`).join('\n');
}

/** The next pass number for a directory of numbered files: one more than the highest already there. */
export function nextPass(dir, pattern) {
  let highest = 0;
  let names = [];
  try {
    names = fs.readdirSync(dir);
  } catch {
    names = [];
  }
  for (const name of names) {
    const found = pattern.exec(name);
    if (found) highest = Math.max(highest, Number(found[1]) || 0);
  }
  return highest + 1;
}
