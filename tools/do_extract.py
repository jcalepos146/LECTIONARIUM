"""Extract Epistle/Gospel citations from Divinum Officium missal files
for two rubrical forms: 'pre55' (Divino Afflatu rubrics) and '1962'."""
import json, os, re, sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else "do/web/www/missa/Latin"
SEC_RE = re.compile(r"^\[([^\]]+)\]\s*(.*)$")


def applies(tag, form):
    """Decide whether a section variant tag applies to a form."""
    t = tag.lower().strip("() ")
    if not t:
        return True
    neg = t.startswith("nisi")
    is60 = bool(re.search(r"rubrica\s*(196|1960)", t))
    is55 = "1955" in t
    isda = "divi" in t
    other = bool(re.search(r"tride|1570|1888|1906|cisterc|monastic|praedicatorum|newcal", t))
    if form == "1962":
        hit = is60
    else:  # pre-1955: Divino Afflatu
        hit = isda or (not is60 and not is55 and not other)
        if not (isda or is60 or is55 or other):
            hit = True
    return (not hit) if neg else hit


_cache = {}


def load(path):
    """Return {section: [(tag, lines)]} for a file, following a whole-file @redirect."""
    if path in _cache:
        return _cache[path]
    fp = os.path.join(ROOT, path + ".txt")
    if not os.path.exists(fp):
        _cache[path] = {}
        return {}
    secs, cur, base = {}, None, None
    with open(fp, encoding="utf-8", errors="replace") as f:
        lines = f.read().splitlines()
    if lines and lines[0].startswith("@"):
        base = lines[0][1:].strip()
    for ln in lines:
        m = SEC_RE.match(ln)
        if m:
            cur = (m.group(1).strip(), m.group(2).strip())
            secs.setdefault(cur[0], []).append([cur[1], []])
            continue
        if cur:
            secs[cur[0]][-1][1].append(ln)
    if base:
        merged = {k: list(v) for k, v in load(base.split(":")[0]).items()}
        merged.update(secs)
        secs = merged
    _cache[path] = secs
    return secs


def section(path, name, form, depth=0):
    secs = load(path)
    variants = secs.get(name, [])
    chosen = None
    for tag, body in variants:          # tagged variant wins over untagged
        if tag and applies(tag, form):
            chosen = body
    if chosen is None:
        for tag, body in variants:
            if not tag:
                chosen = body
    if chosen is None:
        return None
    # section-level redirect
    for ln in chosen:
        m = re.match(r"^@([^:\s]*):?([^\s]*)", ln.strip())
        if m and depth < 5 and len([l for l in chosen if l.strip()]) <= 2:
            tgt = m.group(1) or path
            sec = m.group(2) or name
            return section(tgt, sec, form, depth + 1)
    return chosen


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
    lect = [n for n in names if re.match(r"^Lectio(L\d+)?$", n)]
    lect.sort(key=lambda n: (n != "LectioL1", n))
    for n in sorted(set(lect), key=lambda n: (0 if n.startswith("LectioL") else 1, n)):
        c = citation(section(path, n, form))
        if c:
            out.append(("Lesson" if n.startswith("LectioL") else "Epistle", c))
    g = citation(section(path, "Evangelium", form))
    if g:
        out.append(("Gospel", g))
    return out


if __name__ == "__main__":
    targets = json.load(open(sys.argv[2]))
    res = {}
    for key, spec in targets.items():
        row = {}
        for form in ("pre55", "1962"):
            p = spec.get(form)
            if p:
                row[form] = readings(p, form)
        res[key] = row
    json.dump(res, sys.stdout, indent=1, ensure_ascii=False)
