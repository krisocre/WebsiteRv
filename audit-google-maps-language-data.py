"""Independent checks using enumerated integer ticks, not the builder formula."""
from pathlib import Path
from collections import Counter
from itertools import combinations
import json,csv,re,hashlib
ROOT=Path(__file__).resolve().parent
I=json.loads((ROOT/'google-maps-language-source-values.json').read_text(encoding='utf-8'))
D=json.loads((ROOT/'google-maps-language-study.json').read_text(encoding='utf-8'))
assert len(I['rows'])==len(D['estimates'])==52
lookup={(r['period'],r['language']):r for r in I['rows']}
assert len(lookup)==52 and all(0<=r['ci_low_percent']<=r['accuracy_percent']<=r['ci_high_percent']<=100 for r in I['rows'])
for p in ['2024H2','2025H1']:assert len([r for r in I['rows'] if r['period']==p])==26
assert [lookup[p,'English']['accuracy_percent'] for p in ['2024H2','2025H1']]==[86,93]
assert [lookup[p,'French']['accuracy_percent'] for p in ['2024H2','2025H1']]==[93,88]
def relation(a,b):
    ta=set(range(a['ci_low_percent'],a['ci_high_percent']+1));tb=set(range(b['ci_low_percent'],b['ci_high_percent']+1));intersection=ta&tb
    if not intersection:return 'separated'
    return 'touching' if len(intersection)==1 else 'overlapping'
for r in D['changes']:
    a,b=lookup['2024H2',r['language']],lookup['2025H1',r['language']]
    assert r['point_change_pp']==b['accuracy_percent']-a['accuracy_percent']
    assert r['reported_interval_relation']==relation(a,b)
assert Counter(r['point_direction'] for r in D['changes'])=={'lower':23,'higher':1,'unchanged':2}
assert Counter(r['reported_interval_relation'] for r in D['changes'])=={'overlapping':24,'touching':2}
assert len(D['within_period_pairs'])==650
seen=set()
for r in D['within_period_pairs']:
    key=(r['period'],r['language_a'],r['language_b']);assert key not in seen;seen.add(key)
    a,b=lookup[r['period'],r['language_a']],lookup[r['period'],r['language_b']]
    assert r['reported_interval_relation']==relation(a,b)
    assert r['point_gap_a_minus_b_pp']==a['accuracy_percent']-b['accuracy_percent']
    if relation(a,b)=='separated':assert r['separation_gap_pp']==min(abs(x-y) for x in range(a['ci_low_percent'],a['ci_high_percent']+1) for y in range(b['ci_low_percent'],b['ci_high_percent']+1))
assert len(seen)==2*len(list(combinations(range(26),2)))
for r in D['illustrative_binary_examples']:
    tp,tn,fp,fn=(r[k] for k in ['true_positive','true_negative','false_positive','false_negative'])
    assert tp+tn+fp+fn==100 and tp+tn==90 and tp+fn==tn+fp==50
    assert r['record_type']=='constructed_example_not_google_data'
assert [r['false_positive']/(r['true_positive']+r['false_positive']) for r in D['illustrative_binary_examples']]==[0,1/6]
for name,rows in [('estimates',D['estimates']),('changes',D['changes']),('pairs',D['within_period_pairs'])]:
    records=list(csv.DictReader((ROOT/('google-maps-language-'+name+'.csv')).open(encoding='utf-8',newline='')))
    assert len(records)==len(rows)
    for a,b in zip(records,rows):assert a=={k:str(v) for k,v in b.items()}
    meta=json.loads((ROOT/('google-maps-language-'+name+'.csv-metadata.json')).read_text(encoding='utf-8'))
    assert [c['name'] for c in meta['tableSchema']['columns']]==list(rows[0])
captures=0
for source in I['sources']:
    folder=ROOT/'research-sources'/'maps-language-2026-11-02';textfile=folder/(source['period']+'.txt');pdffile=folder/(source['period']+'.pdf')
    if not textfile.exists():continue
    assert hashlib.sha256(textfile.read_text(encoding='utf-8').encode('utf-8')).hexdigest()==source['text_sha256']
    assert hashlib.sha256(pdffile.read_bytes()).hexdigest()==source['pdf_sha256']
    table=textfile.read_text(encoding='utf-8').split('Table 3.2.3:')[1].split('3.2.4')[0]
    for r in I['rows']:
        if r['period']!=source['period']:continue
        pattern=rf"\b{r['language']}\s+{r['accuracy_percent']}%\s*\({r['ci_low_percent']}%\s*[-–]\s*{r['ci_high_percent']}%\)"
        assert re.search(pattern,table),r
    captures+=1
print(f'PASS: 52 source estimates, 26 temporal comparisons, 650 unique within-period pairs, interval enumeration, CSVW/JSON/CSV parity and {captures}/2 local source fingerprints.')
