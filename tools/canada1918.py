#!/usr/bin/env python3
"""Draft the Collects, Epistles and Gospels of the Canadian Book of Common Prayer (1918) for tools/texts/bcp-propers.json
("propers" → "1918"), from the scan of the book (justus.anglican.org/resources/bcp/Canada/Canada1918.pdf).

The 1918 book keeps the 1662 table, revised here and there: a collect re-addressed ("who, with the Father and the
Holy Ghost, livest and reignest"), Revised Version renderings in a few readings ("living creatures" for beasts),
spellings ("judgement"). There is no transcription of it, and the scan's own text layer is poor, so each half page is
read again with Tesseract (OCR_DIR holds p<page>-L.txt and p<page>-R.txt for PDF pages 66-175) and each 1662 text is
aligned word by word against it. A difference is taken into the 1918 text only when the scan reads real words there
(words of the King James Bible or the 1662 propers) that are not an OCR slip of the 1662 words (a dropped letter,
"be" for he, a compound split at a line end); the running heads and page numbers of the scan are left out of the
alignment. Every change taken is listed when the tool runs, and the ones checked against the page image and found
to be the scanner's, not the book's, are in REJECT; changes the alignment cannot make (a reading the book replaces,
a collect it rewrites) are in OVERRIDE.

    python3 tools/canada1918.py OCR_DIR            # write the draft into tools/texts/bcp-propers.json and list the changes
"""
import difflib
import glob
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXTS = ROOT / "tools" / "texts" / "bcp-propers.json"
A = json.loads((ROOT / "data" / "bcp1662.json").read_text(encoding="utf-8"))["propers"]
PAGES = range(66, 176)
norm = lambda t: re.sub(r"[^a-z]", "", t.lower().replace("æ", "ae"))


def vocabulary():
    v = set()
    for d in A.values():
        for s in d["sets"]:
            for t in s["collect"] + [x for f in ("epistle", "gospel") if s.get(f) for x in s[f]["text"]]:
                v |= {norm(w) for w in t.split()}
    for f in glob.glob(str(ROOT / "bible" / "kj" / "s*.json")):
        for b in json.loads(pathlib.Path(f).read_text(encoding="utf-8")).values():
            for ch in b:
                for x in ch:
                    v |= {norm(w) for w in (x or "").split()}
    return v - {""}


def stream(ocr_dir):
    """The scan's words in reading order, without running heads and page numbers: [(raw token, page, side)]."""
    out = []
    for p in PAGES:
        for side in "LR":
            f = pathlib.Path(ocr_dir) / f"p{p}-{side}.txt"
            if not f.exists():
                continue
            lines = [l for l in f.read_text(encoding="utf-8", errors="replace").split("\n") if l.strip()]
            if lines:
                lines = lines[1:]                                   # the running head
            while lines and len(re.sub(r"[^A-Za-z0-9]", "", lines[-1])) <= 4:
                lines = lines[:-1]                                  # the page number
            text = " ".join(lines)
            text = re.sub(r"(\w)[-—]\s+(?=[a-z])", r"\1", text)     # a word broken at the line end
            for tok in text.split():
                if norm(tok):
                    out.append((tok, p, side))
    return out


def lev(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1):
            p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1]


# Changes the book makes throughout, each seen on the page: these are not OCR slips however close the spelling.
VARIANTS = {("toward", "towards"), ("among", "amongst"), ("beside", "besides"), ("while", "whilst"), ("cloak", "cloke"),
            ("burned", "burnt"), ("judgment", "judgement"), ("said", "saith"), ("ye", "you"), ("which", "who"), ("which", "that"),
            ("whom", "which"), ("shall", "should"), ("damned", "condemned"), ("damnation", "condemnation"), ("fold", "flock")}


def slip(a, b, V, raw_a=()):
    """True when the scan's words b are an OCR misreading of the 1662 words a, not a change in the book."""
    ja, jb = "".join(a), "".join(b)
    if raw_a and len(a) == len(b) == 1 and b[0] == a[0] + "s" and raw_a[-1][-1:] in ";:":
        return True                                 # a semicolon read as "s": "truth;" as truths
    if ja == jb:                                    # a compound split or joined at a line end
        return True
    if any(w not in V for w in b):                  # not words at all
        return True
    if (ja, jb) in VARIANTS:                        # the book's own spelling or grammar, found again and again
        return False
    if lev(ja, jb) <= 2 or len(jb) < .75 * len(ja):   # "potter" for better, "purse" for purpose, a line read short
        return True
    if len(a) == len(b) == 1:
        x, y = a[0], b[0]
        if y in x or x in y and len(x) <= 2:        # a letter or an ending dropped: "an" for and, "lift" for lifted
            return True
        if len(x) <= 4 and lev(x, y) <= 1:          # "be" for he, "the" for they
            return True
        if lev(x, y) == 1 and not (x + "s" == y or y + "s" == x):   # one letter misread; a plural is a real change
            return True
    return False


def align(W, S, V):
    """Edits [(i1, i2, words)] that turn the 1662 tokens W into the 1918 text, from the scan tokens S."""
    nw, ns = [norm(w) for w in W], [norm(t) for t, _, _ in S]
    idx = {}
    for i in range(len(ns) - 2):
        idx.setdefault(tuple(ns[i:i + 3]), []).append(i)
    from collections import Counter
    c = Counter()
    for j in range(len(nw) - 2):
        for i in idx.get(tuple(nw[j:j + 3]), []):
            c[(i - j) // 10] += 1
    if not c:
        return None, 0, []
    b = c.most_common(1)[0][0]
    st = max(0, b * 10 - 20)
    win = S[st:st + len(W) + 40]
    sm = difflib.SequenceMatcher(None, nw, [norm(t) for t, _, _ in win], autojunk=False)
    ops = sm.get_opcodes()
    eq = [n for n, o in enumerate(ops) if o[0] == "equal" and o[2] - o[1] >= 2]
    if not eq:
        return win, 0, []
    cov = sum(o[2] - o[1] for o in ops if o[0] == "equal") / len(nw)
    edits = []
    # the scan's text may end (or begin) short of the 1662 reading: report the part not found
    first, last = ops[eq[0]], ops[eq[-1]]
    if first[1] > 2:
        edits.append(("head", 0, first[1], [], win[first[3]][1:]))
    if last[2] < len(nw) - 2:
        edits.append(("tail", last[2], len(nw), [], win[min(last[4], len(win) - 1)][1:]))
    for op, i1, i2, j1, j2 in ops[eq[0]:eq[-1] + 1]:
        if op == "equal":
            continue
        a, bb = nw[i1:i2], [norm(t) for t, _, _ in win[j1:j2]]
        if op == "delete":
            edits.append(("delete", i1, i2, [], win[j1 - 1][1:] if j1 else None))
        elif not slip(a, bb, V, W[i1:i2]):
            raw = [t for t, _, _ in win[j1:j2]]
            # margin specks read as letters ("i", "a", "iF") and the next day's heading are not text
            if op == "insert" and (all(len(w) <= 1 for w in bb) or all(re.sub(r"[^A-Za-z]", "", t).isupper() for t in raw)):
                continue
            if any(re.search(r"[a-z][A-Z]", t) for t in raw):
                continue
            edits.append((op, i1, i2, raw, win[j1][1:]))
    return win, cov, edits


def clean(tok):
    t = re.sub(r"^[^A-Za-z(\[]+", "", tok)
    t = re.sub(r"[^A-Za-z.,;:?!)\]’']+$", "", t)
    return t.replace("'", "’")


# Edits the alignment proposes that the page image shows are the scanner's misreading, not the book: (key, field, scan words)
REJECT = [("CHRISTMAS DAY", "epistle", "all ages"), ("WEDNESDAY BEFORE EASTER", "gospel", "Then said they a"),
          ("TUESDAY IN WHITSUN WEEK", "epistle", "entereth in by the door is the shepherd"), ("TUESDAY IN WHITSUN WEEK", "epistle", "a robber. But he"),
          ("THE NINTH SUNDAY AFTER TRINITY", "collect", "thy will;"), ("SAINT MARK’S DAY", "gospel", "i if"),
          ("SAINT JOHN BAPTIST’S DAY", "gospel", "had beard"),
          ("THE FOURTH SUNDAY IN ADVENT", "collect", "reignest, one God,"), ("THE FOURTH SUNDAY IN ADVENT", "collect", "livest"),
          ("THE FOURTH SUNDAY IN ADVENT", "collect", "who, with"), ("GOOD FRIDAY", "collect", "the Jews, thine ancient people, and upon")]
# Texts the alignment cannot make: (key, field, 1662 words, 1918 words), each read from the page image
OVERRIDE = [
    ("THE FIRST SUNDAY IN ADVENT", "collect", "and the Holy Ghost, one God, now and for ever. Amen.", "and the Holy Ghost, now and ever. Amen."),
    ("THE FOURTH SUNDAY IN ADVENT", "collect", "through the satisfaction of thy Son our Lord, to whom with thee and the Holy Ghost be honour and glory, world without end. Amen.",
     "who, with the Father and the Holy Ghost, livest and reignest, one God, world without end. Amen."),
    ("GOOD FRIDAY", "collect", "Have mercy upon all Jews, Turks, Infidels, and Hereticks, and take from them",
     "Have mercy upon the Jews, thine ancient people, and upon all who reject and deny thy Son; take from them"),
    # the 1918 book ends the reading at Acts 8. 17
    ("TUESDAY IN WHITSUN WEEK", "epistle", " And when Simon saw that through laying on of the apostles' hands the Holy Ghost was given, he offered them money, Saying, Give me also this power, that on whomsoever I lay hands, he may receive the Holy Ghost.", ""),
    ("SAINT JOHN BAPTIST’S DAY", "gospel", "And all they that heard them", "And all they that had heard them"),
    ("ASH WEDNESDAY", "epistle", "Turn ye even to me saith the Lord,", "Turn ye even to me, saith the Lord,"),
]


def main():
    ocr = sys.argv[1]
    V, S = vocabulary(), stream(ocr)
    propers, log = {}, []
    for k, d in A.items():
        s0 = d["sets"][0]
        s = json.loads(json.dumps(s0))
        for f in ("collect", "epistle", "gospel"):
            if f == "collect" and not s["collect"]:
                continue
            if f != "collect" and not s.get(f):
                continue
            paras = s["collect"] if f == "collect" else s[f]["text"]
            W, owner = [], []
            for n, t in enumerate(paras):
                for w in t.split():
                    W.append(w); owner.append(n)
            win, cov, edits = align(W, S, V)
            if cov < .6:
                log.append(f"LOW {k} {f}: {cov:.2f}")
                continue
            out = list(W)
            for op, i1, i2, new, where in reversed(edits):
                if op in ("head", "tail"):
                    log.append(f"? {k} {f}: the scan {'begins after' if op == 'head' else 'ends before'} [{' '.join(W[i1:i2])[:200]}] (p.{where})")
                    continue
                if op == "delete":
                    if i2 - i1 >= 2:
                        log.append(f"? {k} {f}: scan lacks [{' '.join(W[i1:i2])}] (p.{where})")
                    continue
                new = [clean(t) for t in new]
                if (k, f, " ".join(new)) in REJECT:
                    continue
                # a single word added, or a long passage read as a few words, is not taken without a look at the page
                if (op == "insert" and len(new) == 1) or (i2 - i1 >= 4 and len(new) < (i2 - i1) / 2):
                    log.append(f"? {k} {f}: [{' '.join(W[i1:i2])}] -> [{' '.join(new)}] (p.{where[0]}{where[1]})")
                    continue
                log.append(f"+ {k} {f}: [{' '.join(W[i1:i2])}] -> [{' '.join(new)}] (p.{where[0]}{where[1]})")
                out[i1:i2] = new
                owner[i1:i2] = [owner[i1] if i1 < len(owner) else owner[-1]] * len(new)
            text = [" ".join(w for w, o in zip(out, owner) if o == n) for n in range(len(paras))]
            if f == "collect":
                s["collect"] = text
            else:
                s[f]["text"] = text
        propers[k] = {"t": d["t"], "sets": [s] + d["sets"][1:], "notes": d.get("notes", [])}
    for k, f, old, new in OVERRIDE:
        paras = propers[k]["sets"][0]["collect"] if f == "collect" else propers[k]["sets"][0][f]["text"]
        hit = [n for n, t in enumerate(paras) if old in t]
        assert len(hit) == 1, (k, f, old)
        paras[hit[0]] = paras[hit[0]].replace(old, new)
        log.append(f"= {k} {f}: [{old}] -> [{new}]")
    print("\n".join(log))
    T = json.loads(TEXTS.read_text(encoding="utf-8"))
    T["propers"]["1918"] = propers
    TEXTS.write_text(json.dumps(T, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(propers)} days; {sum(l.startswith('+') for l in log)} changes taken, {sum(l.startswith('?') for l in log)} to check, {sum(l.startswith('LOW') for l in log)} not aligned")
    return 0


if __name__ == "__main__":
    sys.exit(main())
