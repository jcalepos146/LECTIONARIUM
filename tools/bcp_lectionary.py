#!/usr/bin/env python3
"""Pack the sourced 1979 lectionary citations. No network or PDF tools needed.

The readable input retains the PDF page of every row and transcription corrections.
See docs/lectionaries.md for edition limits. Run with --check in CI.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/texts/bcp1979-lectionary.json'
OUT = ROOT / 'data/bcp1979-lectionary.json'


def build():
    data = json.loads(SOURCE.read_text())
    assert set(data['sunday']) == set('ABC')
    assert set(data['office']) == {'1', '2'}
    for year, rows in data['sunday'].items():
        assert all(f'Proper {n}' in rows for n in range(1, 30)), year
        assert 'Easter Day' in rows and 'Pentecost' in rows
    for group in ('sunday', 'office', 'special'):
        for year, rows in data[group].items():
            for key, row in rows.items():
                assert row['page'] > 0 and row['readings'], (group, year, key)
                for ref in row['readings']:
                    assert re.fullmatch(r'(?:[1-3] )?[A-Za-z]+ \d[\d:;,\-]*', ref), (group, year, key, ref)
    return json.dumps(data, ensure_ascii=False, separators=(',', ':'))


if __name__ == '__main__':
    result = build()
    if '--check' in sys.argv:
        assert OUT.read_text() == result, 'run python3 tools/bcp_lectionary.py'
        print('1979 lectionary citations current')
    else:
        OUT.write_text(result)
        print('wrote', OUT.relative_to(ROOT))
