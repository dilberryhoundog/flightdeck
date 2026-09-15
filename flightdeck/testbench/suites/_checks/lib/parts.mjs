// testbench/suites/_checks/lib/parts.mjs — the inventory of flightcrew's parts (spec B1), the rule by which a case names a part, the alteration that breaks each kind of part, and the sweep that proves a break turns a naming case red (spec B2).
// Usage: import { inventory, namesPart, alter, sweep } from '../lib/parts.mjs'.
//
// Inventory (VER, B1): flightdeck/flightcrew/MANIFEST.txt filtered to hooks (hooks/*.mjs except lib.mjs), role files (crew/*.md
// except README.md), schemas (schemas/*.schema.json), templates (templates/** except README.md), validators
// (checks/validators/*.mjs), gates (checks/gates/*.mjs) and workflow scripts (workflows/*.js); plus the runner's subcommands as its
// usage lists them, written 'fc <command>' or 'fc <command> <sub>'; plus every file 'fc distribute' lists, as '.claude/<path>'.
// Naming: a case names a path part when its name contains the repository-relative path bounded by characters that cannot belong
// to a path, and names a subcommand when it contains the token as the runner's usage prints it, 'fc <command>' or
// 'fc <command> <sub>', space-separated, bounded by characters that cannot belong to a word.
// Alterations (VER, B2): a subcommand's exit code inverted when fc.mjs runs it; a hook's decision flipped (a blocking answer
// becomes a silent allow, anything else becomes exit 2); a role file's 'name' frontmatter field dropped; a schema's top-level
// 'required' removed; a template's first slot renamed ('{{x}}', else the first key of a JSON template, else the kickoff version
// comment, else the first heading); a validator's or a gate's exit code inverted; a workflow's 'export const meta' removed; a
// distributed file altered as its source kind is.

import fs from 'node:fs';
import path from 'node:path';
import { readOutput, bareName } from './protocol.mjs';
import { BudgetError, DEADLINE, git, isFile, oneLine, pool, readText, runNode, snapshotCopy, suiteOutputs, SWEEP_CONCURRENCY } from './check-lib.mjs';

export const MANIFEST_REL = 'flightdeck/flightcrew/MANIFEST.txt';

// ── inventory ────────────────────────────────────────────────────────────────
/** The kind of a part, or null when the path is not one of B1's categories. */
export function kindOf(part) {
  if (/^fc [a-z]/.test(part)) return 'subcommand';
  if (/^flightdeck\/flightcrew\/hooks\/[^/]+\.mjs$/.test(part)) return path.basename(part) === 'lib.mjs' ? null : 'hook';
  if (/^flightdeck\/flightcrew\/crew\/[^/]+\.md$/.test(part)) return path.basename(part) === 'README.md' ? null : 'role';
  if (/^flightdeck\/flightcrew\/schemas\/[^/]+\.schema\.json$/.test(part)) return 'schema';
  if (/^flightdeck\/flightcrew\/templates\/.+/.test(part)) return path.basename(part) === 'README.md' ? null : 'template';
  if (/^flightdeck\/flightcrew\/checks\/validators\/[^/]+\.mjs$/.test(part)) return 'validator';
  if (/^flightdeck\/flightcrew\/checks\/gates\/[^/]+\.mjs$/.test(part)) return 'gate';
  if (/^flightdeck\/flightcrew\/workflows\/[^/]+\.js$/.test(part)) return 'workflow';
  if (/^\.claude\/agents\/.+\.md$/.test(part)) return 'distributed-role';
  if (/^\.claude\/workflows\/.+\.js$/.test(part)) return 'distributed-workflow';
  return null;
}

/** The paths MANIFEST.txt lists, in order. */
export function manifestPaths(text) {
  return String(text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'));
}

/** The subcommands the runner's usage lists: 'fc <command>' for a command with no subs, 'fc <command> <sub>' for each sub. */
export function subcommandsFromUsage(text) {
  const lines = String(text ?? '').split('\n');
  const start = lines.findIndex((l) => l.trim() === 'commands:');
  if (start === -1) return [];
  const parts = [];
  for (const raw of lines.slice(start + 1)) {
    if (raw.trim() === '') continue;
    if (!/^\s/.test(raw)) break;
    const body = raw.trim().split(/ {2,}/)[0];
    for (const group of body.split(' | ')) {
      const tokens = group.trim().split(/\s+/);
      const command = tokens[0];
      if (!/^[a-z][a-z-]*$/.test(command)) continue;
      const second = tokens[1];
      if (second && /^[a-z][a-z-]*(\|[a-z][a-z-]*)*$/.test(second)) {
        for (const sub of second.split('|')) parts.push(`fc ${command} ${sub}`);
      } else {
        parts.push(`fc ${command}`);
      }
    }
  }
  return [...new Set(parts)];
}

/** The files 'fc distribute' lists as '<from> -> <to>', as '.claude/<to>'. */
export function distributedFromListing(text) {
  const parts = [];
  for (const line of String(text ?? '').split('\n')) {
    const m = /^\s+\S+ -> (\S+)$/.exec(line);
    if (m) parts.push(`.claude/${m[1]}`);
  }
  return parts;
}

/** The inventory from the three sources' text: { parts: [{ part, kind }] } in a stable order. */
export function inventoryFrom({ manifest, usage, distribute }) {
  const parts = [];
  for (const p of subcommandsFromUsage(usage)) parts.push({ part: p, kind: 'subcommand' });
  for (const p of manifestPaths(manifest)) {
    const kind = kindOf(p);
    if (kind && kind !== 'subcommand' && !kind.startsWith('distributed')) parts.push({ part: p, kind });
  }
  for (const p of distributedFromListing(distribute)) parts.push({ part: p, kind: kindOf(p) ?? 'distributed-file' });
  const seen = new Set();
  return parts.filter((p) => (seen.has(p.part) ? false : seen.add(p.part)));
}

/** The inventory of the tree at `root`, reading its MANIFEST, running its fc with no command and its fc distribute dry run. */
export function inventory(root) {
  const fcMjs = path.join(root, 'flightdeck/flightcrew/bin/fc.mjs');
  const usage = runNode(root, [fcMjs]);
  const distribute = runNode(root, [fcMjs, 'distribute']);
  const manifest = readText(path.join(root, MANIFEST_REL));
  if (manifest === null) throw new Error(`${MANIFEST_REL} could not be read`);
  const usageText = `${usage.stdout}\n${usage.stderr}`;
  if (subcommandsFromUsage(usageText).length === 0) throw new Error('the runner printed no usage with a commands: list');
  if (distribute.exit !== 0) throw new Error(`fc distribute exited ${distribute.exit}: ${distribute.stderr.trim()}`);
  return inventoryFrom({ manifest, usage: usageText, distribute: distribute.stdout });
}

// ── naming ───────────────────────────────────────────────────────────────────
const PATH_CHAR = /[A-Za-z0-9._\/-]/;

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** True when the case name names the part by the rule in this file's header. */
export function namesPart(caseName, part) {
  const name = bareName(caseName);
  if (part.startsWith('fc ')) {
    const tokens = part.split(' ');
    const re = new RegExp(`(^|[^A-Za-z0-9_])${tokens.map(escape).join(' ')}(?![A-Za-z0-9_])`);
    return re.test(name);
  }
  let from = 0;
  while (true) {
    const at = name.indexOf(part, from);
    if (at === -1) return false;
    const before = at === 0 ? '' : name[at - 1];
    const after = name[at + part.length] ?? '';
    if ((before === '' || !PATH_CHAR.test(before)) && (after === '' || !PATH_CHAR.test(after))) return true;
    from = at + 1;
  }
}

/** For each part, the cases (suite, name, verdict) that name it, from a map of suite outputs. */
export function namingCases(parts, outputs, ids) {
  const byPart = new Map(parts.map((p) => [p.part, []]));
  for (const [suite, run] of outputs) {
    const read = readOutput(run, ids);
    for (const c of read.cases) {
      for (const p of parts) if (namesPart(c.name, p.part)) byPart.get(p.part).push({ suite, name: c.name, bare: c.bare, verdict: c.verdict });
    }
  }
  return byPart;
}

// ── alterations ──────────────────────────────────────────────────────────────
function prependModule(text, code) {
  if (text.startsWith('#!')) {
    const nl = text.indexOf('\n');
    return `${text.slice(0, nl + 1)}${code}\n${text.slice(nl + 1)}`;
  }
  return `${code}\n${text}`;
}

const INVERT_ALWAYS = "process.on('exit', (code) => { process.exitCode = code === 0 ? 2 : 0; }); /* altered: exit code inverted */";

function invertForSubcommand(command, sub) {
  return [
    "process.on('exit', (code) => { /* altered: exit code inverted for one subcommand */",
    "  if (!/fc\\.mjs$/.test(String(process.argv[1] ?? ''))) return;",
    '  const a = process.argv.slice(2); const pos = [];',
    "  for (let i = 0; i < a.length; i += 1) { if (a[i] === '--launch') { i += 1; continue; } if (a[i] === '--json' || String(a[i]).startsWith('--launch=')) continue; pos.push(a[i]); }",
    `  if (pos[0] === ${JSON.stringify(command)} && (${JSON.stringify(sub)} === null || pos[1] === ${JSON.stringify(sub)})) process.exitCode = code === 0 ? 2 : 0;`,
    '});',
  ].join('\n');
}

const FLIP_DECISION = [
  "import __fcAltFs from 'node:fs'; /* altered: decision flipped */",
  '{',
  '  const buf = [];',
  '  const origWrite = __fcAltFs.writeSync;',
  '  __fcAltFs.writeSync = function (fd, data, ...rest) {',
  '    if (fd !== 1) return origWrite.call(this, fd, data, ...rest);',
  '    let chunk;',
  "    if (typeof data === 'string') chunk = Buffer.from(data, typeof rest[1] === 'string' ? rest[1] : 'utf8');",
  '    else { const off = Number.isInteger(rest[0]) ? rest[0] : 0; const len = Number.isInteger(rest[1]) ? rest[1] : data.byteLength - off; chunk = Buffer.from(Buffer.from(data.buffer, data.byteOffset + off, len)); }',
  '    buf.push(chunk);',
  '    return chunk.length;',
  '  };',
  '  process.stdout.write = (chunk, enc, cb) => {',
  "    buf.push(typeof chunk === 'string' ? Buffer.from(chunk, typeof enc === 'string' ? enc : 'utf8') : Buffer.from(chunk));",
  "    const done = typeof enc === 'function' ? enc : cb; if (typeof done === 'function') done();",
  '    return true;',
  '  };',
  "  process.on('exit', (code) => {",
  "    const text = Buffer.concat(buf).toString('utf8');",
  '    const blocked = code === 2 || /"permissionDecision"\\s*:\\s*"(deny|ask)"/.test(text) || /"decision"\\s*:\\s*"block"/.test(text) || /"continue"\\s*:\\s*false/.test(text);',
  '    if (blocked) process.exitCode = 0;',
  "    else { origWrite.call(__fcAltFs, 2, 'altered: decision flipped\\n'); process.exitCode = 2; }",
  '  });',
  '}',
].join('\n');

/** The text with the frontmatter field `field` dropped, or null when the first frontmatter block has no such field. */
export function dropFrontmatterField(text, field) {
  const lines = text.split('\n');
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end === -1) return null;
  const at = lines.slice(1, end).findIndex((l) => new RegExp(`^${field}\\s*:`).test(l));
  if (at === -1) return null;
  lines.splice(at + 1, 1);
  return lines.join('\n');
}

/** The text with the 'export const meta = { … };' statement removed, or null when there is none. */
export function removeMeta(text) {
  const at = text.search(/export\s+const\s+meta\s*=/);
  if (at === -1) return null;
  const open = text.indexOf('{', at);
  if (open === -1) return null;
  let depth = 0;
  let quote = null;
  for (let i = open; i < text.length; i += 1) {
    const ch = text[i];
    if (quote) {
      if (ch === '\\') i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        let stop = i + 1;
        if (text[stop] === ';') stop += 1;
        return `${text.slice(0, at)}${text.slice(stop)}`;
      }
    }
  }
  return null;
}

/** The template text with its first slot renamed, or null when no slot form applies. */
export function renameTemplateSlot(text, rel) {
  const slot = /\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/.exec(text);
  if (slot) {
    const name = slot[1];
    return text.replace(new RegExp(`\\{\\{\\s*${escape(name)}\\s*\\}\\}`, 'g'), `{{${name}_renamed}}`);
  }
  if (rel.endsWith('.json')) {
    let doc;
    try {
      doc = JSON.parse(text);
    } catch {
      return null;
    }
    if (!doc || typeof doc !== 'object' || Array.isArray(doc)) return null;
    const key = Object.keys(doc).find((k) => k !== '$schema');
    if (!key) return null;
    const next = {};
    for (const [k, v] of Object.entries(doc)) next[k === key ? `${k}_renamed` : k] = v;
    return `${JSON.stringify(next, null, 2)}\n`;
  }
  const lines = text.split('\n');
  if (/^<!--\s*version:\s*\d+\s*-->$/.test(lines[0] ?? '')) {
    lines[0] = lines[0].replace('version:', 'renamed-version:');
    return lines.join('\n');
  }
  const heading = lines.findIndex((l) => /^#{1,6} \S/.test(l));
  if (heading !== -1) {
    lines[heading] = `${lines[heading]} renamed`;
    return lines.join('\n');
  }
  return null;
}

/**
 * Applies the alteration for `part` inside the tree at `dir`. Returns a one-line description, or null when no alteration applies.
 */
export function alter(dir, part) {
  const kind = kindOf(part);
  if (kind === 'subcommand') {
    const tokens = part.split(' ');
    const file = path.join(dir, 'flightdeck/flightcrew/bin/fc.mjs');
    const text = readText(file);
    if (text === null) return null;
    fs.writeFileSync(file, prependModule(text, invertForSubcommand(tokens[1], tokens[2] ?? null)));
    return `exit code of '${part}' inverted`;
  }
  const file = path.join(dir, part);
  const text = readText(file);
  if (text === null) return null;
  let next = null;
  let what = null;
  if (kind === 'hook') {
    next = prependModule(text, FLIP_DECISION);
    what = 'decision flipped';
  } else if (kind === 'validator' || kind === 'gate') {
    next = prependModule(text, INVERT_ALWAYS);
    what = 'exit code inverted';
  } else if (kind === 'role' || kind === 'distributed-role') {
    next = dropFrontmatterField(text, 'name');
    what = "frontmatter field 'name' dropped";
  } else if (kind === 'schema') {
    try {
      const doc = JSON.parse(text);
      if (Array.isArray(doc.required)) {
        delete doc.required;
        next = `${JSON.stringify(doc, null, 2)}\n`;
      }
    } catch {
      next = null;
    }
    what = "top-level 'required' removed";
  } else if (kind === 'template') {
    next = renameTemplateSlot(text, part);
    what = 'first slot renamed';
  } else if (kind === 'workflow' || kind === 'distributed-workflow') {
    next = removeMeta(text);
    what = 'meta removed';
  }
  if (next === null || next === text) return null;
  fs.writeFileSync(file, next);
  return what;
}

// ── the sweep ────────────────────────────────────────────────────────────────
/**
 * For each part: the suites whose cases name it (from `outputs`, the name index) are run in an unaltered snapshot copy, several
 * at once, and in a copy with the part altered, one copy per part and `concurrency` copies at once; the part is held when at least
 * one case naming it passes unaltered and fails altered. A part whose copy cannot start or finish inside the check's budget is
 * reported not swept. Returns [{ part, held, exempt, detail }].
 */
export async function sweep({ root, parts, outputs, ids, exempt = new Map(), concurrency = SWEEP_CONCURRENCY, deadline = DEADLINE }) {
  const naming = namingCases(parts, outputs, ids);
  const results = new Map();
  const work = [];
  for (const p of parts) {
    if (exempt.has(p.part)) {
      results.set(p.part, { part: p.part, held: true, exempt: true, detail: `exempt: ${exempt.get(p.part)}` });
      continue;
    }
    const cases = naming.get(p.part) ?? [];
    if (cases.length === 0) {
      results.set(p.part, { part: p.part, held: false, exempt: false, detail: `no case names ${p.part}` });
      continue;
    }
    work.push({ ...p, cases, suites: [...new Set(cases.map((c) => c.suite))].sort() });
  }
  if (work.length > 0) {
    const allSuites = [...new Set(work.flatMap((w) => w.suites))].sort();
    const base = snapshotCopy(root);
    let unaltered;
    try {
      unaltered = await suiteOutputs(base.dir, { mode: 'copy', only: allSuites, concurrency, deadline });
    } finally {
      base.remove();
    }
    const unalteredVerdicts = new Map();
    for (const [suite, run] of unaltered) {
      for (const c of readOutput(run, ids).cases) unalteredVerdicts.set(`${suite}\0${c.name}`, c.verdict);
    }
    await pool(work, concurrency, async (w) => {
      if (Date.now() >= deadline) {
        results.set(w.part, { part: w.part, held: false, exempt: false, detail: `${w.part} was not swept: ${new BudgetError('its copy started').message}` });
        return;
      }
      const copy = snapshotCopy(root);
      try {
        const what = alter(copy.dir, w.part);
        if (what === null) {
          results.set(w.part, { part: w.part, held: false, exempt: false, detail: `no alteration applies to ${w.part} and it is not listed as exempt` });
          return;
        }
        let altered;
        try {
          altered = await suiteOutputs(copy.dir, { mode: 'copy', only: w.suites, deadline });
        } catch (error) {
          results.set(w.part, { part: w.part, held: false, exempt: false, detail: `${w.part} was not swept: ${oneLine(error)}` });
          return;
        }
        const red = [];
        const greenBefore = [];
        for (const c of w.cases) {
          const before = unalteredVerdicts.get(`${c.suite}\0${c.name}`);
          if (before !== 'pass') continue;
          greenBefore.push(c);
          const read = readOutput(altered.get(c.suite), ids);
          const after = read.cases.find((x) => x.name === c.name);
          if (!after || after.verdict === 'FAIL') red.push(`${c.suite} · ${c.name}${after ? '' : ' (not printed)'}`);
        }
        if (greenBefore.length === 0) {
          results.set(w.part, { part: w.part, held: false, exempt: false, detail: `no case naming ${w.part} passes on the unaltered tree` });
        } else if (red.length === 0) {
          results.set(w.part, { part: w.part, held: false, exempt: false, detail: `${w.part} with ${what}: every naming case stays green (${greenBefore.map((c) => `${c.suite} · ${c.name}`).slice(0, 3).join('; ')})` });
        } else {
          results.set(w.part, { part: w.part, held: true, exempt: false, detail: `${w.part} with ${what}: red ${red.slice(0, 3).join('; ')}` });
        }
      } finally {
        copy.remove();
      }
    });
  }
  return parts.map((p) => results.get(p.part));
}

/** The exemption list of the sweep's fixture: a Map of part → reason. */
export function readExempt(file) {
  const text = readText(file);
  if (text === null) throw new Error(`${file} could not be read`);
  const doc = JSON.parse(text);
  if (!Array.isArray(doc)) throw new Error(`${file} is not a JSON array`);
  const map = new Map();
  for (const entry of doc) {
    if (typeof entry?.part !== 'string' || typeof entry?.reason !== 'string' || entry.reason.trim() === '') {
      throw new Error(`${file}: every entry is { part, reason } with a non-empty reason`);
    }
    map.set(entry.part, entry.reason);
  }
  return map;
}

export { isFile, git };
