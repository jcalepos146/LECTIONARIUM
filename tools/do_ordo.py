#!/usr/bin/env python3
"""Parse Divinum Officium Ordo files (missa/<lang>/Ordo/Ordo*.txt) into the section
structure used by ordo.json: [{"h": heading, "items": [paragraph, ...], "cond": first-line marker}].

    python3 tools/do_ordo.py DO_MISSA_DIR            # write data/ordo-rites.json (Dominican, Ambrosian, Mozarabic)
    python3 tools/do_ordo.py DO_MISSA_DIR --verify   # check the parser reproduces ordo.json from Ordo.txt
    python3 tools/do_ordo.py --check                 # CI: data/ordo-rites.json is well formed

DO_MISSA_DIR is web/www/missa in a checkout of github.com/DivinumOfficium/divinum-officium (MIT).
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "ordo-rites.json"
RITES = {"op": "OrdoOP", "a": "OrdoA", "mz": "OrdoM"}
# OCR and typing slips in the Divinum Officium files, corrected here (checked against the context of each).
FIXES = [(r"\bno bis\b", "nobis"), (r"\bpurls\b", "puris"), (r"omni po tens", "omnipotens"), (r"opere bona\b", "opere bono"),
         (r"\bJ esu", "Jesu"), (r"enat\.rem", "enarrem"), (r"Domine ate:", "Domine a te:"), (r"humilitatis,\.", "humilitatis,"),
         (r"sacrificiuin", "sacrificium"), (r"Per omni saecula", "Per omnia saecula"), (r"Jesum\(,Christum", "Jesum Christum"),
         (r"\bquibis\b", "quibus"), (r"excelsis \.\.", "excelsis."), (r"aetemam", "aeternam"), (r"\bChristun\b", "Christum"),
         (r"\bbeatac\b", "beatae"), (r"\becelesia\b", "ecclesia"), (r"\bhace\b", "haec"), (r"\bmiscrere\b", "miserere"),
         (r"\bmiscricordia\b", "misericordia"), (r"\bofferituus\b", "offerimus"), (r"shall he healed", "shall be healed"),
         (r"Commemeration", "Commemoration"), (r"thePriest", "the Priest"), (r"\bCALICE\b", "CHALICE"), (r"(?m)^v,", "v."),
         (r"every Virgin", "ever Virgin")]


def fix(text):
    for a, b in FIXES:
        text = re.sub(a, b, text)
    return text


def parse(text):
    secs, cur = [], {"h": "_start", "items": [], "cond": ""}
    para = []

    def flush_para():
        if para:
            cur["items"].append("\n".join(para)); para.clear()
    for raw in text.replace("\r", "").split("\n"):
        line = raw.rstrip()
        m = re.match(r"^#\s*(.+)$", line)
        if m:
            flush_para()
            if cur["items"] or cur["h"] != "_start":
                secs.append(cur)
            cur = {"h": m.group(1).strip(), "items": [], "cond": ""}
            continue
        if not line.strip():
            flush_para(); continue
        para.append(line.strip())
    flush_para()
    secs.append(cur)
    for a, b in zip(secs, secs[1:]):
        if a["items"] and re.fullmatch(r"!\*\S+", a["items"][-1]):
            b["cond"] = a["items"].pop()      # a marker just before a heading governs that section
    return secs


def main():
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        for k in RITES:
            assert d[k]["Latin"] and d[k]["English"], k
        print(f"ordo-rites ok: {', '.join(f'{k} {len(d[k][chr(76)+chr(97)+chr(116)+chr(105)+chr(110)])} sections' for k in RITES)}")
        return 0
    base = pathlib.Path(sys.argv[1])
    if "--verify" in sys.argv:
        old = json.loads((ROOT / "ordo.json").read_text(encoding="utf-8"))
        for lang in ("Latin", "English"):
            new = parse((base / lang / "Ordo" / "Ordo.txt").read_text(encoding="utf-8"))
            o = old[lang]["ordo"]
            same = sum(1 for a, b in zip(new, o) if a == b)
            print(lang, "sections", len(new), "vs", len(o), "identical", same)
            for a, b in zip(new, o):
                if a != b:
                    print("  differs at", a["h"], "|", b["h"], "|", a["cond"], "|", b["cond"]); break
        return 0
    data = {}
    for k, f in RITES.items():
        data[k] = {lang: parse(fix((base / lang / "Ordo" / f"{f}.txt").read_text(encoding="utf-8"))) for lang in ("Latin", "English")}
    data["source"] = "Divinum Officium (github.com/DivinumOfficium/divinum-officium), MIT licence: Ordo files " + ", ".join(f + ".txt" for f in RITES.values())
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {k: len(data[k]["Latin"]) for k in RITES})
    return 0


if __name__ == "__main__":
    sys.exit(main())
