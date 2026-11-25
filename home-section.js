(() => {
  const script = document.currentScript;
  const section = script.dataset.section;

  document.addEventListener('DOMContentLoaded', () => {
    const { hash, search } = window.location;
    if (script.hasAttribute('data-use-homepage-url')) {
      // Keep the original request's referrer and campaign parameters.
      window.history.replaceState(window.history.state, '', '/' + search + (hash || section));
    }
    if (hash) return;

    const target = document.querySelector(section);
    if (!target) return;

    const header = document.querySelector('.site-header, #navbar');
    const position = header && getComputedStyle(header).position;
    const offset = position === 'fixed' || position === 'sticky'
      ? header.getBoundingClientRect().bottom
      : 0;

    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - offset - 16,
      behavior: 'instant'
    });
  }, { once: true });
})();
