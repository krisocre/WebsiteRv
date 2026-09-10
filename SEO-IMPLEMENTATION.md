# SEO and editorial consolidation — September 9, 2026

Implemented locally; this pass did not publish the site or submit URLs to Search Console. It adds one article and consolidates one overlapping article. No traffic, backlink or enquiry analytics were available, so the retirement decision is based on scope and overlap, not an invented performance decline.

## New reference material

`yelp-review-removal-statistics.html` explains Yelp's 2025 review-status disclosures. It provides an original four-category normalization, a PNG/SVG chart, source-linked CSV with column definitions, executable calculation and plotting sources, a BibTeX citation, and an empty review-outcome ledger. The underlying data belongs to Yelp; the article explicitly distinguishes secondary analysis from independently collected observations.

The useful distinction is that 17 / (17 + 11 + 2) is approximately 56.7%: the proportion of the combined non-recommended/removal group classified as filtered. It is not a success probability. The report's more-than-193,700 reported removals are U.S.-only, while the approximately 22 million contribution total is global. The article preserves those footnotes rather than presenting a Canadian removal rate.

Sources are Yelp's February 25, 2026 announcement and release, its recommendation-software explanation, and Michael Luca and Georgios Zervas's 2016 Management Science paper. Noorie Malik's short quotation is attributed to the release; none of these people is presented as an author, reviewer or endorser of this site. AI assistance, formulas, approximate inputs and limitations are disclosed. Direct HTTP checks returned 200 for the Yelp blog and recommendation explanation; the press-release and journal pages blocked the automated request with 403 but were readable through browser research. No citation returned 404 in these checks.

## Discovery and Canadian/French targeting

- Existing reciprocal English/French alternates and sitemap annotations were already correct and retained. The SEO audit now verifies language, canonical destination, return annotations and sitemap agreement.
- The learning centre now links to all six removal platforms and the French Google service page. Five platform-page footers provide static French links, and service offers explicitly identify Canada as their eligible region, matching visible service coverage.
- The new article has Article, Dataset and breadcrumb markup, a dedicated social image, contextual links from the learning centre, Yelp service and existing statistics article, plus sitemap and RSS entries.
- All 27 indexable pages are reachable through static links within two clicks of the homepage. The new article is two clicks away. Metadata and dates were not refreshed across unchanged articles.

## Retired article

The broad `google-business-profile-local-seo.html` checklist was the weakest fit for the removal-focused resource library and overlaps the FAQ's local visibility section. Its useful profile, service-area and measurement guidance now lives at `google-reviews-faq.html#seo`. The old article body is preserved in the build-excluded `_retired` directory, replaced publicly by an immediate HTML redirect with noindex and a canonical to the destination page. Internal links point directly to the consolidated material, and the retired URL is absent from the sitemap, feed and learning-centre list.

This is content consolidation, not pruning for an algorithmic activity signal. Google explicitly says adding or removing content merely to make a site seem fresh does not help. [Helpful-content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content). The French annotations follow Google's [localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

## Hosting follow-up

Read-only checks on September 9 still returned 200 for both `http://reviewsboost.ca/` and `https://reviewsboost.ca/index.html`. The HTTPS root and French page also returned 200. Apply the HTTPS and index redirect settings documented below at the hosting/CDN layer. Add a permanent redirect for `/google-business-profile-local-seo.html` to `https://reviewsboost.ca/google-reviews-faq.html#seo`; the HTML redirect is a static-host fallback and is not an HTTP 301.

After publishing, submit the updated sitemap through the site's existing Search Console account and inspect the new article. No Search Console connection was available here. Evaluate Canadian qualified enquiries and search performance after recrawling; rankings or citations are not guaranteed by these changes.

## Validation

Site-wide SEO and HTML validation passed. Browser checks covered the new article, resource index, consolidated FAQ, Yelp service and French page on desktop and mobile, including download availability and absence of horizontal page overflow. Chart, table, downloads and static French service links are accessible without JavaScript. Published CSV matches the executable calculation source, shares total 100%, grouped arithmetic is verified, and sitemap/RSS/SVG XML parses successfully.

A single local mobile Lighthouse run on the new article scored 96 performance, 100 accessibility, 100 best practices and 100 SEO. These are local lab results, not field Core Web Vitals or evidence of search rankings. The Python preview server does not implement production caching or text compression.

# SEO improvements — September 7, 2026

Implemented in the local site. This pass did not publish the site or change Cloudflare settings. Ranking and traffic changes cannot be measured from this workspace; Search Console data was not available.

## What gives these changes a reason to earn attention

| Search intent | Page that should own it | Useful distinction added |
| --- | --- | --- |
| Online reputation management in Canada | `/online-reputation-management.html` | Direct paths to removal assessment, evidence preparation, response planning, monitoring and reputation recovery resources |
| Google review removal Canada / removal cost | `/` | Explicit full fee and partial-success examples; free preparation path before a service enquiry |
| Facebook, Yelp, Tripadvisor, Trustpilot and Glassdoor review removal | Five platform-specific service pages | Official policy routes, platform-specific eligibility, evidence checklists, unique FAQs and difficulty-adjusted success fees |
| Google review removal checker / evidence checklist / appeal worksheet | `/google-review-removal-checker.html` | Seven concerns × four reporting stages, evidence checklist, private editable inputs, copy and text export, plus an ungated blank template |
| How many five-star reviews to reach a target | `/google-review-calculator.html` | Feasible integer-star ranges behind rounded ratings, known-exact mode, transparent source and shareable calculations |

The checker organizes evidence rather than presenting an unsupported removal probability. Its decision table and examples are ordinary HTML, available before JavaScript executes. The calculator's new table is also static. Both support useful search entry points without publishing many near-identical pages for cities or individual rating combinations.

For example, 50 ratings displaying 4.2 can require **26–34** new five-star ratings to reach an exact 4.5 under the stated rounding model. That is a specific, reproducible reason for an agency or educator to reference the calculator, beyond linking to another generic calculator. Scenario links use URL fragments, keeping the canonical page stable without creating a query-string page inventory.

Google's current guidance emphasizes useful original material for its generative search features and says there is no separate AI-specific eligibility requirement. The tools implement that direction; `llms.txt` is a resource index, not a promised ranking mechanism. [AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [AI features and websites](https://developers.google.com/search/docs/appearance/ai-features).

## Performance and discovery

- Replaced the remote Font Awesome CSS and solid font with a local CSS mask bundle using the same 54 icons. The old assets measured 102,025 + 150,124 decoded bytes. The replacement is 39,757 bytes, or 9,802 bytes when gzip-compressed locally. This reduces those decoded asset bytes by about 84%; it is not a measured Core Web Vitals score improvement. Original icon attribution and licence links remain in `site-icons.css`.
- Added contextual links from the homepage, removal service, reporting guide and resource index. The homepage also links directly to the existing 420-scenario study.
- A crawl of static links reaches all 26 indexable pages within two clicks of the homepage; all six review-removal services are linked directly from the homepage or their cross-platform service navigation.
- Updated the sitemap for pages actually changed, the resource index's structured list, and the RSS feed. The new checker has factual WebPage, WebApplication and breadcrumb markup; no invented ratings or review counts were added.
- Corrected the homepage claim that local reviewer accounts carry extra ranking weight, which conflicted with the FAQ. Google's published local-ranking factors are described in its [ranking guidance](https://support.google.com/business/answer/7091).

## Hosting changes still needed

Live GET checks found the following on September 5, 2026:

| URL | Observed response | Intended result |
| --- | --- | --- |
| `https://reviewsboost.ca/` | 200 | Keep |
| `https://www.reviewsboost.ca/` | 301 to canonical root | Keep |
| `http://reviewsboost.ca/` | 200, duplicate homepage | Redirect to HTTPS |
| `https://reviewsboost.ca/index.html` | 200, duplicate homepage | Redirect to `/` |

The canonical tags already point to HTTPS `/`. Redirects would make the actual URL behaviour agree. These need server/Cloudflare settings; an HTML edit cannot issue a permanent HTTP redirect.

1. In the Cloudflare zone, enable **SSL/TLS → Edge Certificates → Always Use HTTPS**. Cloudflare documents that this redirects HTTP requests to HTTPS. [Official instructions](https://developers.cloudflare.com/ssl/edge-certificates/additional-options/always-use-https/).
2. Add a **Single Redirect** with a custom expression:

   ```text
   (http.host in {"reviewsboost.ca" "www.reviewsboost.ca"} and http.request.uri.path eq "/index.html" and http.request.method in {"GET" "HEAD"})
   ```

   Set a static destination of `https://reviewsboost.ca/`, status **301**, and **preserve query string**. Check existing rule precedence before saving. [Cloudflare redirect settings](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/).

After publishing and configuring redirects, run `node seo-live-check.mjs --after-deploy`. This is a read-only check. It does not submit forms, create orders or change hosting settings.

## The next competitive work needs real evidence and distribution

1. **Turn actual press coverage into verifiable references.** The unlinked publication-name carousel was replaced with Canadian service-area information in the September 6 pass; see [CANADA-SEO.md](CANADA-SEO.md). Before adding press mentions, obtain the real article URLs and confirm which concern this business. The 750+ businesses, 12,500+ reviews, 4.8 rating and retention claims also need evidence: their provenance is not in this repo.
2. **Publish one consented removal case with a timeline.** Include the original concern, redacted evidence, submission and decision dates, policy basis, fee calculation and the actual result. An unsuccessful case with a clear explanation can also be useful. Do not invent case outcomes, reviewer identities or testimonials. This would give the removal service original evidence that the new preparation tool alone cannot supply.
3. **Offer the calculator example to relevant educators and agencies.** The specific pitch is that a rounded 4.2 is not an exact 4.2, and small review counts constrain the possible averages. Provide the 26–34 example, the calculation source and the existing dataset. Let publishers choose whether the material is useful and how to cite it; do not pay for ranking links or require keyword anchors.
4. **Offer the blank evidence worksheet as a practical resource.** Suitable recipients include genuine local business associations and agencies already publishing about review reporting. A downloadable worksheet that works without an account is a stronger resource pitch than a generic service-page link. Outreach is not sent as part of this change.
5. **Keep the new service position consistent.** The homepage now focuses on reputation assessment, policy-based removal assistance, response planning and monitoring. The former sales implementation is preserved only in the build-excluded `_retired` source directory and should remain outside the public output unless the business model is deliberately reviewed again.

Draft outreach angle, for manual use after publication:

> Your guide covers Google review ratings. We built a free calculator that exposes the rounding uncertainty most simple formulas hide: 50 reviews showing 4.2 can require 26–34 new five-star ratings to reach an exact 4.5. The method, worked table and source are public. If that distinction would help your readers, the example is here: https://reviewsboost.ca/google-review-calculator.html#hidden-range

## Measure outcomes instead of more edits

After deployment, inspect the two tool URLs and the two service URLs in Search Console. Submit the updated sitemap once. Review Canadian non-branded queries separately for removal, calculator and service intent; use comparable 28-day windows and account for changes in position and query mix when reading click-through rate. Look for movement from informational entry pages into qualified enquiries, not just more impressions. Search Console access and real enquiry data are needed for those conclusions.

## Validation performed

- Existing metadata, canonical, structured-data, sitemap and internal-reference audit passed.
- HTML validation passed for all changed/new pages.
- The rating model was checked against an independent enumeration of every possible integer-star total for review counts 1–100, plus published examples and invalid/perfect-rating cases.
- Browser checks covered all four key pages at 1280px and 390px, all 28 checker routes, clipboard and text downloads, HTML-safe preview, calculator share-link restoration and changed-input handling.
- Static tables and downloadable resources were verified with JavaScript disabled. No external requests or browser script errors occurred on the four checked pages with locally served assets.
- Existing Apps Script deployment and notification limitations remain documented separately in `FORM-SETUP.md`.
