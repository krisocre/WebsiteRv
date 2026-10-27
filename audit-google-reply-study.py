"""Independent integer enumeration, temporal-compatibility and source/CSV audit."""
from pathlib import Path
from decimal import Decimal,ROUND_HALF_UP
import json,csv,hashlib
ROOT=Path(__file__).resolve().parent
D=json.loads((ROOT/'google-reply-removal-study.json').read_text(encoding='utf-8'))
I=json.loads((ROOT/'google-reply-source-values.json').read_text(encoding='utf-8'))
assert [r['source_review_count'] for r in D['cohorts']]==[22390,71196,47687,13142,38145,133664]
assert sum(r['source_review_count'] for r in D['cohorts'])==326224
assert 335520-326224==D['summary']['difference_from_study_total']==9296
for row in D['cohorts']:
 n=row['source_review_count'];display=Decimal(str(row['source_removed_within_7_days_percent']))
 compatible=[k for k in range(n+1) if (Decimal(k)*100/n).quantize(Decimal('.1'),rounding=ROUND_HALF_UP)==display]
 assert min(compatible)==row['conditional_7_day_count_min']
 assert max(compatible)==row['conditional_7_day_count_max']
 assert 'conditional' in row['record_type']
ten=next(r for r in D['cohorts'] if r['reply_label']=='10+ days')
assert (ten['conditional_7_day_count_min'],ten['conditional_7_day_count_max'])==(0,19)
assert len(D['eligibility'])==18
for cell in D['eligibility']:
 row=next(r for r in D['cohorts'] if r['record_id']==cell['source_row']);lo=row['model_reply_lower_seconds'];hi=row['model_reply_upper_exclusive_seconds'];H=cell['horizon_days']*86400
 if lo is None:assert cell['state']=='not_applicable_no_reply'
 elif lo>=H:assert cell['state']=='incompatible_if_reply_precedes_removal'
 elif hi is not None and hi<=H:assert cell['state']=='all_reply_times_in_interval_precede_horizon'
 else:assert cell['state']=='only_part_of_reply_interval_precedes_horizon'
 assert cell['record_type']=='conditional_time_order_model_not_observed'
assert next(c for c in D['eligibility'] if c['reply_label']=='10+ days' and c['horizon_days']==7)['state']=='incompatible_if_reply_precedes_removal'
assert next(c for c in D['eligibility'] if c['reply_label']=='5-10 days' and c['horizon_days']==7)['state']=='only_part_of_reply_interval_precedes_horizon'
for filename,key in [('google-reply-cohorts.csv','cohorts'),('google-reply-time-eligibility.csv','eligibility')]:
 with (ROOT/filename).open(encoding='utf-8',newline='') as f:rows=list(csv.DictReader(f))
 assert len(rows)==len(D[key])
 for actual,expected in zip(rows,D[key]):assert actual=={k:'' if v is None else str(v) for k,v in expected.items()}
 meta=json.loads((ROOT/(filename+'-metadata.json')).read_text(encoding='utf-8'));assert [c['name'] for c in meta['tableSchema']['columns']]==list(D[key][0])
capture=ROOT/'research-sources/reply-study'
if (capture/'localo-body.txt').exists():
 body=(capture/'localo-body.txt').read_text(encoding='utf-8');assert hashlib.sha256(body.encode()).hexdigest()==I['capture_sha256']
 tables=json.loads((capture/'localo-tables.json').read_text(encoding='utf-8'));table=next(t for t in tables if t[0][0]=='Reply speed')
 for source,expected in zip(table[1:],I['rows']):
  parsed=[source[0],int(source[1].replace(',','')),int(source[2].split()[0]),float(source[3].rstrip('%'))]
  assert parsed==expected[:4]
print('PASS: six source cohorts, 18 conditional timing cells, exact rounding intervals by enumeration, two CSVs and source provenance when available.')
