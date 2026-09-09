// Paste this file into the Apps Script project bound to your submissions sheet.
// Set the spreadsheet ID (from its URL) and the exact destination tab name.
var SPREADSHEET_ID = '';
var SHEET_NAME = '';
// Deploy the web app to execute as you. Leave blank to notify the deploying user.
var NOTIFICATION_EMAIL = '';

function doPost(e) {
  try {
    if (!e || !e.parameter) throw new Error('Submit this handler through the website form.');
    if (!SPREADSHEET_ID || !SHEET_NAME) throw new Error('Set SPREADSHEET_ID and SHEET_NAME before deploying.');
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
    var spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = spreadsheet.getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('The configured submissions sheet tab was not found.');
    var row = [timestamp, selectedPlan, fullName, businessName, email, phone,
      contactMethod, contactInfo, businessUrl, reviewCount, reviewLinks, reason];
    sheet.appendRow(row.map(function (value) {
      // Store submitted text literally instead of executing a spreadsheet formula.
      return typeof value === 'string' && value.charAt(0) === '=' ? "'" + value : value;
    }));

    var subject = formLabel + ' from ' + fullName;
    var body = 'You received a new submission!\n\n' +
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
    MailApp.sendEmail(myEmail, subject, body);

    return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    console.error(error.toString());
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
