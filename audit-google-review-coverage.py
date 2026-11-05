"""Independent arithmetic/provenance audit. Does not import the data builder."""
from pathlib import Path
from fractions import Fraction
from itertools import combinations
import csv,hashlib,html,json,math,re

ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-review-coverage-study.json').read_text(encoding='utf-8'))
assert D['record_counts']=={'documentation_facts':12,'coverage_bounds':9,'random_sample_scenarios':159,'refresh_envelopes':21,'constructed_calculations':189}
assert len({r['record_id'] for key in ['coverage','random_sample_scenarios','refresh_envelopes'] for r in D[key]})==189
for r in D['coverage']:
    n=r['total_ratings_n'];assert r['max_places_records']==min(5,n)
    assert math.isclose(r['max_count_coverage_pct'],500/n)
    assert r['minimum_records_not_in_response']==n-5
    assert r['gbp_pages_at_50_full_records']==(n+49)//50
for r in D['random_sample_scenarios']:
    n,k,s=r['population_n'],r['target_records_k'],r['sample_size_s']
    # Product of successive conditional misses, rather than the builder's combinations formula.
    expected=Fraction(1)
    for i in range(s):expected*=Fraction(max(n-k-i,0),n-i)
    assert Fraction(int(r['miss_numerator']),int(r['miss_denominator']))==expected
    assert math.isclose(r['miss_probability'],float(expected),abs_tol=1e-15)
    assert math.isclose(r['detect_probability'],float(1-expected),abs_tol=1e-15)
    assert math.isclose(r['miss_pct']+r['detect_pct'],100,abs_tol=1e-12)
    if n<=10:
        subsets=list(combinations(range(n),s))
        actual=Fraction(sum(all(i>=k for i in subset) for subset in subsets),len(subsets))
        assert actual==expected
for r in D['refresh_envelopes']:
    n,t=r['population_n'],r['snapshots_t'];assert r['minimum_unique_records']==5
    assert r['maximum_unique_records']==min(n,5*t)
    assert math.isclose(r['minimum_unique_coverage_pct'],500/n)
    assert math.isclose(r['maximum_unique_coverage_pct'],100*min(n,5*t)/n)
for filename,key in [('google-review-api-facts.csv',None),('google-review-snapshot-coverage.csv','coverage'),('google-review-sampling-scenarios.csv','random_sample_scenarios'),('google-review-refresh-bounds.csv','refresh_envelopes')]:
    rows=list(csv.DictReader((ROOT/filename).open(encoding='utf-8')))
    source=D[key] if key else D['source_inputs']['facts']
    assert rows==[{name:str(value) for name,value in row.items()} for row in source]
    metadata=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'))
    assert [c['name'] for c in metadata['tableSchema']['columns']]==list(rows[0])
    assert metadata['url']=='https://reviewsboost.ca/'+filename
facts={r['record_id']:r for r in D['source_inputs']['facts']}
assert facts['F01']['value']=='5' and facts['F05']['value']=='50'
assert facts['F02']['value']=='relevance' and facts['F08']['value']=='updateTime desc'
for source in D['source_inputs']['sources']:
    assert len(source['sha256'])==64 and source['accessed']=='2026-11-05'
    captures=list((ROOT/'research-sources/coverage-2026-11-05').glob(source['id']+'.*'))
    if captures:
        payload=captures[0].read_bytes()
        assert hashlib.sha256(payload).hexdigest()==source['sha256']
        if source['id'] in ['places','gbp-list','gbp-review']:
            text=re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',payload.decode('utf-8')))).lower()
            expected={
                'places':['a maximum of 5 reviews can be returned','sorted by relevance','with or without text'],
                'gbp-list':['maximum pagesize is 50','updatetime desc','location is verified'],
                'gbp-review':['createtime','updatetime','when the review was last modified']
            }
            for phrase in expected[source['id']]:assert phrase in text,(source['id'],phrase)
assert 'No API requests' in D['not_observational']
assert all('NOT random' in r['assumptions'] for r in D['random_sample_scenarios'])
print('PASS: 189 calculation rows, exact fractions, small-population enumeration, refresh bounds, 12 source facts, CSV/JSON/CSVW parity and seven captured-source fingerprints.')
