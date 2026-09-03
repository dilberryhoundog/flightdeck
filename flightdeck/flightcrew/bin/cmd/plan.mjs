// flightcrew/bin/cmd/plan.mjs — fc plan: validates a plan, stores it as the launch's plan.json, and renders plan.md from it with the six headings of design 5.4 in their fixed order.
// Usage: node flightdeck/flightcrew/bin/fc.mjs plan write <json-path|--stdin> | plan render; exit 0 on success, 2 when the plan does not validate, 1 on a usage or environment error.
//
// plan.json is the source of truth and plan.md is rendered from it, never hand-edited (spec D5). A plan is validated
// before anything is written: the candidate is staged inside the launch folder so validate-plan resolves the pinned
// spec and map from the folder it sits in, and a plan that does not validate leaves plan.json and plan.md exactly as
// they were. Rendering reads nothing but plan.json, so the same plan renders byte-identically every time (spec B21).

import fs from 'node:fs';
import path from 'node:path';
import { bestEffortRender } from '../../checks/lib/launch-lib.mjs';
import { DASH, inOrder, mdSections, mdTable } from '../../checks/lib/render-lib.mjs';
import { EXIT, fail, ok } from '../../checks/lib/output.mjs';
import { readJsonFile, resolveInput, runValidator, UsageError, writeJsonFile } from '../fc.mjs';

export const help = 'fc plan write <json-path|--stdin> | fc plan render — store and render the run plan.';

const HEADINGS = ['## Approach', '## Waves and units', '## Risks', '## Gates', '## Abandon triggers'];
const COLUMNS = ['unit', 'name', 'kind', 'wave', 'mode', 'pilot', 'checks', 'spec refs', 'paths', 'depends on', 'owner', 'turns'];

/**
 * References to other rows and to files are code-formatted; the row's own id and name are not. The table is read
 * unit by unit, so the plain cells are the ones that identify the row and the backticked ones are what it points at.
 */
function refs(items, separator = ' ') {
  const list = (Array.isArray(items) ? items : []).map((item) => String(item)).filter((item) => item !== '');
  return list.length === 0 ? DASH : list.map((item) => `\`${item}\``).join(separator);
}

/** The wave each unit belongs to, so the table can carry the wave and its mode beside the unit. */
function waveIndex(plan) {
  const index = new Map();
  for (const wave of Array.isArray(plan?.waves) ? plan.waves : []) {
    for (const unit of Array.isArray(wave?.units) ? wave.units : []) index.set(String(unit), wave);
  }
  return index;
}

function unitRows(plan) {
  const waves = waveIndex(plan);
  return (Array.isArray(plan?.units) ? plan.units : []).map((unit) => {
    const wave = waves.get(String(unit?.id));
    return [
      unit?.id,
      unit?.name,
      unit?.kind,
      wave?.id,
      wave?.mode,
      unit?.pilot ? 'yes' : 'no',
      refs(unit?.checks),
      refs(unit?.spec_refs),
      refs(unit?.paths),
      refs(unit?.depends_on),
      unit?.owner,
      unit?.budget_turns,
    ];
  });
}

function riskLines(plan) {
  return (Array.isArray(plan?.risks) ? plan.risks : []).map((risk) => {
    const source = risk?.source ? ` (source: ${risk.source})` : '';
    return `- ${risk?.text ?? ''} — reaction: ${risk?.reaction ?? ''}${source}`;
  });
}

function gateLines(plan) {
  const gates = plan?.gates ?? {};
  return ['G1', 'G2', 'G3'].filter((id) => gates[id] !== undefined).map((id) => `- ${id}: ${gates[id]}`);
}

function triggerLines(plan) {
  return (Array.isArray(plan?.abandon_triggers) ? plan.abandon_triggers : []).map(
    (trigger) => `- ${trigger?.trigger ?? ''} — observable by: ${trigger?.observable_by ?? ''}`,
  );
}

/**
 * plan.md for a plan document: the title, then the five sections in the order design 5.4 fixes. Pure — the same plan
 * renders the same bytes, which is the property spec B21 asserts.
 */
export function renderPlanMarkdown(plan) {
  const title = `# Plan: ${plan?.spec?.name ?? 'unknown'} · ${plan?.launch ?? 'unknown'}`;
  const sections = inOrder(HEADINGS, {
    '## Approach': plan?.approach ?? '',
    '## Waves and units': mdTable(COLUMNS, unitRows(plan)),
    '## Risks': riskLines(plan),
    '## Gates': gateLines(plan),
    '## Abandon triggers': triggerLines(plan),
  });
  return `${title}\n\n${mdSections(sections)}`;
}

function validatePlanFile(ctx, file) {
  return runValidator(ctx, 'validate-plan', [file], { cwd: ctx.launch.dir });
}

/** Reads the plan the write subcommand was given: a file path, or the whole of standard input under --stdin. */
function readCandidate(ctx, args) {
  if (args.includes('--stdin')) {
    let text;
    try {
      text = fs.readFileSync(0, 'utf8');
    } catch (error) {
      throw new UsageError(`fc plan write --stdin could not read standard input: ${error.message}`);
    }
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new UsageError(`fc plan write --stdin: the input is not valid JSON: ${error.message}`);
    }
  }
  const given = args.find((item) => !item.startsWith('--'));
  if (!given) throw new UsageError('fc plan write needs a JSON path or --stdin');
  return readJsonFile(resolveInput(ctx, given));
}

async function write(args, ctx) {
  const dir = ctx.launch.dir;
  const planJson = path.join(dir, 'plan.json');
  const planMd = path.join(dir, 'plan.md');
  const candidate = path.join(dir, 'plan.candidate.json');
  const plan = readCandidate(ctx, args);
  writeJsonFile(candidate, plan);
  let code;
  try {
    code = validatePlanFile(ctx, candidate);
  } finally {
    fs.rmSync(candidate, { force: true });
  }
  if (code !== EXIT.ok) {
    fail('plan not stored: it does not validate');
    return EXIT.blocked;
  }
  writeJsonFile(planJson, plan);
  fs.writeFileSync(planMd, renderPlanMarkdown(plan));
  await bestEffortRender(dir);
  ok(`plan written: ${path.relative(ctx.root, planMd).split(path.sep).join('/')}`);
  return EXIT.ok;
}

async function render(args, ctx) {
  const dir = ctx.launch.dir;
  const planJson = path.join(dir, 'plan.json');
  const planMd = path.join(dir, 'plan.md');
  if (!fs.existsSync(planJson)) throw new UsageError(`no plan to render: ${path.relative(ctx.root, planJson).split(path.sep).join('/')} does not exist`);
  if (validatePlanFile(ctx, planJson) !== EXIT.ok) {
    fail('plan.md not rendered: plan.json does not validate');
    return EXIT.blocked;
  }
  fs.writeFileSync(planMd, renderPlanMarkdown(readJsonFile(planJson)));
  await bestEffortRender(dir);
  ok(`plan rendered: ${path.relative(ctx.root, planMd).split(path.sep).join('/')}`);
  return EXIT.ok;
}

export async function run(args, ctx) {
  const [sub, ...rest] = args;
  if (sub === 'write') return write(rest, ctx);
  if (sub === 'render') return render(rest, ctx);
  fail(['fc plan: expected write or render', help]);
  return EXIT.usage;
}
