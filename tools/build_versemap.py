#!/usr/bin/env python3
"""Build the verse map from King James to Douay-Rheims numbering (VERSEMAP in src/today.js).

    python3 tools/build_versemap.py          # rewrite the map in src/today.js
    python3 tools/build_versemap.py --check  # exit 1 if src/today.js is out of date

Where the Vulgate divides a chapter differently from the English Bible (Mark 4 has 40 verses in the Douay-Rheims and
41 in the KJV; Mark 9:1 is the Douay-Rheims' 8:39), a citation in modern numbering read in the Douay-Rheims would
start or end a verse off. Both bundled Bibles are aligned book by book, verse against verse, by the words they share
(a dynamic-programming alignment that lets one verse of either answer to two of the other), and every verse whose
Douay-Rheims chapter or number differs is recorded.

The map is a list of runs [book, KJV chapter, first verse, last verse, Douay-Rheims chapter, verse offset]: a KJV verse
v in the run is the Douay-Rheims verse v + offset of that chapter. The Psalms (their own Vulgate numbering, in
toVulgate) and the books or chapters the Douay-Rheims lacks or adds are left out.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TODAY = ROOT / "src" / "today.js"
STOP = set("the and that unto them they their there with which shall will have hath from were said this thou thee thy "
           "him his her for not but all also when then into upon was are what who whom shall shalt ye you your our "
           "said saith say came come went one".split())


def bibles():
    t = TODAY.read_text(encoding="utf-8")
    bf = json.loads(re.search(r"const BOOKFILE=(\{.*?\});", t).group(1))
    shards = json.loads(re.search(r"/\*BIBLE-SHARDS\*/(\{.*?\})/\*END-BIBLE-SHARDS\*/", t).group(1))
    cache = {}

    def bible(tr, f):
        n = shards.get(tr, {}).get(f)
        if n is None:
            return None
        if (tr, n) not in cache:
            cache[tr, n] = json.loads((ROOT / "bible" / tr / f"s{n}.json").read_text(encoding="utf-8"))
        return cache[tr, n].get(f)
    return bf, bible


def words(s):
    out = set()
    for w in re.findall(r"[a-z]+", s.lower()):
        if len(w) < 3 or w in STOP:
            continue
        for suf in ("eth", "est", "ing", "ed", "es", "s"):
            if w.endswith(suf) and len(w) - len(suf) >= 3:
                w = w[: -len(suf)]
                break
        out.add(w[:6])
    return out


def sim(a, b):
    if not a or not b:
        return 0.0
    return len(a & b) / len(a | b)


def align(K, D, band=60):
    """Monotone alignment of verse word-sets K (KJV) and D (Douay-Rheims): a list of (i, j) pairs, KJV index to the
    Douay-Rheims index its text is in."""
    n, m = len(K), len(D)
    NEG = -1e9
    GAP = -0.05
    best = {(0, 0): (0.0, None)}

    def get(i, j):
        return best.get((i, j), (NEG, None))[0]
    for i in range(n + 1):
        for j in range(max(0, i - band), min(m, i + band) + 1):
            if i == 0 and j == 0:
                continue
            cands = []
            if i >= 1 and j >= 1:
                cands.append((get(i - 1, j - 1) + sim(K[i - 1], D[j - 1]), (i - 1, j - 1, "11")))
            if i >= 2 and j >= 1:
                cands.append((get(i - 2, j - 1) + 1.6 * sim(K[i - 2] | K[i - 1], D[j - 1]) - 0.1, (i - 2, j - 1, "21")))
            if i >= 1 and j >= 2:
                cands.append((get(i - 1, j - 2) + 1.6 * sim(K[i - 1], D[j - 2] | D[j - 1]) - 0.1, (i - 1, j - 2, "12")))
            if i >= 1:
                cands.append((get(i - 1, j) + GAP, (i - 1, j, "10")))
            if j >= 1:
                cands.append((get(i, j - 1) + GAP, (i, j - 1, "01")))
            s, back = max(cands, key=lambda x: x[0])
            if s > NEG / 2:
                best[i, j] = (s, back)
    pairs, i, j = {}, n, m
    while (i, j) != (0, 0):
        _, back = best[i, j]
        pi, pj, kind = back
        if kind == "11":
            pairs[pi] = pj
        elif kind == "21":
            pairs[pi] = pairs[pi + 1] = pj
        elif kind == "12":
            pairs[pi] = pj
        i, j = pi, pj
    return pairs


def build():
    bf, bible = bibles()
    runs = []
    seen = set()
    for bk, f in bf.items():
        if bk == "Ps" or f in seen:
            continue
        seen.add(f)
        kj, dr = bible("kj", f), bible("dr", f)
        if not kj or not dr:
            continue
        # the bundled Douay-Rheims pads a chapter with empty verses to the KJV's length: a verse is one with text
        size = lambda B: [len(ch) - next((n for n, x in enumerate(reversed(ch)) if x), len(ch)) for ch in B]
        if size(kj) == size(dr):
            continue
        kref = [(c + 1, v + 1) for c, ch in enumerate(kj) for v, x in enumerate(ch) if x]
        dref = [(c + 1, v + 1) for c, ch in enumerate(dr) for v, x in enumerate(ch) if x]
        K = [words(kj[c - 1][v - 1]) for c, v in kref]
        D = [words(dr[c - 1][v - 1]) for c, v in dref]
        didx = {r: n for n, r in enumerate(dref)}
        ksize, dsize = size(kj), size(dr)
        band = abs(len(K) - len(D)) + 40
        pairs = align(K, D, band)
        row = []
        for i, (kc, kv) in enumerate(kref):
            if i not in pairs:
                continue
            dc, dv = dref[pairs[i]]
            if (dc, dv) == (kc, kv):
                continue
            # keep a shift only where the text bears it out: the verse the alignment found must read closer to the KJV
            # verse than the Douay-Rheims verse of the same number does (if there is one)
            same = D[didx[kc, kv]] if (kc, kv) in didx else None
            if same is None or sim(K[i], D[pairs[i]]) >= sim(K[i], same) + 0.05:
                row.append((kc, kv, dc, dv - kv))
        # only where the two Bibles number a chapter differently: the KJV chapter has another verse count, or its verse
        # falls in another Douay-Rheims chapter (a lone shift inside a chapter of equal length is the alignment's noise)
        differ = lambda c: c > len(dsize) or ksize[c - 1] != dsize[c - 1]
        row = [r for r in row if differ(r[0]) or r[2] != r[0]]
        # a verse the alignment left in place between two verses shifted alike shifts with them
        at = {(kc, kv): (dc, off) for kc, kv, dc, off in row}
        for kc, ch in enumerate(kj, 1):
            for kv in range(2, len(ch)):
                if (kc, kv) not in at and at.get((kc, kv - 1)) and at.get((kc, kv - 1)) == at.get((kc, kv + 1)):
                    at[kc, kv] = at[kc, kv - 1]
        row = sorted((kc, kv, dc, off) for (kc, kv), (dc, off) in at.items())
        # runs of constant chapter and offset within a KJV chapter
        for kc, kv, dc, off in row:
            if runs and runs[-1][0] == bk and runs[-1][1] == kc and runs[-1][3] == kv - 1 and runs[-1][4] == dc and runs[-1][5] == off:
                runs[-1][3] = kv
            else:
                runs.append([bk, kc, kv, kv, dc, off])
    return runs


def main():
    runs = build()
    text = TODAY.read_text(encoding="utf-8")
    new = "const VERSEMAP=" + json.dumps(runs, separators=(",", ":")) + ";"
    old = re.search(r"const VERSEMAP=\[.*?\];", text)
    if "--check" in sys.argv:
        ok = old and old.group(0) == new
        print("verse map up to date" if ok else "verse map out of date: run tools/build_versemap.py")
        return 0 if ok else 1
    if not old:
        raise SystemExit("src/today.js has no VERSEMAP to replace")
    TODAY.write_text(text.replace(old.group(0), new), encoding="utf-8")
    print(f"{len(runs)} runs in {len({r[0] for r in runs})} books")
    return 0


if __name__ == "__main__":
    sys.exit(main())
