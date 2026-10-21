"""Precompute daily Mass readings for every rite, 30 Nov 2025 – 30 Nov 2030."""
import json, re, datetime as dt, collections, openpyxl
import trad_engine as TE

D = dt.timedelta
PAGE = json.load(open("pagedata.json"))
EXTRA = json.load(open("extradata.json"))
T, N, H = PAGE["T"], PAGE["N"], PAGE["H"]
BYZ = EXTRA["BYZ"]
TARGETS = json.load(open("targets.json"))
PATH2KEY = {}
for k, v in TARGETS.items():
    PATH2KEY[v["1962"]] = k; PATH2KEY[v["pre55"]] = k
PATH2KEY["Sancti/12-25m3"] = "Christmas-Day"; PATH2KEY["Sancti/11-02m1"] = "AllSouls"

BOOKS = {"luc": "Luke", "joann": "John", "joannes": "John", "matt": "Matt", "marc": "Mark", "rom": "Rom",
         "philipp": "Phil", "phil": "Phil", "cor": "Cor", "gal": "Gal", "ephes": "Eph", "eph": "Eph", "col": "Col",
         "thess": "Thess", "tit": "Titus", "hebr": "Heb", "heb": "Heb", "act": "Acts", "acts": "Acts", "pet": "Pet",
         "petri": "Pet", "jac": "Jas", "jas": "Jas", "is": "Isa", "isa": "Isa", "malach": "Mal", "mal": "Mal",
         "judith": "Jdt", "apoc": "Rev", "prov": "Prov", "joël": "Joel", "joel": "Joel", "eccli": "Sir", "osee": "Hos",
         "exod": "Exod", "exodi": "Exod", "gen": "Gen", "baruch": "Bar", "bar": "Bar", "ezech": "Ezek", "deut": "Deut",
         "jonæ": "Jonah", "dan": "Dan", "sap": "Wis", "tob": "Tob", "jer": "Jer", "lev": "Lev", "num": "Num",
         "esth": "Esth", "job": "Job", "cant": "Song", "eccle": "Eccl", "mich": "Mic", "joannis": "John",
         "zach": "Zech", "soph": "Zeph", "agg": "Hag", "mac": "Macc", "machab": "Macc", "tim": "Tim",
         "joa": "John", "lucas": "Luke", "jud": "Jude", "philem": "Phlm", "thren": "Lam", "lam": "Lam", "ps": "Ps"}
REG = {"1": "1 Sam", "2": "2 Sam", "3": "1 Kgs", "4": "2 Kgs"}


def norm_trad(c):
    c = c.strip().rstrip(".")
    c = c.replace(" et ", ", ")
    m = re.match(r"^([1-4])?\s?([^\W\d_]+)\.?\s*(.*)$", c)
    if not m:
        return c
    n, b, rest = m.group(1), m.group(2), m.group(3)
    rest = re.sub(r"^(\d+),\s*(\d)", r"\1:\2", rest)
    if b.lower() == "reg" and n:
        return f"{REG[n]} {rest}"
    name = BOOKS.get(b.lower(), b)
    return f"{n} {name} {rest}" if n else f"{name} {rest}"


# ------------------------------------------------------------------ NO weekdays
wb = openpyxl.load_workbook("sa/_posts/catholic/plotBible/Lectionary-Weekdays.xlsx", read_only=True)
WD = collections.defaultdict(lambda: {"first": [], "psalm": [], "second": [], "gospel": []})
for ws in wb.worksheets:
    for r in list(ws.iter_rows(values_only=True))[1:]:
        if not r[0]:
            continue
        ref, day, yr = str(r[0]), str(r[1]), str(r[2])
        if re.search(r"\((Year [ABC]|in Year A|opt\. 2|opt\.|.*Year [ABC].*)\)", day) and "opt. 1" not in day:
            continue
        resp = bool(re.search(r"resp", day, re.I))
        base = re.sub(r"\s*\((resp\.?|Response|1st Reading|2nd Reading|opt\. 1|morning Mass)\)", "", day).strip()
        base = base.replace("Epi+D494phany", "Epiphany")
        for y in (["1", "2"] if yr == "1+2" else [yr]):
            e = WD[(base, y)]
            if ws.title == "Psalm" or resp:
                e["psalm"].append(ref)
            elif ws.title == "Gospel":
                e["gospel"].append(ref)
            elif ws.title == "NT" and ("2nd Reading" in day or "Chrism" in day and not ref.startswith("Isa")):
                e["second"].append(ref)
            else:
                e["first"].append(ref)
DOW = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"]
FULL = {"Sun": "Sunday", "Mon": "Monday", "Tues": "Tuesday", "Wed": "Wednesday", "Thurs": "Thursday", "Fri": "Friday", "Sat": "Saturday"}


def sdow(d): return (d.weekday() + 1) % 7


def nth(n): return f"{n}{'th' if 10 <= n % 100 <= 20 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


NO_FEASTS = {  # MM-DD: (name, color, first, psalm, second or None, gospel)
 "01-25": ("Conversion of St Paul", "white", "Acts 22:3-16 or 9:1-22", "Ps 117:1bc, 2", None, "Mark 16:15-18"),
 "02-22": ("Chair of St Peter", "white", "1 Pet 5:1-4", "Ps 23:1-3a, 4, 5, 6", None, "Matt 16:13-19"),
 "04-25": ("St Mark, Evangelist", "red", "1 Pet 5:5b-14", "Ps 89:2-3, 6-7, 16-17", None, "Mark 16:15-20"),
 "05-03": ("Sts Philip and James", "red", "1 Cor 15:1-8", "Ps 19:2-3, 4-5", None, "John 14:6-14"),
 "05-14": ("St Matthias", "red", "Acts 1:15-17, 20-26", "Ps 113:1-2, 3-4, 5-6, 7-8", None, "John 15:9-17"),
 "05-31": ("Visitation", "white", "Zeph 3:14-18a or Rom 12:9-16", "Isa 12:2-3, 4bcd, 5-6", None, "Luke 1:39-56"),
 "07-03": ("St Thomas", "red", "Eph 2:19-22", "Ps 117:1bc, 2", None, "John 20:24-29"),
 "07-22": ("St Mary Magdalene", "white", "Song 3:1-4b or 2 Cor 5:14-17", "Ps 63:2, 3-4, 5-6, 8-9", None, "John 20:1-2, 11-18"),
 "07-25": ("St James", "red", "2 Cor 4:7-15", "Ps 126:1bc-2ab, 2cd-3, 4-5, 6", None, "Matt 20:20-28"),
 "08-10": ("St Lawrence", "red", "2 Cor 9:6-10", "Ps 112:1-2, 5-6, 7-8, 9", None, "John 12:24-26"),
 "08-24": ("St Bartholomew", "red", "Rev 21:9b-14", "Ps 145:10-11, 12-13, 17-18", None, "John 1:45-51"),
 "09-08": ("Nativity of the BVM", "white", "Mic 5:1-4a or Rom 8:28-30", "Ps 13:6ab, 6c", None, "Matt 1:1-16, 18-23"),
 "09-14": ("Exaltation of the Holy Cross", "red", "Num 21:4b-9", "Ps 78:1bc-2, 34-35, 36-37, 38", "Phil 2:6-11", "John 3:13-17"),
 "09-21": ("St Matthew", "red", "Eph 4:1-7, 11-13", "Ps 19:2-3, 4-5", None, "Matt 9:9-13"),
 "09-29": ("Sts Michael, Gabriel and Raphael", "white", "Dan 7:9-10, 13-14 or Rev 12:7-12ab", "Ps 138:1-2ab, 2cde-3, 4-5", None, "John 1:47-51"),
 "10-18": ("St Luke, Evangelist", "red", "2 Tim 4:10-17b", "Ps 145:10-11, 12-13, 17-18", None, "Luke 10:1-9"),
 "10-28": ("Sts Simon and Jude", "red", "Eph 2:19-22", "Ps 19:2-3, 4-5", None, "Luke 6:12-16"),
 "11-09": ("Dedication of the Lateran Basilica", "white", "Ezek 47:1-2, 8-9, 12 or 1 Cor 3:9c-11, 16-17", "Ps 46:2-3, 5-6, 8-9", None, "John 2:13-22"),
 "11-30": ("St Andrew", "red", "Rom 10:9-18", "Ps 19:8, 9, 10, 11", None, "Matt 4:18-22"),
 "12-26": ("St Stephen", "red", "Acts 6:8-10; 7:54-59", "Ps 31:3cd-4, 6+8ab, 16bc+17", None, "Matt 10:17-22"),
 "12-27": ("St John, Apostle", "white", "1 John 1:1-4", "Ps 97:1-2, 5-6, 11-12", None, "John 20:1a, 2-8"),
 "12-28": ("Holy Innocents", "red", "1 John 1:5-2:2", "Ps 124:2-3, 4-5, 7cd-8", None, "Matt 2:13-18"),
 "12-12": ("Our Lady of Guadalupe (USA)", "white", "Zech 2:14-17 or Rev 11:19a; 12:1-6a, 10ab", "Jdt 13:18bcde, 19", None, "Luke 1:26-38 or 1:39-47"),
}
LORD_FEASTS = {"02-02", "08-06", "09-14", "11-09"}
SOLEMN_FIXED = {"03-19": "StJoseph", "03-25": "Annunciation", "06-24": "JohnBaptist", "06-29": "PeterPaul",
                "08-15": "Assumption", "11-01": "AllSaints", "12-08": "Immaculate"}


def no_from_key(k, L):
    e = N[k][L] if L in N[k] else N[k]["A"]
    return e


def no_entry_to_readings(k, e, numbering="n"):
    r = []
    alt = lambda a: [" or ".join(a)] if a else []
    if k == "EasterVigil":
        seen = set(); firsts = []
        for c in e["first"]:
            key = c.replace("3:32", "32")
            if key not in seen: seen.add(key); firsts.append(c)
        for i, c in enumerate(firsts): r.append([f"Reading {i+1}", c])
    else:
        lab = "First Reading"
        for c in alt(e["first"]): r.append([lab, c])
    for c in e["psalm"][:1]: r.append(["Responsorial Psalm", c])
    for c in alt(e["second"]): r.append(["Second Reading", c])
    for c in alt(e["gospel"]): r.append(["Passion" if k in ("PalmSunday", "GoodFriday") else "Gospel", c])
    return [[a, b, numbering] for a, b in r]


def year_letter(Y): return ["C", "A", "B"][(Y + 1) % 3]


def no_calendar(Y):
    """Return {date: (key|None, name, color, weekday_label|None)} for the NO year starting Advent Y."""
    E = TE.easter(Y + 1); A = TE.adv1(Y); nA = TE.adv1(Y + 1); CK = nA - D(7)
    out = {}
    def put(d, key, name, color, wl=None):
        out[d] = (key, name, color, wl)
    d = A
    bap = TE.sunday_in(Y + 1, 1, 7, 13)
    ash = E - D(46); pent = E + D(49)
    while d < nA:
        w = sdow(d); md = d.strftime("%m-%d")
        if d < dt.date(Y, 12, 25):
            wk = (d - A).days // 7 + 1
            if w == 0: put(d, f"Adv{wk}", N[f"Adv{wk}"]["n"], "rose" if wk == 3 else "violet")
            elif d.day >= 17 and d.month == 12:
                put(d, None, f"Advent weekday, {d.day} December", "violet", f"Advent, Dec. {d.day}")
            else: put(d, None, f"{FULL[DOW[w]]} of the {['','1st','2nd','3rd','4th'][wk]} week of Advent", "violet", f"Advent, Week {wk}, {DOW[w]}")
        elif d < bap + D(1):
            if md == "12-25": put(d, "Christmas-Day", "Nativity of the Lord", "white")
            elif md == "01-01": put(d, "Jan1", "Mary, Mother of God", "white")
            elif md == "01-06": put(d, "Epiphany", "Epiphany of the Lord", "white")
            elif d == bap: put(d, "Baptism", "Baptism of the Lord", "white")
            elif w == 0 and d.month == 12: put(d, "HolyFamily", "Holy Family", "white")
            elif w == 0 and d.month == 1 and d.day <= 5: put(d, "Christmas2", "2nd Sunday after the Nativity", "white")
            elif md in ("12-26", "12-27", "12-28"): put(d, None, "", "", None)
            elif d.month == 12: put(d, None, f"{['','','','','5th','6th','7th'][d.day-25]} day in the Octave of Christmas", "white", f"{['','','','','5th','6th','7th'][d.day-25]} Day in Xmas Octave, Dec. {d.day}")
            elif d.day <= 5: put(d, None, f"Christmas weekday, {d.day} January", "white", f"Jan. {d.day}")
            else: put(d, None, f"Christmas weekday, {d.day} January", "white", f"Jan. {d.day}")
        elif d < ash:
            wk = (d - bap).days // 7 + 1
            if w == 0: put(d, f"OT{wk}", N[f"OT{wk}"]["n"], "green")
            else: put(d, None, f"{FULL[DOW[w]]} of the {wk}{'st' if wk==1 else 'nd' if wk==2 else 'rd' if wk==3 else 'th'} week in Ordinary Time", "green", f"Ord. Time, Week {wk}, {DOW[w]}")
        elif d < E - D(7):
            if d == ash: put(d, "AshWed", "Ash Wednesday", "violet")
            elif d < ash + D(4): put(d, None, f"{['','','','','Thursday','Friday','Saturday'][w]} after Ash Wednesday", "violet", f"{['','','','','Thursday','Friday','Saturday'][w]} after Ash Wed.")
            else:
                wk = (d - (E - D(42))).days // 7 + 1
                if w == 0: put(d, f"Lent{wk}", N[f"Lent{wk}"]["n"], "rose" if wk == 4 else "violet")
                else: put(d, None, f"{FULL[DOW[w]]} of the {wk}{'st' if wk==1 else 'nd' if wk==2 else 'rd' if wk==3 else 'th'} week of Lent", "violet", f"Lent, Week {wk}, {DOW[w]}")
        elif d < E:
            k = {0: "PalmSunday", 4: "HolyThursday", 5: "GoodFriday", 6: "EasterVigil"}.get(w)
            if k: put(d, k, N[k]["n"], "red" if k in ("PalmSunday", "GoodFriday") else "white")
            else: put(d, None, f"{FULL[DOW[w]]} of Holy Week", "violet", f"Holy Week, {DOW[w]}")
        elif d <= pent:
            wk = (d - E).days // 7 + 1
            if d == E: put(d, "Easter", "Easter Sunday", "white")
            elif d == E + D(39): put(d, "Ascension", "Ascension of the Lord", "white")
            elif d == pent: put(d, "Pentecost", "Pentecost Sunday", "red")
            elif w == 0: put(d, f"Easter{wk}", N[f"Easter{wk}"]["n"], "white")
            elif wk == 1: put(d, None, f"{FULL[DOW[w]]} in the Octave of Easter", "white", f"Easter Octave, {DOW[w]}")
            else: put(d, None, f"{FULL[DOW[w]]} of the {nth(wk)} week of Easter", "white", f"Easter, Week {wk}, {DOW[w]}" + (" morn." if (wk == 7 and w == 6) else ""))
        else:
            if d == pent + D(7): put(d, "Trinity", "Most Holy Trinity", "white")
            elif d == pent + D(11): put(d, "CorpusChristi", "Body and Blood of Christ", "white")
            elif d == pent + D(19): put(d, "SacredHeart", "Most Sacred Heart of Jesus", "white")
            elif d == CK: put(d, "ChristKing", "Christ the King", "white")
            else:
                s = d - D(w)
                wk = 34 - (CK - s).days // 7
                if w == 0: put(d, f"OT{wk}", N[f"OT{wk}"]["n"], "green")
                elif d == pent + D(1): put(d, None, "Mary, Mother of the Church", "white", "MMC")
                else: put(d, None, f"{FULL[DOW[w]]} of the {nth(wk)} week in Ordinary Time", "green", f"Ord. Time, Week {wk}, {DOW[w]}")
        d += D(1)
    # fixed solemnities and feasts with precedence/transfer
    def sunday_privileged(x):
        k = out.get(x, (None,))[0] or ""
        return bool(re.match(r"^(Adv\d|Lent\d|Easter\d?|PalmSunday|Pentecost)$", k))
    for md, k in SOLEMN_FIXED.items():
        mo, da = map(int, md.split("-")); yy = Y if mo == 12 else Y + 1
        x = dt.date(yy, mo, da)
        if x not in out: continue
        if k == "Annunciation" and E - D(7) <= x <= E + D(7): x = E + D(8)
        elif k == "StJoseph" and E - D(7) <= x < E: x = E - D(8)
        elif sunday_privileged(x): x = x + D(1)
        out[x] = (k, N[k]["n"], "white" if k not in ("PeterPaul",) else "red", None)
    for md, f in NO_FEASTS.items():
        mo, da = map(int, md.split("-")); yy = Y if mo == 12 else Y + 1
        x = dt.date(yy, mo, da)
        if x not in out: continue
        cur = out[x]
        if cur[0] and (sdow(x) == 0 or cur[0] in SOLEMN_FIXED.values()): continue
        if cur[1] and re.match(r"(Holy Week|.*Octave of Easter|Ash)", cur[1] or ""): continue
        out[x] = ("F:" + md, f[0], f[1], None)
    for md in LORD_FEASTS:
        mo, da = map(int, md.split("-")); x = dt.date(Y + 1 if mo != 12 else Y, mo, da)
        if x in out and sdow(x) == 0 and (out[x][0] or "").startswith("OT"):
            out[x] = ("Presentation" if md == "02-02" else "Transfiguration" if md == "08-06" else "F:" + md,
                      {"02-02": "Presentation of the Lord", "08-06": "Transfiguration of the Lord", "09-14": "Exaltation of the Holy Cross", "11-09": "Dedication of the Lateran Basilica"}[md], "white", None)
    for md, k in (("02-02", "Presentation"), ("08-06", "Transfiguration"), ("11-02", "AllSouls")):
        mo, da = map(int, md.split("-")); x = dt.date(Y + 1, mo, da)
        if x in out and not sunday_privileged(x):
            out[x] = (k, N[k]["n"], "violet" if k == "AllSouls" else "white", None)
    return out


def no_day(d, cal, L):
    key, name, color, wl = cal[d]
    if key and key.startswith("F:"):
        f = NO_FEASTS[key[2:]]
        r = [["First Reading", f[2], "n"], ["Responsorial Psalm", f[3], "n"]] + ([["Second Reading", f[4], "n"]] if f[4] else []) + [["Gospel", f[5], "n"]]
        return {"t": name, "s": "Feast", "c": color, "r": r}
    if key:
        e = no_from_key(key, L)
        rr = no_entry_to_readings(key, e)
        if key == "PalmSunday":
            rr.insert(0, ["Procession Gospel", {"A": "Matt 21:1-11", "B": "Mark 11:1-10 or John 12:12-16", "C": "Luke 19:28-40"}[L], "n"])
        return {"t": name, "s": "Sunday" if sdow(d) == 0 else "Solemnity / proper day", "c": color, "r": rr}
    if wl == "MMC":
        return {"t": name, "s": "Memorial", "c": "white", "r": [["First Reading", "Gen 3:9-15, 20 or Acts 1:12-14", "n"], ["Responsorial Psalm", "Ps 87:1-2, 3+5, 6-7", "n"], ["Gospel", "John 19:25-34", "n"]]}
    y = "1" if d.year % 2 else "2"
    e = WD.get((wl, y)) or WD.get((wl, "1"))
    if not e:
        # labels like "Mon after Epiphany, or Jan. 7"
        for (lab, yy), v in WD.items():
            if yy == y and wl and lab.endswith(wl.split(", ")[-1]) and "Jan." in wl:
                e = v; break
    if not e:
        return {"t": name, "s": "Weekday", "c": color, "r": [], "note": "Weekday readings not found in the data for this day."}
    rr = [["First Reading", " or ".join(e["first"][:2]) if len(e["first"]) > 1 and "Dec. 21" in (wl or "") else e["first"][0], "n"]] if e["first"] else []
    if e["psalm"]: rr.append(["Responsorial Psalm", e["psalm"][0], "n"])
    if e["second"]: rr.append(["Second Reading", e["second"][0], "n"])
    if e["gospel"]: rr.append(["Gospel", e["gospel"][0], "n"])
    return {"t": name, "s": f"Weekday · Year {'I' if y == '1' else 'II'}", "c": color, "r": rr}


# ------------------------------------------------------------------ memorials (General Roman Calendar, USA)
from memorials import MEM, PROPER


def apply_memorials(d, cal, no):
    key, name, color, wl = cal[d]
    if key or sdow(d) == 0 or no.get("s") == "Feast": return no
    md = d.strftime("%m-%d"); E = TE.easter(d.year); off = (d - E).days
    items = list(MEM.get(md, [])); pkey = md
    if off == 69: items.insert(0, ("M", "white", "The Immaculate Heart of the Blessed Virgin Mary")); pkey = "IHM"
    if -7 <= off <= 7: return no                                   # Holy Week and the Easter Octave
    late_adv = d.month == 12 and 17 <= d.day <= 24; xmas = d.month == 12 and d.day >= 26
    lent = -46 < off < -7
    sat_bvm = sdow(d) == 6 and color == "green"
    if not items and not sat_bvm: return no
    no = dict(no); notes = [no["note"]] if no.get("note") else []
    if lent or late_adv or xmas:
        if items: notes.append("A commemoration may be made of " + "; ".join(n for _, _, n in items) + ".")
        if notes: no["note"] = " ".join(notes)
        return no
    obl = [x for x in items if x[0] == "M"]; opt = [x for x in items if x[0] == "m"]
    if len(obl) > 1: opt = [("m", c, n) for _, c, n in obl] + opt; obl = []     # two obligatory memorials: both become optional
    if obl:
        _, col, nm = obl[0]
        no["s"] = "Memorial"; no["c"] = col
        notes.insert(0, f"{name}. The readings are of the weekday" + (", with the proper reading of the memorial." if pkey in PROPER else ", or from the Common of Saints."))
        no["t"] = nm
        for lab, cit in PROPER.get(pkey, []):
            no["r"] = [[lab, cit, x[2]] if x[0] == lab else x for x in no["r"]]
    if opt:
        notes.append(("Optional memorial" + ("s" if len(opt) > 1 else "") + ": " + "; ".join(n for _, _, n in opt) + ".") if not obl else ("Also: " + "; ".join(n for _, _, n in opt) + " (optional)."))
    if sat_bvm and not obl: notes.append("Or the optional memorial of the Blessed Virgin Mary on Saturday.")
    no["note"] = " ".join(notes)
    return no


# ------------------------------------------------------------------ Byzantine
def ordn(n):
    return f"{n}{'th' if 10 <= n % 100 <= 20 else {1:'st',2:'nd',3:'rd'}.get(n % 10,'th')}"


def byz_day(d, Y):
    E = TE.easter(Y + 1) if d >= TE.adv1(Y) else TE.easter(Y)
    E = TE.easter(d.year)
    md = d.strftime("%m-%d")
    off = (d - E).days
    mv = BYZ["MOVE"].get(str(off))
    if mv and (-77 <= off <= 49) and (sdow(d) == 0 or off in (-3, -2, -1, 39)):
        return {"t": mv[0], "r": [["Apostol", mv[1], "n"], ["Gospel", mv[2], "n"]]}
    if md in BYZ["FEASTS"] and (sdow(d) != 0 or BYZ["KIND"].get(md) == "lord"):
        f = BYZ["FEASTS"][md]; return {"t": f[0], "r": [["Apostol", f[1], "n"], ["Gospel", f[2], "n"]], "feast": md}
    if sdow(d) != 0:
        return None
    P = (E + D(49)) if off > 49 else (TE.easter(d.year - 1) + D(49))
    n = (d - P).days // 7
    for fs in BYZ["FIXEDSUN"]:
        if fs[0] == d.month and fs[1] <= d.day <= fs[2]:
            return {"t": fs[3], "s": f"{ordn(n)} Sunday after Pentecost", "r": [["Apostol", fs[4], "n"], ["Gospel", fs[5], "n"]], "proper": True}
    Sx = TE.sunday_in(P.year, 9, 15, 21)
    sub = ""
    if d > Sx:
        k = (d - Sx).days // 7
        if k <= 14: gos = BYZ["LG"][k]; sub = f"{ordn(k)} Sunday of Luke"
        else: gos = "Matt 15:21-28"; sub = "back-fill week (see ordo)"
    else:
        gos = BYZ["GM"][n] if n <= 17 else "Matt 15:21-28"
    ep = BYZ["EP"][n] if n <= 32 else "2 Cor 6:16-7:1"
    if n > 31: sub = (sub + " · " if sub else "") + "Apostol back-filled (see ordo)"
    return {"t": "Sunday of All Saints" if n == 1 else f"{ordn(n)} Sunday after Pentecost", "s": sub, "r": [["Apostol", ep, "n"], ["Gospel", gos, "n"]]}


BD = json.load(open("byz_daily.json"))
WDN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


def byz_weekday_title(d):
    E = TE.easter(d.year); p = (d - E).days
    if p < -77: p = (d - TE.easter(d.year - 1)).days
    w = sdow(d); W = WDN[w]
    if -6 <= p <= -4: return f"Great and Holy {W}", ""
    if p == -8: return "Saturday of Lazarus", ""
    if -48 <= p <= -9:
        k = (p + 48) // 7 + 1
        return f"{W} of the {ordn(k)} week of the Great Fast", ("Aliturgical day: no Divine Liturgy is normally served; the Sixth Hour and Vespers readings are below." if w in (1, 2, 4) else "Liturgy of the Presanctified Gifts")
    if -76 <= p <= -50:
        sun = BYZ["MOVE"].get(str(p - w))
        return f"{W} after the {sun[0]}" if sun else f"{W} of the Triodion", ""
    if 1 <= p <= 6: return f"Bright {W}", ""
    if 8 <= p <= 48:
        if p == 24: return "Mid-Pentecost", ""
        sun = BYZ["MOVE"].get(str(p - w))
        return (f"{W} after the {sun[0]}" if sun else f"{W} of Paschaltide"), ""
    if p == 50: return "Monday of the Holy Spirit", ""
    if 51 <= p <= 55: return f"{W} after Pentecost", ""
    n = (p - 57) // 7 + 1
    return f"{W} of the {ordn(n)} week after Pentecost", ""


def byz_full(d, Y):
    """Curated Sundays and feasts, the computed daily lectionary for every other day, and feast precedence."""
    iso = d.isoformat(); md = d.strftime("%m-%d"); w = sdow(d)
    base = byz_day(d, Y); comp = BD.get(iso, {"r": []})
    plain = [r for r in comp["r"] if " · " not in r[0] or r[0].startswith(("Sixth Hour", "Vespers"))]
    saint = [r for r in comp["r"] if " · " in r[0] and not r[0].startswith(("Sixth Hour", "Vespers"))]
    sname = re.sub(r"^(Holy |Ven\. )", "", (comp.get("feast") or "").split(" / ")[-1]).strip()
    if sname and not re.match(r"^(Sts?|Synaxis|Apostle|Holy|Greatmartyr|Prophet|Martyrs?|Image|Church)\b", sname): sname = "St " + sname
    kind = BYZ["KIND"].get(md); feast = BYZ["FEASTS"].get(md)
    feast_rows = [["Apostol · " + feast[0], feast[1], "n"], ["Gospel · " + feast[0], feast[2], "n"]] if feast else []
    if base and base.get("feast"):                     # a feast on a weekday, or a feast of the Lord
        if kind in ("saint",) or (md == "10-01"):     # lesser feasts keep the daily readings too
            dl = [r for r in plain if r[0] in ("Apostol", "Gospel")]
            base["r"] = dl + feast_rows if dl else base["r"]
            base["s"] = "Feast, with the readings of the day"
        else:
            base["s"] = "Great Feast" if kind in ("lord", "theotokos") else "Feast"
        base.pop("feast", None)
        return base
    if base:                                          # a Sunday or a movable day
        if w == 0 and not base.get("proper") and str((d - TE.easter(d.year)).days) not in BYZ["MOVE"]:
            ap = next((r for r in plain if r[0] == "Apostol"), None); gs = next((r for r in plain if r[0] == "Gospel"), None)
            if ap and gs and (ap[1], gs[1]) != (base["r"][0][1], base["r"][1][1]):
                base["r"] = [ap, gs]; base["s"] = ""
        base.pop("proper", None)
        if feast and kind != "lord":                  # feast on a Sunday (or in Holy Week): both are kept
            base["r"] = base["r"] + feast_rows
            base["t"] = f"{base['t']} · {feast[0]}"
            base["s"] = ((base.get("s") or "") + " · " if base.get("s") else "") + "the feast is kept together with the day"
        elif saint and not feast and w == 0:
            base["r"] = base["r"] + saint; base["t"] = f"{base['t']} · {sname}" if sname else base["t"]
        return base
    t, note = byz_weekday_title(d)
    out = {"t": t, "s": note, "r": plain + saint}
    if saint and sname: out = {"t": sname, "s": t + (" · " + note if note else ""), "r": plain + saint}
    if not plain: return None
    return out


# ------------------------------------------------------------------ hybrid
def hybrid_day(d, m, no):
    key = PATH2KEY.get(m["path"]) if m else None
    privileged = m and (sdow(d) == 0 or m["rank"] >= 5 or TE.is_privileged_tempora(m["path"]) or re.match(r"Tempora/(Pasc0|Pasc7)-", m["path"]) or m["s"] == "Vigilia")
    if m and privileged:
        base = [[l, norm_trad(c), "v"] for l, c in m["r"]]
        h = H.get(key) if key else None
        out = base
        if key == "EasterVigil" or key == "PentecostVigil":
            out = [[l, norm_trad(c), "v", True] for l, c in TARGETS_P[key]]
        elif key == "PalmSunday":
            out = [["Lesson · palms", "Exod 15:27-16:7", "v", True], ["Gospel · palms", "Matt 21:1-9", "v"], ["Prophecy", h["r"], "n", True], ["Epistle", "Phil 2:5-11", "v"], ["Passion", "Matt 26:1-27:66", "v", True]]
        elif key == "GoodFriday":
            out = [x for x in base if x[0] != "Gospel" and x[0] != "Passion"] + [["Lesson", h["r"], "n", True]] + [x for x in base if x[0] in ("Gospel", "Passion")]
        elif h and h["b"] == "apostle":
            g = [x for x in base if x[0] == "Gospel"]; rest = [["Lesson" if x[0] == "Epistle" else x[0]] + x[1:] for x in base if x[0] != "Gospel"]
            out = rest + [["Apostle", h["r"], "n", True]] + g
        elif h:
            out = [["Acts" if h["b"] == "acts" else "Prophecy", h["r"], "n", True]] + base
        return {"t": m["t"], "s": "Traditional proper" + (" with added reading" if h else ""), "r": out}
    rr = [x + [True] for x in no["r"]] if no else []
    note = "Weekday course from the new lectionary."
    if m and m.get("kind") == "sancti":
        note += f" Today's saint in the 1962 calendar: {m['t']} (its proper or common may be used instead)."
    return {"t": (no or {}).get("t", "Weekday"), "s": "Hybrid weekday", "r": rr, "note": note}


# ------------------------------------------------------------------ 1662 collect of the day (Ordinariate office)
NUMW = ["", "FIRST", "SECOND", "THIRD", "FOURTH", "FIFTH", "SIXTH", "SEVENTH", "EIGHTH", "NINTH", "TENTH", "ELEVENTH", "TWELFTH", "THIRTEENTH",
        "FOURTEENTH", "FIFTEENTH", "SIXTEENTH", "SEVENTEENTH", "EIGHTEENTH", "NINETEENTH", "TWENTIETH", "TWENTY-FIRST", "TWENTY-SECOND",
        "TWENTY-THIRD", "TWENTY-FOURTH", "TWENTY-FIFTH"]
BCP_HOLY = {"11-30": "SAINT ANDREW’S DAY", "12-21": "SAINT THOMAS THE APOSTLE", "01-25": "THE CONVERSION OF SAINT PAUL", "02-02": "THE PURIFICATION OF SAINT MARY THE VIRGIN",
            "02-24": "SAINT MATTHIAS’S DAY", "03-25": "THE ANNUNCIATION OF THE BLESSED VIRGIN MARY", "04-25": "SAINT MARK’S DAY", "05-01": "SAINT PHILIP AND SAINT JAMES’S DAY",
            "06-11": "SAINT BARNABAS THE APOSTLE", "06-24": "SAINT JOHN BAPTIST’S DAY", "06-29": "SAINT PETER’S DAY", "07-25": "SAINT JAMES THE APOSTLE",
            "08-24": "SAINT BARTHOLOMEW THE APOSTLE", "09-21": "SAINT MATTHEW THE APOSTLE", "09-29": "SAINT MICHAEL AND ALL ANGELS", "10-18": "SAINT LUKE THE EVANGELIST",
            "10-28": "SAINT SIMON AND SAINT JUDE, APOSTLES", "11-01": "ALL SAINTS’ DAY", "12-26": "SAINT STEPHEN’S DAY", "12-27": "SAINT JOHN THE EVANGELIST’S DAY",
            "12-28": "THE INNOCENTS’ DAY", "01-01": "THE CIRCUMCISION OF CHRIST", "01-06": "THE EPIPHANY", "12-25": "CHRISTMAS DAY"}


def bcp_name(d):
    """The 1662 Prayer Book collect for this day: a holy day's own, else the Sunday's (weekdays take the preceding Sunday's)."""
    md = d.strftime("%m-%d")
    E = TE.easter(d.year); off = (d - E).days
    special = {0: "EASTER DAY", 1: "MONDAY IN EASTER WEEK", 2: "TUESDAY IN EASTER WEEK", -1: "EASTER EVEN", 39: "THE ASCENSION DAY", 50: "MONDAY IN WHITSUN WEEK", 51: "TUESDAY IN WHITSUN WEEK", -46: "ASH WEDNESDAY"}
    if off in special: return special[off]
    if md in BCP_HOLY and not (sdow(d) == 0 and md not in ("12-25", "01-06", "01-01")): return BCP_HOLY[md]
    s = d - D(sdow(d))
    if s.month == 12 and s.day > 25 or (s.month == 1 and s.day < 6 and sdow(d) == 0 and False): return "THE SUNDAY AFTER CHRISTMAS DAY"
    Es = TE.easter(s.year); so = (s - Es).days
    if -46 < off < -42 and sdow(d) != 0: return "ASH WEDNESDAY"
    if 39 < off < 42: return "THE ASCENSION DAY"
    named = {-63: "SEPTUAGESIMA", -56: "SEXAGESIMA", -49: "QUINQUAGESIMA", -42: "THE FIRST SUNDAY IN LENT", -35: "THE SECOND SUNDAY IN LENT", -28: "THE THIRD SUNDAY IN LENT",
             -21: "THE FOURTH SUNDAY IN LENT", -14: "THE FIFTH SUNDAY IN LENT", -7: "THE SUNDAY NEXT BEFORE EASTER", 0: "EASTER DAY", 7: "THE FIRST SUNDAY AFTER EASTER",
             14: "THE SECOND SUNDAY AFTER EASTER", 21: "THE THIRD SUNDAY AFTER EASTER", 28: "THE FOURTH SUNDAY AFTER EASTER", 35: "THE FIFTH SUNDAY AFTER EASTER",
             42: "SUNDAY AFTER ASCENSION DAY", 49: "WHITSUNDAY", 56: "TRINITY SUNDAY"}
    if so in named: return named[so]
    A = TE.adv1(s.year)
    if s >= A:
        k = (s - A).days // 7 + 1
        if k <= 4: return f"THE {NUMW[k]} SUNDAY IN ADVENT"
    if s.month == 12 and s.day >= 25: return "THE SUNDAY AFTER CHRISTMAS DAY"
    if s.month == 1 and s.day < 6: return "THE CIRCUMCISION OF CHRIST" if d.month == 1 else "THE SUNDAY AFTER CHRISTMAS DAY"
    if so < -63:                                            # Sundays after the Epiphany
        ep = dt.date(s.year, 1, 6); k = (s - ep).days // 7 + (0 if sdow(ep) == 0 else 1)
        return f"THE {NUMW[max(1, min(6, k))]} SUNDAY AFTER THE EPIPHANY" if k >= 1 else "THE EPIPHANY"
    if so > 56:                                             # Sundays after Trinity; the Sunday next before Advent is always the 25th
        nxt = TE.adv1(s.year); k = (s - (Es + D(56))).days // 7
        if (nxt - s).days == 7 or k >= 25: return "THE TWENTY-FIFTH SUNDAY AFTER TRINITY"
        if k <= 24: return f"THE {NUMW[k]} SUNDAY AFTER TRINITY"
    return "TRINITY SUNDAY"


# ------------------------------------------------------------------ Ordinariate names
def ord_name(d, cal_entry, Y):
    key = cal_entry[0]
    if not key or sdow(d) != 0: return ""
    E = TE.easter(Y + 1); off = (d - E).days; bap = TE.sunday_in(Y + 1, 1, 7, 13)
    if key == "Baptism": return "1st Sunday after Epiphany (Baptism of the Lord)"
    if off == -63: return "Septuagesima"
    if off == -56: return "Sexagesima"
    if off == -49: return "Quinquagesima"
    if off == -14: return "Passion Sunday"
    if off == 49: return "Whitsunday"
    if key.startswith("OT") and off < -63: return f"{ordn((d - bap).days // 7 + 1)} Sunday after Epiphany"
    if key.startswith("OT") and off > 56: return f"{ordn((off - 56) // 7)} Sunday after Trinity"
    return ""


PD = json.load(open("pagedata.json"))
TARGETS_P = {k: PD["T"][k]["p"] for k in ("EasterVigil", "PentecostVigil")}

start, end = dt.date(2025, 11, 30), dt.date(2030, 11, 30)
trad = {f: TE.year_days(start, end, f) for f in ("1962", "pre55")}
DAYS = {}
for Y in (2025, 2026, 2027, 2028, 2029):
    cal = no_calendar(Y); L = year_letter(Y)
    for d in sorted(cal):
        iso = d.isoformat()
        no = apply_memorials(d, cal, no_day(d, cal, L))
        m, p = trad["1962"].get(iso), trad["pre55"].get(iso)
        E_ = TE.easter(d.year); off_ = (d - E_).days
        hw = {-7: "PalmSunday", -2: "GoodFriday", -1: "EasterVigil", 48: "PentecostVigil"}.get(off_)
        def tr(x, fk="m"):
            if not x: return None
            rr = PD["T"][hw][fk] if hw else x["r"]
            o = {"t": x["t"], "s": x["s"], "r": [[l, norm_trad(c) if not hw else c, "v"] for l, c in rr], "path": x["path"], "feria": x.get("kind") == "feria" or x["t"].startswith("Feria · ")}
            if x.get("comm"): o["note"] = f"Commemoration: {x['comm']}"
            return o
        o = dict(no); o["r"] = [[a, b, "k"] for a, b, _ in no["r"]]
        o["bcp"] = bcp_name(d)
        on = ord_name(d, cal[d], Y)
        if on: o["s"] = "Divine Worship: " + on
        b = byz_full(d, Y)
        DAYS[iso] = {"n": no, "o": o, "m": tr(m, "m"), "p": tr(p, "p"), "h": hybrid_day(d, m, no), "b": b, "L": L, "nk": cal[d][0],
                     "yr": "I" if d.year % 2 else "II"}

json.dump(DAYS, open("days.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(DAYS), "days")
import collections as C
empty = C.Counter(); ex = {}
for iso, x in DAYS.items():
    for k in ("n", "m", "p", "h"):
        if not x[k] or not x[k]["r"]:
            empty[k] += 1; ex.setdefault(k, []).append((iso, x[k] and x[k]["t"]))
print("days with no readings:", dict(empty))
for k, v in ex.items(): print(k, v[:8])
nwd = C.Counter(len(x["n"]["r"]) for x in DAYS.values()); print("NO reading counts:", dict(nwd))
for iso in ("2026-10-20", "2026-10-25", "2026-11-01", "2026-12-08", "2027-03-19", "2027-03-25", "2026-12-25", "2027-01-18", "2027-04-01"):
    x = DAYS[iso]
    print("\n==", iso)
    for k in ("n", "o", "m", "p", "h", "b"):
        v = x[k]
        print(f"  {k}:", v and (v["t"], v.get("s"), [(r[0], r[1]) for r in v["r"]], v.get("note", "")))
