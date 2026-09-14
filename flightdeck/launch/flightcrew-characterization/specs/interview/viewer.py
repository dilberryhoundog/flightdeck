#!/usr/bin/env python3
"""Render a self-contained spec viewer page from a spec draft.

usage: python3 viewer.py <spec.vN.json> [out.html]
Every node is shown with its data, an agree/disagree toggle and a comment box.
Each domain has a Copy button that yields a block ready to paste into chat:

    ## <domain>
    ### <id>
    decision: agree | disagree | (undecided)
    comment: ...
"""
import json, sys, html, os

src = sys.argv[1]
out = sys.argv[2] if len(sys.argv) > 2 else os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pages', 'spec-viewer.html')
spec = json.load(open(src))
esc = html.escape

DOMAINS = [('intent', 'Intent'), ('scope', 'Scope'), ('constraints', 'Constraints'), ('interfaces', 'Interfaces'),
           ('behaviours', 'Behaviours'), ('edges', 'Edges'), ('decisions', 'Decisions'),
           ('verification', 'Verification'), ('acceptance', 'Acceptance'), ('open_questions', 'Open questions'), ('retired', 'Retired')]

def nodes_of(key):
    v = spec.get(key)
    if v is None: return []
    return v if isinstance(v, list) else [v]

def node_html(key, n):
    nid = n.get('id', '?')
    meta = []
    for k in ('status', 'kind', 'name', 'reuse', 'at'):
        if k in n and n[k] not in (None, ''):
            meta.append(f'<span class="tag">{esc(k)}: {esc(str(n[k]))}</span>')
    body = f'<p class="text">{esc(n.get("text", ""))}</p>'
    if n.get('note'):
        body += f'<p class="note">note: {esc(n["note"])}</p>'
    controls = '' if key in ('retired',) else f'''
  <div class="ctl">
    <button class="dec agree" data-v="agree" onclick="pick(this)">agree</button>
    <button class="dec disagree" data-v="disagree" onclick="pick(this)">disagree</button>
    <textarea placeholder="Comment (disagree = further discussion)"></textarea>
  </div>'''
    return f'''<div class="node" data-id="{esc(nid)}" data-dec="">
  <h3><span>{esc(nid)}</span>{" ".join(meta)}</h3>
  {body}{controls}
</div>'''

sections = []
for key, title in DOMAINS:
    ns = nodes_of(key)
    if not ns: continue
    inner = "\n".join(node_html(key, n) for n in ns)
    copy = '' if key == 'retired' else f'<button onclick="copyDomain(\'{key}\')">Copy {esc(title.lower())}</button>'
    sections.append(f'''<section class="domain" data-domain="{key}">
<h2>{esc(title)} <em>{len(ns)}</em> {copy}</h2>
{inner}
</section>''')

header = f"{esc(spec.get('name',''))} · v{spec.get('version')} · {esc(spec.get('status',''))}"
reason = esc(spec.get('reason', ''))

page = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>spec viewer · {header}</title>
<style>
  :root {{ --bg:#0f1115; --panel:#171a21; --line:#2a2f3a; --fg:#e6e6e6; --dim:#9aa3b2; --acc:#7cc4ff; --rec:#3ddc97; --bad:#ff7c7c; }}
  body {{ margin:0; font:15px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:var(--bg); color:var(--fg); }}
  header {{ position:sticky; top:0; background:var(--bg); border-bottom:1px solid var(--line); padding:12px 24px; display:flex; gap:16px; align-items:center; z-index:2; }}
  header h1 {{ font-size:16px; margin:0; flex:1; }}
  button {{ background:var(--acc); color:#000; border:0; border-radius:6px; padding:6px 12px; font-weight:600; cursor:pointer; }}
  button.ghost {{ background:transparent; color:var(--acc); border:1px solid var(--acc); }}
  main {{ max-width:1000px; margin:0 auto; padding:24px; }}
  .lead {{ color:var(--dim); font-size:14px; margin:0 0 16px; }}
  nav {{ display:flex; flex-wrap:wrap; gap:8px; margin:0 0 18px; }}
  nav a {{ color:var(--acc); font-size:13px; text-decoration:none; border:1px solid var(--line); border-radius:6px; padding:3px 8px; }}
  .domain {{ border:1px solid var(--line); border-radius:12px; padding:6px 18px 14px; margin:18px 0; }}
  .domain > h2 {{ font-size:14px; letter-spacing:.06em; color:var(--dim); margin:10px 0 4px; display:flex; align-items:center; gap:12px; }}
  .domain > h2 em {{ color:var(--rec); font-style:normal; }}
  .domain > h2 button {{ margin-left:auto; font-size:12px; }}
  .node {{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:12px 16px; margin:12px 0; }}
  .node[data-dec="agree"] {{ border-color:var(--rec); }}
  .node[data-dec="disagree"] {{ border-color:var(--bad); }}
  .node h3 {{ margin:0 0 6px; font-size:13px; display:flex; gap:8px; align-items:center; flex-wrap:wrap; }}
  .node h3 span {{ color:var(--acc); font-family:ui-monospace, monospace; font-size:14px; }}
  .tag {{ color:var(--dim); font-size:12px; background:#0b0d11; padding:1px 6px; border-radius:4px; }}
  .text {{ margin:6px 0; }}
  .note {{ color:var(--dim); font-size:13px; margin:4px 0 0; }}
  .ctl {{ display:flex; gap:8px; align-items:flex-start; margin-top:10px; flex-wrap:wrap; }}
  .dec {{ background:transparent; color:var(--dim); border:1px solid var(--line); }}
  .dec.on.agree {{ background:var(--rec); color:#000; border-color:var(--rec); }}
  .dec.on.disagree {{ background:var(--bad); color:#000; border-color:var(--bad); }}
  textarea {{ flex:1; min-width:260px; box-sizing:border-box; background:#0b0d11; color:var(--fg); border:1px solid var(--line); border-radius:6px; padding:8px; min-height:38px; font:inherit; }}
  #out {{ white-space:pre-wrap; background:#0b0d11; border:1px solid var(--line); border-radius:8px; padding:12px; font:12.5px ui-monospace, monospace; display:none; }}
  .toast {{ position:fixed; bottom:20px; right:20px; background:var(--rec); color:#000; padding:8px 14px; border-radius:6px; display:none; font-weight:600; }}
</style>
</head>
<body>
<header>
  <h1>spec viewer · {header}</h1>
  <button class="ghost" onclick="preview()">Preview all</button>
  <button onclick="copyAll()">Copy all</button>
</header>
<main>
<p class="lead">{reason}</p>
<nav>{"".join(f'<a href="#{k}">{esc(t)}</a>' for k,t in DOMAINS if nodes_of(k))}</nav>
{"".join(s.replace('<section class="domain"', f'<section id="{s.split(chr(34))[3]}" class="domain"', 1) for s in sections)}
<section><h2 style="font-size:14px;color:var(--dim)">Preview</h2><div id="out"></div></section>
</main>
<div class="toast" id="toast">Copied</div>
<script>
function pick(btn) {{
  const node = btn.closest('.node');
  const was = btn.classList.contains('on');
  node.querySelectorAll('.dec').forEach(b => b.classList.remove('on'));
  if (!was) {{ btn.classList.add('on'); node.dataset.dec = btn.dataset.v; }} else {{ node.dataset.dec = ''; }}
}}
function collectDomain(sec) {{
  const lines = ['## ' + sec.dataset.domain];
  sec.querySelectorAll('.node').forEach(n => {{
    const c = n.querySelector('textarea')?.value.trim();
    lines.push('### ' + n.dataset.id);
    lines.push('decision: ' + (n.dataset.dec || '(undecided)'));
    if (c) lines.push('comment: ' + c);
  }});
  lines.push('');
  return lines.join('\\n');
}}
function collectAll() {{
  return [...document.querySelectorAll('.domain')].filter(s => s.dataset.domain !== 'retired').map(collectDomain).join('\\n');
}}
async function put(t) {{
  try {{ await navigator.clipboard.writeText(t); }} catch (e) {{ const o = document.getElementById('out'); o.textContent = t; o.style.display = 'block'; o.scrollIntoView({{behavior:'smooth'}}); return; }}
  const s = document.getElementById('toast'); s.style.display = 'block'; setTimeout(() => s.style.display = 'none', 1500);
}}
function copyDomain(key) {{ put(collectDomain(document.querySelector(`.domain[data-domain="${{key}}"]`))); }}
function copyAll() {{ put(collectAll()); }}
function preview() {{ const o = document.getElementById('out'); o.textContent = collectAll(); o.style.display = 'block'; o.scrollIntoView({{behavior:'smooth'}}); }}
</script>
</body>
</html>
'''
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w').write(page)
print('rendered', out)
