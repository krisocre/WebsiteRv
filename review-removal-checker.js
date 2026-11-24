(function () {
  'use strict';

  // Each pattern is a narrow wording clue. The surrounding facts can change its meaning.
  const policies = {
    extortion: {
      title: 'Payment demand',
      next: 'Save the original demand, timestamps and related review links. Google has a dedicated reporting form for review extortion.',
      clue: /\b(?:pay|send)\s+(?:me|us)\b[^.!?\n]{0,110}\b(?:remove|delete|take down)\b[^.!?\n]{0,40}\b(?:reviews?|ratings?)\b/iu
    },
    harassment: {
      title: 'Threats or targeted harassment',
      next: 'Save the exact wording in context and a dated screenshot. Point to the specific threat or targeted conduct in a report.',
      clue: /\b(?:i|we)(?:'ll| will| (?:am|are) going to)\s+(?:hurt|kill|attack|come after)\s+(?:you|your (?:staff|family|employees))\b/iu
    },
    privacy: {
      title: 'Private personal information',
      next: 'Check that the detail is private and shared without permission. Keep it in a private record. Public business contact details can be allowed.',
      clue: /\b(?:home address|personal (?:phone number|email address)|social insurance number)\s*(?:is\s+|:\s*)[\d\w]/iu
    },
    spam: {
      title: 'Promotional or off-topic content',
      next: 'Point out the promotion or explain how the content is unrelated to your business. Save links and dates for any identical posts you find.',
      clue: /\b(?:use (?:my|our) (?:promo|discount|coupon) code|(?:dm|message) me to (?:buy|order)|buy now at)\b/iu
    },
    conflict: {
      title: 'Conflict of interest',
      next: 'Find a dated source that connects the author to the employment, competitor or other business relationship and keep it with the review.',
      clue: /\b(?:i (?:work|worked|used to work) (?:for|at) (?:this|your) (?:business|company|restaurant|store)|i(?:'m| am) (?:the owner of a competing business|a former employee))\b/iu
    },
    fake: {
      title: 'Review may not reflect a genuine experience',
      next: 'Save the wording and check the specific dates, location or transaction details you can verify. An unfamiliar reviewer name alone is weak evidence.',
      clue: /\b(?:i (?:was|got) paid to (?:write|post) (?:this|the) review|(?:paid|offered|gave) me\b[^.!?\n]{0,80}\b(?:to (?:leave|post|give) (?:a |one |1 |five |5 )?(?:stars?|reviews?|ratings?))|i(?:'ve| have) never (?:dealt with|interacted with|used) (?:this|your) (?:business|company|service))\b/iu
    }
  };

  const googleHosts = new Set(['google.com', 'www.google.com', 'google.ca', 'www.google.ca']);
  const mapsHosts = new Set(['maps.google.com', 'maps.google.ca']);
  const sharePaths = new Map([
    ['maps.app.goo.gl', /^\/[a-z0-9_-]+\/?$/i],
    ['goo.gl', /^\/maps\/[a-z0-9_-]+\/?$/i],
    ['g.co', /^\/kgs\/[a-z0-9_-]+\/?$/i],
    ['g.page', /^\/[a-z0-9_/-]+$/i],
    ['share.google', /^\/[a-z0-9_-]+\/?$/i]
  ]);

  function googleLink(value) {
    let url;
    try {
      url = new URL(value.includes('://') ? value : 'https://' + value);
    } catch {
      return null;
    }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.port) return null;
    const mapsPage = /^\/maps(?:\/|$)/.test(url.pathname);
    const mapsQuery = mapsHosts.has(url.hostname) && url.pathname === '/' && url.searchParams.has('q');
    const searchReview = googleHosts.has(url.hostname) && url.pathname === '/search' && url.hash.startsWith('#lrd=');
    if (!(sharePaths.get(url.hostname)?.test(url.pathname) || mapsQuery || searchReview ||
          (mapsPage && (mapsHosts.has(url.hostname) || googleHosts.has(url.hostname))))) return null;
    url.protocol = 'https:';
    return url;
  }

  const questions = globalThis.ReviewsBoostCaseQuestions;
  const maximumQuestions = 2;
  const reporting = 'https://support.google.com/business/answer/4596773';
  const extortion = 'https://support.google.com/business/answer/16404809';
  const form = document.getElementById('policy-check-form');
  const wording = document.getElementById('case-wording');
  const link = document.getElementById('case-url');
  const start = document.getElementById('case-start');
  const question = document.getElementById('case-question');
  const questionTitle = document.getElementById('case-question-title');
  const questionHelp = document.getElementById('case-question-help');
  const questionOptions = document.getElementById('case-question-options');
  const status = document.getElementById('policy-check-status');
  const result = document.getElementById('policy-check-result');
  const heading = document.getElementById('policy-result-title');
  const advice = document.getElementById('policy-result-advice');
  const findings = document.getElementById('policy-result-findings');
  const openReview = document.getElementById('policy-open-review');
  const googleGuide = document.getElementById('policy-google-guide');
  const notes = document.getElementById('casePreview');
  const steps = [...document.querySelectorAll('#case-steps li')];
  const stages = [form, question, result];
  const pricingDock = document.querySelector('.pricing-dock');
  let session;
  let busy = false;

  if (pricingDock && typeof IntersectionObserver === 'function') {
    new IntersectionObserver(([entry]) => {
      pricingDock.classList.toggle('policy-dock-obscured', entry.isIntersecting);
    }).observe(result.querySelector('.checker-result-actions'));
  }

  function showStage(stage) {
    stages.forEach((panel, index) => {
      panel.hidden = index !== stage;
      if (index === stage) steps[index].setAttribute('aria-current', 'step');
      else steps[index].removeAttribute('aria-current');
    });
    status.textContent = '';
    stages[stage].querySelector('h2').focus();
  }

  function questionButton(label, type, action) {
    const button = document.createElement('button');
    button.className = type === 'primary' ? 'button' : 'case-option';
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
  }

  function presentQuestion(prompt, help, content) {
    session.used += 1;
    document.getElementById('case-question-count').textContent = 'Follow-up ' + session.used + ' of ' + maximumQuestions;
    questionTitle.textContent = prompt;
    questionHelp.textContent = help;
    questionOptions.replaceChildren(...content);
    showStage(1);
  }

  function askForWording() {
    const reviewLink = document.createElement('a');
    reviewLink.href = session.url.href;
    reviewLink.target = '_blank';
    reviewLink.rel = 'noopener noreferrer';
    reviewLink.textContent = 'Open the Google link ↗';
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.htmlFor = 'case-followup-wording';
    label.textContent = 'Review wording';
    const excerpt = document.createElement('textarea');
    excerpt.id = label.htmlFor;
    excerpt.rows = 4;
    excerpt.maxLength = wording.maxLength;
    excerpt.spellcheck = false;
    field.append(label, excerpt);
    const useWording = questionButton('Use this wording', 'primary', () => {
      const text = excerpt.value.trim();
      if (!text) {
        status.textContent = 'Paste the wording or choose Continue without wording.';
        excerpt.focus();
        return;
      }
      session.text = text.slice(0, wording.maxLength);
      assess();
    });
    const skip = questionButton('Continue without wording', 'secondary', () => assess());
    const actions = document.createElement('div');
    actions.className = 'case-answers';
    actions.append(useWording, skip);
    presentQuestion('Is there written feedback?', 'Open the link and copy the relevant part with private details removed. You can continue with a star rating or if you only have the link.', [reviewLink, field, actions]);
  }

  function askAboutEvidence() {
    const choices = [
      ['experience', 'Wrong business, location or service'],
      ['duplicates', 'Matching reviews from different accounts'],
      ['incentive', 'A reward for posting the review'],
      ['connection', 'An employee or competitor connection'],
      ['demand', 'A demand for money or favours'],
      ['private', 'Private information shared without permission'],
      ['threat', 'A specific threat'],
      ['', 'No, or I’m not sure']
    ];
    const answers = document.createElement('div');
    answers.className = 'case-answers case-answers-list';
    for (const [id, label] of choices) {
      answers.append(questionButton(label, 'secondary', () => {
        if (id) session.answers.push({ id, answer: 'yes' });
        assess();
      }));
    }
    presentQuestion('Do you have evidence of any of these?', 'Choose the strongest detail you can confirm.', [answers]);
  }

  function ask(id) {
    const row = document.createElement('div');
    row.className = 'case-answers';
    for (const [answer, label] of [['yes', 'Yes'], ['no', 'No'], ['unsure', 'Not sure']]) {
      row.append(questionButton(label, 'secondary', () => {
        session.answers.push({ id, answer });
        assess();
      }));
    }
    presentQuestion(questions[id].prompt, 'Answer with what you can verify today.', [row]);
  }

  function localEstimate() {
    const wording = session.text.replace(/[‘’]/gu, "'");
    const reported = session.answers.find(answer => answer.answer === 'yes');
    const policy = (reported && questions[reported.id].policy) || Object.keys(policies).find(id => policies[id].clue.test(wording));
    if (policy) return { outcome: 'possible', policy, questions: [], excerpt: '' };
    const sample = /\b(?:employee|competitor|worked (?:at|for))\b/i.test(wording) ? 'connection' : 'experience';
    const next = [sample, 'experience'].find(id => !session.answers.some(answer => answer.id === id));
    return { outcome: 'unclear', policy: 'none', questions: next ? [next] : [], excerpt: '' };
  }

  async function onlineEstimate(remaining) {
    if (!session.online || !session.text) return null;
    const text = session.text
      .replace(/https?:\/\/\S+|\bwww\.\S+/gi, '[link omitted]')
      .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[email omitted]')
      .replace(/(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\b\d{3})[\s.-]?\d{3}[\s.-]?\d{4}\b/g, '[number omitted]');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch('/api/case-assessment', {
        method: 'POST', credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, remaining, answers: session.answers }),
        signal: controller.signal
      });
      if (!response.ok) return null;
      const estimate = await response.json();
      return estimate && ['possible', 'unclear', 'feedback'].includes(estimate.outcome) &&
        (estimate.policy === 'none' || Object.hasOwn(policies, estimate.policy)) && Array.isArray(estimate.questions) &&
        typeof estimate.excerpt === 'string' ? estimate : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  async function assess() {
    if (busy) return;
    busy = true;
    start.disabled = true;
    const pendingAnswers = [...questionOptions.querySelectorAll('button')];
    pendingAnswers.forEach(button => { button.disabled = true; });
    status.textContent = 'Checking your review…';
    try {
      const remaining = maximumQuestions - session.used;
      const local = localEstimate();
      if (remaining && !session.text && local.outcome !== 'possible') {
        askAboutEvidence();
        return;
      }
      const online = await onlineEstimate(remaining);
      session.online = Boolean(online);
      // Keep an owner's stated evidence or a clear wording match if the model found less.
      const fromAI = online && !(local.outcome === 'possible' && online.outcome !== 'possible');
      const estimate = fromAI ? online : local;
      const next = remaining && estimate.questions.find(id =>
        Object.hasOwn(questions, id) && !session.answers.some(answer => answer.id === id));
      if (next) ask(next);
      else finish(estimate, fromAI);
    } finally {
      busy = false;
      start.disabled = false;
      pendingAnswers.forEach(button => { button.disabled = false; });
    }
  }

  const summaries = {
    possible: ['A potential policy issue to document', 'There’s a specific concern worth checking against Google’s policy. Save the evidence below before deciding whether to report it.'],
    unclear: ['Gather one verifiable detail', 'There’s still room to build a case. The information you’ve shared leaves the policy question open.'],
    feedback: ['Consider a measured public reply', 'This reads like customer feedback on the details available. Look into the experience and make a short, professional reply if appropriate.']
  };

  function finish(estimate, fromAI) {
    const [title, description] = summaries[estimate.outcome];
    const policy = Object.hasOwn(policies, estimate.policy) && policies[estimate.policy];
    const evidence = ['Save the review link, date and a screenshot of the review in full.'];
    if (policy) evidence.push(policy.title + '. ' + policy.next);
    else if (estimate.outcome === 'feedback') evidence.push('Check your records and keep the details needed to address the complaint privately.');
    else evidence.push('Check whether the location, date or service matches your records. Keep a record of any conflicting detail, repeated wording or relevant relationship you can verify.');
    if (estimate.excerpt) evidence.push('Wording to check in context: “' + estimate.excerpt + '”');

    const method = fromAI ? 'AI-assisted case brief' : 'Guided case brief';
    document.getElementById('case-method').textContent = method;
    heading.textContent = title;
    advice.textContent = description;
    findings.replaceChildren(...evidence.map(item => {
      const li = document.createElement('li');
      li.textContent = item;
      return li;
    }));
    openReview.hidden = !session.url;
    if (session.url) openReview.href = session.url.href;
    else openReview.removeAttribute('href');
    googleGuide.href = estimate.policy === 'extortion' ? extortion : reporting;
    googleGuide.textContent = estimate.policy === 'extortion' ? 'Google’s review extortion guidance' : 'Google’s reporting and appeals guide';
    notes.textContent = [
      'REVIEWSBOOST CASE BRIEF', method, '', title, description, '',
      'Review link: ' + (session.url?.href || '[Add the link if available]'),
      'Evidence to keep:', ...evidence.map(item => '- ' + item),
      '', 'My records: [Add dates and supporting documents]',
      'Official guidance: ' + googleGuide.href, 'Google makes the final decision on removal.'
    ].join('\n');
    document.getElementById('caseNotes').open = false;
    document.getElementById('notesStatus').textContent = '';
    questionOptions.replaceChildren();
    showStage(2);
  }

  function invalid(field, message) {
    field.setAttribute('aria-invalid', 'true');
    status.textContent = message;
    field.focus();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    if (busy) return;
    let text = wording.value.trim();
    let rawLink = link.value.trim();
    if (!rawLink && /^\S+$/.test(text) && googleLink(text)) {
      rawLink = text;
      text = '';
    }
    const url = rawLink ? googleLink(rawLink) : null;
    if (rawLink && !url) {
      invalid(link, 'Use the link from Share review in Google Maps, or leave this field blank and paste the wording.');
      return;
    }
    if (!text && !url) {
      invalid(wording, 'Enter the review wording or its Google link to start.');
      return;
    }
    session = { text: text.slice(0, wording.maxLength), url, used: 0, answers: [], online: location.origin === 'https://reviewsboost.ca' };
    if (text) assess();
    else askForWording();
  });

  form.addEventListener('input', event => {
    event.target.removeAttribute('aria-invalid');
    status.textContent = '';
  });
  document.getElementById('case-restart').addEventListener('click', () => {
    form.reset();
    notes.textContent = '';
    openReview.removeAttribute('href');
    session = null;
    showStage(0);
  });

  const notesStatus = document.getElementById('notesStatus');
  document.getElementById('copyCase').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(notes.textContent);
      notesStatus.textContent = 'Case brief copied.';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(notes);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      notesStatus.textContent = 'Copy the selected text or download the brief.';
    }
  });
  document.getElementById('downloadCase').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([notes.textContent], { type: 'text/plain;charset=utf-8' }));
    const download = document.createElement('a');
    download.href = url;
    download.download = 'reviewsboost-case-brief.txt';
    download.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    notesStatus.textContent = 'Case brief download started.';
  });

  document.getElementById('checkerFields').disabled = false;
})();
