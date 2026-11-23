const fs = require('node:fs');
const path = require('node:path');

const stylesheet = '<link rel="stylesheet" href="/pricing-shortcut.css?v=20261121">';
const shortcut = '<a class="pricing-shortcut" href="/#pricing" lang="en-CA">Google Removal Prices <span aria-hidden="true">↗</span></a>';

function withPricingShortcut(html) {
  const newline = html.includes('\r\n') ? '\r\n' : '\n';
  if (!html.includes('href="/pricing-shortcut.css')) {
    html = html.replace(/([ \t]*<\/head>)/i, `${newline}  ${stylesheet}${newline}$1`);
  }
  if (!html.includes('class="pricing-shortcut"')) {
    html = html.replace(/([ \t]*<\/body>)/i, `${newline}  <div class="pricing-dock">${shortcut}</div>${newline}$1`);
  }
  return html;
}

if (require.main === module) {
  for (const entry of fs.readdirSync(__dirname, {withFileTypes: true})) {
    if (!entry.isFile() || !entry.name.endsWith('.html') || entry.name === 'index.html') continue;
    const filename = path.join(__dirname, entry.name);
    const html = fs.readFileSync(filename, 'utf8');
    const updated = withPricingShortcut(html);
    if (updated !== html) fs.writeFileSync(filename, updated);
  }
}

module.exports = {withPricingShortcut};
