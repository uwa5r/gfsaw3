/**
 * GRYHTML - Game cards, rendering, helpers
 */
(function (global) {
  'use strict';

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function createPlaceholderThumb() {
    return 'data:image/svg+xml,' + encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect fill="#22252C" width="400" height="300"/>
        <text x="200" y="155" text-anchor="middle" fill="#A5A9B2" font-family="system-ui,sans-serif" font-size="18">GRYHTML</text>
      </svg>`
    );
  }

  /**
   * Create a game card element
   */
  function createGameCard(game, options = {}) {
    if (!game || !game.id) return null;
    const card = document.createElement('article');
    card.className = 'game-card';
    card.setAttribute('data-id', game.id);
    card.setAttribute('role', 'listitem');

    const link = document.createElement('a');
    link.className = 'game-card__link';
    link.href = `gra.html?idgry=${encodeURIComponent(game.id)}`;
    link.setAttribute('aria-label', `Graj w ${game.title}`);

    const media = document.createElement('div');
    media.className = 'game-card__media';

    const img = document.createElement('img');
    img.className = 'game-card__thumb';
    img.alt = game.title || 'Miniatura gry';
    img.loading = options.eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.src = game.thumb || createPlaceholderThumb();
    img.onerror = function () {
      this.onerror = null;
      this.src = createPlaceholderThumb();
    };

    media.appendChild(img);

    const playOverlay = document.createElement('div');
    playOverlay.className = 'game-card__play';
    playOverlay.innerHTML = '<span class="game-card__play-btn" aria-hidden="true">▶</span><span>Graj</span>';
    media.appendChild(playOverlay);

    link.appendChild(media);

    const body = document.createElement('div');
    body.className = 'game-card__body';

    const title = document.createElement('h3');
    title.className = 'game-card__title';
    title.textContent = game.title || 'Bez tytułu';
    body.appendChild(title);

    if (game.category) {
      const cat = document.createElement('span');
      cat.className = 'game-card__cat';
      cat.textContent = game.category;
      body.appendChild(cat);
    }

    link.appendChild(body);
    card.appendChild(link);

    // Favorite button
    const favBtn = document.createElement('button');
    favBtn.type = 'button';
    favBtn.className = 'game-card__fav';
    favBtn.setAttribute('aria-label', 'Dodaj do ulubionych');
    favBtn.setAttribute('title', 'Ulubione');
    const isFav = GRYHTML_FAV.isFavorite(game.id);
    favBtn.classList.toggle('is-active', isFav);
    favBtn.innerHTML = isFav
      ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';

    favBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const nowFav = GRYHTML_FAV.toggleFavorite(game);
      favBtn.classList.toggle('is-active', nowFav);
      favBtn.setAttribute('aria-label', nowFav ? 'Usuń z ulubionych' : 'Dodaj do ulubionych');
      favBtn.innerHTML = nowFav
        ? '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
        : '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
    });

    card.appendChild(favBtn);
    return card;
  }

  /**
   * Render list of games into container
   */
  function renderGames(container, games, options = {}) {
    if (!container) return;
    if (options.clear !== false) container.innerHTML = '';
    if (!games || games.length === 0) {
      if (options.showEmpty) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.setAttribute('role', 'status');
        empty.innerHTML = `
          <p class="empty-state__title">${escapeHtml(options.emptyTitle || 'Brak gier')}</p>
          <p class="empty-state__text">${escapeHtml(options.emptyText || 'Nie znaleziono gier spełniających kryteria.')}</p>
        `;
        container.appendChild(empty);
      }
      return;
    }
    const frag = document.createDocumentFragment();
    games.forEach((g, i) => {
      const card = createGameCard(g, { eager: i < 6 });
      if (card) frag.appendChild(card);
    });
    container.appendChild(frag);
  }

  /**
   * Skeleton loaders
   */
  function showSkeletons(container, count = 8) {
    if (!container) return;
    container.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const sk = document.createElement('div');
      sk.className = 'game-card game-card--skeleton';
      sk.setAttribute('aria-hidden', 'true');
      sk.innerHTML = `
        <div class="game-card__media skeleton-pulse"></div>
        <div class="game-card__body">
          <div class="skeleton-line skeleton-pulse" style="width:80%"></div>
          <div class="skeleton-line skeleton-pulse" style="width:40%;margin-top:8px"></div>
        </div>
      `;
      frag.appendChild(sk);
    }
    container.appendChild(frag);
  }

  function filterByCategory(games, categoryName) {
    if (!categoryName) return games;
    const lower = categoryName.toLowerCase();
    return games.filter(g =>
      (g.category && g.category.toLowerCase().includes(lower)) ||
      (g.tags && g.tags.some(t => t.toLowerCase().includes(lower)))
    );
  }

  function filterByQuery(games, query) {
    if (!query) return games;
    const q = query.toLowerCase().trim();
    return games.filter(g => {
      const title = (g.title || '').toLowerCase();
      const desc = (g.description || '').toLowerCase();
      const cat = (g.category || '').toLowerCase();
      const tags = (g.tags || []).join(' ').toLowerCase();
      return title.includes(q) || desc.includes(q) || cat.includes(q) || tags.includes(q);
    });
  }

  function sortGames(games, mode) {
    const list = [...games];
    if (mode === 'title-asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'pl'));
    } else if (mode === 'title-desc') {
      list.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'pl'));
    }
    // default: keep API order
    return list;
  }

  global.GRYHTML_GAMES = {
    createGameCard,
    renderGames,
    showSkeletons,
    filterByCategory,
    filterByQuery,
    sortGames,
    escapeHtml,
    createPlaceholderThumb
  };
})(typeof window !== 'undefined' ? window : globalThis);
