#!/usr/bin/env python3
"""Check that every Bible citation in the bundled lectionaries resolves to verses in the bundled Bibles.

    python3 tools/check_citations.py            # report, exit 1 on any unexpected failure
    python3 tools/check_citations.py --verbose  # also list the known, documented exceptions

It parses every citation with the site's own parseCit (src/today.js, run in Node), so it reads them exactly as
the reader does, and resolves them the way passage() does.
Each citation is read in the translation and numbering the site uses for it: Douay-Rheims with modern (n) or
Vulgate (v) numbering, or King James (k), which falls back to the Douay-Rheims when the KJV lacks the text.
A citation fails when a chapter or the first or last verse of a range is missing.

Sources: days/<year>.json (every rite's readings), data/ambrosian-1954.json, data/eastsyriac-1894.json,
data/mercersburg.json, data/rca1882-lessons.json, data/bcp1784.json (lessons), data/coptic-lectionary.json.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TODAY = (ROOT / "src" / "today.js").read_text(encoding="utf-8")
BOOKFILE = json.loads(re.search(r"const BOOKFILE=(\{.*?\});", TODAY).group(1))
BIB = json.loads(re.search(r"/\*BIBLE-SHARDS\*/(\{.*?\})/\*END-BIBLE-SHARDS\*/", TODAY).group(1))
RITE_TR = {"n": "dr", "o": "kj", "m": "dr", "p": "dr", "h": "dr", "b": "dr"}
_shards = {}


def bible(tr, f):
    n = BIB.get(tr, {}).get(f)
    if n is None:
        return None
    k = (tr, n)
    if k not in _shards:
        _shards[k] = json.loads((ROOT / "bible" / tr / f"s{n}.json").read_text(encoding="utf-8"))
    return _shards[k].get(f)


def parse_all(cits):
    """Parse with the site's own parseCit (src/today.js), run in Node: {citation: (book, file, segs) or reason}."""
    src = "\n".join(re.search(pat, TODAY, re.S).group(0) for pat in (
        r"const BOOKFILE=\{.*?\};", r"const BOOKALIAS=.*?;\n", r"function parseCit\(cit\)\{.*?\n\}\n"))
    js = src + "\nconst inp=JSON.parse(require('fs').readFileSync(0,'utf8'));const out={};" \
        "for(const c of inp){const p=parseCit(c);out[c]=p.skip?(p.skip==='book'?'unknown book':p.skip):[p.book,p.file,p.segs];}" \
        "process.stdout.write(JSON.stringify(out));"
    import subprocess
    r = subprocess.run(["node", "-e", js], input=json.dumps(sorted(set(cits))), capture_output=True, text=True, check=True)
    return json.loads(r.stdout)


PARSED = {}


def parse(cit):
    return PARSED[cit]


HEB_ENG = json.loads(re.search(r"const HEB_ENG=(\[.*?\]);", TODAY).group(1))
VERSEMAP = json.loads(re.search(r"const VERSEMAP=(\[.*?\]);", TODAY).group(1))


def common_shift(bk, c, v, dr=False):
    for b, hc, a, z, ec, d, vg in HEB_ENG:
        if b == bk and hc == c and a <= v <= z:
            return (bk, c, v) if dr and not vg else (bk, ec, v + d)
    if bk == "Mal" and c == 3 and v >= 19: return "Mal", 4, v - 18
    if bk == "Joel" and c == 3: return "Joel", 2, v + 27
    if bk == "Joel" and c == 4: return "Joel", 3, v
    if bk == "Isa" and c == 8 and v == 23: return "Isa", 9, 1
    if bk == "Isa" and c == 9: return "Isa", 9, v + 1
    return bk, c, v


def to_vulgate(bk, c, v):
    if bk == "Ps":
        if c == 10: return "Ps", 9, v + 21
        if 11 <= c <= 113: return "Ps", c - 1, v
        if c == 114: return "Ps", 113, v
        if c == 115: return "Ps", 113, v + 8
        if c == 116: return ("Ps", 114, v) if v <= 9 else ("Ps", 115, v - 9)
        if 117 <= c <= 146: return "Ps", c - 1, v
        if c == 147: return ("Ps", 146, v) if v <= 11 else ("Ps", 147, v - 11)
        return "Ps", c, v
    if any(b == bk and hc == c and a <= v <= z and not vg for b, hc, a, z, ec, d, vg in HEB_ENG):
        return bk, c, v
    b, cc, vv = common_shift(bk, c, v, True)
    for r in VERSEMAP:
        if r[0] == b and r[1] == cc and r[2] <= vv <= r[3]:
            return b, r[4], vv + r[5]
    return b, cc, vv


def has(tr, f, c, v):
    B = bible(tr, f)
    if not B or c < 1 or c > len(B):
        return False
    return v >= 999 or 1 <= v <= len(B[c - 1]) and bool(B[c - 1][v - 1])


def check(cit, tr, num):
    """None when the citation resolves, else the reason."""
    p = parse(cit)
    if isinstance(p, str):
        return None if p == "selections" else p
    bk, f, segs = p
    def ok(trx):
        for c1, v1, c2, v2 in segs:
            for c, v in ((c1, v1), (c2, v2 if v2 < 999 else 1)):
                b, cc, vv = bk, c, v
                if trx == "dr" and num != "v":
                    b, cc, vv = to_vulgate(bk, c, v)
                if trx == "kj" and num != "k":
                    b, cc, vv = common_shift(bk, c, v)
                if not has(trx, BOOKFILE.get(b, f), cc, vv):
                    # the KJV and Vulgate Psalters count titles differently by up to two verses
                    if not (bk == "Ps" and has(trx, BOOKFILE.get(b, f), cc, max(1, vv - 2))):
                        return False
        return True
    if ok(tr) or (tr == "kj" and ok("dr")):
        return None
    # A modern (Hebrew or NAB) numbering read in the Douay-Rheims: the verses exist in the KJV, whose numbering the
    # modern one mostly shares, but the Vulgate divides the chapter differently. The reader shows the Douay-Rheims
    # verses under those numbers, so the passage can be cut short or shifted by a verse.
    if tr == "dr" and num != "v" and ok("kj"):
        return "versification"
    return "a chapter or verse is missing"


def citations():
    """Yield (where, citation, translation, numbering)."""
    for f in sorted((ROOT / "days").glob("*.json")):
        for iso, day in json.loads(f.read_text(encoding="utf-8")).items():
            for rite, tr in RITE_TR.items():
                for r in (day.get(rite) or {}).get("r") or []:
                    if len(r) > 1 and r[1]:
                        yield f"days {iso} {rite} {r[0]}", r[1], tr, (r[2] if len(r) > 2 and isinstance(r[2], str) else "n")
    for name, tr, num in (("ambrosian-1954", "dr", "v"), ("eastsyriac-1894", "kj", "k")):
        T = json.loads((ROOT / "data" / f"{name}.json").read_text(encoding="utf-8"))
        for k, d in T["days"].items():
            for r in d.get("r", []):
                dr = len(r) > 2 and r[2] == "dr"
                yield f"{name} {k}", r[1], "dr" if dr else tr, "v" if dr else num
    M = json.loads((ROOT / "data" / "mercersburg.json").read_text(encoding="utf-8"))
    for k, d in M["propers"].items():
        for col in ("g", "ga", "e", "ea"):
            if d.get(col):
                yield f"mercersburg {k} {col}", d[col], "kj", "k"
    for k, d in M["lessons"].items():
        for h in ("m", "e"):
            for c in d.get(h, []):
                yield f"mercersburg lessons {k} {h}", c, "kj", "k"
    def walk(o, where):
        if isinstance(o, str):
            yield where, o
        elif isinstance(o, list):
            for i, x in enumerate(o):
                yield from walk(x, where)
        elif isinstance(o, dict):
            for k, x in o.items():
                yield from walk(x, f"{where} {k}")
    R = json.loads((ROOT / "data" / "rca1882-lessons.json").read_text(encoding="utf-8"))
    for where, c in walk({k: v for k, v in R.items() if k != "source"}, "rca1882"):
        yield where, c, "kj", "k"
    W = json.loads((ROOT / "data" / "bcp1784.json").read_text(encoding="utf-8"))
    for where, c in walk(W.get("lessons", {}), "bcp1784 lessons"):
        yield where, c, "kj", "k"
    C = json.loads((ROOT / "data" / "coptic-lectionary.json").read_text(encoding="utf-8"))
    for where, c in walk(C.get("tables", {}), "coptic"):
        if re.match(r"^(?:[1-4] )?[A-Z][a-z]+\.? \d", c):
            yield where, c, "kj", "k"


# Citations in the upstream calendars that cannot be read as written; the reader shows "Text not available" or the
# verses that exist. Each is checked by hand: the citation is the source's, not a transcription slip here.
UPSTREAM = {
    "Esth C:12, 14-16, 23-25": "NAB lettered chapter of the Greek additions (Vulgate Esther 14:1-19); not mapped",
    "Ps 20:8, 9, 10, 15": "the Lectionary's psalm cites a verse 15 that Psalm 20 does not have",
}


def main():
    C = json.loads((ROOT / "data" / "coptic-lectionary.json").read_text(encoding="utf-8"))
    known = set(C.get("issues", {}))          # upstream errors the Coptic table already flags to the reader
    bad, flagged, vers, n = [], [], [], 0
    rows = list(citations())
    PARSED.update(parse_all(c for _, c, _, _ in rows))
    for where, cit, tr, num in rows:
        n += 1
        why = check(cit, tr, num)
        if why == "versification":
            vers.append((where, cit, why))
        elif why:
            (flagged if cit in known or cit in UPSTREAM else bad).append((where, cit, why))
    for where, cit, why in bad:
        print(f"FAIL {where}: {cit} ({why})")
    if "--verbose" in sys.argv:
        for where, cit, why in flagged:
            print(f"known {where}: {cit}")
        for where, cit, why in vers:
            print(f"versification {where}: {cit}")
    print(f"{n} citations checked: {len(bad)} failures; {len(flagged)} known upstream issues; "
          f"{len(vers)} modern-numbered citations whose Douay-Rheims verses are divided differently (--verbose lists them)")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
