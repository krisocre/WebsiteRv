# Canadian audience improvements — September 6, 2026

Implemented in the local website. Publishing and Search Console access are needed before traffic impact can be evaluated. The source of the reported US visitor count has not yet been identified.

## Location coverage without repetitive city pages

The homepage now has one service coverage section at `/online-reputation-management.html#canada`. It explains nationwide online delivery, identifies representative markets by region, includes all provinces and territories, and tells visitors what to provide for their business location. Smaller and rural communities are explicitly included. The locations represent the service area, not additional offices.

| Region | Representative markets included |
| --- | --- |
| Ontario | Toronto/GTA, Mississauga, Brampton, Ottawa |
| Québec | Montréal, Québec City, Laval |
| British Columbia | Metro Vancouver, Surrey, Victoria |
| Alberta, Saskatchewan and Manitoba | Calgary, Edmonton, Saskatoon, Regina, Winnipeg |
| Atlantic Canada | Halifax, Moncton, Charlottetown, St. John's |
| Territories | Whitehorse, Yellowknife, Iqaluit |

Google identifies unnatural city-name blocks and substantially similar regional funnel pages as potential spam. A useful explanation of actual service coverage is the approach taken here. No separate city pages were created. [Google spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

## Changes made

- Reframed the homepage around online reputation management for Canadian businesses, with review removal, response planning, monitoring and recovery as the primary services.
- Made Canadian business eligibility explicit near service descriptions and the reputation assessment form. Removal fees remain stated in CAD on the dedicated service page.
- Replaced the unlinked publication-name carousel with the service-area notice. There is no evidence that the carousel caused US traffic; the change gives that space useful, verifiable information.
- Connected the coverage section from the removal service, About page, learning centre and calculator. The checker now identifies the Canadian service audience in its description and service invitation.
- Kept the existing `.ca`, Canadian English and Canada service-area signals. Updated service descriptions in structured data and the removal offer's `eligibleRegion` to `CA`, matching the visible eligibility. This markup states facts; it is not a claimed country-ranking switch. [Schema.org eligibleRegion](https://schema.org/eligibleRegion).
- Updated modification dates only for changed pages. Form field names and the current Apps Script endpoint are preserved.

Google treats a country domain such as `.ca` as a strong country signal. Targeting is not an exclusion mechanism: useful public resources can still attract international readers. Avoid US-wide access blocks as an SEO tactic, since Google says most crawling originates in the US. [Google regional-site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

## Measure the Canadian audience

Use Search Console's country dimension to compare **Canada** and **United States** for Google search traffic. Compare equivalent 28-day periods, separating the homepage and removal service from informational tools. Track Canadian clicks and qualified Canadian enquiries; a higher Canadian percentage alone could simply mean fewer international visits. [Search Console country dimension](https://support.google.com/webmasters/answer/17011259?hl=en), [filters and comparisons](https://support.google.com/webmasters/answer/17011165?hl=en).

If the reported count comes from Cloudflare zone analytics, check which metric is being used: its unique visitor figures can include bots and other non-human requests. This does not establish that the reported US visits are bots. [Cloudflare analytics explanation](https://developers.cloudflare.com/analytics/faq/about-analytics/).

Do not look for the former Search Console country-targeting setting; Google removed that feature. [International Targeting retirement](https://support.google.com/webmasters/answer/12474899?hl=en).

## Further work requiring business information

Update, September 9: the user-requested French Google service and form are now at `/suppression-avis-google.html`, paired reciprocally with the English homepage using `en-CA`, `fr-CA` and `x-default` annotations. The learning centre and platform footers link to that page in static HTML. Other platform pages remain English and are not falsely labelled as French translations. The audit checks the pair and matching sitemap annotations. [Google multilingual-site guidance](https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites).

A future city page should earn its existence through real local material: a consented client case, dated evidence and an outcome, or a genuinely different service process. Another practical distribution angle is offering the existing evidence worksheet or rating study to Canadian business associations whose resources it complements. No customer stories, office addresses, affiliations or outreach have been invented or published.

The hosting redirect observations and remaining actions from the earlier pass are in [SEO-IMPLEMENTATION.md](SEO-IMPLEMENTATION.md). They require hosting configuration and were not changed in this pass.

## Validation

- Site-wide SEO audit and HTML validation for all crawlable pages.
- Browser layout checks at desktop, tablet and mobile sizes; coverage also available without JavaScript.
- Reputation assessment and removal-request form flows checked locally. Google Sheets, email and endpoint requests were mocked; no live submissions were sent.
