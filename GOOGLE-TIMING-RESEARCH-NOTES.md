# Google removal timing research — October 24, 2026

Target: ReviewsBoost, `https://reviewsboost.ca/`.
Article: `google-review-removal-time-study.html`.

## Original contribution

A conditional calendar-window analysis of seven published creation-year cohort
aggregates, a duration-weighted reconciliation of six period means and two
explicitly synthetic 100-review examples. This is distinct from ReviewRemoval's
Google disclosure-denominator audit and from ReviewsBoost's existing rating and
moderation studies.

The primary source reports a selected deleted-review population. We have not
obtained review-level timestamps, censored observations, Canadian client results
or complete inclusion rules. Conditional bounds assume the represented deletion
events occurred within the stated tracking window. They do not prove that the
original study's claims are false or that detection did not improve.

The 31-day calendar flag is separate from the publisher's 30-day field. Strict
endpoints and inclusive zero lower bounds are preserved. The two synthetic rows
are never labelled as platform observations. The seven-review residual in the
weighted-average reconstruction is not evidence of lost records. Compatibility
with nearest-integer rounding is an explicit assumption, not a claim about the
publisher's undocumented rounding rule.

## Sources

- Localo original study and methodology: https://localo.com/blog/review-velocity-study
- Google report/appeal process: https://support.google.com/business/answer/4596773?hl=en
- NIST censoring background: https://www.itl.nist.gov/div898/handbook/apr/section1/apr131.htm

Source text and captured tables live under `research-sources/removal-time/`, which
is ignored by Git and excluded from the published Jekyll build. The public input
JSON includes a release capture fingerprint. A live check writes separate files
and does not overwrite the release capture.

## Reproduction

```text
python build-google-removal-time-data.py
node audit-google-removal-time-data.mjs
python plot-google-removal-time-study.py
python build-google-removal-time-article.py
node seo-audit.mjs
```

The plotting step requires Matplotlib. The optional
`node check-google-removal-time-source.cjs` requires Puppeteer and Chrome, and
checks current public table values without submitting data to the source site.
The independent audit checks calendar bounds, source values, synthetic medians,
weighted-period arithmetic and all CSV cells. With the source cache present it
also verifies the fingerprint and captured source table values.

## Discovery and verification

The article is featured in the Learning Centre and linked from the homepage.
Article, Dataset and Breadcrumb structured data, source citations, RSS, citation
metadata, reusable CSV/JSON, SVG/PNG figures and image sitemap entries accompany
the article. Dates are updated on the new article, blog and homepage only.

Original compilation, calculations and figures: CC BY 4.0. Source observations
remain attributed to Localo; external source material retains its rights.
Changes remain local until deployment. Verify the article and downloads after
publication and inspect discovery through the owner's Search Console account.
No ranking, third-party citation, case success rate or service timeline is promised.

### Research-page SEO additions (October 24, 2026)

The search title now describes the five-day-median finding. Article and Dataset
identifiers are connected, with explicit source derivation and named, licensed
downloads. Each of the three graphs has ImageObject metadata with dimensions,
caption, creator, credit and licence. All three CSVs now have downloadable column
definitions, including explicit synthetic-data labels. The Canadian pricing guide
and the timing answer in the FAQ link to the study in context. The source builders
retain these changes when regenerating the article and data.

After publication, inspect `google-review-removal-time-study.html` in Search Console
and Bing Webmaster Tools. Verify the live article, three graphs, dataset downloads
and RSS item, and use the existing sitemap for discovery. Assess subsequent query,
page and citation data rather than refreshing publication dates to imply new research.
