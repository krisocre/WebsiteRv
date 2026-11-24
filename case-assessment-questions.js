(function (root) {
  'use strict';
  root.ReviewsBoostCaseQuestions = Object.freeze({
    experience: { prompt: 'Can you point to a service, date or address in the review that does not match your business?', policy: 'fake' },
    connection: { prompt: 'Do you have a record that connects the author to your staff or a competing business?', policy: 'conflict' },
    duplicates: { prompt: 'Have you saved other reviews that use the same wording under different names?', policy: 'fake' },
    incentive: { prompt: 'Do you have a record of a reward being offered for posting this review?', policy: 'fake' },
    demand: { prompt: 'Did anyone ask for money, goods or services in exchange for taking down the review?', policy: 'extortion' },
    private: { prompt: 'Can you identify private information that the person did not agree to share?', policy: 'privacy' },
    threat: { prompt: 'Can you identify a specific threat directed at someone?', policy: 'harassment' }
  });
})(globalThis);
