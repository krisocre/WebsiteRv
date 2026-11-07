"""Reproduce ReviewsBoost's paired sentiment audit; never export reviewer text.

Python 3.12; nltk==3.9.4. Run with --download once to fetch the two public
sources into an ignored/private cache, then run offline. CSV releases are
aggregates, not additional independent reviews. See the article for scope.
"""
from pathlib import Path
from collections import Counter, defaultdict
from statistics import mean, median
import argparse
import csv
import hashlib
import inspect
import json
import math
import platform
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parent
CACHE = ROOT / '.seo-private' / 'google-star-text-study-2026-11-07'
DATE = '2026-11-07'
VERSION = '1.0.0'
PAGE = 'google-review-sentiment-preprocessing-study.html'
ORIGIN = 'https://reviewsboost.ca/'
SOURCE_DOI = 'https://doi.org/10.5281/zenodo.18594870'
SOURCE_URL = ('https://zenodo.org/api/records/18594870/files/Academic%20Library%20'
              'User%20Perception%20A%20VADER-Enhanced%20Corpus%20of%207,605%20'
              'Google%20Maps%20Reviews.xlsx/content')
WORKBOOK_SHA = '62337cb2b304f7fbdbdd5ce646fa817eea3bb830ab37a872a29c1b45cde8bc8f'
LEXICON_URL = 'https://raw.githubusercontent.com/nltk/nltk_data/gh-pages/packages/sentiment/vader_lexicon.zip'
LEXICON_ZIP_SHA = '8adba4294eef3964d820bf655e37e61bdc3a341994356af59b74fb3b4a36ce5c'
LEXICON_SHA = '0aabac74cd95def2dbedc04ce55e39698d91113ffadb6d86b87dd337c4d2184d'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
LABELS = ('negative', 'neutral', 'positive')


def sha(data):
    return hashlib.sha256(data).hexdigest()


def checked_file(name, url, digest, download):
    file = CACHE / name
    if not file.exists():
        if not download:
            raise SystemExit(f'Missing {file.name}; run with --download to fetch the public source.')
        with urllib.request.urlopen(url, timeout=60) as response:
            content = response.read()
        if sha(content) != digest:
            raise SystemExit(f'Source checksum changed: {name}. Review the new version before using it.')
        CACHE.mkdir(parents=True, exist_ok=True)
        file.write_bytes(content)
    if sha(file.read_bytes()) != digest:
        raise SystemExit(f'Checksum mismatch: {name}')
    return file


def read_workbook(file):
    """Read cell values, not Excel formula code; no third-party Excel reader."""
    with zipfile.ZipFile(file) as archive:
        shared = ET.fromstring(archive.read('xl/sharedStrings.xml'))
        strings = [''.join(t.text or '' for t in node.findall('.//s:t', NS))
                   for node in shared.findall('s:si', NS)]
        sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        result = []
        for row in sheet.findall('s:sheetData/s:row', NS):
            values = {}
            for cell in row.findall('s:c', NS):
                value = cell.find('s:v', NS)
                value = value.text if value is not None else None
                if cell.get('t') == 's' and value is not None:
                    value = strings[int(value)]
                elif cell.get('t') == 'inlineStr':
                    value = ''.join(t.text or '' for t in cell.findall('.//s:t', NS))
                values[''.join(c for c in cell.get('r') if c.isalpha())] = value
            result.append((int(row.get('r')), values))
        header = result.pop(0)[1]
        return [(number, {header[col]: value for col, value in cells.items()})
                for number, cells in result]


def label(score, threshold=.05):
    return 'positive' if score >= threshold else 'negative' if score <= -threshold else 'neutral'


def pct(count, denominator):
    return 100 * count / denominator if denominator else 0


def write_csv(file, rows):
    with (ROOT / file).open('w', encoding='utf-8', newline='') as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]), lineterminator='\n')
        writer.writeheader()
        writer.writerows(rows)


def build(download=False):
    import nltk
    import nltk.sentiment.vader as vader_module
    from nltk.sentiment.vader import SentimentIntensityAnalyzer
    if nltk.__version__ != '3.9.4':
        raise SystemExit('This release uses nltk==3.9.4; install the pinned research dependency.')
    workbook = checked_file('source.xlsx', SOURCE_URL, WORKBOOK_SHA, download)
    lexicon_zip = checked_file('vader_lexicon.zip', LEXICON_URL, LEXICON_ZIP_SHA, download)
    with zipfile.ZipFile(lexicon_zip) as archive:
        content = archive.read('vader_lexicon/vader_lexicon.txt')
    if sha(content) != LEXICON_SHA:
        raise SystemExit('Unexpected VADER lexicon content.')
    lexicon = CACHE / 'vader_lexicon.txt'
    lexicon.write_bytes(content)
    scorer = SentimentIntensityAnalyzer(lexicon_file=lexicon.resolve().as_uri())
    physical = read_workbook(workbook)
    records, score_only, invalid, seen = [], 0, [], set()
    for number, row in physical:
        # A score-only trailing row is not a review. The workbook title count
        # and aggregate business "rating" column are not sample denominators.
        if not row.get('review_id') and not row.get('google_id') and row.get('review_rating') is None:
            nonempty = {key for key, value in row.items() if value is not None and str(value).strip()}
            if nonempty <= {'Sentiment Score Compound'}:
                score_only += 1
                continue
        try:
            stars = float(row['review_rating'])
            english = (row.get('Google Translation') or '').strip()
            processed = (row.get('Processed Text') or '').strip()
            key = (row.get('google_id'), row.get('review_id'))
            if not key[0] or not key[1] or key in seen:
                raise ValueError('Missing or duplicate source identity')
            if stars not in (1, 2, 3, 4, 5) or not english or not processed:
                raise ValueError('Missing paired text or invalid review star rating')
            seen.add(key)
            english_score = scorer.polarity_scores(english)['compound']
            processed_score = scorer.polarity_scores(processed)['compound']
            if not all(math.isfinite(v) and -1 <= v <= 1 for v in (english_score, processed_score)):
                raise ValueError('Invalid rescored value')
            records.append({'library': key[0], 'stars': int(stars),
                            'english_score': english_score, 'processed_score': processed_score,
                            'year': int(float(row['Year']))})
        except (KeyError, TypeError, ValueError) as error:
            invalid.append({'source_row': number, 'reason': str(error)})
    if invalid:
        raise SystemExit('Unexpected source exclusions; review privately before publishing: ' + repr(invalid))
    n = len(records)
    libraries = defaultdict(list)
    for row in records:
        libraries[row['library']].append(row)
    matrix = Counter((label(r['english_score']), label(r['processed_score'])) for r in records)
    transitions = []
    for before in LABELS:
        denominator = sum(matrix[before, after] for after in LABELS)
        for after in LABELS:
            count = matrix[before, after]
            transitions.append({'english_label': before, 'processed_label': after,
                                'review_count': count, 'english_label_denominator': denominator,
                                'row_percent': round(pct(count, denominator), 6),
                                'all_review_percent': round(pct(count, n), 6)})
    rating_rows = []
    for stars in range(1, 6):
        group = [r for r in records if r['stars'] == stars]
        changed = sum(label(r['english_score']) != label(r['processed_score']) for r in group)
        direct = sum({label(r['english_score']), label(r['processed_score'])} == {'negative', 'positive'} for r in group)
        result = {'stars': stars, 'reviews': len(group), 'changed_labels': changed,
                  'changed_percent': round(pct(changed, len(group)), 6),
                  'direct_opposite_labels': direct}
        for field in ('english', 'processed'):
            for sentiment in LABELS:
                result[field + '_' + sentiment] = sum(label(r[field + '_score']) == sentiment for r in group)
        rating_rows.append(result)
    thresholds = []
    for point in range(1, 51):
        threshold = point / 100
        changed = sum(label(r['english_score'], threshold) != label(r['processed_score'], threshold) for r in records)
        direct = sum({label(r['english_score'], threshold), label(r['processed_score'], threshold)} == {'negative', 'positive'} for r in records)
        thresholds.append({'absolute_cutoff': threshold, 'reviews': n,
                           'changed_labels': changed, 'changed_percent': round(pct(changed, n), 6),
                           'direct_opposite_labels': direct, 'direct_opposite_percent': round(pct(direct, n), 6)})
    weighted = []
    for scope, condition in [('all', lambda r: True),
                             *[(f'{star}_star', lambda r, s=star: r['stars'] == s) for star in range(1, 6)],
                             ('1_2_stars', lambda r: r['stars'] <= 2),
                             ('4_5_stars', lambda r: r['stars'] >= 4)]:
        sample = [r for r in records if condition(r)]
        library_rates = []
        for group in libraries.values():
            eligible = [r for r in group if condition(r)]
            if eligible:
                library_rates.append(pct(sum(label(r['english_score']) != label(r['processed_score']) for r in eligible), len(eligible)))
        changed = sum(label(r['english_score']) != label(r['processed_score']) for r in sample)
        weighted.append({'scope': scope, 'reviews': len(sample), 'eligible_libraries': len(library_rates),
                         'changed_labels': changed, 'review_weighted_percent': round(pct(changed, len(sample)), 6),
                         'equal_library_mean_percent': round(mean(library_rates), 6),
                         'library_median_percent': round(median(library_rates), 6)})
    audit = [
        ('source_title_count', 7605, 'title-declared reviews', 'Repository title; not used as the observed denominator.'),
        ('worksheet_rows_after_header', len(physical), 'worksheet rows', 'All XML row elements after the header, including score-only rows.'),
        ('score_only_rows_excluded', score_only, 'worksheet rows', 'No review/business ID or review star rating; only the sentiment field is populated.'),
        ('paired_review_records', n, 'reviews', 'Unique business/review keys with integer 1-5 stars and both non-empty text fields.'),
        ('title_minus_paired_records', 7605 - n, 'records difference', 'Unreconciled title/sample gap; not labelled as removed or fake reviews.'),
        ('distinct_libraries', len(libraries), 'library profiles', 'Distinct source google_id values; no institution or reviewer identifiers exported.'),
        ('model_evaluations', n * 2, 'deterministic model evaluations', 'Two stored text representations per eligible review; not twice as many reviews.'),
        ('first_review_year', min(r['year'] for r in records), 'source year', 'From the source Year column.'),
        ('last_review_year', max(r['year'] for r in records), 'source year', 'From the source Year column.'),
        ('smallest_library_sample', min(map(len, libraries.values())), 'review records', 'Smallest eligible source library group.'),
        ('largest_library_sample', max(map(len, libraries.values())), 'review records', 'Largest eligible source library group.'),
    ]
    audit_rows = [dict(metric=k, value=v, unit=u, definition=d) for k, v, u, d in audit]
    files = {
        'google-sentiment-polarity-transitions.csv': transitions,
        'google-sentiment-rating-strata.csv': rating_rows,
        'google-sentiment-threshold-sensitivity.csv': thresholds,
        'google-sentiment-library-weights.csv': weighted,
        'google-sentiment-data-audit.csv': audit_rows,
    }
    for file, data in files.items():
        write_csv(file, data)
    changed = sum(r['changed_labels'] for r in rating_rows)
    direct = sum(r['direct_opposite_labels'] for r in rating_rows)
    report = {
        'title': 'Google review sentiment: a paired text-field reanalysis', 'version': VERSION,
        'date': DATE, 'article': ORIGIN + PAGE, 'license': 'https://creativecommons.org/licenses/by/4.0/',
        'creator': 'ReviewsBoost Editorial Team',
        'source': {'creator': 'Ioannis C. Drivas', 'doi': SOURCE_DOI,
                   'title': 'Academic Libraries User Perception: A VADER-Enhanced Corpus of 7,605 Google Maps Reviews',
                   'publication_date_declared': '2025-09-10', 'repository_record_created': '2026-02-10',
                   'version': 'v1', 'license': 'CC BY 4.0', 'workbook_url': SOURCE_URL,
                   'workbook_sha256': WORKBOOK_SHA, 'workbook_md5': '07a6f254b04b1bb821cc3ec304067fb1',
                   'collection_window_as_described': 'March-July 2025',
                   'geography_as_described': 'Academic libraries worldwide; not a representative Canadian business sample'},
        'method': {'python': platform.python_version(), 'nltk': nltk.__version__,
                   'vader_module_sha256': sha(Path(inspect.getfile(vader_module)).read_bytes()),
                   'lexicon_url': LEXICON_URL, 'lexicon_zip_sha256': LEXICON_ZIP_SHA, 'lexicon_sha256': LEXICON_SHA,
                   'text_fields': ['Google Translation', 'Processed Text'],
                   'star_field': 'review_rating (not the business aggregate rating field)',
                   'classification': 'positive >= +0.05; negative <= -0.05; neutral strictly between',
                   'source_compound_field_used': False,
                   'notes': ['No new translation, text cleaning, author identification or fake-review labelling.',
                             'Each pair uses the same NLTK scorer/lexicon; only the stored input field changes.',
                             'Threshold sensitivity reuses the same 7,015 records; no new independent observations.',
                             'Library-balanced percentages average eligible within-library rates, not individual reviews.',
                             'No removal decisions, customer results, Canada-wide prevalence or accuracy labels are observed.']},
        'summary': {'reviews': n, 'libraries': len(libraries), 'changed_labels': changed,
                    'changed_percent': pct(changed, n), 'direct_opposite_labels': direct,
                    'direct_opposite_percent': pct(direct, n), 'unchanged_labels': n - changed,
                    'neutral_boundary_changes': changed - direct},
        'transitions': transitions, 'rating_strata': rating_rows, 'threshold_sensitivity': thresholds,
        'library_weights': weighted, 'data_audit': audit_rows,
        'distributions': [{'file': file, 'rows': len(data), 'sha256': sha((ROOT / file).read_bytes())}
                          for file, data in files.items()],
    }
    (ROOT / 'google-review-sentiment-study.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(report['summary']))
    return report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--download', action='store_true', help='Fetch checksum-pinned public source files when absent.')
    build(parser.parse_args().download)
