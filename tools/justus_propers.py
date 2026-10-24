#!/usr/bin/env python3
"""Read the Society of Archbishop Justus pages of the collects, epistles and gospels (1549_Readings_*.htm) into days.
Each row of a page is a paragraph with its italic and grey (marginal note) runs. A day begins at an italic title
row; its Collect, Epistle and Gospel follow under italic headings. The marginal notes say which books print what
("1549 only", "added 1552"); they are returned with the row they stand beside so that the book builder can apply them.
"""
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import justus  # noqa: E402


def rows(path):
    s = pathlib.Path(path).read_text(encoding="latin-1", errors="replace")
    p = justus.Runs(); p.feed(s); p.flush()
    out = []
    for para in p.paras:
        g = justus.clean("".join(x for x, _, gr, _ in para if gr))
        r = justus.clean("".join(x for x, _, gr, _ in para if not gr))
        it = sum(len(x) for x, i, gr, _ in para if i and not gr)
        tot = sum(len(x) for x, i, gr, _ in para if not gr) or 1
        if r:
            out.append({"k": "rub" if it / tot > .55 else "say", "t": re.sub(r"^¶\s*", "", r), "note": g})
        elif g:
            out.append({"k": "note", "t": g, "note": ""})
    start = next((n for n, x in enumerate(out) if x["t"].startswith("Collects, Epistles, and Gospels")), -1)
    stop = next((n for n, x in enumerate(out) if x["t"].startswith("Next Readings") or x["t"].startswith("Return to")), len(out))
    return out[start + 1:stop]


if __name__ == "__main__":
    for x in rows(sys.argv[1]):
        print(f'{x["k"]:5} {x["t"][:100]}' + (f'   ## {x["note"][:70]}' if x["note"] else ""))


HEAD = re.compile(r"^(The )?(Collect(?:es?|s)?|Epistle|Epistel|Gospell?|Gospel)\b[ .,]*(.*)$", re.I)


def days(path):
    """Group the rows of a page into days: [{title, rows:[...]}]; a row is (kind, text, note) with kind one of
    title, introit-head, collect, epistle, gospel, text, rub, note."""
    out, cur = [], None
    for x in rows(path):
        t, k = x["t"], x["k"]
        if k == "note":
            if cur is not None:
                cur["rows"].append(("note", t, ""))
            continue
        m = HEAD.match(t)
        if m and len(t) < 70:
            kind = "collect" if m.group(2).lower().startswith("collect") else ("epistle" if m.group(2).lower().startswith("epist") else "gospel")
            if cur is None:
                cur = {"title": "?", "rows": []}; out.append(cur)
            cur["rows"].append((kind, m.group(3).strip(" ."), x["note"]))
            continue
        if k == "rub" and not re.search(r"Psalm|Ps\.", t) and not re.match(r"^(At |Then |And |Or |Note|Proper|Previous)", t, re.I) and len(t) < 90:
            cur = {"title": t, "rows": []}; out.append(cur)
            continue
        if cur is None:
            cur = {"title": "?", "rows": []}; out.append(cur)
        cur["rows"].append(("rub" if k == "rub" else "text", t, x["note"]))
    return out
