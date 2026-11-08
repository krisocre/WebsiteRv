/**
 * Complete ReviewsBoost-only endpoint: paste this ENTIRE file into Code.gs
 * in a NEW standalone project named ReviewsBoost Forms - Turnstile.
 * Do NOT change the old shared project or the separate ReviewRemoval project.
 * Do NOT install a second copy of the helpers from apps-script-turnstile.gs.
 * Required Script Properties: SPREADSHEET_ID, SHEET_NAME, NOTIFICATION_EMAIL,
 * TURNSTILE_SECRET, TURNSTILE_HOSTNAMES. See TURNSTILE-SETUP.md.
 * Preserve the existing 12-column submissions layout documented below.
 */
// Match the owner's supplied live handler: owner notifications only by default.
// Optional fixed transactional customer receipts can be enabled deliberately.
var SEND_CUSTOMER_RECEIPTS = false;

function doPost(e) {
  try {
    // The guard runs before Sheets, mail, customer receipts or input handling.
    var rejectedVerification = rejectUnverifiedReviewsBoostRequest(e);
    if (rejectedVerification) return rejectedVerification;
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
    // Standalone web apps must select their own destination explicitly.
    var settings = reviewsBoostFormSettings();
    var sheet = reviewsBoostSubmissionSheet(settings);
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

    var myEmail = settings.notificationEmail;
    var notificationSent = false;
    // A mail failure must not turn an already-saved lead into an error response.
    try { MailApp.sendEmail(myEmail, subject, body); notificationSent = true; }
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

    return ContentService.createTextOutput(JSON.stringify({ result: 'success', request_id: requestId, notification_sent: notificationSent }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function reviewsBoostFormSettings() {
  var properties = PropertiesService.getScriptProperties();
  var spreadsheetId = (properties.getProperty('SPREADSHEET_ID') || '').trim();
  // Preserve the exact tab name, including intentional spaces.
  var sheetName = properties.getProperty('SHEET_NAME') || '';
  var notificationEmail = (properties.getProperty('NOTIFICATION_EMAIL') || '').trim();
  if (!spreadsheetId || !sheetName.trim() || !notificationEmail) {
    throw new Error('Set SPREADSHEET_ID, SHEET_NAME and NOTIFICATION_EMAIL in this NEW ReviewsBoost project.');
  }
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(notificationEmail)) {
    throw new Error('NOTIFICATION_EMAIL must be one valid owner notification email address.');
  }
  return { spreadsheetId: spreadsheetId, sheetName: sheetName, notificationEmail: notificationEmail };
}

function reviewsBoostSubmissionSheet(settings) {
  var sheet = SpreadsheetApp.openById(settings.spreadsheetId).getSheetByName(settings.sheetName);
  if (!sheet) throw new Error('The configured submissions tab was not found. Check SPREADSHEET_ID and the exact bottom tab name in SHEET_NAME.');
  return sheet;
}

/** Owner-run setup check: reads only headers and configuration; no lead or mail. */
function checkReviewsBoostSetup() {
  var settings = reviewsBoostFormSettings();
  var sheet = reviewsBoostSubmissionSheet(settings);
  var expected = ['Timestamp', 'Selected Plan', 'Full Name', 'Business Name', 'Email', 'Phone',
    'Preferred Contact', 'Contact Detail', 'Profile URL', 'Review Count', 'Review Links', 'Reason'];
  var actual = sheet.getRange(1, 1, 1, expected.length).getValues()[0];
  if (expected.some(function (header, index) { return actual[index] !== header; })) {
    throw new Error('Row 1 must match the 12 headers in TURNSTILE-SETUP.md, in order. No cells were changed.');
  }
  var probe = checkReviewsBoostTurnstileSetup();
  var summary = { configuration: 'passed', spreadsheet_headers: 'matched', secret_probe: probe.secret_probe,
    real_token_validation: 'pending', email_delivery: 'not tested' };
  console.log(JSON.stringify(summary));
  return summary;
}

/** Troubleshoot the configured destination without reading leads or secrets. */
function diagnoseReviewsBoostSheet() {
  var settings = reviewsBoostFormSettings();
  var spreadsheet = SpreadsheetApp.openById(settings.spreadsheetId);
  console.log('Spreadsheet: ' + spreadsheet.getUrl());
  console.log('Configured tab: ' + JSON.stringify(settings.sheetName));
  console.log('Actual tabs: ' + JSON.stringify(spreadsheet.getSheets().map(function (sheet) { return sheet.getName(); })));
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
  else if (data.full_name.length > 150) errors.full_name = 'Keep your name to 150 characters or fewer.';
  else if (/[$\uFE69\uFF04\u0000-\u001F\u007F]|https?:\/\/|www\./i.test(data.full_name) || !/\p{L}/u.test(name)) {
    errors.full_name = 'Enter your name without links, dollar signs or line breaks.';
  }
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';
  else if (data.business_name.length > 250) errors.business_name = 'Keep the business name to 250 characters or fewer.';
  else if (/[\u0000-\u001F\u007F]|https?:\/\//i.test(data.business_name)) errors.business_name = 'Enter a business name without web links or line breaks.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';
  else if (blockedEmail(email) || (contact.indexOf('@') !== -1 && blockedEmail(contact))) errors.email_address = 'Please use a different email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  // business_url is optional free text; do not validate its format or length.
  if (text('phone_number').length > 80 || text('phone').length > 80) errors.phone_number = 'Keep the phone number to 80 characters or fewer.';
  if (text('review_links').length > 12000) errors.review_links = 'Keep review details to 12,000 characters or fewer.';
  if (text('reason').length > 20000) errors.reason = 'Keep additional details to 20,000 characters or fewer.';
  return errors;
}
// END LEAD INPUT RULES

// BEGIN REVIEWSBOOST TURNSTILE
function reviewsBoostTurnstileProperties() {
  var properties = PropertiesService.getScriptProperties();
  var secret = (properties.getProperty('TURNSTILE_SECRET') || '').trim();
  var hosts = (properties.getProperty('TURNSTILE_HOSTNAMES') || '')
    .split(',').map(function (value) { return value.trim(); }).filter(Boolean);
  var productionHosts = ['reviewsboost.ca', 'www.reviewsboost.ca'];
  // Cloudflare's public testing credentials must never open the production gate.
  var testSecrets = ['1x0000000000000000000000000000000AA', '2x0000000000000000000000000000000AA', '3x0000000000000000000000000000000AA'];
  if (!secret || testSecrets.indexOf(secret) !== -1 || !hosts.length || hosts.some(function (host) {
    return productionHosts.indexOf(host) === -1;
  })) return null;
  return { secret: secret, hosts: hosts };
}

function verifyReviewsBoostTurnstile(token) {
  if (typeof token !== 'string' || !token.trim() || token.length > 2048) return false;
  try {
    var settings = reviewsBoostTurnstileProperties();
    if (!settings) return false;
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', contentType: 'application/x-www-form-urlencoded',
      payload: { secret: settings.secret, response: token },
      muteHttpExceptions: true, followRedirects: false
    });
    if (response.getResponseCode() !== 200) return false;
    var result = JSON.parse(response.getContentText());
    return result && result.success === true && result.action === 'quote_request' &&
      settings.hosts.indexOf(result.hostname) !== -1;
  } catch (_) { return false; }
}

function claimReviewsBoostTurnstileToken(token) {
  var lock, acquired = false;
  try {
    var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, token, Utilities.Charset.UTF_8);
    var hash = digest.map(function (byte) { return ('0' + ((byte + 256) % 256).toString(16)).slice(-2); }).join('');
    var key = 'RB_TURNSTILE_USED_' + hash;
    lock = LockService.getScriptLock();
    acquired = lock.tryLock(10000);
    if (!acquired) return false;
    var properties = PropertiesService.getScriptProperties();
    var now = Date.now();
    if (Number(properties.getProperty(key)) > now) return false;
    var stored = properties.getProperties();
    Object.keys(stored).forEach(function (name) {
      if (/^RB_TURNSTILE_USED_[a-f0-9]{64}$/.test(name) && !(Number(stored[name]) > now)) properties.deleteProperty(name);
    });
    // Durable hashes plus an atomic lock defend against duplicate handling even
    // if a provider response is unexpectedly repeated. Never store raw tokens.
    properties.setProperty(key, String(now + 6 * 60 * 1000));
    return true;
  } catch (_) { return false; }
  finally { if (acquired) lock.releaseLock(); }
}

function rejectUnverifiedReviewsBoostRequest(e) {
  var token = e && e.parameter && e.parameter['cf-turnstile-response'];
  if (verifyReviewsBoostTurnstile(token) && claimReviewsBoostTurnstileToken(token)) return null;
  return ContentService.createTextOutput(JSON.stringify({
    result: 'error', code: 'verification_failed',
    error: 'Security verification failed. Please complete the check and try again.'
  })).setMimeType(ContentService.MimeType.JSON);
}

/** Owner-run configuration probe. No lead saved, no notification sent.
 * A successful probe does not prove a real widget token or replay was tested.
 */
function checkReviewsBoostTurnstileSetup() {
  var settings = reviewsBoostTurnstileProperties();
  if (!settings) throw new Error('Set TURNSTILE_SECRET and TURNSTILE_HOSTNAMES for ReviewsBoost only. Do not use public test credentials.');
  var response;
  try {
    response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post', contentType: 'application/x-www-form-urlencoded',
      payload: { secret: settings.secret, response: 'XXXX.DUMMY.TOKEN.XXXX' },
      muteHttpExceptions: true, followRedirects: false
    });
    var result = JSON.parse(response.getContentText());
    if (response.getResponseCode() !== 200 || result.success !== false ||
        !Array.isArray(result['error-codes']) || result['error-codes'].indexOf('invalid-input-response') === -1 ||
        result['error-codes'].some(function (code) { return /secret/.test(code); })) throw new Error('probe');
  } catch (_) { throw new Error('Turnstile configuration probe failed. Check the matching secret and UrlFetch authorization.'); }
  var summary = { configuration: 'passed', secret_probe: 'passed', real_token_validation: 'pending', email_delivery: 'not tested' };
  console.log(JSON.stringify(summary));
  return summary;
}
// END REVIEWSBOOST TURNSTILE
