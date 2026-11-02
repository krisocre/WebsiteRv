# ReviewsBoost staff-name evidence audit

November 2, 2026. Article: `google-reviews-staff-names-study.html`.
This internal note is excluded from publication. No deployment or push.

## Contribution and scope

Original compilation of 15 attributed relative-rate rows (12 review-level,
three business-level) and four rounded review-flow rows from Reviewflowz and
Cartelis's October 2026 report. The source panel covers seven selected sectors
in the US and Europe excluding the UK, observed August 11–24, 2026. It contains
no identified Canadian cohort. We did not observe individual reviews, reproduce
the regressions or verify its name tagger independently.

Original outputs: transformations to relative percentage differences, three
explicit ratios of rounded means beside distinct adjusted source summaries,
three original chart pairs, and eight separately labelled constructed request
examples. These examples are editorial policy mappings, not observed campaigns,
Google enforcement decisions or legal certification. Source estimates share
data and are not independent experiments. No client outcomes or ranking promise.

The central distinction is between review content and the request preceding it.
A person-name tag does not identify solicitation, employment or consent. Google's
current policy restricts directed review content, including staff-identifying
requests. Study estimates cannot certify a request or prove that enforcement
does not occur. Google's separate personal-information rules and exceptions
remain relevant to actual review content.

The main within-business source ratio is 1.01 [0.91–1.11]. Its relative
percentage-difference scale is +1% [−9%, +11%], not percentage points. There is
no new equivalence or significance test. The raw and business-level comparisons
are preserved separately. The three nominal growth ratios are 121/63, 16/5 and
105/58, distinct from the source's adjusted 2.7, 2.4 and 2.0 summaries. Historical
gains and annualised two-week losses must not become an observed retention rate.

## Sources and checking

Primary PDF:
`https://www.reviewflowz.com/media/gone-in-7-days-google-review-deletion-study.pdf`

PDF SHA-256:
`5a68384cdf60ca74b2b88da90f9b427c69654c04a9daacb13ed4c9ca1089f107`

Original pages 3, 4, 23, 24 and 27 were visually inspected; page 26 supplies scope
and limitations. Public inputs retain labels and page locations. The source
landing page expressly permits reuse of numbers/charts with attribution; our
figures are newly plotted rather than copies of its artwork. Raw PDF, policy
HTML and rendered source pages remain under ignored
`research-sources/staff-names-2026-11-02/`. Google's policy/request pages were
checked November 2, 2026. GLiNER (Zaratiana et al., 2024) and Altman/Bland (1995)
are methodological context, not Google-specific validation.

## Reproduction

```
python build-google-staff-name-data.py
python audit-google-staff-name-data.py
python audit-google-staff-name-data.py --fetch
python plot-google-staff-name-study.py
python build-google-staff-name-article.py
node tests/build.cjs
node tests/homepage.cjs
node seo-audit.mjs
```

Compilation/audit use Python's standard library; chart generation uses local
Matplotlib. Source verification is optional via `--fetch` or `--pdf PATH`.
Compilation, CSVW, BibTeX/CFF and figure outputs are deterministic. The
independent audit does not import the builder and checks all values, arithmetic,
source fingerprint, record types and CSV/JSON/CSVW parity.

The new article builder updates its blog feature/ItemList, a short marked
homepage discovery paragraph, one contextual paragraph in the review-request
guide, RSS and image sitemap. Run it after older article builders to retain
the current featured study. It does not alter existing metadata, prices, forms,
tracking or canonical URLs. The previous language study stays linked and its
own source/data/article files remain intact.

Data distributions distinguish source rows, calculations and constructed
examples. Article, Dataset, BreadcrumbList and ImageObject metadata describe
visible content. Figures have explicit dimensions, lazy loading, embedded SVG
glyphs and accessible HTML data tables. Original compilation/calculations and
figures are CC BY 4.0; source publishers retain their underlying rights.

Private verification and the final per-file change report are under
`.seo-private/staff-names-2026-11-02/`. All form/analytics traffic is blocked or
mocked during browser checks; no real submissions, collection or account changes.
