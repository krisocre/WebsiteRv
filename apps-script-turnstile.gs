/**
 * ReviewsBoost verification helpers, retained as a source/test reference.
 * The complete google-apps-script.gs already includes these functions.
 * Use that COMPLETE file in a NEW standalone ReviewsBoost project.
 * Do NOT add this helper or a guard to the old shared Apps Script project.
 * Properties: TURNSTILE_SECRET, TURNSTILE_HOSTNAMES.
 * Do not install in the separate ReviewRemoval project or duplicate the helpers.
 */
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
