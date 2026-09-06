// Read-only checks. Run with --after-deploy to include this change's new assets.
const origin = 'https://reviewsboost.ca';
const cases = [
  { url: origin + '/', status: 200 },
  { url: 'http://reviewsboost.ca/', redirect: origin + '/' },
  { url: 'https://www.reviewsboost.ca/', redirect: origin + '/' },
  { url: origin + '/index.html', redirect: origin + '/' },
  { url: origin + '/index.html?utm_source=seo-check', redirect: origin + '/?utm_source=seo-check' },
  { url: origin + '/remove-google-reviews.html', status: 200 },
  { url: origin + '/sitemap.xml', status: 200, type: /(?:application|text)\/xml/ },
  { url: origin + '/robots.txt', status: 200, type: 'text/plain' },
  { url: origin + '/reviewsboost-missing-page-check', status: 404, type: 'text/html' },
  { url: origin + '/nested/reviewsboost-missing-page-check', status: 404, type: 'text/html' }
];
if (process.argv.includes('--after-deploy')) cases.push(
  { url: origin + '/google-review-removal-checker.html', status: 200, type: 'text/html' },
  { url: origin + '/review-rating-calculator.mjs', status: 200, type: /(?:java|ecma)script/ },
  { url: origin + '/review-rating-model.mjs', status: 200, type: /(?:java|ecma)script/ },
  { url: origin + '/review-removal-checker.js', status: 200, type: /(?:java|ecma)script/ },
  { url: origin + '/site-icons.css', status: 200, type: 'text/css' },
  { url: origin + '/google-review-evidence-worksheet.txt', status: 200, type: 'text/plain' }
);
const results = await Promise.all(cases.map(async check => {
  try {
    const response = await fetch(check.url, { redirect: 'manual', signal: AbortSignal.timeout(15000) });
    const location = response.headers.get('location');
    const type = response.headers.get('content-type') || '';
    const statusOK = check.redirect ? [301, 308].includes(response.status) &&
      location && new URL(location, check.url).href === check.redirect : response.status === check.status;
    const typeOK = !check.type || (check.type instanceof RegExp ? check.type.test(type) : type.includes(check.type));
    await response.body?.cancel();
    return { passed: Boolean(statusOK && typeOK), message: `${check.url}: ${response.status}${location ? ' → ' + location : ''}${check.type ? ' (' + type + ')' : ''}` };
  } catch (error) {
    return { passed: false, message: `${check.url}: ${error.message}` };
  }
}));
for (const result of results) console.log(`${result.passed ? 'PASS' : 'CHECK'} ${result.message}`);
if (results.some(result => !result.passed)) process.exitCode = 1;
