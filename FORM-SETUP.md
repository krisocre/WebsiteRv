# Forms and Google Sheets

## November 6: targeted input validation

The four active forms now use refreshed `enquiry-flow.js` and `form-submission.js` URLs with version `20261106-input-validation`. English/French field errors keep answers available for correction. Core names, email and quantity checks are enforced in both prepared backend code and the frontend; blank profile/review links remain valid. Blocked email domain: `fldubai.com`, including subdomains and case variants. The dollar-sign rule applies to the person's name; legitimate business names such as `$5 Pizza` and free-text evidence quoting spam/money remain allowed. Accented and other international names, apostrophes, hyphens, plus-addressed email and normal profile links are retained.

### Apply only the spam guard to the existing live backend

The current deployed Apps Script source cannot be read from this workspace. To preserve its actual notification handler and settings, use this additive update instead of replacing the live handler with an unrelated prepared version:

1. Open the EXISTING ReviewsBoost Apps Script project used by `form-submission.js`. Keep its spreadsheet configuration, email settings and existing deployment URL. This is separate from ReviewRemoval's Turnstile project.
2. Add a script file named `InputValidation.gs` and paste the full contents of [apps-script-input-validation.gs](apps-script-input-validation.gs). It requires no keys, properties or services. Keep one copy of `leadInputErrors`; if the current Code.gs already has that function and the `invalid_input` gate from this release, the rules are already included.
3. At the beginning of the existing `doPost(e)` handler, inside its `try` block and BEFORE it accesses Sheets or sends mail, add:

   ```js
   var rejectedInput = rejectInvalidLeadInput(e);
   if (rejectedInput) return rejectedInput;
   ```

4. Save, then **Deploy > Manage deployments > Edit the existing web app > New version > Deploy**. Updating that deployment preserves the site's endpoint. Do not add the ReviewRemoval Turnstile requirement to this project.
5. Verify ordinary submissions, owner notifications and input rejection after this deliberate backend update. Do not send an invalid-input HTTP probe to the old backend before updating it: that version may save the test as a lead or email it. The agent's tests use mocked storage/mail only.

The repository's full `google-apps-script.gs` also contains the same rules and gate, for projects already maintained from that full source. The additive path above preserves a different live handler's receipt/notification behaviour. Both bundles are tested for identical validation rules. Backend files are excluded from website publication.

Rules: personal names reject `$`, full-width dollar variants, Web links, line breaks, no letters and length over 150; business names allow punctuation/currency but reject Web schemes, embedded line breaks and length over 250. Email is capped at 254 characters; removal quantities must be whole numbers 1-50. Optional profile URLs must be HTTP(S), at most 2048 characters and have no embedded credentials; the observed google.com/share.google redirect path is rejected only in that profile field. Genuine share.google short links remain valid. Phone, review-detail and additional-context lengths have generous caps. Other quote requests do not require a review count.

The backend returns a fixed `invalid_input` field/message before saving or emailing. Rejected input is not a conversion. No endpoint, pricing, normal layout, cookie consent or measurement identifiers were changed. No Apps Script deployment, website release, live email or lead was performed by the agent.

## Existing full-handler setup reference

The English and French Google removal forms, five other platform-removal forms and reputation assessment form are configured to post to this Google Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
```

Publish the updated HTML pages with `platform-removal.css`, `platform-removal.js`, `form-submission.js`, `enquiry-flow.css` and `enquiry-flow.js`. Update the Apps Script handler separately. Changing the Apps Script deployment does not publish the website HTML or change its visible fields.

The handler only defines `doPost`, so opening the endpoint in a browser may show `Script function not found: doGet`. That GET response does not test whether a form POST is saved successfully.

| Form | `form_type` | Fields |
| --- | --- | --- |
| Remove reviews (`index.html`, homepage) | `remove_reviews` | Selected removal plan, full name, business name, email, optional phone, profile URL, review count, optional review links, removal reason |
| Google removal in French (`suppression-avis-google.html`) | `remove_reviews` | Same removal fields, French labels and acknowledgement |
| Remove reviews (`remove-facebook-reviews.html`) | `remove_reviews` | Facebook service and fees plus the standard removal fields |
| Remove reviews (`remove-yelp-reviews.html`) | `remove_reviews` | Yelp service and fees plus the standard removal fields |
| Remove reviews (`remove-tripadvisor-reviews.html`) | `remove_reviews` | Tripadvisor service and fees plus the standard removal fields |
| Remove reviews (`remove-trustpilot-reviews.html`) | `remove_reviews` | Trustpilot service and fees plus the standard removal fields |
| Remove reviews (`remove-glassdoor-reviews.html`) | `remove_reviews` | Glassdoor service and fees plus the standard removal fields |
| Reputation assessment (`online-reputation-management.html`, contact section) | `quote_request` | Full name, business name, email, optional phone, profile URL, requested reputation service and details |

All forms send `email_address` and/or `phone_number` in their own fields and copy the preferred address/number into `contact_detail`. Removal quantity uses `review_count`. The removal concern, optional context and request reference share `reason` to remain compatible with the original 12 sheet columns. `request_id` and `locale` are also sent separately. Name, business, email, phone, links, quantity and selected service remain in their respective columns.

The homepage places its cost calculator and assessment form in two adjacent sections on the page. `enquiry-flow.js` detects `data-inline-enquiry` and shows the five required inputs together: name, business, email, public Google link and quantity. Review concern, specific links, extra context and phone share one optional disclosure; there is no Next/Back step. The review count, calculator totals and estimate beside the form stay synchronized at CAD $45 upfront plus $95 per successfully removed review. The existing field names, endpoint, acknowledgement, request references and receipt/error handling are retained. Assessment links scroll to `#assessment`; they do not open a popup. The form also has a native POST action for visitors without JavaScript, with optional context available without disclosure enhancement.

On the other seven pages, `enquiry-flow.js` still arranges the existing fields into two steps, validates each step and preserves answers when going back. The first removal step asks for the public profile, quantity and concern (including an unsure option). Review links, extra context and phone are optional. The reputation form retains its required service and description. The second step collects contact details. None of these forms takes payment.

## Update the Apps Script deployment

1. Open the submissions spreadsheet and its bound project through **Extensions > Apps Script**.
2. Replace the existing handler with the contents of `google-apps-script.gs`. Because the project is opened from the submissions spreadsheet, `SPREADSHEET_ID` and `SHEET_NAME` can stay blank to use that bound spreadsheet and its active tab. For an unbound project, set the ID between `/d/` and `/edit` in the spreadsheet URL and the exact tab name. `NOTIFICATION_EMAIL` is set to `support@reviewsboost.ca`; change it only if submissions should reach another monitored inbox.
3. Keep the destination sheet's first row in this exact order (the script preserves the original 12 columns):

   ```text
   Timestamp | Selected Plan | Full Name | Business Name | Email | Phone | Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
   ```

4. Under **Deploy > Manage deployments**, edit the existing web app, select a new version, and deploy. Use **Execute as: Me** and **Who has access: Anyone** for public website submissions. Authorize Sheets and email access when prompted. Updating the existing deployment preserves the URL used by `form-submission.js`.
5. After publishing, submit controlled test requests through the live pages using an email address you own. Check the sheet columns, request references, service values, owner notifications and English/French customer acknowledgements. Confirm that the browser can read the final JSON response, including Google's redirect. These requests send real emails; the local automated tests mock them instead.

The handler accepts the older `email`, `phone`, `review_quantity`, and `reviews_to_remove` names too. Explicit `form_type` distinguishes removal requests and quotes even when they include a selected plan.

The handler opens the spreadsheet and tab explicitly because the bound script's active-document methods are unavailable when it runs as a web app. See Google's [bound script restrictions](https://developers.google.com/apps-script/guides/bound#special_methods).

## Confirmation and recovery

The browser uses a simple URL-encoded CORS POST and normally shows **Request received** only after reading `{ "result": "success" }`. Queueing a beacon, an opaque response or a failed request does not prove receipt. The one compatibility exception is the old deployment's exact `Failed to send email: no recipient` response: that handler appends the row before attempting email, so the browser identifies the request as saved and warns that its internal notification failed. Deploying the updated handler, with `NOTIFICATION_EMAIL` set to `support@reviewsboost.ca`, removes that warning and restores owner notification.

There is no automatic retry. An offline attempt can be retried after reconnection; a timeout, unreadable response or other ambiguous result preserves the answers, displays a reference and offers a local download plus support email. The form locks resubmission for that attempt to avoid duplicates. Check the reference in the sheet before requesting a fresh submission. An explicit server rejection remains retryable. Reloading the page clears unsent form answers, so save the request first.

There is an explanatory status after four seconds and a 60-second request timeout. Google can continue processing after a browser timeout. This is why an unconfirmed result does not claim failure or resend automatically. Live Apps Script latency and CORS behavior still require verification after deployment.

The updated handler saves and flushes the row before confirming. A script lock and reference lookup in the existing Reason column prevent repeated request IDs from appending twice. Notification failures are logged and do not turn a saved row into a failed submission. With `SEND_CUSTOMER_RECEIPTS = true`, it also attempts a fixed transactional acknowledgement in the form's language, throttled through the Apps Script cache per email address. The acknowledgement includes the reference and next steps, never user-submitted URLs or free text. Email delivery remains subject to MailApp quotas; check the sheet even if a notification is absent.

Local code changes do not deploy the script, fill in the private spreadsheet configuration, verify email delivery or publish the website.

## Local regression checks

Run `node --test tests/submission.test.cjs` for mocked storage, deduplication, notifications and transport checks. Run `node tests/enquiry-flow.cjs` with Playwright available to check all four active forms at desktop and phone widths. The browser test uses installed Chrome by default; `BROWSER_CHANNEL` can override that choice and `PLAYWRIGHT_MODULE` can point to an existing Playwright installation. All Google submission requests in these tests are intercepted; they do not contact the live endpoint or send email.

Google references: [web app parameters and execution settings](https://developers.google.com/apps-script/guides/web), [deployment versions](https://developers.google.com/apps-script/concepts/deployments), and [effective versus active user](https://developers.google.com/apps-script/reference/base/session).
