"""Assemble traditional (pre-1955 / 1962) and Novus Ordo Sunday & feast data,
normalize citations, and find Gospel overlaps for the hybrid OT reading."""
import json, re, collections

trad = json.load(open("trad.json"))
raw = json.load(open("no_raw.json"))

BOOKS = {
    "luc": "Luke", "luke": "Luke", "joann": "John", "joannes": "John", "john": "John",
    "matt": "Matt", "marc": "Mark", "mark": "Mark", "rom": "Rom", "philipp": "Phil",
    "phil": "Phil", "cor": "Cor", "gal": "Gal", "ephes": "Eph", "eph": "Eph", "col": "Col",
    "thess": "Thess", "tit": "Titus", "titus": "Titus", "hebr": "Heb", "heb": "Heb",
    "act": "Acts", "acts": "Acts", "pet": "Pet", "petri": "Pet", "jas": "Jas", "jac": "Jas",
    "is": "Isa", "isa": "Isa", "malach": "Mal", "judith": "Jdt", "apoc": "Rev", "prov": "Prov",
    "joël": "Joel", "joel": "Joel", "eccli": "Sir", "osee": "Hos", "exod": "Exod", "exodi": "Exod",
    "exodus": "Exod", "gen": "Gen", "baruch": "Bar", "ezech": "Ezek", "deut": "Deut",
    "jonæ": "Jonah", "dan": "Dan", "sap": "Wis",
}


def norm(ref):
    ref = ref.strip().rstrip(".")
    ref = re.sub(r"^(\d)\s+Joannes\b", r"\1 John", ref)
    m = re.match(r"^([1-4]\s?)?([^\W\d_][^\W\d_]*)\.?\s*(.*)$", ref)
    if not m:
        return ref
    num, book, rest = (m.group(1) or "").strip(), m.group(2), m.group(3)
    b = BOOKS.get(book.lower(), book)
    rest = rest.replace(" et ", ", ")
    rest = re.sub(r"^(\d+),\s*(\d)", r"\1:\2", rest)          # 'Judith 13, 22-25'
    rest = re.sub(r";\s*(\d+):", r"; \1:", rest)
    return (f"{num} {b} {rest}" if num else f"{b} {rest}").strip()


# ---------------------------------------------------------------- traditional
def trad_row(key, form):
    return [[lab, norm(c)] for lab, c in trad[key].get(form, [])]


TRAD = {k: {"pre55": trad_row(k, "pre55"), "1962": trad_row(k, "1962")} for k in trad}

# Manual entries where the missal files use special layouts (checked against
# the Divinum Officium source files Quad6-0/0r, Quad6-5/5r, Quad6-6/6r, Pasc6-6).
TRAD["PalmSunday"] = {
    "pre55": [["Lesson (blessing of palms)", "Exod 15:27-16:7"], ["Gospel (blessing of palms)", "Matt 21:1-9"],
              ["Epistle", "Phil 2:5-11"], ["Passion", "Matt 26:1-27:66"]],
    "1962": [["Gospel (blessing of palms)", "Matt 21:1-9"], ["Epistle", "Phil 2:5-11"],
             ["Passion", "Matt 26:36-27:60"]],
}
TRAD["GoodFriday"] = {
    f: [["Lesson", "Hos 6:1-6"], ["Lesson", "Exod 12:1-11"], ["Passion", "John 18:1-19:42"]]
    for f in ("pre55", "1962")}
TRAD["EasterVigil"] = {
    "pre55": [["Prophecy 1", "Gen 1:1-2:2"], ["Prophecy 2", "Gen 5-8 (selections)"],
              ["Prophecy 3", "Gen 22:1-19"], ["Prophecy 4", "Exod 14:24-15:1"],
              ["Prophecy 5", "Isa 54:17-55:11"], ["Prophecy 6", "Bar 3:9-38"],
              ["Prophecy 7", "Ezek 37:1-14"], ["Prophecy 8", "Isa 4:1-6"],
              ["Prophecy 9", "Exod 12:1-11"], ["Prophecy 10", "Jonah 3:1-10"],
              ["Prophecy 11", "Deut 31:22-30"], ["Prophecy 12", "Dan 3:1-24"],
              ["Epistle", "Col 3:1-4"], ["Gospel", "Matt 28:1-7"]],
    "1962": [["Prophecy 1", "Gen 1:1-2:2"], ["Prophecy 2", "Exod 14:24-15:1"],
             ["Prophecy 3", "Isa 4:2-6"], ["Prophecy 4", "Deut 31:22-30"],
             ["Epistle", "Col 3:1-4"], ["Gospel", "Matt 28:1-7"]],
}
TRAD["PentecostVigil"]["pre55"] = [
    ["Prophecy 1", "Gen 22:1-19"], ["Prophecy 2", "Exod 14:24-15:1"], ["Prophecy 3", "Deut 31:22-30"],
    ["Prophecy 4", "Isa 4:1-6"], ["Prophecy 5", "Bar 3:9-38"], ["Prophecy 6", "Ezek 37:1-14"],
] + TRAD["PentecostVigil"]["1962"]
TRAD["StJoseph"] = {f: [["Epistle", "Sir 45:1-6"], ["Gospel", "Matt 1:18-21"]] for f in ("pre55", "1962")}
TRAD["Annunciation"] = {f: [["Epistle", "Isa 7:10-15"], ["Gospel", "Luke 1:26-38"]] for f in ("pre55", "1962")}
TRAD["PeterPaul"] = {f: [["Epistle", "Acts 12:1-11"], ["Gospel", "Matt 16:13-19"]] for f in ("pre55", "1962")}
TRAD["Assumption"] = {f: [["Epistle", "Jdt 13:22-25; 15:10"], ["Gospel", "Luke 1:41-50"]] for f in ("pre55", "1962")}

# ---------------------------------------------------------------- Novus Ordo
CANTICLE = re.compile(r"^(Isa 12:2|Dan 3:5|Luke 1:46|Exod 15:1-2|1 Sam 2:1)")


def no_entry(num, year):
    """Merge ABC + year-specific rows into ordered slots."""
    rows = []
    for key in (f"{num}-ABC", f"{num}-{year}"):
        if key in raw:
            rows += raw[key]["r"]
    first, psalm, second, gospel = [], [], [], []
    for sheet, ref, day in rows:
        resp = "resp" in day.lower() or "response" in day.lower()
        if sheet == "Psalm" or (resp and CANTICLE.match(ref)) or CANTICLE.match(ref):
            psalm.append(ref)
        elif sheet == "Gospel":
            gospel.append(ref)
        elif sheet == "OT":
            first.append(ref)
        elif sheet == "NT":
            (first if ref.startswith("Acts") and not first and num in range(42, 64) else second).append(ref)
    return {"first": first, "psalm": psalm, "second": second, "gospel": gospel}


def no_series(nums):
    """nums: one number used for ABC, or a (A,B,C) tuple."""
    out = {}
    for i, y in enumerate("ABC"):
        n = nums[i] if isinstance(nums, tuple) else nums
        out[y] = no_entry(n, y)
    return out


NO = {}
NO["Adv1"], NO["Adv2"], NO["Adv3"], NO["Adv4"] = (no_series((1 + 3 * i, 2 + 3 * i, 3 + 3 * i)) for i in range(4))
NO["Christmas-Midnight"] = no_series(14); NO["Christmas-Dawn"] = no_series(15); NO["Christmas-Day"] = no_series(16)
NO["HolyFamily"] = no_series(17); NO["Jan1"] = no_series(18); NO["Epiphany"] = no_series(20)
NO["Baptism"] = no_series(21)
for i in range(5):
    NO[f"Lent{i+1}"] = no_series((22 + 3 * i, 23 + 3 * i, 24 + 3 * i))
NO["PalmSunday"] = no_series(38); NO["HolyThursday"] = no_series(39); NO["GoodFriday"] = no_series(40)
NO["EasterVigil"] = no_series(41); NO["Easter"] = no_series(42)
for i in range(5):
    NO[f"Easter{i+2}"] = no_series((43 + 3 * i, 44 + 3 * i, 45 + 3 * i))
NO["Ascension"] = no_series(58); NO["Easter7"] = no_series((59, 60, 61))
NO["PentecostVigil"] = no_series(62); NO["Pentecost"] = no_series(63)
for n in range(2, 34):
    base = 64 + 3 * (n - 2)
    NO[f"OT{n}"] = no_series((base, base + 1, base + 2))
NO["ChristKing"] = no_series((160, 161, 162))
NO["Trinity"] = no_series((164, 165, 166)); NO["CorpusChristi"] = no_series((167, 168, 169))
NO["SacredHeart"] = no_series((170, 171, 172))

# Fill-ins checked against the Lectionary for Mass (USA, 1998)
for y in "BC":
    NO["Easter2"][y]["gospel"] = ["John 20:19-31"]
NO["Easter"] = {y: {"first": ["Acts 10:34a, 37-43"], "psalm": ["Ps 118:1-2, 16-17, 22-23"],
                    "second": ["Col 3:1-4 or 1 Cor 5:6b-8"], "gospel": ["John 20:1-9"]} for y in "ABC"}
for y in "ABC":
    v = NO["EasterVigil"][y]
    v["first"] = [r for r in v["first"] if not CANTICLE.match(r)] + ["Isa 55:1-11", "Bar 3:9-15, 32-4:4", "Ezek 36:16-17a, 18-28"]
    v["first"] = list(dict.fromkeys(v["first"]))
    v["second"] = ["Rom 6:3-11"]
    v["psalm"] = ["Ps 104 (or 33)", "Ps 16", "Exod 15", "Ps 30", "Isa 12", "Ps 19", "Ps 42-43 (or Isa 12, Ps 51)", "Ps 118"]
NO["EasterVigil"]["A"]["gospel"] = ["Matt 28:1-10"]
NO["Baptism"]["A"]["gospel"] = ["Matt 3:13-17"]
NO["AshWed"] = {y: {"first": ["Joel 2:12-18"], "psalm": ["Ps 51:3-4, 5-6ab, 12-13, 14+17"],
                    "second": ["2 Cor 5:20-6:2"], "gospel": ["Matt 6:1-6, 16-18"]} for y in "ABC"}


def feast(first, psalm, second, gospel):
    g = gospel if isinstance(gospel, dict) else {y: gospel for y in "ABC"}
    return {y: {"first": [first], "psalm": [psalm], "second": [second], "gospel": [g[y]]} for y in "ABC"}


NO["Presentation"] = feast("Mal 3:1-4", "Ps 24:7, 8, 9, 10", "Heb 2:14-18", "Luke 2:22-40 or 2:22-32")
NO["StJoseph"] = feast("2 Sam 7:4-5a, 12-14a, 16", "Ps 89:2-3, 4-5, 27, 29", "Rom 4:13, 16-18, 22", "Matt 1:16, 18-21, 24a or Luke 2:41-51a")
NO["Annunciation"] = feast("Isa 7:10-14; 8:10", "Ps 40:7-8, 8-9, 10, 11", "Heb 10:4-10", "Luke 1:26-38")
NO["JohnBaptist"] = feast("Isa 49:1-6", "Ps 139:1-3, 13-14, 14-15", "Acts 13:22-26", "Luke 1:57-66, 80")
NO["PeterPaul"] = feast("Acts 12:1-11", "Ps 34:2-3, 4-5, 6-7, 8-9", "2 Tim 4:6-8, 17-18", "Matt 16:13-19")
NO["Transfiguration"] = feast("Dan 7:9-10, 13-14", "Ps 97:1-2, 5-6, 9", "2 Pet 1:16-19",
                              {"A": "Matt 17:1-9", "B": "Mark 9:2-10", "C": "Luke 9:28b-36"})
NO["Assumption"] = feast("Rev 11:19a; 12:1-6a, 10ab", "Ps 45:10, 11, 12, 16", "1 Cor 15:20-27", "Luke 1:39-56")
NO["AllSaints"] = feast("Rev 7:2-4, 9-14", "Ps 24:1-2, 3-4, 5-6", "1 John 3:1-3", "Matt 5:1-12a")
NO["AllSouls"] = feast("Wis 3:1-9 (or other options)", "Ps 23 (or 25, 27)", "Rom 5:5-11 (or other options)", "John 6:37-40 (or other options)")
NO["Immaculate"] = feast("Gen 3:9-15, 20", "Ps 98:1, 2-3, 3-4", "Eph 1:3-6, 11-12", "Luke 1:26-38")

# sanity: every NO entry has a gospel
missing = [(k, y) for k, v in NO.items() for y, e in v.items() if not e["gospel"]]
print("NO missing gospels:", missing)
miss1 = [(k, y) for k, v in NO.items() for y, e in v.items() if not e["first"]]
print("NO missing first readings:", miss1)

# ---------------------------------------------------------------- overlap
BOOKNORM = {"Matt": "Matt", "Mark": "Mark", "Luke": "Luke", "John": "John"}


def verses(ref):
    """Rough set of (book, chapter, verse) for a citation (first alternative only)."""
    ref = ref.split(" or ")[0]
    m = re.match(r"^((?:[1-4] )?[A-Za-z]+)\s+(.*)$", ref.strip())
    if not m:
        return set()
    book, rest = m.group(1), m.group(2)
    out, chap = set(), None
    for part in re.split(r"[;,]\s*", rest):
        part = part.strip()
        mm = re.match(r"^(?:(\d+):)?(\d+)[a-z]*(?:-(?:(\d+):)?(\d+)[a-z]*)?$", part)
        if not mm:
            continue
        c1, v1, c2, v2 = mm.groups()
        if c1:
            chap = int(c1)
        if chap is None:
            continue
        v1 = int(v1)
        if v2 is None:
            out.add((book, chap, v1)); continue
        end_c = int(c2) if c2 else chap
        v2 = int(v2)
        c, v = chap, v1
        while (c, v) <= (end_c, v2):
            out.add((book, c, v)); v += 1
            if v > 80: c, v = c + 1, 1
        chap = end_c
    return out


matches = {}
for k, forms in TRAD.items():
    g = [c for lab, c in forms["1962"] if lab.startswith(("Gospel", "Passion"))]
    if not g:
        continue
    gv = verses(g[-1])
    best = []
    for nk, years in NO.items():
        for y, e in years.items():
            for ng in e["gospel"]:
                ov = len(gv & verses(ng))
                if ov:
                    best.append((ov / max(1, len(gv)), nk, y, ng, e["first"]))
    best.sort(reverse=True)
    matches[k] = best[:3]

json.dump({"TRAD": TRAD, "NO": NO, "matches": matches}, open("data_all.json", "w"), indent=1, ensure_ascii=False)
for k, b in matches.items():
    top = b[0] if b else None
    print(f"{k:18s}", (f"{top[0]:.2f} {top[1]}-{top[2]} {top[3]} -> {top[4]}" if top else "-- no match"))
