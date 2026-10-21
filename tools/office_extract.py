"""Sunday Matins Scripture lessons (1st nocturn) for pre-1955 and 1962, from Divinum Officium."""
import sys, re, json
sys.argv = ['x', 'do/web/www/horas/Latin']
exec(open('do_extract.py').read().split("if __name__")[0])

BK = {"reg": None, "apo": "Rev", "act": "Acts", "ezech": "Ezek", "ezek": "Ezek", "mac": "Macc", "joannes": "John",
      "joann": "John", "marc": "Mark", "luc": "Luke", "eccli": "Sir", "sap": "Wis", "eccle": "Eccl", "eccl": "Eccl",
      "judith": "Jdt", "osee": "Hos", "abd": "Obad", "mich": "Mic", "soph": "Zeph", "agg": "Hag", "zach": "Zech",
      "jona": "Jonah", "isa": "Isa", "jer": "Jer", "gen": "Gen", "exod": "Exod", "prov": "Prov", "job": "Job",
      "tob": "Tob", "esth": "Esth", "dan": "Dan", "joel": "Joel", "amos": "Amos", "nah": "Nah", "hab": "Hab",
      "mal": "Mal", "mic": "Mic", "jas": "Jas", "pet": "Pet", "col": "Col", "cor": "Cor", "gal": "Gal", "phil": "Phil",
      "tim": "Tim", "heb": "Heb", "rom": "Rom", "eph": "Eph", "thess": "Thess", "lam": "Lam", "bar": "Bar"}
REG = {"1": "1 Sam", "2": "2 Sam", "3": "1 Kgs", "4": "2 Kgs"}


def norm(c):
    if not c:
        return None
    c = c.strip().rstrip(".")
    m = re.match(r"^([1-4])?\s?([^\W\d_]+)\.?\s*(.*)$", c)
    if not m:
        return c
    n, b, rest = m.group(1), m.group(2).lower(), m.group(3)
    if b == "reg":
        return f"{REG[n]} {rest}"
    name = BK.get(b, m.group(2))
    return f"{n} {name} {rest}" if n else f"{name} {rest}"


def segs(c):
    """'Isa 1:1-3' -> ('Isa', [(1,1,1,3)])  (c1,v1,c2,v2)"""
    m = re.match(r"^((?:[1-4] )?[A-Za-z]+) (.*)$", c)
    book, rest = m.group(1), m.group(2)
    out, chap = [], None
    for part in re.split(r";\s*|,\s*", rest):
        mm = re.match(r"^(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?$", part.strip())
        if not mm:
            return book, None
        c1, v1, c2, v2 = mm.groups()
        chap = int(c1) if c1 else chap
        v1 = int(v1)
        e_c = int(c2) if c2 else chap
        e_v = int(v2) if v2 else v1
        out.append([chap, v1, e_c, e_v])
        chap = e_c
    return book, out


def merge(cits):
    cits = [c for c in cits if c]
    if not cits:
        return None
    book = None
    allsegs = []
    for c in cits:
        b, s = segs(c)
        if s is None or (book and b != book):
            return "; ".join(cits)
        book = b
        allsegs += s
    merged = [allsegs[0]]
    for s in allsegs[1:]:
        p = merged[-1]
        if (s[0] == p[2] and s[1] <= p[3] + 1) or (s[0] == p[2] + 1 and s[1] == 1):
            if (s[2], s[3]) > (p[2], p[3]): p[2], p[3] = s[2], s[3]
        else:
            merged.append(s)
    def fmt(s, prevchap):
        a = f"{s[0]}:{s[1]}" if True else ""
        if s[2] == s[0]:
            return a if s[3] == s[1] else f"{a}-{s[3]}"
        return f"{a}-{s[2]}:{s[3]}"
    return book + " " + "; ".join(fmt(s, None) for s in merged)


def lessons(path, form):
    cs = [norm(citation(section(path, f"Lectio{i}", form))) for i in (1, 2, 3)]
    if cs[0] and not cs[1] and re.match(r"^(Mark|Matt|Luke|John) ", cs[0]):
        return "Homily on " + cs[0]
    return merge(cs)


OUT = {"tempora": {}, "month": {}}
keys = [f"Adv{i}" for i in range(1, 5)] + ["HolyFamily"] + [f"Epi{i}" for i in range(2, 7)] + \
       ["Septuagesima", "Sexagesima", "Quinquagesima"] + [f"Lent{i}" for i in range(1, 6)] + ["PalmSunday", "Easter"] + \
       [f"Pasc{i}" for i in range(1, 6)] + ["SunAfterAscension", "Pentecost", "Trinity"] + [f"Pent{i}" for i in range(2, 12)]
FILE = {**{f"Adv{i}": f"Adv{i}-0" for i in range(1, 5)}, "HolyFamily": "Epi1-0",
        **{f"Epi{i}": f"Epi{i}-0" for i in range(2, 7)}, "Septuagesima": "Quadp1-0", "Sexagesima": "Quadp2-0",
        "Quinquagesima": "Quadp3-0", **{f"Lent{i}": f"Quad{i}-0" for i in range(1, 6)}, "PalmSunday": "Quad6-0",
        "Easter": "Pasc0-0", **{f"Pasc{i}": f"Pasc{i}-0" for i in range(1, 6)}, "SunAfterAscension": "Pasc6-0",
        "Pentecost": "Pasc7-0", "Trinity": "Pent01-0", **{f"Pent{i}": f"Pent{i:02d}-0" for i in range(2, 12)}}
for k in keys:
    OUT["tempora"][k] = {f: lessons("Tempora/" + FILE[k], f) for f in ("pre55", "1962")}
for m in ("08", "09", "10", "11"):
    for w in range(1, 6):
        OUT["month"][f"{m}{w}"] = {f: lessons(f"Tempora/{m}{w}-0", f) for f in ("pre55", "1962")}

json.dump(OUT, open("office.json", "w"), indent=1, ensure_ascii=False)
for sec in OUT.values():
    for k, v in sec.items():
        print(f"{k:18s} {v['1962']}" + ("" if v["pre55"] == v["1962"] else f"   | pre55: {v['pre55']}"))
