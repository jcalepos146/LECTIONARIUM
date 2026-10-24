#!/usr/bin/env python3
"""Turn a Society of Archbishop Justus service page (justus.anglican.org/resources/bcp/...) into the order
markup of tools/orders.py. Italic runs are rubrics; roman runs are spoken; centred capitals are headings.
Marginal notes (grey text in the side column) and page images are dropped. The spelling is kept as printed.

    python3 tools/justus.py PAGE.htm [--steps steps.json]   # print the order markup
"""
import html
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

PEOPLE = re.compile(r"^(Amen|And with thy spirit|And with thy spirite|And with thy sprete|Glory be to thee,? O Lord|Thanks be to thee,? O Lord|"
                    r"Lord,? have mercy upon us|Lord,? have mercie upon us|Christ,? have mercy upon us|Christe,? have mercy upon us|"
                    r"It is meet and right so to do|It is mete and right so to do|It is meete and right so to do|"
                    r"We lift them up unto the Lord|We lifte them up unto the Lorde|Praise be to thee,? O Christ|"
                    r"Glory be to thee, O Lord)[.,]?\s*(Amen\.?)?$", re.I)


class Runs(HTMLParser):
    """Paragraphs as lists of (text, italic, grey, centred)."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.paras, self.cur, self.ital, self.grey, self.center, self.skip = [], [], 0, 0, False, 0
        self.fonts = []

    def flush(self):
        t = [(re.sub(r"\s+", " ", x), i, g, c) for x, i, g, c in self.cur]
        if any(x.strip() for x, *_ in t):
            self.paras.append(t)
        self.cur = []

    def handle_starttag(self, tag, a):
        a = dict(a)
        if tag in ("script", "style", "title"):
            self.skip += 1
        if tag == "br":
            self.cur.append(("\ue000", bool(self.ital), bool(self.grey), self.center))
        if tag in ("p", "tr", "table", "h1", "h2", "h3", "hr"):
            self.flush()
            if tag == "p":
                self.center = (a.get("align", "").lower() == "center")
        if tag in ("i", "em"):
            self.ital += 1
        if tag == "center":
            self.flush(); self.center = True
        if tag == "font":
            col = (a.get("color") or "").lower()
            self.fonts.append(col == "#999999" or col == "#808080")
            self.grey += self.fonts[-1]
        if tag == "td" and a.get("width") == "150":
            self.flush(); self.grey += 1; self.fonts.append("td")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "title"):
            self.skip = max(0, self.skip - 1)
        if tag in ("p", "tr", "table", "td", "center"):
            self.flush()
            if tag in ("p", "center"):
                self.center = False
        if tag in ("i", "em"):
            self.ital = max(0, self.ital - 1)
        if tag == "font" and self.fonts:
            f = self.fonts.pop()
            if f is True:
                self.grey -= 1
        if tag == "td" and self.fonts and self.fonts[-1] == "td":
            self.fonts.pop(); self.grey -= 1; self.flush()

    def handle_data(self, d):
        if self.skip:
            return
        self.cur.append((d.replace("\xa0", " "), bool(self.ital), bool(self.grey), self.center))


def clean(t):
    t = html.unescape(t).replace("\xa0", " ").replace("\ue000", " ").replace("\ue001", " ")
    t = t.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", t).strip()


def convert(path, encoding="latin-1"):
    s = pathlib.Path(path).read_text(encoding=encoding, errors="replace")
    p = Runs(); p.feed(s); p.flush()
    out = []
    for para in p.paras:
        if all(g for _, _, g, _ in para):
            continue
        para = [r for r in para if not r[2]]
        # one paragraph is one item unless it really mixes a rubric with spoken text
        tot = sum(len(re.sub(r"\W", "", x)) for x, *_ in para) or 1
        ital = sum(len(re.sub(r"\W", "", x)) for x, i, *_ in para if i)
        cen = any(c for *_, c in para)
        if ital / tot >= 0.55 or ital / tot <= 0.25:
            raw = "".join(x for x, *_ in para)
            raw = re.sub(r"([.:;?!][\"')\]]?)\s*\ue000\s*(?=(?:Minister|People|Priest|Answer|[A-Z\"'\[(]))(?!(?:[IVXLC]+\.|St\.|Cor|Gal|Tim|Heb|Rom|Matt|Luke|John|Mark|Prov|Psalm|Tobit))", lambda m: m.group(1) + "\ue001", raw)
            for frag in raw.replace("\ue000", " ").split("\ue001"):
                x = clean(frag)
                x = re.sub(r"^¶\s*", "", x).strip()
                if x:
                    out.append(("rub" if ital / tot >= 0.55 else ("head" if cen and x.upper() == x and len(x) < 90 else "say"), x))
            continue
        groups = []
        for x, i, g, c in para:
            if groups and groups[-1][1] == i:
                groups[-1][0] += x
            else:
                groups.append([x, i, c])
        for x, i, c in groups:
            x = clean(x)
            x = re.sub(r"^¶\s*", "", x).strip()
            if not x or x in ("¶",):
                continue
            out.append(("rub" if i else "say", x))
    return out


ROLE = re.compile(r"^(?:The )?(Minister|People|Priest|Answer|Aunswere|Clerkes?|Clearkes?|Clerks?|Choir|Deacon|Bishop)\.?$", re.I)
LABEL = {"minister": "Minister", "people": "People", "answer": "Answer", "aunswere": "Answer", "priest": "Priest", "clerke": "Choir",
         "clerkes": "Choir", "clearkes": "Choir", "clerks": "Choir", "clerk": "Choir", "choir": "Choir", "deacon": "Deacon", "bishop": "Bishop"}
CITE = re.compile(r"^[.,\s]*((?:[ivxlc]+|\d+)\.(?:\s*[\d,\- ]+\.?)?)\s*(.*)$", re.I)
BOOKABB = re.compile(r"^(?:St\.? ?)?(?:[1-3] ?)?(?:Matt|Mat|Math|Mar|Mark|Luke|Luc|John|Joh|Acts|Rom|Roma|Cor|Corin|Gal|Gala|Ephes|Eph|Phil|Col|Thes|Tim|Tit|Heb|Jas|James|Pet|Peter|Rev|Prov|Psalm|Tobit|Deut|Eccl|Ecclus|Isa|Jer|Ezek|Dan|Hos|Joel|Amos|Mic|Zech|Mal|Wisd|Gen|Exod|Lev|Num|Josh|Sam|Kings|Chron|Job)\.?$", re.I)


def tidy(items):
    """Join fragments the page layout split, attach citations to their sentences and label speakers."""
    # 1. drop page furniture
    start = next((n for n, (k, t) in enumerate(items) if re.search(r"Book of Common Prayer", t) and n > 0 and items[n - 1][1] in ("World", "Canada")), -1)
    items = items[start + 1:] if start >= 0 else items
    stop = next((n for n, (k, t) in enumerate(items) if t.startswith("Return to") or t.startswith("Web author")), len(items))
    items = items[:stop]
    # 2. merge continuations
    out = []
    for k, t in items:
        if out:
            pk, pt = out[-1]
            cont = (t[:1] in ",.;:]) " or t[:1].islower()) and not CITE.match(t) and not (k == "say" and pk == "rub" and BOOKABB.match(pt.rstrip(".")))
            if k == pk and cont and (pk == "rub" and not pt.rstrip().endswith((".", ":", "?", "!")) or pk == "say" and not pt.rstrip().endswith((".", ":", "?", "!", "Amen"))):
                out[-1] = (pk, (pt + (" " if t[:1] not in ",.;:]" else "") + t).strip()); continue
            if k == "head" and pk == "head" and not pt.rstrip().endswith("."):
                out[-1] = (pk, pt + " " + t); continue
        out.append((k, t))
    # 3. citations and speakers
    res, role = [], None
    for k, t in out:
        if k == "rub" and BOOKABB.match(t.rstrip(".")) and res:
            res.append(("cite", t)); continue
        if k == "say" and res and res[-1][0] == "cite":
            cite = res.pop()[1].rstrip(".")
            m = CITE.match(t)
            if m:
                ref, rest = m.group(1).strip(), m.group(2).strip()
                for n in range(len(res) - 1, -1, -1):
                    if res[n][0] == "say":
                        c = cite if re.search(r"\b(John|Luke|Mark|Psalm|Tobit|James|Acts|Jude|Peter|Titus|Joel|Amos|Job|Rom|Mat|Matt|Gal|Heb|Cor|Tim|Prov|Eph|Phil|Col)$", cite, re.I) and not re.search(r"\b(John|Luke|Mark|Psalm|Tobit|James|Acts|Jude|Peter|Titus|Joel|Amos|Job)$", cite, re.I) else cite
                        sp = " " if re.search(r"\b(John|Luke|Mark|Psalm|Tobit|James|Acts|Jude|Peter|Titus|Joel|Amos|Job)$", cite, re.I) else ". "
                        prev = re.sub(r"\s+([123])$", "", res[n][1]); num = re.search(r"\s([123])$", res[n][1])
                        res[n] = ("say", f"{prev} [{(num.group(1) + ' ') if num else ''}{c}{sp}{ref}]"); break
                if rest:
                    res.append(("say", rest))
                continue
            res.append(("rub", cite)); res.append((k, t)); continue
        if k == "rub" and re.fullmatch(r"Amen\.?", t.strip()):
            res.append(("say", "- Amen.")); continue
        if k == "rub" and ROLE.match(t.strip()):
            role = LABEL[re.sub(r"^the ", "", t.strip().rstrip(".").lower())]; continue
        if k == "say" and role:
            res.append(("say", f"{role}. {t.lstrip('. ').strip()}")); role = None; continue
        res.append((k, t))
    final = []
    for k, t in res:
        if k == "cite":
            continue
        m = re.match(r"^(.{20,}?)\s+Amen\.?$", t) if k == "say" else None
        if m and not re.match(r"^(OUR Father|Our Father|GLORY be|Glory be|THEREFORE|Therefore|\w+\. )", t):
            final += [(k, m.group(1)), ("say", "- Amen.")]
        else:
            final.append((k, t))
    return final


def markup(items):
    lines = []
    for k, t in items:
        if k == "rub":
            lines.append("¶ " + t)
        elif k == "head":
            lines.append("## " + t.title() if t.isupper() else "## " + t)
        else:
            lines.append(("- " if PEOPLE.match(t) else "") + t)
    return lines


if __name__ == "__main__":
    print("\n".join(markup(tidy(convert(sys.argv[1])))))
