"""propers.json -> propers-1962.json and propers-pre55.json, each {map: key -> index, data: [unique mass]}."""
import json
P = json.load(open("propers.json"))
for form in ("1962", "pre55"):
    data, idx, mp = [], {}, {}
    for k, v in P.items():
        if not k.startswith(form + "|"): continue
        s = json.dumps(v, ensure_ascii=False, sort_keys=True)
        if s not in idx: idx[s] = len(data); data.append(v)
        mp[k] = idx[s]
    json.dump({"map": mp, "data": data}, open(f"propers-{form}.json", "w"), ensure_ascii=False, separators=(",", ":"))
    print(form, len(mp), "keys", len(data), "unique")
