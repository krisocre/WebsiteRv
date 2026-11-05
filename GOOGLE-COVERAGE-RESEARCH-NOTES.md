# ReviewsBoost Google review widget coverage audit

Prepared November 5, 2026. Article: `google-review-widget-coverage-study.html`.
Internal research/maintenance note; excluded from publication. No deployment.

## Contribution

An original secondary documentation audit and deterministic reference dataset:
12 attributed API/help facts, nine count-coverage bounds, 159 uniform-random
sampling scenarios, and 21 repeated-snapshot set-overlap envelopes. These are
189 constructed calculation rows, not 189 observed businesses. No customer
review records were collected or scraped. There is no Canadian field sample,
observed detection/removal rate, causal experiment or ranking test.

The five-record Places (New) cap and relevance ordering are verified in the
Place resource; the aggregate count includes ratings with and without text.
Count coverage must not be called text-review completeness. The GBP list method
allows up to 50 per requested page and continuation tokens for authorised
verified locations. Its default latest-modification ordering differs from
creation time. No claim applies the Places cap to every widget or integration.

Schoenmueller, Netzer and Stahl (2020), JMR 57(5), 853–877, is cited as context
on review-creation self-selection. We did not obtain or reanalyse that paper's
underlying 280m+ review records. Its dataset is not an input to our calculations.

All seven source captures are private under ignored
`research-sources/coverage-2026-11-05/`; public URLs, access dates, field locations
and SHA-256 fingerprints are in `google-review-coverage-sources.json`.

## Arithmetic and interpretation

- Coverage: `100 × min(5,N)/N`, assuming a complete five-record response.
- Miss model: `C(N−K,S)/C(N,S)`; exact fractions, then decimal formatting.
- Reference point: N=200, K=10, S=5 gives approximately 77.1715539% missed.
  Google relevance selection is not random, so this is not an empirical Google
  miss rate. Targets mean analyst-specified records, not fraud or negative stars.
- Refresh bounds: exactly five records per response, fixed population, T
  snapshots; unique records range from 5 to `min(N,5T)`. No time or independence
  assumption; the shaded area is not a confidence interval.
- GBP page arithmetic assumes a stable accessible collection and full pages;
  actual continuation tokens govern retrieval.
- Fraction components are decimal strings in JSON for precision beyond the
  JavaScript safe-integer range. CSVW declares integer columns for CSV readers.

## Reproduction

```
python build-google-review-coverage-data.py
python audit-google-review-coverage.py
python plot-google-review-coverage.py
python build-google-review-coverage-article.py
node tests/build.cjs
node seo-audit.mjs
```

Only plotting requires Matplotlib. The independent audit does not import the
builder: it uses sequential conditional products and exhaustive small-population
enumeration, checks every row, and validates CSV/JSON/CSVW parity and available
private capture hashes. `--capture` on the data builder explicitly refreshes
the private primary-source snapshots and fingerprints; it is not required to
rebuild from the published inputs and performs no Google review API queries.

The article builder updates its article, the blog feature and ItemList, RSS,
image sitemap and one contextual monitoring-service paragraph. It preserves
the previous featured study through a visible link and retains earlier blog
schema/feed entries. Run after older article builders to keep this article
featured. It does not modify the homepage, pricing, tracking or submissions.

Our original compilation, calculations and figures are CC BY 4.0; cited source
publishers retain their rights. No DOI, credentials, independent peer review,
customer result or search-position guarantee was invented.
