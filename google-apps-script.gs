// Paste this file into the Apps Script project bound to your submissions sheet.
// Optional: set these to target a specific spreadsheet and tab. When this
// project is bound to the submissions sheet, the blank defaults use that sheet.
var SPREADSHEET_ID = '';
var SHEET_NAME = '';
// Deploy the web app to execute as you. Leave blank to notify the deploying user.
var NOTIFICATION_EMAIL = 'support@reviewsboost.ca';
// Transactional acknowledgements only; never marketing or quoted review content.
var SEND_CUSTOMER_RECEIPTS = true;

function doPost(e) {
  try {
    if (!e || !e.parameter) throw new Error('Submit this handler through the website form.');
    var data = e.parameter;

    function field() {
      for (var i = 0; i < arguments.length; i++) {
        var value = data[arguments[i]];
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          return String(value).trim();
        }
      }
      return '';
    }

    var timestamp = new Date();
    var fullName = field('full_name') || 'N/A';
    var businessName = field('business_name') || 'N/A';
    var businessUrl = field('business_url') || 'N/A';
    var selectedPlan = field('selected_plan') || 'N/A';
    var email = field('email_address', 'email');
    var phone = field('phone_number', 'phone');
    var contactMethod = field('contact_method');
    var contactInfo = field('contact_detail');

    // Support older forms that only sent the selected email/phone as contact_detail.
    if (contactInfo) {
      if (/^Email\b/i.test(contactMethod) || (!contactMethod && contactInfo.indexOf('@') !== -1)) {
        email = email || contactInfo;
      } else if (/^(WhatsApp|Phone Call|SMS)$/i.test(contactMethod)) {
        phone = phone || contactInfo;
      }
    }
    contactMethod = contactMethod || (email ? 'Email' : phone ? 'Phone Call' : 'N/A');
    contactInfo = contactInfo || (/^Email\b/i.test(contactMethod) ? email || phone : phone || email) || 'N/A';
    email = email || 'N/A';
    phone = phone || 'N/A';

    var reviewCount = field('review_count', 'reviews_to_remove', 'review_quantity') || 'N/A';
    var reviewLinks = field('review_links') || 'N/A';
    var reason = field('reason') || 'None Provided';
    var requestId = field('request_id');
    if (!/^RB-[a-z0-9-]{10,60}$/i.test(requestId)) requestId = 'RB-' + Utilities.getUuid();
    var referenceLine = 'Request reference: ' + requestId;
    if (reason.indexOf(referenceLine) === -1) reason += '\n' + referenceLine;
    var formType = field('form_type');

    // Reject retired or unexpected forms instead of silently accepting stale submissions.
    if (formType && ['remove_reviews', 'quote_request'].indexOf(formType) === -1) {
      throw new Error('This form type is no longer supported.');
    }

    // Older removal forms may not send a type, so infer only when the field is blank.
    if (!formType) {
      formType = /remov/i.test(selectedPlan) || reviewCount !== 'N/A' || reviewLinks !== 'N/A'
        ? 'remove_reviews'
        : 'quote_request';
    }
    // Enforce the same rules as the form before opening Sheets or sending mail.
    var inputErrors = leadInputErrors(data, formType === 'remove_reviews');
    var invalidField = Object.keys(inputErrors)[0];
    if (invalidField) {
      return ContentService.createTextOutput(JSON.stringify({
        result: 'error', code: 'invalid_input', field: invalidField,
        error: inputErrors[invalidField]
      })).setMimeType(ContentService.MimeType.JSON);
    }
    var formLabels = {
      remove_reviews: 'New Review Removal Request',
      quote_request: 'New Reputation Assessment Request'
    };
    var formLabel = formLabels[formType];
    var platformMatch = selectedPlan.match(/^(Google|Facebook|Yelp|Tripadvisor|Trustpilot|Glassdoor)\b/i);
    var platformName = platformMatch ? platformMatch[1] : 'Public business';
    if (formType === 'remove_reviews') formLabel = 'New ' + platformName + ' Review Removal Request';

    // Keep the existing 12-column sheet layout:
    // Timestamp | Selected Plan | Full Name | Business Name | Email | Phone |
    // Preferred Contact | Contact Detail | Profile URL | Review Count | Review Links | Reason
    var spreadsheet = SPREADSHEET_ID
      ? SpreadsheetApp.openById(SPREADSHEET_ID)
      : SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) throw new Error('Bind this project to the submissions spreadsheet or set SPREADSHEET_ID.');
    var sheet = SHEET_NAME ? spreadsheet.getSheetByName(SHEET_NAME) : spreadsheet.getActiveSheet();
    if (!sheet) throw new Error('The configured submissions sheet tab was not found.');
    var row = [timestamp, selectedPlan, fullName, businessName, email, phone,
      contactMethod, contactInfo, businessUrl, reviewCount, reviewLinks, reason];
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try {
      // The existing Reason column holds the reference, preserving 12 columns.
      // A repeated request ID cannot create another row or another email.
      var lastRow = sheet.getLastRow();
      if (lastRow > 1 && sheet.getRange(2, 12, lastRow - 1, 1).createTextFinder(referenceLine)
          .matchCase(true).useRegularExpression(false).findNext()) {
        return ContentService.createTextOutput(JSON.stringify({ result: 'success', request_id: requestId }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      sheet.appendRow(row.map(function (value) {
        // Store submitted text literally instead of executing a spreadsheet formula.
        return typeof value === 'string' && value.charAt(0) === '=' ? "'" + value : value;
      }));
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    var subject = formLabel + ' from ' + fullName;
    var body = 'You received a new submission!\n\n' +
      referenceLine + '\n' +
      'Form Type: ' + formLabel + '\n' +
      '----------------------------------------\n' +
      'Full Name: ' + fullName + '\n' +
      'Business Name: ' + businessName + '\n' +
      'Email Address: ' + email + '\n' +
      'Phone: ' + phone + '\n' +
      'Preferred Contact Method: ' + contactMethod + '\n' +
      'Contact Detail: ' + contactInfo + '\n' +
      (formType === 'remove_reviews' ? platformName + ' Profile URL: ' : 'Public Business Profile URL: ') + businessUrl + '\n\n';

    if (selectedPlan !== 'N/A') {
      body += (formType === 'remove_reviews' ? 'Selected Removal Service: ' : 'Requested Reputation Service: ') + selectedPlan + '\n';
    }
    if (formType === 'remove_reviews') {
      body += 'Reviews to Remove: ' + reviewCount + '\n' +
        'Review Links: ' + (reviewLinks !== 'N/A' ? reviewLinks :
          'Not provided - use the submitted profile and identifying details to locate the review(s), up to the requested quantity.') + '\n' +
        'Removal Reason: ' + reason + '\n';
    } else {
      body += 'Additional Details: ' + reason + '\n';
    }

    var myEmail = NOTIFICATION_EMAIL || Session.getEffectiveUser().getEmail();
    // A mail failure must not turn an already-saved lead into an error response.
    try { MailApp.sendEmail(myEmail, subject, body); }
    catch (notificationError) { console.error('Owner notification failed for ' + requestId); }
    if (SEND_CUSTOMER_RECEIPTS && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254) {
      try {
        // Limit acknowledgements to one per address per five minutes. The receipt
        // contains no submitted URLs or free text that could be used for spam.
        var cache = CacheService.getScriptCache();
        var emailKey = 'receipt-' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email.toLowerCase()));
        if (!cache.get(emailKey) && MailApp.getRemainingDailyQuota() > 0) {
          var french = field('locale') === 'fr-CA';
          var receiptBody = french
            ? 'Nous avons reçu votre demande ReviewsBoost.\n\nRéférence : ' + requestId + '\n\nAucun paiement n’a été effectué par le formulaire. Nous vous contacterons au sujet de votre demande et des modalités écrites avant toute commande. Conservez les liens, captures et dates des avis.\n\nQuestions : support@reviewsboost.ca\n\nSi vous n’avez pas envoyé cette demande, vous pouvez ignorer ce message.'
            : 'We received your ReviewsBoost request.\n\nReference: ' + requestId + '\n\nNo payment was taken by the form. We will contact you about your request and the written terms before you place an order. Keep any review links, screenshots and dates for your case.\n\nQuestions: support@reviewsboost.ca\n\nIf you did not make this request, you can ignore this message.';
          MailApp.sendEmail({ to: email, subject: french ? 'Votre demande ReviewsBoost' : 'Your ReviewsBoost request', body: receiptBody, name: 'ReviewsBoost', replyTo: 'support@reviewsboost.ca' });
          cache.put(emailKey, 'sent', 300);
        }
      } catch (receiptError) { console.error('Customer acknowledgement failed for ' + requestId); }
    }

    return ContentService.createTextOutput(JSON.stringify({ result: 'success', request_id: requestId }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// BEGIN LEAD INPUT RULES
// Keep this pure validation function identical in the browser and Apps Script.
// It uses no browser/Node APIs; Apps Script's V8 runtime can execute it directly.
function leadInputErrors(data, requireReviewCount) {
  var errors = {};
  function text(name) { return typeof data[name] === 'string' ? data[name].trim() : ''; }
  function blockedEmail(address) {
    var domain = address.toLowerCase().split('@').pop().replace(/\.+$/, '');
    return domain === 'fldubai.com' || domain.slice(-12) === '.fldubai.com';
  }
  var name = text('full_name');
  if (!name) errors.full_name = 'Enter your name.';
  else if (name.length > 150) errors.full_name = 'Keep your name to 150 characters or fewer.';
  else if (/[$\uFE69\uFF04\u0000-\u001F\u007F]|https?:\/\/|www\./i.test(name) || !/\p{L}/u.test(name)) {
    errors.full_name = 'Enter your name without links, dollar signs or line breaks.';
  }
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';
  else if (business.length > 250) errors.business_name = 'Keep the business name to 250 characters or fewer.';
  else if (/[\u0000-\u001F\u007F]|https?:\/\//i.test(business)) errors.business_name = 'Enter a business name without web links or line breaks.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';
  else if (blockedEmail(email) || (contact.indexOf('@') !== -1 && blockedEmail(contact))) errors.email_address = 'Please use a different email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  var profile = text('business_url');
  if (profile) {
    var parts = profile.match(/^https?:\/\/([^\s/?#]+)(?:[/?#][^\s]*)?$/i);
    if (profile.length > 2048 || !parts || /[@<>"\\]/.test(parts[1])) errors.business_url = 'Enter a valid public profile URL.';
    else {
      var decoded = profile;
      try { decoded = decodeURIComponent(profile); } catch (_) { /* Format checks above still apply. */ }
      if (/^https?:\/\/(?:www\.)?google\.com\/share\.google(?:[/?#]|$)/i.test(decoded)) {
        errors.business_url = 'Use a direct business profile or review link instead of this redirect link.';
      }
    }
  }
  if (text('phone_number').length > 80 || text('phone').length > 80) errors.phone_number = 'Keep the phone number to 80 characters or fewer.';
  if (text('review_links').length > 12000) errors.review_links = 'Keep review details to 12,000 characters or fewer.';
  if (text('reason').length > 20000) errors.reason = 'Keep additional details to 20,000 characters or fewer.';
  return errors;
}
// END LEAD INPUT RULES
