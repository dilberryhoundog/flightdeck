// export-html sample project: exports a project object to one self-contained HTML document.
// Usage: import { exportProject } from './src/export/index.mjs'; const { html, warnings } = exportProject(project, { inlineAssets: true });

const STYLE = 'body{font-family:system-ui,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem}img{max-width:100%}';

export function exportProject(project, options = {}) {
  if (project === null || typeof project !== 'object') {
    throw new TypeError('exportProject: project must be an object');
  }
  const inlineAssets = options.inlineAssets !== false;
  const warnings = [];
  const name = typeof project.name === 'string' ? project.name : 'Untitled';
  const pages = Array.isArray(project.pages) ? project.pages : [];
  const assets = new Map();
  for (const asset of Array.isArray(project.assets) ? project.assets : []) {
    if (asset && typeof asset.id === 'string') assets.set(asset.id, asset);
  }

  if (pages.length === 0) {
    warnings.push(warning('no-pages', 'the project has no pages', null));
  }

  const lines = [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${text(name)}</title>`,
    `<style>${STYLE}</style>`,
    '</head>',
    '<body>',
    `<h1>${text(name)}</h1>`,
  ];
  if (pages.length > 0) {
    const nav = pages.map((page) => `<a href="#${attr(page.slug)}">${text(page.title)}</a>`).join(' ');
    lines.push(`<nav>${nav}</nav>`);
  }
  for (const page of pages) {
    lines.push(...renderPage(page, assets, inlineAssets, warnings));
  }
  lines.push('</body>', '</html>');
  return { html: lines.join('\n') + '\n', warnings };
}

function renderPage(page, assets, inlineAssets, warnings) {
  const slug = typeof page.slug === 'string' ? page.slug : '';
  const out = [`<section id="${attr(slug)}">`, `<h2>${text(page.title)}</h2>`];
  for (const block of Array.isArray(page.blocks) ? page.blocks : []) {
    const rendered = renderBlock(block, slug, assets, inlineAssets, warnings);
    if (rendered !== null) out.push(rendered);
  }
  out.push('</section>');
  return out;
}

function renderBlock(block, slug, assets, inlineAssets, warnings) {
  const type = block && typeof block.type === 'string' ? block.type : 'undefined';
  switch (type) {
    case 'heading':
      return `<h3>${text(block.text)}</h3>`;
    case 'text':
      return `<p>${text(block.text)}</p>`;
    case 'image': {
      const asset = assets.get(block.asset);
      if (!asset) {
        warnings.push(warning('missing-asset', `page ${slug} names asset ${block.asset} which the project does not carry`, slug));
        return null;
      }
      const src = inlineAssets ? `data:${asset.type};base64,${asset.data}` : asset.path;
      return `<img src="${attr(src)}" alt="${attr(block.alt ?? asset.id)}">`;
    }
    default:
      warnings.push(warning('unknown-block', `page ${slug} holds a block of unknown type ${type}`, slug));
      return null;
  }
}

function warning(code, message, page) {
  return { code, message, page };
}

function text(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function attr(value) {
  return text(value).replace(/"/g, '&quot;');
}
