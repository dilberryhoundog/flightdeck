// flightcrew/bin/cmd/runlog.mjs — fc runlog: the run-log entry a finished run leaves in flightdeck/launch/RUNLOG.md, and the reader that prints the log newest first.
// Usage: node flightdeck/flightcrew/bin/fc.mjs runlog stub | runlog show [--spec S]; exit 0 on success, 1 on a usage or environment error.
//
// The entry's mechanical fields are filled from launch.json, the events and the budget counters; every field a human
// has to think about arrives as '<fill>', so an entry is never silently complete. Entries are inserted after the run
// log's first heading, newest first, and the file is created with '# Run log' when it is not there yet. An accepted
// run records what was kept and what was reserved; an abandoned or partial run records the diagnosis fields, with the
// symptom pre-filled from the ending the events recorded. The observations of the last critic pass close the entry.

import fs from 'node:fs';
import path from 'node:path';
import { readEvents } from '../../checks/lib/launch-lib.mjs';
import { EXIT, fail, ok, print } from '../../checks/lib/output.mjs';
import { parseFlags, UsageError } from '../fc.mjs';
import { costLine, countBudget } from './budget.mjs';

export const help = 'fc runlog stub | fc runlog show [--spec S] — the run-log entry and the run log.';

/** Reading the log needs no launch; writing an entry reads the launch that ended. */
export const needsLaunch = (args) => args?.[0] !== 'show';

const FILL = '<fill>';
const ACCEPTED_FAMILY = ['accepted', 'accepted-with-reservations'];

function readJsonSafe(file) {
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

/** The run log of a launch directory. */
export function runlogFile(launchDir) {
  return path.join(launchDir, 'RUNLOG.md');
}

function oneLine(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * The symptom line of an abandoned or partial entry, read from what the run recorded: the ending event and its stage,
 * then the newest gate exit, escalation or fired trigger, then the units a partial ending dropped.
 */
function symptomOf(dir, launchJson) {
  const { events } = readEvents(dir);
  const reversed = [...events].reverse();
  const ending = reversed.find((event) => event?.event === 'launch_end');
  const at = ending?.detail?.at ?? null;
  const parts = [`${launchJson.outcome}${at ? ` at ${at}` : ''}`];
  const marker = reversed.find((event) => (event?.event === 'gate' && event?.detail?.decision === 'exit')
    || event?.event === 'escalation'
    || event?.event === 'trigger');
  if (marker?.event === 'gate') {
    parts.push(`${marker.detail?.gate} exit${marker.detail?.note ? `: ${marker.detail.note}` : ''}`);
  } else if (marker?.event === 'escalation') {
    parts.push(`escalation ${marker.detail?.kind ?? ''}${marker.detail?.detail ? `: ${marker.detail.detail}` : ''}`);
  } else if (marker?.event === 'trigger') {
    parts.push(`trigger ${marker.detail?.name ?? marker.detail?.detail ?? ''}`);
  }
  if (Array.isArray(launchJson.abandoned_units) && launchJson.abandoned_units.length > 0) {
    parts.push(`units abandoned: ${launchJson.abandoned_units.join(', ')}`);
  }
  return oneLine(parts.filter((part) => part !== '').join(' — '));
}

/** The observation findings of the newest critic pass, as bullet lines. */
function observationsOf(dir) {
  const reviewDir = path.join(dir, 'review');
  let names = [];
  try {
    names = fs.readdirSync(reviewDir).filter((entry) => /^pass-\d+\.json$/.test(entry)).sort();
  } catch {
    return [];
  }
  const last = names[names.length - 1];
  if (!last) return [];
  const doc = readJsonSafe(path.join(reviewDir, last));
  return (Array.isArray(doc?.findings) ? doc.findings : [])
    .filter((finding) => finding?.kind === 'observation')
    .map((finding) => `- ${finding.id}: ${oneLine(finding.text)}`);
}

/**
 * The run-log entry for a launch that has ended: the heading, the mechanical fields, the fields a human fills, and
 * the observations of the last critic pass. Returns the entry as one string with no trailing blank line.
 */
export function stubEntry(dir, launchJson) {
  const outcome = String(launchJson.outcome ?? '');
  const ended = String(launchJson.ended ?? '');
  const counts = countBudget(dir, launchJson);
  const lines = [
    `## ${ended.slice(0, 10)} · ${launchJson.spec?.name ?? 'unknown'} · ${launchJson.name}`,
    `spec: ${launchJson.spec?.name ?? 'unknown'} v${launchJson.spec?.version ?? '?'} @ ${launchJson.spec?.commit ?? 'draft'}`,
    `kickoff: ${launchJson.kickoff?.version ?? '(none)'}`,
    `outcome: ${outcome}`,
    `cost: ${costLine(counts)}`,
  ];
  if (ACCEPTED_FAMILY.includes(outcome)) {
    lines.push(`kept: ${FILL}`, `reservation: ${FILL}`);
  } else {
    lines.push(`symptom: ${symptomOf(dir, launchJson)}`);
    for (const field of ['seen on', 'cause', 'fixed on', 'change', 'watch']) lines.push(`${field}: ${FILL}`);
    if (outcome === 'partial') {
      lines.push(`landed: ${(launchJson.accepted_units ?? []).join(', ') || '—'}`);
      lines.push(`abandoned: ${(launchJson.abandoned_units ?? []).join(', ') || '—'}`);
    }
    lines.push(`kept: ${FILL}`, `promote: ${FILL}`);
  }
  const observations = observationsOf(dir);
  if (observations.length > 0) lines.push('observations:', ...observations);
  return lines.join('\n');
}

/** Inserts an entry after the first heading of the run log, creating the file with '# Run log' when it is absent. */
export function insertEntry(file, entry) {
  let text = '';
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    text = '';
  }
  const lines = text === '' ? [] : text.split('\n');
  const headingAt = lines.findIndex((line) => line.startsWith('# '));
  if (headingAt === -1) {
    const body = text.trim() === '' ? '' : `\n${text.trimStart()}`;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `# Run log\n\n${entry}\n${body}`);
    return file;
  }
  const before = lines.slice(0, headingAt + 1);
  const after = lines.slice(headingAt + 1);
  while (after.length > 0 && after[0].trim() === '') after.shift();
  const rest = after.length > 0 ? `\n${after.join('\n')}` : '\n';
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${before.join('\n')}\n\n${entry}\n${rest}`);
  return file;
}

/** Writes the run-log stub for the launch a context resolves. Returns the run-log path. */
export function writeStub(ctx) {
  const { dir, json: launchJson } = ctx.launch;
  if (!launchJson.outcome || !launchJson.ended) {
    throw new UsageError('the launch has not ended; run fc launch end before fc runlog stub');
  }
  return insertEntry(runlogFile(ctx.launchDir), stubEntry(dir, launchJson));
}

/** The entries of a run log, newest first, each as its heading plus its lines. */
function entriesOf(text) {
  const lines = String(text ?? '').split('\n');
  const entries = [];
  let current = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) entries.push(current);
      current = { heading: line, lines: [line] };
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) entries.push(current);
  return entries;
}

function show(args, ctx) {
  const { flags } = parseFlags(args, { spec: 'string' });
  const file = runlogFile(ctx.launchDir);
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    print('no run log yet');
    return EXIT.ok;
  }
  const entries = entriesOf(text);
  const wanted = flags.spec ? entries.filter((entry) => entry.heading.includes(` · ${flags.spec} · `)) : entries;
  if (wanted.length === 0) {
    print(flags.spec ? `no entries for spec ${flags.spec}` : 'no entries yet');
    return EXIT.ok;
  }
  for (const entry of wanted) {
    for (const line of entry.lines) print(line);
    print('');
  }
  return EXIT.ok;
}

export async function run(args, ctx) {
  const [sub, ...rest] = args;
  if (sub === 'stub') {
    if (rest.length > 0) throw new UsageError(`fc runlog stub takes no arguments; got ${rest.join(' ')}`);
    const file = writeStub(ctx);
    ok(`run-log entry inserted in ${path.relative(ctx.root, file).split(path.sep).join('/')}`);
    return EXIT.ok;
  }
  if (sub === 'show') return show(rest, ctx);
  fail(['fc runlog: expected stub or show', help]);
  return EXIT.usage;
}
