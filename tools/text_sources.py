#!/usr/bin/env python3
"""Validate, audit and render the text-source plan in data/text-sources.json.

    python3 tools/text_sources.py            # validate the schema and catalog links
    python3 tools/text_sources.py --audit    # also check every Internet Archive item and URL
    python3 tools/text_sources.py --md       # rewrite docs/text-sources.md from the JSON
    python3 tools/text_sources.py --md --check   # fail if docs/text-sources.md is stale

The audit is read-only. A reachable item with OCR text is a usable lead, not a
rights clearance; the rights field and docs/source-review.md still govern.
"""
import argparse
import concurrent.futures as cf
import json
import pathlib
import sys
import urllib.error
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLAN = ROOT / "data" / "text-sources.json"
CATALOG = ROOT / "data" / "traditions.json"
DOC = ROOT / "docs" / "text-sources.md"
UA = {"User-Agent": "Lectionarium source audit (+https://github.com/jcalepos146/LECTIONARIUM)"}

GAP_KEYS = {"id", "family", "priority", "catalog", "rite", "service", "now", "missing", "plan", "sources", "blockers"}
SRC_KEYS = {"ia", "url", "title", "year", "lang", "fills", "rights", "note"}
PRINTABLE = {"pd", "pd-reprint", "ancient", "open", "crown-uk"}


def load():
    return json.loads(PLAN.read_text(encoding="utf-8"))


def validate(plan):
    errors = []
    catalog_ids = {e["id"] for e in json.loads(CATALOG.read_text(encoding="utf-8"))}
    families = plan["order"]
    rights = set(plan["rights"])
    seen, last = set(), (-1, 0)
    for g in plan["gaps"]:
        where = g.get("id", "?")
        if set(g) != GAP_KEYS:
            errors.append(f"{where}: keys {sorted(set(g) ^ GAP_KEYS)}")
            continue
        if where in seen:
            errors.append(f"{where}: duplicate id")
        seen.add(where)
        if g["family"] not in families:
            errors.append(f"{where}: unknown family {g['family']}")
        rank = (families.index(g["family"]) if g["family"] in families else 99, g["priority"])
        if rank < last:
            errors.append(f"{where}: out of priority order")
        last = rank
        for c in g["catalog"]:
            if c not in catalog_ids:
                errors.append(f"{where}: catalog id {c} not in data/traditions.json")
        for s in g["sources"]:
            name = s.get("ia") or s.get("url") or "?"
            if not set(s) <= SRC_KEYS or bool(s.get("ia")) == bool(s.get("url")):
                errors.append(f"{where}/{name}: needs exactly one of ia/url and only known keys")
            for k in ("title", "lang", "fills", "rights"):
                if not s.get(k):
                    errors.append(f"{where}/{name}: missing {k}")
            if s.get("rights") not in rights:
                errors.append(f"{where}/{name}: unknown rights {s.get('rights')}")
    return errors


def fetch_json(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)


def audit_ia(ident):
    try:
        m = fetch_json(f"https://archive.org/metadata/{ident}")
    except Exception as e:  # network failure is reported, not fatal
        return {"id": ident, "ok": False, "why": f"error {e}"}
    if not m.get("metadata"):
        return {"id": ident, "ok": False, "why": "no such item"}
    md, files = m["metadata"], m.get("files", [])
    names = [f.get("name", "") for f in files]
    ocr = any(n.endswith("_djvu.txt") or n.endswith("_hocr.html") for n in names)
    restricted = str(md.get("access-restricted-item", "")).lower() == "true"
    title = md.get("title"); title = title if isinstance(title, str) else "; ".join(title or [])
    return {"id": ident, "ok": True, "title": title, "date": md.get("date") or md.get("year", ""),
            "ocr": ocr, "lending": restricted}


def raw_github(url):
    """github.com pages are often blocked to scripts; check the raw file instead."""
    parts = url.split("/")
    if url.startswith("https://github.com/") and len(parts) >= 5:
        owner, repo = parts[3], parts[4]
        if len(parts) > 6 and parts[5] == "blob":
            return f"https://raw.githubusercontent.com/{owner}/{repo}/{parts[6]}/" + "/".join(parts[7:])
        return f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/README.md"
    return url


def audit_url(url):
    req = urllib.request.Request(raw_github(url), headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return {"id": url, "ok": True, "status": r.status}
    except urllib.error.HTTPError as e:
        return {"id": url, "ok": False, "why": f"HTTP {e.code}"}
    except Exception as e:
        return {"id": url, "ok": False, "why": f"error {e}"}


def audit(plan):
    ias = sorted({s["ia"] for g in plan["gaps"] for s in g["sources"] if s.get("ia")})
    urls = sorted({s["url"] for g in plan["gaps"] for s in g["sources"] if s.get("url")})
    with cf.ThreadPoolExecutor(6) as ex:
        res = list(ex.map(audit_ia, ias)) + list(ex.map(audit_url, urls))
    bad = 0
    for r in res:
        if not r["ok"]:
            bad += 1
            print(f"FAIL  {r['id']}: {r['why']}")
        elif "title" in r:
            flags = ",".join(f for f, on in (("ocr", r["ocr"]), ("lending", r["lending"])) if on) or "no-ocr"
            print(f"ok    {r['id']} [{flags}] {r['date']} {r['title'][:70]}")
        else:
            print(f"ok    {r['id']} HTTP {r['status']}")
    print(f"\n{len(res) - bad}/{len(res)} reachable ({len(ias)} archive items, {len(urls)} URLs).")
    return bad


def link(s):
    if s.get("ia"):
        return f"[{s['ia']}](https://archive.org/details/{s['ia']})"
    return f"[link]({s['url']})"


def render(plan):
    fam = {"catholic": "Catholic", "anglican": "Anglican", "eastern-orthodox": "Eastern Orthodox",
           "oriental": "Oriental Orthodox and Church of the East", "lutheran": "Lutheran",
           "reformed": "Reformed", "old-catholic": "Old Catholic"}
    out = ["# Text sources still to import", "",
           "*Generated from `data/text-sources.json` by `python3 tools/text_sources.py --md`. Edit the JSON, not this file.*", "",
           plan["about"], "",
           f"Reviewed {plan['reviewed']}. Families are taken in this order: "
           + ", ".join(fam[f] for f in plan["order"]) + ".", "",
           "## Rights labels", ""]
    out += [f"- **{k}**: {v}" for k, v in plan["rights"].items()]
    out += ["", "## Summary", "", "| # | Gap | Now | Printable leads | Blocked on |", "|---|---|---|---|---|"]
    for g in plan["gaps"]:
        n = sum(1 for s in g["sources"] if s["rights"] in PRINTABLE)
        out.append(f"| {g['priority']} | [{g['id']}](#{g['id']}) | {g['now']} | {n} | {'; '.join(g['blockers']) or 'nothing'} |")
    current = None
    for g in plan["gaps"]:
        if g["family"] != current:
            current = g["family"]
            out += ["", f"## {fam[current]}"]
        out += ["", f"### {g['priority']}. {g['id']}", "",
                f"Catalog: {', '.join('`' + c + '`' for c in g['catalog'])} · rite `{g['rite']}` · {g['service']} · now **{g['now']}**", "",
                "Missing: " + "; ".join(g["missing"]) + ".", "", g["plan"], ""]
        if g["sources"]:
            out += ["| Source | Year | Lang | Fills | Rights |", "|---|---|---|---|---|"]
            for s in g["sources"]:
                t = s["title"] + (f" — {s['note']}" if s.get("note") else "")
                out.append(f"| {t} ({link(s)}) | {s.get('year', '')} | {s['lang']} | {'; '.join(s['fills'])} | {s['rights']} |")
        if g["blockers"]:
            out += ["", "Blocked: " + "; ".join(g["blockers"]) + "."]
    return "\n".join(out).replace("|  |", "| |") + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--audit", action="store_true")
    ap.add_argument("--md", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    plan = load()
    errors = validate(plan)
    for e in errors:
        print("ERROR", e)
    if errors:
        return 1
    print(f"{len(plan['gaps'])} gaps, {sum(len(g['sources']) for g in plan['gaps'])} source entries: schema ok.")
    if a.md:
        text = render(plan)
        if a.check:
            if not DOC.exists() or DOC.read_text(encoding="utf-8") != text:
                print("docs/text-sources.md is stale: run tools/text_sources.py --md")
                return 1
        else:
            DOC.write_text(text, encoding="utf-8")
            print(f"wrote {DOC.relative_to(ROOT)}")
    if a.audit:
        return 1 if audit(plan) else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
