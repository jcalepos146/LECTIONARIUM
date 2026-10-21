#!/usr/bin/env python3
"""Compile the hand-checked Hapgood transcription into data/byz-liturgy.json.

    python3 tools/byz_texts.py           # write data/byz-liturgy.json
    python3 tools/byz_texts.py --check   # fail if the JSON is stale or the markup is malformed

The markup is described at the top of tools/texts/hapgood-liturgy.txt. The
JSON is a list of parts; each part holds items:
  {"t":"r", "x":text}                              rubric
  {"t":"s", "w":who, "x":text, "q":1, "i":1, "re":response}  spoken line
      who: P D C R L PD;  q: said secretly;  i: words of institution
  {"t":"slot", "n":name}                           where the day's texts go
Any item may carry "if": [conditions] (all must hold) and "pg": printed page.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "tools" / "texts" / "hapgood-liturgy.txt"
OUT = ROOT / "data" / "byz-liturgy.json"
LEAF_TO_PAGE = -39          # scan leaf n119 is printed page 80 in item cu31924029363128
WHO = {"P", "D", "C", "R", "L", "PD"}
CONDS = {"chrys", "basil", "pascha", "departed", "russia", "feast", "illumination"} | {f"tone{i}" for i in range(1, 9)}


def compile_text(text):
    parts, stack, refrain, page, errors = [], [], None, None, []
    cur = None
    for n, raw in enumerate(text.split("\n"), 1):
        line = raw.rstrip()
        if not line or (line.startswith("#") and not line.startswith("## ")):
            continue
        def add(item):
            if cur is None:
                errors.append(f"line {n}: text before the first part"); return
            if stack:
                item["if"] = list(stack)
            if page:
                item["pg"] = page
            cur["items"].append(item)
        if line.startswith("## "):
            key, _, title = line[3:].partition("|")
            cur = {"key": key.strip(), "title": title.strip(), "items": []}
            parts.append(cur); refrain = None
            continue
        m = re.fullmatch(r"=(\d+)", line)
        if m:
            page = int(m.group(1)) + LEAF_TO_PAGE
            continue
        m = re.fullmatch(r"\{(/?)([a-z0-9]+)\}", line)
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
        if line.startswith("% "):
            reply, _, _tail = line[2:].partition("|")
            refrain = reply.strip()
            continue
        if line.startswith("* "):
            add({"t": "slot", "n": line[2:].strip()})
            continue
        if line.startswith("@ ") or line.startswith("> "):
            add({"t": "r", "x": line[2:].strip()})
            continue
        if line.startswith("+ "):
            if cur is None or not cur["items"]:
                errors.append(f"line {n}: continuation with nothing before it"); continue
            prev = cur["items"][-1]
            frag = line[2:].strip()
            if prev["x"].endswith("-") and re.search(r"[a-z]-$", prev["x"]):
                prev["x"] = prev["x"][:-1] + frag
            else:
                prev["x"] = prev["x"] + " " + frag
            if prev["x"].endswith(" ℟"):
                prev["x"] = prev["x"][:-2].rstrip(); prev["re"] = refrain
            continue
        m = re.fullmatch(r"(PD|P|D|C|R|L)([~!]?):\s+(.*)", line)
        if not m:
            errors.append(f"line {n}: cannot parse {line[:40]!r}"); continue
        who, flag, body = m.groups()
        item = {"t": "s", "w": who, "x": body.strip()}
        if flag == "~":
            item["q"] = 1
        if flag == "!":
            item["i"] = 1
        if item["x"].endswith("℟"):
            item["x"] = item["x"][:-1].rstrip()
            if not refrain:
                errors.append(f"line {n}: ℟ with no refrain set")
            item["re"] = refrain
        add(item)
    if stack:
        errors.append(f"unclosed conditions at end: {stack}")
    for p in parts:
        for it in p["items"]:
            if "x" in it and re.search(r"[\^■£|]|\b(tlie|tliat|tbe)\b", it["x"]):
                errors.append(f"{p['key']}: suspicious characters in {it['x'][:50]!r}")
    return parts, errors


def main():
    parts, errors = compile_text(SRC.read_text(encoding="utf-8"))
    for e in errors:
        print("ERROR", e)
    if errors:
        return 1
    data = {
        "source": "Isabel Florence Hapgood, Service Book of the Holy Orthodox-Catholic Apostolic (Greco-Russian) Church (Boston: Houghton, Mifflin, 1906)",
        "url": "https://archive.org/details/cu31924029363128",
        "rights": "Public domain (published 1906).",
        "parts": parts,
    }
    out = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    keys = [p["key"] for p in parts]
    words = sum(len(it.get("x", "").split()) for p in parts for it in p["items"])
    if "--check" in sys.argv:
        if not OUT.exists() or OUT.read_text(encoding="utf-8") != out:
            print("data/byz-liturgy.json is stale: run tools/byz_texts.py"); return 1
        print(f"byz-liturgy ok: {len(parts)} parts, {words} words"); return 0
    OUT.write_text(out, encoding="utf-8")
    print(f"wrote {OUT.relative_to(ROOT)}: parts {keys}, {words} words, {len(out)//1024} KB")
    return 0


if __name__ == "__main__":
    sys.exit(main())
