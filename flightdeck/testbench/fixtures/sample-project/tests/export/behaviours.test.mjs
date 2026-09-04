// Behaviour checks B1 to B5 of the export-html spec, run against the reference project fixture.
// Usage: node --test tests/export/behaviours.test.mjs (from the project root).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { exportProject } from '../../src/export/index.mjs';

const project = JSON.parse(readFileSync(new URL('./fixtures/reference-project.json', import.meta.url), 'utf8'));

test('B1 the html starts with a doctype and carries one title equal to the escaped project name', () => {
  const { html } = exportProject(project);
  assert.ok(html.startsWith('<!doctype html>'), 'html starts with <!doctype html>');
  const titles = html.match(/<title>.*?<\/title>/g) ?? [];
  assert.equal(titles.length, 1, 'exactly one title element');
  assert.equal(titles[0], '<title>Field Notes &amp; Sketches</title>');
});

test('B2 each page renders as a section with id = slug and an h2 title, in project order', () => {
  const { html } = exportProject(project);
  const sections = [...html.matchAll(/<section id="([^"]+)">\n<h2>([^<]*)<\/h2>/g)].map((m) => [m[1], m[2]]);
  assert.deepEqual(sections, project.pages.map((p) => [p.slug, p.title]));
});

test('B3 with inlineAssets true an image block renders its asset as a data URI', () => {
  const { html } = exportProject(project, { inlineAssets: true });
  const asset = project.assets[0];
  assert.ok(html.includes(`<img src="data:${asset.type};base64,${asset.data}"`), 'img src is a data URI built from the asset');
});

test('B4 with inlineAssets false an image block references the asset path unchanged', () => {
  const { html } = exportProject(project, { inlineAssets: false });
  assert.ok(html.includes('<img src="assets/mark.png"'), 'img src is the asset path');
  assert.ok(!html.includes('data:image'), 'no data URI when assets are not inlined');
});

test('B5 block text is HTML-escaped so it cannot open a tag', () => {
  const { html } = exportProject(project);
  assert.ok(html.includes('<p>Notes from the field: &lt;draft&gt; pages &amp; sketches.</p>'));
  assert.ok(!html.includes('<draft>'), 'raw angle brackets from block text never reach the html');
});
