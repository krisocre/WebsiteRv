// Serve the local checker and Worker at a mocked origin. No live requests, model calls or leads.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');

const origin = 'https://reviewsboost.ca';
const root = path.resolve(__dirname, '..');
const mime = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' };

async function run() {
  const { default: worker } = await import('../workers/case-assessment.mjs');
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const requests = [];
  const errors = [];
  let online = true;
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(8000);
    await page.setViewport({ width: 1366, height: 920 });
    page.on('pageerror', error => errors.push(error.message));
    await page.setRequestInterception(true);
    page.on('request', async request => {
      const url = new URL(request.url());
      if (url.origin !== origin) return request.abort();
      if (url.pathname === '/api/case-assessment') {
        const input = JSON.parse(request.postData());
        requests.push(input);
        if (!online) return request.respond({ status: 503 });
        const response = await worker.fetch(new Request(request.url(), {
          method: 'POST',
          headers: { Origin: origin, 'Content-Type': 'application/json' },
          body: request.postData()
        }), {
          CASE_ASSESSMENT_LIMIT: { limit: async () => ({ success: true }) },
          AI: { run: async () => ({ response: input.remaining > 0
            ? { outcome: 'unclear', policy: 'conflict', questions: ['experience', 'connection'], excerpt: '' }
            : { outcome: 'possible', policy: 'conflict', questions: ['incentive'], excerpt: '' } }) }
        });
        return request.respond({ status: response.status, contentType: 'application/json', body: await response.text() });
      }
      const file = path.resolve(root, '.' + url.pathname);
      if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
        return request.respond({ status: 404 });
      }
      const contentType = mime[path.extname(file)] || 'application/octet-stream';
      return request.respond({ status: 200, contentType: contentType + '; charset=utf-8', body: fs.readFileSync(file) });
    });

    const visible = selector => page.waitForSelector(selector, { visible: true });
    const text = selector => page.$eval(selector, el => el.textContent);
    const answer = label => page.$eval('#case-question-options', (options, value) => {
      const button = [...options.querySelectorAll('button')].find(el => el.textContent.startsWith(value));
      if (!button || button.disabled) throw new Error('Answer unavailable: ' + value);
      button.click();
    }, label);
    const waitForSecond = () => page.waitForFunction(() => document.querySelector('#case-question-count').textContent.endsWith('2 of 2'));

    await page.goto(origin + '/google-review-removal-checker.html', { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => !document.querySelector('#case-start').matches(':disabled'));
    await page.click('[data-choice=reject]');
    await page.click('#case-start');
    assert.match(await text('#policy-check-status'), /Enter the review/);
    await page.type('#case-wording', 'Worst experience ever, contact someone@example.test');
    await page.click('#case-start');
    await visible('#case-question');
    assert.match(await text('#case-question-count'), /Follow-up 1 of 2/);
    await answer('No');
    await waitForSecond();
    await answer('Yes');
    await visible('#policy-check-result');
    assert.match(await text('#case-method'), /AI-assisted/);
    assert.match(await text('#policy-result-findings'), /Conflict of interest/);
    assert.deepEqual(requests.map(request => request.remaining), [2, 1, 0]);
    assert.ok(requests.every(request => !request.text.includes('someone@example.test')));
    assert.equal(await text('#case-steps [aria-current]'), 'Case brief');
    assert.equal(await page.$eval('.checker-result-actions .button', el => el.getAttribute('href')), '/#assessment');
    await page.click('#caseNotes summary');
    assert.match(await text('#casePreview'), /REVIEWSBOOST CASE BRIEF/);

    await page.click('#case-restart');
    assert.equal(await page.$eval('#case-wording', el => el.value), '');
    await page.type('#case-url', 'https://example.com/reviews');
    await page.click('#case-start');
    assert.match(await text('#policy-check-status'), /Use the link from Share review/);
    await page.$eval('#case-url', input => { input.value = ''; });
    await page.type('#case-url', 'https://maps.app.goo.gl/example');
    await page.click('#case-start');
    await visible('#case-followup-wording');
    await answer('Continue without wording');
    await waitForSecond();
    await answer('A demand for money');
    await visible('#policy-check-result');
    assert.match(await text('#case-method'), /Guided/);
    assert.match(await page.$eval('#policy-google-guide', el => el.href), /16404809/);
    assert.equal(requests.length, 3);

    await page.setViewport({ width: 375, height: 812 });
    await page.click('#case-restart');
    assert.equal(await page.$eval('.case-desk', el => el.scrollWidth <= el.clientWidth + 1), true);
    online = false;
    await page.type('#case-wording', 'They gave me $20 to leave one star.');
    await page.click('#case-start');
    await visible('#policy-check-result');
    assert.match(await text('#policy-result-findings'), /genuine experience/);
    assert.match(await text('#case-method'), /Guided/);
    assert.deepEqual(errors, []);
    console.log('PASS: desktop and mobile case desk, two follow-ups, link-only path, brief, redaction and fallback.');
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
