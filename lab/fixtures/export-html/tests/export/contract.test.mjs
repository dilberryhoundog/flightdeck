// Contract checks I1 and I2 of the export-html spec: the exporter signature and the project and warning shapes.
// Usage: node --test tests/export/contract.test.mjs (from the project root).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as exporter from '../../src/export/index.mjs';

const project = JSON.parse(readFileSync(new URL('./fixtures/reference-project.json', import.meta.url), 'utf8'));

test('I1 exportProject is a function of (project, options) returning {html: string, warnings: array}', () => {
  assert.equal(typeof exporter.exportProject, 'function');
  const result = exporter.exportProject(project, { inlineAssets: true });
  assert.deepEqual(Object.keys(result).sort(), ['html', 'warnings']);
  assert.equal(typeof result.html, 'string');
  assert.ok(Array.isArray(result.warnings));
  assert.deepEqual(exporter.exportProject(project).html, result.html, 'inlineAssets defaults to true');
});

test('I2 the reference project has the declared shape and every warning carries code, message and page', () => {
  assert.equal(typeof project.name, 'string');
  for (const page of project.pages) {
    assert.equal(typeof page.slug, 'string');
    assert.equal(typeof page.title, 'string');
    assert.ok(Array.isArray(page.blocks));
    for (const block of page.blocks) assert.ok(['text', 'heading', 'image'].includes(block.type));
  }
  for (const asset of project.assets) {
    for (const key of ['id', 'path', 'type', 'data']) assert.equal(typeof asset[key], 'string', `asset.${key}`);
  }
  const { warnings } = exporter.exportProject({ name: 'Shape', pages: [{ slug: 'p', title: 'P', blocks: [{ type: 'image', asset: 'none' }] }], assets: [] });
  assert.equal(warnings.length, 1);
  assert.deepEqual(Object.keys(warnings[0]).sort(), ['code', 'message', 'page']);
  assert.ok(['missing-asset', 'no-pages', 'unknown-block'].includes(warnings[0].code));
});
