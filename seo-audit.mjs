import fs from "node:fs";

const SITE_ORIGIN = "https://reviewsboost.ca";
const files = fs.readdirSync(".").filter((file) => file.endsWith(".html"));
const canonicalOwners = new Map();
const errors = [];

function decodeEntities(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, entity => {
    const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' };
    if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
    return String.fromCodePoint(entity.toLowerCase().startsWith('&#x') ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1)));
  });
}

function attribute(tag, name) {
  const match = tag.match(new RegExp('(?:^|\\s)' + name + '\\s*=\\s*(?:"([^"]*)"|\'([^\']*)\'|([^\\s>]+))', 'i'));
  return match ? decodeEntities(match[1] ?? match[2] ?? match[3]) : undefined;
}

function tags(html, name) {
  return [...html.matchAll(new RegExp('<' + name + '\\b[^>]*>', 'gi'))].map(match => match[0]);
}

function withoutCode(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, ' ');
}

function plainText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ");
}

function resolveInternalTarget(reference, currentFile) {
  if (/^(?:mailto:|tel:|javascript:|data:)/i.test(reference)) return null;

  let url;
  try {
    url = new URL(reference, SITE_ORIGIN + "/" + currentFile);
  } catch {
    return { invalid: true };
  }

  if (url.origin !== SITE_ORIGIN) return null;
  let target = decodeURIComponent(url.pathname).replace(/^\/+/, "");
  if (!target || target.endsWith("/")) target += "index.html";
  return { target, fragment: decodeURIComponent(url.hash.slice(1)) };
}

function checkLocalReference(reference, currentFile, label) {
  const resolved = resolveInternalTarget(reference, currentFile);
  if (!resolved) return;
  if (resolved.invalid) {
    errors.push(currentFile + ": invalid " + label + " " + reference);
    return;
  }
  if (!fs.existsSync(resolved.target)) {
    errors.push(currentFile + ": missing " + label + " target " + reference);
    return;
  }
  if (resolved.fragment && resolved.target.endsWith(".html")) {
    const targetHtml = fs.readFileSync(resolved.target, "utf8");
    const hasTarget =
      targetHtml.includes('id="' + resolved.fragment + '"') ||
      targetHtml.includes("id='" + resolved.fragment + "'");
    if (!hasTarget) errors.push(currentFile + ": missing fragment target " + reference);
  }
}

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const markup = withoutCode(html);
  const metas = tags(markup, 'meta');
  const metaValues = (key, attr = 'name') => metas.filter(tag => attribute(tag, attr) === key).map(tag => attribute(tag, 'content') ?? '');
  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const descriptionMatches = metaValues('description');
  const canonicalMatches = tags(markup, 'link').filter(tag => attribute(tag, 'rel') === 'canonical').map(tag => attribute(tag, 'href'));
  const title = decodeEntities(titleMatches[0]?.[1] ?? "");
  const description = descriptionMatches[0] ?? "";
  const canonical = canonicalMatches[0] ?? "";
  const ogUrl = metaValues('og:url', 'property')[0] ?? '';
  const headings = [...markup.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1\s*>/gi)];
  const h1Count = headings.filter(heading => heading[1] === '1').length;
  const wordCount = plainText(html).split(/\s+/).filter(Boolean).length;
  const isIndexable = !metaValues('robots').some(value => /\bnoindex\b/i.test(value));
  const refresh = metaValues('refresh', 'http-equiv')[0];
  const redirectTarget = refresh?.match(/\burl\s*=\s*(.+)$/i)?.[1];

  if (titleMatches.length !== 1 || !title.trim()) errors.push(`${file}: expected one nonempty title; found ${titleMatches.length}`);
  if (descriptionMatches.length !== 1 || !description.trim()) errors.push(`${file}: expected one nonempty meta description; found ${descriptionMatches.length}`);
  if (canonicalMatches.length !== 1 || !canonical) errors.push(`${file}: expected one canonical; found ${canonicalMatches.length}`);
  if (h1Count !== 1) errors.push(`${file}: expected one H1; found ${h1Count}`);
  if (title.length > 65) errors.push(`${file}: title is ${title.length} characters`);
  if (description.length > 165) errors.push(`${file}: description is ${description.length} characters`);
  if (canonical) {
    // A moved page should point to its destination, not compete with it.
    const expectedCanonical = redirectTarget || (file === "index.html" ? SITE_ORIGIN + "/" : SITE_ORIGIN + "/" + file);
    if (canonical !== expectedCanonical) {
      errors.push(`${file}: canonical should be ${expectedCanonical}`);
    }
    if (ogUrl !== canonical) errors.push(`${file}: og:url does not match canonical`);
    if (isIndexable && canonicalOwners.has(canonical)) {
      errors.push(`${file}: duplicates canonical used by ${canonicalOwners.get(canonical)}`);
    }
    if (isIndexable) canonicalOwners.set(canonical, file);
  }

  let previousLevel = 0;
  for (const heading of headings) {
    const level = Number(heading[1]);
    if (level > previousLevel + 1) errors.push(`${file}: heading skips H${previousLevel + 1} before H${level}`);
    if (!plainText(heading[2]).trim()) errors.push(`${file}: empty H${level}`);
    previousLevel = level;
  }
  const ids = new Set();
  for (const tag of markup.matchAll(/<[a-z][^>]*>/gi)) {
    const id = attribute(tag[0], 'id');
    if (id === undefined) continue;
    if (ids.has(id)) errors.push(`${file}: duplicate element ID ${id}`);
    ids.add(id);
  }
  for (const key of ['og:title', 'og:image', 'og:description', 'og:url']) {
    const values = metaValues(key, 'property');
    if (values.length !== 1 || !values[0]?.trim()) errors.push(`${file}: expected one nonempty ${key}`);
    if (key === 'og:image' && values[0]) {
      if (!values[0].startsWith('https://')) errors.push(`${file}: og:image must use an absolute HTTPS URL`);
      checkLocalReference(values[0], file, 'Open Graph image');
    }
  }
  for (const anchor of markup.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi)) {
    const label = (attribute(anchor[1], 'aria-label') || plainText(anchor[2])).replace(/\s+/g, ' ').trim();
    if (/^(?:click here|here|read more|learn more|more|(?:https?:\/\/)?[\w.-]+\.[a-z]{2,}(?:\/\S*)?)$/i.test(label)) {
      errors.push(`${file}: replace generic or raw URL link text "${label}"`);
    }
  }

  for (const match of html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  )) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${file}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const tag of tags(markup, '(?:a|link)')) {
    const href = attribute(tag, 'href');
    if (!href) continue;
    if (/^(?:\.?\/)?index\.html(?:[#?]|$)/i.test(href)) {
      errors.push(`${file}: internal link uses non-canonical homepage URL ${href}`);
    }
    checkLocalReference(href, file, "internal link");
  }

  for (const tag of tags(markup, 'img')) {
    const src = attribute(tag, 'src');
    const alt = attribute(tag, 'alt');
    if (alt === undefined) errors.push(`${file}: image is missing alt text`);
    if (alt?.trim() && /^(?:image|photo|picture|graphic|img\d*|.+\.(?:png|jpe?g|svg|gif|webp))$/i.test(alt.trim())) errors.push(`${file}: image needs a descriptive text alternative`);
    if (!src) errors.push(`${file}: image is missing src`);
    else checkLocalReference(src, file, "image");
  }

  console.log(
    `${file.padEnd(40)} title=${String(title.length).padStart(2)} description=${String(description.length).padStart(3)} h1=${h1Count} words=${wordCount}`,
  );
}

const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const sitemapUrlList =
  [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/gi)]
    .map((entry) => entry[1].match(/<loc>([^<]+)<\/loc>/i)?.[1])
    .filter(Boolean);
const sitemapUrls = new Set(sitemapUrlList);
if (sitemapUrls.size !== sitemapUrlList.length) errors.push('sitemap.xml: duplicate page URL');
const sitemapImageUrlList = [
  ...sitemap.matchAll(/<image:loc>([^<]+)<\/image:loc>/gi),
].map((match) => match[1]);
const sitemapImageUrls = new Set(sitemapImageUrlList);
if (sitemapImageUrls.size !== sitemapImageUrlList.length) {
  errors.push("sitemap.xml: duplicate image URL");
}
for (const imageUrl of sitemapImageUrls) {
  checkLocalReference(imageUrl, "sitemap.xml", "image sitemap");
}
for (const canonical of canonicalOwners.keys()) {
  if (!sitemapUrls.has(canonical)) errors.push(`sitemap.xml: missing canonical ${canonical}`);
}
for (const sitemapUrl of sitemapUrls) {
  if (!canonicalOwners.has(sitemapUrl)) {
    errors.push(`sitemap.xml: non-indexable or unknown page ${sitemapUrl}`);
  }
}

const robots = fs.readFileSync('robots.txt', 'utf8');
if (!/^Sitemap:[\t ]*https:\/\/reviewsboost\.ca\/sitemap\.xml[\t \r]*$/im.test(robots)) errors.push('robots.txt: missing canonical sitemap declaration');
if (!/^User-agent:[\t ]*\*[\t \r]*$/im.test(robots)) errors.push('robots.txt: missing general crawler group');
// The published site intentionally permits crawling all public content and assets.
if (!/^Allow:[\t ]*\/[\t \r]*$/im.test(robots) || /^Disallow:[\t ]*\S+/im.test(robots)) errors.push('robots.txt: review crawler restrictions against public pages and assets');

if (errors.length) {
  console.error("\nSEO audit errors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nSEO audit passed: heading hierarchy, IDs, metadata, canonicals, Open Graph, alt text, anchor text, internal targets, JSON-LD, sitemap and robots.txt.");
}
