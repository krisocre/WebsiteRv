# Disabled platform services - November 5, 2026

Original Facebook, Tripadvisor, Trustpilot and Glassdoor page implementations are preserved byte-for-byte as .html.txt files, including their metadata, forms and page-specific content. manifest.json records SHA-256 fingerprints. The original shared frontend service-options snippet is retained separately.

These are restoration sources, not public pages. The parent _retired directory is excluded by _config.yml. Do not link to this directory, add it to a sitemap or use these old Service/Offer definitions in public metadata.

Google is the primary removal service and Yelp the only secondary removal service. The active availability policy is in apply-commercial-seo.cjs. Restore an old service only after business approval: update its enabled flag, deliberately restore its page from this archive, verify current pricing/policies and functional integration, and run SEO/form checks before deciding on indexability and sitemap inclusion.

The shared runtime JavaScript remains unchanged because it also powers the protected Google/French and Yelp pages. Its existing additional-platform cards remain an explicitly documented restriction conflict on those protected pages; this archive does not activate them as real services.
