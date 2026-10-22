#!/usr/bin/env python3
"""Build data/orders.json from the hand-proofread orders of service in tools/texts/order-*.txt.

Each text file is one order (the file name after "order-" is its id). Markup, one paragraph per line:
    title: ...         the order's title          book: ...   the book it comes from
    = Step             starts a step (a timed section on the site)
    ## Heading         a heading inside a step
    ¶ text             a rubric
    text               said by the Minister
    + text             said by all
    - text             said by the People
    Minister. text / People. text / Answer. text      versicles and responses
    [or] Summary       alternatives, shown folded under Summary, until [/or]
    @name[: label]     a slot the site fills: hymn, psalter, lessons, sermon, offering, prayer, communion
    # ...              a comment (source notes)

    python3 tools/orders.py           # write data/orders.json
    python3 tools/orders.py --check   # CI: the JSON matches the texts
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "orders.json"
SLOTS = {"hymn", "psalter", "lessons", "sermon", "offering", "prayer", "communion"}
LABELS = {"Minister": ("cel", "℣."), "People": ("ppl", "℟."), "Answer": ("ppl", "℟.")}


def parse(path):
    order = {"steps": []}
    step, depth = None, 0
    for n, raw in enumerate(path.read_text(encoding="utf-8").split("\n"), 1):
        l = raw.strip()
        if not l or l.startswith("#") and not l.startswith("## "):
            continue
        m = re.match(r"^(title|book):\s*(.+)$", l)
        if m and step is None:
            order[m.group(1)] = m.group(2); continue
        if l.startswith("= "):
            if depth:
                raise SystemExit(f"{path.name}:{n}: step starts inside [or]")
            step = {"t": l[2:].strip(), "items": []}; order["steps"].append(step); continue
        if step is None:
            raise SystemExit(f"{path.name}:{n}: text before the first step")
        it = step["items"]
        if l.startswith("## "):
            it.append(["h", l[3:].strip(), ""])
        elif l.startswith("¶ "):
            it.append(["rub", l[2:].strip(), ""])
        elif l.startswith("[or]"):
            depth += 1; it.append(["or", l[4:].strip() or "Or this", ""])
        elif l == "[/or]":
            depth -= 1; it.append(["/or", "", ""])
        elif l.startswith("@"):
            name, _, label = l[1:].partition(":")
            if name.strip() not in SLOTS:
                raise SystemExit(f"{path.name}:{n}: unknown slot {l}")
            it.append(["slot", name.strip(), label.strip()])
        elif l.startswith("+ "):
            it.append(["v", l[2:].strip(), "all"])
        elif l.startswith("- "):
            it.append(["v", l[2:].strip(), "ppl"])
        else:
            m = re.match(r"^(Minister|People|Answer)\.\s+(.*)$", l)
            if m:
                role, lab = LABELS[m.group(1)]
                it.append(["v", m.group(2), role, lab])
            else:
                it.append(["v", l, "cel"])
    if depth:
        raise SystemExit(f"{path.name}: unclosed [or]")
    for k in ("title", "book"):
        if k not in order:
            raise SystemExit(f"{path.name}: no {k}: line")
    return order


def build():
    return {p.stem[len("order-"):]: parse(p) for p in sorted((ROOT / "tools" / "texts").glob("order-*.txt"))}


def main():
    data = build()
    js = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    if "--check" in sys.argv:
        assert OUT.read_text(encoding="utf-8") == js, "data/orders.json is out of date: run python3 tools/orders.py"
        print("orders ok:", ", ".join(f"{k} ({len(v['steps'])} steps)" for k, v in data.items()))
        return 0
    OUT.write_text(js, encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {k: len(v["steps"]) for k, v in data.items()})
    return 0


if __name__ == "__main__":
    sys.exit(main())
