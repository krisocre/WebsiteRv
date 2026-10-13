"""Reproduce ReviewsBoost's Trustpilot notice-table extraction (Python stdlib).
Original compilation/calculations: CC BY 4.0. Source material retains its rights.
Downloads the official report ZIP; raw cache is excluded from the public build.
"""
from pathlib import Path
import csv
import hashlib
import io
import json
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent
ZIP_URL = 'https://assets.ctfassets.net/wonkqgvit51x/43veQxX63SCvDEmqXyHqQi/bf51839da2bdb697209a16ceabb18434/Trustpilot_DSA_Transparency_Report.zip'
EXPECTED = 'dbaf2d134b76e450dbeaca791fa0f8cfcde21e5e1c9471ec832508a4a4a16882'
IDENTIFICATION_SHA = '0c6cf4821dc4b54ee85abf7566034a52b7eb3b47e7b24d25e9e6817f22305260'
COVER_SHA = 'f13ede15157f0fe8d11bd02df3bc0db9bb1d8d556a68f829786e6431e00d28c2'
PAGE = 'https://reviewsboost.ca/trustpilot-review-reporting-statistics.html'
cache = ROOT / 'research-sources'
cache.mkdir(exist_ok=True)
archive = zipfile.ZipFile(io.BytesIO(urllib.request.urlopen(ZIP_URL, timeout=30).read()))
def source(suffix, expected):
    name = next(n for n in archive.namelist() if not n.startswith('__MACOSX') and n.endswith(suffix))
    raw = archive.read(name)
    fingerprint = hashlib.sha256(raw).hexdigest()
    if fingerprint != expected:
        raise ValueError(f'Source changed: {name}. Recheck the report before revising the dataset.')
    (cache / Path(name).name).write_bytes(raw)
    return name, raw
filename, raw = source('4_notices.csv', EXPECTED)
_, identification = source('1_report_identification.csv', IDENTIFICATION_SHA)
_, cover = source('Cover page.csv', COVER_SHA)
identifiers = {r['Indicator']:r['Value'] for r in csv.DictReader(io.StringIO(identification.decode('utf-8-sig')))}
assert identifiers['Starting date of reporting period'] == '2025-02-17'
assert identifiers['Ending date of reporting period'] == '2025-12-31'
assert identifiers['Date of the publication of the report'] == '2026-02-28'
reader = csv.DictReader(io.StringIO(raw.decode('utf-8-sig')))
headers = reader.fieldnames
fields = {'notices':5,'trusted_notices':6,'items':7,'trusted_items':8,'median_hours':9,'trusted_median_hours':10,
          'law_actions':11,'trusted_law_actions':12,'terms_actions':13,'trusted_terms_actions':14}
def number(value):
    return int(value.replace(',','')) if value.strip() else None
rows=[]
parent=None
for index, row in enumerate(reader, start=2):
    code=row[headers[3]]
    kind='total' if code=='TOTAL' else 'category' if code.startswith('STATEMENT_CATEGORY_') else 'subcategory'
    if kind=='category': parent=code
    item={'source_record':index,'row_type':kind,'category_code':code,'parent_category':parent if kind=='subcategory' else None,
          'subcategory_description':row[headers[4]].strip() or None,'reporting_period_original':row[headers[2]],
          **{name:number(row[headers[column]]) for name,column in fields.items()},
          'context_items':row[headers[17]].strip() or None,'context_median_hours':row[headers[19]].strip() or None}
    rows.append(item)
total=rows[0]
categories=[r for r in rows if r['row_type']=='category']
def numeric_sum(group,field):
    return sum(r[field] for r in group if r[field] is not None)
ledger=[]
for category in categories:
    children=[r for r in rows if r['parent_category']==category['category_code']]
    if children and any(r['items'] is not None for r in children):
        child_sum=numeric_sum(children,'items')
        ledger.append({'category_code':category['category_code'],'category_items':category['items'],
                       'subcategory_items_sum':child_sum,'subcategory_minus_category_items':child_sum-(category['items'] or 0),
                       'category_notices':category['notices'],'subcategory_notices_sum':numeric_sum(children,'notices'),
                       'category_terms_actions':category['terms_actions'],'subcategory_terms_actions_sum':numeric_sum(children,'terms_actions')})
fake=next(r for r in rows if r['category_code']=='KEYWORD_INAUTHENTIC_USER_REVIEWS')
summary={
 'source_records':len(rows),'category_rows':len(categories),'reported_category_notices_sum':numeric_sum(categories,'notices'),
 'reported_category_items_sum':numeric_sum(categories,'items'),'reported_category_terms_actions_sum':numeric_sum(categories,'terms_actions'),
 'total_notices':total['notices'],'total_items':total['items'],'total_terms_actions':total['terms_actions'],
 'notices_minus_items':total['notices']-total['items'],
 'item_total_minus_reported_category_sum':total['items']-numeric_sum(categories,'items'),
 'actions_per_100_notices':total['terms_actions']/total['notices']*100,
 'actions_per_100_reported_items':total['terms_actions']/total['items']*100,
 'inauthentic_review_notice_share_percent':fake['notices']/total['notices']*100,
 'inauthentic_review_terms_action_share_percent':fake['terms_actions']/total['terms_actions']*100,
 'inauthentic_review_actions_per_100_notices':fake['terms_actions']/fake['notices']*100,
 'inauthentic_review_actions_per_100_reported_items':fake['terms_actions']/fake['items']*100,
 'trusted_item_category_sum':numeric_sum(categories,'trusted_items'),
 'trusted_terms_action_category_sum':numeric_sum(categories,'trusted_terms_actions')}
dataset={
 'title':'Trustpilot review reporting statistics: a 2025 notice-table audit','version':'1.0','published':'2026-10-08',
 'article_url':PAGE,'license':'https://creativecommons.org/licenses/by/4.0/',
 'source_landing_page':'https://corporate.trustpilot.com/legal','source_url':ZIP_URL,'source_filename':Path(filename).name,
 'source_sha256':EXPECTED,'report_identification_sha256':IDENTIFICATION_SHA,'report_cover_sha256':COVER_SHA,
 'source_report_published':'2026-02-28','reporting_start':'2025-02-17','reporting_end':'2025-12-31','accessed':'2026-10-08',
 'geographic_scope':'EU businesses reviewed by EU users; EU businesses reviewed by non-EU users; non-EU businesses reviewed by EU users. This is an EU-related subset, not a Canadian business sample.',
 'numeric_fields':list(fields),'summary':summary,'reconciliation':ledger,
 'notes':[
  'Blank source cells are null, not zero. Parent and child rows must not be added together.',
  'source_record numbers identify logical CSV records, with the header as record 1; physical line numbers differ because the source contains multiline cells.',
  'Source total items exceed the sum of numeric parent-category items by 1,639. Two parent-versus-child differences are 1,381 (speech) and 258 (scams/fraud). Their sum matches that residual; the source does not establish its operational cause.',
  'Source trusted-flagger totals report zero items and zero terms actions; the intellectual-property category and copyright subcategory each show one. The category and its child describe the same hierarchy, not two extra events.',
  'The harmful/illegal username/profile-picture row retains its invalid source end date, 2025-12-32. Report scope uses the identification file and cover, which give 2025-12-31.',
  'Actions are reported counts, not linked per-notice success outcomes. Ratios are labelled arithmetic count ratios, not removal probabilities.',
  'Median time is reported in hours in the source total-row context. A median is not a deadline, mean or service guarantee.',
  'The source includes notices concerning usernames/profile pictures, so not every row should be described as review-text removals.'
 ],'rows':rows}
(ROOT/'trustpilot-notices-2025.json').write_text(json.dumps(dataset,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
csv_fields=['source_record','row_type','category_code','parent_category','subcategory_description','reporting_period_original',*fields]
def write_csv(filename, columns, records):
    with (ROOT/filename).open('w',encoding='utf-8',newline='') as handle:
        writer=csv.DictWriter(handle,fieldnames=columns,extrasaction='ignore')
        writer.writeheader(); writer.writerows(records)
write_csv('trustpilot-notices-2025.csv',csv_fields,rows)
write_csv('trustpilot-notice-reconciliation-2025.csv',list(ledger[0]),ledger)
descriptions={
 'source_record':'Logical record number in the source CSV; the header is record 1. Not a physical line number.',
 'row_type':'total, category or subcategory. Parent and subcategory rows must not be added together.',
 'category_code':'Original source taxonomy code; KEYWORD_OTHER repeats under different parent categories.',
 'parent_category':'Original parent-category code for a subcategory; null for totals and parent rows.',
 'subcategory_description':'Original source label, including any source spelling errors; blank labels remain null.',
 'reporting_period_original':'Original source period string, including the preserved invalid 2025-12-32 end date in one row.',
 'notices':'Reported count of notices received; not a count of confirmed fake reviews.',
 'trusted_notices':'Reported trusted-flagger notice count, kept separate from the ordinary fields.',
 'items':'Reported count of specific items of information; parent/subcategory totals do not all reconcile.',
 'trusted_items':'Reported trusted-flagger item count; source total differs from the category field.',
 'median_hours':'Reported median time to take action, in hours; not an arithmetic mean or a deadline.',
 'trusted_median_hours':'Reported median action time for trusted-flagger notices, in hours.',
 'law_actions':'Reported count of actions taken on the basis of law.',
 'trusted_law_actions':'Reported law-basis action count for trusted-flagger notices.',
 'terms_actions':'Reported terms-based action count; not matched notice-level removal outcomes.',
 'trusted_terms_actions':'Reported terms-based action count for trusted-flagger notices; source total differs from category field.'}
metadata={'@context':'http://www.w3.org/ns/csvw','url':'https://reviewsboost.ca/trustpilot-notices-2025.csv',
 'dc:title':dataset['title'],'dc:description':dataset['geographic_scope'],
 'dc:license':dataset['license'],
 'tableSchema':{'columns':[{'name':name,'datatype':'integer' if name in fields or name=='source_record' else 'string','null':[''],
                          'dc:description':descriptions[name]} for name in csv_fields]}}
(ROOT/'trustpilot-notices-2025.csv-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n',encoding='utf-8')
(ROOT/'trustpilot-review-reporting-statistics.bib').write_text('@misc{reviewsboost2026trustpilotnotices,\n  author = {{ReviewsBoost Editorial Team}},\n  title = {Trustpilot review reporting statistics: a 2025 notice-table audit},\n  year = {2026},\n  month = {October},\n  version = {1.0},\n  url = {'+PAGE+'},\n  note = {Original source-table reconciliation of EU-related Trustpilot disclosures; reporting period 17 February--31 December 2025}\n}\n',encoding='utf-8')
(ROOT/'trustpilot-review-reporting-statistics.cff').write_text('cff-version: 1.2.0\nmessage: "Cite this original source-table audit; attribute the underlying counts to Trustpilot."\ntitle: "Trustpilot review reporting statistics: a 2025 notice-table audit"\nversion: "1.0"\ndate-released: "2026-10-08"\ntype: dataset\nurl: "'+PAGE+'"\nauthors:\n  - name: "ReviewsBoost Editorial Team"\nlicense: CC-BY-4.0\n',encoding='utf-8')
print(json.dumps(summary,indent=2))
