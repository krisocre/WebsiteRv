(function () {
  'use strict';

  const form = document.getElementById('evidenceForm');
  const link = document.getElementById('caseReview');
  const continueButton = document.getElementById('reviewContinue');
  const details = document.getElementById('reviewDetails');
  const reviewText = document.getElementById('reviewText');
  const concern = document.getElementById('concern');
  const status = document.getElementById('caseStatus');
  const output = document.getElementById('caseOutput');
  const heading = document.getElementById('caseHeading');
  const findings = document.getElementById('caseFindings');
  const advice = document.getElementById('caseAdvice');
  const route = document.getElementById('officialRoute');
  const preview = document.getElementById('casePreview');
  const notesStatus = document.getElementById('notesStatus');
  const policies = 'https://support.google.com/contributionpolicy/answer/7400114';
  const reporting = 'https://support.google.com/business/answer/4596773';
  const extortion = 'https://support.google.com/business/answer/16404809';

  const policyConcerns = {
    extortion: {
      title: 'Possible payment demand',
      next: 'If someone demanded payment or a favour to take down reviews, save the original message, date and related review links. Use Google’s dedicated reporting form for confirmed demands.',
      matches: /\b(?:pay|send)\s+(?:me|us)\b/i,
      related: /\b(?:remove|delete|take down)\b[^.!?]{0,45}\b(?:review|rating)s?\b/i
    },
    harassment: {
      title: 'Possible threat or targeted harassment',
      next: 'Save a dated screenshot and the exact words in context. Point out the specific threat or targeted conduct when you report it.',
      matches: /\b(?:i|we)(?:['’]ll| (?:will|(?:am|are) going to))\s+(?:hurt|kill|attack|find and hurt|come after)\s+(?:you|your (?:staff|family|employees))\b/i
    },
    privacy: {
      title: 'Possible exposure of personal information',
      next: 'Check whether a private detail was actually revealed without permission. Record the evidence privately. A publicly listed business contact may be allowed.',
      matches: /\b(?:home address|personal (?:phone number|email address|address)|social insurance number)\b\s*(?:is\s+|:\s*)\S/i
    },
    spam: {
      title: 'Possible promotional or off-topic content',
      next: 'Save the wording and explain how it relates to a different business or promotes an unrelated product. If you see duplicates, save their links and dates.',
      matches: /\b(?:use (?:my|our) (?:promo|discount|coupon) code|(?:dm|message) me to (?:buy|order)|buy now at)\b/i
    },
    conflict: {
      title: 'Possible conflict of interest',
      next: 'Save evidence that connects the reviewer to the employment, competitor or other business relationship. A similar name on its own doesn’t establish the connection.',
      matches: /\b(?:i (?:work|worked|used to work) (?:for|at) (?:this|your) (?:business|company|restaurant|store)|i(?:['’]m| am) (?:the owner of a competing business|a former employee))\b/i
    }
  };
  const contextGuidance = {
    unknown: {
      title: 'Check for a business or location mismatch',
      next: 'Compare the location, product and dates with what your business can verify. Document a specific mismatch. An unfamiliar name by itself doesn’t establish fake engagement.'
    },
    negative: {
      title: 'Start with the customer’s experience',
      next: 'Check the details and consider a calm public reply. A low rating or a disputed opinion by itself generally stays on Google. You can still document any separate policy concern.'
    }
  };

  const standardMapsHosts = new Set(['google.com', 'www.google.com', 'google.ca', 'www.google.ca']);
  const mapsHosts = new Set(['maps.google.com', 'maps.google.ca']);
  const sharePaths = new Map([
    ['maps.app.goo.gl', /^\/[a-z0-9_-]+\/?$/i],
    ['goo.gl', /^\/maps\/[a-z0-9_-]+\/?$/i],
    ['g.co', /^\/kgs\/[a-z0-9_-]+\/?$/i],
    ['g.page', /^\/[a-z0-9_/-]+$/i],
    ['share.google', /^\/[a-z0-9_-]+\/?$/i]
  ]);

  function parseReviewLink(value) {
    let url;
    try {
      url = new URL(value.trim());
    } catch {
      return null;
    }
    if (url.protocol !== 'https:' || url.username || url.password || url.port) return null;

    if (sharePaths.get(url.hostname)?.test(url.pathname)) return url;
    const mapsPath = /^\/maps(?:\/|$)/.test(url.pathname);
    if (mapsPath && (standardMapsHosts.has(url.hostname) || mapsHosts.has(url.hostname))) return url;
    if (mapsHosts.has(url.hostname) && url.pathname === '/' && url.search) return url;
    return null;
  }

  function assess(text, selected) {
    const signals = Object.entries(policyConcerns).filter(([key, concern]) =>
      key === selected || (concern.matches.test(text) && (!concern.related || concern.related.test(text)))
    );
    const guidance = Object.hasOwn(contextGuidance, selected) ? contextGuidance[selected] : null;
    return {
      possibleIssue: signals.length > 0,
      items: [...signals.map(([, item]) => item), ...(guidance ? [guidance] : [])],
      officialLink: signals.some(([key]) => key === 'extortion') ? extortion : reporting
    };
  }

  function showResult(result, reviewUrl, text) {
    heading.textContent = result.possibleIssue ? 'You have a policy concern to check' : 'You have a useful next step';
    advice.textContent = result.possibleIssue
      ? 'Here’s what to check and save before deciding whether to report the review.'
      : 'There’s no clear policy signal from what you entered. Look for a specific detail you can verify, such as a wrong location, or reply calmly if the review describes a genuine experience.';

    findings.replaceChildren();
    for (const item of result.items) {
      const row = document.createElement('li');
      const title = document.createElement('h3');
      const next = document.createElement('p');
      title.textContent = item.title;
      next.textContent = item.next;
      row.append(title, next);
      findings.append(row);
    }
    findings.hidden = result.items.length === 0;
    route.href = result.officialLink;
    route.textContent = result.officialLink === extortion
      ? 'See Google’s review extortion guidance'
      : 'See Google’s reporting and appeal guidance';

    preview.textContent = [
      'GOOGLE REVIEW CASE NOTES', 'Prepared locally with ReviewsBoost', '',
      'Review link: ' + reviewUrl.href,
      'Review text: ' + (text || '[Add an excerpt if available]'), '',
      heading.textContent, advice.textContent,
      ...result.items.map(item => item.title + '\n' + item.next),
      '', 'What I can verify: [Add dates and evidence references]',
      'Google policies: ' + policies, 'Official guidance: ' + result.officialLink,
      'These are working notes. Google decides whether a review can be removed.'
    ].join('\n');
    document.getElementById('caseNotes').open = false;
    notesStatus.textContent = '';
    status.textContent = '';
    output.hidden = false;
    output.focus();
  }

  let reviewUrl = null;
  form.addEventListener('input', event => {
    status.textContent = '';
    output.hidden = true;
    if (event.target === link) {
      reviewUrl = null;
      details.hidden = true;
      continueButton.hidden = false;
      link.removeAttribute('aria-invalid');
    }
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (details.hidden) {
      reviewUrl = parseReviewLink(link.value);
      if (!reviewUrl) {
        status.textContent = 'Use the link from Share review in Google Maps.';
        link.setAttribute('aria-invalid', 'true');
        link.focus();
        return;
      }
      status.textContent = '';
      link.removeAttribute('aria-invalid');
      details.hidden = false;
      continueButton.hidden = true;
      reviewText.focus();
      return;
    }
    const text = reviewText.value.trim();
    if (!text && !concern.value) {
      status.textContent = 'Paste the review text or choose a concern for a rating without text.';
      reviewText.focus();
      return;
    }
    showResult(assess(text, concern.value), reviewUrl, text);
  });

  document.getElementById('openReview').addEventListener('click', () => {
    if (reviewUrl) window.open(reviewUrl.href, '_blank', 'noopener,noreferrer');
  });
  document.getElementById('copyCase').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(preview.textContent);
      notesStatus.textContent = 'Case notes copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(preview);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      notesStatus.textContent = 'Copy the selected notes or choose Download .txt.';
    }
  });
  document.getElementById('downloadCase').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([preview.textContent], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'google-review-case-worksheet.txt';
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notesStatus.textContent = 'Case notes download started.';
  });

  document.getElementById('checkerFields').disabled = false;
})();
