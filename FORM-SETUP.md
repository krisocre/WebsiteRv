# ReviewsBoost forms and Google Sheets

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

The local frontend now points to the tested ReviewsBoost-only URL:

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
pages use sender version `20261107-turnstile-endpoint`; their existing
enquiry-flow JS/CSS keep version `20261107-turnstile`. The ReviewsBoost
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
