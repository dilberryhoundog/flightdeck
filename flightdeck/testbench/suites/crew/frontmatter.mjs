// testbench/suites/crew/frontmatter.mjs — a small YAML-frontmatter reader for crew files: scalar fields, quoted scalars, block scalars (| and >), and the comma-separated tools list.
// Usage: import { parseFrontmatter, toolList } from './frontmatter.mjs'; parseFrontmatter(text) returns { fields, body } or null when the text does not start with a --- block.

export function parseFrontmatter(text) {
  const lines = String(text).split('\n');
  if ((lines[0] ?? '').trim() !== '---') return null;
  let end = -1;
  for (let i = 1; i < lines.length; i += 1) {
    if (lines[i].trim() === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) return null;
  const fields = {};
  let i = 1;
  while (i < end) {
    const m = /^([A-Za-z_][\w-]*):\s*(.*)$/.exec(lines[i]);
    if (!m) {
      i += 1;
      continue;
    }
    const key = m[1];
    let value = m[2].trim();
    if (/^[|>][-+]?$/.test(value)) {
      const block = [];
      i += 1;
      while (i < end && (lines[i].trim() === '' || /^\s/.test(lines[i]))) {
        block.push(lines[i].replace(/^\s+/, ''));
        i += 1;
      }
      fields[key] = value.startsWith('|') ? block.join('\n').trim() : block.join(' ').replace(/\s+/g, ' ').trim();
      continue;
    }
    if ((value.startsWith('"') && value.endsWith('"') && value.length >= 2) || (value.startsWith("'") && value.endsWith("'") && value.length >= 2)) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
    i += 1;
  }
  return { fields, body: lines.slice(end + 1).join('\n') };
}

/** The tools field as a list of names. */
export function toolList(value) {
  return String(value ?? '')
    .replace(/^\[|\]$/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}
