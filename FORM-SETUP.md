# ReviewsBoost forms and Google Sheets

## November 8: replacement Web app deployment URL

The owner chose New deployment for ReviewsBoost after copying the updated
Code.gs. The current endpoint in the LOCAL website source is now:

```text
https://script.google.com/macros/s/AKfycbx9nM4hs4qVE6pzwMFsQcFE_pgJC0FRp0KqTbozzNuL5m-77RHj7kZtK1FSuQBhHqT5UA/exec
```

Both the shared sender and native homepage action match this URL. All four
active form pages use `form-submission.js?v=20261108-backend` to refresh the
cached sender. Publish the five changed website files together; this edit
has not published the website or created another Apps Script deployment.
ReviewRemoval's URL is unchanged and its website was not edited.

Live probes to this replacement endpoint returned `verification_failed`
for missing and invalid tokens. No customer fields or valid token were sent.
Real-token storage, new notification formatting, the hidden audit tab and
inbox delivery have not been independently verified on this deployment.
Earlier six-check results below apply to the prior November 7 deployment.
Use the existing ReviewsBoost project/properties for future updates; choose
Edit > New version on the deployment matching the current URL above.

## November 8: concise emails and main sheet notes

This replaces the November 7 email-only instructions. The prepared backend
removes the generated `[Submission acknowledgement]` block from owner emails
and the main sheet's Reason column. Customer notes, traffic-source labels,
request references, deduplication and the twelve-column layout remain. The
full block is archived first in a hidden `ReviewsBoost Acknowledgements` tab
in the same spreadsheet. Spreadsheet editors can unhide that tab; hiding is
an organisational separation, not access control.

Use this site's complete `google-apps-script.gs` in the EXISTING separate
ReviewsBoost project, preserving its Script Properties and current /exec URL.
Save and deploy a New version of that same deployment. Leave the old shared
project and ReviewRemoval project unchanged. No new properties, keys or main
sheet columns are needed. Keep any deliberately enabled receipt setting;
the prepared file defaults to the existing owner-notification-only behaviour.

For existing rows, first run `previewAcknowledgementCleanup` and review its
counts; then run `cleanExistingAcknowledgements`, up to fifty matching rows
per run. Repeat until `remaining` is zero. Neither function submits forms
or sends emails. Previously delivered emails cannot be edited retroactively.
Instructions: `.seo-private/sheet-ack-cleanup-2026-11-08/INSTALL.md`.

The public profile field remains optional, unrestricted text. The homepage
CSS now sizes that field by its name rather than its former URL input type,
so it spans the form row and uses the same height as neighbouring inputs.
Publish `index.html` and `home.css` to apply that sizing change. The short
website notice and hidden acknowledgement payload remain intact.
No deployment or live sheet cleanup was performed by the agent.

## November 7: paid/organic label in notifications

All four active forms now attach a fixed `traffic_source` enum and prefix the
existing Reason with a readable label, such as
`[Traffic Source: Paid - Google Ads]` or `[Traffic Source: Organic - Google]`.
Existing handlers already save/email Reason, so these labels need no new
project, deployment, property, column or account ID. Publish the updated
website files, including `enquiry-flow.js?v=20261107-source-email` and the
current policy release. The prepared backend also adds a separate top email
line if deliberately redeployed, while preserving twelve sheet columns.

This is inferred request context, not verified ad billing or GA4 attribution.
Valid click indicators/paid UTM tags take precedence over a search referrer.
Unknown/direct/ambiguous signals remain `Direct / unknown`. The classifier
runs at submission, sets no cookies and uses no browser storage; it records
no raw click ID, search term, full URL or campaign value. Existing optional
measurement choices and Global Privacy Control suppress classification where
applicable. Without an optional measurement install, only the coarse current
page context is included; no Google tag or account is enabled. Original source
is not carried across page navigation, so an internal/direct visit can remain
unknown. Previous leads are not backfilled or guessed.

The bilingual privacy release `2026-11-07-lead-source` describes this context.
Earlier archived releases remain unchanged. No visual form question or new
checkbox was added. A declined/unknown source never prevents submitting.

## November 7: profile/review field accepts any text

All four active forms now use a non-required text input for `business_url`.
There are no URL format, scheme, redirect or length checks on this field.
Labels, design, pricing, field names and the tested endpoint are unchanged.
The form pages now use `enquiry-flow.js?v=20261107-source-email`; sender and CSS
versions remain unchanged.

The frontend, full backend and input-validation helper have matching rules.
For the deployed backend, replace ONLY the existing `leadInputErrors`
function with `.seo-private/profile-text-2026-11-07/AppsScript-validation-replacement.txt`,
save and deploy a New version of the SAME standalone ReviewsBoost web app.
Keep its URL, Script Properties, Turnstile, notifications and sheet columns.
Apply the identical replacement separately in ReviewRemoval's own project;
leave the old shared project untouched. Publish the website files separately.
No website or Apps Script deployment was performed by the agent.

## November 7: standalone project required

The owner confirmed that the legacy endpoint belongs to a SHARED Apps Script
project. Earlier instructions to add a ReviewsBoost Turnstile guard to that
project are superseded. Leave it and the separate ReviewRemoval project
unchanged. Create a NEW project **ReviewsBoost Forms - Turnstile** using the
entire [google-apps-script.gs](google-apps-script.gs) as its `Code.gs`.
Do not install duplicate helpers from `apps-script-turnstile.gs`.

Follow [TURNSTILE-SETUP.md](TURNSTILE-SETUP.md) for the five required Script
Properties, twelve sheet headers, `checkReviewsBoostSetup`, a new candidate
Web app deployment, and owner-run token/replay/email tests BEFORE cutover.
No project or deployment was created by the coding agent. The owner has now
provided a new `/exec` URL and the six passing browser checks, recorded in
TURNSTILE-SETUP.md. These include fresh-token success, owner notification
acceptance, wrong-action rejection and same-token replay rejection. The agent
submitted no valid lead. Inbox delivery and the sheet row count still need
the owner's manual confirmation.

At the November 7 cutover, the local frontend used this tested URL (superseded
by the replacement deployment above):

```text
https://script.google.com/macros/s/AKfycbzKrckb1hj0Poq3NUiywydhkTl5B8CNfGNB_8wgIcCaCKaVKNv4yQdIxHgtEq9EtEtBTQ/exec
```

Both `form-submission.js` and the native homepage form action use this URL.
All four active form pages request `form-submission.js?v=20261107-turnstile-endpoint`.
There is no fallback to the shared endpoint. Publish the changed website
files together, then check the normal form flow. No automatic website or
Apps Script deployment has been performed. Do not redeploy or add properties
to either the old shared project or ReviewRemoval's project.

## Active forms and behaviour

| Page | Form | Type |
| --- | --- | --- |
| `index.html` | `removalForm` | `remove_reviews`, Google, inline |
| `suppression-avis-google.html` | `platformRemovalForm` | `remove_reviews`, Google, French |
| `remove-yelp-reviews.html` | `platformRemovalForm` | `remove_reviews`, Yelp |
| `online-reputation-management.html` | `reputationForm` | `quote_request`, reputation |

Other retired platform pages do not have active forms. The four current
pages use sender version `20261108-backend`, enquiry-flow JS version
`20261107-source-email` and CSS version `20261107-turnstile`. The ReviewsBoost
widget is `0x4AAAAAAFy2a5sutqdFxytB`; it is unrelated to ReviewRemoval's key.
JavaScript is needed for security verification. The no-JavaScript homepage
notice provides the existing email contact alternative.

The homepage retains pricing followed by one inline assessment section.
Name, business, email and quantity are required; public profile/review links
remain non-required. Extra context and phone remain in one disclosure.
CAD $45 upfront and $95 per successfully removed review are unchanged.
The calculator and form quantities/totals remain synchronized. Other active
forms retain their existing two-step contact flow. No form takes payment.

## Storage, validation and notifications

The complete new handler reads `SPREADSHEET_ID`, `SHEET_NAME`,
`NOTIFICATION_EMAIL`, `TURNSTILE_SECRET` and `TURNSTILE_HOSTNAMES` from THIS
new project's Script Properties. There is no active-spreadsheet, implicit
recipient or shared-project fallback. Its row order stays:

```text
Timestamp | Selected Plan | Full Name | Business Name | Email | Phone | Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
```

Existing field aliases, literal spreadsheet storage and references in Reason
are retained. Missing/invalid/expired/wrong-context/replayed security tokens
are rejected before Sheets or email. Existing input validation remains:
personal names reject dollar signs/links/control characters; company names
allow normal punctuation/currency; `fldubai.com` and subdomains are blocked;
removal quantities are whole numbers 1–50. Unicode names, plus-addressed
emails, blank profile/review links and normal evidence quoting spam remain
allowed. Pure validation rules agree between browser and server.

Owner notifications use the explicitly configured inbox. `notification_sent`
reports MailApp acceptance, not inbox delivery. Notification failure does
not turn an already-saved enquiry into an error. The NEW handler defaults to
owner-only mail, matching the owner's supplied live handler. Optional fixed
bilingual customer receipts remain available with `SEND_CUSTOMER_RECEIPTS`,
default **false**; they never contain submitted URLs or free text and are
rate limited per email. No new customer mail is enabled automatically.

## Confirmation and recovery

The transport uses one URL-encoded CORS POST and reads explicit JSON success.
There is no automatic retry. Definitive input/security rejection preserves
answers and allows correction/a fresh token. An ambiguous timeout/network
result retains answers and locks repeat submission for that attempt; check
the reference in the sheet before starting again. Apps Script can finish
after the browser's 60-second timeout. Downloaded recovery records exclude
the security token. The existing simplified success design is preserved.

Request-reference lookup and a script lock prevent duplicate saved requests.
The legacy exact empty-recipient compatibility branch remains until the
new handler's normal transport has been tested. No endpoint, pricing,
analytics identifiers, terms UI or conversion event was changed here.

Local unit/browser/build commands and official technical references are in
[the standalone setup guide](TURNSTILE-SETUP.md). Those checks mock providers,
storage and mail. Private secret configuration, live delivery and publication
remain owner operations.
