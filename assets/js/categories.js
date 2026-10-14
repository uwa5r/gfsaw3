/**
 * GRYHTML - Category pages logic
 */
(function () {
  'use strict';

  function getCategoryKey() {
    const path = window.location.pathname.split('/').pop() || '';
    const base = path.replace(/\.html$/, '');
    if (base === 'kategorie') return null;
    return base;
  }

  async function initCategoryPage() {
    const resultsEl = document.querySelector('[data-category-results]');
    const infoEl = document.querySelector('[data-category-info]');
    const searchInput = document.querySelector('[data-cat-search]');
    const sortSelect = document.querySelector('[data-sort]');
    const loadMoreBtn = document.querySelector('[data-load-more]');
    if (!resultsEl) return;

    const key = getCategoryKey();
    const catConfig = key ? GRYHTML_CONFIG.categories[key] : null;

    let page = 1;
    let allGames = [];
    let loading = false;
    let localFilter = '';

    async function load(reset = true) {
      if (loading) return;
      loading = true;
      if (reset) {
        page = 1;
        allGames = [];
        GRYHTML_GAMES.showSkeletons(resultsEl, 12);
      }
      try {
        let games = [];
        if (catConfig) {
          if (catConfig.platform === 1) {
            games = await GRYHTML_API.fetchMobileGames(page, 50);
          } else if (catConfig.search) {
            games = await GRYHTML_API.searchGames(catConfig.search, page, 50);
          } else {
            games = await GRYHTML_API.fetchGames({ page, num: 50 });
          }
          // Additional client-side filter by tags when search is broad
          if (catConfig.tags && catConfig.tags.length && !catConfig.platform) {
            const tagLower = catConfig.tags.map(t => t.toLowerCase());
            games = games.filter(g => {
              const hay = [
                g.category || '',
                ...(g.tags || []),
                g.title || ''
              ].join(' ').toLowerCase();
              return tagLower.some(t => hay.includes(t));
            });
          }
        } else {
          games = await GRYHTML_API.fetchGames({ page, num: 50 });
        }

        if (reset) allGames = games;
        else {
          const ids = new Set(allGames.map(g => g.id));
          games.forEach(g => { if (!ids.has(g.id)) allGames.push(g); });
        }

        let display = allGames;
        if (localFilter) {
          display = GRYHTML_GAMES.filterByQuery(display, localFilter);
        }
        const sortMode = sortSelect ? sortSelect.value : 'default';
        display = GRYHTML_GAMES.sortGames(display, sortMode);

        GRYHTML_GAMES.renderGames(resultsEl, display, {
          showEmpty: true,
          emptyTitle: 'Brak gier w tej kategorii',
          emptyText: 'Nie znaleziono gier. Spróbuj innej kategorii lub wyszukaj po nazwie.'
        });

        if (infoEl) {
          infoEl.textContent = display.length
            ? `Wyświetlono ${display.length} ${display.length === 1 ? 'grę' : 'gier'}`
            : 'Brak wyników';
        }
        if (loadMoreBtn) {
          loadMoreBtn.hidden = games.length < 40;
        }
      } catch (e) {
        console.warn(e);
        GRYHTML_GAMES.renderGames(resultsEl, [], {
          showEmpty: true,
          emptyTitle: 'Błąd połączenia z API',
          emptyText: 'Nie udało się pobrać gier. Sprawdź połączenie internetowe lub spróbuj później. GameMonetize API może być chwilowo niedostępne.'
        });
      } finally {
        loading = false;
      }
    }

    if (searchInput) {
      let t;
      searchInput.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => {
          localFilter = searchInput.value.trim();
          // re-render from already loaded data
          let display = localFilter
            ? GRYHTML_GAMES.filterByQuery(allGames, localFilter)
            : allGames;
          const sortMode = sortSelect ? sortSelect.value : 'default';
          display = GRYHTML_GAMES.sortGames(display, sortMode);
          GRYHTML_GAMES.renderGames(resultsEl, display, {
            showEmpty: true,
            emptyTitle: 'Brak wyników',
            emptyText: 'Żadna gra nie pasuje do wyszukiwania w tej kategorii.'
          });
          if (infoEl) {
            infoEl.textContent = display.length
              ? `Znaleziono ${display.length}`
              : 'Brak wyników';
          }
        }, 280);
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', () => {
        let display = localFilter
          ? GRYHTML_GAMES.filterByQuery(allGames, localFilter)
          : allGames;
        display = GRYHTML_GAMES.sortGames(display, sortSelect.value);
        GRYHTML_GAMES.renderGames(resultsEl, display, { showEmpty: true });
      });
    }

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        page += 1;
        load(false);
      });
    }

    load(true);
  }

  // Home page sections
  async function initHomeSections() {
    const popular = document.querySelector('[data-section="popular"]');
    const newest = document.querySelector('[data-section="newest"]');
    const adventure = document.querySelector('[data-section="adventure"]');
    const action = document.querySelector('[data-section="action"]');
    const mobile = document.querySelector('[data-section="mobile"]');
    const recent = document.querySelector('[data-section="recent"]');

    if (!popular && !newest) return;

    try {
      const games = await GRYHTML_API.fetchGames({ page: 1, num: 50 });
      if (popular) {
        GRYHTML_GAMES.renderGames(popular, games.slice(0, 8));
      }
      if (newest) {
        GRYHTML_GAMES.renderGames(newest, games.slice(8, 16));
      }
      if (adventure) {
        const adv = GRYHTML_GAMES.filterByCategory(games, 'Adventure').slice(0, 8);
        GRYHTML_GAMES.renderGames(adventure, adv.length ? adv : games.slice(0, 8));
      }
      if (action) {
        const act = GRYHTML_GAMES.filterByCategory(games, 'Action').slice(0, 8);
        GRYHTML_GAMES.renderGames(action, act.length ? act : games.slice(4, 12));
      }
    } catch (e) {
      console.warn('Home load error', e);
      [popular, newest, adventure, action].forEach(el => {
        if (el) GRYHTML_GAMES.renderGames(el, [], {
          showEmpty: true,
          emptyTitle: 'Nie udało się załadować gier',
          emptyText: 'Sprawdź połączenie z internetem.'
        });
      });
    }

    if (mobile) {
      try {
        const mob = await GRYHTML_API.fetchMobileGames(1, 12);
        GRYHTML_GAMES.renderGames(mobile, mob.slice(0, 8));
      } catch {
        GRYHTML_GAMES.renderGames(mobile, [], { showEmpty: true, emptyTitle: 'Brak gier mobilnych' });
      }
    }

    if (recent) {
      const list = GRYHTML_FAV.getRecent();
      if (list.length) {
        GRYHTML_GAMES.renderGames(recent, list);
      } else {
        recent.closest('section')?.classList.add('is-empty-section');
        recent.innerHTML = '<p class="empty-hint">Tu pojawią się gry, w które ostatnio grałeś.</p>';
      }
    }
  }

  function boot() {
    if (document.querySelector('[data-category-results]')) {
      initCategoryPage();
    }
    if (document.querySelector('[data-section]')) {
      initHomeSections();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
