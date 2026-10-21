"""Coverdale psalter (1662 Book of Common Prayer text) from the uploaded EPUB -> site/bible/cv/Ps.json; then run tools/shard_bible.py to pack it.
Only the public-domain psalter text is taken; the edition's introduction and apparatus are not used."""
import zipfile, re, html, glob, json, sys
z = zipfile.ZipFile(sys.argv[1])
src = "".join(z.read(n).decode("utf8") for n in sorted(x for x in z.namelist() if "chapter027" in x))
paras = re.findall(r'<p class="([^"]+)"[^>]*>(.*?)</p>', src, re.S)
def clean(t):
    t = re.sub(r'<span epub:type="pagebreak"[^>]*/>', "", t)
    t = re.sub(r'<span class="dropcaps">(\w)</span>', r"\1", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    t = re.sub(r"\s+", " ", t).replace(" :", ":").replace(" ;", ";").strip()
    # the opening word(s) of each psalm or section are printed in capitals
    t = re.sub(r"^((?:O |LORD |LORD, )?)([A-Z][A-Z’']+)\b", lambda m: m.group(1).title().replace("Lord ", "Lord ") + m.group(2).capitalize(), t)
    return t.replace("O Come", "O come").replace("O Praise", "O praise").replace("O Sing", "O sing").replace("O Give", "O give").replace("O God", "O God")
P, cur = {}, None
for cls, body in paras:
    t = clean(body)
    if cls == "section":
        m = re.search(r"PSALM\s+(\d+)", t.upper())
        if m: cur = int(m.group(1)); P.setdefault(cur, [])
        continue
    if cur is None or not cls.startswith("nonindent"): continue
    m = re.match(r"^(\d+)\s+(.*)$", t)
    if m:
        n = int(m.group(1))
        while len(P[cur]) < n - 1: P[cur].append("")
        P[cur].append(m.group(2))
    elif cls == "nonindent0": P[cur].append(t)          # first verse of a psalm or of a section of Psalm 119
    else: P[cur][-1] += " " + t
empty = [(k, i + 1) for k, v in P.items() for i, x in enumerate(v) if not x]
print(len(P), "psalms;", sum(len(v) for v in P.values()), "verses; empty:", empty[:5])
json.dump([P.get(k, []) for k in range(1, 151)], open(sys.argv[2], "w"), ensure_ascii=False)
