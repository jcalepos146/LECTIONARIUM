#!/usr/bin/env python3
"""Compile the page-checked Day-Hours transcription into data/dayhours.json.

    python3 tools/dayhours.py           # write data/dayhours.json
    python3 tools/dayhours.py --check   # fail if the JSON is stale or the markup is malformed

The markup is described at the top of tools/texts/dayhours-little.txt. Output:
  {"hours": {"prime": [{"t": step title, "items": [...]}, ...], "terce": ..., "preces": ...}}
Items: {"k": kind, "x": text}  kind = r (rubric) v r2 (versicle/response) a (antiphon)
  c (chapter) o (officiant) p (priest) l (all) s (canticle verse) h (hymn stanza: "x" is a list of lines)
  slot: {"k": "slot", "n": name, "a": argument}
Any item may carry "if": [conditions] (all must hold) and "pg": printed page.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "texts" / "dayhours-little.txt"
OUT = ROOT / "data" / "dayhours.json"
LEAF_TO_PAGE = -27          # scan leaf n201 is printed page 174 in item thedayhours00unknuoft
CONDS = {"sun", "wkd", "sept", "nosept", "septE", "noseptE", "easter", "noeaster", "advent", "lent", "passion", "ord", "penit"}
KINDS = {"@": "r", "V": "v", "R": "r2", "A": "a", "C": "c", "O": "o", "P": "p", "L": "l", "S": "s"}
SLOTS = {"ps", "preces", "collect", "lords-prayer", "creed", "lent-ps", "day-ps", "gloria"}


def compile_text(text):
    hours, errors, stack, page = {}, [], [], None
    hour = step = None
    for n, raw in enumerate(text.split("\n"), 1):
        line = raw.rstrip()
        if not line or (line.startswith("#") and not line.startswith(("## ", "### "))):
            continue
        if line.startswith("### "):
            hour = hours.setdefault(line[4:].strip(), []); step = None
            if stack:
                errors.append(f"line {n}: conditions {stack} open across hours")
            continue
        if line.startswith("## "):
            if hour is None:
                errors.append(f"line {n}: step before any hour"); continue
            step = {"t": line[3:].strip(), "items": []}
            if stack:
                step["if"] = list(stack)
            hour.append(step); continue
        m = re.fullmatch(r"=(\d+)", line)
        if m:
            page = int(m.group(1)) + LEAF_TO_PAGE; continue
        m = re.fullmatch(r"\{(/?)([A-Za-z]+)\}", line)
        if m:
            name = m.group(2)
            if name not in CONDS:
                errors.append(f"line {n}: unknown condition {name}")
            if m.group(1):
                if not stack or stack[-1] != name:
                    errors.append(f"line {n}: closes {name} but open is {stack[-1:]}")
                else:
                    stack.pop()
            else:
                stack.append(name)
            continue
        if step is None:
            errors.append(f"line {n}: text before the first step"); continue
        cond = [c for c in stack if c not in step.get("if", [])]

        def add(item):
            if cond:
                item["if"] = list(cond)
            if page:
                item["pg"] = page
            step["items"].append(item)
        if line.startswith("* "):
            name, _, arg = line[2:].strip().partition(" ")
            if name not in SLOTS:
                errors.append(f"line {n}: unknown slot {name}")
            it = {"k": "slot", "n": name}
            if arg:
                it["a"] = arg.strip()
            add(it); continue
        if line == "H/":
            step["_newstanza"] = True; continue
        if line.startswith("H: "):
            prev = step["items"][-1] if step["items"] else None
            if prev and prev["k"] == "h" and not step.pop("_newstanza", False) and prev.get("if") == (cond or None):
                prev["x"].append(line[3:].strip())
            else:
                step.pop("_newstanza", None); add({"k": "h", "x": [line[3:].strip()]})
            continue
        if line.startswith("+ "):
            prev = step["items"][-1] if step["items"] else None
            if not prev or not isinstance(prev.get("x"), str):
                errors.append(f"line {n}: continuation with nothing before it"); continue
            prev["x"] += " " + line[2:].strip(); continue
        m = re.fullmatch(r"(@|[VRACOPLS]):?\s+(.*)", line)
        if not m:
            errors.append(f"line {n}: cannot parse {line[:40]!r}"); continue
        add({"k": KINDS[m.group(1)], "x": m.group(2).strip()})
    if stack:
        errors.append(f"unclosed conditions at end: {stack}")
    for h, steps in hours.items():
        for st in steps:
            for it in st["items"]:
                x = it.get("x")
                for t in (x if isinstance(x, list) else [x] if x else []):
                    if re.search(r"[\^■£|$<>~_\\]|\b(tlie|tliat|tbe|rn)\b|\s[;:,.]\S", t):
                        errors.append(f"{h}/{st['t']}: suspicious characters in {t[:50]!r}")
    for need in ("prime", "terce", "sext", "none", "preces"):
        if need not in hours:
            errors.append(f"missing hour {need}")
    return hours, errors


def main():
    hours, errors = compile_text(SRC.read_text(encoding="utf-8"))
    for e in errors:
        print("ERROR", e)
    if errors:
        return 1
    data = {
        "source": "The Day-Hours of the Church of England, newly revised according to the Prayer-Book and the Authorised Translation of the Bible (London: Joseph Masters, 1877)",
        "url": "https://archive.org/details/thedayhours00unknuoft",
        "rights": "Public domain (published 1877).",
        "hours": hours,
    }
    out = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    words = sum(len((" ".join(it["x"]) if isinstance(it.get("x"), list) else it.get("x", "")).split())
                for st in sum(hours.values(), []) for it in st["items"])
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != out:
            print("data/dayhours.json is stale: run tools/dayhours.py"); return 1
        print(f"dayhours ok: {len(hours)} hours, {words} words"); return 0
    OUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: hours {list(hours)}, {words} words, {len(out)//1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
