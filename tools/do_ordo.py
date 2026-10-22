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
ATCHLEY = ROOT / "tools" / "texts" / "atchley-ambrosian.txt"   # English of the Ambrosian Ordinary (1909, public domain)
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


def atchley():
    """Atchley's page-checked transcription, in Divinum Officium markup: drop the header comment
    and the =LEAF markers, and join '+ ' lines to the line before (a sentence running over a page)."""
    out = []
    for line in ATCHLEY.read_text(encoding="utf-8").split("\n"):
        if line.startswith("#   ") or line.startswith("# E. G.") or line.startswith("# according") or line.startswith("# Internet") or line.startswith("# Transcribed") or line.startswith("# Divinum") or line == "#":
            continue
        if re.fullmatch(r"=\d+", line):
            continue
        if line.startswith("+ "):
            if not out or not out[-1].strip():
                raise SystemExit(f"atchley: continuation with nothing before it: {line[:40]!r}")
            out[-1] = out[-1].rstrip() + " " + line[2:].strip()
            continue
        out.append(line)
    secs = parse("\n".join(out))
    bad = [w for w in re.findall(r"\b(?:tlie|tbe|liis|ot|aud)\b", "\n".join(out))]
    if bad:
        raise SystemExit(f"atchley: suspicious words {bad[:10]}")
    return secs


def main():
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        for k in RITES:
            assert d[k]["Latin"] and d[k]["English"], k
        if d["a"]["English"] != atchley():
            print("data/ordo-rites.json: the Ambrosian English is stale; rerun tools/do_ordo.py"); return 1
        if [x["h"] for x in d["a"]["English"]] != [x["h"] for x in d["a"]["Latin"]]:
            print("Ambrosian: Atchley's sections do not match the Latin ones"); return 1
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
    data["a"]["English"] = atchley()
    data["source"] = "Divinum Officium (github.com/DivinumOfficium/divinum-officium), MIT licence: Ordo files " + ", ".join(f + ".txt" for f in RITES.values()) + "; Ambrosian English: E. G. C. F. Atchley, The Ambrosian Liturgy (1909), public domain"
    OUT.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print("wrote", OUT.relative_to(ROOT), {k: len(data[k]["Latin"]) for k in RITES})
    return 0


if __name__ == "__main__":
    sys.exit(main())
