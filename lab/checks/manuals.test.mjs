// Run with: node --test 'lab/checks/*.test.mjs'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, 'manuals.mjs');
const repoRoot = path.resolve(here, '../..');

const OPERATOR = 'flightdeck/manuals/operator/a.md';
const LIBRARY = 'flightdeck/library/b.md';
const MANUALS_README = 'flightdeck/manuals/README.md';

function page({ shelf, sources = ['lab/x.md'], checked = '2026-10-11', body = 'One plain summary line.' }) {
  const list = sources.length ? `sources:\n${sources.map((s) => `  - ${s}`).join('\n')}\n` : 'sources:\n';
  return `---\nshelf: ${shelf}\n${list}checked: ${checked}\n---\n\n# A title\n\n${body}\n`;
}

// A fixture tree that passes the check.
function makeFixture() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'manuals-'));
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    writeFileSync(path.join(root, rel), text);
  };
  write('lab/x.md', Array.from({ length: 10 }, (_, i) => `line ${i + 1}`).join('\n') + '\n');
  write(MANUALS_README, page({ shelf: 'index', body: 'The index.\n\n## Operator\n\n- [A](operator/a.md): the operator page\n\nSee also [the library](../library/README.md).' }));
  write(OPERATOR, page({ shelf: 'operator', body: 'The page cites `lab/x.md:3` and links [the library page](../../library/b.md).' }));
  write('flightdeck/library/README.md', page({ shelf: 'index', body: 'The library index.\n\n- [B](b.md): the library page\n\nBack to [the manuals](../manuals/README.md).' }));
  write(LIBRARY, page({ shelf: 'library', body: 'The library page.' }));
  return { root, write, read: (rel) => readFileSync(path.join(root, rel), 'utf8') };
}

function check(root, extra = []) {
  const r = spawnSync(process.execPath, [script, '--root', root, ...extra], { encoding: 'utf8' });
  const lines = r.stdout.split('\n').filter(Boolean);
  return { status: r.status, lines, out: r.stdout, err: r.stderr };
}

function withFixture(fn) {
  const fx = makeFixture();
  try { return fn(fx); } finally { rmSync(fx.root, { recursive: true, force: true }); }
}

function assertFails(fx, pageName, label) {
  const r = check(fx.root);
  assert.equal(r.status, 1, `${label}: should exit 1\n${r.out}`);
  assert.ok(r.lines.some((l) => l.startsWith('FAIL ') && l.includes(pageName)), `${label}: should print a FAIL line naming ${pageName}\n${r.out}`);
}

test('a good fixture passes and the last line is m/m passed', () => withFixture((fx) => {
  const r = check(fx.root);
  assert.equal(r.status, 0, r.out);
  assert.match(r.lines.at(-1), /^(\d+)\/\1 passed$/);
  assert.ok(r.lines.some((l) => l === `pass ${OPERATOR}`));
  assert.ok(r.lines.some((l) => l === `pass index ${MANUALS_README}`));
}));

test('a page with no frontmatter fails', () => withFixture((fx) => {
  fx.write(OPERATOR, '# A title\n\nNo frontmatter here.\n');
  assertFails(fx, OPERATOR, 'no frontmatter');
}));

test('shelf operator under library/ fails', () => withFixture((fx) => {
  fx.write(LIBRARY, page({ shelf: 'operator' }));
  assertFails(fx, LIBRARY, 'wrong shelf');
}));

test('a shelf value outside the list fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'cockpit' }));
  assertFails(fx, OPERATOR, 'unknown shelf');
}));

test('empty sources fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', sources: [] }));
  assertFails(fx, OPERATOR, 'empty sources');
}));

test('a source that does not exist fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', sources: ['lab/missing.md'] }));
  assertFails(fx, OPERATOR, 'missing source');
}));

test('a source line beyond the file fails, a URL source passes', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', sources: ['lab/x.md:99'] }));
  assertFails(fx, OPERATOR, 'source line beyond file');
  fx.write(OPERATOR, page({ shelf: 'operator', sources: ['https://example.com/docs', 'lab/x.md:10'] }));
  assert.equal(check(fx.root).status, 0);
}));

test('an invalid checked date fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', checked: '2026-13-40' }));
  assertFails(fx, OPERATOR, 'bad date');
}));

test('a hard-wrapped paragraph fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', body: 'This paragraph starts here and\ncontinues on the next line.' }));
  const r = check(fx.root);
  assert.equal(r.status, 1, r.out);
  assert.ok(r.lines.some((l) => l.startsWith('FAIL ') && l.includes(OPERATOR) && l.includes('hard wrapping')), r.out);
}));

test('a broken relative link fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', body: 'See [nothing](./nothing.md).' }));
  assertFails(fx, OPERATOR, 'broken link');
}));

test('a cited path with a line beyond the file fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', body: 'The page cites `lab/x.md:99`.' }));
  assertFails(fx, OPERATOR, 'cite beyond file');
}));

test('a cited path that does not exist fails', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', body: 'The page cites `flightdeck/nowhere.md`.' }));
  assertFails(fx, OPERATOR, 'cite missing file');
}));

test('a page not linked from its README fails the index case', () => withFixture((fx) => {
  fx.write('flightdeck/manuals/operator/c.md', page({ shelf: 'operator' }));
  assertFails(fx, `index ${MANUALS_README}`, 'unlinked page');
}));

test('a fenced block with wrapped text and a placeholder path passes', () => withFixture((fx) => {
  const body = 'Run this:\n\n```\nnode some/script.mjs --flag\n  continues on a second line\nand a third\n```\n\nThe card lives at `.flightdeck/<name>/workshop.md` and `lab/*.md` is a pattern.';
  fx.write(OPERATOR, page({ shelf: 'operator', body }));
  const r = check(fx.root);
  assert.equal(r.status, 0, r.out);
}));

test('a 120-line valid page prints a warn line and still exits 0', () => withFixture((fx) => {
  const body = Array.from({ length: 120 }, (_, i) => `- item number ${i + 1}`).join('\n');
  fx.write(OPERATOR, page({ shelf: 'operator', body }));
  const r = check(fx.root);
  assert.equal(r.status, 0, r.out);
  assert.ok(r.lines.some((l) => l.startsWith(`warn ${OPERATOR}: `) && l.includes('over the 100-line default')), r.out);
  assert.match(r.lines.at(-1), /^(\d+)\/\1 passed$/);
}));

test('a page checked long ago prints a warn line and still exits 0', () => withFixture((fx) => {
  fx.write(OPERATOR, page({ shelf: 'operator', checked: '2020-01-01' }));
  const r = check(fx.root);
  assert.equal(r.status, 0, r.out);
  assert.ok(r.lines.some((l) => l.startsWith(`warn ${OPERATOR}: checked 2020-01-01, `) && l.endsWith(' days ago')), r.out);
}));

test('a missing flightdeck/library/ fails the shelves case', () => withFixture((fx) => {
  rmSync(path.join(fx.root, 'flightdeck/library'), { recursive: true, force: true });
  const r = check(fx.root);
  assert.equal(r.status, 1, r.out);
  assert.ok(r.lines.some((l) => l.startsWith('FAIL shelves')), r.out);
}));

test('a bad argument exits 2 with a usage line', () => {
  const r = spawnSync(process.execPath, [script, '--nope'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
  assert.match(r.stderr, /usage: node lab\/checks\/manuals\.mjs/);
});

test('the real repository passes', () => {
  const r = spawnSync(process.execPath, [script], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout.trim().split('\n').at(-1), /^(\d+)\/\1 passed$/);
});
