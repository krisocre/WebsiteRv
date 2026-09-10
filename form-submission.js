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
    var timer = window.setTimeout(function () { controller.abort(); }, 20000);
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
      if (result.result !== 'success') throw new Error('unconfirmed');
      return result;
    }).catch(function (error) {
      // Native AbortError has a read-only code property; wrap it consistently.
      throw Object.assign(new Error('unconfirmed'), { code: 'unconfirmed', cause: error });
    }).finally(function () {
      window.clearTimeout(timer);
    });
  }

  window.ReviewSubmission = Object.freeze({ send: send });
})(window);
