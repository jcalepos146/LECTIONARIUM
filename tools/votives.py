"""Votive Masses: the traditional Missal's (1962 and pre-1955) from Divinum Officium (MIT), and the checks on the
1979 Prayer Book's Various Occasions (data/bcp1979-occasions.json, kept by hand; see its "source").

  git clone https://github.com/DivinumOfficium/divinum-officium tools/do
  python3 tools/votives.py             -> data/votive-trad.json, from tools/do
  python3 tools/votives.py --verify    -> fails if data/votive-trad.json differs from what tools/do gives
  python3 tools/votives.py --check     -> CI, no checkout needed: both data files are well formed

Only the votive Masses whose Latin and English propers are both in Divinum Officium are taken; each keeps the shape
of an entry in propers-1962.json, so mass.js renders it with the same code as the Mass of the day. VOTIVES says
which are left out, and why.
"""
import json, os, re, subprocess, sys

os.chdir(os.path.dirname(os.path.abspath(__file__)))
import trad_engine as TE
import propers_extract as PX

# The commons now live under horas/ in Divinum Officium, in English as well as Latin.
PX.ENG[:] = ["do/web/www/missa/English", "do/web/www/horas/English", "do/obsolete/missa/English"] + PX.LAT
# "(ad missam)" marks the Mass form of a section that the Office shares.
_tag = TE.tag_applies
TE.tag_applies = lambda tag, form: True if tag.lower().strip("() ") == "ad missam" else _tag(tag, form)

VOTIVES = [
    # id, Divinum Officium path, its title in DO's list of votive Masses (missa.dialog), English title, the occasion
    ("coronatio", "Commune/Coronatio", "Votiva in Creatione et Coronatione Papae et in die anniversarii",
     "Votive Mass on the Election and Coronation of a Pope, and on its Anniversary",
     "A coronation or enthronement, or its anniversary"),
    ("defunctorum", "Commune/C9", "Defunctorum quotidianis: Requiem aeternam", "Daily Mass for the Dead (Requiem)",
     "A funeral, a burial or a memorial of the dead"),
    ("bmv", "Commune/C11", "In Festis Beatae Mariae Virginis: Salve Sancte Parens",
     "Votive Mass of the Blessed Virgin Mary (Salve, sancta Parens)", "A Marian feast or pilgrimage, or a Saturday"),
]
# Not taken: the Dedication of a Church (Commune/C8), whose Latin and English give different forms of the Secret and
# Postcommunion; the Masses of St Joseph and of the Passion, whose files build the Mass from Paschaltide propers by
# regular expression, which this extractor does not apply; and the Propagation of the Faith, whose English file has
# only the orations.
OUT = "../data/votive-trad.json"


def latin_source(path, name, form, depth=0):
    """(path, section) of the file that supplies this Latin section, following "@Path[:Section]" redirects and
    the file's inherited base ("@Path" on its first line)."""
    def f():
        secs = TE.load(path)
        if name in secs:
            tagged = [b for t, b in secs[name] if t and TE.tag_applies(t, form)]
            body = tagged[-1] if tagged else next((b for t, b in secs[name] if not t), [])
            lines = [l.strip() for l in body if l.strip()]
            m = re.match(r"^@([^:\s]*):?(\S*)$", lines[0]) if len(lines) == 1 else None
            return ("jump", m.group(1) or path, m.group(2) or name) if m else ("here", path, name)
        fp = TE.find(path)
        first = open(fp, encoding="utf-8").readline().strip() if fp else ""
        return ("jump", first[1:], name) if first.startswith("@") else ("none", path, name)
    kind, p, n = PX.with_roots(PX.LAT, f)
    if kind == "jump" and depth < 6:
        return latin_source(p, n, form, depth + 1)
    return (p, n) if kind == "here" else None


def english(path, name, form):
    """The English of a section: the English file at the same path, or, when it lacks the section, the English of
    the file the Latin takes it from."""
    en = PX.get_part(path, name, form, PX.ENG)
    la = PX.get_part(path, name, form, PX.LAT)
    if en and en != la:
        return en
    src = latin_source(path, name, form)
    if src and src != (path, name):
        return PX.get_part(src[0], src[1], form, PX.ENG)
    return en


def build():
    commit = subprocess.run(["git", "-C", "do", "rev-parse", "HEAD"], capture_output=True, text=True).stdout.strip()
    data = {"source": {"title": "Divinum Officium", "url": "https://github.com/DivinumOfficium/divinum-officium",
                       "licence": "MIT", "commit": commit,
                       "note": "Votive Masses whose Latin and English propers are both in Divinum Officium."},
            "masses": {}}
    for vid, path, la, en, use in VOTIVES:
        m = {"la": la, "en": en, "use": use, "path": path}
        for form in ("1962", "pre55"):
            P = PX.mass(path, form)
            for n, (lat, _) in P["parts"].items():
                # "N.p" is Divinum Officium's mark for the Pope's name
                P["parts"][n] = [[l.replace("N.p", "N.") for l in x] for x in (lat, english(path, n, form))]
            missing = [n for n in ("Introitus", "Oratio", "Lectio", "Evangelium", "Offertorium", "Secreta", "Communio", "Postcommunio") if n not in P["parts"]]
            if missing:
                raise SystemExit(f"{path} ({form}) lacks {missing}")
            for n, (lat, eng) in P["parts"].items():
                if not eng or eng == lat:
                    raise SystemExit(f"{path} ({form}) {n}: no English")
            m[form] = P
        data["masses"][vid] = m
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n"


PARTS_NEEDED = ("Introitus", "Oratio", "Lectio", "Evangelium", "Offertorium", "Secreta", "Communio", "Postcommunio")
CITE = re.compile(r"^(?:[1-4] )?[A-Z][a-z]+ \d+(?::\d+[a-z]?(?:-(?:\d+:)?\d+[a-z]?)?(?:,\d+[a-z]?(?:-\d+[a-z]?)?)*)?(?:; ?\d+(?::\d+(?:-\d+)?)?)*$")
PSALM = re.compile(r"^\d+(?::\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)?$|^Canticle \d+$")


def check():
    V = json.load(open(OUT, encoding="utf-8"))
    ids = [v[0] for v in VOTIVES]
    if sorted(V["masses"]) != sorted(ids):
        raise SystemExit(f"{OUT}: masses {sorted(V['masses'])} are not {sorted(ids)}")
    for vid, m in V["masses"].items():
        for k in ("la", "en", "use", "path", "1962", "pre55"):
            if not m.get(k):
                raise SystemExit(f"{OUT} {vid}: no {k}")
        for form in ("1962", "pre55"):
            P = m[form]
            for n in PARTS_NEEDED:
                if n not in P["parts"]:
                    raise SystemExit(f"{OUT} {vid} {form}: no {n}")
            for n, (la, en) in P["parts"].items():
                if not la or not en or la == en:
                    raise SystemExit(f"{OUT} {vid} {form} {n}: Latin and English are not both there")
    B = json.load(open("../data/bcp1979.json", encoding="utf-8"))["collects"]
    O = json.load(open("../data/bcp1979-occasions.json", encoding="utf-8"))
    seen = set()
    for o in O["occasions"]:
        if o["id"] in seen:
            raise SystemExit(f"bcp1979-occasions: {o['id']} twice")
        seen.add(o["id"])
        c = B["c"].get(o["collect"])
        if not c:
            raise SystemExit(f"bcp1979-occasions {o['id']}: no collect {o['collect']!r} in bcp1979.json")
        if o.get("form") and o["collect"].startswith(("15.", "19.")) and not any(t.startswith(o["form"] + ". ") for t in c["text"]):
            raise SystemExit(f"bcp1979-occasions {o['id']}: the collect has no form {o['form']}")
        L = o["lessons"]
        if L is None:
            continue
        for k in ("ot", "ps", "ep", "gs"):
            if not L.get(k):
                raise SystemExit(f"bcp1979-occasions {o['id']}: no {k}")
            for x in L[k]:
                if not (PSALM if k == "ps" else CITE).match(x):
                    raise SystemExit(f"bcp1979-occasions {o['id']} {k}: {x!r} is not a citation")
    print(OUT, "and data/bcp1979-occasions.json well formed:", len(V["masses"]), "votive Masses,", len(O["occasions"]), "occasions,",
          sum(1 for o in O["occasions"] if o["lessons"]), "with lessons")


if __name__ == "__main__":
    if "--check" in sys.argv:
        check(); sys.exit(0)
    if not os.path.isdir("do"):
        raise SystemExit("clone Divinum Officium into tools/do first")
    s = build()
    if "--verify" in sys.argv:
        cur = open(OUT, encoding="utf-8").read()
        # the commit line may differ between clones; compare the texts
        strip = lambda x: re.sub(r'"commit":"[0-9a-f]*"', "", x)
        if strip(cur) != strip(s):
            raise SystemExit(f"{OUT} is out of date: run python3 tools/votives.py")
        print(OUT, "up to date")
    else:
        open(OUT, "w", encoding="utf-8").write(s)
        print(OUT, len(s.encode()) // 1024, "KB")
