// Add this file as InputValidation.gs in the EXISTING ReviewsBoost Apps Script project.
// At the start of doPost(e), before Sheets/email, add:
//   var rejectedInput = rejectInvalidLeadInput(e);
//   if (rejectedInput) return rejectedInput;
// This preserves the live handler, endpoint, notifications and spreadsheet settings.
// Do not add a second copy if Code.gs already defines leadInputErrors.

function rejectInvalidLeadInput(e) {
  var data = e && e.parameter || {};
  var type = typeof data.form_type === 'string' ? data.form_type.trim() : '';
  var removal = type === 'remove_reviews' || (!type &&
    (/remov/i.test(data.selected_plan || '') || data.review_count || data.reviews_to_remove || data.review_quantity || data.review_links));
  var errors = leadInputErrors(data, Boolean(removal));
  var field = Object.keys(errors)[0];
  if (!field) return null;
  return ContentService.createTextOutput(JSON.stringify({
    result: 'error', code: 'invalid_input', field: field, error: errors[field]
  })).setMimeType(ContentService.MimeType.JSON);
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
