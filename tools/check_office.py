"""Validate packed Office data and optionally prove preservation against a baseline.
python3 tools/check_office.py PATH [--baseline OLD_PATH] [--chant-through YYYY-MM-DD]
Checks the real shard references, complete day/hour coverage and rendered cell text.
"""
import argparse,datetime,json,pathlib
HOURS=['Matutinum','Laudes','Prima','Tertia','Sexta','Nona','Vespera','Completorium']

def load(path):
    p=pathlib.Path(path);m=json.loads((p/'manifest.json').read_text())
    def table(prefix):
        out=[]
        for i,(start,size) in enumerate(m['lines' if prefix=='l' else 'rows']):
            j=json.loads((p/f'{prefix}-{i:03d}.json').read_text())
            assert start==len(out)==j['start'] and size==len(j['v']), (path,prefix,i)
            out.extend(j['v'])
        return out
    lines=table('l');rows=table('r')
    for cells in rows:
        assert len(cells)==2 and all(isinstance(i,int) and 0<=i<len(lines) for c in cells for i in c)
    days={}
    for year in m['years']:
        days.update(json.loads((p/f'y-{year}.json').read_text()))
    for iso,day in days.items():
        assert all(h in day and day[h][1] for h in HOURS), (iso,'missing text hour')
        for h,(title,indices) in day.items():
            assert isinstance(title,str) and indices and all(0<=i<len(rows) for i in indices),(iso,h)
    return m,lines,rows,days

def easter(year):
    a=year%19;b=year//100;c=year%100;d=b//4;e=b%4;f=(b+8)//25;g=(b-f+1)//3
    h=(19*a+b-d-g+15)%30;i=c//4;k=c%4;l=(32+2*e+2*i-h-k)%7;m=(a+11*h+22*l)//451
    return datetime.date(year,(h+l-7*m+114)//31,(h+l-7*m+114)%31+1)


def main():
    ap=argparse.ArgumentParser();ap.add_argument('path');ap.add_argument('--baseline');ap.add_argument('--chant-through');a=ap.parse_args()
    m,lines,rows,days=load(a.path)
    if a.baseline:
        _,old_lines,old_rows,old_days=load(a.baseline)
        def cells(indices,rr,ll):
            return [[tuple(ll[k] for k in cell) for cell in rr[i]] for i in indices]
        for iso,day in old_days.items():
            assert iso in days,('lost date',iso)
            for hour,(title,indices) in day.items():
                t,ii=days[iso][hour]
                assert title==t and cells(indices,old_rows,old_lines)==cells(ii,rows,lines),('changed existing hour',iso,hour)
        print('Preserved every original title, text cell and chant cell for',len(old_days),'days')
    if a.chant_through:
        start=datetime.date.fromisoformat(min(days));end=datetime.date.fromisoformat(a.chant_through)
        unnotated=0
        for offset in range((end-start).days+1):
            iso=(start+datetime.timedelta(days=offset)).isoformat()
            for h in HOURS[1:]:
                assert 'c:'+h in days[iso] and days[iso]['c:'+h][1],('missing chant hour',iso,h)
                noted=any('class=gch' in lines[k] for i in days[iso]['c:'+h][1] for k in rows[i][0])
                # The existing source omits GABC engraving for these 15 little-hour
                # records each Triduum. Keep requiring the complete hour records.
                unnotated_little_hour=(datetime.date.fromisoformat(iso)-easter(int(iso[:4]))).days in [-3,-2,-1] and h in ['Prima','Tertia','Sexta','Nona','Completorium']
                assert noted or unnotated_little_hour,('unexpected missing notation',iso,h)
                unnotated+=int(not noted)
        print('All seven chant-mode hours present through',end,';',unnotated,'Triduum little-hour records have no GABC blocks, matching the source')
    print(len(days),'valid days;',len(lines),'lines;',len(rows),'rows')
if __name__=='__main__':main()
