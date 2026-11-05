# ReviewsBoost.ca commercial SEO and service consolidation

November 5, 2026. Implemented locally; no deployment, commit, push, live customer submission or account configuration change.

## Outcome

Google review removal assistance for Canadian businesses is the primary service; Yelp is the only secondary review-removal service. Repositioned the permitted non-blog metadata, retired four unsupported public service offerings while preserving their exact source, corrected machine-readable service information, and fixed two pricing examples with the owner's separate permission. Existing national/city coverage, CAD $50 upfront + $90 successful-removal pricing, active forms, design, runtime scripts and the entire blog remain intact.

The main commercial page remains `/`. The existing `/remove-google-reviews.html` immediate redirect, noindex directive and canonical to `/` were preserved. It is an alias, not an independent indexable sales page. A separate competing service page was not created.

## Evidence from the latest Search Console download

Read-only source: `Downloads/reviewsboost.ca-Performance-on-Search-2026-11-05.zip`. Filter: Web, Last 3 months; exported chart rows actually cover September 2?November 3, 2026. Chart totals: 53 clicks and 1,592 impressions. This is a small baseline, not evidence of sales or a statistically established CTR problem.

| Export row | Clicks | Impressions | Average position / CTR |
|---|---:|---:|---|
| Homepage, all exported countries | 38 | 512 | 8.23 / 7.42% |
| Google removal cost guide | 4 | 165 | 30.64 / 2.42% |
| `pay to remove google reviews` query | 0 | 48 | 61.31 / 0% |
| `google review removal service` query | 0 | 6 | 12.33 / 0% |
| `google business review removal` query | 0 | 13 | 3.77 / 0% |
| `google review removal service cost` query | 1 | 5 | 4.60 / 20% |
| Canada country aggregate | 41 | 1,062 | 16.77 / 3.86% |
| Existing redirect alias `/remove-google-reviews.html` | 0 | 9 | 6.89 / 0% |

Page, query and country tables are separate aggregations; this export does not join each query to a page/country or prove conversion intent. Query rows omit some anonymised searches and do not sum to total clicks. The paid-removal queries support a commercial-assistance focus, but a position around 61 cannot be solved by promising a more persuasive snippet alone. No post-change organic improvement or paying-customer lift has been measured.

## Implemented metadata

| Homepage element | Before | After |
|---|---|---|
| Title | Google Review Removal Service in Canada | ReviewsBoost | Google Review Removal Service Canada | ReviewsBoost.ca |
| Description | Google review removal help for Canadian businesses, including Toronto. CAD $50 upfront per review + $90 if removed. Request a policy-based assessment. | Professional Google review removal assistance for Canadian businesses. Help with fake, spam and policy-violating reviews. Request a free assessment. |
| OG title/description | Same as old title/description | Same as new title/description |
| Twitter title/description | Same as old title/description | Same as new title/description |
| Canonical | https://reviewsboost.ca/ | Unchanged, exactly one |
| Robots/indexability | Existing index/follow rules | Unchanged |
| Visible H1 and body | Existing Google/Toronto/Canada page | Byte-for-byte unchanged |

The homepage Service remains priced at CAD $50 upfront with the CAD $90 conditional success fee explained in its Offer description. Provider identity, legitimate contact details and service areas remain intact. It now describes professional assessment, evidence, reporting and eligible follow-up without guaranteeing a platform decision. WebPage mainEntity points to this existing Google service. Its service ItemList now describes only Google first and Yelp second. No fake address, office, credentials, rating, testimonial, success rate or AggregateRating was added.

The Yelp page retains Yelp intent: `Yelp Review Removal Assistance Canada | ReviewsBoost`. Its previously generic Service type now explicitly describes Yelp assistance; metadata does not turn it into a Google keyword page. The French Google page has natural French commercial intent, accurate CAD fees and the original reciprocal language alternates. About metadata now describes the actual primary/secondary services and includes previously missing Twitter title/description fields. The reputation-management page keeps its distinct monitoring/response/recovery intent.

Title/snippet display and rankings remain search-engine decisions. Sources: [Google title links](https://developers.google.com/search/docs/appearance/title-link), [Google snippets](https://developers.google.com/search/docs/appearance/snippet), [structured-data accuracy](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

## Service availability and preserved implementations

Facebook, Tripadvisor, Trustpilot and Glassdoor services have `enabled:false` records in the new build-time catalogue. Their public URLs return availability pages locally with their existing self-canonicals, `noindex,follow`, no Service/Offer/FAQ sales markup, and no new-order forms. They link to the current Google/Yelp services and the unchanged contact process for earlier requests. No blanket or unrelated redirect was added.

Each original page, including its complete form, visible content, metadata and structured data, is saved byte-for-byte under `_retired/platform-services-2026-11-05/`. A manifest records hashes and disabled flags. The parent `_retired` directory was already excluded by Jekyll; no public page links to the archive. The original shared service-options snippet is also archived. No source was permanently deleted.

The sitemap now contains 31 rather than 35 URLs, solely because the four noindex discontinued-service URLs were removed. Every remaining sitemap entry, image/language reference and date is unchanged. `robots.txt` is unchanged so crawlers can still fetch the availability notices and see noindex. Sources: [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [Google redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects).

The original runtime `platform-removal.js`, contact scripts and Apps Script were deliberately **not** rewritten. Old backend integrations were not deployed or disabled. Public forms for discontinued services are archived with their page implementations; all four active Google/Yelp/French/contact forms are byte-for-byte unchanged. Backend rules for previously existing direct API requests remain outside this SEO task.

## Extra findings and changes from the code audit

- `llms.txt` still advertised six services with much older, platform-specific prices and an unqualified 1?2 week timeline. Its current service descriptions now match Google/Yelp availability, CAD $50 + $90 and policy-dependent outcomes. Research references remain. This is an accuracy/discovery correction; no Google ranking effect from llms.txt is claimed.
- About's service-scope paragraph advertised four discontinued platforms. The obsolete sentence is now Google-primary/Yelp-secondary. Its broader independence/trademark statement remains accurate and was retained.
- A reputation-management resource card still claimed six services and difficulty-adjusted fees. Its sentence now names Google/Yelp and the same CAD fee approach. No new CTA, design or form was introduced.
- The separate Google service URL was already a redirect with noindex and a homepage canonical. Its low independent traffic is consistent with its alias configuration. Reversing that consolidation would create a separate content/indexability decision, not a harmless hidden metadata fix.
- GA4 and Google Ads identifiers in `measurement-config.js` are all null; the existing production installer intentionally disables Google measurement without real configuration. Tracking preparation remains intact, but it currently cannot attribute organic visits to confirmed leads or paying customers. No ID was invented, copied from another brand or activated here.
- Apparent repeated stylesheet references include intended asynchronous/noscript fallback pairs. They were left intact; CSS, fonts and load behaviour were not changed based on an unverified performance assumption.

## Approved numeric corrections

The owner separately authorised pricing/number corrections while preserving style/design.

| Page | Old five-review / three-removal example | Correct example |
|---|---|---|
| Yelp | $150 upfront + $165 success = $315 | $250 upfront + $270 success = $520 CAD |
| French Google | 150 $ upfront + 120 $ success = 270 $ | 250 $ upfront + 270 $ success = 520 $ CA |

Only these verified numbers changed in those bodies. The homepage's one-review example was already correct. All other protected visible copy is unchanged. No customer rating, review count or outcome statistic was altered.

## Visual and functional validation

- Homepage body bytes match the pre-task baseline exactly. All CSS/font/image assets and existing frontend `.js` files match baseline hashes.
- Nine before/after full-page screenshot comparisons cover homepage, Yelp and French Google at 1440, 390 and 320 pixels. Homepage screenshots are identical. Yelp/French comparisons normalise only the separately approved price glyphs in the baseline response; their resulting pixels and dimensions match exactly. Original source snapshots/raw screenshots are retained privately. GPU-disabled browser capture was used to avoid offscreen border raster artefacts; production styles were untouched.
- All 18 blog/index/Article HTML files, every original research dataset/image/script and existing blog metadata match baseline hashes. Tools and FAQ/editorial pages outside the edited allowlist are also unchanged.
- All canonical values and existing redirect stubs are unchanged. Only the four discontinued pages' indexability changed deliberately. Source and locally served HTML both contain the intended final metadata and valid JSON-LD.
- Local HTTP/browser checks cover the three protected service pages and all four availability URLs. They return 200 locally with one H1/canonical, no overflow at desktop/mobile widths and no script exceptions. They do not prove the new state is live.
- `node tests/commercial-seo.cjs` with baseline: PASS (metadata/schema, prices, archives, sitemap, preserved files/bodies/forms/canonicals).
- `node tests/build.cjs`: PASS, two isolated commercial-policy/legal/measurement builds with identical outputs, unchanged source and generated-site SEO audit.
- `node seo-audit.mjs`: PASS across all 39 HTML files, including title/description uniqueness, heading/ID checks, canonical rules, language alternates, Open Graph, links/anchors, structured data, sitemap and robots.
- `node tests/homepage.cjs`: PASS, five widths, CTA/menu behaviour, section order, inline forms, estimates and native fallback.
- `node tests/enquiry-flow.cjs`: PASS, four active forms at desktop/mobile, encoded payloads, receipt handling, single-submit behaviour, failures and keyboard validation. Playwright Core from the ignored private test tooling was used; no production dependency was added.
- `node tests/measurement.cjs`: PASS, disabled production defaults, consent/privacy, ID/duplicate guards and confirmed-only conversion behaviour with fixture IDs.
- `node --test tests/submission.test.cjs`: PASS, all 15 backend/sender tests.
- Changed/new JavaScript build/test files checked with Node syntax validation; `git diff --check` used for whitespace. There is no configured package.json lint/build framework.

All provider/lead/conversion paths used mocks. No real customer lead, notification email or Google collection request was created. This does not verify live secrets, account credentials or a production Apps Script deployment. No live service ranking or sales result is claimed.

## Restriction conflicts left intentionally unchanged

The protected homepage still visibly advertises Facebook, Tripadvisor, Trustpilot and Glassdoor in its navigation/service cards. Existing Google/French/Yelp runtime-generated service cards also retain those names because their shared JavaScript and protected visible content must remain unchanged. Their destinations now clearly say the services are unavailable and cannot start a new order there. Removing those remaining links requires permission to change protected visible content or the shared service-options configuration.

Existing blog articles, navigation and CTAs may mention or link to retired services. These remain intact; known request/pricing/process fragments on the availability pages are preserved. Research references to other platforms are not presented as current services. No prohibited bulk replacement was performed.

Existing visible phrases such as broad removal promises and a typical timeframe were not rewritten under this SEO-only scope. The new metadata avoids creating additional promises. Stronger qualification of that copy would require a separate content approval.

## Risks and recommended follow-up

1. Disabling four services may reduce their existing organic impressions and clicks. The export includes real traffic to Trustpilot/Tripadvisor. This is an intentional relevance/business-scope change, not a guaranteed transfer of authority to Google pages. Noindex notices preserve URLs and visitor routes but do not promise to preserve their old rankings.
2. Hidden metadata changes cannot establish more paying customers. Use ReviewsBoost's own real analytics identifiers, consent flow and confirmed-lead definitions in a separately authorised measurement task, then reconcile accepted/paid cases with the existing private lead records. Do not transmit names, emails or review text to analytics.
3. After publication approval, inspect the homepage, Yelp, French and retired URLs in Search Console/Bing Webmaster Tools. Monitor Canadian commercial query groups and qualified/paid enquiries against the dated pre-release baseline; allow for indexing lag and the small sample. The changes have not been deployed.
4. Separately approve cleaning the remaining discontinued-service links from protected visible menus/cards. No design change is needed, but content/runtime configuration permission is required.
5. If a separate Google commercial page is wanted later, first approve a distinct useful content purpose and a deliberate change to the existing redirect/canonical strategy. The homepage and protected pricing article already serve different commercial needs; do not create a thin keyword variant.

## Every file modified or added in this task

Earlier unpublished research and the preceding pricing update were already present at baseline and are preserved. This manifest concerns this SEO task only.

- `COMMERCIAL-SEO-UPDATE.md` ? This file-by-file implementation/audit report; excluded from publication.
- `_config.yml` ? Exclude the build-time SEO tool and this internal report from public Jekyll output. Existing _retired/tests exclusions remain.
- `_retired/platform-services-2026-11-05/README.md` ? Explain excluded archive scope, restriction conflicts and the deliberate restoration procedure.
- `_retired/platform-services-2026-11-05/manifest.json` ? SHA-256 fingerprints and enabled:false records for four exact original service pages.
- `_retired/platform-services-2026-11-05/remove-facebook-reviews.html.txt` ? Exact original page source, including its forms, metadata and content; excluded from public deployment.
- `_retired/platform-services-2026-11-05/remove-glassdoor-reviews.html.txt` ? Exact original page source, including its forms, metadata and content; excluded from public deployment.
- `_retired/platform-services-2026-11-05/remove-tripadvisor-reviews.html.txt` ? Exact original page source, including its forms, metadata and content; excluded from public deployment.
- `_retired/platform-services-2026-11-05/remove-trustpilot-reviews.html.txt` ? Exact original page source, including its forms, metadata and content; excluded from public deployment.
- `_retired/platform-services-2026-11-05/shared-service-options.js.txt` ? Preserve the original shared service-options configuration without changing the protected runtime script.
- `about.html` ? Clarify Google-primary/Yelp-secondary metadata and the obsolete service-scope sentence; add missing Twitter title/description fields. Retain the independence statement and existing design.
- `apply-commercial-seo.cjs` ? New repeatable, scoped build-time metadata and availability policy. Enabled flags preserve inactive service configuration; no frontend JavaScript changes.
- `index.html` ? Head only: commercial Google/Canada title and description, matching social metadata, factual service/organisation descriptions, Google as WebPage mainEntity, and a two-service ItemList. Homepage body bytes unchanged.
- `llms.txt` ? Correct stale service descriptions, old platform-specific prices and an unqualified timeline; list Google/Yelp as the only removal services. Keep research/resource references.
- `online-reputation-management.html` ? Keep its distinct reputation-management intent; align description/schema and replace the obsolete six-platform/difficulty-adjusted-fee sentence. Contact form unchanged.
- `remove-facebook-reviews.html` ? Retain URL/self-canonical with a concise noindex availability notice, current Google/Yelp/contact links and no active Service/Offer/form. Exact original implementation is archived for restoration.
- `remove-glassdoor-reviews.html` ? Retain URL/self-canonical with a concise noindex availability notice, current Google/Yelp/contact links and no active Service/Offer/form. Exact original implementation is archived for restoration.
- `remove-tripadvisor-reviews.html` ? Retain URL/self-canonical with a concise noindex availability notice, current Google/Yelp/contact links and no active Service/Offer/form. Exact original implementation is archived for restoration.
- `remove-trustpilot-reviews.html` ? Retain URL/self-canonical with a concise noindex availability notice, current Google/Yelp/contact links and no active Service/Offer/form. Exact original implementation is archived for restoration.
- `remove-yelp-reviews.html` ? Yelp-specific commercial metadata and Service type/description; only the separately approved five-review pricing arithmetic changes in the body. Form and design unchanged.
- `sitemap.xml` ? Remove only the four retired service URLs. All 31 remaining entries, alternate-language/image references and dates are unchanged.
- `suppression-avis-google.html` ? French Google/Canada metadata and accurate policy-assistance Service description; only the approved five-review arithmetic changes in the body. Form, language alternates and design unchanged.
- `tests/build.cjs` ? Exercise the new SEO policy before existing legal/measurement build steps, twice in an isolated copy.
- `tests/commercial-seo.cjs` ? New metadata/schema/archive/indexability checks with optional baseline hashes, active-form/body protection and all canonical values verified.
- `tests/enquiry-flow.cjs` ? Test the four active enquiry forms from the enabled-service catalogue; retain the full functional assertions and report the actual active count.

## Protected blog/article HTML inventory

- `google-review-widget-coverage-study.html` ? unchanged, including metadata and links.
- `blog.html` ? unchanged, including metadata and links.
- `fake-review-statistics.html` ? unchanged, including metadata and links.
- `get-more-google-reviews.html` ? unchanged, including metadata and links.
- `google-fake-business-profile-statistics.html` ? unchanged, including metadata and links.
- `google-review-link-qr-code.html` ? unchanged, including metadata and links.
- `google-review-policy-canada.html` ? unchanged, including metadata and links.
- `google-review-rating-resilience-study.html` ? unchanged, including metadata and links.
- `google-review-removal-cost-canada.html` ? unchanged, including metadata and links.
- `google-review-removal-language-study.html` ? unchanged, including metadata and links.
- `google-review-removal-time-study.html` ? unchanged, including metadata and links.
- `google-review-replies-removal-bias-study.html` ? unchanged, including metadata and links.
- `google-reviews-not-showing.html` ? unchanged, including metadata and links.
- `google-reviews-staff-names-study.html` ? unchanged, including metadata and links.
- `remove-fake-google-review.html` ? unchanged, including metadata and links.
- `respond-to-google-reviews.html` ? unchanged, including metadata and links.
- `trustpilot-review-reporting-statistics.html` ? unchanged, including metadata and links.
- `yelp-review-removal-statistics.html` ? unchanged, including metadata and links.

Other protected resources include `google-review-removal-checker.html`, `google-review-calculator.html`, `google-reviews-faq.html`, `editorial-policy.html`, every existing research asset and source file, `measurement-config.js`, `measurement.js`, `form-submission.js`, `platform-removal.js`, `enquiry-flow.js`, `review-removal-cost.js`, `submission-terms.js`, `google-apps-script.gs`, the full CSS/font/image set, policy snapshots, `robots.txt`, `feed.xml`, CNAME, all existing redirect stubs and all four active form blocks.

Private evidence is under `.seo-private/google-yelp-seo-2026-11-05/`: pre-task snapshots/hashes, Search Console data, screenshots, rendering results and comparison scripts. None is a public site asset. ReviewRemoval was not edited or cross-linked.
