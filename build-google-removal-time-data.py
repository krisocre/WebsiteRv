"""Build ReviewsBoost's original timing-window analysis from attributed source inputs.
Standard library only. Original calculations CC BY 4.0; source observations Localo.
"""
from pathlib import Path
from datetime import date
import csv
import json

ROOT=Path(__file__).resolve().parent
I=json.loads((ROOT/'google-removal-time-source-values.json').read_text(encoding='utf-8'))
A=I['analysis_assumptions']
START=date.fromisoformat(A['observation_start_inclusive'])
END=date.fromisoformat(A['observation_end_exclusive'])
URL='https://reviewsboost.ca/google-review-removal-time-study.html'
cohorts=[]
for i,c in enumerate(I['cohorts'],start=1):
    year=c['year'];c0=date(year,1,1);c1=min(date(year+1,1,1),END)
    lower=max(0,(START-c1).days);upper=(END-c0).days
    endpoint='impossible_within_31_days' if lower>=31 else 'necessarily_under_31_days' if upper<=31 else 'either_side_possible'
    cohorts.append({'record_id':f'C{i:02}','record_type':'reported_cohort_with_conditional_calendar_analysis',**c,
      'creation_start_inclusive':c0.isoformat(),'creation_end_exclusive':c1.isoformat(),
      'assumed_observation_start_inclusive':START.isoformat(),'assumed_observation_end_exclusive':END.isoformat(),
      'conditional_lifespan_lower_days':lower,'lower_inclusive':lower==0,
      'conditional_lifespan_upper_days':upper,'upper_inclusive':False,'endpoint_31_days':endpoint,
      'source_url':I['source_url'],'scope':I['cohort_population'],
      'notes':'Calendar support is conditional on the deletion-window interpretation. The source median is an observed aggregate, not a report-processing time or service promise.'})
periods=[]
for i,p in enumerate(I['periods'],start=1):
    periods.append({'record_id':f'P{i:02}','record_type':'reported_rounded_period_average_with_derived_volume',**p,
      'implied_deletions_from_displayed_mean':p['displayed_average_monthly_deletions']*p['months'],
      'source_url':I['source_url'],'notes':'Mean multiplied by month count; an approximate reconstruction, not an exact period event count.'})
scenarios=[]
for label,deleted in [('A',5),('B',90)]:
    scenarios.append({'record_id':'S'+label,'record_type':'synthetic_illustration_not_google_observations',
      'starting_reviews':100,'deleted_on_day':5,'deleted_count':deleted,'still_visible_at_day_30':100-deleted,
      'follow_up_days':30,'deleted_only_median_days':5,'observed_deletion_fraction_percent':deleted,
      'population_median_deletion_day':5 if deleted>=50 else None,
      'population_median_status':'reached' if deleted>=50 else 'not_reached_within_30_day_follow_up',
      'source_url':None,'notes':'Original constructed example. Every review starts at day zero; remaining reviews are right-censored at day 30. No client or platform record is represented.'})
implied=sum(r['implied_deletions_from_displayed_mean'] for r in periods)
months=sum(r['months'] for r in periods)
summary={'reported_cohort_rows':len(cohorts),'selected_cohort_count_sum':sum(c['count'] for c in cohorts),
 'reported_period_rows':len(periods),'synthetic_scenario_rows':len(scenarios),'reported_study_deleted_total':I['source_total_deleted_reviews'],
 'reported_business_profiles':I['source_business_profiles'],'tracking_months':months,
 'implied_total_from_displayed_monthly_means':implied,'reported_total_minus_implied_total':I['source_total_deleted_reviews']-implied,
 'nearest_integer_mean_model_total_lower_inclusive':implied-months*.5,
 'nearest_integer_mean_model_total_upper_exclusive':implied+months*.5,
 'nearest_integer_mean_model_compatible_with_reported_total':implied-months*.5<=I['source_total_deleted_reviews']<implied+months*.5,
 'nominal_2017_to_january_2026_deleted_median_ratio':cohorts[0]['median_lifespan_days']/cohorts[-1]['median_lifespan_days']}
D={'title':'Google review removal time: an observation-window sensitivity analysis','version':'1.0','published':'2026-10-24',
 'article_url':URL,'license':'https://creativecommons.org/licenses/by/4.0/',
 'rights_note':'ReviewsBoost original compilation, conditional bounds, synthetic examples, calculations and figures: CC BY 4.0. Attribute source observations to Localo; external source material retains its rights.',
 'source_url':I['source_url'],'source_published':I['source_published'],'source_capture_sha256':I['source_capture_sha256'],
 'source_geography':'Multiple countries and industries in the publisher description; no separate Canadian sample or merchant-report cohort.',
 'source_input_file':'google-removal-time-source-values.json','analysis_assumptions':A,'summary':summary,
 'notes':['Observed aggregates, conditional mathematical bounds and synthetic examples are separate record types.',
          'No review-level creation/removal timestamps, still-visible comparison sample or sampling-inclusion rules were obtained.',
          'The calendar interpretation is a sensitivity model, not a replication of Localo’s data pipeline or proof that a published conclusion is false.',
          'The 31-day endpoint in the model is not substituted for the publisher’s reported 30-day percentage.',
          'Creation-to-deletion age is different from report-to-decision time. No service deadline is inferred.',
          'Creation-year rows are a selected five-star, no-text subset. Period averages describe the broader reported deletion set and must not be joined as if they represented the same cohort.',
          'Rounded averages imply an approximate total. Rounding compatibility depends on the stated nearest-integer assumption; no publisher rounding rule is asserted.'],
 'cohorts':cohorts,'periods':periods,'synthetic_scenarios':scenarios}
(ROOT/'google-removal-time-analysis.json').write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
def write_csv(name,rows):
    with (ROOT/name).open('w',encoding='utf-8',newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(rows[0]));w.writeheader()
        w.writerows({k:str(v).lower() if isinstance(v,bool) else v for k,v in row.items()} for row in rows)
for name,rows in [('google-removal-time-cohorts.csv',cohorts),('google-removal-time-periods.csv',periods),('google-removal-time-scenarios.csv',scenarios)]:write_csv(name,rows)
descriptions={
 'conditional_lifespan_lower_days':'Conditional calendar support lower bound in elapsed days. Interpret with lower_inclusive and the published timing assumption.',
 'conditional_lifespan_upper_days':'Strict conditional calendar support upper bound; not a maximum observed lifespan or a service guarantee.',
 'source_year_label':'Original selected creation-year label, not removal year.',
 'median_lifespan_days':'Publisher-reported median age among the selected deleted reviews; not merchant report-processing time.',
 'removed_within_30_days_percent':'Publisher’s reported <=30-day measure for the selected deleted cohort; not the original-review population risk.',
 'count':'Count in the selected source row, not all reviews created that year.',
 'endpoint_31_days':'Model classification for <31 elapsed days; do not substitute for the separate reported <=30-day statistic.',
 'record_type':'Reported aggregate with conditional mathematical columns; other tables explicitly identify synthetic examples.'}
columns=[]
for name,value in cohorts[0].items():
    typ='boolean' if isinstance(value,bool) else 'integer' if isinstance(value,int) else 'number' if isinstance(value,float) else 'string'
    columns.append({'name':name,'datatype':typ,'null':[''],'dc:description':descriptions.get(name,name.replace('_',' '))})
metadata={'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/google-removal-time-cohorts.csv',
 'dc:title':D['title'],'dc:description':D['source_geography'],'dc:license':D['license'],'tableSchema':{'columns':columns}}
(ROOT/'google-removal-time-cohorts.csv-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
extra_definitions={
 'record_type':'Identifies a reported aggregate with derived values or an entirely synthetic illustration; never an observed Canadian client outcome.',
 'displayed_average_monthly_deletions':'Publisher-displayed monthly mean for this period; source rounding rule is not known.',
 'start':'First included calendar date of the period.','end_exclusive':'First excluded calendar date of the period.',
 'months':'Number of months used to weight the reported monthly mean.',
 'implied_deletions_from_displayed_mean':'Monthly mean × months; approximate reconstruction, not an exact observed event count.',
 'starting_reviews':'Constructed starting cohort size; not sampled Google reviews.',
 'deleted_on_day':'Assumed elapsed event day in the synthetic example.',
 'deleted_count':'Assumed deletion count in the synthetic example.',
 'still_visible_at_day_30':'Constructed observations censored at day 30; no later event time is assumed.',
 'follow_up_days':'Synthetic observation period in elapsed days.',
 'deleted_only_median_days':'Median among constructed deleted reviews only; excludes still-visible reviews.',
 'observed_deletion_fraction_percent':'Synthetic event count divided by synthetic starting reviews × 100; not a measured Google removal rate.',
 'population_median_deletion_day':'Synthetic full-cohort median event day, blank when not reached during follow-up.',
 'population_median_status':'Whether the constructed full cohort reaches a 50% deletion fraction within follow-up.',
 'source_url':'Attribution URL for reported values; blank for original constructed examples.',
 'notes':'Interpretation limits and assumptions for this row.'}
for filename,records,label in [
 ('google-removal-time-periods.csv',periods,'Six reported monthly averages with approximate weighted totals'),
 ('google-removal-time-scenarios.csv',scenarios,'Two synthetic examples; not Google or client observations')]:
    cols=[]
    for name in records[0]:
        value=next((r[name] for r in records if r[name] is not None),None)
        typ='boolean' if isinstance(value,bool) else 'integer' if isinstance(value,int) else 'number' if isinstance(value,float) else 'string'
        cols.append({'name':name,'datatype':typ,'null':[''],'dc:description':extra_definitions.get(name,name.replace('_',' '))})
    meta={'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/'+filename,
          'dc:title':label,'dc:license':D['license'],'tableSchema':{'columns':cols}}
    (ROOT/(filename+'-metadata.json')).write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
(ROOT/'google-review-removal-time-study.bib').write_text('@misc{reviewsboost2026removaltime,\n  author = {{ReviewsBoost Editorial Team}},\n  title = {Google review removal time: an observation-window sensitivity analysis},\n  year = {2026},\n  month = {October},\n  version = {1.0},\n  url = {'+URL+'},\n  note = {Secondary analysis of attributed Localo aggregates; conditional calendar bounds and synthetic examples are not observed Canadian outcomes}\n}\n',encoding='utf-8')
(ROOT/'google-review-removal-time-study.cff').write_text('cff-version: 1.2.0\nmessage: "Cite ReviewsBoost for this analysis and Localo for underlying observations."\ntitle: "Google review removal time: an observation-window sensitivity analysis"\nversion: "1.0"\ndate-released: "2026-10-24"\ntype: dataset\nauthors:\n  - name: "ReviewsBoost Editorial Team"\nurl: "'+URL+'"\nlicense: CC-BY-4.0\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
