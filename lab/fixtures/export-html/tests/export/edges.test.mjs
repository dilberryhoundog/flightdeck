// Edge checks E1 to E3 of the export-html spec: each builds a broken project and asserts the stated outcome.
// Usage: node --test tests/export/edges.test.mjs (from the project root).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exportProject } from '../../src/export/index.mjs';

const reference = JSON.parse(readFileSync(new URL('./fixtures/reference-project.json', import.meta.url), 'utf8'));
const clone = () => JSON.parse(JSON.stringify(reference));

test('E1 an image block naming an unknown asset is omitted and reported as missing-asset', () => {
  const project = clone();
  project.pages[0].blocks.push({ type: 'image', asset: 'ghost' });
  const { html, warnings } = exportProject(project);
  assert.equal((html.match(/<img /g) ?? []).length, 1, 'only the existing asset renders');
  const missing = warnings.filter((w) => w.code === 'missing-asset');
  assert.equal(missing.length, 1);
  assert.equal(missing[0].page, 'welcome');
  assert.ok(missing[0].message.includes('ghost'), 'the warning names the asset id');
});

test('E2 a project with zero pages still exports a document and reports no-pages', () => {
  const { html, warnings } = exportProject({ name: 'Empty', pages: [], assets: [] });
  assert.ok(html.startsWith('<!doctype html>'));
  assert.ok(html.includes('<title>Empty</title>'));
  assert.ok(!html.includes('<section'), 'no section for a project without pages');
  assert.deepEqual(warnings.map((w) => w.code), ['no-pages']);
});

test('E3 a block of unknown type is skipped, reported as unknown-block, and the other blocks still render', () => {
  const project = clone();
  project.pages[1].blocks.splice(1, 0, { type: 'video', src: 'clip.webm' });
  const { html, warnings } = exportProject(project);
  const unknown = warnings.filter((w) => w.code === 'unknown-block');
  assert.equal(unknown.length, 1);
  assert.equal(unknown[0].page, 'map');
  assert.ok(unknown[0].message.includes('video'), 'the warning names the block type');
  assert.ok(html.includes('<h3>Where the notes were taken</h3>'));
  assert.ok(html.includes('<p>Three sites along the river, north to south.</p>'));
  assert.ok(!html.includes('clip.webm'), 'the unknown block leaves nothing in the html');
});
