(function () {
  'use strict';

  const search = document.getElementById('article-search');
  const status = document.getElementById('article-status');
  const groups = [...document.querySelectorAll('[data-blog-group]')].map(section => ({
    section,
    entries: [...section.querySelectorAll('.journal-grid > .card, [aria-labelledby="latest-research-title"]')].map(item => ({
      item,
      text: (item.querySelector('article') || item).textContent.toLowerCase()
    }))
  }));

  function filterArticles() {
    const query = search.value.trim().toLowerCase();
    const words = query ? query.split(/\s+/) : [];
    let total = 0;
    for (const { section, entries } of groups) {
      let shown = 0;
      for (const { item, text } of entries) {
        item.hidden = !words.every(word => text.includes(word));
        if (!item.hidden) shown++;
      }
      section.hidden = shown === 0;
      total += shown;
    }
    status.textContent = !query ? '' : total
      ? total + (total === 1 ? ' article found' : ' articles found')
      : 'No articles found. Try a shorter search or pick a topic.';
  }

  search.closest('[role="search"]').hidden = false;
  search.addEventListener('input', filterArticles);
  document.querySelector('.journal-topics').addEventListener('click', event => {
    if (event.target.closest('a') && search.value) {
      search.value = '';
      filterArticles();
    }
  });
  filterArticles();
})();
