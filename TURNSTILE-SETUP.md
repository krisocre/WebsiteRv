# ReviewsBoost standalone Turnstile backend

## Current deployment: November 8, 2026

The standalone project already exists. After installing the updated Code.gs,
the owner chose New deployment and supplied this replacement Web app URL:

```text
https://script.google.com/macros/s/AKfycbx9nM4hs4qVE6pzwMFsQcFE_pgJC0FRp0KqTbozzNuL5m-77RHj7kZtK1FSuQBhHqT5UA/exec
```

The LOCAL shared sender and homepage action now use this URL; all four form
pages load sender version `20261108-backend`. Publish those website files
together to apply the change. The agent has not published them. ReviewRemoval
kept its existing URL and has no source changes from this endpoint update.

Live checks against the replacement URL rejected both missing and invalid
tokens with JSON `result: error`, `code: verification_failed`. These probes
sent no customer fields or valid token. The new endpoint has not been tested
with a real-token lead, sheet write or notification by the agent. The six
owner-reported checks in the historical setup below apply to the earlier URL.

Keep the existing project's Script Properties and Code.gs. Future code
updates should use Manage deployments > Edit > New version on the deployment
with the URL above. The initial project-creation steps below are historical
onboarding instructions; do not create another project or change the old
shared/ReviewRemoval projects.

## Original setup and November 7 verification record

Updated November 7, 2026 after the owner confirmed that the old project is
shared. This guide SUPERSEDES the earlier additive/shared-project instructions.
Do not edit, redeploy or add properties to the old shared project or the
separate ReviewRemoval project. No production deployment has been performed.

## 1. Create the new project

1. Open https://script.google.com/ and choose **New project**.
2. Name it **ReviewsBoost Forms - Turnstile**.
3. In its default **Code.gs**, delete the sample function and paste the ENTIRE
   contents of [google-apps-script.gs](google-apps-script.gs). Save.
4. This one complete file includes the handler, input checks, Turnstile
   validation, replay protection and setup checks. Do not paste the old shared
   handler or add `apps-script-turnstile.gs`; its helpers are already included.

The filename Code.gs can appear in all three projects; project identity is
what separates their code and properties. This must be a genuinely NEW project,
not a second deployment or file inside the shared project.

## 2. Choose the ReviewsBoost destination

Use a ReviewsBoost-only spreadsheet, preferably a new one, with a receiving
tab such as **Leads**. Do not rename or replace the old shared/ReviewRemoval
tabs. Put these twelve headers in row 1, columns A through L:

```text
Timestamp | Selected Plan | Full Name | Business Name | Email | Phone | Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
```

These are twelve separate cells, not one cell containing the pipe-separated
line. This is the original column order. The request reference remains in
Reason; there is no extra column for Turnstile tokens.

## 3. Add exactly five Script Properties in the NEW project

Open **Project Settings** (gear) → **Script Properties** → **Add script
property** (or **Edit script properties**), enter the following and save:

| Exact property name | Value |
| --- | --- |
| `SPREADSHEET_ID` | The destination spreadsheet ID: the text between `/d/` and `/edit` in its URL. Do not paste the whole URL or the `gid`. |
| `SHEET_NAME` | The exact bottom tab name, for example `Leads`. This is not the spreadsheet title. |
| `NOTIFICATION_EMAIL` | Your existing monitored inbox for ReviewsBoost owner notifications. Use one real address. |
| `TURNSTILE_SECRET` | The private secret matching existing ReviewsBoost site key `0x4AAAAAAFy2a5sutqdFxytB`. Copy it directly from Cloudflare into this new project. |
| `TURNSTILE_HOSTNAMES` | `reviewsboost.ca`. Use `reviewsboost.ca,www.reviewsboost.ca` only if you serve the widget on both and Cloudflare allows both. |

Do not send the secret in chat, browser code, screenshots or Git. Do not copy
ReviewRemoval's secret. No `TURNSTILE_ACTION` or site-key property is needed;
the action is fixed to `quote_request`, and the site key is public frontend data.
Do not put URL schemes, paths, wildcards or localhost into the hostname value.
Confirm the allowed production hostname in the EXISTING Cloudflare widget;
do not create another widget.

## 4. Run the safe setup check

In the NEW project's function dropdown choose **checkReviewsBoostSetup** and
click **Run**. Authorize the new project under the account that can access
the destination spreadsheet and send its notifications.

Expected final log:

```json
{"configuration":"passed","spreadsheet_headers":"matched","secret_probe":"passed","real_token_validation":"pending","email_delivery":"not tested"}
```

This reads headers and sends a dummy token to Cloudflare to probe the secret.
It saves no lead and sends no email. It does NOT establish that the secret
matches the browser key or that live mail is delivered. Do not run `doPost`
from the editor; it needs an HTTP form event.

If the receiving tab cannot be found, run **diagnoseReviewsBoostSheet**. It
logs the actual spreadsheet URL and the configured/available tab names in
quotes, without reading lead rows or secrets. Check the spreadsheet ID as
well as the tab; identical tab names in different spreadsheets are different
destinations.

## 5. Deploy only the new project as a candidate

After the check passes, in this NEW project:

1. **Deploy → New deployment → Select type → Web app**.
2. Description: **ReviewsBoost - isolated verification candidate**.
3. **Execute as: Me** (the account with sheet/mail permissions).
4. **Who has access: Anyone** (anonymous visitors must be able to POST).
5. Deploy and copy the **Web app URL ending in `/exec`**. `/dev` is an
   editor-only test endpoint and is not suitable for the public form.

It must be different from BOTH existing endpoints:

```text
Shared: https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
ReviewRemoval: https://script.google.com/macros/s/AKfycbzK_hATDZaXApgEUITdZ1kgF6VirBLCpcK1q3tmiFoWhG2AZpy_B6uOy5CFjTejVo8T/exec
```

Do not update either old deployment. Opening this POST-only web app in a
browser may report `doGet` not found; that is not a POST submission test.

## 6. Test before changing any website endpoint

The owner supplied this deployment on November 7 and reported all six
browser checks passed. It is now the destination in the LOCAL website code;
the coding agent has not published the website:

```text
https://script.google.com/macros/s/AKfycbzKrckb1hj0Poq3NUiywydhkTl5B8CNfGNB_8wgIcCaCKaVKNv4yQdIxHgtEq9EtEtBTQ/exec
```

Agent live checks: anonymous GET reached the expected POST-only app message;
missing-token and invalid-token POST probes both returned `result: error`,
`code: verification_failed`. Those probes contained no customer fields or
valid token. The owner then supplied the six passing browser results:
missing token, invalid token, wrong action, fresh real token, owner notification
acceptance and replay of the same token. These are owner-reported real-token
results, not an agent-run real submission. MailApp acceptance does not prove
inbox delivery; the owner should still confirm one test row and owner email.

The local owner-operated utility is
`.seo-private/reviewsboost-standalone-2026-11-07/test-new-endpoint.js`.
It is ignored by Git and is not published with the website.

1. Open **https://reviewsboost.ca/** and DevTools → Console. Review the local
   utility, then paste/run it. Its confirmation prompt is prefilled with the
   candidate URL above. It never asks for a secret and refuses both old
   endpoints and `/dev` URLs.
2. It checks missing/invalid tokens, a real token with the wrong action,
   one fresh correct token, and replay of the same token. Complete each
   temporary browser check as requested.
3. Exactly one correctly verified, clearly labelled **TURNSTILE TEST** enquiry
   should create one row and attempt one owner notification. The handler
   returns `notification_sent: true` only if MailApp accepted that call.
4. Manually confirm ONE matching row and ONE owner email. An accepted mail
   call is not proof of inbox delivery. Wrong/missing/replayed tokens must
   save no rows and send no email. Never rerun an unconfirmed request before
   checking the labelled row; a timeout can occur after storage succeeds.
5. The utility does not call the site's form handler, success events or Ads
   conversion hooks, and does not change live fields or endpoints. Tokens
   remain in memory and are never printed or stored by it.

The complete new handler defaults to owner notifications only, matching the
owner's supplied live handler. Its optional fixed bilingual customer receipt
functionality remains available, but `SEND_CUSTOMER_RECEIPTS` is **false**.
Enable it deliberately only if customer acknowledgement emails are wanted.

## 7. Cut over ReviewsBoost only, after successful testing

The six passing results have been received. Local source has been updated:

- `form-submission.js` uses the tested ReviewsBoost-only endpoint above.
- `index.html` has the matching native form action.
- All four active form pages use sender version `20261107-turnstile-endpoint`.
- No fallback to the shared endpoint is present. Form fields, widget key,
  pricing, consent, tracking and all other client behaviour remain unchanged.

Release these changed website files together and verify the normal form flow
against the new endpoint. No automatic publication was performed. Leave
ReviewRemoval files, project, properties and deployments
untouched. Keep the old shared project unchanged until any remaining uses
have been audited; do not disable it as part of this task.

## Implementation and local validation

The already prepared frontend protects four active forms: homepage Google,
French Google, Yelp and reputation. It uses one explicit lazy provider
loader and the supplied existing site key, with responsive widget sizing,
English/French status, expiry and retry handling. Security is independent
of optional analytics consent.

The new server calls `https://challenges.cloudflare.com/turnstile/v0/siteverify`
with secret/response only. It requires boolean success, signed action
`quote_request` and an exact allowed ReviewsBoost hostname, before any sheet
or notification work. Missing/invalid/expired/replayed tokens fail closed.
An atomic six-minute SHA-256 token ledger adds replay protection without
storing raw tokens or lead details. Existing twelve-column storage, input
validation, request references, duplicate-request protection, prices and
confirmed-only conversion hooks are preserved. Mail failures do not disguise
an already-saved enquiry as an unsaved request.

```text
node --test tests/submission.test.cjs tests/turnstile.test.cjs
node tests/turnstile.cjs
node tests/enquiry-flow.cjs
node tests/measurement.cjs
node tests/homepage.cjs
node tests/build.cjs
node seo-audit.mjs
```

Local tests mock providers, storage and mail; they do not prove live secret
configuration, real-token validation or email delivery. No deployment or
real lead/email test has been performed by the agent.

## Official references

- [Google Apps Script web apps](https://developers.google.com/apps-script/guides/web)
- [Project-scoped Script Properties](https://developers.google.com/apps-script/guides/properties)
- [Cloudflare server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
- [Client rendering](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/)
- [Widget configuration](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/)

The exact requested Spin prompt URL could not be retrieved by the available
tools (Markdown unsupported in the browser tool and HTTP 403 from the shell).
No replacement widget or account was created. Accessible official
client/server documentation was followed instead.
