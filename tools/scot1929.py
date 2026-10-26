#!/usr/bin/env python3
"""Draft the Collects, Epistles and Gospels of the Scottish Book of Common Prayer (1929) for tools/texts/bcp-propers.json
("propers" → "1929"), from the Society of Archbishop Justus transcription (justus.anglican.org/resources/bcp/Scotland/,
Scot_*_Readings.htm). The draft is checked by hand against the scan (justus.anglican.org/resources/bcp/Scotland/
BCP1929.pdf) before it is kept; tools/bcp_early.py then writes data/bcp1929.json.

    python3 tools/scot1929.py PAGES_DIR [SCAN.txt]   # write the draft into tools/texts/bcp-propers.json
    python3 tools/scot1929.py PAGES_DIR --dump       # print the parsed days

SCAN.txt is the text layer of the scan (pdftotext BCP1929.pdf). The transcription carries its own OCR slips ("bath"
for hath, "lie" for he, "Cod" for God), words dropped ("put upon us armour of light"), line-end hyphens
("there-fore") and footnote markers ("charity1 ... 1 Or love."). Each place where the draft differs from the
1662 wording of the same reading is looked up in the scan's text: a slip, a dropped word or a stray word is put
right where the scan reads as 1662 does and not as the draft does. The 1929 book's own revisions (the Revised
Version readings it adopts, "Take thought for things honourable", "Hagar") are kept.

Each day is keyed as data/bcp1662.json keys it (the day table's "bcp" key), in the same shape:
{t, sets:[{collect:[...], epistle:{cite, text, head?, alt?}, gospel:{cite, text, alt?}, extra:[{head, text}]}], notes}.
The book's "The Lesson" (a reading from the Old Testament, the Acts or the Revelation in the Epistle's place) keeps
its heading in "head"; an "Or this" reading is "alt"; the optional collects and anthems the book adds to a day
(an Additional Collect for Christmastide, the Easter Anthems) are "extra". The occasional days the 1929 book adds
(the Lent and Rogation weekdays, Lammas, the Commons) have no key in the day table and are left out.
"""
import html
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from bcp1928 import sentence_case  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXTS = ROOT / "tools" / "texts" / "bcp-propers.json"
PAGES = ["Scot_Advent&Xmas_Readings.htm", "Scot_Epiphany&Lent_Readings.htm", "Scot_HolyWeek_Readings.htm",
         "Scot_Easter_Asc_Whit_Readings.htm", "Scot_TrinityA_Readings.htm", "Scot_TrinityB_Readings.htm",
         "Scot_Saints_Days_Readings.htm"]
KEYS = json.loads((ROOT / "data" / "bcp1662.json").read_text(encoding="utf-8"))["propers"]
# 1929 titles that are not the 1662 key as printed
ALIAS = {"THE NATIVITY OF OUR LORD, OR THE BIRTH-DAY OF CHRIST": "CHRISTMAS DAY", "THE SUNDAY NEXT BEFORE ADVENT": "THE TWENTY-FIFTH SUNDAY AFTER TRINITY",
         "PALM SUNDAY": "THE SUNDAY NEXT BEFORE EASTER", "THE SUNDAY AFTER ASCENSION DAY": "SUNDAY AFTER ASCENSION DAY", "THE SUNDAY NEXT BEFORE EASTER": "THE SUNDAY NEXT BEFORE EASTER",
         "THURSDAY BEFORE EASTER": "THURSDAY BEFORE EASTER", "EASTER EVE": "EASTER EVEN",
         "THE PRESENTATION OF CHRIST IN THE TEMPLE": "THE PURIFICATION OF SAINT MARY THE VIRGIN", "SAINT ANDREW’S DAY": "SAINT ANDREW’S DAY"}


def paras(path):
    s = pathlib.Path(path).read_text(encoding="latin-1")
    out = []
    # paragraphs are <p>, and now and then a <div> holding text but no paragraphs of its own
    for m in re.finditer(r"<(p)\b([^>]*)>(.*?)</p>|<(div)\b([^>]*)>((?:(?!<div\b|<p\b|</?table\b).)*?)</div>", s, re.S | re.I):
        if m.group(4):
            m = type("M", (), {"group": lambda self, n, m=m: m.group({0: 0, 1: 4, 2: 5, 3: 6}[n])})()
        inner = m.group(3)
        t = re.sub(r"<br[^>]*>", " ", inner)
        t = re.sub(r"<[^>]+>", "", t)
        t = html.unescape(t).replace("\xa0", " ").replace("’", "’")
        t = re.sub(r"\s+", " ", t).strip()
        if not t:
            continue
        t = t.replace("'", "’")
        # a rubric is printed in italics: most of the paragraph's letters are inside <em> or <i>
        ital = "".join(re.findall(r"<(?:em|i)\b[^>]*>(.*?)</(?:em|i)>", inner, re.S | re.I))
        ital = len(re.sub(r"[^A-Za-z]", "", html.unescape(re.sub(r"<[^>]+>", "", ital))))
        rub = ital > .6 * max(1, len(re.sub(r"[^A-Za-z]", "", t)))
        out.append({"a": re.findall(r'<a\s+name="([^"]+)"', inner, re.I), "c": "center" in m.group(2).lower(), "r": rub, "t": t})
    return out


HEAD = re.compile(r"^(The Collects?|The Epistle|The Lesson|The Gospel)[.:]?\s*(.*)$")


def upper(t):
    letters = [c for c in re.sub(r"\[[^\]]*\]", "", t) if c.isalpha()]
    return len(letters) > 3 and sum(c.isupper() for c in letters) / len(letters) > .7


def cite(t):
    t = re.sub(r"^(St\.|Saint) ", "", t.strip().rstrip("."))
    return t


def days(pages_dir):
    out, day, mode, pending_alt, last = [], None, None, False, None

    def new(title):
        nonlocal day, mode, last
        day = {"title": title, "names": [title], "set": {"collect": [], "extra": []}, "notes": []}
        out.append(day); mode, last = "title", None
    for name in PAGES:
        ps = paras(pathlib.Path(pages_dir) / name)
        start = next((n for n, p in enumerate(ps) if p["c"] and upper(p["t"]) and "COLLECTS, EPISTLES" not in p["t"]
                      and not p["t"].startswith("TO BE USED")), 0)
        mode = None
        for p in ps[start:]:
            t = p["t"]
            if t.startswith(("Return to", "Next ", "Previous ", "Web author", "The Book of Common Prayer")) or "Charles Wohlers" in t:
                break
            h = HEAD.match(t) if p["c"] else None
            if not h and len(t) < 160 and ((p["a"] and (p["c"] or upper(t))) or (p["c"] and upper(t) and mode != "title")):
                new(t); continue
            if day is None:
                continue
            if mode == "title" and p["c"] and not h and (upper(t) or re.match(r"^(commonly called|or |The Sunday called|The First Day of Lent)", t)):
                day["names"].append(t); continue
            if pending_alt:
                pending_alt = False
                m = HEAD.match(t)
                c = m.group(2) if m else t
                kind = last or "epistle"
                day["set"][kind]["alt"] = {"cite": cite(c), "text": []}
                if m and m.group(1) == "The Lesson":
                    day["set"][kind]["alt"]["head"] = "The Lesson"
                mode = ("alt", kind); continue
            if h:
                k = h.group(1)
                if k.startswith("The Collect"):
                    mode = "collect"
                elif k in ("The Epistle", "The Lesson"):
                    if "gospel" in day["set"]:   # "If there be two or more celebrations ...": a second set follows
                        day.setdefault("more", []).append(day["set"])
                        day["set"] = {"collect": [], "extra": day["set"].pop("extra")}
                    day["set"]["epistle"] = {"cite": cite(h.group(2)), "text": []}
                    if k == "The Lesson":
                        day["set"]["epistle"]["head"] = "The Lesson"
                    mode = last = "epistle"
                else:
                    day["set"]["gospel"] = {"cite": cite(h.group(2)), "text": []}
                    mode = last = "gospel"
                continue
            if p["c"] and re.match(r"^Or this,?$", t):
                pending_alt = True; continue
            if p["c"] or p["r"]:
                if re.match(r"^(An Additional Collect|Collects which)", t) or "Anthems shall be sung or said" in t:
                    day["set"]["extra"].append({"head": t.rstrip("."), "text": []}); mode = "extra"
                else:
                    day["notes"].append(t)
                    if mode == "title":
                        mode = None
                continue
            body = re.sub(r"^(I|A) ([A-Z]{2,})\b", lambda m: m.group(1) + " " + (m.group(2) if m.group(2) in ("LORD", "GOD") else m.group(2).lower()), sentence_case(t))
            if mode == "collect":
                day["set"]["collect"].append(body)
            elif mode in ("epistle", "gospel"):
                day["set"][mode]["text"].append(body)
            elif isinstance(mode, tuple):
                day["set"][mode[1]]["alt"]["text"].append(body)
            elif mode == "extra":
                day["set"]["extra"][-1]["text"].append(body)
            else:
                day["notes"].append(t)
    return out


def key(d):
    for n in d["names"]:
        t = re.sub(r"\s*\[[^\]]*\]\s*", "", n).strip().rstrip(".").upper()
        t = re.sub(r"^THE SUNDAY CALLED$", "", t)
        if t in ALIAS:
            return ALIAS[t]
        if t in KEYS:
            return t
        t2 = re.sub(r"^(SAINT [A-Z ]+?)’S DAY$", r"\1’S DAY", t)
        if t2 in KEYS:
            return t2
    return None


SLIPS = {"bath": "hath", "bad": "had", "lie": "he", "amid": "and", "audi": "and", "cod": "god", "auger": "anger", "vet": "yet",
         "hey": "they", "defying": "denying", "1": "I", "seas": "sea,"}


def words_of(t):
    return " ".join(re.sub(r"[^a-z]+", " ", t.lower()).split())


def correct(propers, scan_text):
    """Put right the transcription's slips against the scan (see the module docstring). Returns the changes made."""
    import difflib
    O = " " + words_of(scan_text) + " "
    seen = lambda ws: (" " + words_of(" ".join(ws)) + " ") in O if words_of(" ".join(ws)) else True
    log = []
    for k, d in propers.items():
        a = KEYS[k]["sets"][0]
        for s in d["sets"][:1]:
            fields = [("collect", n) for n in range(min(1, len(s["collect"]), len(a["collect"])))] + [(f, None) for f in ("epistle", "gospel") if f in s and f in a]
            for f, n in fields:
                E = (a["collect"][0] if f == "collect" else " ".join(a[f]["text"])).split()
                paras = [s["collect"][0]] if f == "collect" else s[f]["text"]
                # footnote markers: "charity1" and the note "1 Or love." printed with the reading
                paras = [re.sub(r"(?<=[a-z])\d\b", "", t) for t in paras if not re.match(r"^\d+ Or \w+\.?$", t)]
                paras = [re.sub(r"\s+\d+ Or [a-z]+\.$", "", t) for t in paras]
                fixed = []
                for t in paras:
                    D = t.split()
                    # line-end hyphens: there-fore, par-takers (where the 1662 text has the word whole)
                    whole = set(w.strip(".,;:?!").lower() for w in E)
                    D = [w.replace("-", "") if "-" in w and w.replace("-", "").strip(".,;:?!").lower() in whole else w for w in D]
                    sm = difflib.SequenceMatcher(None, [words_of(w) for w in E], [words_of(w) for w in D], autojunk=False)
                    if sm.ratio() < .6:
                        fixed.append(" ".join(D)); continue
                    out = []
                    for op, i1, i2, j1, j2 in sm.get_opcodes():
                        ed, dd = E[i1:i2], D[j1:j2]
                        ce, cd = E[max(0, i1 - 2):i1] + ed + E[i2:i2 + 2], D[max(0, j1 - 2):j1] + dd + D[j2:j2 + 2]
                        take = False
                        if op == "replace" and len(dd) == 1 and len(ed) == 1 and (SLIPS.get(words_of(dd[0]) or dd[0]) or "").lower() in (ed[0].lower(), words_of(ed[0])):
                            take = True

                        if take:
                            rep = [w if not (w[0].isupper() and n == 0 and dd and dd[0][0].islower()) else w for n, w in enumerate(ed)]
                            log.append(f"{k} {f}: [{' '.join(dd)}] -> [{' '.join(rep)}]")
                            out += rep
                        else:
                            out += dd
                    fixed.append(" ".join(out))
                if f == "collect":
                    s["collect"][0] = fixed[0]
                else:
                    s[f]["text"] = fixed
    # words the transcription drops or adds, each confirmed in the scan by hand
    for k, f, old, new in FIXES:
        s = propers[k]["sets"][0]
        paras = s["collect"] if f == "collect" else s[f]["text"]
        hits = [n for n, t in enumerate(paras) if old in t]
        assert len(hits) == 1, (k, f, old)
        paras[hits[0]] = paras[hits[0]].replace(old, new, 1)
        log.append(f"{k} {f}: [{old}] -> [{new}]")
    for k, f, old, new in CITES:
        r = propers[k]["sets"][0][f]
        r = r["alt"] if r["cite"] != old else r
        assert r["cite"] == old, (k, f, old)
        r["cite"] = new
        log.append(f"{k} {f} citation: {old} -> {new}")
    return log


# citations the transcription misprints, as the scan prints them
CITES = [("SAINT STEPHEN’S DAY", "gospel", "Matthew 23. 84", "Matthew 23. 34"),
         ("THE TWENTY-FIFTH SUNDAY AFTER TRINITY", "gospel", "John 6", "John 6. 5"),
         ("SAINT SIMON AND SAINT JUDE, APOSTLES", "epistle", "Revelation 21 9", "Revelation 21. 9")]


FIXES = [("THE FIRST SUNDAY IN ADVENT", "collect", "put upon us armour", "put upon us the armour"),
         ("THE THIRD SUNDAY IN LENT", "epistle", "children; and in love", "children; and walk in love"),
         ("THE EIGHTEENTH SUNDAY AFTER TRINITY", "epistle", "behalf, for grace of God", "behalf, for the grace of God"),
         ("THE PURIFICATION OF SAINT MARY THE VIRGIN", "gospel", "purification, according the law", "purification, according to the law"),
         ("THE FOURTEENTH SUNDAY AFTER TRINITY", "gospel", "It came that to pass", "It came to pass")]


def main():
    pages = sys.argv[1]
    D = days(pages)
    if "--dump" in sys.argv:
        for d in D:
            s = d["set"]
            print(key(d), "|", " / ".join(d["names"]), "|", len(s["collect"]), s.get("epistle", {}).get("cite"), s.get("gospel", {}).get("cite"),
                  "| alt:", [s[k]["alt"]["cite"] for k in ("epistle", "gospel") if k in s and "alt" in s[k]], "| extra:", [e["head"][:40] for e in s["extra"]], "| notes:", len(d["notes"]))
        return 0
    propers = {}
    for d in D:
        k = key(d)
        if not k or k in propers:
            continue
        sets = d.get("more", []) + [d["set"]]
        for s in sets:
            if not s.get("extra"):
                s.pop("extra", None)
        if len(sets) > 1:   # the extra collects and anthems belong to the day: keep them with the first set
            sets[0]["extra"] = sets[0].get("extra", []) + sets[-1].pop("extra", [])
            if not sets[0]["extra"]:
                del sets[0]["extra"]
            for s, lab in zip(sets, ("first", "second", "third")):
                s["label"] = lab
        title = " ".join(re.sub(r"\s*\[[^\]]*\]", "", n) for n in d["names"])
        propers[k] = {"t": re.sub(r"\s+", " ", title).strip().title().replace("’S", "’s").replace(" Of ", " of ").replace(" The ", " the ").replace(" In ", " in ").replace(" After ", " after ").replace(" Before ", " before ").replace(" And ", " and ").replace(" Or ", " or ").replace("Commonly Called", "commonly called").replace("Sunday Called", "Sunday called").replace(" To ", " to ").rstrip("."),
                      "sets": sets, "notes": d["notes"]}
    scan = next((a for a in sys.argv[2:] if a.endswith(".txt")), None)
    if scan:
        for line in correct(propers, pathlib.Path(scan).read_text(encoding="utf-8", errors="replace")):
            print("corrected:", line)
    T = json.loads(TEXTS.read_text(encoding="utf-8"))
    T["propers"]["1929"] = {k: propers[k] for k in KEYS if k in propers}
    TEXTS.write_text(json.dumps(T, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    missing = [k for k in KEYS if k not in propers]
    print(f"{len(T['propers']['1929'])} days; not found: {missing}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
