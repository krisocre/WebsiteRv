# ReviewsBoost.ca service retirement audit

November 24, 2026

ReviewsBoost offers managed Google review removal and related tools for Canadian businesses. The homepage establishes that scope and presents the existing fees of CAD $45 upfront per accepted review and $95 per successful removal. The audit covered all 33 current canonical pages, shared navigation, footers, structured data, service copy, sitemap, RSS and the public resource inventory. The live sitemap lists the same 33 pages, all with HTTP 200 and matching canonicals.

## Confirmed retirements

Direct HTTP requests to the seven removed URLs in repository history returned 404. Neither sitemap lists them, and no live sitemap page linked to them. The old content also stays out of the RSS feed. The archived source remains excluded from the website. The Google resources serve a different request, so the retired URLs retain their true 404 responses. [Google’s HTTP status guidance](https://developers.google.com/search/docs/crawling-indexing/http-network-errors)

| Former page | Live response |
| --- | ---: |
| `/remove-facebook-reviews.html` | 404 |
| `/remove-glassdoor-reviews.html` | 404 |
| `/remove-tripadvisor-reviews.html` | 404 |
| `/remove-trustpilot-reviews.html` | 404 |
| `/remove-yelp-reviews.html` | 404 |
| `/trustpilot-review-reporting-statistics.html` | 404 |
| `/yelp-review-removal-statistics.html` | 404 |

The additional Indeed and Sitejabber service-path probes also returned 404. The earlier Search Console impressions for these topics describe historical visibility.

## Changes and commercial intent

| Page or source | Change |
| --- | --- |
| `online-reputation-management.html` | Removed a remaining claim of managed review removal across major platforms. The opening copy and description now name Google review removal, monitoring and response planning for Toronto and Canadian businesses. The resource section links to the ReviewsBoost managed process. |
| `paid-google-review-removal.html` | Updated the title to **How Paid Google Review Removal Works in Canada**. The description now mentions the free assessment, written CAD quote and agreed work. Added contextual links to the free policy checker and appeal outline builder for customers who already filed a report. |
| `apply-commercial-seo.cjs` | Persists the current search and social metadata and corresponding service descriptions through a rebuild. |
| `tests/commercial-seo.cjs` | Expands the existing guard to catch retired directory links and general multi-platform offers. |
| `tests/gtm.cjs` | Accounts for Windows checkout line endings when checking installer idempotence. |
| `_config.yml`, this report | Excludes the audit from publishing. |

The homepage retains its existing title as the baseline for the separate CTR experiment. Pricing, calculator logic, security, analytics, Ads and form code remain in place. The existing resource structure connects the paid process with Canadian pricing, policy tools and reporting guides. Original studies, data downloads and citations retain their original paths.

## Follow-up

- `https://reviewsboost.ca/index.html` returns 200 and declares the HTTPS homepage as canonical. HTTP on the apex already redirects to HTTPS. If consolidating the duplicate homepage at the edge, use a host-scoped 301 from the exact `/index.html` path to `https://reviewsboost.ca/` and preserve the query string. This is a genuine equivalent, separate from the retired platform routes. [Google’s redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects)
- After publishing, verify the changed commercial pages in Search Console and compare Canadian impressions, qualified organic leads and like-for-like CTR. Keep old-platform impressions separate. The existing [CTR report](SEARCH-CTR-REVIEW.md) documents the comparison cohorts.

## Validation

The isolated build, SEO and service positioning checks passed for all 33 canonical URLs, including link and anchor resolution. The homepage and pricing calculator passed across five widths and both language versions. The measurement check passed for 37 page bootstraps, with mocked consent, Turnstile and confirmed lead conversion. The homepage, sitemap, RSS, robots and protected runtime files matched their pre-audit hashes. This work did not publish changes or send live leads.
