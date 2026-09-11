(function (window) {
  'use strict';

  var endpoint = 'https://script.google.com/macros/s/AKfycby4mQu0BJFu8Jmbw_zZPzrBb9TF_YRw4j0Ayu3PFvwgicSN5vtzynX0ASet2utzxtlnMw/exec';

  function encode(formData) {
    var body = new URLSearchParams();
    formData.forEach(function (value, key) {
      body.append(key, String(value));
    });
    return body;
  }

  function send(formData) {
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
      if (error.code === 'server_rejected') throw error;
      // Native AbortError has a read-only code property; wrap it consistently.
      throw Object.assign(new Error('unconfirmed'), { code: 'unconfirmed', cause: error });
    }).finally(function () {
      window.clearTimeout(timer);
    });
  }

  window.ReviewSubmission = Object.freeze({ send: send });
})(window);
