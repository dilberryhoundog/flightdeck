#!/usr/bin/env node
// collect.mjs — normalise judge chains into one data.json for render.mjs.
// Usage: node collect.mjs <runs-folder> [--out data.json]
// Reads <runs-folder>/experiments/*/chain.json and <runs-folder>/judge/dispatch-report.json (optional).
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

const root = process.argv[2];
const outIdx = process.argv.indexOf('--out');
const out = outIdx > -1 ? process.argv[outIdx + 1] : join(root, 'experiments', 'data.json');
if (!root) { console.error('usage: node collect.mjs <runs-folder> [--out file]'); process.exit(2); }

const inputsKind = (inputs) => (inputs && inputs.length >= 4) ? 'four' : 'two';
const modelOf = (c) => (c.model_observed || c.model_requested || c.model || '').replace(/ .*/, '').replace(/^claude-/, '').replace(/-5$/, '');

const chains = [];
const expDir = join(root, 'experiments');
if (existsSync(expDir)) for (const d of readdirSync(expDir)) {
  const p = join(expDir, d, 'chain.json');
  if (!existsSync(p)) continue;
  const c = JSON.parse(readFileSync(p, 'utf8'));
  chains.push({
    id: d, model: modelOf(c), inputs: inputsKind(c.inputs), start: c.start, result: c.result || 'in progress',
    runs: (c.runs || []).map(r => ({
      n: r.run, verdict: r.verdict, sample: r.sample || [], failing_blocks: r.failing_blocks || [],
      findings: (r.findings || []).map(f => ({ q: f.id, text: f.text, disposition: f.disposition })),
      advisory: r.advisory || [], note: r.note || '', duration_ms: r.duration_ms || null, tokens: r.tokens || null,
      inputs: inputsKind(c.inputs),
    })),
  });
}
// main chain from dispatch-report.json (runs with a model and a verdict)
const rep = join(root, 'judge', 'dispatch-report.json');
if (existsSync(rep)) {
  const r = JSON.parse(readFileSync(rep, 'utf8'));
  const runs = (r.runs || []).filter(x => x.session === 'this' && x.verdict !== undefined && !/no return/.test(x.verdict)).map(x => ({
    n: x.run, verdict: x.verdict, sample: x.sample || [], failing_blocks: x.failing_blocks || [],
    findings: (x.findings || []).map(f => ({ q: f.id, text: f.text, disposition: f.disposition })),
    advisory: x.advisory || [], note: x.note || x.experiment || '', duration_ms: x.duration_ms || null, tokens: x.tokens || null,
    inputs: x.experiment && /rubric \+ draft/.test(x.experiment) ? 'two' : 'four',
  }));
  if (runs.length) chains.push({ id: 'main-sonnet-4in', model: 'sonnet', inputs: 'four', start: 'same start as experiments (HEAD e632408 + I8 fix)', result: 'ready on run 6 under two inputs; 10 findings absorbed', runs, note: 'The original chain on the live draft; its final run switched to rubric + draft.' });
}

// derived: question x chain fail counts, first-run findings, cost, flips
const questions = new Set(); for (const c of chains) for (const r of c.runs) for (const f of r.findings) questions.add(f.q);
const qList = [...questions].sort();
const matrix = chains.map(c => ({ id: c.id, counts: Object.fromEntries(qList.map(q => [q, c.runs.reduce((n, r) => n + r.findings.filter(f => f.q === q).length, 0)])) }));
const flips = [];
for (const c of chains) {
  // a flip: a question failing in run n on a node id that appeared in an earlier run's sample where that question passed
  for (let i = 1; i < c.runs.length; i++) {
    const r = c.runs[i];
    for (const f of r.findings) {
      const ids = (f.text.match(/\b[BCDIE]\d+\b/g) || []);
      for (const id of ids) {
        const earlier = c.runs.slice(0, i).filter(p => p.sample.includes(id) && !p.findings.some(g => g.q === f.q));
        if (earlier.length && f.q.startsWith('QBEH')) flips.push({ chain: c.id, q: f.q, node: id, passed_runs: earlier.map(p => p.n), failed_run: r.n });
      }
      if (f.q === 'QDOD.1' && c.runs.slice(0, i).some(p => p.verdict !== 'returned' || !p.findings.some(g => g.q === 'QDOD.1'))) {
        const prior = c.runs.slice(0, i).filter(p => !p.findings.some(g => g.q === 'QDOD.1')).map(p => p.n);
        if (prior.length) flips.push({ chain: c.id, q: f.q, node: 'ACC probe', passed_runs: prior, failed_run: r.n });
      }
    }
  }
}
const data = { generated: new Date().toISOString(), source: root, questions: qList, chains, matrix, flips };
writeFileSync(out, JSON.stringify(data, null, 2) + '\n');
console.log(`wrote ${out}: ${chains.length} chains, ${chains.reduce((n, c) => n + c.runs.length, 0)} runs, ${qList.length} questions, ${flips.length} flips`);
