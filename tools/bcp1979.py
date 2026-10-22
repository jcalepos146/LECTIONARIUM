#!/usr/bin/env python3
"""Build data/bcp1979.json from the Online Book of Common Prayer (bcponline.org), the 1979 Book of
Common Prayer of the Episcopal Church, which is not under copyright.

    python3 tools/bcp1979.py SITE_DIR      # SITE_DIR holds the downloaded pages (see FILES below)
    python3 tools/bcp1979.py --check       # CI: the JSON is well formed

Output:
  offices: {mp1, mp2, ep1, ep2, noonday, compline}: [{t, items}] where items are
           [kind, text, role, label] (kinds h, rub, cite, v) or ["slot", name]
  he1, he2: the Holy Eucharist, Rite One and Rite Two, [{t, items}]
  prayers: {"II-B": [items], ...} the alternative Eucharistic Prayers; pop: {"I": [items], ...}
  prefaces: {"1"|"2": {name: [text]}};  collects: {"c"|"t": {title: {"sub", "text": [..], "preface"}}}
  psalter: {"m1": [{"n", "latin", "v": [[num, text], ...]}], "e1": ...}
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "bcp1979.json"
FILES = {"mp1": "mp1.html", "mp2": "mp2.html", "ep1": "ep1.html", "ep2": "ep2.html", "noonday": "noonday.html",
         "compline": "compline.html", "he1": "he1.html", "he2": "he2.html", "altgt": "he2-altgt.html", "pop": "pop.html",
         "pp1": "pphe1.html", "pp2": "pphe2.html"}
COLLECTS = {"c": ["c_seasonsc.html", "c_holydaysc.html", "c_commonc.html", "c_variousc.html"],
            "t": ["c_seasonst.html", "c_holydayst.html", "c_commont.html", "c_varioust.html"]}


def text(b, keep_lines=False):
    b = re.sub(r"<br\s*/?>", "\n", b)
    b = re.sub(r"<[^>]+>", "", b)
    b = html.unescape(b).replace("\xa0", " ").replace("’", "'").replace("“", '"').replace("”", '"')
    if keep_lines:
        lines = [re.sub(r"[ \t]+", " ", l).strip() for l in b.split("\n")]
        return "\n".join(l for l in lines if l)
    return re.sub(r"\s+", " ", b).strip()


def body(path):
    s = path.read_text(encoding="utf-8", errors="replace")
    s = s[s.find("<body"):]
    s = re.sub(r'<p class="(?:topmenu|leftfoot|rightfoot)".*?</p>', "", s, flags=re.S)
    s = re.sub(r"<script.*?</script>", "", s, flags=re.S)
    s = re.sub(r"</?a\b[^>]*>", "", s)                                  # anchors around headings
    s = re.sub(r"<p[^>]*>\s*(?:<br\s*/?>\s*)*(<table)", r"\1", s)            # tables wrapped in a paragraph
    s = re.sub(r"(</table>)\s*(?:<br\s*/?>\s*)*</p>", r"\1", s)
    # text left outside any block (some opening sentences): wrap each run in a paragraph
    s = re.sub(r"(</p>|</table>|</h\d>)((?:(?!<(?:p|table|h\d|hr)\b)[\s\S])*?)(?=<(?:p|table|h\d|hr)\b)",
               lambda m: m.group(1) + "".join("<p>" + seg + "</p>" for seg in re.split(r"(?:<br\s*/?>\s*){2,}", m.group(2))
                                               if re.sub(r"<[^>]+>|&nbsp;|\s", "", seg)), s)
    return s


ROLE = {"People": "ppl", "Celebrant": "cel", "Officiant": "cel", "Deacon": "cel", "Priest": "cel", "Leader": "cel",
        "Reader": "lec", "Lector": "lec", "Minister": "cel", "Bishop": "cel"}
ALL = re.compile(r"^(Our Father|We believe|I believe|Most merciful God|Almighty and most merciful Father|Glory to God in the highest|"
                 r"Glory be to God on high|Holy, holy, holy|Glory to the Father|Glory be to the Father|We do not presume|Lord, have mercy|"
                 r"Christ, have mercy|Kyrie eleison|Christe eleison|Almighty and everliving God, we thank you|Eternal God, heavenly Father|"
                 r"Almighty and everliving God, we most heartily thank thee|Lamb of God|O Lamb of God|Christ our Passover|Alleluia\. Christ our Passover|"
                 r"Almighty God, Father of our Lord Jesus Christ, maker of all things)")


MAJOR = re.compile(r"^(Confession of Sin|The Invitatory and Psalter|The Lessons|The Apostles' Creed|The Prayers|The Collect of the Day|"
                   r"The Nicene Creed|The Prayers of the People|The Peace|The Great Thanksgiving|The Breaking of the Bread|The Sermon|"
                   r"The Holy Communion|The Word of God|The Decalogue|The Offertory|The Dismissal|Postcommunion Prayer)$")
SPEAKER = re.compile(r"<em[^>]*>\s*(Officiant|People|Celebrant|Deacon|Priest|Reader|Answer|Minister|Leader)\s*</em>")


def speakers(b):
    """Split a paragraph with inline speaker labels (<em>Officiant</em> ... <em>People</em> ...) into lines."""
    parts = SPEAKER.split(b)
    if len(parts) < 3:
        return None
    out = []
    if text(parts[0]):
        out.append(["v", text(parts[0]), "cel"])
    for who, t in zip(parts[1::2], parts[2::2]):
        if text(t):
            out.append(["v", text(t), "ppl" if who in ("People", "Answer") else ROLE.get(who, "cel"), who])
    return out


def italic_people(b):
    """Eucharistic Prayer C: lines in italics are spoken by the People."""
    parts = re.split(r"<em>(.*?)</em>", b, flags=re.S)
    if len(parts) < 3:
        return None
    out = []
    for k, seg in enumerate(parts):
        t = text(seg)
        if t:
            out.append(["v", t, "ppl" if k % 2 else "cel", "People" if k % 2 else ""])
    return out


def items(path, people_italic=False):
    """Ordered items of a page: headings, rubrics, speaker tables and paragraphs."""
    s = body(path)
    out = []
    for m in re.finditer(r"<(h[1-6])[^>]*>(.*?)</\1>|<p([^>]*)>(.*?)</p>|<table class=\"(\w+)\"[^>]*>(.*?)</table>", s, re.S):
        if m.group(1):
            t = text(m.group(2))
            if t:
                out.append(["h", t, ""])
        elif m.group(4) is not None:
            attrs, b = m.group(3), m.group(4)
            if 'class="rubric"' in attrs:
                t = text(b)
                if t:
                    out.append(["rub", t, ""])
                continue
            sm = re.match(r"\s*<strong([^>]*)>(.*?)</strong>", b, re.S)
            if sm:                                   # a title: <p id="confession"><strong>Confession of Sin</strong>
                whole = text(b)
                major = 'id="' in attrs or 'id="' in sm.group(1) or bool(MAJOR.match(text(sm.group(2))))
                if text(sm.group(2)).isdigit() or len(whole) < 100:
                    out.append(["h", whole, "" if major and not text(sm.group(2)).isdigit() else "sub"])
                    continue
                out.append(["h", text(sm.group(2)), "" if major else "sub"])
                b = b[sm.end():]
            lead = re.match(r"\s*(?:<br\s*/?>\s*)*<em(?: class=\"rubric\")?>(.*?)</em>\s*(?:<br\s*/?>|&nbsp;)", b, re.S)
            if lead and len(text(lead.group(1))) < 90:      # an italic lead-in: <em>Advent</em><br/> ...
                out.append(["rub", text(lead.group(1)), ""])
                b = b[lead.end():]
            sp = speakers(b) or (italic_people(b) if people_italic else None)
            if sp:
                out.extend(sp); continue
            cite = None
            cm = re.search(r'<em class="small">(.*?)</em>\s*$', b.strip(), re.S)
            if cm:
                cite = text(cm.group(1)); b = b.strip()[:cm.start()]
            t = text(b)
            if t:
                out.append(["v", t, "all" if ALL.match(t) else "cel"])
            if cite:
                out.append(["cite", cite, ""])
        else:
            kind, tb = m.group(5), m.group(6)
            if kind == "ketable":                    # Kyrie: English in the first column, Greek in the last
                rows = [re.findall(r"<td([^>]*)>(.*?)</td>", r, re.S) for r in re.split(r"</?tr[^>]*>", tb)]
                rows = [r for r in rows if r]
                out.append(["v", " ".join(text(r[0][1]) for r in rows), "all"])
                out.append(["rub", "or", ""])
                out.append(["v", " ".join(text(r[-1][1]) for r in rows), "all"])
                continue
            for row in re.split(r"</?tr[^>]*>", tb):     # the source sometimes opens a row with </tr>
                cells = re.findall(r"<td([^>]*)>(.*?)</td>", row, re.S)
                if not cells:
                    continue
                if len(cells) >= 2 and re.search(r'class="(?:vr|bigvr)people"', cells[0][0]):
                    who, t = text(cells[0][1]), text(cells[1][1])
                    if not t:
                        continue
                    if who and not ROLE.get(who.split()[0]) and not who.startswith("The People"):
                        out.append(["rub", who, ""]); who = ""
                    role = "ppl" if who.startswith(("People", "The People")) else ROLE.get(who.split()[0], "cel") if who else "cel"
                    out.append(["v", t, role, who])
                elif len(cells) == 2 and text(cells[0][1]).isdigit():          # a numbered psalm verse
                    out.append(["v", text(cells[0][1]) + " " + text(cells[1][1]), "all"])
                elif len(cells) == 2 and not any("rubric" in a for a, _ in cells):   # two forms side by side
                    for col, (attrs, c) in zip(("colA", "colB"), cells):
                        if text(c):
                            out.append([col, text(c), "all"])
                else:
                    for attrs, c in cells:
                        t = text(c)
                        if t:
                            out.append(["rub" if "rubric" in attrs or "supdirect" in attrs else "v", t, "" if "rubric" in attrs else "all"])
    # consecutive two-column cells (one prayer across a page break): the first form whole, then the second
    res, k = [], 0
    while k < len(out):
        if out[k][0] in ("colA", "colB"):
            run = []
            while k < len(out) and out[k][0] in ("colA", "colB"):
                run.append(out[k]); k += 1
            a = " ".join(t for c, t, _ in run if c == "colA"); b = " ".join(t for c, t, _ in run if c == "colB")
            if a:
                res.append(["v", a, "all"])
            if b:
                res.append(["rub", "or this", ""]); res.append(["v", b, "all"])
            continue
        res.append(out[k]); k += 1
    return [it for it in res if it[1] not in ("Amen.",) or it[0] == "v"]


def steps(its, split=("h",), skip_first=True):
    """Split items into steps at headings (the page title is dropped)."""
    res, cur = [], None
    for it in its:
        if it[0] == "h" and it[2] != "sub" and (cur is None or it[1] not in ("or", "Or")):
            if skip_first and cur is None and res == []:
                cur = {"t": it[1], "items": []}; res.append(cur); continue
            cur = {"t": it[1], "items": []}; res.append(cur); continue
        if cur is None:
            cur = {"t": "", "items": []}; res.append(cur)
        cur["items"].append(it)
    return [s for s in res if s["items"]]


SLOTS = [  # (regex on an item's text, slot name, before/after)
    (r"^The Psalm or Psalms Appointed", "psalms", "after"),
    (r"(?i)^One or (two|more) Lessons", "lessons", "after"),
    (r"^(The Officiant then says one or more of the following Collects|The Collect of the Day)", "collect", "after"),
    (r"^The Celebrant says the Collect", "collect", "after"),
    (r"^The Lessons$", "lessons", "after"),
    (r"^The Sermon$", "sermon", "after"),
    (r"One or two Lessons, as appointed, are read", "lessons", "after"),
    (r"^On Sundays and other Major Feasts there follows", "sermon", "before"),
    (r"^Prayer is offered with intercession", "pop", "after"),
    (r"^Here a Proper Preface is sung or said", "preface", "after"),
]


def with_slots(st):
    for s in st:
        new = []
        for it in s["items"]:
            hit = next((sl for sl in SLOTS if re.search(sl[0], it[1])), None)
            if hit and any(x[0] == "slot" and x[1] == hit[1] for x in new):
                hit = None
            if hit and hit[2] == "before":
                new.append(["slot", hit[1]])
            new.append(it)
            if hit and hit[2] == "after":
                new.append(["slot", hit[1]])
        s["items"] = new
    return st


RESTEP = {   # offices without section headings: split them at these rubrics (title, regex)
    "noonday": [("Opening versicles", r"^O God, make speed"), ("Psalms", r"^One or more of the following Psalms"),
                ("Reading", r"^One of the following, or some other suitable passage"),
                ("Prayers", r"^The Officiant then begins the Prayers"), ("Dismissal", r"^Free intercessions may be offered")],
    "compline": [("Opening", r"^The Officiant begins"), ("Confession", r"^The Officiant may then say"),
                 ("Invitatory", r"^The Officiant then says$"), ("Psalms", r"^One or more of the following Psalms"),
                 ("Reading", r"^One of the following, or some other suitable passage"),
                 ("Hymn and responsory", r"^A hymn suitable for the evening"), ("Prayers", r"^Lord, have mercy\. Christ"),
                 ("Collects", r"^The Officiant then says one of the following Collects"),
                 ("Nunc dimittis", r"^Silence may be kept, and free intercessions"), ("Dismissal and blessing", r"^Let us bless the Lord")]}


def restep(its, anchors):
    its = its[next(i for i, it in enumerate(its) if it[0] == "h") + 1:]
    res, ai = [], 0
    for it in its:
        while ai < len(anchors) and re.search(anchors[ai][1], it[1]):
            res.append({"t": anchors[ai][0], "items": []}); ai += 1
        if res:
            res[-1]["items"].append(it)
    if ai < len(anchors):
        raise SystemExit(f"restep: anchor not found {anchors[ai]}")
    return res


def collects(site):
    out = {}
    for form, files in COLLECTS.items():
        d = out.setdefault(form, {})
        for f in files:
            s = body(site / f)
            cur = None
            for attrs, b in re.findall(r"<p([^>]*)>(.*?)</p>", s, re.S):
                st = re.search(r"<strong>(.*?)</strong>", b, re.S)
                if st:
                    title = text(st.group(1))
                    sub = text(re.sub(r"<strong>.*?</strong>", "", b, flags=re.S))
                    cur = d.setdefault(title, {"sub": sub, "text": [], "preface": ""})
                    continue
                if cur is None or 'class="rubric"' in attrs:
                    if cur is not None and 'class="rubric"' in attrs:
                        cur.setdefault("notes", []).append(text(b))
                    continue
                t = text(b)
                if re.fullmatch(r"(Preface of|Preface for) .*", t):
                    cur["preface"] = t
                elif t:
                    cur["text"].append(t)
    return out


def prefaces(site, f):
    """{name: [text]}: each preface is an italic name (or a bold title) followed by its text."""
    out, cur = {}, None
    for it in items(site / f):
        if it[0] in ("rub", "h") and len(it[1]) < 60 and not it[1].endswith("."):
            cur = it[1]; continue
        if it[0] == "v" and cur:
            out.setdefault(cur, []).append(it[1])
    return out


def psalter(site):
    s = body(site / "the_psalter.html")
    out, day, ps = {}, None, None
    for row in re.findall(r"<tr[^>]*>(.*?)</tr>", s, re.S):
        cells = re.findall(r"<td([^>]*)>(.*?)</td>", row, re.S)
        if len(cells) < 2:
            continue
        num, (attrs, c) = text(cells[0][1]), cells[1]
        m = re.search(r'id="([me]\d+)"', row)
        if m:
            day = out.setdefault(m.group(1), []); continue
        if 'class="psnum"' in c:
            n = text(re.search(r'<span class="psnum"[^>]*>([^<]*)', c, re.S).group(1))   # one span is left unclosed in the source
            lat = re.search(r'<span class="pslatin"[^>]*>(.*?)</span>', c, re.S)
            ps = {"n": n, "latin": text(lat.group(1)) if lat else "", "v": []}
            if day is not None:
                day.append(ps)
            continue
        t = text(c)
        if not t or ps is None:
            continue
        if num.isdigit():
            ps["v"].append([int(num), t])
        elif ps["v"] and not re.match(r"^(Part|[A-Z][a-z]+ [A-Z][a-z]+)$", t):
            ps["v"][-1][1] += " " + t
        else:
            ps["v"].append([0, t])            # a section heading inside a psalm (Psalm 119's Hebrew letters)
    return out


def main():
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        for k in ("mp1", "mp2", "ep1", "ep2", "noonday", "compline"):
            assert d["offices"][k], k
        assert set(d["prayers"]) == {"I-I", "II-A", "II-B", "II-C", "II-D"}, sorted(d["prayers"])
        assert d["he1"] and d["he2"] and len(d["psalter"]) == 60 and len(d["collects"]["c"]) > 100, "incomplete"
        print(f"bcp1979 ok: offices {len(d['offices'])}, collects {len(d['collects']['c'])}/{len(d['collects']['t'])}, psalter days {len(d['psalter'])}")
        return 0
    site = pathlib.Path(sys.argv[1])
    data = {"source": "The Book of Common Prayer (Episcopal Church, 1979), which is not under copyright; text from The Online Book of Common Prayer (bcponline.org)"}
    data["offices"] = {k: with_slots(steps(items(site / FILES[k]))) for k in ("mp1", "mp2", "ep1", "ep2")}
    for k in ("noonday", "compline"):
        data["offices"][k] = with_slots(restep(items(site / FILES[k]), RESTEP[k]))
    data["he1"] = with_slots(steps(items(site / FILES["he1"])))
    data["he2"] = with_slots(steps(items(site / FILES["he2"])))
    prayers = {}
    for key, he, first in (("II-A", data["he2"], "Eucharistic Prayer A"), ("I-I", data["he1"], "Eucharistic Prayer I")):
        gt = next(st for st in he if st["t"] == "The Great Thanksgiving")
        i = next(n for n, it in enumerate(gt["items"]) if it[1] == first)
        j = next(n for n, it in enumerate(gt["items"]) if re.match(r"^And now,? as our Savio", it[1]))
        prayers[key] = gt["items"][i + 1:j]
        gt["items"] = gt["items"][:i] + [["slot", "eprayer"]] + gt["items"][j:]
    for st in with_slots(steps(items(site / FILES["altgt"], people_italic=True))):
        m = re.match(r"^Eucharistic Prayer ([BCD])$", st["t"])
        if m:
            prayers["II-" + m.group(1)] = [it for it in st["items"] if not it[1].startswith("Continue with the Lord's Prayer")]
    data["prayers"] = prayers
    data["pop"] = steps(items(site / FILES["pop"]))
    data["prefaces"] = {"1": prefaces(site, FILES["pp1"]), "2": prefaces(site, FILES["pp2"])}
    data["collects"] = collects(site)
    data["psalter"] = psalter(site)
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {k: len(v) for k, v in data.items() if k != "source"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
