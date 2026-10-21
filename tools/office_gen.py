"""Full texts of the traditional Office, generated with the Divinum Officium engine (MIT licence).

For each date, version and hour, the engine (web/cgi-bin/horas/officium.pl, run with a minimal CGI
stand-in) renders the hour in Latin and English; this script turns each two-column row into compact
HTML and stores the rows in a de-duplicated string table.

  python3 office_gen.py gen  <version-key> <start> <end> [chant]   -> cache/<key>[-chant]/<iso>.json
  python3 office_gen.py pack <version-key> [chant]                 -> office/<key>[-chant]/...
"""
import os, re, sys, json, gzip, html, subprocess, datetime as dt
from concurrent.futures import ThreadPoolExecutor

HERE = os.path.dirname(os.path.abspath(__file__))
DO = os.path.join(HERE, "do", "web", "cgi-bin", "horas", "officium.pl")
STUB = os.path.join(HERE, "..", "tools2", "perlstub")
VERSIONS = {"br62": "Rubrics 1960 - 1960", "br55": "Divino Afflatu - 1954", "mon": "Monastic - 1963", "op": "Ordo Praedicatorum - 1962"}
HOURS = ["Matutinum", "Laudes", "Prima", "Tertia", "Sexta", "Nona", "Vespera", "Completorium"]


def run(version, iso, hour, chant=False):
    y, m, d = iso.split("-")
    q = {"command": "pray" + hour, "date1": f"{m}-{d}-{y}", "version": version, "lang2": "English", "content": "1"}
    if chant: q["lang1"] = "Latin-gabc"
    env = dict(os.environ, QUERY_STRING="&".join(f"{k}={v.replace(' ', '%20')}" for k, v in q.items()))
    r = subprocess.run(["perl", "-I", STUB, DO], env=env, capture_output=True, timeout=120)
    return r.stdout.decode("utf-8", "replace")


ROLE_HEAD = re.compile(r"^(Lectio|Lesson|Capitulum|Chapter|Lectio brevis|Short Lesson|Martyrologium|Martyrology|Regula|Rule|Evangelium|Gospel)", re.I)


def clean_cell(c):
    c = re.sub(r"<DIV ALIGN='right'>.*?</DIV>", "", c, flags=re.S | re.I)
    gabc = []
    def keep_gabc(m):
        gabc.append(html.unescape(m.group(1)).strip()); return f"\x00G{len(gabc)-1}\x00"
    c = re.sub(r"<DIV ID=\"GABC[^\"]*\" class=\"GABC\">(.*?)</DIV>\s*<DIV ID=\"GCHANT[^\"]*\"[^>]*></DIV>", keep_gabc, c, flags=re.S)
    c = re.sub(r"<FONT SIZE='\+1' COLOR=\"red\"><B><I>(\w)</I></B></FONT>", r"<b class=ini>\1</b>", c)
    c = re.sub(r"<FONT SIZE='\+1' COLOR=\"red\"><B><I>(.*?)</I></B></FONT>", lambda m: f"\x01H{m.group(1)}\x01", c, flags=re.S)
    c = re.sub(r"<FONT SIZE='\+2' COLOR=\"red\"><B><I>(.*?)</I></B></FONT>", r"<b class=ini>\1</b>", c, flags=re.S)
    c = re.sub(r"<FONT SIZE='1' COLOR=\"red\">(\d+:\d+[a-z]?)</FONT>", r"<sup>\1</sup>", c)
    c = re.sub(r"<FONT SIZE='1' COLOR=\"red\">‡</FONT>", "", c)
    c = re.sub(r"<FONT COLOR=\"red\"><I>([℣℟]\.|R\.br\.|Ant\.|V\.|R\.)</I></FONT>", r"<span class=sp>\1</span>", c)
    c = re.sub(r"<FONT COLOR=\"red\"><I>(.*?)</I></FONT>", r"<i class=rubi>\1</i>", c, flags=re.S)
    c = re.sub(r"<FONT SIZE='-1'\s*>(.*?)</FONT>", r"<i class=ofn>\1</i>", c, flags=re.S)
    c = re.sub(r"<span style='color:red; font-size:1.25em'>([✠+])</span>", r"<span class=cross>\1</span>", c)
    c = re.sub(r"<(?!/?(b|i|sup|span|br)\b)[^>]+>", "", c, flags=re.I)        # drop FONT, A, DIV and the rest
    c = re.sub(r"<br\s*/?>", "\n", c, flags=re.I)
    out, role = [], "all"
    for ln in c.split("\n"):
        ln = ln.strip()
        if not ln: continue
        m = re.match(r"^\x01H(.*?)\x01\s*(.*)$", ln)
        if m:
            t = re.sub(r"<[^>]+>", "", m.group(1)).strip()
            role = "lec" if ROLE_HEAD.match(t) else "all"
            out.append(f"<h5 class=sub>{t}</h5>" + (f"<p class=rub>{m.group(2)}</p>" if m.group(2).strip() else ""))
            continue
        if "\x00G" in ln:
            pre = re.sub(r"<[^>]+>", "", ln.split("\x00G")[0]).strip()
            for gi in re.findall(r"\x00G(\d+)\x00", ln):
                out.append(f"<div class=gch data-r=all data-t=\"{html.escape(pre)}\"><pre class=gabc>" + html.escape(gabc[int(gi)]) + "</pre></div>")
            continue
        if ln.startswith("<i class=rubi>") and ln.endswith("</i>") or ln.startswith("<i class=ofn>"):
            out.append(f"<p class=rub>{ln}</p>"); continue
        r = role
        if ln.startswith("<span class=sp>℣.</span>") or ln.startswith("<span class=sp>V.</span>"): r = "cel"
        elif ln.startswith("<span class=sp>℟.") or ln.startswith("<span class=sp>R."): r = "ppl"
        out.append(f"<p data-r={r}>{ln}</p>")
    return end_lesson("".join(out))


def parse(page):
    title = re.search(r"<P ALIGN=CENTER><FONT[^>]*>(.*?)</FONT>", page, re.S)
    rows = []
    for tr in re.findall(r"<TR>(.*?)</TR>", page, re.S | re.I):
        tds = re.findall(r"<TD[^>]*>(.*?)</TD>", tr, re.S | re.I)
        if len(tds) != 2: continue
        rows.append([clean_cell(tds[0]), clean_cell(tds[1])])
    return {"t": html.unescape(re.sub(r"<[^>]+>", "", title.group(1))).strip() if title else "", "rows": rows}


def gen(key, start, end, chant=False):
    ver = VERSIONS[key]; out = os.path.join(HERE, "cache", key + ("-chant" if chant else "")); os.makedirs(out, exist_ok=True)
    d0, d1 = dt.date.fromisoformat(start), dt.date.fromisoformat(end)
    dates = [(d0 + dt.timedelta(i)).isoformat() for i in range((d1 - d0).days + 1)]
    dates = [x for x in dates if not os.path.exists(os.path.join(out, x + ".json.gz"))]
    hours = HOURS if not chant else ["Laudes", "Prima", "Tertia", "Sexta", "Nona", "Vespera", "Completorium"]
    def one(iso):
        res = {}
        for h in hours:
            try: res[h] = parse(run(ver, iso, h, chant))
            except Exception as e: res[h] = {"t": "", "rows": [], "err": str(e)[:200]}
        tmp = os.path.join(out, iso + ".part")
        with gzip.open(tmp, "wt", encoding="utf-8") as fh:
            json.dump(res, fh, ensure_ascii=False, separators=(",", ":"))
        os.replace(tmp, os.path.join(out, iso + ".json.gz"))
        return iso
    with ThreadPoolExecutor(max_workers=2) as ex:
        for i, iso in enumerate(ex.map(one, dates)):
            if i % 50 == 0: print(key, iso, flush=True)


ELEM = re.compile(r"<(h5|p|div)\b[^>]*>.*?</\1>", re.S)


def end_lesson(c):
    """A lesson ends at its response (Deo gratias); what follows in the same block (the hymn after the chapter) is everyone's."""
    parts = re.split(r"(<h5 class=sub>.*?</h5>)", c)
    for i, p in enumerate(parts):
        m = re.search(r"<p data-r=ppl>[^<]*(?:<span class=sp>[^<]*</span>)?\s*(Deo grátias|Deo gratias|Thanks be to God)[^<]*</p>", p)
        if m: parts[i] = p[:m.end()] + p[m.end():].replace("<p data-r=lec>", "<p data-r=all>")
    return "".join(parts)


def fix_cell(c):
    c = end_lesson(c)
    c = re.sub(r"<h5 class=sub>(\w)</h5><p class=rub>(.*?)</p>", r"<p data-r=all><b class=ini>\1</b>\2</p>", c)
    c = re.sub(r"<h5 class=sub>(\w)</h5>", r"", c)
    return re.sub(r"<span style='color:red; font-size:1.25em'>([✠+])</span>", r"<span class=cross>\1</span>", c)


def retitle(key):
    """Fill titles left blank by the first title pattern (feast days print a second line under the title)."""
    src = os.path.join(HERE, "cache", key); ver = VERSIONS[key]
    def one(f):
        p = os.path.join(src, f)
        try:
            with gzip.open(p, "rt", encoding="utf-8") as fh: J = json.load(fh)
        except Exception: return 0
        iso, n, day = f[:10], 0, None
        for h, v in J.items():
            if v["t"]: continue
            if h in ("Vespera", "Completorium"): t = parse(run(ver, iso, h))["t"]
            else:
                if day is None: day = parse(run(ver, iso, "Laudes"))["t"]
                t = day
            if t: v["t"] = t; n += 1
        if n:
            with gzip.open(p + ".tmp", "wt", encoding="utf-8") as fh: json.dump(J, fh, ensure_ascii=False, separators=(",", ":"))
            os.replace(p + ".tmp", p)
        return n
    with ThreadPoolExecutor(max_workers=2) as ex: print(key, "titles filled:", sum(ex.map(one, sorted(x for x in os.listdir(src) if x.endswith(".json.gz")))))


def pack(key, shard_kb=1500):
    """One version's text and chant runs -> line table, row table (both sharded) and a day index per month.
    Lines and rows are numbered in order of first appearance, so a month's new material sits in a few shards."""
    srcs = [("", os.path.join(HERE, "cache", key))]
    if os.path.isdir(os.path.join(HERE, "cache", key + "-chant")): srcs.append(("c:", os.path.join(HERE, "cache", key + "-chant")))
    dst = os.path.join(HERE, "breviary", key); os.makedirs(dst, exist_ok=True)
    for f in os.listdir(dst): os.remove(os.path.join(dst, f))
    lines, lid, rows, rid, months = [], {}, [], {}, {}
    def L(x):
        if x not in lid: lid[x] = len(lines); lines.append(x)
        return lid[x]
    def R(cell_la, cell_en):
        cell_la, cell_en = fix_cell(cell_la), fix_cell(cell_en)
        k = (tuple(L(e.group(0)) for e in ELEM.finditer(cell_la)), tuple(L(e.group(0)) for e in ELEM.finditer(cell_en)))
        if k not in rid: rid[k] = len(rows); rows.append([list(k[0]), list(k[1])])
        return rid[k]
    dates = sorted(f[:10] for f in os.listdir(srcs[0][1]) if f.endswith(".json.gz"))
    for iso in dates:
        day = {}
        for pre, src in srcs:
            p = os.path.join(src, iso + ".json.gz")
            if not os.path.exists(p): continue
            try:
                with gzip.open(p, "rt", encoding="utf-8") as fh: J = json.load(fh)
            except Exception: continue          # still being written
            for h, v in J.items():
                day[pre + h] = [v["t"], [R(a, b) for a, b in v["rows"]]]
        months.setdefault(iso[:4], {})[iso] = day        # one day index per year keeps the file count low
    def shard(items, name):
        out, cur, size, start = [], [], 0, 0
        for i, x in enumerate(items):
            b = len(json.dumps(x, ensure_ascii=False))
            if cur and size + b > shard_kb * 1024:
                out.append((start, cur)); start = i; cur = []; size = 0
            cur.append(x); size += b
        if cur: out.append((start, cur))
        for n, (st, chunk) in enumerate(out):
            json.dump({"start": st, "v": chunk}, open(os.path.join(dst, f"{name}-{n:03d}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
        return [[st, len(c)] for st, c in out]
    man = {"version": key, "lines": shard(lines, "l"), "rows": shard(rows, "r"), "years": sorted(months), "chant": len(srcs) > 1}
    for yr, d in months.items():
        json.dump(d, open(os.path.join(dst, f"y-{yr}.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    json.dump(man, open(os.path.join(dst, "manifest.json"), "w"), separators=(",", ":"))
    tot = sum(os.path.getsize(os.path.join(dst, f)) for f in os.listdir(dst))
    print(key, len(lines), "lines", len(rows), "rows", len(man["lines"]), "+", len(man["rows"]), "shards", len(months), "years;", tot // 1024 // 1024, "MB in", len(os.listdir(dst)), "files")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "gen": gen(sys.argv[2], sys.argv[3], sys.argv[4], len(sys.argv) > 5 and sys.argv[5] == "chant")
    elif cmd == "pack": pack(sys.argv[2])
    elif cmd == "retitle": retitle(sys.argv[2])
    elif cmd == "one":
        p = parse(run(VERSIONS[sys.argv[2]], sys.argv[3], sys.argv[4], len(sys.argv) > 5))
        print(p["t"]); print(json.dumps(p["rows"][:3], ensure_ascii=False)[:3000]); print(len(p["rows"]), "rows")
