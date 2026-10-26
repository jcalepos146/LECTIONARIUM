#!/usr/bin/env python3
"""Build the Collect, Epistle and Gospel of each day for the Prayer Books of 1549, 1552 and 1559 from the Society of
Archbishop Justus pages "Collects, Epistles, and Gospels from the 1549, 1552 and 1559 Books of Common Prayer"
(justus.anglican.org/resources/bcp/1549/Readings_*.htm), public domain. One set of pages serves the three books: the
page prints the 1549 text, brackets and asterisks the places where a later book differs, and says in the margin which
books have them. The differences are settled below, one by one, in VARIANTS.

    python3 tools/bcp_propers.py PAGES_DIR     # write the 1549, 1552 and 1559 propers into tools/texts/bcp-propers.json

PAGES_DIR holds the downloaded pages (Readings_Advent_1549.htm ... Reading_EasterWeek_1549.htm). The result is
committed; tools/bcp_early.py builds data/bcp<year>.json from it.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import justus_propers as jp  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ["Advent", "Xmas", "Epiphany", "Lent", "HolyWeek", "EasterWeek", "EasterSeason", "Ascension_Whitsuntide",
         "TrinityA", "TrinityB", "TrinityC", "SaintsA", "SaintsB"]
ORD = {"fyrst": 1, "first": 1, "firste": 1, "i": 1, "second": 2, "seconde": 2, "ii": 2, "thirde": 3, "third": 3, "iii": 3,
       "fourth": 4, "iiii": 4, "v": 5, "vi": 6, "vii": 7, "eight": 8, "viii": 8, "ix": 9, "x": 10, "xi": 11, "xii": 12,
       "xiii": 13, "xiiii": 14, "xv": 15, "xvi": 16, "xvii": 17, "xviii": 18, "xix": 19, "xx": 20, "xxi": 21,
       "xxii": 22, "xxiii": 23, "xxiiii": 24, "xxv": 25}
NUM = ["", "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH", "ELEVENTH",
       "TWELFTH", "THIRTEENTH", "FOURTEENTH", "FIFTEENTH", "SIXTEENTH", "SEVENTEENTH", "EIGHTEENTH", "NINETEENTH",
       "TWENTIETH", "TWENTY-FIRST", "TWENTY-SECOND", "TWENTY-THIRD", "TWENTY-FOURTH", "TWENTY-FIFTH"]
SEASON = {"Advent": "IN ADVENT", "Lent": "IN LENT", "EasterSeason": "AFTER EASTER", "Epiphany": "AFTER THE EPIPHANY",
          "TrinityA": "AFTER TRINITY", "TrinityB": "AFTER TRINITY", "TrinityC": "AFTER TRINITY"}
NAMES = [
    (r"andrew", "SAINT ANDREW’S DAY"), (r"thomas", "SAINT THOMAS THE APOSTLE"), (r"conversion", "THE CONVERSION OF SAINT PAUL"),
    (r"purificacion", "THE PURIFICATION OF SAINT MARY THE VIRGIN"), (r"mathies", "SAINT MATTHIAS’S DAY"),
    (r"annunciacion", "THE ANNUNCIATION OF THE BLESSED VIRGIN MARY"), (r"markes", "SAINT MARK’S DAY"),
    (r"philip and james", "SAINT PHILIP AND SAINT JAMES’S DAY"), (r"barnabe", "SAINT BARNABAS THE APOSTLE"),
    (r"john baptist", "SAINT JOHN BAPTIST’S DAY"), (r"peter.s day", "SAINT PETER’S DAY"), (r"magdalene", "SAINT MARY MAGDALENE"),
    (r"james the apostle", "SAINT JAMES THE APOSTLE"), (r"bartholomew", "SAINT BARTHOLOMEW THE APOSTLE"),
    (r"matthewe", "SAINT MATTHEW THE APOSTLE"), (r"michaell", "SAINT MICHAEL AND ALL ANGELS"),
    (r"luke evangelist", "SAINT LUKE THE EVANGELIST"), (r"symon and jude", "SAINT SIMON AND SAINT JUDE, APOSTLES"),
    (r"all saynctes", "ALL SAINTS’ DAY"), (r"on christmas day", "CHRISTMAS DAY"), (r"stephin", "SAINT STEPHEN’S DAY"),
    (r"john evangelistes", "SAINT JOHN THE EVANGELIST’S DAY"), (r"innocentes", "THE INNOCENTS’ DAY"),
    (r"sunday after christmas", "THE SUNDAY AFTER CHRISTMAS DAY"), (r"circumcision of", "THE CIRCUMCISION OF CHRIST"),
    (r"^the epiphanie", "THE EPIPHANY"), (r"day of lent", "ASH WEDNESDAY"), (r"sonday next before easter", "THE SUNDAY NEXT BEFORE EASTER"),
    (r"^monday before easter", "MONDAY BEFORE EASTER"), (r"^tewesday before easter", "TUESDAY BEFORE EASTER"),
    (r"^wednesday before easter", "WEDNESDAY BEFORE EASTER"), (r"^thursday before easter", "THURSDAY BEFORE EASTER"),
    (r"good fryday", "GOOD FRIDAY"), (r"^easter even", "EASTER EVEN"), (r"^easter daye", "EASTER DAY"),
    (r"^monedaye in easter", "MONDAY IN EASTER WEEK"), (r"^tuisdaye in easter", "TUESDAY IN EASTER WEEK"),
    (r"assencion day", "THE ASCENSION DAY"), (r"sonday after the ascencion", "SUNDAY AFTER ASCENSION DAY"),
    (r"^whit-sunday", "WHITSUNDAY"), (r"^monday in whitsonweke", "MONDAY IN WHITSUN WEEK"), (r"^tuesday\.?$", "TUESDAY IN WHITSUN WEEK"),
    (r"^trinitie sonday", "TRINITY SUNDAY"), (r"septuagesima", "SEPTUAGESIMA"), (r"sexagesima", "SEXAGESIMA"),
    (r"quinquagesima", "QUINQUAGESIMA"),
]


def title_key(t, page):
    if len(t) > 62 and not t.lower().startswith("tuisdaye in easter"):
        return None
    s = re.sub(r"[\[\]*¶]", "", t).strip().lower()
    if re.match(r"^the vi sonday \(if", s):
        return None
    for pat, key in NAMES:
        if re.search(pat, s):
            return key
    m = re.match(r"^the (\w+)\.? ?s[ou]\w*", s)
    if m and m.group(1) in ORD and page in SEASON:
        return f"THE {NUM[ORD[m.group(1)]]} SUNDAY {SEASON[page]}"
    return None


def title_of(key):
    return " ".join(w if w in ("OF", "AND", "THE", "IN", "AFTER", "ON") else w.capitalize() for w in key.replace("’S", "’s").split()) if False else key


LESSON = re.compile(r"^\[?¶?\s*(At (Matins|Mattins|Matyns|Mattyns|Evensong|Euensong|Mattyns,)|Proper (psalmes|psalms)|Propre lessons|The (first|fyrste|firste|ii|seconde|second|Seconde|First|Second) (L|l)esson|Psalms? [ivxlc]+|Psal\. [ivxlc]+|Acts vii\. |The Seconde lesson at)", re.I)
INTROIT = re.compile(r"\b(Psalm\.?|Ps\.?) [ivxlc]+\.?$", re.I)
RUBRIC = re.compile(r"^(Then shall|After the|If there be|The vi sonday|Rubric|And so must)", re.I)


def parse(path, page):
    """Days of one page: {key, sets:[{label, introit:{head,lines}|None, collect:[], epistle:{cite,text}|None, gospel}]}"""
    days, day, cs, mode = [], None, None, None
    for x in jp.rows(path):
        t, k = x["t"], x["k"]
        if k == "note":
            continue
        key = title_key(t, page)
        if key and (k == "rub" or len(t) < 40 or t.lower().startswith("tuisdaye")):
            day = {"key": key, "title": re.sub(r"[\[\]*]", "", t).strip(), "sets": []}
            days.append(day); cs = None; mode = "after-title"
            mm = re.match(r"^(The [a-z]+ sunday\.)\s+(.*Psalm [ivxlc]+\.)$", t, re.I)
            if mm:
                day["title"] = mm.group(1)
                cs = {"label": "", "introit": {"head": mm.group(2), "lines": []}, "collect": [], "epistle": None, "gospel": None, "rubrics": []}
                day["sets"].append(cs); mode = "introit"
            if t.lower().startswith("tuisdaye"):
                mode = "skip"
            continue
        if day is None:
            continue
        m = re.match(r"^At the (first|fyrst|second|seconde)? ?Communion", t, re.I)
        if m:
            label = (m.group(1) or "").lower()
            if label or not day["sets"]:
                cs = {"label": ("first" if label in ("first", "fyrst") else "second" if label else ""), "introit": None, "collect": [], "epistle": None, "gospel": None, "rubrics": []}
                day["sets"].append(cs)
            else:
                cs = day["sets"][-1]
            mode = "after-communion"; continue
        if mode == "skip" and INTROIT.search(t) and len(t) < 80 and not LESSON.match(t) and not (cs and cs["collect"]):
            if cs is None or cs["introit"] or cs["collect"]:
                cs = {"label": "", "introit": None, "collect": [], "epistle": None, "gospel": None, "rubrics": []}
                day["sets"].append(cs)
            cs["introit"] = {"head": t.strip(), "lines": []}; mode = "introit"; continue
        if LESSON.match(t) or re.match(r"^\[?¶?\s*(At |Proper)", t):
            mode = "skip"; continue
        h = jp.HEAD.match(t)
        if h and len(t) < 70:
            kind = "collect" if h.group(2).lower().startswith("collect") else ("epistle" if h.group(2).lower().startswith("epist") else "gospel")
            if cs is None or (kind == "collect" and cs["epistle"] is not None) or (kind == "epistle" and cs["epistle"] is not None) or (kind == "collect" and cs["collect"] and not cs["introit"] and mode != "collect"):
                cs = {"label": "", "introit": None, "collect": [], "epistle": None, "gospel": None, "rubrics": []}
                day["sets"].append(cs)
            if kind == "collect":
                mode = "collect"
            elif kind == "epistle":
                cs["epistle"] = {"cite": h.group(3).strip(" ."), "text": []}; mode = "epistle"
            else:
                cs["gospel"] = {"cite": h.group(3).strip(" ."), "text": []}; mode = "gospel"
            continue
        if cs is None and mode in ("after-title", None):
            cs = {"label": "", "introit": None, "collect": [], "epistle": None, "gospel": None, "rubrics": []}
            day["sets"].append(cs)
        if mode in ("after-title", "after-communion", "introit") and INTROIT.search(t) and len(t) < 80 and cs and (not cs["collect"] or mode == "after-communion"):
            cs["introit"] = {"head": t.strip(), "lines": []}; mode = "introit"; continue
        if t.startswith("* ") or re.fullmatch(r'"?Amen"?', t.strip()):
            continue
        if mode == "introit" and cs and cs["introit"]:
            if RUBRIC.match(t):
                continue
            cs["introit"]["lines"].append(t); continue
        if mode == "collect" and cs:
            if RUBRIC.match(t) or re.match(r"^The Collecte\.?$", t):
                cs["rubrics"].append(t); continue
            cs["collect"].append(t); continue
        if mode in ("epistle", "gospel") and cs:
            tgt = cs[mode]
            if RUBRIC.match(t):
                cs["rubrics"].append(t); continue
            tgt["text"].append(t); continue
        if mode == "skip":
            continue
    for d in days:
        d["sets"] = [x for x in d["sets"] if x["collect"] or x["epistle"] or x["gospel"]]
    return days


def load_all(pages_dir):
    out = []
    for p in PAGES:
        stem = "Reading_EasterWeek_1549.htm" if p == "EasterWeek" else f"Readings_{p.replace('_', '&')}_1549.htm"
        f = pathlib.Path(pages_dir) / stem
        if not f.exists():
            f = pathlib.Path(pages_dir) / ("1549_" + (f"Readings_{p}_1549.htm" if p != "EasterWeek" else "Readings_EasterWeek_1549.htm"))
        out += [(p, d) for d in parse(f, p)]
    return out


# ---------------------------------------------------------------------------------------------------------------
# What the three books print where the page marks a difference. The page shows the 1549 wording and, in square
# brackets with an asterisk, the words that a later book adds, drops or changes; the marginal note says which.
# (key, field, text on the page, 1549, 1552, 1559). A field is "collect", "epistle" or "gospel".
VARIANTS = [
    ("THE FIRST SUNDAY IN ADVENT", "gospel", "two [of his]* disciples", "two disciples", "two of his disciples", "two of his disciples"),
    ("THE ASCENSION DAY", "collect", "[, who liveth and reigneth with thee and the holy Ghost, one God world without end]*", "", "", ""),
    ("MONDAY IN EASTER WEEK", "gospel", "RE:\\[(And they drew nigh unto the town.*?)\\]\\*", "", "\\1", "\\1"),
    ("WHITSUNDAY", "gospel", "RE:\\[(Judas sayeth unto hym.*?)\\]\\*", "", "\\1", "\\1"),
    ("THE SECOND SUNDAY AFTER EASTER", "collect", "holy* sonne", "holy sonne", "holy sonne", "holy sonne"),
    ("THE THIRD SUNDAY AFTER EASTER", "epistle", "[al maner ordinaunce of]* man", "al maner ordinaunce of man", "every man", "every man"),
    ("THE FOURTH SUNDAY AFTER EASTER", "epistle", "[is he chaunged unto darkenes]*", "is he chaunged unto darkenes", "shadowe of chaunge", "shadowe of chaunge"),
    ("THE FIRST SUNDAY AFTER THE EPIPHANY", "collect", " [through Jesus Christ our lord]*", "", " through Jesus Christ our lord", " through Jesus Christ our lord"),
    ("THE THIRD SUNDAY AFTER THE EPIPHANY", "gospel", "[see thou]* tell", "see thou tell", "tell", "tell"),
    ("THE THIRD SUNDAY AFTER THE EPIPHANY", "gospel", "[my selfe]* am", "my selfe am", "am", "am"),
    ("THE FIRST SUNDAY IN LENT", "collect", "&c.*", "&c.", "&c.", "&c."),
    ("SAINT THOMAS THE APOSTLE", "collect", "and* everliving", "and everliving", "and everliving", "and everliving"),
    ("SAINT THOMAS THE APOSTLE", "collect", "may* never", "may never", "may never", "may never"),
    ("SAINT JAMES THE APOSTLE", "collect", "Saint* James", "James", "James", "Saint James"),
    ("SAINT JAMES THE APOSTLE", "collect", "Amen.*", "", "", ""),
    ("SAINT BARTHOLOMEW THE APOSTLE", "collect", "thy* apostle", "thy apostle", "thy apostle", "thine apostle"),
    ("SAINT BARTHOLOMEW THE APOSTLE", "epistle", "[(and that they might all be delivered from their infirmities.)]*", "(and that they might all be delivered from their infirmities.)", "", ""),
    ("ALL SAINTS’ DAY", "collect", "virtues*,", "virtues,", "virtues,", "virtues,"),
    ("THE EIGHTH SUNDAY AFTER TRINITY", "collect", "geve [us]* those", "geve those", "geve those", "geve those"),
    ("SAINT SIMON AND SAINT JUDE, APOSTLES", "gospel", "I [give] you", "I you", "I you", "I you"),
    ("SUNDAY AFTER ASCENSION DAY", "gospel", " These thinges sayde I not unto you at the beginning, because I was presente with you.", " These thinges sayde I not unto you at the beginning, because I was presente with you.", "", ""),
]
# Collects the page gives by reference ("&c. as upon Christmas Day") are printed from the collect they name.
REFERENCES = {"THE SUNDAY AFTER CHRISTMAS DAY": ("CHRISTMAS DAY", "second"), "THE FIRST SUNDAY AFTER EASTER": ("EASTER DAY", "second"),
              "MONDAY IN WHITSUN WEEK": ("WHITSUNDAY", None), "TUESDAY IN WHITSUN WEEK": ("WHITSUNDAY", None)}
BOOKS = {"1549": 0, "1552": 1, "1559": 2}
SMALL = {"OF", "AND", "THE", "IN", "AFTER", "ON"}


def nice(key):
    out = []
    for n, w in enumerate(key.replace("’S", "’s").split()):
        out.append(w.lower() if w in SMALL and n else (w if "’s" in w else w.capitalize()) if "’" not in w else w[0] + w[1:].lower() if False else w.capitalize())
    return " ".join(out).replace("’S", "’s")


def clean(t):
    t = re.sub(r"\s+", " ", t).strip()
    t = re.sub(r"\s+([,.;:?!)])", r"\1", t)
    return t


def apply(key, field, text, book):
    n = BOOKS[book]
    for k, f, old, *new in VARIANTS:
        if k == key and f == field:
            if old.startswith("RE:"):
                text = re.sub(old[3:], new[n], text, flags=re.S)
            else:
                text = text.replace(old, new[n])
    return text


TYPOS = {"astoniedat": "astonied at", "bebolde": "beholde", "cornmaundemente": "commaundemente",
         "Dornenus nosier": "Dominus noster", "Domine Dens salutis": "Domine Deus salutis", "venerunt genies": "venerunt gentes", "fremuerunt genies": "fremuerunt gentes", "Laud ate": "Laudate", "Portlo": "Portio", "contido": "confido", "Et venial": "Et veniat", "Abraham. by": "Abraham, by", "Abraham. for": "Abraham, for"}   # Justus transcription slips
# a full stop before a small letter inside a sentence is a leftover of the Justus variant marks ("all. their synnes")
STRAY = re.compile(r"\b(?!(?:[ivxlcd]+|St|Cor|Matt|Luke|Mar|Ps|Psalm|Rom|Gal|Heb|Eph|Tim|Thess|Pet|Phil|Col)\.)([A-Za-z]{2,})\. (?=[a-z])")


def finish(text):
    text = clean(text)
    for a, b in TYPOS.items():
        text = text.replace(a, b)
    text = STRAY.sub(r"\1 ", text)
    assert not re.search(r"[\[\]*]", text), text
    return text


def build(pages_dir):
    days = {}
    for page, d in load_all(pages_dir):
        days.setdefault(d["key"], d)
    out = {b: {} for b in BOOKS}
    for key, d in days.items():
        sets = {s["label"] or "only": s for s in d["sets"]}
        for book in BOOKS:
            n = BOOKS[book]
            if key == "SAINT MARY MAGDALENE" and book != "1549":
                continue
            if key == "CHRISTMAS DAY":
                chosen = [sets["second"], sets["first"]] if book == "1549" else [sets["second"]]
            elif key == "EASTER DAY":
                chosen = [sets["first"], sets["second"]] if book == "1549" else [sets["first"]]
            else:
                chosen = d["sets"][:1]
            res = []
            for s in chosen:
                cl = list(s["collect"])
                if key == "SAINT ANDREW’S DAY":
                    cl = [cl[0 if book == "1549" else 1]]
                if key == "SAINT MARK’S DAY":
                    cl = [cl[0]]
                res.append({"label": s["label"], "introit": s["introit"], "collect": cl, "epistle": s["epistle"], "gospel": s["gospel"]})
            out[book][key] = {"t": nice(key), "sets": res}
    # resolve references, then variants, Amens and introits per book
    for book in BOOKS:
        B = out[book]
        for key, (src, lab) in REFERENCES.items():
            if key in B:
                if src == "EASTER DAY":      # the collect of the second communion of Easter Day, which only the 1549 book prints there
                    ref = out["1549"][src]["sets"][1]["collect"]
                else:
                    ref = B[src]["sets"][0]["collect"]
                B[key]["sets"][0]["collect"] = list(ref)
        for key, day in B.items():
            for s in day["sets"]:
                if book != "1549":
                    s["introit"] = None
                cl = []
                for c in s["collect"]:
                    c = finish(apply(key, "collect", c, book))
                    c = re.sub(r"\s*Amen\.?$", "", c) if book != "1559" else c
                    cl.append(c)
                if book == "1559":
                    cl = [c if (c.endswith("Amen.") or c.endswith("&c.") or key == "THE FIRST SUNDAY IN ADVENT") else c + " Amen." for c in cl]
                    cl = [c for c in cl]
                s["collect"] = cl
                for f in ("epistle", "gospel"):
                    if s[f]:
                        s[f] = {"cite": re.sub(r"^[ ,.]+", "", s[f]["cite"]) + ".", "text": [finish(apply(key, f, x, book)) for x in s[f]["text"]]}
                if s["introit"]:
                    s["introit"] = {"head": finish(s["introit"]["head"]), "text": [finish(x) for x in s["introit"]["lines"] if not re.fullmatch(r"\s*Let us pray\.?\s*", x)]}
                if not s["label"]:
                    del s["label"]
                if not s["introit"]:
                    del s["introit"]
        # Purification: "The same that is appointed for the Sunday" is the epistle of the Sunday after Christmas
        pur = B.get("THE PURIFICATION OF SAINT MARY THE VIRGIN")
        if pur:
            pur["sets"][0]["epistle"] = json.loads(json.dumps(B["THE SUNDAY AFTER CHRISTMAS DAY"]["sets"][0]["epistle"]))
        # the Sixth Sunday after the Epiphany uses the services of the Fifth
        if "THE FIFTH SUNDAY AFTER THE EPIPHANY" in B:
            B["THE SIXTH SUNDAY AFTER THE EPIPHANY"] = json.loads(json.dumps(B["THE FIFTH SUNDAY AFTER THE EPIPHANY"]))
            B["THE SIXTH SUNDAY AFTER THE EPIPHANY"]["t"] = "The Sixth Sunday after the Epiphany"
    return out


def main():
    out = build(sys.argv[1])
    pf = ROOT / "tools" / "texts" / "bcp-propers.json"
    P = json.loads(pf.read_text(encoding="utf-8"))
    for book, B in out.items():
        P["propers"][book] = B
        print(book, len(B), "days ->", pf.name)
    pf.write_text(json.dumps(P, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
