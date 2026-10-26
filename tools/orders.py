#!/usr/bin/env python3
"""Build data/orders.json from the hand-proofread orders of service in tools/texts/orders-<family>.txt.

Each bundle holds several orders; an order begins at a line "%%% order <id>" and runs to the next (the id is
its key in data/orders.json). A lone tools/texts/order-<id>.txt is read as one order too. Markup, one paragraph per line:
    title: ...         the order's title          book: ...   the book it comes from
    = Step             starts a step (a timed section on the site)
    ## Heading         a heading inside a step
    ¶ text             a rubric
    text               said by the Minister
    + text             said by all
    - text             said by the People
    Minister. / People. / Answer. text                versicles and responses (shown as ℣. and ℟.)
    Priest. / Presbyter. / Deacon. / Choir. / Clergy. / Reader. / All. / Bishop. / Man. / Woman. / Godparents. / Sponsors. / Candidate. text   a speaker, named
    {srv} text         a role without a label: cel (celebrant), srv (deacon, server), lec, ppl, all
    [or] Summary       alternatives, shown folded under Summary, until [/or]
    [consecration]     the words of consecration (institution narrative, epiclesis), until [/consecration]:
                       shown only in priest-or-seminarian mode, replaced by a notice in lay study
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
SLOTS = {"hymn", "psalter", "lessons", "sermon", "offering", "prayer", "communion", "collect", "gospel"}
LABELS = {"Minister": ("cel", "℣."), "People": ("ppl", "℟."), "Answer": ("ppl", "℟."),
          "Priest": ("cel", "Priest."), "Presbyter": ("cel", "Presbyter."), "Deacon": ("srv", "Deacon."), "Choir": ("ppl", "Choir."), "Clergy": ("cel srv", "Clergy."),
          "Reader": ("lec", "Reader."), "All": ("all", "All."), "Bishop": ("cel", "Bishop."),
          "Man": ("ppl", "The Man."), "Woman": ("ppl", "The Woman."), "Godparents": ("ppl", "Godparents."), "Sponsors": ("ppl", "Sponsors."), "Candidate": ("ppl", "Candidate.")}
ROLES = {"cel", "srv", "ppl", "lec", "all"}


class _Src:
    """A named piece of text, so that errors can point at the bundle and the order."""
    def __init__(self, name, text, first=1):
        self.name, self.text, self.first = name, text, first

    def read_text(self, encoding="utf-8"):
        return self.text


def sections(path, kind):
    """Split a bundle into (id, _Src) at its '%%% <kind> <id>' lines."""
    out, cur, buf, start = [], None, [], 1
    for n, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1):
        m = re.fullmatch(r"%%%%%% %s (\S+)" % kind, line.strip())
        if m:
            if cur:
                out.append((cur, _Src(f"{path.name}[{cur}]", "\n".join(buf), start)))
            cur, buf, start = m.group(1), [], n + 1
        elif cur:
            buf.append(line)
    if cur:
        out.append((cur, _Src(f"{path.name}[{cur}]", "\n".join(buf), start)))
    ids = [k for k, _ in out]
    if len(ids) != len(set(ids)):
        raise SystemExit(f"{path.name}: an id appears twice")
    return out


def parse(path):
    order = {"steps": []}
    step, depth, cons = None, 0, False
    first = getattr(path, "first", 1)
    for n, raw in enumerate(path.read_text(encoding="utf-8").split("\n"), first):
        l = raw.strip()
        if not l or l.startswith("#") and not l.startswith("## "):
            continue
        m = re.match(r"^(title|book):\s*(.+)$", l)
        if m and step is None:
            order[m.group(1)] = m.group(2); continue
        if l.startswith("= "):
            if cons:
                raise SystemExit(f"{path.name}:{n}: step starts inside [consecration]")
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
        elif l == "[consecration]":
            if cons:
                raise SystemExit(f"{path.name}:{n}: nested [consecration]")
            cons = True; it.append(["cons", "", ""])
        elif l == "[/consecration]":
            if not cons:
                raise SystemExit(f"{path.name}:{n}: [/consecration] without [consecration]")
            cons = False; it.append(["/cons", "", ""])
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
            m = re.match(r"^(%s)\.\s+(.*)$" % "|".join(LABELS), l)
            r = re.match(r"^\{([a-z ]+)\}\s+(.*)$", l)
            if r and set(r.group(1).split()) <= ROLES:
                it.append(["v", r.group(2), r.group(1)])
            elif m:
                role, lab = LABELS[m.group(1)]
                it.append(["v", m.group(2), role, lab])
            else:
                it.append(["v", l, "cel"])
    if depth:
        raise SystemExit(f"{path.name}: unclosed [or]")
    if cons:
        raise SystemExit(f"{path.name}: unclosed [consecration]")
    for k in ("title", "book"):
        if k not in order:
            raise SystemExit(f"{path.name}: no {k}: line")
    return order


def build():
    T = ROOT / "tools" / "texts"
    found = {p.stem[len("order-"):]: p for p in T.glob("order-*.txt")}
    for b in sorted(T.glob("orders-*.txt")):
        for k, src in sections(b, "order"):
            if k in found:
                raise SystemExit(f"order {k} is defined twice")
            found[k] = src
    return {k: parse(found[k]) for k in sorted(found)}


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
