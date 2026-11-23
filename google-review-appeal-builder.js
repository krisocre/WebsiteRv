(() => {
  const reportStatus = document.querySelector('#appeal-stage');
  const policy = document.querySelector('#appeal-policy');
  const fields = document.querySelector('#appeal-details');
  const result = document.querySelector('#appeal-result');
  const draft = document.querySelector('#appeal-draft');
  const title = document.querySelector('#appeal-result-title');
  const nextStep = document.querySelector('#appeal-next-step');
  const notice = document.querySelector('#copy-status');
  const route = document.querySelector('#appeal-route');
  const checklist = [...document.querySelectorAll('#appeal-checklist input')];
  const management = 'https://support.google.com/business/workflow/9945796';
  const official = 'https://support.google.com/business/answer/4596773?hl=en';
  const extortion = 'https://support.google.com/business/answer/16404809?hl=en';

  const routes = {
    unreported: ['Start with a report', 'Find the review in your Business Profile, flag the specific policy concern, and keep the direct link and an accurate screenshot.', 'See Google’s reporting instructions', official],
    pending: ['Check for a decision', 'Open the Reviews Management Tool for your business. Prepare your supporting evidence while the initial report is under review.', 'Open the Reviews Management Tool', management],
    declined: ['Check the available appeal options', 'Confirm you are signed in to the Google account that manages the right location. Google’s one-time appeal process is available for eligible reviews listed in the tool.', 'Check eligibility in Google', management],
    eligible: ['Prepare your appeal', 'Use the direct review link and one supported policy reason. Add only facts you can verify.', 'Open Google’s appeal options', management],
    appealed: ['Watch for Google’s email', 'Google sends the appeal decision by email. Check the inbox associated with the Business Profile and keep the outcome with your original report.', 'Read Google’s appeal guidance', official],
    extortion: ['Use the extortion reporting route', 'Preserve the demand, its date, and the associated review links. Google provides a dedicated reporting form for demands for payment, goods, or services tied to removing reviews.', 'Open Google’s extortion guidance', extortion]
  };
  const policies = {
    fake: ['Fake engagement', '[Describe the factual evidence that the content was incentivized, coordinated or unrelated to a genuine experience. A missing name in your records alone is weak evidence.]'],
    conflict: ['Misrepresentation due to a conflict of interest', '[Describe the specific relationship and what supports it. Keep a verifiable relationship separate from a suspicion.]'],
    private: ['Personal information', '[Identify where the personal information appears and the type of information disclosed. Use a redacted example where it supports your explanation.]'],
    threats: ['Harassment', '[Point to the exact sentence or image that shows the threat or harassment. Include surrounding context that helps interpret it.]'],
    unrelated: ['Off-topic content', '[Identify the part unrelated to an experience at this location and explain what it concerns.]'],
    advertising: ['Advertising and solicitation', '[Point to the promotional wording or solicitation and explain what is being advertised.]']
  };

  function render() {
    const [heading, guidance, label, href] = routes[reportStatus.value];
    const canAppeal = reportStatus.value === 'eligible';
    fields.hidden = !canAppeal;
    title.textContent = heading;
    nextStep.textContent = guidance;
    route.href = href;
    route.textContent = label;
    result.hidden = !canAppeal;
    notice.textContent = '';
    if (!canAppeal) {
      draft.textContent = '';
      return;
    }
    const [name, hint] = policies[policy.value];
    const ready = checklist.filter(item => item.checked).length;
    document.querySelector('#appeal-check-count').textContent = ready + ' of ' + checklist.length + ' items ready';
    draft.textContent = [
      'Google review appeal outline',
      'Direct review link: [Paste the link to the specific review.]',
      'Business Profile: [Add the link to the correct location.]',
      'Previous decision: [Add the date and outcome of the first report.]',
      '',
      'Policy concern: ' + name,
      'Observation: ' + hint,
      'Evidence: [Name each item, give its date and explain what it shows. Share only evidence relevant to this review.]',
      '',
      'Request: Please reconsider this review under the policy concern above.',
      'Policy reference: https://support.google.com/contributionpolicy/answer/7400114?hl=en'
    ].join('\n');
  }

  reportStatus.addEventListener('change', render);
  policy.addEventListener('change', render);
  checklist.forEach(item => item.addEventListener('change', render));
  document.querySelector('#appeal-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(draft.textContent);
      notice.textContent = 'Outline copied.';
    } catch (_) {
      draft.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(draft);
      selection.removeAllRanges();
      selection.addRange(range);
      notice.textContent = 'Outline selected. Copy it using your browser’s copy command, or download the text file.';
    }
  });
  document.querySelector('#appeal-download').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([draft.textContent + '\n'], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'reviewsboost-google-review-appeal.txt';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  render();
  document.querySelector('#appeal-builder').hidden = false;
})();
