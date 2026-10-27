"""Compile reply-table aggregates, conditional time eligibility and rounding bounds."""
from pathlib import Path
from decimal import Decimal,ROUND_CEILING
import json,csv
ROOT=Path(__file__).resolve().parent
I=json.loads((ROOT/'google-reply-source-values.json').read_text(encoding='utf-8'))
URL='https://reviewsboost.ca/google-review-replies-removal-bias-study.html'
LICENCE='https://creativecommons.org/licenses/by/4.0/'
cohorts=[];eligibility=[]
for index,(label,n,median,p,lower,upper) in enumerate(I['rows']):
 rate=Decimal(str(p));lo=max(Decimal(0),rate-Decimal('.05'));hi=min(Decimal(100),rate+Decimal('.05'))
 kmin=int((lo*n/100).to_integral_value(rounding=ROUND_CEILING));kmax=int((hi*n/100).to_integral_value(rounding=ROUND_CEILING))-1
 cohorts.append(dict(record_id=f'R{index+1:02}',record_type='source_deleted_review_aggregate_with_conditional_rounding_bounds',reply_label=label,source_review_count=n,source_median_lifespan_days=median,source_removed_within_7_days_percent=p,model_reply_lower_seconds=lower,model_reply_upper_exclusive_seconds=upper,conditional_7_day_count_min=kmin,conditional_7_day_count_max=kmax,source_url=I['source_url'],rate_population='Selected deleted reviews in source row, not all submitted reviews'))
 for days in [1,7,30]:
  h=days*86400
  state='not_applicable_no_reply' if lower is None else 'incompatible_if_reply_precedes_removal' if lower>=h else 'only_part_of_reply_interval_precedes_horizon' if upper is None or upper>h else 'all_reply_times_in_interval_precede_horizon'
  eligibility.append(dict(record_id=f'E{index+1:02}-{days}',record_type='conditional_time_order_model_not_observed',source_row=f'R{index+1:02}',reply_label=label,horizon_days=days,horizon_seconds=h,state=state,condition='Same review; reply strictly before removal; stated bin-boundary interpretation. No event probability implied.'))
total=sum(r['source_review_count'] for r in cohorts)
summary={'source_cohorts':len(cohorts),'model_cells':len(eligibility),'total_records':len(cohorts)+len(eligibility),'source_table_count_sum':total,'study_deleted_total':I['study_deleted_reviews'],'difference_from_study_total':I['study_deleted_reviews']-total,'difference_percent_of_study_total':(I['study_deleted_reviews']-total)/I['study_deleted_reviews']*100,'conditional_count_min_sum':sum(r['conditional_7_day_count_min'] for r in cohorts),'conditional_count_max_sum':sum(r['conditional_7_day_count_max'] for r in cohorts)}
D={'title':'Google review replies and removal: a time-order and rounding audit','version':'1.0','published':'2026-10-27','article_url':URL,'license':LICENCE,'source':I,'summary':summary,'cohorts':cohorts,'eligibility':eligibility,'limitations':['No raw review timestamps, event histories, still-visible review comparison group or causal estimate.','Source table row-count sum differs from the broader declared study total; the public table does not explain every record-level inclusion decision.','Timing classifications require the explicit R < T assumption and bin interpretation.','Rounding bounds require an unverified nearest-tenth rounding assumption.','No Canadian-specific cohort or client service outcomes were measured.','The analysis does not estimate report-processing time or removal success.']}
(ROOT/'google-reply-removal-study.json').write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
fields={'source_review_count':'Publisher count in a selected deleted-review row, not all posted reviews.','source_median_lifespan_days':'Publisher creation-to-removal median, not report turnaround time.','source_removed_within_7_days_percent':'Source percentage within the selected deleted-review group.','conditional_7_day_count_min':'Smallest integer compatible with the explicitly assumed nearest-tenth percentage rounding. Not an observed event count.','conditional_7_day_count_max':'Largest integer compatible with the explicitly assumed rounding. A 0.0% display does not alone prove zero events.','model_reply_lower_seconds':'Inclusive model lower bound derived from a source label; unverified raw-time bin convention.','model_reply_upper_exclusive_seconds':'Exclusive model upper bound; blank for unbounded or no-reply groups.','record_type':'Distinguishes attributed source aggregates from conditional mathematical cells.','state':'Temporal compatibility under R < T; never a probability or evidence of causation.'}
for filename,rows in [('google-reply-cohorts.csv',cohorts),('google-reply-time-eligibility.csv',eligibility)]:
 with (ROOT/filename).open('w',encoding='utf-8',newline='') as f:
  w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader();w.writerows(rows)
 cols=[]
 for key in rows[0]:
  v=next((r[key] for r in rows if r[key] is not None),None)
  cols.append({'name':key,'datatype':'integer' if isinstance(v,int) else 'number' if isinstance(v,float) else 'string','null':[''],'dc:description':fields.get(key,key.replace('_',' '))})
 meta={'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/'+filename,'dc:title':D['title']+' — '+filename,'dc:license':LICENCE,'tableSchema':{'columns':cols}}
 (ROOT/(filename+'-metadata.json')).write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
(ROOT/'google-reply-removal-study.bib').write_text('@misc{reviewsboost2026reply,\n author={{ReviewsBoost Editorial Team}},\n title={Google Review Replies and Removal: A Timing Bias Study},\n year={2026},\n version={1.0},\n url={'+URL+'},\n note={Secondary analysis of Localo aggregates; time-order and rounding calculations are conditional models}\n}\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
