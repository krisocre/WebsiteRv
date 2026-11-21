(function (window, document) {
  'use strict';
  if (window.ReviewsBoostLeadSource) return;

  const key = 'reviewsboost.lead-source.v1';
  const lifetime = 30 * 60 * 1000;
  const sites = ['reviewsboost.ca', 'www.reviewsboost.ca'];
  const paidMedia = ['cpc', 'ppc', 'paid', 'paidsearch', 'paid_search', 'paid-social', 'paid_social', 'paidsocial', 'display', 'cpm', 'cpv'];
  const labels = {
    paid_google: 'Paid - Google Ads', paid_other: 'Paid - Other campaign',
    organic_google: 'Organic - Google', organic_bing: 'Organic - Bing',
    organic_other: 'Organic - Other search', referral: 'Referral / other'
  };

  function hostIs(host, domain) {
    return host === domain || host.endsWith('.' + domain);
  }

  function detectVisit() {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const click = ['gclid', 'dclid', 'gbraid', 'wbraid'].find(name => params.has(name));
    const aggregate = ['gad_source', 'gad_campaignid'].find(name => params.has(name));
    const medium = (params.get('utm_medium') || '').trim().toLowerCase();
    const campaignSource = (params.get('utm_source') || '').trim().toLowerCase();
    const referrer = document.referrer ? new URL(document.referrer) : null;
    const internal = referrer && (referrer.origin === url.origin || (sites.includes(referrer.hostname) && sites.includes(url.hostname)));
    const tagged = click || aggregate || ['utm_medium', 'utm_source', 'utm_campaign', 'utm_id'].some(name => params.has(name));
    let source = 'unknown';

    if (click) {
      if (/^[A-Za-z0-9_-]{1,256}$/.test(params.get(click))) source = click === 'dclid' ? 'paid_other' : 'paid_google';
    } else if (aggregate) {
      if (/^[1-9]\d{0,19}$/.test(params.get(aggregate))) source = 'paid_google';
    } else if (params.has('utm_medium')) {
      if (paidMedia.includes(medium)) source = campaignSource === 'google' ? 'paid_google' : 'paid_other';
      else if (medium === 'organic') {
        if (campaignSource === 'google') source = 'organic_google';
        else if (campaignSource === 'bing') source = 'organic_bing';
        else if (['yahoo', 'duckduckgo', 'ecosia', 'brave'].includes(campaignSource)) source = 'organic_other';
      } else if (['referral', 'email', 'social'].includes(medium)) source = 'referral';
    } else if (!tagged && referrer && !internal && ['http:', 'https:'].includes(referrer.protocol)) {
      const host = referrer.hostname;
      if (hostIs(host, 'googleadservices.com') || hostIs(host, 'googleads.g.doubleclick.net')) source = 'paid_google';
      else if (/(^|\.)google\.(com|ca|co\.uk|com\.au|fr|de|ie|co\.nz|co\.in)$/.test(host)) source = 'organic_google';
      else if (hostIs(host, 'bing.com')) source = 'organic_bing';
      else if (['search.yahoo.com', 'duckduckgo.com', 'ecosia.org', 'search.brave.com'].some(domain => hostIs(host, domain))) source = 'organic_other';
      else source = 'referral';
    }
    return { source, carry: Boolean(internal && !tagged), published: url.protocol === 'https:' && sites.includes(url.hostname) };
  }

  const visit = detectVisit();
  const choice = () => window.ReviewsBoostMeasurement?.status();
  const privacy = () => window.navigator.globalPrivacyControl === true;
  const allowed = (source, consent) => !privacy() && Boolean(source.startsWith('paid_') ? consent?.advertisingConsent : consent?.analyticsConsent);

  // Store only the fixed channel enum and an expiry, after the relevant opt-in.
  function sync() {
    const consent = choice();
    if (!visit.published || (!consent?.choiceRecorded && !privacy())) return;
    try {
      const storage = window.sessionStorage;
      if (visit.source !== 'unknown' && allowed(visit.source, consent)) {
        storage.setItem(key, JSON.stringify({ source: visit.source, expires: Date.now() + lifetime }));
      } else if (visit.carry && (allowed('paid_google', consent) || allowed('organic_google', consent))) {
        const saved = JSON.parse(storage.getItem(key));
        if (!saved || !Object.hasOwn(labels, saved.source) || !allowed(saved.source, consent) || saved.expires <= Date.now()) storage.removeItem(key);
      } else {
        storage.removeItem(key);
      }
    } catch (_) { /* Tracking storage is optional. */ }
  }

  function details() {
    const consent = choice();
    let source = visit.source;
    if (privacy() || (consent && consent.choiceRecorded !== false && !allowed(source, consent))) source = 'unknown';

    if (source === 'unknown' && visit.published && visit.carry && consent?.choiceRecorded &&
        (allowed('paid_google', consent) || allowed('organic_google', consent))) {
      try {
        const saved = JSON.parse(window.sessionStorage.getItem(key));
        if (saved && Object.hasOwn(labels, saved.source) && saved.expires > Date.now() && allowed(saved.source, consent)) source = saved.source;
      } catch (_) { /* The current page can still provide context. */ }
    }
    return { source, label: labels[source] || 'Direct / unknown' };
  }

  window.ReviewsBoostLeadSource = Object.freeze({ details, sync });
})(window, document);
