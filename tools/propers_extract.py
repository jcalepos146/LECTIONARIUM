"""Full Latin/English Mass propers (Divinum Officium, MIT) for every Mass used by days.json."""
import json, re, os
import trad_engine as TE

LAT = ["do/web/www/missa/Latin", "do/web/www/horas/Latin", "do/obsolete/missa/Latin"]
ENG = ["do/web/www/missa/English", "do/obsolete/missa/English", "do/web/www/missa/Latin", "do/web/www/horas/Latin", "do/obsolete/missa/Latin"]
PARTS = ["Introitus", "Oratio", "Lectio", "Graduale", "GradualeF", "GradualeP", "Tractus", "Sequentia", "Evangelium",
         "Offertorium", "Secreta", "Communio", "Postcommunio"]


def with_roots(roots, fn, *a):
    saved = TE.ROOTS[:]
    TE.ROOTS[:] = roots
    TE.load.cache_clear()
    try:
        return fn(*a)
    finally:
        TE.ROOTS[:] = saved
        TE.load.cache_clear()


def clean(lines):
    out = []
    for ln in lines or []:
        s = ln.rstrip()
        if not s.strip():
            continue
        if s.startswith("@"):
            continue
        out.append(s)
    return out


def get_part(path, name, form, roots):
    def f():
        body = TE.section(path, name, form)
        if body is None:
            c = TE.commune_of(path, form)
            if c:
                body = TE.section(c, name, form)
        return body
    return clean(with_roots(roots, f))


def ember_lessons(path, form, roots):
    """Ember days and vigils: LectioL1.., GradualeL1.., OratioL1.. sequences."""
    def f():
        secs = TE.load(path)
        names = [n for n in secs if re.match(r"^(LectioL|GradualeL|OratioL)\d+$", n)]
        return sorted(names, key=lambda n: (int(re.sub(r"\D", "", n)), n))
    return with_roots(roots, f)


def rule(path, form):
    def f():
        b = TE.section(path, "Rule", form) or []
        return [l.strip() for l in b if l.strip()]
    return with_roots(LAT, f)


def mass(path, form, feria=False):
    r = rule(path, form)
    rtxt = " | ".join(r)
    gloria = bool(re.search(r"(^|\|)\s*Gloria\b", rtxt)) and not re.search(r"no Gloria", rtxt)
    credo = bool(re.search(r"(^|\|)\s*Credo\b", rtxt)) and not re.search(r"no Credo", rtxt)
    m = re.search(r"Prefatio[= ]+(\w+)", rtxt)
    pref = m.group(1) if m else None
    glr = -1 if re.search(r"no Gloria", rtxt) else (1 if re.search(r"(^|\|)\s*Gloria\b", rtxt) else 0)
    out = {"gloria": gloria and not feria, "glr": glr, "credo": credo and not feria, "pref": pref, "parts": {}}
    for n in PARTS:
        la = get_part(path, n, form, LAT)
        if not la:
            continue
        en = get_part(path, n, form, ENG)
        out["parts"][n] = [la, en]
    lessons = ember_lessons(path, form, LAT)
    if lessons:
        out["ember"] = []
        for n in lessons:
            out["ember"].append([n, get_part(path, n, form, LAT), get_part(path, n, form, ENG)])
    return out


if __name__ == "__main__":
    import datetime as dt
    D = json.load(open("days.json"))
    paths = {}
    for iso, x in D.items():
        for f, k in (("1962", "m"), ("pre55", "p")):
            v = x.get(k)
            if v and v.get("path"):
                paths.setdefault((v["path"], f, bool(v.get("feria"))), []).append(iso)
    print(len(paths), "unique masses")
    OUT = {}
    for (p, f, fer) in sorted(paths):
        OUT[f"{f}|{p}|{int(fer)}"] = mass(p, f, fer)
    s = json.dumps(OUT, ensure_ascii=False, separators=(",", ":"))
    open("propers.json", "w").write(s)
    print(len(s) // 1024, "KB")
    k = next(k for k in OUT if "Adv1-0" in k)
    print(k, json.dumps(OUT[k], ensure_ascii=False)[:1500])
