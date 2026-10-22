#!/usr/bin/env python3
"""Build data/bcp1662.json: the Order for the Administration of the Lord's Supper, or Holy Communion, and
the Collects, Epistles and Gospels of the Book of Common Prayer (1662), from Lynda Howell's transcription
(eskimo.com/~lhowell/bcp1662/). Her base text is a modern Cambridge printing; where it carries later
wording (the 1960s measures) the 1662 wording she records in her notes on changes is restored.

The pages mark rubrics in red, headings centred, and print the first letter of a prayer as an image
(ALT="O" + "UR" = "OUR"). The parser keeps those three things and nothing else.

    python3 tools/bcp1662.py SRC_DIR    # SRC_DIR holds c.htm (communion/index.html) and xmas lent easter trinity saints .htm
    python3 tools/bcp1662.py --dump SRC_DIR/c.htm   # print the parsed paragraphs
    python3 tools/bcp1662.py --check    # CI: the JSON is well formed
"""
import html
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from bcp1928 import sentence_case, steps  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "bcp1662.json"
BREAK = {"p", "br", "center", "h1", "h2", "h3", "hr", "multicol", "table", "tr", "td"}


class Paras(HTMLParser):
    """Paragraphs as lists of runs (text, red, centred, strong)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.fonts, self.center, self.strong, self.head = [], 0, 0, 0
        self.paras, self.cur, self.skip = [], [], 0

    def red(self):
        return any(self.fonts)

    def flush(self):
        txt = "".join(r[0] for r in self.cur)
        if txt.strip():
            self.paras.append(self.cur)
        self.cur = []

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag in ("title", "script", "style"):
            self.skip += 1
        if tag in BREAK:
            self.flush()
        if tag == "font":
            self.fonts.append("red" in (a.get("color") or "").lower())
        elif tag == "center":
            self.center += 1
        elif tag == "strong":
            self.strong += 1
        elif tag in ("h2", "h3"):
            self.head += 1
        elif tag == "img" and a.get("alt") and len(a["alt"]) == 1:
            self.add(a["alt"])

    def handle_endtag(self, tag):
        if tag in ("title", "script", "style"):
            self.skip = max(0, self.skip - 1)
        if tag == "font" and self.fonts:
            self.fonts.pop()
        elif tag == "center":
            self.flush(); self.center = max(0, self.center - 1)
        elif tag == "strong":
            self.strong = max(0, self.strong - 1)
        elif tag in ("h2", "h3"):
            self.flush(); self.head = max(0, self.head - 1)
        elif tag in BREAK:
            self.flush()

    def add(self, t):
        if self.skip:
            return
        self.cur.append((t, self.red(), bool(self.center), bool(self.strong or self.head)))

    def handle_data(self, d):
        self.add(d)


def clean(t):
    t = html.unescape(t).replace("\xa0", " ").replace("’", "'")
    return re.sub(r"\s+", " ", t).strip()


def paras(path):
    p = Paras()
    s = path.read_text(encoding="latin-1")
    s = s[:s.find("<IMG SRC=\"../images/buttons")] if "images/buttons" in s else s
    p.feed(s); p.flush()
    out = []
    for runs in p.paras:
        # merge neighbouring runs of the same colour
        segs = []
        for t, red, cen, strong in runs:
            if segs and segs[-1][1] == red:
                segs[-1][0] += t
            else:
                segs.append([t, red])
        segs = [[clean(t), red] for t, red in segs if clean(t)]
        if not segs:
            continue
        cen = all(r[2] for r in runs if clean(r[0]))
        strong = all(r[3] for r in runs if clean(r[0]))
        out.append({"segs": segs, "center": cen, "strong": strong})
    return out


def merge_inline(segs):
    """A short red phrase inside a spoken line ([or, ...]) becomes a bracketed aside in that line;
    a long red stretch stays a rubric of its own."""
    res, buf = [], []

    def flush():
        if buf:
            t = " ".join(f"({x.strip('[] ,')})" if r else x for x, r in buf if x.strip("[] "))
            t = re.sub(r"\((or)\) ([^()]*?) (?=is written)", r"(\1, \2) ", t)
            res.append([t, False]); buf.clear()
    for t, r in segs:
        if r and len(t.split()) > 3:
            flush(); res.append([t, r])
        elif r and not buf:
            res.append([t, r])
        else:
            buf.append([t, r])
    flush()
    return res


LABEL = re.compile(r"^(Minister|Priest|People|Answer|Deacon)\.$")


def items(ps):
    """[kind, text, role, label] items: rub, h, cite, v."""
    out, pending = [], None
    for p in ps:
        segs = p["segs"]
        if all(r for _, r in segs):
            t = " ".join(t for t, _ in segs)
            if LABEL.match(t):
                pending = t[:-1]; continue
            out.append(["rub", t, ""]); continue
        lab = None
        if segs[0][1] and LABEL.match(segs[0][0]):
            lab = segs[0][0][:-1]; segs = segs[1:]
        elif pending:
            lab = pending
        pending = None
        if p["center"] and not lab and len(segs) == 1 and len(segs[0][0].split()) <= 8 and segs[0][0] != "Let us pray.":
            out.append(["h", segs[0][0], ""]); continue
        segs = merge_inline(segs)
        for t, red in segs:
            if red:
                out.append(["rub", fix(t), ""]); continue
            t = fix(sentence_case(t.replace("I BELIEVE", "I believe")))
            if t.startswith("Whereas it is ordained in this Office"):
                out.append(["rub", t, ""]); continue
            prev = out[-1] if out else None
            role = "ppl" if lab in ("People", "Answer") else "all" if (ALL.match(t) or (prev and prev[0] == "v" and prev[2] == "all")) else "cel"
            out.append(["v", t, role, "℟." if lab == "Answer" else ""] if lab == "Answer" else ["v", t, role])
            lab = None
    return out


FIXES = [("and specialty unto them", "and specially unto them"), ("consecrate more cording to", "consecrate more according to"),
         ("the sea, and ail that", "the sea, and all that"), ("I St. John", "1 St. John"), ("only-begotten son of God", "only-begotten Son of God")]


KEEP_CAP = {"Lord", "God", "Almighty", "Christ", "Jesu", "Saviour", "Holy", "King", "Father"}


def fix(t):
    t = re.sub(r"^O ([A-Z][a-z]+)\b", lambda m: "O " + (m.group(1) if m.group(1) in KEEP_CAP else m.group(1).lower()), t)
    for a, b in FIXES:
        t = t.replace(a, b)
    return t


ALL = re.compile(r"^(Our Father|I believe in one God|Almighty God, Father of our Lord Jesus Christ, Maker of all things|We do not presume|Glory be to God on high)")

# The 1660s wording, from Howell's notes on changes (notes/changes.html): the modern Cambridge text
# replaces the two "evil liver" rubrics with one paragraph and drops the banns from the notices.
EVIL_LIVER = [
    "And if any of those be an open and notorious evil liver, or have done any wrong to his neighbours by word or deed, so that the Congregation be thereby offended; the Curate, having knowledge thereof, shall call him and advertise him, that in any wise he presume not to come to the Lord's Table, until he hath openly declared himself to have truly repented and amended his former naughty life, that the Congregation may thereby be satisfied, which before were offended; and that he hath recompensed the parties, to whom he hath done wrong; or at least declare himself to be in full purpose so to do, as soon as he conveniently may.",
    "The same order shall the Curate use with those betwixt whom he perceiveth malice and hatred to reign; not suffering them to be partakers of the Lord's Table, until he know them to be reconciled. And if one of the parties so at variance be content to forgive from the bottom of his heart all that the other hath trespassed against him, and to make amends for that he himself hath offended, and the other party will not be persuaded to a godly unity, but remain still in his frowardness and malice: the Minister in that case ought to admit the penitent person to the holy Communion, and not him that is obstinate. Provided that every Minister so repelling any, as is specified in this, or the next precedent Paragraph of this Rubrick, shall be obliged to give an account of the same to the Ordinary within fourteen days after at the farthest. And the Ordinary shall proceed against the offending person according to the Canon.",
]


def restore_1662(its):
    i = next(n for n, it in enumerate(its) if it[0] == "rub" and it[1].startswith("If a Minister be persuaded"))
    its[i:i + 1] = [["rub", t, ""] for t in EVIL_LIVER]
    for it in its:
        if it[0] == "rub" and "shall notice be given of the Communion;" in it[1] and "Bannes" not in it[1]:
            it[1] = it[1].replace("shall notice be given of the Communion;", "shall notice be given of the Communion: and the Bannes of Matrimony published, and Briefs, Citations, and Excommunications read;", 1)
    return its


ANCHORS = [
    ("Lord's Prayer and Collect for Purity", "", None),
    ("The Ten Commandments", r"^Then shall the Priest, turning to the people, rehearse distinctly", None),
    ("Collect for the King, Collect and Epistle", r"^Then shall follow one of these two Collects for the King", "collect"),
    ("Gospel", r"^And the Epistle ended, he shall say", "gospel"),
    ("Creed", r"^And the Gospel ended, shall be sung or said the Creed", None),
    ("Notices and Sermon", r"^Then the Curate shall declare unto the people", "sermon"),
    ("Offertory", r"^Then shall the Priest return to the Lord's Table, and begin the Offertory", None),
    ("Prayer for the whole state of Christ's Church", r"^Let us pray for the whole state", None),
    ("Exhortations", r"^When the Minister giveth warning for the celebration", None),
    ("Exhortation at the Celebration", r"^At the time of the Celebration of the Communion", None),
    ("Invitation, Confession and Absolution", r"^Then shall the Priest say to them that come to receive", None),
    ("The Comfortable Words", r"^Then shall the Priest say,$", None),
    ("Sursum corda, Preface and Sanctus", r"^After which the Priest shall proceed, saying", "preface"),
    ("Proper Prefaces", r"^Proper Prefaces", None),
    ("Prayer of Humble Access", r"^Then shall the Priest, kneeling down at the Lord's Table", None),
    ("Prayer of Consecration", r"^When the Priest, standing before the Table", None),
    ("Communion", r"^Then shall the Minister first receive the Communion", "communion"),
    ("The Lord's Prayer and Thanksgiving", r"^When all have communicated", None),
    ("Gloria in excelsis and Blessing", r"^Then shall be said or sung", None),
    ("Collects and rubrics", r"^Collects to be said after the Offertory", None),
]


def service(path):
    its = restore_1662(items(paras(path)))
    its = [it for it in its if not (it[0] == "h" and re.match(r"^(The Order of the Administration|Holy Communion\.?)", it[1]))]
    return steps(its, ANCHORS)


# --------------------------------------------------------------------------- propers
SPECIAL = {
    "THE FIRST SUNDAY OF ADVENT": "THE FIRST SUNDAY IN ADVENT",
    "THE NATIVITY OF OUR LORD, OR THE BIRTH DAY OF CHRIST, COMMONLY CALLED CHRISTMAS DAY": "CHRISTMAS DAY",
    "THE EPIPHANY, OR THE MANIFESTATION OF CHRIST TO THE GENTILES": "THE EPIPHANY",
    "THE SUNDAY CALLED SEPTUAGESIMA, OR THE THIRD SUNDAY BEFORE LENT": "SEPTUAGESIMA",
    "THE SUNDAY CALLED SEXAGESIMA, OR THE SECOND SUNDAY BEFORE LENT": "SEXAGESIMA",
    "THE SUNDAY CALLED QUINQUAGESIMA, OR THE NEXT SUNDAY BEFORE LENT": "QUINQUAGESIMA",
    "THE FIRST DAY OF LENT, COMMONLY CALLED ASH WEDNESDAY": "ASH WEDNESDAY",
    "THE PRESENTATION OF CHRIST IN THE TEMPLE, COMMONLY CALLED, THE PURIFICATION OF SAINT MARY THE VIRGIN": "THE PURIFICATION OF SAINT MARY THE VIRGIN",
    "WHIT SUNDAY": "WHITSUNDAY",
}


def key(title):
    k = re.sub(r"\s+", " ", re.sub(r"\.$", "", title).replace("-", " ").replace(",", ", ").upper()).replace(" ,", ",")
    k = re.sub(r",\s+", ", ", k).strip()
    k = k.replace("TWENTY ", "TWENTY-")
    return SPECIAL.get(k, k).replace("'", "’")


PART = re.compile(r"^(?:The )?(Collect|Epistle|Gospel|For the Epistle)s?\.?\s*(.*)$")


def propers(src):
    out, cur, part = {}, None, None
    for f in ("xmas", "lent", "easter", "trinity", "saints"):
        for p in paras(src / f"{f}.htm"):
            segs = p["segs"]
            t = " ".join(s for s, _ in segs)
            if p["center"] and p["strong"] and cur is not None and part is None and cur["t"].endswith(","):
                del out[key(cur["t"])]
                cur["t"] = re.sub(r"\.$", "", cur["t"] + " " + t); out[key(cur["t"])] = cur
                continue
            if p["center"] and p["strong"] and not all(r for _, r in segs):
                title = re.sub(r"\s*The Collect\.$", "", t).strip()
                cur = {"t": re.sub(r"\.$", "", title), "sets": [{"collect": [], "epistle": None, "gospel": None}], "notes": []}
                out[key(title)] = cur; part = None
                if t.endswith("The Collect."):
                    part = "collect"
                continue
            if cur is None:
                continue
            S = cur["sets"][-1]
            m = PART.match(t) if p["center"] and not all(r for _, r in segs) else None
            if m:
                part = m.group(1).replace("For the ", "").lower()
                if (part == "collect" and (S["epistle"] or S["gospel"])) or (part != "collect" and S[part]):
                    cur["sets"].append({"collect": [], "epistle": None, "gospel": None}); S = cur["sets"][-1]
                if part != "collect":
                    S[part] = {"cite": m.group(2).strip(), "text": []}
                continue
            if all(r for _, r in segs):
                cur["notes"].append(t); continue
            body = fix(sentence_case(" ".join(s for s, r in segs if not r)))
            if part == "collect":
                S["collect"].append(body)
            elif part in ("epistle", "gospel") and S[part] is not None:
                S[part]["text"].append(body)
            else:
                cur["notes"].append(t)
    for k, v in out.items():      # Monday to Thursday before Easter: the Collect of the Sunday next before Easter
        if not v["sets"][0]["collect"] and k.endswith("BEFORE EASTER"):
            v["same"] = "THE SUNDAY NEXT BEFORE EASTER"
    return out


def main():
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        assert d["hc"] and all(s["items"] for s in d["hc"])
        assert len(d["propers"]) >= 90, len(d["propers"])
        bad = [k for k, v in d["propers"].items() if not (v["sets"][0]["collect"] or v.get("same"))]
        bad += [k for k, v in d["propers"].items() for S in v["sets"] if not (S["epistle"] and S["epistle"]["text"] and S["gospel"] and S["gospel"]["text"])]
        assert not bad, bad
        print(f"bcp1662 ok: hc {len(d['hc'])} steps, propers {len(d['propers'])}")
        return 0
    if "--dump" in sys.argv:
        for it in items(paras(pathlib.Path(sys.argv[-1]))):
            print(it[0], (it[3] + " " if len(it) > 3 and it[3] else "") + it[2] + " |", it[1][:150])
        return 0
    src = pathlib.Path(sys.argv[1])
    data = {"source": "The Book of Common Prayer (1662): Holy Communion and the Collects, Epistles and Gospels, from Lynda M. Howell's transcription (eskimo.com/~lhowell/bcp1662), with the 1662 wording of the opening rubrics restored",
            "hc": service(src / "c.htm"), "propers": propers(src)}
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {"hc": len(data["hc"]), "propers": len(data["propers"])})
    return 0


if __name__ == "__main__":
    sys.exit(main())
