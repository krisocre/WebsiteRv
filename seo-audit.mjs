import fs from "node:fs";

const SITE_ORIGIN = "https://reviewsboost.ca";
const files = fs.readdirSync(".").filter((file) => file.endsWith(".html"));
const canonicalOwners = new Map();
const errors = [];

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
  const titleMatches = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  const descriptionMatches = [
    ...html.matchAll(/<meta\s+name=["']description["']\s+content=["']([^"']*)/gi),
  ];
  const canonicalMatches = [
    ...html.matchAll(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)/gi),
  ];
  const title = titleMatches[0]?.[1] ?? "";
  const description = descriptionMatches[0]?.[1] ?? "";
  const canonical = canonicalMatches[0]?.[1] ?? "";
  const ogUrl =
    html.match(/<meta\s+property=["']og:url["']\s+content=["']([^"']*)/i)?.[1] ?? "";
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const wordCount = plainText(html).split(/\s+/).filter(Boolean).length;
  const isIndexable = !/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);

  if (isIndexable && titleMatches.length !== 1) errors.push(`${file}: expected one title; found ${titleMatches.length}`);
  if (isIndexable && descriptionMatches.length !== 1) errors.push(`${file}: expected one meta description; found ${descriptionMatches.length}`);
  if (isIndexable && canonicalMatches.length !== 1) errors.push(`${file}: expected one canonical; found ${canonicalMatches.length}`);
  if (isIndexable && h1Count !== 1) errors.push(`${file}: expected one H1; found ${h1Count}`);
  if (title.length > 65) errors.push(`${file}: title is ${title.length} characters`);
  if (description.length > 165) errors.push(`${file}: description is ${description.length} characters`);
  if (canonical && isIndexable) {
    const expectedCanonical = file === "index.html" ? SITE_ORIGIN + "/" : SITE_ORIGIN + "/" + file;
    if (canonical !== expectedCanonical) {
      errors.push(`${file}: canonical should be ${expectedCanonical}`);
    }
    if (ogUrl !== canonical) errors.push(`${file}: og:url does not match canonical`);
    if (canonicalOwners.has(canonical)) {
      errors.push(`${file}: duplicates canonical used by ${canonicalOwners.get(canonical)}`);
    }
    canonicalOwners.set(canonical, file);
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

  for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
    const href = match[1];
    if (/^(?:\.?\/)?index\.html(?:[#?]|$)/i.test(href)) {
      errors.push(`${file}: internal link uses non-canonical homepage URL ${href}`);
    }
    checkLocalReference(href, file, "internal link");
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = match[0];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (!/\balt=["'][^"']*["']/i.test(tag)) errors.push(`${file}: image is missing alt text`);
    if (!src) errors.push(`${file}: image is missing src`);
    else checkLocalReference(src, file, "image");
  }

  console.log(
    `${file.padEnd(40)} title=${String(title.length).padStart(2)} description=${String(description.length).padStart(3)} h1=${h1Count} words=${wordCount}`,
  );
}

const sitemap = fs.readFileSync("sitemap.xml", "utf8");
const sitemapUrls = new Set(
  [...sitemap.matchAll(/<url>([\s\S]*?)<\/url>/gi)]
    .map((entry) => entry[1].match(/<loc>([^<]+)<\/loc>/i)?.[1])
    .filter(Boolean),
);
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

if (errors.length) {
  console.error("\nSEO audit errors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nSEO audit passed: metadata, canonical URLs, social URLs, page/image sitemap targets, H1s, JSON-LD, images and internal targets.");
}
