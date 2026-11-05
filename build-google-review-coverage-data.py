"""Reproduce the Google review coverage audit; standard library only.

Optional --capture saves primary sources under ignored research-sources and
records fingerprints in the public provenance file. It collects no user reviews.
"""
from pathlib import Path
from fractions import Fraction
from math import comb, ceil
import argparse, csv, hashlib, json, urllib.request

ROOT = Path(__file__).resolve().parent
DATE = '2026-11-05'
URL = 'https://reviewsboost.ca/google-review-widget-coverage-study.html'
LICENSE = 'https://creativecommons.org/licenses/by/4.0/'
INPUT = ROOT / 'google-review-coverage-sources.json'
parser = argparse.ArgumentParser()
parser.add_argument('--capture', action='store_true')
args = parser.parse_args()
sources = json.loads(INPUT.read_text(encoding='utf-8'))

if args.capture:
    captures = ROOT / 'research-sources' / 'coverage-2026-11-05'
    captures.mkdir(parents=True, exist_ok=True)
    for source in sources['sources']:
        request = urllib.request.Request(source['url'], headers={'User-Agent':'ReviewsBoost evidence audit/1.0'})
        with urllib.request.urlopen(request, timeout=45) as response:
            payload = response.read()
        extension = '.pdf' if payload.startswith(b'%PDF') else '.html'
        (captures / (source['id'] + extension)).write_bytes(payload)
        source['sha256'] = hashlib.sha256(payload).hexdigest()
        source['accessed'] = DATE
        print('Captured', source['id'], len(payload), 'bytes')
    INPUT.write_text(json.dumps(sources, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

source_by_id = {source['id']:source for source in sources['sources']}
N_VALUES = [5,10,20,50,100,200,500,1000,5000]
K_VALUES = [1,2,5,10,20,50,100]
S_VALUES = [1,3,5]
T_VALUES = [1,2,3,5,10,20,30]
coverage, scenarios, refresh = [], [], []

for n in N_VALUES:
    shown = min(5,n)
    coverage.append({
        'record_id':f'C{n:05d}', 'record_type':'constructed_coverage_bound',
        'total_ratings_n':n, 'max_places_records':shown,
        'max_count_coverage_pct':float(100*Fraction(shown,n)),
        'minimum_records_not_in_response':n-shown,
        'gbp_pages_at_50_full_records':ceil(n/50),
        'source_ids':'F01;F03;F05;F06',
        'assumptions':'Five returned records; count and records aligned for illustration. Page arithmetic assumes a stable accessible collection and full pages; not measured businesses.'
    })
    for k in K_VALUES:
        if k > n:
            continue
        for sample in S_VALUES:
            miss = Fraction(comb(n-k,sample) if n-k>=sample else 0, comb(n,sample))
            scenarios.append({
                'record_id':f'M{n:05d}-{k:03d}-{sample}', 'record_type':'hypothetical_random_sample',
                'population_n':n, 'target_records_k':k, 'sample_size_s':sample,
                'miss_numerator':str(miss.numerator), 'miss_denominator':str(miss.denominator),
                'miss_probability':float(miss), 'detect_probability':float(1-miss),
                'miss_pct':float(100*miss), 'detect_pct':float(100*(1-miss)),
                'source_ids':'places;hypergeometric',
                'assumptions':'Uniform sampling without replacement within one sample; fixed population; targets specified by analyst, not fake-review labels. Google relevance ranking is NOT random; no actual Google detection/removal probabilities.'
            })
for n in [20,100,1000]:
    for t in T_VALUES:
        refresh.append({
            'record_id':f'R{n:04d}-{t:02d}', 'record_type':'constructed_refresh_envelope',
            'population_n':n, 'records_per_response':5, 'snapshots_t':t,
            'minimum_unique_records':5, 'maximum_unique_records':min(n,5*t),
            'minimum_unique_coverage_pct':float(Fraction(500,n)),
            'maximum_unique_coverage_pct':float(100*Fraction(min(n,5*t),n)),
            'source_ids':'F01;F02',
            'assumptions':'Exactly five records each time from one unchanged population. Lower bound repeats the same five; upper bound minimizes overlap. No elapsed-time or independence assumption and no observation of Google selection.'
        })

files = {
    'google-review-api-facts.csv':sources['facts'],
    'google-review-snapshot-coverage.csv':coverage,
    'google-review-sampling-scenarios.csv':scenarios,
    'google-review-refresh-bounds.csv':refresh
}
descriptions = {
    'total_ratings_n':'Constructed aggregate count, including ratings without comments; not sampled Google businesses.',
    'max_count_coverage_pct':'100 × min(5,N)/N, an upper bound on record-count coverage, not text-review completeness.',
    'gbp_pages_at_50_full_records':'Ceiling of N/50 under stable/full-page assumptions; real pagination can differ.',
    'target_records_k':'Hypothetical target records of interest; no assumption about rating, fraud or policy violation.',
    'miss_probability':'Exact hypergeometric miss fraction converted to decimal; not an observed Google rate.',
    'miss_numerator':'Exact reduced-fraction numerator; represented as a string in JSON to preserve large integers.',
    'miss_denominator':'Exact reduced-fraction denominator; represented as a string in JSON to preserve large integers.',
    'detect_probability':'One minus the model miss probability; no inference about actual relevance ranking.',
    'minimum_unique_records':'Distinct records if each complete response repeats the same five.',
    'maximum_unique_records':'min(N,5T), attained only when repeated responses have as little overlap as possible.'
}
numeric_int = {'total_ratings_n','max_places_records','minimum_records_not_in_response','gbp_pages_at_50_full_records','population_n','target_records_k','sample_size_s','miss_numerator','miss_denominator','records_per_response','snapshots_t','minimum_unique_records','maximum_unique_records'}
for filename, rows in files.items():
    with (ROOT/filename).open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader(); writer.writerows(rows)
    columns = []
    for name in rows[0]:
        datatype = 'integer' if name in numeric_int else 'number' if name.endswith('_pct') or name.endswith('_probability') else 'string'
        columns.append({'name':name,'datatype':datatype,'dc:description':descriptions.get(name,name.replace('_',' '))})
    metadata = {'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/'+filename,
                'dc:title':'Google review snapshot coverage audit — '+filename,
                'dc:license':LICENSE,'dc:source':[s['url'] for s in sources['sources']],
                'tableSchema':{'columns':columns}}
    (ROOT/(filename+'-metadata.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

release = {'title':'Google review widget coverage: documentation audit and constructed reference calculations',
           'article_url':URL,'version':'1.0.0','published':DATE,'license':LICENSE,
           'creator':'ReviewsBoost Editorial Team','record_counts':{'documentation_facts':len(sources['facts']),'coverage_bounds':len(coverage),'random_sample_scenarios':len(scenarios),'refresh_envelopes':len(refresh),'constructed_calculations':len(coverage)+len(scenarios)+len(refresh)},
           'not_observational':'No API requests for customer reviews, sampled businesses, removal outcomes, Canadian field sample or ranking experiment. No observed probability is estimated.',
           'source_inputs':sources,'coverage':coverage,'random_sample_scenarios':scenarios,'refresh_envelopes':refresh}
(ROOT/'google-review-coverage-study.json').write_text(json.dumps(release,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(ROOT/'google-review-coverage-study.bib').write_text('@misc{reviewsboost2026coverage,\n  author = {{ReviewsBoost Editorial Team}},\n  title = {Google Review Widget Coverage: Documentation Audit and Constructed Reference Calculations},\n  year = {2026},\n  month = nov,\n  version = {1.0.0},\n  url = {'+URL+'},\n  note = {189 constructed calculation rows and 12 documentation facts; no observed review sample. CC BY 4.0.}\n}\n',encoding='utf-8')
(ROOT/'google-review-coverage-study.cff').write_text('cff-version: 1.2.0\nmessage: "Cite the compilation and calculations; distinguish them from observed Google outcomes."\ntype: dataset\ntitle: "Google review widget coverage: documentation audit and constructed reference calculations"\nauthors:\n  - name: "ReviewsBoost Editorial Team"\nversion: 1.0.0\ndate-released: 2026-11-05\nurl: '+URL+'\nlicense: CC-BY-4.0\n',encoding='utf-8')
print('Built',release['record_counts'])
