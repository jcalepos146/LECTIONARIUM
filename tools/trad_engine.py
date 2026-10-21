"""Daily Mass (pre-1955 and 1962) from Divinum Officium missal files.
Precedence by DO's numeric ranks plus the main 1960 exceptions; first-class feasts
that lose are transferred to the next free day. Octave days (pre-1955) approximated."""
import os, re, datetime as dt
from functools import lru_cache

ROOTS = ["do/web/www/missa/Latin", "do/web/www/horas/Latin", "do/obsolete/missa/Latin"]
SEC_RE = re.compile(r"^\[([^\]]+)\]\s*(.*)$")


def cond_applies(c, form):
    t = c.lower()
    is60 = bool(re.search(r"rubrica\s*(196|1960)", t))
    is55 = "1955" in t
    isda = "divi" in t or "1930" in t or "1939" in t or "1954" in t
    neg = t.strip().startswith("nisi")
    if form == "1962":
        hit = is60
    else:
        hit = isda
    return (not hit) if neg else hit


def tag_applies(tag, form):
    t = tag.lower().strip("() ")
    if not t:
        return True
    neg = t.startswith("nisi")
    is60 = bool(re.search(r"rubrica\s*(196|1960)", t)); is55 = "1955" in t
    isda = "divi" in t
    other = bool(re.search(r"tride|1570|1888|1906|cisterc|monastic|praedicatorum|newcal|innovata", t))
    if form == "1962":
        hit = is60
    else:
        hit = isda or not (is60 or is55 or other)
    return (not hit) if neg else hit


def find(path):
    for r in ROOTS:
        fp = os.path.join(r, path + ".txt")
        if os.path.exists(fp):
            return fp
    return None


@lru_cache(None)
def load(path):
    fp = find(path)
    if not fp:
        return {}
    lines = open(fp, encoding="utf-8", errors="replace").read().splitlines()
    secs, cur, base = {}, None, None
    if lines and lines[0].startswith("@"):
        base = lines[0][1:].strip()
    for ln in lines:
        m = SEC_RE.match(ln)
        if m:
            cur = m.group(1).strip()
            secs.setdefault(cur, []).append([m.group(2).strip(), []])
            continue
        if cur:
            secs[cur][-1][1].append(ln)
    if base:
        merged = {k: list(v) for k, v in load(base.split(":")[0]).items()}
        merged.update(secs)
        secs = merged
    return secs


def resolve_inline(body, form):
    """Apply '(sed rubrica X)' style in-section conditionals: the line after replaces the line before."""
    out, skip_next, replace_next = [], False, False
    for ln in body:
        s = ln.strip()
        m = re.match(r"^\((sed|deinde)\s+(.*)\)$", s)
        if m:
            if cond_applies(m.group(2), form):
                replace_next = True
            else:
                skip_next = True
            continue
        if skip_next:
            skip_next = False; continue
        if replace_next:
            replace_next = False
            if out: out.pop()
        out.append(ln)
    return out


def section(path, name, form, depth=0):
    variants = load(path).get(name, [])
    chosen = None
    for tag, body in variants:
        if tag and tag_applies(tag, form):
            chosen = body
    if chosen is None:
        for tag, body in variants:
            if not tag:
                chosen = body; break
    if chosen is None:
        return None
    chosen = resolve_inline(chosen, form)
    nonempty = [l for l in chosen if l.strip()]
    if nonempty and len(nonempty) <= 2:
        m = re.match(r"^@([^:\s]*):?([^\s]*)", nonempty[0].strip())
        if m and depth < 6:
            return section(m.group(1) or path, m.group(2) or name, form, depth + 1)
    return chosen


def rank(path, form):
    body = section(path, "Rank", form)
    if not body:
        return None
    for ln in body:
        f = ln.split(";;")
        if len(f) >= 3:
            try:
                return (f[0].strip(), f[1].strip(), float(f[2]))
            except ValueError:
                pass
    return None


def title(path, form):
    b = section(path, "Officium", form)
    if b:
        for ln in b:
            if ln.strip():
                return ln.strip()
    r = rank(path, form)
    return r[0] if r and r[0] else path


def citation(body):
    if not body:
        return None
    for ln in body:
        s = ln.strip()
        if s.startswith("!") and not s.startswith("!!") and re.search(r"\d", s):
            ref = s.lstrip("!").strip().rstrip(".")
            if re.match(r"^[1-4]?\s?[^\W\d_][^\W\d_\.]*\.?\.?\s*\d", ref):
                return ref
    return None


def readings(path, form):
    out = []
    names = list(load(path).keys())
    lect = sorted({n for n in names if re.match(r"^Lectio(L\d+)?$", n)}, key=lambda n: (0 if n.startswith("LectioL") else 1, n))
    for n in lect:
        c = citation(section(path, n, form))
        if c:
            out.append(["Lesson" if n.startswith("LectioL") else "Epistle", c])
    g = citation(section(path, "Evangelium", form))
    if g:
        out.append(["Gospel", g])
    return out


# ------------------------------------------------------------------ calendar
def easter(Y):
    a = Y % 19; b = Y // 100; c = Y % 100; d = b // 4; e = b % 4; f = (b + 8) // 25; g = (b - f + 1) // 3
    h = (19 * a + b - d - g + 15) % 30; i = c // 4; k = c % 4; l = (32 + 2 * e + 2 * i - h - k) % 7
    m = (a + 11 * h + 22 * l) // 451; mo = (h + l - 7 * m + 114) // 31; da = ((h + l - 7 * m + 114) % 31) + 1
    return dt.date(Y, mo, da)


def adv1(Y):
    x = dt.date(Y, 12, 25); w = (x.weekday() + 1) % 7
    return x - dt.timedelta(days=(7 if w == 0 else w) + 21)


def sun_dow(d):
    return (d.weekday() + 1) % 7   # Sunday = 0


def sunday_in(Y, m, d1, d2):
    for d in range(d1, d2 + 1):
        x = dt.date(Y, m, d)
        if sun_dow(x) == 0:
            return x
    return None


def tempora_path(d, form):
    """DO Tempora file for a date, or None (Christmastide days are Sancti)."""
    Y = d.year
    A_this = adv1(Y)
    if d >= A_this:
        if d >= dt.date(Y, 12, 24):
            return None
        w = (d - A_this).days // 7 + 1
        return f"Tempora/Adv{w}-{sun_dow(d)}"
    E = easter(Y)
    hf = sunday_in(Y, 1, 7, 13)
    sept = E - dt.timedelta(days=63)
    if d < hf:
        if sun_dow(d) == 0 and dt.date(Y, 1, 2) <= d <= dt.date(Y, 1, 5):
            return "Tempora/Nat2-0"
        return None
    if d < sept:
        w = (d - hf).days // 7 + 1
        return f"Tempora/Epi{w}-{sun_dow(d)}"
    if d < E - dt.timedelta(days=42):
        w = (d - sept).days // 7 + 1
        return f"Tempora/Quadp{w}-{sun_dow(d)}"
    if d < E:
        w = (d - (E - dt.timedelta(days=42))).days // 7 + 1
        return f"Tempora/Quad{w}-{sun_dow(d)}"
    pent = E + dt.timedelta(days=49)
    if d < pent + dt.timedelta(days=7):
        w = (d - E).days // 7
        return f"Tempora/Pasc{w}-{sun_dow(d)}"
    # after Pentecost: weeks from Trinity; last week before Advent is Pent24; resumed Epiphany weeks inserted
    trin = pent + dt.timedelta(days=7)
    nextA = adv1(Y)
    total = (nextA - trin).days // 7          # Sundays from Trinity (1st) .. last
    w = (d - trin).days // 7 + 1              # 1 = Trinity week
    if w >= total:
        return f"Tempora/Pent24-{sun_dow(d)}"
    if total > 24 and w > 23:
        extra = total - 24
        j = 7 - extra + (w - 24)
        return f"Tempora/PentEpi{j}-{sun_dow(d)}"
    if total == 23 and w == 23:
        return f"Tempora/Pent24-{sun_dow(d)}"
    return f"Tempora/Pent{w:02d}-{sun_dow(d)}"


def september_ember(d, form):
    Y = d.year
    if form == "1962":
        third = sunday_in(Y, 9, 15, 21)
        wed = third + dt.timedelta(days=3)
    else:
        x = dt.date(Y, 9, 15)
        while x.weekday() != 2:
            x += dt.timedelta(days=1)
        wed = x
    for off, k in ((0, "093-3"), (2, "093-5"), (3, "093-6")):
        if d == wed + dt.timedelta(days=off):
            return "Tempora/" + k
    return None


KAL_CHAIN = {"1962": ["1570", "1888", "1906", "1939", "1954", "1955", "1960"],
             "pre55": ["1570", "1888", "1906", "1939", "1954"]}


@lru_cache(None)
def kalendar(form):
    cal = {}
    for v in KAL_CHAIN[form]:
        fp = f"do/web/www/Tabulae/Kalendaria/{v}.txt"
        for ln in open(fp, encoding="utf-8", errors="replace"):
            ln = ln.strip()
            m = re.match(r"^(\d\d-\d\d)=(.*)$", ln)
            if not m:
                continue
            f = m.group(2).split("=")
            if f[0].startswith("XXXXX"):
                cal[m.group(1)] = None
            else:
                cal[m.group(1)] = f[0].split("~")[0]
    return cal


def sancti_path(d, form="1962"):
    if sun_dow(d) == 0 and d.month == 10 and d.day >= 25:
        return "Sancti/10-DU"
    md = f"{d.month:02d}-{d.day:02d}"
    cal = kalendar(form)
    if md in cal:
        return ("Sancti/" + cal[md]) if cal[md] and find("Sancti/" + cal[md]) else None
    return None


def is_privileged_tempora(tp):
    """1962: Lent/Passiontide ferias, Ember days, Advent 17-23 outrank III-class feasts."""
    return bool(re.match(r"Tempora/(Quad\d|Quadp3-[3-6]|093-|Adv3-[356]|Pasc7-[1-6])", tp or ""))


def candidates(d, form):
    out = []
    tp = september_ember(d, form) or tempora_path(d, form)
    if tp and not find(tp):
        tp = re.sub(r"-\d$", "-0", tp) if find(re.sub(r"-\d$", "-0", tp)) else None
        if tp and sun_dow(d) != 0:
            out.append(("feria", tp, ("", "Feria", 1.0)))
            tp = None
    if tp:
        r = rank(tp, form) or ("", "Feria", 1.0)
        out.append(("tempora", tp, r))
    sp = sancti_path(d, form)
    if sp:
        r = rank(sp, form)
        if r:
            out.append(("sancti", sp, r))
    return out


def choose(d, form, carry):
    cands = candidates(d, form)
    if carry:
        cands.append(("sancti", carry[0], carry[1]))
    if not cands:
        return None, None
    tmp = [c for c in cands if c[0] in ("tempora", "feria")]
    san = [c for c in cands if c[0] == "sancti"]
    best_t = tmp[0] if tmp else None
    best_s = max(san, key=lambda c: c[2][2]) if san else None
    def wins_s():
        if not best_s: return False
        if not best_t: return True
        ts, ss = best_t[2][2], best_s[2][2]
        if form == "1962" and is_privileged_tempora(best_t[1]) and ss < 5:
            return False
        return ss > ts
    if form == "1962" and best_s and best_s[2][2] < 2 and best_t:
        win, lose = best_t, None   # IV class: commemoration only, Mass of the feria
    elif wins_s():
        win, lose = best_s, best_t
    else:
        win, lose = best_t, best_s
    newcarry = None
    if lose and lose[0] == "sancti" and lose[2][2] >= 6:
        newcarry = (lose[1], lose[2])
    return win, newcarry


def ferial_sunday(path):
    """A feria with no proper readings takes the preceding Sunday's."""
    return re.sub(r"-\d$", "-0", path)


def commune_of(path, form):
    body = section(path, "Rank", form) or []
    for ln in body:
        f = ln.split(";;")
        if len(f) >= 4:
            m = re.search(r"(?:vide|ex)\s+((?:Sancti|Tempora)/[\w-]+|C[\w]+)", f[3])
            if m:
                g = m.group(1)
                return g if "/" in g else "Commune/" + g
    body = section(path, "Rule", form) or []
    for ln in body:
        m = re.search(r"(?:vide|ex)\s+((?:Sancti|Tempora)/[\w-]+|C[\w]+)", ln)
        if m:
            g = m.group(1)
            return g if "/" in g else "Commune/" + g
    return None


def readings_obsolete(c, form):
    saved = ROOTS[:]
    ROOTS[:] = ["do/obsolete/missa/Latin"]
    load.cache_clear()
    try:
        return readings(c, form)
    finally:
        ROOTS[:] = saved
        load.cache_clear()


def readings_full(path, form):
    rd = readings(path, form)
    labs = {l for l, _ in rd}
    if "Gospel" not in labs or not any(l in ("Epistle", "Lesson") for l in labs):
        c = commune_of(path, form)
        if c:
            crd = readings(c, form)
            if not crd and c.startswith("Commune/"):
                import os as _o
                fp = _o.path.join("do/obsolete/missa/Latin", c + ".txt")
                if _o.path.exists(fp):
                    load.cache_clear() if False else None
                    crd = readings_obsolete(c, form)
            if not any(l in ("Epistle", "Lesson") for l in labs):
                rd = [x for x in crd if x[0] != "Gospel"] + rd
            if "Gospel" not in labs:
                rd = rd + [x for x in crd if x[0] == "Gospel"]
    return rd


def day(d, form, carry=None):
    t_override = None
    win, newcarry = choose(d, form, carry)
    if not win:
        md = (d.month, d.day)
        if (12, 26) <= md <= (12, 31):
            win = ("feria", "Sancti/12-25m3", ("", "Feria", 1.0)); t_override = "Christmastide · Mass of Christmas Day"
        elif (1, 2) <= md <= (1, 5):
            win = ("feria", "Sancti/01-01", ("", "Feria", 1.0)); t_override = "Christmastide · Mass of the Octave Day of Christmas"
        else: return None, newcarry
    kind, path, r = win
    if path == "Sancti/11-02":
        path = "Sancti/11-02m1"
    if path == "Sancti/12-25":
        path = "Sancti/12-25m3"
    rd = readings_full(path, form)
    if not rd:
        md = (d.month, d.day)
        if (12, 26) <= md <= (12, 31): fb, ft = "Sancti/12-25m3", "Christmastide · Mass of Christmas Day"
        elif (1, 2) <= md <= (1, 5): fb, ft = "Sancti/01-01", "Christmastide · Mass of the Octave Day of Christmas"
        elif (1, 7) <= md <= (1, 13): fb, ft = "Sancti/01-06", "Epiphanytide · Mass of the Epiphany"
        else: fb, ft = None, None
        if fb:
            rd = readings_full(fb, form)
            if rd and (r[2] < 2 or not title(path, form) or title(path, form) == path):
                path, kind = fb, "fallback"
                r = (r[0], r[1] or "Feria", r[2])
                t_override = ft

    if not rd and kind in ("tempora", "feria"):
        rd = readings(ferial_sunday(path), form)
    t = t_override or title(path, form)
    comm = None
    if form == "1962":
        sp = sancti_path(d, form)
        if sp and path != sp:
            rr = rank(sp, form)
            if rr and rr[2] < 2: comm = title(sp, form)
    if not t_override and (kind == "feria" or (kind == "tempora" and r[2] < 2 and sun_dow(d) != 0)):
        t = "Feria · Mass of the preceding Sunday"
    return {"t": t, "s": r[1], "rank": r[2], "path": path, "r": rd, "comm": comm, "kind": kind}, newcarry


def year_days(start, end, form):
    out, carry, d = {}, None, start
    while d <= end:
        res, carry = day(d, form, carry)
        out[d.isoformat()] = res
        d += dt.timedelta(days=1)
    return out


if __name__ == "__main__":
    for form in ("1962", "pre55"):
        ys = year_days(dt.date(2026, 10, 15), dt.date(2026, 11, 3), form)
        for k, v in ys.items():
            print(form, k, v and (v["t"], v["s"], v["rank"], v["r"]))
