"""Reproduce ReviewsBoost's aggregate extortion audit (v1.0.0, 2026-11-13).

Python 3 standard library only. --download fetches the pinned public CAFC CSV
into an ignored research cache. Outputs contain aggregates, never complaint IDs.
This is broader extortion reporting, not a Google-review or business-only sample.
"""
from pathlib import Path
from collections import Counter, defaultdict
from decimal import Decimal
import argparse
import csv
import hashlib
import json
import urllib.request

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / 'research-sources/extortion-2026-11-13'
SOURCE_URL = 'https://open.canada.ca/data/dataset/6a09c998-cddb-4a22-beff-4dca67ab892f/resource/43c67af5-e598-4a9b-a484-fe1cb5d775b5/download/cafc-open-gouv-database-2021-01-01-to-2025-09-30-extracted-2025-10-01.csv'
SOURCE_SHA = 'c46f61591da71eadd91c3e47ed3e3cb8102880a8861c027ab7a35182c8bd719c'
CATALOG = 'https://open.canada.ca/data/dataset/6a09c998-cddb-4a22-beff-4dca67ab892f'
DEFINITIONS = 'https://open.canada.ca/data/dataset/6a09c998-cddb-4a22-beff-4dca67ab892f/resource/ec49223e-d746-4171-a97b-12fcc79d360f/download/annex-e_open-government-statistics-description-and-associated-definitions.pdf'


def percent(n, d):
    return round(100 * n / d, 6) if d else None


def write_csv(name, rows):
    with (ROOT / name).open('w', encoding='utf-8', newline='') as output:
        writer = csv.DictWriter(output, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true')
    args = parser.parse_args()
    source = CACHE / 'source.csv'
    if not source.exists():
        if not args.download:
            raise SystemExit('Public source missing; run with --download first.')
        CACHE.mkdir(parents=True, exist_ok=True)
        source.write_bytes(urllib.request.urlopen(SOURCE_URL, timeout=90).read())
    if hashlib.sha256(source.read_bytes()).hexdigest() != SOURCE_SHA:
        raise SystemExit('Source changed. Audit the new release before updating the pinned SHA.')
    rows = []
    ids = set()
    source_count = 0
    canada_count = 0
    with source.open(encoding='utf-8-sig', newline='') as handle:
        reader = csv.DictReader(handle)
        fields = reader.fieldnames
        assert len(fields) == 21 and fields[1].startswith('Date Received / ')
        assert fields[-1].startswith('Dollar Loss /')
        for item in reader:
            source_count += 1
            assert item[fields[0]] not in ids, 'Duplicate source ID needs an explicit treatment.'
            ids.add(item[fields[0]])
            if item['Country'] != 'Canada':
                continue
            canada_count += 1
            if item['Fraud and Cybercrime Thematic Categories'] != 'Extortion':
                continue
            loss = Decimal(item[fields[-1]].replace('$', '').replace(',', ''))
            assert loss >= 0
            date = item[fields[1]]
            assert '2021-01-01' <= date <= '2025-09-30'
            # Only analytic fields are retained in memory; no IDs are exported.
            rows.append(dict(year=int(date[:4]), date=date, loss=loss,
                             status=item['Complaint Type'],
                             solicitation=item['Solicitation Method'],
                             intake=item['Complaint Received Type']))
    n = len(rows)
    assert source_count == 350361 and canada_count == 266553 and n == 22801
    zero = sum(row['loss'] == 0 for row in rows)
    victim = [row for row in rows if row['status'] == 'Victim']
    victim_zero = sum(row['loss'] == 0 for row in victim)
    annual = []
    for year in range(2021, 2026):
        group = [row for row in rows if row['year'] == year]
        z = sum(row['loss'] == 0 for row in group)
        annual.append(dict(year=year, period='Full calendar year' if year < 2025 else 'January-September only',
                           report_records=len(group), zero_recorded_loss=z,
                           positive_recorded_loss=len(group)-z, zero_loss_percent=percent(z, len(group)),
                           recorded_loss_cad=str(sum((row['loss'] for row in group), Decimal(0)))))
    cross = []
    for status in ['Attempt', 'Victim', 'Other/Unknown/Incomplete']:
        group = [row for row in rows if row['status'] == status or
                 status == 'Other/Unknown/Incomplete' and row['status'] in ['Other', 'Unknown', 'Incomplete']]
        for loss_class in ['Zero recorded loss', 'Positive recorded loss']:
            count = sum((row['loss'] == 0) == (loss_class == 'Zero recorded loss') for row in group)
            cross.append(dict(complaint_status=status, loss_class=loss_class, report_records=count,
                              status_denominator=len(group), share_within_status_percent=percent(count, len(group)),
                              selected_denominator=n))
    channels = []
    for field, label in [('solicitation', 'Solicitation Method'), ('intake', 'Complaint Received Type')]:
        for name, count in Counter(row[field] for row in rows).most_common():
            channels.append(dict(source_field=label, category=name, report_records=count,
                                 selected_denominator=n, share_percent=percent(count, n)))
    document = dict(
        title='Canadian-coded extortion reports: a zero-recorded-loss audit',
        creator='ReviewsBoost Editorial Team', version='1.0.0', published='2026-11-13',
        article_url='https://reviewsboost.ca/google-review-extortion-canada-data-study.html',
        licence='https://open.canada.ca/en/open-government-licence-canada',
        attribution='Contains information licensed under the Open Government Licence – Canada. Original aggregation and interpretation: ReviewsBoost.',
        sources=dict(catalogue=CATALOG, csv=SOURCE_URL, definitions=DEFINITIONS,
                     google_extortion='https://support.google.com/business/answer/16404809?hl=en',
                     google_reporting='https://support.google.com/business/answer/4596773?hl=en',
                     cafc_2026='https://antifraudcentre-centreantifraude.ca/features-vedette/2026/08/fraud-trends-tendances-matiere-fraude-eng.htm'),
        source_snapshot=dict(sha256=SOURCE_SHA, source_rows=source_count, columns=len(fields),
                             unique_source_ids=len(ids), catalogue_modified='2026-03-25',
                             nominal_window='2021-01-01/2025-09-30',
                             selected_min_date=min(row['date'] for row in rows),
                             selected_max_date=max(row['date'] for row in rows)),
        filters=dict(country_exact='Canada', thematic_category_exact='Extortion',
                     canada_coded_source_rows=canada_count, selected_records=n),
        findings=dict(zero_recorded_loss=zero, zero_loss_percent=percent(zero, n),
                      positive_recorded_loss=n-zero, victim_coded_records=len(victim),
                      victim_coded_zero_loss=victim_zero,
                      victim_coded_zero_loss_percent=percent(victim_zero, len(victim)),
                      attempt_coded_records=sum(row['status']=='Attempt' for row in rows)),
        limitations=[
            'These are broader extortion report records, not Google-review attacks or a business-only cohort.',
            'Country=Canada is an explicit filter; Canadian-nexus reports coded Not Specified are excluded.',
            'No field identifies Google, review removal, a specific review platform or removal outcomes.',
            'A zero in Dollar Loss is a recorded monetary amount, not a measurement of reputational harm or intent.',
            'Complaint Type is the publisher-provided status, not our determination of guilt, harm or identity.',
            'No business population or exposure denominator is available; no national incidence rate is estimated.',
            '2025 is a partial January-September export; do not compare its count with a full year as a growth rate.',
            'The source contains public reports with reporting/classification limits; no causal trend is inferred.',
            'No complaint IDs, individual dates, demographics or narrative text are republished.',
            'The separately cited 2026 bulletin is context, not additional rows in this older export.'
        ], annual=annual, status_loss=cross, channels=channels)
    assert zero == 20636 and victim_zero == 4328 and len(victim) == 6493
    assert sum(item['report_records'] for item in cross) == n
    write_csv('google-review-extortion-annual.csv', annual)
    write_csv('google-review-extortion-status-loss.csv', cross)
    write_csv('google-review-extortion-channels.csv', channels)
    (ROOT/'google-review-extortion-study.json').write_text(json.dumps(document, indent=2, ensure_ascii=False)+'\n', encoding='utf-8')
    print(f'Audited {source_count:,} source rows; published {n:,}-record scope in {len(annual)+len(cross)+len(channels)} aggregate rows.')


if __name__ == '__main__':
    main()
