(function (window) {
  'use strict';

  var endpoint = 'https://script.google.com/macros/s/AKfycbx9nM4hs4qVE6pzwMFsQcFE_pgJC0FRp0KqTbozzNuL5m-77RHj7kZtK1FSuQBhHqT5UA/exec';

  function encode(formData) {
    var body = new URLSearchParams();
    formData.forEach(function (value, key) {
      body.append(key, String(value));
    });
    return body;
  }

  function send(formData) {
    var token = formData.get('cf-turnstile-response');
    if (typeof token !== 'string' || !token.trim() || token.length > 2048) {
      return Promise.reject(Object.assign(new Error('verification_failed'), { code: 'verification_failed' }));
    }
    if (window.SubmissionTerms) window.SubmissionTerms.prepare(formData);
    var body = encode(formData);
    if (navigator.onLine === false) {
      return Promise.reject(Object.assign(new Error('offline'), { code: 'offline' }));
    }
    var controller = new AbortController();
    // Apps Script may need time to write the row and send notifications before
    // it returns JSON. Keep one request alive rather than starting a duplicate.
    var timer = window.setTimeout(function () { controller.abort(); }, 60000);
    // A simple CORS request avoids preflight. Only an explicit server success
    // confirms storage. Never resend an ambiguous request automatically.
    return fetch(endpoint, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      keepalive: new Blob([body.toString()]).size < 60000,
      signal: controller.signal,
      body: body
    }).then(function (response) {
      if (!response.ok) throw new Error('unconfirmed');
      return response.json();
    }).then(function (result) {
      if (result.result === 'success') return result;
      if (result.code === 'verification_failed') {
        throw Object.assign(new Error('verification_failed'), { code: 'verification_failed' });
      }
      if (result.code === 'invalid_input') {
        throw Object.assign(new Error('invalid_input'), { code: 'invalid_input', field: result.field });
      }
      // The currently deployed legacy handler writes the sheet row before it
      // attempts its owner email. Its empty-recipient error therefore means the
      // request was stored even though that notification failed. This branch can
      // be removed after google-apps-script.gs is deployed.
      if (result.result === 'error' && /failed to send email:\s*no recipient/i.test(result.error || '')) {
        return { result: 'success', warning: 'owner_notification_failed' };
      }
      var serverError = new Error('server_rejected');
      serverError.code = 'server_rejected';
      throw serverError;
    }).catch(function (error) {
      if (error.code === 'server_rejected' || error.code === 'invalid_input' || error.code === 'verification_failed') throw error;
      // Native AbortError has a read-only code property; wrap it consistently.
      throw Object.assign(new Error('unconfirmed'), { code: 'unconfirmed', cause: error });
    }).finally(function () {
      window.clearTimeout(timer);
    });
  }

  window.ReviewSubmission = Object.freeze({ send: send });
})(window);
