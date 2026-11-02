"""Independent arithmetic/export audit, with optional original PDF fingerprint check."""
from pathlib import Path
from fractions import Fraction
import argparse,csv,hashlib,json,math,urllib.request

ROOT=Path(__file__).resolve().parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--pdf',type=Path)
parser.add_argument('--fetch',action='store_true')
args=parser.parse_args()
D=json.loads((ROOT/'google-staff-name-study.json').read_text(encoding='utf-8'))
I=json.loads((ROOT/'google-staff-name-source-values.json').read_text(encoding='utf-8'))
assert D['source_inputs']==I
assert D['summary']=={'source_relative_rate_rows':15,'source_rounded_flow_rows':4,'derived_ratio_comparisons':3,'constructed_request_examples':8,'review_level_rows':12,'business_level_rows':3,'newly_observed_reviews':0}
expected=[(1.32,1.23,1.42),(1.01,.91,1.11),(1.07,.95,1.21),(1.09,.96,1.24),(1.01,.85,1.20),(1.02,.86,1.21),(1.01,.85,1.21),(1.02,.79,1.32),(1.08,.94,1.23),(1.10,.84,1.46),(1.02,.87,1.21),(.87,.74,1.03),(3.9,2.7,5.7),(2.4,1.6,3.8),(1.26,.79,2.01)]
for r,values in zip(D['estimates'],expected):
    assert (r['relative_rate'],r['interval_low'],r['interval_high'])==values
    assert r['interval_low']<=r['relative_rate']<=r['interval_high']
    assert r['printed_interval_includes_one']==(r['interval_low']<=1<=r['interval_high'])
    for source,derived in [('relative_rate','relative_difference_percent'),('interval_low','difference_low_percent'),('interval_high','difference_high_percent')]:
        assert math.isclose(float((Fraction(str(r[source]))-1)*100),r[derived],abs_tol=1e-8)
assert [r['record_id'] for r in D['estimates'] if not r['printed_interval_includes_one']]==['R01','B01','B02']
assert (D['estimates'][1]['difference_low_percent'],D['estimates'][1]['difference_high_percent'])==(-9,11)
for r,values in zip(D['flows'],[(63,5,58,8),(84,8,76,10),(111,23,88,20),(121,16,105,13)]):
    assert (r['gained_prior_year'],r['lost_annualised_two_week_window'],r['net_source_display'],r['losses_per_100_gained_source_display'])==values
    assert r['nominal_gained_minus_lost']==values[0]-values[1]==values[2]
    assert math.isclose(float(Fraction(100*values[1],values[0])),r['nominal_lost_divided_by_gained_percent'],abs_tol=1e-8)
for r,values in zip(D['ratio_audit'],[(121,63,2.7),(16,5,2.4),(105,58,2.0)]):
    assert (r['name_heavy_rounded_mean'],r['name_rare_rounded_mean'],r['source_adjusted_summary'])==values
    assert math.isclose(float(Fraction(values[0],values[1])),r['ratio_of_rounded_means'],abs_tol=1e-8)
    assert not math.isclose(r['ratio_of_rounded_means'],r['source_adjusted_summary'],abs_tol=.01)
assert len({r['record_id'] for r in D['request_examples']})==8
assert all(r['record_type']=='author_constructed_request_example_not_observed' for r in D['request_examples'])
assert sum(r['editorial_policy_category']=='neutral_invitation' for r in D['request_examples'])==2
for filename,rows in [('google-staff-name-estimates.csv',D['estimates']),('google-staff-name-flows.csv',D['flows']),('google-staff-name-ratio-audit.csv',D['ratio_audit']),('google-review-request-examples.csv',D['request_examples'])]:
    with (ROOT/filename).open(encoding='utf-8',newline='') as f:actual=list(csv.DictReader(f))
    assert len(actual)==len(rows)
    for a,e in zip(actual,rows):assert a=={k:'' if v is None else str(v) for k,v in e.items()}
    meta=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'))
    assert [c['name'] for c in meta['tableSchema']['columns']]==list(rows[0])
    assert meta['url']=='https://reviewsboost.ca/'+filename
raw=None
if args.fetch:raw=urllib.request.urlopen(I['source']['pdf_url'],timeout=40).read()
elif args.pdf:raw=args.pdf.read_bytes()
if raw:assert hashlib.sha256(raw).hexdigest()==I['source']['pdf_sha256'],'Original PDF changed; recheck the capture before publishing.'
print('PASS: 15 attributed estimates, 4 flows, 3 derived ratios, 8 explicitly constructed requests; CSV/JSON/CSVW parity; '+('PDF fingerprint verified.' if raw else 'optional source PDF not supplied.'))
