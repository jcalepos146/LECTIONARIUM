"""Read-only HTTPS audit of catalog source reachability; does not certify claims.
Run after allowing the source hosts in environment settings. Save reports outside
this checkout. A reachable page still requires editorial review against each claim.
"""
import concurrent.futures, json, pathlib, sys, urllib.request
root=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((root/'data/traditions.json').read_text())
urls=sorted({u for n in rows for u in n['sources']+[b['source'] for b in n['books']]})
def check(url):
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'Lectionarium source audit (read-only)'})
        with urllib.request.urlopen(req,timeout=20) as r:
            data=r.read(2_000_000)
            return {'url':url,'status':r.status,'final_url':r.url,'bytes_read':len(data)}
    except Exception as e:return {'url':url,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool: report=list(pool.map(check,urls))
json.dump(report,sys.stdout,indent=2);print()
sys.exit(int(any('error' in x for x in report)))
