"""Match each Mass's sung propers to GregoBase (CC0) chants; collect the Kyriale and common chants."""
import json, re, sqlite3, unicodedata, collections

db = sqlite3.connect("../music/gb.sqlite")
SRC_PREF = {2: 0, 3: 1, 1: 2, 4: 3, 16: 4, 5: 5, 10: 6}   # GR1961, Liber, GR1908, GR1974, Greg. Missal, Chants of the Church, Cantus selecti


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower().replace("æ", "ae").replace("œ", "oe").replace("j", "i").replace("v", "u")
    return re.sub(r"[^a-z ]", " ", s).split()


rows = db.execute('''select c.id, c.incipit, c."office-part", c.mode, c.gabc, s.source, s.page, c.version
                     from gregobase_chants c left join gregobase_chant_sources s on s.chant_id=c.id''').fetchall()
IDX = collections.defaultdict(list)
TW = {}
GABC = {}
def dec(g):
    if g and g.startswith('"'):
        try: return json.loads(g)
        except Exception: return g.strip('"')
    return g
for cid, inc, part, mode, gabc, src, page, ver in rows:
    gabc = dec(gabc)
    if not gabc:
        continue
    GABC[cid] = (inc, part, mode, gabc)
    tw = re.sub(r"<[^>]+>", "", re.sub(r"\([^)]*\)", "", gabc.split("%%")[-1])).replace("*", " ")
    w = norm(tw)
    w = [x for x in w if x not in ("i", "ii", "iij")]
    if part == "al":
        while w and w[0] in ("alleluia", "u"):
            w = w[1:]
    if not w:
        continue
    TW[cid] = w
    IDX[(part, " ".join(w[:2]))].append((SRC_PREF.get(src, 9), cid, src, page))


def gabc_text_words(cid):
    if cid in TW: return TW[cid]
    g = GABC[cid][3]
    txt = re.sub(r"\([^)]*\)", "", g.split("%%")[-1])
    txt = re.sub(r"<[^>]+>", "", txt).replace("*", " ")
    return norm(txt)


def best(part, text, prefer=None):
    w = norm(text)
    if part == "al":
        while w and w[0] in ("alleluia", "u"):
            w = w[1:]
    if not w:
        return None
    for n in (2,):
        c = IDX.get((part, " ".join(w[:n])))
        if c:
            # confirm with more words of the text when possible
            scored = []
            for pr, cid, src, page in c:
                tw = gabc_text_words(cid)[:12]
                overlap = sum(1 for a, b in zip(tw, w[:12]) if a == b)
                scored.append((-overlap, pr, cid))
            scored.sort()
            if -scored[0][0] >= min(3, len(w)):
                return scored[0][2]
    return None


def first_text(lines):
    for l in lines:
        s = l.strip()
        if not s or s.startswith("!") or s.startswith("&") or s.startswith("$") or s == "_":
            continue
        return re.sub(r"^(v\.|V\.|R\.)\s*", "", s)
    return ""


def split_graduale(lines):
    """Return list of (part, text) for gradual / alleluia / tract components."""
    out, i, mode = [], 0, "gr"
    txt = [l for l in lines]
    first = first_text(txt)
    if first and not first.lower().startswith("allel"):
        out.append(("gr", first))
    joined = "\n".join(txt)
    if "!Tractus" in joined:
        after = joined.split("!Tractus", 1)[1].splitlines()
        out.append(("tr", first_text(after)))
    else:
        # alleluia verse: first text line after a line containing 'Allelúja, allelúja'
        seen = False
        for l in txt:
            s = re.sub(r"^(v\.|V\.)\s*", "", l.strip())
            if seen and s and not s.startswith("!") and s != "_":
                out.append(("al", s)); break
            if re.search(r"allel[uú][ij]a,\s*allel[uú][ij]a", unicodedata.normalize("NFC", l), re.I):
                seen = True
        if first.lower().startswith("allel") and len(out) == 0:
            # Paschaltide: Allelúja, allelúja. V. first verse
            vs = [re.sub(r"^(v\.|V\.)\s*", "", l.strip()) for l in txt if l.strip().startswith("V.")]
            for v in vs[:2]:
                out.append(("al", v))
    return out


P = json.load(open("propers.json"))
MAP, used = {}, set()
miss = collections.Counter()
for key, m in P.items():
    parts = m["parts"]
    res = {}
    for n, code in (("Introitus", "in"), ("Offertorium", "of"), ("Communio", "co")):
        if n in parts:
            cid = best(code, first_text(parts[n][0]))
            if cid: res[n] = [cid]; used.add(cid)
            else: miss[n] += 1
    g = parts.get("GradualeP") if False else parts.get("Graduale")
    if g:
        ids = []
        for code, t in split_graduale(g[0]):
            cid = best(code, t)
            if cid: ids.append(cid); used.add(cid)
            else: miss["Graduale-" + code] += 1
        if ids: res["Graduale"] = ids
    for alt in ("GradualeP", "GradualeF"):
        if alt in parts:
            ids = [best(code, t) for code, t in split_graduale(parts[alt][0])]
            ids = [i for i in ids if i]
            if ids: res[alt] = ids; used.update(ids)
    if "Sequentia" in parts:
        cid = best("se", first_text(parts["Sequentia"][0]))
        if cid: res["Sequentia"] = [cid]; used.add(cid)
        else: miss["Sequentia"] += 1
    MAP[key] = res
print("propers missing chant:", dict(miss))
print("masses with introit chant:", sum(1 for v in MAP.values() if "Introitus" in v), "/", len(MAP))

# ---------------------------------------------------------------- Kyriale & commons
def find(part, inc_like, ver_like=None, src=None):
    q = '''select c.id, c.incipit, c.version, s.source from gregobase_chants c join gregobase_chant_sources s on s.chant_id=c.id
           where c."office-part"=? and c.incipit like ?'''
    args = [part, inc_like]
    if ver_like:
        q += " and c.version like ?"; args.append(ver_like)
    rs = db.execute(q, args).fetchall()
    rs.sort(key=lambda r: SRC_PREF.get(r[3], 9) if src is None else (0 if r[3] == src else 1))
    return rs


for part in ("ky", "gl", "cr", "sa", "ag", "or", "ite", "va", "pr", "an", "hy", "im", "ca"):
    rs = db.execute('select c.id,c.incipit,c.version from gregobase_chants c where c."office-part"=? limit 0', (part,)).fetchall()
json.dump({"map": MAP, "used": sorted(used)}, open("chantmap.json", "w"))
json.dump({str(k): v for k, v in GABC.items()}, open("../music/gabc_all.json", "w"))
