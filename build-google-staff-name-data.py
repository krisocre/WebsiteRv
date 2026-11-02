"""Reproduce an attributed evidence audit. Standard library only; no review scraping."""
from pathlib import Path
import csv
import json
from fractions import Fraction

ROOT = Path(__file__).resolve().parent
I = json.loads((ROOT / 'google-staff-name-source-values.json').read_text(encoding='utf-8'))
LICENCE = 'https://creativecommons.org/licenses/by/4.0/'
estimates = []
for rid, level, comparison, ratio, low, high, page in I['rate_rows']:
    estimates.append({'record_id':rid, 'record_type':'source_estimate_with_derived_percentage_scale',
        'comparison_level':level, 'source_comparison':comparison, 'relative_rate':ratio,
        'interval_low':low, 'interval_high':high, 'interval_level_percent':95,
        'relative_difference_percent':round(100*(ratio-1),8),
        'difference_low_percent':round(100*(low-1),8), 'difference_high_percent':round(100*(high-1),8),
        'printed_interval_includes_one':low <= 1 <= high,
        'source_pdf_page':page, 'source_url':I['source']['pdf_url'],
        'interpretation':'Relative rate for the stated comparison, not absolute deletion probability, independent replication or a test of how a review was requested.'})
flows = []
for rid, label, gained, lost, net, published_loss_per_100 in I['flow_rows']:
    flows.append({'record_id':rid, 'record_type':'source_rounded_group_means_with_derived_arithmetic',
        'source_name_share_group':label, 'gained_prior_year':gained, 'lost_annualised_two_week_window':lost,
        'net_source_display':net, 'losses_per_100_gained_source_display':published_loss_per_100,
        'nominal_lost_divided_by_gained_percent':round(float(Fraction(100*lost,gained)),9),
        'nominal_gained_minus_lost':gained-lost,
        'source_pdf_page':I['flow_source_pdf_page'], 'source_url':I['source']['pdf_url'],
        'time_base':I['flow_time_bases'],
        'interpretation':'Ratios of rounded displayed means are not exact source rates or observed one-year retention probabilities.'})
low_group, high_group = flows[0], flows[-1]
ratios = []
for metric, adjusted, page in I['adjusted_flow_summaries']:
    field = {'gained':'gained_prior_year','annualised_lost':'lost_annualised_two_week_window','net':'net_source_display'}[metric]
    ratios.append({'record_id':'A'+str(len(ratios)+1), 'record_type':'derived_ratio_beside_distinct_source_adjusted_summary',
        'metric':metric, 'name_heavy_rounded_mean':high_group[field], 'name_rare_rounded_mean':low_group[field],
        'ratio_of_rounded_means':round(float(Fraction(high_group[field],low_group[field])),9),
        'source_adjusted_summary':adjusted, 'source_adjusted_summary_pdf_page':page,
        'source_url':I['source']['pdf_url'],
        'interpretation':'Different summaries, weighting, covariates or exposures; not an arithmetic error, causal contrast or percentage of bias removed.'})

# Authored examples, explicitly separate from the observed study summaries.
examples = []
for rid, request, classification, concern in [
    ('E01','If you would like, share an honest review of your experience.','neutral_invitation','Leaves the rating and content to the customer; no incentive.'),
    ('E02','Please include the name of the team member who helped you.','specific_content_instruction','Directs the requested review content, including a staff identifier.'),
    ('E03','Please leave us five stars.','rating_instruction','Attempts to influence the rating.'),
    ('E04','Leave a review to receive a discount.','incentive','Offers a benefit for posting a review.'),
    ('E05','Only customers who say they are happy receive the Google link.','selective_positive_solicitation','Routes invitations based on positive sentiment.'),
    ('E06','Each staff member must bring in ten reviews this month.','staff_review_quota','Sets a required number of reviews for staff to solicit.'),
    ('E07','You must post your rating here before we finish your appointment.','on_premises_pressure','Requires the customer to rate while on the premises.'),
    ('E08','You can use this link later if you choose to leave feedback.','neutral_invitation','Optional invitation; does not direct rating, wording or timing on site.')]:
    examples.append({'record_id':rid, 'record_type':'author_constructed_request_example_not_observed',
        'example_request_or_process':request, 'editorial_policy_category':classification,
        'editorial_rationale':concern, 'source_policy_url':I['policy']['url'],
        'status':'Editorial mapping of a constructed example, not a Google moderation decision or legal certification.'})

D = {'title':I['title'], 'version':I['version'], 'published':I['published'], 'article_url':I['article_url'],
    'license':LICENCE, 'source_inputs':I, 'estimates':estimates, 'flows':flows, 'ratio_audit':ratios,
    'request_examples':examples,
    'summary':{'source_relative_rate_rows':len(estimates), 'source_rounded_flow_rows':len(flows),
        'derived_ratio_comparisons':len(ratios), 'constructed_request_examples':len(examples),
        'review_level_rows':sum(r['comparison_level']=='review' for r in estimates),
        'business_level_rows':sum(r['comparison_level']=='business' for r in estimates),
        'newly_observed_reviews':0},
    'limitations':[I['source']['scope'],I['model_notes'],I['flow_time_bases'],
        'A person-name tag is not verified employment, proof of consent, or evidence of the preceding review request.',
        'An interval containing one does not prove equivalence or no enforcement. Request behaviour is not observed.',
        'Source estimates share underlying data; fifteen rows are not fifteen independent experiments.',
        'The loss/gain ratio mixes historical gains with annualised short-window losses; do not call its complement a retention rate.',
        'Request examples are original, constructed editorial examples, not sampled businesses, reviews or cases.',
        'Original numbers are attributed to Reviewflowz and Cartelis. This release does not measure ReviewsBoost client outcomes.']}
(ROOT/'google-staff-name-study.json').write_text(json.dumps(D,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

definitions = {
    'relative_rate':'Source-reported relative deletion rate for this specific comparison; not an absolute probability.',
    'relative_difference_percent':'Derived 100*(relative_rate-1), a relative percentage difference, not percentage points.',
    'difference_low_percent':'Derived lower endpoint on the relative percentage-difference scale.',
    'difference_high_percent':'Derived upper endpoint on the relative percentage-difference scale.',
    'printed_interval_includes_one':'Geometry of the printed 95% interval; not an equivalence test or a new p-value.',
    'source_pdf_page':'One-based physical PDF page; the selected tables use matching printed page numbers.',
    'lost_annualised_two_week_window':'Published rounded group-average losses, extrapolated by the source from a two-week observation window.',
    'nominal_lost_divided_by_gained_percent':'100*displayed rounded loss mean/displayed rounded gain mean; not an exact source percentage or cohort retention rate.',
    'ratio_of_rounded_means':'Derived ratio of displayed name-heavy and name-rare group means; not the adjusted estimate.',
    'source_adjusted_summary':'Distinct source-reported adjusted relative summary; no confidence interval invented.',
    'editorial_policy_category':'Authored category for a constructed request; not a platform decision or numerical risk score.'}
for filename, rows in [('google-staff-name-estimates.csv',estimates),('google-staff-name-flows.csv',flows),
                       ('google-staff-name-ratio-audit.csv',ratios),('google-review-request-examples.csv',examples)]:
    with (ROOT/filename).open('w',encoding='utf-8',newline='') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]),lineterminator='\n');writer.writeheader();writer.writerows(rows)
    columns=[]
    for key in rows[0]:
        values=[r[key] for r in rows if r[key] is not None]
        kind='boolean' if all(isinstance(v,bool) for v in values) else 'integer' if all(isinstance(v,int) for v in values) else 'number' if all(isinstance(v,(float,int)) for v in values) else 'string'
        col={'name':key,'datatype':kind,'null':[''],'dc:description':definitions.get(key,key.replace('_',' '))}
        if kind=='boolean':col['datatype']={'base':'boolean','format':'True|False'}
        columns.append(col)
    metadata={'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/'+filename,'dc:title':I['title']+' — '+filename,'dc:license':LICENCE,'tableSchema':{'columns':columns,'primaryKey':'record_id'}}
    (ROOT/(filename+'-metadata.json')).write_text(json.dumps(metadata,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
(ROOT/'google-staff-name-study.bib').write_text('''@misc{reviewsboost2026staffnames,
 author={{ReviewsBoost Editorial Team}},
 title={Staff Names in Google Reviews: A Study-to-Policy Evidence Audit},
 year={2026}, version={1.0.0},
 url={https://reviewsboost.ca/google-reviews-staff-names-study.html},
 note={Secondary compilation and original arithmetic; source estimates by Reviewflowz and Cartelis. Constructed request examples labelled separately.}
}
''',encoding='utf-8')
(ROOT/'google-staff-name-study.cff').write_text('''cff-version: 1.2.0
message: "Cite this audit and attribute the study estimates to Reviewflowz and Cartelis."
type: dataset
title: "Staff Names in Google Reviews: A Study-to-Policy Evidence Audit"
authors:
  - name: "ReviewsBoost Editorial Team"
version: 1.0.0
date-released: 2026-11-02
license: CC-BY-4.0
url: "https://reviewsboost.ca/google-reviews-staff-names-study.html"
''',encoding='utf-8')
print(json.dumps(D['summary']))
