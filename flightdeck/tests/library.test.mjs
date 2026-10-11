// Run with: node --test 'flightdeck/tests/*.test.mjs'
// Covers PR 7: the librarian, the two skills, stale.mjs, library-review.js and the twelve corpus pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const pluginRoot = path.resolve(here, '..');
const read = (rel) => readFileSync(path.join(pluginRoot, rel), 'utf8');

function unquote(s) { return s.trim().replace(/^(["'])(.*)\1$/, '$2'); }

// Frontmatter: text between a first line --- and the next line ---.
// key: value sets a string (quotes removed); an empty key: starts a list of "  - item" lines.
function frontmatter(text) {
  const lines = text.split(/\r?\n/);
  if (lines[0] !== '---') return null;
  const end = lines.indexOf('---', 1);
  if (end < 0) return null;
  const data = {};
  let listKey = null;
  for (const line of lines.slice(1, end)) {
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item && listKey) { data[listKey].push(unquote(item[1])); continue; }
    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    if (kv[2].trim() === '') { data[kv[1]] = []; listKey = kv[1]; } else { data[kv[1]] = unquote(kv[2]); listKey = null; }
  }
  return data;
}

const validDate = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
};

// ---------------------------------------------------------------- librarian

const FALLBACK = 'Fallback rank: Worker in the team of whoever sent you, reporting to them; if you do not know who sent you, you report to the Captain.';

test('librarian: the file exists with the right name and no rank word', () => {
  const file = 'agents/librarian.md';
  assert.ok(existsSync(path.join(pluginRoot, file)), 'agents/librarian.md exists');
  const fm = frontmatter(read(file));
  assert.ok(fm, 'has frontmatter');
  assert.equal(fm.name, 'librarian');
  for (const text of [file, fm.name, fm.description]) {
    assert.ok(!/commander|captain|officer|worker/i.test(text), `no rank word in: ${text}`);
  }
  assert.ok(fm.description.length < 300, `description is ${fm.description.length} characters`);
});

test('librarian: model, effort and tools', () => {
  const fm = frontmatter(read('agents/librarian.md'));
  assert.equal(fm.model, 'sonnet');
  assert.equal(fm.effort, 'high');
  const tools = fm.tools.split(',').map((t) => t.trim());
  for (const t of ['Read', 'Grep', 'Glob']) assert.ok(tools.includes(t), `tools include ${t}`);
  for (const t of ['Edit', 'Write', 'Agent']) assert.ok(!tools.includes(t), `tools exclude ${t}`);
});

test('librarian: exactly one fallback line, and one sentence for the standing background session', () => {
  const lines = read('agents/librarian.md').split(/\r?\n/);
  const fallback = lines.filter((l) => l.startsWith('Fallback rank: '));
  assert.equal(fallback.length, 1, 'exactly one line starts with "Fallback rank: "');
  assert.equal(fallback[0], FALLBACK);
  assert.ok(lines.some((l) => l.includes('standing background session') && l.includes('Officer')), 'a line names the standing background session and Officer');
});

// ---------------------------------------------------------------- skills

test('skills: manual and library-check are owner-started and have short descriptions', () => {
  for (const name of ['manual', 'library-check']) {
    const fm = frontmatter(read(`skills/${name}/SKILL.md`));
    assert.ok(fm, `${name} has frontmatter`);
    assert.equal(fm.name, name);
    assert.equal(fm['disable-model-invocation'], 'true', `${name} sets disable-model-invocation: true`);
    assert.ok(fm.description && fm.description.length < 400, `${name} description is under 400 characters`);
  }
});

// ---------------------------------------------------------------- corpus

const CORPUS = [
  'manuals/README.md',
  'manuals/operator/first-hour.md',
  'manuals/operator/workshops-and-launches.md',
  'manuals/technical/parts.md',
  'manuals/technical/harness-facts.md',
  'manuals/maintenance/changing-a-part.md',
  'library/README.md',
  'library/adversarial-mandate.md',
  'library/rubric-guide.md',
  'library/terms.md',
  'library/team-design.md',
  'library/retry.md',
];

test('corpus: the twelve pages exist with shelf, sources and checked', () => {
  for (const rel of CORPUS) {
    assert.ok(existsSync(path.join(pluginRoot, rel)), `${rel} exists`);
    const fm = frontmatter(read(rel));
    assert.ok(fm, `${rel} has frontmatter`);
    assert.ok(fm.shelf, `${rel} has shelf`);
    assert.ok(Array.isArray(fm.sources) && fm.sources.length > 0, `${rel} has a non-empty sources list`);
    assert.ok(validDate(fm.checked), `${rel} has a valid checked date`);
  }
});

test('corpus: the retry answer has its heading', () => {
  const lines = read('manuals/operator/workshops-and-launches.md').split(/\r?\n/);
  assert.ok(lines.includes('## Retrying one pull request'));
});

// ---------------------------------------------------------------- stale.mjs

const stale = path.join(pluginRoot, 'skills/library-check/stale.mjs');

function runStale(args) {
  const r = spawnSync(process.execPath, [stale, ...args], { encoding: 'utf8' });
  return { status: r.status, out: r.stdout, err: r.stderr, lines: r.stdout.split('\n').filter(Boolean) };
}

function page(checked, sources) {
  const head = checked ? `checked: ${checked}\n` : '';
  return `---\nshelf: operator\nsources:\n${sources.map((s) => `  - ${s}`).join('\n')}\n${head}---\n\n# A page\n\nA summary line.\n`;
}

function git(cwd, args, date) {
  const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.com', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.com', GIT_CONFIG_GLOBAL: os.devNull, GIT_CONFIG_SYSTEM: os.devNull };
  if (date) { env.GIT_AUTHOR_DATE = `${date}T12:00:00Z`; env.GIT_COMMITTER_DATE = `${date}T12:00:00Z`; }
  const r = spawnSync('git', args, { cwd, env, encoding: 'utf8' });
  assert.equal(r.status, 0, `git ${args.join(' ')}: ${r.stderr}`);
}

function put(root, rel, text) {
  mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
  writeFileSync(path.join(root, rel), text);
}

function makeStaleFixture() {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'stale-'));
  git(tmp, ['init', '-q']);
  put(tmp, 'src/fresh.txt', 'fresh\n');
  git(tmp, ['add', 'src/fresh.txt']);
  git(tmp, ['commit', '-q', '-m', 'fresh source'], '2026-09-01');
  put(tmp, 'src/changed.txt', 'changed\n');
  git(tmp, ['add', 'src/changed.txt']);
  git(tmp, ['commit', '-q', '-m', 'changed source'], '2026-10-05');
  put(tmp, 'plug/manuals/README.md', page('2026-10-01', ['src/fresh.txt']));
  put(tmp, 'plug/library/README.md', page('2026-10-01', ['src/fresh.txt']));
  put(tmp, 'plug/manuals/operator/old.md', page('2026-08-01', ['src/fresh.txt']));
  put(tmp, 'plug/manuals/operator/changed.md', page('2026-10-01', ['src/changed.txt']));
  put(tmp, 'plug/manuals/operator/nodate.md', page('', ['src/fresh.txt']));
  put(tmp, 'plug/manuals/operator/missing.md', page('2026-10-01', ['src/gone.txt']));
  git(tmp, ['add', 'plug']);
  git(tmp, ['commit', '-q', '-m', 'pages'], '2026-10-06');
  return tmp;
}

function staleArgs(tmp, extra = []) {
  return ['--plugin-root', path.join(tmp, 'plug'), '--project', tmp, '--today', '2026-10-11', ...extra];
}

test('stale.mjs: a fixture repository gives each reason', () => {
  const tmp = makeStaleFixture();
  try {
    const r = runStale(staleArgs(tmp));
    assert.equal(r.status, 0, r.err);
    assert.ok(r.lines.includes('stale plug/manuals/operator/old.md: checked 2026-08-01, 71 days ago'), r.out);
    assert.ok(r.lines.includes('stale plug/manuals/operator/changed.md: source src/changed.txt changed 2026-10-05, after checked 2026-10-01'), r.out);
    assert.ok(r.lines.includes('stale plug/manuals/operator/nodate.md: no checked: date'), r.out);
    assert.ok(r.lines.includes('stale plug/manuals/operator/missing.md: source src/gone.txt not found'), r.out);
    assert.ok(!r.out.includes('plug/manuals/README.md'), 'a page checked 2026-10-01 with an unchanged source is not stale');
    assert.ok(!r.out.includes('plug/library/README.md'));
    assert.equal(r.lines.at(-1), '4 stale of 6 pages');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('stale.mjs: --days changes the date rule', () => {
  const tmp = makeStaleFixture();
  try {
    const r = runStale(staleArgs(tmp, ['--days', '100']));
    assert.ok(!r.out.includes('71 days ago'), r.out);
    assert.ok(r.out.includes('operator/old.md: source src/fresh.txt changed 2026-09-01, after checked 2026-08-01'), 'the source rule still applies');
    assert.equal(r.lines.at(-1), '4 stale of 6 pages');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('stale.mjs: --json parses and holds pages and stale', () => {
  const tmp = makeStaleFixture();
  try {
    const r = runStale(staleArgs(tmp, ['--json']));
    assert.equal(r.status, 0, r.err);
    const j = JSON.parse(r.out);
    assert.equal(j.pages, 6);
    assert.equal(j.stale.length, 4);
    assert.ok(j.stale.every((s) => typeof s.page === 'string' && Array.isArray(s.reasons) && s.reasons.length > 0));
    assert.ok(Array.isArray(j.notes));
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('stale.mjs: outside a git repository it prints a note and applies only the date rule', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'stale-nogit-'));
  try {
    put(tmp, 'plug/manuals/README.md', page('2026-08-01', ['src/gone.txt']));
    put(tmp, 'plug/library/README.md', page('2026-10-10', ['src/gone.txt']));
    const plug = path.join(tmp, 'plug');
    const r = runStale(['--plugin-root', plug, '--project', tmp, '--today', '2026-10-11']);
    assert.equal(r.status, 0, r.err);
    assert.equal(r.lines[0], `note: ${plug} is not in a git repository; only the date rule was applied`);
    assert.ok(r.out.includes('manuals/README.md: checked 2026-08-01, 71 days ago'), r.out);
    assert.ok(!r.out.includes('not found'), 'the source rule is skipped');
    assert.equal(r.lines.at(-1), '1 stale of 2 pages');
  } finally { rmSync(tmp, { recursive: true, force: true }); }
});

test('stale.mjs: a bad argument exits 2', () => {
  for (const args of [['--nope'], ['--days', 'many'], ['--today', '2026-13-40'], ['--days']]) {
    const r = runStale(args);
    assert.equal(r.status, 2, `exit 2 for ${args.join(' ')}`);
    assert.match(r.err, /usage: node stale\.mjs/);
  }
});

// ---------------------------------------------------------------- library-review.js

async function runWorkflow(args, agentImpl) {
  const src = read('workflows/library-review.js').replace(/^export const meta/m, 'const meta');
  assert.ok(!/Date\.now|Math\.random|export default/.test(src), 'no clock, randomness or default export');
  const calls = [];
  const agent = async (prompt, opts) => { calls.push({ prompt, opts }); return agentImpl(prompt, opts); };
  const parallel = async (thunks) => Promise.all(thunks.map((t) => t().catch(() => null)));
  const pipeline = async (items, ...stages) => Promise.all(items.map(async (it, i) => { let r = it; for (const s of stages) r = await s(r, it, i); return r; }));
  const fn = new Function('agent', 'parallel', 'pipeline', 'phase', 'log', 'args', `return (async () => {${src}\n})()`);
  const result = await fn(agent, parallel, pipeline, () => {}, () => {}, args);
  return { result, calls };
}

const LOCATED = { plugin_root: '/p', pages: ['manuals/README.md'], changed: ['a.md'], diff_command: 'git diff main...feature-x', block: 'SENTINEL-WS-A', checks: [], questions: ['Q?'] };
const REVIEWED = { findings: [], pages_used: ['manuals/README.md'], stale_pages: [], captures: [] };
const stub = (prompt, opts) => (opts.label === 'locate' ? LOCATED : REVIEWED);

test('library-review.js: the source starts with the literal meta', () => {
  const src = read('workflows/library-review.js');
  assert.ok(src.startsWith('export const meta'));
  assert.ok(!/Date\.now|Math\.random|export default/.test(src));
  assert.match(src, /name: 'library-review'/);
});

test('library-review.js: two calls, within the ceiling, one Worker rank line each, the block reaches the librarian', async () => {
  const { result, calls } = await runWorkflow({ work: 'feature-x', workshop: 'ws-a' }, stub);
  assert.equal(calls.length, 2);
  for (const { prompt, opts } of calls) {
    assert.ok(['haiku', 'sonnet', 'opus'].includes(opts.model), `model ${opts.model}`);
    assert.ok(['low', 'medium', 'high'].includes(opts.effort), `effort ${opts.effort}`);
    const ranks = prompt.split('\n').filter((l) => l.startsWith('Rank: '));
    assert.equal(ranks.length, 1, 'exactly one Rank line');
    const m = /^Rank: (\w+)\. Reports to: .+\. You decide: .+\. You do not decide: .+\.$/.exec(ranks[0]);
    assert.ok(m, `rank line shape: ${ranks[0]}`);
    assert.equal(m[1], 'Worker');
  }
  const locate = calls.find((c) => c.opts.label === 'locate');
  const review = calls.find((c) => c.opts.label === 'review');
  assert.equal(locate.opts.model, 'haiku');
  assert.equal(review.opts.model, 'sonnet');
  assert.equal(review.opts.effort, 'high');
  assert.equal(review.opts.agentType, 'flight:librarian');
  assert.ok(review.prompt.includes('SENTINEL-WS-A'));
  assert.ok(Array.isArray(result.findings));
  assert.equal(result.pages_checked, 1);
  assert.equal(result.workshop, 'ws-a');
  assert.equal(result.summary, '0 findings (0 high) against 1 corpus pages');
});

test('library-review.js: the global rules line is the one in the team-plans skill', async () => {
  const { calls } = await runWorkflow({ work: 'feature-x' }, stub);
  const first = calls[0].prompt.split('\n')[0];
  assert.ok(first.startsWith('Binding documents, read first:'));
  const skill = readFileSync(path.join(pluginRoot, 'skills/team-plans/SKILL.md'), 'utf8');
  assert.ok(skill.includes(first), 'copied word for word from skills/team-plans/SKILL.md');
});

test('library-review.js: without a workshop the block is not passed', async () => {
  const { result, calls } = await runWorkflow({ work: 'feature-x' }, stub);
  const review = calls.find((c) => c.opts.label === 'review');
  assert.ok(!review.prompt.includes('SENTINEL-WS-A'));
  assert.equal(result.workshop, null);
});

test('library-review.js: counts findings and high findings', async () => {
  const findings = [
    { severity: 'high', where: 'a.md:1', finding: 'f', evidence: 'e', suggested_fix: 's' },
    { severity: 'low', where: 'a.md:2', finding: 'f', evidence: 'e', suggested_fix: 's' },
  ];
  const { result } = await runWorkflow({ work: 'feature-x' }, (p, o) => (o.label === 'locate' ? LOCATED : { ...REVIEWED, findings }));
  assert.equal(result.summary, '2 findings (1 high) against 1 corpus pages');
});

test('library-review.js: no work halts without calling an agent', async () => {
  const { result, calls } = await runWorkflow({}, stub);
  assert.ok(result.halt);
  assert.equal(result.halt, 'args.work is required: a branch, a diff file or paths');
  assert.equal(calls.length, 0);
});

test('library-review.js: a locate halt, null or throw stops before the review', async () => {
  for (const impl of [() => ({ halt: 'x' }), () => null, () => { throw new Error('boom'); }]) {
    const { result, calls } = await runWorkflow({ work: 'feature-x' }, impl);
    assert.ok(result.halt, 'result has halt');
    assert.equal(calls.filter((c) => c.opts.label === 'review').length, 0);
  }
});

test('library-review.js: a review that returns nothing or throws gives a halt', async () => {
  for (const bad of [() => null, () => { throw new Error('boom'); }]) {
    const { result } = await runWorkflow({ work: 'feature-x' }, (p, o) => (o.label === 'locate' ? LOCATED : bad()));
    assert.ok(result.halt);
    assert.equal(result.stage, 'Review');
  }
});
