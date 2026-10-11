// The status band's own copy of the reading rules in FlightDeck PR 1's shared reader (the main plugin's lib folder).
// It is kept identical in behaviour by tests/drift.test.mjs, because a separately installed plugin cannot load files from the main plugin.
// This file is a plain ES module with no dependencies, no `$`, and no Node globals, so it loads both in the Claude Code mod sandbox and in plain node 22.
// Every function returns warnings or a safe value instead of throwing.

export const NAME_RE = /^[a-z0-9-]+$/;
// Folders are collected down to this many levels below a workshop's attempts/ folder, as PR 1's walk does.
export const ATTEMPT_DEPTH = 7;
// How often the band re-reads the workshop files, in milliseconds.
export const REFRESH_MS = 30000;

// Removes HTML comments and fenced code blocks, so format examples are never counted.
export function stripNoise(text) {
  let s = String(text ?? '').replace(/\r\n?/g, '\n');
  s = s.replace(/<!--[\s\S]*?-->/g, '').replace(/<!--[\s\S]*$/, '');
  const out = [];
  let fence = null;
  for (const line of s.split('\n')) {
    const m = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      if (m && m[1][0] === fence[0] && m[1].length >= fence.length && /^\s*(`+|~+)\s*$/.test(line)) fence = null;
      continue;
    }
    if (m) { fence = m[1]; continue; }
    out.push(line);
  }
  return out.join('\n');
}

// Manifest: `- <name>: <ask> (<YYYY-MM-DD>)`. Name is the text before the first ': ',
// the date is the last (YYYY-MM-DD) at the end of the line, the ask is everything between.
export function parseManifest(text) {
  const entries = [];
  const warnings = [];
  const seen = new Set();
  for (const raw of stripNoise(text).split('\n')) {
    if (!raw.startsWith('- ')) continue;
    const rest = raw.slice(2).trimEnd();
    const i = rest.indexOf(': ');
    if (i < 0) { warnings.push(`manifest line has no ": " after the name, skipped: ${raw.trim()}`); continue; }
    const name = rest.slice(0, i).trim();
    if (!NAME_RE.test(name)) { warnings.push(`manifest name "${name}" is not lowercase letters, digits and hyphens, skipped`); continue; }
    if (seen.has(name)) { warnings.push(`manifest lists ${name} more than once, the first line is used`); continue; }
    seen.add(name);
    let ask = rest.slice(i + 2).trim();
    let date = null;
    const m = /\((\d{4}-\d{2}-\d{2})\)\s*$/.exec(ask);
    if (m) { date = m[1]; ask = ask.slice(0, m.index).trim(); }
    else warnings.push(`manifest line for ${name} has no (YYYY-MM-DD) date at the end`);
    entries.push({ name, ask, date });
  }
  return { entries, warnings };
}

// Questions: blocks `## q<n>: <question>` with an `answer:` line (empty while open) and an
// optional `ask-later:` line. A question held with a non-empty ask-later is not counted as open.
export function parseQuestions(text) {
  const warnings = [];
  const blocks = [];
  let cur = null;
  const key = (line, name) => new RegExp(`^\\s*(?:[-*]\\s+)?${name}:(.*)$`, 'i').exec(line);
  for (const line of stripNoise(text).split('\n')) {
    const h = /^##\s+(.*)$/.exec(line);
    if (h) {
      const q = /^q(\d+)\b(\s*:)?\s*(.*)$/i.exec(h[1].trim());
      if (q) {
        cur = { id: `q${q[1]}`, text: q[3].trim(), answer: null, askLater: '' };
        if (!q[2]) warnings.push(`${cur.id}: heading has no ":" after the number`);
        blocks.push(cur);
      } else {
        cur = null;
        warnings.push(`heading "${line.trim()}" is not a question (## q<n>: ...), ignored`);
      }
      continue;
    }
    if (!cur) continue;
    let m = key(line, 'answer');
    if (m) { if (cur.answer === null) cur.answer = m[1].trim(); continue; }
    m = key(line, 'ask-later');
    if (m) cur.askLater = m[1].trim();
  }
  let open = 0;
  let heldForLater = 0;
  const questions = blocks.map(b => {
    if (b.answer === null) warnings.push(`${b.id}: no "answer:" line, counted as open`);
    const unanswered = b.answer === null || b.answer === '';
    const held = unanswered && b.askLater !== '';
    const isOpen = unanswered && !held;
    if (isOpen) open++;
    if (held) heldForLater++;
    return { id: b.id, text: b.text, open: isOpen, askLater: b.askLater !== '' };
  });
  return { questions, open, heldForLater, warnings };
}

// The date in a workshop card's `settled: YYYY-MM-DD` line, or null (also null when there is no card).
export function settledDate(cardText) {
  if (cardText === null || cardText === undefined) return null;
  const m = /^settled:\s*(\d{4}-\d{2}-\d{2})\s*$/m.exec(stripNoise(cardText));
  return m ? m[1] : null;
}

// Latest attempt per parent-folder group. `dirPaths` are folder paths relative to attempts/, '/'-separated,
// for example ['pr-1', 'pr-1/a1', 'plan/a2', 'a3']. A folder named a<k> is an attempt; the highest k per group wins.
export function latestAttempts(dirPaths) {
  const groups = new Map();
  for (const p of Array.isArray(dirPaths) ? dirPaths : []) {
    const parts = String(p).split('/');
    const name = parts[parts.length - 1];
    const m = /^a([1-9]\d*)$/.exec(name);
    if (!m) continue;
    const group = parts.slice(0, -1).join('/');
    const k = Number(m[1]);
    const cur = groups.get(group);
    if (!cur || k > cur.k) groups.set(group, { group, name, k, label: group ? `${group}/${name}` : name });
  }
  return [...groups.values()].sort((a, b) => (a.group < b.group ? -1 : a.group > b.group ? 1 : 0));
}

// Counts workshops by state from what the band has read. Pure; never throws.
// Input: { manifestText: string | null, folders: [{ name, cardText, questionsText, attemptDirs, changedMs, attemptMs }] }
export function summarize(input) {
  try {
    const warnings = [];
    const folders = new Map();
    for (const f of (input && input.folders) || []) folders.set(f.name, f);
    const manifest = parseManifest((input && input.manifestText) ?? '');
    warnings.push(...manifest.warnings);
    const workshops = [];
    const describe = name => {
      const f = folders.get(name);
      const w = { name, state: 'captured', folder: f || null };
      if (f) w.state = settledDate(f.cardText) !== null ? 'settled' : 'active';
      workshops.push(w);
      if (f) {
        const q = parseQuestions(f.questionsText ?? '');
        w.open = q.open;
        w.held = q.heldForLater;
        warnings.push(...q.warnings.map(x => `${name}: ${x}`));
      }
    };
    const listed = new Set(manifest.entries.map(e => e.name));
    for (const e of manifest.entries) describe(e.name);
    const extra = [...folders.values()]
      .filter(f => !listed.has(f.name) && f.cardText !== null && f.cardText !== undefined && NAME_RE.test(f.name))
      .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const f of extra) {
      warnings.push(`workshop ${f.name} is not in workshops.md`);
      describe(f.name);
    }
    let active = 0;
    let settled = 0;
    let captured = 0;
    let openQuestions = 0;
    let heldForLater = 0;
    let best = null;
    for (const w of workshops) {
      if (w.state === 'captured') { captured++; continue; }
      if (w.state === 'settled') settled++;
      else {
        active++;
        const ms = Number(w.folder.changedMs) || 0;
        if (best === null || ms > best.ms) best = { w, ms };
      }
      openQuestions += w.open;
      heldForLater += w.held;
    }
    let latest = null;
    if (best) {
      const f = best.w.folder;
      let label = null;
      let labelMs = -1;
      for (const a of latestAttempts(f.attemptDirs)) {
        const ms = Number((f.attemptMs || {})[a.label]) || 0;
        if (ms >= labelMs) { label = a.label; labelMs = ms; }
      }
      latest = { workshop: best.w.name, label };
    }
    return { active, settled, captured, openQuestions, heldForLater, latest, warnings };
  } catch (e) {
    return { active: 0, settled: 0, captured: 0, openQuestions: 0, heldForLater: 0, latest: null, warnings: [`summary failed: ${e && e.message}`] };
  }
}

// The one line the band shows. Plain words only; the short form is used when the full line is wider than `columns`.
export function bandText(summary, columns) {
  if (!summary) return '';
  const { active, openQuestions, captured, latest } = summary;
  let a;
  if (active === 0) a = 'no active workshop';
  else {
    a = `${active} active workshop${active === 1 ? '' : 's'}`;
    if (latest) a += latest.label ? ` (${latest.workshop}, latest ${latest.label})` : ` (${latest.workshop})`;
  }
  const b = `${openQuestions} question${openQuestions === 1 ? '' : 's'} waiting on you`;
  const c = `${captured} captured, waiting to start`;
  const full = `FlightDeck: ${a} | ${b} | ${c}`;
  if (typeof columns === 'number' && full.length > columns) {
    return `FlightDeck: ${active} active | ${openQuestions} question${openQuestions === 1 ? '' : 's'} for you | ${captured} waiting to start`;
  }
  return full;
}
