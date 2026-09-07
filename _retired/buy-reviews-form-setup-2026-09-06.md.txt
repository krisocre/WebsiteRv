# Forms and Google Sheets

All three website forms are configured to post to this Google Apps Script deployment:

```text
https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec
```

Deploy the updated `index.html` and `remove-google-reviews.html` as well as the Apps Script handler. Changing the Apps Script deployment does not publish the website's HTML or change its visible fields. A live-site check on September 5, 2026 still found the previous URL and old field names on both public pages.

The handler only defines `doPost`, so opening the endpoint in a browser may show `Script function not found: doGet`. That GET response does not test whether a form POST is saved successfully.

| Form | `form_type` | Fields |
| --- | --- | --- |
| Buy reviews (`index.html`, order modal) | `buy_reviews` | Selected plan, full name, business name, preferred contact method, email or phone, profile URL, optional order details |
| Remove reviews (`remove-google-reviews.html`) | `remove_reviews` | Selected removal plan, full name, business name, email, optional phone, profile URL, review count, optional review links, removal reason |
| Free quote (`index.html`, contact section) | `quote_request` | Full name, business name, email, optional phone, profile URL, optional package interest and details |

All forms send `email_address` and/or `phone_number` in their own fields and copy the preferred address/number into `contact_detail`. Removal quantity uses `review_count`. Notes and removal reasons use `reason`; other fields are no longer packed into that text.

## Update the Apps Script deployment

1. Open the submissions spreadsheet and its bound project through **Extensions > Apps Script**.
2. Replace the existing handler with the contents of `google-apps-script.gs`. Set `SPREADSHEET_ID` to the ID between `/d/` and `/edit` in the spreadsheet URL, and `SHEET_NAME` to the exact destination tab name. Optionally set `NOTIFICATION_EMAIL`; otherwise notifications go to the account deploying the app.
3. Keep the destination sheet's first row in this exact order (the script preserves the original 12 columns):

   ```text
   Timestamp | Selected Plan | Full Name | Business Name | Email | Phone | Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
   ```

4. Under **Deploy > Manage deployments**, edit the existing web app, select a new version, and deploy. Use **Execute as: Me** and **Who has access: Anyone** for public website submissions. Authorize Sheets and email access when prompted. Updating the existing deployment preserves the URL already in both pages.
5. Submit one buy request, one removal request, and one quote through the deployed website. Check their sheet columns and notification subjects, including an order using a phone contact method.

The handler accepts the older `email`, `phone`, `review_quantity`, and `reviews_to_remove` names too. Explicit `form_type` distinguishes removal requests and quotes even when they include a selected plan.

The handler opens the spreadsheet and tab explicitly because the bound script's active-document methods are unavailable when it runs as a web app. See Google's [bound script restrictions](https://developers.google.com/apps-script/guides/bound#special_methods).

The browser currently uses `mode: 'no-cors'`, so it cannot inspect Apps Script's JSON response. The existing confirmation means the browser completed the request; verify actual storage/email delivery in the sheet and Apps Script executions. Local checks do not deploy the script or send live notifications.

Google references: [web app parameters and execution settings](https://developers.google.com/apps-script/guides/web), [deployment versions](https://developers.google.com/apps-script/concepts/deployments), and [effective versus active user](https://developers.google.com/apps-script/reference/base/session).
