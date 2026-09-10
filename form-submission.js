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

    // Beacon queues the small form payload without waiting for Apps Script's
    // spreadsheet and email work to finish. A queued request survives page exit.
    if (navigator.sendBeacon) {
      try {
        if (navigator.sendBeacon(endpoint, body)) {
          return Promise.resolve({ transport: 'beacon' });
        }
      } catch (error) {
        // Older browsers can reject URLSearchParams here; use fetch below.
      }
    }

    return fetch(endpoint, {
      method: 'POST',
      mode: 'no-cors',
      keepalive: true,
      body: body
    }).then(function () {
      return { transport: 'fetch' };
    });
  }

  window.ReviewSubmission = Object.freeze({ send: send });
})(window);
