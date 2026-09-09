# Forms and Google Sheets

The Google removal form, five platform-removal forms and reputation assessment form are configured to post to this Google Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
```

Deploy the updated HTML pages, `platform-removal.css`, `platform-removal.js` and the Apps Script handler. Changing the Apps Script deployment does not publish the website HTML or change its visible fields.

The handler only defines `doPost`, so opening the endpoint in a browser may show `Script function not found: doGet`. That GET response does not test whether a form POST is saved successfully.

| Form | `form_type` | Fields |
| --- | --- | --- |
| Remove reviews (`index.html`, homepage) | `remove_reviews` | Selected removal plan, full name, business name, email, optional phone, profile URL, review count, optional review links, removal reason |
| Remove reviews (`remove-facebook-reviews.html`) | `remove_reviews` | Facebook service and fees plus the standard removal fields |
| Remove reviews (`remove-yelp-reviews.html`) | `remove_reviews` | Yelp service and fees plus the standard removal fields |
| Remove reviews (`remove-tripadvisor-reviews.html`) | `remove_reviews` | Tripadvisor service and fees plus the standard removal fields |
| Remove reviews (`remove-trustpilot-reviews.html`) | `remove_reviews` | Trustpilot service and fees plus the standard removal fields |
| Remove reviews (`remove-glassdoor-reviews.html`) | `remove_reviews` | Glassdoor service and fees plus the standard removal fields |
| Reputation assessment (`online-reputation-management.html`, contact section) | `quote_request` | Full name, business name, email, optional phone, profile URL, requested reputation service and details |

All forms send `email_address` and/or `phone_number` in their own fields and copy the preferred address/number into `contact_detail`. Removal quantity uses `review_count`. Notes and removal reasons use `reason`; other fields are no longer packed into that text.

## Update the Apps Script deployment

1. Open the submissions spreadsheet and its bound project through **Extensions > Apps Script**.
2. Replace the existing handler with the contents of `google-apps-script.gs`. Set `SPREADSHEET_ID` to the ID between `/d/` and `/edit` in the spreadsheet URL, and `SHEET_NAME` to the exact destination tab name. Optionally set `NOTIFICATION_EMAIL`; otherwise notifications go to the account deploying the app.
3. Keep the destination sheet's first row in this exact order (the script preserves the original 12 columns):

   ```text
   Timestamp | Selected Plan | Full Name | Business Name | Email | Phone | Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
   ```

4. Under **Deploy > Manage deployments**, edit the existing web app, select a new version, and deploy. Use **Execute as: Me** and **Who has access: Anyone** for public website submissions. Authorize Sheets and email access when prompted. Updating the existing deployment preserves the URL already in both pages.
5. Submit one request from each platform page and one reputation assessment through the deployed website. Check their sheet columns, selected-service values and notification subjects.

The handler accepts the older `email`, `phone`, `review_quantity`, and `reviews_to_remove` names too. Explicit `form_type` distinguishes removal requests and quotes even when they include a selected plan.

The handler opens the spreadsheet and tab explicitly because the bound script's active-document methods are unavailable when it runs as a web app. See Google's [bound script restrictions](https://developers.google.com/apps-script/guides/bound#special_methods).

The browser currently uses `mode: 'no-cors'`, so it cannot inspect Apps Script's JSON response. The existing confirmation means the browser completed the request; verify actual storage/email delivery in the sheet and Apps Script executions. Local checks do not deploy the script or send live notifications.

Google references: [web app parameters and execution settings](https://developers.google.com/apps-script/guides/web), [deployment versions](https://developers.google.com/apps-script/concepts/deployments), and [effective versus active user](https://developers.google.com/apps-script/reference/base/session).
