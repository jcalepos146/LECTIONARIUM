"""Generate share stubs and seven family cards from the catalog and card.html.
Run from any directory: python3 tools/build_traditions.py
Needs Playwright and Chromium (PLAYWRIGHT_CHROMIUM overrides /usr/bin/chromium).
Family artwork is shared deliberately to keep the published site below 512 files.
"""
import argparse, html, json, os, pathlib, re
from urllib.parse import urlparse
ROOT = pathlib.Path(__file__).resolve().parents[1]
BASE = 'https://jcalepos146.github.io/LECTIONARIUM/'
MARKS = {'catholic':'☧','eastern-orthodox':'✚','oriental':'✣','old-catholic':'⚓','anglican':'✥','lutheran':'✝','reformed':'☷'}

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
            assert (s['type']=='mass' and s['rite'] in ['n','o','m','p','h','b']) or (s['type']=='office' and s['rite'] in ['loth','dwdo','br62','br55','mon','op','byz'])
        seen=set(); cur=n
        while cur['parent']:
            assert cur['id'] not in seen, 'Catalog parent cycle'
            seen.add(cur['id']); cur=next(x for x in rows if x['id']==cur['parent'])
    return rows

def stub(n):
    e=html.escape
    url=BASE+'t/'+n['id']+'/'
    dest=BASE+'#/t/'+n['id']
    image=BASE+'t/cards/'+n['family']+'.png'
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
<meta property="og:image:alt" content="{e(n['family'])} · original Lectionarium family artwork">
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
    template=template[:start]+f'<h1 style="font:64px/1.15 Georgia,serif;margin-top:55px;max-width:700px">{html.escape(name)}</h1><p class="sub">Explore churches, books and liturgical traditions.</p></div><div class="rites">A place to begin</div><div class="feats">Historical sources · Honest text coverage</div>'+template[end:]
    start=template.index('<div class="medal">')
    template=template[:start]+f'<div class="medal" style="display:grid;place-items:center;border:3px double #B8892B;border-radius:50%;font:150px Georgia,serif;color:#A3291C">{MARKS[family]}</div></body></html>'
    return template

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true',help='Validate catalog, stubs, card dimensions and file budget without writing');args=parser.parse_args()
    rows=entries()
    if args.check:
        for n in rows: assert (ROOT/'t'/n['id']/'index.html').read_text()==stub(n), n['id']
        import struct
        for f in MARKS:
            png=(ROOT/'t/cards'/f'{f}.png').read_bytes()
            assert png[:8]==b'\x89PNG\r\n\x1a\n' and struct.unpack('>II',png[16:24])==(1200,630)
        # Git ignored dependencies, caches, and .git are not part of the published site.
        import subprocess
        paths=subprocess.check_output(['git','ls-files','--cached','--others','--exclude-standard'],cwd=ROOT,text=True).splitlines()
        assert len(set(paths))<=512, f'File budget exceeded: {len(set(paths))}'
        print(f'Validated {len(rows)} stubs, 7 cards, {len(set(paths))}/512 project files')
        return
    for n in rows:
        p=ROOT/'t'/n['id']/'index.html';p.parent.mkdir(parents=True,exist_ok=True);p.write_text(stub(n))
    from playwright.sync_api import sync_playwright
    (ROOT/'t/cards').mkdir(parents=True,exist_ok=True)
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM','/usr/bin/chromium'),args=['--no-sandbox'])
        page=browser.new_page(viewport={'width':1200,'height':630},device_scale_factor=1)
        for family in MARKS:
            name=next(n['name'] for n in rows if n['family']==family and n['parent'] is None)
            page.set_content(card(family,name))
            page.screenshot(path=str(ROOT/'t/cards'/f'{family}.png'))
        browser.close()
    print(f'Generated {len(rows)} share pages and seven family cards')

if __name__=='__main__': main()
