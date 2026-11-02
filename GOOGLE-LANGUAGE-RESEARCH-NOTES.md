# ReviewsBoost language/accuracy research — November 2, 2026

Article: `/google-review-removal-language-study.html`. Version 1.0.
This notes file is excluded from publication.

## Original contribution and scope

52 publisher-reported language estimates from Google's February/August 2025
DSA reports are joined into 26 historical temporal matches and 650 unordered
within-period interval comparisons. This is a new secondary compilation and
geometry analysis, not a new sample of reviews or client results. Source periods
are July–December 2024 and January–June 2025; newer releases exist. EEA all-content
accuracy must not be described as Canadian review-removal odds.

English/French point ordering changes from an English-minus-French gap of −7 to
+5 percentage points. Both within-period printed intervals overlap. Across
periods, 23 point estimates are lower, one higher and two unchanged. All 26
temporal interval pairs overlap (24) or touch (2) at printed whole-percentage
precision. The Irish/Maltese endpoint contacts do not establish exact contacts
between unknown unrounded intervals. No significance/equivalence test is made.

Within-period relationships are 311 overlapping / 5 touching / 9 separated for
2024H2 and 288 / 1 / 36 for 2025H1. Those are deterministic, dependent pair
calculations, not additional observations, accuracy errors or independent tests.
Two explicitly labelled 100-item binary toy examples show the non-identifiability
of wrong-removal shares from an accuracy scalar. They are not Google data and
are not counted in the 52 source estimates.

## Evidence and methods

Both original PDFs and extracted text were captured privately under the ignored
research-sources/maps-language-2026-11-02 directory. All four table pages were
visually inspected. Public source inputs include table/printed/PDF page numbers,
URLs, exact values and PDF SHA-256 fingerprints. Text hashes normalize universal
newlines to LF before UTF-8 encoding, avoiding a Windows line-ending mismatch.

The independent audit checks the interval classification with enumerated integer
ticks rather than the builder's endpoint formula, verifies CSV/JSON/CSVW parity,
and checks optional local PDF/text captures. It does not independently validate
Google's human labels or reconstruct sample sizes/covariance. No per-language
pooled accuracy, p-values, removal probabilities or invented Canadian cohort.

Primary metric context is linked to Google's ML documentation and Saito and
Rehmsmeier (2015); the paper is not presented as Google-specific validation.
Google's reporting guidance supplies the separate practical removal route.
The article discloses commercial interest, authorship, historical scope and limits.

## Reproduce and verify

```text
python build-google-maps-language-data.py
python audit-google-maps-language-data.py
python plot-google-maps-language-study.py
python build-google-maps-language-article.py
node tests/language-study.cjs
node tests/build.cjs
node tests/homepage.cjs
node seo-audit.mjs
```

Compilation/arithmetic use the standard library. Plotting requires Matplotlib.
The article builder also updates its blog feature/ItemList, homepage and policy
contextual links, RSS and sitemap idempotently. It does not deploy, change service
prices/forms, or rewrite existing canonical URLs or page titles/descriptions.
Original figures have explicit dimensions, readable captions, lazy loading and
matching accessible tables. SVG and PNG versions, three CSVs/CSVW definitions,
complete JSON, input provenance, code, BibTeX and CFF are downloadable.

The homepage regression check now focuses on its own canonical and functional
behavior instead of freezing every other HTML document against an older Git
commit. The site-wide SEO audit continues to check all pages, including this one.
The new article uses the existing article-shell/prose layout classes, with
SVG glyphs embedded to keep graph typography independent of installed fonts.
Testing also exposed a one-character line-ending drift in the prepared
measurement installer after Python regenerated Windows HTML. Its enabled path
now normalizes newlines before insertion; the unconfigured path remains a no-op.
The regression assertion compares hashes to avoid dumping whole pages on failure.

## Analytics follow-up

The latest supplied download was reviewsboost.ca-Performance-on-Search-2026-11-02,
a Google Search Console export with observations from September 2 to October 31.
It has search performance, not a GA4 Measurement ID/GTM container/Ads label.
No tracking ID was invented or activated. Those account aggregates remain
private and are not inputs to the public research release. The existing
MEASUREMENT-SETUP.md records this inspection.

Changes and validation results for this task are recorded under the ignored
.seo-private/language-study-2026-11-02 directory. Prior homepage/measurement work
and the user's intervening Git commit are preserved. No push, deployment, live
form submission or account change is part of this release.
