# SEO improvements — September 5, 2026

Implemented in the local site. This pass did not publish the site or change Cloudflare settings. Ranking and traffic changes cannot be measured from this workspace; Search Console data was not available.

## What gives these changes a reason to earn attention

| Search intent | Page that should own it | Useful distinction added |
| --- | --- | --- |
| Google review services / packages in Canada | `/` | Immediate paths to packages, evidence preparation and rating planning; direct discovery of the existing original research |
| Google review removal Canada / removal cost | `/remove-google-reviews.html` | Explicit full fee and partial-success examples; free preparation path before a service enquiry |
| Google review removal checker / evidence checklist / appeal worksheet | `/google-review-removal-checker.html` | Seven concerns × four reporting stages, evidence checklist, private editable inputs, copy and text export, plus an ungated blank template |
| How many five-star reviews to reach a target | `/google-review-calculator.html` | Feasible integer-star ranges behind rounded ratings, known-exact mode, transparent source and shareable calculations |

The checker organizes evidence rather than presenting an unsupported removal probability. Its decision table and examples are ordinary HTML, available before JavaScript executes. The calculator's new table is also static. Both support useful search entry points without publishing many near-identical pages for cities or individual rating combinations.

For example, 50 ratings displaying 4.2 can require **26–34** new five-star ratings to reach an exact 4.5 under the stated rounding model. That is a specific, reproducible reason for an agency or educator to reference the calculator, beyond linking to another generic calculator. Scenario links use URL fragments, keeping the canonical page stable without creating a query-string page inventory.

Google's current guidance emphasizes useful original material for its generative search features and says there is no separate AI-specific eligibility requirement. The tools implement that direction; `llms.txt` is a resource index, not a promised ranking mechanism. [AI optimization guidance](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide), [AI features and websites](https://developers.google.com/search/docs/appearance/ai-features).

## Performance and discovery

- Replaced the remote Font Awesome CSS and solid font with a local CSS mask bundle using the same 54 icons. The old assets measured 102,025 + 150,124 decoded bytes. The replacement is 39,757 bytes, or 9,802 bytes when gzip-compressed locally. This reduces those decoded asset bytes by about 84%; it is not a measured Core Web Vitals score improvement. Original icon attribution and licence links remain in `site-icons.css`.
- Added contextual links from the homepage, removal service, reporting guide and resource index. The homepage also links directly to the existing 420-scenario study.
- A crawl of static links reaches all 21 indexable pages within two clicks of the homepage; the new checker and original study are one click away.
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

1. **Turn actual press coverage into verifiable references.** The homepage names publications but does not link to coverage. Obtain the real article URLs, confirm which concern this business, and make those mentions clickable. If coverage does not exist, replace the claimed mention with a checkable service fact. The same applies to the 750+ businesses, 12,500+ reviews, 4.8 rating and retention claims: their provenance is not in this repo.
2. **Publish one consented removal case with a timeline.** Include the original concern, redacted evidence, submission and decision dates, policy basis, fee calculation and the actual result. An unsuccessful case with a clear explanation can also be useful. Do not invent case outcomes, reviewer identities or testimonials. This would give the removal service original evidence that the new preparation tool alone cannot supply.
3. **Offer the calculator example to relevant educators and agencies.** The specific pitch is that a rounded 4.2 is not an exact 4.2, and small review counts constrain the possible averages. Provide the 26–34 example, the calculation source and the existing dataset. Let publishers choose whether the material is useful and how to cite it; do not buy links or require keyword anchors.
4. **Offer the blank evidence worksheet as a practical resource.** Suitable recipients include genuine local business associations and agencies already publishing about review reporting. A downloadable worksheet that works without an account is a stronger resource pitch than a generic service-page link. Outreach is not sent as part of this change.
5. **Resolve the homepage's conflicting claims with documented service facts.** The commercial copy offers paid custom-written reviews while educational sections explain Google's restrictions on paid/influenced reviews. Treating the same service as policy-safe would create a credibility problem. Verify the real fulfilment model before changing those claims; this pass does not rebrand or invent a different service.

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
