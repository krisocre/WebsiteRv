# Trustpilot notice-table research — October 8, 2026

Target website: ReviewsBoost, `https://reviewsboost.ca/`.
Article: `trustpilot-review-reporting-statistics.html`.

## Editorial contribution

Original normalization and arithmetic reconciliation of 92 records from Trustpilot's
February 17–December 31, 2025 DSA notice table, published February 28, 2026.
The source covers reviews involving EU businesses or EU users. It does not establish
Canadian city statistics, client results, a matched removal success rate or future
service timelines. Original compilation, calculations, code and figures: CC BY 4.0;
Trustpilot retains rights in external source material.

The article locates a 1,639-item difference between numeric parent-category cells
and the source total: 1,381 in the speech hierarchy and 258 in scams/fraud. It retains
an invalid source date and trusted-flagger discrepancies without inventing causes.
Notices, items and actions are separate metrics. Blank cells remain null.

## Primary sources

- Report landing page: https://corporate.trustpilot.com/legal
- Source archive: https://assets.ctfassets.net/wonkqgvit51x/43veQxX63SCvDEmqXyHqQi/bf51839da2bdb697209a16ceabb18434/Trustpilot_DSA_Transparency_Report.zip
- Current decision-email workflow: https://business.trustpilot.com/blog/releases-and-updates/changes-to-flagged-review-emails
- Reporting process: https://help.trustpilot.com/s/article/What-happens-after-businesses-flag-reviews?language=en_US

Source fingerprints and dates are embedded in the public JSON. A changed source
fails the extraction until a human checks the new version and updates the audit.

## Reproduction and checks

From this repository, with Python, Matplotlib and Node installed:

```text
python build-trustpilot-notice-data.py
node audit-trustpilot-notices.mjs
python plot-trustpilot-notices.py
python build-trustpilot-notice-article.py
node seo-audit.mjs
git diff --check
```

The builder needs network access. It writes source CSVs into `research-sources/`,
which is ignored by Git and excluded from the published Jekyll build. Public CSV,
JSON, CSVW metadata, reconciliation, BibTeX and CFF files accompany the article.
The independent Node audit checks totals, hierarchy, retained anomalies, source
fingerprints when available, and every CSV cell against the normalized JSON.

## Discovery and launch

Added contextual links from the Learning Centre, homepage and Trustpilot service
page; Article, Dataset and Breadcrumb structured data; canonical and sharing
metadata; citation metadata; descriptive image alternatives; four image-sitemap
entries; RSS and the resource index. This supports discovery and reuse without
claiming guaranteed Google/Bing rankings, rich results or third-party citations.

Changes are local until the website is deployed. After deployment, verify the
article, four figure URLs and downloads return successfully; use the owner's
Google Search Console and Bing Webmaster Tools to check discovery/indexing.
Update the source-check date only after reviewing the cited sources again.
