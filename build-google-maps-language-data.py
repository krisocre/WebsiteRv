"""Reproduce a historical Google Maps accuracy compilation and interval geometry.

Standard library only. Source estimates are not new reviews or removal outcomes.
"""
from pathlib import Path
from collections import Counter
from itertools import combinations
import csv,json

ROOT=Path(__file__).resolve().parent
I=json.loads((ROOT/'google-maps-language-source-values.json').read_text(encoding='utf-8'))
DATE='2026-11-02';URL='https://reviewsboost.ca/google-review-removal-language-study.html'
PERIODS=['2024H2','2025H1'];LANGUAGES=sorted({r['language'] for r in I['rows']})
assert len(I['rows'])==52 and len(LANGUAGES)==26
lookup={(r['period'],r['language']):r for r in I['rows']}

def relation(a,b):
    signed=min(a['ci_high_percent'],b['ci_high_percent'])-max(a['ci_low_percent'],b['ci_low_percent'])
    return ('overlapping' if signed>0 else 'touching' if signed==0 else 'separated'),signed

estimates=[dict(r,interval_width_pp=r['ci_high_percent']-r['ci_low_percent'],record_type='source_reported_estimate') for r in I['rows']]
changes=[]
for language in LANGUAGES:
    a,b=(lookup[p,language] for p in PERIODS);kind,width=relation(a,b);delta=b['accuracy_percent']-a['accuracy_percent']
    changes.append({'language':language,'accuracy_2024h2_percent':a['accuracy_percent'],'accuracy_2025h1_percent':b['accuracy_percent'],
      'point_change_pp':delta,'point_direction':'lower' if delta<0 else 'higher' if delta>0 else 'unchanged',
      'reported_interval_relation':kind,'signed_shared_width_pp':width,'record_type':'derived_temporal_comparison'})
pairs=[]
for period in PERIODS:
    for la,lb in combinations(LANGUAGES,2):
        a,b=lookup[period,la],lookup[period,lb];kind,width=relation(a,b)
        pairs.append({'period':period,'language_a':la,'language_b':lb,'point_gap_a_minus_b_pp':a['accuracy_percent']-b['accuracy_percent'],
          'reported_interval_relation':kind,'signed_shared_width_pp':width,'separation_gap_pp':max(0,-width),'record_type':'derived_within_period_comparison'})

def export(name,rows,descriptions):
    filename=name+'.csv';columns=list(rows[0])
    with (ROOT/filename).open('w',encoding='utf-8',newline='') as file:
        writer=csv.DictWriter(file,fieldnames=columns,lineterminator='\n');writer.writeheader();writer.writerows(rows)
    meta={'@context':'http://www.w3.org/ns/csvw','url':filename,'dc:title':name.replace('-',' '),
      'dc:description':'Historical secondary compilation and deterministic geometry of printed intervals; no individual reviews, Canadian sample or significance tests.',
      'tableSchema':{'columns':[{'name':c,'titles':c.replace('_',' '),'datatype':'integer' if isinstance(rows[0][c],int) else 'string','required':True,
        'dc:description':descriptions.get(c,c.replace('_',' '))} for c in columns]}}
    (ROOT/(filename+'-metadata.json')).write_text(json.dumps(meta,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

descriptions={'accuracy_percent':'Google-reported correct automated decisions as a percentage of evaluated contributions; not a review-removal probability.',
 'ci_low_percent':'Lower endpoint of Google-reported 95% interval, exactly as printed at whole-percentage precision.',
 'ci_high_percent':'Upper endpoint of Google-reported 95% interval, exactly as printed at whole-percentage precision.',
 'interval_width_pp':'Upper minus lower endpoint, in percentage points.',
 'printed_page':'Printed EU DSA Report page number; differs from one-based PDF page.',
 'pdf_page':'One-based PDF page for verification.',
 'point_change_pp':'2025H1 minus 2024H2 published point estimate; not an estimated causal effect.',
 'reported_interval_relation':'Closed intervals formed from printed endpoints: positive-width intersection, touching endpoint, or separated. Not a significance/equivalence test.',
 'signed_shared_width_pp':'min(upper endpoints) minus max(lower endpoints), in percentage points. Negative means separated; zero means touching at printed precision.',
 'separation_gap_pp':'If separated, distance between the two printed intervals; otherwise zero.',
 'record_type':'Distinguishes source estimates from derived comparisons; derived rows are not additional observations.'}
export('google-maps-language-estimates',estimates,descriptions)
export('google-maps-language-changes',changes,descriptions)
export('google-maps-language-pairs',pairs,descriptions)
summary={'source_language_estimates':len(estimates),'matched_languages':len(changes),'derived_within_period_comparisons':len(pairs),
 'point_change_direction':dict(Counter(r['point_direction'] for r in changes)),
 'temporal_interval_relations':dict(Counter(r['reported_interval_relation'] for r in changes)),
 'within_period_relations':{p:dict(Counter(r['reported_interval_relation'] for r in pairs if r['period']==p)) for p in PERIODS},
 'english_french':[]}
for p in PERIODS:
    a,b=lookup[p,'English'],lookup[p,'French'];kind,width=relation(a,b)
    summary['english_french'].append({'period':p,'english_accuracy_percent':a['accuracy_percent'],'french_accuracy_percent':b['accuracy_percent'],
      'english_minus_french_pp':a['accuracy_percent']-b['accuracy_percent'],'reported_interval_relation':kind,'shared_width_pp':width})
D={'version':'1.0','published':DATE,'article_url':URL,'title':'Google review removal and language: a historical accuracy-data audit',
 'license':'https://creativecommons.org/licenses/by/4.0/','source_inputs':I,'summary':summary,
 'method':'Unweighted matching by reported language. Closed-interval geometry uses printed whole-percentage endpoints. No pooling, re-estimated confidence intervals, sample-size recovery, p-values or removal probabilities.',
 'limitations':['Historical 2024H2/2025H1 matched reports; not the latest worldwide Google benchmark.',
 'EEA user contributions across content/data types; not Canadian reviews or merchant removal requests.',
 'Human evaluation is the source reference, not independently verified ground truth.',
 'Unknown sample sizes, class mixture, covariance, repeated samples and underlying unrounded endpoints.',
 'Overlapping/touching intervals do not prove no change; separated intervals are not formal significance tests here.'],
 'estimates':estimates,'changes':changes,'within_period_pairs':pairs,
 'illustrative_binary_examples':[
   {'label':'A','true_positive':40,'true_negative':50,'false_positive':0,'false_negative':10,'record_type':'constructed_example_not_google_data'},
   {'label':'B','true_positive':50,'true_negative':40,'false_positive':10,'false_negative':0,'record_type':'constructed_example_not_google_data'}]}
(ROOT/'google-maps-language-study.json').write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(ROOT/'google-maps-language-study.bib').write_text('@misc{reviewsboost2026language,\n  author = {{ReviewsBoost Editorial Team}},\n  title = {Google Review Removal and Language: A Historical Accuracy-Data Audit},\n  year = {2026},\n  month = {November},\n  howpublished = {Version 1.0; source compilation and derived interval comparisons},\n  url = {'+URL+'},\n  note = {Google source estimates; ReviewsBoost compilation and calculations. No Canadian removal probabilities.}\n}\n',encoding='utf-8')
(ROOT/'google-maps-language-study.cff').write_text('cff-version: 1.2.0\nmessage: "Cite this compilation and attribute underlying estimates to Google."\ntype: dataset\ntitle: "Google review removal and language: a historical accuracy-data audit"\nversion: "1.0"\ndate-released: 2026-11-02\nauthors:\n  - name: "ReviewsBoost Editorial Team"\nlicense: CC-BY-4.0\nurl: "'+URL+'"\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
