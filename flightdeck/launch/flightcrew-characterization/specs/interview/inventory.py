#!/usr/bin/env python3
"""Build the inventory of every current part of the system and render pages/inventory.html.
Each item: keep / goes / unsure + comment. Copy yields markdown per group: - <path>: <choice> — <comment>.
Descriptions are lifted from each file's first comment or heading line; a directory item is one part."""
import os, re, json, html, glob
esc = html.escape
here = os.path.dirname(os.path.abspath(__file__))
def desc(p):
    try:
        with open(p, encoding='utf-8', errors='replace') as f:
            for line in f:
                s = line.strip()
                if not s: continue
                s = re.sub(r'^(//|#|/\*\*?|\*|<!--)\s*', '', s).strip('*/ -')
                s = re.sub(r'^\S+\.(mjs|js|md|json)\s*[—:-]\s*', '', s)
                return s[:180]
    except Exception: return ''
    return ''
def files(pattern): return sorted(glob.glob(pattern, recursive=True))
groups = []
def group(title, items): groups.append((title, [(p, desc(p) if os.path.isfile(p) else d) for p, d in items]))
group('flightcrew/bin — the runner', [(p, '') for p in files('flightdeck/flightcrew/bin/**/*.mjs') + ['flightdeck/flightcrew/bin/fc']])
group('flightcrew/hooks', [(p, '') for p in files('flightdeck/flightcrew/hooks/*')])
group('flightcrew/crew — role files', [(p, '') for p in files('flightdeck/flightcrew/crew/*.md')])
group('flightcrew/schemas', [(p, '') for p in files('flightdeck/flightcrew/schemas/*.json')])
group('flightcrew/templates', [(p, '') for p in files('flightdeck/flightcrew/templates/*')] + [('flightdeck/flightcrew/templates/kickoff/', 'the kickoff library: base, shapes, tasks')])
group('flightcrew/checks', [(p, '') for p in files('flightdeck/flightcrew/checks/lib/*.mjs') + files('flightdeck/flightcrew/checks/validators/*.mjs') + files('flightdeck/flightcrew/checks/gates/*.mjs')] + [('flightdeck/flightcrew/checks/rubrics/spec/spec-readiness-rubric.md', ''), ('flightdeck/flightcrew/checks/rubrics/spec/deprecated/', 'earlier rubric versions')])
group('flightcrew/workflows and root files', [(p, '') for p in files('flightdeck/flightcrew/workflows/*')] + [('flightdeck/flightcrew/MANIFEST.txt', ''), ('flightdeck/flightcrew/README.md', '')])
group('.claude — installed surface', [(p, '') for p in files('.claude/agents/*.md') + files('.claude/workflows/*.js')] + [('.claude/settings.json', ''), ('CLAUDE.md', '')])
group('manuals', [(p, '') for p in files('flightdeck/manuals/**/*.md')])
group('testbench', [('flightdeck/testbench/README.md', ''), ('flightdeck/testbench/run-all.mjs', ''), ('flightdeck/testbench/lib/', 'suite-lib and helpers'), ('flightdeck/testbench/fixtures/sample-project/', 'the small project every temp repo is built from'), ('flightdeck/testbench/fixtures/sample-spec/', 'golden spec, map, plan'), ('flightdeck/testbench/fixtures/sample-launch/', 'a complete v1 launch folder'), ('flightdeck/testbench/benches/rubrics/', 'rubric calibration bench'), ('flightdeck/testbench/suites/', 'the thirty tracked v1 suites')])
group('library — the sources', [('library/terms.md', ''), ('library/source/orchestrator-pattern/', 'the source pattern documents'), ('library/flightcrew/creating-harness-documents.md', ''), ('library/spec/interview-session-conventions.md', ''), ('library/rubrics/rubric-guide.md', ''), ('library/review/adversarial-mandate.md', '')])
group('launch', [('flightdeck/launch/README.md', ''), ('flightdeck/launch/RUNLOG.md', ''), ('flightdeck/launch/specs/flightcrew-v1/', 'the v1 spec series and its interview'), ('flightdeck/launch/flightcrew-buildout/', 'first v1 run folder'), ('flightdeck/launch/flightcrew-buildout-2/', 'second v1 run folder')])
def item(g, p, d):
    n = esc(p)
    radios = ''.join(f'<label><input type="radio" name="{n}" value="{v}"> {v}</label>' for v in ('keep', 'goes', 'unsure'))
    return f'<div class="it" data-path="{n}"><code>{n}</code><span class="d">{esc(d)}</span><div class="r">{radios}<input type="text" placeholder="comment"></div></div>'
body = ''.join(f'<section class="g" data-group="{esc(t)}"><h2>{esc(t)} <em>{len(items)}</em><button class="ghost" onclick="setAll(this,\'keep\')">all keep</button><button class="ghost" onclick="setAll(this,\'goes\')">all goes</button></h2>{"".join(item(t, p, d) for p, d in items)}</section>' for t, items in groups)
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><title>flightcrew inventory</title><style>
:root{{--bg:#0f1115;--panel:#171a21;--line:#2a2f3a;--fg:#e6e6e6;--dim:#9aa3b2;--acc:#7cc4ff;--rec:#3ddc97;--bad:#ff7c7c}}
body{{margin:0;font:14px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--fg)}}
header{{position:sticky;top:0;background:var(--bg);border-bottom:1px solid var(--line);padding:10px 24px;display:flex;gap:12px;align-items:center;z-index:2}}
header h1{{font-size:16px;margin:0;flex:1}} button{{background:var(--acc);color:#000;border:0;border-radius:6px;padding:6px 12px;font-weight:600;cursor:pointer}}
button.ghost{{background:transparent;color:var(--acc);border:1px solid var(--acc);font-size:11px;padding:2px 8px;margin-left:8px}}
main{{max-width:1100px;margin:0 auto;padding:20px}} .lead{{color:var(--dim)}}
.g{{border:1px solid var(--line);border-radius:12px;padding:4px 16px 12px;margin:16px 0}} .g>h2{{font-size:13px;letter-spacing:.06em;color:var(--dim);margin:10px 0 4px}} .g>h2 em{{color:var(--rec);font-style:normal;margin-left:6px}}
.it{{display:grid;grid-template-columns:1fr;gap:2px;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:8px 12px;margin:6px 0}}
.it[data-c="keep"]{{border-color:var(--rec)}} .it[data-c="goes"]{{border-color:var(--bad)}} .it[data-c="unsure"]{{border-color:var(--acc)}}
.it code{{color:var(--acc);font-size:13px}} .d{{color:var(--dim);font-size:12.5px}}
.r{{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px}} .r label{{border:1px solid var(--line);border-radius:6px;padding:2px 8px;cursor:pointer;font-size:12.5px}}
.r input[type=text]{{flex:1;min-width:200px;background:#0b0d11;color:var(--fg);border:1px solid var(--line);border-radius:6px;padding:4px 8px;font:inherit}}
#out{{white-space:pre-wrap;background:#0b0d11;border:1px solid var(--line);border-radius:8px;padding:12px;font:12px ui-monospace,monospace;display:none}}
</style></head><body><header><h1>flightcrew inventory · keep / goes / unsure</h1><span id="count" class="lead"></span><button onclick="copyAll()">Copy answers</button></header>
<main><p class="lead">Every current part of the system, grouped by folder. Tick each one. Keep means the characterization suite covers it; goes means the rebuild removes or replaces it and the suite ignores it; unsure becomes a question. A comment on a keep can say what about it is kept (its behaviour, its shape, its bytes).</p>{body}<div id="out"></div></main>
<script>
document.addEventListener('change',e=>{{if(e.target.type==='radio'){{e.target.closest('.it').dataset.c=e.target.value;count();}}}});
function setAll(b,v){{b.closest('.g').querySelectorAll('.it').forEach(i=>{{const r=i.querySelector(`input[value="${{v}}"]`);r.checked=true;i.dataset.c=v;}});count();}}
function count(){{const a=[...document.querySelectorAll('.it')];const n=a.filter(i=>i.dataset.c).length;document.getElementById('count').textContent=n+' / '+a.length+' ticked';}}
function collect(){{const L=[];document.querySelectorAll('.g').forEach(g=>{{L.push('## '+g.dataset.group);g.querySelectorAll('.it').forEach(i=>{{const c=i.querySelector('input[type=text]').value.trim();L.push('- '+i.dataset.path+': '+(i.dataset.c||'(none)')+(c?' — '+c:''));}});L.push('');}});return L.join('\\n');}}
async function copyAll(){{const t=collect();try{{await navigator.clipboard.writeText(t);}}catch(e){{}}const o=document.getElementById('out');o.textContent=t;o.style.display='block';o.scrollIntoView({{behavior:'smooth'}});}}
count();
</script></body></html>'''
out = os.path.join(here, 'pages', 'inventory.html'); os.makedirs(os.path.dirname(out), exist_ok=True); open(out, 'w').write(page)
print('rendered', out, sum(len(i) for _, i in groups), 'items')
