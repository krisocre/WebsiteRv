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
// Required fields and basic field formats only; do not judge lead content.
// Keep this pure function identical in the browser and Apps Script.
function leadInputErrors(data, requireReviewCount) {
  var errors = {};
  function text(name) { return typeof data[name] === 'string' ? data[name].trim() : ''; }
  var name = text('full_name');
  if (!name) errors.full_name = 'Enter your name.';
  var business = text('business_name');
  if (!business) errors.business_name = 'Enter your business name.';

  var contact = text('contact_detail');
  var email = text('email_address') || text('email') || ((/^Email\b/i.test(text('contact_method')) || contact.indexOf('@') !== -1) ? contact : '');
  if (!email || email.length > 254 || /[\u0000-\u0020\u007F]/.test(email) || !/^[^\s@<>]+@[^\s@<>.]+(?:\.[^\s@<>.]+)+$/.test(email)) errors.email_address = 'Enter a valid email address.';

  var count = text('review_count') || text('reviews_to_remove') || text('review_quantity');
  if ((requireReviewCount || count) && (!/^\d+$/.test(count) || Number(count) < 1 || Number(count) > 50)) {
    errors.review_count = 'Enter a whole number of reviews from 1 to 50.';
  }
  // Names, phone, business_url, review_links and reason have no content filters.
  return errors;
}
// END LEAD INPUT RULES
