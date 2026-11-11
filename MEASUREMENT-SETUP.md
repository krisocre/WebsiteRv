# ReviewsBoost conversion measurement

## Current lead conversion — November 11, 2026

The owner supplied the real **Submit lead form** action:
**AW-18568327970/XARtCKC2grYdEKLmiJZF**, nominal value **CAD $1**. The live
site already had the GTM bootstrap; the new action label was missing from
the configuration and published container. The attached manual instructions
also mixed the GTM container ID with the gtag.js/config identifiers. Keep
`GTM-WQSPSM5Z` on the existing container loader and use `AW-18568327970` as
the Ads destination; do not paste `gtag('config', 'GTM-WQSPSM5Z')` or add
another base loader.

The LOCAL configuration is now:

```js
window.ReviewsBoostMeasurementConfig = Object.freeze({
  googleTagManagerId: 'GTM-WQSPSM5Z',
  googleAdsViaTagManager: true,
  ga4MeasurementId: null,
  googleAdsId: 'AW-18568327970',
  googleAdsLeadConversionLabel: 'XARtCKC2grYdEKLmiJZF'
});
```

`googleAdsViaTagManager: true` explicitly reuses the verified container's Ads
base destination. No second direct gtag.js loader or Ads config command is
added. After the existing backend confirms `result: success`, advertising
consent and the deduplication guard permit one `conversion` event to the
exact supplied destination, with value 1, currency CAD, an independent random
transaction ID and empty user_data. A button click, failed submission or
backend-only test does not count as a conversion. The nominal value is not
service pricing, a paid order or revenue.

The safe `reviewsboost_generate_lead` custom event remains available, but do
not add another GTM conversion tag for this same action: the site now sends
its event through the existing Google tag. Choose one primary lead action in
Google Ads and ensure the campaign uses that goal. ReviewRemoval's IDs and
files remain separate and unchanged.

Publish **measurement-config.js** and **measurement.js** together, then
refresh hosting/browser caches. No HTML, Apps Script, form, policy-version or
GTM-account edit is required for this update. Select AW-18568327970 in the
Ads test, accept advertising measurement, and use that action's Tag Assistant
flow to verify a clearly labelled test assessment. No real lead or Google
collection was sent by the agent; no account reporting result is claimed.
The tag-status dashboard may take time to refresh after successful detection:
[Google troubleshooting guidance](https://support.google.com/google-ads/answer/9148089).

Local tests and the isolated published-code test confirmed one conversion
event with the requested label, one container/library and no raw/hashed test
form data in captured requests. All collection/backend traffic was blocked
or mocked. Full changed-file list and evidence:
`.seo-private/ads-lead-2026-11-11/REPORT.md`.

## Container installation record — November 10, 2026

This records the initial base-tag installation. The current lead-action
configuration above supersedes the earlier null Ads ID/label and the
instruction to add a separate GTM conversion tag below.

The owner supplied **GTM-WQSPSM5Z** for ReviewsBoost. The local website now
includes one shared consent bootstrap across all forty root HTML pages.
The published container was inspected read-only: its destination is
**AW-18568327970**, with no GA4 destination or manual lead-action label found.
This is separate from ReviewRemoval's accounts and container.

`measurement-config.js` holds `googleTagManagerId: 'GTM-WQSPSM5Z'`. Direct
GA4/Ads IDs and the native lead label remain null; adding them would require
reviewing whether they duplicate the container. The existing script now loads
this container once after advertising consent. Analytics-only consent does
not load this Ads container. Rejection, Global Privacy Control and unsafe URLs
block it. Preferences stay in the existing inline footer controls; there is
no modal, consent wall or form checkbox. Forms work without optional tracking.

The runtime sets denied consent defaults before startup and empty `user_data`
before the container and on its custom events. It does not hash or transmit
form fields, customer references or review text. The published container has
automatic user-provided-data capability enabled; in this container's Google
tag settings, turn off **Allow user-provided data capabilities** and review
**Manage automatic event detection**, especially forms, before publication.
These account settings cannot be changed by the local code. Local opt-outs
were tested against the actual published Google code with all collection
blocked: no raw or hashed fixture form data appeared in captured requests.
That check does not guarantee future container edits or account settings.

After a confirmed saved request and advertising consent, the existing form
hook pushes **reviewsboost_generate_lead** with a fixed form/page category and
empty `user_data`. Duplicate confirmations of the same request produce no
second event. Configure a Google Ads Conversion Tracking tag in this container
with that exact Custom Event trigger and your real lead-action ID/label if
lead conversions are wanted. The inspected container has its Ads base tag;
no lead-action label was supplied or invented. A base tag installation is
not proof of an Ads conversion action reporting successfully. Keep generic
automatic form events as diagnostics, and choose only one primary lead route.

The updated English/French privacy notice and archived policy release
`2026-11-10-tag-manager` describe optional Google measurement. The four form
notices point to that release, with the same visible acknowledgement wording.
Older policy archives remain unchanged. Tag Assistant's `_dbg=1` and numeric
10–16 digit `gtm_debug` are allowed without copying them into event data;
unknown/private query values remain blocked.

Run `node tests/gtm.cjs`, `node tests/measurement.cjs`, `node tests/homepage.cjs`,
`node tests/build.cjs`, the existing unit suites and `node tests/enquiry-flow.cjs`.
Providers and successful form requests in these tests are intercepted. The
published-code check is private under `.seo-private/gtm-2026-11-10/`.
No website, Apps Script or GTM account deployment was performed. Publish the
changed website files together, including the new policy snapshot, then use
Tag Assistant after granting advertising measurement. No Apps Script change
is required. Exact changed-file list and checks are in that private report.

## Historical audit — November 1–2, 2026

The following records describe the earlier unconfigured implementation.
The current container installation above supersedes those disabled defaults.

Reviewed November 1, 2026. Configuration belongs only to reviewsboost.ca.

Follow-up, November 2: inspected the latest downloaded
`reviewsboost.ca-Performance-on-Search-2026-11-02` export. It contains Search
Console query/page/country/device/date performance, not a GA4 installation ID,
GTM container or Ads conversion ID/label. No destination identifier was found,
so the disabled configuration remains unchanged. Account export data is not
included in the public research dataset.

## What exists and what is prepared

No active GA4 Measurement ID, GTM container, Google Ads tag/action label or consent
manager was found in the published source. A read-only GET of the live homepage
also showed no Google loader/ID, Cloudflare RUM script or Zaraz script. That is a
single-response observation, not an inspection of hosting/account settings.
The generic legal generator contains an unused other-brand branch; its tag ID
is not this brand's configuration and has not been adopted.

The existing `reviewsboost:funnel` CustomEvents are local integration hooks.
They do not transmit analytics and are not evidence of GA4/Ads collection.
`form-submission.js`, the Apps Script endpoint, backend source and sheet/payload
contract are preserved. The site has email links, including support receipts;
no public telephone links were found.

`measurement-config.js` intentionally contains three null values. No placeholder
ID runs in production. `node install-measurement.cjs` currently makes no changes;
the prepared JS/CSS are not loaded by the pages. There is no unnecessary consent
banner for an unconfigured Google integration. Even if the runtime is loaded
accidentally with all IDs null, it creates no Google request, consent UI or
analytics history. The form's optional success hook remains harmless.

When real configuration is supplied, one shared consent-controlled Google loader
serves the configured destinations. The installer refuses to layer it over a
different existing Google installation. The legal/form builder retains the
bootstrap only when configuration is enabled.

## Events and conversion roles

| Event | Exact trigger after the relevant consent | Role |
| --- | --- | --- |
| `page_view` | Once per eligible document; automatic config page views disabled | Observation, not a conversion |
| `quote_cta_click` | Original homepage quantity links, assessment buttons, platform form openers, or local request/contact links; fixed CTA location enum | Secondary diagnostic |
| `quote_form_start` | First trusted input/change in an existing enquiry form; focus alone excluded | Secondary diagnostic |
| `generate_lead` | Explicit backend JSON `result: success` after submission | Primary GA4 key-event candidate |
| `email_click` | Actual email link click; destination and subject excluded | Secondary intent, not a confirmed enquiry |
| `phone_click` | Actual telephone link click if one is added; number excluded | Secondary intent, not a connected call |
| Ads `conversion` | The same confirmed response, advertising consent, real AW ID and lead label | Primary Ads candidate; use only one primary route per lead |

A saved response with `notification_sent: false` is still a confirmed lead.
Validation attempts, submit clicks, offline/HTTP/network/non-JSON/backend errors
do not count. The sender still supports its existing legacy notification-error
UI, but that manufactured success/warning is **not** sufficient analytics proof.
The hook is in `enquiry-flow.js` at the actual response, not in the generic local
submission-confirmed event or success-panel observer.

The random RB request key is used only for bounded, in-memory deduplication and
never sent as an analytics parameter. Repeated confirmation of that request is
ignored; a distinct later enquiry on the same reused form can count. Ads gets
an independent random transaction ID. This is not cross-device or persistent
server-side reconciliation. Unconfirmed requests must not be automatically
retried to create a conversion; the existing form recovery behavior is retained.

These events count enquiries, not paid work, qualified opportunities, successful
removals or revenue. The manual Ads route covers the brand's enquiry forms;
match the conversion action's scope accordingly. GA4 uses fixed `form_id` and
`service_platform` values to distinguish reputation enquiries and platforms.

## Privacy and consent

The prepared implementation uses basic opt-in throughout Canada: no Google
loader before the relevant permission, separate initially-off analytics and
advertising choices, equal accept/reject styling, and English/French controls.
There is no overlay, consent wall or extra enquiry checkbox. A footer Cookie
choices control permits review and withdrawal. Preference storage contains a
version, two booleans and a 180-day expiry, not a visitor ID or form details.
Blocked storage does not break forms. GPC forces advertising off. Advertising
personalization remains denied; Google Signals/ad personalization are disabled
for the GA4 route. Mobile preferences account for the existing sticky price bar.

No form data, names, email/phone destinations, review text, profile links,
selected-plan text, review count, customer reference or free-text reason is used
as an event parameter. Only published canonical location, generic site title,
known page/platform/category, fixed CTA location, form ID/contact method and an
independent Ads transaction ID are used. No enquiry amount is reported as revenue.

Visitor queries/fragments are not copied to event parameters; referrer is empty.
To guard against provider automatic URL collection, unknown query parameters
and arbitrary fragments suppress optional collection without rewriting the
address or interrupting the form. Eligible exceptions are valid-format Google
click parameters (`gclid`, `dclid`, `gbraid`, `wbraid`, `gad_source`,
`gad_campaignid`) and real published DOM anchors. **UTM/other unknown query visits
are deliberately unmeasured.** Do not broadly allow visitor-supplied campaign
values. Verify attribution with real accounts before relying on paid reporting.
404, noindex and refresh/redirect templates do not collect optional events.

Withdrawal stops this module's custom events, updates Google's denied consent,
sets the GA4 disable flag and expires accessible first-party GA/Ads cookies for
withdrawn purposes. Reloading unloads already-loaded third-party code. A change
cannot erase prior/in-flight collection; no forced reload discards a draft form.
Google can process IP/device information during consented operation; exclusion
of form text does not make collection anonymous. Hosting/security logs and any
account-injected integrations require their own review. This code is not a
certification of every Canadian privacy obligation.

## Optional direct GA4/Ads routes — separate future configuration

1. Get ReviewsBoost's real GA4 web-stream Measurement ID and/or its actual Ads
   account conversion ID and manual lead-action label. Never copy another
   business's IDs or place credentials/tokens in public code.
2. Before enabling any additional route, review the public privacy notice and consent text for the
   actual providers/purposes, including applicable processing outside Canada.
   The current policy includes optional Google Tag Manager/Ads measurement. Version
   any policy change and update submission notices; preserve archived releases.
3. Disable GA4 Enhanced Measurement automatic form/outbound/site-search/history
   collection (or Enhanced Measurement entirely) so automatic events do not
   duplicate this route or capture user-supplied information. Review connected
   destinations and automatic Ads conversion rules. Keep automatic/enhanced
   user-provided-data collection off unless separately reviewed and authorized.
4. Set the real values in `measurement-config.js`. Leave unused destinations and
   missing labels null. An AW ID alone does not identify a lead conversion action.
5. Run `node install-measurement.cjs`, then the tests below. This adds one shared
   bootstrap across the HTML pages, respecting the 404's root asset paths.
   Review the concrete diff and privacy wording before deployment.
6. Mark confirmed `generate_lead` as the appropriate GA4 key event. For Ads,
   choose either a native manual-action conversion **or** a GA4 import as the
   primary bidding goal. Do not make both primary for the same enquiry. Keep
   CTA, starts and contact clicks secondary. Use Count: One as appropriate for
   lead acquisition and a genuine business value, not the quoted removal fee.
7. Verify with Tag Assistant, GA4 Realtime/DebugView and Ads diagnostics after
   granting the intended consent. Validated `_dbg=1` and numeric `gtm_debug`
   values are permitted; unknown debug/query contents remain blocked.

No account settings have been changed and actual account reporting has not been
verified. Direct GA4/native Ads routes remain unconfigured; the GTM container's
own Ads tag loads after advertising consent.

## Verification checklist

- [ ] Unconfigured fixture: no Google loader or unnecessary consent UI.
- [ ] Configured fresh visit/reject: no Google request; forms still work.
- [ ] Analytics only / advertising only: only the permitted destination/events.
- [ ] Accept both: one GTM container request, no duplicate direct tag or page view.
- [ ] Assessment CTA: one event with the correct fixed location.
- [ ] Focus alone: no start; first actual field edit: one start.
- [ ] Invalid/offline/HTTP/network/JSON/backend/legacy-error response: no lead.
- [ ] Explicit success, including notification_sent:false: one confirmed lead.
- [ ] Replayed same request: no duplicate; distinct new enquiry: another lead.
- [ ] Every payload: no personal information, form contents or customer reference.
- [ ] Email/telephone links: intent only; never destination/subject/number.
- [ ] Unknown query/hash: no optional collection; address and form preserved.
- [ ] GPC, blocked storage, saved choices, withdrawal and reload behave correctly.
- [ ] English/French and keyboard/mobile choices remain usable above the price bar.
- [ ] Check account imports/automatic rules for duplicate primary conversions.

Local verification: `node tests/measurement.cjs`, `node tests/homepage.cjs`,
`node tests/build.cjs`, `node --test tests/submission.test.cjs review-rating-model.test.mjs`,
`node tests/enquiry-flow.cjs`, and `node seo-audit.mjs`. Browser fixtures intercept
all Google and backend traffic; they do not send live enquiries or collection.
The existing enquiry browser test needs Playwright; the new browser checks use
Puppeteer with local Chrome. These are test tools, not frontend dependencies.

References:

- [Google consent mode and basic versus advanced behavior](https://developers.google.com/tag-platform/security/concepts/consent-mode)
- [Google consent implementation](https://developers.google.com/tag-platform/security/guides/consent)
- [Google event routing](https://developers.google.com/tag-platform/gtagjs/routing)
- [Ads conversion ID, label and transaction ID](https://support.google.com/tagmanager/answer/6105160?hl=en)
- [Tag Assistant connection/debug URL settings](https://support.google.com/tagassistant/answer/10039345?hl=en)
- [Canada OPC: meaningful choices and online behavioural advertising](https://www.priv.gc.ca/en/privacy-topics/technology/online-privacy-tracking-cookies/tracking-and-ads/bg_ba_1206/)
- [Québec CAI: privacy interfaces and default settings](https://www.cai.gouv.qc.ca/protection-renseignements-personnels/sujets-et-domaines-dinteret/interfaces-truquees)
