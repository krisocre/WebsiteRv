# ReviewsBoost conversion measurement

## Automatic cookie banner removed — November 13, 2026

The cookie panel now starts hidden on every visit. It opens only from Cookie
choices in the footer. Existing saved choices are honoured; new visitors have
optional analytics and advertising disabled until they choose otherwise.
The form works without making a cookie choice and does not open the panel.
With no automatic prompt, fewer new visitors will enable optional tracking.
Browsing and submitting an enquiry do not grant permission automatically.

Footer settings still support independent choices, withdrawal, the browser
privacy signal and English/French controls. Google IDs, confirmed-lead events,
forms, Turnstile and the Apps Script endpoint are unchanged. Publish the updated
HTML and measurement.js together, using runtime version
`20261113-footer-choices`; CSS and configuration keep their existing versions.
Nothing was deployed. These notes supersede earlier automatic-banner behaviour.

## Named Google Ads event helper — November 12, 2026

The supplied `gtag_report_conversion(url)` helper is now defined in the
shared head-loaded measurement.js and exposed on window. It sends the
configured **AW-18568327970/XARtCKC2grYdEKLmiJZF** action with **1.0 CAD**,
the supplied event_callback and the existing independent transaction ID /
empty user_data privacy settings. No new base tag or second conversion
sender was added.

The existing saved-request handler calls confirmedLead, which validates
and deduplicates the request before invoking this helper in a short-lived
confirmed-lead context. Raw button clicks, failed submissions and direct
helper calls outside that context do not count. The form keeps its existing
submit handling: do not add an onclick handler that would cancel submission
or count a click before saving. The quote flow passes no redirect URL, so
the callback leaves the in-page success message intact. Advertising consent,
URL privacy rules and all existing destination/account IDs are unchanged.

Runtime references use `measurement.js?v=20261112-lead-snippet`; banner CSS
keeps its existing cookie-banner version. Publish the updated HTML and JS
together. Pending cookie-banner changes remain intact. No deployment or
live test conversion was performed. The helper's presence alone does not
verify the action inside Google Ads; that account-side verification remains
the guided flow documented below.

Validation and the complete incremental file list are in
`.seo-private/lead-snippet-20261112/REPORT.md`.

## Visible cookie choices — November 12, 2026

The first-visit controls are now a compact, non-modal banner fixed near the
bottom of the browser window. Accept, Reject and Settings are immediately
visible, with equal accept/reject styling. The banner is separate from page
layout, respects mobile safe areas and scrolls internally on short screens.
It does not lock the page, trap focus or automatically grant permission.

Saved choices hide the prompt on later visits. The footer Cookie choices
button reopens it and restores focus on dismissal. Accepting/rejecting no
longer scrolls the page to the footer; a visitor already using the form
returns to that field. Keyboard navigation reaches the prompt after the
skip link, and English/French controls remain available. Earlier references
to footer-only consent controls below describe the previous presentation.

Analytics/Ads IDs, consent defaults, GPC, preference storage, lead tracking,
forms, Turnstile, Apps Script, pricing and legal policy versions are unchanged.
The banner CSS uses `?v=20261112-cookie-banner`; shared JS uses the latest
tracking release above. Both references prevent cached older assets.
Publish the changed HTML, measurement.js and measurement.css together.
Nothing was deployed automatically. Validation and the full file list are
in `.seo-private/cookie-banner-20261112/REPORT.md`.

## Google Ads account verification — November 11, 2026

The owner clarified that the current status is **Unverified / Inactive** in
Google Ads. The latest attachment contains the same Submit lead form action
already configured: AW-18568327970/XARtCKC2grYdEKLmiJZF, CAD 1. Its base
example still names the historical GTM-WQSPSM5Z container; it is not a new
lead-action ID and does not justify changing containers again.

Read-only checks of the live site confirmed the published WDP/GHB target,
one executing container after cookie acceptance, a request for the correct
Analytics destination, restored consent and matching production tracking /
submission source. These checks intercepted Google collectors and submitted
no forms; they did not establish Google Ads account verification. Evidence:
`.seo-private/ads-verification-20261111/live-check.json`.

Complete the account's guided verification:

1. In Google Ads, open Goals → Summary → All conversions. Find **Submit
   lead form**, hover its Unverified / Tag inactive status, and choose
   **Troubleshoot → Continue**.
2. Enter https://reviewsboost.ca/ and connect. Keep the Ads, Tag Assistant
   and website tabs open. If prompted, select **Debug live version**.
3. In the connected website tab, use Cookie choices to accept analytics
   and advertising measurement. Complete the main quote form once with
   your own contact details, labelled as an owner tracking test rather
   than paid work. Complete the security check and wait for **Request
   sent**. A button click or invalid submission does not fire this action.
4. Return to the Tag Assistant badge, select **Finish**, inspect the
   verified/failed result for the exact action above, then close Tag
   Assistant. Google documents approximately 30 minutes for verified debug
   results to update the account. **No recent conversions** can be the
   normal status after verification; **Recording** requires conversions.

If this guided session does not detect the action, retain its failure
details for diagnosis. Do not add another event snippet, change IDs, click
paid ads to test, or treat a local test as proof of private account status.
The agent did not run the owner-account step or send a live test lead.

Google instructions:
https://support.google.com/google-ads/answer/10989978
https://support.google.com/google-ads/answer/10031686?hl=en

## Active Analytics target — November 11, 2026, final correction

The owner is testing **GTM-WDPZNW9T / G-HBMLS9LBV0**. The live website at
the start of this check instead used the subsequently supplied empty
GTM-PWQPS7HJ container. That mismatch prevented the requested Analytics
stream from receiving visits through the installed container; successful
Ads conversions did not establish that Analytics was connected.

The local configuration now restores **GTM-WDPZNW9T**, whose published
resource version 2 was verified to include **G-HBMLS9LBV0** and the existing
Ads destination **AW-18568327970**, without the manual lead-action label.
`tagManagerGa4MeasurementId` is G-HBMLS9LBV0 and `googleAdsViaTagManager`
is true. The container owns its base destination setup; the site does not
configure those destinations a second time when both purposes are accepted.
Advertising-only consent retains the standalone Ads route without loading
the Analytics container. The confirmed-lead event, label/value, consent
checks, form behaviour and personal-data opt-outs remain unchanged.

All HTML pages use `?v=20261111-wdpznw9t-v2` for the shared local scripts.
Publish the updated HTML, measurement-config.js and measurement.js together
before checking the live target again. No automatic deployment or account
change was performed. Test with Tag Assistant after analytics acceptance;
a first-visit scanner without cookie acceptance can still see no tag.
Do not create another container or add another manual Analytics loader.

The current published Google container also enables automatic customer-data
and form-event features. Keep automatic customer-data collection disabled
in the account settings; local empty-user_data opt-outs remain in place.
Automatic form events are not proof that a quote was successfully saved.
The exact lead action remains the explicit-success event described below.

The container-replacement sections farther below are historical records;
this active target supersedes them. Verification evidence and the complete
file list are in `.seo-private/tag-target-20261111-wdp/REPORT.md`.

## Homepage quote form: Google Ads event snippet

The main homepage quote form is `#removalForm`; its submit button is
`#removalForm button[type="submit"]`. The existing integration already
reports the owner's **Submit lead form** action:

- Destination: `AW-18568327970/XARtCKC2grYdEKLmiJZF`.
- Value/currency: the supplied nominal lead value, `1` / `CAD`.
- Trigger: the protected Apps Script sender returns explicit saved-request
  success; a click, validation failure or unsuccessful/uncertain response is
  not a confirmed quote. The legacy notification-error UI accommodation is
  also excluded. A genuinely saved response with `notification_sent: false`
  remains a lead.
- Route: `enquiry-flow.js` calls `ReviewsBoostMeasurement.confirmedLead`;
  the named `gtag_report_conversion` helper in measurement.js then sends
  `gtag('event', 'conversion', ...)` after advertising consent. This is one
  guarded conversion route, including for the main homepage quote form.
- Deduplication: the existing request key is checked in memory; the provider
  receives a separate random transaction ID and no form contents.

Do not paste a second event snippet or an onclick conversion onto this
button, and do not create another primary GTM/GA4 conversion for the same
saved lead. The form requests a quote and takes no payment: its estimated
fees are not transaction revenue. No purchase conversion or dynamic quote
value was added. Other forms retain their existing measurement.

For local verification run `node tests/gtm.cjs`. The private real-provider
check at `.seo-private/tag-bootstrap-2026-11-11/check-published.cjs` executes
the published container/Ads libraries but blocks every Google collector and
backend request. It confirms the expected action label is requested once
by the website; it does not verify attribution or private Ads account status.

## Installation detection and head placement — November 11, 2026

The owner explicitly selected **GTM-PWQPS7HJ** to replace GTM-WDPZNW9T.
Only that replacement container is now configured. Its public script
returned HTTP 200, resource version 1, with an empty tags array and no
published G- or AW- destination. Installing the container does not complete
Analytics account setup: Analytics will need a Google tag configured and
published in this container. No G- destination was invented or copied into
it. The old container's G-HBMLS9LBV0 destination is not assumed to belong to
the replacement. `tagManagerGa4MeasurementId` is null accordingly.
The public script snapshot is saved privately under
`.seo-private/tag-bootstrap-2026-11-11/`.

The shared bootstrap now appears immediately after `<head>` on all 40 HTML
pages, with the actual GTM container ID in an explanatory source comment.
The configured container is **GTM-PWQPS7HJ**. Its script is inserted
first in the head after analytics consent. Both local JavaScript references
use `?v=20261111-pwqps7hj` so browsers/CDN caches do not reuse an older bootstrap
or container configuration. The installer preserves this placement when
pages are regenerated; it does not add a second Google installation.

The existing direct Ads destination AW-18568327970 and confirmed-lead label
XARtCKC2grYdEKLmiJZF remain unchanged and do not depend on tags inside GTM.
The safe reviewsboost_generate_lead data-layer event remains available for
future container configuration. No Analytics or Tag Manager account setting
was changed here; private setup status and live collection are not verified.

The site uses basic consent mode: Analytics is not loaded before analytics
consent, and the existing Ads route requires advertising consent. A fresh
installation check that does not accept cookies can therefore see no tag.
For an interactive verification, connect https://reviewsboost.ca/ in
https://tagassistant.google.com/, accept cookies in the opened website tab,
then inspect GTM-PWQPS7HJ. A container appearing there is distinct from a
configured Analytics destination sending events.
Google documents this consent-related connection sequence at
https://developers.google.com/tag-platform/security/guides/consent-debugging.
Do not use a duplicate unconditional snippet to make a scanner pass.

Publish the changed HTML files, measurement-config.js and measurement.js
together; the shared
installer and updated tests/documentation are source/developer files. No
automatic publication, real customer lead or test conversion is required.
The Ads destination/lead label, consent choices, legal notice, forms,
Turnstile, Apps Script, pricing and page metadata remain unchanged.

## Earlier replacement container — November 11, 2026 (superseded)

The owner replaced `GTM-WQSPSM5Z` with **GTM-WDPZNW9T**. The replacement was
inspected read-only and contains GA4 destination **G-HBMLS9LBV0**, with no Ads
destination or copy of the existing lead-action label. The old container's
Ads base tag must not be assumed to exist in this replacement.

Current local configuration:

```js
window.ReviewsBoostMeasurementConfig = Object.freeze({
  googleTagManagerId: 'GTM-WDPZNW9T',
  tagManagerGa4MeasurementId: 'G-HBMLS9LBV0',
  googleAdsViaTagManager: false,
  ga4MeasurementId: null,
  googleAdsId: 'AW-18568327970',
  googleAdsLeadConversionLabel: 'XARtCKC2grYdEKLmiJZF'
});
```

The new container loads once after **analytics consent**. It owns GA4
initialization and its base page view; the website does not configure that
G- ID a second time. Withdrawal sets its ga-disable flag and stops the site's
custom analytics events. The old container is not loaded by runtime code.

The supplied **Ads lead action remains unchanged**. Because the replacement
has no Ads base destination, `googleAdsViaTagManager` is false: the existing
Google Ads loader/config runs separately after **advertising consent**.
Only explicit backend success sends the native conversion, with the same
label, nominal CAD $1 value, currency, random transaction ID and empty
user_data. Analytics-only does not initialize Ads; advertising-only does
not load the GA4 container. GPC keeps advertising off. No second container,
unconditional Google loader, submit-click conversion or noscript consent
bypass was pasted into HTML.

The website still offers **reviewsboost_generate_lead** as a safe Custom
Event after a confirmed request and analytics consent. To send it to GA4,
configure a GA4 Event tag in this replacement container using that exact
trigger and event name **generate_lead**, with G-HBMLS9LBV0. Do not add another
GA4 page-view tag; the base tag already sends its view. Keep the native Ads
lead action as the single primary Ads route unless deliberately migrating;
do not also import the same GA4 lead as primary. Automatic form events in
the published container are diagnostics, not confirmed saved requests.

The replacement enables automatic user-provided-data capability and automatic
form events in its published settings. Local empty-user_data opt-outs remain;
turn off automatic customer-data collection and review automatic event
detection in the new container's Google tag settings. These are account
settings, not changes this source can make. No form fields or request IDs
are included in site event parameters.

Privacy wording now accurately describes separate Analytics/Ads routes in
English/French, with preserved old archives and new release
`2026-11-11-analytics-container`. The four forms reference that release with
unchanged visible acknowledgement wording. Publish the changed website files
together, including the new snapshot and updated policy pages, then refresh
caches and verify the relevant consent route in Tag Assistant. Select the
new GTM/G- destination for Analytics and AW-18568327970 for the Ads action.
No Apps Script, payment, pricing, backend, Turnstile or other website change.
No website push/deployment or Google account edit was performed.

The sections below are historical setup records, superseded by this current
configuration. Full changed-file list and checks are in
`.seo-private/container-swap-2026-11-11/REPORT.md`.

## Earlier lead conversion setup — November 11, 2026

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
