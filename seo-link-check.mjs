// Read-only GET checks for public page links and assets. Never submits forms.
// Usage: node seo-link-check.mjs [--report=path.json]
import fs from 'node:fs';

const origin = 'https://reviewsboost.ca';
const urls = new Map();
const results = [];
const decode = value => value.replace(/&amp;/g, '&').replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));

function add(reference, source) {
  if (!reference || /^(?:mailto:|tel:|data:|javascript:)/i.test(reference)) return;
  const url = new URL(decode(reference), origin + '/' + source);
  if (!/^https?:$/.test(url.protocol)) return;
  url.hash = '';
  if (!urls.has(url.href)) urls.set(url.href, new Set());
  urls.get(url.href).add(source);
}

for (const file of fs.readdirSync('.').filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file, 'utf8');
  // Exclude inline code: a fetch endpoint is not a navigational link.
  const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,
    block => block.slice(0, block.indexOf('>') + 1));
  for (const tag of markup.matchAll(/<(?:a|link|img|script|source)\b[^>]*>/gi)) {
    for (const attr of tag[0].matchAll(/\b(?:href|src)\s*=\s*(["'])(.*?)\1/gi)) add(attr[2], file);
  }
  for (const tag of markup.matchAll(/<meta\b[^>]*>/gi)) {
    if (!/\b(?:property|name)\s*=\s*(["'])(?:og:image|twitter:image)\1/i.test(tag[0])) continue;
    add(tag[0].match(/\bcontent\s*=\s*(["'])(.*?)\1/i)?.[2], file);
  }
}
add('/robots.txt', 'robots.txt');
add('/sitemap.xml', 'sitemap.xml');
for (const match of fs.readFileSync('sitemap.xml', 'utf8').matchAll(/<(?:image:)?loc>([^<]+)<\/(?:image:)?loc>/g)) {
  add(match[1], 'sitemap.xml');
}

const pending = [...urls];
async function worker() {
  while (pending.length) {
    const [url, sources] = pending.shift();
    const internal = new URL(url).origin === origin;
    let result;
    try {
      const response = await fetch(url, {
        method: 'GET', redirect: 'follow', signal: AbortSignal.timeout(20000),
        headers: { 'User-Agent': 'ReviewsBoost-LinkCheck/1.0', Accept: 'text/html,application/xml;q=0.9,*/*;q=0.8' }
      });
      const contentType = response.headers.get('content-type') || '';
      const status = response.status;
      let title = '';
      if (contentType.includes('text/html')) {
        const html = await response.text();
        title = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]?.replace(/\s+/g, ' ').trim() || '';
      } else await response.body?.cancel();
      // Auth, rate limits and server errors need review; they don't prove a dead link.
      let outcome = response.ok ? 'ok' : [404, 410].includes(status) ? 'broken' : 'review';
      // /404.html is the intentional, noindex error template; missing URLs are
      // separately required to return 404 by seo-live-check.mjs.
      if (response.ok && url !== origin + '/404.html' && /^(?:404\b|page not found\b|not found\b|error 404\b)/i.test(title)) outcome = 'review';
      if (internal && response.ok && !/\.(?:html)?$/.test(new URL(url).pathname) &&
          /\.(?:css|js|mjs|svg|png|ico|xml|txt|csv|json|webmanifest|cff|bib)$/.test(new URL(url).pathname) &&
          contentType.includes('text/html')) outcome = 'review';
      result = { url, internal, status, finalUrl: response.url, contentType, title, outcome, sources: [...sources] };
    } catch (error) {
      result = { url, internal, outcome: 'review', error: error.message, sources: [...sources] };
    }
    results.push(result);
    if (result.outcome !== 'ok') console.log(`${result.outcome.toUpperCase()} ${url}: ${result.status || result.error}`);
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
results.sort((a, b) => a.url.localeCompare(b.url));
for (const internal of [true, false]) {
  const group = results.filter(result => result.internal === internal);
  console.log(`${internal ? 'Internal' : 'External'}: ${group.length} URLs; ` +
    ['ok', 'broken', 'review'].map(outcome => `${group.filter(r => r.outcome === outcome).length} ${outcome}`).join(', '));
}
const reportPath = process.argv.find(arg => arg.startsWith('--report='))?.slice('--report='.length);
if (reportPath) fs.writeFileSync(reportPath, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n');
if (results.some(result => result.outcome !== 'ok')) process.exitCode = 1;
