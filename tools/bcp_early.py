#!/usr/bin/env python3
"""Build data/bcp<id>.json for the earlier Books of Common Prayer from the hand-proofread orders in
tools/texts/bcp-<id>.txt (the markup of tools/orders.py, plus the slots @collect and @gospel), in the shape of
data/bcp1662.json that the Prayer Book rite of src/mass.js prints. Where a book has the Collect, Epistle and Gospel
of each day in tools/texts/bcp-<id>-propers.json, they are included.

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


def build(path):
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
    pf = path.with_name(path.stem + "-propers.json")
    propers = json.loads(pf.read_text(encoding="utf-8")) if pf.exists() else {}
    src = "transcribed from the Internet Archive scan" if path.stem == "bcp-1784" else "text from the Society of Archbishop Justus (justus.anglican.org)"
    out = {"source": f"{o['book']}: {o['title']}. Public domain; {src}", "hc": hc, "propers": propers}
    if path.stem == "bcp-1784":
        out["fallback"] = "sunday"   # the book keeps only the Sundays and chief feasts: other days take the Sunday's propers
        lf = path.with_name(path.stem + "-lessons.json")   # the table of proper lessons (and psalms) for Morning and Evening Prayer
        out.update(json.loads(lf.read_text(encoding="utf-8")))
    return out


def main():
    out = {}
    for p in sorted(TEXTS.glob("bcp-*.txt")):
        out["bcp" + p.stem[len("bcp-"):]] = build(p)
    changed = []
    for name, d in out.items():
        js = json.dumps(d, ensure_ascii=False, separators=(",", ":"))
        f = ROOT / "data" / (name + ".json")
        if "--check" in sys.argv:
            assert f.exists() and f.read_text(encoding="utf-8") == js, f"data/{name}.json is out of date: run python3 tools/bcp_early.py"
            assert d["hc"] and all(s["items"] for s in d["hc"]), name
        else:
            f.write_text(js, encoding="utf-8"); changed.append(name)
    print(("ok: " if "--check" in sys.argv else "wrote ") + ", ".join(f"{n} ({len(d['hc'])} steps, {len(d['propers'])} days)" for n, d in out.items()))
    return 0


if __name__ == "__main__":
    sys.exit(main())
