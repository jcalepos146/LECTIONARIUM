"""Builds the site from the modules in this folder.

  python3 src/assemble.py                 -> index.html at the repo root (GitHub Pages build, peer-to-peer live sessions)
  python3 src/assemble.py --standalone    -> build/lectionarium.html (no peer-to-peer; for hosts with their own session store)
"""
import sys, os
os.chdir(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://jcalepos146.github.io/LECTIONARIUM/"
REPO = "https://github.com/jcalepos146/LECTIONARIUM"
def build(head="page_head.html", mass="mass.js", today="today.js", p2p=False):
    d1='<script type="application/json" id="lect-data">'+open("pagedata.json").read().strip()+'</script>'
    d2='<script type="application/json" id="lect-extra">'+open("extradata.json").read().strip()+'</script>'
    parts=[open(head).read().rstrip("\n").replace("</style>", open("sanctuary.css").read()+"\n</style>"), open("page_body.html").read().rstrip("\n").replace('<section id="tradition-sources" aria-label="Tradition directory sources"></section>', '<section id="tradition-sources" aria-label="Tradition directory sources">'+open("tradition_sources.html").read()+"</section>"), d1, d2]
    for f in ("page_script.js","music.js","participation.js",mass)+(("p2p.js",) if p2p else ())+("tools.js","mytexts.js",today,"sanctuary.js"):
        parts.append("<script>\n"+open(f).read().rstrip("\n")+"\n</script>")
    return "\n".join(parts)+"\n"
GH_DESC = ("Pray the Mass or the Divine Office for any day: Novus Ordo, 1962, pre-1955, Ordinariate and Byzantine, "
           "with complete public-domain texts where they exist (the traditional Missal and Breviary in Latin and English, "
           "with chant) and a clearly marked guide where they do not. Fit a service to anything from 15 minutes to full "
           "length and run live group sessions with assigned parts.")
def gh(base, repo_url):
    """The public build: a whole HTML document with the tags link previews (Discord, iMessage, Slack) read."""
    import html
    body = build(p2p=True)
    body = body.replace("<title>Lectionarium</title>\n", "").replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")
    body = body.replace("<footer>Lectionarium · public-domain texts in full, copyrighted texts cited · consult the approved liturgical books for celebration.</footer>",
        f'<footer>Lectionarium · public-domain texts in full, copyrighted texts cited · consult the approved liturgical books for celebration · <a href="{repo_url}">Source on GitHub</a></footer>')
    split = body.index("</style>") + len("</style>")
    d = html.escape(GH_DESC, quote=True); t = "Lectionarium · the Mass and the Office in every Catholic rite"
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
