// Invariant check T5 of the export-html spec: C1 (imports) and C2 (no external references) over src/export/ and the exported reference project.
// Usage: node scripts/export-invariants.mjs (from the project root); exit 0 on success, 1 on any violation.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportProject } from '../src/export/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const srcDir = path.join(root, 'src', 'export');
const FORBIDDEN_MODULES = new Set(['node:http', 'node:https', 'node:net', 'node:dgram', 'node:tls']);
const problems = [];
let scanned = 0;

for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.mjs')) continue;
  scanned += 1;
  const source = readFileSync(path.join(srcDir, entry.name), 'utf8');
  for (const match of source.matchAll(/(?:^|\n)\s*import\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g)) {
    const spec = match[1];
    if (FORBIDDEN_MODULES.has(spec)) problems.push(`${entry.name} imports ${spec}`);
    else if (!spec.startsWith('node:') && !spec.startsWith('.')) problems.push(`${entry.name} imports bare specifier ${spec}`);
  }
  if (/\bfetch\s*\(/.test(source)) problems.push(`${entry.name} calls fetch`);
}

const project = JSON.parse(readFileSync(path.join(root, 'tests', 'export', 'fixtures', 'reference-project.json'), 'utf8'));
for (const inlineAssets of [true, false]) {
  const { html } = exportProject(project, { inlineAssets });
  for (const match of html.matchAll(/\b(src|href|srcset|action)\s*=\s*["']([^"']*)["']/g)) {
    const value = match[2].trim();
    if (/^(?:https?:|\/\/)/i.test(value)) problems.push(`external ${match[1]} value ${value} (inlineAssets ${inlineAssets})`);
  }
  if (/url\(|@import/.test(html)) problems.push(`style references an external resource (inlineAssets ${inlineAssets})`);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`export-invariants: FAIL ${p}`);
  process.exit(1);
}
console.log(`export-invariants: ok (${scanned} source file scanned, 2 exports checked)`);
