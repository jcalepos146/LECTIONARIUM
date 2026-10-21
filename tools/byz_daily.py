"""Byzantine daily lectionary (Apostol, Gospel, Lenten paremias) for every day in range.

The cycle logic (Lukan jump, floating Sundays, reserves, Theophany step-back) is a Python port of
orthocal by Brian Glass (MIT licence, github.com/brianglass/orthocal), and the pericope table is
orthocal's OCA calendar database. Byzantine Catholics in North America keep Pascha on the Gregorian
date, so the cycle is anchored to Western Easter here; the menaion is filtered to feasts kept by
the Byzantine Catholic Churches.
Run: python3 -I byz_daily.py <path to oca_calendar.db>   -> byz_daily.json
"""
import sqlite3, sys, json, re, datetime as dt
import trad_engine as TE

DB = sqlite3.connect(f"file:{sys.argv[1]}?mode=ro", uri=True)
D = dt.timedelta
SUN, MON, TUE, WED, THU, FRI, SAT = range(7)


def wd(p): return (7 + p % 7) % 7          # weekday from pascha distance (Pascha is a Sunday)


def weekends(p):
    w = wd(p)
    return p - w - 1, p - 7 + ((7 - w) % 7), p + 7 - ((w + 1) % 7), p + 7 - w


class Year:
    def __init__(self, Y):
        self.Y = Y
        self.P = TE.easter(Y); self.prevP = TE.easter(Y - 1); self.nextP = TE.easter(Y + 1)
        pd = lambda m, d, y=Y: (dt.date(y, m, d) - self.P).days
        self.Theophany = pd(1, 6, Y + 1); self.Annunciation = pd(3, 25)
        self.Nativity = pd(12, 25); self.Elevation = pd(9, 14); self.NativityTheotokos = pd(9, 8)
        p = pd(7, 16); w = wd(p); self.FathersSix = p - w if w < THU else p + 7 - w
        p = pd(10, 11); w = wd(p); self.FathersSeven = p + (7 - w if w > SUN else 0)
        p = pd(10, 26); self.DemetriusSaturday = p - wd(p) - 1
        p = pd(11, 1); self.SynaxisUnmercenaries = p + 7 - wd(p)
        w = wd(self.Nativity); self.Forefathers = self.Nativity - 14 + ((7 - w) % 7)
        self.LucanJump = 168 - (self.Elevation + 7 - wd(self.Elevation))
        self.floats = []
        self._floats(pd); self._nodaily(); self._reserves()

    def addf(self, i, p): self.floats.append((i, p))

    def _floats(self, pd):
        self.addf(1001, self.FathersSix); self.addf(1002, self.FathersSeven)
        self.addf(1003, self.DemetriusSaturday); self.addf(1004, self.SynaxisUnmercenaries)
        sb, ub, sa, ua = weekends(self.Elevation)
        if sb == self.NativityTheotokos: self.addf(1005, self.Elevation - 1)
        else: self.addf(1006, sb)
        self.addf(1007, ub); self.addf(1008, sa); self.addf(1009, ua); self.addf(1010, self.Forefathers)
        sb, ub, sa, ua = weekends(self.Nativity); N = self.Nativity
        if N - 1 == sb: self.addf(1013, N - 2); self.addf(1012, ub); self.addf(1015, N - 1)
        elif N - 1 == ub: self.addf(1013, N - 3); self.addf(1011, sb); self.addf(1016, N - 1)
        else: self.addf(1014, N - 1); self.addf(1011, sb); self.addf(1012, ub)
        sbT, ubT, saT, uaT = weekends(self.Theophany); T = self.Theophany
        w = wd(N)
        if w == SUN: self.addf(1017, sa); self.addf(1020, N + 1); self.addf(1024, ubT); self.addf(1026, T - 1)
        elif w == MON: self.addf(1017, sa); self.addf(1021, ua); self.addf(1023, T - 5); self.addf(1026, T - 1)
        elif w == TUE: self.addf(1019, sa); self.addf(1021, ua); self.addf(1027, sbT); self.addf(1023, T - 5); self.addf(1025, T - 2)
        elif w == WED: self.addf(1019, sa); self.addf(1021, ua); self.addf(1022, sbT); self.addf(1028, ubT); self.addf(1025, T - 3)
        elif w in (THU, FRI): self.addf(1019, sa); self.addf(1021, ua); self.addf(1022, sbT); self.addf(1024, ubT); self.addf(1026, T - 1)
        else: self.addf(1018, N + 6); self.addf(1021, ua); self.addf(1022, sbT); self.addf(1024, ubT); self.addf(1026, T - 1)
        self.addf(1029, saT); self.addf(1030, uaT)
        # 1031 (New Martyrs of Russia) is OCA-only: not added
        A = self.Annunciation; w = wd(A)
        if w == SAT: self.addf(1032, A - 1); self.addf(1033, A)
        elif w == SUN: self.addf(1034, A)
        elif w == MON: self.addf(1035, A)
        else: self.addf(1036, A - 1); self.addf(1037, A)

    def float_index(self, p):
        for i, q in self.floats:
            if q == p: return i
        return 499

    def _nodaily(self):
        T, N = self.Theophany, self.Nativity
        _, ub, sa, ua = weekends(T)
        s = {ub, ua, T - 5, T - 1, T, self.Forefathers}
        if sa == T + 1: s.add(T + 1)
        _, ub, _, ua = weekends(N)
        s |= {ub, N - 1, N, N + 1, ua}
        if wd(self.Annunciation) == SAT: s.add(self.Annunciation)
        self.nodaily = s

    def _reserves(self):
        _, _, _, ua = weekends(self.Theophany)
        self.ExtraSundays = ((self.nextP - self.P).days - 84 - ua) // 7
        self.Reserves = []
        if self.ExtraSundays > 0:
            i = self.Forefathers + self.LucanJump + 7
            while i <= 266: self.Reserves.append(i); i += 7
            rem = self.ExtraSundays - len(self.Reserves)
            if rem > 0:
                i = 175 - rem * 7
                while i < 169: self.Reserves.append(i); i += 7


YEARS = {}


def pdist_of(d):
    Y = d.year; p = (d - TE.easter(Y)).days
    if p < -77: Y -= 1; p = (d - TE.easter(Y)).days
    if Y not in YEARS: YEARS[Y] = Year(Y)
    return p, YEARS[Y]


def adjusted(d, p, y):
    jump = y.LucanJump if p > weekends(y.Elevation)[3] else 0
    if p in y.nodaily: return 499, 499
    limit = 272
    if p == 252: e = y.Forefathers
    elif p > limit: e = (d - y.nextP).days
    else: e = p
    if wd(y.Theophany) < TUE: limit = 279
    ua = weekends(y.Theophany)[3]
    if p == 245 - y.LucanJump: g = y.Forefathers + y.LucanJump
    elif p > ua and wd(p) == SUN and y.ExtraSundays > 1:
        i = (p - ua) // 7; g = y.Reserves[i - 1] if 0 < i <= len(y.Reserves) else p + jump
    elif p + jump > limit: g = (d - y.nextP).days
    else: g = p + jump
    return e, g


# menaion feasts kept by the Byzantine Catholic Churches (month, day)
KEEP = {(1, 1), (1, 6), (1, 17), (1, 30), (2, 2), (2, 24), (3, 9), (3, 25), (4, 23), (4, 25), (4, 30), (5, 8), (5, 11),
        (5, 21), (6, 11), (6, 24), (6, 29), (6, 30), (7, 15), (7, 20), (8, 6), (8, 15), (8, 29), (9, 8), (9, 14), (9, 26),
        (10, 1), (10, 6), (10, 9), (10, 18), (10, 26), (11, 8), (11, 13), (11, 14), (11, 16), (11, 21), (11, 30), (12, 5),
        (12, 6), (12, 25)}
OCA_ONLY = re.compile(r"Innocent|Tikhon|Raphael|Herman|Alexis|Jacob|Seraphim|Sergius|Job|Alaska|Russia|Moscow|Brooklyn", re.I)
BOOK = {"1 Peter": "1 Pet", "3 Kgs": "1 Kgs", "4 Kgs": "2 Kgs", "Philemon": "Phlm", "Judges": "Judg", "Micah": "Mic",
        "Baruch": "Bar", "Ezekiel": "Ezek", "Daniel": "Dan", "Malachi": "Mal"}
BOOKNAME = {"Gen": "Genesis", "Prov": "Proverbs", "Isa": "Isaiah", "Exod": "Exodus", "Job": "Job", "Ezek": "Ezekiel", "Zech": "Zechariah",
            "Wis": "Wisdom", "Jer": "Jeremiah", "Joel": "Joel", "Zeph": "Zephaniah", "Mic": "Micah", "1 Kgs": "1 Kings", "2 Kgs": "2 Kings",
            "Num": "Numbers", "Deut": "Deuteronomy", "Josh": "Joshua", "Judg": "Judges", "Dan": "Daniel", "Mal": "Malachi", "Bar": "Baruch",
            "Lev": "Leviticus", "Jonah": "Jonah", "Amos": "Amos"}


def conv(s):
    m = re.match(r"^((?:[1-4] )?[A-Za-z]+)\s+(.*)$", s.strip())
    if not m: return s
    bk, rest = m.group(1), m.group(2)
    bk = BOOK.get(bk, bk)
    if "." not in rest: return f"{bk} {rest} (composite)"
    out = []
    for i, tok in enumerate([t.strip() for t in rest.split(",")]):
        if "." in tok.split("-")[0]:
            out.append(("; " if i else "") + tok.replace(".", ":"))
        else:
            out.append(", " + tok.replace(".", ":"))
    return bk + " " + "".join(out)


def rows(where):
    q = f"""select r.source, r.desc, p.sdisplay, r.ordering, r.month, r.day from readings r
            left join pericopes p on r.book=p.book and r.pericope=p.pericope where {where} order by r.ordering"""
    return DB.execute(q).fetchall()


def feast_level(m, d):
    r = DB.execute("select max(feast_level), group_concat(feast_name,' / ') from days where month=? and day=?", (m, d)).fetchone()
    return (r[0] or 0, r[1] or "")


def day_readings(d):
    p, y = pdist_of(d)
    e, g = adjusted(d, p, y)
    fi = y.float_index(p)
    lvl, fname = feast_level(d.month, d.day)
    kept = (d.month, d.day) in KEEP
    out = []
    lent = -48 <= p <= -4
    daily = rows(f"(r.pdist={g} and r.source='Gospel' and r.desc!='Bridegroom') or (r.pdist={e} and r.source='Epistle')"
                 + (f" or (r.pdist={p} and r.source in ('Vespers','6th Hour','Sixth Hour'))" if lent else "")
                 + (f" or (r.pdist={fi} and r.source in ('Epistle','Gospel'))" if fi != 499 else ""))
    menaion = rows(f"r.month={d.month} and r.day={d.day} and r.pdist=999 and r.source in ('Epistle','Gospel')") if kept else []
    menaion = [r for r in menaion if not OCA_ONLY.search(r[1] or "")]
    great = kept and lvl >= 7
    # weekday Vespers paremias belong to the menaion feast only on great feasts; otherwise keep the Lenten ones
    if great: daily = [r for r in daily if r[0] in ("Vespers", "6th Hour")]
    for src, desc, cit, ordering, mm, dd in daily + menaion:
        if not cit: continue
        c = conv(cit)
        bk = re.match(r"^((?:[1-4] )?[A-Za-z]+)", c).group(1)
        if src == "Epistle": lab = "Apostol"
        elif src == "Gospel": lab = "Gospel"
        elif src in ("6th Hour", "Sixth Hour"): lab = f"Sixth Hour · {BOOKNAME.get(bk, bk)}"
        else: lab = f"Vespers · {BOOKNAME.get(bk, bk)}"
        if mm and desc and src in ("Epistle", "Gospel"): lab += f" · {desc}"
        elif mm and src in ("Epistle", "Gospel") and not great: lab += " · feast"
        out.append([lab, c, "n"])
    # de-duplicate identical citations
    seen = set(); res = []
    for x in out:
        if (x[0].split(" · ")[0], x[1]) in seen: continue
        seen.add((x[0].split(" · ")[0], x[1])); res.append(x)
    return {"p": p, "r": res, "lvl": lvl if kept else 0, "feast": fname if kept and lvl >= 4 else ""}


if __name__ == "__main__":
    start, end = dt.date(2025, 11, 30), dt.date(2030, 11, 30)
    OUT = {}
    d = start
    while d <= end:
        OUT[d.isoformat()] = day_readings(d); d += D(1)
    json.dump(OUT, open("byz_daily.json", "w"), ensure_ascii=False, separators=(",", ":"))
    for iso in ("2026-10-21", "2026-10-25", "2026-09-08", "2026-09-14", "2027-03-03", "2027-03-05", "2027-03-24", "2026-12-24", "2026-11-21", "2027-08-15", "2026-05-20", "2027-01-01", "2026-12-30"):
        print(iso, OUT[iso])
