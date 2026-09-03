import fs from "node:fs";

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

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const description =
    html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)/i)?.[1] ?? "";
  const canonical =
    html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']*)/i)?.[1] ?? "";
  const h1Count = (html.match(/<h1\b/gi) ?? []).length;
  const wordCount = plainText(html).split(/\s+/).filter(Boolean).length;
  const isIndexable = !/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);

  if (isIndexable && h1Count !== 1) errors.push(`${file}: expected one H1; found ${h1Count}`);
  if (isIndexable && !description) errors.push(`${file}: missing meta description`);
  if (isIndexable && !canonical) errors.push(`${file}: missing canonical URL`);
  if (title.length > 65) errors.push(`${file}: title is ${title.length} characters`);
  if (description.length > 165) errors.push(`${file}: description is ${description.length} characters`);
  if (canonical) {
    if (canonicalOwners.has(canonical) && isIndexable) {
      errors.push(`${file}: duplicates canonical used by ${canonicalOwners.get(canonical)}`);
    }
    if (isIndexable) canonicalOwners.set(canonical, file);
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
    if (/^(https?:|mailto:|tel:|#)/i.test(href)) continue;
    const [targetFile, fragment] = href.split("#");
    const target = targetFile || file;
    if (!fs.existsSync(target)) {
      errors.push(`${file}: missing internal target ${href}`);
      continue;
    }
    if (fragment && target.endsWith(".html")) {
      const targetHtml = fs.readFileSync(target, "utf8");
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`id=["']${escaped}["']`).test(targetHtml)) {
        errors.push(`${file}: missing fragment target ${href}`);
      }
    }
  }

  console.log(
    `${file.padEnd(40)} title=${String(title.length).padStart(2)} description=${String(description.length).padStart(3)} h1=${h1Count} words=${wordCount}`,
  );
}

if (errors.length) {
  console.error("\nSEO audit errors:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("\nSEO audit passed: metadata, canonicals, H1s, JSON-LD and internal targets.");
}
