/**
 * GRYHTML - Search page logic
 */
(function () {
  'use strict';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name) || '';
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  async function initSearchPage() {
    const resultsEl = document.querySelector('[data-search-results]');
    const infoEl = document.querySelector('[data-search-info]');
    const input = document.querySelector('[data-search-input]');
    const sortSelect = document.querySelector('[data-sort]');
    const loadMoreBtn = document.querySelector('[data-load-more]');
    const form = document.querySelector('[data-search-form-page]');

    if (!resultsEl) return;

    let currentQuery = getParam('q');
    let page = 1;
    let allGames = [];
    let loading = false;

    if (input) input.value = currentQuery;

    async function runSearch(q, reset = true) {
      if (loading) return;
      loading = true;
      if (reset) {
        page = 1;
        allGames = [];
        GRYHTML_GAMES.showSkeletons(resultsEl, 12);
      }
      try {
        const games = await GRYHTML_API.searchGames(q, page, 50);
        if (reset) allGames = games;
        else {
          const ids = new Set(allGames.map(g => g.id));
          games.forEach(g => { if (!ids.has(g.id)) allGames.push(g); });
        }
        let display = GRYHTML_GAMES.filterByQuery(allGames, q);
        const sortMode = sortSelect ? sortSelect.value : 'default';
        display = GRYHTML_GAMES.sortGames(display, sortMode);
        GRYHTML_GAMES.renderGames(resultsEl, display, {
          showEmpty: true,
          emptyTitle: 'Brak wyników',
          emptyText: q ? `Nie znaleziono gier dla „${q}”. Spróbuj innej frazy.` : 'Wpisz frazę, aby wyszukać gry.'
        });
        if (infoEl) {
          infoEl.textContent = display.length
            ? `Znaleziono ${display.length} ${display.length === 1 ? 'grę' : 'gier'}${q ? ` dla „${q}”` : ''}`
            : '';
        }
        if (loadMoreBtn) {
          loadMoreBtn.hidden = games.length < 40;
        }
      } catch (e) {
        GRYHTML_GAMES.renderGames(resultsEl, [], {
          showEmpty: true,
          emptyTitle: 'Błąd połączenia',
          emptyText: 'Nie udało się pobrać wyników. Sprawdź połączenie lub spróbuj później.'
        });
        if (infoEl) infoEl.textContent = '';
      } finally {
        loading = false;
      }
    }

    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const q = (input && input.value || '').trim();
        currentQuery = q;
        const url = new URL(window.location.href);
        if (q) url.searchParams.set('q', q);
        else url.searchParams.delete('q');
        history.replaceState(null, '', url);
        runSearch(q, true);
      });
    }

    if (input) {
      const debounced = debounce(() => {
        const q = input.value.trim();
        if (q.length >= 2 || q.length === 0) {
          currentQuery = q;
          const url = new URL(window.location.href);
          if (q) url.searchParams.set('q', q);
          else url.searchParams.delete('q');
          history.replaceState(null, '', url);
          runSearch(q, true);
        }
      }, 300);
      input.addEventListener('input', debounced);
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => runSearch(currentQuery, true));
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', async () => {
        page += 1;
        await runSearch(currentQuery, false);
      });
    }

    // Initial
    runSearch(currentQuery, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchPage);
  } else {
    initSearchPage();
  }
})();
