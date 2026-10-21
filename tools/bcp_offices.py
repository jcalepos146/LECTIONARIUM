"""Morning and Evening Prayer and the Sunday collects of the 1662 Book of Common Prayer, from the uploaded EPUB.
Only the public-domain Prayer Book text is used (not the edition's introduction or notes). The state prayers for the
Sovereign and the Royal Family are left out, as a Catholic office would replace them.
python3 -I bcp_offices.py <epub> <out.json>"""
import zipfile, re, html, sys, json

z = zipfile.ZipFile(sys.argv[1])
def paras(name):
    s = z.read(name).decode("utf8")
    out = []
    for tag, cls, b in re.findall(r'<(p|h\d) class="([^"]+)"[^>]*>(.*?)</\1>', s, re.S):
        b = re.sub(r'<span epub:type="pagebreak"[^>]*/>', "", b)
        b = re.sub(r'<span class="dropcaps">(\w)</span>', r"\1", b)
        t = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", b))).strip()
        out.append((cls, t))
    return out

def sentence_case(t):
    # the first word of a prayer is printed in capitals (OUR Father, ALMIGHTY God)
    return re.sub(r"^(O |LORD )?([A-Z][A-Z’']+)\b", lambda m: (m.group(1) or "").replace("LORD ", "Lord ") + (m.group(2).capitalize() if len(m.group(2)) > 1 else m.group(2)), t)

ALL = re.compile(r"^(Almighty and most merciful Father, We have erred|Our Father which art|I believe in God|Glory be to the Father|As it was in the beginning|Lord, have mercy upon us|Christ, have mercy upon us)")

def office(chapter, evening):
    P = paras(chapter)
    steps, cur = [], None
    def new(t, slot=None):
        nonlocal cur
        cur = {"t": t, "items": []}
        if slot: cur["slot"] = slot
        steps.append(cur)
    canticle = False; skip = False
    for cls, t in P:
        if cls in ("chapter", "chapter2") and re.match(r"^(THE ORDER FOR|MORNING PRAYER|EVENING PRAYER|DAILY THROUGHOUT)", t): continue
        if re.match(r"^Here endeth", t): break
        if re.match(r"^At the beginning of", t): new("Opening sentences"); cur["items"].append(["rub", t, ""]); continue
        if re.match(r"^DEARLY beloved", t): new("Exhortation")
        if re.match(r"^A general Confession", t): new("General Confession")
        if re.match(r"^The Absolution", t): new("Absolution")
        if re.match(r"^If no priest be present", t): cur["items"].append(["rub", t, ""]); continue
        if re.match(r"^Then the Minister shall kneel, and say the Lord", t): new("The Lord's Prayer")
        if re.match(r"^Then likewise he shall say", t): new("Preces")
        if re.match(r"^Then shall be said or sung this Psalm following", t): new("Venite")
        if re.match(r"^Then shall follow the Psalms in order|^Then shall be said or sung the Psalms in order", t):
            new("The Psalms", "psalms"); cur["items"].append(["rub", t, ""])
            if evening:   # in Evening Prayer the same rubric also introduces the first lesson
                new("First Lesson", "lesson1"); cur["items"].append(["rub", "Then a Lesson of the Old Testament, as is appointed.", ""])
            continue
        if re.match(r"^Then shall be read distinctly with an audible voice the First Lesson", t): new("First Lesson", "lesson1")
        if re.match(r"^Then shall be read in like manner the Second Lesson|^Then a Lesson of the New Testament", t): new("Second Lesson", "lesson2")
        if cls in ("head", "head1", "chapter") and re.match(r"^(TE DEUM|BENEDICTUS|MAGNIFICAT|NUNC DIMITTIS)", t):
            new({"TE": "Te Deum", "BE": "Benedictus", "MA": "Magnificat", "NU": "Nunc dimittis"}[t[:2]])
        if re.match(r"^Then shall be (sung or said|said or sung) the Apostles", t): new("Apostles' Creed")
        if re.match(r"^And after that these Prayers following", t): new("Lesser Litany and the Lord's Prayer")
        if re.match(r"^Then the Priest standing up shall say", t): new("Suffrages")
        if re.match(r"^Then shall follow three Collects", t): new("Collects", "collect")
        if re.match(r"^A Prayer for the Queen|^A Prayer for the Royal Family", t):
            skip = True; continue
        if re.match(r"^A Prayer for the Clergy|^A Prayer of Saint Chrysostom|^2 Corinthians 13|^In Quires and Places|^Then these five Prayers", t):
            skip = False
            if re.match(r"^A Prayer for the Clergy", t): new("Prayers"); cur["items"].append(["rub", "The 1662 book here prays for the Sovereign and the Royal Family; a Catholic office uses its own intercessions.", ""])
            if re.match(r"^2 Corinthians 13", t): new("The Grace")
        if skip or cur is None: continue
        if re.match(r"^S\. Luke|^Psalm \d+$", t) and cls == "subhead": cur["items"].append(["cite", t, ""]); continue
        if cls == "right0": cur["items"].append(["cite", t, ""]); continue
        if cls in ("nonindent02", "section", "section0", "section1") or re.match(r"^(Or this|Or else this)", t):
            cur["items"].append(["rub", t, ""]); continue
        if cls in ("head", "head1", "chapter", "subhead"):
            cur["items"].append(["h", t.title() if t.isupper() else t, ""]); continue
        m = re.match(r"^(Answer|Priest|Minister)\.\s*(.*)$", t)
        if m:
            cur["items"].append(["v", sentence_case(m.group(2)), "ppl" if m.group(1) == "Answer" else "cel", "℟." if m.group(1) == "Answer" else "℣."]); continue
        text = sentence_case(t)
        title = cur["t"]
        role = ("all" if (ALL.match(text) or title in ("General Confession", "Venite", "Te Deum", "Benedictus", "Magnificat", "Nunc dimittis", "Apostles' Creed", "The Lord's Prayer"))
                else "lec" if title in ("First Lesson", "Second Lesson") else "cel")
        if text == "Amen.": role = "ppl"
        cur["items"].append(["v", text, role])
    return [s for s in steps if s["items"] or s.get("slot")]

def collects():
    out, name = {}, None
    names = sorted(n for n in z.namelist() if "chapter016" in n and not n.endswith("fn.xhtml"))
    P = sum((paras(n) for n in names), [])
    want = False
    for cls, t in P:
        if cls in ("head", "head1", "chapter") and not re.match(r"^(THE$|COLLECTS|TO BE USED)", t):
            t = re.sub(r"\*$", "", t).strip()
            if re.match(r"^OR THE (THIRD|SECOND|NEXT) SUNDAY BEFORE LENT", t): name = {"THIRD": "SEPTUAGESIMA", "SECOND": "SEXAGESIMA", "NEXT": "QUINQUAGESIMA"}[t.split()[2]]; continue
            if t.startswith("OR THE MANIFESTATION"): name = "THE EPIPHANY"; continue
            if name and re.match(r"^(OR |COMMONLY CALLED)", t): continue
            name = t; continue
        if cls == "section1" and t == "THE COLLECT": want = True; continue
        if want and name and cls.startswith("nonindent") and cls != "nonindent02":
            out[name] = sentence_case(t); want = False
    return out

res = {"mattins": office("OEBPS/xhtml/17_chapter011.xhtml", False), "evensong": office("OEBPS/xhtml/18_chapter012.xhtml", True), "collects": collects()}
json.dump(res, open(sys.argv[2], "w"), ensure_ascii=False, separators=(",", ":"))
for k in ("mattins", "evensong"): print(k, [(s["t"], len(s["items"])) for s in res[k]])
print(len(res["collects"]), "collects"); print(list(res["collects"])[:40])
