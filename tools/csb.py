#!/usr/bin/env python3
"""Build data/lutheran-csb.json from the proofread Common Service Book texts (tools/texts/csb-*.txt):
The Service (the Common Service of 1888 as printed in the Common Service Book, 1917-1919) and the Introits,
Collects, Epistles, Graduals and Gospels of the church year.

    python3 tools/csb.py           # write data/lutheran-csb.json
    python3 tools/csb.py --check   # CI: rebuild in memory and compare with the committed JSON
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from bcp1928 import steps  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "lutheran-csb.json"
TXT = ROOT / "tools" / "texts"


def lines(name):
    return [l.strip() for l in (TXT / name).read_text(encoding="utf-8").split("\n") if l.strip() and not l.startswith("#")]


def sentence_case(t):
    """The first word of a prayer or lesson is printed in capitals: ALMIGHTY God, O LORD, WE give thanks."""
    t = re.sub(r"^(O |ALL )?([A-Z][A-Z'’-]+)\b", lambda m: (m.group(1) or "").capitalize() + (m.group(2).capitalize() if m.group(2) not in ("LORD", "GOD", "I") else (m.group(2) if m.group(2) == "I" else m.group(2).capitalize() if m.group(2) == "GOD" and not m.group(1) else m.group(2))), t)
    t = re.sub(r"^I ([A-Z]{2,})\b", lambda m: "I " + m.group(1).lower(), t)
    t = re.sub(r"^(\w+ )(GOD|MOST)\b", lambda m: m.group(1) + m.group(2).capitalize(), t)
    return t.replace("O LORD", "O Lord").replace("O GOD", "O God").replace("ALL MERCIFUL", "All Merciful")


# --------------------------------------------------------------------------- The Service
LABELS = {"V.": ("cel", "℣."), "R.": ("ppl", "℟."), "Versicle.": ("cel", "℣."), "Response.": ("ppl", "℟.")}


def role_from(rub):
    r = rub.lower()
    if "with the minister" in r or "minister and the congregation" in r:
        return "all"
    if re.search(r"(minister|he) shall say:?$", r):
        return "cel"
    if "congregation" in r and re.search(r"\b(say|sing)\b", r):
        return "ppl"
    if "minister" in r and re.search(r"\b(say|announce|read|turn)\b", r):
        return "cel"
    if re.search(r"sung or said|said or sung|be sung", r):
        return "all"
    return None


HEAD_ROLE = {"The General Prayer": "cel", "The Benediction": "cel"}


NOTES = {"[1]": "(a) Here he shall take the Paten with the Bread in his hand.", "[2]": "(b) Here he shall take the Cup in his hand."}


def service_items():
    out, who = [], "cel"
    for l in lines("csb-service.txt"):
        if l == "The Service" or re.match(r"^\[\d\] Here he shall", l):
            continue
        if l.startswith("¶"):
            t = l.lstrip("¶ ").strip()
            out.append(["rub", t, ""])
            who = role_from(t) or who
            continue
        if not re.search(r"[.:;?!,]$", l) and len(l.split()) <= 8:
            out.append(["h", l, ""])
            who = HEAD_ROLE.get(l, who)
            continue
        m = re.match(r"^(V\.|R\.|Versicle\.|Response\.)\s+(.*)$", l)
        if m:
            role, lab = LABELS[m.group(1)]
            out.append(["v", m.group(2), role, lab])
            continue
        notes = [NOTES[k] for k in NOTES if k in l]
        t = re.sub(r"\[(\d)\]", lambda m: "(" + "ab"[int(m.group(1)) - 1] + ") ", l)
        out.append(["v", sentence_case(t), who])
        out.extend(["rub", n, ""] for n in notes)
    return out


ANCHORS = [
    ("Invocation and Confession of Sins", "", None),
    ("Introit and Gloria Patri", r"^The Introit$", "introit"),
    ("Kyrie", r"^Then shall be sung or said the Kyrie", None),
    ("Gloria in Excelsis", r"^Then shall be sung the Gloria in Excelsis", None),
    ("Salutation and Collect", r"^Then shall the Minister say:$", "collect"),
    ("Epistle", r"^Then shall the Minister announce the Epistle", "epistle"),
    ("Gradual", r"^Then may the Gradual", "gradual"),
    ("Hallelujah or Sentence", r"^When the Gradual is omitted", "hallelujah"),
    ("Gospel", r"^Then shall the Minister announce the Gospel", "gospel"),
    ("Creed", r"^Then shall be said or sung the Creed", "creed"),
    ("Hymn and Sermon", r"^Then shall be sung the Hymn", "sermon"),
    ("Votum and Offertory", r"^The Sermon ended", None),
    ("The Offering", r"^Then shall the Offering be received", None),
    ("The General Prayer", r"^Then shall follow the General Prayer", None),
    ("Lord's Prayer, Hymn and Benediction", r"^Then shall the Minister and the Congregation say the Lord's Prayer", "ante"),
    ("The Preface", r"^The Holy Communion$", None),
    ("Proper Prefaces", r"^Proper Prefaces$", "prefaces"),
    ("Sanctus", r"^After the Preface shall follow immediately", None),
    ("Lord's Prayer and Words of Institution", r"^The Lord's Prayer$", None),
    ("Pax and Agnus Dei", r"^Then shall the Minister turn to the Congregation and say", None),
    ("The Administration", r"^Then shall the Communicants present themselves", "communion"),
    ("Nunc Dimittis", r"^Then shall the Congregation rise, and the Nunc Dimittis", None),
    ("Thanksgiving and Benediction", r"^Then shall be said the Thanksgiving", None),
]


def service():
    its = service_items()
    st = steps(its, ANCHORS)
    for s in st:                     # roles for sung texts: the Creed, Gloria Patri, Kyrie responses, Nunc dimittis
        if s.get("slot") in ("creed",):
            for it in s["items"]:
                if it[0] == "v":
                    it[2] = "all"
    return st


# --------------------------------------------------------------------------- the propers
PARTS = ("INTROIT", "COLLECT", "EPISTLE", "GRADUAL", "GOSPEL")
BOOKS = {"Matthew": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John", "Acts": "Acts", "Romans": "Rom",
         "1 Corinthians": "1 Cor", "2 Corinthians": "2 Cor", "Galatians": "Gal", "Ephesians": "Eph", "Philippians": "Phil",
         "Colossians": "Col", "1 Thessalonians": "1 Thess", "2 Thessalonians": "2 Thess", "1 Timothy": "1 Tim", "2 Timothy": "2 Tim",
         "Titus": "Titus", "Hebrews": "Heb", "James": "Jas", "1 Peter": "1 Pet", "2 Peter": "2 Pet", "1 John": "1 John",
         "Revelation": "Rev", "Isaiah": "Isa", "Jeremiah": "Jer", "Joel": "Joel", "Malachi": "Mal", "Deuteronomy": "Deut"}


def ref(cite):
    """'Romans 13:11-14' -> 'Rom 13:11-14' for the site's citation parser; None when there is no verse reference."""
    c = re.sub(r",? or The History of the Passion\.?$", "", cite).strip().rstrip(".")
    c = re.sub(r"\s*:\s*", ":", c).replace("--", "—")
    m = re.match(r"^((?:[1-3] )?[A-Z][a-z]+)\s+(\d.*)$", c)
    if not m or m.group(1) not in BOOKS:
        return None
    return BOOKS[m.group(1)] + " " + m.group(2).replace(" ", "")


def cite_obj(c):
    c = c.strip().rstrip(".")
    return {"cite": re.sub(r"\s*:\s*", ":", c), "ref": ref(c), "text": []}


KEYS = [  # title (as printed, lower case, up to the first full stop if it has a Latin name) -> key
    ("first sunday in advent", "adv1"), ("second sunday in advent", "adv2"), ("third sunday in advent", "adv3"), ("fourth sunday in advent", "adv4"),
    ("christmas day, the nativity of our lord", "christmas"), ("the second christmas day", "christmas2"),
    ("the first sunday after christmas", "xmas-s1"), ("the circumcision and name of jesus", "circumcision"), ("the second sunday after christmas", "xmas-s2"),
    ("the epiphany of our lord", "epiphany"), ("the transfiguration of our lord", "transfiguration"),
    ("septuagesima sunday", "septuagesima"), ("sexagesima sunday", "sexagesima"), ("quinquagesima sunday", "quinquagesima"),
    ("ash wednesday. the first day of lent", "ash"), ("invocavit", "lent1"), ("reminiscere", "lent2"), ("oculi", "lent3"), ("laetare", "lent4"),
    ("judica", "lent5"), ("palmarum", "palm"), ("monday in holy week", "hw1"), ("tuesday in holy week", "hw2"), ("wednesday in holy week", "hw3"),
    ("thursday in holy week", "hw4"), ("good friday", "hw5"), ("saturday in holy week", "hw6"), ("easter day", "easter"),
    ("monday after easter", "easter-mon"), ("quasi modo geniti", "easter1"), ("misericordias domini", "easter2"), ("jubilate", "easter3"),
    ("cantate", "easter4"), ("rogate", "easter5"), ("the ascension of our lord", "ascension"), ("exaudi", "exaudi"),
    ("the festival of pentecost", "pentecost"), ("the monday in whitsun-week", "pentecost-mon"), ("the festival of the holy trinity", "trinity"),
    ("apostles’ days", "apostles"), ("evangelists’ days", "evangelists"), ("the festival of harvest", "harvest"),
    ("a day of humiliation and prayer", "humiliation"), ("a day of general or special thanksgiving", "thanksgiving"),
]
ORD = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth", "eleventh", "twelfth", "thirteenth",
       "fourteenth", "fifteenth", "sixteenth", "seventeenth", "eighteenth", "nineteenth", "twentieth", "twenty-first", "twenty-second",
       "twenty-third", "twenty-fourth", "twenty-fifth", "twenty-sixth", "twenty-seventh"]
MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]


def key_of(title):
    t = title.lower().replace("'", "’")
    m = re.match(r"^the (\S+) sunday after (the epiphany|trinity)$", t)
    if m and m.group(1) in ORD:
        return ("epi" if "epiphany" in m.group(2) else "trin") + str(ORD.index(m.group(1)) + 1)
    for pre, k in KEYS:
        if t.startswith(pre):
            return k
    return None


ALIAS = {"christmas day": "christmas", "first sunday after christmas": "xmas-s1", "tuesday in holy week": "hw2", "easter day": "easter",
         "whitsunday": "pentecost", "annunciation": "f-03-25"}


def resolve(name):
    n = re.sub(r"^the ", "", name.strip().lower().replace("'", "’"))
    return ALIAS.get(n) or key_of("the " + n) or key_of(n)


def is_title(l, nxt):
    if l.startswith(("Other ", "OTHER ", "Or")) or re.match(r"^(For an early|For a later) service$", l) or l == "II":
        return False
    if re.match(r"^(The )?(For )?INTROIT|same as|^LESSONS", l):
        return False
    return not re.search(r"[.:;?!,]$", l) and not l.startswith(PARTS) and len(l.split()) <= 10


def propers():
    L = lines("csb-propers.txt")
    days, order, cur, S, part, alt = {}, [], None, None, None, False

    def new_set(label=None):
        s = {"introit": [], "collect": [], "epistle": None, "epistle_alt": None, "gradual": [], "gospel": None}
        if label:
            s["label"] = label
        cur["sets"].append(s)
        return s
    for i, l in enumerate(L):
        nxt = L[i + 1] if i + 1 < len(L) else ""
        if is_title(l, nxt) and not re.match(r"^(%s) \d+$" % "|".join(MONTHS), l):
            k = key_of(l)
            dm = re.match(r"^(%s) (\d+)$" % "|".join(MONTHS), nxt)
            if dm:
                k = f"f-{MONTHS.index(dm.group(1)) + 1:02d}-{int(dm.group(2)):02d}"
            if not k:
                raise SystemExit(f"no key for title {l!r}")
            if k in days:
                raise SystemExit(f"two days keyed {k}: {days[k]['t']!r} and {l!r}")
            cur = {"t": l, "sets": [], "more": [], "notes": [], "same": {}}
            days[k] = cur; order.append(k); S = new_set(); part = None
            continue
        if cur is None:
            continue
        m = re.match(r"^(%s) (\d+)$" % "|".join(MONTHS), l)
        if m:
            cur["date"] = f"{MONTHS.index(m.group(1)) + 1:02d}-{int(m.group(2)):02d}"
            continue
        m = re.match(r"^For (an early|a later) service$", l)
        if m:
            if S["introit"] or S["collect"]:
                S = new_set("For a later service" if "later" in l else "For an early service")
            else:
                S["label"] = l
            part = None
            continue
        if l == "II":
            continue
        if re.match(r"^(Other Collects|OTHER .*COLLECTS)", l):
            part = "more"; continue
        if "same as" in l or l.startswith("For INTROIT") or re.match(r"^The INTROIT, COLLECT, EPISTLE", l):
            cur["notes"].append(l)
            m = re.search(r"(?:same as for|see) (?:the )?(.+?)(?:[;,.]| p\. \d+|$)", l)
            if m and "same as" in l or l.startswith("For INTROIT"):
                tgt = resolve(m.group(1))
                if not tgt:
                    raise SystemExit(f"cannot resolve {l!r}")
                head = l.split("same as")[0] if "same as" in l else l.split(" see ")[0]
                for p in PARTS:
                    if p in head:
                        cur["same"][p.lower()] = tgt
            part = "introit" if l.endswith("or this:") else None
            continue
        m = re.match(r"^(EPISTLE|GOSPEL)\.\s+(.+?)(?:\.\s+GOSPEL\.\s+(.+))?$", l)
        if m:
            if m.group(1) == "EPISTLE":
                S["epistle"] = cite_obj(m.group(2))
                if m.group(3):
                    S["gospel"] = cite_obj(m.group(3)); part = None
                else:
                    part = "epistle"
            else:
                S["gospel"] = cite_obj(m.group(2)); part = "gospel"
            if "History of the Passion" in l:
                (S["gospel"] if m.group(1) == "GOSPEL" else S["epistle"])["passion"] = True
            continue
        if l.startswith("LESSONS."):
            cur["lessons"] = [cite_obj(c) for c in re.split(r"\.\s+(?=(?:[1-3] )?[A-Z])", l[len("LESSONS."):].strip())]
            continue
        m = re.match(r"^Or: (.+)$", l)
        if m:
            S["epistle_alt"] = cite_obj(m.group(1)); part = "epistle_alt"; continue
        if l == "COLLECTS":
            l = "COLLECT"
        if l in PARTS:
            part = l.lower()
            if part == "introit" and S["introit"]:
                pass
            if part in ("introit", "collect"):
                S[part].append([]) if part == "introit" else None
            if part == "introit" and S["introit"] and S["introit"][-1]:
                S["introit"].append([])
            continue
        if l == "Or,":
            if part == "introit":
                S["introit"].append([])
            alt = True
            continue
        if part is None:
            cur["notes"].append(l); continue
        if part == "introit":
            if not S["introit"]:
                S["introit"].append([])
            S["introit"][-1].append(sentence_case(l))
        elif part == "collect":
            S["collect"].append(sentence_case(l))
        elif part == "more":
            cur["more"].append(sentence_case(l))
        elif part == "gradual":
            S["gradual"].append(sentence_case(l))
        elif part in ("epistle", "gospel", "epistle_alt"):
            S[part]["text"].append(sentence_case(l))
    for k, d in days.items():          # resolve "the same as for ..." into copies, keeping where they came from
        for p, tgt in d["same"].items():
            src = days[tgt]["sets"][-1 if tgt == "christmas" else 0]
            for s in d["sets"]:
                if not s[p if p != "epistle" else "epistle"]:
                    s[p] = json.loads(json.dumps(src[p]))
                    s.setdefault("from", {})[p] = days[tgt]["t"]
        for s in d["sets"]:
            s["introit"] = [x for x in s["introit"] if x]
    return {"order": order, "days": days}


def build():
    return {"source": "Common Service Book of the Lutheran Church (Philadelphia, 1917-1919), public domain in the United States; "
                      "transcribed from the 1919 text edition and proofread against the 1917 and 1918 printings (see tools/texts/csb-*.txt)",
            "service": service(), **propers()}


def main():
    data = build()
    js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if "--check" in sys.argv:
        assert OUT.read_text(encoding="utf-8") == js, "data/lutheran-csb.json is out of date: run python3 tools/csb.py"
        d = data["days"]
        assert len(d) >= 95, len(d)
        bad = [k for k, v in d.items() if not any(s["collect"] for s in v["sets"]) and k not in ("hw6",) and "collect" not in v["same"]]
        assert not bad, bad
        print(f"csb ok: service {len(data['service'])} steps, {len(d)} days")
        return 0
    OUT.write_text(js, encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {"service": len(data["service"]), "days": len(data["days"])})
    return 0


if __name__ == "__main__":
    sys.exit(main())
