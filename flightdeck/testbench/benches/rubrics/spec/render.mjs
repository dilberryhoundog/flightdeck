#!/usr/bin/env node
// render.mjs — build the Rubric Bench page from data.json.
// Usage: node render.mjs <data.json> [--out rubric-bench.html]
import { readFileSync, writeFileSync } from 'node:fs';

const src = process.argv[2];
const outIdx = process.argv.indexOf('--out');
const out = outIdx > -1 ? process.argv[outIdx + 1] : 'rubric-bench.html';
if (!src) { console.error('usage: node render.mjs <data.json> [--out file]'); process.exit(2); }
const data = JSON.parse(readFileSync(src, 'utf8'));

// Question metadata: class decides the tuning lane. Edit here when the rubric changes.
const QUESTIONS = {
  'QGEN.1': { block: 'GEN', short: 'no run conduct', kind: 'judgement' },
  'QBEH.1': { block: 'BEH', short: 'input and result named', kind: 'mechanical' },
  'QBEH.2': { block: 'BEH', short: 'one decision per entry', kind: 'judgement' },
  'QCON.1': { block: 'CON', short: 'constraint is checkable', kind: 'mechanical' },
  'QCON.2': { block: 'CON', short: 'condition, not step', kind: 'judgement' },
  'QDOD.1': { block: 'DOD', short: 'gate condition has antecedent', kind: 'mechanical' },
  'QDOD.2': { block: 'DOD', short: 'boundary agrees with scope', kind: 'mechanical' },
  'QIFC.1': { block: 'IFC', short: 'seam has a stated shape', kind: 'mechanical' },
  'QVER.3': { block: 'VER', short: 'cheapest check class', kind: 'judgement' },
};

const html = `<title>Rubric Bench</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
:root{
  color-scheme:light;
  --ground:#f4f5f7; --surface:#ffffff; --ink:#171a1f; --ink-2:#5b6270; --ink-3:#8a919e; --line:#d7dbe2; --line-2:#e9ecf0;
  --sonnet:#2a78d6; --opus:#eb6834; --fable:#1baf7a;
  --seq-0:#eef3fa; --seq-1:#cfdff5; --seq-2:#9cc0ee; --seq-3:#5f97df; --seq-4:#2a78d6; --seq-5:#1a4f91;
  --good:#1f8a4c; --warn:#b8860b; --crit:#c0392b;
  --mono:'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,monospace;
  --sans:'IBM Plex Sans',system-ui,-apple-system,'Segoe UI',sans-serif;
  --display:'Sora','IBM Plex Sans',system-ui,sans-serif;
}
@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]){
  color-scheme:dark;
  --ground:#15181d; --surface:#1c2027; --ink:#eef0f3; --ink-2:#a3aab6; --ink-3:#737a87; --line:#2b3039; --line-2:#232830;
  --sonnet:#3987e5; --opus:#d95926; --fable:#199e70;
  --seq-0:#1a2230; --seq-1:#213452; --seq-2:#284b7c; --seq-3:#3068ad; --seq-4:#3987e5; --seq-5:#7db3f0;
  --good:#3fb96b; --warn:#d9a520; --crit:#e0604f;
}}
:root[data-theme="dark"]{
  color-scheme:dark;
  --ground:#15181d; --surface:#1c2027; --ink:#eef0f3; --ink-2:#a3aab6; --ink-3:#737a87; --line:#2b3039; --line-2:#232830;
  --sonnet:#3987e5; --opus:#d95926; --fable:#199e70;
  --seq-0:#1a2230; --seq-1:#213452; --seq-2:#284b7c; --seq-3:#3068ad; --seq-4:#3987e5; --seq-5:#7db3f0;
  --good:#3fb96b; --warn:#d9a520; --crit:#e0604f;
}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font-family:var(--sans);font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased}
a{color:inherit}
.wrap{max-width:1080px;margin:0 auto;padding:0 28px 96px}
header{padding:56px 0 28px;border-bottom:1px solid var(--line)}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-2)}
h1{font-family:var(--display);font-weight:700;font-size:clamp(34px,5vw,54px);line-height:1.05;letter-spacing:-.02em;margin:10px 0 14px;text-wrap:balance}
.lede{font-size:18px;color:var(--ink-2);max-width:62ch;margin:0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:26px 0 0}
.kpi{background:var(--surface);border:1px solid var(--line);padding:14px 16px}
.kpi b{display:block;font-family:var(--display);font-size:30px;font-weight:600;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.kpi span{font-size:12px;color:var(--ink-2)}
section{padding:44px 0 8px;border-bottom:1px solid var(--line-2)}
h2{font-family:var(--display);font-weight:600;font-size:24px;letter-spacing:-.015em;margin:0 0 6px;text-wrap:balance}
.sub{color:var(--ink-2);max-width:66ch;margin:0 0 22px}
p{max-width:66ch}
.legend{display:flex;flex-wrap:wrap;gap:16px;font-size:13px;color:var(--ink-2);margin:0 0 14px;align-items:center}
.legend i{display:inline-block;width:14px;height:14px;vertical-align:-2px;margin-right:6px;border:1px solid transparent}
.legend .hatch{background:repeating-linear-gradient(135deg,var(--ink-3) 0 2px,transparent 2px 5px);border-color:var(--ink-3)}
.legend .solid{background:var(--ink-3)}
.legend .s-sonnet{background:var(--sonnet)} .legend .s-opus{background:var(--opus)} .legend .s-fable{background:var(--fable)}
.chart{background:var(--surface);border:1px solid var(--line);padding:18px 18px 10px;overflow-x:auto}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
@media (max-width:820px){.row2{grid-template-columns:1fr}}
svg{display:block;font-family:var(--sans);max-width:100%}
svg text{fill:var(--ink)}
.axis{stroke:var(--line);stroke-width:1}
.tick{font-size:11px;fill:var(--ink-2)}
.lbl{font-size:12px;fill:var(--ink-2)}
.val{font-family:var(--mono);font-size:12px;fill:var(--ink)}
.bar-sonnet{fill:var(--sonnet)} .bar-opus{fill:var(--opus)} .bar-fable{fill:var(--fable)}
.hatched{fill:url(#hatch)}
.matrix{border-collapse:separate;border-spacing:3px;font-family:var(--mono);font-size:12px;width:100%}
.matrix th{font-family:var(--sans);font-weight:500;font-size:12px;color:var(--ink-2);text-align:left;padding:4px 6px;white-space:nowrap}
.matrix th.q{text-align:left}
.matrix td{text-align:center;padding:9px 4px;min-width:44px;color:var(--ink);border-radius:2px;font-variant-numeric:tabular-nums}
.matrix td.k{ text-align:left;font-family:var(--sans);font-size:12px;color:var(--ink-2);white-space:nowrap}
.timeline{display:grid;gap:10px}
.trow{display:grid;grid-template-columns:190px 1fr;gap:12px;align-items:start}
.trow .name{font-size:13px;line-height:1.3;padding-top:6px}
.trow .name b{display:block;font-weight:600}
.trow .name span{color:var(--ink-2);font-size:12px}
.runs{display:flex;flex-wrap:wrap;gap:8px}
.run{border:1px solid var(--line);background:var(--surface);padding:6px 9px;min-width:88px;font-size:12px}
.run.ready{border-color:var(--good)}
.run .n{font-family:var(--mono);color:var(--ink-2);font-size:11px;display:flex;justify-content:space-between;gap:8px}
.run .f{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.run .f i{font-style:normal;font-family:var(--mono);font-size:11px;padding:1px 5px;background:var(--seq-1);color:var(--ink)}
.run .f i.flip{outline:1.5px solid var(--crit)}
.run .ok{color:var(--good);font-weight:600;font-family:var(--mono);font-size:11px;margin-top:4px}
table.plain{width:100%;border-collapse:collapse;font-size:14px}
table.plain th{text-align:left;font-weight:500;color:var(--ink-2);font-size:12px;letter-spacing:.04em;text-transform:uppercase;padding:8px 10px;border-bottom:1px solid var(--line)}
table.plain td{padding:9px 10px;border-bottom:1px solid var(--line-2);vertical-align:top}
table.plain td.m{font-family:var(--mono);font-size:13px;white-space:nowrap}
.pill{display:inline-block;font-family:var(--mono);font-size:11px;padding:2px 7px;border:1px solid var(--line);border-radius:999px;color:var(--ink-2)}
.pill.mech{border-color:var(--good);color:var(--good)} .pill.judg{border-color:var(--warn);color:var(--warn)}
.lanes{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}
.lane{background:var(--surface);border:1px solid var(--line);padding:16px 18px}
.lane h3{font-family:var(--display);font-size:15px;font-weight:600;margin:0 0 6px}
.lane p{font-size:14px;color:var(--ink-2);margin:0 0 10px}
.lane ul{margin:0;padding-left:18px;font-size:14px}
.lane li{margin:4px 0}
.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px}
.metric{border-left:3px solid var(--line);padding:2px 0 2px 14px}
.metric b{display:block;font-weight:600}
.metric span{font-size:14px;color:var(--ink-2)}
footer{padding:28px 0 0;font-size:12px;color:var(--ink-3);font-family:var(--mono)}
.tip{position:fixed;pointer-events:none;background:var(--ink);color:var(--ground);font-size:12px;padding:6px 9px;border-radius:3px;opacity:0;transition:opacity .12s;max-width:260px;z-index:9}
@media (prefers-reduced-motion:reduce){.tip{transition:none}}
</style>

<div class="wrap">
<header>
  <div class="eyebrow">agent-spec-interviewer · spec.v1 · readiness rubric v1</div>
  <h1>Six chains, one draft, six different “ready”</h1>
  <p class="lede">Three models judged the same starting spec against the same rubric, with and without the standard in hand, findings absorbed after every run until the verdict read ready to freeze. This page is what the rubric did under that load.</p>
  <div class="kpis" id="kpis"></div>
</header>

<section>
  <h2>How long each judge took to say ready</h2>
  <p class="sub">Runs until the verdict read ready to freeze, and how many findings were absorbed on the way. Same start draft for every chain. Hatched bars had the standard and addendum loaded alongside the rubric.</p>
  <div class="legend"><span><i class="s-sonnet"></i>sonnet</span><span><i class="s-opus"></i>opus</span><span><i class="s-fable"></i>fable</span><span><i class="solid"></i>rubric + draft</span><span><i class="hatch"></i>rubric + standard + addendum + draft</span></div>
  <div class="row2">
    <div class="chart"><div class="eyebrow">runs to ready</div><div id="c-runs"></div></div>
    <div class="chart"><div class="eyebrow">findings absorbed</div><div id="c-findings"></div></div>
  </div>
</section>

<section>
  <h2>Which questions fired, and where</h2>
  <p class="sub">Count of failing verdicts per rubric question per chain. A question that fires in every chain is measuring the draft. A question that fires in one chain and not the others is measuring the judge.</p>
  <div class="chart" id="c-matrix"></div>
</section>

<section>
  <h2>Run by run</h2>
  <p class="sub">Every run in every chain, with the questions that failed. A red outline marks a flip: the question failed on text an earlier run in the same chain had sampled and passed.</p>
  <div class="chart"><div class="timeline" id="c-timeline"></div></div>
</section>

<section>
  <h2>Flips: same judge, same text, opposite answer</h2>
  <p class="sub">The strongest signal a question has no test. Each row is one node a chain passed in earlier runs and then failed without the text changing.</p>
  <div class="chart" id="c-flips"></div>
</section>

<section>
  <h2>What a run costs</h2>
  <p class="sub">Seconds and tokens per judge run. The standard adds about a fifth to token cost; model tier decides the clock.</p>
  <div class="legend"><span><i class="s-sonnet"></i>sonnet</span><span><i class="s-opus"></i>opus</span><span><i class="s-fable"></i>fable</span><span><i class="solid"></i>two inputs</span><span><i class="hatch"></i>four inputs</span></div>
  <div class="row2">
    <div class="chart"><div class="eyebrow">seconds per run</div><div id="c-secs"></div></div>
    <div class="chart"><div class="eyebrow">tokens per run</div><div id="c-tokens"></div></div>
  </div>
</section>

<section>
  <h2>Question stability: the tuning axis</h2>
  <p class="sub">For each question that ever fired: how many chains raised it, how many times it flipped, and whether its wording carries a test. Mechanical questions agree across judges; judgement questions are where the rubric needs a test written in.</p>
  <div class="chart" id="c-stability"></div>
</section>

<section>
  <h2>Tuning lanes</h2>
  <p class="sub">The goal: a rubric alone, on which models converge on the same findings in the same number of runs, tier anomalies accounted for. Three lanes, from this data.</p>
  <div class="lanes" id="c-lanes"></div>
</section>

<section>
  <h2>Metrics worth adding next round</h2>
  <div class="metrics" id="c-metrics"></div>
</section>

<footer id="foot"></footer>
</div>
<div class="tip" id="tip"></div>

<script>
const DATA = ${JSON.stringify(data)};
const Q = ${JSON.stringify(QUESTIONS)};
const label = c => c.model + (c.inputs === 'four' ? ' · 4 inputs' : ' · 2 inputs') + (c.id === 'main-sonnet-4in' ? ' (main)' : '');
const order = ['opus-4in','opus','fable','sonnet','main-sonnet-4in','fable-4in'];
const chains = [...DATA.chains].sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
const readyRun = c => { const r = c.runs.find(x => /ready/.test(x.verdict)); return r ? r.n : null; };
const absorbed = c => c.runs.reduce((n,r)=>n+r.findings.length,0);
const tip = document.getElementById('tip');
const showTip = (e, html) => { tip.innerHTML = html; tip.style.opacity = 1; tip.style.left = (e.clientX + 12) + 'px'; tip.style.top = (e.clientY + 12) + 'px'; };
const hideTip = () => tip.style.opacity = 0;
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');

// KPIs
const totalRuns = chains.reduce((n,c)=>n+c.runs.length,0);
const totalFind = chains.reduce((n,c)=>n+absorbed(c),0);
document.getElementById('kpis').innerHTML = [
  [chains.length,'chains'],[totalRuns,'judge runs'],[totalFind,'findings absorbed'],[DATA.flips.length,'within-chain flips'],
  [chains.filter(readyRun).length + '/' + chains.length,'reached ready'],[new Set(chains.map(c=>JSON.stringify(c.runs.length)+absorbed(c))).size,'distinct end states']
].map(([v,l])=>'<div class="kpi"><b>'+v+'</b><span>'+l+'</span></div>').join('');

// bar chart helper: horizontal bars, one per chain
function bars(el, valueOf, max, fmt){
  const H = 30, pad = 150, W = 460, rows = chains.length;
  const svgH = rows*H + 30;
  let s = '<svg viewBox="0 0 '+W+' '+svgH+'" width="100%" role="img">';
  s += '<defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)"><rect width="6" height="6" fill="var(--surface)"/><line x1="0" y1="0" x2="0" y2="6" stroke="currentColor" stroke-width="3"/></pattern></defs>';
  chains.forEach((c,i)=>{
    const v = valueOf(c); const y = i*H + 8; const w = v==null ? 0 : (W-pad-60)*(v/max);
    s += '<text class="lbl" x="'+(pad-10)+'" y="'+(y+15)+'" text-anchor="end">'+esc(label(c))+'</text>';
    if (v==null) { s += '<text class="tick" x="'+(pad+4)+'" y="'+(y+15)+'">not ready (stopped)</text>'; }
    else {
      s += '<rect x="'+pad+'" y="'+(y+3)+'" width="'+w+'" height="'+(H-10)+'" rx="0" class="bar-'+c.model+'" style="color:var(--'+c.model+')" data-t="'+esc(label(c)+': '+fmt(v))+'"/>';
      if (c.inputs==='four') s += '<rect x="'+pad+'" y="'+(y+3)+'" width="'+w+'" height="'+(H-10)+'" fill="url(#hatch)" style="color:var(--'+c.model+')" opacity=".55" pointer-events="none"/>';
      s += '<text class="val" x="'+(pad+w+6)+'" y="'+(y+15)+'">'+fmt(v)+'</text>';
    }
  });
  s += '<line class="axis" x1="'+pad+'" y1="4" x2="'+pad+'" y2="'+(rows*H+6)+'"/></svg>';
  el.innerHTML = s;
}
bars(document.getElementById('c-runs'), readyRun, 8, v=>v+' run'+(v===1?'':'s'));
bars(document.getElementById('c-findings'), absorbed, 12, v=>v+' finding'+(v===1?'':'s'));

// matrix
{
  const qs = DATA.questions;
  const maxN = Math.max(...DATA.matrix.flatMap(m=>Object.values(m.counts)));
  const step = n => n===0 ? 'var(--seq-0)' : n===1 ? 'var(--seq-2)' : n===2 ? 'var(--seq-3)' : n===3 ? 'var(--seq-4)' : 'var(--seq-5)';
  let t = '<table class="matrix"><thead><tr><th></th>'+qs.map(q=>'<th>'+q+'</th>').join('')+'<th>total</th></tr></thead><tbody>';
  for (const c of chains){
    const m = DATA.matrix.find(x=>x.id===c.id).counts;
    const tot = Object.values(m).reduce((a,b)=>a+b,0);
    t += '<tr><td class="k">'+esc(label(c))+'</td>'+qs.map(q=>'<td style="background:'+step(m[q])+';color:'+(m[q]>=2?'#fff':'var(--ink)')+'" data-t="'+esc(label(c)+' · '+q+' · '+(Q[q]?Q[q].short:'')+' · '+m[q]+' fail'+(m[q]===1?'':'s'))+'">'+(m[q]||'·')+'</td>').join('')+'<td class="k">'+tot+'</td></tr>';
  }
  const chainsRaising = q => chains.filter(c => DATA.matrix.find(x=>x.id===c.id).counts[q] > 0).length;
  t += '<tr><td class="k">chains raising it</td>'+qs.map(q=>'<td class="k" style="text-align:center">'+chainsRaising(q)+'/'+chains.length+'</td>').join('')+'<td></td></tr>';
  t += '</tbody></table>';
  document.getElementById('c-matrix').innerHTML = t;
}

// timeline
{
  const flipsFor = (cid, n) => DATA.flips.filter(f=>f.chain===cid && f.failed_run===n).map(f=>f.q);
  let h = '';
  for (const c of chains){
    h += '<div class="trow"><div class="name"><b>'+esc(label(c))+'</b><span>'+esc(c.result)+'</span></div><div class="runs">';
    for (const r of c.runs){
      const ready = /ready/.test(r.verdict); const fl = flipsFor(c.id, r.n);
      h += '<div class="run'+(ready?' ready':'')+'" data-t="'+esc((r.note||'').slice(0,220))+'"><div class="n"><span>run '+r.n+'</span><span>'+(r.duration_ms?Math.round(r.duration_ms/1000)+'s':'')+'</span></div>';
      if (ready) h += '<div class="ok">ready</div>';
      else h += '<div class="f">'+r.findings.map(f=>'<i class="'+(fl.includes(f.q)?'flip':'')+'" title="'+esc(f.text)+'">'+f.q+'</i>').join('')+'</div>';
      if (r.inputs !== c.inputs) h += '<div class="n"><span>inputs: '+r.inputs+'</span></div>';
      h += '</div>';
    }
    h += '</div></div>';
  }
  document.getElementById('c-timeline').innerHTML = h;
}

// flips table
{
  let t = '<table class="plain"><thead><tr><th>chain</th><th>question</th><th>node</th><th>passed in runs</th><th>failed in run</th></tr></thead><tbody>';
  for (const f of DATA.flips){ const c = chains.find(x=>x.id===f.chain); t += '<tr><td>'+esc(label(c))+'</td><td class="m">'+f.q+'</td><td class="m">'+esc(f.node)+'</td><td class="m">'+f.passed_runs.join(', ')+'</td><td class="m">'+f.failed_run+'</td></tr>'; }
  if (!DATA.flips.length) t += '<tr><td colspan="5">none detected</td></tr>';
  t += '</tbody></table>';
  document.getElementById('c-flips').innerHTML = t;
}

// cost dot plots: x = value, rows = model, marker filled (two) or ring (four)
function dots(el, valueOf, max, fmt){
  const models = ['sonnet','opus','fable']; const H = 34, pad = 70, W = 460; const svgH = models.length*H + 34;
  let s = '<svg viewBox="0 0 '+W+' '+svgH+'" width="100%" role="img">';
  const x = v => pad + (W-pad-20)*(v/max);
  for (let g=0; g<=4; g++){ const v = max*g/4; s += '<line class="axis" x1="'+x(v)+'" y1="6" x2="'+x(v)+'" y2="'+(models.length*H+4)+'" stroke-dasharray="2 3"/><text class="tick" x="'+x(v)+'" y="'+(models.length*H+20)+'" text-anchor="middle">'+fmt(v)+'</text>'; }
  models.forEach((m,i)=>{
    const y = i*H + 20;
    s += '<text class="lbl" x="'+(pad-10)+'" y="'+(y+4)+'" text-anchor="end">'+m+'</text>';
    for (const c of chains.filter(c=>c.model===m)) for (const r of c.runs){ const v = valueOf(r); if (v==null) continue;
      const four = r.inputs==='four';
      s += '<circle cx="'+x(v)+'" cy="'+y+'" r="6" '+(four?'fill="var(--surface)" stroke="var(--'+m+')" stroke-width="2.5"':'fill="var(--'+m+')" stroke="var(--surface)" stroke-width="2"')+' data-t="'+esc(label(c)+' run '+r.n+': '+fmt(v))+'"/>';
    }
  });
  s += '</svg>'; el.innerHTML = s;
}
dots(document.getElementById('c-secs'), r=>r.duration_ms?r.duration_ms/1000:null, 400, v=>Math.round(v)+'s');
dots(document.getElementById('c-tokens'), r=>r.tokens||null, 40000, v=>Math.round(v/1000)+'k');

// stability
{
  const qs = DATA.questions;
  let t = '<table class="plain"><thead><tr><th>question</th><th>asks</th><th>kind</th><th>chains raising it</th><th>total fails</th><th>flips</th><th>reading</th></tr></thead><tbody>';
  for (const q of qs){
    const raising = chains.filter(c => DATA.matrix.find(x=>x.id===c.id).counts[q] > 0).length;
    const fails = DATA.matrix.reduce((n,m)=>n+(m.counts[q]||0),0);
    const flips = DATA.flips.filter(f=>f.q===q).length;
    const k = Q[q] ? Q[q].kind : 'unclassified';
    const reading = flips ? 'no test in the wording; flips on unchanged text' : raising >= chains.length-1 ? 'measures the draft; stable' : raising === 1 ? 'one judge only; check whether the finding is real, then decide if the question needs sharpening or the other judges missed it' : 'partial agreement; likely ambiguous for this draft shape';
    t += '<tr><td class="m">'+q+'</td><td>'+(Q[q]?esc(Q[q].short):'')+'</td><td><span class="pill '+(k==='mechanical'?'mech':'judg')+'">'+k+'</span></td><td class="m">'+raising+' / '+chains.length+'</td><td class="m">'+fails+'</td><td class="m">'+(flips||'·')+'</td><td>'+reading+'</td></tr>';
  }
  t += '</tbody></table>';
  document.getElementById('c-stability').innerHTML = t;
}

// lanes
document.getElementById('c-lanes').innerHTML = [
  ['Absorb: findings the standard produced that the rubric did not', 'Where a judge with the standard found something real that no rubric-only judge raised, the rubric is missing the question. Write it in so the rubric carries it alone.', ['QCON.2 on C2 (placement of ordering rules) — the standard\\'s rule, absent from the rubric', 'QGEN.3 as gating for constraint/behaviour pairs — decide whether pairs are a defect or a requirement and say so', 'QDOD.1 passed by opus and fable with the standard: the addendum supplied the antecedent. The rubric should say the antecedent must be in the draft']],
  ['Harden: questions that diverged on the same document', 'A question that flips within a chain or splits across judges has no test in its wording. Give it one.', ['QBEH.2 — add the test: could two different records falsify different halves? If yes, two decisions', 'QGEN.1 — for agent-shaped drafts, the product\\'s own tools and model are interface facts, not run conduct; say so', 'QVER.3 — a supplementary judged rubric does not re-tag a behaviour; the question is about the tag']],
  ['Integrate: what the stronger tier saw', 'Findings only the top tier raised, that hold up on inspection and would not change what other tiers find.', ['QIFC.1 on I1, I6–I8 In, explorer return ids — real, mechanical, missed by every other judge; the question is fine, the other judges did not look', 'QCON.1 on C11 "encoded in the body" — real; add an instance rule: every clause of a constraint must be checkable, not just one', 'QPRI.2 on D13 — a rejection without a reason; advisory but correct']],
].map(([h,p,items])=>'<div class="lane"><h3>'+h+'</h3><p>'+p+'</p><ul>'+items.map(i=>'<li>'+i+'</li>').join('')+'</ul></div>').join('');

// metrics
document.getElementById('c-metrics').innerHTML = [
  ['Agreement per question', 'Chains raising it ÷ chains that saw the node. Target 1.0 for mechanical questions; below 0.5 means the question is doing model-specific work.'],
  ['Flip rate', 'Flips ÷ (question × node × run) exposures. Any non-zero flip on unchanged text disqualifies the wording until it carries a test.'],
  ['Instances per finding', 'How many nodes a failing question names in one run. QIFC.1 and QBEH.2 surfaced one per run; a rubric that asks for every instance converges in one.'],
  ['Sample coverage', 'Fraction of behaviours ever judged across a chain. With first/last/three-longest, splits re-select their successors and most nodes are never read.'],
  ['Finding realness', 'Provider verdict on each absorbed finding: real, cosmetic, wrong. Separates a judge that finds more from one that finds better.'],
  ['End-state distance', 'Node-level diff between the drafts each chain called ready. Six chains gave six drafts; the target is one.'],
  ['Advisory recurrence', 'Advisories re-raised identically after the provider decided (QINT.3, every run). A decision node should close them; measure whether it does.'],
  ['Cost to ready', 'Tokens and seconds summed over the chain, not per run. Opus 4-in was cheapest to ready and most lenient; the metric needs realness beside it.'],
].map(([b,s])=>'<div class="metric"><b>'+b+'</b><span>'+s+'</span></div>').join('');

document.getElementById('foot').textContent = 'generated ' + DATA.generated + ' · source ' + DATA.source + ' · rubric-harness/collect.mjs → render.mjs';

// tooltips
document.addEventListener('mousemove', e => { const t = e.target.closest('[data-t]'); if (t && t.dataset.t) showTip(e, esc(t.dataset.t)); else hideTip(); });
</script>
`;
writeFileSync(out, html);
console.log('wrote ' + out + ' (' + (html.length/1024).toFixed(0) + ' KB)');
