#!/usr/bin/env python3
"""Build data/bcp1928.json: Morning and Evening Prayer, Holy Communion, and the Collects, Epistles and
Gospels of the American Book of Common Prayer (1928, public domain), from the Society of Archbishop
Justus transcriptions (justus.anglican.org/resources/bcp/1928/).

The ePub edition has clean paragraphs but leaves out the rubrics; the HTML pages keep them. This script
takes the ePub's paragraphs and puts each HTML rubric before the ePub paragraph whose opening words
match the HTML text that follows the rubric.

    python3 tools/bcp1928.py SRC_DIR           # SRC_DIR holds MP.htm EP.htm HC.htm and the unpacked ePub (OEBPS/Text)
    python3 tools/bcp1928.py --check           # CI: the JSON is well formed
"""
import html
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "bcp1928.json"


def norm(t, n=28):
    return re.sub(r"[^a-z]", "", t.lower())[:n]


def clean(t):
    t = html.unescape(t).replace("\xa0", " ").replace("’", "'").replace("‘", "'")
    return re.sub(r"\s+", " ", t).strip()


def html_paras(path):
    """[(is_rubric, text)] from a Justus HTML page: <p> blocks and the cells of nested versicle tables, in order."""
    s = path.read_text(encoding="latin-1")
    s = s[s.find("(1928)"):]
    out = []
    for m in re.finditer(r"<p(?:\s[^>]*)?>(.*?)</p>|<td width=\"(?:214|81)\"[^>]*>(.*?)</td>", s, re.S):
        b = m.group(1) if m.group(1) is not None else m.group(2)
        if "<p" in b:
            b = re.sub(r"</?p[^>]*>", " ", b)
        t = clean(re.sub(r"<[^>]+>", " ", re.sub(r"<br\s*/?>", " ", b)))
        t = re.sub(r"\b([B-HJ-NP-Z]) ([A-Z]{2,})\b", r"\1\2", t)      # small capitals split by the markup: N OTE, P SALMS
        t = re.sub(r"\bT HE P RESIDENT OF THE U NITED S TATES\b", "THE PRESIDENT OF THE UNITED STATES", t).replace("A LMIGHTY", "ALMIGHTY")
        if not t or t in ("THE ORDER FOR",):
            continue
        out.append((t.startswith("¶"), t.lstrip("¶ ").strip()))
    return out


def epub_paras(path):
    """[(kind, text)] from an ePub chapter: kind is h (heading), c (centred title), ps (psalm/versicle line), p."""
    s = path.read_text(encoding="utf-8")
    s = s[s.find("<body"):]
    out = []
    for tag, attrs, b in re.findall(r"<(h\d|p)([^>]*)>(.*?)</\1>", s, re.S):
        cls = (re.search(r'class="([^"]*)"', attrs) or [None, ""])[1]
        t = clean(re.sub(r"<[^>]+>", "", re.sub(r"<br\s*/?>", " ", b)))
        if not t or set(t) <= set("+ "):
            continue
        kind = "h" if tag.startswith("h") else "c" if "centered" in cls else "ps" if ("psalm" in cls or "versicle" in cls) else "p"
        out.append([kind, t])
    return out


def merge(htm, epub):
    """Insert the HTML rubrics into the ePub paragraph list."""
    H, E = html_paras(htm), epub_paras(epub)
    res, j, pending, misses = [], 0, [], 0
    keyed = [norm(t) for _, t in E]
    for is_rub, t in H:
        if is_rub:
            pending.append(t); continue
        k = norm(t)
        if len(k) < 6:
            continue
        hit = next((i for i in range(j, len(E)) if keyed[i] and (keyed[i].startswith(k[:20]) or k.startswith(keyed[i][:20]))), None)
        if hit is None:
            misses += 1; continue
        res.extend(E[j:hit])
        res.extend(["rub", r] for r in pending)
        pending = []
        res.append(E[hit]); j = hit + 1
    res.extend(E[j:])
    res.extend(["rub", r] for r in pending)
    return res, misses


def sentence_case(t):
    """The first word of a prayer or lesson is printed in capitals (ALMIGHTY God, O LORD, WE do not presume)."""
    t = re.sub(r"^(O |\[?)([A-Z][A-Z’']+)\b", lambda m: m.group(1) + m.group(2).capitalize(), t)
    return re.sub(r"^([\[(]?)([A-Z][A-Z’']+)\b", lambda m: m.group(1) + (m.group(2).capitalize() if len(m.group(2)) > 1 and m.group(2) not in ("LORD",) else m.group(2)), t)


ALL = re.compile(r"^(ALMIGHTY and most merciful Father; We have erred|OUR Father|I BELIEVE in|GLORY be to the Father|As it was in the beginning|Lord, have mercy upon us|Christ, have mercy upon us|WE do not presume|ALMIGHTY God, Father of our Lord Jesus Christ, Maker of all things)")


def items(paras):
    """Turn merged paragraphs into the [kind, text, role, label] items used by bcp-office.json."""
    out = []
    for kind, t in paras:
        if kind == "rub":
            out.append(["rub", t, ""]); continue
        if kind in ("h", "c"):
            m = re.match(r"^(.*?\.)\s*((?:[1-3] )?(?:St\. )?[A-Z][a-z]+\.? [ivxlc]+\. [\d, \-]+\.?)$", t)
            if m and kind == "c":
                out.append(["h", m.group(1), ""]); out.append(["cite", m.group(2), ""])
            else:
                out.append(["h", t, ""])
            continue
        m = re.match(r"^(Answer|Minister|Priest|People|Deacon)\.\s*(.*)$", t)
        if m:
            who = m.group(1)
            out.append(["v", m.group(2), "ppl" if who in ("Answer", "People") else "cel", "℟." if who == "Answer" else ""]); continue
        role = "all" if (kind == "ps" or ALL.match(t)) else "cel"
        out.append(["v", sentence_case(t), role])
    return out


def steps(its, anchors):
    """Split items into named steps: anchors = [(title, regex on the text, slot or None)]."""
    res, cur = [], {"t": anchors[0][0], "items": []}
    if anchors[0][2]:
        cur["slot"] = anchors[0][2]
    res.append(cur); ai = 1
    for it in its:
        while ai < len(anchors) and re.search(anchors[ai][1], it[1], re.I):
            cur = {"t": anchors[ai][0], "items": []}
            if anchors[ai][2]:
                cur["slot"] = anchors[ai][2]
            res.append(cur); ai += 1
        cur["items"].append(it)
    if ai < len(anchors):
        raise SystemExit(f"anchor not found: {anchors[ai][0]!r} /{anchors[ai][1]}/")
    return res


# Rubrics whose following text is laid out differently in the HTML, so the merge cannot place them:
# move each before the first paragraph starting with the given words.
MOVES = {
    "mp": [("Then likewise he shall say", "O Lord, open thou our lips")],
    "ep": [("The Minister shall begin the Evening Prayer", "THE Lord is in his holy temple"),
           ("Then likewise he shall say", "O Lord, open thou our lips")],
    "hc": [("Then may the Priest say,", "Hear what our Lord Jesus Christ saith"),
           ("Here shall be said,", "The Lord be with you."),
           ("After which the Priest shall proceed, saying,", "Lift up your hearts")],
}

ANCHORS = {
    "mp": [("Opening sentences", "", None), ("Exhortation", r"^Then the Minister shall say,", None),
           ("General Confession", r"^A General Confession", None), ("Absolution", r"^The Declaration of Absolution", None),
           ("The Lord's Prayer", r"^Then the Minister shall kneel, and say the Lord's Prayer", None),
           ("Preces", r"^Then likewise he shall say", None), ("Venite", r"^Then shall be said or sung the following Canticle", None),
           ("The Psalms", r"^Then shall follow a Portion of the PSALMS", "psalms"),
           ("First Lesson", r"^Then shall be read the First Lesson", "lesson1"),
           ("Te Deum, Benedictus es or Benedicite", r"^Here shall be said or sung the following Hymn", None),
           ("Second Lesson", r"^Then shall be read, in like manner, the Second Lesson", "lesson2"),
           ("Benedictus or Jubilate", r"^And after that shall be sung or said the Hymn following", None),
           ("Creed", r"^Then shall be said the Apostles' Creed", None),
           ("Suffrages", r"^And after that, these Prayers following", None),
           ("Collects", r"^Then shall follow the Collect for the Day", "collect"),
           ("Prayers and thanksgivings", r"^The following Prayers shall be omitted here", None),
           ("The Grace", r"^2 Cor\. xiii", None)],
    "ep": [("Opening sentences", "", None), ("Exhortation", r"^And NOTE , that when the Confession", None),
           ("General Confession", r"^A General Confession", None), ("Absolution", r"^The Declaration of Absolution", None),
           ("The Lord's Prayer", r"^Then the Minister shall kneel, and say the Lord's Prayer", None),
           ("Preces", r"^Then likewise he shall say", None),
           ("The Psalms", r"^Then shall follow a Portion of the PSALMS", "psalms"),
           ("First Lesson", r"^Then shall be read the First Lesson", "lesson1"),
           ("Magnificat or Cantate Domino", r"^After which shall be sung or said the Hymn called Magnificat", None),
           ("Second Lesson", r"^Then a Lesson of the New Testament", "lesson2"),
           ("Nunc dimittis or Deus misereatur", r"^And after that shall be sung or said the Hymn called Nunc dimittis", None),
           ("Creed", r"^Then shall be said the Apostles' Creed", None),
           ("Suffrages", r"^And after that, these Prayers following", None),
           ("Collects", r"^Then shall be said the Collect of the Day", "collect"),
           ("Prayers and thanksgivings", r"^In places where it may be convenient, here followeth the Anthem", None),
           ("The Grace", r"^2 Cor\. xiii", None)],
    "hc": [("Lord's Prayer and Collect for Purity", "", None), ("The Decalogue", r"^The Decalogue\.$", None),
           ("Summary of the Law and Kyrie", r"^Then may the Priest say,", None),
           ("Collect and Epistle", r"^Then the Priest may say,$", "collect"),
           ("Gospel", r"^Then, all the People standing, the Minister appointed shall read the Gospel", "gospel"),
           ("Creed", r"^Then shall be said the Creed commonly called the Nicene", None),
           ("Notices and Sermon", r"^Then shall be declared unto the People", "sermon"),
           ("Offertory", r"^REMEMBER the words of the Lord Jesus", None),
           ("Prayer for the whole state of Christ's Church", r"^Here the Priest may ask the secret intercessions", None),
           ("Invitation, Confession and Absolution", r"^Then shall the Priest say to those who come to receive", None),
           ("The Comfortable Words", r"^Hear what comfortable words", None),
           ("Sursum corda, Preface and Sanctus", r"^After which the Priest shall proceed, saying", "preface"),
           ("Proper Prefaces", r"^PROPER PREFACES", None),
           ("Prayer of Consecration", r"^When the Priest, standing before the Table", None),
           ("The Lord's Prayer and Prayer of Humble Access", r"^And now, as our Saviour Christ hath taught us", None),
           ("Communion", r"^Then shall the Priest first receive the Holy Communion", "communion"),
           ("Thanksgiving", r"^When all have communicated", None),
           ("Gloria in excelsis and Blessing", r"^Then shall be said Gloria in excelsis", None),
           ("General rubrics", r"^GENERAL RUBRICS", None)],
}
FILES = {"mp": ("MP.htm", "MorningPrayer.xhtml"), "ep": ("EP.htm", "EveningPrayer.xhtml"), "hc": ("HC.htm", "HolyCommunion.xhtml")}


def move(paras, rub, target):
    i = next(n for n, (k, t) in enumerate(paras) if k == "rub" and t.startswith(rub))
    item = paras.pop(i)
    j = next(n for n, (k, t) in enumerate(paras) if k != "rub" and t.startswith(target))
    paras.insert(j, item)


def service(src, key):
    htm, xh = FILES[key]
    paras, _ = merge(src / htm, src / "OEBPS" / "Text" / xh)
    paras = [p for p in paras if not (p[0] == "h" and p is paras[0])]
    for rub, target in MOVES.get(key, []):
        move(paras, rub, target)
    st = steps(items(paras), ANCHORS[key])
    if key == "hc":
        st = [s for s in st if s["t"] != "General rubrics"]
    return st


# --------------------------------------------------------------------------- propers
KEY = {   # 1928 title -> the 1662 key used by days.json (o.bcp); others are keyed by their own title in capitals
    "THE NATIVITY OF OUR LORD, OR THE BIRTHDAY OF CHRIST, COMMONLY CALLED CHRISTMAS DAY": "CHRISTMAS DAY",
    "SAINT STEPHEN, DEACON AND MARTYR": "SAINT STEPHEN’S DAY",
    "SAINT JOHN, APOSTLE AND EVANGELIST": "SAINT JOHN THE EVANGELIST’S DAY",
    "THE HOLY INNOCENTS": "THE INNOCENTS’ DAY",
    "THE FIRST SUNDAY AFTER CHRISTMAS DAY": "THE SUNDAY AFTER CHRISTMAS DAY",
    "THE EPIPHANY, OR THE MANIFESTATION OF CHRIST TO THE GENTILES": "THE EPIPHANY",
    "THE SUNDAY CALLED SEPTUAGESIMA, OR THE THIRD SUNDAY BEFORE LENT": "SEPTUAGESIMA",
    "THE SUNDAY CALLED SEXAGESIMA, OR THE SECOND SUNDAY BEFORE LENT": "SEXAGESIMA",
    "THE SUNDAY CALLED QUINQUAGESIMA, OR THE SUNDAY NEXT BEFORE LENT": "QUINQUAGESIMA",
    "THE FIRST DAY OF LENT, COMMONLY CALLED ASH WEDNESDAY": "ASH WEDNESDAY",
    "THE FIFTH SUNDAY IN LENT, COMMONLY CALLED PASSION SUNDAY": "THE FIFTH SUNDAY IN LENT",
    "THE SUNDAY NEXT BEFORE EASTER, COMMONLY CALLED PALM SUNDAY": "THE SUNDAY NEXT BEFORE EASTER",
    "THE FIFTH SUNDAY AFTER EASTER, COMMONLY CALLED ROGATION SUNDAY": "THE FIFTH SUNDAY AFTER EASTER",
    "THE ASCENSION DAY": "THE ASCENSION DAY",
    "THE SUNDAY AFTER ASCENSION DAY": "SUNDAY AFTER ASCENSION DAY",
    "WHITSUNDAY": "WHITSUNDAY",
    "PENTECOST, COMMONLY CALLED WHITSUNDAY": "WHITSUNDAY",
    "THE SUNDAY NEXT BEFORE ADVENT": "THE TWENTY-FIFTH SUNDAY AFTER TRINITY",
    "SAINT ANDREW THE APOSTLE": "SAINT ANDREW’S DAY",
    "THE PRESENTATION OF CHRIST IN THE TEMPLE, COMMONLY CALLED THE PURIFICATION OF SAINT MARY THE VIRGIN": "THE PURIFICATION OF SAINT MARY THE VIRGIN",
    "SAINT MATTHIAS THE APOSTLE": "SAINT MATTHIAS’S DAY",
    "SAINT MARK THE EVANGELIST": "SAINT MARK’S DAY",
    "SAINT PHILIP AND SAINT JAMES, APOSTLES": "SAINT PHILIP AND SAINT JAMES’S DAY",
    "SAINT JOHN BAPTIST": "SAINT JOHN BAPTIST’S DAY",
    "SAINT PETER THE APOSTLE": "SAINT PETER’S DAY",
    "SAINT MATTHEW, APOSTLE AND EVANGELIST": "SAINT MATTHEW THE APOSTLE",
    "ALL SAINTS' DAY": "ALL SAINTS’ DAY",
}


def propers(src):
    """{key: {"t": title, "sets": [{"collect": [...], "epistle": {cite, text}, "gospel": {cite, text}}], "notes": [...]}}.
    Christmas and Easter have a second set (for an early celebration); Ash Wednesday's second collect is kept with the first."""
    opf = (src / "OEBPS" / "content.opf").read_text(encoding="utf-8")
    man = dict(re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', opf))
    files = [man[i] for i in re.findall(r'idref="([^"]+)"', opf)]
    start, stop = files.index("Text/Lectionary.xhtml"), files.index("Text/ASaint.xhtml")
    out, cur, part = {}, None, None

    def cset():
        return cur["sets"][-1]
    for f in files[start:stop]:
        for kind, t in epub_paras(src / "OEBPS" / f):
            if re.fullmatch(r"\[.*\]", t):                      # the date under a holy day's title: [DECEMBER 25.]
                continue
            if kind == "h" or (kind == "c" and not re.match(r"^(The (Collect|Epistle|Gospel)|For the Epistle)", t) and t.endswith(".") and len(t) > 12 and not t.startswith("Or")):
                if t.isupper() and len(t.split()) <= 3:      # season headings: CHRISTMASTIDE.
                    continue
                name = re.sub(r"\s+", " ", re.sub(r"\.$", "", t).upper().replace("’", "'"))
                cur = {"t": re.sub(r"\.$", "", t), "sets": [{"collect": [], "epistle": None, "gospel": None}], "notes": []}
                out[KEY.get(name, name).replace("'", "’")] = cur; part = None
                continue
            if cur is None:
                continue
            m = re.match(r"^The (Collect|Epistle|Gospel)\.?\s*(.*)$", t) if kind == "c" else None
            if m is None and kind == "c" and t.startswith("For the Epistle"):
                m = re.match(r"^For the (Epistle)\.?\s*(.*)$", t)
            if m:
                part = m.group(1).lower()
                S = cset()
                if (part == "collect" and (S["epistle"] or S["gospel"])) or (part != "collect" and S[part]):
                    cur["sets"].append({"collect": [], "epistle": None, "gospel": None}); S = cset()
                if part != "collect":
                    S[part] = {"cite": m.group(2).strip(), "text": []}
                continue
            S = cset()
            if part == "collect":
                S["collect"].append(sentence_case(t))
            elif part in ("epistle", "gospel") and S[part] is not None:
                S[part]["text"].append(sentence_case(t))
            else:
                cur["notes"].append(t)
    return {k: v for k, v in out.items() if any(x["collect"] or x["epistle"] or x["gospel"] for x in v["sets"])}


def main():
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        for k in ("mp", "ep", "hc"):
            assert d[k] and all(s["items"] for s in d[k]), k
        assert len(d["propers"]) > 90, len(d["propers"])
        print(f"bcp1928 ok: mp {len(d['mp'])} steps, ep {len(d['ep'])}, hc {len(d['hc'])}, propers {len(d['propers'])}")
        return 0
    src = pathlib.Path(sys.argv[1])
    data = {"source": "The Book of Common Prayer (Protestant Episcopal Church in the U.S.A., 1928), public domain; text from the Society of Archbishop Justus (justus.anglican.org)",
            "mp": service(src, "mp"), "ep": service(src, "ep"), "hc": service(src, "hc"), "propers": propers(src)}
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {k: len(v) for k, v in data.items() if k != "source"})
    return 0


if __name__ == "__main__":
    sys.exit(main())
