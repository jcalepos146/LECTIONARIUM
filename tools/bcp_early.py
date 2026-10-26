#!/usr/bin/env python3
"""Build data/bcp<id>.json for the earlier Books of Common Prayer from the hand-proofread orders in
tools/texts/bcp-books.txt (one book per '%%% book <year>' section, in the markup of tools/orders.py plus the slots
@collect and @gospel), in the shape of data/bcp1662.json that the Prayer Book rite of src/mass.js prints. Where a
book has the Collect, Epistle and Gospel of each day in tools/texts/bcp-propers.json ("propers"), they are
included; that file also holds Wesley's table of proper lessons ("lessons") and his Select Psalms ("psalter").

The texts come from the Society of Archbishop Justus transcriptions (justus.anglican.org/resources/bcp/), public
domain; tools/justus.py makes the first draft from the HTML, and each file's header lists what was corrected by hand.

    python3 tools/bcp_early.py          # write data/bcp<id>.json
    python3 tools/bcp_early.py --check  # CI: the JSON matches the texts
"""
import json
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import orders  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent
TEXTS = ROOT / "tools" / "texts"


EXTRA = json.loads((TEXTS / "bcp-propers.json").read_text(encoding="utf-8"))


def build(year, path):
    o = orders.parse(path)
    hc = []
    for st in o["steps"]:
        step = {"t": st["t"], "items": []}
        for it in st["items"]:
            if it[0] == "slot":
                step["slot"] = it[1]
            elif it[0] in ("or", "/or", "cons", "/cons"):
                raise SystemExit(f"{path.name}: {it[0]} is not used in Prayer Book texts")
            else:
                step["items"].append(it)
        hc.append(step)
    propers = EXTRA["propers"].get(year, {})
    src = ("transcribed from the Internet Archive scan" if year == "1784" else
           "text from the Society of Archbishop Justus (justus.anglican.org); the Collects, Epistles and Gospels checked against the scan of the book (tools/scot1929.py)" if year == "1929" else
           "text from the Society of Archbishop Justus (justus.anglican.org); the Collects, Epistles and Gospels are the 1662 table with this book's changes, read from its scan (tools/canada1918.py)" if year == "1918" else
           "text from the Society of Archbishop Justus (justus.anglican.org)")
    out = {"source": f"{o['book']}: {o['title']}. Public domain; {src}", "hc": hc, "propers": propers}
    if year == "1784":
        out["fallback"] = "sunday"   # the book keeps only the Sundays and chief feasts: other days take the Sunday's propers
        out.update(EXTRA["lessons"]["1784"])   # the table of proper lessons (and psalms) for Morning and Evening Prayer
    return out


def main():
    out = {}
    for year, src in orders.sections(TEXTS / "bcp-books.txt", "book"):
        out["bcp" + year] = build(year, src)
    changed = []
    for year, ps in EXTRA["psalter"].items():   # a book's own Psalter (Wesley's Select Psalms), served in a file of its own
        out["bcp" + year + "-psalter"] = ps
    # Books with no table of propers of their own (they cite the 1662 table) share one file, data/bcp-hc.json.
    shared = {n: d for n, d in out.items() if "hc" in d and not d["propers"]}
    files = {n: d for n, d in out.items() if n not in shared}
    files["bcp-hc"] = shared
    for name, d in files.items():
        js = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
        f = ROOT / "data" / (name + ".json")
        if "--check" in sys.argv:
            assert f.exists() and f.read_text(encoding="utf-8") == js, f"data/{name}.json is out of date: run python3 tools/bcp_early.py"
            for b in (d.values() if name == "bcp-hc" else [d]):
                assert name.endswith("-psalter") or (b["hc"] and all(s["items"] for s in b["hc"])), name
        else:
            f.write_text(js, encoding="utf-8"); changed.append(name)
    print(("ok: " if "--check" in sys.argv else "wrote ") + ", ".join(f"{n} ({len(d['hc'])} steps, {len(d['propers'])} days)" if "hc" in d else f"{n} ({len(d['psalter'])} days)" for n, d in out.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
