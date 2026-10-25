#!/usr/bin/env python3
"""Validate and pack citation-only Coptic Orthodox calendar appointments.

Regeneration from the pinned upstream is documented in docs/lectionaries.md.
Normal builds and --check are offline and require only Python and the bundled Bible.
"""
import argparse
import datetime as dt
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/texts/coptic-lectionary.json'
OUT = ROOT / 'data/coptic-lectionary.json'
FIRST, LAST = '2025-11-30', '2030-11-30'
BOOKS = ('Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr '
         'Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos '
         'Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom '
         '1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas '
         '1Pet 2Pet 1John 2John 3John Jude Rev Bar Tob Jdt 1Macc 2Macc Wis Sir').split()
# Preserve unresolved upstream citations, but never silently print a truncated text.
ISSUES = {
    'Eph 2:1-23': 'The upstream citation ends at verse 23; this chapter has 22 verses. Check your church calendar.',
    'Ps 101:1,9': 'Verse 9 does not exist in Psalm 101 in the stated English numbering. Check the Psalm and verse numbering in your church calendar.',
    'Ezek 21:33-37': 'This citation uses a different chapter division from the bundled Bibles. Check your church calendar; no verse mapping is assumed.',
}
# These chapters are not complete in the bundled KJV Apocrypha. Explicitly use
# Douay-Rheims rather than letting the reader print only the verses it can find.
DOUAY = {'Sir 8:1-22', 'Dan 14:1-42'}


def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':'))


def dates():
    first, last = map(dt.date.fromisoformat, (FIRST, LAST))
    return [(first + dt.timedelta(days=i)).isoformat() for i in range((last-first).days+1)]


def import_export(path):
    raw = json.loads(path.read_text())
    assert list(raw) == dates(), 'export must cover every supported date exactly once'
    templates, index, days = [], {}, {}
    for day, value in raw.items():
        sections = {}
        for section in value['sections']:
            sid = str(section['id'])
            assert sid not in sections and 1 <= int(sid) <= 14
            rows = []
            for reading in section['readings']:
                rid = reading['id']
                assert rid in (1, 2, 3, 4, 5, 7, 8)
                # Keep one reading, with its sequence of passages intact.
                refs = []
                for ref in reading['refs']:
                    book = BOOKS[ref['book']-1]
                    book = re.sub(r'^([123])', r'\1 ', book)
                    refs.append(book + ' ' + ref['cite'])
                assert refs, (day, sid, rid)
                rows.append([rid, refs])
            assert rows, (day, sid)
            sections[sid] = rows
        key = dump(sections)
        if key not in index:
            index[key] = len(templates)
            templates.append(sections)
        days[day] = index[key]
    result = {
        'source': {
            'title': 'Coptic Orthodox Katameros · citation-only calendar snapshot',
            'repository': 'https://github.com/pierresaid/katameros-api',
            'commit': '62094eb045f067f6082edfc230a993c3d3e64668',
            'license': 'MIT · Copyright (c) 2022 katameros · tools/texts/katameros-LICENSE.txt',
            'verifiedAgainst': 'https://copticchurch.net/readings?g_day=12&g_month=04&g_year=2026',
            'first': FIRST, 'last': LAST,
            'note': 'Appointments only. No Bible translation, prayer text or Synaxarium text is imported. The snapshot follows this upstream implementation; local church exceptions take precedence.',
        },
        'issues': ISSUES, 'douay': sorted(DOUAY), 'days': days, 'tables': templates,
    }
    SOURCE.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n')


def valid_ref(cite, bible):
    book, rest = re.fullmatch(r'((?:[123] )?[A-Za-z]+) ([\d:;,\-]+)', cite).groups()
    chapters = bible[book.replace(' ', '')]
    chapter = None
    for segment in re.split('[;,]', rest):
        match = re.fullmatch(r'(?:(\d+):)?(\d+)(?:-(?:(\d+):)?(\d+))?', segment)
        assert match, cite
        c, v, ec, ev = match.groups()
        chapter = int(c) if c else chapter
        assert chapter is not None, cite
        end = int(ec) if ec else chapter
        v, ev = int(v), int(ev or v)
        assert 1 <= chapter <= end <= len(chapters), cite
        assert 1 <= v <= len(chapters[chapter-1]), cite
        assert 1 <= ev <= len(chapters[end-1]), cite
        assert end > chapter or ev >= v, cite
        chapter = end


def build():
    data = json.loads(SOURCE.read_text())
    assert list(data['days']) == dates()
    assert data['issues'] == ISSUES and set(data['douay']) == DOUAY
    bibles = {}
    for translation in ('kj', 'dr'):
        books = {}
        for path in (ROOT/'bible'/translation).glob('s*.json'):
            books.update(json.loads(path.read_text()))
        bibles[translation] = books
    refs = set()
    for table in data['tables']:
        for sid, rows in table.items():
            assert 1 <= int(sid) <= 14
            for rid, passages in rows:
                assert rid in (1, 2, 3, 4, 5, 7, 8) and passages
                for cite in passages:
                    refs.add(cite)
                    if cite not in ISSUES:
                        valid_ref(cite, bibles['dr' if cite in DOUAY else 'kj'])
    assert set(ISSUES) <= refs and DOUAY <= refs
    assert set(data['days'].values()) == set(range(len(data['tables'])))
    return dump(data)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--from-export', type=pathlib.Path)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    assert not (args.check and args.from_export)
    if args.from_export:
        import_export(args.from_export)
    result = build()
    if args.check:
        assert OUT.read_text() == result, 'run python3 tools/coptic_lectionary.py'
        print('Coptic calendar citations current; 1827 dates, 3 flagged source references')
    else:
        OUT.write_text(result)
        print('wrote', OUT.relative_to(ROOT))
