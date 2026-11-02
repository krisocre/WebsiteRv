# ReviewsBoost: homepage SEO, conversion and performance review

November 1, 2026. Repository: C:/Users/alkhi/BarberShopRevolution/WebsiteRv. Domain: https://reviewsboost.ca/. Starting commit: 04e5cc435a253729bbb2d9ceadea8f891f723b4b; the tree was clean before this work. Source was inspected and snapshotted before production edits. No commit, push or deployment was performed.

## Prioritized evidence and actions

| Priority | Verified issue / affected files | Action and status | Expected impact / limit |
| --- | --- | --- | --- |
| High | Homepage title/meta/social/Service copy includes a typical 1–2 week claim without underlying case records. The hero repeats 4.8+, 500+ reviews and a named testimonial already flagged by the October audit. | index.html: remove these unsupported homepage claims; use service/Canada intent, real fees and policy-based assessment. Preserve the original portrait asset and all other pages. | Clearer, defensible search/first-screen expectations. CTR/lead improvement remains a hypothesis until measured. Claims were unverified, not established false. |
| High | The first hero CTA sends visitors to a quantity calculator rather than directly into the already working assessment flow. Pricing appears after several long sections. | index.html/home.css: direct assessment action on the hero and existing mobile bar; earlier pricing; retain a secondary pricing link. Keep the current two-step modal, form fields, validators, receipts and legal notice. | Shorter qualified-enquiry path; no extra automatic popup, new carousel or payment commitment. |
| High | No actual GA4/GTM/Ads install or confirmed-lead action was found; local funnel CustomEvents are not remote measurement. | Prepare an independent, disabled measurement module and confirmed-response hook; leave all identifiers null. Document activation and consent requirements. | Avoid fake IDs, duplicate tags, accidental PII and false conversions. Reporting is not active until genuine configuration is supplied and verified. |
| Medium | Lighthouse consistently measures 0.02033 layout shift near hero actions; local icons arrive through an asynchronous stylesheet. | Reserve icon dimensions in homepage critical styles before the mask sheet applies; remeasure. | Final three-run load CLS is 0. This is lab evidence, not a field CWV claim. |
| Medium | Automated contrast failures include the testimonial notes and city text; city text has an old !important gray declaration. | Replace the unsupported testimonial, darken the actual city-text declaration and relevant secondary text; retain visible focus and 44px+ main actions. | Final Lighthouse accessibility 100 versus 97; automated checks do not replace a complete human accessibility audit. |
| Medium | Header/H1 copy, repeated removal wording and process step “We Remove It” can imply a promised result. | Policy-based supporting copy; three steps: share the review, review the plan, reporting/follow-up. State scope, Google decision and free direct reporting accurately. No password/card needed for initial assessment. | Better-qualified expectations; no fabricated success rates, results or credentials. |
| Low | About/blog have only one contextual incoming page each, despite strong site navigation; city “#1/#2/#3” labels can distract from service intent. | Add natural homepage links to company/research standards and learning centre; use city/service-area labels and actual online Canadian coverage. Keep city anchors and French alternates. | Easier trust/resource discovery. The accessibility policy still has one contextual incoming page plus 30 navigational links; no artificial SEO links were added to fix a harmless count. |
| Owner evidence | Seven other service pages still display the older named testimonial and rating/review-count assertions. | These HTML pages were intentionally preserved in this homepage-focused pass. Substantiate them with a public source/permission record or remove/qualify them before relying on them as trust evidence. See files below. | An unresolved trust evidence requirement; no replacement testimonials or results have been invented. |

The remaining testimonial pages are online-reputation-management.html, remove-facebook-reviews.html, remove-yelp-reviews.html, remove-tripadvisor-reviews.html, remove-trustpilot-reviews.html, remove-glassdoor-reviews.html and suppression-avis-google.html. Current legal-name/address settings remain null as previously instructed; written paid orders must supply the identity/contact information described by the existing terms. No invented office or legal entity was added.

## Five title options

1. Google Review Removal Service in Canada | ReviewsBoost — recommended
2. Google Review Removal Help in Toronto | ReviewsBoost
3. Google Review Removal for Canadian Businesses | ReviewsBoost
4. Policy-Based Google Review Removal | ReviewsBoost
5. Google Review Removal Assessment | ReviewsBoost Canada

## Five meta description options

1. Google review removal help for Canadian businesses, including Toronto. CAD $30 upfront per review + $40 if removed. Request a policy-based assessment. — recommended
2. Toronto business with a Google review concern? Get a policy-based assessment, clear CAD pricing and reporting help. No Google password needed to get started.
3. Professional Google review reporting help for businesses across Canada. We assess the concern, prepare the case and explain the fees. Request an assessment.
4. Get help with Google reviews that may violate policy. Canadian service, evidence preparation and available follow-up. Send your review for an assessment.
5. Google review removal assistance in Toronto and across Canada. CAD $30 upfront plus $40 per removed review. See the process and request an assessment.

The first pair is strongest for this page: the title naturally communicates a paid assistance service and Canada, while the description adds Toronto, the genuine conditional fee and a policy-based assessment CTA. It avoids an unsupported deadline and preserves commercial intent without listing every city or claiming affiliation. Snippet text and click-through gains are not guaranteed by editing metadata.

## Before and after metadata

| Field | Before | After / reason |
| --- | --- | --- |
| Title | Google Review Removal Toronto &amp; Canada \| ReviewsBoost | Google Review Removal Service in Canada \| ReviewsBoost — documented service/Canada intent. |
| Description | Google review removal in Toronto, Montréal and Vancouver, with online service across Canada, a typical 1–2 week timeline and transparent CAD pricing. | Google review removal help for Canadian businesses, including Toronto. CAD $30 upfront per review + $40 if removed. Request a policy-based assessment. — actual scope/fees and CTA; remove unsubstantiated timing. |
| OG description | Google review removal for Toronto, Montréal, Vancouver and businesses across Canada, with a typical 1–2 week timeline and specialist support. | Google review removal help for Canadian businesses, including Toronto. CAD $30 upfront per review + $40 if removed. Request a policy-based assessment. — synchronize with the factual snippet. |
| Twitter description | Google review removal for Toronto, Montréal, Vancouver and businesses across Canada, with a typical 1–2 week timeline and specialist support. | Google review removal help for Canadian businesses, including Toronto. CAD $30 upfront per review + $40 if removed. Request a policy-based assessment. — synchronize. |
| OG/Twitter title | Previous homepage title | Final title above; sharing images/URLs unchanged. |
| H1 | Google Review Removal in Toronto and Across Canada | Google review removal. Handled with care. Audience is explicit in the adjacent Canadian-business eyebrow and description. |
| Canonical | https://reviewsboost.ca/ | Unchanged, exactly one in static server-served HTML. |
| Robots | index, follow, max-image-preview:large, max-snippet:-1 | Unchanged. |
| Language alternates | en-CA homepage, fr-CA French page, x-default homepage | All reciprocal URLs unchanged. |
| WebPage / Service schema | Existing Organization, WebSite, WebPage, Service and ItemList graph | Same factual types/entities, provider/contact details, areas, offers and URLs. Only homepage name/description, Service description and real modification date updated. No AggregateRating, award or invented business property. |
| Homepage dateModified / sitemap lastmod | 2026-10-27 | 2026-11-01 for the substantive update; all other dates and all 32 sitemap URLs preserved. |

All 36 HTML documents were checked. Every non-homepage HTML file is unchanged, including its SEO metadata, body and forms. There are no new URLs or redirects. The original price calculation, static form names, Apps Script URL, form-submission.js, platform-removal.js/.css, submission-terms.js, backend source, legal settings/archive, robots.txt, feed.xml and CNAME are preserved. This brand's Google fees remain CAD $30 upfront per review plus $40 per successful removal; platform-specific success fees are preserved too. No form values are copied to analytics.

## Local measurements before and after

Three fresh Lighthouse 12.8.2 runs per phase, same Chrome, loopback HTTP/gzip server and default simulated mobile throttling. Baseline is the saved source before edits; after is the complete current homepage. Google URLs were blocked in the measurement browser to prevent collection; no production tag was removed because none exists. Network geography, CDN injection/account settings and real device populations are not reproduced.

| Metric (median of three) | Before | After |
| --- | ---: | ---: |
| LCP (ms) | 1,365.997 | 1,363.283 |
| FCP (ms) | 1,022.332 | 1,058.856 |
| Total Blocking Time (ms) | 33 | 0 |
| CLS | 0.02 | 0 |
| Transferred bytes | 46,420 | 44,388 |
| Lighthouse performance | 100 | 100 |
| Lighthouse accessibility | 97 | 100 |
| Lighthouse best practices | 100 | 100 |
| Lighthouse basic SEO | 100 | 100 |

LCP is essentially unchanged at about 1.36 seconds; no material LCP improvement is claimed. Measured transfer is 4.4% lower. FCP is slightly higher in this sample; it is reported rather than hidden. The clearest improvements are zero measured load CLS, corrected contrast and a sooner direct CTA. No oversized hero photo, webfont download, frontend framework, hydration or removable runtime dependency was found. The only former homepage image was a small testimonial avatar; it was removed with the unsupported testimonial, not presented as a large-image optimization. Existing local icon/font choices remain.

An additional web-vitals 6.2.3 interaction probe used 4x CPU slowdown, 390x844/DPR 1.75 and reduced motion. Each phase exercised the same menu, quantity, existing pricing-to-modal action, discrete input keys and FAQ controls without submitting. Sampled INP values were 120, 112, 120 ms before and 256, 144, 144 ms after; medians 120 versus 144 ms. This variable sample does not support an INP improvement claim. No field/CrUX 75th-percentile data or real-user conversion uplift was available, and working application handlers were not rewritten to chase a noisy sample.

Raw Lighthouse JSON, before/after summaries, interaction JSON, snapshots, layout results and screenshots are in .seo-private/reviewsboost-2026-11-01. The web-vitals code is an ignored local measurement tool, not a frontend dependency.

## Build and tests

- PASS: node tests/build.cjs — actual legal/form generator and conditional measurement installer run twice in an isolated repository copy; identical output, unchanged homepage, generated-site SEO audit, no source rewrite.
- PASS: node --test tests/submission.test.cjs review-rating-model.test.mjs — 19 backend/sender/legal-record/model tests.
- PASS: node tests/enquiry-flow.cjs — all eight forms at desktop/mobile, Unicode payloads, $30/platform-specific success fees, one POST, receipts, errors, keyboard flow and retained answers.
- PASS: node tests/homepage.cjs — five widths, visible CTA, existing modal/focus and mobile actions, no-JavaScript email fallback, price arithmetic, canonical preservation and unchanged other HTML.
- PASS: node tests/measurement.cjs — disabled defaults, consent, safe events, explicit backend success, no legacy-error conversion, deduplication/distinct requests, contact clicks and no real provider traffic.
- PASS: node seo-audit.mjs — metadata, heading hierarchy, IDs, canonicals/hreflang, Open Graph, images, links/anchors, JSON-LD, sitemap and robots.
- PASS: node audit-google-removal-time-data.mjs; node audit-google-fake-business-profiles.mjs; node audit-trustpilot-notices.mjs; node google-review-rating-resilience-method.mjs; python audit-google-reply-study.py — existing source/data/method checks, including 420 rating scenarios.
- PASS: local audit-site.mjs report — no foreign-brand hosts; contextual About/blog discovery improved. Live link/account audits were not substituted for tests of the local changes.
- PASS: private verify.cjs — baseline hashes, backend/legal archives, all other HTML, form names/calculation, canonical/hreflang, permitted schema changes and sitemap invariants.
- PASS: git diff --check under the repository's normal Windows line-ending settings.

No package.json/Gemfile or application bundler belongs to this static repository. The production generation command is node build-legal-pages.cjs; the new conditional installer is a no-op until genuine IDs are configured. All automated submission and tag tests are mocked/intercepted; no live enquiry, notification email or Google collection was sent.

Browser tests used installed Puppeteer/local Chrome; the existing enquiry test used Playwright 1.56.1 from an available local test-tools installation through NODE_PATH. To reproduce in a clean environment, install the same browser test tools in an ignored test-tools directory, set NODE_PATH or PLAYWRIGHT_MODULE as supported by tests/enquiry-flow.cjs, and use local Chrome. They are not required by the deployed website. No unrelated parent-project package/configuration was modified.

## Measurement activation and remaining work

See [MEASUREMENT-SETUP.md](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/MEASUREMENT-SETUP.md) for actual account configuration, privacy notice/versioning, event roles and verification. GA4 and Ads lead reporting are prepared, not active. No identifier from a different brand was used. Confirmed enquiries are primary candidates; clicks/form starts are secondary and views observational. Do not double-count native Ads conversions and GA4 imports as two primary goals.

The next evidence-dependent steps are actual account/tag diagnostics after real IDs exist, verification/consent records for legacy testimonial claims elsewhere, and real Search Console/qualified-lead comparisons after deployment. Public legal identity/contact completeness and hosting/privacy settings require their actual owner information. No ranking, CTR, field CWV or revenue result is promised, and no deployment occurred.

## Every changed file

16 Git-visible files changed relative to the clean starting commit. All are explained below; ignored local snapshots/reports/probes/previews are separate artifacts and are not published.

| File | Status | Modification and reason |
| --- | --- | --- |
| [.gitignore](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/.gitignore) | Modified | Ignore local source snapshots, measurements, screenshots and test artifacts in .seo-private; no production behavior changes. |
| [_config.yml](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/_config.yml) | Modified | Exclude the measurement installer and the two new internal documentation files from publication. Existing tests exclusion is retained. |
| [build-legal-pages.cjs](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/build-legal-pages.cjs) | Modified | Keep the optional brand-specific measurement bootstrap on future legal/form rebuilds only when real configuration enables it. With null IDs, output is unchanged; policy versions/archives and the other branch remain intact. |
| [enquiry-flow.js](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/enquiry-flow.js) | Modified | Add a guarded hook after explicit backend success, excluding the legacy warning that the sender synthesizes from an error response. Existing local events, endpoint, payload, receipts, retry/locking behavior and form stages remain intact. |
| [index.html](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/index.html) | Modified | Implement the documented homepage metadata recommendation; replace unsupported testimonial/rating/timeline claims with policy-based service explanations and unchanged real fees; improve hero/assessment CTAs, three steps, limits, early pricing, city relevance, internal trust/resource links, keyboard skip link and no-JavaScript email fallback. Preserve every canonical/hreflang, form field and price calculation. Remove CSS only used by the replaced hero, and fix the verified city-text contrast. |
| [sitemap.xml](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/sitemap.xml) | Modified | Update only the homepage lastmod from 2026-10-27 to 2026-11-01 for the substantive page update. All 32 URLs and language alternates are preserved. |
| [HOMEPAGE-IMPROVEMENTS.md](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/HOMEPAGE-IMPROVEMENTS.md) | New | This complete audit, five title/description candidates, documented metadata reasons, measurements, tests, open items and per-file change inventory. Excluded from publication. |
| [MEASUREMENT-SETUP.md](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/MEASUREMENT-SETUP.md) | New | Audit, real-account activation instructions, consent/attribution limitations, safe event definitions, primary versus secondary conversion roles and verification checklist. Excluded from publication. |
| [home.css](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/home.css) | New | Homepage-scoped spacing, responsive layout, readable service/fee card, button targets and focus states. Reserve local icon boxes before the async mask stylesheet arrives, addressing the measured layout shift. No shared platform/article redesign. |
| [install-measurement.cjs](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/install-measurement.cjs) | New | Conditional, repeatable installation of one shared tag bootstrap. With current null IDs it does nothing. With real IDs it refuses to layer over an existing different Google installation. |
| [measurement-config.js](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/measurement-config.js) | New | Three disabled null destination settings; no invented or other-brand GA4/Ads identifiers. |
| [measurement.css](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/measurement.css) | New | Prepared inline consent styles, equal accept/reject controls, focus visibility and room above the existing mobile price bar. Not loaded while unconfigured. |
| [measurement.js](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/measurement.js) | New | Prepared manual page/CTA/start/confirmed-lead/contact events, explicit routing, request deduplication and opt-in English/French privacy controls. No form contents or customer references in analytics. Not loaded by current pages. |
| [tests/build.cjs](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/tests/build.cjs) | New | Run the actual legal/form generator and conditional installer twice in an isolated copy, check identical output and preserved homepage, run its SEO audit, and verify source files stay untouched. |
| [tests/homepage.cjs](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/tests/homepage.cjs) | New | Browser regression checks at five widths, visible assessment CTA, existing modal/focus, mobile navigation/CTA, verified $30+$40 arithmetic, no-JavaScript contact fallback, unchanged form names and canonical/other-page HTML. |
| [tests/measurement.cjs](/C:/Users/alkhi/BarberShopRevolution/WebsiteRv/tests/measurement.cjs) | New | Intercepted browser fixtures test disabled defaults, installer duplicate guards, independent consent/GPC/withdrawal, safe parameters, success/error/legacy outcomes, request deduplication/new enquiries, contact clicks and bilingual controls. No provider receives a real hit. |

## Primary guidance used

- [Google review-reporting eligibility and direct reporting](https://support.google.com/business/answer/4596773?hl=en)
- [Google: optimize LCP and distinguish lab from real-user evidence](https://web.dev/articles/optimize-lcp)
- [Google: consent mode options](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Québec CAI: meaningful privacy choices and default settings](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/interfaces-truquees)
