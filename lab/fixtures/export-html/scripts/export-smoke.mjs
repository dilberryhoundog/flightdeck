// Acceptance check T1 of the export-html spec: exports the reference project and inspects the result.
// Usage: node scripts/export-smoke.mjs (from the project root); exit 0 on success, 1 on any failure.
import { readFileSync } from 'node:fs';
import { exportProject } from '../src/export/index.mjs';

const EXTERNAL = /\b(?:src|href|srcset|action)\s*=\s*["']?\s*(?:https?:|\/\/)/i;

try {
  const project = JSON.parse(readFileSync(new URL('../tests/export/fixtures/reference-project.json', import.meta.url), 'utf8'));
  const { html, warnings } = exportProject(project);
  const problems = [];
  if (!html.startsWith('<!doctype html>')) problems.push('html does not start with <!doctype html>');
  if (EXTERNAL.test(html)) problems.push('html references an external location');
  if (/url\(|@import/.test(html)) problems.push('html styles reference an external resource');
  if (warnings.length > 0) problems.push(`${warnings.length} warning(s): ${warnings.map((w) => w.code).join(', ')}`);
  if (problems.length > 0) {
    for (const p of problems) console.error(`export-smoke: FAIL ${p}`);
    process.exit(1);
  }
  console.log(`export-smoke: ok (${project.pages.length} pages, ${project.assets.length} asset, ${warnings.length} warnings)`);
} catch (error) {
  console.error(`export-smoke: error ${error.message}`);
  process.exit(1);
}
