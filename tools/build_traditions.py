"""Generate share stubs and church and tradition cards from the catalog and card.html.
Run from any directory: python3 tools/build_traditions.py
Needs Playwright and Chromium (PLAYWRIGHT_CHROMIUM overrides /usr/bin/chromium).
Churches and traditions have individual cards; book editions inherit family artwork.
"""
import argparse, html, json, os, pathlib, re
from urllib.parse import urlparse
ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://jcalepos146.github.io/LECTIONARIUM/'
FAMILY_ROOTS={'catholic':'catholic','eastern-orthodox':'eastern-orthodox','oriental':'oriental-orthodox','old-catholic':'old-catholic','anglican':'anglican','lutheran':'lutheran','reformed':'reformed','methodist':'methodist'}
MARKS = {'catholic':'☧','eastern-orthodox':'✚','oriental':'✣','old-catholic':'⚓','anglican':'✥','lutheran':'✝','reformed':'☷','methodist':'✙'}

def entries():
    rows = json.loads((ROOT/'data/traditions.json').read_text())
    ids = [n['id'] for n in rows]
    assert len(ids)==len(set(ids)), 'Duplicate catalog IDs'
    for n in rows:
        assert re.fullmatch(r'[a-z0-9-]+', n['id'])
        assert n['family'] in MARKS
        assert n['parent'] is None or n['parent'] in ids
        assert n['kind'] in ['church','rite','use','book-edition','jurisdiction']
        assert n['calendar'] in [None,'gregorian','julian','revised-julian']
        for u in n['sources']+[b['source'] for b in n['books']]:
            assert urlparse(u).scheme=='https' and urlparse(u).netloc
        for b in n['books']:
            assert b['status'] in ['public-domain','open-licence','copyright']
        for s in n['supported']:
            assert (s['type']=='mass' and s['rite'] in ['n','o','m','p','h','b','d','a','z','bcp28','bcp62','bcp62bap','bcp62mat','bcp62bur','wes84bap','wes84mat','wes84bur','csbbap','csbmat','csbbur','bcp37','bcp18','bcp29','bcp59','bcp52','bcp49','bcp89','wes84','wes84o','bcp92','bcp79','csb','csbm','csbv','pres','rca','csbse','byzv','byzm','byzh','byzc','csbsm','csbs','csbl','rcus','rcusv','rcusp','me08','arm','copt','adai']) or (s['type']=='office' and s['rite'] in ['loth','dwdo','br62','br55','mon','op','byz','bcp28','bcp79'])
        seen=set(); cur=n
        while cur['parent']:
            assert cur['id'] not in seen, 'Catalog parent cycle'
            seen.add(cur['id']); cur=next(x for x in rows if x['id']==cur['parent'])
    return rows

def sources_html(rows):
    urls=sorted({u for n in rows for u in n['sources']+[b['source'] for b in n['books']]})
    return '<h3>Tradition directory sources</h3>\n<p>See each directory entry for edition rights, territorial limits and source-review status.</p>\n<ul>\n' + ''.join(f'<li><a href="{html.escape(u,quote=True)}" target="_blank" rel="noopener">{html.escape(u)}</a></li>\n' for u in urls) + '</ul>\n'

def stub(n):
    e=html.escape
    url=BASE+'t/'+n['id']+'/'
    dest=BASE+'#/t/'+n['id']
    image_id=n['id'] if n['kind']!='book-edition' else FAMILY_ROOTS[n['family']]
    image=BASE+'t/cards/'+image_id+'.png'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(n['name'])} · Lectionarium</title>
<meta name="description" content="{e(n['self_description'],quote=True)}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(n['name'],quote=True)} · Lectionarium">
<meta property="og:description" content="{e(n['self_description'],quote=True)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="{e(n['name'] if n['kind']!='book-edition' else n['family'],quote=True)} · original Lectionarium artwork">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url={dest}">
</head><body><p><a href="{dest}">Explore {e(n['name'])} in Sanctuary mode</a></p></body></html>
'''

def card(family, name):
    # Reuse the actual vellum, grain and penwork frame from the site's card template.
    template=(ROOT/'tools/card.html').read_text()
    template=re.sub(r'@font-face\{[^}]*\}', '', template)
    template=template.replace('<div class="kick">Missal<b>✠</b>Breviary<b>✠</b>Lectionary</div>', '<div class="kick">Lectionarium · Sanctuary</div>')
    start=template.index('<div class="mast">')
    end=template.index('<div class="medal">', start)
    size=64 if len(name)<30 else 52 if len(name)<60 else 42
    template=template[:start]+f'<h1 style="font:{size}px/1.15 Georgia,serif;margin-top:55px;max-width:700px">{html.escape(name)}</h1><p class="sub">Explore churches, books and liturgical traditions.</p></div><div class="rites">A place to begin</div><div class="feats">Historical sources · Honest text coverage</div>'+template[end:]
    start=template.index('<div class="medal">')
    mark='<svg viewBox="0 0 100 100" width="180" height="180" aria-hidden="true"><path d="M10 25 Q30 15 50 25 Q70 15 90 25 V80 Q70 70 50 80 Q30 70 10 80 Z M50 25 V80 M20 38 H40 M60 38 H80 M20 50 H40 M60 50 H80" fill="none" stroke="#A3291C" stroke-width="3"/></svg>' if family=='reformed' else MARKS[family]
    template=template[:start]+f'<div class="medal" style="display:grid;place-items:center;border:3px double #B8892B;border-radius:50%;font:150px Georgia,serif;color:#A3291C">{mark}</div></body></html>'
    return template

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--entry',help='Recapture artwork for one entry ID');parser.add_argument('--family',choices=list(MARKS),help='Recapture artwork for one family');parser.add_argument('--metadata-only',action='store_true',help='Refresh stubs and source references without recapturing PNGs');parser.add_argument('--check',action='store_true',help='Validate catalog, stubs, card dimensions and file budget without writing');args=parser.parse_args()
    rows=entries()
    if args.check:
        assert (ROOT/'src/tradition_sources.html').read_text()==sources_html(rows), 'Regenerate tradition source references'
        for n in rows: assert (ROOT/'t'/n['id']/'index.html').read_text()==stub(n), n['id']
        import struct
        art=[n for n in rows if n['kind']!='book-edition']
        for n in art:
            png=(ROOT/'t/cards'/f"{n['id']}.png").read_bytes()
            assert png[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',png[16:24])==(1200,630)
        # Git ignored dependencies, caches, and .git are not part of the published site.
        import subprocess
        paths=[p for p in subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines() if (ROOT/p).is_file()]
        assert len(set(paths))<=512, f'File budget exceeded: {len(set(paths))}'
        print(f'Validated {len(rows)} stubs, {len(art)} cards, {len(set(paths))}/512 project files')
        return
    (ROOT/'src/tradition_sources.html').write_text(sources_html(rows))
    for n in rows:
        p=ROOT/'t'/n['id']/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(stub(n))
    if args.metadata_only: return
    from playwright.sync_api import sync_playwright
    (ROOT/'t/cards').mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1200,'height':630},device_scale_factor=1)
        for n in rows:
            if n['kind']=='book-edition' or (args.family and n['family']!=args.family) or (args.entry and n['id']!=args.entry): continue
            page.set_content(card(n['family'],n['name']))
            page.screenshot(path=str(ROOT/'t/cards'/f"{n['id']}.png"))
        browser.close()
    legacy=ROOT/'t/cards/oriental.png'
    if legacy.exists(): legacy.unlink()
    print(f'Generated {len(rows)} share pages and {sum(n["kind"]!="book-edition" for n in rows)} individual cards')

if __name__=='__main__': main()
