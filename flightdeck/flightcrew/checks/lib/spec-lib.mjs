// flightcrew/checks/lib/spec-lib.mjs — reading a spec file: the node index every dispatch and validator works from, and the thirteen coded invariants the spec schema's description names.
// Usage: import { loadSpec, nodeIndex, liveIds, textOf, checkInvariants, artefactTokens } from '<relative>/checks/lib/spec-lib.mjs'.
//
// Exports: SECTIONS (the section table: key, prefix, whether it is one node or a list); loadSpec(file);
// nodeIndex(spec) → Map id → { id, section, prefix, node }; liveIds(spec[, prefix]) (ids grouped by prefix, or one
// prefix's ids); textOf(spec, id); retiredIndex(spec); checkInvariants(spec, { filename, folder, forFreeze }) →
// { errors: [{ rule, message }], warnings: [string] }; artefactTokens(text); artefactRefs(spec) → [{ id, token }].
//
// The invariants carry the rule ids invariant-1 … invariant-13 and follow the spec schema's own description:
// 1 ids unique across every section; 2 each id carries its section's prefix; 3 frozen implies a commit and no open
// questions (--for-freeze rehearses the open-questions clause on a draft); 4 draft implies no commit; 5 no live node
// reuses a retired id; 6 previous_versions ascend, stay below version and name distinct files; 7 an edge states an
// outcome, not a concern (a warning, never an error); 8 v1 has every node ok and an empty registry; 9 a node whose
// status is not ok carries a note; 10 the filename's v-number matches version; 11 a retired entry's at falls between
// 2 and version; 12 previous_versions covers 1..version-1; 13 the live and retired ids form an unbroken 1..N in each
// prefix, Q excluded — checked from v2 on, since v1's registry is empty by invariant 8.
// Importing this module has no side effect.

import fs from 'node:fs';

/** The sections a spec node can live in, with the prefix its ids carry. 'retired' is a registry, not a section. */
export const SECTIONS = [
  { key: 'intent', prefix: 'INT', single: true },
  { key: 'scope', prefix: 'SC', single: false },
  { key: 'constraints', prefix: 'C', single: false },
  { key: 'interfaces', prefix: 'I', single: false },
  { key: 'behaviours', prefix: 'B', single: false },
  { key: 'edges', prefix: 'E', single: false },
  { key: 'decisions', prefix: 'D', single: false },
  { key: 'verification', prefix: 'VER', single: true },
  { key: 'acceptance', prefix: 'ACC', single: true },
  { key: 'open_questions', prefix: 'Q', single: false },
];

const ARTEFACT_EXTENSIONS = ['.mjs', '.js', '.json', '.md', '.sh'];
const ID_SHAPE = /^([A-Z]+)([0-9]+)$/;

/** Reads and parses a spec file. Throws an Error naming the file when it cannot be read or parsed. */
export function loadSpec(file) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (error) {
    throw new Error(`${file} could not be read: ${error.message}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }
}

function nodesOf(spec, section) {
  const value = spec?.[section.key];
  if (section.single) return value && typeof value === 'object' && !Array.isArray(value) ? [value] : [];
  return Array.isArray(value) ? value.filter((n) => n && typeof n === 'object') : [];
}

/** Every live node of every section, keyed by id: Map id → { id, section, prefix, node }. Later duplicates do not overwrite the first. */
export function nodeIndex(spec) {
  const index = new Map();
  for (const section of SECTIONS) {
    for (const node of nodesOf(spec, section)) {
      const id = typeof node.id === 'string' ? node.id : null;
      if (id === null || index.has(id)) continue;
      index.set(id, { id, section: section.key, prefix: section.prefix, node });
    }
  }
  return index;
}

/** Retired ids, keyed by id: Map id → entry. */
export function retiredIndex(spec) {
  const index = new Map();
  const list = Array.isArray(spec?.retired) ? spec.retired : [];
  for (const entry of list) {
    if (entry && typeof entry.id === 'string' && !index.has(entry.id)) index.set(entry.id, entry);
  }
  return index;
}

/** Live ids grouped by section prefix, or one prefix's ids when prefix is given. */
export function liveIds(spec, prefix) {
  const grouped = {};
  for (const section of SECTIONS) {
    const ids = nodesOf(spec, section).map((n) => n.id).filter((id) => typeof id === 'string');
    grouped[section.prefix] = (grouped[section.prefix] ?? []).concat(ids);
  }
  if (prefix === undefined) return grouped;
  return grouped[prefix] ?? [];
}

/** The text of a live node, or null when no live node carries that id. */
export function textOf(spec, id) {
  const entry = nodeIndex(spec).get(id);
  return entry && typeof entry.node.text === 'string' ? entry.node.text : null;
}

/** The version as a number, or null when the field is missing or not numeric. */
function versionOf(spec) {
  const raw = spec?.version;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** True when the edge text names an outcome after a ': ' clause; the invariant-7 heuristic. */
function statesAnOutcome(text) {
  return /:\s+\S/.test(String(text ?? ''));
}

/**
 * The thirteen coded invariants. Returns { errors: [{ rule: 'invariant-N', message }], warnings: [string] }.
 * filename and folder are the spec file's own basename and its containing folder's name; both may be omitted, and
 * each only raises a warning. forFreeze rehearses the freeze gate against a draft.
 */
export function checkInvariants(spec, { filename = '', folder = '', forFreeze = false } = {}) {
  const errors = [];
  const warnings = [];
  const error = (rule, message) => errors.push({ rule, message });
  const version = versionOf(spec);
  const status = typeof spec?.status === 'string' ? spec.status : null;
  const retired = Array.isArray(spec?.retired) ? spec.retired : [];

  // 1: ids unique across every section.
  const seen = new Set();
  const reported = new Set();
  for (const section of SECTIONS) {
    for (const node of nodesOf(spec, section)) {
      const id = node.id;
      if (typeof id !== 'string') continue;
      if (seen.has(id)) {
        if (!reported.has(id)) {
          reported.add(id);
          error('invariant-1', `node id ${id} is used more than once`);
        }
      } else {
        seen.add(id);
      }
    }
  }

  // 2: an id carries its section's prefix.
  for (const section of SECTIONS) {
    const shape = section.single ? null : new RegExp(`^${section.prefix}[0-9]+$`);
    for (const node of nodesOf(spec, section)) {
      const id = node.id;
      if (typeof id !== 'string') continue;
      const fits = section.single ? id === section.prefix : shape.test(id);
      if (!fits) error('invariant-2', `${section.key} node id ${id} does not carry the ${section.prefix} prefix`);
    }
  }

  // 3: frozen carries a commit and no open questions; --for-freeze rehearses the second clause on a draft.
  const openQuestions = Array.isArray(spec?.open_questions) ? spec.open_questions : [];
  if (status === 'frozen' && spec.commit === undefined) {
    error('invariant-3', 'status is frozen but commit is absent');
  }
  if ((status === 'frozen' || forFreeze) && openQuestions.length > 0) {
    const ids = openQuestions.map((q) => q?.id ?? '?').join(', ');
    error('invariant-3', `${openQuestions.length} open question(s) remain and would block a freeze: ${ids}`);
  }

  // 4: a draft carries no commit.
  if (status === 'draft' && spec.commit !== undefined) {
    error('invariant-4', `status is draft but commit ${spec.commit} is set`);
  }

  // 5: no live node reuses a retired id.
  for (const entry of retired) {
    if (entry && typeof entry.id === 'string' && seen.has(entry.id)) {
      error('invariant-5', `retired id ${entry.id} is used by a live node`);
    }
  }

  // 6: previous_versions ascend, stay below version, and name distinct files.
  const lineage = Array.isArray(spec?.previous_versions) ? spec.previous_versions : [];
  const files = new Set();
  let previous = null;
  for (const entry of lineage) {
    const v = typeof entry?.v === 'number' ? entry.v : null;
    if (v !== null && version !== null && v >= version) {
      error('invariant-6', `previous_versions entry v${v} is not lower than version ${version}`);
    }
    if (v !== null && previous !== null && v <= previous) {
      error('invariant-6', `previous_versions is not ascending: v${v} follows v${previous}`);
    }
    if (v !== null) previous = v;
    const file = typeof entry?.file === 'string' ? entry.file : null;
    if (file !== null) {
      if (files.has(file)) error('invariant-6', `previous_versions names ${file} more than once`);
      files.add(file);
    }
  }

  // 8: v1 is a baseline: every node ok, no registry.
  if (version === 1) {
    for (const section of SECTIONS) {
      for (const node of nodesOf(spec, section)) {
        if (node.status !== undefined && node.status !== 'ok') {
          error('invariant-8', `v1 node ${node.id ?? section.key} has status ${node.status}; a v1 spec has nothing to be new or changed against`);
        }
      }
    }
    if (retired.length > 0) error('invariant-8', `v1 carries ${retired.length} retired entr(y|ies); nothing can be retired from a first version`);
  }

  // 9: a status other than ok owes a note.
  for (const section of SECTIONS) {
    for (const node of nodesOf(spec, section)) {
      if (node.status !== undefined && node.status !== 'ok' && !node.note) {
        error('invariant-9', `${node.id ?? section.key} has status ${node.status} and carries no note`);
      }
    }
  }

  // 10: the filename's v-number matches version, and an unrecognised filename warns.
  if (filename) {
    const named = /^spec\.v([0-9]+)\.json$/.exec(filename);
    if (!named) warnings.push(`the filename ${filename} is not spec.v<n>.json`);
    else if (version !== null && Number(named[1]) !== version) {
      error('invariant-10', `the filename ${filename} names version ${named[1]} but the file's version is ${version}`);
    }
  }

  // 11: a retired entry's at falls between 2 and version.
  for (const entry of retired) {
    const at = typeof entry?.at === 'number' ? entry.at : null;
    if (at === null) continue;
    if (at < 2 || (version !== null && at > version)) {
      error('invariant-11', `retired entry ${entry.id ?? '?'} names version ${at}; a removal falls between 2 and ${version ?? 'the file version'}`);
    }
  }

  // 12: previous_versions covers every earlier version.
  if (version !== null && version > 1) {
    const listed = new Set(lineage.map((e) => e?.v).filter((v) => typeof v === 'number'));
    const missing = [];
    for (let n = 1; n < version; n += 1) if (!listed.has(n)) missing.push(`v${n}`);
    if (missing.length > 0) error('invariant-12', `previous_versions does not cover ${missing.join(', ')}`);
  }

  // 13: live and retired ids form an unbroken 1..N in each prefix, from v2 on (v1's registry is empty by invariant 8).
  if (version !== null && version > 1) {
    const numbers = new Map();
    const collect = (id) => {
      const parsed = ID_SHAPE.exec(String(id ?? ''));
      if (!parsed || parsed[1] === 'Q') return;
      if (!numbers.has(parsed[1])) numbers.set(parsed[1], new Set());
      numbers.get(parsed[1]).add(Number(parsed[2]));
    };
    for (const id of seen) collect(id);
    for (const entry of retired) collect(entry?.id);
    for (const [prefix, set] of numbers) {
      const highest = Math.max(...set);
      const missing = [];
      for (let n = 1; n <= highest; n += 1) if (!set.has(n)) missing.push(`${prefix}${n}`);
      if (missing.length > 0) {
        error('invariant-13', `the ${prefix} ids run to ${prefix}${highest} but ${missing.join(', ')} appear in neither the live sections nor the retired registry`);
      }
    }
  }

  // 7: an edge states an outcome, not a concern. Judgement, so a warning.
  for (const node of nodesOf(spec, SECTIONS.find((s) => s.key === 'edges'))) {
    if (typeof node.text === 'string' && !statesAnOutcome(node.text)) {
      warnings.push(`edge ${node.id ?? '?'} states a concern rather than an outcome: no ': <outcome>' clause`);
    }
  }

  // The folder a spec lives in is its name.
  if (folder && typeof spec?.name === 'string' && spec.name !== folder) {
    warnings.push(`the spec name ${spec.name} does not match folder ${folder}`);
  }

  return { errors, warnings };
}

/**
 * The artefact tokens of one text, per design 5.14: a whitespace-separated token that holds a '/' or ends in
 * .mjs .js .json .md .sh, with wrapping quotes, brackets and trailing sentence punctuation stripped. A token
 * carrying a placeholder character (< > | *), a shell variable, or a URL scheme is not a path and is left out.
 * A trailing '/' is kept, so a directory token stays a directory.
 */
export function artefactTokens(text) {
  const found = [];
  for (const raw of String(text ?? '').split(/\s+/)) {
    let token = raw.replace(/^[`'"(\[{]+/, '').replace(/[`'"),\];:.!?]+$/, '');
    while (token.startsWith('./')) token = token.slice(2);
    if (token === '' || token === '/') continue;
    if (/[<>|*$]/.test(token) || token.includes('://')) continue;
    const isPath = token.includes('/') || ARTEFACT_EXTENSIONS.some((ext) => token.endsWith(ext));
    if (!isPath || found.includes(token)) continue;
    found.push(token);
  }
  return found;
}

/** Every artefact token of every interface text and the verification text, as [{ id, token }] in document order. */
export function artefactRefs(spec) {
  const refs = [];
  const texts = [];
  for (const node of nodesOf(spec, SECTIONS.find((s) => s.key === 'interfaces'))) {
    texts.push([node.id ?? 'I?', node.text]);
  }
  for (const node of nodesOf(spec, SECTIONS.find((s) => s.key === 'verification'))) {
    texts.push([node.id ?? 'VER', node.text]);
  }
  for (const [id, text] of texts) {
    for (const token of artefactTokens(text)) refs.push({ id, token });
  }
  return refs;
}
