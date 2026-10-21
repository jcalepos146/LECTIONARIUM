#!/usr/bin/env python3
"""Pack the one-file-per-book Bible JSON into a few shards per translation.

    python3 tools/shard_bible.py           # pack bible/<tr>/<Book>.json into bible/<tr>/s<N>.json
    python3 tools/shard_bible.py --check   # verify the shards and the index in src/today.js agree

Each shard is {"Book": [[verse, ...], ...], ...}, holding consecutive books in file
order until about TARGET bytes. The book -> shard index is written into
src/today.js between the BIBLE-SHARDS markers so the page needs no extra fetch.
The site counts every project file against its 512-file limit; this keeps
the Bible to a few dozen files instead of one per book.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BIBLE = ROOT / "bible"
TODAY = ROOT / "src" / "today.js"
TARGET = 400_000
MARK = re.compile(r"/\*BIBLE-SHARDS\*/.*?/\*END-BIBLE-SHARDS\*/", re.S)


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, separators=(",", ":"))


def pack():
    index = {}
    for tr in sorted(p.name for p in BIBLE.iterdir() if p.is_dir()):
        books = sorted(p for p in (BIBLE / tr).glob("*.json") if not re.fullmatch(r"s\d+", p.stem))
        if not books:
            continue
        shards, cur, size = [], {}, 0
        for p in books:
            data = json.loads(p.read_text(encoding="utf-8"))
            n = len(dump(data).encode())
            if cur and size + n > TARGET:
                shards.append(cur); cur, size = {}, 0
            cur[p.stem] = data; size += n
        if cur:
            shards.append(cur)
        index[tr] = {}
        for i, s in enumerate(shards):
            (BIBLE / tr / f"s{i}.json").write_text(dump(s), encoding="utf-8")
            for b in s:
                index[tr][b] = i
        for p in books:
            p.unlink()
        print(f"{tr}: {len(books)} books -> {len(shards)} shards")
    src = TODAY.read_text(encoding="utf-8")
    src = MARK.sub(lambda m: "/*BIBLE-SHARDS*/" + dump(index) + "/*END-BIBLE-SHARDS*/", src, count=1)
    TODAY.write_text(src, encoding="utf-8")


def check():
    m = MARK.search(TODAY.read_text(encoding="utf-8"))
    if not m:
        print("no BIBLE-SHARDS index in src/today.js"); return 1
    index = json.loads(m.group(0)[len("/*BIBLE-SHARDS*/"):-len("/*END-BIBLE-SHARDS*/")])
    bad = 0
    for tr, books in index.items():
        found = {}
        for p in (BIBLE / tr).glob("s*.json"):
            for b in json.loads(p.read_text(encoding="utf-8")):
                found[b] = int(p.stem[1:])
        if found != books:
            bad += 1; print(f"{tr}: index and shards disagree")
    print("bible shards ok" if not bad else "bible shards BAD")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(check() if "--check" in sys.argv else pack())
