/**
 * GRYHTML - Game player page logic
 */
(function () {
  'use strict';

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function qs(sel) { return document.querySelector(sel); }

  async function initPlayer() {
    const id = getParam('idgry');
    const titleEl = qs('[data-game-title]');
    const descEl = qs('[data-game-desc]');
    const instrEl = qs('[data-game-instr]');
    const catEl = qs('[data-game-cat]');
    const tagsEl = qs('[data-game-tags]');
    const frameWrap = qs('[data-player-wrap]');
    const iframe = qs('[data-player-iframe]');
    const loadBtn = qs('[data-play-btn]');
    const loadingEl = qs('[data-player-loading]');
    const errorEl = qs('[data-player-error]');
    const favBtn = qs('[data-fav-btn]');
    const refreshBtn = qs('[data-refresh-btn]');
    const fullscreenBtn = qs('[data-fullscreen-btn]');
    const similarEl = qs('[data-similar]');

    if (!id) {
      showError('Brak identyfikatora gry. Wróć do katalogu i wybierz grę.');
      if (titleEl) titleEl.textContent = 'Gra nie znaleziona';
      return;
    }

    // Validate id
    if (!/^[0-9a-zA-Z_-]+$/.test(id)) {
      showError('Nieprawidłowy identyfikator gry.');
      return;
    }

    if (loadingEl) loadingEl.hidden = false;
    if (errorEl) errorEl.hidden = true;

    let game = null;
    try {
      game = await GRYHTML_API.getGameById(id);
    } catch (e) {
      console.warn(e);
    }

    if (!game) {
      // try search in favorites / recent
      const fav = GRYHTML_FAV.getFavorites().find(g => String(g.id) === String(id));
      if (fav) {
        game = { ...fav, description: '', instructions: '', tags: [], width: 800, height: 600 };
      }
    }

    if (!game) {
      showError('Nie znaleziono gry o podanym identyfikatorze. Mogła zostać usunięta lub identyfikator jest błędny.');
      if (titleEl) titleEl.textContent = 'Gra nie znaleziona';
      document.title = 'Gra nie znaleziona – GRYHTML';
      return;
    }

    // Fill meta
    if (titleEl) titleEl.textContent = game.title;
    document.title = `${game.title} – GRYHTML`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', (game.description || game.title).slice(0, 160));

    if (descEl) descEl.textContent = game.description || 'Brak opisu.';
    if (instrEl) instrEl.textContent = game.instructions || 'Brak instrukcji. Sterowanie zazwyczaj klawiaturą lub dotykiem.';
    if (catEl) catEl.textContent = game.category || '—';
    if (tagsEl) {
      tagsEl.innerHTML = '';
      (game.tags || []).forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = t;
        tagsEl.appendChild(span);
      });
    }

    // Favorites
    if (favBtn) {
      const updateFavUI = () => {
        const active = GRYHTML_FAV.isFavorite(game.id);
        favBtn.classList.toggle('is-active', active);
        favBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
        favBtn.textContent = active ? '♥ W ulubionych' : '♡ Dodaj do ulubionych';
      };
      updateFavUI();
      favBtn.addEventListener('click', () => {
        GRYHTML_FAV.toggleFavorite(game);
        updateFavUI();
      });
    }

    // Recent
    GRYHTML_FAV.addRecent(game);

    // Player
    const playerUrl = game.url;
    if (!playerUrl || !GRYHTML_API.isAllowedPlayerUrl(playerUrl)) {
      showError('Ta gra nie ma dostępnego adresu odtwarzacza lub adres jest nieobsługiwany.');
      if (loadingEl) loadingEl.hidden = true;
      return;
    }

    function startGame() {
      if (loadingEl) loadingEl.hidden = false;
      if (errorEl) errorEl.hidden = true;
      if (iframe) {
        iframe.src = playerUrl;
        iframe.setAttribute('allow', 'autoplay; fullscreen; gamepad; accelerometer; gyroscope');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('loading', 'eager');
        iframe.title = game.title;
        iframe.onload = () => {
          if (loadingEl) loadingEl.hidden = true;
        };
        iframe.onerror = () => {
          showError('Nie udało się załadować gry. Dostawca może blokować osadzanie w iframe.');
        };
      }
      if (loadBtn) loadBtn.hidden = true;
      if (frameWrap) frameWrap.classList.add('is-playing');
    }

    if (loadBtn) {
      loadBtn.addEventListener('click', startGame);
      // Auto-start after short delay for better UX (user can still click)
      // Actually prefer explicit click for better control & ads policy
    } else {
      startGame();
    }

    // Some pages auto-start; we keep button visible until click for safety
    if (loadBtn && !loadBtn.hidden) {
      // optional auto after 300ms if preferred – keep manual
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        if (iframe && iframe.src) {
          if (loadingEl) loadingEl.hidden = false;
          iframe.src = playerUrl;
        } else {
          startGame();
        }
      });
    }

    if (fullscreenBtn && frameWrap) {
      fullscreenBtn.addEventListener('click', () => {
        const el = frameWrap;
        if (!document.fullscreenElement) {
          (el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen)?.call(el);
        } else {
          (document.exitFullscreen || document.webkitExitFullscreen)?.call(document);
        }
      });
    }

    // Aspect ratio
    if (frameWrap && game.width && game.height) {
      const ratio = (game.height / game.width) * 100;
      frameWrap.style.setProperty('--player-ratio', `${Math.min(Math.max(ratio, 40), 75)}%`);
    }

    // Similar games
    if (similarEl) {
      loadSimilar(game, similarEl);
    }

    if (loadingEl) loadingEl.hidden = true;

    function showError(msg) {
      if (loadingEl) loadingEl.hidden = true;
      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent = msg;
      }
    }
  }

  async function loadSimilar(game, container) {
    GRYHTML_GAMES.showSkeletons(container, 4);
    try {
      let list = [];
      if (game.category) {
        list = await GRYHTML_API.fetchGames({ page: 1, num: 20 });
        list = GRYHTML_GAMES.filterByCategory(list, game.category)
          .filter(g => g.id !== game.id)
          .slice(0, 8);
      }
      if (list.length < 4) {
        const more = await GRYHTML_API.fetchGames({ page: 1, num: 30 });
        const ids = new Set(list.map(g => g.id));
        more.forEach(g => {
          if (g.id !== game.id && !ids.has(g.id) && list.length < 8) {
            list.push(g);
            ids.add(g.id);
          }
        });
      }
      GRYHTML_GAMES.renderGames(container, list, { showEmpty: true, emptyTitle: 'Brak podobnych gier' });
    } catch {
      GRYHTML_GAMES.renderGames(container, [], { showEmpty: true, emptyTitle: 'Nie udało się załadować podobnych gier' });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPlayer);
  } else {
    initPlayer();
  }
})();
