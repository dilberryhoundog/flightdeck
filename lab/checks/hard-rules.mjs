#!/usr/bin/env node
// FlightDeck hard-rule check. No model calls, Node built-ins only.
// Usage: node lab/checks/hard-rules.mjs [--base <ref>] [--owned <file>|auto] [--root <dir>]
// Output: one line per case, "pass <case>" or "FAIL <case>: <reason>", then "<n>/<m> passed".
// Exit code 0 only when every case passes.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const USAGE = 'usage: node lab/checks/hard-rules.mjs [--base <ref>] [--owned <file>|auto] [--root <dir>]';

function parseArgs(argv) {
  const opts = { base: null, owned: null, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base' || a === '--owned' || a === '--root') {
      const v = argv[++i];
      if (v === undefined) throw new Error(`${a} needs a value`);
      opts[a.slice(2)] = v;
    } else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function git(root, args) {
  const r = spawnSync('git', args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, out: r.stdout || '', err: r.stderr || '' };
}

const splitZ = (s) => s.split('\0').filter(Boolean);

// The frontmatter text of a markdown file, or '' when there is none.
function frontmatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  return m ? m[1] : '';
}

function fmValue(fm, key) {
  const m = new RegExp(`^${key}:[ \\t]*(.*)$`, 'm').exec(fm);
  if (!m) return null;
  return m[1].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
}

const badModel = (v) => /fable/i.test(v) || /^best\b/i.test(v);
const badEffort = (v) => /^(xhigh|max)$/i.test(v);

const CEILING_EXCLUDED = new Set([
  'flightdeck/hooks/guard.mjs',
  'lab/checks/hard-rules.mjs',
  'lab/checks/hard-rules.test.mjs',
]);
const ceilingExcluded = (f) => CEILING_EXCLUDED.has(f) || f.startsWith('flightdeck/tests/');
const DW_CALL = /(^|[\s'"`(;&|])(dw|dev-workspace)(?=[\s'"`)]|$)/m;
const OWNER_ONLY = ['capture', 'workshop', 'launch', 'retry', 'promote'];

function run(opts) {
  const root = path.resolve(opts.root || (() => {
    const r = git(process.cwd(), ['rev-parse', '--show-toplevel']);
    if (!r.ok) throw new Error('not inside a git repository (use --root <dir>)');
    return r.out.trim();
  })());
  const abs = (f) => path.join(root, f);
  const read = (f) => readFileSync(abs(f), 'utf8');

  const listed = git(root, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']);
  if (!listed.ok) throw new Error(`git ls-files failed in ${root}: ${listed.err.trim()}`);
  const files = [...new Set(splitZ(listed.out))].filter((f) => existsSync(abs(f)));

  // Changed files: the branch's own commits against --base, plus uncommitted and untracked files.
  const baseKnown = opts.base ? git(root, ['rev-parse', '--verify', '--quiet', `${opts.base}^{commit}`]).ok : false;
  const changed = new Set();
  if (baseKnown) {
    const d = git(root, ['diff', '--name-only', '--no-renames', '-z', `${opts.base}...HEAD`]);
    if (d.ok) splitZ(d.out).forEach((f) => changed.add(f));
  }
  const st = git(root, ['status', '--porcelain', '--untracked-files=all', '--no-renames', '-z']);
  if (st.ok) for (const e of splitZ(st.out)) if (e.length > 3) changed.add(e.slice(3));
  const changedList = [...changed].sort();
  const scopeNote = baseKnown ? '' : ' (no --base: only uncommitted and untracked files count as changed)';

  const results = [];
  const add = (name, bad, note = '') => results.push(bad.length ? `FAIL ${name}: ${bad.join('; ')}` : `pass ${name}${note}`);

  // base
  if (!opts.base) add('base', [], ' (no --base given)');
  else add('base', baseKnown ? [] : [`base ref ${opts.base} does not exist`]);

  // ceiling
  {
    const bad = [];
    for (const f of files) {
      if (ceilingExcluded(f)) continue;
      const isMd = f.endsWith('.md') && (f.startsWith('flightdeck/') || f.startsWith('.claude/agents/'));
      const isJs = /\.m?js$/.test(f) && (f.startsWith('flightdeck/') || f.startsWith('lab/') || /^\.flightdeck\/[^/]+\/workflows\//.test(f));
      if (!isMd && !isJs) continue;
      const text = read(f);
      if (isMd) {
        const fm = frontmatter(text);
        const model = fmValue(fm, 'model');
        const effort = fmValue(fm, 'effort');
        if (model && badModel(model)) bad.push(`${f} has model ${model}`);
        if (effort && badEffort(effort)) bad.push(`${f} has effort ${effort}`);
      } else {
        for (const m of text.matchAll(/\b(model|effort)\s*:\s*(['"`])([^'"`\n]*)\2/g)) {
          if (m[1] === 'model' && badModel(m[3])) bad.push(`${f} has model ${m[3]}`);
          if (m[1] === 'effort' && badEffort(m[3])) bad.push(`${f} has effort ${m[3]}`);
        }
      }
    }
    add('ceiling', bad);
  }

  // dev-untouched, claude-rules-untouched
  add('dev-untouched', changedList.filter((f) => f.startsWith('dev/')), scopeNote);
  add('claude-rules-untouched', changedList.filter((f) => f.startsWith('.claude/rules/')), scopeNote);

  // no-dw-calls
  {
    const bad = files.filter((f) => /\.(m?js|cjs|sh)$/.test(f) && (f.startsWith('flightdeck/') || f.startsWith('lab/'))
      && f !== 'lab/checks/hard-rules.mjs' && f !== 'lab/checks/hard-rules.test.mjs' && DW_CALL.test(read(f)));
    add('no-dw-calls', bad.map((f) => `${f} calls dw or dev-workspace`));
  }

  // owned
  if (!opts.owned) add('owned', [], ' (no --owned given)');
  else if (opts.owned === 'auto') {
    const lists = changedList.filter((f) => /^lab\/owned\/pr[^/]*\.txt$/.test(f) && existsSync(abs(f)));
    if (changedList.length && !lists.length) {
      add('owned', ['no lab/owned/pr<n>.txt changed on this branch; pass --owned <file>']);
    } else {
      const allowed = new Set(lists.flatMap((f) => parseOwned(read(f))));
      add('owned', changedList.filter((f) => !allowed.has(f)).map((f) => `${f} is not in the owned list`), scopeNote);
    }
  } else {
    const p = [path.resolve(root, opts.owned), path.resolve(opts.owned)].find((x) => existsSync(x));
    if (!p) add('owned', [`owned file ${opts.owned} not found`]);
    else {
      const allowed = new Set(parseOwned(readFileSync(p, 'utf8')));
      add('owned', changedList.filter((f) => !allowed.has(f)).map((f) => `${f} is not in the owned list`), scopeNote);
    }
  }

  // no-plugin-settings
  add('no-plugin-settings', existsSync(abs('flightdeck/settings.json')) ? ['flightdeck/settings.json exists'] : []);

  // owner-only-skills
  {
    const bad = [];
    for (const s of OWNER_ONLY) {
      const f = `flightdeck/skills/${s}/SKILL.md`;
      if (!existsSync(abs(f))) continue;
      if (fmValue(frontmatter(read(f)), 'disable-model-invocation') !== 'true') bad.push(`${f} lacks disable-model-invocation: true`);
    }
    add('owner-only-skills', bad);
  }

  // git-guard-registered
  add('git-guard-registered', gitGuardProblems(abs('flightdeck/hooks/hooks.json')));

  const passed = results.filter((l) => l.startsWith('pass ')).length;
  return { lines: [...results, `${passed}/${results.length} passed`], ok: passed === results.length };
}

function parseOwned(text) {
  return text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
}

function gitGuardProblems(file) {
  if (!existsSync(file)) return ['flightdeck/hooks/hooks.json does not exist'];
  let json;
  try { json = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { return [`flightdeck/hooks/hooks.json is not valid JSON: ${e.message}`]; }
  const groups = json?.hooks?.PreToolUse;
  if (!Array.isArray(groups)) return ['flightdeck/hooks/hooks.json has no PreToolUse hooks'];
  for (const g of groups) {
    if (!String(g.matcher || '').split('|').includes('Bash')) continue;
    for (const h of g.hooks || []) {
      const tokens = [h.command, ...(Array.isArray(h.args) ? h.args : [])].join(' ').split(/\s+/).map((t) => t.replace(/^["']|["']$/g, ''));
      const i = tokens.findIndex((t) => t.endsWith('guard.mjs'));
      if (i >= 0 && tokens[i + 1] === 'git') return [];
    }
  }
  return ['flightdeck/hooks/hooks.json does not register guard.mjs git on PreToolUse Bash'];
}

try {
  const { lines, ok } = run(parseArgs(process.argv.slice(2)));
  console.log(lines.join('\n'));
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error(`${e.message}\n${USAGE}`);
  process.exit(2);
}
