# ReviewsBoost Canadian extortion-data audit

Prepared November 13, 2026; release 1.0.0. Internal note excluded from hosting.
Article: google-review-extortion-canada-data-study.html. No deployment.

## Actual contribution and limits

Original secondary aggregation of a pinned CAFC public CSV: 350,361 unique-ID
source records, 266,553 with Country exactly Canada, and 22,801 also coded
Extortion. No Google-specific or reliable business-only cohort is identified.
No case narratives, complaint IDs, demographics or individual dates are released.

The 31 published aggregates comprise five annual rows, six status-by-loss cells
and twenty channel rows. The original CSV is a private development input under
research-sources/extortion-2026-11-13/, excluded by the existing hosting config
and Git ignore rules. It must not be copied into the public release.

- Zero recorded loss: 20,636 / 22,801 = 90.5% rounded.
- Victim-coded zero loss: 4,328 / 6,493 = 66.7% rounded.
- Attempt-coded: 16,109, all zero recorded loss.
- Other/Unknown/Incomplete: 193 + 5 + 1 = 199, pooled in the public status table.
- Positive-loss cells: 2,165. All are Victim-coded in this snapshot.
- Email as Solicitation Method: 6,626. Email as Complaint Received Type: 696.
  These are different questions within the same selected-record universe.

Money is parsed with Decimal. No inflation, incidence, review-removal success,
causal trend, attack prevalence or probability for a Canadian business is inferred.
Zero recorded financial loss is not treated as a measurement of reputational harm.
Source-coded Victim is retained, without deciding criminal guilt or case validity.

The nominal export window is 2021-01-01 to 2025-09-30; selected observed dates
range from 2021-01-02 through 2025-09-29. 2025 is partial. A 2026 catalogue edit
is not a 2026 observation date. The separately linked CAFC first-half 2026 bulletin
is context only and is not merged into the CSV series. No annualised growth rate.

## Provenance

Dataset: https://open.canada.ca/data/dataset/6a09c998-cddb-4a22-beff-4dca67ab892f
Catalogue API: https://open.canada.ca/data/en/api/3/action/package_show?id=6a09c998-cddb-4a22-beff-4dca67ab892f
CSV resource: 43c67af5-e598-4a9b-a484-fe1cb5d775b5, extracted 2025-10-01.
CSV SHA-256: c46f61591da71eadd91c3e47ed3e3cb8102880a8861c027ab7a35182c8bd719c
English definitions SHA-256: e1e0dcf5f309df5a421627566eb8a6cd9988c0dc7aba9e8518c75e7ca1770991
Catalogue metadata_modified: 2026-03-25. Source checked November 13, 2026.

The public catalogue page returned 403 to the web retrieval tool, but its official
API and actual CSV/PDF resource downloads succeeded. Numeric analysis uses those
downloads, not search snippets. Source notes and terms identify Open Government
Licence – Canada. Article attribution credits CAFC/RCMP and disclaims endorsement.
The English field meanings were checked against the downloaded definitions PDF.

Google's direct reporting guidance was opened and checked:
https://support.google.com/business/answer/16404809?hl=en
https://support.google.com/business/answer/4596773?hl=en
It supports separating direct removal-related demands from ordinary review
reports, preserving evidence privately and avoiding payment to malicious parties.
Only the brief non-payment instruction is quoted; no full help article is copied.

Current context, not a numeric input:
https://antifraudcentre-centreantifraude.ca/features-vedette/2026/08/fraud-trends-tendances-matiere-fraude-eng.htm

## Reproduction and maintenance

python google-review-extortion-analysis.py --download
python plot-google-extortion-study.py
python build-google-extortion-article.py
node install-measurement.cjs

The data script needs only Python 3's standard library and enforces the pinned
checksum. Matplotlib is a development dependency for optional figure regeneration.
The website uses checked-in static HTML/SVG/PNG/CSV/JSON; no runtime data fetch,
new framework, tracking destination or contact integration is introduced.

The builder changes only this article, one card/ItemList entry in the existing
blog grid, its RSS entry and image-sitemap discovery. It is intended to be
repeatable without changing the homepage, forms, prior article text or metadata.
Any future source revision needs a new reviewed hash, data version and updated
article, graphs and provenance. Do not silently accept a replaced source file.

No fake expert byline, empirical Google dataset, customer outcome, credential,
testimonial, ranking or citation guarantee is added. The byline is the existing
editorial organization. Text was edited directly for clarity and a natural voice;
no humanizer or detector-evasion service was used.
