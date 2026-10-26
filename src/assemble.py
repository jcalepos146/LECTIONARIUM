"""Builds the site from the modules in this folder.

  python3 src/assemble.py                 -> index.html at the repo root (GitHub Pages build, peer-to-peer live sessions),
                                             and service.js, the service builders it loads on demand
  python3 src/assemble.py --standalone    -> build/lectionarium.html (no peer-to-peer; for hosts with their own session store)
"""
import sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://jcalepos146.github.io/LECTIONARIUM/"
REPO = "https://github.com/jcalepos146/LECTIONARIUM"
SERVICE = ("music.js", "mass.js", "office.js", "tools.js")   # the service builders, the Office and the session tools: loaded on demand (window.LectLoad) in the published site
def service_js():
    return "\n".join(open(f).read().rstrip("\n") for f in SERVICE) + "\n"
def build(head="page_head.html", mass="mass.js", today="today.js", p2p=False, split=False):
    d1='<script type="application/json" id="lect-data">'+open("pagedata.json").read().strip()+'</script>'
    d2='<script type="application/json" id="lect-extra">'+open("extradata.json").read().strip()+'</script>'
    parts=[open(head).read().rstrip("\n").replace("</style>", open("sanctuary.css").read()+"\n</style>"), open("page_body.html").read().rstrip("\n").replace('<section id="tradition-sources" aria-label="Tradition directory sources"></section>', '<section id="tradition-sources" aria-label="Tradition directory sources">'+open("tradition_sources.html").read()+"</section>"), d1, d2]
    files=("page_script.js","music.js","participation.js","lectionary.js",mass,"office.js")+(("p2p.js",) if p2p else ())+("tools.js","mytexts.js",today,"compareday.js","psalter.js","sanctuary.js")
    for f in files:
        if split and f in SERVICE:
            continue
        code=open(f).read().rstrip("\n")
        if split and f=="page_script.js":
            import hashlib
            code=code.replace('/*SERVICE-URL*/""','"service.js?v='+hashlib.md5(service_js().encode()).hexdigest()[:10]+'"')
        parts.append("<script>\n"+code+"\n</script>")
    return "\n".join(parts)+"\n"
def offline_packs():
    """The Office packs (breviary/<key>/) that "Save for offline use" can also fetch, one at a time: {key: {files, bytes}}."""
    import glob
    out = {}
    for d in sorted(glob.glob("../breviary/*/")):
        files = sorted(p[3:] for p in glob.glob(d + "*.json"))
        out[d.rstrip("/").split("/")[-1]] = {"files": files, "bytes": sum(os.path.getsize("../" + f) for f in files)}
    return out
def offline_worker(page, svc):
    """sw.js: the offline worker (src/sw.js) with its version, core files and the data "Save for offline use" fetches.
    The data is every calendar year, data file and Bible the site reads; each Office pack (breviary/<key>/, 11-24 MB)
    is saved on its own, when asked for, and is otherwise cached as it is opened."""
    import hashlib, json, glob
    root = ".."
    save = sorted(p[len(root) + 1:] for pat in ("days/*.json", "data/*.json", "bible/*/*.json") for p in glob.glob(f"{root}/{pat}"))
    save += [f for f in ("bcp-office.json", "chant.json", "hymns.json", "ordo.json", "propers-1962.json", "propers-pre55.json") if os.path.exists(f"{root}/{f}")]
    core = ["./", "index.html", "service.js?v=" + hashlib.md5(svc.encode()).hexdigest()[:10], "favicon.svg", "favicon-32.png", "apple-touch-icon.png"]
    P = offline_packs()
    import re
    listed = json.loads(re.sub(r"(\w+):", r'"\1":', re.search(r"const PACKS=(\{.*?\});", open("page_script.js").read()).group(1)))
    actual = {k: round(v["bytes"] / 1e6) for k, v in P.items()}
    if P and listed != actual:
        raise SystemExit(f"page_script.js PACKS {listed} does not match breviary/ {actual}: update it")
    packs = {k: v["files"] for k, v in P.items()}
    version = hashlib.md5((page + svc + json.dumps(save) + json.dumps(packs)).encode()).hexdigest()[:10]
    s = open("sw.js").read()
    for k, v in (("VERSION", json.dumps(version)), ("CORE", json.dumps(core)), ("SAVE", json.dumps(save)), ("PACKS", json.dumps(packs))):
        s = s.replace(f'/*{k}*/' + {"VERSION": '"dev"', "PACKS": "{}"}.get(k, "[]"), f"/*{k}*/" + v, 1)
    return s
GH_DESC = ("Pray the Eucharist and the daily office in Catholic, Orthodox, Oriental, Anglican, Lutheran, Reformed "
           "and Methodist rites, each with the Bible readings of its own lectionary for the day. Complete public-domain "
           "texts where they exist, a clearly marked guide where they do not. Fit a service to any length and pray it "
           "together in live group sessions.")
def gh(base, repo_url):
    """The public build: a whole HTML document with the tags link previews (Discord, iMessage, Slack) read."""
    import html
    body = build(p2p=True, split=True)
    body = body.replace("<title>Lectionarium</title>\n", "").replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    body = body.replace("<footer>Lectionarium · public-domain texts in full, copyrighted texts cited · consult the approved liturgical books for celebration.</footer>",
        f'<footer>Lectionarium · public-domain texts in full, copyrighted texts cited · consult the approved liturgical books for celebration · <a href="{repo_url}">Source on GitHub</a></footer>')
    split = body.index("</style>") + len("</style>")
    d = html.escape(GH_DESC, quote=True); t = "Lectionarium · the liturgy of every Christian tradition, for any day"
    head = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Lectionarium</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{base}">
<meta name="theme-color" content="#A3291C">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Lectionarium">
<meta property="og:title" content="{html.escape(t)}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{base}">
<meta property="og:image" content="{base}og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Lectionarium in blackletter with an illuminated initial and a Chi-Rho medallion, on vellum">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{html.escape(t)}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="{base}og.png">
<link rel="icon" href="favicon.svg" type="image/svg+xml">
<link rel="icon" href="favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
"""
    return head + body[:split] + "\n</head>\n<body>\n" + body[split:].lstrip("\n") + "</body>\n</html>\n"
if "--standalone" in sys.argv:
    os.makedirs("../build", exist_ok=True); out = build(); open("../build/lectionarium.html", "w").write(out); print("build/lectionarium.html", len(out.encode()), "bytes")
else:
    out = gh(BASE, REPO); open("../index.html", "w").write(out); print("index.html", len(out.encode()), "bytes")
    svc = service_js(); open("../service.js", "w").write(svc); print("service.js", len(svc.encode()), "bytes")
    sw = offline_worker(out, svc); open("../sw.js", "w").write(sw); print("sw.js", len(sw.encode()), "bytes")
